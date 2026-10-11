/* Year-group reading worksheets: one for each year, Year 1 to Year 6. Each is
   a short storybook passage and a set of mixed questions about it, getting
   harder year by year:

     Year 1  a short, decodable story; picture choices, yes or no, put three
             things in order, a rhyme, draw it
     Year 2  a longer story; choices, true or false, fill the gap, word
             meanings, why something happened, write a sentence
     Year 3  vocabulary in context, sequencing five events, inference
     Year 4  feelings and the evidence for them, fact or opinion
     Year 5  figurative language, the author's word choice, summarising
     Year 6  inference across the passage, devices, viewpoint, a written
             answer explained with evidence from the text

   Each year has four. Year 1 and 2 (kept easy, Year 1 mostly phonics) are in
   app/yearWorksheetsEarly.ts; Years 3 to 6 are here and in
   app/yearWorksheetsMore.ts.
   lib/yearWorksheetHtml.ts turns one into a self-contained interactive page,
   which the teacher sets as an assignment (tabs/Assignments.tsx). */

import { MORE_WORKSHEETS } from "@/app/yearWorksheetsMore";
import { EARLY_WORKSHEETS } from "@/app/yearWorksheetsEarly";

export type WorksheetQuestion =
  /** Tap one answer. pics: the options are big picture tiles. */
  | { t: "choose"; q: string; options: string[]; answer: number; pics?: boolean }
  /** True or false (or yes or no, for the youngest). */
  | { t: "truefalse"; q: string; answer: boolean; yesNo?: boolean }
  /** Pick the word that fills the gap in a sentence. */
  | { t: "gap"; before: string; after: string; options: string[]; answer: number }
  /** Tap the events in the order they happened (written here in order). */
  | { t: "order"; q: string; items: string[] }
  /** Match each thing on the left to one of the options (one mark each). */
  | { t: "match"; q: string; pairs: [string, string][]; options?: string[] }
  /** Find a word in the passage and type it. */
  | { t: "find"; q: string; answers: string[] }
  /** A written answer, read by the teacher (not marked). */
  | { t: "write"; q: string; hint?: string; lines?: number }
  /** A drawing, seen by the teacher (not marked). */
  | { t: "draw"; q: string }
  /** Build a word from its sounds: a picture, then drag the sounds into the
      boxes. sounds: the word's sounds in order ("sh", "i", "p"); extra: decoys. */
  | { t: "spell"; q: string; pic: string; word: string; sounds: string[]; extra?: string[] };

export type YearWorksheet = {
  /** The roster key of the year it's written for, e.g. "y1". */
  key: string;
  year: string;
  title: string;
  emoji: string;
  /** What the sheet practises, for the teacher. */
  focus: string;
  minutes: number;
  /** The sheet's two theme colours. */
  colours: [string, string];
  passage: { title: string; paras: string[] };
  questions: WorksheetQuestion[];
};

