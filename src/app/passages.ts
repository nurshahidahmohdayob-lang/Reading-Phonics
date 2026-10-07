import { levels, type Level, type StoryQuiz } from "@/app/stories";
import { STARTER_LEVEL } from "@/app/starterStories";

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

/** Reading-aloud passages, built from the leveled stories (Lexile bands).
    Guided Reading starts with the Starter level (BR99L) for beginning
    readers, below Year 1 — see app/starterStories.ts. */
export const passageLevels: PassageLevel[] = [STARTER_LEVEL, ...levels].map((l) => ({
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
  // Not assessed and not on a class list: Year 1, as before Starter existed.
  return byYear ?? passageLevels.find((l) => l.id === "year1") ?? passageLevels[0];
}

/* Stories a teacher has added for a level live in this browser, one list per
   level. */
export function customKey(levelId: string) {
  return `custom-passages-${levelId}`;
}

export function loadCustom(levelId: string): Passage[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(customKey(levelId)) ?? "[]");
  } catch {
    return [];
  }
}

/** The story a logged read was for — one of the built-in stories, or one a
    teacher added on this device. Older reads saved "y2" for "year2". */
export function findPassage(
  passageId: string,
  levelId: string,
): { passage: Passage; level: PassageLevel } | null {
  const id = levelId.replace(/^y(\d)$/, "year$1");
  const level = passageLevels.find((l) => l.id === id);
  for (const l of level ? [level, ...passageLevels] : passageLevels) {
    const hit = l.passages.find((p) => p.id === passageId);
    if (hit) return { passage: hit, level: l };
  }
  if (level) {
    const custom = loadCustom(level.id).find((p) => p.id === passageId);
    if (custom) return { passage: custom, level };
  }
  return null;
}
