"use client";

/* Lifting a child's drawing off the paper.

   A photo of a drawing is mostly paper. To turn it into a character that can
   move around a scene, the paper has to go — but only the paper *around* the
   drawing: the white of an eye, or a gap inside a house, must stay.

   Paper is never one colour in a photograph. A hand casts a shadow across the
   page, a window lights one corner, the desk shows past the edge of the sheet.
   So the page's brightness is judged locally — what the paper looks like just
   there — and a pixel counts as drawn if it is darker than its own
   surroundings or clearly coloured. Everything else is flooded away inwards
   from the edges of the photo, which is what saves white fenced in by ink:
   the flood cannot reach it.

   What survives is still not always the drawing: a table edge, the line of
   the page, a smudge in the corner. Those go too, by keeping only the
   substantial pieces and dropping any that run off the side of the photo.

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

/* The paper's brightness across the photo, so a shadow doesn't read as ink.
   The page is divided into blocks; each block's brightness is taken high
   enough up its own range (the 80th percentile) that the drawing in it
   doesn't drag the number down, and the values are then blended between
   block centres so the estimate slides smoothly across the page. */
const PAPER_BLOCK = 48;

function brightness(data: Uint8ClampedArray, i: number) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function paperMap(data: Uint8ClampedArray, w: number, h: number) {
  const bx = Math.max(1, Math.ceil(w / PAPER_BLOCK));
  const by = Math.max(1, Math.ceil(h / PAPER_BLOCK));
  const coarse = new Float32Array(bx * by);
  const hist = new Uint32Array(256);

  for (let j = 0; j < by; j++) {
    for (let i = 0; i < bx; i++) {
      hist.fill(0);
      let n = 0;
      const y1 = Math.min(h, (j + 1) * PAPER_BLOCK);
      const x1 = Math.min(w, (i + 1) * PAPER_BLOCK);
      for (let y = j * PAPER_BLOCK; y < y1; y++) {
        for (let x = i * PAPER_BLOCK; x < x1; x++) {
          hist[brightness(data, (y * w + x) * 4) | 0]++;
          n++;
        }
      }
      // Walk the histogram up to the 80th percentile.
      let seen = 0;
      let value = 255;
      const want = n * 0.8;
      for (let v = 0; v < 256; v++) {
        seen += hist[v];
        if (seen >= want) {
          value = v;
          break;
        }
      }
      coarse[j * bx + i] = value;
    }
  }

  /** The paper's brightness at one pixel, blended between block centres. */
  return (x: number, y: number) => {
    const fx = clamp(x / PAPER_BLOCK - 0.5, 0, bx - 1);
    const fy = clamp(y / PAPER_BLOCK - 0.5, 0, by - 1);
    const i0 = Math.floor(fx);
    const j0 = Math.floor(fy);
    const i1 = Math.min(bx - 1, i0 + 1);
    const j1 = Math.min(by - 1, j0 + 1);
    const tx = fx - i0;
    const ty = fy - j0;
    const top =
      coarse[j0 * bx + i0] * (1 - tx) + coarse[j0 * bx + i1] * tx;
    const bottom =
      coarse[j1 * bx + i0] * (1 - tx) + coarse[j1 * bx + i1] * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

/** Everything the flood left behind, piece by piece: what is one connected
    lump of drawing, how big it is, and whether it runs off the photo. */
function keepMainPieces(kept: Uint8Array, w: number, h: number) {
  const label = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  const sizes: number[] = [0];
  const offEdge: boolean[] = [false];
  let current = 0;

  for (let start = 0; start < w * h; start++) {
    if (!kept[start] || label[start]) continue;
    current++;
    let top = 0;
    let size = 0;
    let touches = false;
    stack[top++] = start;
    label[start] = current;
    while (top > 0) {
      const px = stack[--top];
      const x = px % w;
      const y = (px / w) | 0;
      size++;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touches = true;
      if (x > 0 && kept[px - 1] && !label[px - 1]) {
        label[px - 1] = current;
        stack[top++] = px - 1;
      }
      if (x < w - 1 && kept[px + 1] && !label[px + 1]) {
        label[px + 1] = current;
        stack[top++] = px + 1;
      }
      if (y > 0 && kept[px - w] && !label[px - w]) {
        label[px - w] = current;
        stack[top++] = px - w;
      }
      if (y < h - 1 && kept[px + w] && !label[px + w]) {
        label[px + w] = current;
        stack[top++] = px + w;
      }
    }
    sizes.push(size);
    offEdge.push(touches);
  }
  if (current === 0) return;

  // A grainy photo can leave tens of thousands of specks, so the biggest is
  // found by walking the list: spreading it into Math.max would overflow.
  let biggest = 0;
  for (let i = 1; i <= current; i++) if (sizes[i] > biggest) biggest = sizes[i];

  const good = new Uint8Array(current + 1);
  let keeping = 0;
  for (let i = 1; i <= current; i++) {
    // A scrap of the room, or a line running off the picture: not the drawing.
    const substantial = sizes[i] >= biggest * 0.06;
    const runsOff = offEdge[i] && sizes[i] < biggest * 0.4;
    good[i] = substantial && !runsOff ? 1 : 0;
    if (good[i]) keeping += sizes[i];
  }
  // Never tidy away the whole drawing: if this would leave nothing worth
  // showing, hand back what the flood left and let it be a rough cut-out.
  if (keeping === 0) return;

  for (let px = 0; px < w * h; px++) {
    if (kept[px] && !good[label[px]]) kept[px] = 0;
  }
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
  /** How far below its own patch of paper a pixel must fall before it counts
      as drawn, as a percentage. Higher keeps more of a pale pencil line, at
      the risk of keeping shadow with it. */
  tolerance?: number;
};

/** Which pixels are paper, for a photo already in memory: 1 means clear it.
    Pure arithmetic over the pixels — no canvas, so it can be tested on its
    own. */
export function paperMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance = 14,
): Uint8Array {
  const paperAt = paperMap(data, w, h);
  // How much darker than its own patch of paper a pixel must be before it
  // counts as drawn, and how much colour makes it drawn whatever its darkness.
  const darkness = 1 - tolerance / 100;
  const COLOURED = 38;

  const drawn = (px: number) => {
    const i = px * 4;
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    if (max - min > COLOURED) return true; // crayon, felt tip, paint
    return brightness(data, i) < darkness * paperAt(px % w, (px / w) | 0);
  };

  // Flood inwards from every edge pixel, clearing paper as it goes.
  const cleared = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const px = y * w + x;
    if (cleared[px]) return;
    if (drawn(px)) return; // a drawn line — stop here
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

  // What's left is the drawing — and anything else that wasn't paper. Drop
  // the pieces that are too small, or that run off the side of the photo.
  const kept = new Uint8Array(w * h);
  for (let px = 0; px < w * h; px++) kept[px] = cleared[px] ? 0 : 1;
  keepMainPieces(kept, w, h);
  for (let px = 0; px < w * h; px++) if (!kept[px]) cleared[px] = 1;
  return cleared;
}

/**
 * Turn a photo of a drawing into a cut-out with a transparent background.
 * Throws if the picture can't be read, or if it's all paper.
 */
export async function cutOutDrawing(
  file: Blob,
  opts: CutoutOptions = {},
): Promise<Cutout> {
  const tolerance = clamp(opts.tolerance ?? 14, 2, 60);
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

  // A faint pencil drawing can sit so close to the paper that the first pass
  // clears the lot. Rather than telling the teacher to photograph it again,
  // look harder before giving up.
  let cleared = paperMask(data, w, h, tolerance);
  let survivors = 0;
  for (let px = 0; px < w * h; px++) if (!cleared[px]) survivors++;
  if (survivors < w * h * 0.001) {
    cleared = paperMask(data, w, h, Math.max(4, tolerance / 2));
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

/** Shrink a cut-out for sending over the network: a photo from a phone can
    come back as a megabyte and a half of PNG, which is more than the pairing
    channel should carry. WebP keeps the transparency at a fraction of the
    weight. A busy drawing can still be too heavy at full size, so if quality
    alone won't do it the picture is made smaller and tried again — it always
    goes, rather than failing on the phone with nothing the child can do. */
export async function shrinkCutout(
  dataUrl: string,
  maxSide = 1000,
  maxBytes = 550_000,
): Promise<Cutout> {
  const res = await fetch(dataUrl);
  const bitmap = await createImageBitmap(await res.blob());
  const original = { width: bitmap.width, height: bitmap.height };

  let best: Cutout | null = null;

  // Full size first, then smaller, so a drawing only loses detail if it has to.
  for (const side of [maxSide, 820, 660, 520, 400]) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(bitmap, 0, 0, w, h);

    for (const quality of [0.88, 0.75, 0.6, 0.45, 0.35]) {
      const webp = canvas.toDataURL("image/webp", quality);
      // A browser too old for WebP hands back a PNG. Keep the smallest one
      // it has given us and carry on shrinking — that PNG is what will go.
      const png = !webp.startsWith("data:image/webp");
      const candidate = { dataUrl: webp, width: w, height: h };
      if (!best || candidate.dataUrl.length < best.dataUrl.length) {
        best = candidate;
      }
      if (candidate.dataUrl.length <= maxBytes) {
        bitmap.close?.();
        return candidate;
      }
      if (png) break; // quality does nothing for PNG — only a smaller size will
    }
  }

  bitmap.close?.();
  // Every size tried and still heavy: send the smallest we made rather than
  // the original, which was heavier still.
  return best ?? { dataUrl, width: original.width, height: original.height };
}
