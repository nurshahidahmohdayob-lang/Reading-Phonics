"use client";

import { useEffect, useRef, useState } from "react";
import { wordFamilies, type WordCard } from "@/app/words";
import { playSoundClip, speak } from "@/lib/speak";
import BlendingGames from "@/components/BlendingGames";

export default function WordSounds() {
  const [familyIndex, setFamilyIndex] = useState(0);
  const [selected, setSelected] = useState<WordCard>(
    wordFamilies[0].words[0],
  );
  const [active, setActive] = useState(-1); // highlighted sound during blend
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const family = wordFamilies[familyIndex];

  // Clear any pending blend timers.
  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(-1);
  }

  useEffect(() => stop, []);

  function chooseFamily(i: number) {
    stop();
    setFamilyIndex(i);
    setSelected(wordFamilies[i].words[0]);
  }

  function choose(word: WordCard) {
    stop();
    setSelected(word);
  }

  /** Light up each sound in turn, then say the whole word. */
  function blend(word: WordCard) {
    stop();
    const step = 950;
    word.say.forEach((s, i) => {
      timers.current.push(
        setTimeout(() => {
          setActive(i);
          playSoundClip(word.sounds[i] ?? s, s);
        }, i * step),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setActive(-1);
        speak(word.text, 0.8);
      }, word.say.length * step),
    );
  }

  // Games made from THIS word family open as their own page.
  if (playing) {
    return <BlendingGames family={family} onClose={() => setPlaying(false)} />;
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-zinc-500 dark:text-zinc-400">
        Sound out each letter, then blend it into a word!
      </p>
      <button
        onClick={() => setPlaying(true)}
        className="mt-3 flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-base font-extrabold text-white shadow-md active:scale-95"
      >
        🎮 Play {family.family} games
      </button>

      {/* Word family picker */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {wordFamilies.map((f, i) => (
          <button
            key={f.family}
            onClick={() => chooseFamily(i)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
              i === familyIndex
                ? "bg-brand-600 text-white shadow"
                : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {f.family}
          </button>
        ))}
      </div>

      {/* Blender for the selected word */}
      <div
        className={`mt-6 flex w-full flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-br ${family.color} ${family.text} px-6 py-8 shadow-lg ring-4 ring-white/60`}
      >
        <div className="text-7xl">{selected.emoji}</div>

        {/* The whole word, always visible */}
        <button
          onClick={() => speak(selected.text, 0.85)}
          className="text-5xl font-black lowercase tracking-wide drop-shadow-sm"
        >
          {selected.text}
        </button>

        <div className="flex flex-wrap items-end justify-center gap-2">
          {selected.sounds.map((s, i) => (
            <button
              key={i}
              onClick={() => playSoundClip(selected.sounds[i] ?? selected.say[i], selected.say[i])}
              className={`flex h-20 min-w-16 items-center justify-center rounded-2xl px-2 text-4xl font-black shadow-md transition-all active:scale-90 ${
                active === i
                  ? "scale-110 bg-white text-brand-600"
                  : "bg-white/60 backdrop-blur hover:bg-white/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => blend(selected)}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3 text-xl font-extrabold text-white shadow-lg active:scale-95"
        >
          🔉 Blend it!
        </button>
        <p className="text-sm font-semibold opacity-80">
          Tap a letter for its sound, or blend the whole word.
        </p>
      </div>

      {/* Word choices in this family */}
      <div className="mt-6 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {family.words.map((word) => {
          const isSelected = word.text === selected.text;
          return (
            <button
              key={word.text}
              onClick={() => choose(word)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-4 bg-white px-3 py-4 shadow-sm transition-all hover:-translate-y-1 active:scale-95 dark:bg-zinc-900 ${
                isSelected
                  ? "border-brand-400"
                  : "border-transparent hover:border-brand-200"
              }`}
            >
              <span className="text-4xl">{word.emoji}</span>
              <span className="text-base font-bold lowercase text-zinc-700 dark:text-zinc-200">
                {word.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
