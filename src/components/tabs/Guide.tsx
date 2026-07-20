"use client";

/* An in-app tutorial: what the app is for and what every tool does, so teachers
   and students can read it any time (no video needed). Each card can jump
   straight into its tool, and the whole guide can be printed / saved as PDF. */

import { GUIDE_TOOLS, GUIDE_INTRO } from "@/app/guideContent";
import { openTutorial } from "@/lib/tutorialPrint";

export default function Guide({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      {/* Print / download */}
      <div className="flex w-full justify-end">
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
    </div>
  );
}