const FIRST_WORKSHEETS: YearWorksheet[] = [
  {
    key: "y3",
    year: "Year 3",
    title: "The Lighthouse Cat",
    emoji: "🐈‍⬛",
    focus: "Retrieval · vocabulary in context · sequencing · simple inference",
    minutes: 25,
    colours: ["#3FD8DE", "#4DB2FF"],
    passage: {
      title: "The Lighthouse Cat",
      paras: [
        "High on a rocky cliff stood a crooked lighthouse, and inside it lived a little black cat called Inky. Every evening, the old keeper climbed the spiral stairs to light the great lamp, while Inky curled up beside the warm glass.",
        "One stormy night, the keeper fell asleep in his armchair, exhausted after mending the fishing nets. The lamp stayed dark, and far out at sea a small boat was drifting towards the jagged rocks.",
        "Inky's ears pricked up at the faint sound of a bell. Quickly, she raced up the stairs, leapt onto the lever and pushed with all her strength. Click! A golden beam swept across the waves, and the boat turned safely towards the harbour.",
        "The next morning, the grateful fishermen left a silver fish on the doorstep. “It seems we have two keepers now,” chuckled the old man.",
      ],
    },
    questions: [
      { t: "choose", q: "Where did Inky curl up every evening?", options: ["on the keeper's armchair", "beside the warm glass", "under the fishing nets", "on the doorstep"], answer: 1 },
      { t: "truefalse", q: "The keeper was tired because he had mended the fishing nets.", answer: true },
      { t: "truefalse", q: "The boat was sailing towards the harbour before Inky lit the lamp.", answer: false },
      {
        t: "match",
        q: "Match each word from the story to its meaning.",
        pairs: [
          ["crooked", "bent, not straight"],
          ["exhausted", "very, very tired"],
          ["jagged", "rough and sharp"],
          ["grateful", "thankful"],
        ],
      },
      {
        t: "order",
        q: "Tap the events in the order they happened.",
        items: ["The keeper fell asleep.", "A boat drifted towards the rocks.", "Inky heard a bell.", "Inky pushed the lever.", "The fishermen left a fish."],
      },
      { t: "choose", q: "Why did the fishermen leave a silver fish?", options: ["to feed the keeper", "to say thank you to Inky", "because they caught too many", "to sell it at the market"], answer: 1 },
      { t: "choose", q: "What does “Inky's ears pricked up” tell us?", options: ["She was falling asleep.", "She was suddenly listening carefully.", "Her ears were cold.", "She was angry."], answer: 1 },
      { t: "find", q: "Find the word that tells you the stairs went round and round.", answers: ["spiral"] },
      { t: "write", q: "Why did the keeper say, “It seems we have two keepers now”?", hint: "Think about what Inky did.", lines: 3 },
    ],
  },
  {
    key: "y4",
    year: "Year 4",
    title: "The Map in the Library",
    emoji: "🗺️",
    focus: "Inference about feelings · evidence · fact or opinion · word choice",
    minutes: 30,
    colours: ["#FF9B3D", "#FF7B6B"],
    passage: {
      title: "The Map in the Library",
      paras: [
        "On a rainy afternoon, Maya was shelving books in the school library when a folded piece of paper slipped from an old atlas. It was a map, drawn in faded brown ink, and in the corner someone had written: The garden remembers.",
        "Curious, Maya traced the dotted line with her finger. It led from the library door, past the pond, to the ancient oak at the far end of the playground. Her heart thumped. She had walked past that tree a hundred times and never noticed anything unusual.",
        "When the bell rang for home time, she hurried outside with her hood pulled tight. At the foot of the oak, half hidden by ivy, was a small wooden door no taller than her hand. She knelt down, hardly daring to breathe, and knocked three times.",
        "Slowly, the door creaked open, and a warm light spilled onto the wet grass. “At last,” said a tiny voice. “We have been waiting for a reader just like you.”",
      ],
    },
    questions: [
      { t: "choose", q: "Where did the map fall from?", options: ["a storybook", "an old atlas", "Maya's bag", "a shelf"], answer: 1 },
      { t: "choose", q: "How did Maya feel when she found the map?", options: ["bored", "curious", "angry", "sleepy"], answer: 1 },
      { t: "choose", q: "Which phrase best shows that Maya was nervous at the door?", options: ["“hurried outside”", "“hardly daring to breathe”", "“traced the dotted line”", "“on a rainy afternoon”"], answer: 1 },
      { t: "truefalse", q: "Maya had noticed the little door many times before.", answer: false },
      {
        t: "match",
        q: "Is each sentence a fact from the story, or someone's opinion?",
        options: ["Fact", "Opinion"],
        pairs: [
          ["The map was drawn in faded brown ink.", "Fact"],
          ["Libraries are the most exciting places in school.", "Opinion"],
          ["The door was hidden by ivy.", "Fact"],
          ["Rainy days are the best days for adventures.", "Opinion"],
        ],
      },
      { t: "gap", before: "The dotted line led past the pond to the", after: "oak.", options: ["tiny", "ancient", "broken"], answer: 1 },
      { t: "find", q: "Find a word in the second paragraph that means “very old”.", answers: ["ancient"] },
      { t: "choose", q: "Why do you think the author wrote “The garden remembers” on the map?", options: ["to make the reader wonder what secret is hidden", "to tell us the garden is messy", "because the map was a shopping list", "to show it was raining"], answer: 0 },
      {
        t: "order",
        q: "Put these events in order.",
        items: ["A map slipped out of a book.", "Maya followed the line with her finger.", "The bell rang for home time.", "Maya knocked on the little door.", "A tiny voice spoke."],
      },
      { t: "write", q: "What do you think happens next? Use one idea from the story to explain your answer.", hint: "I think … because in the story …", lines: 4 },
    ],
  },
  {
    key: "y5",
    year: "Year 5",
    title: "The Clockmaker's Apprentice",
    emoji: "⏰",
    focus: "Figurative language · word choice · inference · summarising",
    minutes: 35,
    colours: ["#7F93FF", "#A27DFF"],
    passage: {
      title: "The Clockmaker's Apprentice",
      paras: [
        "The clock shop on Thimble Lane was older than anyone in the town could remember. Its windows glowed like honey in the winter dusk, and inside, a hundred clocks ticked together like the heartbeat of a sleeping giant.",
        "Elsie had been the clockmaker's apprentice for exactly one year when old Mr Hartwell handed her a tarnished silver key. “This opens the cabinet at the back,” he said quietly. “Whatever you find, never wind the blue clock past midnight.”",
        "That evening, alone in the shop, Elsie unlocked the cabinet. The blue clock sat on a velvet cushion, its hands frozen at a minute to twelve. Temptation tugged at her sleeve. Surely one small turn could do no harm?",
        "The moment the hands met at midnight, every clock in the shop fell silent. Outside, snowflakes hung motionless in the air like stars that had forgotten to fall. Elsie's breath caught in her throat. Time itself had stopped, and only she was left awake to set it moving again.",
      ],
    },
    questions: [
      { t: "choose", q: "How long had Elsie been an apprentice?", options: ["one month", "exactly one year", "a hundred days", "since she was born"], answer: 1 },
      {
        t: "match",
        q: "Match each phrase to the kind of language it is.",
        options: ["Simile", "Personification"],
        pairs: [
          ["Its windows glowed like honey", "Simile"],
          ["Temptation tugged at her sleeve", "Personification"],
          ["snowflakes hung … like stars", "Simile"],
          ["stars that had forgotten to fall", "Personification"],
        ],
      },
      { t: "choose", q: "What does “the heartbeat of a sleeping giant” suggest about the ticking?", options: ["It was loud, steady and alive.", "It was quick and frightened.", "It was broken.", "It was very quiet and stopped often."], answer: 0 },
      { t: "truefalse", q: "Mr Hartwell told Elsie never to open the cabinet.", answer: false },
      { t: "choose", q: "Which word best describes Elsie when she turned the key on the blue clock?", options: ["obedient", "tempted", "furious", "bored"], answer: 1 },
      { t: "find", q: "Find a word in the second paragraph that means “dull and no longer shiny”.", answers: ["tarnished"] },
      { t: "gap", before: "The blue clock sat on a", after: "cushion.", options: ["velvet", "wooden", "silver"], answer: 0 },
      {
        t: "choose",
        q: "Which sentence is the best summary of the story?",
        options: [
          "Elsie works in a shop and likes clocks.",
          "Elsie ignores a warning, winds a magic clock and stops time.",
          "Mr Hartwell sells a blue clock to a customer.",
          "It snows in the town on Thimble Lane.",
        ],
        answer: 1,
      },
      { t: "order", q: "Put these events in order.", items: ["Mr Hartwell gave Elsie a key.", "Elsie unlocked the cabinet.", "She wound the clock to midnight.", "Every clock fell silent.", "Elsie realised time had stopped."] },
      { t: "write", q: "Why do you think Mr Hartwell gave Elsie the key, even though he gave her a warning? Use evidence from the text.", hint: "Think about how long she had worked there and what he trusted her to do.", lines: 4 },
    ],
  },
  {
    key: "y6",
    year: "Year 6",
    title: "The Last Lantern of Kestrel Isle",
    emoji: "🏮",
    focus: "Inference with evidence · vocabulary in context · devices · viewpoint · explaining",
    minutes: 40,
    colours: ["#3DD68C", "#3FD8DE"],
    passage: {
      title: "The Last Lantern of Kestrel Isle",
      paras: [
        "For three hundred years, the lanterns of Kestrel Isle had never once gone out. Each household tended its own flame, and on the longest night of winter the islanders carried them down to the harbour, where the light rose over the black water like a promise kept.",
        "This winter, however, the lanterns had begun to fail. One by one they flickered, sputtered and died, until only the lantern in Grandmother Wren's cottage still burned. The islanders whispered that the old magic was fading; hope had become a candle burning low in every heart, and some families had already begun packing their boats for the mainland.",
        "Finn, who was twelve and stubborn as the sea wind, refused to believe it. He spent three nights in the island archive, turning brittle pages by candlelight while the wind clawed at the shutters, until he found a single line in a faded hand: The flame is fed by what is shared, not by what is kept.",
        "On the longest night, Finn knocked on every door with Grandmother Wren's lantern held high. At each house, he tipped its flame towards the cold wick inside. To everyone's astonishment, her lantern did not dim; it blazed brighter with every light it gave away. By midnight, the harbour shone like a fallen constellation, and not a single boat left Kestrel Isle.",
      ],
    },
    questions: [
      { t: "choose", q: "What did the islanders believe was causing the lanterns to fail?", options: ["a storm from the mainland", "the old magic fading", "Finn's experiments", "a lack of candles"], answer: 1 },
      { t: "choose", q: "In the second paragraph, what does “sputtered” suggest about the flames?", options: ["They burned steadily.", "They struggled and spat as they went out.", "They grew suddenly bigger.", "They changed colour."], answer: 1 },
      {
        t: "match",
        q: "Match each quotation to the device the author uses.",
        options: ["Simile", "Metaphor", "Personification"],
        pairs: [
          ["stubborn as the sea wind", "Simile"],
          ["hope had become a candle burning low in every heart", "Metaphor"],
          ["the wind clawed at the shutters", "Personification"],
          ["the harbour shone like a fallen constellation", "Simile"],
        ],
      },
      { t: "truefalse", q: "Finn found the answer by asking Grandmother Wren.", answer: false },
      { t: "choose", q: "What does the line “The flame is fed by what is shared, not by what is kept” mean in the story?", options: ["Lanterns need more oil.", "The light grows stronger when people give it to others.", "Families should keep their lanterns locked away.", "Only one lantern can burn at a time."], answer: 1 },
      { t: "choose", q: "Which word best describes Finn's character?", options: ["determined", "careless", "timid", "selfish"], answer: 0 },
      { t: "find", q: "Find a word in the third paragraph that means “easily broken”.", answers: ["brittle"] },
      {
        t: "choose",
        q: "Why does the author end with “not a single boat left Kestrel Isle”?",
        options: [
          "to show the islanders decided to stay because hope had returned",
          "to tell us the weather was too stormy to sail",
          "to explain that the boats were broken",
          "to show the islanders were trapped",
        ],
        answer: 0,
      },
      { t: "order", q: "Put these events in order.", items: ["The lanterns began to fail.", "Some islanders packed their boats.", "Finn searched the archive.", "Finn shared the last flame.", "The harbour shone with light."] },
      { t: "write", q: "What message do you think the author wants readers to learn? Explain your answer using two pieces of evidence from the text.", hint: "The author wants us to learn … I know this because … Also, …", lines: 5 },
    ],
  },
];

/** Every worksheet, four for each year, in year order: Year 1 and Year 2 in
    app/yearWorksheetsEarly.ts, the rest here and in app/yearWorksheetsMore.ts. */
export const YEAR_WORKSHEETS: YearWorksheet[] = [...EARLY_WORKSHEETS, ...FIRST_WORKSHEETS, ...MORE_WORKSHEETS].sort((a, b) => a.key.localeCompare(b.key));

/** The worksheets written for one year, e.g. "y2". */
export const worksheetsFor = (key: string) => YEAR_WORKSHEETS.filter((w) => w.key === key);
