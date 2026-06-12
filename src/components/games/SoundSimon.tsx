"use client";

import { useEffect, useRef, useState } from "react";
import { speak, playClip, praise } from "@/lib/speak";
import { sample } from "@/lib/random";

const WIN_LENGTH = 6;
const PAD_COLORS = [
  "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB] text-pink-700",
  "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] text-emerald-700",
  "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C] text-amber-700",
  "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] text-sky-700",
];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function sayLetter(letter: string) {
  playClip(letter, () => speak(letter, 0.85));
}

export default function SoundSimon() {
  const [pads] = useState<string[]>(() => sample(ALPHABET, 4));
  const [sequence, setSequence] = useState<string[]>(() => []);
  const [progress, setProgress] = useState(0); // how far the child has echoed
  const [lit, setLit] = useState<number | null>(null);
  const [playingSeq, setPlayingSeq] = useState(false);
  const [won, setWon] = useState(false);
  const seqToken = useRef(0);

  /** Light pads and play their sounds one after another. */
  function playSequence(seq: string[]) {
    const token = ++seqToken.current;
    setPlayingSeq(true);
    seq.forEach((letter, i) => {
      setTimeout(() => {
        if (token !== seqToken.current) return;
        setLit(pads.indexOf(letter));
        sayLetter(letter);
        setTimeout(() => token === seqToken.current && setLit(null), 700);
      }, i * 1000);
    });
    setTimeout(() => {
      if (token === seqToken.current) setPlayingSeq(false);
    }, seq.length * 1000 + 200);
  }

  /** Grow the sequence by one and play it. */
  function nextRound(prev: string[]) {
    const seq = [...prev, sample(pads, 1)[0]];
    setSequence(seq);
    setProgress(0);
    setTimeout(() => playSequence(seq), 700);
  }

  // Start the first round.
  useEffect(() => {
    nextRound([]);
    return () => {
      seqToken.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tap(i: number) {
    if (playingSeq || won) return;
    const letter = pads[i];
    setLit(i);
    setTimeout(() => setLit(null), 400);
    sayLetter(letter);
    if (letter === sequence[progress]) {
      const next = progress + 1;
      setProgress(next);
      if (next === sequence.length) {
        if (sequence.length >= WIN_LENGTH) {
          setWon(true);
          setTimeout(praise, 500);
        } else {
          setTimeout(() => nextRound(sequence), 900);
        }
      }
    } else {
      // Wrong pad: replay the same sequence and try again.
      setTimeout(() => {
        speak("Listen again!");
        setTimeout(() => {
          setProgress(0);
          playSequence(sequence);
        }, 1100);
      }, 300);
    }
  }

  function restart() {
    setWon(false);
    setSequence([]);
    setProgress(0);
    nextRound([]);
  }

  if (won) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🔔</div>
        <h3 className="text-2xl font-bold">Echo champion!</h3>
        <p className="text-zinc-500">
          You remembered {WIN_LENGTH} sounds in a row!
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
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        🔔 Listen to the sounds, then tap them back in the same order!
      </p>
      <p className="text-sm font-semibold text-zinc-400">
        {playingSeq
          ? "👂 Listen…"
          : `Your turn! ${progress} of ${sequence.length}`}{" "}
        · chain of {sequence.length}
      </p>
      <div className="grid grid-cols-2 gap-4">
        {pads.map((letter, i) => (
          <button
            key={letter}
            onClick={() => tap(i)}
            disabled={playingSeq}
            className={`flex h-28 w-28 items-center justify-center rounded-[2rem] text-5xl font-black shadow-md ring-4 transition-all active:scale-90 ${PAD_COLORS[i]} ${
              lit === i
                ? "scale-110 ring-violet-400 brightness-110"
                : "ring-white/60"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
      <button
        onClick={() => playSequence(sequence)}
        disabled={playingSeq}
        className="rounded-full bg-brand-100 px-5 py-2.5 font-bold text-brand-700 shadow-sm active:scale-95 disabled:opacity-50 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the chain again
      </button>
    </div>
  );
}
