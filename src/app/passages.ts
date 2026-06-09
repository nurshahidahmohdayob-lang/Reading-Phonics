import { levels, type Level } from "@/app/stories";

export type Passage = {
  id: string;
  title: string;
  emoji: string;
  lexile: number;
  text: string;
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
  })),
}));
