"use client";

import { useState } from "react";
import Phonics from "@/components/tabs/Phonics";
import LetterFormation from "@/components/tabs/LetterFormation";
import Spelling from "@/components/tabs/Spelling";
import TrickyWords from "@/components/tabs/TrickyWords";
import Stories from "@/components/tabs/Stories";
import GuidedReading from "@/components/tabs/GuidedReading";
import SoundPrimer from "@/components/SoundPrimer";
import Backdrop from "@/components/Backdrop";

type SectionId =
  | "phonics"
  | "formation"
  | "spelling"
  | "tricky"
  | "stories"
  | "guided";

const SECTIONS: {
  id: SectionId;
  label: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  {
    id: "phonics",
    label: "Phonics",
    blurb: "Sounds, actions & blending",
    emoji: "🙆",
    color: "from-[#FFD9EA] to-[#FFC0DB]", // bubblegum pink
    text: "text-pink-700",
  },
  {
    id: "formation",
    label: "Letter Formation",
    blurb: "Trace and write letters",
    emoji: "✍️",
    color: "from-[#FFE8C9] to-[#FFD3A1]", // peach
    text: "text-orange-700",
  },
  {
    id: "spelling",
    label: "Spelling",
    blurb: "Segment words and spell",
    emoji: "🔡",
    color: "from-[#CFF5E1] to-[#A7E9C8]", // mint
    text: "text-emerald-700",
  },
  {
    id: "tricky",
    label: "Tricky Words",
    blurb: "Sight words to memorise",
    emoji: "🌟",
    color: "from-[#FFF4BD] to-[#FFE88C]", // lemon
    text: "text-amber-700",
  },
  {
    id: "stories",
    label: "Sentences & Stories",
    blurb: "Read leveled stories",
    emoji: "📚",
    color: "from-[#D3EBFF] to-[#ABD9FF]", // sky
    text: "text-sky-700",
  },
  {
    id: "guided",
    label: "Guided Reading",
    blurb: "Read aloud with your coach",
    emoji: "🎤",
    color: "from-[#E9DFFF] to-[#D2C0FF]", // lilac
    text: "text-violet-700",
  },
];

export default function Home() {
  const [section, setSection] = useState<SectionId | null>(null);

  return (
    <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] px-4 py-8 font-sans text-zinc-900 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black dark:text-zinc-50">
      <SoundPrimer />
      <Backdrop playful={!section} />
      <header className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="anim-bob">🐣</span>{" "}
          <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
            Phonics Pals & Guided Reading
          </span>
        </h1>
        <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-pink-300 via-amber-300 via-emerald-300 to-sky-300" />
        {!section && (
          <p className="rounded-full bg-white/70 px-5 py-2 font-semibold text-violet-500 shadow-sm backdrop-blur dark:bg-zinc-800/70 dark:text-violet-300">
            ✨ What would you like to learn today? ✨
          </p>
        )}
      </header>

      {/* Home menu */}
      {!section ? (
        <main className="relative z-10 mt-10 grid w-full max-w-5xl flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br ${s.color} ${s.text} px-6 py-9 shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-white/70 text-5xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                {s.emoji}
              </span>
              <span className="text-xl font-extrabold">{s.label}</span>
              <span className="text-center text-sm font-semibold opacity-80">
                {s.blurb}
              </span>
            </button>
          ))}
        </main>
      ) : (
        <div className="relative z-10 mt-6 flex w-full max-w-4xl flex-1 flex-col items-center">
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
            {section === "phonics" && <Phonics />}
            {section === "formation" && <LetterFormation />}
            {section === "spelling" && <Spelling />}
            {section === "tricky" && <TrickyWords />}
            {section === "stories" && <Stories />}
            {section === "guided" && <GuidedReading />}
          </div>
        </div>
      )}
    </div>
  );
}
