export type StoryPage = {
  /** A single sentence on the page. */
  text: string;
  /** Picture cue for the page. */
  emoji: string;
};

export type Story = {
  id: string;
  title: string;
  emoji: string;
  /** Approximate Lexile measure for this text, e.g. 350 => "350L". */
  lexile: number;
  pages: StoryPage[];
};

export type AccuracyBand = { min: number; max: number };

export type Level = {
  id: string;
  /** School year / grade, e.g. "Year 1". */
  grade: string;
  /** Typical age for the year. */
  age: number;
  /** Lexile range shown to the reader, e.g. "190–530L". */
  lexileRange: string;
  lexileLow: number;
  lexileHigh: number;
  /** Expected oral reading fluency, words per minute. */
  wpmLow: number;
  wpmHigh: number;
  /** Target reading accuracy (%). */
  accuracyGoal: number;
  /** Reads alone comfortably. */
  independent: AccuracyBand;
  /** Needs some guidance. */
  instructional: AccuracyBand;
  /** Below this accuracy the text is too hard. */
  frustrationBelow: number;
  description: string;
  swatch: string;
  swatchText: string;
  stories: Story[];
};

import { buildStories } from "@/app/storyLibrary";

/**
 * Reading levels expressed as Lexile bands, mapped to Year 1–6 with the
 * fluency (WPM) and accuracy benchmarks used by Reading Progress. The handful
 * of hand-written "featured" stories below are padded out with generated
 * stories so each level offers 50+ texts to read.
 */
