/* Interactive stories: little illustrated plays, in the spirit of Starfall's
   "I'm Reading" plays. Each page is a scene (a painted background with
   characters and props placed on it) and a few lines: the narrator's, and
   the characters' own, each spoken in that character's voice while they
   bounce. Children tap characters and props to make them move and talk, and
   tap words to hear them. Played by components/InteractiveStory.

   Positions are percentages of the scene: x across from the left, y down
   from the top to the character's feet. Size is a percentage of the scene's
   width. */

import type { ArtId } from "@/components/storyArt";

export type Voice = "narrator" | "small" | "big" | "normal";

export type Action = "hop" | "wiggle" | "spin" | "shake" | "drive" | "grow" | "float";

export type Actor = {
  /** Who it is: a character in the cast, or a prop (a drawing). */
  cast?: string;
  /** The drawing: a prop's, or a cast member in a different pose. */
  art?: ArtId;
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
  art: ArtId;
  voice: Voice;
  /** Name badge colour. */
  colour: string;
  /** What they say when tapped. */
  tap: string;
};

export type InteractiveStory = {
  id: string;
  title: string;
  /** The drawing on the story's cover and in the list. */
  cover: ArtId;
  level: string;
  cast: Record<string, CastMember>;
  pages: Page[];
};

const sun = (x = 86, y = 24): Actor => ({ art: "sun", x, y, size: 11, action: "spin" });
const cloud = (x: number, y: number): Actor => ({ art: "cloud", x, y, size: 14, action: "float" });
const tree = (x: number, y = 74): Actor => ({ art: "tree", x, y, size: 13, action: "wiggle" });
const moon = (x = 85, y = 24): Actor => ({ art: "moon", x, y, size: 10, action: "spin" });
const snow = (x: number, y: number, size = 4): Actor => ({ art: "snowflake", x, y, size, action: "spin" });

