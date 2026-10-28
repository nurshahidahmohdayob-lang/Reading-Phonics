/* The detail behind one guided read, for the reading report on screen and
   in print (components/GuidedReadReport, lib/guidedReadPrint): what the
   marks mean, how fast against each year's goal, what the missed words have
   in common, how it compares with the child's earlier reads, and what to do
   next. All worked out from what the read saved — nothing is guessed about
   words the child read correctly. */

import type { GuidedRead } from "./guidedLog";
import type { AccuracyVerdict } from "@/app/stories";
import { passageLevels } from "@/app/passages";

/** The level numbers the report judges by (a PassageLevel, or its source). */
type LevelLike = {
  grade: string;
  wpmLow: number;
  wpmHigh: number;
  accuracyGoal: number;
};

export type WordPattern = { label: string; tip: string };
export type WordNote = { word: string; patterns: WordPattern[] };

export type ReadDetail = {
  summary: string;
  facts: { label: string; value: string }[];
  words: WordNote[];
  /** "2 of 3 words had an ending" — what the missed words share. */
  wordSummary: string[];
  history: {
    rows: {
      date: string;
      title: string;
      grade: string;
      accuracy: number;
      wcpm: number;
      current: boolean;
    }[];
    /** Since the read before this one. */
    change: string | null;
  } | null;
  nextSteps: string[];
};

/* ---------- the missed words ---------- */

const clean = (w: string) =>
  w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z'-]/g, "");

