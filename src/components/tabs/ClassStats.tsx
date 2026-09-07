"use client";

/* Statistics for the Class Tracker.

   Reads the saved assessment reports for one class (or every class) and shows
   where the children are reading: how many sit in each Lexile band, how the
   class average moves from Term 1 to Term 3, and which child is in which band.

   Colours come from the ordinal Lexile ramp in globals.css (--lex-1 … --lex-6):
   one green hue, easiest band lightest, hardest darkest — so the bars read as
   "more ink = harder text" instead of six unrelated colours. */

import { useState } from "react";
import { studentKey } from "@/app/roster";
import type { TermNo, TrackerStore } from "@/lib/tracker";
import {
  lexileLabel,
  lexileValue,
  termStats,
  type Scoped,
  type TermStats,
} from "@/lib/lexileStats";
import { openReport } from "@/lib/reportPrint";

const TERMS: TermNo[] = [1, 2, 3];

export default function ClassStats({
  scopeLabel,
  students,
  store,
}: {
  scopeLabel: string;
  /** Only children who are attending (locked ones are left out). */
  students: Scoped[];
  store: TrackerStore;
}) {
  const [term, setTerm] = useState<TermNo>(1);

  const stats = termStats(students, store, term);
  const perTerm = TERMS.map((t) => termStats(students, store, t));
  const assessed = stats.results.length;

  // Growth is measured on matched children only — those with a report in both
  // Term 1 and this term — so a newly assessed child can't fake a jump.
  const growth = growthSinceTerm1(students, store, term);

  // Warn when the terms hold different children — then the term-to-term
  // averages move because the group changed, not because reading changed.
  const cohorts = perTerm
    .filter((s) => s.results.length)
    .map((s) =>
      s.results
        .map((r) => `${r.yearKey}:${r.name}`)
        .sort()
        .join("|"),
    );
  const mixedCohort = new Set(cohorts).size > 1;

  const maxCount = Math.max(1, ...stats.byBand.map((b) => b.students.length));
  const maxMean = Math.max(100, ...perTerm.map((s) => s.mean ?? 0));

  return (
    <div className="w-full">
      {/* Term picker — which snapshot are we looking at */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TERMS.map((t) => {
            const on = t === term;
            return (
              <button
                key={t}
                onClick={() => setTerm(t)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                  on
                    ? "bg-[#0A4F29] text-white shadow"
                    : "bg-white text-zinc-500 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Term {t}
                <span
                  className={`ml-1.5 ${on ? "text-white/70" : "text-zinc-400"}`}
                >
                  {perTerm[t - 1].results.length}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => exportStats(scopeLabel, term, stats)}
          disabled={!assessed}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ⬇️ Export data (CSV)
        </button>
      </div>

      {assessed === 0 ? (
        <div className="mt-4 w-full rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          <div className="text-4xl">📊</div>
          <p className="mt-2 text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
            No {scopeLabel} results saved for Term {term} yet.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-zinc-400">
            The graphs fill in as you assess. Go back to the Tracker and tap a
            Term {term} cell to assess a child.
          </p>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              k="Assessed"
              v={`${assessed}`}
              s={`of ${assessed + stats.missing} children`}
            />
            <Tile
              k="Class median"
              v={stats.median === null ? "—" : lexileLabel(stats.median)}
              s={`average ${stats.mean === null ? "—" : lexileLabel(stats.mean)}`}
            />
            <Tile
              k="Range"
              v={
                stats.min && stats.max
                  ? `${lexileLabel(stats.min.lexile)}–${lexileLabel(stats.max.lexile)}`
                  : "—"
              }
              s={stats.max ? `highest: ${stats.max.name}` : ""}
            />
            <Tile
              k={term === 1 ? "Most common" : "Growth vs Term 1"}
              v={
                term === 1
                  ? topBandLabel(stats)
                  : growth.n
                    ? `${growth.delta >= 0 ? "+" : "−"}${Math.abs(growth.delta)}L`
                    : "—"
              }
              s={
                term === 1
                  ? `${topBandCount(stats)} children`
                  : growth.n
                    ? `${growth.n} child${growth.n === 1 ? "" : "ren"} compared`
                    : "needs Term 1 results"
              }
            />
          </div>

          {/* Chart 1 — how many children sit in each Lexile band */}
          <section className="mt-4 w-full rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
            <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
              Reading levels across the class
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">
              {scopeLabel} · Term {term} · children per Lexile band
            </p>

            <div className="mt-4 flex flex-col gap-2.5">
              {stats.byBand.map(({ band, students: kids }) => {
                const pct = Math.round((kids.length / assessed) * 100);
                return (
                  <div
                    key={band.key}
                    title={`${band.label} (${band.range}) — ${kids.length} child${
                      kids.length === 1 ? "" : "ren"
                    }, ${pct}%`}
                    className="flex items-center gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <div className="w-[104px] shrink-0 sm:w-[136px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: `var(--lex-${band.key})` }}
                        />
                        <span className="truncate text-xs font-extrabold text-zinc-600 dark:text-zinc-200">
                          {band.label}
                        </span>
                      </div>
                      <span className="block pl-4 text-[10px] font-semibold text-zinc-400">
                        {band.range}
                      </span>
                    </div>
                    <div className="flex h-6 flex-1 items-center">
                      {kids.length > 0 && (
                        <div
                          className="h-3.5 rounded-r-[4px] transition-[width]"
                          style={{
                            width: `${Math.max(4, (kids.length / maxCount) * 100)}%`,
                            background: `var(--lex-${band.key})`,
                          }}
                        />
                      )}
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <span
                        className={`text-sm font-extrabold ${
                          kids.length
                            ? "text-zinc-700 dark:text-zinc-100"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      >
                        {kids.length}
                      </span>
                      <span className="ml-1 text-[10px] font-bold text-zinc-400">
                        {kids.length ? `${pct}%` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Chart 2 — class average across the three terms */}
          <section className="mt-4 w-full rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
            <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
              Class average Lexile by term
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">
              {scopeLabel} · the average of every saved result in that term
            </p>

            <div className="mt-5 flex items-end justify-around gap-4 px-2">
              {perTerm.map((s) => {
                const h = s.mean === null ? 0 : (s.mean / maxMean) * 150;
                return (
                  <div
                    key={s.term}
                    title={
                      s.mean === null
                        ? `Term ${s.term} — nothing saved yet`
                        : `Term ${s.term} — average ${lexileLabel(s.mean)} from ${s.results.length} result${s.results.length === 1 ? "" : "s"}`
                    }
                    className="flex w-full max-w-[110px] flex-col items-center"
                  >
                    <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-100">
                      {s.mean === null ? "—" : lexileLabel(s.mean)}
                    </span>
                    <div className="mt-1.5 flex h-[150px] w-full items-end">
                      {s.mean === null ? (
                        <div className="h-6 w-full rounded-t-[4px] border-2 border-dashed border-zinc-200 dark:border-zinc-700" />
                      ) : (
                        <div
                          className={`w-full rounded-t-[4px] ${
                            s.term === term
                              ? ""
                              : "bg-zinc-200 dark:bg-zinc-700"
                          }`}
                          style={{
                            height: `${Math.max(6, h)}px`,
                            ...(s.term === term
                              ? { background: "var(--lex-6)" }
                              : null),
                          }}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-extrabold ${
                        s.term === term
                          ? "text-zinc-700 dark:text-zinc-100"
                          : "text-zinc-400"
                      }`}
                    >
                      Term {s.term}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400">
                      {s.results.length
                        ? `${s.results.length} assessed`
                        : "not assessed"}
                    </span>
                  </div>
                );
              })}
            </div>

            {mixedCohort && (
              <p className="mt-4 text-[11px] font-semibold text-zinc-400">
                Note: the terms don’t hold the same children yet, so these
                averages move partly because the group changed. The “Growth vs
                Term 1” number above compares only children assessed in both
                terms.
              </p>
            )}
          </section>

          {/* The children, sorted into their bands */}
          <section className="mt-4 w-full rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
            <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
              Children by reading level
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">
              Term {term} · tap a name to open that child’s report
            </p>

            <div className="mt-3 flex flex-col gap-2.5">
              {stats.byBand
                .filter((b) => b.students.length)
                .reverse()
                .map(({ band, students: kids }) => (
                  <div
                    key={band.key}
                    className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: `var(--lex-${band.key})` }}
                      />
                      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-100">
                        {band.label}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {band.range} · {kids.length} child
                        {kids.length === 1 ? "" : "ren"}
                      </span>
                      <span className="basis-full text-[11px] font-semibold text-zinc-400">
                        {band.about}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {kids.map((k) => (
                        <button
                          key={`${k.yearKey}:${k.name}`}
                          onClick={() => openReport(k.record.report)}
                          title={`${k.record.report.categoryLabel} · ${k.record.report.composite}% · open report`}
                          className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-95 dark:bg-zinc-900"
                        >
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-100">
                            {k.name}
                          </span>
                          <span className="text-[11px] font-extrabold text-zinc-400">
                            {k.lexileText}
                          </span>
                          {scopeLabel === "All classes" && (
                            <span className="text-[10px] font-semibold text-zinc-300 dark:text-zinc-600">
                              {k.year}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function Tile({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
        {k}
      </div>
      <div className="mt-0.5 text-xl font-extrabold text-zinc-800 dark:text-zinc-50">
        {v}
      </div>
      <div className="truncate text-[11px] font-semibold text-zinc-400">
        {s}
      </div>
    </div>
  );
}

function topBand(stats: TermStats) {
  return stats.byBand.reduce((best, b) =>
    b.students.length > best.students.length ? b : best,
  );
}
function topBandLabel(stats: TermStats): string {
  return topBand(stats).band.label;
}
function topBandCount(stats: TermStats): number {
  return topBand(stats).students.length;
}

/** Mean Lexile change for children assessed in BOTH Term 1 and `term`. */
function growthSinceTerm1(
  students: Scoped[],
  store: TrackerStore,
  term: TermNo,
): { delta: number; n: number } {
  if (term === 1) return { delta: 0, n: 0 };
  let sum = 0;
  let n = 0;
  for (const s of students) {
    const rows = store[studentKey(s.yearKey, s.name)];
    const a = rows?.[1] ? lexileValue(rows[1]!.report.lexile) : null;
    const b = rows?.[term] ? lexileValue(rows[term]!.report.lexile) : null;
    if (a === null || b === null) continue;
    sum += b - a;
    n++;
  }
  return { delta: n ? Math.round(sum / n) : 0, n };
}

/* ---------- CSV ---------- */

function exportStats(scopeLabel: string, term: TermNo, stats: TermStats) {
  const head = [
    "Student",
    "Class",
    "Term",
    "Lexile",
    "Lexile band",
    "Band range",
    "Reader category",
    "Score %",
    "Assessed on",
  ];
  const lines = [head.join(",")];
  for (const r of stats.results) {
    lines.push(
      [
        csv(r.name),
        csv(r.year),
        String(term),
        csv(r.lexileText),
        csv(r.band.label),
        csv(r.band.range),
        csv(r.record.report.categoryLabel),
        String(r.record.report.composite),
        csv(r.record.savedAt.slice(0, 10)),
      ].join(","),
    );
  }
  lines.push("");
  lines.push(["Lexile band", "Range", "Children", "% of assessed"].join(","));
  for (const { band, students: kids } of stats.byBand) {
    lines.push(
      [
        csv(band.label),
        csv(band.range),
        String(kids.length),
        stats.results.length
          ? String(Math.round((kids.length / stats.results.length) * 100))
          : "0",
      ].join(","),
    );
  }
  lines.push("");
  lines.push(
    ["Assessed", "Average Lexile", "Median Lexile", "Lowest", "Highest"].join(
      ",",
    ),
  );
  lines.push(
    [
      String(stats.results.length),
      stats.mean === null ? "" : lexileLabel(stats.mean),
      stats.median === null ? "" : lexileLabel(stats.median),
      stats.min ? lexileLabel(stats.min.lexile) : "",
      stats.max ? lexileLabel(stats.max.lexile) : "",
    ].join(","),
  );

  const slug = scopeLabel.replace(/\s+/g, "-").toLowerCase();
  download(
    `reading-stats-${slug}-term-${term}.csv`,
    lines.join("\n"),
    "text/csv",
  );
}

function csv(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(name: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
