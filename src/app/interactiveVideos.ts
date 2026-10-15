import type { YearWorksheet } from "@/app/yearWorksheets";

/* Interactive videos: a read-aloud on YouTube that pauses at set moments to
   ask the child a question, then carries on. The video stays on YouTube
   (it's played from there, not copied here); only the questions live in
   the app.

   `at` is the second the video pauses at — just before the page turns, so
   the narrator has finished reading what the question is about. The first
   option is the right one; the player shuffles them. */

export type VideoQuestion = {
  at: number;
  q: string;
  options: [string, string, string, string];
  /** Shown after answering, so a wrong answer still teaches something. */
  why: string;
};

export type InteractiveVideo = {
  id: string;
  title: string;
  /** Book and video credit, shown under the player. */
  credit: string;
  youtubeId: string;
  /** Where the read-aloud ends (the presenter's goodbye after it is skipped). */
  end: number;
  emoji: string;
  focus: string;
  minutes: number;
  colours: [string, string];
  questions: VideoQuestion[];
  /** A short written answer once the video has finished. */
  writing: string;
  /** The follow-up worksheet for after watching: a retelling in our own
      words and mixed activities, built like a year-group worksheet. */
  worksheet: YearWorksheet;
};

export const INTERACTIVE_VIDEOS: InteractiveVideo[] = [
  {
    id: "couch-potato",
    title: "The Couch Potato",
    credit:
      "The Couch Potato by Jory John and Pete Oswald, read by StoryTime at Awnie's House on YouTube.",
    youtubeId: "9DiJIklsYtw",
    end: 543,
    emoji: "🥔",
    focus:
      "Listening · retrieval · sequencing · the story's message (balancing screens and the outdoors)",
    minutes: 15,
    colours: ["#C9774A", "#7DEBB0"],
    questions: [
      {
        at: 79,
        q: "Where does Couch Potato like to spend all his free time?",
        options: ["On the couch", "In the kitchen", "At the park", "At school"],
        why: "He sits on the couch all day. It's his favourite place.",
      },
      {
        at: 107,
        q: "What does his special button fetch for him?",
        options: ["Snacks", "His shoes", "A blanket", "His dog"],
        why: "A gadget brings him snacks, so he doesn't have to walk to the kitchen.",
      },
      {
        at: 199,
        q: "How does Couch Potato spend time with his friends at the start of the story?",
        options: ["On a screen", "At the park", "Riding bikes", "At the beach"],
        why: "He talks to his friends through a screen instead of meeting them.",
      },
      {
        at: 233,
        q: "What came in the delivery?",
        options: ["A new video camera", "A pizza", "A new couch", "A puppy"],
        why: "It was a new video camera. When he plugged it in, something went wrong!",
      },
      {
        at: 245,
        q: "Why did everything go dark?",
        options: [
          "The power went out",
          "It was night time",
          "He closed his eyes",
          "He turned off the lights",
        ],
        why: "Too many gadgets were plugged in, and the power went out.",
      },
      {
        at: 266,
        q: "Who did Couch Potato take for a walk?",
        options: ["His dog, Tater", "His best friend", "His mum", "Nobody"],
        why: "With nothing else to do, he took his dog Tater outside.",
      },
      {
        at: 327,
        q: "He heard a chirping noise. What was making it?",
        options: ["Birds", "His phone", "A video game", "The doorbell"],
        why: "He thought it might be a ringtone, but it was birds in a tree.",
      },
      {
        at: 361,
        q: "What did Couch Potato watch from the top of the hill?",
        options: ["The sunset", "A film", "A football match", "The rain"],
        why: "He sat under the tree and watched the sun go down. There was no fast-forward!",
      },
      {
        at: 406,
        q: "After he saw his reflection in the dark screen, what did he decide?",
        options: [
          "To get off the couch more often",
          "To buy more screens",
          "To sleep all day",
          "To move house",
        ],
        why: "He decided to peel himself off the couch more often, maybe every day.",
      },
      {
        at: 453,
        q: "Which of these did Couch Potato NOT do outside with his friends?",
        options: ["Play video games", "Ride bikes", "Go hiking", "Go swimming"],
        why: "Outside, they went biking, hiking and swimming together.",
      },
      {
        at: 513,
        q: "He found out he is more than just a couch potato. Which one does he say he is?",
        options: [
          "A kind potato",
          "A grumpy potato",
          "A lazy potato",
          "A sleepy potato",
        ],
        why: "He says he's an amusing, smart, kind and entertaining potato.",
      },
      {
        at: 541,
        q: "What is the big idea of the story?",
        options: [
          "It's good to balance screen time with time outside",
          "Screens are the best thing in the world",
          "You should never sit on a couch",
          "Potatoes can't go outside",
        ],
        why: "He still likes his couch, but he's happier with a balance of screens and the world outside.",
      },
    ],
    writing:
      "What would you like to do outside instead of watching a screen? Write one or two sentences.",
    worksheet: {
      key: "video",
      year: "After the video",
      title: "The Couch Potato",
      emoji: "🥔",
      focus:
        "Sequencing · story words · true or false · feelings · screen time or outside time · writing",
      minutes: 20,
      colours: ["#C9774A", "#3DD68C"],
      passage: {
        title: "Remember the story",
        paras: [
          "Couch Potato loved his couch. He sat there all day with his gadgets, his snacks and lots of screens. He even talked to his friends through a screen.",
          "One day a delivery came: a new video camera. When he plugged it in, the power went out and every screen went dark.",
          "With nothing to do, he took his dog, Tater, for a walk outside. Everything looked vivid and bright. He smelled fresh air and heard birds singing.",
          "He found a hill with a big tree and watched the sunset. When he got home, he saw his reflection in a dark screen and made a decision.",
          "Now he goes outside more often with his friends. He still likes his couch, but he is happier with a balance of screens and the world outside.",
        ],
      },
      questions: [
        {
          t: "order",
          q: "Put these in the order they happened.",
          items: [
            "Couch Potato sits on the couch all day.",
            "A delivery brings a new video camera.",
            "The power goes out.",
            "He takes Tater for a walk.",
            "He watches the sunset from the hill.",
            "He plays outside with his friends.",
          ],
        },
        {
          t: "match",
          q: "Match each word to what it means.",
          pairs: [
            ["gadget", "a clever machine that does a job"],
            ["delivery", "a parcel brought to your door"],
            ["reflection", "what you see of yourself in a shiny surface"],
            ["balance", "a fair mix of two things"],
          ],
        },
        {
          t: "truefalse",
          q: "Couch Potato's dog is called Tater.",
          answer: true,
        },
        {
          t: "truefalse",
          q: "At the start of the story, Couch Potato meets his friends at the park.",
          answer: false,
        },
        {
          t: "gap",
          before: "When the power went out, all of his",
          after: "went dark.",
          options: ["screens", "trees", "friends", "birds"],
          answer: 0,
        },
        {
          t: "choose",
          q: "Why did Couch Potato go outside the first time?",
          options: [
            "The power was out and there was nothing else to do",
            "His mum told him to",
            "His friends were waiting for him",
            "He wanted to buy more snacks",
          ],
          answer: 0,
        },
        {
          t: "choose",
          q: "How do you think Couch Potato felt as he watched the sunset?",
          options: ["Calm and amazed", "Angry", "Bored", "Scared"],
          answer: 0,
        },
        {
          t: "match",
          q: "Screen time or outside time? Sort them.",
          pairs: [
            ["📺 watching shows", "Screen time"],
            ["🚲 riding bikes", "Outside time"],
            ["🎮 playing video games", "Screen time"],
            ["☁️ watching the clouds", "Outside time"],
            ["🥾 going hiking", "Outside time"],
          ],
          options: ["Screen time", "Outside time"],
        },
        {
          t: "find",
          q: "Find the word in the story that means very bright and clear.",
          answers: ["vivid"],
        },
        {
          t: "write",
          q: "Write a note to Couch Potato. Tell him one thing he could do outside, and why it is fun.",
          hint: "Dear Couch Potato, you should try… because…",
          lines: 4,
        },
        { t: "draw", q: "Draw your favourite thing to do outside." },
      ],
    },
  },
];

export function findInteractiveVideo(id: string): InteractiveVideo | undefined {
  return INTERACTIVE_VIDEOS.find((v) => v.id === id);
}

/* An interactive video is sent to a class as a tiny page that only names
   the video: the class page sees the name and plays the video itself, since
   YouTube won't play inside the locked-down frame other lessons use. */

export function videoLessonHtml(v: InteractiveVideo): string {
  return `<!doctype html><html><head><meta name="zera-video" content="${v.id}"><title>${v.title}</title></head><body style="font-family:sans-serif;padding:24px"><h2>🎬 ${v.title}</h2><p>Open this from your class link to watch the video and answer the questions.</p></body></html>`;
}

/** The video a lesson names, if it is one of these. */
export function videoInLesson(
  html: string | undefined,
): InteractiveVideo | undefined {
  const m = html
    ? /<meta name="zera-video" content="([a-z0-9-]+)">/.exec(html)
    : null;
  return m ? findInteractiveVideo(m[1]) : undefined;
}
