"use client";

import { useEffect, useState } from "react";
import type { Lesson, Word } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";
import { otherWords, sample, shuffle } from "@/lib/random";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

type Round = { word: Word; options: string[] };

function buildRounds(lesson: Lesson, rounds: number, options: number): Round[] {
  // Mix lesson words with words from other lessons so the answer varies.
  const pool = shuffle([
    ...sample(lesson.words, lesson.words.length),
    ...sample(otherWords(lesson), rounds),
  ]);
  return Array.from({ length: rounds }, (_, i) => pool[i % pool.length]).map(
    (word) => {
    const answer = word.text[0];
    const decoys = sample(
      ALPHABET.filter((c) => c !== answer),
      options - 1,
    );
      return { word, options: shuffle([answer, ...decoys]) };
    },
  );
}

export type FirstDifficulty = "easy" | "medium" | "hard";

const FIRST_SETTINGS = {
  easy: { rounds: 8, options: 3 },
  medium: { rounds: 10, options: 4 },
  hard: { rounds: 12, options: 5 },
} as const;

export default function FirstLetter({
  lesson,
  difficulty = "medium",
  onDone,
}: {
  lesson: Lesson;
  difficulty?: FirstDifficulty;
  onDone?: () => void;
}) {
  const roundCount = FIRST_SETTINGS[difficulty].rounds;
  const optionCount = FIRST_SETTINGS[difficulty].options;
  const [rounds, setRounds] = useState<Round[]>(() =>
    buildRounds(lesson, roundCount, optionCount),
  );
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const round = rounds[step];

  // Say the word whenever a new round appears.
  useEffect(() => {
    if (round) speak(round.word.text);
  }, [round]);

  function pick(letter: string) {
    if (letter === round.word.text[0]) {
      praise();
      setWrong(null);
      setScore((s) => s + 1);
      if (step + 1 >= rounds.length) {
        if (onDone) setTimeout(onDone, 900);
        else setDone(true);
      } else {
        setStep(step + 1);
      }
    } else {
      setWrong(letter);
      speak("Try again");
    }
  }

  function restart() {
    setRounds(buildRounds(lesson, roundCount, optionCount));
    setStep(0);
    setScore(0);
    setWrong(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🚀</div>
        <h3 className="text-2xl font-bold">Letter detective!</h3>
        <p className="text-zinc-500">
          Score: {score} / {rounds.length}
        </p>
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
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <button
        onClick={() => speak(round.word.text)}
        className="flex flex-col items-center gap-2 rounded-3xl bg-white px-10 py-6 shadow-sm active:scale-95 dark:bg-zinc-900"
        aria-label={`Hear ${round.word.text} again`}
      >
        <span className="text-7xl">{round.word.emoji}</span>
        <span className="text-sm font-bold text-zinc-400">🔊 tap to hear</span>
      </button>
      <p className="text-zinc-500">Which letter does it start with?</p>
      <div className="flex gap-4">
        {round.options.map((letter) => (
          <button
            key={letter}
            onClick={() => pick(letter)}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-sm transition-all active:scale-90 ${
              wrong === letter
                ? "animate-pulse bg-rose-200 text-rose-700"
                : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