/** Rough syllables: vowel groups, less a silent final e. */
function syllables(word: string): number {
  const w = word.replace(/'s$/, "").replace(/[^a-z]/g, "");
  if (!w) return 0;
  let n = (w.match(/[aeiouy]+/g) ?? []).length;
  if (/[^aeiou]e$/.test(w) && !/le$/.test(w) && n > 1) n--;
  if (/[^aeiou]ed$/.test(w) && !/[td]ed$/.test(w) && n > 1) n--;
  return Math.max(1, n);
}

/* Endings a child can cover with a finger and add back. Not -ive, -ous and
   the like: "archive" isn't "arch" + "ive" to a reader. */
const SUFFIX = /(ing|ed|er|est|ly|ful|less|ness|ment|tion|sion|es|s)$/;

/** The word without its ending, when what's left is still a word-sized
    base ("retired" → "retir", good enough to look for patterns in). */
function base(w: string): { stem: string; suffix: string | null } {
  const m = SUFFIX.exec(w);
  if (m && w.length - m[1].length >= 3 && !/(ss|us|is)$/.test(w)) {
    return { stem: w.slice(0, -m[1].length), suffix: m[1] };
  }
  return { stem: w, suffix: null };
}

function patternsOf(raw: string): WordPattern[] {
  const w = clean(raw);
  const out: WordPattern[] = [];
  if (!w) return out;

  if (/'/.test(w)) {
    out.push(
      /'s$/.test(w)
        ? {
            label: "Apostrophe 's",
            tip: `Read “${w.replace(/'s$/, "")}”, then add the s — it means “belonging to”.`,
          }
        : {
            label: "Contraction",
            tip: "Say the two words it's made from, then squeeze them together.",
          },
    );
  }
  const plain = w.replace(/'.*$/, "");
  const { stem, suffix } = base(plain);
  if (suffix && !["s", "es"].includes(suffix)) {
    out.push({
      label: `Ending -${suffix}`,
      tip:
        suffix === "ed"
          ? "Cover the -ed, read the base word, then add it back. -ed can sound like /t/, /d/ or /id/."
          : `Cover the -${suffix}, read the base word, then add the ending back.`,
    });
  }
  const syl = syllables(plain);
  if (syl >= 3) {
    out.push({
      label: `Long word (${syl} syllables)`,
      tip: "Clap it in parts, read each part, then blend them together.",
    });
  }
  if (/(arch[ia]|chor|chem|chao|chara|sch|tech|ache|echo|stomach|orchestr)/.test(plain)) {
    out.push({ label: "ch says /k/", tip: "Here ch sounds like k, as in “echo”." });
  } else if (/c[eiy]/.test(plain)) {
    out.push({ label: "Soft c", tip: "c before e, i or y usually says /s/." });
  }
  if (/ph/.test(plain)) {
    out.push({ label: "ph says /f/", tip: "ph makes the /f/ sound, as in “phone”." });
  }
  if (/g[eiy]/.test(plain) && !/(get|give|girl|gift|gear|geese)/.test(plain)) {
    out.push({ label: "Soft g", tip: "g before e, i or y often says /j/." });
  }
  // A split vowel: "time", or one whose e went when an ending came
  // ("retire" → "retired", "hope" → "hoping").
  const split =
    (!suffix && /[^aeiou]([aiou])[bcdfgklmnprstvz]e$/.exec(plain)) ||
    (suffix &&
      /^(ed|ing|er|est)$/.test(suffix) &&
      syllables(stem) === 1 &&
      /^[^aeiou]*([aiou])[bcdfgklmnprstvz]$/.exec(stem));
  if (split) {
    out.push({
      label: `Split vowel (${split[1]}-e)`,
      tip: `The e (even when an ending has replaced it) makes the ${split[1]} say its name.`,
    });
  }
  const team = /(eau|igh|ai|ay|ee|ea|oa|oe|ie|ou|ow|oi|oy|au|aw|ew|ue|oo)/.exec(plain);
  if (team) {
    out.push({
      label: `Vowel team ${team[1]}`,
      tip: `${team[1]} makes one sound together — say that sound, not two.`,
    });
  }
  const r = /(ar|er|ir|or|ur)(?![aeiou])/.exec(stem);
  if (r && !split) {
    out.push({ label: `${r[1]} sound`, tip: `The r changes the vowel: ${r[1]} is one sound.` });
  }
  if (/^(kn|wr|gn)|mb$|gh(?!o)|(?<=s)ce?n|stle$/.test(plain)) {
    out.push({ label: "Silent letter", tip: "One letter here is written but not said." });
  }
  // Keep it to the most useful few.
  return out.slice(0, 3);
}

/* ---------- pace against the years ---------- */

/** The year whose reading-aloud pace this matches. */
function paceLike(wcpm: number): string {
  const years = passageLevels.filter((l) => /^Year \d/.test(l.grade));
  if (!years.length) return "";
  if (wcpm < years[0].wpmLow) return `below the Year 1 pace (${years[0].wpmLow}+)`;
  const top = years[years.length - 1];
  if (wcpm > top.wpmHigh) return `faster than the ${top.grade} pace`;
  for (const y of years) {
    if (wcpm >= y.wpmLow && wcpm <= y.wpmHigh) return `the pace expected in ${y.grade}`;
  }
  // Between bands: say the one just below.
  const below = [...years].reverse().find((y) => wcpm > y.wpmHigh);
  return below ? `a little above the ${below.grade} pace` : "";
}

function minutesSeconds(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60} s` : `${s} s`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------- the whole detail ---------- */

export function readDetail({
  name,
  read,
  level,
  verdict,
  childLexile,
  missedWords,
  marked,
  reached,
  history,
}: {
  name: string;
  read: GuidedRead;
  level: LevelLike | null;
  verdict: AccuracyVerdict | null;
  /** Their reading level from their latest assessment. */
  childLexile: number | null;
  /** Each word they couldn't read, once. */
  missedWords: string[];
  /** Whether which words were missed was kept for this read. */
  marked: boolean;
  reached: number;
  /** Every read by this child, any order. */
  history: GuidedRead[];
}): ReadDetail {
  const first = name.split(/\s+/)[0] || name;
  const wrong = read.total - read.correct;
  const facts: ReadDetail["facts"] = [];

  // Time: the words they read correctly, at their words-correct-per-minute.
  if (read.wcpm > 0 && read.correct > 0) {
    facts.push({ label: "Time reading", value: `about ${minutesSeconds((read.correct / read.wcpm) * 60)}` });
  }
  facts.push({
    label: "Errors",
    value: wrong
      ? `${wrong} — about 1 in every ${Math.max(1, Math.round(read.total / wrong))} words`
      : "none",
  });
  if (marked && reached < read.total) {
    facts.push({ label: "How far", value: `stopped after ${reached} of ${read.total} words` });
  }
  if (level) {
    const pct = Math.round((read.wcpm / level.wpmLow) * 100);
    facts.push({
      label: "Reading speed",
      value: `${read.wcpm} words a minute — ${pct}% of the ${level.grade} goal (${level.wpmLow}–${level.wpmHigh}); ${paceLike(read.wcpm)}`,
    });
    const gap = read.accuracy - level.accuracyGoal;
    facts.push({
      label: "Accuracy",
      value:
        gap >= 0
          ? `${read.accuracy}% — meets the ${level.grade} goal of ${level.accuracyGoal}%`
          : `${read.accuracy}% — ${-gap}% short of the ${level.grade} goal of ${level.accuracyGoal}%` +
            (wrong ? ` (${Math.ceil((level.accuracyGoal / 100) * read.total - read.correct)} fewer error${Math.ceil((level.accuracyGoal / 100) * read.total - read.correct) === 1 ? "" : "s"} would reach it)` : ""),
    });
  }
  if (childLexile !== null && read.lexile) {
    const d = read.lexile - childLexile;
    facts.push({
      label: "Story vs their level",
      value:
        Math.abs(d) <= 50
          ? `on their level (story ${read.lexile}L, theirs ${childLexile}L)`
          : d > 0
            ? `${d}L harder than their level (story ${read.lexile}L, theirs ${childLexile}L)`
            : `${-d}L easier than their level (story ${read.lexile}L, theirs ${childLexile}L)`,
    });
  }

  // The missed words.
  const words = missedWords.map((w) => ({ word: w, patterns: patternsOf(w) }));
  const counts = new Map<string, number>();
  for (const w of words) {
    const kinds = new Set(
      w.patterns.map((p) =>
        p.label.startsWith("Ending") ? "an ending (-ed, -ing…)" :
        p.label.startsWith("Long word") ? "three or more syllables" :
        p.label.startsWith("Apostrophe") || p.label === "Contraction" ? "an apostrophe" :
        p.label.startsWith("Vowel team") ? "a vowel team" :
        p.label.endsWith(" sound") ? "an r-controlled vowel (ar, er, ir, or, ur)" :
        p.label.startsWith("Split vowel") ? "a split vowel (a-e, i-e…)" :
        p.label.startsWith("Soft") || p.label === "ch says /k/" ? "a letter that changes its sound (soft c/g, ch as /k/)" :
        p.label,
      ),
    );
    for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const wordSummary =
    words.length >= 2
      ? [...counts.entries()]
          .filter(([, n]) => n >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k, n]) => `${n} of ${words.length} had ${k}`)
      : [];

  // Their earlier reads.
  const sorted = [...history].sort((a, b) => (a.at < b.at ? -1 : 1));
  const at = sorted.findIndex((r) => r.at === read.at && r.passageId === read.passageId);
  const before = at > 0 ? sorted[at - 1] : null;
  const sameBefore = sorted
    .slice(0, Math.max(0, at))
    .reverse()
    .find((r) => r.passageId === read.passageId);
  let change: string | null = null;
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  if (sameBefore) {
    change = `Last time on this story (${shortDate(sameBefore.at)}): ${sameBefore.accuracy}% and ${sameBefore.wcpm} a minute — now ${sign(read.accuracy - sameBefore.accuracy)}% accuracy, ${sign(read.wcpm - sameBefore.wcpm)} words a minute.`;
  } else if (before) {
    change = `Since their last read (${before.title}, ${before.grade}, ${shortDate(before.at)}): ${sign(read.accuracy - before.accuracy)}% accuracy, ${sign(read.wcpm - before.wcpm)} words a minute.`;
  }
  const recent = sorted.slice(Math.max(0, at - 5), at + 1);
  const historyBlock =
    sorted.length > 1 && at >= 0
      ? {
          rows: recent
            .map((r) => ({
              date: shortDate(r.at),
              title: r.title,
              grade: r.grade,
              accuracy: r.accuracy,
              wcpm: r.wcpm,
              current: r === sorted[at],
            }))
            .reverse(),
          change,
        }
      : null;

  // Summary.
  const parts: string[] = [];
  parts.push(
    `${first} read “${read.title}” (${read.grade}${read.lexile ? `, ${read.lexile}L` : ""}) with ${read.accuracy}% accuracy` +
      (verdict ? ` — ${verdict.label.toLowerCase()} level for this story` : "") +
      ".",
  );
  if (level) {
    const ratio = read.wcpm / level.wpmLow;
    parts.push(
      ratio >= 1
        ? `Reading speed (${read.wcpm} a minute) is on track for ${level.grade}.`
        : ratio >= 0.75
          ? `Reading speed (${read.wcpm} a minute) is a little below the ${level.grade} goal.`
          : `Reading speed (${read.wcpm} a minute) is well below the ${level.grade} goal of ${level.wpmLow}–${level.wpmHigh}, so the main thing to build is smooth, quicker reading.`,
    );
  }
  if (wordSummary.length) {
    parts.push(`The words that tripped them up have something in common: ${wordSummary[0]}.`);
  }
  if (change) parts.push(change);

  // Next steps.
  const steps: string[] = [];
  const fast = level ? read.wcpm >= level.wpmLow : true;
  if (verdict?.label === "Independent") {
    steps.push(
      fast
        ? "Ready for harder stories: try one from the next level up."
        : "Accurate enough to read this level alone. Stay here to build speed before moving up.",
    );
  } else if (verdict?.label === "Instructional") {
    steps.push(
      "This level is right for guided reading: stay here with support. Before the next story, go over its harder words first.",
    );
  } else if (verdict) {
    steps.push(
      "This story was too hard to read alone. Try one a level down, and read this one together first.",
    );
  }
  if (level && read.wcpm < level.wpmLow) {
    const ratio = read.wcpm / level.wpmLow;
    steps.push(
      ratio < 0.75
        ? `Build fluency with repeated reading: read this same story three times this week — first you read a sentence and ${first} echoes it, then together, then ${first} alone. Aim for about 10 more words a minute each time.`
        : "Re-read this story once or twice, pausing at full stops and commas, to make it smoother and a little quicker.",
    );
  } else if (level && read.wcpm > level.wpmHigh) {
    steps.push("Quick reader: check they aren't rushing past full stops — ask them to read one paragraph with expression.");
  }
  // Word work, with their own words as the examples.
  const withKind = (start: string) =>
    words
      .filter((w) => w.patterns.some((p) => p.label.startsWith(start)))
      .map((w) => `“${w.word}”`)
      .slice(0, 3)
      .join(", ");
  const endings = withKind("Ending");
  if (endings) steps.push(`Practise endings with ${endings}: cover the ending, read the base word, then add the ending back.`);
  const long = withKind("Long word");
  if (long) steps.push(`Practise long words like ${long}: clap the syllables, read each part, then blend them together.`);
  const apostrophe = withKind("Apostrophe");
  if (apostrophe) steps.push(`Talk about apostrophes in ${apostrophe}: 's shows something belongs to someone.`);
  if (missedWords.length) {
    steps.push(`Make word cards for ${missedWords.slice(0, 6).map((w) => `“${w}”`).join(", ")}: read them daily until they're quick, then use each in a sentence.`);
  }
  if (marked && reached < read.total) {
    steps.push("They didn't finish: build stamina with shorter stories at this level, then come back to this one.");
  }
  steps.push("Check understanding: ask who the story was about, what happened, and why — or print the worksheet on this story.");

  return {
    summary: parts.join(" "),
    facts,
    words,
    wordSummary,
    history: historyBlock,
    nextSteps: steps,
  };
}
