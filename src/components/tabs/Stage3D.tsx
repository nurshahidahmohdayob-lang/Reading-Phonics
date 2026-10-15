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
};

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
        const symmetric = l.move === "jelly";
        const facing =
          (symmetric ? 1 : l.goingLeft ? -1 : 1) * (l.flip ? -1 : 1);
        const turnEase = l.move === "swim" ? Math.min(1, dt * 6) : ease;
        m.scale.x += (facing * l.scale * want.sx - m.scale.x) * turnEase;
        m.scale.y += (l.scale * want.sy - m.scale.y) * ease;
        m.scale.z += (l.scale - m.scale.z) * ease;
        m.rotation.z += (want.lean - m.rotation.z) * ease;

        // The chosen one sits a touch brighter.
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissiveIntensity = l.key === chosen ? 0.25 : 0;
          }
        }
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
