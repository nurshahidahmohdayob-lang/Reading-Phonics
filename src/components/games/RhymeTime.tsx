"use client";

import { useState } from "react";
import { wordFamilies } from "@/app/words";
import { speak, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

export type RhymeDifficulty = "easy" | "medium" | "hard";

const RHYME_SETTINGS = {
  easy: { pairs: 5 },
  medium: { pairs: 6 },
  hard: { pairs: 7 },
} as const;

type RhymeCard = {
  id: number;
  text: string;
  emoji: string;
  family: string;
};

function buildCards(pairs: number): RhymeCard[] {
  const families = sample(
    wordFamilies.filter((f) => f.words.length >= 2),
    pairs,
  );
  const cards = families.flatMap((f) =>
    sample(f.words, 2).map((w) => ({
      text: w.text,
      emoji: w.emoji,
      family: f.family,
    })),
  );
  return shuffle(cards).map((c, id) => ({ ...c, id }));
}

export default function RhymeTime({
  difficulty = "medium",
  onDone,
}: {
  difficulty?: RhymeDifficulty;
  onDone?: () => void;
}) {
  const pairCount = RHYME_SETTINGS[difficulty].pairs;
  const [cards, setCards] = useState<RhymeCard[]>(() => buildCards(pairCount));
  const [chosen, setChosen] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongId, setWrongId] = useState<number | null>(null);

  const done = matched.size === cards.length && cards.length > 0;

  function tap(card: RhymeCard) {
    if (matched.has(card.id) || wrongId !== null) return;
    speak(card.text);
    if (chosen === null) {
      setChosen(card.id);
      return;
    }
    if (chosen === card.id) {
      setChosen(null);
      return;
    }
    const first = cards.find((c) => c.id === chosen)!;
    if (first.family === card.family) {
      praise();
      const next = new Set(matched).add(first.id).add(card.id);
      setMatched(next);
      setChosen(null);
      if (next.size === cards.length) {
        if (onDone) setTimeout(onDone, 1100);
      }
    } else {
      setWrongId(card.id);
      speak("Not a rhyme — try again!");
      setTimeout(() => {
        setWrongId(null);
        setChosen(null);
      }, 700);
    }
  }

  function restart() {
    setCards(buildCards(pairCount));
    setChosen(null);
    setMatched(new Set());
  }

  if (done && !onDone) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🎶</div>
        <h3 className="text-2xl font-bold">Rhyme master!</h3>
        <button
          onClick={restart}
          className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Play again 🔁
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        🎶 Tap two words that rhyme!
      </p>
      <p className="text-sm text-zinc-400">
        {matched.size / 2} of {cards.length / 2} rhymes found{" "}
        {done && "🎉"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((card) => {
          const isMatched = matched.has(card.id);
          const isChosen = chosen === card.id;
          return (
            <button
              key={card.id}
              onClick={() => tap(card)}
              disabled={isMatched}
              className={`flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-2xl border-4 shadow-sm transition-all active:scale-95 ${
                isMatched
                  ? "border-green-400 bg-green-50 dark:bg-green-950"
                  : wrongId === card.id
                    ? "animate-pulse border-rose-400 bg-rose-50 dark:bg-rose-950"
                    : isChosen
                      ? "border-brand-400 bg-white dark:bg-zinc-900"
                      : "border-transparent bg-white hover:border-brand-200 dark:bg-zinc-900"
              }`}
            >
              <span className="text-4xl">{card.emoji}</span>
              <span className="text-base font-extrabold lowercase text-zinc-700 dark:text-zinc-200">
                {card.text}
              </span>
              {isMatched && (
                <span className="text-xs font-bold text-green-600">
                  {card.family}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
