/* Assignments: online lessons a teacher sets for a class, which children open
   from a class link, do, and submit. Server-side only.

   Kept in the KV store, filed under the teacher who made them:

     asg:owner:<email>         { classes: { y3: <code> }, items: [ids] }
     asg:class:<code>          the class link: whose it is, and the names on it
     asg:item:<id>             an assignment: title, kind, who it's for
     asg:html:<id>             the lesson itself (kept apart, so lists stay light)
     asg:done:<id>:<name>      a child has submitted: when, score, attempts
     asg:sub:<id>:<name>       what they submitted: answers, drawings, page text

   One key per child per assignment, so two children pressing Submit at the
   same moment can't overwrite each other.

   The class code in the link is the permission, as with the phone-scan
   pairing: it opens that class's names and assignments, and lets a child
   submit — nothing else. Only the teacher who made it can see submissions. */

import { randomBytes } from "crypto";
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
): Promise<string> {
  const idx = await ownerIndex(owner);
  let code = idx.classes[yearKey];
  if (!code || !(await kvGetJson<ClassLink>(classKey(code)))) {
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
    updatedAt: new Date().toISOString(),
  } satisfies ClassLink);
  return code;
}

/** The class link this teacher already has for a class, if any. */
export async function classFor(owner: string, yearKey: string): Promise<ClassLink | null> {
  const code = (await ownerIndex(owner)).classes[yearKey];
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
