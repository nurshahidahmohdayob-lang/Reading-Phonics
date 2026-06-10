/** Phonics sound, IPA, articulation guide, and example for every letter A–Z. */
export type LetterCategory =
  | "Short Vowel"
  | "Continuous Unvoiced"
  | "Continuous Voiced"
  | "Plosive"
  | "Semi-Vowel";

export type LetterSound = {
  letter: string;
  /** Short spelling shown on screen, e.g. "fff". */
  sound: string;
  /** Spelling the text-to-speech reads (elongated so continuous sounds
      sustain instead of becoming a syllable like "fuh"). */
  say: string;
  /** IPA symbol for the sound. */
  ipa: string;
  /** Example word. */
  word: string;
  hint: string;
  category: LetterCategory;
  /** How to physically make the sound. */
  guide: string;
  /** How to write the lowercase letter. */
  formation: string;
  accent: string;
};

/** Letter-formation patter for writing each lowercase letter. */
const FORMATION: Record<string, string> = {
  a: "Around, up, and down.",
  b: "Down the long stick, then up and around the ball.",
  c: "Curl back and around, like a c.",
  d: "Around the ball, up the long stick, and down.",
  e: "Across, then around.",
  f: "Down the long hook, then add a cross.",
  g: "Around the ball, down, and curl back.",
  h: "Down the long stick, up and over the bump.",
  i: "Straight down, then a dot on top.",
  j: "Down and curl, then a dot on top.",
  k: "Down the stick, then kick in and out.",
  l: "Just a straight line down.",
  m: "Down, then up and over two bumps.",
  n: "Down, then up and over one bump.",
  o: "All the way around, like a circle.",
  p: "Down the stick, then up and around the ball.",
  q: "Around the ball, down the stick, and flick.",
  r: "Down, then up and over a little.",
  s: "Curl in and back, like a snake.",
  t: "Straight down, then a cross near the top.",
  u: "Down, around, up, and down again.",
  v: "Down to a point, then up.",
  w: "Down, up, down, up.",
  x: "One slanted line, then cross it.",
  y: "Down to a point, then a tail going down.",
  z: "Across, slant down, then across again.",
};

// Zera sub-brand gradients, one per sound category (all legible with white text).
const ACCENT: Record<LetterCategory, string> = {
  "Short Vowel": "from-[#1C6B49] to-[#0D4A34]", // Zera Edu green
  "Continuous Unvoiced": "from-[#3AA7C4] to-[#27829E]", // Zera Plus teal
  "Continuous Voiced": "from-[#7BA468] to-[#668D4E]", // Zera Intl green
  Plosive: "from-[#4E9A78] to-[#3A7A5E]", // Zera Pre green
  "Semi-Vowel": "from-[#2E8C77] to-[#1C6B49]", // Zera teal-green blend
};

/** Continuous sounds need an elongated spelling so the TTS sustains the
    fricative/hum rather than reading a short syllable with a vowel. */
const SAY_OVERRIDE: Record<string, string> = {
  s: "ssssss",
  h: "hhhhh",
  l: "lllll",
  m: "mmmmm",
  n: "nnnnn",
  r: "rrrrr",
  v: "vvvvv",
  z: "zzzzzz",
};

