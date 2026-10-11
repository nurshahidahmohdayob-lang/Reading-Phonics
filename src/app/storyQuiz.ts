import type { Story, StoryQuiz } from "@/app/stories";
import { Y1 } from "@/app/storyQuestions/y1";
import { Y2 } from "@/app/storyQuestions/y2";
import { Y3 } from "@/app/storyQuestions/y3";
import { Y4 } from "@/app/storyQuestions/y4";
import { Y5 } from "@/app/storyQuestions/y5";
import { Y6 } from "@/app/storyQuestions/y6";

/** One extra question: the question, then its options as "emoji label",
    the right answer always written first (it is shuffled on screen). */
export type Q = [question: string, right: string, ...wrong: string[]];

const EXTRA: Record<string, Q[]> = { ...Y1, ...Y2, ...Y3, ...Y4, ...Y5, ...Y6 };

function option(s: string): { emoji: string; label: string } {
  const at = s.indexOf(" ");
  return { emoji: s.slice(0, at), label: s.slice(at + 1) };
}

/** Small seeded shuffle, so a story's options sit in the same places every
    time it is opened but the right answer is not always on top. */
function shuffled<T>(items: T[], seed: string): { items: T[]; from: number[] } {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const from = items.map((_, i) => i);
  for (let i = from.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [from[i], from[j]] = [from[j], from[i]];
  }
  return { items: from.map((i) => items[i]), from };
}

function mix(q: StoryQuiz, seed: string): StoryQuiz {
  const { items, from } = shuffled(q.options, seed);
  return { question: q.question, options: items, answer: from.indexOf(q.answer) };
}

/** Up to ten tap-to-answer questions for a story: its own quiz first, then
    the extra questions written for it. */
export function storyQuizzes(story: Pick<Story, "id" | "quiz">): StoryQuiz[] {
  const list: StoryQuiz[] = story.quiz ? [story.quiz] : [];
  for (const [question, ...opts] of EXTRA[story.id] ?? []) {
    list.push({ question, options: opts.map(option), answer: 0 });
  }
  return list.slice(0, 10).map((q, i) => mix(q, `${story.id}:${i}`));
}
