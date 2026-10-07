"use client";

/* A story on one page, laid out like a page from a storybook: the picture
   and title at the top, then the whole story in a clear, child-friendly
   font. Every word can be tapped to hear it, and "Read it to me" reads the
   whole story aloud. */

import { Andika, Fraunces } from "next/font/google";
import { speak } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";
import { lexileLabel } from "@/lib/lexileStats";
import type { Passage, PassageLevel } from "@/app/passages";

// Andika is made for children learning to read: plain letter shapes, a
// single-storey a and g. Fraunces gives the title a storybook feel.
const body = Andika({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const title = Fraunces({ subsets: ["latin"], weight: ["600", "800"], display: "swap" });

export default function StoryBook({ passage, level }: { passage: Passage; level: PassageLevel }) {
  const young = level.id === "starter" || level.id === "year1";
  return (
    <div className={`${body.className} mt-3 overflow-hidden rounded-[1.4rem] bg-[#FFFDF7] shadow-[0_10px_30px_-12px_rgba(60,40,10,0.35)] ring-1 ring-amber-900/10 dark:bg-zinc-900`}>
      <div className="flex items-center gap-4 bg-gradient-to-br from-amber-100 to-orange-50 px-6 py-5 dark:from-zinc-800 dark:to-zinc-900">
        <span className="text-6xl leading-none sm:text-7xl" aria-hidden>
          {passage.emoji}
        </span>
        <div className="min-w-0">
          <h3 className={`${title.className} text-2xl font-extrabold leading-tight text-[#0A4F29] sm:text-3xl dark:text-emerald-300`}>
            {passage.title}
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-amber-800/70 dark:text-amber-200/70">
            A {level.grade} story{passage.lexile ? ` · ${lexileLabel(passage.lexile)}` : ""}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <p className={`text-zinc-800 dark:text-zinc-100 ${young ? "text-[1.6rem] leading-[1.8]" : "text-[1.3rem] leading-[1.85]"}`}>
          {passage.text.split(/\s+/).map((w, j) => (
            <span key={j}>
              <button
                onClick={() => sayWord(w.replace(/[^a-z']/gi, ""))}
                className={`rounded-md px-0.5 transition-colors hover:bg-amber-200/70 ${
                  j === 0 ? `${title.className} text-[1.4em] font-extrabold text-[#0A4F29] dark:text-emerald-300` : ""
                }`}
              >
                {w}
              </button>{" "}
            </span>
          ))}
        </p>
        <p className={`${title.className} mt-4 text-center text-2xl font-extrabold italic text-[#0A4F29] dark:text-emerald-300`}>
          The End
        </p>
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => speak(passage.text, 0.8)}
            className="rounded-full bg-[#F7B917] px-5 py-2.5 text-base font-extrabold text-[#0A4F29] shadow active:scale-95"
          >
            🔊 Read it to me
          </button>
        </div>
      </div>
    </div>
  );
}
