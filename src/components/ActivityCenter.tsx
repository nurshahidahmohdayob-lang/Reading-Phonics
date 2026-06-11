"use client";

import { useState } from "react";
import type { Lesson } from "@/app/lessons";
import ListenAndFind from "@/components/games/ListenAndFind";
import LetterHunt from "@/components/games/LetterHunt";
import SoundSort from "@/components/games/SoundSort";
import MemoryMatch from "@/components/games/MemoryMatch";
import FirstLetter from "@/components/games/FirstLetter";
import BalloonPop from "@/components/games/BalloonPop";

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

export default function ActivityCenter({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  const [game, setGame] = useState<GameId | null>(null);
  const active = ACTIVITIES.find((a) => a.id === game);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-white/95 px-4 py-6 backdrop-blur dark:bg-black/95">
      {/* Top bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={() => (game ? setGame(null) : onClose())}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {game ? "Activities" : "Lesson"}
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
          <>
            <h2 className="mb-1 text-2xl font-extrabold">Choose an activity 🎮</h2>
            <p className="mb-6 text-zinc-500">
              Practice the &ldquo;{lesson.sound}&rdquo; sound
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setGame(a.id)}
                  className={`group flex flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br ${a.color} ${a.text} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                    {a.emoji}
                  </span>
                  <span className="text-lg font-bold">{a.title}</span>
                  <span className="text-center text-sm font-semibold opacity-80">
                    {a.blurb}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-center">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold">
              <span className="text-3xl">{active.emoji}</span> {active.title}
            </h2>
            {game === "find" && <ListenAndFind lesson={lesson} />}
            {game === "hunt" && <LetterHunt lesson={lesson} />}
            {game === "sort" && <SoundSort lesson={lesson} />}
            {game === "match" && <MemoryMatch lesson={lesson} />}
            {game === "first" && <FirstLetter lesson={lesson} />}
            {game === "pop" && <BalloonPop lesson={lesson} />}
          </div>
        )}
      </div>
    </div>
  );
}
