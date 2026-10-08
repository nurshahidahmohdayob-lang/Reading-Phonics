/* Interactive stories: little illustrated plays, in the spirit of Starfall's
   "I'm Reading" plays. Each page is a scene (a painted background with
   characters and props placed on it) and a few lines: the narrator's, and
   the characters' own, each spoken in that character's voice while they
   bounce. Children tap characters and props to make them move and talk, and
   tap words to hear them. Played by components/InteractiveStory.

   Positions are percentages of the scene: x across from the left, y down
   from the top to the character's feet. Size is a percentage of the scene's
   width. */

export type Voice = "narrator" | "small" | "big" | "normal";

export type Action = "hop" | "wiggle" | "spin" | "shake" | "drive" | "grow" | "float";

export type Actor = {
  /** Who it is: a character in the cast, or a prop (just an emoji). */
  cast?: string;
  emoji?: string;
  x: number;
  y: number;
  size: number;
  /** Face the other way. */
  flip?: boolean;
  /** What it does when tapped (characters also say their tap line). */
  action?: Action;
};

export type Line = { who?: string; text: string };

export type Scenery = "road" | "castle" | "snow" | "village" | "villageSnow" | "farm" | "sea";

export type Page = { scene: Scenery; actors: Actor[]; lines: Line[] };

export type CastMember = {
  name: string;
  emoji: string;
  voice: Voice;
  /** Name badge colour. */
  colour: string;
  /** What they say when tapped. */
  tap: string;
};

export type InteractiveStory = {
  id: string;
  title: string;
  emoji: string;
  level: string;
  cast: Record<string, CastMember>;
  pages: Page[];
};

const sun = (x = 86, y = 22): Actor => ({ emoji: "☀️", x, y, size: 9, action: "spin" });
const cloud = (x: number, y: number): Actor => ({ emoji: "☁️", x, y, size: 10, action: "float" });
const tree = (x: number, y = 70): Actor => ({ emoji: "🌳", x, y, size: 14, action: "wiggle" });
const moon = (x = 85, y = 22): Actor => ({ emoji: "🌙", x, y, size: 9, action: "spin" });

