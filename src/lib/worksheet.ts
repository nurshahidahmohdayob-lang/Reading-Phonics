/* A printable worksheet for one child's reading of one story.

   Built from the story itself, so it works for every story in the library and
   for any a teacher has added. Each reading level gets its own kinds of
   question — no level repeats another's — all kept easy, since it's done on
   paper, alone, after the read:

     Level 1 (below 200L)  pictures and words
       tick the picture answer · find and circle the word · match each word
       to its picture · trace and write (Year 1 only) · draw your favourite part
     Level 2 (200–499L)    sentences
       yes or no? · fill the gap from a word box · circle the right word in
       the sentence · number the sentences 1-2-3 · draw and label
     Level 3 (500L+)       meaning and writing
       answer the story question in writing · match words to their meanings ·
       word hunt (find the word that means…) · what happens next? · tell the
       story in one sentence

   The words to practise are the ones the child couldn't read in this story,
   when the read kept them; otherwise the story's key words, with pictures and
   meanings from the app's dictionary.

   Everything is chosen with a random generator seeded from the story, so the
   same story always prints the same sheet at a given level — every child who
   read it gets the same one, and the answer key matches. */

import { findPassage, type Passage, type PassageLevel } from "@/app/passages";
import { lookup, type DictEntry } from "@/app/dictionary";
import type { GuidedRead } from "@/lib/guidedLog";
import { lexileLabel } from "@/lib/lexileStats";

export type WorksheetInput = {
  childName: string;
  year: string;
  /** The child's reading level, if assessed. */
  lexile: number | null;
  passage: Passage;
  level: PassageLevel;
  /** Words the child couldn't read in this story, if the read kept them. */
  missedWords: string[];
  /** Set the worksheet level by hand, instead of from the child's Lexile. */
  tier?: Tier;
};

export type Tier = 1 | 2 | 3;

export function worksheetTier(lexile: number | null, level: PassageLevel): Tier {
  if (lexile === null) {
    // Not assessed: go by the story's level instead.
    return level.id === "starter" || level.id === "year1" ? 1 : level.id === "year2" ? 2 : 3;
  }
  return lexile < 200 ? 1 : lexile < 500 ? 2 : 3;
}

/* ---------- the sections ---------- */

export type Section =
  | { kind: "read" }
  | { kind: "tick"; question: string; options: { emoji: string; label: string }[]; answer: number }
  | { kind: "circle"; rows: { word: string; emoji: string | null; row: string[] }[] }
  | { kind: "matchpic"; words: string[]; pics: { emoji: string; word: string }[] }
  | { kind: "trace"; words: { word: string; emoji: string | null }[] }
  | { kind: "draw" }
  | { kind: "yesno"; items: { text: string; yes: boolean; fix?: string }[] }
  | { kind: "fill"; bank: string[]; items: { before: string; after: string; answer: string }[] }
  | { kind: "choose"; items: { before: string; options: [string, string]; after: string; answer: string }[] }
  | { kind: "order"; items: { text: string; answer: number }[] }
  | { kind: "drawlabel"; subject: string }
  | { kind: "written"; question: string; answer: string; options: { emoji: string; label: string }[]; answerIndex: number }
  | { kind: "meanings"; words: string[]; meanings: { letter: string; text: string; word: string }[] }
  | { kind: "hunt"; items: { meaning: string; first: string; answer: string }[] }
  | { kind: "next" }
  | { kind: "summary" };

export type Worksheet = { tier: Tier; sections: Section[] };

/* ---------- picking words and sentences ---------- */

const STOP = new Set(
  ("a an the and but or so of to in on at by for with from up down out off over " +
    "is are was were be been am he she it they we you i me my his her its our their them him us " +
    "this that these those there here then than too very not no yes do does did has have had " +
    "can will would could should just all some what when where who why how one").split(" "),
);

/** Picture nouns to swap in when a story doesn't have enough of its own. */
const SPARE_NOUNS = ["dog", "cat", "ball", "tree", "car", "fish", "bird", "cake", "hat", "box", "sun", "bed", "cup", "duck", "frog"];

/** Names to swap in for a "no" sentence, if a story has no things to swap. */
const SPARE_NAMES = ["Ben", "Mia", "Tom", "Lily", "Max", "Zara", "Omar", "Ruby"];

/** Naming words you can't draw a clear picture of, or swap in a sentence and
    be plainly wrong — kept out of picture matching and word swaps. */
