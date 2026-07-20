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
  {
    id: "storyplay",
    label: "Story Play",
    blurb: "Match pictures & order stories",
    emoji: "🧩",
    color: "from-[#CDEFF0] to-[#A6E3E6]", // aqua
    text: "text-teal-700",
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
      className={`flex flex-1 flex-col items-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] px-4 py-4 font-sans text-zinc-900 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black dark:text-zinc-50 ${
        !section ? "h-[100dvh] overflow-hidden" : "py-8"
      }`}
    >
      <SoundPrimer />
      <Backdrop playful={!section} />
      <header className="relative z-10 flex w-full max-w-5xl shrink-0 flex-col items-center gap-1.5 text-center">
        <div className="flex items-center justify-center gap-3">
          {!section && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/images/reader-girl.png"
              alt="A happy girl reading a book"
              className="anim-bob h-14 w-auto drop-shadow-md sm:h-20"
            />
          )}
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
              Phonics Pals & Guided Reading
            </span>
          </h1>
        </div>
        <div className="h-1.5 w-32 rounded-full bg-gradient-to-r from-pink-300 via-amber-300 via-emerald-300 to-sky-300" />
        {!section && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="rounded-full bg-white/70 px-4 py-1 text-sm font-semibold text-violet-500 shadow-sm backdrop-blur dark:bg-zinc-800/70 dark:text-violet-300">
              ✨ What would you like to learn today? ✨
            </p>
            <button
              onClick={() => go("guide")}
              className="rounded-full bg-amber-400 px-4 py-1 text-sm font-bold text-amber-950 shadow-sm transition-all hover:bg-amber-300 active:scale-95"
            >
              📖 How to use this app
            </button>
          </div>
        )}
      </header>

      {/* Home menu — a 3×3 grid that fills the frame (no scrolling) */}
      {!section ? (
        <main className="relative z-10 mt-3 grid min-h-0 w-full max-w-5xl flex-1 grid-cols-3 gap-2.5 [grid-auto-rows:1fr] sm:gap-3.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={`group flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-3xl bg-gradient-to-br ${s.color} ${s.text} p-2 shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-2xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110 sm:h-14 sm:w-14 sm:text-3xl">
                {s.emoji}
              </span>
              <span className="text-xs font-extrabold leading-tight sm:text-base">
                {s.label}
              </span>
              <span className="hidden text-center text-[11px] font-semibold leading-tight opacity-80 sm:block">
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
