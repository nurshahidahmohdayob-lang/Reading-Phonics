"use client";

/* The stage, in three dimensions.

   Each drawing is the picture itself, always facing the class: no card, no
   thickness, nothing drawn round it — its own transparency is its shape, and
   its shadow's. It never turns edge-on; going the other way flips it over.

   How it moves depends on what it is (Move3D):
   - walk: squashes as its weight lands, leans into its stride.
   - swim: a fish. A wave runs down its body from head to tail, the tail
     swinging furthest; it glides, darts, rises and dips through the water,
     nose tipping the way it's going.
   - jelly: a jellyfish. The bell squeezes to push it up, opens again, and it
     drifts slowly down, tentacles trailing and swaying behind.
   - fly: a bird or a butterfly. Wings (the top of the picture) flap; it
     swoops about in the air.
   - hop: a frog or a bunny. Crouch, leap forward, land with a squash.
   - slither: a snake or a worm. Ripples along the ground.
   - float: drifting, as in space.
   - rocket: rumbles on the ground, blasts off in fire and smoke, swoops
     across the sky nose first, then comes down slowly on its flame and lands.
   The bending is done on the picture itself (it's a finely divided sheet),
   so the shadow on the floor bends with it.

   The floor is in perspective, so one coming towards the class grows and
   one going away shrinks.

   Positions live here rather than in React state: they change sixty times a
   second, and re-rendering the page for each frame would be wasteful. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildFlat } from "@/lib/standee";

export type Move3D =
  | "walk"
  | "swim"
  | "jelly"
  | "fly"
  | "hop"
  | "slither"
  | "float"
  | "rocket"
  | "alive"
  | "still";

export type Actor3D = {
  key: string;
  dataUrl: string;
  move: Move3D;
  /** 1 stands about a quarter of the picture tall. */
  scale: number;
  /** Drawn facing left: the head is on the left of the picture. */
  flip: boolean;
};

/* How much floor they have to wander over. Kept inside what the camera can
   see even at the front edge, where the view is narrowest. */
const FLOOR_W = 5.2;
const FLOOR_D = 2.8;

/** How high things in the water or the air go. */
const SKY = { swim: [0.25, 1.15], jelly: [0.2, 1.05], fly: [0.75, 1.35] } as const;

/* How a drawing is squashed and leaned this frame, as multiples of its own
   size. Feet stay put (the geometry's origin is at its feet), so pressing
   down on y and out on x reads as weight landing, the reverse as a stretch. */
type Shape = { sx: number; sy: number; lean: number };

const REST: Shape = { sx: 1, sy: 1, lean: 0 };

type Live = {
  key: string;
  mesh: THREE.Mesh;
  /** The sheet as built, before any bending. */
  base: Float32Array;
  aspect: number;
  bent: boolean;
  /** Where it's heading, and how fast, when it's roaming. */
  heading: number;
  speed: number;
  phase: number;
  move: Move3D;
  scale: number;
  flip: boolean;
  /** Which way it's going, so walking left looks like walking left. */
  goingLeft: boolean;
  /** Up-and-down speed, for swimmers, jellyfish and fliers. */
  vy: number;
  /** The height a swimmer or flier is making for. */
  aim: number;
  /** A jellyfish let itself sink to the bottom of its range. */
  sinking: boolean;
  /** Hops: how far through the current hop (0 crouched … 1 landed). */
  hop: number;
  /** Rockets: seconds into the current flight (see ROCKET). */
  flight: number;
  /** Rockets: how hard the engine is burning (0 off … 1 full), and how much
      smoke is billowing along the ground, this frame. */
  thrust: number;
  smoke: number;
};

