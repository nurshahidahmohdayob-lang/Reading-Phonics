/* How a drawing can move on the 3D stage, shared by the stage's own
   buttons and the phone that sends drawings to it. Each moves like the real
   thing (see components/tabs/Stage3D). */

import type { Move3D } from "@/components/tabs/Stage3D";

export const MOVES: { id: Move3D; label: string }[] = [
  { id: "walk", label: "🚶 Walk" },
  { id: "swim", label: "🐟 Swim" },
  { id: "jelly", label: "🪼 Jellyfish" },
  { id: "fly", label: "🐦 Fly" },
  { id: "hop", label: "🐸 Hop" },
  { id: "slither", label: "🐍 Slither" },
  { id: "float", label: "🚀 Float" },
];
export const MOVE_IDS = new Set<string>(MOVES.map((m) => m.id));

/** How big a drawing can be made, and each step of Smaller / Bigger. */
export const MIN_SCALE = 0.3;
export const MAX_SCALE = 2.5;
export const SCALE_STEP = 0.15;
