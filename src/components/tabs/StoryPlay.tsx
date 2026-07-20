"use client";

import { useState } from "react";
import {
  playStories,
  allPlaySentences,
  type PlaySentence,
} from "@/app/storyPlay";
import { speak, stopSpeech, praise, chime } from "@/lib/speak";
import PutInOrder from "@/components/tabs/PutInOrder";

type Mode = "menu" | "match" | "order" | "build";

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
  if (mode === "order") return <OrderGame onBack={back} />;
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
          onClick={() => onPick("order")}
          className="group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-violet-400 to-violet-600 px-6 py-10 text-white shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-5xl shadow-sm transition-transform group-hover:scale-110">
            🔀
          </span>
          <span className="text-2xl font-extrabold">Put the Story in Order</span>
          <span className="text-center text-sm font-semibold opacity-90">
            Tap the sentences to rebuild the story
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

/* ---------- Game 2: Put the Story in Order ---------- */

type OrderItem = PlaySentence & { order: number };

function OrderGame({ onBack }: { onBack: () => void }) {
  const [storyIdx, setStoryIdx] = useState(() =>
    Math.floor(Math.random() * playStories.length),
  );
  const story = playStories[storyIdx];
  const total = story.sentences.length;

  const [remaining, setRemaining] = useState<OrderItem[]>(() =>
    shuffle(story.sentences.map((s, i) => ({ ...s, order: i }))),
  );
  const [placed, setPlaced] = useState<OrderItem[]>([]);
  const [checked, setChecked] = useState(false);

  const allPlaced = placed.length === total;
  const correct = allPlaced && placed.every((it, i) => it.order === i);

  function reset(nextStory = storyIdx) {
    const s = playStories[nextStory];
    setStoryIdx(nextStory);
    setRemaining(shuffle(s.sentences.map((x, i) => ({ ...x, order: i }))));
    setPlaced([]);
    setChecked(false);
  }

  function place(item: OrderItem) {
    setChecked(false);
    setRemaining((r) => r.filter((x) => x !== item));
    setPlaced((p) => [...p, item]);
  }
  function unplace(item: OrderItem) {
    setChecked(false);
    setPlaced((p) => p.filter((x) => x !== item));
    setRemaining((r) => [...r, item]);
  }

  function check() {
    setChecked(true);
    if (placed.every((it, i) => it.order === i)) {
      chime(true);
      praise();
    } else {
      chime(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <GameBar onBack={onBack} title="Put the Story in Order" />

      <h2 className="mt-4 flex items-center gap-2 text-xl font-extrabold text-violet-700 dark:text-violet-300">
        <span className="text-2xl">{story.emoji}</span> {story.title}
      </h2>
      <p className="text-sm font-semibold text-zinc-500">
        Tap the sentences in the right order to tell the story.
      </p>

      {/* The story so far */}
      <div className="mt-4 flex w-full flex-col gap-2 rounded-2xl bg-violet-50 p-3 dark:bg-zinc-900">
        {placed.length === 0 && (
          <p className="py-6 text-center text-sm font-semibold text-violet-400">
            Your story will appear here…
          </p>
        )}
        {placed.map((it, i) => {
          const right = checked && it.order === i;
          const bad = checked && it.order !== i;
          return (
            <button
              key={it.text}
              onClick={() => unplace(it)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-bold shadow-sm transition-all active:scale-[.98] ${
                right
                  ? "bg-green-100 text-green-800 ring-2 ring-green-300 dark:bg-green-950 dark:text-green-200"
                  : bad
                    ? "bg-rose-100 text-rose-700 ring-2 ring-rose-300 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-white text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-black text-white">
                {i + 1}
              </span>
              <Pic emoji={it.emoji} className="h-9 w-9 shrink-0" />
              <span>{it.text}</span>
            </button>
          );
        })}
      </div>

      {/* Sentences to choose from */}
      {remaining.length > 0 && (
        <div className="mt-4 flex w-full flex-col gap-2">
          {remaining.map((it) => (
            <button
              key={it.text}
              onClick={() => place(it)}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left font-bold text-zinc-700 shadow-sm ring-1 ring-violet-100 transition-all hover:-translate-y-0.5 active:scale-[.98] dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Pic emoji={it.emoji} className="h-9 w-9 shrink-0" />
              <span>{it.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {allPlaced && !(checked && correct) && (
          <button
            onClick={check}
            className="rounded-full bg-violet-500 px-7 py-3 text-lg font-extrabold text-white shadow-lg active:scale-95"
          >
            ✓ Check
          </button>
        )}
        <button
          onClick={() => reset()}
          className="rounded-full bg-white px-6 py-3 font-bold text-violet-700 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-violet-300"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={() => reset((storyIdx + 1) % playStories.length)}
          className="rounded-full bg-zinc-100 px-6 py-3 font-bold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          Next story →
        </button>
      </div>

      {checked && correct && (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] px-8 py-5 text-center shadow-lg ring-4 ring-white/60">
          <div className="text-4xl">⭐⭐⭐</div>
          <p className="text-lg font-extrabold text-violet-800">
            Perfect! You told the whole story! 🎉
          </p>
          <button
            onClick={() => reset((storyIdx + 1) % playStories.length)}
            className="mt-1 rounded-full bg-violet-500 px-7 py-2.5 font-extrabold text-white shadow active:scale-95"
          >
            Next story →
          </button>
        </div>
      )}
    </div>
  );
}
