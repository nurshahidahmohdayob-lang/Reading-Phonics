"use client";

import { useState } from "react";
import { useEffect, useMemo } from "react";
import { levels, type Level, type Story } from "@/app/stories";
import { storyQuizzes } from "@/app/storyQuiz";
import { describe, POS_BADGE, POS_COLOR } from "@/app/dictionary";
import { speak, stopSpeech, praise, chime } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";
import StoryGames from "@/components/StoryGames";
import StoryColouring from "@/components/StoryColouring";
import ColouringGallery from "@/components/ColouringGallery";
import GrammarLegend from "@/components/GrammarLegend";

const PER_PAGE = 10;

/* Candy palette cycled across cards. */
const CARD_STYLES = [
  {
    bg: "bg-gradient-to-br from-[#FFA3CF] to-[#FF75B5]",
    text: "text-pink-900",
  },
  {
    bg: "bg-gradient-to-br from-[#FFC27A] to-[#FF9B3D]",
    text: "text-orange-900",
  },
  {
    bg: "bg-gradient-to-br from-[#7DEBB0] to-[#3DD68C]",
    text: "text-emerald-900",
  },
  {
    bg: "bg-gradient-to-br from-[#FFEA70] to-[#FFD21F]",
    text: "text-amber-900",
  },
  { bg: "bg-gradient-to-br from-[#8FD1FF] to-[#4DB2FF]", text: "text-sky-900" },
  {
    bg: "bg-gradient-to-br from-[#C9B3FF] to-[#A27DFF]",
    text: "text-violet-900",
  },
];

const LEVEL_EMOJI = ["🐣", "🌱", "🦋", "🚀", "🌈", "🏆"];

export default function Stories() {
  const [level, setLevel] = useState<Level | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [colouring, setColouring] = useState<number | null>(null);
  const [gallery, setGallery] = useState(false);

  if (gallery) return <ColouringGallery onBack={() => setGallery(false)} />;

  if (level && colouring !== null) {
    return (
      <StoryColouring
        story={level.stories[colouring]}
        onClose={() => setColouring(null)}
      />
    );
  }

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
        onColour={setColouring}
        onGallery={() => setGallery(true)}
      />
    );
  }

  return <LevelGrid onPick={setLevel} onGallery={() => setGallery(true)} />;
}

/* ---------- Level chooser (Lexile bands) ---------- */

