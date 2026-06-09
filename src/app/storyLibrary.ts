import type { Story } from "@/app/stories";

/* A deterministic story generator. Each level gets 50+ single-page stories of
   roughly 100–150 words, built from a shared cast of characters, places, and
   tiered story "frames" plus a pool of filler beats that pad each story to the
   target length. Generation is pure (no randomness/time) so server and client
   render identically and indexes stay stable. */

type Subject = { name: string; animal: string; emoji: string };
type Place = { name: string; emoji: string };
type Sentence = (s: Subject, p: Place) => string;
type Frame = { prefix: string; plot: Sentence[] };

const SUBJECTS: Subject[] = [
  { name: "Sam", animal: "cat", emoji: "🐱" },
  { name: "Pip", animal: "dog", emoji: "🐶" },
  { name: "Pog", animal: "pig", emoji: "🐷" },
  { name: "Hetty", animal: "hen", emoji: "🐔" },
  { name: "Rusty", animal: "fox", emoji: "🦊" },
  { name: "Fred", animal: "frog", emoji: "🐸" },
  { name: "Dot", animal: "duck", emoji: "🦆" },
  { name: "Ollie", animal: "owl", emoji: "🦉" },
  { name: "Bo", animal: "bear", emoji: "🐻" },
  { name: "Finn", animal: "fish", emoji: "🐟" },
  { name: "Bea", animal: "bird", emoji: "🐦" },
  { name: "Roo", animal: "rabbit", emoji: "🐰" },
  { name: "Coco", animal: "cow", emoji: "🐮" },
  { name: "Max", animal: "mouse", emoji: "🐭" },
];

const PLACES_A: Place[] = [
  { name: "park", emoji: "🏞️" },
  { name: "pond", emoji: "🪷" },
  { name: "hill", emoji: "⛰️" },
  { name: "garden", emoji: "🌻" },
  { name: "barn", emoji: "🛖" },
  { name: "beach", emoji: "🏖️" },
];
const PLACES_B: Place[] = [
  { name: "forest", emoji: "🌲" },
  { name: "river", emoji: "🌊" },
  { name: "market", emoji: "🏪" },
  { name: "castle", emoji: "🏰" },
  { name: "meadow", emoji: "🌾" },
  { name: "cave", emoji: "🕳️" },
];
const PLACES_C: Place[] = [
  { name: "valley", emoji: "🏞️" },
  { name: "harbour", emoji: "⚓" },
  { name: "museum", emoji: "🏛️" },
  { name: "island", emoji: "🏝️" },
  { name: "mountain", emoji: "🏔️" },
  { name: "observatory", emoji: "🔭" },
];

/* ---- Tier A (Years 1–2): short, simple sentences ---- */
const FRAMES_A: Frame[] = [
  {
    prefix: "at the",
    plot: [
      (s, p) => `${s.name} the ${s.animal} went to the ${p.name}.`,
      () => `It was a bright and happy day.`,
      (s) => `${s.name} could not wait to play.`,
    ],
  },
  {
    prefix: "and the",
    plot: [
      (s, p) => `${s.name} the ${s.animal} saw a big ${p.name}.`,
      () => `So many fun things to do!`,
      (s) => `${s.name} skipped along with joy.`,
    ],
  },
  {
    prefix: "by the",
    plot: [
      (s, p) => `${s.name} the ${s.animal} sat by the ${p.name}.`,
      () => `The day was calm and warm.`,
      (s) => `${s.name} looked all around.`,
    ],
  },
  {
    prefix: "in the",
    plot: [
      (s, p) => `${s.name} the ${s.animal} played in the ${p.name}.`,
      () => `Hide and seek is the best game.`,
      (s) => `Can you find ${s.name}?`,
    ],
  },
];
const POOL_A: Sentence[] = [
  (s, p) => `${s.name} ran fast in the ${p.name}.`,
  (s) => `${s.name} saw a little bird hop by.`,
  (s) => `${s.name} had a big red ball.`,
  () => `The warm sun was bright and gold.`,
  (s) => `${s.name} liked to jump up high.`,
  () => `A green frog sat on a rock.`,
  (s) => `${s.name} ate a yummy snack.`,
  (s) => `${s.name} met a kind new friend.`,
  () => `They played a fun game together.`,
  (s) => `${s.name} sang a happy little song.`,
  () => `A duck swam in the cool pond.`,
  (s) => `${s.name} did a silly dance.`,
  (s) => `${s.name} found a soft, fluffy feather.`,
  () => `The wind blew the tall grass.`,
  (s) => `${s.name} ran around and around.`,
  (s) => `${s.name} gave a big, happy grin.`,
  (s) => `A bee buzzed past ${s.name}.`,
  (s) => `${s.name} rolled down the green hill.`,
  (s) => `${s.name} clapped two little paws.`,
  () => `Everyone laughed and had lots of fun.`,
];

