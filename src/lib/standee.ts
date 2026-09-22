"use client";

/* Turning a cut-out drawing into a solid object.

   A flat picture on a plane still looks like a sticker when it turns. What
   reads as real is a standee: the drawing's own outline, cut out of card and
   given thickness, so the edge is visible as it rotates and it casts a proper
   shadow.

   So: read the transparency of the cut-out, find the outline of the drawing
   inside it, simplify that outline to a manageable number of points, and
   extrude it. The drawing is painted on the front and back faces; the sides
   are the pale edge of the card. */

import * as THREE from "three";

export type Standee = {
  geometry: THREE.ExtrudeGeometry;
  texture: THREE.Texture;
  /** width ÷ height, so the caller can place it sensibly. */
  aspect: number;
};

/** Grid used to find the outline. Small keeps the tracing quick; the texture
    itself stays full resolution, so detail isn't lost. */
const MASK_SIDE = 180;
/** Alpha above this counts as "part of the drawing". */
const SOLID = 40;

type Mask = { bits: Uint8Array; w: number; h: number };

async function alphaMask(dataUrl: string): Promise<Mask & { aspect: number }> {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const scale = Math.min(1, MASK_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(8, Math.round(bitmap.width * scale));
  const h = Math.max(8, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const aspect = bitmap.width / bitmap.height;
  bitmap.close?.();

  const { data } = ctx.getImageData(0, 0, w, h);
  const bits = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) bits[i] = data[i * 4 + 3] >= SOLID ? 1 : 0;
  return { bits, w, h, aspect };
}

/** The biggest connected blob — the drawing itself, not a stray speck. */
function largestBlob({ bits, w, h }: Mask): Uint8Array {
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let best: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!bits[start] || seen[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    const blob: number[] = [];
    while (head < tail) {
      const px = queue[head++];
      blob.push(px);
      const x = px % w;
      const y = (px / w) | 0;
      const push = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const n = ny * w + nx;
        if (bits[n] && !seen[n]) {
          seen[n] = 1;
          queue[tail++] = n;
        }
      };
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    if (blob.length > best.length) best = blob;
  }
  const out = new Uint8Array(w * h);
  for (const px of best) out[px] = 1;
  return out;
}

/** Walk the edge of the blob (Moore-neighbour tracing) to get its outline. */
function traceOutline(bits: Uint8Array, w: number, h: number): [number, number][] {
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && bits[y * w + x] === 1;

  let startX = -1;
  let startY = -1;
  for (let y = 0; y < h && startY < 0; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) {
        startX = x;
        startY = y;
        break;
      }
    }
  }
  if (startY < 0) return [];

  // Clockwise neighbours, starting from "left".
  const around = [
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
  ];
  const points: [number, number][] = [];
  let cx = startX;
  let cy = startY;
  /* The direction we arrived from. We found this pixel scanning rows left to
     right, so treat it as entered heading east. */
  let dir = 4;
  const limit = w * h * 4; // tracing can't sensibly take longer than this
  for (let step = 0; step < limit; step++) {
    points.push([cx, cy]);
    let moved = false;
    for (let i = 0; i < 8; i++) {
      /* Carry on clockwise from just past where we came in. Starting anywhere
         else lets the walk double back and close after three pixels. */
      const d = (dir + 5 + i) % 8;
      const nx = cx + around[d][0];
      const ny = cy + around[d][1];
      if (solid(nx, ny)) {
        cx = nx;
        cy = ny;
        dir = d;
        moved = true;
        break;
      }
    }
    if (!moved) break; // a lone pixel
    if (cx === startX && cy === startY && points.length > 2) break;
  }
  return points;
}

/** Ramer–Douglas–Peucker: keep the corners, drop the pixel stair-stepping. */
function simplify(
  points: [number, number][],
  epsilon: number,
): [number, number][] {
  if (points.length < 3) return points;
  let worst = 0;
  let index = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (dist > worst) {
      worst = dist;
      index = i;
    }
  }
  if (worst <= epsilon) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), epsilon).slice(0, -1),
    ...simplify(points.slice(index), epsilon),
  ];
}

/**
 * Build the standee. The mesh is one unit tall, centred left-to-right and
 * standing on y = 0, so the scene can place it without measuring.
 */
export async function buildStandee(
  dataUrl: string,
  depth = 0.055,
): Promise<Standee> {
  const mask = await alphaMask(dataUrl);
  const blob = largestBlob(mask);
  const traced = traceOutline(blob, mask.w, mask.h);
  const outline = simplify(traced, 1.1);

  // One unit tall, width to match the picture.
  const unit = 1 / mask.h;
  const width = mask.w * unit;

  const shape = new THREE.Shape();
  const place = (p: [number, number], first = false) => {
    const x = p[0] * unit - width / 2;
    const y = 1 - p[1] * unit; // image y runs down, the world's runs up
    if (first) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  };
  if (outline.length >= 3) {
    place(outline[0], true);
    for (let i = 1; i < outline.length; i++) place(outline[i]);
    shape.closePath();
  } else {
    // Nothing traceable — fall back to a plain card.
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, 1);
    shape.lineTo(-width / 2, 1);
    shape.closePath();
  }

  // Paint the picture across the front and back faces.
  const uv = {
    generateTopUV: (
      _geometry: THREE.ExtrudeGeometry,
      vertices: number[],
      a: number,
      b: number,
      c: number,
    ) =>
      [a, b, c].map((i) => {
        const x = vertices[i * 3];
        const y = vertices[i * 3 + 1];
        return new THREE.Vector2((x + width / 2) / width, y);
      }),
    generateSideWallUV: () => [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 0),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(0, 1),
    ],
  };

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    UVGenerator: uv as unknown as THREE.UVGenerator,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();

  const texture = await new THREE.TextureLoader().loadAsync(dataUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return { geometry, texture, aspect: mask.aspect };
}
