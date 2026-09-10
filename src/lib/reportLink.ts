"use client";

/* Shareable links to a single child's reading report.

   The whole report is packed into the link itself (compressed, after the
   "#"), so:
     - the link opens that one child's report and nothing else,
     - nothing is stored on a server, and the data after "#" never leaves the
       reader's browser — it isn't sent with the request or written to any log,
     - it keeps working with no sign-in, on any device, forever.

   Parents open it in a browser and can print it or save it as a PDF from
   there. See app/report/page.tsx for the other end. */

import type { ReportData } from "./reportPrint";

/** Where parents should land. Local dev / phonics.test still hand out links to
    the live site, otherwise the parent's link would be unreachable. */
const PUBLIC_SITE =
  process.env.NEXT_PUBLIC_SITE_URL || "https://reading-phonics.vercel.app";

function siteBase(): string {
  if (typeof window === "undefined") return PUBLIC_SITE;
  const here = window.location.origin;
  // A real, public host (not localhost / *.test) can link to itself.
  const local = /^(https?:\/\/)?(localhost|127\.|.*\.test(:|$))/i.test(here);
  return local ? PUBLIC_SITE : here;
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  const cs = new CompressionStream("gzip");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Pack a report into the hash payload: "g.<data>" gzipped, "p.<data>" plain. */
export async function encodeReport(d: ReportData): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(d));
  const zipped = await gzip(raw);
  return zipped ? `g.${toBase64Url(zipped)}` : `p.${toBase64Url(raw)}`;
}

/** Unpack a hash payload. Returns null if it isn't a report we can read. */
export async function decodeReport(hash: string): Promise<ReportData | null> {
  try {
    const payload = hash.replace(/^#/, "");
    const dot = payload.indexOf(".");
    if (dot < 0) return null;
    const kind = payload.slice(0, dot);
    const bytes = fromBase64Url(payload.slice(dot + 1));
    const raw = kind === "g" ? await gunzip(bytes) : bytes;
    const parsed = JSON.parse(new TextDecoder().decode(raw)) as ReportData;
    return parsed && typeof parsed.studentName === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** The full link to give a parent. */
export async function reportLink(d: ReportData): Promise<string> {
  return `${siteBase()}/report#${await encodeReport(d)}`;
}
