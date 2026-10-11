"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@/app/stories";
import { COLOURING_SCENES } from "@/app/colouringScenes";
import { chime } from "@/lib/speak";

/* A colouring page for one story: the story's own picture large in the
   middle, three pictures from the story along the hills, a sun and a cloud.
   Two stacked canvases — paint underneath, black outlines on top — so the
   brush never paints over the lines. */

const SIZE = 800;
const COLOURS = [
  "#ef4444", "#f97316", "#facc15", "#22c55e", "#15803d", "#38bdf8",
  "#2563eb", "#a855f7", "#ec4899", "#a16207", "#fcd9b6", "#9ca3af",
  "#111827", "#ffffff",
];

/** Brush sizes on the 800-pixel page. */
const SIZES = [
  { label: "Small", px: 10 },
  { label: "Medium", px: 22 },
  { label: "Big", px: 40 },
];

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
  // 2-unit lines come out bold and easy to see.
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
  shareCode,
}: {
  story: Story;
  /** Back to the story list; left out on a shared link, which has nowhere to go back to. */
  onClose?: () => void;
  /** Set on a shared link (/colour): sends the picture to that teacher without a sign-in. */
  shareCode?: string;
}) {
  const paintRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const [colour, setColour] = useState(COLOURS[0]);
  const [brush, setBrush] = useState(SIZES[1].px);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  // The child types their name before colouring; it goes with the picture.
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [send, setSend] = useState<"idle" | "sending" | "sent" | "error" | "off">("idle");
  const [link, setLink] = useState<{ url: string; copied: boolean } | "loading" | "error" | null>(null);

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
      const line = lineRef.current?.getContext("2d");
      if (!line) return;
      clearPaint();
      await drawOutlines(line, codes);
      if (!live) return;
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

  /** The finished page, outlines on top, as a JPEG small enough to send. */
  function picture(): string | null {
    const paint = paintRef.current;
    const line = lineRef.current;
    if (!paint || !line) return null;
    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(paint, 0, 0);
    ctx.drawImage(line, 0, 0);
    return out.toDataURL("image/jpeg", 0.82);
  }

  async function submit() {
    const image = picture();
    if (!image || !name) return;
    setSend("sending");
    try {
      const res = await fetch("/api/colouring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "submit",
          ...(shareCode ? { code: shareCode } : {}),
          storyId: story.id,
          title: story.title,
          name,
          image,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.configured === false) return setSend("off");
      setSend(res.ok && d.ok ? "sent" : "error");
      if (res.ok && d.ok) chime(true);
    } catch {
      setSend("error");
    }
  }

  /** The link children open to colour this page on their own device. */
  async function shareLink() {
    setLink("loading");
    try {
      const res = await fetch("/api/colouring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "link" }),
      });
      const d = await res.json();
      if (!d.ok) return setLink("error");
      const url = `${location.origin}/colour#${d.code}-${story.id}`;
      let copied = false;
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {}
      setLink({ url, copied });
    } catch {
      setLink("error");
    }
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between gap-3">
        {onClose ? (
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ← Stories
          </button>
        ) : (
          <span className="w-20" />
        )}
        <h2 className="text-center text-xl font-extrabold text-amber-900 dark:text-amber-100">
          🖍️ Colour: {story.title}
        </h2>
        {shareCode ? (
          <span className="w-20" />
        ) : (
          <button
            onClick={shareLink}
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-brand-700 shadow-sm ring-2 ring-brand-200 active:scale-95 dark:bg-zinc-800"
          >
            🔗 Link for students
          </button>
        )}
      </div>
      {link && (
        <div className="mt-3 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-sm ring-2 ring-brand-200 dark:bg-zinc-900">
          {link === "loading" && <p className="text-center font-semibold text-zinc-500">Making the link…</p>}
          {link === "error" && (
            <p className="text-center font-semibold text-rose-600">
              Couldn&apos;t make the link. Check the internet and try again.
            </p>
          )}
          {typeof link === "object" && (
            <>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {link.copied ? "✅ Copied! " : ""}Share this with your students. They type their name,
                colour, and tap Submit — it comes to your 🖼️ Colouring sent in.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  readOnly
                  value={link.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-xl border-2 border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link.url);
                      setLink({ ...link, copied: true });
                    } catch {}
                  }}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white active:scale-95"
                >
                  📋 Copy
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-extrabold text-zinc-700 active:scale-95"
                >
                  Open
                </a>
              </div>
            </>
          )}
        </div>
      )}
      {name && (
        <p className="mt-1 text-center text-sm font-semibold text-zinc-500">
          🧒 <span className="font-extrabold text-amber-800">{name}</span> · pick a colour and a
          brush size, then draw with your finger 🖌️
        </p>
      )}

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
          {/* Name first, then colour */}
          {!name && (
            <form
              onPointerDown={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                if (nameDraft.trim()) setName(nameDraft.trim().replace(/\s+/g, " "));
              }}
              className="absolute inset-0 grid place-items-center bg-white/80 p-6 backdrop-blur-sm"
            >
              <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-xl ring-4 ring-amber-200">
                <span className="text-4xl">👋</span>
                <label htmlFor="colour-name" className="text-lg font-extrabold text-amber-900">
                  What is your name?
                </label>
                <input
                  id="colour-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  autoFocus
                  autoComplete="off"
                  placeholder="Type your name"
                  className="w-full rounded-2xl border-2 border-amber-200 px-4 py-3 text-center text-lg font-bold text-zinc-800 outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!nameDraft.trim()}
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-40"
                >
                  Start colouring 🖍️
                </button>
              </div>
            </form>
          )}
          {/* Sent */}
          {send === "sent" && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 grid place-items-center bg-white/85 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-xl ring-4 ring-green-300">
                <span className="text-5xl">🎉</span>
                <p className="text-xl font-extrabold text-green-700">Sent to your teacher!</p>
                <p className="font-semibold text-zinc-500">Well done, {name}.</p>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="rounded-2xl bg-green-500 px-5 py-2.5 font-extrabold text-white shadow-md active:scale-95"
                  >
                    Back to stories
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tools */}
        <div className="flex w-full max-w-[560px] flex-col gap-3 lg:w-56">
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

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
            {SIZES.map((sz) => (
              <button
                key={sz.label}
                onClick={() => setBrush(sz.px)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-extrabold active:scale-95 ${
                  brush === sz.px
                    ? "bg-amber-100 text-amber-900 ring-2 ring-amber-500"
                    : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <span className="grid h-8 place-items-center">
                  <span
                    className="block rounded-full"
                    style={{ width: sz.px * 0.7, height: sz.px * 0.7, background: colour }}
                  />
                </span>
                {sz.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
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
          </div>

          <button
            onClick={submit}
            disabled={!name || !ready || send === "sending" || send === "sent"}
            className="rounded-2xl bg-green-500 px-3 py-3.5 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {send === "sending" ? "Sending…" : "📤 Submit to teacher"}
          </button>
          {send === "error" && (
            <p className="text-center text-sm font-bold text-rose-600">
              It didn&apos;t send. Check the internet and try again.
            </p>
          )}
          {send === "off" && (
            <p className="text-center text-sm font-bold text-rose-600">
              Sending isn&apos;t switched on for this app yet.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400">
        Pictures: OpenMoji (openmoji.org), CC BY-SA 4.0
      </p>
    </div>
  );
}
