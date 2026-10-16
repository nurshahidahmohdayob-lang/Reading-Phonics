/**
 * Server-side calls to the school's student API. The API key (students.read)
 * lives in STUDENTS_API_TOKEN and is only ever used here, on the server — it
 * never reaches the browser.
 *
 * The school system holds far more than the Cambridge classes (homeschool,
 * ZERA+, music, withdrawn pupils…), so we take only children who are
 * currently in a class named "Year 1"…"Year 6" and who are Active or Pending.
 *
 * Many children have no class set at all — only their own record carries
 * their year group (its `cohort`, e.g. "Year 1 2026"), and the list doesn't
 * include it. So for those, each child's record is looked up, a few dozen at
 * a time (the school system allows 60 requests a minute), and the answer is
 * remembered for a fortnight. Until every child has been looked up, the
 * result says how many are still to check, and the page asks again.
 */

export type ApiStudent = {
  id: string | number;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  nric_name?: string | null;
  email?: string | null;
  /** Active class name, e.g. "Year 2 2026". Empty or null if not in one. */
  class?: string | null;
  grade?: string | null;
  /** 0=Pending 1=Active 2=Suspended 3=Withdrawn 4=Graduated 5=WaitingList */
  status: number;
};

/** One child, mapped onto the tracker's classes. */
export type SchoolStudent = {
  id: string | number;
  /** Display name, e.g. "Aloysius Cheng". */
  name: string;
  preferred: string;
  /** "Year 2" */
  year: string;
  /** "y2" */
  yearKey: string;
  /** True while the school system still has them as Pending (not enrolled). */
  pending: boolean;
  /** Their guardians' email addresses, if the key may read guardians. */
  parentEmails: string[];
};

import { guardianEmails, type GuardianLookup } from "./guardiansApi";
import { kvMGetJson, kvSetJson } from "./kv";

/** How many children's records one sync may look up, leaving room under the
    60-a-minute limit for the list and guardian pages. */
const LOOKUPS_PER_CALL = 35;
const COHORT_TTL = 14 * 24 * 60 * 60;
const cohortKey = (id: string | number) => `commun:cohort:${id}`;

/** "Year 1 2026" → "1"; anything that isn't Year 1–6 → null. */
function yearOf(label: string | null | undefined): string | null {
  const m = /^\s*Year\s*([1-6])\b/i.exec(label ?? "");
  return m ? m[1] : null;
}

/** Any enrolled child with their guardians' addresses — class or no class.
    Many children (all of Year 5, for one) have no class set in the school
    system, so parent emails can't depend on it. */
export type ParentContact = {
  name: string;
  preferred: string;
  parentEmails: string[];
};

export class StudentsApiNotConfigured extends Error {}

function config(): { base: string; token: string } {
  const base = process.env.STAFF_API_BASE?.replace(/\/+$/, "");
  // A separate key with students.read; falls back to the staff key if that
  // one happens to carry the ability too.
  const token = process.env.STUDENTS_API_TOKEN || process.env.STAFF_API_TOKEN;
  if (!base || !token || base.includes("CHANGE-ME")) {
    throw new StudentsApiNotConfigured(
      "Set STAFF_API_BASE and STUDENTS_API_TOKEN in the environment",
    );
  }
  return { base, token };
}

/** "ALOYSIUS CHENG" → "Aloysius Cheng"; leaves mixed-case names alone. */
export function tidyName(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s !== s.toUpperCase()) return s; // already has case — trust it
  return s
    .toLowerCase()
    .split(" ")
    .map((w) =>
      w === "a/p" || w === "a/l"
        ? w.toUpperCase()
        : w
            .split("/")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("/"),
    )
    .join(" ");
}