export const INTERACTIVE_STORIES: InteractiveStory[] = [
  {
    id: "ten-hens",
    title: "Ten Hens in a Van",
    cover: "van",
    level: "Starter",
    cast: {
      hen: { name: "Hen", art: "hen", voice: "small", colour: "#E8433A", tap: "Cluck, cluck!" },
      fox: { name: "Fox", art: "fox", voice: "big", colour: "#E07A1F", tap: "Yum, yum!" },
    },
    pages: [
      {
        scene: "road",
        actors: [sun(), cloud(22, 20), tree(8), { art: "van", x: 48, y: 93, size: 36, action: "drive" }, { cast: "hen", x: 78, y: 93, size: 11, action: "hop" }, { cast: "hen", x: 89, y: 94, size: 9, action: "hop" }],
        lines: [
          { text: "Ten hens have a red van." },
          { who: "hen", text: "Beep, beep! We like our van!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(30, 18), tree(93), { art: "van", x: 38, y: 93, size: 36, action: "drive" }, { cast: "fox", x: 78, y: 93, size: 16, flip: true, action: "shake" }],
        lines: [
          { text: "A fox sees the van." },
          { who: "fox", text: "Yum! Let me in, hens!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), tree(8), { art: "van", x: 50, y: 93, size: 36, action: "drive" }, { cast: "hen", x: 23, y: 93, size: 10, action: "hop" }, { cast: "fox", x: 80, y: 93, size: 15, flip: true, action: "shake" }],
        lines: [
          { text: "The hens let the fox get in." },
          { who: "hen", text: "Come in, Fox!" },
          { who: "fox", text: "He, he, he!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(14, 18), { art: "van", x: 34, y: 93, size: 36, action: "shake" }, { cast: "hen", x: 64, y: 93, size: 10, action: "hop" }, { cast: "hen", x: 73, y: 94, size: 9, action: "hop" }, { cast: "fox", x: 87, y: 93, size: 14, flip: true, action: "shake" }],
        lines: [
          { text: "Then the ten hens peck the fox." },
          { who: "hen", text: "Peck, peck, peck!" },
          { who: "fox", text: "Ow! Ow! Ow!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), { art: "van", x: 30, y: 93, size: 36, action: "drive" }, { cast: "fox", x: 82, y: 93, size: 14, action: "hop" }, { art: "puff", x: 68, y: 94, size: 9, action: "float" }],
        lines: [
          { text: "The fox jumps out and runs off." },
          { who: "fox", text: "Help! Help!" },
          { who: "hen", text: "Bye, bye, Fox!" },
        ],
      },
      {
        scene: "road",
        actors: [sun(), cloud(25, 18), tree(92), { art: "van", x: 50, y: 93, size: 36, action: "drive" }, { cast: "hen", x: 78, y: 93, size: 11, action: "hop" }, { art: "trophy", x: 17, y: 93, size: 8, action: "spin" }],
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
    cover: "knight",
    level: "Year 1",
    cast: {
      knight: { name: "Sir Snorebert", art: "knight", voice: "normal", colour: "#3a7be8", tap: "Zzzzz..." },
      king: { name: "The King", art: "king", voice: "big", colour: "#8b5cf6", tap: "I am the king!" },
      dragon: { name: "Dragon", art: "dragon", voice: "big", colour: "#16a34a", tap: "Roar!" },
    },
    pages: [
      {
        scene: "castle",
        actors: [moon(), { cast: "knight", x: 35, y: 94, size: 14, action: "wiggle" }, { art: "zzz", x: 44, y: 58, size: 6, action: "grow" }, { cast: "king", x: 65, y: 94, size: 14, flip: true, action: "hop" }],
        lines: [
          { text: "Sir Snorebert was a brave knight, but he was always sleepy." },
          { who: "king", text: "Sir Snorebert, are you ready?" },
          { who: "knight", text: "Zzzzz..." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(15, 24), { cast: "dragon", x: 66, y: 46, size: 30, action: "float" }, { art: "goldSack", x: 26, y: 94, size: 10, action: "hop" }],
        lines: [
          { text: "One night, a dragon flew over the castle." },
          { who: "dragon", text: "Roar! I want your gold!" },
        ],
      },
      {
        scene: "castle",
        actors: [moon(), { cast: "dragon", x: 84, y: 36, size: 18, action: "float" }, { cast: "king", x: 70, y: 94, size: 14, flip: true, action: "shake" }, { cast: "knight", art: "knightBed", x: 32, y: 95, size: 30, action: "wiggle" }],
        lines: [
          { who: "king", text: "Wake up! Wake up! A dragon!" },
          { who: "knight", text: "Zzzzz..." },
          { text: "Sir Snorebert just rolled over." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(14, 24), { cast: "knight", art: "knightBed", x: 32, y: 95, size: 30, action: "shake" }, { art: "zzz", x: 56, y: 60, size: 13, action: "grow" }, { cast: "king", x: 80, y: 94, size: 14, flip: true, action: "shake" }, { art: "crown", x: 82, y: 40, size: 8, action: "spin" }],
        lines: [
          { text: "Then he did the loudest snore ever." },
          { who: "knight", text: "ZZZZZ-SNORT!" },
          { text: "The towers shook, and the king's crown flew off!" },
        ],
      },
      {
        scene: "castle",
        actors: [moon(20, 24), { cast: "dragon", x: 84, y: 30, size: 12, action: "float" }, { art: "puff", x: 72, y: 34, size: 8, action: "float" }],
        lines: [
          { who: "dragon", text: "Help! What a noise!" },
          { text: "The dragon flew far, far away." },
        ],
      },
      {
        scene: "castle",
        actors: [moon(), { cast: "king", x: 66, y: 94, size: 14, flip: true, action: "hop" }, { art: "medal", x: 54, y: 78, size: 5, action: "spin" }, { cast: "knight", x: 33, y: 94, size: 14, action: "wiggle" }, { art: "zzz", x: 42, y: 58, size: 7, action: "grow" }],
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
    cover: "fizz",
    level: "Year 2",
    cast: {
      fizz: { name: "Fizz", art: "fizz", voice: "big", colour: "#16a34a", tap: "Oh! Hello!" },
      tomas: { name: "Tomas", art: "tomas", voice: "small", colour: "#3a7be8", tap: "Hi, Fizz!" },
      gran: { name: "Gran", art: "gran", voice: "normal", colour: "#db2777", tap: "Oh my!" },
    },
    pages: [
      {
        scene: "snow",
        actors: [{ cast: "fizz", x: 50, y: 92, size: 26, action: "wiggle" }, { art: "puff", x: 63, y: 54, size: 8, action: "float" }, { art: "puff", x: 43, y: 55, size: 7, action: "float" }, snow(18, 25, 5), snow(82, 20)],
        lines: [
          { text: "High on a snowy mountain lived Fizz, a very shy dragon." },
          { who: "fizz", text: "Oh dear! Someone is looking at me!" },
          { text: "Puff! Smoke came out of her ears." },
        ],
      },
      {
        scene: "village",
        actors: [sun(14, 24), { art: "smoke", x: 86, y: 22, size: 6, action: "float" }, { cast: "gran", x: 38, y: 95, size: 14, action: "shake" }, { art: "villager", x: 60, y: 95, size: 13, flip: true, action: "hop" }],
        lines: [
          { text: "The villagers saw the smoke, and they ran away." },
          { who: "gran", text: "A dragon! Quick, hide!" },
        ],
      },
      {
        scene: "villageSnow",
        actors: [{ cast: "tomas", x: 42, y: 94, size: 12, action: "shake" }, { art: "woodbox", x: 62, y: 94, size: 12, action: "wiggle" }, snow(25, 22, 5), snow(75, 28), snow(55, 15, 3)],
        lines: [
          { text: "One winter, the village ran out of firewood." },
          { who: "tomas", text: "Brrr! I am so cold!" },
        ],
      },
      {
        scene: "snow",
        actors: [{ cast: "fizz", x: 66, y: 92, size: 24, flip: true, action: "wiggle" }, { cast: "tomas", x: 28, y: 94, size: 11, action: "hop" }, snow(12, 20), snow(88, 16, 3)],
        lines: [
          { text: "Brave Tomas climbed all the way up the mountain." },
          { who: "tomas", text: "Please, Fizz, can you help us? We're freezing!" },
          { who: "fizz", text: "Me? Help you?" },
        ],
      },
      {
        scene: "village",
        actors: [sun(14, 24), { cast: "fizz", x: 78, y: 56, size: 18, flip: true, action: "float" }, { art: "warmAir", x: 46, y: 64, size: 24, action: "grow" }],
        lines: [
          { text: "Fizz took a deep breath and blew warm air over the village." },
          { who: "fizz", text: "Whoooosh!" },
          { text: "The snow melted, and the houses grew warm." },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { art: "bunting", x: 50, y: 34, size: 62 }, { cast: "gran", x: 28, y: 94, size: 12, action: "hop" }, { cast: "tomas", x: 42, y: 94, size: 11, action: "hop" }, { cast: "fizz", x: 70, y: 92, size: 22, flip: true, action: "wiggle" }],
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
