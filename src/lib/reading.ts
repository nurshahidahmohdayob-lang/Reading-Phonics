export type WordStatus = "correct" | "missed" | "pending";

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
  "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
  "18": "eighteen", "19": "nineteen", "20": "twenty", "30": "thirty",
  "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy",
  "80": "eighty", "90": "ninety", "100": "hundred",
};

/** Strip punctuation/case so spoken and written words can be compared.
    The recogniser writes numbers as digits ("ten" -> "10"), so digits are
    converted back to words first. */
export function normalize(word: string): string {
  const digits = word.replace(/[^0-9]/g, "");
  if (digits && !/[a-z]/i.test(word)) {
    return NUMBER_WORDS[digits] ?? digits;
  }
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Fold away accent differences so reading counts even without "perfect"
 * English pronunciation (th→t for "tink/dis", end-sound devoicing d→t and
 * g→k, ph→f, silent wh, doubled letters). Both the target word and what the
 * recogniser heard get folded before comparing.
 */
export function accentFold(word: string): string {
  return word
    .replace(/ch/g, "1") // protect ch before the c/k merge
    .replace(/th/g, "t")
    .replace(/ph/g, "f")
    .replace(/wh/g, "w")
    .replace(/d/g, "t")
    .replace(/g/g, "k")
    .replace(/c/g, "k")
    .replace(/z/g, "s")
    .replace(/1/g, "ch")
    .replace(/([a-z])\1+/g, "$1");
}

/** The consonant skeleton: vowels carry most of the accent variation, so
    "Sam" heard as "some"/"sum" still matches on s‑m. */
function skeleton(word: string): string {
  return accentFold(word).replace(/[aeiou]/g, "");
}

/* Single-letter words: saying the letter's phonics sound counts too. */
const LETTER_SAYS: Record<string, string[]> = {
  a: ["a", "ah", "uh", "ay", "er"],
  i: ["i", "eye", "ai"],
};

/** True when a spoken word is close enough to count as reading the target. */
export function lenientMatch(target: string, spoken: string): boolean {
  if (target === spoken) return true;
  if (!target || !spoken) return false;
  if (LETTER_SAYS[target]?.includes(spoken)) return true;
  // The recogniser loves adding plurals/possessives ("Sam" -> "Sam's").
  if (target + "s" === spoken || spoken + "s" === target) return true;
  const t = accentFold(target);
  const s = accentFold(spoken);
  if (t === s) return true;
  // Same consonant frame = same word through an accent ("sam"/"sum"/"some").
  const sk = skeleton(target);
  if (sk.length >= 2 && sk === skeleton(spoken)) return true;
  const len = Math.max(t.length, s.length);
  const d = editDistance(t, s);
  return len >= 7 ? d <= 2 : len >= 4 ? d <= 1 : false;
}

/**
 * Greedily align the words a child spoke against the target passage,
 * marking each target word correct / missed / not-yet-read. Mirrors how
 * Reading Progress tracks accuracy as a child reads aloud.
 */
export function alignReading(
  targetWords: string[],
  spokenWords: string[],
): WordStatus[] {
  const status: WordStatus[] = targetWords.map(() => "pending");
  const target = targetWords.map(normalize);
  const WINDOW = 5; // how far ahead we'll look to forgive a skipped word
  let ti = 0;
  const leftovers: string[] = [];
  const spoken = spokenWords.map(normalize).filter(Boolean);

  const findMatch = (sw: string) => {
    for (let k = ti; k <= Math.min(target.length - 1, ti + WINDOW); k++) {
      if (lenientMatch(target[k], sw)) return k;
    }
    return -1;
  };

  for (let si = 0; si < spoken.length; si++) {
    const sw = spoken[si];
    let matchedAt = findMatch(sw);
    // "into" often arrives as "in" + "to": try the joined pair too.
    if (matchedAt < 0 && si + 1 < spoken.length) {
      const joined = findMatch(sw + spoken[si + 1]);
      if (joined >= 0) {
        matchedAt = joined;
        si++; // consume both halves
      }
    }
    if (matchedAt >= 0) {
      for (let j = ti; j < matchedAt; j++) status[j] = "missed";
      status[matchedAt] = "correct";
      ti = matchedAt + 1;
    } else {
      leftovers.push(sw);
    }
  }

  // Rescue pass: recognition sometimes garbles the order or merges words.
  // Any target still marked missed/pending can be claimed by an unused
  // spoken word, wherever it appeared.
  for (let k = 0; k < target.length; k++) {
    if (status[k] === "correct") continue;
    const hit = leftovers.findIndex((sw) => lenientMatch(target[k], sw));
    if (hit >= 0) {
      status[k] = "correct";
      leftovers.splice(hit, 1);
    }
  }

  // Softer rescue: heavily garbled words still claim a 60%-similar leftover.
  for (let k = 0; k < target.length; k++) {
    if (status[k] === "correct") continue;
    const hit = leftovers.findIndex(
      (sw) => similarity(accentFold(target[k]), accentFold(sw)) >= 0.6,
    );
    if (hit >= 0) {
      status[k] = "correct";
      leftovers.splice(hit, 1);
    }
  }

  // Dropout forgiveness: the speech engine restarts now and then and loses a
  // couple of words mid-flow. A short unheard gap (<=2 words) sitting between
  // correctly-read words was almost certainly read too — credit it. Longer
  // gaps stay marked, since those look like genuinely skipped lines.
  let k = 0;
  while (k < target.length) {
    if (status[k] === "correct") {
      k++;
      continue;
    }
    const runStart = k;
    while (k < target.length && status[k] !== "correct") k++;
    const runLen = k - runStart;
    const beforeOk = runStart === 0 || status[runStart - 1] === "correct";
    const afterOk = k >= target.length || status[k] === "correct";
    if (runLen <= 2 && beforeOk && afterOk) {
      for (let j = runStart; j < k; j++) status[j] = "correct";
    }
  }
  return status;
}

/** Levenshtein edit distance between two strings. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/** 0..1 similarity between two words (1 = identical). */
export function similarity(a: string, b: string): number {
  const A = normalize(a);
  const B = normalize(b);
  if (!A && !B) return 1;
  if (!A || !B) return 0;
  return 1 - editDistance(A, B) / Math.max(A.length, B.length);
}

export type Rating = "green" | "yellow" | "red";

/**
 * Rate how well a child said a target word against what speech recognition
 * heard: green = correct, yellow = close/partial, red = needs work.
 */
export function rateAttempt(target: string, spokenWords: string[]): Rating {
  const t = normalize(target);
  let best = 0;
  for (const w of spokenWords) {
    const s = normalize(w);
    // Accent-tolerant: a recognisable reading earns green right away.
    if (lenientMatch(t, s)) return "green";
    best = Math.max(best, similarity(accentFold(t), accentFold(s)));
  }
  if (best >= 0.75) return "green";
  if (best >= 0.45) return "yellow";
  return "red";
}

export type ReadingReport = {
  total: number;
  correct: number;
  missed: number;
  attempted: number;
  accuracy: number; // 0..100
  wcpm: number; // words correct per minute
  practiceWords: string[]; // unique words to work on
};

export function scoreReading(
  targetWords: string[],
  status: WordStatus[],
  elapsedSeconds: number,
): ReadingReport {
  const correct = status.filter((s) => s === "correct").length;
  const missed = status.filter((s) => s === "missed").length;
  const attempted = correct + missed;
  const minutes = Math.max(elapsedSeconds, 1) / 60;
  const practiceWords = Array.from(
    new Set(
      targetWords
        .filter((_, i) => status[i] !== "correct")
        .map((w) => w.replace(/[.,!?;:"]/g, ""))
        .filter(Boolean),
    ),
  );
  return {
    total: targetWords.length,
    correct,
    missed,
    attempted,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    wcpm: Math.round(correct / minutes),
    practiceWords,
  };
}
