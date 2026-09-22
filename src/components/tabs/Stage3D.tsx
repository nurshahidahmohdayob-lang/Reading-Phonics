"use client";

/* The jungle floor, in three dimensions.

   Each drawing is a standee (lib/standee.ts): its own outline cut out of
   card, with thickness. They stand on a floor the camera looks across, so
   one walking towards you grows and one walking away shrinks, and a light
   above casts their shadow onto the ground. Turning shows the edge of the
   card — which is what makes a flat drawing read as an object rather than a
   sticker.

   Positions live here rather than in React state: they change sixty times a
   second, and re-rendering the page for each frame would be wasteful. */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildStandee } from "@/lib/standee";

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

type Live = {
  key: string;
  mesh: THREE.Mesh;
  /** Where it's heading, and how fast, when it's roaming. */
  heading: number;
  speed: number;
  phase: number;
  move: Move3D;
  scale: number;
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
          // Face the way it's going, with a bit of a waddle.
          const facing = -l.heading + Math.PI / 2;
          m.rotation.y +=
            (facing - m.rotation.y) * Math.min(1, dt * 4) +
            Math.sin(now * 6 + l.phase) * 0.004;
          m.position.y =
            l.move === "float"
              ? 0.35 + Math.sin(now * 1.6 + l.phase) * 0.14
              : Math.abs(Math.sin(now * 5 + l.phase)) * 0.045;
        } else if (l.move === "spin") {
          m.rotation.y += dt * 1.5;
          m.position.y = 0;
        } else if (l.move === "jump") {
          m.rotation.y += (0 - m.rotation.y) * Math.min(1, dt * 3);
          const hop = Math.abs(Math.sin(now * 2.6 + l.phase));
          m.position.y = hop * hop * 0.5;
        } else if (l.move === "alive") {
          // On the spot, but turning far enough to show it's an object.
          m.rotation.y = Math.sin(now * 0.8 + l.phase) * 0.7;
          m.position.y = Math.abs(Math.sin(now * 1.2 + l.phase)) * 0.05;
        } else {
          m.rotation.y += (0 - m.rotation.y) * Math.min(1, dt * 3);
          m.position.y = 0;
        }

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
      void buildStandee(actor.dataUrl)
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
            alphaTest: 0.5,
            roughness: 0.9,
            metalness: 0,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: texture,
            emissiveIntensity: 0,
          });
          const edge = new THREE.MeshStandardMaterial({
            color: 0xf4efe4,
            roughness: 1,
          });
          const mesh = new THREE.Mesh(geometry, [face, edge]);
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
