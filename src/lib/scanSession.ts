/* Pairing a phone with the class screen.

   The screen asks for a code and shows it as a QR. The teacher scans it with
   their phone, which opens /scan#<code> — a page that photographs a drawing,
   cuts it off the paper and posts it here. The screen is polling, so the
   drawing appears on its stage a moment later.

   The code IS the permission: whoever holds it can post a drawing to that
   screen, and nothing else — it can't read anything, and it dies after
   fifteen minutes. Only a signed-in teacher can create one or collect what
   was sent. Server-side only. */

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

type Session = { createdAt: string; items: ScanItem[] };

export function scanReady(): boolean {
  return kvConfigured();
}

export function isScanCode(code: string): boolean {
  return CODE.test(code);
}

function key(code: string) {
  return PREFIX + code;
}

/** Start a pairing and return its code. */
export async function newScanSession(): Promise<string> {
  let code = "";
  for (const b of randomBytes(12)) code += ALPHABET[b % ALPHABET.length];
  const session: Session = { createdAt: new Date().toISOString(), items: [] };
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

/** Collect what the phone has sent, and clear it. null if the code has died. */
export async function drainScans(code: string): Promise<ScanItem[] | null> {
  if (!isScanCode(code)) return null;
  const session = await kvGetJson<Session>(key(code));
  if (!session) return null;
  if (session.items.length) {
    await kvSetJson(key(code), { ...session, items: [] }, TTL_SECONDS);
  }
  return session.items;
}
