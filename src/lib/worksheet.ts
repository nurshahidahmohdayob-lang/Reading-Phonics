/* A printable worksheet for one child's reading of one story.

   Built from the story itself, so it works for every story in the library and
   for any a teacher has added. How much is on it depends on the child's
   reading level — kept very easy throughout, since it's done on paper,
   alone, after the read:

     Level 1 (below 200L)  a picture question, find-and-circle words,
                           trace-and-write words, draw a picture
     Level 2 (200–499L)    adds a fill-the-missing-word with a word bank,
                           and putting three sentences in order
     Level 3 (500L+)       four of each, and one written sentence

   The words to practise are the ones the child actually got wrong in the read,
   when the read kept them; otherwise the story's key picture words.

   Everything is chosen with a random generator seeded from the story, so the
   same story always prints the same worksheet — two children who read it get
   the same sheet, and the answer key matches. */

import { findPassage, type Passage, type PassageLevel } from "@/app/passages";
import { lookup } from "@/app/dictionary";
import type { GuidedRead } from "@/lib/guidedLog";

export type WorksheetInput = {
  childName: string;
  year: string;
  /** The child's reading level, if assessed. */
  lexile: number | null;
  passage: Passage;
  level: PassageLevel;
  /** Words the child couldn't read in this story, if the read kept them. */
  missedWords: string[];
};

type Tier = 1 | 2 | 3;

export function worksheetTier(lexile: number | null, level: PassageLevel): Tier {
  if (lexile === null) {
    // Not assessed: go by the story's level instead.
    return level.id === "year1" ? 1 : level.id === "year2" ? 2 : 3;
  }
  return lexile < 200 ? 1 : lexile < 500 ? 2 : 3;
}

/* ---------- picking words and sentences ---------- */

const STOP = new Set(
  ("a an the and but or so of to in on at by for with from up down out off over " +
    "is are was were be been am he she it they we you i me my his her its our their them him us " +
    "this that these those there here then than too very not no yes do does did has have had " +
    "can will would could should just all some what when where who why how one").split(" "),
);

function clean(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");
}

/** A small seeded generator, so a story always gives the same worksheet. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffled<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Content words in the story the picture dictionary knows. */
function keyWords(text: string) {
  const words = unique(text.split(/\s+/).map(clean)).filter(
    (w) => w.length >= 3 && !STOP.has(w),
  );
  return words
    .map((w) => ({ w, entry: lookup(w) }))
    .filter((x) => x.entry && ["noun", "verb", "adjective"].includes(x.entry.pos));
}

/* ---------- what goes on the sheet ---------- */

export type Worksheet = {
  tier: Tier;
  question: { text: string; options: { emoji: string; label: string }[]; answer: number } | null;
  circle: { word: string; emoji: string | null; row: string[] }[];
  trace: { word: string; emoji: string | null }[];
  blanks: { before: string; after: string; answer: string }[];
  bank: string[];
  order: { text: string; answer: number }[];
  writeSentence: boolean;
};

