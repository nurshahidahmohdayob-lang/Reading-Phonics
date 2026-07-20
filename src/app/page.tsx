"use client";

import { useEffect, useState } from "react";
import Phonics from "@/components/tabs/Phonics";
import LetterFormation from "@/components/tabs/LetterFormation";
import Spelling from "@/components/tabs/Spelling";
import TrickyWords from "@/components/tabs/TrickyWords";
import Stories from "@/components/tabs/Stories";
import GuidedReading from "@/components/tabs/GuidedReading";
import SoundItOut from "@/components/tabs/SoundItOut";
import Flashcards from "@/components/tabs/Flashcards";
import ReadingAssessment from "@/components/tabs/ReadingAssessment";
import StoryPlay from "@/components/tabs/StoryPlay";
import Guide from "@/components/tabs/Guide";
import SoundPrimer from "@/components/SoundPrimer";
import Backdrop from "@/components/Backdrop";
import { stopSpeech } from "@/lib/speak";

type SectionId =
  | "phonics"
  | "soundout"
  | "flashcards"
  | "formation"
  | "spelling"
  | "tricky"
  | "stories"
  | "guided"
  | "assessment"
  | "storyplay"
  | "guide";

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
    id: "soundout",
    label: "Sound It Out",
    blurb: "Type any word and blend it",
    emoji: "🔤",
    color: "from-[#DCE3FF] to-[#BFCBFF]", // periwinkle
    text: "text-indigo-700",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    blurb: "Flip cards: sounds then words",
    emoji: "🎴",
    color: "from-[#CDEFF0] to-[#A6E3E6]", // aqua
    text: "text-teal-700",
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
    id: "storyplay",
    label: "Story Play",
    blurb: "Match pictures & order stories",
    emoji: "🧩",
    color: "from-[#CDEFF0] to-[#A6E3E6]", // aqua
    text: "text-teal-700",
  },
  {
    id: "guided",
    label: "Guided Reading",
    blurb: "Read aloud with your coach",
    emoji: "🎤",
    color: "from-[#E9DFFF] to-[#D2C0FF]", // lilac
    text: "text-violet-700",
  },
  {
    id: "assessment",
    label: "Reading Assessment",
    blurb: "Read-aloud placement check",
    emoji: "📋",
    color: "from-[#FFE3E0] to-[#FFC9C2]", // coral
    text: "text-rose-700",
  },
];

export default function Home() {
  const [section, setSection] = useState<SectionId | null>(null);

  // Silence everything when the child switches away from this browser tab.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stopSpeech();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  function go(next: SectionId | null) {
    stopSpeech(); // leaving a page always stops whatever is playing
    setSection(next);
  }

  return (
    <div
      className={`flex flex-1 flex-col items-center px-4 py-4 font-sans text-zinc-900 dark:text-zinc-50 ${
        !section
          ? "bg-gradient-to-b from-[#F6F7FB] via-white to-[#EEF1F7] pb-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-black"
          : "bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] py-8 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black"
      }`}
    >
      <SoundPrimer />
      {section && <Backdrop playful={false} />}
      <header className="relative z-10 flex w-full max-w-5xl shrink-0 flex-col items-center gap-1.5 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
              Phonics Pals & Guided Reading
            </span>
          </h1>
        </div>
        <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-pink-300 via-amber-300 via-emerald-300 to-sky-300" />
        {!section && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Learn to read, step by step.
            </p>
            <button
              onClick={() => go("guide")}
              className="rounded-full border border-zinc-200 bg-white/90 px-4 py-1.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:shadow active:scale-95 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
            >
              📖 How to use this app
            </button>
          </div>
        )}
      </header>

      {/* Home menu — a clean, modern 2-column card grid */}
      {!section ? (
        <main className="relative z-10 mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className="group flex items-center gap-4 rounded-2xl border border-black/5 bg-white/90 p-4 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[.99] dark:border-white/10 dark:bg-zinc-900/70"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-2xl shadow-sm`}
              >
                {s.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-tight text-zinc-800 dark:text-zinc-100">
                  {s.label}
                </span>
                <span className="block truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {s.blurb}
                </span>
              </span>
              <span className="shrink-0 text-lg text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400 dark:text-zinc-600">
                →
              </span>
            </button>
          ))}
        </main>
      ) : (
        <div className="relative z-10 mt-6 flex w-full max-w-4xl flex-1 flex-col items-center">
          {/* Back to home */}
          <div className="flex w-full">
            <button
              onClick={() => go(null)}
              className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm transition-all hover:shadow active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              🏠 Home
            </button>
          </div>

          <div className="mt-6 flex w-full flex-1 flex-col items-center">
            {section === "phonics" && <Phonics />}
            {section === "soundout" && <SoundItOut />}
            {section === "flashcards" && <Flashcards />}
            {section === "formation" && <LetterFormation />}
            {section === "spelling" && <Spelling />}
            {section === "tricky" && <TrickyWords />}
            {section === "stories" && <Stories />}
            {section === "guided" && <GuidedReading />}
            {section === "assessment" && <ReadingAssessment />}
            {section === "storyplay" && <StoryPlay />}
            {section === "guide" && (
              <Guide onOpen={(id) => go(id as SectionId)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
