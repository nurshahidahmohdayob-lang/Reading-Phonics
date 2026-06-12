"use client";

import { useState } from "react";
import type { Lesson } from "@/app/lessons";
import ListenAndFind, { type FindDifficulty } from "@/components/games/ListenAndFind";
import LetterHunt, { type HuntDifficulty } from "@/components/games/LetterHunt";
import SoundSort, { type SortDifficulty } from "@/components/games/SoundSort";
import MemoryMatch, { type MatchDifficulty } from "@/components/games/MemoryMatch";
import FirstLetter, { type FirstDifficulty } from "@/components/games/FirstLetter";
import BalloonPop, { type BalloonDifficulty } from "@/components/games/BalloonPop";
import RhymeTime, { type RhymeDifficulty } from "@/components/games/RhymeTime";
import OddSoundOut, { type OddDifficulty } from "@/components/games/OddSoundOut";

type GameId = "find" | "hunt" | "sort" | "match" | "first" | "pop" | "rhyme" | "odd";
type Difficulty = "easy" | "medium" | "hard";

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
  {
    id: "rhyme",
    title: "Rhyme Time",
    blurb: "Tap two words that rhyme",
    emoji: "🎶",
    color: "from-[#CFF5E1] to-[#A7E9C8]", // mint
    text: "text-emerald-700",
  },
  {
    id: "odd",
    title: "Odd Sound Out",
    blurb: "Hear the words, catch the odd one",
    emoji: "👂",
    color: "from-[#E9DFFF] to-[#D2C0FF]", // lilac
    text: "text-violet-700",
  },
];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const MODE_CHIPS: Record<Difficulty, { emoji: string; chip: string }> = {
  easy: { emoji: "🐢", chip: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] text-emerald-700" },
  medium: { emoji: "🐰", chip: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C] text-amber-700" },
  hard: { emoji: "🚀", chip: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB] text-pink-700" },
};

const MODE_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/* What grows per game as the challenge rises. */
const GAME_MODES: Record<
  GameId,
  { prompt: string; blurbs: Record<Difficulty, string> }
> = {
  find: {
    prompt: "How many pictures to choose from?",
    blurbs: {
      easy: "8 rounds · 3 pictures",
      medium: "10 rounds · 4 pictures",
      hard: "12 rounds · 6 pictures!",
    },
  },
  hunt: {
    prompt: "How tricky should the hunt be?",
    blurbs: {
      easy: "3 boards · 4 letters each",
      medium: "3 boards · 6 letters each",
      hard: "2 huge boards · 8 letters!",
    },
  },
  sort: {
    prompt: "How many sounds to sort?",
    blurbs: {
      easy: "3 boards · find 3 each",
      medium: "3 boards · find 4 each",
      hard: "3 boards · find 5 each!",
    },
  },
  match: {
    prompt: "How many pairs to remember?",
    blurbs: {
      easy: "3 boards of 3 pairs",
      medium: "3 boards of 4 pairs",
      hard: "2 boards of 6 pairs!",
    },
  },
  first: {
    prompt: "How many letters to choose from?",
    blurbs: {
      easy: "8 rounds · 3 letters",
      medium: "10 rounds · 4 letters",
      hard: "12 rounds · 5 letters!",
    },
  },
  pop: {
    prompt: "How fast should the balloons float up?",
    blurbs: {
      easy: "Pop 10 floaty balloons",
      medium: "Pop 14 in a breeze",
      hard: "Pop 18 — they zoom up fast!",
    },
  },
  rhyme: {
    prompt: "How many rhymes to find?",
    blurbs: {
      easy: "5 rhyming pairs",
      medium: "6 rhyming pairs",
      hard: "7 rhyming pairs!",
    },
  },
  odd: {
    prompt: "How sneaky should the sounds be?",
    blurbs: {
      easy: "8 rounds · easy sounds",
      medium: "10 rounds · sneaky sounds",
      hard: "12 rounds · very sneaky!",
    },
  },
};

function storeKey(game: GameId) {
  return `phonics-game-${game}`;
}

