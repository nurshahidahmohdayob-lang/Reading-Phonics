"use client";

/* Scanned drawings, kept in this browser.

   A cut-out drawing is a PNG of a few hundred kilobytes — far too big for
   localStorage, where the rest of the app's notes live — so these go in
   IndexedDB, which is sized for it. They stay on the device: a child's
   artwork is never uploaded anywhere. */

import { useCallback, useEffect, useState } from "react";

export type Drawing = {
  id: string;
  /** What the child called it, e.g. "My dragon". */
  name: string;
  /** PNG with a transparent background (see lib/cutout.ts). */
  dataUrl: string;
  width: number;
  height: number;
  createdAt: string;
};

const DB = "phonics-drawings";
const STORE = "drawings";
const EVT = "phonics-drawings-change";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Can't open storage"));
  });
}

function done<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Storage failed"));
  });
}

function changed() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

/** Every saved drawing, newest first. */
export async function listDrawings(): Promise<Drawing[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const all = await done(
    db.transaction(STORE).objectStore(STORE).getAll() as IDBRequest<Drawing[]>,
  );
  db.close();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveDrawing(
  entry: Omit<Drawing, "id" | "createdAt">,
): Promise<Drawing> {
  const drawing: Drawing = {
    ...entry,
    id: `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const db = await openDb();
  await done(
    db.transaction(STORE, "readwrite").objectStore(STORE).put(drawing),
  );
  db.close();
  changed();
  return drawing;
}

export async function renameDrawing(id: string, name: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = await done(store.get(id) as IDBRequest<Drawing | undefined>);
  if (existing) await done(store.put({ ...existing, name }));
  db.close();
  changed();
}

export async function removeDrawing(id: string): Promise<void> {
  const db = await openDb();
  await done(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
  db.close();
  changed();
}

/** Reactive list of saved drawings. */
export function useDrawings(): {
  drawings: Drawing[];
  loading: boolean;
  reload: () => void;
} {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    listDrawings()
      .then((all) => {
        setDrawings(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(EVT, reload);
    return () => window.removeEventListener(EVT, reload);
  }, [reload]);

  return { drawings, loading, reload };
}
