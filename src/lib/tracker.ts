"use client";

/* Reading-assessment tracker storage.

   There is no backend in this app, so — like the Spelling / Guided Reading
   progress — results are kept in the browser's localStorage on this device.
   Each completed assessment is stored as the full printable ReportData under
   the student, split by academic term (1–3), so the Class Tracker can show a
   per-term grid and re-open / download any saved report. */

import { useEffect, useState } from "react";
import type { ReportData } from "./reportPrint";
import { studentKey } from "@/app/roster";

export type TermNo = 1 | 2 | 3;

export type TrackerRecord = {
  student: string;
  /** Class label, e.g. "Year 3" (or "Other" for a typed name not on a list). */
  year: string;
  /** Class key, e.g. "y3" (or "other"). */
  yearKey: string;
  term: TermNo;
  /** ISO timestamp of when it was saved. */
  savedAt: string;
  /** The complete report, ready to re-open / download via openReport(). */
  report: ReportData;
};

/** studentKey -> { term -> record }. */
export type TrackerStore = Record<string, Partial<Record<TermNo, TrackerRecord>>>;

const KEY = "phonics.tracker.v1";
const EVT = "phonics-tracker-change";

function read(): TrackerStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrackerStore) : {};
  } catch {
    return {};
  }
}

function write(store: TrackerStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(EVT));
}

export function loadAll(): TrackerStore {
  return read();
}

/** The saved terms for one student. */
export function getRecords(
  yearKey: string,
  name: string,
): Partial<Record<TermNo, TrackerRecord>> {
  return read()[studentKey(yearKey, name)] ?? {};
}

/** Save (or overwrite) a student's result for one term. */
export function saveRecord(rec: TrackerRecord) {
  const store = read();
  const k = studentKey(rec.yearKey, rec.student);
  store[k] = { ...(store[k] ?? {}), [rec.term]: rec };
  write(store);
}

export function deleteRecord(yearKey: string, name: string, term: TermNo) {
  const store = read();
  const k = studentKey(yearKey, name);
  const entry = store[k];
  if (entry && entry[term]) {
    delete entry[term];
    if (Object.keys(entry).length === 0) delete store[k];
    write(store);
  }
}

/** Total number of saved reports across everyone. */
export function totalSaved(store: TrackerStore): number {
  return Object.values(store).reduce((n, terms) => n + Object.keys(terms).length, 0);
}

/** A reactive snapshot of the whole tracker — re-renders on save/delete and
    when another tab changes it. */
export function useTracker(): TrackerStore {
  const [store, setStore] = useState<TrackerStore>({});
  useEffect(() => {
    const sync = () => setStore(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return store;
}
