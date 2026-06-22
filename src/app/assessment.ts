import type { StoryQuiz } from "@/app/stories";

/** A levelled passage for the Reading Assessment: split into book pages (each
    with a picture) and followed by 5 comprehension questions. */
export type AssessPassage = {
  /** Reading level index, 0 = Year 1 … 5 = Year 6. */
  level: number;
  title: string;
  emoji: string;
  pages: { text: string; emoji: string }[];
  questions: StoryQuiz[]; // exactly 5
};

/** Helper to keep the data terse. */
function Q(question: string, options: [string, string][], answer: number): StoryQuiz {
  return { question, options: options.map(([e, l]) => ({ emoji: e, label: l })), answer };
}

export const assessmentPassages: AssessPassage[] = [
  /* ---- Year 1 ---- */
  {
    level: 0,
    title: "Sam and the Hat",
    emoji: "🐱",
    pages: [
      { text: "Sam is a cat. Sam has a red hat.", emoji: "🐱" },
      { text: "Sam runs in the sun. The wind blows hard.", emoji: "🌬️" },
      { text: "Off goes the red hat! It lands on a hen.", emoji: "🐔" },
      { text: "The hen likes the hat. She will not give it back.", emoji: "🪺" },
      { text: "So Sam gets a new hat. The new hat is blue.", emoji: "🧢" },
    ],
    questions: [
      Q("What animal is Sam?", [["🐶", "A dog"], ["🐱", "A cat"], ["🐔", "A hen"]], 1),
      Q("What colour was Sam's first hat?", [["🔴", "Red"], ["🔵", "Blue"], ["🟢", "Green"]], 0),
      Q("What made the hat fall off?", [["🌧️", "The rain"], ["🐶", "A dog"], ["🌬️", "The wind"]], 2),
      Q("Where did the hat land?", [["🐔", "On a hen"], ["📦", "In a box"], ["🪵", "On a log"]], 0),
      Q("What colour is the new hat?", [["🟡", "Yellow"], ["🔵", "Blue"], ["🔴", "Red"]], 1),
    ],
  },
  /* ---- Year 2 ---- */
  {
    level: 1,
    title: "A Day at the Park",
    emoji: "🏞️",
    pages: [
      { text: "Tom and Meg went to the park on a sunny day.", emoji: "🏞️" },
      { text: "First, they ran on the grass and kicked a ball.", emoji: "⚽" },
      { text: "Then Meg went up the big slide. Whee, it was fast!", emoji: "🛝" },
      { text: "Soon, dark clouds came and it began to rain.", emoji: "🌧️" },
      { text: "Mum came with an umbrella, and they went home for lunch.", emoji: "☂️" },
    ],
    questions: [
      Q("Who went to the park?", [["👩", "Mum and Dad"], ["👧", "Tom and Meg"], ["👦", "Sam and Pip"]], 1),
      Q("What did they kick?", [["⚽", "A ball"], ["🪁", "A kite"], ["🥏", "A frisbee"]], 0),
      Q("What did Meg go up?", [["🎠", "The swing"], ["🪜", "A ladder"], ["🛝", "The slide"]], 2),
      Q("Why did they stop playing?", [["🍽️", "They were hungry"], ["🌧️", "It started to rain"], ["🌙", "It got dark"]], 1),
      Q("What did Mum bring?", [["🧺", "A basket"], ["🚲", "A bike"], ["☂️", "An umbrella"]], 2),
    ],
  },
  /* ---- Year 3 ---- */
  {
    level: 2,
    title: "The Lost Puppy",
    emoji: "🐶",
    pages: [
      { text: "Lily heard a soft cry from the bushes.", emoji: "🌳" },
      { text: "Inside, she found a small, wet puppy.", emoji: "🐶" },
      { text: "It was cold and shivering in the rain.", emoji: "🌧️" },
      { text: "Lily wrapped it in her scarf and took it home.", emoji: "🧣" },
      { text: "She gave it milk, and it fell asleep.", emoji: "🥛" },
      { text: "She named it Lucky, for it had found a friend.", emoji: "🐾" },
    ],
    questions: [
      Q("Where did Lily hear the cry?", [["🏠", "In the house"], ["🌳", "In the bushes"], ["🚗", "In a car"]], 1),
      Q("What did she find?", [["🐱", "A kitten"], ["🐦", "A bird"], ["🐶", "A puppy"]], 2),
      Q("How did the puppy feel?", [["🥶", "Cold"], ["🥵", "Hot"], ["😡", "Angry"]], 0),
      Q("What did Lily wrap it in?", [["🧥", "A coat"], ["🧣", "Her scarf"], ["📰", "Paper"]], 1),
      Q("Why did she call it Lucky?", [["🍀", "It was green"], ["💰", "It found money"], ["🐾", "It had found a friend"]], 2),
    ],
  },
  /* ---- Year 4 ---- */
  {
    level: 3,
    title: "The Brave Little Fox",
    emoji: "🦊",
    pages: [
      { text: "A little fox lived in the deep, dark wood.", emoji: "🦊" },
      { text: "One night, he heard a strange noise outside.", emoji: "🌙" },
      { text: "His heart pounded, but he wanted to be brave.", emoji: "💓" },
      { text: "Slowly, he crept towards the sound.", emoji: "👣" },
      { text: "It was just an owl hooting in a tree!", emoji: "🦉" },
      { text: "The fox laughed and trotted home to sleep.", emoji: "😄" },
    ],
    questions: [
      Q("Where did the fox live?", [["🏔️", "On a mountain"], ["🌲", "In the wood"], ["🏖️", "By the sea"]], 1),
      Q("When did he hear the noise?", [["🌙", "At night"], ["☀️", "In the morning"], ["🌆", "At sunset"]], 0),
      Q("How did the fox feel at first?", [["😆", "Happy"], ["😡", "Angry"], ["😨", "Scared"]], 2),
      Q("What was making the noise?", [["🐺", "A wolf"], ["🦉", "An owl"], ["🐰", "A rabbit"]], 1),
      Q("What did the fox do at the end?", [["😭", "Cried"], ["🏃", "Ran away"], ["😄", "Laughed and went home"]], 2),
    ],
  },
  /* ---- Year 5 ---- */
  {
    level: 4,
    title: "The Magic Seed",
    emoji: "🌱",
    pages: [
      { text: "Anya planted a tiny seed in her garden.", emoji: "🌱" },
      { text: "Every day, she gave it water and sunlight.", emoji: "💧" },
      { text: "At first nothing grew, and she nearly gave up.", emoji: "😕" },
      { text: "Then a green shoot pushed through the soil.", emoji: "🌿" },
      { text: "It grew taller than the rooftops!", emoji: "🏠" },
      { text: "At the top bloomed the most beautiful flower.", emoji: "🌺" },
    ],
    questions: [
      Q("What did Anya plant?", [["🌳", "A tree"], ["🌱", "A seed"], ["🌷", "A bulb"]], 1),
      Q("What did she give it each day?", [["💧", "Water and sunlight"], ["🍫", "Sweets"], ["🎵", "Music"]], 0),
      Q("How did she feel when nothing grew?", [["😀", "Excited"], ["😴", "Bored"], ["😕", "Like giving up"]], 2),
      Q("How tall did the plant grow?", [["👣", "Very short"], ["🏠", "Higher than the rooftops"], ["🌿", "Knee-high"]], 1),
      Q("What was at the very top?", [["🍎", "An apple"], ["🪺", "A nest"], ["🌺", "A beautiful flower"]], 2),
    ],
  },
  /* ---- Year 6 ---- */
  {
    level: 5,
    title: "The Hidden Cave",
    emoji: "🕳️",
    pages: [
      { text: "Beyond the forest lay a cave few had explored.", emoji: "🌲" },
      { text: "Curious and determined, Maya gripped her flashlight.", emoji: "🔦" },
      { text: "The narrow passage led into the cold darkness.", emoji: "🦇" },
      { text: "Suddenly, the walls glittered with thousands of crystals.", emoji: "💎" },
      { text: "She had discovered something truly extraordinary.", emoji: "✨" },
      { text: "Maya sketched the cave to share her wonder.", emoji: "📓" },
    ],
    questions: [
      Q("What lay beyond the forest?", [["🏰", "A castle"], ["🕳️", "A cave"], ["🌊", "A lake"]], 1),
      Q("What did Maya hold tightly?", [["🗺️", "A map"], ["🪢", "A rope"], ["🔦", "A flashlight"]], 2),
      Q("What was the passage like?", [["🥶", "Cold and dark"], ["☀️", "Bright and warm"], ["🌸", "Full of flowers"]], 0),
      Q("What glittered on the walls?", [["💰", "Gold coins"], ["💎", "Crystals"], ["💧", "Water"]], 1),
      Q("What did Maya do at the end?", [["📓", "Sketched the cave"], ["🏃", "Ran away"], ["😴", "Fell asleep"]], 0),
    ],
  },
];
