/* Colouring pages sent in by children. Signed-in staff only: the child
   colours on the teacher's signed-in device, so their work is filed under
   that teacher, and each teacher sees only their own.

   POST { op: "submit", storyId, title, name, image }   send a finished page
   POST { op: "submit", code, … }                       the same from a shared
                                                        link, no sign-in: the
                                                        code says whose it is
   POST { op: "link", storyId }                         this teacher's share code;
                                                        also points /color at
                                                        this story for them
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
  ownerForCode,
  shareCodeFor,
  setCurrentColouring,
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
  if (!colouringReady()) return NextResponse.json({ ok: false, configured: false });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("bad request");
  }

  // A child on a shared link: the code stands in for the teacher's sign-in.
  const shared = body.op === "submit" && typeof body.code === "string";
  const me = shared ? await ownerForCode(body.code as string) : await teacher();
  if (!me) return bad(shared ? "bad link" : "signed-out", shared ? 404 : 401);

  if (body.op === "link") {
    const storyId = text(body.storyId, 20);
    const code = await shareCodeFor(me);
    const easy = /^y\d-\d\d$/.test(storyId);
    if (easy) await setCurrentColouring(me, storyId);
    return NextResponse.json({ ok: true, code, easy });
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
