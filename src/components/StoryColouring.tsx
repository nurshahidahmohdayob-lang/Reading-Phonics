"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@/app/stories";
import { COLOURING_SCENES } from "@/app/colouringScenes";
import { chime } from "@/lib/speak";

/* A colouring page for one story: the story's own picture large in the
   middle, three pictures from the story along the hills, a sun and a cloud.
   Two stacked canvases — paint underneath, black outlines on top — so a
   tap-fill always stops at the outlines, whatever colour is already there. */

const SIZE = 800;
const COLOURS = [
  "#ef4444", "#f97316", "#facc15", "#22c55e", "#15803d", "#38bdf8",
  "#2563eb", "#a855f7", "#ec4899", "#a16207", "#fcd9b6", "#9ca3af",
  "#111827", "#ffffff",
];

type Tool = "fill" | "brush";

/** Walls are thickened this many pixels, so the small gaps some drawings
    leave in their outlines do not let a fill spill into the next space. */
const GAP = 5;

function thicken(ink: Uint8Array, r: number): Uint8Array {
  const across = new Uint8Array(ink.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      for (let d = -r; d <= r; d++) {
        const xx = x + d;
        if (xx >= 0 && xx < SIZE && ink[y * SIZE + xx]) {
          across[y * SIZE + x] = 1;
          break;
        }
      }
    }
  }
  const out = new Uint8Array(ink.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      for (let d = -r; d <= r; d++) {
        const yy = y + d;
        if (yy >= 0 && yy < SIZE && across[yy * SIZE + x]) {
          out[y * SIZE + x] = 1;
          break;
        }
      }
    }
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The scene's outlines: frame, sun, cloud, hills and the story pictures. */
async function drawOutlines(ctx: CanvasRenderingContext2D, codes: string[]) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 8;

  // Frame
  ctx.strokeRect(6, 6, SIZE - 12, SIZE - 12);

  // Sun with rays, top left
  ctx.beginPath();
  ctx.arc(95, 95, 45, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(95 + Math.cos(a) * 60, 95 + Math.sin(a) * 60);
    ctx.lineTo(95 + Math.cos(a) * 80, 95 + Math.sin(a) * 80);
    ctx.stroke();
  }

  // Cloud, top right
  ctx.beginPath();
  ctx.moveTo(630, 120);
  ctx.arc(660, 105, 30, Math.PI * 0.75, Math.PI * 1.6);
  ctx.arc(705, 85, 35, Math.PI * 1.1, Math.PI * 1.95);
  ctx.arc(745, 110, 25, Math.PI * 1.4, Math.PI * 0.4);
  ctx.lineTo(630, 130);
  ctx.closePath();
  ctx.stroke();

  // Two rolling hills
  ctx.beginPath();
  ctx.moveTo(6, 600);
  ctx.bezierCurveTo(180, 520, 330, 520, 450, 590);
  ctx.bezierCurveTo(560, 650, 680, 540, SIZE - 6, 580);
  ctx.stroke();

  const [main, ...rest] = codes;
  const imgs = await Promise.all(codes.map((c) => loadImage(`/colouring/${c}.svg`)));
  // OpenMoji art sits on a 72-unit grid with a little margin; scale so the
  // 2-unit lines come out bold enough to fill between.
  if (imgs[0] && main) ctx.drawImage(imgs[0], 190, 90, 420, 420);
  const spots = [
    { x: 40, y: 600 },
    { x: 310, y: 610 },
    { x: 580, y: 600 },
  ];
  rest.forEach((_, i) => {
    const img = imgs[i + 1];
    if (img && spots[i]) ctx.drawImage(img, spots[i].x, spots[i].y, 180, 180);
  });
}