export const INTERACTIVE_STORIES: InteractiveStory[] = [
  {
    id: "ten-hens",
    title: "Ten Hens in a Van",
    emoji: "🚐",
    level: "Starter",
    cast: {
      hen: { name: "Hen", emoji: "🐔", voice: "small", colour: "#E8433A", tap: "Cluck, cluck!" },
      fox: { name: "Fox", emoji: "🦊", voice: "big", colour: "#E07A1F", tap: "Yum, yum!" },
    },
    pages: [
      {
        scene: "road",
        actors: [sun(), cloud(20, 20), tree(10), { emoji: "🚐", x: 50, y: 82, size: 30, action: "drive" }, { cast: "hen", x: 72, y: 84, size: 11, action: "hop" }],
        lines: [
          { text: "Ten hens have a red van." },
          { who: "hen", text: "Beep, beep! We like our van!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(30, 18), tree(90), { emoji: "🚐", x: 40, y: 82, size: 30, action: "drive" }, { cast: "fox", x: 78, y: 84, size: 14, flip: true, action: "shake" }],
        lines: [
          { text: "A fox sees the van." },
          { who: "fox", text: "Yum! Let me in, hens!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), tree(12), { emoji: "🚐", x: 52, y: 82, size: 30, action: "drive" }, { cast: "hen", x: 28, y: 84, size: 11, action: "hop" }, { cast: "fox", x: 78, y: 84, size: 14, flip: true, action: "shake" }],
        lines: [
          { text: "The hens let the fox get in." },
          { who: "hen", text: "Come in, Fox!" },
          { who: "fox", text: "He, he, he!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(70, 16), { emoji: "🚐", x: 50, y: 82, size: 30, action: "shake" }, { cast: "hen", x: 22, y: 84, size: 11, action: "hop" }, { cast: "hen", x: 34, y: 86, size: 9, action: "hop" }, { cast: "fox", x: 74, y: 84, size: 14, flip: true, action: "shake" }],
        lines: [
          { text: "Then the ten hens peck the fox." },
          { who: "hen", text: "Peck, peck, peck!" },
          { who: "fox", text: "Ow! Ow! Ow!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), tree(80), { emoji: "🚐", x: 32, y: 82, size: 30, action: "drive" }, { cast: "fox", x: 82, y: 86, size: 12, action: "hop" }, { emoji: "💨", x: 92, y: 84, size: 7, action: "float" }],
        lines: [
          { text: "The fox jumps out and runs off." },
          { who: "fox", text: "Help! Help!" },
          { who: "hen", text: "Bye, bye, Fox!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(25, 18), tree(12), tree(88), { emoji: "🚐", x: 50, y: 82, size: 30, action: "drive" }, { cast: "hen", x: 72, y: 84, size: 11, action: "hop" }, { emoji: "🏆", x: 30, y: 82, size: 8, action: "spin" }],
        lines: [
          { text: "The hens are the bosses of the van!" },
          { who: "hen", text: "Beep, beep!" },
        ],
      },
    ],
  },
  {
    id: "sir-snorebert",
    title: "Sir Snorebert",
    emoji: "🛡️",
    level: "Year 1",
    cast: {
      knight: { name: "Sir Snorebert", emoji: "💂", voice: "normal", colour: "#3a7be8", tap: "Zzzzz..." },
      king: { name: "The King", emoji: "🤴", voice: "big", colour: "#8b5cf6", tap: "I am the king!" },
      dragon: { name: "Dragon", emoji: "🐉", voice: "big", colour: "#16a34a", tap: "Roar!" },
    },
    pages: [
      {
        scene: "castle",
        actors: [moon(), { cast: "knight", x: 35, y: 86, size: 15, action: "wiggle" }, { cast: "king", x: 65, y: 86, size: 15, flip: true, action: "hop" }],
        lines: [
          { text: "Sir Snorebert was a brave knight, but he was always sleepy." },
          { who: "king", text: "Sir Snorebert, are you ready?" },
          { who: "knight", text: "Zzzzz..." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(15, 20), { cast: "dragon", x: 70, y: 40, size: 24, flip: true, action: "float" }, { emoji: "💰", x: 30, y: 86, size: 9, action: "hop" }],
        lines: [
          { text: "One night, a dragon flew over the castle." },
          { who: "dragon", text: "Roar! I want your gold!" },
        ],
      },
      {
        scene: "castle",
        actors: [moon(), { cast: "dragon", x: 80, y: 32, size: 18, flip: true, action: "float" }, { cast: "king", x: 62, y: 86, size: 15, flip: true, action: "shake" }, { cast: "knight", x: 32, y: 88, size: 15, action: "wiggle" }, { emoji: "🛏️", x: 32, y: 92, size: 16 }],
        lines: [
          { who: "king", text: "Wake up! Wake up! A dragon!" },
          { who: "knight", text: "Zzzzz..." },
          { text: "Sir Snorebert just rolled over." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(), { cast: "knight", x: 40, y: 88, size: 16, action: "shake" }, { emoji: "💤", x: 55, y: 60, size: 12, action: "grow" }, { emoji: "👑", x: 75, y: 40, size: 9, action: "spin" }],
        lines: [
          { text: "Then he did the loudest snore ever." },
          { who: "knight", text: "ZZZZZ-SNORT!" },
          { text: "The towers shook, and the king's crown flew off!" },
        ],
      },
      {
        scene: "castle",
        actors: [moon(20, 20), { cast: "dragon", x: 82, y: 22, size: 12, action: "float" }, { emoji: "💨", x: 66, y: 30, size: 8, action: "float" }],
        lines: [
          { who: "dragon", text: "Help! What a noise!" },
          { text: "The dragon flew far, far away." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(), { cast: "king", x: 65, y: 86, size: 15, flip: true, action: "hop" }, { emoji: "🏅", x: 50, y: 70, size: 8, action: "spin" }, { cast: "knight", x: 33, y: 88, size: 15, action: "wiggle" }],
        lines: [
          { who: "king", text: "Here is a medal, Sir Snorebert!" },
          { who: "knight", text: "Zzzzz..." },
          { text: "He was still asleep." },
        ],
      },
    ],
  },
  {
    id: "shy-dragon",
    title: "The Shy Dragon",
    emoji: "🐉",
    level: "Year 2",
    cast: {
      fizz: { name: "Fizz", emoji: "🐉", voice: "big", colour: "#16a34a", tap: "Oh! Hello!" },
      tomas: { name: "Tomas", emoji: "👦", voice: "small", colour: "#3a7be8", tap: "Hi, Fizz!" },
      gran: { name: "Gran", emoji: "👵", voice: "normal", colour: "#db2777", tap: "Oh my!" },
    },
    pages: [
      {
        scene: "snow",
        actors: [{ cast: "fizz", x: 50, y: 80, size: 26, action: "wiggle" }, { emoji: "💨", x: 64, y: 48, size: 8, action: "float" }, { emoji: "❄️", x: 18, y: 25, size: 6, action: "spin" }, { emoji: "❄️", x: 82, y: 20, size: 5, action: "spin" }],
        lines: [
          { text: "High on a snowy mountain lived Fizz, a very shy dragon." },
          { who: "fizz", text: "Oh dear! Someone is looking at me!" },
          { text: "Puff! Smoke came out of her ears." },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { emoji: "💨", x: 80, y: 16, size: 8, action: "float" }, { cast: "gran", x: 45, y: 86, size: 13, action: "shake" }, { emoji: "🏃", x: 65, y: 86, size: 11, action: "hop" }],
        lines: [
          { text: "The villagers saw the smoke, and they ran away." },
          { who: "gran", text: "A dragon! Quick, hide!" },
        ],
      },
      {
        scene: "villageSnow",
        actors: [{ cast: "tomas", x: 45, y: 86, size: 13, action: "shake" }, { emoji: "🪵", x: 62, y: 88, size: 8, action: "wiggle" }, { emoji: "❄️", x: 25, y: 22, size: 6, action: "spin" }, { emoji: "❄️", x: 75, y: 28, size: 6, action: "spin" }],
        lines: [
          { text: "One winter, the village ran out of firewood." },
          { who: "tomas", text: "Brrr! I am so cold!" },
        ],
      },
      {
        scene: "snow",
        actors: [{ cast: "fizz", x: 66, y: 78, size: 24, flip: true, action: "wiggle" }, { cast: "tomas", x: 28, y: 86, size: 11, action: "hop" }],
        lines: [
          { text: "Brave Tomas climbed all the way up the mountain." },
          { who: "tomas", text: "Please, Fizz, can you help us? We're freezing!" },
          { who: "fizz", text: "Me? Help you?" },
        ],
      },
      {
        scene: "village",
        actors: [{ cast: "fizz", x: 78, y: 40, size: 20, flip: true, action: "float" }, { emoji: "🔥", x: 50, y: 60, size: 9, action: "grow" }, { emoji: "☀️", x: 15, y: 20, size: 8, action: "spin" }],
        lines: [
          { text: "Fizz took a deep breath and blew warm air over the village." },
          { who: "fizz", text: "Whoooosh!" },
          { text: "The snow melted, and the houses grew warm." },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { cast: "gran", x: 30, y: 86, size: 13, action: "hop" }, { cast: "tomas", x: 45, y: 86, size: 11, action: "hop" }, { cast: "fizz", x: 72, y: 80, size: 22, flip: true, action: "wiggle" }, { emoji: "🎉", x: 55, y: 45, size: 8, action: "grow" }],
        lines: [
          { who: "gran", text: "Hooray for Fizz!" },
          { text: "Fizz blushed, but this time she didn't mind." },
          { who: "fizz", text: "Puff!" },
        ],
      },
    ],
  },
];

export function findInteractiveStory(id: string): InteractiveStory | null {
  return INTERACTIVE_STORIES.find((s) => s.id === id) ?? null;
}
