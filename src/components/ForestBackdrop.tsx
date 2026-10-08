"use client";

/* The background behind every page: a storybook forest glade (rendered in
   Blender in depth layers, blender/forest.py) brought to life in 2.5D. The
   layers drift apart as the pointer moves, nearer ones further, so the glade
   has depth; the treetops sway, the windmill's sails turn, the fairy lights
   under the giant tree twinkle, sunbeams shimmer, fireflies wander and
   leaves flutter down. The picture covers the screen; on the home screen
   it's softly blurred, like a camera focused on the tiles in front. */

import { useEffect, useRef } from "react";
import { FOREST_BULBS, FOREST_GROUND, FOREST_HUB, FOREST_LAYERS, FOREST_SIZE } from "@/app/forestScene";

const RATIO = FOREST_SIZE.w / FOREST_SIZE.h;

/** How far each layer moves with the pointer, in % of the picture. */
const DEPTH = { back: 0.6, mid: 1.2, sails: 1.2, crowns: 1.6, front: 3 };

const FIREFLIES = Array.from({ length: 14 }, (_, i) => ({
  left: 8 + ((i * 37) % 84),
  top: 30 + ((i * 53) % 55),
  delay: -(i * 1.3),
  dur: 7 + (i % 5) * 1.6,
}));
const LEAVES = Array.from({ length: 7 }, (_, i) => ({
  left: 6 + ((i * 29) % 88),
  delay: -(i * 2.6),
  dur: 12 + (i % 4) * 3,
  hue: ["#6dbb3c", "#9bd34a", "#e8a23a", "#4f9d2f"][i % 4],
}));

/** soft: blur and dim the glade a little, so what's on top stands out. */
export default function ForestBackdrop({ soft = false }: { soft?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  // Parallax: ease the layers towards where the pointer is.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const step = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(step);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const layer = (name: keyof typeof DEPTH, extra?: React.ReactNode, className = "") => (
    <div
      className="absolute inset-0"
      style={{ transform: `translate(calc(var(--px, 0) * ${-DEPTH[name]}%), calc(var(--py, 0) * ${-DEPTH[name] * 0.5}%))` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FOREST_LAYERS[name]} alt="" draggable={false} className={`absolute inset-0 h-full w-full select-none ${className}`} style={name === "sails" ? { transformOrigin: `${FOREST_HUB[0]}% ${FOREST_HUB[1]}%` } : undefined} />
      {extra}
    </div>
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: FOREST_GROUND }}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: `calc(max(100vw, 100dvh * ${RATIO}) * 1.06)`,
          aspectRatio: `${FOREST_SIZE.w} / ${FOREST_SIZE.h}`,
          transform: "translate(-50%, -50%)",
          filter: soft ? "blur(3px) brightness(0.88) saturate(1.05)" : undefined,
          transition: "filter 0.6s",
        }}
      >
        {layer(
          "back",
          // sunbeams slanting down through the trees
          <div className="absolute inset-0 overflow-hidden mix-blend-screen">
            {[18, 46, 70].map((left, i) => (
              <span key={left} className="forest-beam absolute top-[-10%] h-[90%] w-[9%]" style={{ left: `${left}%`, animationDelay: `${i * -2.2}s` }} />
            ))}
          </div>,
        )}
        {layer("mid")}
        {layer("sails", null, "forest-sails")}
        {layer(
          "crowns",
          // the fairy lights twinkle
          <div className="absolute inset-0">
            {FOREST_BULBS.map(([x, y], i) => (
              <span key={i} className="forest-bulb absolute" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i * -0.37) % 2.4}s` }} />
            ))}
          </div>,
          "forest-sway",
        )}
        {layer("front", null, "forest-sway-front")}
      </div>

      {/* fireflies and falling leaves, in front of everything */}
      {FIREFLIES.map((f, i) => (
        <span key={`f${i}`} className="forest-firefly absolute" style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
      ))}
      {LEAVES.map((l, i) => (
        <svg key={`l${i}`} viewBox="0 0 20 12" className="forest-leaf absolute top-[-4%] w-5" style={{ left: `${l.left}%`, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s` }}>
          <path d="M1 6 Q8 -2 19 6 Q8 14 1 6 Z" fill={l.hue} stroke="#2f5a1a" strokeWidth={0.8} />
          <path d="M2 6 H17" stroke="#2f5a1a" strokeWidth={0.6} />
        </svg>
      ))}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-girl.png" alt="" className="anim-bob absolute bottom-3 left-6 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-boy.png" alt="" className="anim-bob absolute bottom-3 right-8 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
    </div>
  );
}
