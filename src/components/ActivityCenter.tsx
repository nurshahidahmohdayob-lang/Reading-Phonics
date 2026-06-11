"use client";

import { useState } from "react";
import type { Lesson } from "@/app/lessons";
import ListenAndFind from "@/components/games/ListenAndFind";
import LetterHunt from "@/components/games/LetterHunt";
import SoundSort from "@/components/games/SoundSort";
import MemoryMatch from "@/components/games/MemoryMatch";
import FirstLetter from "@/components/games/FirstLetter";
import BalloonPop from "@/components/games/BalloonPop";

const TOTAL_LEVELS = 50;

type GameId = "find" | "hunt" | "sort" | "match" | "first" | "pop";

const ACTIVITIES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  {
    id: "find",
    title: "Listen & Find",
    blurb: "Hear a word, tap the picture",
    emoji: "👂",
    color: "from-[#D3EBFF] to-[#ABD9FF]", // sky
    text: "text-sky-700",
  },
  {
    id: "hunt",
    title: "Letter Hunt",
    blurb: "Tap every hidden letter",
    emoji: "🔍",
    color: "from-[#CFF5E1] to-[#A7E9C8]", // mint
    text: "text-emerald-700",
  },
  {
    id: "sort",
    title: "Sound Sort",
    blurb: "Pick the matching sounds",
    emoji: "🧺",
    color: "from-[#FFE8C9] to-[#FFD3A1]", // peach
    text: "text-orange-700",
  },
  {
    id: "match",
    title: "Match Pairs",
    blurb: "Flip cards to find pairs",
    emoji: "🃏",
    color: "from-[#E9DFFF] to-[#D2C0FF]", // lilac
    text: "text-violet-700",
  },
  {
    id: "first",
    title: "First Letter",
    blurb: "Which letter starts the word?",
    emoji: "🚀",
    color: "from-[#FFD9EA] to-[#FFC0DB]", // pink
    text: "text-pink-700",
  },
  {
    id: "pop",
    title: "Balloon Pop",
    blurb: "Pop big & small letters",
    emoji: "🎈",
    color: "from-[#FFF4BD] to-[#FFE88C]", // lemon
    text: "text-amber-700",
  },
];

/* Level-button colours by band of ten. */
const LEVEL_BANDS = [
  "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB] text-pink-700",
  "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1] text-orange-700",
  "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] text-emerald-700",
  "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] text-sky-700",
  "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] text-violet-700",
];

function storeKey(game: GameId) {
  return `phonics-game-${game}`;
}

function loadDone(game: GameId): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(storeKey(game)) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function ActivityCenter({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  const [game, setGame] = useState<GameId | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [won, setWon] = useState(false);
  const active = ACTIVITIES.find((a) => a.id === game);

  function openGame(id: GameId) {
    setGame(id);
    setDoneSet(loadDone(id));
    setLevel(null);
    setWon(false);
  }

  function completeLevel() {
    if (!game || level === null) return;
    setDoneSet((prev) => {
      const next = new Set(prev).add(level);
      localStorage.setItem(storeKey(game), JSON.stringify([...next]));
      return next;
    });
    setWon(true);
  }

  function back() {
    if (won) {
      setWon(false);
      setLevel(null);
    } else if (level !== null) setLevel(null);
    else if (game) setGame(null);
    else onClose();
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Top bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={back}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {level !== null ? "Levels" : game ? "Activities" : "Lesson"}
        </button>
        <span className="flex items-center gap-2 text-lg font-bold">
          Sound:
          <span className="rounded-lg bg-brand-100 px-3 py-1 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {lesson.letter} &ldquo;{lesson.sound}&rdquo;
          </span>
        </span>
        <button
          onClick={onClose}
          aria-label="Close activities"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-500 active:scale-95 dark:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="mt-8 flex w-full max-w-3xl flex-1 flex-col items-center">
        {!active ? (
          /* ---- Activity picker ---- */
          <>
            <h2 className="mb-1 text-2xl font-extrabold">
              Choose an activity 🎮
            </h2>
            <p className="mb-6 text-zinc-500">
              Practice the &ldquo;{lesson.sound}&rdquo; sound · 50 levels each
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openGame(a.id)}
                  className={`group flex flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br ${a.color} ${a.text} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                    {a.emoji}
                  </span>
                  <span className="text-lg font-bold">{a.title}</span>
                  <span className="text-center text-sm font-semibold opacity-80">
                    {a.blurb}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                    50 levels
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : level === null ? (
          /* ---- Level grid for the chosen activity ---- */
          <>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-extrabold">
              <span className="text-3xl">{active.emoji}</span> {active.title}
            </h2>
            <p className="mb-1 rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-violet-500 shadow-sm">
              ⭐ {doneSet.size} / {TOTAL_LEVELS} levels done
            </p>
            <p className="mb-5 text-sm text-zinc-500">
              Pick a level — it gets harder as the numbers climb!
            </p>
            <div className="grid w-full grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(
                (lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setLevel(lvl);
                      setWon(false);
                    }}
                    className={`relative flex h-12 items-center justify-center rounded-2xl text-base font-black shadow-sm ring-2 ring-white/70 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-90 ${
                      LEVEL_BANDS[Math.floor((lvl - 1) / 10)]
                    }`}
                  >
                    {lvl}
                    {doneSet.has(lvl) && (
                      <span className="absolute -right-1 -top-1 text-xs">
                        ⭐
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </>
        ) : won ? (
          /* ---- Level complete ---- */
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-12 py-10 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
            <div className="text-7xl">🏆</div>
            <h3 className="text-2xl font-extrabold">
              Level {level} complete!
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setLevel(null)}
                className="rounded-full bg-white px-6 py-3 font-bold text-amber-700 shadow active:scale-95"
              >
                All levels
              </button>
              {level < TOTAL_LEVELS && (
                <button
                  onClick={() => {
                    setWon(false);
                    setLevel(level + 1);
                  }}
                  className="rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow active:scale-95"
                >
                  Level {level + 1} →
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ---- Playing a level ---- */
          <div className="flex w-full flex-col items-center">
            <p className="mb-4 rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-zinc-500 shadow-sm">
              {active.emoji} {active.title} · Level {level} of {TOTAL_LEVELS}
            </p>
            {game === "find" && (
              <ListenAndFind
                key={`find-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
            {game === "hunt" && (
              <LetterHunt
                key={`hunt-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
            {game === "sort" && (
              <SoundSort
                key={`sort-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
            {game === "match" && (
              <MemoryMatch
                key={`match-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
            {game === "first" && (
              <FirstLetter
                key={`first-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
            {game === "pop" && (
              <BalloonPop
                key={`pop-${level}`}
                lesson={lesson}
                level={level}
                onDone={completeLevel}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
