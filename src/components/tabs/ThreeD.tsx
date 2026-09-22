"use client";

/* 3D Drawings — a child draws on paper, we photograph it, and the drawing
   walks around a scene in the app.

   The photo's paper is removed in the browser (lib/cutout.ts), leaving the
   drawing on a transparent background. Saved drawings (lib/drawingStore.ts,
   on this device) can then be dropped onto the stage, dragged, resized,
   flipped and given a movement — walking, floating, spinning or jumping —
   with a little perspective and a shadow so they stand in the scene rather
   than sit on top of it. */

import { useRef, useState } from "react";
import { cutOutDrawing, type Cutout } from "@/lib/cutout";
import {
  useDrawings,
  saveDrawing,
  removeDrawing,
  type Drawing,
} from "@/lib/drawingStore";

type Move = "still" | "walk" | "float" | "spin" | "jump";

const MOVES: { id: Move; label: string }[] = [
  { id: "still", label: "🧍 Still" },
  { id: "walk", label: "🚶 Walk" },
  { id: "float", label: "🎈 Float" },
  { id: "spin", label: "🌀 Spin" },
  { id: "jump", label: "⭐ Jump" },
];

const ANIMATION: Record<Move, string> = {
  still: "none",
  walk: "draw-walk 3.6s ease-in-out infinite alternate",
  float: "draw-float 2.6s ease-in-out infinite alternate",
  spin: "draw-spin 5s linear infinite",
  jump: "draw-jump 1.5s ease-in-out infinite",
};

type Actor = {
  /** One drawing can be on the stage more than once. */
  key: string;
  drawingId: string;
  /** Where it stands, in % of the stage. */
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  move: Move;
};

export default function ThreeD() {
  const { drawings, loading } = useDrawings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Cutout | null>(null);
  const [name, setName] = useState("");

  const [actors, setActors] = useState<Actor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const cut = await cutOutDrawing(file);
      setPending(cut);
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

  async function keepIt() {
    if (!pending) return;
    const saved = await saveDrawing({
      name: name.trim() || "My drawing",
      dataUrl: pending.dataUrl,
      width: pending.width,
      height: pending.height,
    });
    setPending(null);
    setName("");
    addToStage(saved);
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
        x: 20 + ((list.length * 23) % 60),
        y: 62,
        scale: 1,
        flip: false,
        move: "still",
      },
    ]);
  }

  function update(key: string, patch: Partial<Actor>) {
    setActors((list) =>
      list.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    );
  }

  const chosen = actors.find((a) => a.key === selected) ?? null;
  const byId = new Map(drawings.map((d) => [d.id, d]));

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
      <p className="mt-1 max-w-sm text-center text-xs font-semibold text-zinc-400">
        On a phone or tablet this opens the camera — or a photo you&apos;ve
        already taken. Lay the drawing flat in good light, with all of it in the
        picture.
      </p>
      {error && (
        <p className="mt-2 max-w-md text-center text-sm font-bold text-rose-500">
          {error}
        </p>
      )}

      {/* Just scanned — name it and keep it */}
      {pending && (
        <div className="mt-4 flex w-full flex-col items-center gap-3 rounded-[2rem] bg-white p-5 shadow-lg ring-4 ring-white/60 dark:bg-zinc-900">
          <p className="text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
            Here it is, off the paper ✂️
          </p>
          <div className="grid h-52 w-full place-items-center rounded-2xl bg-gradient-to-b from-[#A6D9FF] to-[#E9F6FF]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pending.dataUrl}
              alt="Your scanned drawing"
              className="max-h-48 max-w-[80%] object-contain drop-shadow-lg"
            />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Give it a name (My dragon)"
            className="w-full max-w-xs rounded-2xl border-4 border-violet-200 bg-white px-4 py-2.5 text-center font-bold text-zinc-700 outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void keepIt()}
              className="rounded-full bg-brand-600 px-6 py-2.5 font-extrabold text-white shadow active:scale-95"
            >
              ✅ Keep it
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
            >
              🔁 Take another
            </button>
            <button
              onClick={() => setPending(null)}
              className="rounded-full bg-zinc-100 px-5 py-2.5 font-bold text-zinc-500 active:scale-95 dark:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* The stage */}
      <div
        className="relative mt-5 w-full overflow-hidden rounded-[2rem] shadow-lg ring-4 ring-white/60"
        style={{ aspectRatio: "16 / 9", perspective: "900px" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#CDEAD9]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-[#BDE3C7] to-[#8FCDA4]" />

        {actors.map((a) => {
          const d = byId.get(a.drawingId);
          if (!d) return null;
          return (
            <StageActor
              key={a.key}
              actor={a}
              drawing={d}
              playing={playing}
              selected={selected === a.key}
              onSelect={() => setSelected(a.key)}
              onMove={(x, y) => update(a.key, { x, y })}
            />
          );
        })}

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
            onClick={() => update(chosen.key, { flip: !chosen.flip })}
            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-extrabold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ↔️ Turn around
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

/** One drawing standing on the stage: draggable, with a shadow under it. */
function StageActor({
  actor,
  drawing,
  playing,
  selected,
  onSelect,
  onMove,
}: {
  actor: Actor;
  drawing: Drawing;
  playing: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    onSelect();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const stage = e.currentTarget.parentElement;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    onMove(Math.min(97, Math.max(3, x)), Math.min(96, Math.max(12, y)));
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="absolute cursor-grab touch-none active:cursor-grabbing"
      style={{
        left: `${actor.x}%`,
        top: `${actor.y}%`,
        transform: `translate(-50%, -100%) scale(${actor.scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div
        style={{
          animation: playing ? ANIMATION[actor.move] : "none",
          transformStyle: "preserve-3d",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={drawing.dataUrl}
          alt={drawing.name}
          draggable={false}
          className="h-28 w-auto select-none object-contain sm:h-36"
          style={{
            transform: `rotateY(${actor.flip ? 180 : 0}deg)`,
            filter: selected
              ? "drop-shadow(0 8px 10px rgba(0,0,0,.35))"
              : "drop-shadow(0 6px 8px rgba(0,0,0,.28))",
            outline: selected ? "3px dashed rgba(124,58,237,.8)" : "none",
            outlineOffset: "6px",
            borderRadius: "8px",
          }}
        />
      </div>
      {/* the shadow it stands in */}
      <div
        aria-hidden
        className="mx-auto h-3 w-20 rounded-[50%] bg-black/25 blur-[3px] sm:w-24"
        style={{ transform: "translateY(-4px)" }}
      />
    </div>
  );
}
