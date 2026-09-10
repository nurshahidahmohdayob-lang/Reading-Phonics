"use client";

/* Comparing the tracker's class lists with the school system.

   The two write names differently — "Kuan Yu Xuan" with a preferred name of
   "Ethan" here is "Ethan Kuan Yu Xuan" in the tracker, "Yang Fu Yu" is
   "Yang Fuyu (Dorcas)" — so names are matched on their words, in any order,
   ignoring case and punctuation, and allowing neighbouring words to be run
   together ("Xin An Liu" = "Liu Xinan"). If every word of one name is found
   in the other, it's the same child.

   Anything left over that still shares a couple of words with a name we have
   is flagged as a possible spelling difference rather than a new child, and
   is left unticked.

   The sync only ever ADDS children. It never renames or removes anyone: a
   child's saved reports are filed under their name, so a rename would orphan
   their history, and a child missing from the school system is far more
   likely to be a data gap than a child who has left. */

import type { SchoolStudent } from "./studentsApi";

const NOISE = new Set(["bin", "binti", "a/p", "a/l", "ap", "al"]);

/** The words in a name: lowercase, no punctuation, brackets opened out. */
function words(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\(([^)]*)\)/g, " $1 ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w));
}

/** Those words plus every run of 2 or 3 neighbours joined up, so a name
    written "Fu Yu" still matches one written "Fuyu". */
function variants(name: string): Set<string> {
  const w = words(name);
  const out = new Set(w);
  for (let i = 0; i < w.length - 1; i++) {
    out.add(w[i] + w[i + 1]);
    if (i < w.length - 2) out.add(w[i] + w[i + 1] + w[i + 2]);
  }
  return out;
}

/** How many of `parts` appear in `pool` (counting joined-up forms). */
function covered(parts: string[], pool: Set<string>): number {
  return parts.filter((p) => pool.has(p)).length;
}

/** Is this the same child, written two ways? */
export function sameChild(
  schoolName: string,
  preferred: string,
  rosterName: string,
): boolean {
  const school = `${schoolName} ${preferred}`.trim();
  const a = words(school);
  const b = words(rosterName);
  if (!a.length || !b.length) return false;
  const inA = covered(b, variants(school));
  const inB = covered(a, variants(rosterName));
  // Every word of one side found in the other, and at least two words shared
  // — so two children who happen to share one common name aren't merged.
  return (inA === b.length || inB === a.length) && Math.max(inA, inB) >= 2;
}

/** Words in common — used to spot a likely spelling difference. */
function shared(schoolName: string, preferred: string, rosterName: string) {
  const school = `${schoolName} ${preferred}`.trim();
  return Math.max(
    covered(words(rosterName), variants(school)),
    covered(words(school), variants(rosterName)),
  );
}

export type NewStudent = {
  student: SchoolStudent;
  /** A tracker name this may really be, spelled differently. */
  similar?: string;
};

export type ClassDiff = {
  year: string;
  yearKey: string;
  /** In the school system, not found in the tracker. */
  toAdd: NewStudent[];
  /** In the tracker, not in the school system's class list. */
  onlyHere: string[];
  /** Matched both ways. */
  matched: number;
  /** The school system has no Year N class at all. */
  noClass: boolean;
};

/** Compare each class list with the school system's. */
export function compareRoster(
  school: SchoolStudent[],
  groups: { year: string; key: string; students: { name: string }[] }[],
): ClassDiff[] {
  return groups
    .filter((g) => /^y[1-6]$/.test(g.key))
    .map((g) => {
      const theirs = school.filter((s) => s.yearKey === g.key);
      const ours = g.students.map((s) => s.name);
      const missing = theirs.filter(
        (s) => !ours.some((n) => sameChild(s.name, s.preferred, n)),
      );
      const onlyHere = ours.filter(
        (n) => !theirs.some((s) => sameChild(s.name, s.preferred, n)),
      );
      const toAdd: NewStudent[] = missing.map((s) => {
        let best = "";
        let bestScore = 1; // needs at least 2 words in common to be a hint
        for (const n of onlyHere) {
          const score = shared(s.name, s.preferred, n);
          if (score > bestScore) {
            bestScore = score;
            best = n;
          }
        }
        return best ? { student: s, similar: best } : { student: s };
      });
      return {
        year: g.year,
        yearKey: g.key,
        toAdd,
        onlyHere,
        matched: theirs.length - toAdd.length,
        noClass: theirs.length === 0,
      };
    });
}
