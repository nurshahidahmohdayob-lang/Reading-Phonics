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

/* A deeper, screen-by-screen walkthrough of the Reading Assessment, shown as an
   expandable section in the Guide. Screenshots live in /images/tutorial. */
export type WalkStep = { tag: string; title: string; body: string; img: string };

export const ASSESSMENT_WALKTHROUGH: WalkStep[] = [
  {
    tag: "Get started",
    title: "Enter the child’s name and tap Start",
    body: "Open Reading Assessment from the home menu, type the child’s name, and press Start. The panel shows how the final score is weighted — accuracy 40%, fluency 30%, comprehension 30%.",
    img: "assess-start",
  },
  {
    tag: "Stage 1 · Word check",
    title: "The child reads single words — you mark each one",
    body: "Words appear one at a time, easy to hard. The child reads each aloud and you tap ✓ Got it or ✗ Not yet (Hear it plays the word). It stops after 2 words wrong and uses how far they got to pick a starting level.",
    img: "assess-words",
  },
  {
    tag: "Stage 2 · Read aloud",
    title: "Read the story out loud while the app listens",
    body: "A book at the child’s level opens. Tap 🎤 Start reading aloud — the badge changes to “Listening & timing”. The child reads each page; tap Next page to turn.",
    img: "assess-book",
  },
  {
    tag: "Stage 2 · Score",
    title: "Check the words-read-wrongly count",
    body: "On the last page tap ✓ Done reading aloud. The mic suggests how many words were misread — retype the Total only if it looks off, since accents and slang can fool it. Add any self-corrections, then tap Confirm result.",
    img: "assess-count",
  },
  {
    tag: "Stage 3 · Comprehension",
    title: "Answer the understanding questions",
    body: "Up to eight questions — a mix of literal, inferential and vocabulary. The child can look back at the book to help. Short on time? Tap Skip → result.",
    img: "assess-comp",
  },
  {
    tag: "Result",
    title: "Read the report",
    body: "You get the reader level and overall score, plus words read, errors, self-corrections, accuracy % and words per minute. A “Practise these next” box lists the tricky words and suggests an easier or harder book.",
    img: "assess-report",
  },
  {
    tag: "Keep it",
    title: "Print or send the one-page report",
    body: "Tap “Open / print report” for a tidy one-page summary — Reader Level, Year · Term and a Lexile — ready to print or Save as PDF. For a result you can trust, run a second passage at the same level another day and compare.",
    img: "assess-practise",
  },
];

export type ReaderBand = {
  band: string;
  range: string;
  desc: string;
  tone: "rose" | "amber" | "sky" | "emerald";
};

export const READER_BANDS: ReaderBand[] = [
  {
    band: "Emerging Reader",
    range: "below 60%",
    desc: "Just beginning — learning letter sounds and first words. Needs lots of support and very easy, decodable books.",
    tone: "rose",
  },
  {
    band: "Developing Reader",
    range: "60–74%",
    desc: "Building decoding and fluency. Reads simple texts with guided practice and still meets many tricky words.",
    tone: "amber",
  },
  {
    band: "Instructional Reader",
    range: "75–89%",
    desc: "Reads well with a little teaching support — the ideal zone for guided reading and learning new skills.",
    tone: "sky",
  },
  {
    band: "Independent Reader",
    range: "90–100%",
    desc: "Reads smoothly and on their own, with strong understanding. Ready for more challenging books.",
    tone: "emerald",
  },
];
