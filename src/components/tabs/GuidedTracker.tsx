"use client";

/* Guided reading in the Class Tracker: who has read what, and how they did.

   Every read-aloud a child finishes in Guided Reading is logged with its
   accuracy, words-per-minute and the story's name (see lib/guidedLog.ts).
   This view turns that into a per-child picture: how many stories they've
   read, how they're averaging, and the list of titles with their marks. */

import { useState } from "react";
import { latestLexile, lexileLabel, type Scoped } from "@/lib/lexileStats";
import { useTracker } from "@/lib/tracker";
import { levelForReader, passageLevels } from "@/app/passages";
import { classifyAccuracy, type AccuracyVerdict } from "@/app/stories";
import type { GuidedStart } from "./GuidedReading";
import GuidedReadReport from "@/components/GuidedReadReport";
import { printWorksheetForRead } from "@/lib/worksheet";
import {
  useGuidedLog,
  readsFor,
  latestPerStory,
  averageAccuracy,
  removeGuidedRead,
  type GuidedRead,
} from "@/lib/guidedLog";

/* A mark is coloured by what it means for the level of the story that was
   read — the same judgement the reading report makes (classifyAccuracy), so
   the two screens can't disagree. 91% is comfortable for a Year 1 story and
   too hard for a Year 6 one. */
const VERDICT_TONE: Record<AccuracyVerdict["label"], string> = {
  Independent: "text-emerald-700 dark:text-emerald-300",
  Instructional: "text-amber-600 dark:text-amber-400",
  Developing: "text-rose-600 dark:text-rose-400",
};

/** The level a read was logged at. Older reads saved "y2" for "year2". */
function levelOf(levelId: string | undefined) {
  if (!levelId) return null;
  const id = levelId.replace(/^y(\d)$/, "year$1");
  return passageLevels.find((l) => l.id === id) ?? null;
}

function verdict(accuracy: number, levelId: string | undefined) {
  const level = levelOf(levelId);
  if (!level) return null;
  return { ...classifyAccuracy(level.source, accuracy), grade: level.grade };
}

function tone(accuracy: number, levelId: string | undefined) {
  const v = verdict(accuracy, levelId);
  return v ? VERDICT_TONE[v.label] : "text-zinc-600 dark:text-zinc-300";
}

