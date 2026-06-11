"use client";

import { useRef, useState } from "react";
import type { Lesson } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";

const GOAL = 8; // target balloons to pop
const FLYING = 6; // balloons in the air at once
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const COLORS = [
  "bg-[#FFD9EA]", // pink
  "bg-[#FFE8C9]", // peach
  "bg-[#CFF5E1]", // mint
  "bg-[#FFF4BD]", // lemon
  "bg-[#D3EBFF]", // sky
  "bg-[#E9DFFF]", // lilac
];

type Balloon = {
  id: number;
  label: string;
  isTarget: boolean;
  color: string;
  x: number; // left position in %
  duration: number; // fall time in s
  delay: number; // start delay in s
  sway: number; // sway period in s
  popped: boolean;
};

function makeBalloon(target: string, id: number, delay: number): Balloon {
  // Roughly half the balloons are the target, in BIG or small form.
  const isTarget = Math.random() < 0.45;
  const letter = isTarget
    ? target
    : ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return {
    id,
    label: Math.random() < 0.5 ? letter.toLowerCase() : letter.toUpperCase(),
    isTarget: letter === target,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: 4 + Math.random() * 78,
    duration: 6 + Math.random() * 5,
    delay,
    sway: 1.6 + Math.random() * 1.4,
    popped: false,
  };
}

function firstWave(target: string): Balloon[] {
  return Array.from({ length: FLYING }, (_, i) =>
    makeBalloon(target, i, i * 1.1),
  );
}

export default function BalloonPop({ lesson }: { lesson: Lesson }) {
  const target = lesson.letter;
  const [balloons, setBalloons] = useState<Balloon[]>(() => firstWave(target));
  const [popCount, setPopCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const nextId = useRef(FLYING);

  const done = popCount >= GOAL;

  /** Swap a balloon for a fresh one at the top. */
  function respawn(id: number, delay = Math.random()) {
    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? makeBalloon(target, nextId.current++, delay) : b)),
    );
  }

  function pop(b: Balloon) {
    if (b.popped || done) return;
    if (b.isTarget) {
      praise();
      setPopCount((n) => n + 1);
      // Freeze it as a burst, then float in a replacement.
      setBalloons((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, popped: true } : x)),
      );
      setTimeout(() => respawn(b.id), 450);
    } else {
      setMissCount((m) => m + 1);
      speak("Not that one");
    }
  }

  function restart() {
    setBalloons(firstWave(target));
    setPopCount(0);
    setMissCount(0);
    nextId.current = FLYING;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-center text-lg font-semibold">
        Pop the balloons with big and small{" "}
        <button
          onClick={() => speak(lesson.sound, 0.6)}
          className="rounded-lg bg-brand-100 px-3 py-1 text-2xl font-black text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >
          {target.toUpperCase()} {target}
        </button>
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="text-6xl">🎈</div>
          <h3 className="text-xl font-bold">All popped!</h3>
          <p className="text-sm text-zinc-500">Misses: {missCount}</p>
          <button
            onClick={restart}
            className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
          >
            Play again 🔁
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-400">
            Popped {popCount} of {GOAL} 🎈
          </p>
          <div className="relative h-[420px] w-full max-w-md overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#D3EBFF] to-[#EAF7FF] shadow-inner ring-4 ring-white/60 dark:from-zinc-800 dark:to-zinc-900">
            {/* A few clouds for scenery */}
            <span className="absolute left-4 top-6 text-4xl opacity-70">☁️</span>
            <span className="absolute right-8 top-20 text-3xl opacity-60">☁️</span>
            <span className="absolute left-1/3 top-40 text-3xl opacity-50">☁️</span>

            {balloons.map((b) => (
              <div
                key={b.id}
                className="absolute -top-24"
                style={{
                  left: `${b.x}%`,
                  animation: `balloon-fall ${b.duration}s linear ${b.delay}s`,
                  animationPlayState: b.popped ? "paused" : "running",
                }}
                onAnimationEnd={() => respawn(b.id)}
              >
                <button
                  onPointerDown={() => pop(b)}
                  aria-label={b.popped ? "popped balloon" : `balloon ${b.label}`}
                  className="flex flex-col items-center"
                  style={
                    b.popped
                      ? undefined
                      : { animation: `balloon-sway ${b.sway}s ease-in-out infinite` }
                  }
                >
                  {b.popped ? (
                    <span className="text-5xl">💥</span>
                  ) : (
                    <>
                      <span
                        className={`flex h-16 w-14 items-center justify-center rounded-full ${b.color} text-3xl font-black text-zinc-700 shadow-md`}
                      >
                        {b.label}
                      </span>
                      <span className="h-5 w-px bg-zinc-400/70" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400">
            Misses: {missCount} · Let the other letters float away!
          </p>
        </>
      )}
    </div>
  );
}
