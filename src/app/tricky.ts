/** Tricky words (sight words) — words that can't be fully decoded with
    standard phonetic rules. They are taught in six colour-named sets of
    twelve, from the foundational Cream set to the final Purple set. */
export type TrickyWord = {
  word: string;
  /** A short sentence putting the word in context. */
  sentence: string;
  /** Why this word can't simply be sounded out. */
  why: string;
};

export type TrickySet = {
  set: number;
  /** Colour name of the set, e.g. "Cream". */
  color: string;
  blurb: string;
  emoji: string;
  words: TrickyWord[];
};

export const trickySets: TrickySet[] = [
  {
    set: 1,
    color: "Cream",
    blurb: "Foundational pronouns & short verbs",
    emoji: "🍦",
    words: [
      { word: "I", sentence: "I am happy.", why: "It stands alone and says its long letter name." },
      { word: "the", sentence: "The cat is here.", why: "The 'e' makes an unexpected \"uh\" sound." },
      { word: "he", sentence: "He is my friend.", why: "A single 'e' makes a long \"ee\" sound." },
      { word: "she", sentence: "She can run fast.", why: "Single vowel structure matching \"he\"." },
      { word: "me", sentence: "Come with me.", why: "Pronounced with a long \"ee\" sound." },
      { word: "we", sentence: "We like to play.", why: "The open-syllable rule applied early." },
      { word: "be", sentence: "Be kind to others.", why: "Same vowel pattern as \"he\", \"she\" and \"we\"." },
      { word: "was", sentence: "It was a sunny day.", why: "The 'a' unexpectedly sounds like an \"o\"." },
      { word: "to", sentence: "I go to school.", why: "The 'o' acts like an \"oo\" sound." },
      { word: "do", sentence: "Do you like it?", why: "The 'o' shifts to a deep \"oo\" sound." },
      { word: "are", sentence: "We are friends.", why: "A silent final 'e' that doesn't change the sound." },
      { word: "all", sentence: "We all had fun.", why: "The 'a' stretches into an \"or\" sound." },
    ],
  },
  {
    set: 2,
    color: "Pink",
    blurb: "Demonstratives & open syllables",
    emoji: "🌸",
    words: [
      { word: "you", sentence: "How are you?", why: "The 'ou' digraph makes an irregular \"oo\" sound." },
      { word: "your", sentence: "Where is your hat?", why: "The 'our' cluster makes an \"or\" sound." },
      { word: "come", sentence: "Come and play.", why: "The 'o' sounds like a short \"uh\"." },
      { word: "some", sentence: "I have some cake.", why: "Mirrors \"come\" with a short \"uh\" sound." },
      { word: "said", sentence: "She said hello.", why: "The 'ai' sounds like a short \"eh\"." },
      { word: "here", sentence: "Sit here with me.", why: "The 'ere' ending says \"ear\"." },
      { word: "there", sentence: "The ball is there.", why: "Spelled like \"here\" but pronounced like \"air\"." },
      { word: "they", sentence: "They are going home.", why: "The 'ey' makes a long \"ai\" sound." },
      { word: "go", sentence: "Let's go outside.", why: "The 'o' says its long name — an open syllable." },
      { word: "no", sentence: "No, thank you.", why: "The 'o' says its long name instead of its short sound." },
      { word: "so", sentence: "I am so happy.", why: "Matches the open vowel pattern of \"no\" and \"go\"." },
      { word: "my", sentence: "This is my dog.", why: "The 'y' acts as a long \"ie\" sound." },
    ],
  },
  {
    set: 3,
    color: "Green",
    blurb: "Numbers, markers & silent e",
    emoji: "🍀",
    words: [
      { word: "one", sentence: "I have one apple.", why: "Sounds like \"won\" — it starts with a phantom \"w\"." },
      { word: "by", sentence: "Sit by the door.", why: "The 'y' says a long \"ie\" sound." },
      { word: "only", sentence: "Only one cookie is left.", why: "Starts with a long 'o' and hides a syllable." },
      { word: "old", sentence: "My shoes are old.", why: "The 'o' says its long name before 'ld'." },
      { word: "like", sentence: "I like to read.", why: "Contains a split digraph (i_e), taught early." },
      { word: "have", sentence: "I have a book.", why: "The final 'e' is there but doesn't make the vowel long." },
      { word: "live", sentence: "We live in a house.", why: "Ends in 'e' but the 'i' stays short." },
      { word: "give", sentence: "Give me the pen.", why: "Follows the same short-vowel pattern as \"live\"." },
      { word: "little", sentence: "A little mouse ran.", why: "Double 't' and the 'le' ending make it hard to track." },
      { word: "down", sentence: "Sit down, please.", why: "The 'ow' makes a sliding \"ow\" diphthong." },
      { word: "what", sentence: "What is your name?", why: "The 'a' works like a short \"o\" sound." },
      { word: "when", sentence: "When can we go?", why: "The 'wh' blend can hide the sounds inside." },
    ],
  },
  {
    set: 4,
    color: "Yellow",
    blurb: "Wh- questions & vowel surprises",
    emoji: "⭐",
    words: [
      { word: "why", sentence: "Why is the sky blue?", why: "The 'y' makes a long \"ie\" sound after 'wh'." },
      { word: "where", sentence: "Where is the cat?", why: "The 'ere' ending says \"air\", not \"ear\"." },
      { word: "who", sentence: "Who is at the door?", why: "The 'wh' shifts to a plain \"h\" sound." },
      { word: "which", sentence: "Which one do you want?", why: "A 'wh' start and a 'ch' ending in one word." },
      { word: "any", sentence: "Do you have any sweets?", why: "The 'a' shifts into a short \"eh\" sound." },
      { word: "many", sentence: "I have many toys.", why: "Matches \"any\" with a short \"eh\" pattern." },
      { word: "more", sentence: "Can I have more, please?", why: "The 'ore' cluster makes an \"or\" sound." },
      { word: "before", sentence: "Wash your hands before lunch.", why: "Two syllables with a hidden \"or\" sound." },
      { word: "other", sentence: "Where is the other sock?", why: "The 'o' sounds like a short \"uh\"." },
      { word: "were", sentence: "We were at the park.", why: "The 'ere' cluster sounds entirely like \"er\"." },
      { word: "because", sentence: "I smiled because I was happy.", why: "A long word full of irregular phonemes." },
      { word: "want", sentence: "I want an apple.", why: "The 'a' sounds like a short \"o\"." },
    ],
  },
  {
    set: 5,
    color: "Blue",
    blurb: "Silent letters & vowel groups",
    emoji: "💧",
    words: [
      { word: "saw", sentence: "I saw a bird.", why: "The 'aw' makes an \"or\"-like sound." },
      { word: "put", sentence: "Put the toy in the box.", why: "The 'u' makes a short \"oo\" sound." },
      { word: "could", sentence: "I could see the sea.", why: "The 'ould' cluster turns into a short \"oo\" sound." },
      { word: "should", sentence: "You should rest now.", why: "Follows the identical irregular \"could\" pattern." },
      { word: "would", sentence: "I would love some juice.", why: "Final entry in the silent-'l' \"ould\" family." },
      { word: "right", sentence: "That is the right answer.", why: "The 'gh' is completely silent." },
      { word: "two", sentence: "I have two hands.", why: "The 'w' is silent — it sounds just like \"too\"." },
      { word: "four", sentence: "There are four cats.", why: "The 'our' cluster says \"or\"." },
      { word: "goes", sentence: "She goes to school.", why: "The 'oes' ending says \"ohz\"." },
      { word: "does", sentence: "He does his homework.", why: "Looks like \"goes\" but sounds like \"duz\"." },
      { word: "made", sentence: "We made a cake.", why: "A split digraph (a_e) makes the 'a' say its name." },
      { word: "their", sentence: "They lost their ball.", why: "Sounds like \"there\" but uses a complex vowel cluster." },
    ],
  },
  {
    set: 6,
    color: "Purple",
    blurb: "Homophones & family words",
    emoji: "🍇",
    words: [
      { word: "once", sentence: "Once upon a time.", why: "A phantom \"w\" at the start and a trailing \"s\" sound." },
      { word: "upon", sentence: "The cat sat upon the mat.", why: "Two syllables with a soft, unstressed start." },
      { word: "always", sentence: "I always brush my teeth.", why: "The 'al' makes an \"or\" sound." },
      { word: "also", sentence: "I also like blue.", why: "Starts like \"always\" and ends with an open 'o'." },
      { word: "of", sentence: "A cup of milk.", why: "The 'f' surprisingly makes a \"v\" sound." },
      { word: "eight", sentence: "I am eight years old.", why: "The 'eigh' cluster says a long \"ai\" sound." },
      { word: "love", sentence: "I love my family.", why: "The 'o' says \"uh\" and the final 'e' is silent." },
      { word: "cover", sentence: "Cover the pot.", why: "The 'o' sounds like a short \"uh\", like in \"love\"." },
      { word: "after", sentence: "We play after school.", why: "Ends with a soft \"er\" schwa sound." },
      { word: "every", sentence: "Every day is fun.", why: "A hidden syllable — we say \"ev-ry\"." },
      { word: "mother", sentence: "My mother is kind.", why: "The 'o' says \"uh\" and the end says \"er\"." },
      { word: "father", sentence: "My father is tall.", why: "The 'a' stretches into an \"ar\" sound." },
    ],
  },
];

/** All tricky words in teaching order. */
export const trickyWords: TrickyWord[] = trickySets.flatMap((s) => s.words);
