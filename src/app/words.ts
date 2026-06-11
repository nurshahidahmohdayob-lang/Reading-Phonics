export type WordCard = {
  /** The whole word, e.g. "cat". */
  text: string;
  /** Visual cue. */
  emoji: string;
  /** The word split into its sounds (graphemes), e.g. ["c","a","t"]. */
  sounds: string[];
  /** Kid-friendly pronunciation per sound, used when blending aloud. */
  say: string[];
};

export type WordFamily = {
  /** The rime, e.g. "-at". */
  family: string;
  label: string;
  /** Tailwind gradient accent. */
  color: string;
  /** Text colour that reads well on the accent. */
  text: string;
  words: WordCard[];
};

/* How the voice says each grapheme (matches the rest of the app). */
const SAY: Record<string, string> = {
  a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh",
  h: "huh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn",
  o: "o", p: "puh", qu: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh",
  v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
  ch: "cha", sh: "shh", th: "thuh", wh: "wuh", ph: "fff",
  wr: "rrr", kn: "nnn", gn: "nnn", ck: "kuh", ng: "ng",
  ar: "ar", er: "er", or: "or",
  // doubled letters say their sound once
  bb: "buh", ll: "lll", rr: "rrr", tt: "tuh",
};

/** Build a word from its text, emoji and space-separated graphemes. */
function W(text: string, emoji: string, graphemes: string): WordCard {
  const sounds = graphemes.split(" ");
  return { text, emoji, sounds, say: sounds.map((g) => SAY[g] ?? g) };
}

const PASTELS: { color: string; text: string }[] = [
  { color: "from-[#FFD9EA] to-[#FFC0DB]", text: "text-pink-700" },
  { color: "from-[#FFE8C9] to-[#FFD3A1]", text: "text-orange-700" },
  { color: "from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" },
  { color: "from-[#FFF4BD] to-[#FFE88C]", text: "text-amber-700" },
  { color: "from-[#D3EBFF] to-[#ABD9FF]", text: "text-sky-700" },
  { color: "from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" },
];

