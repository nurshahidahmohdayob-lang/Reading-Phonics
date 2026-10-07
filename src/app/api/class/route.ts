/* Assignments, the children's side. No sign-in: the class code from the
   class link is the permission (lib/assignments.ts).

   GET  ?code=…            the class's names, their assignments, who's done what
   GET  ?code=…&id=…       one assignment's lesson (or link)
   POST { code, id, name, answers, score, text, images, note }   submit */

import { NextResponse } from "next/server";
import {
  assignedNames,
  assignmentsReady,
  classItems,
  cleanSubmission,
  doneMarks,
  getClass,
  getHtml,
  getItem,
  isItemId,
  MAX_SUBMISSION_CHARS,
  nameKey,
  submit,
} from "@/lib/assignments";

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET(req: Request) {
  if (!assignmentsReady()) return NextResponse.json({ ok: false, configured: false });
  const q = new URL(req.url).searchParams;
  const cls = await getClass(q.get("code") ?? "");
  if (!cls) return bad("This class link doesn't work any more — ask your teacher for a new one.", 404);

  const id = q.get("id");
  if (id) {
    const a = isItemId(id) ? await getItem(id) : null;
    if (!a || a.owner !== cls.owner || a.yearKey !== cls.yearKey) return bad("not found", 404);
    return NextResponse.json({
      ok: true,
      item: { id: a.id, title: a.title, kind: a.kind, url: a.url },
      html: a.kind === "html" ? await getHtml(a.id) : undefined,
    });
  }

  const items = await classItems(cls.owner, cls.yearKey);
  const done = await doneMarks(items, cls);
  return NextResponse.json({
    ok: true,
    className: cls.className,
    names: cls.names,
    items: items.map((a) => ({ id: a.id, title: a.title, kind: a.kind, for: assignedNames(a, cls) })),
    // Only who's done what — never their answers.
    done: Object.fromEntries(Object.entries(done).map(([id, m]) => [id, Object.keys(m)])),
  });
}

export async function POST(req: Request) {
  if (!assignmentsReady()) return NextResponse.json({ ok: false, configured: false });
  const raw = await req.text();
  if (raw.length > MAX_SUBMISSION_CHARS) return bad("That's too much to send. Try again without the drawing.", 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("bad request");
  }
  const cls = await getClass(String(body.code ?? ""));
  if (!cls) return bad("This class link doesn't work any more.", 404);
  const a = isItemId(body.id) ? await getItem(body.id) : null;
  if (!a || a.owner !== cls.owner || a.yearKey !== cls.yearKey) return bad("not found", 404);
  const name = typeof body.name === "string" ? body.name : "";
  const theirs = assignedNames(a, cls).find((n) => nameKey(n) === nameKey(name));
  if (!theirs) return bad("This activity isn't set for that name.", 403);
  const mark = await submit(a.id, theirs, cleanSubmission(body));
  return NextResponse.json({ ok: true, done: mark });
}
