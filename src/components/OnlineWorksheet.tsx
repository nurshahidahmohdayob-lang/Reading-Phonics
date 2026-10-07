"use client";

/* The worksheet, done on a device: the same questions as the printed sheet
   (built by lib/worksheet.ts), each one tappable or typeable, every question
   read aloud on request, and marked the moment the child checks it.

   Paper-only tasks become their nearest on-screen version: "trace it" becomes
   "copy the word", "draw" gets a drawing pad, and Level 3's written answer is
   chosen from the story question's options, with room to write it out too.
   Writing and drawing aren't marked — the child shows their teacher. */

import { useMemo, useRef, useState } from "react";
import { buildWorksheet, type Section, type WorksheetInput } from "@/lib/worksheet";
import { speak } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";
import { lexileLabel } from "@/lib/lexileStats";
import StoryBook from "@/components/StoryBook";

type Answer = number | string | number[] | null;

/** Every marked question, with what counts as right, and how to say what
    the child chose — for the teacher, when the worksheet is submitted. */
type Item = { key: string; label: string; right: (a: Answer) => boolean; show: (a: Answer) => string };

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[^a-z']/g, "");
const asText = (a: Answer) => (a === null || a === undefined || a === "" ? "—" : String(a));

function itemsFor(sections: Section[]): Item[] {
  const items: Item[] = [];
  sections.forEach((s, i) => {
    switch (s.kind) {
      case "tick":
        items.push({ key: `${i}`, label: s.question, right: (a) => a === s.answer, show: (a) => (typeof a === "number" ? s.options[a]?.label ?? "—" : "—") });
        break;
      case "circle":
        s.rows.forEach((r, k) =>
          items.push({ key: `${i}.${k}`, label: `Find the word “${r.word}”`, right: (a) => norm(a) === norm(r.word), show: asText }),
        );
        break;
      case "matchpic":
        s.words.forEach((w, k) =>
          items.push({
            key: `${i}.${k}`,
            label: `Picture for “${w}”`,
            right: (a) => a === s.pics.findIndex((p) => p.word === w),
            show: (a) => (typeof a === "number" ? `${s.pics[a]?.emoji ?? ""} ${s.pics[a]?.word ?? ""}`.trim() : "—"),
          }),
        );
        break;
      case "trace":
        s.words.forEach((t, k) =>
          items.push({ key: `${i}.${k}`, label: `Copy “${t.word}”`, right: (a) => norm(a) === norm(t.word), show: asText }),
        );
        break;
      case "yesno":
        s.items.forEach((y, k) =>
          items.push({ key: `${i}.${k}`, label: y.text, right: (a) => a === (y.yes ? 0 : 1), show: (a) => (a === 0 ? "Yes" : a === 1 ? "No" : "—") }),
        );
        break;
      case "fill":
        s.items.forEach((b, k) =>
          items.push({ key: `${i}.${k}`, label: `${b.before} ___ ${b.after}`, right: (a) => norm(a) === norm(b.answer), show: asText }),
        );
        break;
      case "choose":
        s.items.forEach((c, k) =>
          items.push({ key: `${i}.${k}`, label: `${c.before} (${c.options.join(" / ")}) ${c.after}`, right: (a) => norm(a) === norm(c.answer), show: asText }),
        );
        break;
      case "order":
        items.push({
          key: `${i}`,
          label: "Put the sentences in order",
          right: (a) => Array.isArray(a) && a.length === s.items.length && a.every((idx, n) => s.items[idx]?.answer === n + 1),
          show: (a) => (Array.isArray(a) && a.length ? a.map((idx) => s.items[idx]?.text ?? "?").join(" → ") : "—"),
        });
        break;
      case "written":
        items.push({ key: `${i}`, label: s.question, right: (a) => a === s.answerIndex, show: (a) => (typeof a === "number" ? s.options[a]?.label ?? "—" : "—") });
        break;
      case "meanings":
        s.words.forEach((w, k) =>
          items.push({
            key: `${i}.${k}`,
            label: `Meaning of “${w}”`,
            right: (a) => a === s.meanings.find((m) => m.word === w)?.letter,
            show: (a) => s.meanings.find((m) => m.letter === a)?.text ?? "—",
          }),
        );
        break;
      case "hunt":
        s.items.forEach((h, k) =>
          items.push({ key: `${i}.${k}`, label: `A word that means “${h.meaning}”`, right: (a) => norm(a) === norm(h.answer), show: asText }),
        );
        break;
    }
  });
  return items;
}

const CARD = "rounded-[1.6rem] bg-white p-5 shadow-md ring-4 ring-white/70 dark:bg-zinc-900";
const OPT =
  "rounded-2xl border-4 px-4 py-2.5 text-lg font-extrabold transition-all active:scale-95 disabled:cursor-default";

/** What a submitted worksheet sends: the score, each answer, and any
    writing and drawing. */
export type WorksheetResult = {
  score: { score: number; total: number };
  answers: { label: string; value: string }[];
  text: string;
  images: string[];
};

export default function OnlineWorksheet({
  input,
  childName,
  onSubmit,
}: {
  input: WorksheetInput;
  /** Who is doing it, when known — the name box is then left out. */
  childName?: string;
  /** Hand in the work: the check button becomes Submit, and once it's in a
      big ✅ says so. Resolves with an error to show, or null if it went. */
  onSubmit?: (r: WorksheetResult) => Promise<string | null>;
}) {
  const ws = useMemo(() => buildWorksheet(input), [input]);
  const items = useMemo(() => itemsFor(ws.sections), [ws]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState(childName ?? "");
  const [sending, setSending] = useState<"no" | "sending" | "sent">("no");
  const [sendError, setSendError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const { passage } = input;

  const set = (key: string, a: Answer) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [key]: a }));
  };
  const result = (key: string) => (checked ? items.find((it) => it.key === key)?.right(answers[key] ?? null) : undefined);
  const score = items.filter((it) => it.right(answers[it.key] ?? null)).length;

  function optClass(selected: boolean, key: string, isRight: boolean) {
    if (checked) {
      if (isRight) return `${OPT} border-emerald-400 bg-emerald-50 text-emerald-800`;
      if (selected) return `${OPT} border-rose-400 bg-rose-50 text-rose-700`;
      return `${OPT} border-zinc-100 bg-white text-zinc-400`;
    }
    return selected
      ? `${OPT} border-sky-500 bg-sky-50 text-sky-800 scale-105`
      : `${OPT} border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:border-sky-300`;
  }

  function Title({ n, title, say, keys }: { n: number; title: string; say: string; keys?: string[] }) {
    const marks = checked && keys?.length ? keys.map(result) : [];
    const allRight = marks.length > 0 && marks.every(Boolean);
    return (
      <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold text-[#0A4F29] dark:text-emerald-300">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#668C4A] text-base text-white">{n}</span>
        <span>{title}</span>
        <button
          onClick={() => speak(`${title}. ${say}`, 0.9)}
          className="rounded-full bg-sky-100 px-3 py-1 text-base active:scale-95"
          aria-label="Read the question aloud"
        >
          🔊
        </button>
        {marks.length > 0 && (
          <span className={`ml-auto rounded-full px-3 py-1 text-sm ${allRight ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
            {allRight ? "⭐ All right!" : `${marks.filter(Boolean).length} of ${marks.length} right`}
          </span>
        )}
        <span className="w-full text-sm font-semibold text-zinc-500 dark:text-zinc-400">{say}</span>
      </h2>
    );
  }

  /** The writing boxes and drawing pads aren't marked, but the teacher
      should see them — read them straight off the page. */
  function handIn(): WorksheetResult {
    const given = items.map((it) => {
      const a = answers[it.key] ?? null;
      return { label: it.label, value: `${it.right(a) ? "✅" : "❌"} ${it.show(a)}` };
    });
    const root = sheet.current;
    root?.querySelectorAll("textarea").forEach((t) => {
      const v = t.value.trim();
      if (v) given.push({ label: t.closest("section")?.querySelector("h2 span:nth-child(2)")?.textContent ?? "Writing", value: v });
    });
    const images: string[] = [];
    root?.querySelectorAll("canvas").forEach((c) => {
      if (images.length >= 2) return;
      const k = Math.min(1, 480 / Math.max(c.width, c.height));
      const o = document.createElement("canvas");
      o.width = Math.round(c.width * k);
      o.height = Math.round(c.height * k);
      const x = o.getContext("2d");
      if (!x) return;
      x.fillStyle = "#fff";
      x.fillRect(0, 0, o.width, o.height);
      x.drawImage(c, 0, 0, o.width, o.height);
      const d = x.getImageData(0, 0, o.width, o.height).data;
      let ink = 0;
      for (let i = 0; i < d.length; i += 40) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) ink++;
      if (ink > 20) images.push(o.toDataURL("image/jpeg", 0.7));
    });
    return { score: { score, total: items.length }, answers: given, text: `${passage.title}\n\n${passage.text}`.slice(0, 8000), images };
  }

  async function check() {
    setChecked(true);
    const right = items.filter((it) => it.right(answers[it.key] ?? null)).length;
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    if (!onSubmit) {
      speak(`${right} out of ${items.length}!`, 0.9);
      return;
    }
    setSending("sending");
    setSendError("");
    const err = await onSubmit(handIn());
    if (err) {
      setSending("no");
      setSendError(err);
      return;
    }
    setSending("sent");
    speak(`Submitted! ${right} out of ${items.length}!`, 0.9);
  }

  let n = 0;
  const blocks = ws.sections.map((s, i) => {
    const k = (j?: number | string) => (j === undefined ? `${i}` : `${i}.${j}`);
    switch (s.kind) {
      case "read":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Read the story" say="Read it out loud. Tap a word to hear it." />
            <StoryBook passage={passage} level={input.level} />
          </section>
        );
      case "tick":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title={s.question} say="Tap the right answer." keys={[k()]} />
            <div className="mt-3 flex flex-wrap gap-3">
              {s.options.map((o, j) => (
                <button key={j} disabled={checked} onClick={() => set(k(), j)} className={optClass(answers[k()] === j, k(), j === s.answer)}>
                  <span className="mr-1 text-3xl">{o.emoji}</span> {o.label}
                </button>
              ))}
            </div>
          </section>
        );
      case "circle":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Find the word" say="Look at the word. Tap the same word in its row." keys={s.rows.map((_, j) => k(j))} />
            {s.rows.map((r, j) => (
              <div key={j} className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => sayWord(r.word)} className="min-w-28 rounded-2xl bg-amber-100 px-4 py-2 text-xl font-extrabold text-amber-900">
                  {r.emoji} {r.word}
                </button>
                <span className="text-zinc-300">→</span>
                {r.row.map((w, m) => (
                  <button key={m} disabled={checked} onClick={() => set(k(j), w)} className={optClass(answers[k(j)] === w, k(j), norm(w) === norm(r.word))}>
                    {w}
                  </button>
                ))}
              </div>
            ))}
          </section>
        );
      case "matchpic":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Match the word to its picture" say="Tap the right picture for each word." keys={s.words.map((_, j) => k(j))} />
            {s.words.map((w, j) => (
              <div key={j} className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => sayWord(w)} className="min-w-24 text-left text-2xl font-extrabold text-zinc-800 dark:text-zinc-100">
                  {w}
                </button>
                {s.pics.map((p, m) => (
                  <button key={m} disabled={checked} onClick={() => set(k(j), m)} className={optClass(answers[k(j)] === m, k(j), p.word === w)}>
                    <span className="text-4xl">{p.emoji}</span>
                  </button>
                ))}
              </div>
            ))}
          </section>
        );
      case "trace":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Copy the word" say="Look at the word, then type it in the box." keys={s.words.map((_, j) => k(j))} />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {s.words.map((t, j) => (
                <label key={j} className="flex flex-col gap-1">
                  <span className="text-2xl font-extrabold text-zinc-400">{t.emoji} {t.word}</span>
                  <TextBox value={String(answers[k(j)] ?? "")} onChange={(v) => set(k(j), v)} state={result(k(j))} disabled={checked} />
                </label>
              ))}
            </div>
          </section>
        );
      case "draw":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Draw your favourite part" say="Draw it here, then show your teacher!" />
            <DrawPad />
          </section>
        );
      case "yesno":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Yes or no?" say="Read each sentence. Is it what happened in the story?" keys={s.items.map((_, j) => k(j))} />
            {s.items.map((y, j) => (
              <div key={j} className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => speak(y.text, 0.85)} className="flex-1 text-left text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  {y.text}
                </button>
                {["👍 Yes", "👎 No"].map((label, m) => (
                  <button key={m} disabled={checked} onClick={() => set(k(j), m)} className={optClass(answers[k(j)] === m, k(j), m === (y.yes ? 0 : 1))}>
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </section>
        );
      case "fill":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Fill the gap" say="Tap the word that goes in each gap." keys={s.items.map((_, j) => k(j))} />
            {s.items.map((b, j) => (
              <div key={j} className="mt-4">
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  {b.before}{" "}
                  <span className={`inline-block min-w-24 border-b-4 px-2 text-center ${result(k(j)) === true ? "border-emerald-500 text-emerald-700" : result(k(j)) === false ? "border-rose-500 text-rose-600" : "border-sky-400 text-sky-700"}`}>
                    {String(answers[k(j)] ?? "") || " "}
                  </span>{" "}
                  {b.after}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.bank.map((w) => (
                    <button key={w} disabled={checked} onClick={() => set(k(j), w)} className={optClass(answers[k(j)] === w, k(j), norm(w) === norm(b.answer)) + " !py-1.5 !text-base"}>
                      {w}
                    </button>
                  ))}
                </div>
                {checked && result(k(j)) === false && <p className="mt-1 text-sm font-bold text-emerald-700">It was “{b.answer}”.</p>}
              </div>
            ))}
          </section>
        );
      case "choose":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Choose the right word" say="Which word makes the sentence right?" keys={s.items.map((_, j) => k(j))} />
            {s.items.map((c, j) => (
              <div key={j} className="mt-3 flex flex-wrap items-center gap-2 text-lg font-bold text-zinc-800 dark:text-zinc-100">
                <span>{c.before}</span>
                {c.options.map((o) => (
                  <button key={o} disabled={checked} onClick={() => set(k(j), o)} className={optClass(answers[k(j)] === o, k(j), norm(o) === norm(c.answer)) + " !py-1.5"}>
                    {o}
                  </button>
                ))}
                <span>{c.after}</span>
              </div>
            ))}
          </section>
        );
      case "order": {
        const picked = (answers[k()] as number[] | undefined) ?? [];
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Put the story in order" say="Tap what happened first, then next, then last. Tap again to undo." keys={[k()]} />
            <div className="mt-3 flex flex-col gap-2">
              {s.items.map((o, j) => {
                const pos = picked.indexOf(j);
                const ok = checked ? (result(k()) ? true : o.answer === pos + 1) : undefined;
                return (
                  <button
                    key={j}
                    disabled={checked}
                    onClick={() => set(k(), pos >= 0 ? picked.filter((x) => x !== j) : picked.length < s.items.length ? [...picked, j] : picked)}
                    className={`flex items-center gap-3 rounded-2xl border-4 px-4 py-3 text-left text-lg font-bold transition-all active:scale-[.98] ${
                      ok === true ? "border-emerald-400 bg-emerald-50" : ok === false ? "border-rose-400 bg-rose-50" : pos >= 0 ? "border-sky-500 bg-sky-50" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl font-extrabold ${pos >= 0 ? "bg-[#0A4F29] text-white" : "border-2 border-dashed border-zinc-300 text-zinc-300"}`}>
                      {pos >= 0 ? pos + 1 : "?"}
                    </span>
                    <span className="text-zinc-800">{o.text}</span>
                    {checked && !result(k()) && <span className="ml-auto text-sm text-emerald-700">it was {o.answer}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      }
      case "drawlabel":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title={`Draw the ${s.subject} and label it`} say="Draw it, then type its name." />
            <DrawPad />
            <div className="mt-2 max-w-xs">
              <TextBox value={String(answers[k("label")] ?? "")} onChange={(v) => set(k("label"), v)} placeholder="Type the label" />
            </div>
          </section>
        );
      case "written":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title={s.question} say="Tap the right answer, then write it in a full sentence." keys={[k()]} />
            <div className="mt-3 flex flex-wrap gap-3">
              {s.options.map((o, j) => (
                <button key={j} disabled={checked} onClick={() => set(k(), j)} className={optClass(answers[k()] === j, k(), j === s.answerIndex)}>
                  <span className="mr-1 text-2xl">{o.emoji}</span> {o.label}
                </button>
              ))}
            </div>
            <WriteBox placeholder="Write your answer in a full sentence…" />
          </section>
        );
      case "meanings":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Word meanings" say="For each word, tap the letter of its meaning." keys={s.words.map((_, j) => k(j))} />
            <ul className="mt-3 space-y-1 rounded-2xl bg-zinc-50 p-3 text-base font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {s.meanings.map((m) => (
                <li key={m.letter}>
                  <b className="mr-2 text-[#0A4F29] dark:text-emerald-300">{m.letter}</b>
                  {m.text}
                </li>
              ))}
            </ul>
            {s.words.map((w, j) => (
              <div key={j} className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={() => sayWord(w)} className="min-w-28 text-left text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
                  {w}
                </button>
                {s.meanings.map((m) => (
                  <button key={m.letter} disabled={checked} onClick={() => set(k(j), m.letter)} className={optClass(answers[k(j)] === m.letter, k(j), m.word === w) + " !px-3.5 !py-1.5"}>
                    {m.letter}
                  </button>
                ))}
              </div>
            ))}
          </section>
        );
      case "hunt":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Word hunt" say="Find the word in the story that means this, and type it." keys={s.items.map((_, j) => k(j))} />
            {s.items.map((h, j) => (
              <div key={j} className="mt-3 grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-center">
                <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                  “{h.meaning}” <span className="text-sm text-zinc-400">(starts with <b>{h.first}</b>)</span>
                </p>
                <TextBox value={String(answers[k(j)] ?? "")} onChange={(v) => set(k(j), v)} state={result(k(j))} disabled={checked} />
                {checked && result(k(j)) === false && <p className="text-sm font-bold text-emerald-700 sm:col-span-2">It was “{h.answer}”.</p>}
              </div>
            ))}
          </section>
        );
      case "next":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="What happens next?" say="What do you think happens after the story ends?" />
            <WriteBox placeholder="I think…" />
          </section>
        );
      case "summary":
        return (
          <section key={i} className={CARD}>
            <Title n={++n} title="Tell the story in one sentence" say="Who is it about, and what happens?" />
            <WriteBox placeholder="This story is about…" />
          </section>
        );
    }
  });

  const pct = items.length ? score / items.length : 0;
  const stars = pct === 1 ? "⭐⭐⭐" : pct >= 0.6 ? "⭐⭐" : "⭐";
  const cheer = pct === 1 ? "Amazing" : pct >= 0.6 ? "Great job" : "Good try";

  return (
    <div ref={sheet} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-center gap-3 rounded-[1.8rem] bg-[#0A4F29] px-6 py-5 text-white shadow-lg">
        <span className="text-5xl">{passage.emoji}</span>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-[#F7B917]">{passage.title}</h1>
          <p className="text-sm font-semibold opacity-90">
            {input.level.grade} story{passage.lexile ? ` · ${lexileLabel(passage.lexile)}` : ""} · Worksheet level {ws.tier}
          </p>
        </div>
        {childName === undefined && <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name ✏️"
          maxLength={40}
          className="w-full rounded-full border-0 bg-white px-4 py-2 text-center text-lg font-bold text-zinc-800 placeholder:text-zinc-400 sm:w-56"
        />}
      </header>

      {blocks}

      {!checked ? (
        <button
          onClick={check}
          className="rounded-full bg-gradient-to-r from-[#0A4F29] to-[#668C4A] py-5 text-2xl font-extrabold text-white shadow-lg active:scale-[.98]"
        >
          {onSubmit ? "📤 Submit my work" : "✅ Check my answers"}
        </button>
      ) : (
        <div ref={resultRef} className={`${CARD} text-center`}>
          {onSubmit && <SubmitBadge state={sending} error={sendError} onRetry={check} />}
          <div className="text-6xl">{stars}</div>
          <p className="mt-2 text-4xl font-extrabold text-[#0A4F29] dark:text-emerald-300">
            {score} out of {items.length}!
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-600 dark:text-zinc-300">
            {cheer}
            {name.trim() ? `, ${name.trim()}` : ""}! {pct === 1 ? "🎉" : "The green answers are the right ones."}
          </p>
          {ws.sections.some((s) => ["draw", "drawlabel", "written", "next", "summary"].includes(s.kind)) && (
            <p className="mt-2 text-sm font-semibold text-zinc-500">✍️ Show your teacher your drawing and writing too.</p>
          )}
          {!onSubmit && <button
            onClick={() => {
              setAnswers({});
              setChecked(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-4 rounded-full border-4 border-emerald-200 px-6 py-2 text-lg font-extrabold text-[#0A4F29] active:scale-95"
          >
            🔁 Try again
          </button>}
        </div>
      )}
    </div>
  );
}

/** The hand-in indicator: a big tick once the work is in. */
function SubmitBadge({ state, error, onRetry }: { state: "no" | "sending" | "sent"; error: string; onRetry: () => void }) {
  if (state === "sent") {
    return (
      <div className="mb-4 flex flex-col items-center gap-1 rounded-3xl bg-emerald-50 py-4 ring-4 ring-emerald-200 dark:bg-emerald-950/40">
        <span className="tick-pop grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-5xl font-black text-white shadow-lg">✓</span>
        <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">Submitted!</p>
        <p className="text-sm font-semibold text-emerald-800/70 dark:text-emerald-200/70">Your teacher can see your work now.</p>
      </div>
    );
  }
  if (state === "sending") {
    return <p className="mb-4 rounded-3xl bg-sky-50 py-4 text-xl font-extrabold text-sky-700">📤 Sending your work…</p>;
  }
  return (
    <div className="mb-4 rounded-3xl bg-rose-50 py-4">
      <p className="font-bold text-rose-700">{error || "That didn't send."}</p>
      <button onClick={onRetry} className="mt-2 rounded-full bg-rose-600 px-5 py-2 font-extrabold text-white active:scale-95">
        Try sending again
      </button>
    </div>
  );
}

function TextBox({
  value,
  onChange,
  state,
  disabled,
  placeholder = "Type here",
}: {
  value: string;
  onChange: (v: string) => void;
  state?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      className={`w-full rounded-2xl border-4 px-4 py-2 text-xl font-bold outline-none ${
        state === true ? "border-emerald-400 bg-emerald-50 text-emerald-800" : state === false ? "border-rose-400 bg-rose-50 text-rose-700" : "border-sky-200 focus:border-sky-400"
      }`}
    />
  );
}

function WriteBox({ placeholder }: { placeholder: string }) {
  return (
    <textarea
      rows={2}
      placeholder={placeholder}
      className="mt-3 w-full rounded-2xl border-4 border-sky-200 px-4 py-2 text-lg font-semibold outline-none focus:border-sky-400"
    />
  );
}

/** A small drawing pad: draw with a finger or mouse, pick a colour, clear. */
function DrawPad() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [colour, setColour] = useState("#0A4F29");
  const drawing = useRef(false);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };
  return (
    <div className="mt-3">
      <canvas
        ref={ref}
        width={800}
        height={340}
        className="w-full touch-none rounded-2xl border-4 border-dashed border-zinc-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const { x, y } = point(e);
          ctx.strokeStyle = colour;
          ctx.lineWidth = 8;
          ctx.lineCap = ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const { x, y } = point(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {["#0A4F29", "#E8433A", "#3a7be8", "#F7B917", "#8b5cf6", "#111111"].map((c) => (
          <button
            key={c}
            onClick={() => setColour(c)}
            aria-label="Pick a colour"
            className={`h-9 w-9 rounded-full ring-4 ${colour === c ? "ring-sky-400" : "ring-white"}`}
            style={{ background: c }}
          />
        ))}
        <button
          onClick={() => {
            const c = ref.current;
            c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
          }}
          className="rounded-full bg-zinc-100 px-4 py-1.5 font-bold text-zinc-600"
        >
          🧽 Clear
        </button>
      </div>
    </div>
  );
}
