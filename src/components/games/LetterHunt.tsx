"use client";

import { useState } from "react";
import type { Lesson } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";
import { shuffle } from "@/lib/random";

const GRID = 16; // 4 x 4
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

type Cell = { id: number; letter: string; isTarget: boolean };

function buildGrid(target: string): { cells: Cell[]; total: number } {
  const total = 5 + Math.floor(Math.random() * 2); // 5 or 6 targets
  const others = shuffle(ALPHABET.filter((c) => c !== target));
  const letters: string[] = [];
  for (let i = 0; i < GRID; i++) {
    letters.push(i < total ? target : others[i % others.length]);
  }
  const cells = shuffle(letters).map((letter, id) => ({
    id,
    letter,
    isTarget: letter === target,
  }));
  return { cells, total };
}

export default function LetterHunt({ lesson }: { lesson: Lesson }) {
  const target = lesson.letter;
  const [{ cells, total }, setGrid] = useState(() => buildGrid(target));
  const [found, setFound] = useState<Set<number>>(new Set());
  const [missCount, setMissCount] = useState(0);

  const done = found.size === total;

  function tap(cell: Cell) {
    if (found.has(cell.id) || done) return;
    if (cell.isTarget) {
      praise();
      setFound((prev) => new Set(prev).add(cell.id));
    } else {
      setMissCount((m) => m + 1);
      speak("Not that one");
    }
  }

  function restart() {
    setGrid(buildGrid(target));
    setFound(new Set());
    setMissCount(0);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        Tap every{" "}
        <button
          onClick={() => speak(lesson.sound, 0.6)}
          className="rounded-lg bg-brand-100 px-3 py-1 text-2xl font-black text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >
          {target} {target.toUpperCase()}
        </button>
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-6xl">🏆</div>
          <h3 className="text-xl font-bold">You caught them all!</h3>
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
            Found {found.size} of {total}
          </p>
          <div className="grid grid-cols-4 gap-3">
            {cells.map((cell) => {
              const caught = found.has(cell.id);
              return (
                <button
                  key={cell.id}
                  onClick={() => tap(cell)}
                  disabled={caught}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-sm transition-all active:scale-90 ${
                    caught
                      ? "bg-green-400 text-white"
                      : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {caught ? "✓" : cell.letter}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
