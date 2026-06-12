"use client";

import { useEffect, useState } from "react";
import type { Lesson, Word } from "@/app/lessons";
import { speak, praise, playSoundClip } from "@/lib/speak";
import { otherWords, sample, shuffle } from "@/lib/random";

type Item = Word & { isMatch: boolean };

function buildBoard(lesson: Lesson, matches: number, decoys: number): Item[] {
  const m = sample(lesson.words, Math.min(matches, lesson.words.length)).map(
    (w) => ({ ...w, isMatch: true }),
  );
  const d = sample(otherWords(lesson), decoys).map((w) => ({
    ...w,
    isMatch: false,
  }));
  return shuffle([...m, ...d]);
}

export type SortDifficulty = "easy" | "medium" | "hard";

const SORT_SETTINGS = {
  easy: { matches: 3, decoys: 3, boards: 3 },
  medium: { matches: 4, decoys: 5, boards: 3 },
  hard: { matches: 5, decoys: 7, boards: 3 },
} as const;

export default function SoundSort({
  lesson,
  difficulty = "medium",
  onDone,
}: {
  lesson: Lesson;
  difficulty?: SortDifficulty;
  onDone?: () => void;
}) {
  const matches = SORT_SETTINGS[difficulty].matches;
  const decoys = SORT_SETTINGS[difficulty].decoys;
  const boards = SORT_SETTINGS[difficulty].boards;

  const [board, setBoard] = useState<Item[]>(() =>
    buildBoard(lesson, matches, decoys),
  );
  const [boardNum, setBoardNum] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());

  const totalMatches = board.filter((i) => i.isMatch).length;
  const correctCount = board.filter(
    (i) => i.isMatch && picked.has(i.text),
  ).length;
  const done = correctCount === totalMatches;

  // A cleared board deals a fresh one until all boards are done.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      if (boardNum + 1 < boards) {
        setBoard(buildBoard(lesson, matches, decoys));
        setPicked(new Set());
        setMissed(new Set());
        setBoardNum((b) => b + 1);
      } else if (onDone) {
        onDone();
      }
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function tap(item: Item) {
    if (picked.has(item.text) || done) return;
    speak(item.text);
    if (item.isMatch) {
      praise();
      setPicked((prev) => new Set(prev).add(item.text));
    } else {
      setMissed((prev) => new Set(prev).add(item.text));
      setTimeout(() => {
        setMissed((prev) => {
          const next = new Set(prev);
          next.delete(item.text);
          return next;
        });
      }, 600);
    }
  }

  function restart() {
    setBoard(buildBoard(lesson, matches, decoys));
    setPicked(new Set());
    setMissed(new Set());
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        Tap the pictures that start with{" "}
        <button
          onClick={() => playSoundClip(lesson.letter, lesson.sound)}
          className="rounded-lg bg-brand-100 px-3 py-1 text-xl font-black text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >
          {lesson.letter} &ldquo;{lesson.sound}&rdquo;
        </button>
      </p>

      {done && !onDone ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-6xl">🎉</div>
          <h3 className="text-xl font-bold">Perfect sorting!</h3>
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
            Board {boardNum + 1} of {boards} · {correctCount} of {totalMatches}{" "}
            found {done && "🎉"}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {board.map((item) => {
              const isPicked = picked.has(item.text);
              const isMissed = missed.has(item.text);
              return (
                <button
                  key={item.text}
                  onClick={() => tap(item)}
                  disabled={isPicked}
                  className={`flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-4 text-5xl shadow-sm transition-all active:scale-95 ${
                    isPicked
                      ? "border-green-400 bg-green-50 dark:bg-green-950"
                      : isMissed
                        ? "animate-pulse border-rose-400 bg-rose-50 dark:bg-rose-950"
                        : "border-transparent bg-white hover:border-brand-300 dark:bg-zinc-900"
                  }`}
                  aria-label={item.text}
                >
                  <span>{item.emoji}</span>
                  {isPicked && (
                    <span className="text-xs font-bold lowercase text-green-600">
                      {item.text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