/* A rocket's flight, in seconds, one part after another, round and round. */
const ROCKET = { rumble: 1.8, launch: 2.2, gone: 0.8, swoop: 3.2, back: 0.8, land: 3, rest: 1.4 };
const ROCKET_TOTAL = Object.values(ROCKET).reduce((a, b) => a + b, 0);
/** High enough to be out of sight above the stage. */
const ROCKET_TOP = 3.6;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 → 1 → 0 over a jellyfish's beat: a quick squeeze, a slow opening. */
function jellyBeat(now: number, phase: number) {
  const c = (now / 1.9 + phase / (Math.PI * 2)) % 1;
  return c < 0.28
    ? Math.sin((c / 0.28) * (Math.PI / 2))
    : Math.cos(((c - 0.28) / 0.72) * (Math.PI / 2)) ** 2;
}

/** Bend the sheet for this frame. Works in the picture's own terms: u runs
    0 (left) → 1 (right) across it, v 0 (bottom) → 1 (top). */
function bend(l: Live, now: number, moving: boolean) {
  const pos = l.mesh.geometry.attributes.position as THREE.BufferAttribute;
  const out = pos.array as Float32Array;
  const b = l.base;
  const kind = moving ? l.move : "still";
  const bends =
    kind === "swim" || kind === "jelly" || kind === "fly" || kind === "slither";
  if (!bends) {
    if (l.bent) {
      out.set(b);
      pos.needsUpdate = true;
      l.mesh.geometry.computeBoundingSphere();
      l.bent = false;
    }
    return;
  }
  const w = l.aspect;
  const headU = l.flip ? 0 : 1;
  const t = now + l.phase;

  if (kind === "swim" || kind === "slither") {
    // A wave travelling from head to tail, growing towards the tail. Faster
    // when it darts. Most of the swing is towards and away from the class
    // (as a real fish's tail goes), with a little up and down so it shows.
    const fish = kind === "swim";
    const beat = fish ? 7 + l.speed * 6 : 4;
    const waves = fish ? 0.85 : 1.6;
    for (let i = 0; i < b.length; i += 3) {
      const u = b[i] / w + 0.5;
      const d = Math.abs(u - headU); // 0 at the head, 1 at the tail
      const reach = fish ? 0.03 + 0.3 * d * d : 0.12;
      const s = Math.sin(t * beat - d * waves * Math.PI * 2);
      out[i] = b[i] - (fish ? Math.sign(0.5 - headU) * 0.04 * d * d * Math.abs(s) * w : 0);
      out[i + 1] = b[i + 1] + s * reach * (fish ? 0.32 : 0.18);
      out[i + 2] = b[i + 2] + s * reach * w * 0.5;
    }
  } else if (kind === "jelly") {
    const k = jellyBeat(now, l.phase);
    for (let i = 0; i < b.length; i += 3) {
      const x = b[i];
      const v = b[i + 1];
      // The bell: the top part, squeezing in at its rim most.
      const bell = smooth(0.35, 0.6, v) * (1 - 0.45 * smooth(0.8, 1, v));
      // Tentacles: below the bell, swaying in a wave that lags further
      // behind the lower it goes, and pulled long as it shoots up.
      const tent = 1 - smooth(0.3, 0.55, v);
      const lag = (0.55 - v) * 7;
      const sway =
        Math.sin(t * 2.1 - lag) * 0.07 * tent * (0.4 + (0.55 - v) * 2) +
        Math.sin(t * 3.3 - lag * 1.3 + x * 4) * 0.025 * tent;
      out[i] = x * (1 - 0.24 * k * bell) + sway * w;
      out[i + 1] =
        v +
        0.07 * k * smooth(0.4, 1, v) -
        0.08 * k * tent * (0.55 - v) * 2 +
        Math.max(0, l.vy) * 0.12 * tent * (0.55 - v);
      out[i + 2] = b[i + 2] + Math.sin(t * 1.7 - lag) * 0.05 * tent;
    }
  } else if (kind === "fly") {
    // Wings: the top of the picture beats up and down (and a little towards
    // the class, so it shows in perspective).
    const flap = Math.sin(t * 13);
    for (let i = 0; i < b.length; i += 3) {
      const v = b[i + 1];
      const wing = smooth(0.45, 1, v);
      out[i] = b[i];
      out[i + 1] = v + flap * 0.16 * wing;
      out[i + 2] = b[i + 2] - Math.abs(flap) * 0.12 * wing;
    }
  }
  pos.needsUpdate = true;
  l.mesh.geometry.computeBoundingSphere();
  l.bent = true;
}

