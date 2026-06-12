"use client";

import { useEffect, useRef, useState } from "react";
import { lessons, type Word } from "@/app/lessons";
import { speak, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

export type OddDifficulty = "easy" | "medium" | "hard";

const ODD_SETTINGS = {
  easy: { rounds: 8, cards: 3, similar: false },
  medium: { rounds: 10, cards: 3, similar: true },
  hard: { rounds: 12, cards: 4, similar: true },
} as const;

/* Letters that sound alike — used for sneaky hard rounds. */
const SIMILAR: [string, string][] = [
  ["b", "d"], ["p", "b"], ["m", "n"], ["t", "d"], ["c", "g"],
  ["f", "v"], ["s", "z"], ["k", "g"],
];

type OddRound = {
  cards: (Word & { isOdd: boolean })[];
  mainSound: string;
};

function buildRounds(count: number, cards: number, similar: boolean): OddRound[] {
  return Array.from({ length: count }, () => {
    let mainL: string;
    let oddL: string;
    if (similar && Math.random() < 0.7) {
      const pair = sample(SIMILAR, 1)[0];
      [mainL, oddL] = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
    } else {
      const picked = sample(
        lessons.filter((l) => l.letter.length === 1),
        2,
      );
      mainL = picked[0].letter;
      oddL = picked[1].letter;
    }
    const mainLesson = lessons.find((l) => l.letter === mainL)!;
    const oddLesson = lessons.find((l) => l.letter === oddL)!;
    const mains = sample(mainLesson.words, cards - 1).map((w) => ({
      ...w,
      isOdd: false,
    }));
    const odd = { ...sample(oddLesson.words, 1)[0], isOdd: true };
    return { cards: shuffle([...mains, odd]), mainSound: mainLesson.sound };
  });
}

export default function OddSoundOut({
  difficulty = "medium",
  onDone,
}: {
  difficulty?: OddDifficulty;
  onDone?: () => void;
}) {
  const cfg = ODD_SETTINGS[difficulty];
  const [rounds, setRounds] = useState<OddRound[]>(() =>
    buildRounds(cfg.rounds, cfg.cards, cfg.similar),
  );
  const [step, setStep] = useState(0);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const seqToken = useRef(0);

  const round = rounds[step];

  /** Speak each word in turn so the child can compare the first sounds. */
  function playAll(r: OddRound) {
    const token = ++seqToken.current;
    r.cards.forEach((w, i) =>
      setTimeout(() => {
        if (token === seqToken.current) speak(w.text, 0.85);
      }, i * 1400),
    );
  }

  useEffect(() => {
    if (round && !done) playAll(round);
    return () => {
      seqToken.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, done]);

  function pick(i: number) {
    seqToken.current++; // stop the sequence
    const card = round.cards[i];
    speak(card.text);
    if (card.isOdd) {
      praise();
      setWrongIdx(null);
      setTimeout(() => {
        if (step + 1 >= rounds.length) {
          if (onDone) onDone();
          else setDone(true);
        } else {
          setStep(step + 1);
        }
      }, 900);
    } else {
      setWrongIdx(i);
      setTimeout(() => setWrongIdx(null), 700);
    }
  }

  function restart() {
    setRounds(buildRounds(cfg.rounds, cfg.cards, cfg.similar));
    setStep(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">👂</div>
        <h3 className="text-2xl font-bold">Super listener!</h3>
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
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <p className="text-center text-lg font-semibold">
        👂 One word starts with a different sound — tap it!
      </p>
      <button
        onClick={() => playAll(round)}
        className="flex items-center gap-2 rounded-full bg-brand-100 px-5 py-2.5 font-bold text-brand-700 shadow-sm active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear them again
      </button>
      <div className="flex flex-wrap justify-center gap-4">
        {round.cards.map((w, i) => (
          <button
            key={`${w.text}-${i}`}
            onClick={() => pick(i)}
            className={`flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-4 bg-white shadow-sm transition-all active:scale-95 dark:bg-zinc-900 ${
              wrongIdx === i
                ? "animate-pulse border-rose-400"
                : "border-transparent hover:border-brand-300"
            }`}
          >
            <span className="text-5xl">{w.emoji}</span>
            <span className="text-sm font-bold lowercase text-zinc-600 dark:text-zinc-300">
              {w.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