const VAGUE = new Set(
  ("day days time times way lot lots thing things part end week year minute hour moment today morning afternoon evening place idea kind side bit " +
    "one two three four five six seven eight nine ten twenty hundred thousand").split(" "),
);

const IRREGULAR: Record<string, string> = {
  mouse: "mice", child: "children", man: "men", woman: "women", foot: "feet",
  tooth: "teeth", goose: "geese", sheep: "sheep", fish: "fish", person: "people",
};

function pluralOf(w: string): string {
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (/(s|x|z|ch|sh)$/.test(w)) return w + "es";
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
  return w + "s";
}

/** "dog" for "door", "dogs" for "doors": keep a swapped word plural if the
    word it replaces was. */
const MASS = new Set("water rain snow mud sand milk juice food air wind grass hair money homework bread soup tea rice".split(" "));

function matchNumber(swap: string, real: string): string | undefined {
  const realIsPlural = /[^s]s$/.test(real);
  const swapIsPlural = /[^s]s$/.test(swap) || Object.values(IRREGULAR).includes(swap);
  if (!realIsPlural || swapIsPlural) return swap;
  return MASS.has(swap) ? undefined : pluralOf(swap); // no "waters" or "rains"
}

/** The dictionary finds "hates" under "hat" and "walks" under "walk": a word
    ending -es that isn't a real plural (boxes, wishes), or -ed / -ing, is an
    action word, not a thing. */
