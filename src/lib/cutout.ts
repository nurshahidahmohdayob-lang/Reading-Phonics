"use client";

/* Lifting a child's drawing off the paper.

   A photo of a drawing is mostly paper. To turn it into a character that can
   move around a scene, the paper has to go — but only the paper *around* the
   drawing: the white of an eye, or a gap inside a house, must stay.

   So this floods inwards from the edges of the photo, clearing anything close
   in colour to the paper and stopping at the drawn lines. White areas fenced
   in by ink are never reached, and so survive. The edge is then softened a
   little (a photographed line is never a clean boundary) and the picture is
   cropped to what's left.

   All in the browser, on a canvas — nothing is uploaded anywhere. */

export type Cutout = {
  /** PNG with a transparent background. */
  dataUrl: string;
  width: number;
  height: number;
};

/** Longest side of the working image. Big enough to stay crisp on a board,
    small enough to flood-fill in a blink and to store comfortably. */
const MAX_SIDE = 1400;

function clamp(n: number, lo: number, hi: number) {
  return n < lo ? lo : n > hi ? hi : n;
}

/** The paper's colour, taken as the median of the photo's border pixels —
    robust to a shadow or a thumb in one corner. */
function paperColour(data: Uint8ClampedArray, w: number, h: number) {
  const reds: number[] = [];
  const greens: number[] = [];
  const blues: number[] = [];
  const step = Math.max(1, Math.floor(Math.min(w, h) / 120));
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    reds.push(data[i]);
    greens.push(data[i + 1]);
    blues.push(data[i + 2]);
  };
  for (let x = 0; x < w; x += step) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += step) {
    sample(0, y);
    sample(w - 1, y);
  }
  const mid = (xs: number[]) => xs.sort((a, b) => a - b)[xs.length >> 1] ?? 255;
  return { r: mid(reds), g: mid(greens), b: mid(blues) };
}

/** Squared colour distance — no square root needed to compare. */
function far(
  data: Uint8ClampedArray,
  i: number,
  p: { r: number; g: number; b: number },
) {
  const dr = data[i] - p.r;
  const dg = data[i + 1] - p.g;
  const db = data[i + 2] - p.b;
  return dr * dr + dg * dg + db * db;
}

async function loadBitmap(file: Blob): Promise<ImageBitmap> {
  // Respect the photo's own orientation, or a phone picture arrives sideways.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

export type CutoutOptions = {
  /** How close to the paper colour still counts as paper (0–100). Higher
      clears more, at the risk of eating pale crayon. */
  tolerance?: number;
};

/**
 * Turn a photo of a drawing into a cut-out with a transparent background.
 * Throws if the picture can't be read, or if it's all paper.
 */
export async function cutOutDrawing(
  file: Blob,
  opts: CutoutOptions = {},
): Promise<Cutout> {
  const tolerance = clamp(opts.tolerance ?? 34, 5, 100);
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("This browser can't read the picture.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const paper = paperColour(data, w, h);
  // Distances are squared, so square the tolerance too.
  const limit = tolerance * tolerance * 3;

  // Flood inwards from every edge pixel, clearing paper as it goes.
  const cleared = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const px = y * w + x;
    if (cleared[px]) return;
    if (far(data, px * 4, paper) > limit) return; // a drawn line — stop here
    cleared[px] = 1;
    queue[tail++] = px;
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (head < tail) {
    const px = queue[head++];
    const x = px % w;
    const y = (px / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Clear the paper, and soften the boundary: a pixel touching cleared paper
  // keeps only part of its opacity, so the edge doesn't look cut with scissors.
  for (let i = 0, px = 0; px < w * h; px++, i += 4) {
    if (cleared[px]) {
      data[i + 3] = 0;
      continue;
    }
    const x = px % w;
    const y = (px / w) | 0;
    let touching = 0;
    if (x > 0 && cleared[px - 1]) touching++;
    if (x < w - 1 && cleared[px + 1]) touching++;
    if (y > 0 && cleared[px - w]) touching++;
    if (y < h - 1 && cleared[px + w]) touching++;
    if (touching) data[i + 3] = touching >= 3 ? 90 : 190;
  }

  // Crop to the drawing itself, with a little breathing room.
  let top = h;
  let left = w;
  let right = -1;
  let bottom = -1;
  for (let px = 0; px < w * h; px++) {
    if (data[px * 4 + 3] < 24) continue;
    const x = px % w;
    const y = (px / w) | 0;
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  if (right < left || bottom < top) {
    throw new Error(
      "I couldn't find a drawing in that picture — try again with more light, and the whole drawing in frame.",
    );
  }
  ctx.putImageData(img, 0, 0);

  const pad = Math.round(Math.max(w, h) * 0.02);
  const cx = clamp(left - pad, 0, w - 1);
  const cy = clamp(top - pad, 0, h - 1);
  const cw = clamp(right - left + 1 + pad * 2, 1, w - cx);
  const chh = clamp(bottom - top + 1 + pad * 2, 1, h - cy);

  const out = document.createElement("canvas");
  out.width = cw;
  out.height = chh;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("This browser can't read the picture.");
  octx.drawImage(canvas, cx, cy, cw, chh, 0, 0, cw, chh);

  return { dataUrl: out.toDataURL("image/png"), width: cw, height: chh };
}
