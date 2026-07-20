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

/* A colourful illustrated picture per tool — filled multi-colour SVG scenes,
   each self-contained so they read as little pictures, not flat icons. */
function ToolIcon({ id, className }: { id: SectionId; className?: string }) {
  const p = { viewBox: "0 0 48 48", className, "aria-hidden": true } as const;
  switch (id) {
    case "phonics": // speech bubble saying "Aa"
      return (
        <svg {...p}>
          <path
            d="M8 8h32a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-9 7v-7H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
            fill="#F472B6"
          />
          <text
            x="24"
            y="27"
            fontSize="17"
            fontWeight="800"
            textAnchor="middle"
            fill="#fff"
            fontFamily="Georgia, serif"
          >
            Aa
          </text>
          <path d="M40 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#FBBF24" />
        </svg>
      );
    case "soundout": // colourful keyboard
      return (
        <svg {...p}>
          <rect x="4" y="14" width="40" height="24" rx="4" fill="#60A5FA" />
          <rect x="8" y="18" width="6" height="5" rx="1.5" fill="#fff" />
          <rect x="17" y="18" width="6" height="5" rx="1.5" fill="#FDE68A" />
          <rect x="26" y="18" width="6" height="5" rx="1.5" fill="#fff" />
          <rect x="35" y="18" width="5" height="5" rx="1.5" fill="#F9A8D4" />
          <rect x="8" y="26" width="6" height="5" rx="1.5" fill="#A7F3D0" />
          <rect x="17" y="26" width="6" height="5" rx="1.5" fill="#fff" />
          <rect x="26" y="26" width="14" height="5" rx="1.5" fill="#fff" />
        </svg>
      );
    case "flashcards": // two stacked cards with a picture
      return (
        <svg {...p}>
          <rect
            x="17"
            y="8"
            width="23"
            height="30"
            rx="4"
            fill="#5EEAD4"
            transform="rotate(9 28 23)"
          />
          <rect
            x="8"
            y="12"
            width="23"
            height="30"
            rx="4"
            fill="#fff"
            stroke="#14B8A6"
            strokeWidth="2"
          />
          <circle cx="15" cy="21" r="4" fill="#FBBF24" />
          <path d="M9 42v-4l6-6 4 4 6-6 6 6v6z" fill="#86EFAC" />
        </svg>
      );
    case "formation": // pencil writing on lined paper
      return (
        <svg {...p}>
          <rect
            x="5"
            y="8"
            width="24"
            height="32"
            rx="3"
            fill="#fff"
            stroke="#CBD5E1"
            strokeWidth="2"
          />
          <path
            d="M10 18h14M10 24h14M10 30h9"
            stroke="#E2E8F0"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text x="12" y="30" fontSize="13" fontWeight="800" fill="#FB923C" fontFamily="Georgia">
            a
          </text>
          <g transform="rotate(45 33 28)">
            <rect x="29" y="5" width="8" height="28" rx="2" fill="#FBBF24" />
            <rect x="29" y="5" width="8" height="6" rx="2" fill="#F472B6" />
            <path d="M29 33l4 7 4-7z" fill="#FCD34D" />
            <path d="M31 37l2 3 2-3z" fill="#1F2937" />
          </g>
        </svg>
      );
    case "spelling": // alphabet blocks spelling CAT
      return (
        <svg {...p}>
          <rect x="4" y="18" width="13" height="14" rx="3" fill="#F87171" />
          <rect x="17.5" y="15" width="13" height="14" rx="3" fill="#60A5FA" />
          <rect x="31" y="18" width="13" height="14" rx="3" fill="#34D399" />
          <text x="10.5" y="29" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff" fontFamily="Georgia">
            C
          </text>
          <text x="24" y="26" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff" fontFamily="Georgia">
            A
          </text>
          <text x="37.5" y="29" fontSize="10" fontWeight="800" textAnchor="middle" fill="#fff" fontFamily="Georgia">
            T
          </text>
        </svg>
      );
    case "tricky": // smiley gold star
      return (
        <svg {...p}>
          <path
            d="M24 5l5.3 10.7 11.8 1.7-8.5 8.3 2 11.8L24 33.7 13.4 39.3l2-11.8-8.5-8.3 11.8-1.7z"
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="22" r="1.7" fill="#7C2D12" />
          <circle cx="28" cy="22" r="1.7" fill="#7C2D12" />
          <path d="M20 27a4 3 0 0 0 8 0" stroke="#7C2D12" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "stories": // open storybook
      return (
        <svg {...p}>
          <path d="M24 12c-4-3-9-4-15-3v26c6-1 11 0 15 3z" fill="#93C5FD" />
          <path d="M24 12c4-3 9-4 15-3v26c-6-1-11 0-15 3z" fill="#3B82F6" />
          <path d="M11 15c3-.5 7-.3 10 1M11 21c3-.5 7-.3 10 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M37 15c-3-.5-7-.3-10 1M37 21c-3-.5-7-.3-10 1" stroke="#DBEAFE" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="22.5" y="10" width="3" height="30" rx="1.5" fill="#1D4ED8" />
        </svg>
      );
    case "storyplay": // four colourful puzzle tiles
      return (
        <svg {...p}>
          <rect x="6" y="6" width="17" height="17" rx="3" fill="#F472B6" />
          <rect x="25" y="6" width="17" height="17" rx="3" fill="#60A5FA" />
          <rect x="6" y="25" width="17" height="17" rx="3" fill="#FBBF24" />
          <rect x="25" y="25" width="17" height="17" rx="3" fill="#34D399" />
          <circle cx="24" cy="14.5" r="3" fill="#fff" />
          <circle cx="14.5" cy="24" r="3" fill="#fff" />
        </svg>
      );
    case "guided": // microphone
      return (
        <svg {...p}>
          <rect x="18" y="6" width="12" height="22" rx="6" fill="#A78BFA" />
          <rect x="21" y="10" width="6" height="4" rx="2" fill="#fff" opacity="0.6" />
          <path d="M13 24a11 11 0 0 0 22 0" fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <rect x="22.5" y="35" width="3" height="6" rx="1.5" fill="#7C3AED" />
          <rect x="16" y="41" width="16" height="3" rx="1.5" fill="#7C3AED" />
          <path d="M38 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#FBBF24" />
        </svg>
      );
    case "assessment": // clipboard with ticks and a star
      return (
        <svg {...p}>
          <rect x="9" y="8" width="30" height="34" rx="4" fill="#FB7185" />
          <rect x="14" y="12" width="20" height="26" rx="2" fill="#fff" />
          <rect x="18" y="5" width="12" height="7" rx="2" fill="#E11D48" />
          <path d="M17 19l2 2 3-3" stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 26l2 2 3-3" stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25 20h6M25 27h6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 30l1.4 3 3.1.4-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1L23.5 33.4l3.1-.4z" fill="#FBBF24" />
        </svg>
      );
    default:
      return null;
  }
}

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
          ? "h-[100dvh] overflow-hidden bg-gradient-to-b from-[#E6F1FD] via-[#F5FAFF] to-[#E1EDFB] dark:from-[#0C1322] dark:via-[#111A2C] dark:to-black"
          : "bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] py-8 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black"
      }`}
    >
      <SoundPrimer />
      <Backdrop playful={!section} />
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
        <main className="relative z-10 mt-3 grid min-h-0 w-full max-w-4xl flex-1 grid-cols-2 gap-2.5 [grid-auto-rows:1fr] sm:gap-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={`group flex h-full items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} p-3 text-left shadow-md ring-2 ring-white/60 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[.98] sm:gap-4 sm:p-4 dark:ring-white/10`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/85 shadow-sm transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                <ToolIcon id={s.id} className="h-9 w-9 sm:h-11 sm:w-11" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-extrabold leading-tight sm:text-base ${s.text}`}
                >
                  {s.label}
                </span>
                <span className="mt-0.5 hidden truncate text-xs font-semibold text-zinc-600/90 sm:block">
                  {s.blurb}
                </span>
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
