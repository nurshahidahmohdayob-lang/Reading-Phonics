export type Word = {
  /** The example word, e.g. "apple". */
  text: string;
  /** A visual cue rendered as an emoji. */
  emoji: string;
};

export type Lesson = {
  /** Lowercase letter (or digraph like "qu") the lesson focuses on. */
  letter: string;
  /** A short, kid-friendly pronunciation hint, e.g. "ah". */
  sound: string;
  /** What the sound is "like", shown as a caption. */
  hint: string;
  /** Example words that start with (or feature) the focus sound. */
  words: Word[];
};

export const lessons: Lesson[] = [
  {
    letter: "a",
    sound: "ah",
    hint: 'short "a" like in apple',
    words: [
      { text: "apple", emoji: "🍎" },
      { text: "ant", emoji: "🐜" },
      { text: "axe", emoji: "🪓" },
      { text: "alligator", emoji: "🐊" },
      { text: "arrow", emoji: "🏹" },
      { text: "astronaut", emoji: "🧑‍🚀" },
    ],
  },
  {
    letter: "b",
    sound: "buh",
    hint: 'the "b" sound like in ball',
    words: [
      { text: "ball", emoji: "⚽" },
      { text: "bear", emoji: "🐻" },
      { text: "banana", emoji: "🍌" },
      { text: "bus", emoji: "🚌" },
      { text: "bed", emoji: "🛏️" },
      { text: "butterfly", emoji: "🦋" },
    ],
  },
  {
    letter: "c",
    sound: "kuh",
    hint: 'hard "c" like in cat',
    words: [
      { text: "cat", emoji: "🐱" },
      { text: "car", emoji: "🚗" },
      { text: "cake", emoji: "🎂" },
      { text: "cow", emoji: "🐮" },
      { text: "carrot", emoji: "🥕" },
      { text: "cup", emoji: "🥤" },
    ],
  },
  {
    letter: "d",
    sound: "duh",
    hint: 'the "d" sound like in dog',
    words: [
      { text: "dog", emoji: "🐶" },
      { text: "duck", emoji: "🦆" },
      { text: "drum", emoji: "🥁" },
      { text: "door", emoji: "🚪" },
      { text: "dinosaur", emoji: "🦕" },
      { text: "dolphin", emoji: "🐬" },
    ],
  },
  {
    letter: "e",
    sound: "eh",
    hint: 'short "e" like in egg',
    words: [
      { text: "egg", emoji: "🥚" },
      { text: "elephant", emoji: "🐘" },
      { text: "engine", emoji: "🚂" },
      { text: "envelope", emoji: "✉️" },
      { text: "elf", emoji: "🧝" },
      { text: "elbow", emoji: "💪" },
    ],
  },
  {
    letter: "f",
    sound: "fff",
    hint: 'the "f" sound like in fish',
    words: [
      { text: "fish", emoji: "🐟" },
      { text: "frog", emoji: "🐸" },
      { text: "fire", emoji: "🔥" },
      { text: "fox", emoji: "🦊" },
      { text: "flower", emoji: "🌸" },
      { text: "fork", emoji: "🍴" },
    ],
  },
  {
    letter: "g",
    sound: "guh",
    hint: 'hard "g" like in goat',
    words: [
      { text: "goat", emoji: "🐐" },
      { text: "grapes", emoji: "🍇" },
      { text: "gift", emoji: "🎁" },
      { text: "guitar", emoji: "🎸" },
      { text: "girl", emoji: "👧" },
      { text: "gorilla", emoji: "🦍" },
    ],
  },
  {
    letter: "h",
    sound: "huh",
    hint: 'the "h" sound like in hat',
    words: [
      { text: "hat", emoji: "🎩" },
      { text: "horse", emoji: "🐴" },
      { text: "house", emoji: "🏠" },
      { text: "heart", emoji: "❤️" },
      { text: "hand", emoji: "✋" },
      { text: "hippo", emoji: "🦛" },
    ],
  },
  {
    letter: "i",
    sound: "ih",
    hint: 'short "i" like in insect',
    words: [
      { text: "insect", emoji: "🐛" },
      { text: "ink", emoji: "🖊️" },
      { text: "iguana", emoji: "🦎" },
      { text: "infant", emoji: "👶" },
      { text: "igloo", emoji: "🧊" },
      { text: "ill", emoji: "🤒" },
    ],
  },
  {
    letter: "j",
    sound: "juh",
    hint: 'the "j" sound like in jelly',
    words: [
      { text: "jelly", emoji: "🍮" },
      { text: "jam", emoji: "🍓" },
      { text: "jet", emoji: "✈️" },
      { text: "juice", emoji: "🧃" },
      { text: "jellyfish", emoji: "🪼" },
      { text: "jacket", emoji: "🧥" },
    ],
  },
  {
    letter: "k",
    sound: "kuh",
    hint: 'the "k" sound like in kite',
    words: [
      { text: "kite", emoji: "🪁" },
      { text: "key", emoji: "🔑" },
      { text: "king", emoji: "🤴" },
      { text: "kangaroo", emoji: "🦘" },
      { text: "kitten", emoji: "🐱" },
      { text: "koala", emoji: "🐨" },
    ],
  },
  {
    letter: "l",
    sound: "lll",
    hint: 'the "l" sound like in lion',
    words: [
      { text: "lion", emoji: "🦁" },
      { text: "leaf", emoji: "🍃" },
      { text: "lollipop", emoji: "🍭" },
      { text: "lemon", emoji: "🍋" },
      { text: "ladder", emoji: "🪜" },
      { text: "leg", emoji: "🦵" },
    ],
  },
  {
    letter: "m",
    sound: "mmm",
    hint: 'the "m" sound like in moon',
    words: [
      { text: "moon", emoji: "🌙" },
      { text: "monkey", emoji: "🐵" },
      { text: "milk", emoji: "🥛" },
      { text: "mouse", emoji: "🐭" },
      { text: "map", emoji: "🗺️" },
      { text: "mango", emoji: "🥭" },
    ],
  },
  {
    letter: "n",
    sound: "nnn",
    hint: 'the "n" sound like in net',
    words: [
      { text: "net", emoji: "🥅" },
      { text: "nose", emoji: "👃" },
      { text: "nest", emoji: "🪺" },
      { text: "nut", emoji: "🥜" },
      { text: "nurse", emoji: "🧑‍⚕️" },
      { text: "nine", emoji: "9️⃣" },
    ],
  },
  {
    letter: "o",
    sound: "o",
    hint: 'short "o" like in orange',
    words: [
      { text: "orange", emoji: "🍊" },
      { text: "octopus", emoji: "🐙" },
      { text: "ox", emoji: "🐂" },
      { text: "olive", emoji: "🫒" },
      { text: "otter", emoji: "🦦" },
      { text: "omelette", emoji: "🍳" },
    ],
  },
  {
    letter: "p",
    sound: "puh",
    hint: 'the "p" sound like in pig',
    words: [
      { text: "pig", emoji: "🐷" },
      { text: "pizza", emoji: "🍕" },
      { text: "pencil", emoji: "✏️" },
      { text: "panda", emoji: "🐼" },
      { text: "pineapple", emoji: "🍍" },
      { text: "penguin", emoji: "🐧" },
    ],
  },
  {
    letter: "qu",
    sound: "kwuh",
    hint: '"qu" like in queen',
    words: [
      { text: "queen", emoji: "👑" },
      { text: "question", emoji: "❓" },
      { text: "quiet", emoji: "🤫" },
      { text: "quail", emoji: "🐦" },
      { text: "quack", emoji: "🦆" },
      { text: "quiz", emoji: "📝" },
    ],
  },
  {
    letter: "r",
    sound: "rrr",
    hint: 'the "r" sound like in rabbit',
    words: [
      { text: "rabbit", emoji: "🐰" },
      { text: "rainbow", emoji: "🌈" },
      { text: "robot", emoji: "🤖" },
      { text: "ring", emoji: "💍" },
      { text: "rocket", emoji: "🚀" },
      { text: "rain", emoji: "🌧️" },
    ],
  },
  {
    letter: "s",
    sound: "sss",
    hint: 'the "s" sound like in sun',
    words: [
      { text: "sun", emoji: "☀️" },
      { text: "snake", emoji: "🐍" },
      { text: "star", emoji: "⭐" },
      { text: "sock", emoji: "🧦" },
      { text: "spider", emoji: "🕷️" },
      { text: "strawberry", emoji: "🍓" },
    ],
  },
  {
    letter: "t",
    sound: "tuh",
    hint: 'the "t" sound like in tiger',
    words: [
      { text: "tiger", emoji: "🐯" },
      { text: "tree", emoji: "🌳" },
      { text: "train", emoji: "🚆" },
      { text: "turtle", emoji: "🐢" },
      { text: "tomato", emoji: "🍅" },
      { text: "tooth", emoji: "🦷" },
    ],
  },
  {
    letter: "u",
    sound: "uh",
    hint: 'short "u" like in umbrella',
    words: [
      { text: "umbrella", emoji: "☂️" },
      { text: "up", emoji: "⬆️" },
      { text: "uncle", emoji: "👨" },
      { text: "upset", emoji: "😠" },
      { text: "under", emoji: "🔽" },
      { text: "underwear", emoji: "🩲" },
    ],
  },
  {
    letter: "v",
    sound: "vvv",
    hint: 'the "v" sound like in van',
    words: [
      { text: "van", emoji: "🚐" },
      { text: "violin", emoji: "🎻" },
      { text: "volcano", emoji: "🌋" },
      { text: "vase", emoji: "🏺" },
      { text: "vegetables", emoji: "🥦" },
      { text: "vest", emoji: "🦺" },
    ],
  },
  {
    letter: "w",
    sound: "wuh",
    hint: 'the "w" sound like in web',
    words: [
      { text: "web", emoji: "🕸️" },
      { text: "whale", emoji: "🐳" },
      { text: "watch", emoji: "⌚" },
      { text: "watermelon", emoji: "🍉" },
      { text: "wolf", emoji: "🐺" },
      { text: "worm", emoji: "🪱" },
    ],
  },
  {
    letter: "x",
    sound: "ks",
    hint: '"x" says ks, like at the end of fox',
    words: [
      { text: "fox", emoji: "🦊" },
      { text: "box", emoji: "📦" },
      { text: "six", emoji: "6️⃣" },
      { text: "x-ray", emoji: "🩻" },
      { text: "taxi", emoji: "🚕" },
      { text: "mix", emoji: "🥣" },
    ],
  },
  {
    letter: "y",
    sound: "yuh",
    hint: 'the "y" sound like in yo-yo',
    words: [
      { text: "yo-yo", emoji: "🪀" },
      { text: "yogurt", emoji: "🍨" },
      { text: "yarn", emoji: "🧶" },
      { text: "yellow", emoji: "💛" },
      { text: "yawn", emoji: "🥱" },
      { text: "yacht", emoji: "⛵" },
    ],
  },
  {
    letter: "z",
    sound: "zzz",
    hint: 'the "z" sound like in zebra',
    words: [
      { text: "zebra", emoji: "🦓" },
      { text: "zip", emoji: "🤐" },
      { text: "zero", emoji: "0️⃣" },
      { text: "zigzag", emoji: "⚡" },
      { text: "zucchini", emoji: "🥒" },
      { text: "zombie", emoji: "🧟" },
    ],
  },
];
