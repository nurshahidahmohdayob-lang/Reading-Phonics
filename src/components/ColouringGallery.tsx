"use client";

import { useEffect, useMemo, useState } from "react";

/* The teacher's view of colouring pages children have sent in, newest
   first. Pictures load one by one as cards appear, so the list itself
   stays quick. */

type Item = { id: string; name: string; storyId: string; title: string; at: string };

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function usePicture(id: string | null): string | null {
  const [got, setGot] = useState<{ id: string; image: string } | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    fetch(`/api/colouring?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (live && d.ok) setGot({ id, image: d.image });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);
  return got && got.id === id ? got.image : null;
}

function Card({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const image = usePicture(item.id);
  return (
    <button
      onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-2 ring-amber-100 transition-transform hover:-translate-y-0.5 active:scale-95 dark:bg-zinc-900"
    >
      <div className="aspect-square w-full bg-zinc-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${item.name}'s colouring of ${item.title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-3xl opacity-40">🖍️</div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-extrabold text-amber-900 dark:text-amber-100">{item.name}</p>
        <p className="truncate text-xs font-semibold text-zinc-500">{item.title}</p>
        <p className="text-[11px] text-zinc-400">{when(item.at)}</p>
      </div>
    </button>
  );
}

function Big({
  item,
  onClose,
  onDelete,
}: {
  item: Item;
  onClose: () => void;
  onDelete: () => void;
}) {
  const image = usePicture(item.id);
  const [sure, setSure] = useState(false);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg flex-col gap-3 rounded-3xl bg-white p-4 shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-amber-900 dark:text-amber-100">{item.name}</p>
            <p className="text-sm font-semibold text-zinc-500">
              {item.title} · {when(item.at)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl text-zinc-400">
            ✕
          </button>
        </div>
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-zinc-50">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={`${item.name}'s colouring of ${item.title}`} className="h-full w-full" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={image ?? undefined}
            download={`${item.name}-${item.title}.jpg`.replace(/[^a-z0-9.]+/gi, "-")}
            className={`rounded-2xl bg-brand-600 px-3 py-2.5 text-center font-extrabold text-white shadow-md active:scale-95 ${
              image ? "" : "pointer-events-none opacity-40"
            }`}
          >
            💾 Save
          </a>
          <button
            onClick={() => (sure ? onDelete() : setSure(true))}
            className="rounded-2xl bg-rose-50 px-3 py-2.5 font-extrabold text-rose-600 active:scale-95"
          >
            {sure ? "Tap again to delete" : "🗑️ Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ColouringGallery({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "off" | "error">("loading");
  const [who, setWho] = useState("");
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    fetch("/api/colouring")
      .then((r) => r.json())
      .then((d) => {
        if (d.configured === false) return setState("off");
        if (!d.ok) return setState("error");
        setItems(d.items);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, []);

  const names = useMemo(
    () => [...new Set((items ?? []).map((i) => i.name))].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const shown = (items ?? []).filter((i) => !who || i.name === who);

  async function remove(item: Item) {
    setOpen(null);
    setItems((list) => (list ?? []).filter((i) => i.id !== item.id));
    await fetch("/api/colouring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "delete", id: item.id }),
    }).catch(() => {});
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Stories
        </button>
        <h2 className="text-xl font-extrabold text-amber-900 dark:text-amber-100">🖼️ Colouring sent in</h2>
        <span className="w-20" />
      </div>

      {state === "loading" && <p className="mt-10 font-semibold text-zinc-400">Loading…</p>}
      {state === "off" && (
        <p className="mt-10 text-center font-semibold text-zinc-500">
          Saving children&apos;s work isn&apos;t switched on for this app yet.
        </p>
      )}
      {state === "error" && (
        <p className="mt-10 text-center font-semibold text-rose-600">
          Couldn&apos;t load the colouring. Check the internet and try again.
        </p>
      )}

      {state === "ok" && items && (
        <>
          {items.length === 0 ? (
            <p className="mt-10 text-center font-semibold text-zinc-500">
              Nothing yet. When a child taps 📤 Submit on a colouring page, it shows up here.
            </p>
          ) : (
            <>
              <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setWho("")}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                    !who ? "bg-amber-500 text-white" : "bg-white text-amber-800 shadow-sm"
                  }`}
                >
                  Everyone ({items.length})
                </button>
                {names.map((n) => (
                  <button
                    key={n}
                    onClick={() => setWho(n)}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                      who === n ? "bg-amber-500 text-white" : "bg-white text-amber-800 shadow-sm"
                    }`}
                  >
                    {n} ({items.filter((i) => i.name === n).length})
                  </button>
                ))}
              </div>
              <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {shown.map((item) => (
                  <Card key={item.id} item={item} onOpen={() => setOpen(item)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {open && <Big item={open} onClose={() => setOpen(null)} onDelete={() => remove(open)} />}
    </div>
  );
}
