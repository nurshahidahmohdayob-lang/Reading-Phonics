"use client";

import { useState } from "react";
import type { Lesson } from "@/app/lessons";
import ListenAndFind from "@/components/games/ListenAndFind";
import LetterHunt from "@/components/games/LetterHunt";
import SoundSort from "@/components/games/SoundSort";

type GameId = "find" | "hunt" | "sort";

const ACTIVITIES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
}[] = [
  {
    id: "find",
    title: "Listen & Find",
    blurb: "Hear a word, tap the picture",
    emoji: "👂",
    color: "from-[#3AA7C4] to-[#27829E]",
  },
  {
    id: "hunt",
    title: "Letter Hunt",
    blurb: "Tap every hidden letter",
    emoji: "🔍",
    color: "from-[#7BA468] to-[#668D4E]",
  },
  {
    id: "sort",
    title: "Sound Sort",
    blurb: "Pick the matching sounds",
    emoji: "🧺",
    color: "from-[#4E9A78] to-[#3A7A5E]",
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
      <div className="flex w-full max-w-xl items-center justify-between">
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
      <div className="mt-8 flex w-full max-w-xl flex-1 flex-col items-center">
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
                  className={`flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br ${a.color} px-4 py-8 text-white shadow-lg transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  <span className="text-5xl">{a.emoji}</span>
                  <span className="text-lg font-bold">{a.title}</span>
                  <span className="text-center text-sm font-medium opacity-90">
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
          </div>
        )}
      </div>
    </div>
  );
}
