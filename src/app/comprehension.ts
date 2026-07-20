import type { StoryQuiz } from "@/app/stories";

/** One comprehension question for a story. Either a tap-to-answer multiple
    choice (from the story's own quiz) or an open-ended talking question. */
export type CompItem =
  | {
      kind: "choice";
      skill: "Retrieval";
      question: string;
      options: { emoji: string; label: string }[];
      answer: number;
    }
  | { kind: "open"; skill: string; question: string };

/** Open-ended guided-reading question stems, ordered to cover a mix of
    comprehension skills. Tailored lightly with the story title. */
function openStems(title: string): { skill: string; question: string }[] {
  return [
    { skill: "Retrieval", question: `What is “${title}” about? Tell it in one sentence.` },
    { skill: "Sequence", question: "What happened at the beginning of the story?" },
    { skill: "Sequence", question: "What happened in the middle?" },
    { skill: "Sequence", question: "What happened at the end?" },
    { skill: "Inference", question: "How did the main character feel? How can you tell?" },
    { skill: "Inference", question: "Why do you think that happened?" },
    { skill: "Vocabulary", question: "Which word was new or tricky? What do you think it means?" },
    { skill: "Prediction", question: "What might happen next if the story kept going?" },
    { skill: "Opinion", question: "Which part did you like best? Why?" },
    { skill: "Opinion", question: "Would you have done the same as the character? Why?" },
  ];
}

/**
 * Ten comprehension questions for a story — a mix of one tap-to-answer
 * multiple-choice (the story's own quiz, when it has one) and open-ended
 * talking questions. None are compulsory or scored.
 */
export function storyQuestions(story: { title: string; quiz?: StoryQuiz }): CompItem[] {
  const items: CompItem[] = [];
  if (story.quiz) {
    items.push({
      kind: "choice",
      skill: "Retrieval",
      question: story.quiz.question,
      options: story.quiz.options,
      answer: story.quiz.answer,
    });
  }
  for (const s of openStems(story.title)) {
    if (items.length >= 10) break;
    items.push({ kind: "open", skill: s.skill, question: s.question });
  }
  return items.slice(0, 10);
}
