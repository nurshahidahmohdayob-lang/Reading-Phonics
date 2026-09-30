import { playSoundClip, speak } from "@/lib/speak";

/** Say a single word from a text the child is reading — the story, the
    assessment list — in the plain reading voice.

    The tricky-word recordings (tricky-<word>.mp3) are not used here. They
    were cut from the Jolly Phonics recap video and have its music running
    under every word, which is right for the Tricky Words songs and games
    (they have their own player) but wrong in the middle of a story, where a
    tap on "the" or "said" should sound like the word and nothing else. */
export function sayWord(word: string, rate = 0.85) {
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  // Single letters say their recorded phonics sound, not the letter name.
  if (key.length === 1 && key !== "i") {
    playSoundClip(key, key === "a" ? "ah" : key);
    return;
  }
  speak(word, rate);
}
