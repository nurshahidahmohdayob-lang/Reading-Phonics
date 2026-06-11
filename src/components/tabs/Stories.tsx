"use client";

import { useState } from "react";
import { levels, type Level } from "@/app/stories";
import { speak } from "@/lib/speak";
import StoryGames from "@/components/StoryGames";

const PER_PAGE = 10;

/* Candy palette cycled across cards. */
const CARD_STYLES = [
  { bg: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]", text: "text-pink-700" },
  { bg: "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1]", text: "text-orange-700" },
  { bg: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" },
  { bg: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C]", text: "text-amber-700" },
  { bg: "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF]", text: "text-sky-700" },
  { bg: "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" },
];

const LEVEL_EMOJI = ["🐣", "🌱", "🦋", "🚀", "🌈", "🏆"];

export default function Stories() {
  const [level, setLevel] = useState<Level | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  if (level && storyIndex !== null) {
    return (
      <Reader
        level={level}
        index={storyIndex}
        onIndex={setStoryIndex}
        onBack={() => setStoryIndex(null)}
      />
    );
  }

  if (level) {
    return (
      <StoryList
        level={level}
        onBack={() => setLevel(null)}
        onPick={setStoryIndex}
      />
    );
  }

  return <LevelGrid onPick={setLevel} />;
}

/* ---------- Level chooser (Lexile bands) ---------- */

function LevelGrid({ onPick }: { onPick: (l: Level) => void }) {
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Choose your reading level — sorted by Lexile measure.
      </p>
      <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {levels.map((l, i) => {
          const style = CARD_STYLES[i % CARD_STYLES.length];
          return (
            <button
              key={l.id}
              onClick={() => onPick(l)}
              className={`group flex items-center gap-4 rounded-[2rem] ${style.bg} ${style.text} p-5 text-left shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                {LEVEL_EMOJI[i % LEVEL_EMOJI.length]}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-extrabold">
                  {l.grade}{" "}
                  <span className="text-sm font-semibold opacity-70">
                    · Age {l.age}
                  </span>
                </span>
                <span className="w-fit rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
                  Lexile {l.lexileRange} · {l.stories.length} stories
                </span>
                <span className="text-sm font-semibold opacity-80">
                  {l.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Story list, 10 per page ---------- */

function StoryList({
  level,
  onBack,
  onPick,
}: {
  level: Level;
  onBack: () => void;
  onPick: (index: number) => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(level.stories.length / PER_PAGE);
  const start = page * PER_PAGE;
  const slice = level.stories.slice(start, start + PER_PAGE);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Levels
        </button>
        <span
          className={`rounded-full ${level.swatch} ${level.swatchText} px-4 py-1.5 text-sm font-bold`}
        >
          {level.grade} · Age {level.age}
        </span>
      </div>

      <h2 className="mt-6 text-xl font-extrabold">Pick a story 📖</h2>
      <p className="text-sm text-zinc-400">
        Stories {start + 1}–{start + slice.length} of {level.stories.length}
      </p>

      <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {slice.map((s, i) => {
          const style = CARD_STYLES[(start + i) % CARD_STYLES.length];
          return (
            <button
              key={s.id}
              onClick={() => onPick(start + i)}
              className={`group flex items-center gap-4 rounded-[2rem] ${style.bg} ${style.text} p-5 text-left shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                {s.emoji}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-extrabold">{s.title}</span>
                <span className="w-fit rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
                  {s.lexile}L · {s.pages[0].text.split(/\s+/).length} words
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Page navigation through the library */}
      <nav className="mt-6 flex w-full items-center justify-between gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-base font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Prev
        </button>
        <span className="shrink-0 text-sm font-semibold text-zinc-400">
          Page {page + 1} / {pageCount}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page >= pageCount - 1}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand-500 text-base font-bold text-white shadow-md hover:bg-brand-600 active:scale-95 disabled:opacity-40"
        >
          Next 10 →
        </button>
      </nav>
    </div>
  );
}

/* ---------- Single-page story reader ---------- */

function Reader({
  level,
  index,
  onIndex,
  onBack,
}: {
  level: Level;
  index: number;
  onIndex: (i: number) => void;
  onBack: () => void;
}) {
  const story = level.stories[index];
  const text = story.pages[0].text;
  const isFirst = index === 0;
  const isLast = index === level.stories.length - 1;
  const [playing, setPlaying] = useState(false);

  // Games open as their own page, not a floating window.
  if (playing) {
    return (
      <StoryGames
        title={story.title}
        text={text}
        onClose={() => setPlaying(false)}
      />
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Stories
        </button>
        <span className="truncate px-2 font-bold">{story.title}</span>
        <span
          className={`shrink-0 rounded-full ${level.swatch} ${level.swatchText} px-3 py-1 text-xs font-bold`}
        >
          {story.lexile}L
        </span>
      </div>

      {/* The whole story on one storybook page */}
      <div
        className="mt-6 flex w-full flex-1 flex-col items-center gap-6 rounded-[2rem] p-7 shadow-lg ring-4 ring-white/60 dark:bg-zinc-900"
        style={{
          background:
            "radial-gradient(circle at 12% 10%, rgba(255,255,255,.65) 0 90px, transparent 90px)," +
            "linear-gradient(#FFFBEE, #FFF1D6)",
        }}
      >
        <div className="anim-bob text-7xl leading-none">{story.emoji}</div>
        <h3 className="text-center text-3xl font-extrabold text-amber-900">
          {story.title}
        </h3>
        <div className="h-1 w-28 rounded-full bg-gradient-to-r from-pink-300 via-amber-300 to-sky-300" />

        {/* Tap any word to hear it */}
        <p className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 text-center text-xl font-semibold leading-relaxed text-zinc-800 sm:text-2xl">
          {text.split(" ").map((word, i) => (
            <button
              key={i}
              onClick={() => speak(word.replace(/[.,!?;:"]/g, ""))}
              className="rounded-md px-0.5 transition-colors hover:bg-amber-200/70 active:bg-amber-300/70"
            >
              {word}
            </button>
          ))}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => speak(text, 0.8)}
            className="flex items-center gap-2 rounded-full bg-white/80 px-6 py-3 text-lg font-bold text-amber-700 shadow-sm active:scale-95"
          >
            🔊 Read to me
          </button>
          <button
            onClick={() => setPlaying(true)}
            className="flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white shadow-md active:scale-95"
          >
            🎮 Play Games
          </button>
        </div>
      </div>


      {/* Move between different stories */}
      <nav className="mt-6 flex w-full items-center justify-between gap-4">
        <button
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={isFirst}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-white text-lg font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Back
        </button>
        <span className="shrink-0 text-sm font-semibold text-zinc-400">
          {index + 1} / {level.stories.length}
        </span>
        <button
          onClick={() => onIndex(Math.min(level.stories.length - 1, index + 1))}
          disabled={isLast}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-md hover:bg-brand-600 active:scale-95 disabled:opacity-40"
        >
          Next story →
        </button>
      </nav>
    </div>
  );
}
