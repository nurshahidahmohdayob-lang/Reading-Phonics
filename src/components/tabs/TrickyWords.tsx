"use client";

import { useState } from "react";
import { trickySets, type TrickySet } from "@/app/tricky";
import { speak, playClip } from "@/lib/speak";

/** Say a tricky word with the real recording from the Jolly Phonics recap
    video (/sounds/tricky-<word>.mp3), falling back to TTS. */
function sayWord(word: string) {
  playClip(`tricky-${word.toLowerCase()}`, () => speak(word, 0.85));
}

/* Each set's cards are tinted with the set's own colour (index = set - 1). */
const SET_STYLES = [
  { bg: "bg-gradient-to-br from-[#FFF8E7] to-[#FFECC2]", text: "text-amber-800" }, // Cream
  { bg: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]", text: "text-pink-700" }, // Pink
  { bg: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" }, // Green
  { bg: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE470]", text: "text-yellow-700" }, // Yellow
  { bg: "bg-gradient-to-br from-[#D3EBFF] to-[#A4D6FF]", text: "text-sky-700" }, // Blue
  { bg: "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" }, // Purple
];

export default function TrickyWords() {
  const [set, setSet] = useState<TrickySet | null>(null);
  const [index, setIndex] = useState(0);

  function enterSet(s: TrickySet) {
    setSet(s);
    setIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- Set picker: colour-named pastel cards ---- */
  if (!set) {
    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          Tricky words can&apos;t be sounded out — learn them by sight, one
          colour set at a time.
        </p>
        <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trickySets.map((s) => {
            const style = SET_STYLES[(s.set - 1) % SET_STYLES.length];
            return (
              <button
                key={s.set}
                onClick={() => enterSet(s)}
                className={`group flex flex-col items-center gap-2 rounded-[2rem] ${style.bg} ${style.text} px-6 py-8 shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                  {s.emoji}
                </span>
                <span className="text-xl font-extrabold">
                  Set {s.set} · {s.color}
                </span>
                <span className="text-center text-sm font-semibold opacity-80">
                  {s.blurb}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                  {s.words.length} words
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---- Inside a set: flashcards in the set's colour ---- */
  const style = SET_STYLES[(set.set - 1) % SET_STYLES.length];
  const tricky = set.words[index];
  const isFirst = index === 0;
  const isLast = index === set.words.length - 1;

  function go(i: number) {
    setIndex(i);
    sayWord(set!.words[i].word);
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Back to sets */}
      <div className="flex w-full">
        <button
          onClick={() => setSet(null)}
          className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm transition-all hover:shadow active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← All sets
        </button>
      </div>

      {/* Flashcard */}
      <div
        className={`mt-4 flex w-full flex-col items-center gap-5 rounded-[2rem] ${style.bg} ${style.text} px-6 py-10 shadow-lg ring-4 ring-white/60`}
      >
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {set.color} set · Word {index + 1} of {set.words.length}
        </span>
        <button
          onClick={() => sayWord(tricky.word)}
          className="text-6xl font-black drop-shadow-sm sm:text-7xl"
        >
          {tricky.word}
        </button>
        <button
          onClick={() => sayWord(tricky.word)}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 font-bold shadow-sm backdrop-blur active:scale-95"
        >
          🔊 Hear word
        </button>
        <div className="mt-1 flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold">
            &ldquo;{tricky.sentence}&rdquo;
          </p>
          <button
            onClick={() => speak(tricky.sentence, 0.85)}
            className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold shadow-sm active:scale-95"
          >
            🔊 Hear sentence
          </button>
        </div>
        {/* Why it's tricky */}
        <div className="flex w-full max-w-md items-start gap-2 rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm">
          <span className="text-xl">🕵️</span>
          <p className="text-sm font-semibold">
            <span className="font-extrabold">Why is it tricky?</span>{" "}
            {tricky.why}
          </p>
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
          onClick={() => go(Math.min(set.words.length - 1, index + 1))}
          disabled={isLast}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white shadow-md hover:bg-brand-700 active:scale-95 disabled:opacity-40"
        >
          Next →
        </button>
      </nav>

      {/* Quick jump grid */}
      <div className="mt-6 grid w-full grid-cols-4 gap-2 sm:grid-cols-6">
        {set.words.map((t, i) => (
          <button
            key={t.word}
            onClick={() => go(i)}
            aria-current={i === index}
            className={`rounded-lg px-2 py-2 text-sm font-bold shadow-sm transition-all active:scale-90 ${
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
