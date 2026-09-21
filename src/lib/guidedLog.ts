"use client";

/* Guided-reading log: which stories each child has read aloud, and how they
   did on each one.

   One entry per read, newest last, so a child who reads a story again keeps
   their earlier attempt. Saved in this browser (localStorage), like the
   parent emails and the sent ticks. */

import { useEffect, useState } from "react";
import { studentKey } from "@/app/roster";

export type GuidedRead = {
  /** Passage id, e.g. "y2-07" — what the child actually read. */
  passageId: string;
  title: string;
  lexile: number;
  /** Level id, e.g. "y2", and its label. */
  levelId: string;
  grade: string;
  /** Marks from the read-aloud. */
  accuracy: number;
  wcpm: number;
  correct: number;
  total: number;
  /** When it was read (ISO). */
  at: string;
};

/** studentKey -> every read, oldest first. */
export type GuidedLog = Record<string, GuidedRead[]>;

const KEY = "phonics.guided.v1";
const EVT = "phonics-guided-change";

function read(): GuidedLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuidedLog) : {};
  } catch {
    return {};
  }
}

function write(log: GuidedLog) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(log));
  window.dispatchEvent(new Event(EVT));
}

/** Record one read-aloud. */
export function addGuidedRead(
  yearKey: string,
  name: string,
  entry: GuidedRead,
) {
  const log = read();
  const k = studentKey(yearKey, name);
  log[k] = [...(log[k] ?? []), entry];
  write(log);
}

/** Forget one read (Manage mode in the tracker). */
export function removeGuidedRead(yearKey: string, name: string, at: string) {
  const log = read();
  const k = studentKey(yearKey, name);
  const kept = (log[k] ?? []).filter((r) => r.at !== at);
  if (kept.length) log[k] = kept;
  else delete log[k];
  write(log);
}

/** Everything this child has read, oldest first. */
export function readsFor(
  log: GuidedLog,
  yearKey: string,
  name: string,
): GuidedRead[] {
  return log[studentKey(yearKey, name)] ?? [];
}

/** Their most recent attempt at each story, newest story first. */
export function latestPerStory(reads: GuidedRead[]): GuidedRead[] {
  const byStory = new Map<string, GuidedRead>();
  for (const r of reads) {
    const seen = byStory.get(r.passageId);
    if (!seen || r.at > seen.at) byStory.set(r.passageId, r);
  }
  return [...byStory.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** Which stories they've read — for ticking them off the story list. */
export function storiesRead(
  log: GuidedLog,
  yearKey: string,
  name: string,
): Map<string, GuidedRead> {
  const out = new Map<string, GuidedRead>();
  for (const r of latestPerStory(readsFor(log, yearKey, name))) {
    out.set(r.passageId, r);
  }
  return out;
}

/** Average accuracy across their latest attempt at each story. */
export function averageAccuracy(reads: GuidedRead[]): number | null {
  const latest = latestPerStory(reads);
  if (!latest.length) return null;
  return Math.round(latest.reduce((n, r) => n + r.accuracy, 0) / latest.length);
}

/** Reactive snapshot; re-renders on any change here or in another tab. */
export function useGuidedLog(): GuidedLog {
  const [log, setLog] = useState<GuidedLog>({});
  useEffect(() => {
    const sync = () => setLog(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return log;
}
