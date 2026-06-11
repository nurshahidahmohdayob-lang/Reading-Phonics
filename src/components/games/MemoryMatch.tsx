"use client";

import { useEffect, useState } from "react";
import type { Lesson, Word } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

type Card = { id: number; word: Word };

function buildCards(lesson: Lesson, pairs: number): Card[] {
  const words = sample(lesson.words, Math.min(pairs, lesson.words.length));
  return shuffle(
    words.flatMap((word) => [{ word }, { word }]),
  ).map((c, id) => ({ ...c, id }));
}

export default function MemoryMatch({
  lesson,
  level = 1,
  onDone,
}: {
  lesson: Lesson;
  level?: number;
  onDone?: () => void;
}) {
  // Higher levels: more pairs to remember.
  const pairs = 3 + Math.min(3, Math.floor((level - 1) / 16));
  const [cards, setCards] = useState<Card[]>(() => buildCards(lesson, pairs));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState(0);

  const done = matched.size > 0 && matched.size * 2 === cards.length;

  useEffect(() => {
    if (done && onDone) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [done, onDone]);

  function flip(card: Card) {
    if (open.includes(card.id) || matched.has(card.word.text) || open.length === 2)
      return;
    speak(card.word.text);
    const next = [...open, card.id];
    setOpen(next);
    if (next.length === 2) {
      setTries((t) => t + 1);
      const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
      if (a.word.text === b.word.text) {
        praise();
        setMatched((prev) => new Set(prev).add(a.word.text));
        setOpen([]);
      } else {
        setTimeout(() => setOpen([]), 900);
      }
    }
  }

  function restart() {
    setCards(buildCards(lesson, pairs));
    setOpen([]);
    setMatched(new Set());
    setTries(0);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        Find the matching pairs! 🃏
      </p>

      {done ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-6xl">🎊</div>
          <h3 className="text-xl font-bold">All pairs found!</h3>
          <p className="text-sm text-zinc-500">Tries: {tries}</p>
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
            {matched.size} of {cards.length / 2} pairs
          </p>
          <div className="grid grid-cols-3 gap-3">
            {cards.map((card) => {
              const faceUp =
                open.includes(card.id) || matched.has(card.word.text);
              const isMatched = matched.has(card.word.text);
              return (
                <button
                  key={card.id}
                  onClick={() => flip(card)}
                  className={`flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-4 text-5xl shadow-sm transition-all active:scale-95 ${
                    isMatched
                      ? "border-green-400 bg-green-50 dark:bg-green-950"
                      : faceUp
                        ? "border-brand-300 bg-white dark:bg-zinc-900"
                        : "border-transparent bg-brand-200 dark:bg-brand-900"
                  }`}
                  aria-label={faceUp ? card.word.text : "hidden card"}
                >
                  {faceUp ? card.word.emoji : "❓"}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
