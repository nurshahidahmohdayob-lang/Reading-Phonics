import { levels, type Level, type StoryQuiz } from "@/app/stories";

export type Passage = {
  id: string;
  title: string;
  emoji: string;
  lexile: number;
  text: string;
  /** The story's hand-written multiple-choice question, if it has one. Used as
      the tap-to-answer item in the story's comprehension questions. */
  quiz?: StoryQuiz;
};

export type PassageLevel = {
  id: string;
  grade: string;
  age: number;
  lexileRange: string;
  wpmLow: number;
  wpmHigh: number;
  accuracyGoal: number;
  swatch: string;
  swatchText: string;
  /** Full level definition, for benchmark classification. */
  source: Level;
  passages: Passage[];
};

/** Reading-aloud passages, built from the leveled stories (Lexile bands). */
export const passageLevels: PassageLevel[] = levels.map((l) => ({
  id: l.id,
  grade: l.grade,
  age: l.age,
  lexileRange: l.lexileRange,
  wpmLow: l.wpmLow,
  wpmHigh: l.wpmHigh,
  accuracyGoal: l.accuracyGoal,
  swatch: l.swatch,
  swatchText: l.swatchText,
  source: l,
  passages: l.stories.map((s) => ({
    id: s.id,
    title: s.title,
    emoji: s.emoji,
    lexile: s.lexile,
    text: s.pages.map((p) => p.text).join(" "),
    quiz: s.quiz,
  })),
}));

/** The guided reading level a child should be reading at.

    By their most recent assessment when they have one — the highest level
    whose band they've reached, so a child at exactly 875L starts on the Year
    5 stories rather than the top of Year 4. A Year 1 child assessed at 900L
    belongs on the Year 5 stories too: the level follows the reading, not the
    class. Without an assessment, their own year group's level. */
export function levelForReader(
  lexile: number | null,
  yearKey: string,
): PassageLevel {
  if (lexile !== null) {
    let chosen = passageLevels[0];
    for (const l of passageLevels) {
      if (l.source.lexileLow <= lexile) chosen = l;
    }
    return chosen;
  }
  const byYear = passageLevels.find(
    (l) => l.id === yearKey.replace(/^y/, "year"),
  );
  return byYear ?? passageLevels[0];
}
