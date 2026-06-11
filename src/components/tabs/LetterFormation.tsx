"use client";

import { useEffect, useRef, useState } from "react";
import { letterSound, letterSounds } from "@/app/alphabet";
import { speak } from "@/lib/speak";

const SIZE = 300;

export default function LetterFormation() {
  const [selected, setSelected] = useState("a");
  const [upper, setUpper] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const info = letterSound(selected);
  const glyph = upper ? selected.toUpperCase() : selected;

  // Clear the canvas whenever the letter or case changes.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
  }, [selected, upper]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#8559d6";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
  }

  function chooseLetter(letter: string) {
    setSelected(letter);
    speak(letterSound(letter).say, 1.1);
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Trace the letter to practise writing it!
      </p>

      {/* A–Z picker */}
      <div className="mt-4 grid w-full grid-cols-6 gap-2 sm:grid-cols-9">
        {letterSounds.map((l) => (
          <button
            key={l.letter}
            onClick={() => chooseLetter(l.letter)}
            aria-current={l.letter === selected}
            className={`flex aspect-square items-center justify-center rounded-xl text-xl font-extrabold uppercase shadow-sm transition-all active:scale-90 ${
              l.letter === selected
                ? "bg-brand-600 text-white shadow"
                : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {l.letter}
          </button>
        ))}
      </div>

      {/* lower / UPPER toggle */}
      <div className="mt-5 flex gap-2">
        {[
          { label: "small a", up: false },
          { label: "BIG A", up: true },
        ].map((o) => (
          <button
            key={o.label}
            onClick={() => setUpper(o.up)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
              upper === o.up
                ? "bg-brand-600 text-white shadow"
                : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Trace pad: faint guide letter behind a drawing canvas */}
      <div
        className="relative mt-5 rounded-3xl border-2 border-dashed border-brand-300 bg-white dark:bg-zinc-900"
        style={{ width: SIZE, height: SIZE, maxWidth: "90vw" }}
      >
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-black leading-none text-zinc-200 dark:text-zinc-700"
          style={{ fontSize: SIZE * 0.8 }}
        >
          {glyph}
        </span>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="absolute inset-0 h-full w-full touch-none"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={clear}
          className="rounded-full bg-zinc-100 px-5 py-2.5 font-bold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          🧽 Clear
        </button>
        <button
          onClick={() => speak(info.say, 1.1)}
          className="rounded-full bg-brand-600 px-5 py-2.5 font-bold text-white active:scale-95"
        >
          🔊 Hear sound
        </button>
      </div>

      {/* Formation patter */}
      <div className="mt-5 w-full rounded-2xl border-2 border-brand-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-brand-600 dark:text-brand-400">
            ✍️ How to write {glyph}
          </h3>
          <button
            onClick={() => speak(info.formation, 0.95)}
            className="shrink-0 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-bold text-brand-700 active:scale-95 dark:bg-brand-950 dark:text-brand-300"
          >
            🔊 Read
          </button>
        </div>
        <p className="mt-2 text-zinc-700 dark:text-zinc-200">{info.formation}</p>
      </div>
    </div>
  );
}
