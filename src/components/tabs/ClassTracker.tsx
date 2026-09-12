"use client";

/* Class Tracker — a per-term reading-level record for every student, Year 1-6.

   Each row is a child; the three columns are Term 1-3. A filled cell shows the
   reading level and opens / downloads that saved report; an empty cell starts a
   fresh assessment for that child and term.

   The last column holds the parent's email: save it once, then ✉️ writes the
   report up in the teacher's own mail app, with a link that opens just that
   child's report (see lib/emailReport.ts and lib/reportLink.ts). 🔗 copies
   the same link for WhatsApp or webmail.

   🔄 Sync checks the class lists against the school system and offers to add
   any children it has that the tracker doesn't (see lib/rosterSync.ts). It
   never renames or removes anyone — reports are filed under a child's name.

   The Statistics view turns the same records into graphs: how many children
   sit in each Lexile band, the class average per term, and every child sorted
   into their band (see ClassStats.tsx).

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
import { displayLexile } from "@/lib/lexileStats";
import {
  useParentContacts,
  parentEmail,
  setParentEmail,
  looksLikeEmail,
  type ParentBook,
} from "@/lib/parentContacts";
import { emailReport, copyReportLink } from "@/lib/emailReport";
import {
  useMailVia,
  setMailVia,
  MAIL_VIA_LABEL,
  type MailVia,
} from "@/lib/mailPrefs";
import {
  compareRoster,
  sameChild,
  closestName,
  type ClassDiff,
} from "@/lib/rosterSync";
import type { SchoolStudent } from "@/lib/studentsApi";
import ClassStats from "./ClassStats";
import type { Scoped } from "@/lib/lexileStats";

const TERMS: TermNo[] = [1, 2, 3];

type Row = { name: string; pending: boolean; added: boolean };

// Reader-category colours for the at-a-glance dot.
const CAT_TONE: Record<string, { dot: string; text: string }> = {
  "Independent Reader": {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  "Instructional Reader": {
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
  },
  "Developing Reader": {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  "Emerging Reader": {
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-300",
  },
};
function tone(label: string) {
  return (
    CAT_TONE[label] ?? {
      dot: "bg-zinc-400",
      text: "text-zinc-600 dark:text-zinc-300",
    }
  );
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
  teacherName,
  teacherEmail,
}: {
  onAssess: (init: { name: string; term: TermNo }) => void;
  /** Signed-in staff name — signs the emails to parents. */
  teacherName?: string;
  /** Signed-in staff address — the mailbox parents' emails go from. */
  teacherEmail?: string;
}) {
  const { store, cloud } = useTracker();
  const edits = useRosterEdits();
  const parents = useParentContacts();
  const mailVia = useMailVia();
  const groups = buildGroups(edits, store);

  const [view, setView] = useState<"tracker" | "stats">("tracker");
  const [yearKey, setYearKey] = useState("y1");
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addErr, setAddErr] = useState("");
  const [sync, setSync] = useState<SyncState>({ kind: "idle" });
  const [bulk, setBulk] = useState(false);

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

  // Statistics can also look across every class at once ("All classes").
  const allYears = view === "stats" && yearKey === "all";
  const scopeLabel = allYears ? "All classes" : group.year;
  const scopeStudents: Scoped[] = allYears
    ? groups.flatMap((g) =>
        g.students
          .filter((s) => !lockedRow(g, s))
          .map((s) => ({ name: s.name, year: g.year, yearKey: g.key })),
      )
    : active.map((s) => ({
        name: s.name,
        year: group.year,
        yearKey: group.key,
      }));

  function submitAdd() {
    const ok = addStudent(
      group.key,
      newName,
      group.students.map((s) => s.name),
    );
    if (!ok) {
      setAddErr(
        newName.trim()
          ? "That name is already in this class."
          : "Enter a name.",
      );
      return;
    }
    setNewName("");
    setAddErr("");
    setAdding(false);
  }

  /** Ask the school system for its class lists and compare them with ours. */
  async function runSync() {
    setSync({ kind: "loading" });
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data?.configured === false) {
        setSync({
          kind: "error",
          message:
            "The school system isn’t connected on this site yet — its student key needs adding to the site settings.",
        });
        return;
      }
      if (!data?.ok) {
        setSync({
          kind: "error",
          message:
            typeof data?.error === "string"
              ? data.error
              : "Couldn’t reach the school system.",
        });
        return;
      }
      const diffs = compareRoster(data.students as SchoolStudent[], groups);
      setSync({
        kind: "ready",
        diffs,
        // Ticked by default, except the ones that look like a child we
        // already have under a different spelling.
        picked: new Set(
          diffs.flatMap((d) =>
            d.toAdd
              .filter((a) => !a.similar)
              .map((a) => `${d.yearKey}:${a.student.name}`),
          ),
        ),
      });
    } catch {
      setSync({ kind: "error", message: "Couldn’t reach the school system." });
    }
  }

  /** Add the ticked children. Nothing is renamed or removed. */
  function applySync() {
    if (sync.kind !== "ready") return;
    let added = 0;
    for (const d of sync.diffs) {
      const existing =
        groups.find((g) => g.key === d.yearKey)?.students.map((s) => s.name) ??
        [];
      for (const a of d.toAdd) {
        if (!sync.picked.has(`${d.yearKey}:${a.student.name}`)) continue;
        if (addStudent(d.yearKey, a.student.name, existing)) added++;
      }
    }
    setSync({ kind: "done", added });
  }

  function exportCsv() {
    const head = [
      "Student",
      "Status",
      ...TERMS.flatMap((t) => [
        `Term ${t} Level`,
        `Term ${t} Lexile`,
        `Term ${t} Score`,
      ]),
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
          Every child’s reading level across Term 1, 2 and 3. Tap a saved cell
          to open or download the report; tap an empty cell to assess that
          child.
        </p>
      </div>

      {/* Tracker ⇄ Statistics */}
      <div className="mt-4 flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5 dark:bg-zinc-800">
        {(
          [
            ["tracker", "📋 Tracker"],
            ["stats", "📊 Statistics"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setManage(false);
              setAdding(false);
              if (v === "tracker" && yearKey === "all") setYearKey("y1");
            }}
            aria-pressed={view === v}
            className={`rounded-full px-5 py-2 text-sm font-extrabold transition-all active:scale-95 ${
              view === v
                ? "bg-[#0A4F29] text-white shadow"
                : "text-zinc-500 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Year selector — count is assessed / attending */}
      <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
        {view === "stats" && (
          <button
            onClick={() => setYearKey("all")}
            className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all active:scale-95 ${
              allYears
                ? "bg-[#0A4F29] text-white shadow"
                : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            All classes
          </button>
        )}
        {groups.map((g) => {
          const act = g.students.filter((s) => !lockedRow(g, s));
          const n = act.filter(
            (s) => Object.keys(store[studentKey(g.key, s.name)] ?? {}).length,
          ).length;
          const on = g.key === yearKey && !allYears;
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
              <span
                className={`ml-1.5 text-xs ${on ? "text-white/70" : "text-zinc-400"}`}
              >
                {n}/{act.length}
              </span>
            </button>
          );
        })}
      </div>

      {view === "stats" ? (
        <ClassStats
          scopeLabel={scopeLabel}
          students={scopeStudents}
          store={store}
        />
      ) : (
        <>
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
                onClick={() => {
                  setBulk((b) => !b);
                  setSync({ kind: "idle" });
                }}
                aria-pressed={bulk}
                title="Paste a list of parent emails and fill them all in"
                className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ring-1 active:scale-95 ${
                  bulk
                    ? "bg-[#0A4F29] text-white ring-transparent"
                    : "bg-white text-zinc-600 ring-black/5 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                ✉️ Parent emails
              </button>
              <button
                onClick={() => void runSync()}
                disabled={sync.kind === "loading"}
                title="Check the class lists against the school system"
                className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {sync.kind === "loading" ? "⏳ Checking…" : "🔄 Sync students"}
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

          {bulk && (
            <BulkEmails
              students={groups.flatMap((g) =>
                g.students.map((st) => ({
                  name: st.name,
                  year: g.year,
                  yearKey: g.key,
                })),
              )}
              book={parents}
              onClose={() => setBulk(false)}
            />
          )}

          {sync.kind !== "idle" && sync.kind !== "loading" && (
            <SyncPanel
              state={sync}
              onToggle={(key) => {
                if (sync.kind !== "ready") return;
                const picked = new Set(sync.picked);
                if (picked.has(key)) picked.delete(key);
                else picked.add(key);
                setSync({ ...sync, picked });
              }}
              onApply={applySync}
              onClose={() => setSync({ kind: "idle" })}
            />
          )}

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
                <span className="w-full text-xs font-bold text-rose-500">
                  {addErr}
                </span>
              )}
            </div>
          )}

          {manage && (
            <p className="mt-2 w-full text-center text-xs font-semibold text-rose-500">
              Manage mode — tap 🗑️ on a saved cell to delete that report, or
              beside an added name to remove them.
            </p>
          )}

          {/* Tracker grid */}
          <div className="mt-3 w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-bold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="px-4 py-3">Student</th>
                  {TERMS.map((t) => (
                    <th key={t} className="px-3 py-3 text-center">
                      Term {t}
                    </th>
                  ))}
                  <th className="px-3 py-3">Parent email</th>
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
                        i % 2
                          ? "bg-zinc-50/60 dark:bg-zinc-800/40"
                          : "bg-transparent"
                      }
                    >
                      <td className="px-4 py-2.5 align-middle">
                        <div className="flex items-center gap-2">
                          {/* Padlock: tap to lock / unlock this child */}
                          <button
                            onClick={() => {
                              if (locked) {
                                if (
                                  confirm(
                                    `${s.name} has registered — unlock them?`,
                                  )
                                )
                                  setLocked(group.key, s.name, false);
                              } else {
                                setLocked(group.key, s.name, true);
                              }
                            }}
                            aria-label={
                              locked
                                ? "Unlock this student"
                                : "Lock this student"
                            }
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
                                if (
                                  confirm(
                                    `Remove ${s.name} from ${group.year}?`,
                                  )
                                )
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
                        <td
                          key={t}
                          className="px-3 py-2.5 text-center align-middle"
                        >
                          <Cell
                            rec={r[t]}
                            manage={manage}
                            locked={locked}
                            onOpen={(rec) => openReport(rec.report)}
                            onDelete={() => {
                              if (
                                confirm(`Delete ${s.name}'s Term ${t} report?`)
                              )
                                deleteRecord(group.key, s.name, t);
                            }}
                            onAssess={() => onAssess({ name: s.name, term: t })}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2.5 align-middle">
                        <ParentCell
                          yearKey={group.key}
                          name={s.name}
                          book={parents}
                          latest={latestRecord(r)}
                          manage={manage}
                          teacherName={teacherName}
                          teacherEmail={teacherEmail}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-xs font-semibold text-zinc-400">
            <span>
              ✉️ writes the message with a link to just that child’s report and
              opens it in
            </span>
            <select
              value={mailVia}
              onChange={(e) => setMailVia(e.target.value as MailVia)}
              className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-zinc-600 ring-1 ring-black/10 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {(Object.keys(MAIL_VIA_LABEL) as MailVia[]).map((v) => (
                <option key={v} value={v}>
                  {MAIL_VIA_LABEL[v]}
                </option>
              ))}
            </select>
            <span>
              {teacherEmail ? `— sending as ${teacherEmail}. ` : "— "}
              Press send there. 🔗 copies the same link.
            </span>
          </p>

          {/* Legend + storage note */}
          <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {Object.entries(CAT_TONE).map(([label, t]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
                {label.replace(" Reader", "")}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              🔒 Not registered yet
            </span>
          </div>
        </>
      )}
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

/** Paste a whole list of parent emails at once — one child per line, in any
    order, matched to the class lists by name the same way the school-system
    sync matches them. */
function BulkEmails({
  students,
  book,
  onClose,
}: {
  students: { name: string; year: string; yearKey: string }[];
  book: ParentBook;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");

  /** Pull every guardian address the school system has and drop them into the
      box, so the same preview-and-save flow applies. */
  async function fetchFromSchool() {
    setFetching(true);
    setFetchNote("");
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data?.configured === false) {
        setFetchNote(
          "The school system isn’t connected on this site yet — its student key needs adding to the site settings.",
        );
        return;
      }
      if (!data?.ok) {
        setFetchNote("Couldn’t reach the school system.");
        return;
      }
      if (data.guardians === "denied") {
        setFetchNote(
          "The school system won’t share guardian details with this key — ask for the “guardians.read” ability to be added to it, then try again.",
        );
        return;
      }
      const list = (data.students as SchoolStudent[]).filter(
        (st) => st.parentEmails?.length,
      );
      if (!list.length) {
        setFetchNote(
          "The school system has no parent emails for these classes.",
        );
        return;
      }
      setText(
        list
          .map((st) => {
            // The school system and the class lists write names differently;
            // the preferred name is often what bridges them ("Yang Fu Yu"
            // there is "Yang Fuyu (Dorcas)" on the class list).
            const who =
              st.preferred &&
              !st.name.toLowerCase().includes(st.preferred.toLowerCase())
                ? `${st.name} (${st.preferred})`
                : st.name;
            return `${who}, ${st.parentEmails.join(", ")}`;
          })
          .join("\n"),
      );
      setFetchNote(
        `Found parent emails for ${list.length} child${list.length === 1 ? "" : "ren"} — check the list below, then save.`,
      );
    } catch {
      setFetchNote("Couldn’t reach the school system.");
    } finally {
      setFetching(false);
    }
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  type Row = {
    line: string;
    email?: string;
    match?: { name: string; year: string; yearKey: string };
    replaces?: string;
    problem?: string;
  };

  const rows: Row[] = lines.map((line) => {
    const found =
      line.match(/[^\s,;<>()"]+@[^\s,;<>()"]+\.[^\s,;<>()"]+/g) ?? [];
    if (!found.length)
      return { line, problem: "no email address on this line" };
    // A child can have two guardians — keep both, comma-separated.
    const email = found.join(", ");
    let name = line;
    for (const e of found) name = name.replace(e, " ");
    name = name.replace(/[,;<>"]/g, " ").trim();
    if (!name) return { line, email, problem: "no name on this line" };
    const hits = students.filter((st) => sameChild(name, "", st.name));
    if (hits.length === 0) {
      // Close but not the same spelling? Say whose row to correct.
      const near = closestName(
        name,
        students.map((st) => st.name),
      );
      return {
        line,
        email,
        problem: near
          ? `“${name}” — did you mean “${near}”? Edit the name above to match, then save.`
          : `no child called “${name}” — add them with 🔄 Sync students first`,
      };
    }
    if (hits.length > 1)
      return { line, email, problem: `“${name}” matches more than one child` };
    const existing = parentEmail(book, hits[0].yearKey, hits[0].name);
    return {
      line,
      email,
      match: hits[0],
      replaces: existing && existing !== email ? existing : undefined,
    };
  });

  const good = rows.filter((r) => r.match && r.email);
  const bad = rows.filter((r) => r.problem);

  function apply() {
    for (const r of good)
      setParentEmail(r.match!.yearKey, r.match!.name, r.email!);
    setSaved(good.length);
    setText("");
  }

  return (
    <div className="mt-3 w-full rounded-2xl bg-white p-4 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
            ✉️ Fill in parent emails
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-zinc-400">
            Fetch them from the school system, or paste your own list — one
            child per line, name and email in any order, two parents allowed.
          </p>
        </div>
        <CloseX onClose={onClose} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => void fetchFromSchool()}
          disabled={fetching}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {fetching
            ? "⏳ Asking the school system…"
            : "🔄 Fetch from the school system"}
        </button>
        {fetchNote && (
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-300">
            {fetchNote}
          </span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(0);
        }}
        rows={6}
        placeholder={
          "Aloysius Cheng, mum.cheng@gmail.com\nAsher Ng  asher.parent@gmail.com\nAustyn Liew Ze Yu\tdad.liew@outlook.com"
        }
        className="mt-3 w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-zinc-700 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {saved > 0 && (
        <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          Saved {saved} parent email{saved === 1 ? "" : "s"} — the ✉️ button is
          ready on those rows.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={apply}
          disabled={!good.length}
          className="rounded-full bg-[#0A4F29] px-5 py-2 text-xs font-bold text-white active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800"
        >
          {good.length
            ? `Save ${good.length} email${good.length === 1 ? "" : "s"}`
            : "Paste your list above"}
        </button>
        <button
          onClick={onClose}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-500 ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800"
        >
          Done
        </button>
      </div>

      {lines.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <div className="text-xs font-extrabold text-zinc-600 dark:text-zinc-200">
              Ready to save · {good.length}
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {good.slice(0, 40).map((r, i) => (
                <div
                  key={i}
                  className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300"
                >
                  <span className="font-extrabold text-zinc-700 dark:text-zinc-100">
                    {r.match!.name}
                  </span>{" "}
                  <span className="text-zinc-400">{r.match!.year}</span> →{" "}
                  {r.email}
                  {r.replaces && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}
                      (replaces {r.replaces})
                    </span>
                  )}
                </div>
              ))}
              {good.length > 40 && (
                <div className="text-[11px] font-bold text-zinc-400">
                  …and {good.length - 40} more
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <div className="text-xs font-extrabold text-zinc-600 dark:text-zinc-200">
              Couldn’t match · {bad.length}
            </div>
            {bad.length === 0 ? (
              <p className="mt-1.5 text-[11px] font-semibold text-zinc-400">
                Every line matched a child.
              </p>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1">
                {bad.slice(0, 40).map((r, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300"
                  >
                    <span className="text-zinc-400">{r.line}</span> —{" "}
                    <span className="text-rose-500">{r.problem}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type SyncState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; diffs: ClassDiff[]; picked: Set<string> }
  | { kind: "done"; added: number };

/** What the school system has that the tracker doesn't, and vice versa. */
function SyncPanel({
  state,
  onToggle,
  onApply,
  onClose,
}: {
  state: SyncState;
  onToggle: (key: string) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const shell =
    "mt-3 w-full rounded-2xl bg-white p-4 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900";

  if (state.kind === "error") {
    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-300">
            {state.message}
          </p>
          <CloseX onClose={onClose} />
        </div>
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {state.added
              ? `Added ${state.added} student${state.added === 1 ? "" : "s"} from the school system.`
              : "Nothing added — the class lists already match."}
          </p>
          <CloseX onClose={onClose} />
        </div>
      </div>
    );
  }

  if (state.kind !== "ready") return null;

  const totalNew = state.diffs.reduce((n, d) => n + d.toAdd.length, 0);
  const picked = state.picked.size;

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-zinc-700 dark:text-zinc-100">
            🔄 Compared with the school system
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-zinc-400">
            Nobody is renamed or removed — only the children you tick are added.
          </p>
        </div>
        <CloseX onClose={onClose} />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {state.diffs.map((d) => (
          <div
            key={d.yearKey}
            className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-100">
                {d.year}
              </span>
              {d.noClass ? (
                <span className="text-[11px] font-bold text-zinc-400">
                  no {d.year} class in the school system — left alone
                </span>
              ) : (
                <span className="text-[11px] font-bold text-zinc-400">
                  {d.matched} matched
                  {d.toAdd.length ? ` · ${d.toAdd.length} new` : ""}
                </span>
              )}
            </div>

            {d.toAdd.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {d.toAdd.map(({ student: s, similar }) => {
                  const key = `${d.yearKey}:${s.name}`;
                  return (
                    <label
                      key={key}
                      className="flex cursor-pointer items-start gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={state.picked.has(key)}
                        onChange={() => onToggle(key)}
                        className="mt-0.5 h-3.5 w-3.5 accent-[#0A4F29]"
                      />
                      <span>
                        {s.name}
                        {s.preferred && s.preferred !== s.name && (
                          <span className="ml-1 font-semibold text-zinc-400">
                            “{s.preferred}”
                          </span>
                        )}
                        {s.pending && (
                          <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            pending
                          </span>
                        )}
                        {similar && (
                          <span className="block font-semibold text-amber-600 dark:text-amber-400">
                            spelled differently here? you have “{similar}” —
                            leave unticked unless they are two children
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {d.onlyHere.length > 0 && (
              <p className="mt-2 text-[11px] font-semibold text-zinc-400">
                Only in the tracker: {d.onlyHere.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onApply}
          disabled={!picked}
          className="rounded-full bg-[#0A4F29] px-5 py-2 text-xs font-bold text-white active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800"
        >
          {picked
            ? `Add ${picked} student${picked === 1 ? "" : "s"}`
            : totalNew
              ? "Tick who to add"
              : "Nothing new to add"}
        </button>
        <button
          onClick={onClose}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-500 ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CloseX({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-zinc-400 hover:text-zinc-600"
    >
      ✕
    </button>
  );
}

/** The most recent report a child has, whichever term it was saved in. */
function latestRecord(
  rows: Partial<Record<TermNo, TrackerRecord>>,
): { rec: TrackerRecord; term: TermNo } | null {
  let best: { rec: TrackerRecord; term: TermNo } | null = null;
  for (const t of TERMS) {
    const rec = rows[t];
    if (!rec) continue;
    if (!best || rec.savedAt > best.rec.savedAt) best = { rec, term: t };
  }
  return best;
}

/** The parent's email, and the ✉️ that sends them the latest report. */
function ParentCell({
  yearKey,
  name,
  book,
  latest,
  manage,
  teacherName,
  teacherEmail,
}: {
  yearKey: string;
  name: string;
  book: ParentBook;
  latest: { rec: TrackerRecord; term: TermNo } | null;
  manage: boolean;
  teacherName?: string;
  teacherEmail?: string;
}) {
  const saved = parentEmail(book, yearKey, name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  function save() {
    const clean = draft.trim();
    if (clean && !looksLikeEmail(clean)) {
      setErr("Check that address");
      return;
    }
    setParentEmail(yearKey, name, clean);
    setErr("");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="email"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(saved);
              setEditing(false);
            }
          }}
          placeholder="parent@email.com"
          className={`w-[170px] rounded-lg border-2 bg-white px-2 py-1.5 text-xs font-bold text-zinc-700 outline-none dark:bg-zinc-800 dark:text-zinc-100 ${
            err
              ? "border-rose-300 focus:border-rose-500"
              : "border-emerald-200 focus:border-emerald-500 dark:border-zinc-700"
          }`}
        />
        <button
          onClick={save}
          className="rounded-lg bg-[#0A4F29] px-2.5 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          Save
        </button>
        {err && (
          <span className="text-[10px] font-bold text-rose-500">{err}</span>
        )}
      </div>
    );
  }

  if (!saved) {
    return (
      <button
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        disabled={manage}
        className="flex h-9 w-full max-w-[190px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-xs font-bold text-zinc-400 transition-colors hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 dark:border-zinc-700"
      >
        ＋ Add parent email
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => {
          setDraft(saved);
          setEditing(true);
        }}
        title={`${saved} — tap to edit`}
        className="min-w-0 max-w-[230px] flex-1 truncate rounded-lg bg-zinc-50 px-2.5 py-1.5 text-left text-xs font-bold text-zinc-600 ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-200"
      >
        {saved}
      </button>
      {manage ? (
        <button
          onClick={() => {
            if (confirm(`Remove the parent email for ${name}?`))
              setParentEmail(yearKey, name, "");
          }}
          aria-label="Remove this parent email"
          className="shrink-0 rounded-lg bg-rose-100 px-2 py-2 text-rose-600 shadow-sm active:scale-90 dark:bg-rose-950/50 dark:text-rose-300"
        >
          🗑️
        </button>
      ) : (
        <>
          <button
            onClick={() => {
              if (latest)
                void emailReport(
                  saved,
                  latest.rec.report,
                  latest.term,
                  teacherName,
                  teacherEmail,
                );
            }}
            disabled={!latest}
            title={
              latest
                ? `Email ${name}'s Term ${latest.term} report to ${saved}`
                : "No report saved yet"
            }
            className="shrink-0 rounded-lg bg-[#0A4F29] px-2.5 py-2 text-xs font-bold text-white shadow-sm active:scale-90 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800"
          >
            ✉️
          </button>
          <button
            onClick={() => {
              if (!latest) return;
              void copyReportLink(latest.rec.report).then((ok) => {
                if (!ok) return;
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              });
            }}
            disabled={!latest}
            title={
              latest
                ? `Copy the link to ${name}'s Term ${latest.term} report`
                : "No report saved yet"
            }
            className="shrink-0 rounded-lg bg-white px-2 py-2 text-xs font-bold text-zinc-500 shadow-sm ring-1 ring-black/5 active:scale-90 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {copied ? "✓" : "🔗"}
          </button>
        </>
      )}
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
            <span
              className={`block text-sm font-extrabold leading-none ${t.text}`}
            >
              {displayLexile(rec.report.lexile)}
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
          {displayLexile(rec.report.lexile)}
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
