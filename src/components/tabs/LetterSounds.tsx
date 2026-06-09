"use client";

import { useCallback, useState } from "react";
import { lessons } from "@/app/lessons";
import { speak } from "@/lib/speak";
import ActivityCenter from "@/components/ActivityCenter";

export default function LetterSounds() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lesson = lessons[index];
  const isFirst = index === 0;
  const isLast = index === lessons.length - 1;

  const goNext = useCallback(
    () => setIndex((i) => Math.min(i + 1, lessons.length - 1)),
    [],
  );
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <p className="text-zinc-500 dark:text-zinc-400">
        Tap to hear sounds, then play activities!
      </p>

      {/* Progress dots */}
      <div className="mt-3 flex gap-2" aria-label="Lesson progress">
        {lessons.map((l, i) => (
          <button
            key={l.letter}
            onClick={() => setIndex(i)}
            aria-label={`Go to letter ${l.letter.toUpperCase()}`}
            aria-current={i === index}
            className={`h-3 w-3 rounded-full transition-all ${
              i === index
                ? "scale-125 bg-indigo-500"
                : i < index
                  ? "bg-indigo-300"
                  : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <main className="mt-8 flex w-full flex-1 flex-col items-center gap-8">
        {/* Big letter card */}
        <button
          onClick={() => speak(lesson.sound, 0.6)}
          className={`group flex w-full flex-col items-center gap-2 rounded-3xl bg-gradient-to-br ${lesson.accent} px-6 py-10 text-white shadow-xl transition-transform active:scale-[0.98]`}
        >
          <span className="text-[7rem] font-black leading-none drop-shadow-md sm:text-[9rem]">
            {lesson.letter}
            <span className="text-5xl font-bold opacity-80 sm:text-6xl">
              {lesson.letter.toUpperCase()}
            </span>
          </span>
          <span className="text-2xl font-bold">&ldquo;{lesson.sound}&rdquo;</span>
          <span className="text-sm font-medium opacity-90">{lesson.hint}</span>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-base font-semibold backdrop-blur transition-colors group-hover:bg-white/35">
            🔊 Hear the sound
          </span>
        </button>

        {/* Play activities */}
        <button
          onClick={() => setPlaying(true)}
          className="-mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
        >
          🎮 Play Activities
        </button>

        {/* Example words */}
        <section className="w-full">
          <h2 className="mb-3 text-center text-lg font-semibold text-zinc-600 dark:text-zinc-300">
            Words that start with{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {lesson.letter}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {lesson.words.map((word) => (
              <button
                key={word.text}
                onClick={() => speak(word.text, 0.85)}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-zinc-100 bg-white px-4 py-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-5xl" role="img" aria-label={word.text}>
                  {word.emoji}
                </span>
                <span className="text-lg font-semibold lowercase">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {word.text[0]}
                  </span>
                  {word.text.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Navigation */}
      <nav className="mt-8 flex w-full items-center justify-between gap-4">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white text-lg font-bold text-zinc-700 shadow-sm transition-all hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Back
        </button>
        <span className="shrink-0 text-sm font-semibold text-zinc-400">
          {index + 1} / {lessons.length}
        </span>
        <button
          onClick={goNext}
          disabled={isLast}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-indigo-500 text-lg font-bold text-white shadow-md transition-all hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </nav>

      {playing && (
        <ActivityCenter lesson={lesson} onClose={() => setPlaying(false)} />
      )}
    </div>
  );
}
