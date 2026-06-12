"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/app/lessons";
import { speak, praise, playSoundClip } from "@/lib/speak";
import { shuffle } from "@/lib/random";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

const TILE_COLORS = [
  "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]", // pink
  "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1]", // peach
  "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]", // mint
  "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C]", // lemon
  "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF]", // sky
  "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]", // lilac
];
const POP_EMOJI = ["🌟", "🎉", "💖", "🌈", "✨", "🎈"];

type Cell = {
  id: number;
  letter: string;
  isTarget: boolean;
  color: string;
  tilt: number;
  delay: number;
};

function buildGrid(target: string, cellCount: number, targetCount: number) {
  const others = shuffle(ALPHABET.filter((c) => c !== target));
  const letters: string[] = [];
  for (let i = 0; i < cellCount; i++) {
    letters.push(i < targetCount ? target : others[i % others.length]);
  }
  const cells = shuffle(letters).map((letter, id) => ({
    id,
    letter,
    isTarget: letter === target,
    color: TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)],
    tilt: Math.round(Math.random() * 10 - 5),
    delay: Math.random() * 3,
  }));
  return { cells, total: targetCount };
}

export type HuntDifficulty = "easy" | "medium" | "hard";

const HUNT_SETTINGS = {
  easy: { cells: 12, targets: 4, boards: 3 },   // small board
  medium: { cells: 16, targets: 6, boards: 3 }, // more to search
  hard: { cells: 24, targets: 8, boards: 2 },   // a big busy board
} as const;

export default function LetterHunt({
  lesson,
  difficulty = "medium",
  onDone,
}: {
  lesson: Lesson;
  difficulty?: HuntDifficulty;
  onDone?: () => void;
}) {
  const target = lesson.letter;
  const cellCount = HUNT_SETTINGS[difficulty].cells;
  const targetCount = HUNT_SETTINGS[difficulty].targets;
  const boards = HUNT_SETTINGS[difficulty].boards;

  const [{ cells, total }, setGrid] = useState(() =>
    buildGrid(target, cellCount, targetCount),
  );
  const [boardNum, setBoardNum] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<number | null>(null);
  const [missCount, setMissCount] = useState(0);

  const done = found.size === total;

  // A cleared board deals a fresh one until all boards are done.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      if (boardNum + 1 < boards) {
        setGrid(buildGrid(target, cellCount, targetCount));
        setFound(new Set());
        setShaking(null);
        setBoardNum((b) => b + 1);
      } else if (onDone) {
        onDone();
      }
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function tap(cell: Cell) {
    if (found.has(cell.id) || done) return;
    if (cell.isTarget) {
      praise();
      setFound((prev) => new Set(prev).add(cell.id));
    } else {
      setMissCount((m) => m + 1);
      setShaking(cell.id);
      speak("Not that one");
      setTimeout(() => setShaking(null), 450);
    }
  }

  function restart() {
    setGrid(buildGrid(target, cellCount, targetCount));
    setFound(new Set());
    setShaking(null);
    setMissCount(0);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        🔍 Hunt for every{" "}
        <button
          onClick={() => playSoundClip(lesson.letter, lesson.sound)}
          className="rounded-xl bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] px-3 py-1 text-2xl font-black text-violet-700 ring-2 ring-white/70 active:scale-95"
        >
          {target} {target.toUpperCase()}
        </button>{" "}
        hiding below!
      </p>

      {done && !onDone ? (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-10 py-8 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
          <div className="text-6xl">🏆</div>
          <h3 className="text-xl font-extrabold">You caught them all!</h3>
          <p className="text-sm font-semibold opacity-80">
            Misses: {missCount}
          </p>
          <button
            onClick={restart}
            className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
          >
            Play again 🔁
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-1.5 shadow-sm">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`text-xl transition-transform ${
                  i < found.size ? "scale-110" : "opacity-30 grayscale"
                }`}
              >
                ⭐
              </span>
            ))}
            <span className="ml-1 text-sm font-bold text-zinc-500">
              {found.size}/{total} · board {boardNum + 1}/{boards}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 rounded-[2rem] bg-white/50 p-4 shadow-inner ring-4 ring-white/60 sm:grid-cols-6">
            {cells.map((cell) => {
              const caught = found.has(cell.id);
              const isShaking = shaking === cell.id;
              return (
                <button
                  key={cell.id}
                  onClick={() => tap(cell)}
                  disabled={caught}
                  style={{
                    ["--tilt" as string]: `${cell.tilt}deg`,
                    transform: caught ? undefined : `rotate(${cell.tilt}deg)`,
                    animationDelay: caught ? undefined : `-${cell.delay}s`,
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-md ring-2 ring-white/70 transition-all sm:h-16 sm:w-16 sm:text-3xl ${
                    caught
                      ? "tile-pop bg-white text-3xl"
                      : isShaking
                        ? `tile-shake ${cell.color} text-rose-600`
                        : `tile-wiggle ${cell.color} text-zinc-700 hover:scale-110 hover:ring-4 active:scale-90`
                  }`}
                >
                  {caught ? POP_EMOJI[cell.id % POP_EMOJI.length] : cell.letter}
                </button>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-zinc-400">
            Tap a tile — the right letters turn into treasures!
          </p>
        </>
      )}
    </div>
  );
}
