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
import { lexileLabel } from "@/lib/lexileStats";
import type { GuidedRead } from "@/lib/guidedLog";
import { printWorksheetForRead } from "@/lib/worksheet";
import { printGuidedRead } from "@/lib/guidedReadPrint";
import { readDetail, type ReadDetail } from "@/lib/guidedReadInsights";

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
  lexile,
  history = [],
  onClose,
}: {
  name: string;
  year: string;
  read: GuidedRead;
  /** The child's reading level, which sets how easy the worksheet is. */
  lexile: number | null;
  /** Every read by this child, for how this one compares. */
  history?: GuidedRead[];
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
        .map((i) => (words[i] ?? "").replace(/[.,!?;:"“”]/g, ""))
        .filter(Boolean),
    ),
  );

  const accuracyMet = level ? read.accuracy >= level.accuracyGoal : null;
  const wpmMet = level ? read.wcpm >= level.wpmLow : null;

  const wrong = read.total - read.correct;
  const detail = readDetail({
    name,
    read,
    level,
    verdict,
    childLexile: lexile,
    missedWords: marked ? practice : [],
    marked,
    reached,
    history,
  });
  const stats = [
    {
      label: "Accuracy",
      value: `${read.accuracy}%`,
      note: level ? `goal ≥${level.accuracyGoal}%` : "",
      met: accuracyMet,
    },
    {
      label: "Words correct",
      value: `${read.correct}/${read.total}`,
      note: !marked
        ? "of the whole story"
        : reached >= read.total
          ? "read to the end"
          : `stopped after ${reached} of ${read.total}`,
      met: null,
    },
    {
      label: "Words / min",
      value: `${read.wcpm}`,
      note: level ? `goal ${level.wpmLow}–${level.wpmHigh}` : "",
      met: wpmMet,
    },
  ];

  /** The same report on an A4 page, in a new tab, with the print dialog up. */
  function print() {
    printGuidedRead({
      name,
      year,
      date: longDate(read.at),
      title: read.title,
      emoji: found?.passage.emoji ?? "📖",
      levelLine: `${read.grade}${read.lexile ? ` · ${lexileLabel(read.lexile)}` : ""}`,
      verdict: verdict
        ? {
            label: verdict.label,
            grade: read.grade,
            meaning: verdict.meaning,
            kind:
              verdict.label === "Independent"
                ? "independent"
                : verdict.label === "Instructional"
                  ? "instructional"
                  : "developing",
          }
        : null,
      stats,
      story:
        found && marked
          ? { kind: "marked", words, missed: [...missed], reached }
          : found
            ? {
                kind: "plain",
                text: found.passage.text,
                note:
                  wrong > 0
                    ? `${wrong} ${wrong === 1 ? "word was" : "words were"} marked wrong in this read, but which ones wasn't saved at the time — so none are marked here.`
                    : "Every word was read correctly.",
              }
            : {
                kind: "missing",
                note: "This story isn't on this device any more, so its words can't be shown — the marks above are as they were saved.",
              },
      practice: marked ? practice : null,
      detail,
    });
  }

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
            {read.lexile ? ` · ${lexileLabel(read.lexile)}` : ""}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={print}
            className="rounded-full bg-[#0A4F29] px-4 py-2 text-sm font-extrabold text-white shadow active:scale-95"
          >
            🖨️ Print this report
          </button>
          {found && (
            <button
              onClick={() => printWorksheetForRead(read, { name, year, lexile })}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow active:scale-95"
            >
              📝 Print a worksheet on this story
            </button>
          )}
        </div>

        {verdict && (
          <div className={`mt-3 rounded-2xl px-4 py-3 ${verdict.tone}`}>
            <span className="font-extrabold">{verdict.label}</span> for a{" "}
            {read.grade} story — {verdict.meaning}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((st) => (
            <Stat key={st.label} {...st} />
          ))}
        </div>

        <Detail detail={detail} part="top" />

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
        ) : found ? (
          /* An older read: the story is here, but which words were wrong was
             never saved, so none are marked — guessing would put words in a
             child's record that they may have read perfectly well. */
          <div className="mt-5">
            <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
              The story they read
            </h3>
            <p className="mt-2 rounded-2xl bg-amber-50/70 p-4 text-base font-semibold leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {found.passage.text}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-zinc-400">
              {read.total - read.correct > 0
                ? `${read.total - read.correct} ${
                    read.total - read.correct === 1 ? "word was" : "words were"
                  } marked wrong in this read, but which ones wasn't saved at the time — so none are marked here. Every read from now on keeps them.`
                : "Every word was read correctly."}
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            This story isn&apos;t on this device any more, so its words
            can&apos;t be shown — the marks above are as they were saved.
          </p>
        )}

        {marked && (
          <div className="mt-4">
            <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
              Words to practise
            </h3>
            {detail.words.length ? (
              <>
                <div className="mt-2 flex flex-col gap-2">
                  {detail.words.map((w) => (
                    <div
                      key={w.word}
                      className="flex flex-col gap-1 rounded-2xl bg-amber-50/70 p-3 sm:flex-row sm:items-start sm:gap-3 dark:bg-zinc-800"
                    >
                      <span className="w-fit shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {w.word}
                      </span>
                      <ul className="flex flex-col gap-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        {w.patterns.length ? (
                          w.patterns.map((p) => (
                            <li key={p.label}>
                              <b className="text-zinc-800 dark:text-zinc-100">{p.label}</b>{" "}
                              — {p.tip}
                            </li>
                          ))
                        ) : (
                          <li>Practise it as a whole word: read it, spell it, read it again.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
                {detail.wordSummary.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    In common: {detail.wordSummary.join("; ")}.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                🎉 Every word they read, they read correctly.
              </p>
            )}
          </div>
        )}

        <Detail detail={detail} part="bottom" />
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

/** The report's detail: a summary and the figures behind it (top), and
    their progress and what to do next (bottom). */
function Detail({ detail, part }: { detail: ReadDetail; part: "top" | "bottom" }) {
  if (part === "top") {
    return (
      <>
        <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold leading-relaxed text-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <span className="font-extrabold">Summary. </span>
          {detail.summary}
        </div>
        <h3 className="mt-5 text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
          The reading in detail
        </h3>
        <dl className="mt-2 divide-y divide-zinc-100 rounded-2xl ring-1 ring-zinc-100 dark:divide-zinc-800 dark:ring-zinc-800">
          {detail.facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5 px-4 py-2 sm:flex-row sm:gap-4">
              <dt className="w-40 shrink-0 text-xs font-extrabold uppercase tracking-wide text-zinc-400">
                {f.label}
              </dt>
              <dd className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{f.value}</dd>
            </div>
          ))}
        </dl>
      </>
    );
  }
  return (
    <>
      {detail.history && (
        <div className="mt-5">
          <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
            Progress
          </h3>
          {detail.history.change && (
            <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {detail.history.change}
            </p>
          )}
          <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-zinc-100 dark:ring-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Story</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2 text-right">Accuracy</th>
                  <th className="px-3 py-2 text-right">Words / min</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-zinc-600 dark:text-zinc-300">
                {detail.history.rows.map((r, i) => (
                  <tr
                    key={i}
                    className={r.current ? "bg-amber-50/70 font-extrabold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100" : ""}
                  >
                    <td className="whitespace-nowrap px-3 py-1.5">{r.date}</td>
                    <td className="px-3 py-1.5">
                      {r.title}
                      {r.current ? " (this read)" : ""}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">{r.grade}</td>
                    <td className="px-3 py-1.5 text-right">{r.accuracy}%</td>
                    <td className="px-3 py-1.5 text-right">{r.wcpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-5">
        <h3 className="text-sm font-extrabold text-zinc-600 dark:text-zinc-300">
          Next steps
        </h3>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm font-semibold text-zinc-700 marker:font-extrabold marker:text-emerald-600 dark:text-zinc-200">
          {detail.nextSteps.map((st) => (
            <li key={st}>{st}</li>
          ))}
        </ol>
      </div>
    </>
  );
}
