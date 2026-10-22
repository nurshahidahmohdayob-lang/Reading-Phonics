"use client";

/* Reading-assessment tracker storage.

   Results sync to a shared cloud store (see /api/tracker) so the same data
   appears on the live site, phonics.test, and every device. The browser's
   localStorage is kept as an instant cache and offline fallback: saves apply
   locally right away (optimistic), then push to the server; on load and after
   each save we pull the server's authoritative copy back into the cache.

   If no cloud store is configured yet, everything still works from
   localStorage on that device. */

import { useEffect, useState } from "react";
import type { ReportData } from "./reportPrint";
import { studentKey } from "@/app/roster";
import { TRACKER_SEED } from "@/app/trackerSeed";

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

export type CloudStatus = "checking" | "on" | "off";

const KEY = "phonics.tracker.v1";
const EVT = "phonics-tracker-change";
const STATUS_EVT = "phonics-tracker-status";
const SEED_FLAG = "phonics.tracker.seed.v1";

let cloudStatus: CloudStatus = "checking";

function read(): TrackerStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrackerStore) : {};
  } catch {
    return {};
  }
}

/** Overwrite the local cache and notify listeners. */
function writeLocal(store: TrackerStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(EVT));
}

function setCloud(status: CloudStatus) {
  cloudStatus = status;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STATUS_EVT));
}

/** Push a change to the shared store; on success adopt its authoritative copy. */
async function pushServer(
  body:
    | { op: "save"; record: TrackerRecord }
    | { op: "delete"; yearKey: string; name: string; term: TermNo },
) {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data?.ok && data.store) {
      setCloud("on");
      writeLocal(data.store as TrackerStore);
    } else if (data && data.configured === false) {
      setCloud("off");
    }
  } catch {
    /* offline — keep the optimistic local copy */
  }
}

/** Sync with the shared store on load: push this device's records up (so
    nothing is lost when cloud sync first turns on) and adopt the merged copy. */
export async function pullServer(): Promise<TrackerStore | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "merge", store: read() }),
    });
    const data = await res.json();
    if (data?.ok && data.store) {
      setCloud("on");
      writeLocal(data.store as TrackerStore);
      return data.store as TrackerStore;
    }
    if (data && data.configured === false) setCloud("off");
  } catch {
    /* offline — keep the local cache */
  }
  return null;
}

/** Fill in the baked-in reading levels once per browser. Never overwrites an
    existing record; then it flows up to the cloud via the load-time merge. */
function applySeedOnce() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(SEED_FLAG)) return;
    const store = read();
    for (const rec of TRACKER_SEED) {
      const k = studentKey(rec.yearKey, rec.student);
      const entry = store[k] ?? (store[k] = {});
      if (!entry[rec.term]) entry[rec.term] = rec;
    }
    window.localStorage.setItem(SEED_FLAG, "1");
    writeLocal(store);
  } catch {
    /* ignore */
  }
}

export function loadAll(): TrackerStore {
  return read();
}

export function getRecords(
  yearKey: string,
  name: string,
): Partial<Record<TermNo, TrackerRecord>> {
  return read()[studentKey(yearKey, name)] ?? {};
}

/** Save (or overwrite) a student's result for one term — locally now, cloud next. */
export function saveRecord(rec: TrackerRecord) {
  const store = read();
  const k = studentKey(rec.yearKey, rec.student);
  store[k] = { ...(store[k] ?? {}), [rec.term]: rec };
  writeLocal(store); // optimistic
  void pushServer({ op: "save", record: rec });
}

export function deleteRecord(yearKey: string, name: string, term: TermNo) {
  const store = read();
  const k = studentKey(yearKey, name);
  const entry = store[k];
  if (entry && entry[term]) {
    delete entry[term];
    if (Object.keys(entry).length === 0) delete store[k];
    writeLocal(store); // optimistic
  }
  void pushServer({ op: "delete", yearKey, name, term });
}

/** Results filed under "Other" for a child who is on a class list. Until
    October 2026 a result for a child added by hand was saved before the
    hand-added names had loaded, so it went to "Other". Each is moved to the
    child's class: copied there first (unless the class already holds a newer
    one for that term), then taken out of "Other". */
const refiling = new Set<string>();
export async function refileFromOther(
  name: string,
  to: { yearKey: string; year: string },
): Promise<void> {
  const from = studentKey("other", name);
  if (refiling.has(from)) return;
  const misfiled = read()[from];
  if (!misfiled) return;
  refiling.add(from);
  try {
    const target = read()[studentKey(to.yearKey, name)] ?? {};
    const moved: TrackerRecord[] = [];
    for (const rec of Object.values(misfiled)) {
      if (!rec) continue;
      const there = target[rec.term];
      if (!there || there.savedAt < rec.savedAt) {
        moved.push({ ...rec, yearKey: to.yearKey, year: to.year });
      }
    }
    // Locally at once, so the row moves straight away.
    const store = read();
    const k = studentKey(to.yearKey, name);
    for (const rec of moved) store[k] = { ...(store[k] ?? {}), [rec.term]: rec };
    delete store[from];
    writeLocal(store);
    // Then the shared copy: the class's copy saved before "Other"'s goes.
    for (const rec of moved) await pushServer({ op: "save", record: rec });
    for (const rec of Object.values(misfiled)) {
      if (rec) await pushServer({ op: "delete", yearKey: "other", name: rec.student, term: rec.term });
    }
  } finally {
    refiling.delete(from);
  }
}

export function totalSaved(store: TrackerStore): number {
  return Object.values(store).reduce((n, terms) => n + Object.keys(terms).length, 0);
}

/** A reactive snapshot of the tracker + cloud-sync status. Pulls the shared
    store on mount, and re-renders on any local save/delete or cross-tab change. */
export function useTracker(): { store: TrackerStore; cloud: CloudStatus } {
  const [store, setStore] = useState<TrackerStore>({});
  const [cloud, setStatus] = useState<CloudStatus>(cloudStatus);
  useEffect(() => {
    const sync = () => setStore(read());
    const syncStatus = () => setStatus(cloudStatus);
    applySeedOnce();
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener(STATUS_EVT, syncStatus);
    void pullServer(); // auto-sync from the shared store
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(STATUS_EVT, syncStatus);
    };
  }, []);
  return { store, cloud };
}
