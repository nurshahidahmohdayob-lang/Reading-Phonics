"use client";

/* Class Tracker — a per-term reading-level record for every student, Year 1-6.

   Each row is a child; the three columns are Term 1-3. A filled cell shows the
   reading level and opens / downloads that saved report; an empty cell starts a
   fresh assessment for that child and term.

   Children who have not registered yet are LOCKED: they can't be assessed until
   the teacher unlocks them (tap the padlock by the name). Teachers can also add
   a student to any class. Both are saved per device via lib/rosterStore.ts. */

import { useState } from "react";
import { ROSTER, studentKey } from "@/app/roster";
import {
  useTracker,
  deleteRecord,
  totalSaved,
  type TermNo,
  type TrackerRecord,
  type TrackerStore,
} from "@/lib/tracker";
import {
  useRosterEdits,
  isLocked,
  setLocked,
  addStudent,
  removeAdded,
  type RosterEdits,
} from "@/lib/rosterStore";
import { openReport } from "@/lib/reportPrint";

const TERMS: TermNo[] = [1, 2, 3];

type Row = { name: string; pending: boolean; added: boolean };

// Reader-category colours for the at-a-glance dot.
const CAT_TONE: Record<string, { dot: string; text: string }> = {
  "Independent Reader": { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  "Instructional Reader": { dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300" },
  "Developing Reader": { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  "Emerging Reader": { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
};
function tone(label: string) {
  return CAT_TONE[label] ?? { dot: "bg-zinc-400", text: "text-zinc-600 dark:text-zinc-300" };
}

/* A drawn padlock, not an emoji — emoji keep their own colour, so an open one
   still looks "locked". This inherits currentColor, so unlocked reads as a
   faint outline and locked reads amber. */
function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      {locked ? (
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      ) : (
        <path d="M8 10.5V7a4 4 0 0 1 7.7-1.5" />
      )}
    </svg>
  );
}

/** Pull any records whose key is not a roster/added student (typed-in "Other"). */
function otherStudents(store: TrackerStore, known: Set<string>): string[] {
  const out: string[] = [];
  for (const key of Object.keys(store)) {
    if (known.has(key)) continue;
    const anyTerm = Object.values(store[key])[0] as TrackerRecord | undefined;
    if (anyTerm) out.push(anyTerm.student);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Roster + teacher-added students, per class. */
function buildGroups(edits: RosterEdits, store: TrackerStore) {
  const groups = ROSTER.map((g) => ({
    year: g.year,
    key: g.key,
    students: [
      ...g.students.map((s) => ({
        name: s.name,
        pending: !!s.pending,
        added: false,
      })),
      ...(edits.added[g.key] ?? []).map((name) => ({
        name,
        pending: false,
        added: true,
      })),
    ] as Row[],
  }));

  const known = new Set(
    groups.flatMap((g) => g.students.map((s) => studentKey(g.key, s.name))),
  );
  const others = otherStudents(store, known);
  if (others.length) {
    groups.push({
      year: "Other",
      key: "other",
      students: others.map((name) => ({ name, pending: false, added: false })),
    });
  }
  return groups;
}

export default function ClassTracker({
  onAssess,
}: {
  onAssess: (init: { name: string; term: TermNo }) => void;
}) {
  const { store, cloud } = useTracker();
  const edits = useRosterEdits();
  const groups = buildGroups(edits, store);

  const [yearKey, setYearKey] = useState("y1");
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addErr, setAddErr] = useState("");

  const group = groups.find((g) => g.key === yearKey) ?? groups[0];

  const rowsFor = (name: string) => store[studentKey(group.key, name)] ?? {};
  const lockedRow = (g: { key: string }, s: Row) =>
    isLocked(edits, g.key, s.name, s.pending);

  // Counts only include children who are actually attending (not locked).
  const active = group.students.filter((s) => !lockedRow(group, s));
  const lockedCount = group.students.length - active.length;
  const doneByTerm = TERMS.map(
    (t) => active.filter((s) => rowsFor(s.name)[t]).length,
  );

  function submitAdd() {
    const ok = addStudent(
      group.key,
      newName,
      group.students.map((s) => s.name),
    );
    if (!ok) {
      setAddErr(
        newName.trim() ? "That name is already in this class." : "Enter a name.",
      );
      return;
    }
    setNewName("");
    setAddErr("");
    setAdding(false);
  }

  function exportCsv() {
    const head = [
      "Student",
      "Status",
      ...TERMS.flatMap((t) => [`Term ${t} Level`, `Term ${t} Lexile`, `Term ${t} Score`]),
    ];
    const lines = [head.join(",")];
    for (const s of group.students) {
      const r = rowsFor(s.name);
      const cells = [csv(s.name), lockedRow(group, s) ? "Locked" : "Active"];
      for (const t of TERMS) {
        const rec = r[t];
        cells.push(
          csv(rec?.report.levelGrade ?? ""),
          csv(rec?.report.lexile ?? ""),
          rec ? String(rec.report.composite) : "",
        );
      }
      lines.push(cells.join(","));
    }
    download(
      `reading-tracker-${group.year.replace(/\s+/g, "-").toLowerCase()}.csv`,
      lines.join("\n"),
      "text/csv",
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Hero */}
      <div className="mt-2 w-full rounded-[2rem] bg-gradient-to-br from-[#0A4F29] to-[#0d6b39] px-6 py-6 text-center text-white shadow-lg ring-4 ring-white/60">
        <div className="text-5xl">🗂️</div>
        <h2 className="mt-1 text-2xl font-extrabold">Class Reading Tracker</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm font-semibold text-white/85">
          Every child’s reading level across Term 1, 2 and 3. Tap a saved cell to
          open or download the report; tap an empty cell to assess that child.
        </p>
      </div>

      {/* Year selector — count is assessed / attending */}
      <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
        {groups.map((g) => {
          const act = g.students.filter((s) => !lockedRow(g, s));
          const n = act.filter(
            (s) => Object.keys(store[studentKey(g.key, s.name)] ?? {}).length,
          ).length;
          const on = g.key === yearKey;
          return (
            <button
              key={g.key}
              onClick={() => {
                setYearKey(g.key);
                setAdding(false);
              }}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all active:scale-95 ${
                on
                  ? "bg-[#0A4F29] text-white shadow"
                  : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {g.year}
              <span className={`ml-1.5 text-xs ${on ? "text-white/70" : "text-zinc-400"}`}>
                {n}/{act.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Per-term summary + actions */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TERMS.map((t, i) => (
            <span
              key={t}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50"
            >
              Term {t}: {doneByTerm[i]}/{active.length}
            </span>
          ))}
          {lockedCount > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
              🔒 {lockedCount} not registered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAdding((a) => !a);
              setAddErr("");
              setNewName("");
            }}
            className="rounded-full bg-[#0A4F29] px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
          >
            ➕ Add student
          </button>
          <button
            onClick={() => setManage((m) => !m)}
            aria-pressed={manage}
            className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ring-1 active:scale-95 ${
              manage
                ? "bg-rose-500 text-white ring-rose-500"
                : "bg-white text-zinc-600 ring-black/5 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {manage ? "✓ Done" : "🗑️ Manage"}
          </button>
          <button
            onClick={exportCsv}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
          >
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {/* Add-student form */}
      {adding && (
        <div className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:ring-emerald-900/50">
          <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
            New student · {group.year}
          </span>
          <input
            autoFocus
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddErr("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Full name"
            className="min-w-[180px] flex-1 rounded-xl border-2 border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={submitAdd}
            className="rounded-full bg-[#0A4F29] px-5 py-2 text-xs font-bold text-white active:scale-95"
          >
            Add
          </button>
          <button
            onClick={() => setAdding(false)}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-500 ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800"
          >
            Cancel
          </button>
          {addErr && (
            <span className="w-full text-xs font-bold text-rose-500">{addErr}</span>
          )}
        </div>
      )}

      {manage && (
        <p className="mt-2 w-full text-center text-xs font-semibold text-rose-500">
          Manage mode — tap 🗑️ on a saved cell to delete that report, or beside an
          added name to remove them.
        </p>
      )}

      {/* Tracker grid */}
      <div className="mt-3 w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
              <th className="px-4 py-3">Student</th>
              {TERMS.map((t) => (
                <th key={t} className="px-3 py-3 text-center">
                  Term {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.students.map((s, i) => {
              const r = rowsFor(s.name);
              const locked = lockedRow(group, s);
              return (
                <tr
                  key={s.name}
                  className={
                    i % 2 ? "bg-zinc-50/60 dark:bg-zinc-800/40" : "bg-transparent"
                  }
                >
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-2">
                      {/* Padlock: tap to lock / unlock this child */}
                      <button
                        onClick={() => {
                          if (locked) {
                            if (confirm(`${s.name} has registered — unlock them?`))
                              setLocked(group.key, s.name, false);
                          } else {
                            setLocked(group.key, s.name, true);
                          }
                        }}
                        aria-label={locked ? "Unlock this student" : "Lock this student"}
                        title={
                          locked
                            ? "Not registered yet — tap to unlock"
                            : "Tap to lock (not registered yet)"
                        }
                        className={`shrink-0 rounded-md px-1.5 py-1 transition-colors active:scale-90 ${
                          locked
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300"
                        }`}
                      >
                        <LockIcon locked={locked} />
                      </button>
                      <span
                        className={`text-sm font-bold ${
                          locked
                            ? "text-zinc-400 dark:text-zinc-500"
                            : "text-zinc-700 dark:text-zinc-100"
                        }`}
                      >
                        {s.name}
                      </span>
                      {s.added && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          new
                        </span>
                      )}
                      {manage && s.added && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${s.name} from ${group.year}?`))
                              removeAdded(group.key, s.name);
                          }}
                          aria-label="Remove this student"
                          className="rounded-md px-1 text-zinc-300 hover:text-rose-500"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                  {TERMS.map((t) => (
                    <td key={t} className="px-3 py-2.5 text-center align-middle">
                      <Cell
                        rec={r[t]}
                        manage={manage}
                        locked={locked}
                        onOpen={(rec) => openReport(rec.report)}
                        onDelete={() => {
                          if (confirm(`Delete ${s.name}'s Term ${t} report?`))
                            deleteRecord(group.key, s.name, t);
                        }}
                        onAssess={() => onAssess({ name: s.name, term: t })}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend + storage note */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {Object.entries(CAT_TONE).map(([label, t]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
            {label.replace(" Reader", "")}
          </span>
        ))}
        <span className="flex items-center gap-1.5">🔒 Not registered yet</span>
      </div>
      <p className="mt-3 max-w-xl text-center text-xs font-semibold text-zinc-400">
        {totalSaved(store)} report{totalSaved(store) === 1 ? "" : "s"} saved.{" "}
        {cloud === "on" ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            ☁️ Synced to the cloud — the same data shows on every device.
          </span>
        ) : cloud === "off" ? (
          <span className="text-amber-600 dark:text-amber-400">
            On this device only — cloud sync isn’t set up yet.
          </span>
        ) : (
          <span>Checking cloud sync…</span>
        )}
      </p>
    </div>
  );
}

/** One term cell: a saved level chip, a locked marker, or an “assess” prompt. */
function Cell({
  rec,
  manage,
  locked,
  onOpen,
  onDelete,
  onAssess,
}: {
  rec: TrackerRecord | undefined;
  manage: boolean;
  locked: boolean;
  onOpen: (rec: TrackerRecord) => void;
  onDelete: () => void;
  onAssess: () => void;
}) {
  // Locked and nothing saved — can't be assessed until they register.
  // (An existing report still shows, so no data is ever hidden.)
  if (!rec && locked) {
    return (
      <span className="mx-auto flex h-9 w-full max-w-[130px] items-center justify-center gap-1.5 rounded-lg bg-zinc-50 text-xs font-bold text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-600">
        <LockIcon locked />
        Locked
      </span>
    );
  }

  if (!rec) {
    return (
      <button
        onClick={onAssess}
        disabled={manage}
        className="mx-auto flex h-9 w-full max-w-[130px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-xs font-bold text-zinc-400 transition-colors hover:border-rose-300 hover:text-rose-500 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-400 dark:border-zinc-700"
      >
        + Assess
      </button>
    );
  }
  const t = tone(rec.report.categoryLabel);

  // Manage mode: show the level next to a delete button.
  if (manage) {
    return (
      <div className="mx-auto flex max-w-[160px] items-center gap-1.5">
        <span className="flex flex-1 items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 opacity-70 ring-1 ring-black/5 dark:bg-zinc-800">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-extrabold leading-none ${t.text}`}>
              {rec.report.lexile}
            </span>
            <span className="block truncate text-[10px] font-semibold text-zinc-400">
              {rec.report.levelGrade}
            </span>
          </span>
        </span>
        <button
          onClick={onDelete}
          aria-label="Delete this report"
          className="shrink-0 rounded-lg bg-rose-100 px-2 py-2 text-rose-600 shadow-sm active:scale-90 dark:bg-rose-950/50 dark:text-rose-300"
        >
          🗑️
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(rec)}
      title={`${rec.report.categoryLabel} · ${rec.report.composite}% · open report`}
      className="mx-auto flex max-w-[150px] items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-95 dark:bg-zinc-800"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} />
      <span className="min-w-0">
        <span className={`block text-sm font-extrabold leading-none ${t.text}`}>
          {rec.report.lexile}
        </span>
        <span className="block truncate text-[10px] font-semibold text-zinc-400">
          {rec.report.levelGrade}
        </span>
      </span>
    </button>
  );
}

/* ---------- tiny helpers ---------- */
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
