"use client";

/* Parent email addresses, saved in this browser (like the roster edits).

   One address per child, keyed by studentKey(yearKey, name), so the tracker
   can email that child's report to their parent in one tap. Nothing is sent
   anywhere from here — the address only ever goes into the teacher's own mail
   app (see emailReport in lib/emailReport.ts). */

import { useEffect, useState } from "react";
import { studentKey } from "@/app/roster";

export type ParentBook = Record<string, string>;

const KEY = "phonics.parents.v1";
const EVT = "phonics-parents-change";

function read(): ParentBook {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ParentBook) : {};
  } catch {
    return {};
  }
}

function write(book: ParentBook) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(book));
  window.dispatchEvent(new Event(EVT));
}

export function parentEmail(
  book: ParentBook,
  yearKey: string,
  name: string,
): string {
  return book[studentKey(yearKey, name)] ?? "";
}

/** A light check — enough to catch typos, not to police valid addresses. */
export function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Save (or clear, with an empty string) a child's parent address. */
export function setParentEmail(yearKey: string, name: string, email: string) {
  const book = read();
  const k = studentKey(yearKey, name);
  const clean = email.trim();
  if (clean) book[k] = clean;
  else delete book[k];
  write(book);
}

/** Reactive snapshot; re-renders on any change here or in another tab. */
export function useParentContacts(): ParentBook {
  const [book, setBook] = useState<ParentBook>({});
  useEffect(() => {
    const sync = () => setBook(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return book;
}