function LevelGrid({
  onPick,
  onGallery,
}: {
  onPick: (l: Level) => void;
  onGallery: () => void;
}) {
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full justify-end">
        <button
          onClick={onGallery}
          className="ml-auto rounded-full bg-white px-4 py-2 text-sm font-extrabold text-amber-800 shadow-sm ring-2 ring-amber-200 active:scale-95 dark:bg-zinc-800 dark:text-amber-200"
        >
          🖼️ Colouring sent in
        </button>
      </div>
      <p className="mt-2 text-center text-zinc-500 dark:text-zinc-400">
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
  onColour,
  onGallery,
}: {
  level: Level;
  onBack: () => void;
  onPick: (index: number) => void;
  onColour: (index: number) => void;
  onGallery: () => void;
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
        <button
          onClick={onGallery}
          className="ml-auto rounded-full bg-white px-4 py-2 text-sm font-extrabold text-amber-800 shadow-sm ring-2 ring-amber-200 active:scale-95 dark:bg-zinc-800 dark:text-amber-200"
        >
          🖼️ Colouring sent in
        </button>
      </div>

      <h2 className="mt-6 text-xl font-extrabold">Pick a story 📖</h2>
      <p className="text-sm text-zinc-400">
        Stories {start + 1}–{start + slice.length} of {level.stories.length}
      </p>

      <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {slice.map((s, i) => {
          const style = CARD_STYLES[(start + i) % CARD_STYLES.length];
          return (
            <div
              key={s.id}
              className={`group flex items-center gap-4 rounded-[2rem] ${style.bg} ${style.text} p-5 shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <button
                onClick={() => onPick(start + i)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left active:scale-95"
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
              <button
                onClick={() => onColour(start + i)}
                aria-label={`Colour a picture for ${s.title}`}
                className="flex shrink-0 flex-col items-center rounded-2xl bg-white/80 px-3 py-2 text-xs font-extrabold shadow-sm transition-transform hover:scale-105 active:scale-90"
              >
                <span className="text-2xl">🖍️</span>
                Colour
              </button>
            </div>
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
  const [picked, setPicked] = useState<string | null>(null);
  const entry = picked ? describe(picked) : null;
  const [colors, setColors] = useState(true);

  // Work out each word's part of speech once, so colouring is free on re-render.
  const tokens = useMemo(
    () =>
      text.split(" ").map((word) => {
        const clean = word.replace(/[.,!?;:"“”]/g, "");
        return { word, clean, pos: describe(clean).pos };
      }),
    [text],
  );

  // Changing story closes the word card, resets the quiz, stops the voice.
  useEffect(() => {
    setPicked(null);
    stopSpeech();
  }, [index]);

  // Leaving the reader stops the voice too.
  useEffect(() => () => stopSpeech(), []);

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
        <span
          className={`shrink-0 rounded-full ${level.swatch} ${level.swatchText} px-3 py-1 text-xs font-bold`}
        >
          {level.grade} · {story.lexile}L
        </span>
      </div>

      {/* Story title (same look as Guided Reading) */}
      <h2 className="mt-5 flex items-center gap-2 text-2xl font-extrabold text-amber-900 dark:text-amber-100">
        <span className="anim-bob text-3xl">{story.emoji}</span>
        {story.title}
      </h2>
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Tap any word to hear it and see its picture ✨
      </p>

      {/* The passage on storybook paper (same as Guided Reading) */}
      <div
        className="mt-5 w-full rounded-[2rem] p-7 text-2xl font-bold leading-relaxed shadow-lg ring-4 ring-white/60 dark:bg-zinc-900"
        style={{
          background:
            "radial-gradient(circle at 12% 10%, rgba(255,255,255,.65) 0 90px, transparent 90px)," +
            "linear-gradient(#FFFBEE, #FFF1D6)",
        }}
      >
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          {tokens.map(({ word, clean, pos }, i) => (
            <button
              key={i}
              onClick={() => {
                sayWord(clean);
                setPicked(clean.toLowerCase());
              }}
              className={`rounded-lg px-1 transition-colors hover:bg-amber-200/70 active:bg-amber-300/70 ${
                colors ? POS_COLOR[pos] : "text-zinc-800"
              } ${picked === clean.toLowerCase() ? "bg-amber-200/80" : ""}`}
            >
              {word}
            </button>
          ))}
        </p>
      </div>

      <div className="mt-4">
        <GrammarLegend on={colors} onToggle={() => setColors((v) => !v)} />
      </div>

      {/* Picture dictionary for the tapped word (same as Guided Reading) */}
      {picked && (
        <div className="relative mt-4 flex w-full max-w-md flex-col items-center gap-2 rounded-2xl bg-white/85 p-5 text-center shadow-md ring-2 ring-amber-200">
          <button
            onClick={() => setPicked(null)}
            aria-label="Close meaning"
            className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold text-zinc-500 shadow ring-2 ring-amber-200 active:scale-90"
          >
            ✕
          </button>
          {entry ? (
            <>
              <div
                className="relative grid h-32 w-44 place-items-center overflow-hidden rounded-2xl shadow-inner ring-4 ring-white"
                style={{
                  background:
                    "linear-gradient(180deg, #BFE3FF 0%, #BFE3FF 62%, #C8EFB5 62%, #B7E6A0 100%)",
                }}
              >
                <span className="absolute right-2 top-1 text-xl">🌤️</span>
                <span className="absolute left-2 top-2 text-sm opacity-80">
                  ☁️
                </span>
                <span className="relative text-6xl drop-shadow-md">
                  {entry.emoji}
                </span>
              </div>
              <span className="text-xl font-extrabold lowercase text-amber-800">
                {picked}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${POS_BADGE[entry.pos].chip}`}
              >
                {POS_BADGE[entry.pos].label}
              </span>
              <p className="text-base font-semibold text-zinc-700">
                {entry.meaning}
              </p>
              <button
                onClick={() => speak(`${picked}. ${entry.meaning}`, 0.85)}
                className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800 active:scale-95"
              >
                🔊 Read meaning
              </button>
            </>
          ) : (
            <>
              <span className="text-5xl">🔎</span>
              <span className="text-xl font-extrabold lowercase text-amber-800">
                {picked}
              </span>
              <p className="text-base font-semibold text-zinc-600">
                No picture for this word yet — listen and sound it out!
              </p>
              <button
                onClick={() => sayWord(picked, 0.5)}
                className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800 active:scale-95"
              >
                🐢 Say it slowly
              </button>
            </>
          )}
        </div>
      )}

      {/* Ten questions after the story */}
      <StoryQuestions key={story.id} story={story} />

      {/* Controls */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => speak(text, 0.8)}
          className="flex items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-base font-bold text-amber-800 shadow-sm active:scale-95"
        >
          🔊 Read to me
        </button>
        <button
          onClick={stopSpeech}
          className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-base font-extrabold text-white shadow-md active:scale-95"
        >
          ⏹ Stop
        </button>
        <button
          onClick={() => setPlaying(true)}
          className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-base font-extrabold text-white shadow-md active:scale-95"
        >
          🎮 Play Games
        </button>
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

/** The story's questions one at a time: tap an answer, see if it was right,
    then go on. A score and a "try again" come at the end. */
function StoryQuestions({ story }: { story: Story }) {
  const quizzes = useMemo(() => storyQuizzes(story), [story]);
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    quizzes.map(() => null),
  );
  if (quizzes.length === 0) return null;

  const done = qi >= quizzes.length;
  const score = picks.filter((p, i) => p === quizzes[i]?.answer).length;
  const quiz = quizzes[Math.min(qi, quizzes.length - 1)];
  const pick = picks[qi] ?? null;

  function choose(i: number) {
    if (pick !== null) return;
    setPicks((p) => p.map((v, k) => (k === qi ? i : v)));
    if (i === quiz.answer) {
      chime(true);
      praise();
    } else {
      chime(false);
    }
  }

  return (
    <div className="mt-4 w-full max-w-2xl rounded-2xl bg-amber-50/80 p-5 ring-2 ring-amber-200 dark:bg-amber-950/40">
      {/* Progress dots — green right, rose wrong, tap to look back */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {quizzes.map((q, i) => {
          const p = picks[i];
          const tone =
            p === null
              ? i === qi
                ? "bg-amber-400 text-white"
                : "bg-white text-amber-700 dark:bg-zinc-800"
              : p === q.answer
                ? "bg-green-500 text-white"
                : "bg-rose-400 text-white";
          return (
            <button
              key={i}
              onClick={() => setQi(i)}
              aria-label={`Question ${i + 1}`}
              className={`h-8 w-8 rounded-full text-sm font-extrabold shadow-sm active:scale-90 ${tone} ${
                i === qi ? "ring-2 ring-amber-500 ring-offset-1" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {done ? (
        <div className="mt-4 text-center">
          <p className="text-4xl">
            {score === quizzes.length
              ? "🏆"
              : score >= quizzes.length / 2
                ? "🌟"
                : "💪"}
          </p>
          <p className="mt-2 text-xl font-extrabold text-amber-900 dark:text-amber-100">
            You got {score} out of {quizzes.length}!
          </p>
          <button
            onClick={() => {
              setPicks(quizzes.map(() => null));
              setQi(0);
            }}
            className="mt-3 rounded-full bg-amber-500 px-5 py-2 font-extrabold text-white shadow-md active:scale-95"
          >
            🔁 Try again
          </button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-amber-700">
            Question {qi + 1} of {quizzes.length}
          </p>
          <p className="mt-1 text-center text-base font-extrabold text-amber-900 dark:text-amber-100">
            ❓ {quiz.question}
            <button
              onClick={() => speak(quiz.question, 0.85)}
              aria-label="Read the question"
              className="ml-2 align-middle text-lg active:scale-90"
            >
              🔊
            </button>
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {quiz.options.map((opt, i) => {
              const isRight = pick !== null && i === quiz.answer;
              const isWrongPick = pick === i && i !== quiz.answer;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-base font-bold transition-all active:scale-[0.98] ${
                    isRight
                      ? "border-green-400 bg-green-50 text-green-800"
                      : isWrongPick
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : pick !== null
                          ? "border-transparent bg-white text-zinc-400 dark:bg-zinc-900"
                          : "border-transparent bg-white text-zinc-700 hover:border-amber-300 dark:bg-zinc-900 dark:text-zinc-200"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  {opt.label}
                  {isRight && <span className="ml-auto">🎉</span>}
                  {isWrongPick && <span className="ml-auto">✖️</span>}
                </button>
              );
            })}
          </div>
          {pick !== null && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setQi(qi + 1)}
                className="rounded-full bg-amber-500 px-6 py-2 font-extrabold text-white shadow-md active:scale-95"
              >
                {qi + 1 < quizzes.length
                  ? "Next question ➡️"
                  : "See my score ⭐"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
