"use client";

/* Teacher edits to the class lists, saved in this browser:
     - students added from the tracker ("Add student")
     - which students are locked (not registered yet)

   The starting lock state comes from `pending` in app/roster.ts; anything set
   here overrides it, so unlocking a child sticks even after the app updates. */

import { useEffect, useState } from "react";
import { ALL_STUDENTS, ROSTER, studentKey } from "@/app/roster";

export type RosterEdits = {
  /** yearKey -> names added by the teacher. */
  added: Record<string, string[]>;
  /** studentKey -> locked?  (overrides the roster's `pending` default) */
  lock: Record<string, boolean>;
};

const KEY = "phonics.roster.v1";
const EVT = "phonics-roster-change";
const EMPTY: RosterEdits = { added: {}, lock: {} };

function read(): RosterEdits {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<RosterEdits>;
    return { added: p.added ?? {}, lock: p.lock ?? {} };
  } catch {
    return EMPTY;
  }
}

function write(edits: RosterEdits) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(edits));
  window.dispatchEvent(new Event(EVT));
}

/** Is this child locked? `pending` is the roster default when nothing is set. */
export function isLocked(
  edits: RosterEdits,
  yearKey: string,
  name: string,
  pending: boolean,
): boolean {
  return edits.lock[studentKey(yearKey, name)] ?? pending;
}

export function setLocked(yearKey: string, name: string, locked: boolean) {
  const edits = read();
  edits.lock = { ...edits.lock, [studentKey(yearKey, name)]: locked };
  write(edits);
}

/** Add a student to a class. Returns false if the name is blank or a duplicate. */
export function addStudent(
  yearKey: string,
  name: string,
  existing: string[],
): boolean {
  const clean = name.replace(/\s+/g, " ").trim();
  if (!clean) return false;
  const taken = existing.some((n) => n.toLowerCase() === clean.toLowerCase());
  if (taken) return false;
  const edits = read();
  edits.added = {
    ...edits.added,
    [yearKey]: [...(edits.added[yearKey] ?? []), clean],
  };
  write(edits);
  return true;
}

/** Remove a teacher-added student (roster names can't be removed). */
export function removeAdded(yearKey: string, name: string) {
  const edits = read();
  edits.added = {
    ...edits.added,
    [yearKey]: (edits.added[yearKey] ?? []).filter((n) => n !== name),
  };
  delete edits.lock[studentKey(yearKey, name)];
  write(edits);
}

export type RosterEntry = {
  name: string;
  year: string;
  yearKey: string;
  locked: boolean;
};

/** Every student — the class lists plus anyone the teacher added — with their
    current lock state. Use this for name pickers and for filing a report under
    the right class. */
export function allStudents(edits: RosterEdits): RosterEntry[] {
  const fromRoster = ALL_STUDENTS.map((s) => ({
    name: s.name,
    year: s.year,
    yearKey: s.yearKey,
    locked: isLocked(edits, s.yearKey, s.name, s.pending),
  }));
  const added = Object.entries(edits.added).flatMap(([yearKey, names]) => {
    const year = ROSTER.find((g) => g.key === yearKey)?.year ?? yearKey;
    return names.map((name) => ({
      name,
      year,
      yearKey,
      locked: isLocked(edits, yearKey, name, false),
    }));
  });
  return [...fromRoster, ...added];
}

/** Look a child up by name (locked or not), so their report files correctly. */
export function findStudent(
  edits: RosterEdits,
  name: string,
): RosterEntry | undefined {
  const wanted = name.trim().toLowerCase();
  return allStudents(edits).find((s) => s.name.toLowerCase() === wanted);
}

/** Reactive snapshot; re-renders on any change here or in another tab. */
export function useRosterEdits(): RosterEdits {
  const [edits, setEdits] = useState<RosterEdits>(EMPTY);
  useEffect(() => {
    const sync = () => setEdits(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return edits;
}