/* ---- Tier B (Years 3–4): longer sentences ---- */
const FRAMES_B: Frame[] = [
  {
    prefix: "and the",
    plot: [
      (s, p) => `One morning, ${s.name} the ${s.animal} set off to explore the ${p.name}.`,
      () => `The path wound between mossy rocks and ferns.`,
      (s) => `${s.name} felt a little nervous but very excited.`,
    ],
  },
  {
    prefix: "at the",
    plot: [
      (s, p) => `There was a big event at the ${p.name} today.`,
      (s) => `${s.name} the ${s.animal} arrived bright and early.`,
      () => `Everyone was buzzing with excitement.`,
    ],
  },
  {
    prefix: "near the",
    plot: [
      (s, p) => `Dark clouds gathered slowly near the ${p.name}.`,
      (s) => `${s.name} the ${s.animal} hurried to find some shelter.`,
      () => `Soon the storm would surely pass.`,
    ],
  },
  {
    prefix: "by the",
    plot: [
      (s, p) => `By the ${p.name}, ${s.name} the ${s.animal} spotted something unusual.`,
      () => `It was small, shiny, and half hidden.`,
      (s) => `${s.name} crept closer to take a look.`,
    ],
  },
];
const POOL_B: Sentence[] = [
  (s, p) => `Tall trees swayed gently around the ${p.name}.`,
  (s) => `${s.name} the ${s.animal} felt brave and curious.`,
  () => `A friendly voice called out from far away.`,
  () => `Bright sunshine sparkled on the cool water.`,
  (s) => `${s.name} carefully climbed over a fallen log.`,
  () => `A wise old owl watched from a branch.`,
  (s) => `${s.name} discovered a shiny stone on the path.`,
  () => `Soft rain began to patter on the leaves.`,
  (s) => `${s.name} laughed and splashed in a puddle.`,
  () => `A colourful rainbow stretched across the sky.`,
  (s) => `${s.name} shared a tasty snack with a friend.`,
  () => `The gentle breeze smelled of fresh flowers.`,
  (s) => `${s.name} ran quickly along the winding trail.`,
  () => `Together they built a little den from sticks.`,
  (s) => `${s.name} felt proud of working so hard.`,
  () => `Birds sang a cheerful tune in the trees.`,
  (s) => `${s.name} waved goodbye and headed home.`,
  () => `The adventure had been wonderful and fun.`,
];

