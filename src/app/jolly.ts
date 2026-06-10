/** The phonics sounds, taught in structured groups. Groups 1–7 follow the
    proven synthetic-phonics teaching order (most useful sounds first); groups
    8–9 add the extended code (alternative vowel spellings, digraphs and
    trigraphs) so the programme covers a fuller range of English phonemes. */
export type JollySound = {
  id: string;
  /** What's shown, e.g. "s", "ai", "sh", "th". */
  label: string;
  /** What the text-to-speech reads as the sound. */
  say: string;
  /** A multisensory action or hint for the sound. */
  action: string;
  /** Example word + picture. */
  word: string;
  emoji: string;
  group: number;
  note?: string;
};

export const jollyGroups: { group: number; sounds: JollySound[] }[] = [
  {
    group: 1,
    sounds: [
      { id: "s", label: "s", say: "sss", word: "snake", emoji: "🐍", group: 1, action: "Weave your hand like a snake and say ssssss." },
      { id: "a", label: "a", say: "a", word: "ant", emoji: "🐜", group: 1, action: "Wiggle your fingers above your elbow like ants crawling and say a, a, a." },
      { id: "t", label: "t", say: "tuh", word: "tennis", emoji: "🎾", group: 1, action: "Turn your head side to side as if watching tennis and say t, t, t." },
      { id: "i", label: "i", say: "ih", word: "insect", emoji: "🐛", group: 1, action: "Wriggle fingers at the end of your nose like a mouse and squeak i, i, i." },
      { id: "p", label: "p", say: "puh", word: "pig", emoji: "🐷", group: 1, action: "Pretend to puff out candles and say p, p, p." },
      { id: "n", label: "n", say: "nnn", word: "net", emoji: "🥅", group: 1, action: "Hold your arms out like a plane and say nnnnnn." },
    ],
  },
  {
    group: 2,
    sounds: [
      { id: "c", label: "c", say: "kuh", word: "cat", emoji: "🐱", group: 2, action: "Snap your fingers like castanets and say c, c, c." },
      { id: "k", label: "k", say: "kuh", word: "kite", emoji: "🪁", group: 2, action: "Snap your fingers like castanets and say k, k, k." },
      { id: "e", label: "e", say: "eh", word: "egg", emoji: "🥚", group: 2, action: "Pretend to crack an egg on a pan and say e, e, e." },
      { id: "h", label: "h", say: "huh", word: "hat", emoji: "🎩", group: 2, action: "Pant with your hand at your mouth as if out of breath and say h, h, h." },
      { id: "r", label: "r", say: "rrr", word: "rabbit", emoji: "🐰", group: 2, action: "Shake your head like a puppy with a rag and say rrrrrr." },
      { id: "m", label: "m", say: "mmm", word: "moon", emoji: "🌙", group: 2, action: "Rub your tummy at tasty food and say mmmmmm." },
      { id: "d", label: "d", say: "duh", word: "drum", emoji: "🥁", group: 2, action: "Beat your hands up and down like a drum and say d, d, d." },
    ],
  },
  {
    group: 3,
    sounds: [
      { id: "g", label: "g", say: "guh", word: "goat", emoji: "🐐", group: 3, action: "Spiral your hand down like water down a drain and say g, g, g." },
      { id: "o", label: "o", say: "o", word: "orange", emoji: "🍊", group: 3, action: "Flick a light switch on and off and say o, o." },
      { id: "u", label: "u", say: "uh", word: "umbrella", emoji: "☂️", group: 3, action: "Pretend to put up an umbrella and say u, u, u." },
      { id: "l", label: "l", say: "lll", word: "lollipop", emoji: "🍭", group: 3, action: "Pretend to lick a lollipop and say l, l, l." },
      { id: "f", label: "f", say: "fuh", word: "fish", emoji: "🐟", group: 3, action: "Let your hands come together like a deflating fish and say ffffff." },
      { id: "b", label: "b", say: "buh", word: "ball", emoji: "⚽", group: 3, action: "Pretend to hit a ball with a bat and say b, b, b." },
    ],
  },
  {
    group: 4,
    sounds: [
      { id: "ai", label: "ai", say: "ay", word: "rain", emoji: "🌧️", group: 4, action: "Cup your hand over your ear and say ai, ai, ai." },
      { id: "j", label: "j", say: "juh", word: "jelly", emoji: "🍮", group: 4, action: "Wobble like jelly on a plate and say j, j, j." },
      { id: "oa", label: "oa", say: "oh", word: "boat", emoji: "⛵", group: 4, action: "Bring your hand to your mouth as if you did something wrong and say oh!" },
      { id: "ie", label: "ie", say: "eye", word: "pie", emoji: "🥧", group: 4, action: "Stand up straight and salute, saying ie, ie." },
      { id: "ee", label: "ee", say: "ee", word: "bee", emoji: "🐝", group: 4, action: "Put your hands on your head like donkey ears and say ee, ee." },
      { id: "or", label: "or", say: "or", word: "fork", emoji: "🍴", group: 4, action: "Put your hands on your head and bray ee-or, ee-or, like a donkey." },
    ],
  },
  {
    group: 5,
    sounds: [
      { id: "z", label: "z", say: "zzz", word: "zebra", emoji: "🦓", group: 5, action: "Put your arms out and buzz like a bee, saying zzzzzz." },
      { id: "w", label: "w", say: "wuh", word: "web", emoji: "🕸️", group: 5, action: "Blow onto your open hand like the wind and say wh, wh, wh." },
      { id: "ng", label: "ng", say: "ng", word: "ring", emoji: "💍", group: 5, action: "Pretend to lift a heavy weight and strain, saying nnng." },
      { id: "v", label: "v", say: "vvv", word: "van", emoji: "🚐", group: 5, action: "Hold a steering wheel and drive a van, saying vvvvvv." },
      { id: "oo-long", label: "oo", say: "oo", word: "moon", emoji: "🌝", group: 5, note: "long oo", action: "Move your head like a cuckoo clock and say oo, oo (long)." },
      { id: "oo-short", label: "oo", say: "uu", word: "book", emoji: "📖", group: 5, note: "short oo", action: "Move your head like a cuckoo clock and say oo, oo (short)." },
    ],
  },
  {
    group: 6,
    sounds: [
      { id: "y", label: "y", say: "yuh", word: "yo-yo", emoji: "🪀", group: 6, action: "Pretend to eat yoghurt and say y, y, y." },
      { id: "x", label: "x", say: "ks", word: "fox", emoji: "🦊", group: 6, action: "Pretend to take an x-ray and say ks, ks, ks." },
      { id: "ch", label: "ch", say: "ch", word: "cheese", emoji: "🧀", group: 6, action: "Move your arms like a train and say ch, ch, ch." },
      { id: "sh", label: "sh", say: "sh", word: "ship", emoji: "🚢", group: 6, action: "Put your finger to your lips and say shshsh." },
      { id: "th-unvoiced", label: "th", say: "th", word: "thumb", emoji: "👍", group: 6, note: "unvoiced", action: "Stick your tongue out a little and say th (as in thumb)." },
      { id: "th-voiced", label: "th", say: "th", word: "feather", emoji: "🪶", group: 6, note: "voiced", action: "Stick your tongue out a bit more and say th (as in this)." },
    ],
  },
  {
    group: 7,
    sounds: [
      { id: "qu", label: "qu", say: "kwuh", word: "queen", emoji: "👑", group: 7, action: "Make a duck's beak with your hands and say qu, qu, qu." },
      { id: "ou", label: "ou", say: "ow", word: "cloud", emoji: "☁️", group: 7, action: "Pretend to prick your thumb with a needle and say ou, ou, ou." },
      { id: "oi", label: "oi", say: "oy", word: "coin", emoji: "🪙", group: 7, action: "Cup your hands and call to a boat: oi! ship ahoy!" },
      { id: "ue", label: "ue", say: "you", word: "blue", emoji: "🔵", group: 7, action: "Point to the people around you and say you, you, you." },
      { id: "er", label: "er", say: "er", word: "hammer", emoji: "🔨", group: 7, action: "Roll your hands over each other like a mixer and say ererer." },
      { id: "ar", label: "ar", say: "ar", word: "car", emoji: "🚗", group: 7, action: "Open your mouth wide and say ar (as at the doctor)." },
    ],
  },
  {
    group: 8,
    sounds: [
      { id: "ay", label: "ay", say: "ay", word: "day", emoji: "📅", group: 8, note: "digraph", action: "Two letters, one sound: ay as in day." },
      { id: "ea", label: "ea", say: "ee", word: "leaf", emoji: "🍃", group: 8, note: "digraph", action: "Two letters, one sound: ea as in leaf." },
      { id: "igh", label: "igh", say: "eye", word: "light", emoji: "💡", group: 8, note: "trigraph", action: "Three letters, one sound: igh as in light." },
      { id: "ow", label: "ow", say: "ow", word: "owl", emoji: "🦉", group: 8, note: "digraph", action: "Two letters, one sound: ow as in owl." },
      { id: "oy", label: "oy", say: "oy", word: "toy", emoji: "🧸", group: 8, note: "digraph", action: "Two letters, one sound: oy as in toy." },
      { id: "ir", label: "ir", say: "er", word: "bird", emoji: "🐦", group: 8, note: "digraph", action: "Two letters, one sound: ir as in bird." },
    ],
  },
  {
    group: 9,
    sounds: [
      { id: "ur", label: "ur", say: "er", word: "purse", emoji: "👛", group: 9, note: "digraph", action: "Two letters, one sound: ur as in purse." },
      { id: "aw", label: "aw", say: "aw", word: "paw", emoji: "🐾", group: 9, note: "digraph", action: "Two letters, one sound: aw as in paw." },
      { id: "ew", label: "ew", say: "you", word: "stew", emoji: "🍲", group: 9, note: "digraph", action: "Two letters, one sound: ew as in stew." },
      { id: "air", label: "air", say: "air", word: "chair", emoji: "🪑", group: 9, note: "trigraph", action: "Three letters, one sound: air as in chair." },
      { id: "ear", label: "ear", say: "ear", word: "ear", emoji: "👂", group: 9, note: "trigraph", action: "Three letters, one sound: ear as in ear." },
      { id: "ph", label: "ph", say: "fuh", word: "phone", emoji: "📱", group: 9, note: "digraph", action: "Two letters, one sound: ph says f, as in phone." },
    ],
  },
];

