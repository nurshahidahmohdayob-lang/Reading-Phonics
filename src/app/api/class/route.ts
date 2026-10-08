/* Assignments, the children's side. No sign-in: the class code from the
   class link is the permission (lib/assignments.ts).

   GET  ?code=…            the class's names, their assignments, who's done what
   GET  ?code=…&id=…       one assignment's lesson (or link)
   GET  ?code=…&reader=…   that child's own reading: a story at their level
   POST { code, id, name, answers, score, text, images, note }   submit
   POST { code, reading: true, name, answers, score, text }      submit the reading */

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
  readingFor,
  readingMarks,
  doneThisSession,
  submitReading,
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

  const code = q.get("code")!;
  const reader = q.get("reader");
  if (reader !== null) {
    const name = cls.names.find((n) => nameKey(n) === nameKey(reader));
    if (!name) return bad("That name isn't on this class.", 404);
    const r = await readingFor(code, cls, name);
    if (!r) return bad("No stories for this level yet.", 404);
    return NextResponse.json({
      ok: true,
      reading: { storyId: r.storyId, levelId: r.levelId, tier: r.tier, done: doneThisSession(r, cls.yearKey), session: r.session },
    });
  }

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
  const reads = await readingMarks(code, cls.names);
  return NextResponse.json({
    ok: true,
    className: cls.className,
    names: cls.names,
    items: items.map((a) => ({ id: a.id, title: a.title, kind: a.kind, for: assignedNames(a, cls) })),
    // Only who's done what — never their answers.
    done: Object.fromEntries(Object.entries(done).map(([id, m]) => [id, Object.keys(m)])),
    read: cls.names.filter((n) => doneThisSession(reads[n], cls.yearKey)),
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
  const code = String(body.code ?? "");
  const cls = await getClass(code);
  if (!cls) return bad("This class link doesn't work any more.", 404);
  if (body.reading === true) {
    const name = cls.names.find((n) => nameKey(n) === nameKey(String(body.name ?? "")));
    if (!name) return bad("That name isn't on this class.", 403);
    const mark = await submitReading(code, name, cleanSubmission(body));
    return mark ? NextResponse.json({ ok: true, done: mark }) : bad("Open your story first.", 409);
  }
  const a = isItemId(body.id) ? await getItem(body.id) : null;
  if (!a || a.owner !== cls.owner || a.yearKey !== cls.yearKey) return bad("not found", 404);
  const name = typeof body.name === "string" ? body.name : "";
  const theirs = assignedNames(a, cls).find((n) => nameKey(n) === nameKey(name));
  if (!theirs) return bad("This activity isn't set for that name.", 403);
  const mark = await submit(a.id, theirs, cleanSubmission(body));
  return NextResponse.json({ ok: true, done: mark });
}
