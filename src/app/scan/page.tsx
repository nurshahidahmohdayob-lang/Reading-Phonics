"use client";

/* The page a phone lands on after scanning the QR on the class screen.

   One job: photograph a child's drawing, lift it off the paper here on the
   phone, choose how it moves, which way it faces and how big it is, and send
   it to the screen that showed the code. Once it's there, the same buttons
   keep changing it on the screen. No sign-in — the
   code in the link is the permission, and it expires — and nothing about the
   class is readable from this page. */

import { useEffect, useRef, useState } from "react";
import { cutOutDrawing, shrinkCutout, type Cutout } from "@/lib/cutout";
import {
  MAX_SCALE,
  MIN_SCALE,
  MOVES,
  SCALE_STEP,
} from "@/lib/drawingMoves";
import type { Move3D } from "@/components/tabs/Stage3D";

/** ready → working (cutting out) → choose (settings) → sending → sent. */
type Stage = "ready" | "working" | "choose" | "sending" | "sent" | "error";

type Settings = { move: Move3D | null; flip: boolean; scale: number };
const FRESH: Settings = { move: null, flip: false, scale: 1 };

/** The phone's own name for a drawing it sent, so later changes find it. */
const newRef = () => Math.random().toString(36).slice(2, 12).padEnd(8, "0");

