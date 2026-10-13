"use client";

import { useEffect, useState } from "react";

/* Moves this teacher's saved-in-the-browser records from the old address to
   the new one. A browser keeps each address's storage apart, so when the app
   moved from reading-phonics.vercel.app to readingpals.vercel.app the
   guided-reading log, added students, locks, parent emails and sent ticks
   stayed behind on the old address.

   On the old address: upload everything saved there (api/carry), then go on
   to the new address. On the new address: pull in any copy not taken in yet
   and merge it — nothing already here is overwritten, lists are combined. */

const OLD_HOST = "reading-phonics.vercel.app";
const NEW_ORIGIN = "https://readingpals.vercel.app";
const DEVICE = "phonics.carry.device";
const DONE = "phonics.carry.done";
const JUST = "phonics.carry.just";

type Copy = { device: string; at: string; data: Record<string, string> };

function safeGet(store: Storage, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function isPlain(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** What's here wins; the old copy fills the gaps. Lists are combined (a
    guided-reading log keeps every read, oldest first). */
function fill(here: unknown, old: unknown): unknown {
  if (Array.isArray(here) && Array.isArray(old)) {
    const seen = new Set(here.map((x) => JSON.stringify(x)));
    const out = [...here, ...old.filter((x) => !seen.has(JSON.stringify(x)))];
    if (out.every((x) => isPlain(x) && typeof x.at === "string"))
      out.sort((a, b) => String((a as { at: string }).at).localeCompare((b as { at: string }).at));
    return out;
  }
  if (isPlain(here) && isPlain(old)) {
    const out: Record<string, unknown> = { ...here };
    for (const [k, v] of Object.entries(old)) out[k] = k in here ? fill(here[k], v) : v;
    return out;
  }
  return here;
}

function mergeIn(data: Record<string, string>) {
  for (const [key, oldRaw] of Object.entries(data)) {
    if (key.startsWith("phonics.carry.")) continue;
    const hereRaw = safeGet(localStorage, key);
    let next = oldRaw;
    if (hereRaw != null) {
      try {
        next = JSON.stringify(fill(JSON.parse(hereRaw), JSON.parse(oldRaw)));
      } catch {
        next = hereRaw;
      }
    }
    if (next !== hereRaw) localStorage.setItem(key, next);
  }
}

export default function CarryOver() {
  // Only ever mounted after sign-in is checked in the browser, so reading
  // the address and session storage up front is safe.
  const [moving, setMoving] = useState<"no" | "yes" | "failed">(() =>
    location.hostname === OLD_HOST ? "yes" : "no",
  );
  const [arrived, setArrived] = useState(() => !!safeGet(sessionStorage, JUST));

  useEffect(() => {
    if (location.hostname === OLD_HOST) {
      let device = safeGet(localStorage, DEVICE);
      if (!device) {
        device = Math.random().toString(36).slice(2, 12).padEnd(10, "0");
        try {
          localStorage.setItem(DEVICE, device);
        } catch {}
      }
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = k ? safeGet(localStorage, k) : null;
        if (k && v != null && !k.startsWith("phonics.carry.")) data[k] = v;
      }
      fetch("/api/carry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device, data }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok) throw new Error(d.error ?? "not saved");
          location.replace(NEW_ORIGIN + location.pathname + location.search + location.hash);
        })
        .catch(() => setMoving("failed"));
      return;
    }

    if (safeGet(sessionStorage, JUST)) {
      sessionStorage.removeItem(JUST);
      setTimeout(() => setArrived(false), 8000);
    }

    fetch("/api/carry")
      .then((r) => r.json())
      .then((d: { ok?: boolean; copies?: Copy[] }) => {
        if (!d.ok || !d.copies?.length) return;
        let done: string[] = [];
        try {
          done = JSON.parse(safeGet(localStorage, DONE) ?? "[]");
        } catch {}
        const fresh = d.copies.filter((c) => !done.includes(`${c.device}@${c.at}`));
        if (!fresh.length) return;
        for (const c of fresh) mergeIn(c.data);
        localStorage.setItem(DONE, JSON.stringify([...done, ...fresh.map((c) => `${c.device}@${c.at}`)]));
        try {
          sessionStorage.setItem(JUST, "1");
        } catch {}
        location.reload();
      })
      .catch(() => {});
  }, []);

  if (moving !== "no") {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-white/95 p-6 text-center dark:bg-zinc-950/95">
        <div className="max-w-md">
          <div className="text-5xl">{moving === "yes" ? "📦" : "⚠️"}</div>
          <p className="mt-3 text-lg font-extrabold text-zinc-700 dark:text-zinc-100">
            {moving === "yes"
              ? "Moving your records to readingpals.vercel.app…"
              : "Couldn’t move your records just now."}
          </p>
          {moving === "failed" && (
            <button
              onClick={() => location.reload()}
              className="mt-4 rounded-full bg-[#0A4F29] px-5 py-2 font-bold text-white active:scale-95"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!arrived) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
        ✓ Your records from reading-phonics.vercel.app are here now.
      </div>
    </div>
  );
}
