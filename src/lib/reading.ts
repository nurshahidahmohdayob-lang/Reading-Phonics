export type WordStatus = "correct" | "missed" | "pending";

/** Strip punctuation/case so spoken and written words can be compared. */
export function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
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
  const WINDOW = 3; // how far ahead we'll look to forgive a skipped word
  let ti = 0;

  for (const raw of spokenWords) {
    const sw = normalize(raw);
    if (!sw) continue;
    let matchedAt = -1;
    for (let k = ti; k <= Math.min(target.length - 1, ti + WINDOW); k++) {
      if (target[k] === sw) {
        matchedAt = k;
        break;
      }
    }
    if (matchedAt >= 0) {
      for (let j = ti; j < matchedAt; j++) status[j] = "missed";
      status[matchedAt] = "correct";
      ti = matchedAt + 1;
    }
    // Unmatched spoken word = an insertion or misread; we simply skip it.
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
  for (const w of spokenWords) best = Math.max(best, similarity(t, w));
  if (best >= 0.85) return "green";
  if (best >= 0.5) return "yellow";
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
