/** 50 spelling levels that follow the phonics teaching order. Each band of
    levels only uses sounds the child has met by that group, and words are
    spelled grapheme-by-grapheme (so "rain" is r-ai-n, not r-a-i-n). */

export type SpellWord = {
  text: string;
  emoji: string;
  /** The word split into graphemes, e.g. ["r","ai","n"]. */
  sounds: string[];
  /** What the voice says for each grapheme. */
  say: string[];
};

export type SpellBand = {
  /** First and last level of this band (inclusive). */
  from: number;
  to: number;
  label: string;
  /** Tailwind classes for the level buttons of this band. */
  bg: string;
  text: string;
  bank: SpellWord[];
};

/* How the TTS pronounces each grapheme (matches the rest of the app). */
const SAY: Record<string, string> = {
  a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh",
  h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn",
  o: "o", p: "puh", qu: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh",
  v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
  ai: "ay", ee: "ee", or: "or", oa: "oh", ie: "eye",
  oo: "oo", ng: "ng", sh: "shh", ch: "cha", th: "thuh",
  ou: "ow", ow: "ow", oi: "oy", oy: "oy", er: "er", ar: "ar", ay: "ay",
};

/** Build a word from its text, emoji and space-separated graphemes. */
function W(text: string, emoji: string, graphemes: string): SpellWord {
  const sounds = graphemes.split(" ");
  return { text, emoji, sounds, say: sounds.map((g) => SAY[g] ?? g) };
}

