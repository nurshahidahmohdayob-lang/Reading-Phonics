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
    color: "from-[#1C6B49] to-[#0D4A34]",
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
    color: "from-[#3AA7C4] to-[#27829E]",
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
    color: "from-[#7BA468] to-[#668D4E]",
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
    color: "from-[#4E9A78] to-[#3A7A5E]",
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
    color: "from-[#2E8C77] to-[#1C6B49]",
    words: [
      { text: "bed", emoji: "🛏️", sounds: ["b", "e", "d"], say: ["buh", "eh", "duh"] },
      { text: "red", emoji: "🟥", sounds: ["r", "e", "d"], say: ["ruh", "eh", "duh"] },
      { text: "hen", emoji: "🐔", sounds: ["h", "e", "n"], say: ["huh", "eh", "nnn"] },
      { text: "net", emoji: "🥅", sounds: ["n", "e", "t"], say: ["nnn", "eh", "tuh"] },
    ],
  },
  {
    family: "-an",
    label: "The -an family",
    color: "from-[#1C6B49] to-[#0D4A34]",
    words: [
      { text: "can", emoji: "🥫", sounds: ["c", "a", "n"], say: ["kuh", "ah", "nnn"] },
      { text: "man", emoji: "👨", sounds: ["m", "a", "n"], say: ["mmm", "ah", "nnn"] },
      { text: "pan", emoji: "🍳", sounds: ["p", "a", "n"], say: ["puh", "ah", "nnn"] },
      { text: "fan", emoji: "🪭", sounds: ["f", "a", "n"], say: ["fff", "ah", "nnn"] },
      { text: "van", emoji: "🚐", sounds: ["v", "a", "n"], say: ["vvv", "ah", "nnn"] },
    ],
  },
  {
    family: "-ap",
    label: "The -ap family",
    color: "from-[#3AA7C4] to-[#27829E]",
    words: [
      { text: "cap", emoji: "🧢", sounds: ["c", "a", "p"], say: ["kuh", "ah", "puh"] },
      { text: "map", emoji: "🗺️", sounds: ["m", "a", "p"], say: ["mmm", "ah", "puh"] },
      { text: "tap", emoji: "🚰", sounds: ["t", "a", "p"], say: ["tuh", "ah", "puh"] },
      { text: "nap", emoji: "😴", sounds: ["n", "a", "p"], say: ["nnn", "ah", "puh"] },
      { text: "zap", emoji: "⚡", sounds: ["z", "a", "p"], say: ["zzz", "ah", "puh"] },
    ],
  },
  {
    family: "-in",
    label: "The -in family",
    color: "from-[#7BA468] to-[#668D4E]",
    words: [
      { text: "pin", emoji: "📌", sounds: ["p", "i", "n"], say: ["puh", "ih", "nnn"] },
      { text: "bin", emoji: "🗑️", sounds: ["b", "i", "n"], say: ["buh", "ih", "nnn"] },
      { text: "win", emoji: "🏆", sounds: ["w", "i", "n"], say: ["wuh", "ih", "nnn"] },
      { text: "fin", emoji: "🐟", sounds: ["f", "i", "n"], say: ["fff", "ih", "nnn"] },
      { text: "tin", emoji: "🥫", sounds: ["t", "i", "n"], say: ["tuh", "ih", "nnn"] },
    ],
  },
  {
    family: "-ot",
    label: "The -ot family",
    color: "from-[#4E9A78] to-[#3A7A5E]",
    words: [
      { text: "pot", emoji: "🍲", sounds: ["p", "o", "t"], say: ["puh", "oh", "tuh"] },
      { text: "hot", emoji: "🔥", sounds: ["h", "o", "t"], say: ["huh", "oh", "tuh"] },
      { text: "dot", emoji: "🔴", sounds: ["d", "o", "t"], say: ["duh", "oh", "tuh"] },
      { text: "cot", emoji: "🛏️", sounds: ["c", "o", "t"], say: ["kuh", "oh", "tuh"] },
    ],
  },
  {
    family: "-ug",
    label: "The -ug family",
    color: "from-[#2E8C77] to-[#1C6B49]",
    words: [
      { text: "bug", emoji: "🐛", sounds: ["b", "u", "g"], say: ["buh", "uh", "guh"] },
      { text: "mug", emoji: "☕", sounds: ["m", "u", "g"], say: ["mmm", "uh", "guh"] },
      { text: "hug", emoji: "🤗", sounds: ["h", "u", "g"], say: ["huh", "uh", "guh"] },
      { text: "jug", emoji: "🫗", sounds: ["j", "u", "g"], say: ["juh", "uh", "guh"] },
      { text: "rug", emoji: "🧶", sounds: ["r", "u", "g"], say: ["ruh", "uh", "guh"] },
    ],
  },
  {
    family: "-op",
    label: "The -op family",
    color: "from-[#1C6B49] to-[#0D4A34]",
    words: [
      { text: "top", emoji: "🔝", sounds: ["t", "o", "p"], say: ["tuh", "oh", "puh"] },
      { text: "mop", emoji: "🧹", sounds: ["m", "o", "p"], say: ["mmm", "oh", "puh"] },
      { text: "hop", emoji: "🐰", sounds: ["h", "o", "p"], say: ["huh", "oh", "puh"] },
      { text: "pop", emoji: "🎈", sounds: ["p", "o", "p"], say: ["puh", "oh", "puh"] },
      { text: "cop", emoji: "👮", sounds: ["c", "o", "p"], say: ["kuh", "oh", "puh"] },
    ],
  },
  {
    family: "-ad",
    label: "The -ad family",
    color: "from-[#3AA7C4] to-[#27829E]",
    words: [
      { text: "sad", emoji: "😢", sounds: ["s", "a", "d"], say: ["sss", "ah", "duh"] },
      { text: "mad", emoji: "😡", sounds: ["m", "a", "d"], say: ["mmm", "ah", "duh"] },
      { text: "dad", emoji: "👨", sounds: ["d", "a", "d"], say: ["duh", "ah", "duh"] },
      { text: "bad", emoji: "👎", sounds: ["b", "a", "d"], say: ["buh", "ah", "duh"] },
      { text: "pad", emoji: "🧾", sounds: ["p", "a", "d"], say: ["puh", "ah", "duh"] },
    ],
  },
  {
    family: "-en",
    label: "The -en family",
    color: "from-[#7BA468] to-[#668D4E]",
    words: [
      { text: "hen", emoji: "🐔", sounds: ["h", "e", "n"], say: ["huh", "eh", "nnn"] },
      { text: "ten", emoji: "🔟", sounds: ["t", "e", "n"], say: ["tuh", "eh", "nnn"] },
      { text: "pen", emoji: "🖊️", sounds: ["p", "e", "n"], say: ["puh", "eh", "nnn"] },
      { text: "men", emoji: "👬", sounds: ["m", "e", "n"], say: ["mmm", "eh", "nnn"] },
    ],
  },
  {
    family: "-it",
    label: "The -it family",
    color: "from-[#4E9A78] to-[#3A7A5E]",
    words: [
      { text: "sit", emoji: "🪑", sounds: ["s", "i", "t"], say: ["sss", "ih", "tuh"] },
      { text: "kit", emoji: "🧰", sounds: ["k", "i", "t"], say: ["kuh", "ih", "tuh"] },
      { text: "hit", emoji: "🥊", sounds: ["h", "i", "t"], say: ["huh", "ih", "tuh"] },
      { text: "fit", emoji: "💪", sounds: ["f", "i", "t"], say: ["fff", "ih", "tuh"] },
    ],
  },
];
