export type WordStatus = "correct" | "missed" | "pending";

/** Strip punctuation/case so spoken and written words can be compared. */
export function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
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

/** True when a spoken word is close enough to count as reading the target. */
export function lenientMatch(target: string, spoken: string): boolean {
  if (target === spoken) return true;
  const t = accentFold(target);
  const s = accentFold(spoken);
  if (t === s) return true;
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

  for (const raw of spokenWords) {
    const sw = normalize(raw);
    if (!sw) continue;
    let matchedAt = -1;
    for (let k = ti; k <= Math.min(target.length - 1, ti + WINDOW); k++) {
      if (lenientMatch(target[k], sw)) {
        matchedAt = k;
        break;
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
        .filter((_, i) => status[i] === "missed")
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
