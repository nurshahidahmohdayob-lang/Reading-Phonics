"use client";

/* The jungle floor, in three dimensions.

   Each drawing is the picture itself, standing on the floor and always facing
   the class: no card, no thickness, nothing drawn round it — its own
   transparency is its shape, and its shadow's. It never turns edge-on, and
   never spins on the spot; walking the other way simply flips the picture.

   What makes it read as animated rather than as a picture being slid about is
   the shaping (shapeFor below): it squashes as its weight lands, leans into
   its stride, stretches off the ground in a hop and breathes while standing.
   The floor is in perspective, so one walking towards the class grows and one
   walking away shrinks, and a light above throws its shadow on the ground.

   Positions live here rather than in React state: they change sixty times a
   second, and re-rendering the page for each frame would be wasteful. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildFlat } from "@/lib/standee";

export type Move3D = "alive" | "still" | "walk" | "float" | "spin" | "jump";

export type Actor3D = {
  key: string;
  dataUrl: string;
  move: Move3D;
  /** 1 stands about a quarter of the picture tall. */
  scale: number;
};

/* How much floor they have to wander over. Kept inside what the camera can
   see even at the front edge, where the view is narrowest. */
const FLOOR_W = 5.2;
const FLOOR_D = 2.8;

/* How a drawing is squashed and leaned this frame, as multiples of its own
   size. Feet stay on the floor (the geometry's origin is at its feet), so
   pressing down on y and out on x reads as weight landing, and the reverse
   reads as a stretch. Drawn from the same clock as the movement, so a step
   and its squash happen together. */
type Shape = { sx: number; sy: number; lean: number };

const REST: Shape = { sx: 1, sy: 1, lean: 0 };

function shapeFor(move: Move3D, now: number, phase: number): Shape {
  if (move === "walk" || move === "float") {
    if (move === "float") {
      // Drifting: a slow roll and a breath, nothing sharp.
      return {
        sx: 1 - 0.02 * Math.sin(now * 1.6 + phase),
        sy: 1 + 0.03 * Math.sin(now * 1.6 + phase),
        lean: Math.sin(now * 1.1 + phase) * 0.08,
      };
    }
    // Walking: weight lands twice a stride, and the body rocks with it.
    const stride = Math.sin(now * 5 + phase);
    const contact = (1 - Math.abs(stride)) ** 2;
    return {
      sx: 1 + 0.06 * contact,
      sy: 1 - 0.07 * contact,
      lean: stride * 0.06,
    };
  }
  if (move === "jump") {
    const hop = Math.abs(Math.sin(now * 2.6 + phase));
    // Stretched thin in the air, flattened on landing.
    const land = Math.max(0, 1 - hop / 0.12);
    return {
      sx: 1 - 0.1 * hop + 0.16 * land,
      sy: 1 + 0.16 * hop - 0.2 * land,
      lean: 0,
    };
  }
  if (move === "alive") {
    const breath = Math.sin(now * 2 + phase);
    return {
      sx: 1 - 0.025 * breath,
      sy: 1 + 0.035 * breath,
      lean: Math.sin(now * 0.9 + phase) * 0.06,
    };
  }
  if (move === "spin") {
    const wind = Math.sin(now * 3 + phase);
    return { sx: 1 - 0.03 * wind, sy: 1 + 0.04 * wind, lean: 0 };
  }
  return REST;
}

type Live = {
  key: string;
  mesh: THREE.Mesh;
  /** Where it's heading, and how fast, when it's roaming. */
  heading: number;
  speed: number;
  phase: number;
  move: Move3D;
  scale: number;
  /** Which way round the picture is drawn, so walking left looks like
      walking left without the drawing ever turning edge-on. */
  facingLeft: boolean;
};

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
      alpha: true, // the jungle behind the canvas shows through
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

    // An invisible floor that catches shadows, so they fall on the jungle art.
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
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
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
      latest.current.onSelect(picked.key);
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setPointer(e);
      ray.setFromCamera(pointer, camera);
      if (!ray.ray.intersectPlane(groundPlane, hit)) return;
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

        if (!moving) {
          // Paused, or being carried: leave it exactly where it is.
        } else if (l.move === "walk" || l.move === "float") {
          // Roam the whole floor, turning back at the edges.
          const speed = l.move === "walk" ? l.speed : l.speed * 0.6;
          m.position.x += Math.cos(l.heading) * speed * dt;
          m.position.z += Math.sin(l.heading) * speed * dt;
          if (Math.abs(m.position.x) > FLOOR_W / 2) {
            l.heading = Math.PI - l.heading;
            m.position.x = THREE.MathUtils.clamp(
              m.position.x,
              -FLOOR_W / 2,
              FLOOR_W / 2,
            );
          }
          if (Math.abs(m.position.z) > FLOOR_D / 2) {
            l.heading = -l.heading;
            m.position.z = THREE.MathUtils.clamp(
              m.position.z,
              -FLOOR_D / 2,
              FLOOR_D / 2,
            );
          }
          // Wander a little, so it doesn't march in straight lines.
          l.heading += Math.sin(now * 0.7 + l.phase) * 0.35 * dt;
          // It never turns: the drawing stays face-on to the class, and the
          // way it's walking shows in which way round the picture is.
          l.facingLeft = Math.cos(l.heading) < 0;
          m.position.y =
            l.move === "float"
              ? 0.35 + Math.sin(now * 1.6 + l.phase) * 0.14
              : Math.abs(Math.sin(now * 5 + l.phase)) * 0.045;
        } else if (l.move === "spin") {
          // Not offered on the stage any more: a wobble on the spot, since a
          // flat picture spinning would only vanish edge-on.
          m.position.y = 0;
        } else if (l.move === "jump") {
          const hop = Math.abs(Math.sin(now * 2.6 + l.phase));
          m.position.y = hop * hop * 0.5;
        } else if (l.move === "alive") {
          // On the spot, shifting its weight.
          m.position.y = Math.abs(Math.sin(now * 1.2 + l.phase)) * 0.05;
        } else {
          m.position.y = 0;
        }

        // Squash, stretch and lean — what makes a drawing read as animated
        // rather than as a board being slid about. Eased in, so changing
        // what it's doing doesn't snap it into a new shape.
        const want = moving ? shapeFor(l.move, now, l.phase) : REST;
        const ease = Math.min(1, dt * 12);
        const facing = l.facingLeft ? -1 : 1;
        m.scale.x += (facing * l.scale * want.sx - m.scale.x) * ease;
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

  // Add and remove standees as the list changes.
  useEffect(() => {
    let cancelled = false;
    const world = scene.current;
    if (!world) return;

    for (const actor of actors) {
      const existing = live.current.get(actor.key);
      if (existing !== undefined) {
        if (existing) {
          existing.move = actor.move;
          if (existing.scale !== actor.scale) {
            existing.scale = actor.scale;
            existing.mesh.scale.setScalar(actor.scale);
          }
        }
        continue;
      }
      // Hold the place, so a slow build isn't started twice.
      live.current.set(actor.key, null);
      void buildFlat(actor.dataUrl)
        .then(({ geometry, texture }) => {
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
          mesh.position.set(
            (Math.random() - 0.5) * FLOOR_W * 0.7,
            0,
            (Math.random() - 0.5) * FLOOR_D * 0.6,
          );
          stage.add(mesh);
          live.current.set(actor.key, {
            key: actor.key,
            mesh,
            heading: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.35,
            phase: Math.random() * Math.PI * 2,
            move: actor.move,
            scale: actor.scale,
            facingLeft: false,
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
