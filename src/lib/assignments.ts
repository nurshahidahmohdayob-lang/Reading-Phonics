/* Assignments: online lessons a teacher sets for a class, which children open
   from a class link, do, and submit. Server-side only.

   Kept in the KV store, filed under the teacher who made them:

     asg:owner:<email>         { classes: { y3: <code> }, items: [ids] }
     asg:class:<code>          the class link: whose it is, and the names on it
     asg:item:<id>             an assignment: title, kind, who it's for
     asg:html:<id>             the lesson itself (kept apart, so lists stay light)
     asg:done:<id>:<name>      a child has submitted: when, score, attempts
     asg:sub:<id>:<name>       what they submitted: answers, drawings, page text
     asg:read:<code>:<name>    the child's own reading: a story at their level
                               and its questions, set when they tap their name
     asg:readsub:<code>:<name> what they submitted for it
     asg:readhist:<code>:<name>         every story they've submitted, newest first
     asg:readhsub:<code>:<name>:<id>    the work for one of those

   One key per child per assignment, so two children pressing Submit at the
   same moment can't overwrite each other.

   The class code in the link is the permission, as with the phone-scan
   pairing: it opens that class's names and assignments, and lets a child
   submit — nothing else. Only the teacher who made it can see submissions. */

import { randomBytes } from "crypto";
import { passageLevels, levelForReader } from "@/app/passages";
import { assignmentStories, findAssignmentStory } from "@/app/assignmentStories";
import { worksheetTier, type Tier } from "./worksheet";
import { kvConfigured, kvDel, kvGetJson, kvMGetJson, kvSetJson } from "./kv";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE = /^[a-z2-9]{12}$/;
const ID = /^[a-z2-9]{10}$/;

export const MAX_HTML_CHARS = 900_000;
export const MAX_SUBMISSION_CHARS = 700_000;

export type Kind = "html" | "link";

export type ClassLink = {
  owner: string;
  yearKey: string;
  className: string;
  names: string[];
  /** Each child's reading level (Lexile), by nameKey, from their latest
      assessment — so their reading activity is pitched for them. */
  levels?: Record<string, number>;
  updatedAt: string;
};

export type Assignment = {
  id: string;
  owner: string;
  yearKey: string;
  title: string;
  kind: Kind;
  url?: string;
  /** Names it's for; "all" means the whole class, whoever is on it. */
  assignees: string[] | "all";
  createdAt: string;
};

export type Answer = { label: string; value: string };

export type Submission = {
  at: string;
  attempts: number;
  score?: { score: number; total: number };
  answers: Answer[];
  /** The lesson's visible text when submitted, so the teacher sees the result. */
  text: string;
  /** Drawings from the lesson, as small JPEGs. */
  images: string[];
  /** A note from the child (for a link, what they did). */
  note?: string;
};

export type DoneMark = { at: string; attempts: number; score?: { score: number; total: number } };

type OwnerIndex = { classes: Record<string, string>; items: string[] };

export function assignmentsReady(): boolean {
  return kvConfigured();
}

function rand(n: number): string {
  let s = "";
  for (const b of randomBytes(n)) s += ALPHABET[b % ALPHABET.length];
  return s;
}

export const isClassCode = (c: unknown): c is string => typeof c === "string" && CODE.test(c);
export const isItemId = (c: unknown): c is string => typeof c === "string" && ID.test(c);

/** A name as a key: case and spacing don't matter. */
export function nameKey(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, " ").trim());
}

const ownerKey = (email: string) => `asg:owner:${email.toLowerCase()}`;
const classKey = (code: string) => `asg:class:${code}`;
const itemKey = (id: string) => `asg:item:${id}`;
const htmlKey = (id: string) => `asg:html:${id}`;
const doneKey = (id: string, name: string) => `asg:done:${id}:${nameKey(name)}`;
const subKey = (id: string, name: string) => `asg:sub:${id}:${nameKey(name)}`;

async function ownerIndex(email: string): Promise<OwnerIndex> {
  return (await kvGetJson<OwnerIndex>(ownerKey(email))) ?? { classes: {}, items: [] };
}

/** The class link for this teacher and class, made on first use; its names
    are refreshed from the teacher's class list every time. */
