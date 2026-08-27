"use client";

/* Class Tracker — a per-term reading-level record for every student, Year 1-6.

   Reads the saved assessments from tracker.ts (localStorage on this device).
   Each row is a child; the three columns are Term 1-3. A filled cell shows the
   reading level and opens / downloads that saved report; an empty cell starts a
   fresh assessment for that child and term. */

import { useEffect, useState } from "react";
import { ROSTER, studentKey } from "@/app/roster";
import {
  useTracker,
  deleteRecord,
  totalSaved,
  type TermNo,
  type TrackerRecord,
  type TrackerStore,
} from "@/lib/tracker";
import { openReport } from "@/lib/reportPrint";

const TERMS: TermNo[] = [1, 2, 3];

// Passcode lock — only the hash of the code is stored, never the digits.
const UNLOCK_KEY = "phonics.tracker.unlock.v1";
const PASS_HASH =
  "8b42d912a9d46626e3dc9895a15ce1ff70456abc7167d6498c45921336625816";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

/** Pull any records whose key is not a Year 1-6 student (typed-in "Other"). */
function otherStudents(store: TrackerStore): { name: string; key: string }[] {
  const rosterKeys = new Set(
    ROSTER.flatMap((g) => g.students.map((n) => studentKey(g.key, n))),
  );
  const out: { name: string; key: string }[] = [];
  for (const key of Object.keys(store)) {
    if (rosterKeys.has(key)) continue;
    const anyTerm = Object.values(store[key])[0] as TrackerRecord | undefined;
    if (anyTerm) out.push({ name: anyTerm.student, key });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export default function ClassTracker({
  onAssess,
}: {
  onAssess: (init: { name: string; term: TermNo }) => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    setUnlocked(
      typeof window !== "undefined" &&
        window.localStorage.getItem(UNLOCK_KEY) === "1",
    );
  }, []);

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <TrackerBoard
      onAssess={onAssess}
      onLock={() => {
        if (typeof window !== "undefined")
          window.localStorage.removeItem(UNLOCK_KEY);
        setUnlocked(false);
      }}
    />
  );
}

/** Passcode screen shown until the correct code is entered on this device. */
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  async function submit() {
    if ((await sha256Hex(code.trim())) === PASS_HASH) {
      if (typeof window !== "undefined")
        window.localStorage.setItem(UNLOCK_KEY, "1");
      onUnlock();
    } else {
      setErr(true);
      setCode("");
    }
  }

  return (
    <div className="flex w-full max-w-md flex-1 flex-col items-center">
      <div className="mt-8 w-full rounded-[2rem] bg-gradient-to-br from-[#0A4F29] to-[#0d6b39] px-6 py-9 text-center text-white shadow-lg ring-4 ring-white/60">
        <div className="text-6xl">🔒</div>
        <h2 className="mt-2 text-2xl font-extrabold">Class Tracker is locked</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm font-semibold text-white/85">
          Enter the passcode to open the reading tracker.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setErr(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="••••••"
          className="mx-auto mt-5 block w-full max-w-[220px] rounded-2xl border-4 border-white/30 bg-white/95 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-zinc-800 outline-none focus:border-[#F7B917]"
        />
        {err && (
          <p className="mt-2 text-sm font-bold text-[#FFD75E]">
            Wrong passcode — try again.
          </p>
        )}
        <button
          onClick={() => void submit()}
          className="mx-auto mt-5 block rounded-full bg-[#F7B917] px-10 py-3 text-lg font-extrabold text-[#3a2b00] shadow-lg active:scale-95"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function TrackerBoard({
  onAssess,
  onLock,
}: {
  onAssess: (init: { name: string; term: TermNo }) => void;
  onLock: () => void;
}) {
  const { store, cloud } = useTracker();
  const others = otherStudents(store);
  const groups = [
    ...ROSTER,
    ...(others.length
      ? [{ year: "Other", key: "other", students: others.map((o) => o.name) }]
      : []),
  ];
  const [yearKey, setYearKey] = useState(groups[0]?.key ?? "y1");
  const [manage, setManage] = useState(false);
  const group = groups.find((g) => g.key === yearKey) ?? groups[0];

  const rowsFor = (name: string) => store[studentKey(group.key, name)] ?? {};

  // Per-term "how many assessed" for the selected class.
  const doneByTerm = TERMS.map(
    (t) => group.students.filter((n) => rowsFor(n)[t]).length,
  );

  function exportCsv() {
    const head = [
      "Student",
      ...TERMS.flatMap((t) => [`Term ${t} Level`, `Term ${t} Lexile`, `Term ${t} Score`]),
    ];
    const lines = [head.join(",")];
    for (const name of group.students) {
      const r = rowsFor(name);
      const cells = [csv(name)];
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

      {/* Year selector */}
      <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
        {groups.map((g) => {
          const n = g.students.filter((name) =>
            Object.keys(store[studentKey(g.key, name)] ?? {}).length,
          ).length;
          const active = g.key === yearKey;
          return (
            <button
              key={g.key}
              onClick={() => setYearKey(g.key)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all active:scale-95 ${
                active
                  ? "bg-[#0A4F29] text-white shadow"
                  : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {g.year}
              <span className={`ml-1.5 text-xs ${active ? "text-white/70" : "text-zinc-400"}`}>
                {n}/{g.students.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Per-term summary + export */}
      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TERMS.map((t, i) => (
            <span
              key={t}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50"
            >
              Term {t}: {doneByTerm[i]}/{group.students.length}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLock}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
          >
            🔒 Lock
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
      {manage && (
        <p className="mt-2 w-full text-center text-xs font-semibold text-rose-500">
          Manage mode — tap 🗑️ on a saved cell to delete that report.
        </p>
      )}

      {/* Tracker grid */}
      <div className="mt-3 w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] border-collapse text-left">
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
            {group.students.map((name, i) => {
              const r = rowsFor(name);
              return (
                <tr
                  key={name}
                  className={
                    i % 2
                      ? "bg-zinc-50/60 dark:bg-zinc-800/40"
                      : "bg-transparent"
                  }
                >
                  <td className="px-4 py-2.5 align-middle">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-100">
                      {name}
                    </span>
                  </td>
                  {TERMS.map((t) => (
                    <td key={t} className="px-3 py-2.5 text-center align-middle">
                      <Cell
                        rec={r[t]}
                        manage={manage}
                        onOpen={(rec) => openReport(rec.report)}
                        onDelete={() => {
                          if (confirm(`Delete ${name}'s Term ${t} report?`))
                            deleteRecord(group.key, name, t);
                        }}
                        onAssess={() => onAssess({ name, term: t })}
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

/** One term cell: a saved level chip, or an “assess” prompt. */
function Cell({
  rec,
  manage,
  onOpen,
  onDelete,
  onAssess,
}: {
  rec: TrackerRecord | undefined;
  manage: boolean;
  onOpen: (rec: TrackerRecord) => void;
  onDelete: () => void;
  onAssess: () => void;
}) {
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
