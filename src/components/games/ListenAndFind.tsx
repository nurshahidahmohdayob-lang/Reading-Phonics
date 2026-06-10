"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson, Word } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";
import { otherWords, sample, shuffle } from "@/lib/random";

const ROUNDS = 4;

type Round = { target: Word; options: Word[] };

function buildRounds(lesson: Lesson): Round[] {
  const targets = sample(lesson.words, Math.min(ROUNDS, lesson.words.length));
  const distractorPool = otherWords(lesson);
  return targets.map((target) => {
    const distractors = sample(distractorPool, 2);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export default function ListenAndFind({ lesson }: { lesson: Lesson }) {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(lesson));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const round = rounds[step];

  const playTarget = useCallback(() => {
    if (round) speak(round.target.text);
  }, [round]);

  // Speak the target word whenever a new round appears.
  useEffect(() => {
    if (round) speak(round.target.text);
  }, [round]);

  function pick(word: Word) {
    if (word.text === round.target.text) {
      praise();
      setWrong(null);
      const nextScore = score + 1;
      setScore(nextScore);
      if (step + 1 >= rounds.length) {
        setDone(true);
      } else {
        setStep(step + 1);
      }
    } else {
      setWrong(word.text);
      speak("Try again");
    }
  }

  function restart() {
    setRounds(buildRounds(lesson));
    setStep(0);
    setScore(0);
    setWrong(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🌟</div>
        <h3 className="text-2xl font-bold">You found them all!</h3>
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
        onClick={playTarget}
        className="flex items-center gap-3 rounded-full bg-brand-100 px-6 py-4 text-xl font-bold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the word
      </button>
      <p className="text-zinc-500">Tap the picture you hear</p>
      <div className="grid grid-cols-3 gap-4">
        {round.options.map((word) => {
          const isWrong = wrong === word.text;
          return (
            <button
              key={word.text}
              onClick={() => pick(word)}
              className={`flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-4 bg-white text-6xl shadow-sm transition-all active:scale-95 dark:bg-zinc-900 ${
                isWrong
                  ? "animate-pulse border-rose-400"
                  : "border-transparent hover:border-brand-300"
              }`}
              aria-label={word.text}
            >
              {word.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
