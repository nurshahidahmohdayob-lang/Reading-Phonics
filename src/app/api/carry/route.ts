/* Carrying a teacher's saved-in-the-browser records (guided-reading log,
   added students, locks, parent emails, sent ticks…) from the old address,
   reading-phonics.vercel.app, to readingpals.vercel.app. A browser keeps each
   address's storage apart, so the old copy is uploaded here and the new
   address pulls it in (see components/CarryOver.tsx).

   One copy per device, filed under the signed-in teacher:
     carry:list:<email>       device ids
     carry:<email>:<device>   { at, data }

   POST { device, data }   upload this device's copy (replaces its last one)
   GET                     every copy, for merging */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { kvConfigured, kvGetJson, kvLPush, kvLRange, kvLRem, kvSetJson } from "@/lib/kv";

type Copy = { at: string; data: Record<string, string> };

const MAX_CHARS = 8_000_000;

async function teacher(): Promise<string | null> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value)?.email?.toLowerCase() ?? null;
}

export async function POST(req: Request) {
  if (!kvConfigured()) return NextResponse.json({ ok: false, configured: false });
  const me = await teacher();
  if (!me) return NextResponse.json({ ok: false, error: "signed-out" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_CHARS) return NextResponse.json({ ok: false, error: "too big" }, { status: 413 });
  let body: { device?: unknown; data?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  const device = typeof body.device === "string" ? body.device : "";
  if (!/^[a-z0-9]{8,32}$/.test(device) || !body.data || typeof body.data !== "object")
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });

  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.data as Record<string, unknown>))
    if (typeof v === "string") data[k] = v;

  const at = new Date().toISOString();
  await kvSetJson(`carry:${me}:${device}`, { at, data } satisfies Copy);
  await kvLRem(`carry:list:${me}`, device);
  await kvLPush(`carry:list:${me}`, device);
  return NextResponse.json({ ok: true, at });
}

export async function GET() {
  if (!kvConfigured()) return NextResponse.json({ ok: false, configured: false });
  const me = await teacher();
  if (!me) return NextResponse.json({ ok: false, error: "signed-out" }, { status: 401 });

  const devices = await kvLRange(`carry:list:${me}`);
  const copies: (Copy & { device: string })[] = [];
  for (const device of devices) {
    const c = await kvGetJson<Copy>(`carry:${me}:${device}`);
    if (c) copies.push({ device, ...c });
  }
  return NextResponse.json({ ok: true, copies });
}
