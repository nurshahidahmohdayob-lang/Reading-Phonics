/** Jolly Phonics "tricky words" — common words that can't be easily sounded
    out and are learned by sight. Grouped roughly in teaching order. */
export type TrickyWord = {
  word: string;
  /** A short sentence putting the word in context. */
  sentence: string;
};

export const trickyWords: TrickyWord[] = [
  { word: "I", sentence: "I am happy." },
  { word: "the", sentence: "The cat is here." },
  { word: "he", sentence: "He is my friend." },
  { word: "she", sentence: "She can run fast." },
  { word: "me", sentence: "Come with me." },
  { word: "we", sentence: "We like to play." },
  { word: "be", sentence: "Be kind to others." },
  { word: "was", sentence: "It was a sunny day." },
  { word: "to", sentence: "I go to school." },
  { word: "do", sentence: "Do you like it?" },
  { word: "are", sentence: "We are friends." },
  { word: "all", sentence: "We all had fun." },
  { word: "you", sentence: "How are you?" },
  { word: "your", sentence: "Where is your hat?" },
  { word: "come", sentence: "Come and play." },
  { word: "some", sentence: "I have some cake." },
  { word: "said", sentence: "She said hello." },
  { word: "here", sentence: "Sit here with me." },
  { word: "there", sentence: "The ball is there." },
  { word: "they", sentence: "They are going home." },
  { word: "go", sentence: "Let's go outside." },
  { word: "no", sentence: "No, thank you." },
  { word: "so", sentence: "I am so happy." },
  { word: "my", sentence: "This is my dog." },
  { word: "one", sentence: "I have one apple." },
  { word: "by", sentence: "Sit by the door." },
  { word: "like", sentence: "I like to read." },
  { word: "have", sentence: "I have a book." },
  { word: "live", sentence: "We live in a house." },
  { word: "give", sentence: "Give me the pen." },
  { word: "little", sentence: "A little mouse ran." },
  { word: "down", sentence: "Sit down, please." },
  { word: "what", sentence: "What is your name?" },
  { word: "when", sentence: "When can we go?" },
  { word: "out", sentence: "We went out to play." },
  { word: "where", sentence: "Where is the cat?" },
];
