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
  /** On the parents' page too (no sign-in); otherwise it's for teachers. */
  family?: boolean;
};

/** The parents' page: the children's sections, with no sign-in. */
export const PARENTS_URL = "readingpals.vercel.app/parents";

export const GUIDE_PARENTS =
  "Parents can use the children's sections at home with no sign-in: open readingpals.vercel.app/parents, or tap 🏡 Parent on the sign-in screen. Teachers tap 🧑‍🏫 Teacher and sign in with their Zera email; there's a Teacher button at the top of the parents' page too.";

export const GUIDE_INTRO =
  "Phonics Pals helps children learn to read step by step — first the letter sounds, then blending sounds into words, then spelling, then reading whole stories aloud. There are fourteen sections. Ten are for children to practise, and parents can open them at home without signing in. The other four are for teachers: Guided Reading, the Reading Assessment, Assignments and the Class Tracker. Start with the sounds and work your way down.";

export const GUIDE_TOOLS: ToolGuide[] = [
  {
    id: "phonics",
    emoji: "🙆",
    label: "Phonics",
    purpose: "Learn the letter sounds and blend them into words.",
    steps: [
      "Sounds: the letter sounds in groups, in the order they're taught. Open a group and tap a letter to hear its true sound — the sound, not the letter name.",
      "Each sound has an action to help children remember it.",
      "Blending: once they know a few sounds, blend them together into a word.",
    ],
    family: true,
    color: "from-[#FFA3CF] to-[#FF75B5]",
    text: "text-pink-900",
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
    family: true,
    color: "from-[#A9B8FF] to-[#7F93FF]",
    text: "text-indigo-900",
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
    family: true,
    color: "from-[#84EEF0] to-[#3FD8DE]",
    text: "text-teal-900",
  },
  {
    id: "formation",
    emoji: "✍️",
    label: "Letter Formation",
    purpose: "Learn to write each letter with the correct stroke.",
    steps: [
      "Pick a letter, small or capital, and watch it being written.",
      "Follow the pencil: trace along with a finger or mouse to build neat handwriting.",
    ],
    family: true,
    color: "from-[#FFC27A] to-[#FF9B3D]",
    text: "text-orange-900",
  },
  {
    id: "spelling",
    emoji: "🔡",
    label: "Spelling",
    purpose: "Break a word into its sounds and spell it — blending in reverse.",
    steps: [
      "Follow the treasure trail: 50 spelling adventures, from easy words to harder ones.",
      "Hear a word, then choose the letters for each sound to spell it.",
      "Each level done lights up the trail on the way to the treasure chest.",
    ],
    family: true,
    color: "from-[#7DEBB0] to-[#3DD68C]",
    text: "text-emerald-900",
  },
  {
    id: "tricky",
    emoji: "🌟",
    label: "Tricky Words",
    purpose: "Practise sight words that can't be sounded out.",
    steps: [
      "Words like ‘the’, ‘said’ and ‘was’, in six colour sets from Cream to Purple.",
      "Read and remember them on sight, not by sounding out.",
    ],
    family: true,
    color: "from-[#FFEA70] to-[#FFD21F]",
    text: "text-amber-900",
  },
  {
    id: "stories",
    emoji: "📚",
    label: "Sentences & Stories",
    purpose: "Read leveled stories and sentences — real reading practice.",
    steps: [
      "Choose a level, from Year 1 to Year 6 — 50 stories each, sorted by Lexile measure.",
      "Open a story and read. Tap any word you’re unsure of to hear it.",
      "Then answer 10 questions about the story and see the score.",
      "Every story has a colouring page. Teachers can share a colouring link and see the pictures children send in.",
    ],
    family: true,
    color: "from-[#8FD1FF] to-[#4DB2FF]",
    text: "text-sky-900",
  },
  {
    id: "storyplay",
    emoji: "🧩",
    label: "Story Play",
    purpose: "Games that show a child understood what they read.",
    steps: [
      "Match the Picture: read a sentence, then tap the picture that matches it.",
      "Build the Story: drag the sentences into the right order to make the story.",
    ],
    color: "from-[#84EEF0] to-[#3FD8DE]",
    text: "text-teal-900",
    family: true,
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
      "Each read is saved in the Class Tracker’s Guided reading tab.",
    ],
    color: "from-[#C9B3FF] to-[#A27DFF]",
    text: "text-violet-900",
  },
  {
    id: "assessment",
    emoji: "📋",
    label: "Reading Assessment",
    purpose:
      "Find a child’s reading level with a read-aloud check in three quick stages.",
    steps: [
      "Stage 1: the child reads single words; you mark each ✓ or ✗. It stops after 2 wrong and picks a starting level.",
      "Stage 2: they read a levelled story aloud — the mic listens, times it, and suggests how many words were misread (retype the total if it looks off).",
      "Stage 3: a few comprehension questions — optional, and the child can look back at the book.",
      "Get a reading level, a “practise these” word list, and a printable one-page report (Reader Level, Year · Term and Lexile).",
      "Best in Google Chrome with the microphone allowed. Open the full step-by-step walkthrough below.",
    ],
    color: "from-[#FFA699] to-[#FF7B6B]",
    text: "text-rose-900",
  },
  {
    id: "threed",
    emoji: "🪄",
    label: "3D Drawings",
    purpose: "A child’s drawing on paper comes to life on screen.",
    steps: [
      "Tap 📷 Scan a drawing: take a photo of the drawing (or pick one). The paper is cut away, leaving just the drawing.",
      "Choose where it lives: the jungle, a meadow, the ocean or space. Each place has its own music; tap 🎵 Music on to turn it off.",
      "It moves like the real thing: a fish swims, a jellyfish pulses, a bird flies, a frog hops, a snake slithers. It guesses from the name (‘My fish’), or tap How does it move? to choose.",
      "Tap a drawing to make it bigger or smaller, turn it round, or take it off. Drag it to move it.",
      "Tap 📱 Scan with my phone to send drawings from a phone straight to the big screen.",
    ],
    color: "from-[#C9B3FF] to-[#A27DFF]",
    text: "text-violet-900",
    family: true,
  },
  {
    id: "interactive",
    emoji: "🎭",
    label: "Interactive Stories",
    purpose: "Read-along plays: listen, follow the words, tap the characters.",
    steps: [
      "Pick a story, from Starter to Year 6.",
      "The story is read aloud, with a different voice for the narrator and each character, and the words light up as they’re read.",
      "Tap the characters and the words to hear them.",
      "Open to anyone with the link — no sign-in needed.",
    ],
    color: "from-[#FFA3CF] to-[#FF75B5]",
    text: "text-rose-900",
    family: true,
  },
  {
    id: "assignments",
    emoji: "📮",
    label: "Assignments",
    purpose: "Set online work for a class and see who has done it.",
    steps: [
      "Pick the year group at the top, then one of three kinds of work.",
      "Reading at their level: each child gets their own story, pitched from their latest assessment. Share the reading link with parents — a child taps their name and sees only their story.",
      "Year-group worksheets: four drag-and-drop worksheets for each year. Tap 👀 Try it to see what children see, then 📮 Send to… the whole class or chosen children.",
      "Interactive video: a read-aloud video that pauses to ask questions. 📝 Worksheet beside it has a follow-up worksheet for afterwards.",
      "A ✅ appears beside each child who has handed in. Tap it to see their whole worksheet as they did it, with wrong answers marked — 🖨️ Print it, or 🔁 let them do it again.",
    ],
    color: "from-[#FFC27A] to-[#FF9B3D]",
    text: "text-amber-900",
  },
  {
    id: "tracker",
    emoji: "🗂️",
    label: "Class Tracker",
    purpose: "Every child’s reading level for Term 1, 2 and 3, in one private place.",
    steps: [
      "Pick a year group. Tap an empty cell to assess that child; tap a saved one to open or download their report.",
      "Statistics shows how the class is doing; Guided reading shows who has read what, and how well.",
      "Parent emails and Send reports: add parents’ emails, then send each one their own child’s report.",
      "Sync students checks the class lists against the school system. A padlock marks a child who isn’t registered yet.",
    ],
    color: "from-[#7DEBB0] to-[#3DD68C]",
    text: "text-emerald-900",
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
