"use client";

import { useState } from "react";
import { allPlaySentences } from "@/app/storyPlay";
import { speak, stopSpeech, praise, chime } from "@/lib/speak";
import PutInOrder from "@/components/tabs/PutInOrder";

type Mode = "menu" | "match" | "build";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Map an emoji to its bundled Twemoji picture (public/images/emoji/<code>.svg).
   Same codepoint rule as the download step: drop the FE0F variation selector
   for our (non-ZWJ) emoji. */
function emojiSrc(emoji: string): string {
  const s = emoji.includes("‍") ? emoji : emoji.replace(/️/g, "");
  const cps: string[] = [];
  let hi = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (hi) {
      cps.push((0x10000 + ((hi - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      hi = 0;
    } else if (c >= 0xd800 && c <= 0xdbff) hi = c;
    else cps.push(c.toString(16));
  }
  return `/images/emoji/${cps.join("-")}.svg`;
}

function Pic({ emoji, className }: { emoji: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={emojiSrc(emoji)} alt="" draggable={false} className={className} />
  );
}

export default function StoryPlay() {
  const [mode, setMode] = useState<Mode>("menu");
  function back() {
    stopSpeech();
    setMode("menu");
  }
  if (mode === "match") return <MatchGame onBack={back} />;
  if (mode === "build") return <BuildGame onBack={back} />;
  return <Menu onPick={setMode} />;
}

/* ---------- Menu ---------- */

function Menu({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Read, match and put stories in order. Tap a game to play! 🎉
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        <button
          onClick={() => onPick("match")}
          className="group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-10 text-white shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-5xl shadow-sm transition-transform group-hover:scale-110">
            🖼️
          </span>
          <span className="text-2xl font-extrabold">Match the Picture</span>
          <span className="text-center text-sm font-semibold opacity-90">
            Read the sentence, tap the picture that matches
          </span>
        </button>
        <button
          onClick={() => onPick("build")}
          className="group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-10 text-white shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-5xl shadow-sm transition-transform group-hover:scale-110">
            📜
          </span>
          <span className="text-2xl font-extrabold">Build the Story</span>
          <span className="text-center text-sm font-semibold opacity-90">
            Drag the sentences to build a longer story
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Game 3: Build the Story (drag to order) ----------
   The drag activity lives as a self-contained page in /public and is embedded
   through the PutInOrder wrapper, so we just frame it with the shared GameBar. */

function BuildGame({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <GameBar onBack={onBack} title="Build the Story" />
      <div className="mt-4 w-full">
        <PutInOrder />
      </div>
    </div>
  );
}

/* ---------- Shared header ---------- */

function GameBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex w-full items-center justify-between">
      <button
        onClick={onBack}
        className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
      >
        ← Games
      </button>
      <span className="rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
        {title}
      </span>
    </div>
  );
}

/* ---------- Game 1: Match the Picture ---------- */

type MatchQ = { text: string; answer: string; options: string[] };
const MATCH_COUNT = 8;

function buildMatchGame(): MatchQ[] {
  const emojis = [...new Set(allPlaySentences.map((s) => s.emoji))];
  return shuffle(allPlaySentences)
    .slice(0, MATCH_COUNT)
    .map((s) => {
      const distractors = shuffle(emojis.filter((e) => e !== s.emoji)).slice(0, 2);
      return { text: s.text, answer: s.emoji, options: shuffle([s.emoji, ...distractors]) };
    });
}

function MatchGame({ onBack }: { onBack: () => void }) {
  const [questions, setQuestions] = useState<MatchQ[]>(buildMatchGame);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [missed, setMissed] = useState(false);
  const [solved, setSolved] = useState(false);

  const q = questions[idx];
  const done = idx >= questions.length;

  function pick(emoji: string) {
    if (solved) return;
    if (emoji === q.answer) {
      setSolved(true);
      chime(true);
      praise();
      if (!missed) setScore((s) => s + 1);
      setTimeout(() => {
        setSolved(false);
        setWrong(null);
        setMissed(false);
        setIdx((i) => i + 1);
      }, 950);
    } else {
      chime(false);
      setWrong(emoji);
      setMissed(true);
    }
  }

  function again() {
    setQuestions(buildMatchGame());
    setIdx(0);
    setScore(0);
    setWrong(null);
    setMissed(false);
    setSolved(false);
  }

  if (done) {
    const stars = score >= 7 ? 3 : score >= 4 ? 2 : 1;
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
        <GameBar onBack={onBack} title="Match the Picture" />
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] px-10 py-10 text-center shadow-lg ring-4 ring-white/60">
          <div className="text-5xl">{"⭐".repeat(stars)}</div>
          <h2 className="text-2xl font-extrabold text-sky-800">Great reading!</h2>
          <p className="font-bold text-sky-700">
            You matched {score} of {questions.length} on the first try.
          </p>
          <button
            onClick={again}
            className="mt-2 rounded-full bg-sky-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg active:scale-95"
          >
            🔁 Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <GameBar onBack={onBack} title="Match the Picture" />

      <div className="mt-3 h-2.5 w-full max-w-xl overflow-hidden rounded-full bg-white/70 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all"
          style={{ width: `${(idx / questions.length) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-bold text-zinc-400">
        {idx + 1} / {questions.length}
      </p>

      <div className="mt-4 flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#EAF4FF] to-[#D3EBFF] px-6 py-8 text-center shadow-lg ring-4 ring-white/60">
        <span className="text-sm font-bold uppercase tracking-wide text-sky-500/80">
          Which picture?
        </span>
        <p className="text-2xl font-black text-zinc-800">{q.text}</p>
        <button
          onClick={() => speak(q.text, 0.85)}
          className="rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-sky-700 shadow-sm active:scale-95"
        >
          🔊 Read it
        </button>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-4">
        {q.options.map((emoji) => {
          const isRight = solved && emoji === q.answer;
          const isWrong = wrong === emoji;
          return (
            <button
              key={emoji}
              onClick={() => pick(emoji)}
              className={`grid h-28 w-28 place-items-center rounded-3xl shadow-md ring-4 transition-all active:scale-90 ${
                isRight
                  ? "bg-green-100 ring-green-300"
                  : isWrong
                    ? "bg-rose-100 ring-rose-300"
                    : "bg-white ring-white/60 hover:-translate-y-1 dark:bg-zinc-800"
              }`}
            >
              <Pic emoji={emoji} className="h-20 w-20" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
