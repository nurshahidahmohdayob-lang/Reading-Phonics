"use client";

import { useEffect, useRef, useState } from "react";
import type { Lesson } from "@/app/lessons";
import { speak, praise, playSoundClip, popSound } from "@/lib/speak";

const FLYING = 6; // balloons in the air at once
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
/* Bright, glossy party-balloon colours. */
const COLORS = [
  { from: "#FF8A80", to: "#E5304C" }, // red
  { from: "#FFD180", to: "#FF8F00" }, // orange
  { from: "#FFF176", to: "#F9A825" }, // yellow
  { from: "#7DEB8E", to: "#1DB954" }, // green
  { from: "#81D4FA", to: "#1E88E5" }, // blue
  { from: "#CE93D8", to: "#8E24AA" }, // purple
  { from: "#FF9EC8", to: "#E91E8C" }, // pink
];

type Balloon = {
  id: number;
  label: string;
  isTarget: boolean;
  color: { from: string; to: string };
  x: number; // left position in %
  duration: number; // fall time in s
  delay: number; // start delay in s
  sway: number; // sway period in s
  popped: boolean;
};

function makeBalloon(
  target: string,
  id: number,
  delay: number,
  speedup = 0,
): Balloon {
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
    x: 4 + Math.random() * 84,
    duration: Math.max(1.6, 6 - speedup) + Math.random() * Math.max(0.8, 5 - speedup),
    delay,
    sway: 1.6 + Math.random() * 1.4,
    popped: false,
  };
}

function firstWave(target: string, speedup = 0): Balloon[] {
  return Array.from({ length: FLYING }, (_, i) =>
    makeBalloon(target, i, i * 1.1, speedup),
  );
}

export type BalloonDifficulty = "easy" | "medium" | "hard";

const DIFFICULTY = {
  easy: { goal: 10, speedup: 0 },     // slow, floaty balloons
  medium: { goal: 14, speedup: 2 },   // a steady drift
  hard: { goal: 18, speedup: 4.2 },   // they drop FAST
} as const;

export default function BalloonPop({
  lesson,
  difficulty = "medium",
  onDone,
}: {
  lesson: Lesson;
  difficulty?: BalloonDifficulty;
  onDone?: () => void;
}) {
  const target = lesson.letter;
  const GOAL = DIFFICULTY[difficulty].goal;
  const speedup = DIFFICULTY[difficulty].speedup;
  const [balloons, setBalloons] = useState<Balloon[]>(() => firstWave(target, speedup));
  const [popCount, setPopCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const nextId = useRef(FLYING);

  const done = popCount >= GOAL;

  useEffect(() => {
    if (done && onDone) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [done, onDone]);

  /** Swap a balloon for a fresh one at the top. */
  function respawn(id: number, delay = Math.random()) {
    setBalloons((prev) =>
      prev.map((b) =>
        b.id === id ? makeBalloon(target, nextId.current++, delay, speedup) : b,
      ),
    );
  }

  function pop(b: Balloon) {
    if (b.popped || done) return;
    if (b.isTarget) {
      popSound();
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
    setBalloons(firstWave(target, speedup));
    setPopCount(0);
    setMissCount(0);
    nextId.current = FLYING;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-center text-lg font-semibold">
        Pop the balloons with big and small{" "}
        <button
          onClick={() => playSoundClip(lesson.letter, lesson.sound)}
          className="rounded-lg bg-brand-100 px-3 py-1 text-2xl font-black text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >
          {target.toUpperCase()} {target}
        </button>
      </p>

      {done && !onDone ? (
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
            Popped {popCount} of {GOAL} 🎈 {done && "🎉"}
          </p>
          <div className="relative h-[540px] w-full overflow-hidden">
            {/* Open sky — no box, just a few drifting clouds */}
            <span className="absolute left-4 top-6 text-6xl opacity-60">☁️</span>
            <span className="absolute right-8 top-24 text-5xl opacity-50">☁️</span>
            <span className="absolute left-1/3 top-52 text-5xl opacity-40">☁️</span>
            <span className="absolute right-1/4 top-80 text-4xl opacity-40">☁️</span>

            {balloons.map((b) => (
              <div
                key={b.id}
                className="absolute -bottom-28"
                style={{
                  left: `${b.x}%`,
                  animation: `balloon-rise ${b.duration}s linear ${b.delay}s`,
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
                    <span className="text-7xl">💥</span>
                  ) : (
                    <>
                      <span
                        className="relative flex h-24 w-20 items-center justify-center rounded-full text-5xl font-black text-white"
                        style={{
                          background: `radial-gradient(circle at 32% 28%, ${b.color.from}, ${b.color.to})`,
                          boxShadow: "inset -6px -8px 14px rgba(0,0,0,.18), 0 10px 18px rgba(0,0,0,.18)",
                          textShadow: "0 2px 4px rgba(0,0,0,.35)",
                        }}
                      >
                        {/* shine */}
                        <span className="absolute left-3 top-3 h-6 w-4 -rotate-12 rounded-full bg-white/50 blur-[1px]" />
                        {b.label}
                      </span>
                      {/* knot + string */}
                      <span
                        className="-mt-0.5 h-3 w-3 rotate-45"
                        style={{ background: b.color.to }}
                      />
                      <span className="h-8 w-px rotate-3 bg-zinc-500/60" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400">
            Misses: {missCount} · Let the other letters float up, up and away!
          </p>
        </>
      )}
    </div>
  );
}