export default function ScanPage() {
  const [code, setCode] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("ready");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Cutout | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [settings, setSettings] = useState<Settings>(FRESH);
  /** The drawing on the screen that the buttons now change. */
  const [sentRef, setSentRef] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const fromHash = window.location.hash.replace(/^#/, "").trim();
      setCode(/^[a-z2-9]{12}$/.test(fromHash) ? fromHash : "");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Cut the drawing out of the photo, then wait for the settings. */
  async function cut(file: File | undefined) {
    if (!file || !code) return;
    setStage("working");
    setMessage("");
    try {
      const cutout = await cutOutDrawing(file);
      setPreview(await shrinkCutout(cutout.dataUrl));
      setSettings(FRESH);
      setSentRef(null);
      setStage("choose");
    } catch (e) {
      setStage("error");
      setMessage(
        e instanceof Error ? e.message : "That didn't work. Try again.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function post(body: Record<string, unknown>): Promise<string | null> {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...body }),
      });
      const data = await res.json();
      if (data?.ok) return null;
      return typeof data?.error === "string" && data.error !== "bad request"
        ? data.error
        : "That didn't send. Try again.";
    } catch {
      return "That didn't send. Check the phone is online and try again.";
    }
  }

  /** Send the drawing, moving the way that was chosen. */
  async function send() {
    if (!preview) return;
    setStage("sending");
    const ref = newRef();
    const error = await post({
      action: "upload",
      dataUrl: preview.dataUrl,
      width: preview.width,
      height: preview.height,
      ref,
      ...(settings.move ? { move: settings.move } : {}),
      flip: settings.flip,
      scale: settings.scale,
    });
    if (error) {
      setStage("choose");
      setMessage(error);
      return;
    }
    setMessage("");
    setSentRef(ref);
    setSentCount((n) => n + 1);
    setStage("sent");
  }

  /** Change a setting: here, and on the screen too once it's been sent. */
  function change(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
    if (!sentRef) return;
    void post({ action: "change", ref: sentRef, ...patch }).then((error) =>
      setMessage(error ?? ""),
    );
  }

  if (code === null) {
    return (
      <Shell>
        <p className="text-sm font-bold text-zinc-400">One moment…</p>
      </Shell>
    );
  }

  if (code === "") {
    return (
      <Shell>
        <div className="text-5xl">📷</div>
        <h1 className="mt-2 text-lg font-extrabold text-zinc-800 dark:text-zinc-100">
          Scan the code on the screen
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Open <b>3D Drawings</b> on the big screen, tap{" "}
          <b>📱 Scan with my phone</b>, and point your camera at the code it
          shows.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-5xl">🪄</div>
      <h1 className="mt-2 text-lg font-extrabold text-zinc-800 dark:text-zinc-100">
        Send a drawing to the screen
      </h1>
      <p className="mt-1 text-xs font-semibold text-zinc-400">
        Linked to the big screen · {sentCount} sent
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void cut(e.target.files?.[0])}
      />

      {preview && stage !== "working" && (
        <div className="mt-4 grid h-48 w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#A6D9FF] to-[#E9F6FF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.dataUrl}
            alt="Your drawing"
            className="max-h-36 max-w-[70%] object-contain drop-shadow-lg transition-transform"
            style={{
              transform: `scale(${Math.min(1.3, settings.scale)}) scaleX(${settings.flip ? -1 : 1})`,
            }}
          />
        </div>
      )}

      {(stage === "choose" || stage === "sending" || stage === "sent") && (
        <div className="mt-4 w-full">
          <p className="text-sm font-extrabold text-zinc-700 dark:text-zinc-200">
            How does it move?
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {MOVES.map((m) => (
              <button
                key={m.id}
                onClick={() => change({ move: m.id })}
                aria-pressed={settings.move === m.id}
                className={`rounded-full px-3 py-2 text-sm font-extrabold active:scale-95 ${
                  settings.move === m.id
                    ? "bg-brand-600 text-white shadow"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {settings.move !== "jelly" && (
              <button
                onClick={() => change({ flip: !settings.flip })}
                aria-pressed={settings.flip}
                className={`rounded-full px-3 py-2 text-sm font-extrabold active:scale-95 ${
                  settings.flip
                    ? "bg-brand-600 text-white shadow"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                ↔️ Turn round
              </button>
            )}
            <button
              onClick={() =>
                change({
                  scale: +Math.max(MIN_SCALE, settings.scale - SCALE_STEP).toFixed(2),
                })
              }
              disabled={settings.scale <= MIN_SCALE}
              className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-extrabold text-zinc-600 active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
            >
              ➖ Smaller
            </button>
            <button
              onClick={() =>
                change({
                  scale: +Math.min(MAX_SCALE, settings.scale + SCALE_STEP).toFixed(2),
                })
              }
              disabled={settings.scale >= MAX_SCALE}
              className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-extrabold text-zinc-600 active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
            >
              ➕ Bigger
            </button>
          </div>
          {stage !== "sent" && !settings.move && (
            <p className="mt-2 text-xs font-semibold text-zinc-400">
              Not sure? Leave it, and the screen picks one to suit the place.
            </p>
          )}
        </div>
      )}

      {stage === "sent" && (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ It&apos;s on the screen — the buttons above still change it
        </p>
      )}
      {message && (
        <p className="mt-3 text-center text-sm font-bold text-rose-500">
          {message}
        </p>
      )}

      {stage === "choose" || stage === "sending" ? (
        <>
          <button
            onClick={() => void send()}
            disabled={stage === "sending"}
            className="mt-4 w-full rounded-full bg-[#0A4F29] px-7 py-4 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {stage === "sending" ? "⏳ Sending…" : "✨ Send to the screen"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={stage === "sending"}
            className="mt-2 text-sm font-bold text-zinc-500 underline-offset-2 hover:underline"
          >
            📷 Take it again
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={stage === "working"}
            className="mt-4 w-full rounded-full bg-[#0A4F29] px-7 py-4 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {stage === "working"
              ? "✨ Cutting it out…"
              : stage === "sent"
                ? "📷 Send another drawing"
                : "📷 Take a photo of the drawing"}
          </button>
          <p className="mt-2 text-center text-xs font-semibold text-zinc-400">
            Lay the drawing flat in good light, with all of it in the picture.
          </p>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] p-5">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[2rem] bg-white/95 p-6 text-center shadow-lg ring-4 ring-white/60 dark:bg-zinc-900/95">
        {children}
      </div>
    </main>
  );
}
