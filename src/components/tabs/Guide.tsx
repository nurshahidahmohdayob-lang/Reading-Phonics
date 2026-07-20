"use client";

/* An in-app tutorial with two guides you switch between at the top: one about
   the whole app (a card per tool), and one that walks through the Reading
   Assessment screen by screen. Only the chosen guide is shown. Content lives
   in guideContent.ts so it stays in sync. */

import { useState } from "react";
import {
  GUIDE_TOOLS,
  GUIDE_INTRO,
  ASSESSMENT_WALKTHROUGH,
  READER_BANDS,
} from "@/app/guideContent";
import { openTutorial } from "@/lib/tutorialPrint";

// Band accent colours, written out in full so Tailwind keeps the classes.
const BAND_TEXT: Record<string, string> = {
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

export default function Guide({ onOpen }: { onOpen: (id: string) => void }) {
  const [tab, setTab] = useState<"app" | "assessment">("app");

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      {/* Which guide? */}
      <div
        role="tablist"
        aria-label="Choose a guide"
        className="flex w-full max-w-md items-center gap-1.5 rounded-full bg-white/70 p-1.5 shadow-md ring-4 ring-white/60 dark:bg-zinc-800/70"
      >
        <button
          role="tab"
          aria-selected={tab === "app"}
          onClick={() => setTab("app")}
          className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition-all active:scale-95 ${
            tab === "app"
              ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow"
              : "text-zinc-500 dark:text-zinc-300"
          }`}
        >
          📖 About the app
        </button>
        <button
          role="tab"
          aria-selected={tab === "assessment"}
          onClick={() => setTab("assessment")}
          className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition-all active:scale-95 ${
            tab === "assessment"
              ? "bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow"
              : "text-zinc-500 dark:text-zinc-300"
          }`}
        >
          📋 Reading Assessment
        </button>
      </div>

      {/* ---------- Guide 1: the whole app ---------- */}
      {tab === "app" && (
        <>
          <div className="mt-4 flex w-full justify-end">
            <button
              onClick={openTutorial}
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95"
            >
              ⬇️ Download / Print
            </button>
          </div>

          {/* What the app is for */}
          <div className="mt-3 w-full rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE1A6] px-6 py-7 text-center shadow-lg ring-4 ring-white/60">
            <div className="text-5xl">📖</div>
            <h2 className="mt-2 text-2xl font-extrabold text-amber-900">
              How to use this app
            </h2>
            <p className="mx-auto mt-2 max-w-xl font-semibold text-amber-800/90">
              {GUIDE_INTRO}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tutorial/home.jpg"
              alt="The app home screen with all nine tool cards"
              className="mx-auto mt-4 w-full max-w-xl rounded-2xl shadow-md ring-1 ring-black/5"
            />
            <p className="mt-2 text-xs font-semibold text-amber-700/70">
              The home screen — tap any tool to open it.
            </p>
          </div>

          {/* Suggested order */}
          <p className="mt-5 text-center text-sm font-bold uppercase tracking-wide text-zinc-400">
            Suggested order — sounds first, reading last
          </p>

          {/* One card per tool */}
          <div className="mt-3 flex w-full flex-col gap-3">
            {GUIDE_TOOLS.map((t, i) => (
              <div
                key={t.id}
                className={`w-full rounded-[1.5rem] bg-gradient-to-br ${t.color} p-5 shadow-md ring-4 ring-white/60`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/70 text-3xl shadow-sm">
                    {t.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-lg font-extrabold ${t.text}`}>
                      {i + 1}. {t.label}
                    </h3>
                    <p className="text-sm font-semibold text-zinc-700">
                      {t.purpose}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpen(t.id)}
                    className={`shrink-0 rounded-full bg-white/80 px-4 py-2 text-sm font-bold ${t.text} shadow-sm active:scale-95`}
                  >
                    Open ▶
                  </button>
                </div>
                {/* Screenshot of the tool, taken from the walkthrough recording. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/tutorial/${t.id}.jpg`}
                  alt={`The ${t.label} screen`}
                  loading="lazy"
                  className="mt-3 w-full rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                />
                <ul className="mt-3 flex flex-col gap-1.5">
                  {t.steps.map((s, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 rounded-xl bg-white/60 px-3 py-1.5 text-sm font-semibold text-zinc-700"
                    >
                      <span className={`font-extrabold ${t.text}`}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-zinc-400">
            Tip: tap “Open ▶” on any card to go straight to that tool. 💛
          </p>
        </>
      )}

      {/* ---------- Guide 2: the Reading Assessment ---------- */}
      {tab === "assessment" && (
        <>
          {/* What the assessment is for */}
          <div className="mt-4 w-full rounded-[2rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFC9C2] px-6 py-7 text-center shadow-lg ring-4 ring-white/60">
            <div className="text-5xl">📋</div>
            <h2 className="mt-2 text-2xl font-extrabold text-rose-900">
              Reading Assessment — step by step
            </h2>
            <p className="mx-auto mt-2 max-w-xl font-semibold text-rose-800/90">
              A full read-aloud check that measures decoding, fluency and
              comprehension, then gives a reading level you can match straight to
              books. About five minutes per child.
            </p>
          </div>

          {/* Mic prerequisite */}
          <div className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900/50">
            <span className="text-xl">🎤</span>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Before you start: open the app in{" "}
              <span className="font-extrabold">Google Chrome</span> and tap{" "}
              <span className="font-extrabold">Allow</span> on the microphone
              popup — the read-aloud needs it. No microphone? You can still type
              every score by hand.
            </p>
          </div>

          {/* The steps */}
          <div className="mt-4 flex w-full flex-col gap-4">
            {ASSESSMENT_WALKTHROUGH.map((s, i) => (
              <div
                key={s.img}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-sky-500">
                      {s.tag}
                    </p>
                    <h4 className="font-extrabold leading-tight text-zinc-800 dark:text-zinc-100">
                      {s.title}
                    </h4>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {s.body}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/tutorial/${s.img}.jpg`}
                  alt={s.title}
                  loading="lazy"
                  className="mt-3 w-full rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                />
              </div>
            ))}

            {/* Reader-level bands */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900">
              <h4 className="font-extrabold text-zinc-800 dark:text-zinc-100">
                What the reader levels mean
              </h4>
              <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                The accuracy % places the child in one of four bands — it tells
                you whether a book is just right, or too hard.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {READER_BANDS.map((b) => (
                  <div
                    key={b.band}
                    className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-extrabold ${BAND_TEXT[b.tone]}`}>
                        {b.band}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        {b.range}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