const RAW: { family: string; words: WordCard[] }[] = [
  {
    family: "-at",
    words: [
      W("cat", "🐱", "c a t"), W("hat", "🎩", "h a t"), W("bat", "🦇", "b a t"),
      W("mat", "🟫", "m a t"), W("rat", "🐀", "r a t"), W("sat", "🪑", "s a t"),
      W("pat", "🖐️", "p a t"), W("fat", "🐘", "f a t"), W("vat", "🛢️", "v a t"),
      W("gnat", "🦟", "gn a t"), W("chat", "💬", "ch a t"),
      W("that", "👆", "th a t"), W("flat", "🫓", "f l a t"),
      W("splat", "💥", "s p l a t"), W("acrobat", "🤸", "a c r o b a t"),
    ],
  },
  {
    family: "-ig",
    words: [
      W("pig", "🐷", "p i g"), W("big", "🦣", "b i g"), W("dig", "⛏️", "d i g"),
      W("wig", "💇", "w i g"), W("fig", "🍐", "f i g"), W("jig", "💃", "j i g"),
      W("rig", "🚛", "r i g"), W("gig", "🎸", "g i g"),
      W("twig", "🌿", "t w i g"), W("swig", "🥤", "s w i g"),
      W("sprig", "🌱", "s p r i g"),
    ],
  },
  {
    family: "-og",
    words: [
      W("dog", "🐶", "d o g"), W("log", "🪵", "l o g"), W("fog", "🌫️", "f o g"),
      W("hog", "🐖", "h o g"), W("jog", "🏃", "j o g"), W("bog", "💧", "b o g"),
      W("cog", "⚙️", "c o g"), W("frog", "🐸", "f r o g"),
      W("smog", "🏭", "s m o g"), W("clog", "👡", "c l o g"),
      W("blog", "💻", "b l o g"),
    ],
  },
  {
    family: "-un",
    words: [
      W("sun", "☀️", "s u n"), W("run", "🏃‍♀️", "r u n"), W("fun", "🎉", "f u n"),
      W("bun", "🥐", "b u n"), W("pun", "😄", "p u n"),
      W("spun", "🌀", "s p u n"), W("stun", "😵", "s t u n"),
    ],
  },
  {
    family: "-ed",
    words: [
      W("bed", "🛏️", "b e d"), W("red", "🔴", "r e d"), W("fed", "🍽️", "f e d"),
      W("led", "💡", "l e d"), W("wed", "💍", "w e d"),
      W("shed", "🏚️", "sh e d"), W("sled", "🛷", "s l e d"),
      W("fled", "🏃", "f l e d"), W("bled", "🩹", "b l e d"),
      W("sped", "🏎️", "s p e d"), W("shred", "📄", "sh r e d"),
    ],
  },
  {
    family: "-an",
    words: [
      W("can", "🥫", "c a n"), W("man", "👨", "m a n"), W("ran", "🏃", "r a n"),
      W("pan", "🍳", "p a n"), W("fan", "🪭", "f a n"), W("van", "🚐", "v a n"),
      W("tan", "🌞", "t a n"), W("ban", "🚫", "b a n"),
      W("plan", "📋", "p l a n"), W("clan", "👨‍👩‍👧‍👦", "c l a n"),
      W("scan", "🔍", "s c a n"), W("bran", "🥣", "b r a n"),
      W("span", "🌉", "s p a n"), W("gran", "👵", "g r a n"),
      W("flan", "🍮", "f l a n"), W("than", "⚖️", "th a n"),
    ],
  },
  {
    family: "-ap",
    words: [
      W("cap", "🧢", "c a p"), W("map", "🗺️", "m a p"), W("tap", "🚰", "t a p"),
      W("nap", "😴", "n a p"), W("lap", "🦵", "l a p"), W("gap", "🕳️", "g a p"),
      W("rap", "🎤", "r a p"), W("sap", "🌳", "s a p"), W("zap", "⚡", "z a p"),
      W("yap", "🐕", "y a p"), W("clap", "👏", "c l a p"),
      W("trap", "🪤", "t r a p"), W("snap", "🫰", "s n a p"),
      W("flap", "🐦", "f l a p"), W("wrap", "🎁", "wr a p"),
      W("strap", "🎒", "s t r a p"), W("scrap", "🗑️", "s c r a p"),
      W("chap", "👦", "ch a p"), W("slap", "✋", "s l a p"),
    ],
  },
  {
    family: "-in",
    words: [
      W("pin", "📌", "p i n"), W("win", "🏆", "w i n"), W("bin", "🗑️", "b i n"),
      W("fin", "🦈", "f i n"), W("tin", "🥫", "t i n"), W("kin", "👪", "k i n"),
      W("din", "🔊", "d i n"), W("chin", "🙂", "ch i n"),
      W("shin", "🦵", "sh i n"), W("thin", "📏", "th i n"),
      W("spin", "🌀", "s p i n"), W("grin", "😁", "g r i n"),
      W("twin", "👯", "t w i n"), W("skin", "🫱", "s k i n"),
      W("violin", "🎻", "v i o l i n"), W("pumpkin", "🎃", "p u m p k i n"),
      W("dolphin", "🐬", "d o l ph i n"),
    ],
  },
  {
    family: "-ot",
    words: [
      W("pot", "🍲", "p o t"), W("hot", "🥵", "h o t"), W("dot", "⚫", "d o t"),
      W("cot", "🛏️", "c o t"), W("jot", "📝", "j o t"), W("not", "🚫", "n o t"),
      W("rot", "🍂", "r o t"), W("tot", "👶", "t o t"), W("got", "✅", "g o t"),
      W("knot", "🪢", "kn o t"), W("spot", "🐆", "s p o t"),
      W("trot", "🐴", "t r o t"), W("plot", "🗺️", "p l o t"),
      W("slot", "🪙", "s l o t"), W("blot", "🖋️", "b l o t"),
      W("robot", "🤖", "r o b o t"), W("carrot", "🥕", "c a rr o t"),
      W("apricot", "🍑", "a p r i c o t"),
    ],
  },
  {
    family: "-ug",
    words: [
      W("bug", "🐛", "b u g"), W("rug", "🧶", "r u g"), W("hug", "🤗", "h u g"),
      W("jug", "🏺", "j u g"), W("mug", "☕", "m u g"), W("dug", "🕳️", "d u g"),
      W("tug", "🚤", "t u g"), W("lug", "🧳", "l u g"), W("pug", "🐶", "p u g"),
      W("slug", "🐌", "s l u g"), W("plug", "🔌", "p l u g"),
      W("snug", "🧸", "s n u g"), W("shrug", "🤷", "sh r u g"),
      W("chug", "🚂", "ch u g"), W("glug", "🥛", "g l u g"),
    ],
  },
  {
    family: "-op",
    words: [
      W("top", "🪀", "t o p"), W("hop", "🐇", "h o p"), W("mop", "🧹", "m o p"),
      W("pop", "💥", "p o p"), W("cop", "👮", "c o p"), W("bop", "🕺", "b o p"),
      W("shop", "🏪", "sh o p"), W("stop", "🛑", "s t o p"),
      W("drop", "💧", "d r o p"), W("crop", "🌾", "c r o p"),
      W("prop", "🎭", "p r o p"), W("flop", "🩴", "f l o p"),
      W("plop", "💦", "p l o p"), W("chop", "🔪", "ch o p"),
      W("clop", "🐴", "c l o p"), W("lollipop", "🍭", "l o ll i p o p"),
      W("laptop", "💻", "l a p t o p"), W("hilltop", "⛰️", "h i ll t o p"),
    ],
  },
  {
    family: "-ad",
    words: [
      W("dad", "👨", "d a d"), W("sad", "😢", "s a d"), W("mad", "😡", "m a d"),
      W("bad", "👎", "b a d"), W("had", "✋", "h a d"), W("pad", "🧾", "p a d"),
      W("lad", "👦", "l a d"), W("tad", "🤏", "t a d"),
      W("glad", "😄", "g l a d"), W("grad", "🎓", "g r a d"),
      W("salad", "🥗", "s a l a d"),
    ],
  },
  {
    family: "-en",
    words: [
      W("hen", "🐔", "h e n"), W("ten", "🔟", "t e n"), W("pen", "🖊️", "p e n"),
      W("men", "👬", "m e n"), W("den", "🛖", "d e n"), W("zen", "🧘", "z e n"),
      W("wren", "🐦", "wr e n"), W("then", "⏭️", "th e n"),
      W("when", "❓", "wh e n"), W("kitten", "🐱", "k i tt e n"),
      W("chicken", "🐤", "ch i ck e n"), W("garden", "🌷", "g ar d e n"),
      W("seven", "7️⃣", "s e v e n"),
    ],
  },
  {
    family: "-it",
    words: [
      W("sit", "🪑", "s i t"), W("bit", "🤏", "b i t"), W("fit", "💪", "f i t"),
      W("hit", "⚾", "h i t"), W("kit", "🧰", "k i t"), W("lit", "🕯️", "l i t"),
      W("pit", "🕳️", "p i t"), W("wit", "🧠", "w i t"),
      W("quit", "🚪", "qu i t"), W("grit", "😤", "g r i t"),
      W("knit", "🧶", "kn i t"), W("skit", "🎭", "s k i t"),
      W("split", "🍌", "s p l i t"), W("rabbit", "🐰", "r a bb i t"),
      W("habit", "🔁", "h a b i t"), W("bandit", "🤠", "b a n d i t"),
    ],
  },
];

export const wordFamilies: WordFamily[] = RAW.map((f, i) => ({
  family: f.family,
  label: `The ${f.family} family`,
  color: PASTELS[i % PASTELS.length].color,
  text: PASTELS[i % PASTELS.length].text,
  words: f.words,
}));