/* ---- Tier C (Years 5–6): complex sentences, rich vocabulary ---- */
const FRAMES_C: Frame[] = [
  {
    prefix: "and the",
    plot: [
      (s, p) => `Beyond the misty ${p.name}, an enormous mountain rose towards the clouds.`,
      (s) => `${s.name} the ${s.animal} resolved to reach its distant, snowy summit.`,
      () => `The climb would test every ounce of courage and strength.`,
    ],
  },
  {
    prefix: "below the",
    plot: [
      (s, p) => `Far below the ${p.name} lay a forgotten and dusty library.`,
      (s) => `${s.name} the ${s.animal} discovered it behind a crumbling stone wall.`,
      () => `Thousands of ancient books waited silently in the gloom.`,
    ],
  },
  {
    prefix: "at the",
    plot: [
      (s, p) => `A wild and sudden storm swept across the ${p.name} at night.`,
      (s) => `${s.name} the ${s.animal} gripped the wheel with steady, fearless hands.`,
      () => `Thunder rolled while lightning lit the churning sea.`,
    ],
  },
  {
    prefix: "near the",
    plot: [
      (s, p) => `Near the ${p.name}, ${s.name} the ${s.animal} tinkered with peculiar inventions.`,
      () => `One evening, an extraordinary idea sparked vividly to life.`,
      () => `After hours of work, the strange machine was finally ready.`,
    ],
  },
];
const POOL_C: Sentence[] = [
  (s, p) => `The ${p.name} stretched out beneath a wide and endless sky.`,
  (s) => `${s.name} the ${s.animal} paused to admire the breathtaking, distant view.`,
  (s) => `Determination glowed brightly in ${s.name}'s heart with every careful step.`,
  () => `A cool breeze carried the faint scent of adventure and discovery.`,
  (s) => `${s.name} remembered the old stories whispered by the village elders.`,
  () => `Shadows danced across the ground as the golden sun began to set.`,
  (s) => `${s.name} gathered courage and pressed onward through the unknown.`,
  (s) => `Curiosity pulled ${s.name} towards a mysterious, glittering light.`,
  () => `The journey was difficult, yet every challenge taught something new.`,
  (s) => `${s.name} marvelled at the wonders hidden in such a quiet place.`,
  (s) => `With patience and care, ${s.name} solved each tricky puzzle.`,
  (s) => `A deep sense of pride and wonder filled ${s.name} completely.`,
  () => `The world felt enormous, beautiful, and full of endless possibility.`,
  (s) => `${s.name} promised to return and explore even more one day.`,
];

const TIERS = [
  { places: PLACES_A, frames: FRAMES_A, pool: POOL_A },
  { places: PLACES_B, frames: FRAMES_B, pool: POOL_B },
  { places: PLACES_C, frames: FRAMES_C, pool: POOL_C },
];

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Assemble a single-page story of `target` words (never exceeding 150): the
 * frame's plot sentences first, then filler beats from the pool, padding until
 * the word target is reached.
 */
function assemble(
  frame: Frame,
  pool: Sentence[],
  subject: Subject,
  place: Place,
  offset: number,
  target: number,
): string {
  const out = frame.plot.map((fn) => fn(subject, place));
  let words = countWords(out.join(" "));
  const used = new Set<number>();
  for (let j = 0; j < pool.length && words < target; j++) {
    const idx = (offset + j) % pool.length;
    if (used.has(idx)) continue;
    const sentence = pool[idx](subject, place);
    const w = countWords(sentence);
    if (words + w > 150) break; // keep every story at or under 150 words
    used.add(idx);
    out.push(sentence);
    words += w;
  }
  return out.join(" ");
}

/**
 * Build `count` single-page stories (~100–150 words) for a level. `levelIndex`
 * (0–5) selects the difficulty tier and an offset so sibling years differ.
 */
export function buildStories(
  levelId: string,
  levelIndex: number,
  lexileLow: number,
  lexileHigh: number,
  count: number,
  wordTarget: number,
): Story[] {
  const tier = TIERS[Math.floor(levelIndex / 2)];
  const base = (levelIndex % 2) * 112; // distinct slice for the sibling year
  const { places, frames, pool } = tier;
  const nSub = SUBJECTS.length;
  const nPlace = places.length;

  const stories: Story[] = [];
  for (let k = 0; k < count; k++) {
    const idx = base + k;
    const subject = SUBJECTS[idx % nSub];
    const rem = Math.floor(idx / nSub);
    const place = places[rem % nPlace];
    const frame = frames[Math.floor(rem / nPlace) % frames.length];

    const text = assemble(frame, pool, subject, place, k * 7, wordTarget);
    const span = lexileHigh - lexileLow;
    const lexile =
      lexileLow + Math.round((count > 1 ? (k / (count - 1)) * span : 0) / 10) * 10;

    stories.push({
      id: `${levelId}-g${k}`,
      title: `${subject.name} ${frame.prefix} ${cap(place.name)}`,
      emoji: subject.emoji,
      lexile,
      pages: [{ text, emoji: subject.emoji }],
    });
  }
  return stories;
}
