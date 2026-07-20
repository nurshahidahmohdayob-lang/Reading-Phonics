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
      className={`flex flex-1 flex-col items-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] px-4 py-4 font-sans text-zinc-900 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black dark:text-zinc-50 ${
        !section ? "pb-14" : "py-8"
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

      {/* Home menu — a winding learning journey from first sounds to reading aloud */}
      {!section ? (
        <main className="relative z-10 mt-4 w-full max-w-2xl">
          {/* Start marker */}
          <div className="flex justify-center">
            <span className="rounded-full bg-white/80 px-5 py-1.5 text-sm font-extrabold text-violet-600 shadow-sm ring-2 ring-white/70 backdrop-blur dark:bg-zinc-800/80 dark:text-violet-300">
              🚩 Start your reading journey
            </span>
          </div>

          {/* The winding path */}
          <div className="relative mt-4 flex flex-col gap-5">
            {/* dashed spine down the middle */}
            <div className="pointer-events-none absolute bottom-8 left-1/2 top-8 -translate-x-1/2 border-l-4 border-dashed border-violet-300/70 dark:border-violet-400/25" />

            {SECTIONS.map((s, i) => {
              const left = i % 2 === 0;
              const card = (
                <span
                  className={`inline-flex flex-col rounded-2xl bg-white/85 px-4 py-2.5 shadow-sm ring-2 ring-white/70 backdrop-blur transition-transform group-hover:-translate-y-0.5 dark:bg-zinc-800/85 ${
                    left ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  <span
                    className={`text-sm font-extrabold leading-tight sm:text-base ${s.text}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-zinc-500 dark:text-zinc-400">
                    {s.blurb}
                  </span>
                </span>
              );
              return (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  aria-label={`${i + 1}. ${s.label} — ${s.blurb}`}
                  className="group relative z-10 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4"
                >
                  <span className="flex justify-end">{left ? card : null}</span>
                  <span
                    className={`relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${s.color} text-3xl shadow-lg ring-4 ring-white/80 transition-transform group-hover:scale-110 group-active:scale-95 dark:ring-zinc-900/50 sm:h-20 sm:w-20`}
                  >
                    {s.emoji}
                    <span className="absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-zinc-700 shadow ring-1 ring-black/5">
                      {i + 1}
                    </span>
                  </span>
                  <span className="flex justify-start">{!left ? card : null}</span>
                </button>
              );
            })}
          </div>

          {/* Finish marker */}
          <div className="mt-5 flex justify-center">
            <span className="rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-5 py-1.5 text-sm font-extrabold text-amber-950 shadow-sm">
              🏆 You&apos;re a reader!
            </span>
          </div>
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