export function buildWorksheet(input: WorksheetInput): Worksheet {
  const { passage, missedWords } = input;
  const tier = worksheetTier(input.lexile, input.level);
  const rnd = seeded(passage.id + ":" + passage.title);
  const text = passage.text;
  const keys = keyWords(text);
  const pictureNouns = keys.filter((k) => k.entry!.pos === "noun");
  const allWords = unique(text.split(/\s+/).map(clean)).filter((w) => w.length >= 2);

  // Practise what they found hard first; then the story's key picture words.
  const missed = unique(missedWords.map(clean)).filter((w) => w.length >= 2);
  const practice = unique([
    ...missed,
    ...pictureNouns.map((k) => k.w),
    ...keys.map((k) => k.w),
  ]);
  const emojiFor = (w: string) => lookup(w)?.emoji ?? null;
  // A word written with a capital every time it appears is a name ("Sam"):
  // show it that way, and never blank it out.
  const proper = new Set(
    allWords.filter((w) => {
      const seen = text.split(/\s+/).filter((t) => clean(t) === w);
      return seen.length > 0 && seen.every((t) => /^[^a-z]*[A-Z]/.test(t));
    }),
  );
  const shown = (w: string) => (proper.has(w) ? w[0].toUpperCase() + w.slice(1) : w);

  const nWords = tier === 1 ? 3 : 4;

  // Find and circle: the word, among look-alikes from the same story.
  const circle = practice.slice(0, nWords).map((word) => {
    const alike = shuffled(
      allWords.filter((w) => w !== word && (w[0] === word[0] || Math.abs(w.length - word.length) <= 1)),
      rnd,
    );
    const others = unique([...alike, ...shuffled(allWords.filter((w) => w !== word), rnd)]).slice(
      0,
      tier === 1 ? 2 : 3,
    );
    return { word: shown(word), emoji: emojiFor(word), row: shuffled([word, ...others], rnd).map(shown) };
  });

  // Trace and write: the same practice words, big.
  const trace = practice.slice(0, tier === 1 ? 3 : 4).map((word) => ({ word: shown(word), emoji: emojiFor(word) }));

  // The story's own question, if it has one.
  const quiz = passage.quiz;
  const question = quiz
    ? { text: quiz.question, options: quiz.options.map((o) => ({ emoji: o.emoji, label: o.label })), answer: quiz.answer }
    : null;

  const sentences = sentencesOf(text);

  // Fill the missing word (level 2 and up): one key word blanked per sentence.
  const blanks: Worksheet["blanks"] = [];
  if (tier >= 2) {
    const keySet = new Set(keys.map((k) => k.w));
    const used = new Set<string>();
    for (const s of sentences) {
      if (blanks.length >= (tier === 2 ? 3 : 4)) break;
      const parts = s.split(" ");
      if (parts.length < 4) continue;
      const i = parts.findIndex((p) => {
        const w = clean(p);
        return keySet.has(w) && !used.has(w) && !proper.has(w) &&
          parts.filter((q) => clean(q) === w).length === 1;
      });
      if (i < 0) continue;
      const word = clean(parts[i]);
      used.add(word);
      const lead = parts[i].match(/^[^a-z]*/i)?.[0] ?? "";
      const trail = parts[i].match(/[^a-z']*$/i)?.[0] ?? "";
      const rest = parts.slice(i + 1).join(" ");
      blanks.push({
        before: (parts.slice(0, i).join(" ") + (lead ? " " + lead : "")).trim(),
        after: trail + (rest ? " " + rest : ""),
        answer: word,
      });
    }
  }
  const spare = tier === 3 ? keys.map((k) => k.w).filter((w) => !proper.has(w) && !blanks.some((b) => b.answer === w)).slice(0, 1) : [];
  const bank = shuffled([...blanks.map((b) => b.answer), ...spare], rnd);

  // Put in order (level 2 and up): sentences from across the story, mixed up.
  let order: Worksheet["order"] = [];
  if (tier >= 2 && sentences.length >= 3) {
    const k = tier === 2 ? 3 : 4;
    const picked = unique(
      Array.from({ length: k }, (_, i) => Math.round((i * (sentences.length - 1)) / (k - 1))),
    ).map((idx, n) => ({ text: sentences[idx], answer: n + 1 }));
    let mixed = shuffled(picked, rnd);
    // never print them already in order
    if (mixed.every((m, i) => m.answer === i + 1)) mixed = [...mixed.slice(1), mixed[0]];
    order = mixed;
  }

  return { tier, question, circle, trace, blanks, bank, order, writeSentence: tier === 3 };
}

/* ---------- the printed page ---------- */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function worksheetHtml(input: WorksheetInput): string {
  const ws = buildWorksheet(input);
  const { passage, childName, year } = input;
  // Level 1 fits on one page: a longer story is set a little smaller.
  const longStory = passage.text.split(/\s+/).length > 66;
  const storySize = ws.tier === 1 ? (longStory ? 14.5 : 16.5) : ws.tier === 2 ? 15.5 : 13;
  let n = 0;
  const part = (title: string, say: string) =>
    `<h2><span class="n">${++n}</span>${esc(title)} <small>${esc(say)}</small></h2>`;

  const sections: string[] = [];

  sections.push(`<section>${part("Read the story", "Read it to a grown-up, or read it twice!")}
    <div class="story" style="font-size:${storySize}pt">${esc(passage.text)}</div></section>`);

  if (ws.question) {
    sections.push(`<section>${part(ws.question.text, "Tick ✔ the right box.")}
      <div class="ticks">${ws.question.options
        .map((o) => `<div class="tick"><span class="box"></span><span class="pic">${o.emoji}</span><span>${esc(o.label)}</span></div>`)
        .join("")}</div></section>`);
  }

  if (ws.circle.length) {
    sections.push(`<section>${part("Find and circle the word", "Look at the word. Circle it in the row.")}
      ${ws.circle
        .map(
          (c) => `<div class="circle"><span class="target">${c.emoji ? `<span class="pic">${c.emoji}</span>` : ""}${esc(c.word)}</span>
            <span class="arrow">→</span>${c.row.map((w) => `<span class="cand">${esc(w)}</span>`).join("")}</div>`,
        )
        .join("")}</section>`);
  }

  if (ws.trace.length) {
    sections.push(`<section>${part("Trace it, then write it", "Go over the grey word, then write it on the line.")}
      <div class="traces">${ws.trace
        .map(
          (t) => `<div class="trace">${t.emoji ? `<span class="pic">${t.emoji}</span>` : ""}
            <span class="ghost">${esc(t.word)}</span><span class="line"></span></div>`,
        )
        .join("")}</div></section>`);
  }

  if (ws.blanks.length) {
    sections.push(`<section>${part("Fill in the missing word", "Use a word from the box.")}
      <div class="bank">${ws.bank.map((w) => `<span>${esc(w)}</span>`).join("")}</div>
      ${ws.blanks
        .map((b) => `<p class="blank">${esc(b.before)}${b.before ? " " : ""}<span class="gap"></span>${/^[a-z0-9]/i.test(b.after) ? " " : ""}${esc(b.after)}</p>`)
        .join("")}</section>`);
  }

  if (ws.order.length) {
    sections.push(`<section>${part("Put the story in order", "Write 1, 2, 3 in the boxes.")}
      ${ws.order.map((o) => `<div class="ord"><span class="numbox"></span><span>${esc(o.text)}</span></div>`).join("")}</section>`);
  }

  if (ws.writeSentence) {
    sections.push(`<section>${part("Your favourite part", "Write one sentence about it.")}
      <span class="line wide"></span><span class="line wide"></span></section>`);
  } else {
    sections.push(`<section>${part("Draw your favourite part", "Then tell someone about it!")}
      <div class="draw" style="height:${ws.tier === 1 ? 26 : 46}mm"></div></section>`);
  }

  // Answer key, for the teacher — a separate page that prints only if asked.
  const key: string[] = [];
  if (ws.question) key.push(`<li>Story question: <b>${esc(ws.question.options[ws.question.answer]?.label ?? "")}</b></li>`);
  if (ws.blanks.length) key.push(`<li>Missing words: ${ws.blanks.map((b, i) => `${i + 1}. <b>${esc(b.answer)}</b>`).join(" · ")}</li>`);
  if (ws.order.length) key.push(`<li>Order, top to bottom: <b>${ws.order.map((o) => o.answer).join(", ")}</b></li>`);
  const missed = input.missedWords.length
    ? `<li>Words ${esc(childName || "they")} couldn't read in this story: <b>${esc(unique(input.missedWords.map(clean)).join(", "))}</b></li>`
    : `<li>This read didn't keep which words were missed, so the word activities use the story's key words.</li>`;

  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(passage.title)} — worksheet${childName ? " — " + esc(childName) : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Andika", "Comic Sans MS", "Arial Rounded MT Bold", Arial, sans-serif; color: #1f2a22; background: #eef3ee; }
  .bar { position: sticky; top: 0; z-index: 2; display: flex; gap: 12px; align-items: center; justify-content: center; padding: 12px; background: #0A4F29; color: #fff; font-family: Arial, sans-serif; }
  .bar button { border: 0; border-radius: 999px; padding: 10px 22px; font-size: 16px; font-weight: 700; cursor: pointer; background: #F7B917; color: #0A4F29; }
  .bar label { font-size: 15px; display: flex; gap: 6px; align-items: center; }
  .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 12mm; box-shadow: 0 6px 24px rgba(0,0,0,.12); }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 3px solid #668C4A; padding-bottom: 8px; }
  header h1 { margin: 0; font-size: 22pt; color: #0A4F29; line-height: 1.05; }
  header .meta { font-size: 11pt; color: #5b6b5f; margin-top: 4px; }
  .who { font-size: 13pt; text-align: right; line-height: 1.9; white-space: nowrap; }
  .who span { display: inline-block; min-width: 46mm; border-bottom: 1.5px solid #333; text-align: left; padding-left: 4px; }
  section { margin-top: 3.5mm; break-inside: avoid; }
  h2 { font-size: 14pt; margin: 0 0 2mm; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: #0A4F29; }
  h2 small { font-size: 10.5pt; font-weight: 400; color: #5b6b5f; }
  h2 .n { background: #668C4A; color: #fff; border-radius: 50%; width: 9mm; height: 9mm; display: inline-grid; place-items: center; font-size: 13pt; flex: none; }
  .story { line-height: 1.5; border: 2px solid #e2ecd9; border-radius: 4mm; padding: 3mm 4mm; background: #fbfdf8; }
  .pic { font-size: 1.5em; line-height: 1; }
  .ticks { display: flex; gap: 6mm; flex-wrap: wrap; font-size: 15pt; }
  .tick { display: flex; align-items: center; gap: 3mm; border: 2px solid #e2ecd9; border-radius: 4mm; padding: 2mm 4mm; }
  .box { width: 8mm; height: 8mm; border: 2px solid #333; border-radius: 1.5mm; display: inline-block; }
  .circle { display: flex; align-items: center; gap: 6mm; font-size: 15.5pt; margin: 1.5mm 0; flex-wrap: wrap; }
  .circle .target { font-weight: 700; display: inline-flex; align-items: center; gap: 2mm; min-width: 38mm; background: #fff6d6; border-radius: 3mm; padding: 1mm 3mm; }
  .circle .arrow { color: #9aa79d; }
  .circle .cand { padding: 1mm 3mm; }
  .traces { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 8mm; }
  .trace { display: flex; align-items: center; gap: 3mm; }
  .ghost { font-size: 25pt; color: #c9cfca; letter-spacing: 2px; min-width: 26mm; font-weight: 400; }
  .line { flex: 1; height: 11mm; border-bottom: 2px solid #333; background: linear-gradient(to bottom, transparent 46%, #d3d8d4 46%, #d3d8d4 49%, transparent 49%); display: block; }
  .line.wide { margin-top: 3mm; }
  .bank { display: flex; gap: 4mm; flex-wrap: wrap; border: 2px dashed #668C4A; border-radius: 4mm; padding: 3mm 4mm; font-size: 15pt; font-weight: 700; margin-bottom: 3mm; }
  .bank span { background: #eef6e8; border-radius: 3mm; padding: 1mm 4mm; }
  .blank { font-size: 14pt; line-height: 1.85; margin: 0.5mm 0; }
  .gap { display: inline-block; min-width: 34mm; border-bottom: 2px solid #333; margin: 0 2mm; }
  .ord { display: flex; align-items: center; gap: 4mm; font-size: 13.5pt; margin: 2mm 0; }
  .numbox { flex: none; width: 10mm; height: 10mm; border: 2px solid #333; border-radius: 2mm; }
  .draw { height: 48mm; border: 2px solid #333; border-radius: 4mm; }
  footer { margin-top: 4mm; font-size: 9pt; color: #8a978d; text-align: center; }
  .key { font-family: Arial, sans-serif; }
  .key h1 { font-size: 18pt; }
  .key li { margin: 3mm 0; font-size: 12pt; }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: 0; padding: 0; }
    .key { break-before: page; }
    body:not(.with-key) .key { display: none; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="bar">
  <button onclick="window.print()">🖨️ Print worksheet</button>
  <label><input type="checkbox" onchange="document.body.classList.toggle('with-key', this.checked)"> Also print the answer key (for you)</label>
</div>
<div class="sheet">
  <header>
    <div><h1>${esc(passage.emoji)} ${esc(passage.title)}</h1>
      <div class="meta">${esc(input.level.grade)} story · ${passage.lexile ? passage.lexile + "L · " : ""}Worksheet level ${ws.tier}</div></div>
    <div class="who">Name: <span>${esc(childName)}</span><br>Date: <span>${esc(today)}</span></div>
  </header>
  ${sections.join("\n")}
  <footer>Phonics Pals &amp; Guided Reading · Zera International School</footer>
</div>
<div class="sheet key">
  <h1>Answer key — ${esc(passage.title)}</h1>
  <p>${esc(childName)}${year ? " · " + esc(year) : ""} · worksheet level ${ws.tier}</p>
  <ul>${key.join("")}${missed}</ul>
</div>
</body></html>`;
}

/** Open the worksheet in a new tab, ready to print. */
export function openWorksheet(input: WorksheetInput): void {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to open the printable worksheet.");
    return;
  }
  win.document.open();
  win.document.write(worksheetHtml(input));
  win.document.close();
}

/** The worksheet for one logged read: that story, that child's level, and the
    words they missed in it if the read kept them. null if the story can't be
    found any more (a teacher-added story removed from this device). */
export function worksheetForRead(
  read: GuidedRead,
  child: { name: string; year: string; lexile: number | null },
): WorksheetInput | null {
  const found = findPassage(read.passageId, read.levelId);
  if (!found) return null;
  const words = found.passage.text.split(/\s+/);
  const missedWords = (read.missedAt ?? []).map((i) => words[i]).filter(Boolean);
  return {
    childName: child.name,
    year: child.year,
    lexile: child.lexile,
    passage: found.passage,
    level: found.level,
    missedWords,
  };
}

export function printWorksheetForRead(
  read: GuidedRead,
  child: { name: string; year: string; lexile: number | null },
): void {
  const input = worksheetForRead(read, child);
  if (!input) {
    alert("This story isn't on this device any more, so its worksheet can't be made.");
    return;
  }
  openWorksheet(input);
}
