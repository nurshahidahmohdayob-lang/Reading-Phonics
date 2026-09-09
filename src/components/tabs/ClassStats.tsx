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
import { openStatsReport } from "@/lib/statsPrint";

const TERMS: TermNo[] = [1, 2, 3];

/** Where each Lexile band starts — drawn as hairlines behind the bars. */
const BAND_MARKS = [100, 300, 500, 700, 850];

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

  const maxCount = Math.max(1, ...stats.byBand.map((b) => b.students.length));
  // One shared scale for the per-child bars, rounded up to a tidy 100L.
  const axisMax = Math.max(
    500,
    Math.ceil(Math.max(0, ...stats.results.map((r) => r.lexile)) / 100) * 100,
  );

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
          onClick={() =>
            openStatsReport({
              scopeLabel,
              term,
              stats,
              growth,
              deltas: allDeltas(students, store, term),
            })
          }
          disabled={!assessed}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          🖨️ Open printable report
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

          {/* Chart 2 — every child's own Lexile level */}
          <section className="mt-4 w-full rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
            <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
              Every child’s Lexile level
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-zinc-400">
              {scopeLabel} · Term {term} · highest reader first · tap a bar to
              open that child’s report
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              {stats.results.map((r) => {
                const prev = earlierTerm(store, r, term);
                const delta = prev === null ? null : r.lexile - prev;
                return (
                  <button
                    key={`${r.yearKey}:${r.name}`}
                    onClick={() => openReport(r.record.report)}
                    title={`${r.name} — ${r.lexileText}, ${r.band.label} (${r.band.range}) · open report`}
                    className="flex items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  >
                    <span className="w-[92px] shrink-0 truncate text-xs font-bold text-zinc-700 sm:w-[170px] md:w-[210px] dark:text-zinc-100">
                      {r.name}
                    </span>
                    <span className="relative flex h-6 flex-1 items-center">
                      {/* Band thresholds — hairlines, so you can see which band
                          a bar lands in without reading the number. */}
                      {BAND_MARKS.filter((m) => m < axisMax).map((m) => (
                        <span
                          key={m}
                          className="absolute top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800"
                          style={{ left: `${(m / axisMax) * 100}%` }}
                        />
                      ))}
                      <span
                        className="relative h-3.5 rounded-r-[4px]"
                        style={{
                          width: `${Math.max(2, (r.lexile / axisMax) * 100)}%`,
                          background: `var(--lex-${r.band.key})`,
                        }}
                      />
                    </span>
                    <span className="w-[104px] shrink-0 text-right">
                      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-100">
                        {r.lexileText}
                      </span>
                      {delta !== null && (
                        <span
                          className={`ml-1.5 text-[10px] font-bold ${
                            delta > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : delta < 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
                          {Math.abs(delta)}L
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Axis: where the bands start */}
            <div className="mt-1 flex items-center gap-3 px-1">
              <span className="w-[92px] shrink-0 sm:w-[170px] md:w-[210px]" />
              <span className="relative h-4 flex-1 border-t border-zinc-100 dark:border-zinc-800">
                {BAND_MARKS.filter((m) => m < axisMax).map((m) => (
                  <span
                    key={m}
                    className="absolute top-0.5 -translate-x-1/2 text-[9px] font-bold text-zinc-300 dark:text-zinc-600"
                    style={{ left: `${(m / axisMax) * 100}%` }}
                  >
                    {m}L
                  </span>
                ))}
              </span>
              <span className="w-[104px] shrink-0" />
            </div>

            {term > 1 && (
              <p className="mt-3 text-[11px] font-semibold text-zinc-400">
                The small green number is the change since that child’s last
                assessed term.
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

      {/* What the two numbers mean — the same wording as the child's report */}
      <section className="mt-4 w-full rounded-2xl bg-sky-50 p-5 ring-1 ring-sky-100 dark:bg-sky-950/30 dark:ring-sky-900/50">
        <h3 className="text-sm font-extrabold text-sky-900 dark:text-sky-200">
          👪 What these numbers mean
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-sky-900/50">
            <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
              Lexile / band — <i>what</i> they can read
            </div>
            <p className="mt-1 text-xs font-semibold text-sky-900/80 dark:text-sky-100/70">
              The difficulty of text the child can handle, measured from the
              word check. Bigger number = harder books.
            </p>
            <p className="mt-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
              BR–99L Emerging · 100–299L Early · 300–499L Developing · 500–699L
              Independent · 700–849L Advanced · 850L+ Proficient
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-sky-900/50">
            <div className="text-xs font-extrabold text-sky-900 dark:text-sky-200">
              Score % — <i>how well</i> they read it
            </div>
            <p className="mt-1 text-xs font-semibold text-sky-900/80 dark:text-sky-100/70">
              How they read the passage in front of them: accuracy 40%, fluency
              30%, understanding 30%. This score names the reader category.
            </p>
            <p className="mt-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
              90–100% Independent · 75–89% Instructional · 60–74% Developing ·
              below 60% Emerging
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-sky-900/80 dark:text-sky-100/70">
          <b>The two do not have to match.</b> A higher Lexile with a lower
          score means the child is reading harder text but not yet smoothly —
          the level where guided reading helps most. A lower Lexile with a high
          score means they read their level confidently and are ready to be
          stretched.
        </p>
      </section>
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

/** That child's Lexile in the most recent earlier term they were assessed. */
function earlierTerm(
  store: TrackerStore,
  r: { name: string; yearKey: string },
  term: TermNo,
): number | null {
  const rows = store[studentKey(r.yearKey, r.name)];
  if (!rows) return null;
  for (let t = term - 1; t >= 1; t--) {
    const rec = rows[t as TermNo];
    const lex = rec ? lexileValue(rec.report.lexile) : null;
    if (lex !== null) return lex;
  }
  return null;
}

/** Every child's change since their last assessed term, keyed "yearKey:name".
    Children with no earlier result are left out. */
function allDeltas(
  students: Scoped[],
  store: TrackerStore,
  term: TermNo,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of students) {
    const rows = store[studentKey(s.yearKey, s.name)];
    const now = rows?.[term] ? lexileValue(rows[term]!.report.lexile) : null;
    if (now === null) continue;
    const prev = earlierTerm(store, s, term);
    if (prev !== null) out[`${s.yearKey}:${s.name}`] = now - prev;
  }
  return out;
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
