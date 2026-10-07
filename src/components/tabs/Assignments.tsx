"use client";

/* Assignments: set online lessons for a class, and see who has done them.

   Pick a class and the children get one class link (or QR code). On it they
   tap their name, then their activity — an interactive HTML lesson, or a link
   to online material — and press Submit when they're done. Here, each
   assignment lists the children it's for with a ✅ beside everyone who has
   submitted; tap a ✅ to see what they did. The list refreshes itself while
   it's open, so ticks appear as children finish. Stored in the cloud, filed
   under the signed-in teacher (lib/assignments.ts). */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { ROSTER } from "@/app/roster";
import { allStudents, useRosterEdits } from "@/lib/rosterStore";
import { publicSiteBase } from "@/lib/reportLink";
import { askToSignIn } from "@/lib/signInNeeded";
import { lessonDoc, LESSON_SANDBOX } from "@/lib/lessonFrame";
import { useTracker } from "@/lib/tracker";
import { latestLexile, lexileLabel } from "@/lib/lexileStats";
import { createPortal } from "react-dom";
import OnlineWorksheet, { type WorksheetResult } from "@/components/OnlineWorksheet";
import { storyFor } from "@/app/assignmentStories";
import type { Tier, WorksheetInput } from "@/lib/worksheet";

type Kind = "html" | "link";
type Item = { id: string; title: string; kind: Kind; url?: string; assignees: string[] | "all"; createdAt: string };
type Done = { at: string; attempts: number; score?: { score: number; total: number } };
type Submission = Done & {
  answers: { label: string; value: string }[];
  text: string;
  images: string[];
  note?: string;
};
type ClassState = {
  yearKey: string;
  code: string;
  names: string[];
  items: Item[];
  done: Record<string, Record<string, Done>>;
  /** Each child's own reading: the story they're on, and today's submission. */
  reading: Record<string, { story: string; done?: Done }>;
};
/** The child's own reading, standing in for an assignment in SubmissionView. */
const READING: Item = { id: "reading", title: "📖 Reading at their level", kind: "html", assignees: "all", createdAt: "" };

const shortDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

async function call(body: unknown) {
  const res = await fetch("/api/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    askToSignIn();
    return { ok: false, error: "Your sign-in has run out — sign in again, then try once more." };
  }
  return res.json();
}

