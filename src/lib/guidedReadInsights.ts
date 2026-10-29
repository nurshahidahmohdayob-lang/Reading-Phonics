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
            tip: `Read “${w.replace(/'s$/, "")}” first, then add the s. It shows something belongs to someone.`,
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
          ? "Cover the -ed, read the base word, then add it back. Remember -ed can sound like /t/, /d/ or /id/."
          : `Cover the -${suffix}, read the base word, then add the ending back.`,
    });
  }
  const syl = syllables(plain);
  if (syl >= 3) {
    out.push({
      label: `Long word (${syl} syllables)`,
      tip: "Clap it out, read one part at a time, then put it together.",
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
      /^[^aeiou]*([aiou])[bcdfgklmnprstvz]$/.exec(stem)) ||
    // A longer word whose e went before the ending: "retired", "admiring".
    (suffix && /^(ed|ing|er|est)$/.test(suffix) && /[^aeiou]([aiou])r$/.exec(stem));
  if (split) {
    out.push({
      label: `Split vowel (${split[1]}-e)`,
      tip: suffix
        ? `There was an e before the ending (${stem}e). It makes the ${split[1]} say its name.`
        : `The e at the end makes the ${split[1]} say its name.`,
    });
  }
  const team = /(eau|igh|ai|ay|ee|ea|oa|oe|ie|ou|ow|oi|oy|au|aw|ew|ue|oo)/.exec(plain);
  if (team) {
    out.push({
      label: `Vowel team ${team[1]}`,
      tip: `${team[1]} work together to make one sound.`,
    });
  }
  const r = /(ar|er|ir|or|ur)(?![aeiou])/.exec(stem);
  if (r && !split) {
    out.push({ label: `${r[1]} sound`, tip: `The r changes the vowel, so ${r[1]} is read as one sound.` });
  }
  if (/^(kn|wr|gn)|mb$|gh(?!o)|(?<=s)ce?n|stle$/.test(plain)) {
    out.push({ label: "Silent letter", tip: "One letter is written but not said." });
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

const NUMBER = ["no", "one", "two", "three", "four", "five", "six"];
const count = (n: number) => NUMBER[n] ?? String(n);
const listWords = (ws: string[]) => {
  const q = ws.map((w) => `“${w}”`);
  return q.length > 1 ? `${q.slice(0, -1).join(", ")} and ${q[q.length - 1]}` : q.join("");
};
/** "up 3%", "down 5 words a minute", "the same". */
const moved = (n: number, unit: string) =>
  n === 0 ? "the same" : `${n > 0 ? "up" : "down"} ${Math.abs(n)}${unit}`;

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
      ? `${wrong}, about 1 in every ${Math.max(1, Math.round(read.total / wrong))} words`
      : "none",
  });
  if (marked && reached < read.total) {
    facts.push({ label: "How far", value: `stopped after ${reached} of ${read.total} words` });
  }
  if (level) {
    const pace = paceLike(read.wcpm);
    facts.push({
      label: "Reading speed",
      value: `${read.wcpm} words a minute. The ${level.grade} target is ${level.wpmLow} to ${level.wpmHigh}${pace ? `, so this is ${pace}` : ""}.`,
    });
    const gap = read.accuracy - level.accuracyGoal;
    const short = Math.ceil((level.accuracyGoal / 100) * read.total - read.correct);
    facts.push({
      label: "Accuracy",
      value:
        gap >= 0
          ? `${read.accuracy}%, which meets the ${level.grade} target of ${level.accuracyGoal}%.`
          : `${read.accuracy}%. The ${level.grade} target is ${level.accuracyGoal}%` +
            (wrong && short > 0 ? `, so ${count(short)} fewer mistake${short === 1 ? "" : "s"} would get there.` : "."),
    });
  }
  if (childLexile !== null && read.lexile) {
    const d = read.lexile - childLexile;
    facts.push({
      label: "Story level",
      value:
        `${read.lexile}L against ${first}'s ${childLexile}L, ` +
        (Math.abs(d) <= 50 ? "about right." : d > 0 ? `so ${d}L harder.` : `so ${-d}L easier.`),
    });
  }

  // The missed words.
  const words = missedWords.map((w) => ({ word: w, patterns: patternsOf(w) }));
  const counts = new Map<string, number>();
  for (const w of words) {
    const kinds = new Set(
      w.patterns.map((p) =>
        p.label.startsWith("Ending") ? "an ending like -ed or -ing" :
        p.label.startsWith("Long word") ? "three or more syllables" :
        p.label.startsWith("Apostrophe") || p.label === "Contraction" ? "an apostrophe" :
        p.label.startsWith("Vowel team") ? "a vowel team" :
        p.label.endsWith(" sound") ? "an r sound like ar, er or or" :
        p.label.startsWith("Split vowel") ? "a split vowel like a-e or i-e" :
        p.label.startsWith("Soft") || p.label === "ch says /k/" ? "a letter that doesn't make its usual sound" :
        p.label.toLowerCase(),
      ),
    );
    for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const common = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const wordSummary =
    words.length >= 2
      ? common.map(([k, n]) => `${n === words.length ? `All ${words.length}` : `${n} of the ${words.length}`} have ${k}`)
      : [];

  // Their earlier reads.
  const sorted = [...history].sort((a, b) => (a.at < b.at ? -1 : 1));
  const at = sorted.findIndex((r) => r.at === read.at && r.passageId === read.passageId);
  const before = at > 0 ? sorted[at - 1] : null;
  const sameBefore = sorted
    .slice(0, Math.max(0, at))
    .reverse()
    .find((r) => r.passageId === read.passageId);
  const compare = sameBefore ?? before;
  let change: string | null = null;
  if (compare) {
    const da = read.accuracy - compare.accuracy;
    const dw = read.wcpm - compare.wcpm;
    const verdictLine =
      da >= 0 && dw > 0 ? "Good progress." :
      da < 0 && dw < 0 ? "Not as strong as last time." :
      "";
    change =
      (sameBefore
        ? `Compared with reading this story on ${shortDate(compare.at)}, `
        : `Compared with the last read (“${compare.title}”, ${shortDate(compare.at)}), `) +
      `accuracy is ${moved(da, "%")} and speed is ${moved(dw, dw === 0 ? "" : " words a minute")}.` +
      (verdictLine ? ` ${verdictLine}` : "");
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

  // The comment, written the way a teacher would jot it down.
  const parts: string[] = [];
  const title = `“${read.title}”`;
  parts.push(
    verdict?.label === "Independent"
      ? `${first} read ${title} (${read.grade}) well and got ${read.accuracy}% of the words right.`
      : verdict?.label === "Instructional"
        ? `${first} read ${title} (${read.grade}) with ${read.accuracy}% accuracy, so this level is about right for guided reading.`
        : verdict
          ? `${first} found ${title} (${read.grade}) hard and got ${read.accuracy}% of the words right.`
          : `${first} read ${title} (${read.grade}) with ${read.accuracy}% accuracy.`,
  );
  if (level) {
    const ratio = read.wcpm / level.wpmLow;
    parts.push(
      read.wcpm > level.wpmHigh
        ? `Reading was quick at ${read.wcpm} words a minute.`
        : ratio >= 1
          ? `Reading speed was good at ${read.wcpm} words a minute.`
          : ratio >= 0.75
            ? `Reading was a little slow at ${read.wcpm} words a minute, just under the ${level.grade} target.`
            : `Reading was slow at ${read.wcpm} words a minute (the ${level.grade} target is ${level.wpmLow}), so fluency is the main thing to work on.`,
    );
  }
  if (missedWords.length) {
    const shown = missedWords.slice(0, 4);
    parts.push(
      `${missedWords.length === 1 ? "The word that caused trouble was" : "Words that caused trouble were"} ${listWords(shown)}${missedWords.length > shown.length ? " and a few others" : ""}.`,
    );
    if (common.length && words.length >= 2) {
      const [k, n] = common[0];
      parts.push(`${n === words.length ? (n === 2 ? "Both" : "All of them") : `${count(n).replace(/^./, (c) => c.toUpperCase())} of them`} ${n === 1 ? "has" : "have"} ${k}.`);
    }
  } else if (marked && !wrong) {
    parts.push("No mistakes at all.");
  }
  if (change) parts.push(change);

  // Next steps.
  const steps: string[] = [];
  const fast = level ? read.wcpm >= level.wpmLow : true;
  if (verdict?.label === "Independent") {
    steps.push(fast ? "Move up to the next level." : "Stay at this level a little longer to build speed, then move up.");
  } else if (verdict?.label === "Instructional") {
    steps.push("Stay at this level for guided reading. Go through the tricky words before starting the next story.");
  } else if (verdict) {
    steps.push("Drop down a level for now. Read this story together first before trying it alone again.");
  }
  if (level && read.wcpm < level.wpmLow) {
    steps.push(
      read.wcpm / level.wpmLow < 0.75
        ? `Repeated reading of this story three times this week. I read a sentence and ${first} echoes it, then we read together, then ${first} reads alone.`
        : "Reread this story once or twice, pausing at full stops and commas.",
    );
  } else if (level && read.wcpm > level.wpmHigh) {
    steps.push("Read one page aloud with expression, watching for full stops.");
  }
  // Word work, with their own words as the examples.
  const withKind = (start: string) =>
    listWords(
      words
        .filter((w) => w.patterns.some((p) => p.label.startsWith(start)))
        .map((w) => w.word)
        .slice(0, 3),
    );
  const endings = withKind("Ending");
  if (endings) steps.push(`Endings: cover the ending on ${endings}, read the base word, then add the ending back.`);
  const long = withKind("Long word");
  if (long) steps.push(`Long words: clap out ${long} in syllables, then blend.`);
  const apostrophe = withKind("Apostrophe");
  if (apostrophe) steps.push(`Go over the 's in ${apostrophe} and what it means.`);
  if (missedWords.length) {
    steps.push(`Word cards for ${listWords(missedWords.slice(0, 6))}. Practise daily, then use each one in a sentence.`);
  }
  if (marked && reached < read.total) {
    steps.push("Didn't finish the story. Use shorter stories at this level to build stamina.");
  }
  steps.push("Ask a few questions about the story (who, what happened, why) or use the worksheet.");

  return {
    summary: parts.join(" "),
    facts,
    words,
    wordSummary,
    history: historyBlock,
    nextSteps: steps,
  };
}