const DATA: Omit<LetterSound, "hint" | "accent" | "say" | "formation">[] = [
  {
    letter: "a",
    sound: "ah",
    ipa: "/æ/",
    word: "apple",
    category: "Short Vowel",
    guide:
      "Drop the jaw low. Flatten the tongue. Make a short sound in the front of the mouth.",
  },
  {
    letter: "b",
    sound: "buh",
    ipa: "/b/",
    word: "ball",
    category: "Plosive",
    guide:
      "Voiced. Press lips together. Build pressure. Release with a quick, voiced pop. Stop the sound instantly.",
  },
  {
    letter: "c",
    sound: "kuh",
    ipa: "/k/",
    word: "cat",
    category: "Plosive",
    guide:
      "Unvoiced. Press the back of the tongue against the roof of the mouth. Release a sudden, sharp burst of air.",
  },
  {
    letter: "d",
    sound: "duh",
    ipa: "/d/",
    word: "dog",
    category: "Plosive",
    guide:
      "Voiced. Press the tip of the tongue behind the top front teeth. Release with a quick, voiced pop.",
  },
  {
    letter: "e",
    sound: "eh",
    ipa: "/ɛ/",
    word: "egg",
    category: "Short Vowel",
    guide:
      "Open the mouth halfway. Pull the corners of the lips back slightly.",
  },
  {
    letter: "f",
    sound: "fuh",
    ipa: "/f/",
    word: "fish",
    category: "Continuous Unvoiced",
    guide: "Top teeth on bottom lip. Blow air continuously.",
  },
  {
    letter: "g",
    sound: "guh",
    ipa: "/ɡ/",
    word: "goat",
    category: "Plosive",
    guide:
      "Voiced. Press the back of the tongue up (same as K). Release with a quick, voiced throat pop.",
  },
  {
    letter: "h",
    sound: "huh",
    ipa: "/h/",
    word: "hat",
    category: "Continuous Unvoiced",
    guide: "Open mouth wide. Blow warm air directly from the throat.",
  },
  {
    letter: "i",
    sound: "ih",
    ipa: "/ɪ/",
    word: "igloo",
    category: "Short Vowel",
    guide:
      "Keep the mouth open slightly. Bring the sides of the tongue up to the top back teeth.",
  },
  {
    letter: "j",
    sound: "juh",
    ipa: "/dʒ/",
    word: "jam",
    category: "Plosive",
    guide:
      "Voiced. Push the tongue forward. Release with a quick, voiced explosion of air.",
  },
  {
    letter: "k",
    sound: "kuh",
    ipa: "/k/",
    word: "kite",
    category: "Plosive",
    guide:
      "Unvoiced. Press the back of the tongue against the roof of the mouth. Release a sudden, sharp burst of air.",
  },
  {
    letter: "l",
    sound: "lll",
    ipa: "/l/",
    word: "lion",
    category: "Continuous Voiced",
    guide:
      "Press the tip of the tongue firmly behind the top front teeth. Turn on the voice. Hold the hum.",
  },
  {
    letter: "m",
    sound: "mmm",
    ipa: "/m/",
    word: "moon",
    category: "Continuous Voiced",
    guide:
      "Press the lips together firmly. Press air through the nose. Turn on the voice to hum.",
  },
  {
    letter: "n",
    sound: "nnn",
    ipa: "/n/",
    word: "nest",
    category: "Continuous Voiced",
    guide:
      "Open the mouth slightly. Press the tongue flat against the roof of the mouth. Hum through the nose.",
  },
  {
    letter: "o",
    sound: "o",
    ipa: "/ɒ/",
    word: "octopus",
    category: "Short Vowel",
    guide: "Open the mouth wide in a round shape. Drop the back of the tongue.",
  },
  {
    letter: "p",
    sound: "puh",
    ipa: "/p/",
    word: "pig",
    category: "Plosive",
    guide:
      "Unvoiced. Press lips together (same as B). Release with a quick, quiet puff of air.",
  },
  {
    letter: "q",
    sound: "kwuh",
    ipa: "/kw/",
    word: "queen",
    category: "Plosive",
    guide:
      "Make a sharp, unvoiced /k/ sound immediately followed by a tight, unvoiced /w/ sound.",
  },
  {
    letter: "r",
    sound: "rrr",
    ipa: "/r/",
    word: "rabbit",
    category: "Continuous Voiced",
    guide:
      "Curl the sides of the tongue up against the top back teeth. Pull the tongue back slightly. Roar from the throat without moving the lips.",
  },
  {
    letter: "s",
    sound: "sss",
    ipa: "/s/",
    word: "sun",
    category: "Continuous Unvoiced",
    guide:
      "Bring teeth together. Put the tip of the tongue near the roof of the mouth. Blow a sharp stream of air.",
  },
  {
    letter: "t",
    sound: "tuh",
    ipa: "/t/",
    word: "top",
    category: "Plosive",
    guide:
      "Unvoiced. Press the tip of the tongue behind the front teeth (same as D). Release a sharp puff of air.",
  },
  {
    letter: "u",
    sound: "uh",
    ipa: "/ʌ/",
    word: "up",
    category: "Short Vowel",
    guide:
      "Relax the tongue and jaw completely. Make a short, low sound from the throat.",
  },
  {
    letter: "v",
    sound: "vvv",
    ipa: "/v/",
    word: "van",
    category: "Continuous Voiced",
    guide: "Top teeth on bottom lip (same as F). Turn on the voice to vibrate the lip.",
  },
  {
    letter: "w",
    sound: "wuh",
    ipa: "/w/",
    word: "web",
    category: "Semi-Vowel",
    guide:
      "Pucker the lips tightly into a tiny circle. Turn on the voice and quickly open the lips into the next sound.",
  },
  {
    letter: "x",
    sound: "ks",
    ipa: "/ks/",
    word: "box",
    category: "Continuous Unvoiced",
    guide:
      "Make a sharp, unvoiced /k/ sound immediately followed by an unvoiced /s/ sound.",
  },
  {
    letter: "y",
    sound: "yuh",
    ipa: "/j/",
    word: "yo-yo",
    category: "Semi-Vowel",
    guide:
      "Press the middle of the tongue up toward the roof of the mouth. Turn on the voice to make a quick “ee” slider sound.",
  },
  {
    letter: "z",
    sound: "zzz",
    ipa: "/z/",
    word: "zip",
    category: "Continuous Voiced",
    guide: "Teeth together (same as S). Turn on the voice to make a buzzing sound.",
  },
];

export const letterSounds: LetterSound[] = DATA.map((d) => ({
  ...d,
  say: SAY_OVERRIDE[d.letter] ?? d.sound,
  hint: `like in ${d.word}`,
  formation: FORMATION[d.letter] ?? "",
  accent: ACCENT[d.category],
}));

export function letterSound(letter: string): LetterSound {
  return (
    letterSounds.find((l) => l.letter === letter.toLowerCase()) ??
    letterSounds[0]
  );
}
