/* Assignments, the teacher's side. Signed-in staff only; everything is filed
   under the signed-in teacher, so each sees only their own.

   POST { op: "class", yearKey, className, names }  open a class: its link, its
                                                     assignments, who's done them
   POST { op: "create", yearKey, title, kind, html | url, assignees }
   POST { op: "delete", id }
   POST { op: "clear", id, name }                    let a child do it again
   GET  ?id=…&name=…                                 one child's submission */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import {
  assignmentsReady,
  assignedNames,
  classFor,
  classItems,
  cleanUrl,
  clearSubmission,
  createAssignment,
  deleteAssignment,
  doneMarks,
  getClass,
  getItem,
  getSubmission,
  isItemId,
  MAX_HTML_CHARS,
  openClass,
} from "@/lib/assignments";

async function teacher(): Promise<string | null> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value)?.email?.toLowerCase() ?? null;
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const me = await teacher();
  if (!me) return bad("signed-out", 401);
  if (!assignmentsReady()) return NextResponse.json({ ok: false, configured: false });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("bad request");
  }
  const yearKey = typeof body.yearKey === "string" ? body.yearKey.slice(0, 20) : "";

  if (body.op === "class") {
    if (!yearKey) return bad("bad request");
    const names = Array.isArray(body.names) ? body.names.filter((n): n is string => typeof n === "string") : [];
    const code = await openClass(me, yearKey, String(body.className ?? yearKey), names);
    const cls = (await getClass(code))!;
    const items = await classItems(me, yearKey);
    const done = await doneMarks(items, cls);
    return NextResponse.json({ ok: true, code, names: cls.names, items, done });
  }

  if (body.op === "create") {
    const kind = body.kind === "link" ? "link" : body.kind === "html" ? "html" : null;
    if (!yearKey || !kind) return bad("bad request");
    const assignees =
      body.assignees === "all"
        ? "all"
        : Array.isArray(body.assignees)
          ? body.assignees.filter((n): n is string => typeof n === "string")
          : null;
    if (!assignees || (assignees !== "all" && assignees.length === 0)) return bad("Choose who it's for.");
    if (kind === "html") {
      const html = typeof body.html === "string" ? body.html : "";
      if (!html.trim()) return bad("Add the lesson's HTML.");
      if (html.length > MAX_HTML_CHARS) return bad("That lesson is too big to store — under 900 KB, please.");
      const a = await createAssignment(me, { yearKey, title: String(body.title ?? ""), kind, html, assignees });
      return NextResponse.json({ ok: true, item: a });
    }
    const url = cleanUrl(body.url);
    if (!url) return bad("That doesn't look like a web link.");
    const a = await createAssignment(me, { yearKey, title: String(body.title ?? ""), kind, url, assignees });
    return NextResponse.json({ ok: true, item: a });
  }

  if (body.op === "delete" || body.op === "clear") {
    if (!isItemId(body.id)) return bad("bad request");
    const a = await getItem(body.id);
    if (!a || a.owner !== me) return bad("not found", 404);
    if (body.op === "clear") {
      if (typeof body.name !== "string") return bad("bad request");
      await clearSubmission(a.id, body.name);
      return NextResponse.json({ ok: true });
    }
    const cls = await classFor(me, a.yearKey);
    await deleteAssignment(me, a.id, cls ? assignedNames(a, cls) : []);
    return NextResponse.json({ ok: true });
  }

  return bad("bad request");
}

export async function GET(req: Request) {
  const me = await teacher();
  if (!me) return bad("signed-out", 401);
  if (!assignmentsReady()) return NextResponse.json({ ok: false, configured: false });
  const q = new URL(req.url).searchParams;
  const id = q.get("id") ?? "";
  const name = q.get("name") ?? "";
  const a = isItemId(id) ? await getItem(id) : null;
  if (!a || a.owner !== me || !name) return bad("not found", 404);
  const sub = await getSubmission(a.id, name);
  return NextResponse.json({ ok: true, submission: sub });
}
