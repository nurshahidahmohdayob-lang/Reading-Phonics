"use client";

import { useState } from "react";
import { trickyWords } from "@/app/tricky";
import { speak } from "@/lib/speak";

export default function TrickyWords() {
  const [index, setIndex] = useState(0);
  const tricky = trickyWords[index];
  const isFirst = index === 0;
  const isLast = index === trickyWords.length - 1;

  function go(i: number) {
    setIndex(i);
    speak(trickyWords[i].word, 0.85);
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Tricky words can&apos;t be sounded out — learn them by sight.
      </p>

      {/* Flashcard */}
      <div className="mt-6 flex w-full flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-[#2E8C77] to-[#1C6B49] px-6 py-10 text-white shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wide opacity-80">
          Word {index + 1} of {trickyWords.length}
        </span>
        <button
          onClick={() => speak(tricky.word, 0.85)}
          className="text-6xl font-black lowercase drop-shadow-md sm:text-7xl"
        >
          {tricky.word}
        </button>
        <button
          onClick={() => speak(tricky.word, 0.85)}
          className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 font-semibold backdrop-blur active:scale-95"
        >
          🔊 Hear word
        </button>
        <div className="mt-1 flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-medium opacity-95">
            &ldquo;{tricky.sentence}&rdquo;
          </p>
          <button
            onClick={() => speak(tricky.sentence, 0.85)}
            className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold active:scale-95"
          >
            🔊 Hear sentence
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex w-full items-center justify-between gap-4">
        <button
          onClick={() => go(Math.max(0, index - 1))}
          disabled={isFirst}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-white text-lg font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Back
        </button>
        <button
          onClick={() => go(Math.min(trickyWords.length - 1, index + 1))}
          disabled={isLast}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white shadow-md hover:bg-brand-700 active:scale-95 disabled:opacity-40"
        >
          Next →
        </button>
      </nav>

      {/* Quick jump grid */}
      <div className="mt-6 grid w-full grid-cols-4 gap-2 sm:grid-cols-6">
        {trickyWords.map((t, i) => (
          <button
            key={t.word}
            onClick={() => go(i)}
            aria-current={i === index}
            className={`rounded-lg px-2 py-2 text-sm font-bold lowercase shadow-sm transition-all active:scale-90 ${
              i === index
                ? "bg-brand-600 text-white"
                : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {t.word}
          </button>
        ))}
      </div>
    </div>
  );
}
