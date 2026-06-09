import { lessons, type Lesson, type Word } from "@/app/lessons";

/** Return a new array with the items shuffled (Fisher–Yates). */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick `n` random items from a list. */
export function sample<T>(items: T[], n: number): T[] {
  return shuffle(items).slice(0, n);
}

/** Words from every lesson EXCEPT the given one — useful for distractors. */
export function otherWords(lesson: Lesson): Word[] {
  return lessons
    .filter((l) => l.letter !== lesson.letter)
    .flatMap((l) => l.words);
}