const baseLevels: Level[] = [
  {
    id: "year1",
    grade: "Year 1",
    age: 6,
    lexileRange: "190–530L",
    lexileLow: 190,
    lexileHigh: 530,
    wpmLow: 30,
    wpmHigh: 50,
    accuracyGoal: 95,
    independent: { min: 95, max: 100 },
    instructional: { min: 90, max: 94 },
    frustrationBelow: 90,
    description: "First decodable words and short sentences.",
    swatch: "bg-[#F1B828]",
    swatchText: "text-[#3a2c00]",
    stories: [
      {
        id: "sam-the-cat",
        title: "Sam the Cat",
        emoji: "🐱",
        lexile: 200,
        pages: [
          { text: "Sam is a cat.", emoji: "🐱" },
          { text: "Sam sat on a mat.", emoji: "🟫" },
          { text: "Sam has a hat.", emoji: "🎩" },
          { text: "Sam naps.", emoji: "😴" },
        ],
      },
      {
        id: "pip-the-dog",
        title: "Pip the Dog",
        emoji: "🐶",
        lexile: 350,
        pages: [
          { text: "Pip is a dog.", emoji: "🐶" },
          { text: "Pip can run fast.", emoji: "🏃" },
          { text: "Pip runs to the log.", emoji: "🪵" },
          { text: "Pip sits in the sun.", emoji: "☀️" },
          { text: "Good dog, Pip!", emoji: "🦴" },
        ],
      },
    ],
  },
  {
    id: "year2",
    grade: "Year 2",
    age: 7,
    lexileRange: "420–620L",
    lexileLow: 420,
    lexileHigh: 620,
    wpmLow: 50,
    wpmHigh: 80,
    accuracyGoal: 95,
    independent: { min: 95, max: 100 },
    instructional: { min: 90, max: 94 },
    frustrationBelow: 90,
    description: "Longer sentences with everyday words.",
    swatch: "bg-[#27829E]",
    swatchText: "text-white",
    stories: [
      {
        id: "hen-and-egg",
        title: "Hen and Egg",
        emoji: "🐔",
        lexile: 450,
        pages: [
          { text: "The hen sits on an egg.", emoji: "🐔" },
          { text: "The egg is in the nest.", emoji: "🪺" },
          { text: "Tap, tap, tap!", emoji: "🥚" },
          { text: "A chick comes out.", emoji: "🐤" },
          { text: "Peep, peep!", emoji: "🐣" },
        ],
      },
      {
        id: "at-the-park",
        title: "At the Park",
        emoji: "🏞️",
        lexile: 560,
        pages: [
          { text: "Tom and Meg go to the park.", emoji: "🏞️" },
          { text: "They run and jump on the grass.", emoji: "🌳" },
          { text: "Meg goes up on the big slide.", emoji: "🛝" },
          { text: "Tom kicks the ball to Meg.", emoji: "⚽" },
          { text: "It is fun at the park.", emoji: "😄" },
        ],
      },
    ],
  },
  {
    id: "year3",
    grade: "Year 3",
    age: 8,
    lexileRange: "620–820L",
    lexileLow: 620,
    lexileHigh: 820,
    wpmLow: 80,
    wpmHigh: 100,
    accuracyGoal: 96,
    independent: { min: 96, max: 100 },
    instructional: { min: 92, max: 95 },
    frustrationBelow: 92,
    description: "Short stories with a clear beginning and end.",
    swatch: "bg-[#668D4E]",
    swatchText: "text-white",
    stories: [
      {
        id: "the-red-kite",
        title: "The Red Kite",
        emoji: "🪁",
        lexile: 650,
        pages: [
          { text: "Sam has a big red kite.", emoji: "🪁" },
          { text: "The wind blows the kite up high.", emoji: "🌬️" },
          { text: "It flies over the tall trees.", emoji: "🌲" },
          { text: "The kite dips and spins.", emoji: "🔄" },
          { text: "Sam pulls it back down.", emoji: "🙌" },
        ],
      },
      {
        id: "the-lost-cat",
        title: "The Lost Cat",
        emoji: "🐈",
        lexile: 760,
        pages: [
          { text: "Lily could not find her cat.", emoji: "🐈" },
          { text: "She looked under the bed.", emoji: "🛏️" },
          { text: "She looked behind the door.", emoji: "🚪" },
          { text: "Then she heard a soft meow.", emoji: "🔊" },
          { text: "The cat was asleep in a box!", emoji: "📦" },
          { text: "Lily gave her cat a big hug.", emoji: "🤗" },
        ],
      },
    ],
  },
  {
    id: "year4",
    grade: "Year 4",
    age: 9,
    lexileRange: "740–875L",
    lexileLow: 740,
    lexileHigh: 875,
    wpmLow: 100,
    wpmHigh: 120,
    accuracyGoal: 97,
    independent: { min: 97, max: 100 },
    instructional: { min: 93, max: 96 },
    frustrationBelow: 93,
    description: "Stories with feelings and longer words.",
    swatch: "bg-[#3A7A5E]",
    swatchText: "text-white",
    stories: [
      {
        id: "a-trip-to-the-sea",
        title: "A Trip to the Sea",
        emoji: "🌊",
        lexile: 780,
        pages: [
          { text: "We went to the sea on a sunny day.", emoji: "🌊" },
          { text: "I made a tall sandcastle.", emoji: "🏖️" },
          { text: "The waves were cold on my feet.", emoji: "🦶" },
          { text: "We found shells and a little crab.", emoji: "🦀" },
          { text: "I did not want to go home.", emoji: "😊" },
        ],
      },
      {
        id: "the-brave-little-fox",
        title: "The Brave Little Fox",
        emoji: "🦊",
        lexile: 850,
        pages: [
          { text: "A little fox lived in the deep, dark wood.", emoji: "🦊" },
          { text: "One night, he heard a strange noise.", emoji: "🌙" },
          { text: "He was scared, but he wanted to be brave.", emoji: "💪" },
          { text: "Slowly, he crept towards the sound.", emoji: "👣" },
          { text: "It was just an owl, hooting in a tree!", emoji: "🦉" },
          { text: "The fox laughed and ran home to sleep.", emoji: "😄" },
        ],
      },
    ],
  },
  {
    id: "year5",
    grade: "Year 5",
    age: 10,
    lexileRange: "875–1010L",
    lexileLow: 875,
    lexileHigh: 1010,
    wpmLow: 120,
    wpmHigh: 145,
    accuracyGoal: 97,
    independent: { min: 97, max: 100 },
    instructional: { min: 94, max: 96 },
    frustrationBelow: 94,
    description: "Richer vocabulary and descriptive language.",
    swatch: "bg-[#1C6B49]",
    swatchText: "text-white",
    stories: [
      {
        id: "the-magic-seed",
        title: "The Magic Seed",
        emoji: "🌱",
        lexile: 900,
        pages: [
          { text: "Anya planted a tiny seed in the ground.", emoji: "🌱" },
          { text: "Every day she gave it water and sunlight.", emoji: "💧" },
          { text: "Soon a green shoot pushed through the soil.", emoji: "🌿" },
          { text: "It grew taller than the house!", emoji: "🌻" },
          { text: "At the top was the biggest flower ever.", emoji: "🌺" },
          { text: "Anya had grown something wonderful.", emoji: "🌟" },
        ],
      },
      {
        id: "the-lighthouse-keeper",
        title: "The Lighthouse Keeper",
        emoji: "🗼",
        lexile: 980,
        pages: [
          { text: "High on the rocky cliff stood an old stone lighthouse.", emoji: "🗼" },
          { text: "Every evening, the keeper climbed the spiral stairs to light the lamp.", emoji: "🪜" },
          { text: "Its powerful beam swept across the dark, churning sea.", emoji: "🌊" },
          { text: "Sailors far from shore trusted that steady, golden light.", emoji: "⛵" },
          { text: "It guided them safely past the dangerous, hidden rocks.", emoji: "🪨" },
          { text: "The faithful keeper never once let the lamp go dark.", emoji: "🔆" },
        ],
      },
    ],
  },
  {
    id: "year6",
    grade: "Year 6",
    age: 11,
    lexileRange: "950–1050L",
    lexileLow: 950,
    lexileHigh: 1050,
    wpmLow: 145,
    wpmHigh: 170,
    accuracyGoal: 98,
    independent: { min: 98, max: 100 },
    instructional: { min: 95, max: 97 },
    frustrationBelow: 95,
    description: "Complex sentences and advanced vocabulary.",
    swatch: "bg-[#0D4A34]",
    swatchText: "text-white",
    stories: [
      {
        id: "the-hidden-cave",
        title: "The Hidden Cave",
        emoji: "🕳️",
        lexile: 1000,
        pages: [
          { text: "Beyond the whispering forest lay a cave that few had ever explored.", emoji: "🕳️" },
          { text: "Curious and determined, Maya gripped her flashlight tightly.", emoji: "🔦" },
          { text: "The narrow passage twisted deeper into the cold, damp darkness.", emoji: "🦇" },
          { text: "Suddenly, the walls glittered with thousands of tiny crystals.", emoji: "💎" },
          { text: "She realised she had discovered something truly extraordinary.", emoji: "✨" },
          { text: "Carefully, Maya sketched the cavern so others could share her wonder.", emoji: "📓" },
        ],
      },
      {
        id: "journey-to-the-mountain",
        title: "Journey to the Mountain",
        emoji: "🏔️",
        lexile: 1040,
        pages: [
          { text: "The ancient mountain towered above the village, wrapped in mist.", emoji: "🏔️" },
          { text: "Generations had told legends of a treasure hidden at its summit.", emoji: "🗺️" },
          { text: "Ravi began the difficult climb before the first light of dawn.", emoji: "🌄" },
          { text: "Though his legs ached, his determination never wavered.", emoji: "💪" },
          { text: "At the peak, he found not gold, but a breathtaking view of the world.", emoji: "🌍" },
          { text: "He understood that the journey itself was the greatest reward.", emoji: "🌟" },
        ],
      },
    ],
  },
];

/**
 * Each level offers 60 single-page stories of ~100–150 words. The word target
 * grows with the level so higher Lexile bands read a little longer.
 */
export const levels: Level[] = baseLevels.map((level, i) => ({
  ...level,
  stories: buildStories(
    level.id,
    i,
    level.lexileLow,
    level.lexileHigh,
    60,
    105 + i * 7,
  ),
}));

export type AccuracyVerdict = {
  label: "Independent" | "Instructional" | "Frustration";
  meaning: string;
  tone: string; // Tailwind classes for a coloured pill
};

/** Classify a reading accuracy against a level's benchmark bands. */
export function classifyAccuracy(
  level: Level,
  accuracy: number,
): AccuracyVerdict {
  if (accuracy >= level.independent.min) {
    return {
      label: "Independent",
      meaning: "Can read this alone 🎉",
      tone: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    };
  }
  if (accuracy >= level.instructional.min) {
    return {
      label: "Instructional",
      meaning: "Great with a little help 💪",
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    };
  }
  return {
    label: "Frustration",
    meaning: "Let's try an easier text 🌱",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  };
}
