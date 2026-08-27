/* Shared reading-assessment tracker, stored in a Redis-compatible KV so the
   data is the same on the live site, phonics.test, and every device.

   GET  -> the whole tracker store (auth required).
   POST -> save or delete one record (auth required); returns the updated store.

   If no KV is configured yet, both return { ok:false, configured:false } and
   the client keeps working from its own browser storage. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { kvConfigured, kvGetJson, kvSetJson } from "@/lib/kv";
import { studentKey } from "@/app/roster";

const KEY = "tracker:v1";

type Rec = {
  student: string;
  year: string;
  yearKey: string;
  term: number;
  savedAt: string;
  report: unknown;
};
type Store = Record<string, Record<string, Rec>>;
type Body =
  | { op: "save"; record: Rec }
  | { op: "delete"; yearKey: string; name: string; term: number }
  | { op: "merge"; store: Store };

/** Fold `incoming` into `base` (union); on a clash keep the newer savedAt. */
function mergeInto(base: Store, incoming: Store) {
  for (const k of Object.keys(incoming)) {
    base[k] = base[k] ?? {};
    for (const term of Object.keys(incoming[k])) {
      const ex = base[k][term];
      const nw = incoming[k][term];
      if (nw && (!ex || (nw.savedAt ?? "") >= (ex.savedAt ?? ""))) base[k][term] = nw;
    }
  }
}

async function signedIn(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value) !== null;
}

export async function GET() {
  if (!(await signedIn()))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!kvConfigured()) return NextResponse.json({ ok: false, configured: false });
  const store = (await kvGetJson<Store>(KEY)) ?? {};
  return NextResponse.json({ ok: true, store });
}

export async function POST(req: Request) {
  if (!(await signedIn()))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!kvConfigured()) return NextResponse.json({ ok: false, configured: false });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const store = (await kvGetJson<Store>(KEY)) ?? {};

  if (body.op === "save" && body.record) {
    const rec = body.record;
    const k = studentKey(rec.yearKey, rec.student);
    store[k] = { ...(store[k] ?? {}), [rec.term]: rec };
  } else if (body.op === "delete") {
    const k = studentKey(body.yearKey, body.name);
    const entry = store[k];
    if (entry) {
      delete entry[body.term];
      if (Object.keys(entry).length === 0) delete store[k];
    }
  } else if (body.op === "merge" && body.store) {
    mergeInto(store, body.store);
  } else {
    return NextResponse.json({ ok: false, error: "unknown op" }, { status: 400 });
  }

  await kvSetJson(KEY, store);
  return NextResponse.json({ ok: true, store });
}