export default function StoryColouring({
  story,
  onClose,
}: {
  story: Story;
  onClose: () => void;
}) {
  const paintRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const wall = useRef<Uint8Array | null>(null);
  const history = useRef<ImageData[]>([]);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>("fill");
  const [colour, setColour] = useState(COLOURS[0]);
  const [brush, setBrush] = useState(18);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const codes = COLOURING_SCENES[story.id] ?? [];

  const clearPaint = useCallback(() => {
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const line = lineRef.current?.getContext("2d", { willReadFrequently: true });
      if (!line) return;
      clearPaint();
      await drawOutlines(line, codes);
      if (!live) return;
      // Any pixel with real ink in it is a wall the fill cannot cross.
      const data = line.getImageData(0, 0, SIZE, SIZE).data;
      const ink = new Uint8Array(SIZE * SIZE);
      for (let i = 0; i < ink.length; i++) ink[i] = data[i * 4 + 3] > 90 ? 1 : 0;
      wall.current = thicken(ink, GAP);
      setReady(true);
    })();
    return () => {
      live = false;
    };
    // The scene only changes with the story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id, clearPaint]);

  function snapshot() {
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx) return;
    history.current.push(ctx.getImageData(0, 0, SIZE, SIZE));
    if (history.current.length > 25) history.current.shift();
    setCanUndo(true);
  }

  function undo() {
    const ctx = paintRef.current?.getContext("2d");
    const last = history.current.pop();
    if (ctx && last) ctx.putImageData(last, 0, 0);
    setCanUndo(history.current.length > 0);
  }

  function point(e: React.PointerEvent): { x: number; y: number } {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - r.left) / r.width) * SIZE),
      y: Math.round(((e.clientY - r.top) / r.height) * SIZE),
    };
  }

  function fill(x: number, y: number) {
    const ctx = paintRef.current?.getContext("2d");
    const w = wall.current;
    if (!ctx || !w || x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    if (w[y * SIZE + x]) return;
    snapshot();
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const px = img.data;
    const r = parseInt(colour.slice(1, 3), 16);
    const g = parseInt(colour.slice(3, 5), 16);
    const b = parseInt(colour.slice(5, 7), 16);
    const seen = new Uint8Array(SIZE * SIZE);
    const stack = [y * SIZE + x];
    seen[y * SIZE + x] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      px[p * 4] = r;
      px[p * 4 + 1] = g;
      px[p * 4 + 2] = b;
      px[p * 4 + 3] = 255;
      const px0 = p % SIZE;
      const near = [
        px0 > 0 ? p - 1 : -1,
        px0 < SIZE - 1 ? p + 1 : -1,
        p - SIZE,
        p + SIZE,
      ];
      for (const n of near) {
        if (n < 0 || n >= w.length || seen[n] || w[n]) continue;
        seen[n] = 1;
        stack.push(n);
      }
    }
    // The thickened walls leave a white band beside each line; grow the
    // colour back out across it (under the real line is hidden anyway).
    let edge: number[] = [];
    for (let p = 0; p < w.length; p++) if (seen[p] === 1) edge.push(p);
    for (let step = 0; step <= GAP + 1; step++) {
      const next: number[] = [];
      for (const p of edge) {
        const x0 = p % SIZE;
        const near = [x0 > 0 ? p - 1 : -1, x0 < SIZE - 1 ? p + 1 : -1, p - SIZE, p + SIZE];
        for (const n of near) {
          if (n < 0 || n >= w.length || seen[n]) continue;
          seen[n] = 2;
          px[n * 4] = r;
          px[n * 4 + 1] = g;
          px[n * 4 + 2] = b;
          px[n * 4 + 3] = 255;
          next.push(n);
        }
      }
      edge = next;
    }
    ctx.putImageData(img, 0, 0);
    chime(true);
  }

  function stroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = paintRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = colour;
    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function down(e: React.PointerEvent) {
    if (!ready) return;
    const p = point(e);
    if (tool === "fill") {
      fill(p.x, p.y);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    drawing.current = p;
    stroke(p, p);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const p = point(e);
    stroke(drawing.current, p);
    drawing.current = p;
  }

  function up() {
    drawing.current = null;
  }

  function save() {
    const paint = paintRef.current;
    const line = lineRef.current;
    if (!paint || !line) return;
    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(paint, 0, 0);
    ctx.drawImage(line, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `${story.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-colouring.png`;
    a.click();
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          onClick={onClose}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Stories
        </button>
        <h2 className="text-center text-xl font-extrabold text-amber-900 dark:text-amber-100">
          🖍️ Colour: {story.title}
        </h2>
        <span className="w-20" />
      </div>
      <p className="mt-1 text-center text-sm font-semibold text-zinc-500">
        {tool === "fill"
          ? "Pick a colour, then tap a space to fill it 🪣"
          : "Pick a colour and draw with your finger 🖌️"}
      </p>

      <div className="mt-3 flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
        {/* The page */}
        <div
          className="relative aspect-square w-full max-w-[560px] touch-none overflow-hidden rounded-3xl bg-white shadow-lg ring-4 ring-amber-200"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <canvas ref={paintRef} width={SIZE} height={SIZE} className="absolute inset-0 h-full w-full" />
          <canvas
            ref={lineRef}
            width={SIZE}
            height={SIZE}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center text-lg font-bold text-zinc-400">
              Getting your page ready…
            </div>
          )}
        </div>

        {/* Tools */}
        <div className="flex w-full max-w-[560px] flex-col gap-3 lg:w-56">
          <div className="grid grid-cols-2 gap-2">
            {(["fill", "brush"] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`rounded-2xl px-3 py-2.5 text-base font-extrabold shadow-sm active:scale-95 ${
                  tool === t ? "bg-amber-500 text-white" : "bg-white text-amber-800 dark:bg-zinc-800"
                }`}
              >
                {t === "fill" ? "🪣 Fill" : "🖌️ Brush"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900 lg:grid-cols-4">
            {COLOURS.map((c) => (
              <button
                key={c}
                onClick={() => setColour(c)}
                aria-label={`Colour ${c}`}
                style={{ background: c }}
                className={`aspect-square w-full rounded-full ring-2 active:scale-90 ${
                  colour === c ? "scale-110 ring-4 ring-amber-500" : "ring-zinc-200"
                }`}
              />
            ))}
          </div>

          {tool === "brush" && (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
              {[8, 18, 34].map((s) => (
                <button
                  key={s}
                  onClick={() => setBrush(s)}
                  aria-label={`Brush size ${s}`}
                  className={`grid h-12 w-12 place-items-center rounded-full ${
                    brush === s ? "bg-amber-100 ring-2 ring-amber-500" : "bg-zinc-50"
                  }`}
                >
                  <span className="rounded-full" style={{ width: s / 1.4, height: s / 1.4, background: colour }} />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded-2xl bg-white px-3 py-2.5 font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
            >
              ↩️ Undo
            </button>
            <button
              onClick={() => {
                snapshot();
                clearPaint();
              }}
              className="rounded-2xl bg-white px-3 py-2.5 font-bold text-rose-600 shadow-sm active:scale-95 dark:bg-zinc-800"
            >
              🧽 Start again
            </button>
            <button
              onClick={save}
              className="rounded-2xl bg-brand-600 px-3 py-2.5 font-extrabold text-white shadow-md active:scale-95"
            >
              💾 Save picture
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400">
        Pictures: OpenMoji (openmoji.org), CC BY-SA 4.0
      </p>
    </div>
  );
}
