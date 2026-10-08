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

export type Scenery = "road" | "castle" | "snow" | "village" | "villageSnow" | "farm" | "sea" | "night";

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
    id: "big-pig",
    title: "Big Pig in the Mud",
    cover: "pig",
    level: "Starter",
    cast: {
      pig: { name: "Pig", art: "pig", voice: "big", colour: "#db2777", tap: "Oink, oink!" },
      duck: { name: "Duck", art: "duck", voice: "small", colour: "#b45309", tap: "Quack, quack!" },
    },
    pages: [
      {
        scene: "farm",
        actors: [sun(), cloud(30, 18), { cast: "pig", x: 38, y: 94, size: 26, action: "wiggle" }, { cast: "duck", x: 62, y: 94, size: 11, action: "hop" }],
        lines: [
          { text: "A big pig sat in the hot sun." },
          { who: "pig", text: "I am so hot!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(), { art: "mud", x: 64, y: 95, size: 30, action: "wiggle" }, { cast: "pig", x: 30, y: 94, size: 24, action: "hop" }],
        lines: [
          { text: "Then the pig saw a big mud pit." },
          { who: "pig", text: "Mud! I can dig in it!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(), { cast: "pig", x: 46, y: 90, size: 24, action: "shake" }, { art: "mud", x: 46, y: 95, size: 36 }, { cast: "duck", x: 82, y: 94, size: 11, flip: true, action: "shake" }],
        lines: [
          { text: "In went the pig. Splish, splash, splosh!" },
          { who: "duck", text: "Yuck! You are a mess!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(), { art: "tub", x: 44, y: 94, size: 32, action: "wiggle" }, { art: "bubbles", x: 46, y: 58, size: 8, action: "float" }, { cast: "duck", x: 80, y: 94, size: 11, flip: true, action: "hop" }],
        lines: [
          { text: "The duck got a tub full of suds." },
          { who: "duck", text: "Hop in, Pig!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(), { cast: "pig", x: 44, y: 74, size: 24, action: "wiggle" }, { art: "tub", x: 44, y: 94, size: 32 }, { art: "bubbles", x: 26, y: 58, size: 9, action: "float" }, { art: "bubbles", x: 64, y: 52, size: 7, action: "float" }, { cast: "duck", x: 82, y: 94, size: 11, flip: true, action: "hop" }],
        lines: [
          { text: "Rub, rub, rub! The pig got wet, and the mud came off." },
          { who: "pig", text: "Bubbles! I like this!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(), { art: "mud", x: 62, y: 95, size: 36 }, { cast: "pig", x: 64, y: 90, size: 24, action: "hop" }, { cast: "duck", x: 22, y: 94, size: 11, action: "shake" }],
        lines: [
          { text: "But then the pig ran back to the mud!" },
          { who: "duck", text: "Oh no, Pig! Not again!" },
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
    id: "pip-windy-day",
    title: "Pip and the Windy Day",
    cover: "puffin",
    level: "Year 1",
    cast: {
      pip: { name: "Pip", art: "puffin", voice: "small", colour: "#ea580c", tap: "Squawk! Hello!" },
      clem: { name: "Clem", art: "crab", voice: "normal", colour: "#dc2626", tap: "Snip, snap!" },
    },
    pages: [
      {
        scene: "sea",
        actors: [sun(), cloud(70, 18), { art: "rock", x: 78, y: 70, size: 18 }, { cast: "pip", x: 36, y: 94, size: 11, action: "hop" }, { art: "hat", x: 38.6, y: 70, size: 5.5, action: "wiggle" }],
        lines: [
          { text: "Pip the puffin had a brand-new red hat." },
          { who: "pip", text: "Look at my lovely hat!" },
        ],
      },
      {
        scene: "sea",
        actors: [cloud(16, 18), { art: "wind", x: 34, y: 44, size: 24, action: "float" }, { art: "hat", x: 68, y: 30, size: 6, action: "spin" }, { cast: "pip", x: 28, y: 94, size: 11, action: "shake" }],
        lines: [
          { text: "Whoosh! A gust of wind blew the hat right off his head." },
          { who: "pip", text: "Come back, hat!" },
        ],
      },
      {
        scene: "sea",
        actors: [sun(14, 24), { art: "rock", x: 72, y: 72, size: 20 }, { cast: "clem", x: 72, y: 60, size: 10, action: "hop" }, { art: "hat", x: 78, y: 45, size: 5 }, { cast: "pip", x: 24, y: 94, size: 11, action: "hop" }],
        lines: [
          { text: "The hat landed on a rock out at sea, and a crab called Clem picked it up." },
          { who: "clem", text: "Is this your hat?" },
        ],
      },
      {
        scene: "sea",
        actors: [{ art: "rock", x: 72, y: 72, size: 20 }, { cast: "clem", x: 72, y: 60, size: 10, action: "shake" }, { art: "hat", x: 78, y: 45, size: 5 }, { art: "waves", x: 46, y: 79, size: 44, action: "wiggle" }, { cast: "pip", x: 16, y: 94, size: 11, action: "shake" }],
        lines: [
          { text: "Clem held the hat up high, but the waves were far too big." },
          { who: "clem", text: "I can't reach you!" },
        ],
      },
      {
        scene: "sea",
        actors: [sun(), { art: "waves", x: 44, y: 79, size: 52 }, { cast: "pip", x: 46, y: 46, size: 11, action: "float" }, { art: "rock", x: 80, y: 72, size: 18 }, { cast: "clem", x: 80, y: 61, size: 9, action: "hop" }, { art: "hat", x: 86, y: 46, size: 5 }],
        lines: [
          { text: "So Pip took a deep breath, flapped his wings and flew over the waves." },
          { who: "pip", text: "I can do it!" },
        ],
      },
      {
        scene: "sea",
        actors: [sun(), cloud(22, 18), { cast: "pip", x: 36, y: 94, size: 11, action: "hop" }, { art: "hat", x: 38.6, y: 70, size: 5.5 }, { cast: "clem", x: 62, y: 94, size: 11, action: "hop" }],
        lines: [
          { text: "Pip put his hat back on and thanked his new friend." },
          { who: "pip", text: "Thank you, Clem!" },
          { who: "clem", text: "Hold on tight next time!" },
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
  {
    id: "robot-dance",
    title: "The Robot Who Could Not Dance",
    cover: "robot",
    level: "Year 3",
    cast: {
      bolt: { name: "Bolt", art: "robot", voice: "big", colour: "#0e7490", tap: "Beep, boop!" },
      maya: { name: "Maya", art: "maya", voice: "small", colour: "#b45309", tap: "Let's dance!" },
      tomas: { name: "Tomas", art: "tomas", voice: "small", colour: "#3a7be8", tap: "Go, Bolt!" },
      gran: { name: "Gran", art: "gran", voice: "normal", colour: "#db2777", tap: "Oh my!" },
    },
    pages: [
      {
        scene: "village",
        actors: [sun(), cloud(40, 18), { cast: "bolt", x: 46, y: 95, size: 13, action: "hop" }],
        lines: [
          { text: "Bolt was a shiny robot who lived at the very end of Pepper Lane." },
          { who: "bolt", text: "Beep! Good morning, everybody!" },
        ],
      },
      {
        scene: "village",
        actors: [sun(14, 24), { cast: "tomas", x: 26, y: 95, size: 11, action: "hop" }, { art: "notes", x: 38, y: 62, size: 7, action: "float" }, { cast: "bolt", x: 60, y: 95, size: 13, action: "shake" }],
        lines: [
          { text: "Every evening, he watched the children dance in the square, but whenever he tried, he clanked and wobbled." },
          { who: "bolt", text: "Clank! Wobble! Oops!" },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { cast: "maya", x: 30, y: 95, size: 11, action: "hop" }, { art: "radio", x: 48, y: 95, size: 11, action: "wiggle" }, { art: "notes", x: 50, y: 64, size: 7, action: "float" }, { cast: "bolt", x: 74, y: 95, size: 13, flip: true, action: "wiggle" }],
        lines: [
          { text: "One afternoon, a girl called Maya switched on her old radio." },
          { who: "maya", text: "Dancing isn't about being perfect. Just listen to the music!" },
        ],
      },
      {
        scene: "village",
        actors: [sun(14, 24), { art: "radio", x: 20, y: 95, size: 10 }, { art: "notes", x: 34, y: 58, size: 7, action: "float" }, { cast: "bolt", x: 52, y: 95, size: 14, action: "wiggle" }, { art: "notes", x: 68, y: 54, size: 8, action: "float" }],
        lines: [
          { text: "Bolt closed his eyes and listened. Slowly, his metal feet began to tap." },
          { who: "bolt", text: "Tap, tap... beep!" },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { cast: "maya", x: 26, y: 95, size: 11, action: "hop" }, { cast: "bolt", x: 54, y: 95, size: 14, action: "spin" }, { art: "notes", x: 72, y: 52, size: 8, action: "float" }, { art: "radio", x: 82, y: 95, size: 10 }],
        lines: [
          { text: "Soon he was spinning, twirling and flashing all of his lights." },
          { who: "maya", text: "You're doing it, Bolt!" },
        ],
      },
      {
        scene: "village",
        actors: [sun(), { art: "bunting", x: 50, y: 34, size: 62 }, { cast: "gran", x: 16, y: 95, size: 12, action: "hop" }, { cast: "bolt", x: 40, y: 95, size: 13, action: "spin" }, { cast: "maya", x: 60, y: 95, size: 11, action: "hop" }, { cast: "tomas", x: 80, y: 95, size: 11, action: "hop" }, { art: "notes", x: 50, y: 52, size: 7, action: "float" }],
        lines: [
          { text: "At the summer fair, Bolt and Maya danced together, and the whole village cheered." },
          { who: "gran", text: "Hooray for Bolt!" },
        ],
      },
    ],
  },
  {
    id: "night-stars-fell",
    title: "The Night the Stars Fell",
    cover: "star",
    level: "Year 4",
    cast: {
      leo: { name: "Leo", art: "leo", voice: "small", colour: "#2563eb", tap: "Wow, look at the stars!" },
      owl: { name: "Owl", art: "owl", voice: "big", colour: "#92400e", tap: "Twit-twoo!" },
      star: { name: "Little Star", art: "star", voice: "small", colour: "#ca8a04", tap: "Twinkle, twinkle!" },
    },
    pages: [
      {
        scene: "night",
        actors: [moon(), { art: "tree", x: 84, y: 92, size: 18, action: "wiggle" }, { cast: "leo", x: 36, y: 95, size: 11, action: "wiggle" }],
        lines: [
          { text: "On the clearest night of the year, Leo crept into the garden to count the stars." },
          { who: "leo", text: "One hundred and one, one hundred and two..." },
        ],
      },
      {
        scene: "night",
        actors: [moon(14, 24), { art: "tree", x: 86, y: 92, size: 18 }, { cast: "star", x: 58, y: 92, size: 8, action: "grow" }, { cast: "leo", x: 32, y: 95, size: 11, action: "shake" }],
        lines: [
          { text: "Suddenly, a little star tumbled out of the sky and landed in the grass with a soft fizz." },
          { who: "leo", text: "Whoa!" },
        ],
      },
      {
        scene: "night",
        actors: [moon(14, 24), { art: "tree", x: 76, y: 94, size: 24 }, { cast: "owl", x: 76, y: 50, size: 8, action: "hop" }, { cast: "star", x: 50, y: 93, size: 7, action: "grow" }, { cast: "leo", x: 28, y: 95, size: 11, action: "hop" }],
        lines: [
          { text: "Its light was already fading. High in the oak tree, a wise old owl blinked." },
          { who: "owl", text: "A fallen star must go home before sunrise, or its light will go out for ever." },
        ],
      },
      {
        scene: "night",
        actors: [moon(), { cast: "leo", x: 58, y: 86, size: 11, action: "hop" }, { cast: "star", x: 60, y: 79, size: 5, action: "grow" }],
        lines: [
          { text: "Leo carried the star to the top of the tallest hill, holding it as gently as an egg." },
          { who: "leo", text: "Don't worry, little star. I've got you." },
        ],
      },
      {
        scene: "night",
        actors: [moon(82, 26), { cast: "owl", x: 60, y: 44, size: 10, action: "float" }, { cast: "star", x: 62, y: 50, size: 5, action: "grow" }, { cast: "leo", x: 30, y: 95, size: 11, action: "hop" }],
        lines: [
          { text: "He lifted it high above his head. The owl caught it in her claws and soared towards the moon." },
          { who: "owl", text: "Hold on tight, little star!" },
        ],
      },
      {
        scene: "farm",
        actors: [sun(14, 28), { cast: "star", x: 70, y: 26, size: 4, action: "spin" }, { cast: "leo", x: 40, y: 94, size: 11, action: "hop" }],
        lines: [
          { text: "As the sun rose, Leo spotted one extra twinkle winking at him from the sky." },
          { who: "leo", text: "Goodnight, little star." },
        ],
      },
    ],
  },
];

export function findInteractiveStory(id: string): InteractiveStory | null {
  return INTERACTIVE_STORIES.find((s) => s.id === id) ?? null;
}
