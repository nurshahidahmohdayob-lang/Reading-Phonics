"use client";

/* A story shown as a picture book: a cover, then a few sentences to a page,
   each page with its own picture, turned with the arrows, a swipe or the
   arrow keys. Every word can be tapped to hear it, and "Read this page"
   reads the page aloud. The last page says The End and points the child on
   to the questions.

   Every story is five pages, cut at sentence ends (never mid-sentence or
   mid-speech) and shared out evenly. Each page's
   picture is the first thing on it the app has a picture for, from the
   dictionary; otherwise the story's own. */

import { useEffect, useMemo, useRef, useState } from "react";
import { Andika, Fraunces } from "next/font/google";
import { lookup } from "@/app/dictionary";
import { speak, stopSpeech } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";
import { lexileLabel } from "@/lib/lexileStats";
import type { Passage, PassageLevel } from "@/app/passages";
import { paginate } from "@/lib/storyPages";

// Andika is made for children learning to read: plain letter shapes, a
// single-storey a and g. Fraunces gives the cover a storybook title.
const body = Andika({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const title = Fraunces({ subsets: ["latin"], weight: ["600", "800"], display: "swap" });

/** Things you can't draw a clear picture of, so never a page's picture. */
const NO_PICTURE = new Set(
  ("day days time way lot thing things part end week year minute hour moment today morning afternoon evening night place idea kind side bit " +
    "one two three four five six seven eight nine ten hundred everyone everything nobody something").split(" "),
);

function pictureFor(page: string, fallback: string, used: Set<string>): string {
  for (const raw of page.split(/\s+/)) {
    const w = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length < 3 || NO_PICTURE.has(w)) continue;
    const hit = lookup(w);
    if (hit && hit.pos === "noun" && hit.emoji && !used.has(hit.emoji)) {
      used.add(hit.emoji);
      return hit.emoji;
    }
  }
  return fallback;
}

/** Soft page colours, one per page, cycling. */
const TINTS = [
  "from-amber-100 to-orange-50",
  "from-sky-100 to-cyan-50",
  "from-emerald-100 to-lime-50",
  "from-rose-100 to-pink-50",
  "from-violet-100 to-indigo-50",
];

export default function StoryBook({ passage, level }: { passage: Passage; level: PassageLevel }) {
  const young = level.id === "starter" || level.id === "year1";
  const pages = useMemo(() => paginate(passage.text), [passage.text]);
  const pictures = useMemo(() => {
    const used = new Set<string>([passage.emoji]);
    return pages.map((p) => pictureFor(p, passage.emoji, used));
  }, [pages, passage.emoji]);
  // 0 is the cover; 1…n the pages.
  const [at, setAt] = useState(0);
  const last = pages.length;
  const touch = useRef<number | null>(null);
  const book = useRef<HTMLDivElement>(null);

  const go = (to: number) => {
    stopSpeech();
    setAt(Math.max(0, Math.min(last, to)));
  };

  useEffect(() => {
    const el = book.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  });

  const toQuestions = () => {
    const next = book.current?.closest("section")?.nextElementSibling;
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={book}
      tabIndex={0}
      className={`${body.className} mt-3 outline-none`}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(at + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="relative overflow-hidden rounded-[1.4rem] bg-[#FFFDF7] shadow-[0_10px_30px_-12px_rgba(60,40,10,0.35)] ring-1 ring-amber-900/10 dark:bg-zinc-900">
        {/* the book's spine */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-amber-900/15 to-transparent" />

        {at === 0 ? (
          <button
            onClick={() => go(1)}
            className="flex min-h-[22rem] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0A4F29] via-[#1d6b3d] to-[#668C4A] px-6 py-10 text-center text-white"
            aria-label="Open the book"
          >
            <span className="grid h-36 w-36 place-items-center rounded-full bg-white/15 text-8xl shadow-inner ring-4 ring-white/25 sm:h-44 sm:w-44 sm:text-9xl">
              {passage.emoji}
            </span>
            <span className={`${title.className} mt-2 text-4xl font-extrabold leading-tight text-[#F7B917] sm:text-5xl`}>
              {passage.title}
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              A {level.grade} story{passage.lexile ? ` · ${lexileLabel(passage.lexile)}` : ""}
            </span>
            <span className="mt-4 rounded-full bg-[#F7B917] px-6 py-2.5 text-lg font-extrabold text-[#0A4F29] shadow-lg">
              Open the book →
            </span>
          </button>
        ) : (
          <div className="grid min-h-[22rem] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className={`grid place-items-center bg-gradient-to-br ${TINTS[(at - 1) % TINTS.length]} p-6 dark:from-zinc-800 dark:to-zinc-900`}>
              <span key={at} className="tick-pop text-[6.5rem] leading-none drop-shadow-sm sm:text-[8rem]" aria-hidden>
                {pictures[at - 1]}
              </span>
            </div>
            <div className="flex flex-col px-6 py-6 sm:px-8">
              <p
                className={`flex-1 text-zinc-800 dark:text-zinc-100 ${
                  young ? "text-[1.7rem] leading-[1.75]" : "text-[1.35rem] leading-[1.8]"
                }`}
              >
                {pages[at - 1].split(/\s+/).map((w, j) => (
                  <span key={j}>
                    <button
                      onClick={() => sayWord(w.replace(/[^a-z']/gi, ""))}
                      className={`rounded-md px-0.5 transition-colors hover:bg-amber-200/70 ${
                        at === 1 && j === 0 ? `${title.className} text-[1.4em] font-extrabold text-[#0A4F29] dark:text-emerald-300` : ""
                      }`}
                    >
                      {w}
                    </button>{" "}
                  </span>
                ))}
              </p>
              {at === last && (
                <p className={`${title.className} mt-4 text-center text-3xl font-extrabold italic text-[#0A4F29] dark:text-emerald-300`}>
                  The End
                </p>
              )}
              <div className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-zinc-400">
                <button
                  onClick={() => speak(pages[at - 1], 0.8)}
                  className="rounded-full bg-[#F7B917] px-4 py-2 text-base font-extrabold text-[#0A4F29] shadow active:scale-95"
                >
                  🔊 Read this page
                </button>
                <span>
                  Page {at} of {last}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* turning the pages */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={() => go(at - 1)}
          disabled={at === 0}
          aria-label="Previous page"
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl font-black text-[#0A4F29] shadow active:scale-95 disabled:opacity-30 dark:bg-zinc-800"
        >
          ‹
        </button>
        <div className="flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: last + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={i === 0 ? "Cover" : `Page ${i}`}
              className={`h-2.5 rounded-full transition-all ${i === at ? "w-7 bg-[#0A4F29]" : "w-2.5 bg-zinc-300 dark:bg-zinc-600"}`}
            />
          ))}
        </div>
        {at < last ? (
          <button
            onClick={() => go(at + 1)}
            aria-label="Next page"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#0A4F29] text-2xl font-black text-white shadow active:scale-95"
          >
            ›
          </button>
        ) : (
          <button
            onClick={toQuestions}
            className="rounded-full bg-[#0A4F29] px-4 py-3 text-sm font-extrabold text-white shadow active:scale-95"
          >
            Questions ↓
          </button>
        )}
      </div>
    </div>
  );
}