/** Move it about the stage for this frame, and say how to shape it. */
function step(l: Live, now: number, dt: number): Shape {
  const m = l.mesh.position;
  const t = now + l.phase;

  // Roam the floor in x and z, turning back at the edges.
  const roam = (speed: number) => {
    m.x += Math.cos(l.heading) * speed * dt;
    m.z += Math.sin(l.heading) * speed * dt;
    if (Math.abs(m.x) > FLOOR_W / 2) {
      l.heading = Math.PI - l.heading;
      m.x = THREE.MathUtils.clamp(m.x, -FLOOR_W / 2, FLOOR_W / 2);
    }
    if (Math.abs(m.z) > FLOOR_D / 2) {
      l.heading = -l.heading;
      m.z = THREE.MathUtils.clamp(m.z, -FLOOR_D / 2, FLOOR_D / 2);
    }
    if (Math.abs(Math.cos(l.heading)) > 0.15) {
      l.goingLeft = Math.cos(l.heading) < 0;
    }
  };
  // Rise or sink towards a height, gently.
  const climb = (lo: number, hi: number, every: number) => {
    if (Math.sin(t * every) > 0.995 || l.aim < lo || l.aim > hi) {
      l.aim = lo + Math.random() * (hi - lo);
    }
    const want = THREE.MathUtils.clamp((l.aim - m.y) * 0.9, -0.5, 0.5);
    l.vy += (want - l.vy) * Math.min(1, dt * 2);
    m.y = THREE.MathUtils.clamp(m.y + l.vy * dt, lo - 0.1, hi + 0.1);
  };
  // Nose up when going up: which way that tips depends on which way it faces.
  const pitch = (vx: number) =>
    Math.atan2(l.vy, Math.max(0.2, Math.abs(vx))) * 0.7 * (l.goingLeft ? -1 : 1);

  switch (l.move) {
    case "walk": {
      roam(l.speed);
      l.heading += Math.sin(t * 0.7) * 0.35 * dt;
      m.y = Math.abs(Math.sin(t * 5)) * 0.045;
      // Weight lands twice a stride, and the body rocks with it.
      const stride = Math.sin(t * 5);
      const contact = (1 - Math.abs(stride)) ** 2;
      return { sx: 1 + 0.06 * contact, sy: 1 - 0.07 * contact, lean: stride * 0.06 };
    }
    case "swim": {
      // Glides, with now and then a dart forward.
      const dart = Math.max(0, Math.sin(t * 0.55)) ** 6;
      const speed = l.speed * (0.55 + 1.6 * dart);
      roam(speed);
      l.heading += Math.sin(t * 0.45) * 0.5 * dt;
      climb(SKY.swim[0], SKY.swim[1], 0.3);
      return { sx: 1, sy: 1, lean: pitch(speed) };
    }
    case "jelly": {
      // Each squeeze pushes it up; between, it sinks and drifts.
      const k = jellyBeat(now, l.phase);
      if (m.y > SKY.jelly[1]) l.sinking = true;
      if (m.y < SKY.jelly[0] + 0.5) l.sinking = false;
      const push = l.sinking ? 0.15 : 1;
      l.vy += (k * 1.1 * push - 0.32) * dt * 2.2;
      l.vy *= 1 - Math.min(1, dt * 1.6);
      m.y = Math.max(SKY.jelly[0], m.y + l.vy * dt);
      roam(0.12);
      l.heading += Math.sin(t * 0.3) * 0.3 * dt;
      return { sx: 1, sy: 1, lean: Math.sin(t * 0.6) * 0.07 };
    }
    case "fly": {
      roam(l.speed * 1.5);
      l.heading += Math.sin(t * 0.5) * 0.6 * dt;
      climb(SKY.fly[0], SKY.fly[1], 0.4);
      // Bobs with each beat of its wings.
      m.y += Math.sin(t * 13 + Math.PI) * 0.012;
      return { sx: 1, sy: 1, lean: pitch(l.speed) * 0.6 };
    }
    case "hop": {
      // Crouch for a moment, then leap: moving only while in the air.
      const cycle = 1.15;
      l.hop = (l.hop + dt / cycle) % 1;
      const air = THREE.MathUtils.clamp((l.hop - 0.3) / 0.7, 0, 1);
      const inAir = air > 0 && air < 1;
      if (inAir) roam(l.speed * 1.9);
      else l.heading += (Math.random() - 0.5) * 0.4 * dt;
      m.y = 4 * air * (1 - air) * 0.55;
      const crouch = l.hop < 0.3 ? Math.sin((l.hop / 0.3) * Math.PI) : 0;
      const stretch = inAir ? Math.sin(air * Math.PI) : 0;
      return {
        sx: 1 + 0.14 * crouch - 0.08 * stretch,
        sy: 1 - 0.18 * crouch + 0.14 * stretch,
        lean: inAir ? (0.5 - air) * 0.35 * (l.goingLeft ? -1 : 1) : 0,
      };
    }
    case "slither":
      roam(l.speed * 0.5);
      l.heading += Math.sin(t * 0.5) * 0.4 * dt;
      m.y = 0;
      return REST;
    case "float":
      roam(l.speed * 0.6);
      l.heading += Math.sin(t * 0.7) * 0.35 * dt;
      m.y = 0.35 + Math.sin(t * 1.6) * 0.14;
      return {
        sx: 1 - 0.02 * Math.sin(t * 1.6),
        sy: 1 + 0.03 * Math.sin(t * 1.6),
        lean: Math.sin(t * 1.1) * 0.08,
      };
    case "rocket":
      return fly(l, m, now, dt);
    case "alive": {
      m.y = Math.abs(Math.sin(t * 1.2)) * 0.05;
      const breath = Math.sin(t * 2);
      return { sx: 1 - 0.025 * breath, sy: 1 + 0.035 * breath, lean: Math.sin(t * 0.9) * 0.06 };
    }
    default:
      m.y = 0;
      return REST;
  }
}

