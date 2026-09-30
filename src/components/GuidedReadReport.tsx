"use client";

/* One child's reading of one story, as a report.

   Opened from the Class Tracker's guided-reading list. It shows what the
   reading report showed at the time — accuracy judged against the story's
   level, words correct, words per minute against the level's goal — and,
   for reads saved since the words have been kept, the story itself with the
   words they couldn't read struck through and anything they never reached
   greyed out. */

import { useEffect } from "react";
import { findPassage } from "@/app/passages";
import { classifyAccuracy } from "@/app/stories";
import type { GuidedRead } from "@/lib/guidedLog";

function longDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GuidedReadReport({
  name,
  year,
  read,
  onClose,
}: {
  name: string;
  year: string;
  read: GuidedRead;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const found = findPassage(read.passageId, read.levelId);
  const level = found?.level ?? null;
  const verdict = level ? classifyAccuracy(level.source, read.accuracy) : null;
  const words = found ? found.passage.text.split(/\s+/) : [];
  // The marks only line up if the story is the one they read.
  const marked =
    Array.isArray(read.missedAt) &&
    typeof read.reached === "number" &&
    words.length === read.total;
  const missed = new Set(read.missedAt ?? []);
  const reached = read.reached ?? read.total;
  const practice = Array.from(
    new Set(
      [...missed]
        .sort((a, b) => a - b)
        .map((i) => (words[i] ?? "").replace(/[.,!?;:"]/g, ""))
        .filter(Boolean),
    ),
  );

  const accuracyMet = level ? read.accuracy >= level.accuracyGoal : null;
  const wpmMet = level ? read.wcpm >= level.wpmLow : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name}'s reading of ${read.title}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <button
          onClick={onClose}
          aria-label="Close report"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 active:scale-90 dark:bg-zinc-800"
        >
          ✕
        </button>

        <p className="text-xs font-extrabold uppercase tracking-wide text-zinc-400">
          Reading report
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">
          {name}
        </h2>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {year} · {longDate(read.at)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold text-zinc-700 dark:text-zinc-200">
            {found?.passage.emoji ?? "📖"} {read.title}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
            {read.grade}
            {read.lexile ? ` · ${read.lexile}L` : ""}
          </span>
        </div>

        {verdict && (
          <div className={`mt-3 rounded-2xl px-4 py-3 ${verdict.tone}`}>
            <span className="font-extrabold">{verdict.label}</span> for a{" "}
            {read.grade} story — {verdict.meaning}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            label="Accuracy"
            value={`${read.accuracy}%`}
            note={level ? `goal ≥${level.accuracyGoal}%` : ""}
            met={accuracyMet}
          />
          <Stat
            label="Words correct"
            value={`${read.correct}/${read.total}`}
            note={
              !marked
                ? "of the whole story"
                : reached >= read.total
                  ? "read to the end"
                  : `stopped after ${reached} of ${read.total}`
            }
            met={null}
          />
          <Stat
            label="Words / min"
            value={`${read.wcpm}`}
            note={level ? `goal ${level.wpmLow}–${level.wpmHigh}` : ""}
            met={wpmMet}
          />
        </div>

        {/* The story, marked */}
        {found && marked ? (
          <div className="mt-5">
            <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
              The story, as they read it
            </h3>
            <p className="mt-2 rounded-2xl bg-amber-50/70 p-4 text-base font-semibold leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {words.map((w, i) => (
                <span
                  key={i}
                  className={
                    missed.has(i)
                      ? "rounded bg-rose-500/90 px-0.5 text-white line-through decoration-2"
                      : i >= reached
                        ? "text-zinc-300 dark:text-zinc-600"
                        : ""
                  }
                >
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
            <p className="mt-1.5 flex flex-wrap gap-x-4 text-xs font-semibold text-zinc-400">
              <span>
                <span className="rounded bg-rose-500/90 px-1 text-white line-through">
                  word
                </span>{" "}
                couldn&apos;t read it
              </span>
              {reached < read.total && (
                <span>
                  <span className="text-zinc-300">word</span> didn&apos;t reach
                  it
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {found
              ? "This read was saved before the app kept which words were missed, so the story can't be marked up. Reads from now on show every word they couldn't read."
              : "This story isn't on this device any more, so the words can't be shown — the marks above are as they were saved."}
          </p>
        )}

        {marked && (
          <div className="mt-4">
            <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
              Words to practise
            </h3>
            {practice.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {practice.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                🎉 Every word they read, they read correctly.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  met,
}: {
  label: string;
  value: string;
  note: string;
  met: boolean | null;
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-zinc-800">
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">
        {value}
      </div>
      {note && (
        <div
          className={`mt-0.5 text-[11px] font-bold ${
            met === null
              ? "text-zinc-400"
              : met
                ? "text-emerald-600"
                : "text-rose-500"
          }`}
        >
          {met ? "✓ " : ""}
          {note}
        </div>
      )}
    </div>
  );
}
