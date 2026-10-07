/* Assignments, the teacher's side. Signed-in staff only; everything is filed
   under the signed-in teacher, so each sees only their own.

   POST { op: "class", yearKey, className, names, levels }
                                                     open a class: its link, its
                                                     assignments, who's done them,
                                                     and each child's reading
   POST { op: "clearReading", yearKey, name }        let a child redo today's reading
   POST { op: "create", yearKey, title, kind, html | url, assignees }
   POST { op: "delete", id }
   POST { op: "clear", id, name }                    let a child do it again
   GET  ?id=…&name=…                                 one child's submission
   GET  ?reading=<yearKey>&name=…                    one child's reading submission
   GET  ?history=<yearKey>&name=…                    every story a child has submitted
   GET  ?history=<yearKey>&name=…&entry=…            the work for one of them */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import {
  assignmentsReady,
  assignedNames,
  classCodeFor,
  classFor,
  classItems,
  cleanUrl,
  clearReading,
  clearSubmission,
  createAssignment,
  deleteAssignment,
  doneMarks,
  getClass,
  getItem,
  getReadingSubmission,
  historySubmission,
  readingHistory,
  getSubmission,
  isItemId,
  MAX_HTML_CHARS,
  openClass,
  readingMarks,
  readToday,
  storyTitle,
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
    const levels: Record<string, number> = {};
    if (body.levels && typeof body.levels === "object") {
      for (const [n, v] of Object.entries(body.levels as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) levels[n] = v;
      }
    }
    const code = await openClass(me, yearKey, String(body.className ?? yearKey), names, levels);
    const cls = (await getClass(code))!;
    const items = await classItems(me, yearKey);
    const done = await doneMarks(items, cls);
    const reads = await readingMarks(code, cls.names);
    const reading = Object.fromEntries(
      Object.entries(reads).map(([n, r]) => [n, { story: storyTitle(r), done: readToday(r) ? r.done : undefined }]),
    );
    return NextResponse.json({ ok: true, code, names: cls.names, items, done, reading });
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

  if (body.op === "clearReading") {
    const code = await classCodeFor(me, yearKey);
    if (!code || typeof body.name !== "string") return bad("not found", 404);
    await clearReading(code, body.name);
    return NextResponse.json({ ok: true });
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
  const historyYear = q.get("history");
  if (historyYear) {
    const code = await classCodeFor(me, historyYear.slice(0, 20));
    const name = q.get("name") ?? "";
    if (!code || !name) return bad("not found", 404);
    const entry = q.get("entry");
    if (entry) return NextResponse.json({ ok: true, submission: await historySubmission(code, name, entry) });
    return NextResponse.json({ ok: true, history: await readingHistory(code, name) });
  }
  const readingYear = q.get("reading");
  if (readingYear) {
    const code = await classCodeFor(me, readingYear.slice(0, 20));
    const name = q.get("name") ?? "";
    if (!code || !name) return bad("not found", 404);
    return NextResponse.json({ ok: true, submission: await getReadingSubmission(code, name) });
  }
  const id = q.get("id") ?? "";
  const name = q.get("name") ?? "";
  const a = isItemId(id) ? await getItem(id) : null;
  if (!a || a.owner !== me || !name) return bad("not found", 404);
  const sub = await getSubmission(a.id, name);
  return NextResponse.json({ ok: true, submission: sub });
}
