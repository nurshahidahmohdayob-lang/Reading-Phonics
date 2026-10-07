import type { Level, Story, StoryQuiz } from "@/app/stories";

/* The Starter level: first stories, for children reading at BR99L — below
   the Year 1 band (190L), where every other story begins.

   Each is a handful of very short sentences: three-letter words that can be
   sounded out (cat, pig, hop, sun), a few of the first tricky words (I, a,
   the, is, my, go, to, he, we), lots of repetition, and one picture question.
   They're filed at BR99L — stored as 50, the way the app stores a BR99
   reading level everywhere else — so a beginning reader's level opens here.

   Only Guided Reading offers this level (see app/passages.ts). The shared
   `levels` list that the Reading Assessment steps through by position is
   left as Year 1–6. */

function S(
  id: string,
  title: string,
  emoji: string,
  text: string,
  question: string,
  options: [string, string][],
  answer: number,
): Story {
  const quiz: StoryQuiz = {
    question,
    options: options.map(([e, l]) => ({ emoji: e, label: l })),
    answer,
  };
  return { id, title, emoji, lexile: 50, pages: [{ text, emoji }], quiz };
}

const STARTER: Story[] = [
  S("br-01", "I See a Cat", "🐱", "I see a cat. The cat is big. The cat can sit. The cat sits on a mat. Hello, cat!", "Where does the cat sit?", [["🟫", "On a mat"], ["🌳", "In a tree"], ["🛏️", "On a bed"]], 0),
  S("br-02", "My Red Dog", "🐶", "I have a dog. My dog is red. My dog can run. Run, dog, run! My dog is fun.", "What colour is the dog?", [["🔴", "Red"], ["🔵", "Blue"], ["🟢", "Green"]], 0),
  S("br-03", "Pig in Mud", "🐷", "Look at the pig. The pig is big. The pig is in the mud. The pig is wet. Get up, pig!", "Where is the pig?", [["🟤", "In the mud"], ["🛁", "In a bath"], ["🚗", "In a car"]], 0),
  S("br-04", "Hop, Frog, Hop", "🐸", "A frog can hop. Hop, hop, hop. The frog hops on a log. The frog hops in. Splash!", "What can the frog do?", [["🐸", "Hop"], ["🦅", "Fly"], ["📖", "Read"]], 0),
  S("br-05", "The Hen and the Egg", "🐔", "The hen is red. The hen has an egg. The egg is in a nest. The hen sits on the egg.", "What does the hen have?", [["🥚", "An egg"], ["🍎", "An apple"], ["⚽", "A ball"]], 0),
  S("br-06", "Up the Hill", "⛰️", "Tom can run. Tom runs up the hill. Up, up, up! Tom is at the top. Tom is hot.", "Where does Tom run?", [["⛰️", "Up the hill"], ["🏠", "In the house"], ["🌊", "In the sea"]], 0),
  S("br-07", "Where Is My Hat?", "🎩", "I have a hat. My hat is on my bed. Where is my hat? It is not on my bed. It is on the cat!", "Where is the hat at the end?", [["🐱", "On the cat"], ["🛏️", "On the bed"], ["🚪", "By the door"]], 0),
  S("br-08", "Hot Sun", "☀️", "The sun is up. The sun is hot. I go out to play. I sit in the sun. I am hot too.", "How is the sun?", [["🔥", "Hot"], ["❄️", "Cold"], ["🌧️", "Wet"]], 0),
  S("br-09", "A Little Bug", "🐛", "I see a bug. The bug is on a leaf. The bug is little. The bug can dig. Dig, bug, dig!", "Where is the bug?", [["🍃", "On a leaf"], ["🍕", "On a pizza"], ["🧦", "In a sock"]], 0),
  S("br-10", "Fox in a Box", "🦊", "A fox sees a box. The fox gets in the box. The box is too little! The fox gets out.", "What did the fox get in?", [["📦", "A box"], ["🚌", "A bus"], ["🛁", "A bath"]], 0),
  S("br-11", "Mum and Me", "👩", "Mum and me go to the shop. We get a bun. We get jam. Mum and me have fun.", "What do they get?", [["🍞", "A bun"], ["🍦", "Ice cream"], ["🎈", "A balloon"]], 0),
  S("br-12", "Get on the Bus", "🚌", "Here is the bus. The bus is red. I get on the bus. The bus can go. Beep, beep!", "What colour is the bus?", [["🔴", "Red"], ["🟡", "Yellow"], ["🟢", "Green"]], 0),
  S("br-13", "Ben in the Bath", "🛁", "Ben is in the bath. Ben has a duck. The duck is yellow. Ben and the duck get wet.", "What does Ben have in the bath?", [["🦆", "A duck"], ["🐟", "A fish"], ["🐢", "A turtle"]], 0),
  S("br-14", "Pat the Dog", "🐕", "I can pat the dog. The dog is soft. The dog sits. The dog licks me. I like the dog.", "What does the dog do to me?", [["👅", "Licks me"], ["💤", "Sleeps on me"], ["🏃", "Runs off"]], 0),
  S("br-15", "Ten Pens", "🖊️", "I have ten pens. I have a red pen. I have a big pen. Can I get a pen? Yes, you can.", "How many pens do I have?", [["🔟", "Ten"], ["2️⃣", "Two"], ["5️⃣", "Five"]], 0),
  S("br-16", "Kick the Ball", "⚽", "I have a ball. I kick the ball. The ball goes up. The ball goes in the net. Goal!", "Where does the ball go?", [["🥅", "In the net"], ["🌳", "Up a tree"], ["🏠", "On the roof"]], 0),
  S("br-17", "Wet Day", "🌧️", "It is wet. Rain, rain, rain. I get my hat. I get my coat. I go out in the rain.", "What do I get?", [["🧥", "My coat"], ["🩳", "My shorts"], ["🕶️", "My sunglasses"]], 0),
  S("br-18", "Fish in a Tank", "🐟", "A fish is in a tank. The fish is red. It can swim. Swim, fish, swim! The fish is fast.", "Where is the fish?", [["🐠", "In a tank"], ["🌳", "In a tree"], ["🛏️", "In a bed"]], 0),
  S("br-19", "Get Up, Sam!", "⏰", "The sun is up. Get up, Sam! Sam is in bed. Sam is not up. Get up, get up!", "Where is Sam?", [["🛏️", "In bed"], ["🛁", "In the bath"], ["🚌", "On the bus"]], 0),
  S("br-20", "Sip, Sip", "🥛", "I have a cup. The cup has milk. I sip the milk. Sip, sip, sip. Now the cup has no milk.", "What is in the cup?", [["🥛", "Milk"], ["🧃", "Juice"], ["🍵", "Tea"]], 0),
  S("br-21", "Can You See Me?", "🙈", "I hide. Can you see me? I am in the box. I am not in the bed. You see me! Hello!", "Where am I?", [["📦", "In the box"], ["🛏️", "In the bed"], ["🚗", "In the car"]], 0),
  S("br-22", "Dad and the Bun", "🍞", "Dad has a bun. The bun is hot. Dad cuts the bun. Dad and I eat the bun. Yum!", "Who has a bun?", [["👨", "Dad"], ["👵", "Gran"], ["🐶", "The dog"]], 0),
  S("br-23", "Tap, Tap, Tap", "🥚", "I see an egg. It is a big egg. Tap, tap, tap. The egg cracks. A chick pops out!", "What pops out of the egg?", [["🐤", "A chick"], ["🐸", "A frog"], ["🐍", "A snake"]], 0),
  S("br-24", "The Big Van", "🚐", "Dad has a van. The van is big. We get in the van. The van can go fast. Zoom!", "Who has a van?", [["👨", "Dad"], ["👩", "Mum"], ["👦", "Ben"]], 0),
  S("br-25", "Sit, Pup!", "🐶", "Here is a pup. Sit, pup! The pup sits. Good pup! The pup gets a bone.", "What does the pup get?", [["🦴", "A bone"], ["⚽", "A ball"], ["🧸", "A teddy"]], 0),
  S("br-26", "Good Night, Moon", "🌙", "It is night. I see the moon. The moon is big. The moon is up in the sky. Good night, moon.", "What do I see?", [["🌙", "The moon"], ["☀️", "The sun"], ["🌈", "A rainbow"]], 0),
  S("br-27", "Up Goes My Kite", "🪁", "I have a kite. The wind is big. The kite goes up. Up, up, up! My kite is in the sky.", "Where is my kite?", [["☁️", "In the sky"], ["🌳", "In a tree"], ["🏠", "In the house"]], 0),
  S("br-28", "Red Jam", "🍓", "I like jam. I put jam on my bun. The jam is red. I eat it up. Yum, yum!", "What colour is the jam?", [["🔴", "Red"], ["🔵", "Blue"], ["🟢", "Green"]], 0),
  S("br-29", "Duck on the Pond", "🦆", "A duck is on the pond. The duck can swim. The duck dips in. The duck gets a bug. Quack!", "Where is the duck?", [["🏞️", "On the pond"], ["🛣️", "On the road"], ["🏠", "On the roof"]], 0),
  S("br-30", "Bed Time", "🛏️", "It is bed time. I get in bed. I have my teddy. I shut my eyes. Good night!", "What do I have in bed?", [["🧸", "My teddy"], ["⚽", "My ball"], ["🚗", "My car"]], 0),
];

/** The level itself, shaped like the Year 1–6 levels. Accuracy benchmarks
    are Year 1's; fluency is lower, as befits first reading. */
export const STARTER_LEVEL: Level = {
  id: "starter",
  grade: "Starter",
  age: 5,
  lexileRange: "BR99L",
  lexileLow: 0,
  lexileHigh: 185,
  wpmLow: 15,
  wpmHigh: 30,
  accuracyGoal: 95,
  independent: { min: 95, max: 100 },
  instructional: { min: 90, max: 94 },
  frustrationBelow: 90,
  description: "First words: tiny stories to sound out.",
  swatch: "bg-[#E8433A]",
  swatchText: "text-white",
  stories: STARTER,
};