function toneTitle(accuracy: number, levelId: string | undefined) {
  const v = verdict(accuracy, levelId);
  return v ? `${v.label} for a ${v.grade} story — ${v.meaning}` : undefined;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function GuidedTracker({
  students,
  scopeLabel,
  manage,
  onRead,
}: {
  students: Scoped[];
  scopeLabel: string;
  /** Manage mode: show a 🗑️ on each read. */
  manage: boolean;
  /** Open Guided Reading for this child, on the stories for their level. */
  onRead: (start: GuidedStart) => void;
}) {
  const log = useGuidedLog();
  const { store } = useTracker();
  const [open, setOpen] = useState<string | null>(null);
  // The read whose report is open, and whose it is.
  const [viewing, setViewing] = useState<{
    name: string;
    year: string;
    read: GuidedRead;
    lexile: number | null;
  } | null>(null);

  const rows = students.map((s) => {
    const reads = readsFor(log, s.yearKey, s.name);
    const latest = latestPerStory(reads);
    // Their level: by their latest assessment, or their year if not assessed.
    const lexile = latestLexile(store, s.yearKey, s.name);
    const level = levelForReader(lexile, s.yearKey);
    return { ...s, reads, latest, avg: averageAccuracy(reads), level, lexile };
  });
  const active = rows.filter((r) => r.reads.length);
  const storiesRead = active.reduce((n, r) => n + r.latest.length, 0);
  const classAvg = active.length
    ? Math.round(active.reduce((n, r) => n + (r.avg ?? 0), 0) / active.length)
    : null;

  return (
    <div className="w-full">
      {active.length ? (
        /* How the class is going */
        <div className="mt-4 grid w-full grid-cols-3 gap-3">
          <Tile
            k="Children reading"
            v={`${active.length}`}
            s={`of ${students.length}`}
          />
          <Tile
            k="Stories read"
            v={`${storiesRead}`}
            s={`${Math.round(storiesRead / active.length)} each on average`}
          />
          <Tile
            k="Average accuracy"
            v={classAvg === null ? "—" : `${classAvg}%`}
            s="across their latest reads"
          />
        </div>
      ) : (
        // Nobody has read yet — but the names are still listed below, since
        // tapping one is how a child's first story gets started.
        <div className="mt-4 w-full rounded-2xl bg-white px-6 py-6 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          <div className="text-3xl">📖</div>
          <p className="mt-1 text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
            No guided reading saved for {scopeLabel} yet.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-zinc-400">
            Tap a child’s name below to start them on a story at their level —
            every story they read aloud lands here with its marks.
          </p>
        </div>
      )}

      <div className="mt-3 w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              <th className="px-4 py-3">Student</th>
              <th className="px-3 py-3 text-center">Stories</th>
              <th className="px-3 py-3 text-center">Average</th>
              <th className="px-3 py-3">Last read</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const key = `${r.yearKey}:${r.name}`;
              const last = r.latest[0];
              const isOpen = open === key;
              return (
                <Row key={key} striped={i % 2 === 1}>
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-2">
                      {/* The arrow lists what they've read; the name starts
                          them reading. */}
                      {r.reads.length > 0 ? (
                        <button
                          onClick={() => setOpen(isOpen ? null : key)}
                          aria-label={
                            isOpen
                              ? `Hide ${r.name}'s stories`
                              : `Show ${r.name}'s stories`
                          }
                          className="grid h-6 w-6 place-items-center rounded-md text-[10px] text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {isOpen ? "▼" : "▶"}
                        </button>
                      ) : (
                        <span className="w-6" />
                      )}
                      <button
                        onClick={() =>
                          onRead({ name: r.name, levelId: r.level.id })
                        }
                        title={`Guided reading at ${r.level.grade} · ${r.level.lexileRange}`}
                        className="group flex flex-wrap items-baseline gap-x-2 text-left text-sm font-bold text-zinc-700 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300"
                      >
                        <span className="underline decoration-zinc-300 decoration-dotted underline-offset-4 group-hover:decoration-brand-400">
                          {r.name}
                        </span>
                        {/* Their reading level, and the stories it opens. */}
                        {r.lexile !== null ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                            {lexileLabel(r.lexile)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-400 dark:bg-zinc-800">
                            not assessed
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-brand-500">
                          📖 {r.level.grade}
                        </span>
                      </button>
                    </div>
                    {isOpen && (
                      <div className="mt-2 flex flex-col gap-1 pb-1">
                        {r.latest.map((read) => (
                          <ReadLine
                            key={read.passageId + read.at}
                            read={read}
                            manage={manage}
                            onOpen={() =>
                              setViewing({
                                name: r.name,
                                year: r.year,
                                read,
                                lexile: r.lexile,
                              })
                            }
                            onWorksheet={() =>
                              printWorksheetForRead(read, {
                                name: r.name,
                                year: r.year,
                                lexile: r.lexile,
                              })
                            }
                            onDelete={() =>
                              removeGuidedRead(r.yearKey, r.name, read.at)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center align-middle text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
                    {r.latest.length || (
                      <span className="text-zinc-300 dark:text-zinc-600">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center align-middle">
                    {r.avg === null ? (
                      <span className="text-sm text-zinc-300 dark:text-zinc-600">
                        —
                      </span>
                    ) : (
                      <span
                        className={`text-sm font-extrabold ${tone(r.avg, last?.levelId)}`}
                        title={toneTitle(r.avg, last?.levelId)}
                      >
                        {r.avg}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {last ? (
                      <button
                        onClick={() =>
                          setViewing({
                            name: r.name,
                            year: r.year,
                            read: last,
                            lexile: r.lexile,
                          })
                        }
                        title="Open the report for this read"
                        className="text-left text-xs font-semibold text-zinc-500 hover:text-brand-700 dark:text-zinc-300"
                      >
                        <span className="font-bold text-zinc-700 underline decoration-zinc-300 decoration-dotted underline-offset-4 dark:text-zinc-100">
                          {last.title}
                        </span>{" "}
                        · {shortDate(last.at)} 📄
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-300 dark:text-zinc-600">
                        nothing yet
                      </span>
                    )}
                  </td>
                </Row>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* What the colours mean */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        <span>
          <b className="text-emerald-700 dark:text-emerald-300">
            ● Independent
          </b>{" "}
          — can read this level alone
        </span>
        <span>
          <b className="text-amber-600 dark:text-amber-400">● Instructional</b>{" "}
          — right for guided reading, with help
        </span>
        <span>
          <b className="text-rose-600 dark:text-rose-400">● Developing</b> — too
          hard for now, try an easier level
        </span>
      </div>
      <p className="mt-1 text-center text-[11px] font-semibold text-zinc-400">
        Judged against the level of the story, the same as the reading report:
        the bar rises each year, from 95% for Year 1 to 98% for Year 6. An
        average is judged at the level of their latest story.
      </p>

      {viewing && (
        <GuidedReadReport
          name={viewing.name}
          year={viewing.year}
          read={viewing.read}
          lexile={viewing.lexile}
          onClose={() => setViewing(null)}
        />
      )}

      <p className="mt-3 text-center text-xs font-semibold text-zinc-400">
        The blue Lexile beside each name is their reading level from their
        latest assessment. Tap a name to start them reading at that level, or at
        their year if they haven’t been assessed. ▶ shows every story they’ve
        read — tap one to open its report. Accuracy is from their most recent
        read of each story.
      </p>
    </div>
  );
}

function Row({
  striped,
  children,
}: {
  striped: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr
      className={
        striped ? "bg-zinc-50/60 dark:bg-zinc-800/40" : "bg-transparent"
      }
    >
      {children}
    </tr>
  );
}

function ReadLine({
  read,
  manage,
  onOpen,
  onWorksheet,
  onDelete,
}: {
  read: GuidedRead;
  manage: boolean;
  onOpen: () => void;
  onWorksheet: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
      <button
        onClick={onOpen}
        title="Open the report for this read"
        className="flex flex-wrap items-center gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span
          className={`font-extrabold ${tone(read.accuracy, read.levelId)}`}
          title={toneTitle(read.accuracy, read.levelId)}
        >
          {read.accuracy}%
        </span>
        <span className="font-bold text-zinc-600 dark:text-zinc-300">
          {read.title}
        </span>
        <span className="text-zinc-400">
          {read.lexile ? `${read.lexile}L · ` : ""}
          {read.wcpm} wpm · {read.correct}/{read.total} words ·{" "}
          {shortDate(read.at)}
        </span>
        <span className="text-brand-600 dark:text-brand-300">📄 Report</span>
      </button>
      <button
        onClick={onWorksheet}
        title="A printable worksheet on this story, at this child's level"
        className="rounded-lg px-1.5 py-0.5 font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
      >
        📝 Worksheet
      </button>
      {manage && (
        <button
          onClick={() => {
            if (confirm(`Remove “${read.title}” from this child’s log?`))
              onDelete();
          }}
          aria-label="Remove this read"
          className="rounded px-1 text-zinc-300 hover:text-rose-500"
        >
          🗑️
        </button>
      )}
    </span>
  );
}

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
