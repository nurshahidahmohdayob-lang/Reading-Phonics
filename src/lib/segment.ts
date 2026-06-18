/**
 * Best-effort phonics segmentation for ANY typed word.
 *
 * The rest of the app hand-splits every word into graphemes. This does it
 * automatically so a child can type a word and sound it out. English spelling
 * is irregular, so this is a teaching aid — the per-sound split is a sensible
 * phonics approximation, while the whole word is always read with real speech.
 *
 * It greedily matches the longest known grapheme first (so "sh", "igh", "oa"
 * stay together), folds doubled consonants into one sound, and recognises the
 * magic-e pattern (cake = c-a-k-e with a long a and a silent e).
 */

export type Grapheme = {
  /** What's shown on the tile, e.g. "sh", "ai", "ll". */
  g: string;
  /** What the voice says for this sound (TTS fallback). */
  say: string;
  /** The /public/sounds/<clip>.mp3 recording to prefer for this sound. */
  clip: string;
  /** A silent letter (the e in cake) — shown faded, makes no sound. */
  silent?: boolean;
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/* How the voice says each grapheme — matches words.ts / spelling.ts. */
const SAY: Record<string, string> = {
  a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh",
  h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn",
  o: "o", p: "puh", q: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh",
  v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
  // consonant digraphs
  ch: "cha", sh: "shh", th: "thuh", wh: "wuh", ph: "fff", ng: "ng",
  ck: "kuh", qu: "kwuh", wr: "rrr", kn: "nnn", gn: "nnn",
  // vowel digraphs / trigraphs and r-controlled vowels
  ai: "ay", ay: "ay", ee: "e", ea: "e", ie: "eye", igh: "eye",
  oa: "oh", oe: "oh", oo: "oo", ou: "ow", ow: "ow", oi: "oy", oy: "oy",
  ue: "you", ew: "you", au: "or", aw: "or",
  ar: "ar", er: "er", ir: "er", or: "or", ur: "er", air: "air", ear: "ear",
};

/* Multi-letter graphemes, tried longest-first so "igh" beats "i", "sh" beats
   "s", etc. */
const GRAPHEMES = [
  "igh", "air", "ear",
  "ch", "sh", "th", "wh", "ph", "ng", "ck", "qu", "wr", "kn", "gn",
  "ai", "ay", "ee", "ea", "ie", "oa", "oe", "oo", "ou", "ow",
  "oi", "oy", "ue", "ew", "au", "aw", "ar", "er", "ir", "or", "ur",
].sort((a, b) => b.length - a.length);

/* The long-vowel sound (and its recording) used by the magic-e pattern. */
const LONG: Record<string, { say: string; clip: string }> = {
  a: { say: "ay", clip: "ai" },
  e: { say: "e", clip: "ee" },
  i: { say: "eye", clip: "ie" },
  o: { say: "oh", clip: "oa" },
  u: { say: "you", clip: "ue" },
};

/* Tiny words where a final e is its own sound, not a silent magic-e. */
const E_SOUNDS = new Set(["the", "he", "she", "me", "we", "be"]);

/** Split a word into graphemes for sounding out. Returns [] for empty input. */
export function segment(input: string): Grapheme[] {
  const w = input.toLowerCase().replace(/[^a-z]/g, "");
  const n = w.length;
  if (!n) return [];
  if (n === 1) return [{ g: w, say: SAY[w] ?? w, clip: w }];

  // A final e sitting after a consonant is almost always silent (cake, have,
  // more, little). When the vowel two places back is a single vowel, that
  // vowel goes long — the classic magic-e (a_e, i_e, o_e…).
  const silentFinalE =
    w[n - 1] === "e" && !VOWELS.has(w[n - 2]) && !E_SOUNDS.has(w);
  const magicVowelAt =
    silentFinalE && VOWELS.has(w[n - 3]) && !(n >= 4 && VOWELS.has(w[n - 4]))
      ? n - 3
      : -1;

  const out: Grapheme[] = [];
  let i = 0;
  while (i < n) {
    // The silent magic-e at the very end.
    if (silentFinalE && i === n - 1) {
      out.push({ g: "e", say: "", clip: "e", silent: true });
      i += 1;
      continue;
    }

    // The long vowel of a magic-e word (kept as a single tile).
    if (i === magicVowelAt) {
      const c = w[i];
      const long = LONG[c];
      out.push({ g: c, say: long.say, clip: long.clip });
      i += 1;
      continue;
    }

    // Doubled consonant = one sound (bell = b-e-ll). Play the single-letter
    // recording, which we always have.
    const c = w[i];
    if (c === w[i + 1] && !VOWELS.has(c)) {
      out.push({ g: c + c, say: SAY[c] ?? c, clip: c });
      i += 2;
      continue;
    }

    // Longest known multi-letter grapheme.
    let matched = false;
    for (const d of GRAPHEMES) {
      if (w.startsWith(d, i)) {
        // Never let a grapheme swallow the silent final e.
        if (silentFinalE && i + d.length >= n) continue;
        out.push({ g: d, say: SAY[d] ?? d, clip: d });
        i += d.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // A plain single letter.
    out.push({ g: c, say: SAY[c] ?? c, clip: c });
    i += 1;
  }

  return out;
}