/** A rocket's flight for this frame (see ROCKET). Sets how hard its engine
    burns, for the fire and smoke drawn after. */
function fly(l: Live, m: THREE.Vector3, now: number, dt: number): Shape {
  l.flight = (l.flight + dt) % ROCKET_TOTAL;
  let f = l.flight;
  l.thrust = 0;
  l.smoke = 0;

  // On the pad, engine lighting: it shakes and crouches, smoke spreading.
  if (f < ROCKET.rumble) {
    const s = f / ROCKET.rumble;
    m.y += (0 - m.y) * Math.min(1, dt * 6);
    l.thrust = 0.2 + 0.5 * s;
    l.smoke = 0.4 + 0.6 * s;
    const shake = Math.sin(now * 55) * 0.5 + Math.sin(now * 37) * 0.5;
    return { sx: 1 + 0.04 * s, sy: 1 - 0.06 * s, lean: shake * 0.035 * (0.3 + s) };
  }
  f -= ROCKET.rumble;

  // Lift off, faster and faster, straight up and out of sight.
  if (f < ROCKET.launch) {
    const s = f / ROCKET.launch;
    m.y = ROCKET_TOP * s * s;
    l.thrust = 1;
    l.smoke = Math.max(0, 1 - m.y / 0.9);
    return { sx: 0.94, sy: 1.1, lean: Math.sin(now * 40) * 0.02 * (1 - s) };
  }
  f -= ROCKET.launch;

  // Out of sight. It'll come back across the sky towards the other side,
  // already turned to point the way it's going.
  const dir = () => (l.goingLeft ? -1 : 1);
  if (f < ROCKET.gone) {
    m.y = ROCKET_TOP + 1;
    l.goingLeft = m.x > 0;
    return { sx: 1, sy: 1, lean: (dir() * -Math.PI) / 2 };
  }
  f -= ROCKET.gone;

  // Swoop across the sky, nose first, dipping down towards the middle.
  if (f < ROCKET.swoop) {
    const s = f / ROCKET.swoop;
    const X = 5;
    const dip = 1.1;
    m.x = dir() * X * (2 * s - 1);
    m.y = 2.3 - dip * Math.sin(Math.PI * s);
    const vx = (dir() * 2 * X) / ROCKET.swoop;
    const vy = (-dip * Math.PI * Math.cos(Math.PI * s)) / ROCKET.swoop;
    let lean = Math.atan2(vy, vx) - Math.PI / 2;
    if (lean < -Math.PI) lean += Math.PI * 2;
    l.thrust = 1;
    return { sx: 0.95, sy: 1.08, lean };
  }
  f -= ROCKET.swoop;

  // Out of sight again, choosing somewhere on the stage to land.
  if (f < ROCKET.back) {
    m.y = ROCKET_TOP + 1;
    m.x = Math.sin(l.phase * 3 + now * 0.37) * FLOOR_W * 0.35;
    m.z = Math.cos(l.phase * 2 + now * 0.29) * FLOOR_D * 0.3;
    return { sx: 1, sy: 1, lean: 0 };
  }
  f -= ROCKET.back;

  // Come down on its flame, slowing all the way to a gentle touch-down.
  if (f < ROCKET.land) {
    const s = f / ROCKET.land;
    m.y = ROCKET_TOP * (1 - s) ** 2;
    l.thrust = 0.5 + 0.4 * s;
    l.smoke = Math.max(0, 1 - m.y / 0.8);
    return { sx: 1, sy: 1.04, lean: Math.sin(now * 3 + l.phase) * 0.05 * (1 - s) };
  }
  f -= ROCKET.land;

  // Landed: a squash as its weight settles, a last puff, engine off.
  m.y = 0;
  const settle = 1 - smooth(0, 0.45, f);
  l.smoke = f < 0.4 ? 0.6 : 0;
  return { sx: 1 + 0.08 * settle, sy: 1 - 0.1 * settle, lean: 0 };
}

