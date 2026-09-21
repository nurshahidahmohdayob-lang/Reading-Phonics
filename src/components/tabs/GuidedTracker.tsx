"use client";

/* Guided reading in the Class Tracker: who has read what, and how they did.

   Every read-aloud a child finishes in Guided Reading is logged with its
   accuracy, words-per-minute and the story's name (see lib/guidedLog.ts).
   This view turns that into a per-child picture: how many stories they've
   read, how they're averaging, and the list of titles with their marks. */

import { useState } from "react";
import type { Scoped } from "@/lib/lexileStats";
import {
  useGuidedLog,
  readsFor,
  latestPerStory,
  averageAccuracy,
  removeGuidedRead,
  type GuidedRead,
} from "@/lib/guidedLog";

/** Reading accuracy, coloured the way the reports do. */
function tone(accuracy: number) {
  if (accuracy >= 95) return "text-emerald-700 dark:text-emerald-300";
  if (accuracy >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
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
}: {
  students: Scoped[];
  scopeLabel: string;
  /** Manage mode: show a 🗑️ on each read. */
  manage: boolean;
}) {
  const log = useGuidedLog();
  const [open, setOpen] = useState<string | null>(null);

  const rows = students.map((s) => {
    const reads = readsFor(log, s.yearKey, s.name);
    const latest = latestPerStory(reads);
    return { ...s, reads, latest, avg: averageAccuracy(reads) };
  });
  const active = rows.filter((r) => r.reads.length);
  const storiesRead = active.reduce((n, r) => n + r.latest.length, 0);
  const classAvg = active.length
    ? Math.round(active.reduce((n, r) => n + (r.avg ?? 0), 0) / active.length)
    : null;

  if (!active.length) {
    return (
      <div className="mt-4 w-full rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <div className="text-4xl">📖</div>
        <p className="mt-2 text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
          No guided reading saved for {scopeLabel} yet.
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-zinc-400">
          Open <b>Guided Reading</b>, type the child’s name at the top, and
          every story they read aloud lands here with its marks.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* How the class is going */}
      <div className="mt-4 grid w-full grid-cols-3 gap-3">
        <Tile
          k="Children reading"
          v={`${active.length}`}
          s={`of ${students.length}`}
        />
        <Tile
          k="Stories read"
          v={`${storiesRead}`}
          s={
            active.length
              ? `${Math.round(storiesRead / active.length)} each on average`
              : ""
          }
        />
        <Tile
          k="Average accuracy"
          v={classAvg === null ? "—" : `${classAvg}%`}
          s="across their latest reads"
        />
      </div>

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
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      disabled={!r.reads.length}
                      className="flex items-center gap-2 text-left text-sm font-bold text-zinc-700 disabled:cursor-default dark:text-zinc-100"
                    >
                      {r.reads.length > 0 && (
                        <span className="text-[10px] text-zinc-400">
                          {isOpen ? "▼" : "▶"}
                        </span>
                      )}
                      {r.name}
                    </button>
                    {isOpen && (
                      <div className="mt-2 flex flex-col gap-1 pb-1">
                        {r.latest.map((read) => (
                          <ReadLine
                            key={read.passageId + read.at}
                            read={read}
                            manage={manage}
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
                      <span className={`text-sm font-extrabold ${tone(r.avg)}`}>
                        {r.avg}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {last ? (
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-300">
                        <span className="font-bold text-zinc-700 dark:text-zinc-100">
                          {last.title}
                        </span>{" "}
                        · {shortDate(last.at)}
                      </span>
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

      <p className="mt-3 text-center text-xs font-semibold text-zinc-400">
        Tap a name to see every story they’ve read. Accuracy is from their most
        recent read of each story.
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
  onDelete,
}: {
  read: GuidedRead;
  manage: boolean;
  onDelete: () => void;
}) {
  return (
    <span className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
      <span className={`font-extrabold ${tone(read.accuracy)}`}>
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
