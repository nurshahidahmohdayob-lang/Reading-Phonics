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
    accent: "from-[#1C6B49] to-[#0D4A34]",
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
    accent: "from-[#3AA7C4] to-[#27829E]",
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
    accent: "from-[#4E9A78] to-[#3A7A5E]",
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
    accent: "from-[#7BA468] to-[#668D4E]",
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
    accent: "from-[#2E8C77] to-[#1C6B49]",
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
    accent: "from-[#3AA7C4] to-[#27829E]",
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
    accent: "from-[#7BA468] to-[#668D4E]",
    words: [
      { text: "sun", emoji: "☀️" },
      { text: "snake", emoji: "🐍" },
      { text: "star", emoji: "⭐" },
    ],
  },
];
