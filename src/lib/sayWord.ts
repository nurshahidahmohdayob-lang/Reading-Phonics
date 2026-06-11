import { trickyWords } from "@/app/tricky";
import { playClip, playSoundClip, speak } from "@/lib/speak";

/* The 72 tricky words have real recordings (tricky-<word>.mp3). */
const TRICKY = new Set(trickyWords.map((w) => w.word.toLowerCase()));

/** Say a single word: recorded tricky-word clip when we have one,
    otherwise the reading voice. */
export function sayWord(word: string, rate = 0.85) {
  const key = word.toLowerCase().replace(/[^a-z]/g, "");
  // Single letters ("a", and "I" when not in the tricky set) say their
  // recorded phonics sound, not the letter name.
  if (key.length === 1 && !TRICKY.has(key)) {
    playSoundClip(key, key === "a" ? "ah" : key);
    return;
  }
  if (TRICKY.has(key)) {
    playClip(`tricky-${key}`, () => speak(word, rate));
  } else {
    speak(word, rate);
  }
}