/** Fetch every page of the student list (the API pages 50 at a time). */
async function fetchAll(): Promise<ApiStudent[]> {
  const { base, token } = config();
  const out: ApiStudent[] = [];
  let page = 1;
  let lastPage = 1;
  // A hard stop, so a misbehaving API can't spin here forever.
  while (page <= lastPage && page <= 40) {
    const url = new URL(`${base}/api/v1/students`);
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Student API responded ${res.status}`);
    const json = (await res.json()) as {
      data?: ApiStudent[];
      meta?: { last_page?: number };
    };
    out.push(...(json.data ?? []));
    lastPage = json.meta?.last_page ?? page;
    page++;
  }
  return out;
}

/** Each classless child's year group from their own record: remembered ones
    first, then up to LOOKUPS_PER_CALL fresh lookups. Returns what's known and
    how many are still to look up. */
async function cohorts(
  ids: (string | number)[],
): Promise<{ known: Map<string, string>; left: number }> {
  const { base, token } = config();
  const known = new Map<string, string>();
  const saved = await kvMGetJson<{ cohort: string }>(ids.map(cohortKey));
  const todo: (string | number)[] = [];
  ids.forEach((id, i) => {
    const c = saved[i];
    if (c) known.set(String(id), c.cohort);
    else todo.push(id);
  });

  const now = todo.slice(0, LOOKUPS_PER_CALL);
  let looked = 0;
  let limited = false;
  // A few at a time: quick, without bursting past the rate limit.
  for (let i = 0; i < now.length && !limited; i += 5) {
    await Promise.all(
      now.slice(i, i + 5).map(async (id) => {
        try {
          const res = await fetch(`${base}/api/v1/students/${id}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
          });
          if (res.status === 429) {
            limited = true;
            return;
          }
          if (!res.ok) return;
          const json = (await res.json()) as { data?: { cohort?: string | null }; cohort?: string | null };
          const cohort = (json.data ?? json).cohort ?? "";
          known.set(String(id), cohort);
          looked++;
          await kvSetJson(cohortKey(id), { cohort }, COHORT_TTL);
        } catch {
          /* left for the next sync */
        }
      }),
    );
  }
  return { known, left: todo.length - looked };
}

/** Children currently in Year 1–6 (by class, or else by their own record's
    year group), ready to compare with the roster, each with their guardians'
    email addresses where the key allows it. `checking` is how many children's
    year groups are still to be looked up — ask again in a minute. */
export async function schoolStudents(): Promise<{
  students: SchoolStudent[];
  contacts: ParentContact[];
  guardians: GuardianLookup["state"];
  checking: number;
}> {
  const rows = await fetchAll();
  const guardians = await guardianEmails();
  const enrolled = (r: ApiStudent) => r.status === 1 || r.status === 0;
  // Only children with no class at all: a class like "Joy" or "Online Class"
  // is a different programme, not a Cambridge year.
  const { known, left } = await cohorts(
    rows.filter((r) => enrolled(r) && !(r.class ?? "").trim()).map((r) => r.id),
  );
  const out: SchoolStudent[] = [];
  const contacts: ParentContact[] = [];
  for (const r of rows) {
    // 1 = Active, 0 = Pending (accepted but not started). Everything else —
    // suspended, withdrawn, graduated, waiting list — stays out.
    if (r.status !== 1 && r.status !== 0) continue;
    const name = tidyName(
      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
        r.nric_name ||
        "",
    );
    if (!name) continue;
    const parentEmails =
      guardians.state === "ok"
        ? (guardians.byStudent[String(r.id)] ?? []).map((g) => g.email)
        : [];
    const preferred = tidyName(r.preferred_name ?? "");

    // Parent emails: every enrolled child, whether or not a class is set.
    if (parentEmails.length) contacts.push({ name, preferred, parentEmails });

    // Class lists: children in a Year 1–6 class, or with no class but a
    // Year 1–6 year group on their own record.
    const year = (r.class ?? "").trim()
      ? yearOf(r.class)
      : yearOf(known.get(String(r.id)));
    if (!year) continue;
    out.push({
      id: r.id,
      name,
      preferred,
      year: `Year ${year}`,
      yearKey: `y${year}`,
      pending: r.status === 0,
      parentEmails,
    });
  }
  out.sort(
    (a, b) =>
      a.yearKey.localeCompare(b.yearKey) || a.name.localeCompare(b.name),
  );
  return { students: out, contacts, guardians: guardians.state, checking: left };
}
