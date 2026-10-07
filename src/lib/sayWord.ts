import { playSoundClip, speak } from "@/lib/speak";

/* Said on their own, a couple of the commonest words come out wrong: the
   speech voice reads a lone "the" as "thee" and a lone "a" as "ay" — their
   emphasised forms. In a sentence, and the way children are taught to read
   them, they're "thuh" and "uh". So they're spelt the way they should sound.
   (Checked by measuring the vowel: "the" sent as-is has a second formant of
   ~2850 Hz, an "ee"; sent as "thuh" it's ~1135 Hz, the "uh" in "the", with
   the "th" still voiced.) */
const SAY_AS: Record<string, string> = {
  the: "thuh",
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
