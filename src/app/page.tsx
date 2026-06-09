"use client";

import { useState } from "react";
import LetterSounds from "@/components/tabs/LetterSounds";
import WordSounds from "@/components/tabs/WordSounds";
import Stories from "@/components/tabs/Stories";
import GuidedReading from "@/components/tabs/GuidedReading";
import SoundPrimer from "@/components/SoundPrimer";

type SectionId = "letters" | "words" | "stories" | "guided";

const SECTIONS: {
  id: SectionId;
  label: string;
  blurb: string;
  emoji: string;
  color: string;
}[] = [
  {
    id: "letters",
    label: "Letter Sounds",
    blurb: "Learn each letter and its sound",
    emoji: "🔤",
    color: "from-rose-400 to-orange-300",
  },
  {
    id: "words",
    label: "Word Sounds",
    blurb: "Blend sounds into words",
    emoji: "🧩",
    color: "from-sky-400 to-blue-300",
  },
  {
    id: "stories",
    label: "Sentences & Stories",
    blurb: "Read leveled stories",
    emoji: "📚",
    color: "from-emerald-400 to-green-300",
  },
  {
    id: "guided",
    label: "Guided Reading",
    blurb: "Read aloud with your coach",
    emoji: "🎤",
    color: "from-violet-400 to-fuchsia-300",
  },
];

export default function Home() {
  const [section, setSection] = useState<SectionId | null>(null);

  return (
    <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-indigo-50 to-white px-4 py-8 font-sans text-zinc-900 dark:from-zinc-900 dark:to-black dark:text-zinc-50">
      <SoundPrimer />
      <header className="flex w-full max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          🐣 Phonics Pals & Guided Reading
        </h1>
        {!section && (
          <p className="text-zinc-500 dark:text-zinc-400">
            What would you like to learn today?
          </p>
        )}
      </header>

      {/* Home menu */}
      {!section ? (
        <main className="mt-10 grid w-full max-w-2xl flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br ${s.color} px-6 py-10 text-white shadow-xl transition-transform hover:-translate-y-1 active:scale-95`}
            >
              <span className="text-6xl">{s.emoji}</span>
              <span className="text-xl font-extrabold">{s.label}</span>
              <span className="text-center text-sm font-medium opacity-90">
                {s.blurb}
              </span>
            </button>
          ))}
        </main>
      ) : (
        <div className="mt-6 flex w-full max-w-2xl flex-1 flex-col items-center">
          {/* Back to home */}
          <div className="flex w-full">
            <button
              onClick={() => setSection(null)}
              className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm transition-all hover:shadow active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              🏠 Home
            </button>
          </div>

          <div className="mt-6 flex w-full flex-1 flex-col items-center">
            {section === "letters" && <LetterSounds />}
            {section === "words" && <WordSounds />}
            {section === "stories" && <Stories />}
            {section === "guided" && <GuidedReading />}
          </div>
        </div>
      )}
    </div>
  );
}