export const GROUP_TITLES: Record<number, string> = {
  1: "Group 1 · s a t i p n",
  2: "Group 2 · c k e h r m d",
  3: "Group 3 · g o u l f b",
  4: "Group 4 · ai j oa ie ee or",
  5: "Group 5 · z w ng v oo oo",
  6: "Group 6 · y x ch sh th th",
  7: "Group 7 · qu ou oi ue er ar",
  8: "Group 8 · ay ea igh ow oy ir",
  9: "Group 9 · ur aw ew air ear ph",
};

export const allJollySounds: JollySound[] = jollyGroups.flatMap((g) => g.sounds);

/** A plain-language guide to each group, for teachers. */
export const GROUP_GUIDE: {
  group: number;
  sounds: string;
  focus: string;
  tip: string;
}[] = [
  {
    group: 1,
    sounds: "s a t i p n",
    focus: "The very first sounds — they make the most simple words.",
    tip: "Start blending CVC words straight away: sat, pin, tap, nap.",
  },
  {
    group: 2,
    sounds: "c k e h r m d",
    focus: "More single letters, including two ways to write /k/ (c and k).",
    tip: "Now many more words work: cat, hen, red, mat, dad.",
  },
  {
    group: 3,
    sounds: "g o u l f b",
    focus: "Completes most single-letter sounds.",
    tip: "Children can read most short CVC words now: dog, bus, log, fun.",
  },
  {
    group: 4,
    sounds: "ai j oa ie ee or",
    focus: "First digraphs — two letters that make one sound (long vowels).",
    tip: "Point out the two letters working together: rain, boat, see, fork.",
  },
  {
    group: 5,
    sounds: "z w ng v oo oo",
    focus: "More consonants, plus the two 'oo' sounds.",
    tip: "Compare short oo (book) and long oo (moon) side by side.",
  },
  {
    group: 6,
    sounds: "y x ch sh th th",
    focus: "Consonant digraphs ch, sh and th (quiet 'thin' and buzzy 'this').",
    tip: "Practise the two th sounds with a hand on the throat to feel the buzz.",
  },
  {
    group: 7,
    sounds: "qu ou oi ue er ar",
    focus: "More vowel digraphs and r-controlled vowels.",
    tip: "Build words like queen, out, coin, her, car.",
  },
  {
    group: 8,
    sounds: "ay ea igh ow oy ir",
    focus: "Extended code — new spellings for sounds already learned.",
    tip: "Show that ay = ai, ea = ee, oy = oi. Same sound, different spelling.",
  },
  {
    group: 9,
    sounds: "ur aw ew air ear ph",
    focus: "More extended code, trigraphs (air, ear) and ph saying /f/.",
    tip: "Sort words by sound, not spelling: fur/her, paw/or, phone/fish.",
  },
];