function looksLikeVerbForm(w: string): boolean {
  if (/(ed|ing)$/.test(w)) return true;
  return /es$/.test(w) && !/(s|x|z|ch|sh)es$/.test(w) && !/ies$/.test(w);
}

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
    // A sentence ends at . ! or ?, or just after a closing speech mark —
    // but not mid-speech: “Hello!” he called. stays one sentence.
    .split(/(?<=[.!?]”?)\s+(?=[“"A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Replace one word in a sentence, keeping the punctuation around it. */
function splitAt(parts: string[], i: number) {
  const lead = parts[i].match(/^[^a-z]*/i)?.[0] ?? "";
  const trail = parts[i].match(/[^a-z']*$/i)?.[0] ?? "";
  const rest = parts.slice(i + 1).join(" ");
  return {
    before: (parts.slice(0, i).join(" ") + (lead ? " " + lead : "")).trim(),
    after: trail + (rest ? " " + rest : ""),
  };
}

export function buildWorksheet(input: WorksheetInput): Worksheet {
  const { passage, missedWords } = input;
  const tier = input.tier ?? worksheetTier(input.lexile, input.level);
  const rnd = seeded(passage.id + ":" + passage.title + ":" + tier);
  const text = passage.text;
  const tokens = text.split(/\s+/);
  const allWords = unique(tokens.map(clean)).filter((w) => w.length >= 2);

  // A word written with a capital every time it appears is a name ("Sam"):
  // show it that way, and never blank it out or swap it.
  const proper = new Set(
    allWords.filter((w) => {
      if (STOP.has(w)) return false; // "What" at the start of a sentence isn't a name
      const seen = tokens.filter((t) => clean(t) === w);
      return seen.length > 0 && seen.every((t) => /^[^a-z]*[A-Z]/.test(t));
    }),
  );
  const shown = (w: string) => (proper.has(w) ? w[0].toUpperCase() + w.slice(1) : w);

  // Content words the picture dictionary knows, with their entries. When a
  // story uses more than one form of a word ("shadow" twice, "shadows"
  // once), it counts as one word, in the form the story uses most (the
  // shorter on a tie), so a question never asks for the rarer form.
  const count = (w: string) => tokens.filter((t) => clean(t) === w).length;
  const formOf = new Map<DictEntry, string>();
  for (const w of allWords) {
    if (w.length < 3 || STOP.has(w)) continue;
    const e = lookup(w);
    if (!e || !["noun", "verb", "adjective"].includes(e.pos)) continue;
    const had = formOf.get(e);
    if (!had || count(w) > count(had) || (count(w) === count(had) && w.length < had.length)) formOf.set(e, w);
  }
  const known = new Map<string, DictEntry>([...formOf].map(([e, w]) => [w, e]));
  const nouns = [...known]
    .filter(([w, e]) => e.pos === "noun" && !looksLikeVerbForm(w))
    .map(([w]) => w)
    .filter((w) => !proper.has(w) && !VAGUE.has(w));
  const contentWords = [...known.keys()].filter((w) => !proper.has(w));

  // Practise what they found hard first; then the story's key words.
  const missed = unique(missedWords.map(clean)).filter((w) => w.length >= 2);
  const practice = unique([...missed, ...nouns, ...[...known.keys()].filter((w) => !VAGUE.has(w))]);

  const sentences = sentencesOf(text);
  const usedSentences = new Set<string>();
  // Sentences not used yet first; a short story runs out, so then any.
  const freshSentences = (min: number, max: number) => {
    const fits = sentences.filter((s) => s.split(" ").length >= min && s.split(" ").length <= max);
    return [...fits.filter((s) => !usedSentences.has(s)), ...fits.filter((s) => usedSentences.has(s))];
  };

  const sections: Section[] = [{ kind: "read" }];
  const quiz = passage.quiz;

  if (tier === 1) {
    // --- Level 1: pictures and words ---
    if (quiz) {
      sections.push({ kind: "tick", question: quiz.question, options: quiz.options.map((o) => ({ emoji: o.emoji, label: o.label })), answer: quiz.answer });
    }
    const circleWords = practice.slice(0, 3);
    sections.push({
      kind: "circle",
      rows: circleWords.map((word) => {
        const alike = shuffled(allWords.filter((w) => w !== word && (w[0] === word[0] || Math.abs(w.length - word.length) <= 1)), rnd);
        const others = unique([...alike, ...shuffled(allWords.filter((w) => w !== word), rnd)]).slice(0, 2);
        return { word: shown(word), emoji: lookup(word)?.emoji ?? null, row: shuffled([word, ...others], rnd).map(shown) };
      }),
    });
    // Match words to pictures: other picture words than the ones circled, where the story has them.
    const pool = unique([...nouns.filter((w) => !circleWords.includes(w)), ...nouns, ...SPARE_NOUNS]);
    const matchWords = pool.slice(0, 3);
    sections.push({
      kind: "matchpic",
      words: matchWords.map(shown),
      pics: shuffled(matchWords.map((w) => ({ emoji: (lookup(w) ?? { emoji: "❓" }).emoji, word: shown(w) })), rnd),
    });
    // Tracing is for Year 1 only; older children write without it. Goes by the
    // child's class; a name not on a class list goes by the story's level.
    const inYear1 = /\byear\s*1\b/i.test(input.year) || (!/\byear\s*\d/i.test(input.year) && ["starter", "year1"].includes(input.level.id));
    if (inYear1) {
      sections.push({ kind: "trace", words: circleWords.map((w) => ({ word: shown(w), emoji: lookup(w)?.emoji ?? null })) });
    }
    sections.push({ kind: "draw" });
  } else if (tier === 2) {
    // --- Level 2: sentences ---
    // Yes or no: two sentences as written, two with one picture word swapped.
    // Plain statements only — "What a silly day!" isn't a fact to say yes or no to.
    const short = shuffled(freshSentences(3, 18).filter((s) => /\.$/.test(s) && !/^(what|how|oh|wow|whoosh)\b/i.test(s)), rnd);
    const yesno: { text: string; yes: boolean; fix?: string }[] = [];
    for (const s of short) {
      if (yesno.length >= 4) break;
      const wantFalse = yesno.filter((y) => !y.yes).length < 2 && yesno.length % 2 === 1;
      if (!wantFalse) {
        yesno.push({ text: s, yes: true });
        usedSentences.add(s);
        continue;
      }
      const parts = s.split(" ");
      // Swap a thing for another thing; failing that, a character's name for
      // another name ("Ben the cat has a red hat" — no).
      let i = parts.findIndex((p) => nouns.includes(clean(p)) && parts.filter((q) => clean(q) === clean(p)).length === 1);
      let swap: string | undefined;
      if (i >= 0) {
        const real = clean(parts[i]);
        swap = [...nouns, ...SPARE_NOUNS]
          .filter((n) => n !== real && !s.toLowerCase().includes(n))
          .map((n) => matchNumber(n, real))
          .find(Boolean);
      } else {
        i = parts.findIndex((p) => proper.has(clean(p)));
        if (i >= 0) swap = SPARE_NAMES.find((nm) => !text.toLowerCase().includes(nm.toLowerCase()));
      }
      if (i < 0 || !swap) continue;
      const real = shown(clean(parts[i]));
      const { before, after } = splitAt(parts, i);
      yesno.push({ text: `${before}${before ? " " : ""}${swap}${after}`, yes: false, fix: real });
      usedSentences.add(s);
    }
    if (yesno.length >= 2) sections.push({ kind: "yesno", items: yesno });

    // "Circle the right word" needs naming words, so it chooses first; "fill
    // the gap" can use any word, so it takes what's left. Printed fill first.
    const usedWords = new Set<string>();
    // Circle the right word: the real word beside another thing from the story.
    const choose: { before: string; options: [string, string]; after: string; answer: string }[] = [];
    for (const s of freshSentences(4, 24)) {
      if (choose.length >= 3) break;
      const parts = s.split(" ");
      const i = parts.findIndex((p) => {
        const w = clean(p);
        // things only: swap a verb and both choices can make sense ("comes/goes down")
        return nouns.includes(w) && !usedWords.has(w) && parts.filter((q) => clean(q) === w).length === 1;
      });
      if (i < 0) continue;
      const answer = clean(parts[i]);
      const decoy = [
        ...shuffled(nouns.filter((w) => w !== answer && !s.toLowerCase().includes(w)), rnd),
        ...SPARE_NOUNS.filter((n) => n !== answer && !s.toLowerCase().includes(n)),
      ]
        .map((n) => matchNumber(n, answer))
        .find(Boolean);
      if (!decoy) continue;
      usedWords.add(answer);
      usedSentences.add(s);
      const { before, after } = splitAt(parts, i);
      choose.push({ before, after, answer, options: rnd() < 0.5 ? [answer, decoy] : [decoy, answer] });
    }

    // Fill the gap from a word box.
    const fill: { before: string; after: string; answer: string }[] = [];
    for (const s of freshSentences(4, 24)) {
      if (fill.length >= 3) break;
      const parts = s.split(" ");
      const i = parts.findIndex((p) => {
        const w = clean(p);
        return contentWords.includes(w) && !usedWords.has(w) && parts.filter((q) => clean(q) === w).length === 1;
      });
      if (i < 0) continue;
      const answer = clean(parts[i]);
      usedWords.add(answer);
      usedSentences.add(s);
      fill.push({ ...splitAt(parts, i), answer });
    }

    if (fill.length) sections.push({ kind: "fill", bank: shuffled(fill.map((f) => f.answer), rnd), items: fill });
    if (choose.length) sections.push({ kind: "choose", items: choose });

    // Number three sentences from across the story.
    if (sentences.length >= 3) {
      const picked = unique([0, Math.round((sentences.length - 1) / 2), sentences.length - 1]).map((idx, n) => ({ text: sentences[idx], answer: n + 1 }));
      let mixed = shuffled(picked, rnd);
      if (mixed.every((m, i) => m.answer === i + 1)) mixed = [...mixed.slice(1), mixed[0]];
      sections.push({ kind: "order", items: mixed });
    }

    // Draw and label the story's main thing.
    const counts = nouns.map((w) => [w, tokens.filter((t) => clean(t) === w).length] as const).sort((a, b) => b[1] - a[1]);
    sections.push({ kind: "drawlabel", subject: counts[0]?.[0] ?? "your favourite part" });
  } else {
    // --- Level 3: meaning and writing ---
    if (quiz) {
      sections.push({
        kind: "written",
        question: quiz.question,
        answer: quiz.options[quiz.answer]?.label ?? "",
        options: quiz.options.map((o) => ({ emoji: o.emoji, label: o.label })),
        answerIndex: quiz.answer,
      });
    }
    // Word meanings: four words, longer and missed words first.
    const byInterest = unique([...missed.filter((w) => known.has(w)), ...[...contentWords].sort((a, b) => b.length - a.length)]);
    const meaningWords = byInterest.slice(0, 4);
    const letters = ["A", "B", "C", "D"];
    const mixed = shuffled(meaningWords, rnd);
    sections.push({
      kind: "meanings",
      words: meaningWords.map(shown),
      meanings: mixed.map((w, i) => ({ letter: letters[i], text: known.get(w)!.meaning, word: shown(w) })),
    });
    // Word hunt: two more words, given by meaning, first letter as a hint.
    const huntWords = byInterest.slice(4, 6);
    if (huntWords.length) {
      sections.push({
        kind: "hunt",
        items: huntWords.map((w) => ({ meaning: known.get(w)!.meaning, first: w[0], answer: shown(w) })),
      });
    }
    sections.push({ kind: "next" });
    sections.push({ kind: "summary" });
  }

  return { tier, sections };
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
  const storySize = ws.tier === 1 ? (longStory ? 13 : 14.5) : ws.tier === 2 ? 14.5 : 13;
  let n = 0;
  const part = (title: string, say: string) =>
    `<h2><span class="n">${++n}</span>${esc(title)} <small>${esc(say)}</small></h2>`;
  const lines = (k: number) => Array.from({ length: k }, () => `<span class="line wide"></span>`).join("");
  const gap = (before: string, after: string, inner: string) =>
    `${esc(before)}${before ? " " : ""}${inner}${/^[a-z0-9]/i.test(after) ? " " : ""}${esc(after)}`;

  const html: string[] = [];
  const key: string[] = [];

  for (const s of ws.sections) {
    switch (s.kind) {
      case "read":
        html.push(`<section>${part("Read the story", "Read it to a grown-up, or read it twice!")}
          <div class="story" style="font-size:${storySize}pt">${esc(passage.text)}</div></section>`);
        break;
      case "tick":
        html.push(`<section>${part(s.question, "Tick ✔ the right box.")}
          <div class="ticks">${s.options.map((o) => `<div class="tick"><span class="box"></span><span class="pic">${o.emoji}</span><span>${esc(o.label)}</span></div>`).join("")}</div></section>`);
        key.push(`<li>${esc(s.question)} <b>${esc(s.options[s.answer]?.label ?? "")}</b></li>`);
        break;
      case "circle":
        html.push(`<section>${part("Find and circle the word", "Look at the word. Circle it in the row.")}
          ${s.rows.map((c) => `<div class="circle"><span class="target">${c.emoji ? `<span class="pic">${c.emoji}</span>` : ""}${esc(c.word)}</span><span class="arrow">→</span>${c.row.map((w) => `<span class="cand">${esc(w)}</span>`).join("")}</div>`).join("")}</section>`);
        break;
      case "matchpic":
        html.push(`<section>${part("Match the word to its picture", "Draw a line from each word to its picture.")}
          <div class="match">
            <div class="mrow">${s.words.map((w) => `<div class="mcell"><b>${esc(w)}</b><span class="dot"></span></div>`).join("")}</div>
            <div class="mrow pics">${s.pics.map((p) => `<div class="mcell"><span class="dot"></span><span class="pic big">${p.emoji}</span></div>`).join("")}</div>
          </div></section>`);
        key.push(`<li>Match: ${s.words.map((w) => `${esc(w)} → ${s.pics.find((p) => p.word === w)?.emoji ?? ""}`).join(" · ")}</li>`);
        break;
      case "trace":
        html.push(`<section>${part("Trace it, then write it", "Go over the grey word, then write it on the line.")}
          <div class="traces">${s.words.map((t) => `<div class="trace"><div class="tw">${t.emoji ? `<span class="pic">${t.emoji}</span>` : ""}<span class="ghost">${esc(t.word)}</span></div><span class="line"></span></div>`).join("")}</div></section>`);
        break;
      case "draw":
        html.push(`<section>${part("Draw your favourite part", "Then tell someone about it!")}
          <div class="draw" style="height:30mm"></div></section>`);
        break;
      case "yesno":
        html.push(`<section>${part("Yes or no?", "Read each sentence. Circle Yes or No.")}
          ${s.items.map((y) => `<div class="yn"><span class="yt">${esc(y.text)}</span><span class="yo">Yes</span><span class="yo">No</span></div>`).join("")}</section>`);
        key.push(`<li>Yes or no: ${s.items.map((y, i) => `${i + 1}. <b>${y.yes ? "Yes" : `No</b> (it was “${esc(y.fix ?? "")}”)<b>`}</b>`).join(" · ")}</li>`);
        break;
      case "fill":
        html.push(`<section>${part("Fill the gap", "Use a word from the box.")}
          <div class="bank">${s.bank.map((w) => `<span>${esc(w)}</span>`).join("")}</div>
          ${s.items.map((b) => `<p class="blank">${gap(b.before, b.after, `<span class="gap"></span>`)}</p>`).join("")}</section>`);
        key.push(`<li>Fill the gap: ${s.items.map((b, i) => `${i + 1}. <b>${esc(b.answer)}</b>`).join(" · ")}</li>`);
        break;
      case "choose":
        html.push(`<section>${part("Circle the right word", "Which word makes the sentence right?")}
          ${s.items.map((c) => `<p class="blank">${gap(c.before, c.after, `<span class="pick">( ${esc(c.options[0])} / ${esc(c.options[1])} )</span>`)}</p>`).join("")}</section>`);
        key.push(`<li>Circle the right word: ${s.items.map((c, i) => `${i + 1}. <b>${esc(c.answer)}</b>`).join(" · ")}</li>`);
        break;
      case "order":
        html.push(`<section>${part("Number the sentences", "Write 1, 2, 3 to show what happened first, next and last.")}
          ${s.items.map((o) => `<div class="ord"><span class="numbox"></span><span>${esc(o.text)}</span></div>`).join("")}</section>`);
        key.push(`<li>Number the sentences, top to bottom: <b>${s.items.map((o) => o.answer).join(", ")}</b></li>`);
        break;
      case "drawlabel":
        html.push(`<section>${part(`Draw the ${s.subject} and label it`, "Write the word next to your picture.")}
          <div class="draw" style="height:40mm"></div></section>`);
        break;
      case "written":
        html.push(`<section>${part(s.question, "Write your answer in a full sentence.")}${lines(2)}</section>`);
        key.push(`<li>${esc(s.question)} <b>${esc(s.answer)}</b></li>`);
        break;
      case "meanings":
        html.push(`<section>${part("Word meanings", "Write the letter of the right meaning next to each word.")}
          <div class="means"><div>${s.words.map((w) => `<div class="mword"><span class="numbox"></span><b>${esc(w)}</b></div>`).join("")}</div>
          <div>${s.meanings.map((m) => `<div class="mdef"><b>${m.letter}</b> ${esc(m.text)}</div>`).join("")}</div></div></section>`);
        key.push(`<li>Word meanings: ${s.words.map((w) => `${esc(w)} <b>${s.meanings.find((m) => m.word === w)?.letter ?? ""}</b>`).join(" · ")}</li>`);
        break;
      case "hunt":
        html.push(`<section>${part("Word hunt", "Find the word in the story that means…")}
          ${s.items.map((h) => `<div class="hunt"><span>“${esc(h.meaning)}” <small>(it starts with <b>${esc(h.first)}</b>)</small></span><span class="line"></span></div>`).join("")}</section>`);
        key.push(`<li>Word hunt: ${s.items.map((h, i) => `${i + 1}. <b>${esc(h.answer)}</b>`).join(" · ")}</li>`);
        break;
      case "next":
        html.push(`<section>${part("What happens next?", "What do you think happens after the story ends?")}${lines(2)}</section>`);
        break;
      case "summary":
        html.push(`<section>${part("Tell the story in one sentence", "Who is it about, and what happens?")}${lines(2)}</section>`);
        break;
    }
  }

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
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 3px solid #668C4A; padding-bottom: 6px; }
  header h1 { margin: 0; font-size: 22pt; color: #0A4F29; line-height: 1.05; }
  header .meta { font-size: 11pt; color: #5b6b5f; margin-top: 4px; }
  .who { font-size: 13pt; text-align: right; line-height: 1.9; white-space: nowrap; }
  .who span { display: inline-block; min-width: 46mm; border-bottom: 1.5px solid #333; text-align: left; padding-left: 4px; }
  section { margin-top: 3mm; break-inside: avoid; }
  h2 { font-size: 14pt; margin: 0 0 2mm; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: #0A4F29; }
  h2 small { font-size: 10.5pt; font-weight: 400; color: #5b6b5f; }
  h2 .n { background: #668C4A; color: #fff; border-radius: 50%; width: 9mm; height: 9mm; display: inline-grid; place-items: center; font-size: 13pt; flex: none; }
  .story { line-height: 1.5; border: 2px solid #e2ecd9; border-radius: 4mm; padding: 3mm 4mm; background: #fbfdf8; }
  .pic { font-size: 1.5em; line-height: 1; } .pic.big { font-size: 2em; }
  .ticks { display: flex; gap: 6mm; flex-wrap: wrap; font-size: 15pt; }
  .tick { display: flex; align-items: center; gap: 3mm; border: 2px solid #e2ecd9; border-radius: 4mm; padding: 1.5mm 4mm; }
  .box { width: 8mm; height: 8mm; border: 2px solid #333; border-radius: 1.5mm; display: inline-block; }
  .circle { display: flex; align-items: center; gap: 6mm; font-size: 14.5pt; margin: 1mm 0; flex-wrap: wrap; }
  .circle .target { font-weight: 700; display: inline-flex; align-items: center; gap: 2mm; min-width: 38mm; background: #fff6d6; border-radius: 3mm; padding: 1mm 3mm; }
  .circle .arrow { color: #9aa79d; } .circle .cand { padding: 1mm 3mm; }
  .match { font-size: 16pt; }
  .mrow { display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }
  .mrow.pics { margin-top: 10mm; }
  .mcell { display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
  .dot { width: 4mm; height: 4mm; border-radius: 50%; background: #333; flex: none; }
  .traces { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm 6mm; }
  .trace { display: flex; flex-direction: column; align-items: flex-start; gap: 0; } .trace .line { width: 100%; flex: none; }
  .tw { display: flex; align-items: center; gap: 2mm; }
  .ghost { font-size: 24pt; color: #c9cfca; letter-spacing: 2px; font-weight: 400; }
  .line { flex: 1; height: 10mm; border-bottom: 2px solid #333; background: linear-gradient(to bottom, transparent 46%, #d3d8d4 46%, #d3d8d4 49%, transparent 49%); display: block; }
  .line.wide { margin-top: 2mm; }
  .yn { display: grid; grid-template-columns: 1fr 16mm 16mm; align-items: center; gap: 3mm; font-size: 14pt; margin: 1.5mm 0; }
  .yo { border: 2px solid #333; border-radius: 999px; text-align: center; font-weight: 700; padding: 0.5mm 0; }
  .bank { display: flex; gap: 4mm; flex-wrap: wrap; border: 2px dashed #668C4A; border-radius: 4mm; padding: 3mm 4mm; font-size: 15pt; font-weight: 700; margin-bottom: 2mm; }
  .bank span { background: #eef6e8; border-radius: 3mm; padding: 1mm 4mm; }
  .blank { font-size: 14pt; line-height: 1.85; margin: 0.5mm 0; }
  .gap { display: inline-block; min-width: 34mm; border-bottom: 2px solid #333; }
  .pick { font-weight: 700; color: #0A4F29; white-space: nowrap; }
  .ord { display: flex; align-items: center; gap: 4mm; font-size: 13.5pt; margin: 2mm 0; }
  .numbox { flex: none; width: 10mm; height: 10mm; border: 2px solid #333; border-radius: 2mm; display: inline-block; }
  .draw { border: 2px solid #333; border-radius: 4mm; }
  .means { display: grid; grid-template-columns: 50mm 1fr; gap: 6mm; font-size: 13pt; }
  .mword { display: flex; align-items: center; gap: 3mm; margin: 2.5mm 0; font-size: 14pt; }
  .mdef { margin: 2.2mm 0; line-height: 1.35; } .mdef b { color: #0A4F29; margin-right: 2mm; }
  .hunt { display: grid; grid-template-columns: 1fr 50mm; gap: 4mm; align-items: end; font-size: 13pt; margin: 1.5mm 0; }
  .hunt small { color: #5b6b5f; }
  footer { margin-top: 4mm; font-size: 9pt; color: #8a978d; text-align: center; }
  .key { font-family: Arial, sans-serif; } .key h1 { font-size: 18pt; } .key li { margin: 3mm 0; font-size: 12pt; }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .sheet { margin: 0; box-shadow: none; width: auto; min-height: 0; padding: 0; }
    .sheet.t1 { zoom: 0.92; }   /* Level 1 on one page */
    .key { break-before: page; }
    body:not(.with-key) .key { display: none; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="bar">
  <button onclick="window.print()">🖨️ Print worksheet</button>
  <label><input type="checkbox" onchange="document.body.classList.toggle('with-key', this.checked)"> Also print the answer key (for you)</label>
</div>
<div class="sheet t${ws.tier}">
  <header>
    <div><h1>${esc(passage.emoji)} ${esc(passage.title)}</h1>
      <div class="meta">${esc(input.level.grade)} story · ${passage.lexile ? lexileLabel(passage.lexile) + " · " : ""}Worksheet level ${ws.tier}</div></div>
    <div class="who">Name: <span>${esc(childName)}</span><br>Date: <span>${esc(today)}</span></div>
  </header>
  ${html.join("\n")}
  ${ws.tier === 1 ? "" : `<footer>Phonics Pals &amp; Guided Reading · Zera International School</footer>`}
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
