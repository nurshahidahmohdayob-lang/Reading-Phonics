import { playClip, playSoundClip, speak } from "@/lib/speak";

/* Said on their own, a couple of the commonest words come out wrong: the
   speech voice reads a lone "the" as "thee" and a lone "a" as "ay" — their
   emphasised forms. That isn't how children are taught to read them.

   "the" plays a short recording, public/sounds/word-the.mp3: "theh", in the
   same voice as every other word. No spelling makes the voice say it — "theh",
   "thè", "dheh" and the rest all come back as "thee" — so the recording is the
   voice saying "thed", cut just before the d. Measured: its vowel has formants
   of ~717/2074 Hz, the "e" in "then" (~737/2033 Hz), with the "th" voiced and
   no d at the end. If the file can't play, it falls back to "thuh".

   "a" is spelt "uh", which the voice says the way "a" sounds in a sentence. */
const RECORDED: Record<string, { clip: string; fallback: string }> = {
  the: { clip: "word-the", fallback: "thuh" },
};
const SAY_AS: Record<string, string> = {
  a: "uh",
};

/** Say a single word from a text the child is reading — the story, the
    assessment list, a word to practise — in the plain reading voice.

    The tricky-word recordings (tricky-<word>.mp3) are not used here. They
    were cut from the Jolly Phonics recap video and have its music running
    under every word, which is right for the Tricky Words songs and games
    (they have their own player) but wrong in the middle of a story, where a
    tap on "the" or "said" should sound like the word and nothing else. */
export function sayWord(word: string, rate = 0.85) {
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  if (RECORDED[key]) {
    const { clip, fallback } = RECORDED[key];
    playClip(clip, () => speak(fallback, rate));
    return;
  }
  if (SAY_AS[key]) {
    speak(SAY_AS[key], rate);
    return;
  }
  // Other single letters say their recorded phonics sound, not the letter name.
  if (key.length === 1 && key !== "i") {
    playSoundClip(key, key);
    return;
  }
  speak(word, rate);
}
