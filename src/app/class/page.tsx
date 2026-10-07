"use client";

/* The page a class opens from its class link. A child taps their name and
   their own reading opens straight away: a short story at their reading
   level with its questions (the online worksheet), and a Submit button that
   ticks it off. Any activities the teacher set are listed after it. No
   sign-in — the code in the link is the permission (lib/assignments.ts). A
   name gets a ✅ once today's story and every activity set for it are in. */

import { useCallback, useEffect, useRef, useState } from "react";
import { collectFrom, lessonDoc, LESSON_SANDBOX } from "@/lib/lessonFrame";
import OnlineWorksheet, { type WorksheetResult } from "@/components/OnlineWorksheet";
import { storyFor } from "@/app/assignmentStories";
import type { Tier, WorksheetInput } from "@/lib/worksheet";

type Item = { id: string; title: string; kind: "html" | "link"; for: string[] };
type ClassData = { className: string; names: string[]; items: Item[]; done: Record<string, string[]>; read: string[] };
type Reading = { input: WorksheetInput; done: boolean };
type Open = { item: Item; html?: string; url?: string };

const key = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim();

export default function ClassPage() {
  const [code, setCode] = useState<string | null>(null);
  const [data, setData] = useState<ClassData | null>(null);
  const [error, setError] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [stage, setStage] = useState<"doing" | "confirm" | "sending" | "sent">("doing");
  const [note, setNote] = useState("");
  const [reading, setReading] = useState<Reading | "loading" | "none" | null>(null);
  const [onStory, setOnStory] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  const load = useCallback(async (c: string) => {
    try {
      const res = await fetch(`/api/class?code=${encodeURIComponent(c)}`, { cache: "no-store" });
      const d = await res.json();
      if (!d.ok) {
        setError(d.configured === false ? "Assignments aren't switched on for this site yet." : d.error ?? "This class link doesn't work.");
        return;
      }
      setData(d);
    } catch {
      setError("Couldn't reach the school. Check the internet and try again.");
    }
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      // The code is the first 12 characters after the #. Links shared in chat
      // apps sometimes pick up text stuck to the end ("…#icj4fv7yfy8yLikeComment"),
      // so read just the code and tidy the address bar.
      const c = /^#?\s*([a-z2-9]{12})/.exec(window.location.hash)?.[1] ?? "";
      setCode(c);
      if (c) {
        if (window.location.hash !== `#${c}`) history.replaceState(null, "", `#${c}`);
        void load(c);
      } else setError("This class link isn't complete. Ask your teacher for it again.");
    });
    return () => cancelAnimationFrame(frameId);
  }, [load]);

  const mine = (name: string) => (data?.items ?? []).filter((it) => it.for.some((n) => key(n) === key(name)));
  const isDone = (id: string, name: string) => (data?.done[id] ?? []).some((n) => key(n) === key(name));
  const hasRead = (name: string) => (data?.read ?? []).some((n) => key(n) === key(name));
  const allDone = (name: string) => hasRead(name) && mine(name).every((it) => isDone(it.id, name));

  /* Tap a name: their story at their level opens at once — unless today's
     is already in, then their list, with it ticked. */
  async function pick(name: string) {
    setMe(name);
    setReading("loading");
    setOnStory(true);
    try {
      const res = await fetch(`/api/class?code=${encodeURIComponent(code!)}&reader=${encodeURIComponent(name)}`, { cache: "no-store" });
      const d = await res.json();
      const r = d.ok ? (d.reading as { storyId: string; levelId: string; tier: Tier; done: boolean }) : null;
      const found = r ? storyFor(r.storyId, r.levelId) : null;
      if (!r || !found) {
        setReading("none");
        setOnStory(false);
        return;
      }
      setReading({
        input: { childName: name, year: "", lexile: null, passage: found.passage, level: found.level, missedWords: [], tier: r.tier },
        done: r.done,
      });
      setOnStory(!r.done);
    } catch {
      setReading("none");
      setOnStory(false);
    }
  }

  async function sendReading(r: WorksheetResult): Promise<string | null> {
    if (!me || !code) return "Something went wrong.";
    try {
      const res = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reading: true, name: me, ...r }),
      });
      const d = await res.json();
      if (!d.ok) return d.error ?? "That didn't send. Try again.";
      setReading((cur) => (cur && typeof cur === "object" ? { ...cur, done: true } : cur));
      void load(code);
      return null;
    } catch {
      return "That didn't send — check the internet and try again.";
    }
  }

  async function start(item: Item) {
    setStage("doing");
    setNote("");
    const res = await fetch(`/api/class?code=${encodeURIComponent(code!)}&id=${item.id}`, { cache: "no-store" });
    const d = await res.json();
    if (!d.ok) return setError(d.error ?? "Couldn't open that activity.");
    setOpen({ item, html: d.html, url: d.item.url });
  }

  async function send() {
    if (!open || !me || !code) return;
    setStage("sending");
    const got = open.html && frame.current ? await collectFrom(frame.current) : { answers: [], text: "", score: null, images: [] };
    try {
      const res = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, id: open.item.id, name: me, ...got, note }),
      });
      const d = await res.json();
      if (!d.ok) {
        setStage("confirm");
        return setError(d.error ?? "That didn't send. Try again.");
      }
      setError("");
      setStage("sent");
      void load(code);
    } catch {
      setStage("confirm");
      setError("That didn't send — check the internet and try again.");
    }
  }

  const shell = "min-h-dvh bg-gradient-to-b from-[#D8EEFF] via-[#EEF8FF] to-[#E6F6E0] px-4 pb-10 pt-6";

  if (error && !data) {
    return (
      <main className={shell}>
        <div className="mx-auto max-w-md pt-20 text-center">
          <div className="text-6xl">🔎</div>
          <p className="mt-3 text-xl font-extrabold text-zinc-700">{error}</p>
        </div>
      </main>
    );
  }
  if (!data) {
    return (
      <main className={shell}>
        <p className="pt-24 text-center text-lg font-bold text-zinc-400">One moment…</p>
      </main>
    );
  }

  /* ---- doing an activity ---- */
  if (open && me) {
    return (
      <main className="flex h-dvh flex-col bg-[#EEF8FF]">
        <div className="flex items-center gap-3 bg-[#0A4F29] px-4 py-3 text-white">
          <button
            onClick={() => setOpen(null)}
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold active:scale-95"
          >
            ← Back
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-[#F7B917]">{open.item.title}</p>
            <p className="text-xs font-semibold opacity-80">{me}</p>
          </div>
        </div>

        {stage === "sent" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-7xl">✅</div>
            <p className="text-3xl font-extrabold text-[#0A4F29]">Submitted!</p>
            <p className="font-semibold text-zinc-500">Well done, {me}. Your teacher can see your work now.</p>
            <button
              onClick={() => setOpen(null)}
              className="mt-2 rounded-full bg-[#0A4F29] px-6 py-3 text-lg font-extrabold text-white active:scale-95"
            >
              Back to my activities
            </button>
          </div>
        ) : open.html !== undefined ? (
          <iframe
            ref={frame}
            title={open.item.title}
            sandbox={LESSON_SANDBOX}
            srcDoc={lessonDoc(open.html)}
            className="w-full flex-1 border-0 bg-white"
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="text-6xl">🌐</div>
            <p className="max-w-md text-lg font-bold text-zinc-600">Your activity opens in a new tab. Come back here when you&apos;ve finished.</p>
            <a
              href={open.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-sky-600 px-6 py-3 text-lg font-extrabold text-white shadow active:scale-95"
            >
              Open the activity ↗
            </a>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What did you do? (your score, or what you learned)"
              className="w-full max-w-md rounded-2xl border-4 border-sky-200 px-4 py-3 text-base font-semibold outline-none focus:border-sky-400"
            />
          </div>
        )}

        {stage !== "sent" && (
          <div className="border-t-4 border-emerald-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3">
            {error && <p className="mb-2 text-center text-sm font-bold text-rose-600">{error}</p>}
            {stage === "doing" ? (
              <button
                onClick={() => setStage("confirm")}
                className="w-full rounded-full bg-gradient-to-r from-[#0A4F29] to-[#668C4A] py-4 text-xl font-extrabold text-white shadow-lg active:scale-[.98]"
              >
                ✅ I&apos;m finished — Submit
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg font-extrabold text-zinc-700">Are you finished? Your teacher will see your work.</p>
                <div className="flex gap-3">
                  <button
                    disabled={stage === "sending"}
                    onClick={send}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-lg font-extrabold text-white shadow active:scale-95 disabled:opacity-60"
                  >
                    {stage === "sending" ? "Sending…" : "Yes, submit"}
                  </button>
                  <button
                    disabled={stage === "sending"}
                    onClick={() => setStage("doing")}
                    className="rounded-full bg-zinc-100 px-6 py-3 text-lg font-extrabold text-zinc-700 active:scale-95"
                  >
                    Not yet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    );
  }

  /* ---- their story at their level ---- */
  if (me && onStory) {
    const others = mine(me).filter((it) => !isDone(it.id, me)).length;
    return (
      <main className="min-h-dvh bg-gradient-to-b from-[#D8EEFF] via-[#EEF8FF] to-[#E6F6E0]">
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-[#0A4F29] px-4 py-3 text-white shadow">
          <button
            onClick={() => {
              setMe(null);
              setReading(null);
              setOnStory(false);
            }}
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold active:scale-95"
          >
            ← Not me
          </button>
          <p className="min-w-0 flex-1 truncate text-lg font-extrabold">
            Hi, <span className="text-[#F7B917]">{me}</span>! 📖 Your story
          </p>
          {mine(me).length > 0 && (
            <button onClick={() => setOnStory(false)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold active:scale-95">
              My activities{others ? ` (${others})` : ""} →
            </button>
          )}
        </div>
        {reading === "loading" || reading === null ? (
          <p className="pt-24 text-center text-lg font-bold text-zinc-400">Finding your story… 📚</p>
        ) : reading === "none" ? null : (
          <OnlineWorksheet key={reading.input.passage.id} input={reading.input} childName={me} onSubmit={sendReading} />
        )}
      </main>
    );
  }

  /* ---- a child's activities ---- */
  if (me) {
    const list = mine(me);
    const story = reading && typeof reading === "object" ? reading : null;
    return (
      <main className={shell}>
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => {
              setMe(null);
              setReading(null);
            }}
            className="rounded-full bg-white px-4 py-2 font-bold text-zinc-600 shadow-sm active:scale-95"
          >
            ← Not me
          </button>
          <h1 className="mt-4 text-center text-3xl font-extrabold text-[#0A4F29]">Hi, {me}! 👋</h1>
          <p className="text-center font-semibold text-zinc-500">
            {list.length || story ? "Tap an activity to start." : "You have no activities right now. 🎉"}
          </p>
          <div className="mt-6 grid gap-4">
            {story && (
              <button
                onClick={() => setOnStory(true)}
                className={`flex items-center gap-4 rounded-[1.8rem] p-5 text-left shadow-md ring-4 ring-white/70 transition-all active:scale-[.98] ${
                  story.done ? "bg-emerald-50" : "bg-white hover:-translate-y-0.5"
                }`}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber-100 text-3xl">{story.input.passage.emoji}</span>
                <span className="flex-1">
                  <span className="block text-xl font-extrabold text-zinc-800">{story.input.passage.title}</span>
                  <span className="text-sm font-bold text-zinc-500">📖 Today&apos;s story — just right for you</span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                    story.done ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {story.done ? "✅ Done" : "▶ Start"}
                </span>
              </button>
            )}
            {list.map((it) => {
              const done = isDone(it.id, me);
              return (
                <button
                  key={it.id}
                  onClick={() => start(it)}
                  className={`flex items-center gap-4 rounded-[1.8rem] p-5 text-left shadow-md ring-4 ring-white/70 transition-all active:scale-[.98] ${
                    done ? "bg-emerald-50" : "bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sky-100 text-3xl">
                    {it.kind === "html" ? "🎮" : "🌐"}
                  </span>
                  <span className="flex-1 text-xl font-extrabold text-zinc-800">{it.title}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                      done ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {done ? "✅ Done" : "▶ Start"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  /* ---- choose your name ---- */
  return (
    <main className={shell}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-extrabold text-[#0A4F29]">{data.className} · Activities</h1>
        <p className="mt-1 text-center text-lg font-semibold text-zinc-500">Tap your name 👇</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.names.map((n) => {
            const count = mine(n).filter((it) => !isDone(it.id, n)).length + (hasRead(n) ? 0 : 1);
            const finished = allDone(n);
            return (
              <button
                key={n}
                onClick={() => pick(n)}
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-left text-lg font-extrabold shadow-sm ring-4 ring-white/70 transition-all active:scale-[.98] ${
                  finished ? "bg-emerald-50 text-emerald-900" : "bg-white text-zinc-800 hover:-translate-y-0.5"
                }`}
              >
                <span className="flex-1">{n}</span>
                {finished ? (
                  <span className="text-2xl" aria-label="All submitted">✅</span>
                ) : count > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm text-amber-800">{count} to do</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
