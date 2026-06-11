"use client";

import { useEffect, useState } from "react";
import { wordFamilies, type WordCard } from "@/app/words";
import { speak, praise } from "@/lib/speak";
import { shuffle } from "@/lib/random";

// All simple 3-letter CVC words from the word families.
const POOL: WordCard[] = wordFamilies
  .flatMap((f) => f.words)
  .filter((w) => w.text.length === 3 && w.sounds.length === 3);

type Tile = { letter: string; id: number };

function buildTiles(word: WordCard): Tile[] {
  return shuffle(word.text.split("").map((letter, id) => ({ letter, id })));
}

export default function Spelling() {
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(POOL[0]));
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [filled, setFilled] = useState(0);
  // A wrong tap: show the tapped letter (in red) in the next slot briefly.
  const [wrong, setWrong] = useState<{ letter: string; id: number } | null>(
    null,
  );

  const word = POOL[index];
  const done = filled === word.text.length;

  // Say the word when a new one appears.
  useEffect(() => {
    speak(word.text, 0.8);
  }, [word]);

  function newRound(i: number) {
    const w = POOL[i % POOL.length];
    setIndex(i % POOL.length);
    setTiles(buildTiles(w));
    setUsed(new Set());
    setFilled(0);
    setWrong(null);
  }

  function tap(tile: Tile) {
    if (used.has(tile.id) || done || wrong) return;
    if (tile.letter === word.text[filled]) {
      speak(word.say[filled], 0.8); // say the sound as it's placed
      setUsed((prev) => new Set(prev).add(tile.id));
      const next = filled + 1;
      setFilled(next);
      if (next === word.text.length) {
        setTimeout(() => {
          praise();
          speak(word.text, 0.85);
        }, 300);
      }
    } else {
      // Show the tapped letter in the next slot (red), then clear it.
      setWrong({ letter: tile.letter, id: tile.id });
      speak("Try again", 1);
      setTimeout(() => setWrong(null), 700);
    }
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Listen, break the word into sounds, then spell it!
      </p>

      <div className="mt-6 flex w-full flex-col items-center gap-6 rounded-[2rem] bg-gradient-to-br from-[#CFF5E1] to-[#9FE7C3] px-6 py-8 text-emerald-900 shadow-lg ring-4 ring-white/60">
        <div className="text-7xl">{word.emoji}</div>

        <div className="flex gap-2">
          <button
            onClick={() => speak(word.text, 0.8)}
            className="rounded-full bg-white/70 px-4 py-2 font-bold text-emerald-700 shadow-sm backdrop-blur active:scale-95"
          >
            🔊 Hear word
          </button>
          <button
            onClick={() => word.say.forEach((s, i) => setTimeout(() => speak(s, 0.8), i * 650))}
            className="rounded-full bg-white/70 px-4 py-2 font-bold text-emerald-700 shadow-sm backdrop-blur active:scale-95"
          >
            🐢 Sound it out
          </button>
        </div>

        {/* Letter slots */}
        <div className="flex gap-3">
          {word.text.split("").map((letter, i) => {
            const isWrongHere = !!wrong && i === filled;
            return (
              <div
                key={i}
                className={`flex h-16 w-14 items-center justify-center rounded-2xl text-3xl font-black ${
                  i < filled
                    ? "bg-white text-emerald-600 shadow-sm"
                    : isWrongHere
                      ? "animate-pulse bg-rose-200 text-rose-700"
                      : "border-2 border-dashed border-emerald-500/50"
                }`}
              >
                {i < filled ? letter : isWrongHere ? wrong!.letter : ""}
              </div>
            );
          })}
        </div>

        {done && <span className="text-2xl font-bold">🎉 You spelled it!</span>}
      </div>

      {/* Letter tiles */}
      {!done ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => tap(tile)}
              disabled={used.has(tile.id)}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-sm transition-all active:scale-90 ${
                used.has(tile.id)
                  ? "bg-brand-100 text-brand-400 dark:bg-zinc-800 dark:text-zinc-600"
                  : wrong?.id === tile.id
                    ? "animate-pulse bg-rose-200 text-rose-700"
                    : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {tile.letter}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => newRound(index + 1)}
          className="mt-6 rounded-full bg-brand-600 px-8 py-3 text-lg font-extrabold text-white shadow active:scale-95"
        >
          Next word →
        </button>
      )}
    </div>
  );
}
