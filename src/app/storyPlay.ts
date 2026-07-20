/* Short picture-stories for the Story Play games:
   - Match the Picture: read a sentence, tap the emoji that matches.
   - Put the Story in Order: rebuild the story from shuffled sentences.
   Each story is 4 short sentences, each with its own clear picture. */

export type PlaySentence = { text: string; emoji: string };
export type PlayStory = {
  id: string;
  title: string;
  emoji: string;
  sentences: PlaySentence[];
};

export const playStories: PlayStory[] = [
  {
    id: "hat",
    title: "The Cat and the Hat",
    emoji: "🐱",
    sentences: [
      { text: "The cat has a red hat.", emoji: "🎩" },
      { text: "The wind blows the hat away.", emoji: "🌬️" },
      { text: "The hat lands on a hen.", emoji: "🐔" },
      { text: "The cat gets a new blue hat.", emoji: "🧢" },
    ],
  },
  {
    id: "pip",
    title: "Pip the Dog",
    emoji: "🐶",
    sentences: [
      { text: "Pip runs in the park.", emoji: "🏞️" },
      { text: "Pip sees a big ball.", emoji: "⚽" },
      { text: "The ball rolls into the pond.", emoji: "💦" },
      { text: "Pip jumps in to get it.", emoji: "🦴" },
    ],
  },
  {
    id: "seed",
    title: "The Little Seed",
    emoji: "🌱",
    sentences: [
      { text: "Mia plants a tiny seed.", emoji: "🌱" },
      { text: "She gives it water and sun.", emoji: "💧" },
      { text: "A small green shoot grows.", emoji: "🌿" },
      { text: "At last a flower blooms.", emoji: "🌸" },
    ],
  },
  {
    id: "cake",
    title: "Baking a Cake",
    emoji: "🎂",
    sentences: [
      { text: "We mix the flour and eggs.", emoji: "🥣" },
      { text: "We pour it into the tin.", emoji: "🧁" },
      { text: "The cake bakes in the oven.", emoji: "🔥" },
      { text: "We eat the yummy cake.", emoji: "🎂" },
    ],
  },
  {
    id: "beach",
    title: "A Day at the Beach",
    emoji: "🏖️",
    sentences: [
      { text: "We drive to the sunny beach.", emoji: "🚗" },
      { text: "We build a big sandcastle.", emoji: "🏰" },
      { text: "We swim in the cool sea.", emoji: "🌊" },
      { text: "We eat ice cream in the sun.", emoji: "🍦" },
    ],
  },
  {
    id: "snow",
    title: "The Snowy Day",
    emoji: "❄️",
    sentences: [
      { text: "Snow falls on the ground.", emoji: "❄️" },
      { text: "Ben puts on his warm coat.", emoji: "🧥" },
      { text: "He rolls a big snowball.", emoji: "⛄" },
      { text: "He drinks hot cocoa inside.", emoji: "☕" },
    ],
  },
  {
    id: "puppy",
    title: "The Lost Puppy",
    emoji: "🐾",
    sentences: [
      { text: "Lily hears a soft cry.", emoji: "👂" },
      { text: "She finds a wet puppy.", emoji: "🐶" },
      { text: "She wraps it in a warm scarf.", emoji: "🧣" },
      { text: "The puppy is happy and safe.", emoji: "🏠" },
    ],
  },
  {
    id: "bird",
    title: "The Baby Bird",
    emoji: "🐣",
    sentences: [
      { text: "An egg sits in the nest.", emoji: "🥚" },
      { text: "The egg cracks open.", emoji: "🐣" },
      { text: "The baby bird flaps its wings.", emoji: "🐤" },
      { text: "It flies up into the sky.", emoji: "🐦" },
    ],
  },
];

/** All sentences from every story, for the picture-match pool. */
export const allPlaySentences: PlaySentence[] = playStories.flatMap(
  (s) => s.sentences,
);
