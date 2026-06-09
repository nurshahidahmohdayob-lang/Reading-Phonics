export type Word = {
  /** The example word, e.g. "apple". */
  text: string;
  /** A visual cue rendered as an emoji. */
  emoji: string;
};

export type Lesson = {
  /** Lowercase letter the lesson focuses on. */
  letter: string;
  /** A short, kid-friendly pronunciation hint, e.g. "ah". */
  sound: string;
  /** What the sound is "like", shown as a caption. */
  hint: string;
  /** Example words that start with the focus sound. */
  words: Word[];
  /** Background accent color (Tailwind classes). */
  accent: string;
};

export const lessons: Lesson[] = [
  {
    letter: "a",
    sound: "ah",
    hint: 'short "a" like in apple',
    accent: "from-rose-400 to-orange-300",
    words: [
      { text: "apple", emoji: "🍎" },
      { text: "ant", emoji: "🐜" },
      { text: "axe", emoji: "🪓" },
    ],
  },
  {
    letter: "b",
    sound: "buh",
    hint: 'the "b" sound like in ball',
    accent: "from-sky-400 to-blue-300",
    words: [
      { text: "ball", emoji: "⚽" },
      { text: "bear", emoji: "🐻" },
      { text: "banana", emoji: "🍌" },
    ],
  },
  {
    letter: "c",
    sound: "kuh",
    hint: 'hard "c" like in cat',
    accent: "from-amber-400 to-yellow-300",
    words: [
      { text: "cat", emoji: "🐱" },
      { text: "car", emoji: "🚗" },
      { text: "cake", emoji: "🎂" },
    ],
  },
  {
    letter: "d",
    sound: "duh",
    hint: 'the "d" sound like in dog',
    accent: "from-emerald-400 to-green-300",
    words: [
      { text: "dog", emoji: "🐶" },
      { text: "duck", emoji: "🦆" },
      { text: "drum", emoji: "🥁" },
    ],
  },
  {
    letter: "e",
    sound: "eh",
    hint: 'short "e" like in egg',
    accent: "from-fuchsia-400 to-pink-300",
    words: [
      { text: "egg", emoji: "🥚" },
      { text: "elephant", emoji: "🐘" },
      { text: "engine", emoji: "🚂" },
    ],
  },
  {
    letter: "f",
    sound: "ff",
    hint: 'the "f" sound like in fish',
    accent: "from-cyan-400 to-teal-300",
    words: [
      { text: "fish", emoji: "🐟" },
      { text: "frog", emoji: "🐸" },
      { text: "fire", emoji: "🔥" },
    ],
  },
  {
    letter: "s",
    sound: "sss",
    hint: 'the "s" sound like in sun',
    accent: "from-violet-400 to-indigo-300",
    words: [
      { text: "sun", emoji: "☀️" },
      { text: "snake", emoji: "🐍" },
      { text: "star", emoji: "⭐" },
    ],
  },
];