export const spellBands: SpellBand[] = [
  {
    from: 1,
    to: 8,
    label: "Group 1 · s a t i p n",
    bg: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]",
    text: "text-pink-700",
    bank: [
      W("sat", "🪑", "s a t"), W("sit", "🧘", "s i t"), W("pin", "📌", "p i n"),
      W("pan", "🍳", "p a n"), W("pit", "🕳️", "p i t"), W("pat", "🖐️", "p a t"),
      W("tap", "🚰", "t a p"), W("nap", "😴", "n a p"), W("tan", "🌞", "t a n"),
      W("tin", "🥫", "t i n"), W("ant", "🐜", "a n t"), W("sip", "🥤", "s i p"),
      W("nip", "🦀", "n i p"), W("spin", "🌀", "s p i n"),
      W("snap", "🫰", "s n a p"), W("snip", "✂️", "s n i p"),
    ],
  },
  {
    from: 9,
    to: 17,
    label: "Group 2 · + c k e h r m d",
    bg: "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1]",
    text: "text-orange-700",
    bank: [
      W("cat", "🐱", "c a t"), W("hat", "🎩", "h a t"), W("rat", "🐀", "r a t"),
      W("mat", "🟫", "m a t"), W("can", "🥫", "c a n"), W("man", "👨", "m a n"),
      W("ran", "🏃", "r a n"), W("cap", "🧢", "c a p"), W("map", "🗺️", "m a p"),
      W("red", "🔴", "r e d"), W("hen", "🐔", "h e n"), W("ten", "🔟", "t e n"),
      W("pet", "🐕", "p e t"), W("net", "🥅", "n e t"), W("ham", "🍖", "h a m"),
      W("kid", "🧒", "k i d"),
    ],
  },
  {
    from: 18,
    to: 26,
    label: "Group 3 · + g o u l f b",
    bg: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]",
    text: "text-emerald-700",
    bank: [
      W("dog", "🐶", "d o g"), W("log", "🪵", "l o g"), W("bug", "🐛", "b u g"),
      W("mug", "☕", "m u g"), W("sun", "☀️", "s u n"), W("run", "🏃‍♀️", "r u n"),
      W("bun", "🥐", "b u n"), W("leg", "🦵", "l e g"), W("bed", "🛏️", "b e d"),
      W("bag", "👜", "b a g"), W("pig", "🐷", "p i g"), W("dig", "⛏️", "d i g"),
      W("pot", "🫕", "p o t"), W("hot", "🥵", "h o t"), W("cup", "🍵", "c u p"),
      W("bus", "🚌", "b u s"), W("frog", "🐸", "f r o g"),
      W("flag", "🚩", "f l a g"),
    ],
  },
  {
    from: 27,
    to: 34,
    label: "Group 4 · + ai ee or oa ie",
    bg: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C]",
    text: "text-amber-700",
    bank: [
      W("bee", "🐝", "b ee"), W("see", "👀", "s ee"), W("pie", "🥧", "p ie"),
      W("tie", "👔", "t ie"), W("rain", "🌧️", "r ai n"),
      W("tail", "🦚", "t ai l"), W("sail", "⛵", "s ai l"),
      W("pain", "🤕", "p ai n"), W("feet", "🦶", "f ee t"),
      W("seed", "🌱", "s ee d"), W("tree", "🌳", "t r ee"),
      W("fork", "🍴", "f or k"), W("corn", "🌽", "c or n"),
      W("boat", "🚤", "b oa t"), W("coat", "🧥", "c oa t"),
      W("soap", "🧼", "s oa p"), W("road", "🛣️", "r oa d"),
      W("goat", "🐐", "g oa t"),
    ],
  },
  {
    from: 35,
    to: 43,
    label: "Groups 5–6 · + oo ng sh ch th w v x y z qu",
    bg: "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF]",
    text: "text-sky-700",
    bank: [
      W("zip", "🤐", "z i p"), W("web", "🕸️", "w e b"), W("wet", "💧", "w e t"),
      W("van", "🚐", "v a n"), W("vet", "🩺", "v e t"), W("fox", "🦊", "f o x"),
      W("box", "📦", "b o x"), W("six", "6️⃣", "s i x"), W("yes", "✅", "y e s"),
      W("moon", "🌙", "m oo n"), W("food", "🍜", "f oo d"),
      W("book", "📖", "b oo k"), W("look", "🔍", "l oo k"),
      W("ring", "💍", "r i ng"), W("king", "🤴", "k i ng"),
      W("song", "🎵", "s o ng"), W("sing", "🎤", "s i ng"),
      W("ship", "🚢", "sh i p"), W("shop", "🏪", "sh o p"),
      W("fish", "🐟", "f i sh"), W("chip", "🍟", "ch i p"),
      W("chat", "💬", "ch a t"), W("bath", "🛁", "b a th"),
      W("quiz", "❓", "qu i z"),
    ],
  },
  {
    from: 44,
    to: 50,
    label: "Groups 7–8 · + ou ow oi oy ar er ay",
    bg: "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]",
    text: "text-violet-700",
    bank: [
      W("cow", "🐮", "c ow"), W("owl", "🦉", "ow l"), W("boy", "👦", "b oy"),
      W("toy", "🧸", "t oy"), W("joy", "😄", "j oy"), W("day", "🌅", "d ay"),
      W("hay", "🌾", "h ay"), W("say", "🗣️", "s ay"), W("car", "🚗", "c ar"),
      W("arm", "💪", "ar m"), W("oil", "🛢️", "oi l"), W("out", "🚪", "ou t"),
      W("star", "⭐", "s t ar"), W("card", "🃏", "c ar d"),
      W("park", "🏞️", "p ar k"), W("farm", "🚜", "f ar m"),
      W("coin", "🪙", "c oi n"), W("loud", "📢", "l ou d"),
      W("town", "🏘️", "t ow n"), W("play", "🛝", "p l ay"),
      W("cloud", "☁️", "c l ou d"),
    ],
  },
];

export const TOTAL_LEVELS = 50;
export const WORDS_PER_LEVEL = 4;

export function bandForLevel(level: number): SpellBand {
  return (
    spellBands.find((b) => level >= b.from && level <= b.to) ??
    spellBands[spellBands.length - 1]
  );
}

/** The four words of a level — deterministic, so a level is always the same. */
export function levelWords(level: number): SpellWord[] {
  const band = bandForLevel(level);
  const offset = level - band.from;
  return Array.from(
    { length: WORDS_PER_LEVEL },
    (_, k) => band.bank[(offset * WORDS_PER_LEVEL + k) % band.bank.length],
  );
}

/** Extra wrong letter tiles mixed in — more as you go deeper into a band. */
export function levelDistractors(level: number): number {
  const band = bandForLevel(level);
  return Math.min(3, Math.floor((level - band.from) / 3) + (level > 8 ? 1 : 0));
}
