"use client";

/* Which reading reports have been sent to parents, saved in this browser.

   studentKey -> term -> when it was sent (ISO). ✉️ records it the moment the
   email is opened for sending. The app can't see whether Send was actually
   pressed in the mail app, so a tick can be undone — and set by hand for a
   report shared another way (WhatsApp, a printed copy). */

import { useEffect, useState } from "react";
import { studentKey } from "@/app/roster";
import type { TermNo } from "./tracker";

export type SentLog = Record<string, Partial<Record<string, string>>>;

const KEY = "phonics.sent.v1";
const EVT = "phonics-sent-change";

function read(): SentLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SentLog) : {};
  } catch {
    return {};
  }
}

function write(log: SentLog) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(log));
  window.dispatchEvent(new Event(EVT));
}

/** When this child's report for this term was sent, or null. */
export function sentAt(
  log: SentLog,
  yearKey: string,
  name: string,
  term: TermNo,
): string | null {
  return log[studentKey(yearKey, name)]?.[String(term)] ?? null;
}

export function markSent(yearKey: string, name: string, term: TermNo) {
  const log = read();
  const k = studentKey(yearKey, name);
  log[k] = { ...(log[k] ?? {}), [String(term)]: new Date().toISOString() };
  write(log);
}

export function clearSent(yearKey: string, name: string, term: TermNo) {
  const log = read();
  const k = studentKey(yearKey, name);
  if (!log[k]) return;
  delete log[k][String(term)];
  if (Object.keys(log[k]).length === 0) delete log[k];
  write(log);
}

/** Sent, and not re-assessed since — a report redone after sending counts as
    not sent, because the parent has the old one. */
export function isSentCurrent(
  log: SentLog,
  yearKey: string,
  name: string,
  term: TermNo,
  reportSavedAt: string,
): boolean {
  const when = sentAt(log, yearKey, name, term);
  return !!when && Date.parse(when) >= Date.parse(reportSavedAt);
}

/** Reactive snapshot; re-renders on any change here or in another tab. */
export function useSentLog(): SentLog {
  const [log, setLog] = useState<SentLog>({});
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
