/* Short links to one child's report — reading-phonics.vercel.app/r/k7f2q9abcd.

   The self-contained report links (lib/reportLink.ts) carry the whole report
   and run to ~1,000 characters. That's fine in an email, but Word mail merge
   cuts a field off at 255 characters, so the merge file needs short links.
   These store the report in the app's cloud storage (lib/kv.ts) under an
   unguessable ten-character id, and /r/[id] shows it.

   Server-only. Needs the cloud storage connected; without it,
   shortLinksReady() is false and callers fall back to the long links. */

import { randomBytes } from "crypto";
import { kvConfigured, kvGetJson, kvSetJson } from "./kv";
import type { ReportData } from "./reportPrint";

const PREFIX = "report-link:";
// 32 characters, no look-alikes (l/1, o/0) — and 256 is a multiple of 32, so
// every character is equally likely.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const ID = /^[a-z2-9]{10}$/;

export function shortLinksReady(): boolean {
  return kvConfigured();
}

function newId(): string {
  let id = "";
  for (const b of randomBytes(10)) id += ALPHABET[b % ALPHABET.length];
  return id;
}

/** Store a report and return its id. */
export async function saveReportLink(report: ReportData): Promise<string> {
  const id = newId();
  await kvSetJson(PREFIX + id, { report, createdAt: new Date().toISOString() });
  return id;
}

/** The report behind an id, or null if there isn't one. */
export async function loadReportLink(id: string): Promise<ReportData | null> {
  if (!ID.test(id)) return null;
  const rec = await kvGetJson<{ report: ReportData }>(PREFIX + id);
  return rec?.report ?? null;
}
