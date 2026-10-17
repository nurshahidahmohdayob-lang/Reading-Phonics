/* Pairing a phone with the class screen.

   The screen asks for a code and shows it as a QR. The teacher scans it with
   their phone, which opens /scan#<code> — a page that photographs a drawing,
   cuts it off the paper and posts it here. The screen is polling, so the
   drawing appears on its stage a moment later.

   The code IS the permission: whoever holds it can post a drawing to that
   screen, and nothing else — it can't read anything, and it dies after
   fifteen minutes. Only whoever created it can collect what was sent: with
   several classes playing at once, one room's drawings must not land on
   another room's screen. A signed-in teacher's pairing is theirs; one made
   on the parents' page (no sign-in) belongs to a secret key handed only to
   the screen that asked for it. Server-side only. */

import { randomBytes } from "crypto";
import { kvConfigured, kvGetJson, kvSetJson } from "./kv";

const PREFIX = "scan:";
/** Long enough for a lesson, short enough that a photographed QR goes stale. */
const TTL_SECONDS = 15 * 60;
/** Plenty for one lesson's drawings, and a cap on what a stranger could add. */
const MAX_ITEMS = 12;
/** Characters of data URL. The phone shrinks pictures to well under this. */
export const MAX_UPLOAD_CHARS = 700_000;

// No look-alike characters: a code gets read off a screen.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE = /^[a-z2-9]{12}$/;

export type ScanItem = {
  dataUrl: string;
  width: number;
  height: number;
  at: string;
};

type Session = {
  createdAt: string;
  items: ScanItem[];
  /** The teacher whose screen this pairing belongs to, or "screen:<key>"
      for one made without signing in. */
  owner: string;
};

export function scanReady(): boolean {
  return kvConfigured();
}

export function isScanCode(code: string): boolean {
  return CODE.test(code);
}

function key(code: string) {
  return PREFIX + code;
}

/** A secret for a screen with nobody signed in: it alone collects. */
export function newScreenKey(): string {
  return randomBytes(18).toString("base64url");
}

/** Pairings started without signing in, per address per hour — enough for
    any family, a cap on anyone filling the store. */
const OPEN_PER_HOUR = 20;
export async function mayOpenPairing(ip: string): Promise<boolean> {
  const k = `scanopen:${ip}`;
  const n = (await kvGetJson<number>(k)) ?? 0;
  if (n >= OPEN_PER_HOUR) return false;
  await kvSetJson(k, n + 1, 60 * 60);
  return true;
}

/** Start a pairing, owned by the teacher who asked for it. */
export async function newScanSession(owner: string): Promise<string> {
  let code = "";
  for (const b of randomBytes(12)) code += ALPHABET[b % ALPHABET.length];
  const session: Session = {
    createdAt: new Date().toISOString(),
    items: [],
    owner,
  };
  await kvSetJson(key(code), session, TTL_SECONDS);
  return code;
}

/** Add a drawing sent from the phone. */
export async function addScan(
  code: string,
  item: ScanItem,
): Promise<"ok" | "gone" | "full"> {
  if (!isScanCode(code)) return "gone";
  const session = await kvGetJson<Session>(key(code));
  if (!session) return "gone";
  if (session.items.length >= MAX_ITEMS) return "full";
  session.items.push(item);
  // Keep the pairing alive while it's being used.
  await kvSetJson(key(code), session, TTL_SECONDS);
  return "ok";
}

/** Collect what the phone has sent, and clear it. null if the code has died,
    or if it belongs to another teacher's screen. */
export async function drainScans(
  code: string,
  owner: string,
): Promise<ScanItem[] | null> {
  if (!isScanCode(code)) return null;
  const session = await kvGetJson<Session>(key(code));
  if (!session) return null;
  // Pairings made before this had an owner: nobody can claim those.
  if (session.owner !== owner) return null;
  if (session.items.length) {
    await kvSetJson(key(code), { ...session, items: [] }, TTL_SECONDS);
  }
  return session.items;
}