export async function openClass(
  owner: string,
  yearKey: string,
  className: string,
  names: string[],
  levels: Record<string, number> = {},
): Promise<string> {
  const idx = await ownerIndex(owner);
  let code = idx.classes[yearKey];
  const before = code ? await kvGetJson<ClassLink>(classKey(code)) : null;
  if (!code || !before) {
    code = rand(12);
    idx.classes[yearKey] = code;
    await kvSetJson(ownerKey(owner), idx);
  }
  const clean = [...new Set(names.map((n) => n.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 80);
  await kvSetJson(classKey(code), {
    owner: owner.toLowerCase(),
    yearKey,
    className: className.slice(0, 40),
    names: clean,
    levels: Object.fromEntries(
      clean.flatMap((n) => {
        // A level not sent this time (the teacher's results still loading)
        // keeps the one saved before.
        const lex = levels[n] ?? before?.levels?.[nameKey(n)];
        return Number.isFinite(lex) ? [[nameKey(n), Math.round(lex!)]] : [];
      }),
    ),
    updatedAt: new Date().toISOString(),
  } satisfies ClassLink);
  return code;
}

/** The code of the class link this teacher already has for a class, if any. */
export async function classCodeFor(owner: string, yearKey: string): Promise<string | null> {
  return (await ownerIndex(owner)).classes[yearKey] ?? null;
}

/** The class link this teacher already has for a class, if any. */
export async function classFor(owner: string, yearKey: string): Promise<ClassLink | null> {
  const code = await classCodeFor(owner, yearKey);
  return code ? getClass(code) : null;
}

export async function getClass(code: string): Promise<ClassLink | null> {
  return isClassCode(code) ? kvGetJson<ClassLink>(classKey(code)) : null;
}

/** This teacher's assignments for one class, newest first. */
export async function classItems(owner: string, yearKey: string): Promise<Assignment[]> {
  const idx = await ownerIndex(owner);
  const items = await kvMGetJson<Assignment>(idx.items.map(itemKey));
  return items
    .filter((a): a is Assignment => !!a && a.yearKey === yearKey && a.owner === owner.toLowerCase())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function assignedNames(a: Assignment, cls: ClassLink): string[] {
  if (a.assignees === "all") return cls.names;
  const wanted = new Set(a.assignees.map(nameKey));
  return cls.names.filter((n) => wanted.has(nameKey(n)));
}

/** Who has submitted what: { itemId: { name: DoneMark } }. */
export async function doneMarks(
  items: Assignment[],
  cls: ClassLink,
): Promise<Record<string, Record<string, DoneMark>>> {
  const pairs = items.flatMap((a) => assignedNames(a, cls).map((n) => [a.id, n] as const));
  const marks = await kvMGetJson<DoneMark>(pairs.map(([id, n]) => doneKey(id, n)));
  const out: Record<string, Record<string, DoneMark>> = {};
  pairs.forEach(([id, n], i) => {
    out[id] ??= {};
    if (marks[i]) out[id][n] = marks[i]!;
  });
  return out;
}

export async function createAssignment(
  owner: string,
  input: { yearKey: string; title: string; kind: Kind; html?: string; url?: string; assignees: string[] | "all" },
): Promise<Assignment> {
  const a: Assignment = {
    id: rand(10),
    owner: owner.toLowerCase(),
    yearKey: input.yearKey,
    title: input.title.trim().slice(0, 120) || "Activity",
    kind: input.kind,
    url: input.kind === "link" ? input.url : undefined,
    assignees: input.assignees === "all" ? "all" : input.assignees.slice(0, 80),
    createdAt: new Date().toISOString(),
  };
  if (a.kind === "html") await kvSetJson(htmlKey(a.id), input.html ?? "");
  await kvSetJson(itemKey(a.id), a);
  const idx = await ownerIndex(owner);
  idx.items = [a.id, ...idx.items].slice(0, 300);
  await kvSetJson(ownerKey(owner), idx);
  return a;
}

export async function getItem(id: string): Promise<Assignment | null> {
  return isItemId(id) ? kvGetJson<Assignment>(itemKey(id)) : null;
}

export async function getHtml(id: string): Promise<string> {
  return (await kvGetJson<string>(htmlKey(id))) ?? "";
}

export async function deleteAssignment(owner: string, id: string, names: string[]): Promise<boolean> {
  const a = await getItem(id);
  if (!a || a.owner !== owner.toLowerCase()) return false;
  await kvDel(itemKey(id), htmlKey(id), ...names.flatMap((n) => [doneKey(id, n), subKey(id, n)]));
  const idx = await ownerIndex(owner);
  idx.items = idx.items.filter((x) => x !== id);
  await kvSetJson(ownerKey(owner), idx);
  return true;
}

export async function submit(id: string, name: string, sub: Omit<Submission, "at" | "attempts">): Promise<DoneMark> {
  const before = await kvGetJson<DoneMark>(doneKey(id, name));
  const at = new Date().toISOString();
  const attempts = (before?.attempts ?? 0) + 1;
  await kvSetJson(subKey(id, name), { ...sub, at, attempts } satisfies Submission);
  const mark: DoneMark = { at, attempts, score: sub.score };
  await kvSetJson(doneKey(id, name), mark);
  return mark;
}

export async function getSubmission(id: string, name: string): Promise<Submission | null> {
  return kvGetJson<Submission>(subKey(id, name));
}

/** Clear a child's submission, so they can do it again from scratch. */
export async function clearSubmission(id: string, name: string): Promise<void> {
  await kvDel(doneKey(id, name), subKey(id, name));
}

/* ---------- each child's own reading ---------- */

/** A child's reading activity: one short story at their level, with its
    questions. It stays until they submit it; the day after, the next story
    at their level takes its place. */
export type Reading = {
  storyId: string;
  levelId: string;
  tier: Tier;
  lexile: number | null;
  setAt: string;
  done?: DoneMark;
};

const readKey = (code: string, name: string) => `asg:read:${code}:${nameKey(name)}`;
const readSubKey = (code: string, name: string) => `asg:readsub:${code}:${nameKey(name)}`;

/** The school's day, so a story finished in the afternoon is still ✅ that day. */
export const schoolDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

/** Where in a level's stories a child starts: fixed for each name. */
function startFor(name: string, len: number): number {
  let h = 2166136261;
  for (const ch of nameKey(name)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % len;
}

/** The child's reading for today, choosing the next story at their level
    when there isn't one yet or yesterday's is finished. */
export async function readingFor(code: string, cls: ClassLink, name: string): Promise<Reading | null> {
  const lexile = cls.levels?.[nameKey(name)] ?? null;
  const level = levelForReader(lexile, cls.yearKey);
  // The storybook tales written for assignments; the level's Guided Reading
  // passages only if a level has none.
  const stories = assignmentStories(level.id).length ? assignmentStories(level.id) : level.passages;
  if (!stories.length) return null;
  const now = new Date().toISOString();
  const cur = await kvGetJson<Reading>(readKey(code, name));
  const sameLevel = cur?.levelId === level.id && stories.some((p) => p.id === cur.storyId);
  if (cur && sameLevel && (!cur.done || schoolDay(cur.done.at) === schoolDay(now))) return cur;
  // Next story along at this level. A child new to the level starts at a
  // place of their own, so children reading at the same level don't all get
  // the same story.
  const len = stories.length;
  const at = sameLevel ? stories.findIndex((p) => p.id === cur!.storyId) : startFor(name, len) - 1;
  const story = stories[(((at + 1) % len) + len) % len];
  const next: Reading = { storyId: story.id, levelId: level.id, tier: worksheetTier(lexile, level), lexile, setAt: now };
  await kvSetJson(readKey(code, name), next);
  return next;
}

/** Submitted today — yesterday's ✅ doesn't count for today. */
export const readToday = (r: Reading | undefined) =>
  !!r?.done && schoolDay(r.done.at) === schoolDay(new Date().toISOString());

/** Whose reading is submitted, for the class list and the teacher. */
export async function readingMarks(code: string, names: string[]): Promise<Record<string, Reading>> {
  const got = await kvMGetJson<Reading>(names.map((n) => readKey(code, n)));
  const out: Record<string, Reading> = {};
  names.forEach((n, i) => {
    if (got[i]) out[n] = got[i]!;
  });
  return out;
}

/** One story a child has submitted, for their history. */
export type HistoryEntry = {
  id: string;
  at: string;
  storyId: string;
  levelId: string;
  title: string;
  score?: { score: number; total: number };
  attempts: number;
};

const histKey = (code: string, name: string) => `asg:readhist:${code}:${nameKey(name)}`;
const histSubKey = (code: string, name: string, id: string) => `asg:readhsub:${code}:${nameKey(name)}:${id}`;
const MAX_HISTORY = 300;

/** Add (or, for a redo of the same story on the same day, update) the
    child's history entry, keeping the work itself under its own key. */
async function recordHistory(code: string, name: string, r: Reading, sub: Submission): Promise<void> {
  const list = (await kvGetJson<HistoryEntry[]>(histKey(code, name))) ?? [];
  const same = list.find((e) => e.storyId === r.storyId && schoolDay(e.at) === schoolDay(sub.at));
  const entry: HistoryEntry = {
    id: same?.id ?? rand(10),
    at: sub.at,
    storyId: r.storyId,
    levelId: r.levelId,
    title: storyTitle(r),
    score: sub.score,
    attempts: sub.attempts,
  };
  const next = [entry, ...list.filter((e) => e.id !== entry.id)];
  const dropped = next.slice(MAX_HISTORY);
  await kvSetJson(histSubKey(code, name, entry.id), sub);
  await kvSetJson(histKey(code, name), next.slice(0, MAX_HISTORY));
  if (dropped.length) await kvDel(...dropped.map((e) => histSubKey(code, name, e.id)));
}

/** A child's submitted stories, newest first. Work submitted before the
    history existed is brought in the first time it's asked for. */
export async function readingHistory(code: string, name: string): Promise<HistoryEntry[]> {
  const list = await kvGetJson<HistoryEntry[]>(histKey(code, name));
  if (list) return list;
  const [cur, sub] = await Promise.all([kvGetJson<Reading>(readKey(code, name)), kvGetJson<Submission>(readSubKey(code, name))]);
  if (!cur || !sub) return [];
  await recordHistory(code, name, cur, sub);
  return (await kvGetJson<HistoryEntry[]>(histKey(code, name))) ?? [];
}

export async function historySubmission(code: string, name: string, id: string): Promise<Submission | null> {
  return isItemId(id) ? kvGetJson<Submission>(histSubKey(code, name, id)) : null;
}

export async function submitReading(
  code: string,
  name: string,
  sub: Omit<Submission, "at" | "attempts">,
): Promise<DoneMark | null> {
  const cur = await kvGetJson<Reading>(readKey(code, name));
  if (!cur) return null;
  const at = new Date().toISOString();
  const attempts = (cur.done?.attempts ?? 0) + 1;
  const full: Submission = { ...sub, at, attempts };
  await kvSetJson(readSubKey(code, name), full);
  await recordHistory(code, name, cur, full);
  const mark: DoneMark = { at, attempts, score: sub.score };
  await kvSetJson(readKey(code, name), { ...cur, done: mark } satisfies Reading);
  return mark;
}

export async function getReadingSubmission(code: string, name: string): Promise<Submission | null> {
  return kvGetJson<Submission>(readSubKey(code, name));
}

/** Let a child do today's reading again. */
export async function clearReading(code: string, name: string): Promise<void> {
  const cur = await kvGetJson<Reading>(readKey(code, name));
  if (cur) await kvSetJson(readKey(code, name), { ...cur, done: undefined });
  await kvDel(readSubKey(code, name));
  // The cleared work leaves the history too; the redo will be recorded fresh.
  const list = await kvGetJson<HistoryEntry[]>(histKey(code, name));
  const gone = cur?.done ? list?.find((e) => e.storyId === cur.storyId && schoolDay(e.at) === schoolDay(cur.done!.at)) : undefined;
  if (list && gone) {
    await kvSetJson(histKey(code, name), list.filter((e) => e.id !== gone.id));
    await kvDel(histSubKey(code, name, gone.id));
  }
}

export function storyTitle(r: Reading): string {
  const p =
    findAssignmentStory(r.storyId) ?? passageLevels.find((l) => l.id === r.levelId)?.passages.find((x) => x.id === r.storyId);
  return p ? `${p.emoji} ${p.title}` : "Reading";
}

/* ---------- checking what comes in ---------- */

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Keep a submission to what a lesson could honestly produce, and its size sane. */
export function cleanSubmission(body: Record<string, unknown>): Omit<Submission, "at" | "attempts"> {
  const answers = Array.isArray(body.answers)
    ? (body.answers as unknown[]).slice(0, 200).map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return { label: str(o.label, 300), value: str(o.value, 1000) };
      })
    : [];
  const images = Array.isArray(body.images)
    ? (body.images as unknown[])
        .filter((s): s is string => typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s) && s.length < 250_000)
        .slice(0, 3)
    : [];
  const sc = body.score as Record<string, unknown> | undefined;
  const score =
    sc && Number.isFinite(sc.score) && Number.isFinite(sc.total) && Number(sc.total) > 0 && Number(sc.total) <= 1000
      ? { score: Math.max(0, Math.min(Number(sc.total), Number(sc.score))), total: Number(sc.total) }
      : undefined;
  return { answers, images, score, text: str(body.text, 8000), note: str(body.note, 2000) || undefined };
}

export function cleanUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