/* Fire and smoke: soft round puffs, each living a moment, drawn as points so
   hundreds cost next to nothing. Fire glows (its colours add up); smoke
   doesn't. They stay where they were puffed out, so a moving rocket leaves a
   trail. */
type Puff = {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number; life: number;
  size0: number; size1: number;
  /** Colours it passes through as it ages, start → middle → end. */
  colors: readonly (readonly [number, number, number])[];
  alpha: number;
  drag: number;
};

const PUFF_VERTEX = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const PUFF_FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.25, 1.0, d)) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }`;

function puffs(max: number, glow: boolean) {
  const geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(max * 3);
  const col = new Float32Array(max * 3);
  const size = new Float32Array(max);
  const alpha = new Float32Array(max);
  const attr = (name: string, arr: Float32Array, n: number) => {
    const a = new THREE.BufferAttribute(arr, n);
    a.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, a);
    return a;
  };
  const attrs = [attr("position", pos, 3), attr("aColor", col, 3), attr("aSize", size, 1), attr("aAlpha", alpha, 1)];
  geometry.setDrawRange(0, 0);
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1000 } },
    vertexShader: PUFF_VERTEX,
    fragmentShader: PUFF_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = glow ? 3 : 2;
  let list: Puff[] = [];

  return {
    points,
    material,
    add(p: Puff) {
      if (list.length < max) list.push(p);
    },
    update(dt: number) {
      list = list.filter((p) => (p.age += dt) < p.life);
      list.forEach((p, i) => {
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k; p.vy *= k; p.vz *= k;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const a = p.age / p.life;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        // Through the colours in turn.
        const c = p.colors;
        const at = a * (c.length - 1);
        const j = Math.min(c.length - 2, Math.floor(at));
        const u = at - j;
        for (let ch = 0; ch < 3; ch++) col[i * 3 + ch] = c[j][ch] + (c[j + 1][ch] - c[j][ch]) * u;
        size[i] = p.size0 + (p.size1 - p.size0) * Math.sqrt(a);
        alpha[i] = p.alpha * (1 - a) * Math.min(1, a * 8);
      });
      geometry.setDrawRange(0, list.length);
      for (const a of attrs) a.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

const FIRE = [[1, 0.98, 0.8], [1, 0.7, 0.2], [1, 0.3, 0.35], [0.6, 0.15, 0.5]] as const;
const SMOKE = [[1, 0.97, 1], [0.9, 0.85, 1], [0.8, 0.74, 0.95]] as const;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Puff fire and smoke out of a rocket for this frame. */
function exhaust(l: Live, dt: number, fire: ReturnType<typeof puffs>, smoke: ReturnType<typeof puffs>) {
  const m = l.mesh;
  const sc = l.scale;
  // Out of its bottom, opposite to where its nose points.
  const th = m.rotation.z;
  const ex = Math.sin(th);
  const ey = -Math.cos(th);
  const count = (rate: number) => Math.floor(rate * dt + Math.random());

  if (m.position.y < ROCKET_TOP) {
    for (let i = count(l.thrust * 150); i > 0; i--) {
      const side = rand(-0.5, 0.5);
      const speed = rand(1, 1.7) * sc * (0.5 + 0.5 * l.thrust);
      fire.add({
        x: m.position.x + ey * -side * 0.08 * sc, y: m.position.y + ex * side * 0.08 * sc, z: m.position.z + rand(-0.03, 0.03),
        vx: ex * speed + -ey * side * 0.5 * sc, vy: ey * speed + ex * side * 0.5 * sc, vz: rand(-0.1, 0.1),
        age: 0, life: rand(0.25, 0.5),
        size0: 0.2 * sc * (0.6 + 0.4 * l.thrust), size1: 0.07 * sc,
        colors: FIRE, alpha: 0.9, drag: 2.5,
      });
    }
    // A trail of smoke behind it once it's off the ground.
    if (m.position.y > 0.3) {
      for (let i = count(l.thrust * 28); i > 0; i--) {
        smoke.add({
          x: m.position.x + ex * 0.15 * sc, y: m.position.y + ey * 0.15 * sc, z: m.position.z,
          vx: ex * 0.3 + rand(-0.08, 0.08), vy: ey * 0.3 + rand(-0.05, 0.08), vz: rand(-0.05, 0.05),
          age: 0, life: rand(1.1, 1.8),
          size0: 0.12 * sc, size1: 0.5 * sc,
          colors: SMOKE, alpha: 0.38, drag: 1.5,
        });
      }
    }
  }
  // Smoke billowing out along the ground beneath it.
  for (let i = count(l.smoke * 70); i > 0; i--) {
    const a = rand(0, Math.PI * 2);
    const out = rand(0.5, 1.2) * sc;
    smoke.add({
      x: m.position.x + rand(-0.08, 0.08), y: 0.04, z: m.position.z + rand(-0.05, 0.05),
      vx: Math.cos(a) * out, vy: rand(0.05, 0.25), vz: Math.sin(a) * out * 0.45,
      age: 0, life: rand(1.3, 2.3),
      size0: 0.2 * sc, size1: 0.75 * sc,
      colors: SMOKE, alpha: 0.5, drag: 1.3,
    });
  }
}

export default function Stage3D({
  actors,
  selectedKey,
  playing,
  onSelect,
}: {
  actors: Actor3D[];
  selectedKey: string | null;
  playing: boolean;
  onSelect: (key: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const live = useRef(new Map<string, Live | null>());
  const scene = useRef<THREE.Scene | null>(null);
  /* What the animation loop needs to know, kept in a ref so that changing
     any of it doesn't tear down and rebuild the whole scene. */
  const latest = useRef({ selectedKey, playing, onSelect });

  useEffect(() => {
    latest.current = { selectedKey, playing, onSelect };
  });

  // Build the scene once.
  useEffect(() => {
    const mount = holder.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    const world = new THREE.Scene();
    scene.current = world;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 5.2);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true, // the place behind the canvas shows through
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    world.add(new THREE.HemisphereLight(0xdff3d0, 0x2f6b40, 1.6));
    const sun = new THREE.DirectionalLight(0xfff4cf, 2.2);
    sun.position.set(2.6, 4.2, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.radius = 3;
    world.add(sun);

    // An invisible floor that catches shadows, so they fall on the film.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(FLOOR_W * 3, FLOOR_D * 3),
      new THREE.ShadowMaterial({ opacity: 0.32 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    world.add(floor);

    const fire = puffs(700, true);
    const smoke = puffs(400, false);
    world.add(smoke.points, fire.points);
    const pointScale = () => {
      const h = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
      const s = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      fire.material.uniforms.uScale.value = s;
      smoke.material.uniforms.uScale.value = s;
    };
    pointScale();

    const standees = () =>
      [...live.current.values()].filter((l): l is Live => !!l);

    // ---- picking one up ----
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    // Dragged at the height it was picked up at, so a fish stays in the water.
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let dragging: Live | null = null;

    const setPointer = (e: PointerEvent) => {
      const box = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - box.left) / box.width) * 2 - 1;
      pointer.y = -((e.clientY - box.top) / box.height) * 2 + 1;
    };

    const onDown = (e: PointerEvent) => {
      setPointer(e);
      ray.setFromCamera(pointer, camera);
      const all = standees();
      const found = ray.intersectObjects(
        all.map((l) => l.mesh),
        false,
      )[0];
      if (!found) return;
      const picked = all.find((l) => l.mesh === found.object);
      if (!picked) return;
      dragging = picked;
      dragPlane.constant = -picked.mesh.position.y;
      latest.current.onSelect(picked.key);
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setPointer(e);
      ray.setFromCamera(pointer, camera);
      if (!ray.ray.intersectPlane(dragPlane, hit)) return;
      dragging.mesh.position.x = THREE.MathUtils.clamp(
        hit.x,
        -FLOOR_W / 2,
        FLOOR_W / 2,
      );
      dragging.mesh.position.z = THREE.MathUtils.clamp(
        hit.z,
        -FLOOR_D / 2,
        FLOOR_D / 2,
      );
    };

    const endDrag = (e: PointerEvent) => {
      dragging = null;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    // ---- the loop ----
    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, clock.getDelta());
      const now = clock.elapsedTime;
      const { selectedKey: chosen, playing: running } = latest.current;

      for (const l of standees()) {
        const m = l.mesh;
        const moving = running && l !== dragging;

        // Paused, or being carried: it stays where it is, and stops bending.
        const want = moving ? step(l, now, dt) : REST;
        bend(l, now, moving);

        // Squash, stretch and lean, eased in so changing what it's doing
        // doesn't snap it into a new shape. Going the other way flips it
        // over — passing through edge-on for a moment, as a fish turns.
        const ease = Math.min(1, dt * 12);
        const symmetric = l.move === "jelly" || l.move === "rocket";
        const facing =
          (symmetric ? 1 : l.goingLeft ? -1 : 1) * (l.flip ? -1 : 1);
        const turnEase = l.move === "swim" ? Math.min(1, dt * 6) : ease;
        m.scale.x += (facing * l.scale * want.sx - m.scale.x) * turnEase;
        m.scale.y += (l.scale * want.sy - m.scale.y) * ease;
        m.scale.z += (l.scale - m.scale.z) * ease;
        m.rotation.z += (want.lean - m.rotation.z) * ease;
        if (moving && l.move === "rocket") exhaust(l, dt, fire, smoke);

        // The chosen one sits a touch brighter.
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissiveIntensity = l.key === chosen ? 0.25 : 0;
          }
        }
      }
      if (running) {
        fire.update(dt);
        smoke.update(dt);
      }
      renderer.render(world, camera);
    };
    tick();

    const resize = () => {
      const w = mount.clientWidth || 800;
      const h = mount.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      pointScale();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const meshes = live.current;
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      for (const l of meshes.values()) if (l) disposeMesh(l.mesh);
      meshes.clear();
      floor.geometry.dispose();
      fire.dispose();
      smoke.dispose();
      renderer.dispose();
      canvas.remove();
      scene.current = null;
    };
    // Built once. Actors come and go in the effect below; everything the
    // loop reads lives in `latest`.
  }, []);

  // Add and remove drawings as the list changes.
  useEffect(() => {
    let cancelled = false;
    const world = scene.current;
    if (!world) return;

    for (const actor of actors) {
      const existing = live.current.get(actor.key);
      if (existing !== undefined) {
        if (existing) {
          if (existing.move !== actor.move) {
            // Into the water or the air from where it stands.
            if (actor.move === "swim") existing.aim = 0.7;
            if (actor.move === "fly") existing.aim = 1.05;
            existing.vy = 0;
            existing.sinking = false;
            // A rocket starts on the pad, lighting its engine.
            existing.flight = 0;
          }
          existing.move = actor.move;
          existing.flip = actor.flip;
          existing.scale = actor.scale;
        }
        continue;
      }
      // Hold the place, so a slow build isn't started twice.
      live.current.set(actor.key, null);
      void buildFlat(actor.dataUrl)
        .then(({ geometry, texture, aspect }) => {
          const stage = scene.current;
          // It may have been taken off, or the section closed, meanwhile.
          if (cancelled || !stage || !live.current.has(actor.key)) {
            geometry.dispose();
            texture.dispose();
            return;
          }
          const face = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            // The drawing's own transparency cuts its shape, and its shadow
            // with it — no card, no edge, nothing round the picture.
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            roughness: 0.9,
            metalness: 0,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: texture,
            emissiveIntensity: 0,
          });
          const mesh = new THREE.Mesh(geometry, face);
          mesh.castShadow = true;
          mesh.scale.setScalar(actor.scale);
          const up =
            actor.move === "swim" ? 0.7 : actor.move === "jelly" ? 0.6 : actor.move === "fly" ? 1.05 : 0;
          mesh.position.set(
            (Math.random() - 0.5) * FLOOR_W * 0.7,
            up,
            (Math.random() - 0.5) * FLOOR_D * 0.6,
          );
          stage.add(mesh);
          const heading = Math.random() * Math.PI * 2;
          live.current.set(actor.key, {
            key: actor.key,
            mesh,
            base: Float32Array.from(geometry.attributes.position.array),
            aspect,
            bent: false,
            heading,
            speed: 0.5 + Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
            move: actor.move,
            scale: actor.scale,
            flip: actor.flip,
            goingLeft: Math.cos(heading) < 0,
            vy: 0,
            aim: up || 1,
            sinking: false,
            hop: Math.random(),
            flight: 0,
            thrust: 0,
            smoke: 0,
          });
        })
        .catch(() => {
          live.current.delete(actor.key);
        });
    }

    // Anything taken off the stage goes with it.
    const wanted = new Set(actors.map((a) => a.key));
    for (const [key, l] of [...live.current.entries()]) {
      if (wanted.has(key)) continue;
      if (l) {
        world.remove(l.mesh);
        disposeMesh(l.mesh);
      }
      live.current.delete(key);
    }

    return () => {
      cancelled = true;
    };
  }, [actors]);

  return <div ref={holder} className="absolute inset-0" />;
}

function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    if (m instanceof THREE.MeshStandardMaterial) m.map?.dispose();
    m.dispose();
  }
}