function loadDone(game: GameId): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey(game)) ?? "[]");
    return new Set(raw.map(String));
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
  const [mode, setMode] = useState<Difficulty | null>(null);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(false);
  const active = ACTIVITIES.find((a) => a.id === game);

  function openGame(id: GameId) {
    setGame(id);
    setDoneSet(loadDone(id));
    setMode(null);
    setWon(false);
  }

  function completeMode() {
    if (!game || !mode) return;
    setDoneSet((prev) => {
      const next = new Set(prev).add(mode);
      localStorage.setItem(storeKey(game), JSON.stringify([...next]));
      return next;
    });
    setWon(true);
  }

  function back() {
    if (won) {
      setWon(false);
      setMode(null);
    } else if (mode !== null) setMode(null);
    else if (game) setGame(null);
    else onClose();
  }

  const nextMode: Difficulty | null =
    mode === "easy" ? "medium" : mode === "medium" ? "hard" : null;

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Top bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={back}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {mode !== null ? "Modes" : game ? "Activities" : "Lesson"}
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
              Practice the &ldquo;{lesson.sound}&rdquo; sound · easy, medium
              &amp; hard
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
                    Easy · Medium · Hard
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : mode === null ? (
          /* ---- Easy / Medium / Hard picker ---- */
          <>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-extrabold">
              <span className="text-3xl">{active.emoji}</span> {active.title}
            </h2>
            <p className="mb-5 text-sm text-zinc-500">
              {GAME_MODES[active.id].prompt}
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setMode(d);
                    setWon(false);
                  }}
                  className={`group relative flex flex-col items-center gap-2 rounded-[2rem] ${MODE_CHIPS[d].chip} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  {doneSet.has(d) && (
                    <span className="absolute right-3 top-3 text-xl">⭐</span>
                  )}
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                    {MODE_CHIPS[d].emoji}
                  </span>
                  <span className="text-lg font-bold">{MODE_LABEL[d]}</span>
                  <span className="text-center text-sm font-semibold opacity-80">
                    {GAME_MODES[active.id].blurbs[d]}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : won ? (
          /* ---- Mode beaten ---- */
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-12 py-10 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
            <div className="text-7xl">🏆</div>
            <h3 className="text-2xl font-extrabold">
              {MODE_LABEL[mode]} mode beaten!
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setWon(false);
                  setMode(null);
                }}
                className="rounded-full bg-white px-6 py-3 font-bold text-amber-700 shadow active:scale-95"
              >
                All modes
              </button>
              {nextMode && (
                <button
                  onClick={() => {
                    setWon(false);
                    setMode(nextMode);
                  }}
                  className="rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow active:scale-95"
                >
                  {MODE_LABEL[nextMode]} →
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ---- Playing ---- */
          <div className="flex w-full flex-col items-center">
            <p className="mb-4 rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-zinc-500 shadow-sm">
              {active.emoji} {active.title} · {MODE_CHIPS[mode].emoji}{" "}
              {MODE_LABEL[mode]} mode
            </p>
            {game === "find" && (
              <ListenAndFind
                key={`find-${mode}`}
                lesson={lesson}
                difficulty={mode as FindDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "hunt" && (
              <LetterHunt
                key={`hunt-${mode}`}
                lesson={lesson}
                difficulty={mode as HuntDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "sort" && (
              <SoundSort
                key={`sort-${mode}`}
                lesson={lesson}
                difficulty={mode as SortDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "match" && (
              <MemoryMatch
                key={`match-${mode}`}
                lesson={lesson}
                difficulty={mode as MatchDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "first" && (
              <FirstLetter
                key={`first-${mode}`}
                lesson={lesson}
                difficulty={mode as FirstDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "pop" && (
              <BalloonPop
                key={`pop-${mode}`}
                lesson={lesson}
                difficulty={mode as BalloonDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "rhyme" && (
              <RhymeTime
                key={`rhyme-${mode}`}
                difficulty={mode as RhymeDifficulty}
                onDone={completeMode}
              />
            )}
            {game === "odd" && (
              <OddSoundOut
                key={`odd-${mode}`}
                difficulty={mode as OddDifficulty}
                onDone={completeMode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
