/**
 * Server-side calls to the school's student API. The API key (students.read)
 * lives in STUDENTS_API_TOKEN and is only ever used here, on the server — it
 * never reaches the browser.
 *
 * The school system holds far more than the Cambridge classes (homeschool,
 * ZERA+, music, withdrawn pupils…), so we take only children who are
 * currently in a class named "Year 1"…"Year 6" and who are Active or Pending.
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

/** Children currently in a Year 1–6 class, ready to compare with the roster,
    each with their guardians' email addresses where the key allows it. */
export async function schoolStudents(): Promise<{
  students: SchoolStudent[];
  guardians: GuardianLookup["state"];
}> {
  const rows = await fetchAll();
  const guardians = await guardianEmails();
  const out: SchoolStudent[] = [];
  for (const r of rows) {
    // 1 = Active, 0 = Pending (accepted but not started). Everything else —
    // suspended, withdrawn, graduated, waiting list — stays out.
    if (r.status !== 1 && r.status !== 0) continue;
    const m = /^\s*Year\s*([1-6])\b/i.exec(r.class ?? "");
    if (!m) continue;
    const name = tidyName(
      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
        r.nric_name ||
        "",
    );
    if (!name) continue;
    out.push({
      id: r.id,
      name,
      preferred: tidyName(r.preferred_name ?? ""),
      year: `Year ${m[1]}`,
      yearKey: `y${m[1]}`,
      pending: r.status === 0,
      parentEmails:
        guardians.state === "ok"
          ? (guardians.byStudent[String(r.id)] ?? []).map((g) => g.email)
          : [],
    });
  }
  out.sort(
    (a, b) =>
      a.yearKey.localeCompare(b.yearKey) || a.name.localeCompare(b.name),
  );
  return { students: out, guardians: guardians.state };
}
