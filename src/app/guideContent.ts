/* Shared tutorial content — used by the in-app Guide page and the printable /
   downloadable version, so they never drift apart. */

export type ToolGuide = {
  id: string;
  emoji: string;
  label: string;
  purpose: string;
  steps: string[];
  /** Tailwind gradient + text colour for the in-app card. */
  color: string;
  text: string;
};

export const GUIDE_INTRO =
  "Phonics Pals helps children learn to read step by step — first the letter sounds, then blending sounds into words, then spelling, then reading whole stories aloud. There are nine tools. Start with the sounds and work your way down.";

export const GUIDE_TOOLS: ToolGuide[] = [
  {
    id: "phonics",
    emoji: "🙆",
    label: "Phonics",
    purpose: "Learn the letter sounds and blend them into words.",
    steps: [
      "Tap a letter to hear its true sound — the sound, not the letter name.",
      "Each sound has an action to help children remember it.",
      "Once they know a few sounds, blend them together into a word.",
    ],
    color: "from-[#FFD9EA] to-[#FFC0DB]",
    text: "text-pink-700",
  },
  {
    id: "soundout",
    emoji: "🔤",
    label: "Sound It Out",
    purpose: "Type any word and hear it broken into sounds and blended.",
    steps: [
      "Type any word at all — a name, or a word from a book.",
      "Hear it sound-by-sound, then blended back together.",
      "Great for a tricky word that comes up during the day.",
    ],
    color: "from-[#DCE3FF] to-[#BFCBFF]",
    text: "text-indigo-700",
  },
  {
    id: "flashcards",
    emoji: "🎴",
    label: "Flashcards",
    purpose: "Flip cards to self-check sounds, then blending words.",
    steps: [
      "Letter Sounds deck: see the letter, say the sound, flip for a picture.",
      "Blend Words deck: see the picture, blend the sounds into a word.",
      "Tap the picture or word to hear it. Print any deck for paper cards.",
    ],
    color: "from-[#CDEFF0] to-[#A6E3E6]",
    text: "text-teal-700",
  },
  {
    id: "formation",
    emoji: "✍️",
    label: "Letter Formation",
    purpose: "Learn to write each letter with the correct stroke.",
    steps: [
      "Pick a letter and watch the stroke animation.",
      "Trace along to build neat handwriting.",
    ],
    color: "from-[#FFE8C9] to-[#FFD3A1]",
    text: "text-orange-700",
  },
  {
    id: "spelling",
    emoji: "🔡",
    label: "Spelling",
    purpose: "Break a word into its sounds and spell it — blending in reverse.",
    steps: [
      "Hear a word.",
      "Choose the letters for each sound to spell it.",
    ],
    color: "from-[#CFF5E1] to-[#A7E9C8]",
    text: "text-emerald-700",
  },
  {
    id: "tricky",
    emoji: "🌟",
    label: "Tricky Words",
    purpose: "Practise sight words that can't be sounded out.",
    steps: [
      "Words like ‘the’, ‘said’ and ‘was’.",
      "Read and remember them on sight, not by sounding out.",
    ],
    color: "from-[#FFF4BD] to-[#FFE88C]",
    text: "text-amber-700",
  },
  {
    id: "stories",
    emoji: "📚",
    label: "Sentences & Stories",
    purpose: "Read leveled stories and sentences — real reading practice.",
    steps: [
      "Choose a level, from Year 1 to Year 6.",
      "Open a story and read. Tap any word you’re unsure of to hear it.",
    ],
    color: "from-[#D3EBFF] to-[#ABD9FF]",
    text: "text-sky-700",
  },
  {
    id: "guided",
    emoji: "🎤",
    label: "Guided Reading",
    purpose: "Read a story aloud, get a report, and talk about it.",
    steps: [
      "The child reads a story out loud and the app listens.",
      "Get a report: stars, accuracy, words per minute, and words to practise.",
      "Practise tricky words with the Coach.",
      "Answer 10 optional comprehension questions — a mix, never scored.",
    ],
    color: "from-[#E9DFFF] to-[#D2C0FF]",
    text: "text-violet-700",
  },
  {
    id: "assessment",
    emoji: "📋",
    label: "Reading Assessment",
    purpose: "Find a child’s reading level with a two-stage check.",
    steps: [
      "Stage 1: the child reads single words; you mark each ✓ or ✗.",
      "It stops after 2 words wrong and suggests a reading level (a Lexile).",
      "Stage 2: read a story at that level — read it well to move up a level.",
      "Get a printable one-page report to keep or send home.",
    ],
    color: "from-[#FFE3E0] to-[#FFC9C2]",
    text: "text-rose-700",
  },
];
