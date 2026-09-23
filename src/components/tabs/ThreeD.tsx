"use client";

/* 3D Drawings — a child draws on paper, we photograph it, and the drawing
   walks around a scene in the app.

   The photo's paper is removed in the browser (lib/cutout.ts), leaving the
   drawing on a transparent background. Saved drawings (lib/drawingStore.ts,
   on this device) are then cut out of card and stood up in a real 3D scene
   (Stage3D): they roam the jungle floor, turn to face where they're going,
   show their own edge as they turn, and cast a shadow on the ground. */

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import qrcode from "qrcode-generator";
import { cutOutDrawing } from "@/lib/cutout";
import { publicSiteBase } from "@/lib/reportLink";
import {
  useDrawings,
  saveDrawing,
  removeDrawing,
  renameDrawing,
  type Drawing,
} from "@/lib/drawingStore";
import type { Actor3D } from "./Stage3D";

/* three.js is a big library, and only this section needs it — so it's
   fetched when the section opens, not with the rest of the app. */
const Stage3D = dynamic(() => import("./Stage3D"), {
  ssr: false,
  loading: () => null,
});

type Move = "alive" | "still" | "walk" | "float" | "spin" | "jump";

const MOVES: { id: Move; label: string }[] = [
  { id: "alive", label: "✨ Alive" },
  { id: "still", label: "🧍 Still" },
  { id: "walk", label: "🚶 Walk" },
  { id: "float", label: "🎈 Float" },
  { id: "spin", label: "🌀 Spin" },
  { id: "jump", label: "⭐ Jump" },
];

type Actor = {
  /** One drawing can be on the stage more than once. */
  key: string;
  drawingId: string;
  scale: number;
  move: Move;
};