export default function Assignments() {
  const edits = useRosterEdits();
  const [yearKey, setYearKey] = useState(ROSTER[0]?.key ?? "y1");
  const group = ROSTER.find((g) => g.key === yearKey);
  const names = useMemo(
    () => allStudents(edits).filter((s) => s.yearKey === yearKey && !s.locked).map((s) => s.name),
    [edits, yearKey],
  );
  const { store } = useTracker();
  // Each child's level from their latest assessment, so the story they get
  // on the class link is pitched for them. Kept as a string so the class is
  // only re-asked for when a level really changes.
  const levelsJson = useMemo(() => {
    const out: Record<string, number> = {};
    for (const n of names) {
      const lex = latestLexile(store, yearKey, n);
      if (lex !== null) out[n] = lex;
    }
    return JSON.stringify(out);
  }, [store, names, yearKey]);
  const levels = useMemo(() => JSON.parse(levelsJson) as Record<string, number>, [levelsJson]);
  const [cls, setCls] = useState<ClassState | null>(null);
  const [problem, setProblem] = useState<{ yearKey: string; kind: "off" | "error" } | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<{ item: Item; name: string } | null>(null);
  const [preview, setPreview] = useState<Item | null>(null);
  const [doing, setDoing] = useState<string | null>(null);

  // Ask for the class (making its link on first use, and refreshing its names);
  // `apply` puts the answer on screen.
  const fetchClass = useCallback(
    () => call({ op: "class", yearKey, className: group?.year ?? yearKey, names, levels }),
    [yearKey, group?.year, names, levels],
  );
  const apply = useCallback(
    (d: Record<string, unknown>) => {
      if (d.configured === false) return setProblem({ yearKey, kind: "off" });
      if (!d.ok) {
        setError(typeof d.error === "string" ? d.error : "Couldn't load the assignments.");
        return setProblem({ yearKey, kind: "error" });
      }
      setProblem(null);
      setCls({
        yearKey,
        code: d.code as string,
        names: d.names as string[],
        items: d.items as Item[],
        done: d.done as ClassState["done"],
        reading: (d.reading ?? {}) as ClassState["reading"],
      });
    },
    [yearKey],
  );
  const load = useCallback(() => fetchClass().then(apply), [fetchClass, apply]);

  useEffect(() => {
    let alive = true;
    fetchClass().then((d) => alive && apply(d));
    return () => {
      alive = false;
    };
  }, [fetchClass, apply]);

  // What's on screen belongs to the class that's picked, or it's still loading.
  const status =
    problem?.yearKey === yearKey ? problem.kind : cls?.yearKey === yearKey ? "ready" : "loading";

  // Keep the ticks fresh while the page is open and visible.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  const link = cls ? `${publicSiteBase()}/class#${cls.code}` : "";

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <h2 className="text-center text-2xl font-extrabold text-[#0A4F29] dark:text-emerald-300">📮 Assignments</h2>
      <p className="mt-1 max-w-xl text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Tap a child&apos;s name and their assignment opens: a short story at their own reading level, with questions.
        When they press Submit, a ✅ appears beside their name.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {ROSTER.map((g) => (
          <button
            key={g.key}
            onClick={() => setYearKey(g.key)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold transition-all active:scale-95 ${
              g.key === yearKey ? "bg-[#0A4F29] text-white shadow" : "bg-white text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {g.year}
          </button>
        ))}
      </div>

      {status === "loading" && <p className="mt-10 font-bold text-zinc-400">Loading…</p>}
      {status === "off" && (
        <p className="mt-10 max-w-md text-center font-bold text-amber-700">
          Assignments need the site&apos;s cloud storage, which isn&apos;t switched on here. They work on the live site.
        </p>
      )}
      {status === "error" && <p className="mt-10 font-bold text-rose-600">{error}</p>}

      {status === "ready" && cls && (
        <>
          <StudentPicker
            names={cls.names}
            reading={cls.reading}
            levels={levels}
            onPick={setDoing}
            onView={(n) => setViewing({ item: READING, name: n })}
          />

          <details className="mt-10 w-full rounded-[1.6rem] bg-white/60 p-4 dark:bg-zinc-900/60" open={adding || undefined}>
            <summary className="cursor-pointer text-center text-sm font-extrabold text-zinc-500 dark:text-zinc-400">
              🔗 Class link (children on their own devices) · ➕ set your own lesson
            </summary>
          <ClassLinkCard link={link} className={group?.year ?? ""} count={cls.names.length} />

          {adding ? (
            <NewAssignment
              names={cls.names}
              onCancel={() => setAdding(false)}
              onSave={async (body) => {
                const d = await call({ op: "create", yearKey, ...body });
                if (!d.ok) return d.error ?? "Couldn't save it.";
                setAdding(false);
                await load();
                return null;
              }}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-lg font-extrabold text-white shadow active:scale-95"
            >
              ➕ New assignment
            </button>
          )}

          <div className="mt-6 flex w-full flex-col gap-4">
            {cls.items.length === 0 && !adding && (
              <p className="text-center font-semibold text-zinc-400">No lessons of your own for {group?.year} yet.</p>
            )}
            {cls.items.map((it) => {
              const forNames = it.assignees === "all" ? cls.names : cls.names.filter((n) => (it.assignees as string[]).includes(n));
              const done = cls.done[it.id] ?? {};
              const count = forNames.filter((n) => done[n]).length;
              return (
                <div key={it.id} className="rounded-[1.6rem] bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl">{it.kind === "html" ? "🎮" : "🌐"}</span>
                    <span className="flex-1 text-lg font-extrabold text-zinc-800 dark:text-zinc-100">{it.title}</span>
                    <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${count === forNames.length && count > 0 ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                      {count} / {forNames.length} submitted
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-zinc-400">
                    {it.kind === "html" ? "Interactive lesson" : "Link"} · set {shortDate(it.createdAt)} ·{" "}
                    {it.assignees === "all" ? "whole class" : `${forNames.length} children`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {forNames.map((n) =>
                      done[n] ? (
                        <button
                          key={n}
                          onClick={() => setViewing({ item: it, name: n })}
                          title="See what they submitted"
                          className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800 ring-2 ring-emerald-200 hover:bg-emerald-100"
                        >
                          ✅ {n}
                          {done[n].score && (
                            <span className="rounded-full bg-white px-1.5 text-xs">
                              {done[n].score!.score}/{done[n].score!.total}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span key={n} className="rounded-full bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-400 ring-2 ring-zinc-100 dark:bg-zinc-800">
                          ⬜ {n}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {it.kind === "html" ? (
                      <button onClick={() => setPreview(it)} className="rounded-full bg-sky-50 px-3 py-1 font-bold text-sky-700">
                        👀 Preview
                      </button>
                    ) : (
                      <a href={it.url} target="_blank" rel="noreferrer" className="rounded-full bg-sky-50 px-3 py-1 font-bold text-sky-700">
                        ↗ Open link
                      </a>
                    )}
                    <DeleteButton
                      onConfirm={async () => {
                        await call({ op: "delete", id: it.id });
                        await load();
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          </details>
        </>
      )}

      {doing && cls && (
        <ChildAssignment
          name={doing}
          code={cls.code}
          lexile={levels[doing] ?? null}
          onClose={() => {
            setDoing(null);
            void load();
          }}
        />
      )}

      {viewing && (
        <SubmissionView
          yearKey={yearKey}
          item={viewing.item}
          name={viewing.name}
          onClose={() => setViewing(null)}
          onCleared={async () => {
            setViewing(null);
            await load();
          }}
        />
      )}
      {preview && cls && <Preview item={preview} code={cls.code} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** The class's names, straight away. Each opens that child's own
    assignment — a story at their reading level — and gets a ✅ once today's
    is submitted (tap the ✅ to see what they did). */
function StudentPicker({
  names,
  reading,
  levels,
  onPick,
  onView,
}: {
  names: string[];
  reading: ClassState["reading"];
  levels: Record<string, number>;
  onPick: (name: string) => void;
  onView: (name: string) => void;
}) {
  const count = names.filter((n) => reading[n]?.done).length;
  if (!names.length) return <p className="mt-10 font-semibold text-zinc-400">No children on this class list yet.</p>;
  return (
    <div className="mt-6 w-full">
      <p className="text-center text-sm font-extrabold text-zinc-500 dark:text-zinc-400">
        {count} of {names.length} submitted today
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((n) => {
          const r = reading[n];
          const done = !!r?.done;
          const lvl = levels[n] !== undefined ? lexileLabel(levels[n]) : "Not assessed";
          return (
            <div
              key={n}
              className={`flex items-center gap-2 rounded-2xl p-2 pl-4 shadow-sm ring-4 ring-white/70 transition-all ${
                done ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-white dark:bg-zinc-900"
              }`}
            >
              <button onClick={() => onPick(n)} className="min-w-0 flex-1 py-2 text-left active:scale-[.98]">
                <span className="block truncate text-lg font-extrabold text-zinc-800 dark:text-zinc-100">{n}</span>
                <span className="block truncate text-xs font-bold text-zinc-400">
                  📖 {lvl}
                  {r?.story ? ` · ${r.story}` : ""}
                </span>
              </button>
              {done ? (
                <button
                  onClick={() => onView(n)}
                  title="See what they submitted"
                  className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-extrabold text-white active:scale-95"
                >
                  ✅{r!.done!.score ? ` ${r!.done!.score.score}/${r!.done!.score.total}` : ""}
                </button>
              ) : (
                <button
                  onClick={() => onPick(n)}
                  className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800 active:scale-95"
                >
                  ▶ Start
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One child's assignment, full screen: their story at their level and its
    questions. Submit sends it in and shows the big ✅. */
function ChildAssignment({
  name,
  code,
  lexile,
  onClose,
}: {
  name: string;
  code: string;
  lexile: number | null;
  onClose: () => void;
}) {
  const [input, setInput] = useState<WorksheetInput | null | "none">(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/class?code=${encodeURIComponent(code)}&reader=${encodeURIComponent(name)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const r = d.ok ? (d.reading as { storyId: string; levelId: string; tier: Tier }) : null;
        const found = r ? storyFor(r.storyId, r.levelId) : null;
        setInput(
          r && found
            ? { childName: name, year: "", lexile: null, passage: found.passage, level: found.level, missedWords: [], tier: r.tier }
            : "none",
        );
      })
      .catch(() => alive && setInput("none"));
    return () => {
      alive = false;
    };
  }, [code, name]);

  async function send(r: WorksheetResult): Promise<string | null> {
    try {
      const res = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reading: true, name, ...r }),
      });
      const d = await res.json();
      return d.ok ? null : (d.error ?? "That didn't send. Try again.");
    } catch {
      return "That didn't send — check the internet and try again.";
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#D8EEFF] via-[#EEF8FF] to-[#E6F6E0] dark:from-zinc-950 dark:to-zinc-900">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#0A4F29] px-4 py-3 text-white shadow">
        <button onClick={onClose} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold active:scale-95">
          ← Names
        </button>
        <p className="min-w-0 flex-1 truncate text-lg font-extrabold">
          <span className="text-[#F7B917]">{name}</span>&apos;s assignment
          <span className="ml-2 text-sm font-semibold opacity-80">📖 {lexile !== null ? lexileLabel(lexile) : "class level"}</span>
        </p>
      </div>
      {input === null ? (
        <p className="pt-24 text-center text-lg font-bold text-zinc-400">Finding {name}&apos;s story… 📚</p>
      ) : input === "none" ? (
        <p className="pt-24 text-center text-lg font-bold text-rose-600">Couldn&apos;t open {name}&apos;s assignment. Try again.</p>
      ) : (
        <OnlineWorksheet key={input.passage.id} input={input} childName={name} onSubmit={send} />
      )}
    </div>,
    document.body,
  );
}

function ClassLinkCard({ link, className, count }: { link: string; className: string; count: number }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const qr = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(link);
    q.make();
    return q.createDataURL(6, 2);
  }, [link]);
  return (
    <div className="mt-5 w-full rounded-[1.6rem] bg-sky-50 p-4 text-center ring-2 ring-sky-100 dark:bg-sky-950/30">
      <p className="font-extrabold text-sky-900 dark:text-sky-200">
        🔗 {className} class link · {count} children
      </p>
      <p className="text-xs font-semibold text-sky-800/70 dark:text-sky-200/70">
        Children open this (no sign-in), tap their name, and see their activities.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setShow(true);
            }
          }}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-sky-800 shadow-sm active:scale-95"
        >
          {copied ? "✓ Copied" : "Copy link"}
        </button>
        <button onClick={() => setShow((v) => !v)} className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-sky-800 shadow-sm active:scale-95">
          {show ? "Hide QR code" : "Show QR code"}
        </button>
        <a href={link} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-sky-800 shadow-sm active:scale-95">
          ↗ Open as a child
        </a>
      </div>
      {show && (
        <div className="mt-3 flex flex-col items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for the class link" className="h-48 w-48 rounded-xl bg-white" />
          <p className="max-w-full break-all text-[11px] font-semibold text-sky-800/70">{link}</p>
        </div>
      )}
    </div>
  );
}

function NewAssignment({
  names,
  onSave,
  onCancel,
}: {
  names: string[];
  onSave: (body: { title: string; kind: Kind; html?: string; url?: string; assignees: string[] | "all" }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Kind>("html");
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [everyone, setEveryone] = useState(true);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function readFile(f: File | undefined) {
    if (!f) return;
    const text = await f.text();
    setHtml(text);
    setFileName(f.name);
    if (!title.trim()) {
      const t = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
      setTitle(t || f.name.replace(/\.html?$/i, ""));
    }
  }

  return (
    <div className="mt-6 w-full rounded-[1.6rem] bg-white p-5 shadow-md ring-2 ring-emerald-100 dark:bg-zinc-900">
      <h3 className="text-lg font-extrabold text-[#0A4F29] dark:text-emerald-300">New assignment</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Title, e.g. “Phonics: the ai sound”"
        className="mt-3 w-full rounded-2xl border-2 border-zinc-200 px-4 py-2.5 font-bold outline-none focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {(["html", "link"] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold ${kind === k ? "bg-[#0A4F29] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
          >
            {k === "html" ? "🎮 Interactive HTML lesson" : "🌐 Link to online material"}
          </button>
        ))}
      </div>

      {kind === "html" ? (
        <div className="mt-3">
          <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-extrabold text-white active:scale-95">
            📂 Upload an .html file
          </button>
          {fileName && <span className="ml-2 text-sm font-bold text-emerald-700">✓ {fileName}</span>}
          <p className="mt-2 text-xs font-semibold text-zinc-400">…or paste the lesson&apos;s HTML here:</p>
          <textarea
            value={html}
            onChange={(e) => {
              setHtml(e.target.value);
              setFileName("");
            }}
            rows={5}
            placeholder="<!doctype html> …"
            className="mt-1 w-full rounded-2xl border-2 border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      ) : (
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="mt-3 w-full rounded-2xl border-2 border-zinc-200 px-4 py-2.5 font-semibold outline-none focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800"
        />
      )}

      <p className="mt-4 text-sm font-extrabold text-zinc-700 dark:text-zinc-200">Who is it for?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setEveryone(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${everyone ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"}`}
        >
          Whole class
        </button>
        <button
          onClick={() => setEveryone(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${!everyone ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"}`}
        >
          Choose children
        </button>
      </div>
      {!everyone && (
        <div className="mt-2 flex flex-wrap gap-2">
          {names.map((n) => {
            const on = chosen.includes(n);
            return (
              <button
                key={n}
                onClick={() => setChosen((c) => (on ? c.filter((x) => x !== n) : [...c, n]))}
                className={`rounded-full px-3 py-1.5 text-sm font-bold ring-2 ${on ? "bg-emerald-50 text-emerald-800 ring-emerald-300" : "bg-white text-zinc-500 ring-zinc-200 dark:bg-zinc-800"}`}
              >
                {on ? "☑" : "☐"} {n}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={async () => {
            if (!title.trim()) return setError("Give it a title.");
            if (kind === "html" && !html.trim()) return setError("Upload or paste the lesson's HTML.");
            if (kind === "link" && !url.trim()) return setError("Add the link.");
            if (!everyone && chosen.length === 0) return setError("Choose at least one child.");
            setBusy(true);
            setError("");
            const err = await onSave({
              title: title.trim(),
              kind,
              html: kind === "html" ? html : undefined,
              url: kind === "link" ? url.trim() : undefined,
              assignees: everyone ? "all" : chosen,
            });
            setBusy(false);
            if (err) setError(err);
          }}
          className="rounded-full bg-emerald-600 px-6 py-2.5 font-extrabold text-white shadow active:scale-95 disabled:opacity-60"
        >
          {busy ? "Saving…" : "✅ Assign it"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-zinc-100 px-5 py-2.5 font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [sure, setSure] = useState(false);
  return sure ? (
    <span className="flex items-center gap-2">
      <span className="font-bold text-rose-600">Delete it and every submission?</span>
      <button onClick={onConfirm} className="rounded-full bg-rose-600 px-3 py-1 font-bold text-white">
        Yes, delete
      </button>
      <button onClick={() => setSure(false)} className="rounded-full bg-zinc-100 px-3 py-1 font-bold text-zinc-600">
        No
      </button>
    </span>
  ) : (
    <button onClick={() => setSure(true)} className="rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-600">
      🗑️ Delete
    </button>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? "max-w-4xl" : "max-w-2xl"} rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900`}
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-zinc-100 font-bold text-zinc-500 dark:bg-zinc-800">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function SubmissionView({
  yearKey,
  item,
  name,
  onClose,
  onCleared,
}: {
  yearKey: string;
  item: Item;
  name: string;
  onClose: () => void;
  onCleared: () => void;
}) {
  const [sub, setSub] = useState<Submission | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const q = item === READING ? `reading=${encodeURIComponent(yearKey)}` : `id=${item.id}`;
    fetch(`/api/assign?${q}&name=${encodeURIComponent(name)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setSub(d.ok ? d.submission : null))
      .catch(() => alive && setSub(null));
    return () => {
      alive = false;
    };
  }, [item, name, yearKey]);

  return (
    <Modal onClose={onClose}>
      <p className="text-xs font-extrabold uppercase tracking-wide text-zinc-400">Submission</p>
      <h3 className="mt-1 text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">{name}</h3>
      <p className="font-semibold text-zinc-500">{item.title}</p>
      {sub === undefined && <p className="mt-6 font-bold text-zinc-400">Loading…</p>}
      {sub === null && <p className="mt-6 font-bold text-zinc-500">Nothing found — it may have been cleared.</p>}
      {sub && (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">✅ {shortDate(sub.at)}</span>
            {sub.score && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-800">
                Score {sub.score.score} / {sub.score.total}
              </span>
            )}
            {sub.attempts > 1 && <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-600">Submitted {sub.attempts} times</span>}
          </div>
          {sub.note && (
            <div className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-semibold text-sky-900">
              <b>Their note:</b> {sub.note}
            </div>
          )}
          {sub.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {sub.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${name}'s drawing`} className="max-h-60 rounded-xl ring-2 ring-zinc-100" />
              ))}
            </div>
          )}
          {sub.answers.length > 0 ? (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-zinc-400">
                  <th className="py-1 pr-3">Question</th>
                  <th className="py-1">Their answer</th>
                </tr>
              </thead>
              <tbody>
                {sub.answers.map((a, i) => (
                  <tr key={i} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                    <td className="py-1.5 pr-3 text-zinc-500">{a.label}</td>
                    <td className="py-1.5 font-bold text-zinc-800 dark:text-zinc-100">{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            item.kind === "html" && <p className="mt-4 text-sm font-semibold text-zinc-400">No typed or chosen answers were found in this lesson.</p>
          )}
          {sub.text && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-bold text-zinc-500">What their screen showed when they submitted</summary>
              <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{sub.text}</p>
            </details>
          )}
          <button
            onClick={async () => {
              await call(item === READING ? { op: "clearReading", yearKey, name } : { op: "clear", id: item.id, name });
              onCleared();
            }}
            className="mt-5 rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            🔁 Let {name} do it again (clears this)
          </button>
        </>
      )}
    </Modal>
  );
}

function Preview({ item, code, onClose }: { item: Item; code: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/class?code=${code}&id=${item.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setHtml(d.ok ? (d.html ?? "") : ""));
    return () => {
      alive = false;
    };
  }, [code, item.id]);
  return (
    <Modal onClose={onClose} wide>
      <h3 className="pr-10 text-xl font-extrabold text-zinc-800 dark:text-zinc-100">👀 {item.title}</h3>
      <p className="text-sm font-semibold text-zinc-400">What children see. Answers here aren&apos;t saved.</p>
      {html === null ? (
        <p className="mt-6 font-bold text-zinc-400">Loading…</p>
      ) : (
        <iframe title={item.title} sandbox={LESSON_SANDBOX} srcDoc={lessonDoc(html)} className="mt-3 h-[70vh] w-full rounded-2xl border-2 border-zinc-100 bg-white" />
      )}
    </Modal>
  );
}
