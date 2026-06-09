export type WordCard = {
  /** The whole word, e.g. "cat". */
  text: string;
  /** Visual cue. */
  emoji: string;
  /** The word split into its sounds (graphemes), e.g. ["c","a","t"]. */
  sounds: string[];
  /** Kid-friendly pronunciation per sound, used when blending aloud. */
  say: string[];
};

export type WordFamily = {
  /** The rime, e.g. "-at". */
  family: string;
  label: string;
  /** Tailwind gradient accent. */
  color: string;
  words: WordCard[];
};

export const wordFamilies: WordFamily[] = [
  {
    family: "-at",
    label: "The -at family",
    color: "from-rose-400 to-orange-300",
    words: [
      { text: "cat", emoji: "🐱", sounds: ["c", "a", "t"], say: ["kuh", "ah", "tuh"] },
      { text: "hat", emoji: "🎩", sounds: ["h", "a", "t"], say: ["huh", "ah", "tuh"] },
      { text: "bat", emoji: "🦇", sounds: ["b", "a", "t"], say: ["buh", "ah", "tuh"] },
      { text: "mat", emoji: "🟫", sounds: ["m", "a", "t"], say: ["mmm", "ah", "tuh"] },
    ],
  },
  {
    family: "-ig",
    label: "The -ig family",
    color: "from-sky-400 to-blue-300",
    words: [
      { text: "pig", emoji: "🐷", sounds: ["p", "i", "g"], say: ["puh", "ih", "guh"] },
      { text: "wig", emoji: "👱", sounds: ["w", "i", "g"], say: ["wuh", "ih", "guh"] },
      { text: "dig", emoji: "⛏️", sounds: ["d", "i", "g"], say: ["duh", "ih", "guh"] },
      { text: "fig", emoji: "🫐", sounds: ["f", "i", "g"], say: ["fff", "ih", "guh"] },
    ],
  },
  {
    family: "-og",
    label: "The -og family",
    color: "from-emerald-400 to-green-300",
    words: [
      { text: "dog", emoji: "🐶", sounds: ["d", "o", "g"], say: ["duh", "oh", "guh"] },
      { text: "log", emoji: "🪵", sounds: ["l", "o", "g"], say: ["luh", "oh", "guh"] },
      { text: "frog", emoji: "🐸", sounds: ["fr", "o", "g"], say: ["fr", "oh", "guh"] },
      { text: "fog", emoji: "🌫️", sounds: ["f", "o", "g"], say: ["fff", "oh", "guh"] },
    ],
  },
  {
    family: "-un",
    label: "The -un family",
    color: "from-amber-400 to-yellow-300",
    words: [
      { text: "sun", emoji: "☀️", sounds: ["s", "u", "n"], say: ["sss", "uh", "nnn"] },
      { text: "bun", emoji: "🍔", sounds: ["b", "u", "n"], say: ["buh", "uh", "nnn"] },
      { text: "run", emoji: "🏃", sounds: ["r", "u", "n"], say: ["ruh", "uh", "nnn"] },
      { text: "fun", emoji: "🎉", sounds: ["f", "u", "n"], say: ["fff", "uh", "nnn"] },
    ],
  },
  {
    family: "-ed",
    label: "The -ed family",
    color: "from-fuchsia-400 to-pink-300",
    words: [
      { text: "bed", emoji: "🛏️", sounds: ["b", "e", "d"], say: ["buh", "eh", "duh"] },
      { text: "red", emoji: "🟥", sounds: ["r", "e", "d"], say: ["ruh", "eh", "duh"] },
      { text: "hen", emoji: "🐔", sounds: ["h", "e", "n"], say: ["huh", "eh", "nnn"] },
      { text: "net", emoji: "🥅", sounds: ["n", "e", "t"], say: ["nnn", "eh", "tuh"] },
    ],
  },
];