export default function ThreeD() {
  const { drawings, loading } = useDrawings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** The drawing that just arrived, still nameless. */
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [name, setName] = useState("");

  // Pairing a phone: the screen shows a code, the phone sends drawings to it.
  const [pairing, setPairing] = useState<{
    code: string;
    got: number;
    note: string;
  } | null>(null);
  const [pairingBusy, setPairingBusy] = useState(false);

  const [actors, setActors] = useState<Actor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const cut = await cutOutDrawing(file);
      // Straight into the jungle — no "keep it?" to press first. The name
      // can be typed afterwards, or left alone.
      const saved = await saveDrawing({
        name: "My drawing",
        dataUrl: cut.dataUrl,
        width: cut.width,
        height: cut.height,
      });
      addToStage(saved);
      setJustAdded(saved.id);
      setName("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "I couldn't read that picture. Try again.",
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function nameIt() {
    if (!justAdded || !name.trim()) return;
    await renameDrawing(justAdded, name.trim());
    setJustAdded(null);
    setName("");
  }

  function addToStage(d: Drawing) {
    const key = `${d.id}-${Date.now().toString(36)}`;
    // Pick it straight away, so what it can do is on screen without having
    // to know to tap it first.
    setSelected(key);
    setActors((list) => [
      ...list,
      {
        key,
        drawingId: d.id,
        scale: 1,
        // Moving from the moment it lands, rather than waiting to be told.
        move: "alive",
      },
    ]);
  }

  async function startPairing() {
    setPairingBusy(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const data = await res.json();
      if (data?.configured === false) {
        setError(
          "Sending from a phone needs the app's cloud storage, which isn't connected here.",
        );
        return;
      }
      if (!data?.ok || typeof data.code !== "string") {
        setError("Couldn't start the phone link. Try again.");
        return;
      }
      setError("");
      setPairing({ code: data.code, got: 0, note: "" });
    } catch {
      setError("Couldn't start the phone link. Try again.");
    } finally {
      setPairingBusy(false);
    }
  }

  // While the code is on screen, watch for drawings the phone sends.
  const code = pairing?.code;
  useEffect(() => {
    if (!code) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (stop) return;
        if (data?.expired) {
          setPairing((p) =>
            p ? { ...p, note: "That code has run out — start a new one." } : p,
          );
          return;
        }
        const items = (data?.items ?? []) as {
          dataUrl: string;
          width: number;
          height: number;
        }[];
        for (const item of items) {
          const saved = await saveDrawing({
            name: "Scanned drawing",
            dataUrl: item.dataUrl,
            width: item.width,
            height: item.height,
          });
          if (stop) return;
          addToStage(saved);
        }
        if (items.length) {
          setPairing((p) =>
            p
              ? {
                  ...p,
                  got: p.got + items.length,
                  note: `✓ ${items.length === 1 ? "A drawing" : `${items.length} drawings`} arrived`,
                }
              : p,
          );
        }
      } catch {
        /* a dropped poll is nothing to worry about */
      }
    };
    const timer = setInterval(() => void tick(), 2500);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [code]);

  function update(key: string, patch: Partial<Actor>) {
    setActors((list) =>
      list.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    );
  }

  const chosen = actors.find((a) => a.key === selected) ?? null;

  // What the 3D stage needs: the picture itself, not our bookkeeping. Held
  // steady between renders so the scene isn't rebuilt for nothing.
  const pictures = useMemo(
    () => new Map(drawings.map((d) => [d.id, d.dataUrl])),
    [drawings],
  );
  const stageActors: Actor3D[] = useMemo(
    () =>
      actors.flatMap((a) => {
        const dataUrl = pictures.get(a.drawingId);
        return dataUrl
          ? [{ key: a.key, dataUrl, move: a.move, scale: a.scale }]
          : [];
      }),
    [actors, pictures],
  );

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="mt-2 w-full rounded-[2rem] bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] px-6 py-6 text-center text-violet-800 shadow-lg ring-4 ring-white/60">
        <div className="text-5xl">🪄</div>
        <h2 className="mt-1 text-2xl font-extrabold">3D Drawings</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm font-semibold opacity-80">
          Draw on paper, take a picture of it, and watch your drawing come off
          the page and move around.
        </p>
      </div>

      {/* Scan */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="mt-4 rounded-full bg-brand-600 px-7 py-3 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
      >
        {busy ? "✨ Cutting it out…" : "📷 Scan a drawing"}
      </button>
      <button
        onClick={() => (pairing ? setPairing(null) : void startPairing())}
        disabled={pairingBusy}
        className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200"
      >
        {pairingBusy
          ? "⏳ Getting a code…"
          : pairing
            ? "✕ Stop using my phone"
            : "📱 Scan with my phone"}
      </button>
      <p className="mt-1 max-w-sm text-center text-xs font-semibold text-zinc-400">
        On a phone or tablet this opens the camera — or a photo you&apos;ve
        already taken. Lay the drawing flat in good light, with all of it in the
        picture.
      </p>

      {pairing && (
        <PairingCard
          code={pairing.code}
          got={pairing.got}
          note={pairing.note}
        />
      )}
      {error && (
        <p className="mt-2 max-w-md text-center text-sm font-bold text-rose-500">
          {error}
        </p>
      )}

      {justAdded && (
        <div className="mt-3 flex w-full max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:ring-emerald-900/50">
          <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
            ✓ It&apos;s in the jungle
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void nameIt();
            }}
            placeholder="Name it (My dragon)"
            className="min-w-[150px] flex-1 rounded-xl border-2 border-emerald-200 bg-white px-3 py-1.5 text-sm font-bold text-zinc-700 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={() => void nameIt()}
            disabled={!name.trim()}
            className="rounded-full bg-[#0A4F29] px-4 py-1.5 text-xs font-bold text-white active:scale-95 disabled:opacity-40"
          >
            Save name
          </button>
          <button
            onClick={() => {
              setJustAdded(null);
              setName("");
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-zinc-500 ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800"
          >
            Skip
          </button>
        </div>
      )}

      {/* The stage */}
      <div
        className="relative mt-5 w-full overflow-hidden rounded-[2rem] shadow-lg ring-4 ring-white/60"
        style={{ aspectRatio: "16 / 9" }}
      >
        <Backdrop />

        <Stage3D
          actors={stageActors}
          selectedKey={selected}
          playing={playing}
          onSelect={setSelected}
        />

        {!actors.length && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-bold text-white drop-shadow">
            {drawings.length
              ? "Tap a drawing below to put it on the stage."
              : "Scan a drawing to bring it here."}
          </p>
        )}

        <button
          onClick={() => setPlaying((p) => !p)}
          className="absolute right-3 top-3 rounded-full bg-white/90 px-4 py-1.5 text-xs font-extrabold text-zinc-700 shadow active:scale-95"
        >
          {playing ? "⏸ Pause" : "▶️ Play"}
        </button>
        {actors.length > 0 && (
          <button
            onClick={() => {
              setActors([]);
              setSelected(null);
            }}
            className="absolute left-3 top-3 rounded-full bg-white/90 px-4 py-1.5 text-xs font-extrabold text-zinc-700 shadow active:scale-95"
          >
            ✨ Clear stage
          </button>
        )}
      </div>

      {/* What the chosen drawing does */}
      {chosen && (
        <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          {MOVES.map((m) => (
            <button
              key={m.id}
              onClick={() => update(chosen.key, { move: m.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold active:scale-95 ${
                chosen.move === m.id
                  ? "bg-brand-600 text-white shadow"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {m.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          <button
            onClick={() =>
              update(chosen.key, { scale: Math.max(0.3, chosen.scale - 0.15) })
            }
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-extrabold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ➖ Smaller
          </button>
          <button
            onClick={() =>
              update(chosen.key, { scale: Math.min(2.5, chosen.scale + 0.15) })
            }
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-extrabold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ➕ Bigger
          </button>
          <button
            onClick={() => {
              setActors((list) => list.filter((a) => a.key !== chosen.key));
              setSelected(null);
            }}
            className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-extrabold text-rose-600 active:scale-95 dark:bg-rose-950/50 dark:text-rose-300"
          >
            🗑️ Take off
          </button>
        </div>
      )}

      {/* Saved drawings */}
      <div className="mt-5 w-full">
        <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
          My drawings {drawings.length > 0 && `(${drawings.length})`}
        </h3>
        {loading ? (
          <p className="mt-2 text-xs font-semibold text-zinc-400">Looking…</p>
        ) : drawings.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-zinc-400">
            Nothing yet. Scan a drawing and it&apos;s kept here on this device.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {drawings.map((d) => (
              <div key={d.id} className="relative">
                <button
                  onClick={() => addToStage(d)}
                  title={`Put ${d.name} on the stage`}
                  className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition-transform active:scale-95 dark:bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.dataUrl}
                    alt={d.name}
                    className="h-16 w-full object-contain"
                  />
                  <span className="w-full truncate text-center text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    {d.name}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete “${d.name}”?`))
                      void removeDrawing(d.id);
                  }}
                  aria-label={`Delete ${d.name}`}
                  className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white text-xs shadow ring-2 ring-rose-100 active:scale-90"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** What the drawings stand in front of: a film of a jungle path, trees and
    leaves stirring at the sides and the path itself left clear for the
    drawings to stand on. It loops quietly behind the stage and takes no taps
    — the drawings on top do. Muted and inline, so it plays on its own on a
    phone as well as the class screen. */
function Backdrop() {
  return (
    <video
      aria-hidden
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/video/jungle-poster.jpg"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    >
      <source src="/video/jungle.mp4" type="video/mp4" />
    </video>
  );
}

/** The code the phone scans. Whoever holds it can send a drawing to this
    screen for the next quarter of an hour, and nothing else. */
function PairingCard({
  code,
  got,
  note,
}: {
  code: string;
  got: number;
  note: string;
}) {
  const url = `${publicSiteBase()}/scan#${code}`;
  // Type 0 lets the library choose a size that fits; M survives a phone
  // camera pointed at a screen from across a table.
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  return (
    <div className="mt-4 flex w-full max-w-md flex-col items-center gap-2 rounded-[2rem] bg-white p-5 text-center shadow-lg ring-4 ring-white/60 dark:bg-zinc-900">
      <p className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
        📱 Point your phone&apos;s camera at this
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr.createDataURL(6, 2)}
        alt="QR code linking your phone to this screen"
        className="h-44 w-44 rounded-xl"
      />
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Then photograph a child&apos;s drawing, and it appears here.
      </p>
      <p className="text-[11px] font-semibold text-zinc-400">
        The code lasts 15 minutes · {got} sent so far
      </p>
      {note && (
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {note}
        </p>
      )}
    </div>
  );
}
