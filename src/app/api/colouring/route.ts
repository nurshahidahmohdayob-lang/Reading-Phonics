/* Colouring pages sent in by children. Signed-in staff only: the child
   colours on the teacher's signed-in device, so their work is filed under
   that teacher, and each teacher sees only their own.

   POST { op: "submit", storyId, title, name, image }   send a finished page
   POST { op: "delete", id }                            remove one
   GET                                                  the list, newest first
   GET  ?id=…                                           one picture */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import {
  colouringImage,
  colouringReady,
  deleteColouring,
  isColouringId,
  listColouring,
  MAX_IMAGE_CHARS,
  submitColouring,
} from "@/lib/colouring";

async function teacher(): Promise<string | null> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value)?.email?.toLowerCase() ?? null;
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const me = await teacher();
  if (!me) return bad("signed-out", 401);
  if (!colouringReady()) return NextResponse.json({ ok: false, configured: false });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("bad request");
  }

  if (body.op === "submit") {
    const name = text(body.name, 60);
    const storyId = text(body.storyId, 20);
    const title = text(body.title, 120);
    const image = typeof body.image === "string" ? body.image : "";
    if (!name || !storyId || !image.startsWith("data:image/")) return bad("bad request");
    if (image.length > MAX_IMAGE_CHARS) return bad("too big", 413);
    const item = await submitColouring(me, { name, storyId, title }, image);
    return NextResponse.json({ ok: true, item });
  }

  if (body.op === "delete") {
    const id = text(body.id, 20);
    if (!isColouringId(id)) return bad("bad request");
    await deleteColouring(me, id);
    return NextResponse.json({ ok: true });
  }

  return bad("bad request");
}

export async function GET(req: Request) {
  const me = await teacher();
  if (!me) return bad("signed-out", 401);
  if (!colouringReady()) return NextResponse.json({ ok: false, configured: false });

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id) {
    if (!isColouringId(id)) return bad("bad request");
    const image = await colouringImage(me, id);
    return image ? NextResponse.json({ ok: true, image }) : bad("not found", 404);
  }
  return NextResponse.json({ ok: true, items: await listColouring(me) });
}
