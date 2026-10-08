"use client";

/* The home screen as an island: one Blender-rendered island in a moving sea
   (blender/home_island.py), with a landmark for every section and a sign on
   each. Signs bob gently; hovering lifts one and lights its landmark; tapping
   one sends a ring of light round it and a glow under its landmark, then
   opens the section. Clouds and birds drift over, the sea shimmers and the
   island floats. Sign positions come from the render (app/homeIsland.ts). */

import { useState } from "react";
import { ISLAND_SPOTS, ISLAND_SIZE } from "@/app/homeIsland";

export type IslandSection = {
  id: string;
  label: string;
  blurb: string;
  /** Tailwind text colour for the label, e.g. "text-pink-700". */
  text: string;
  /** The glow colour for this section. */
  glow: string;
};

export default function HomeIsland({
  sections,
  icon,
  onOpen,
}: {
  sections: IslandSection[];
  icon: (id: string) => React.ReactNode;
  onOpen: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);

  const open = (id: string) => {
    if (lit) return;
    setLit(id);
    setTimeout(() => {
      onOpen(id);
      setLit(null);
    }, 650);
  };

  return (
    <div className="island-sea absolute inset-0 overflow-hidden rounded-[2rem] shadow-[inset_0_0_60px_rgba(0,40,90,0.35)] ring-4 ring-white/60">
      {/* sea sparkle and swell */}
      <div aria-hidden className="island-swell absolute inset-0" />
      <div aria-hidden className="island-sparkle absolute inset-0" />

      {/* the island, as big as fits */}
      <div className="absolute inset-0 flex items-center justify-center p-2" style={{ containerType: "size" }}>
        <div
          className="island-float relative w-full"
          style={{ aspectRatio: `${ISLAND_SIZE.w} / ${ISLAND_SIZE.h}`, maxHeight: "100%", maxWidth: `calc((100cqh - 1rem) * ${ISLAND_SIZE.w / ISLAND_SIZE.h})`, containerType: "inline-size" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home-island.webp" alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />

          {/* light under the landmark being pointed at or opened */}
          {sections.map((s) => {
            const spot = ISLAND_SPOTS[s.id];
            if (!spot || (hover !== s.id && lit !== s.id)) return null;
            return (
              <span
                key={`halo-${s.id}`}
                aria-hidden
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] ${lit === s.id ? "island-halo-burst" : "island-halo"}`}
                style={{ left: `${spot.foot[0]}%`, top: `${spot.foot[1]}%`, width: "11cqw", height: "5.5cqw", background: `radial-gradient(closest-side, ${s.glow}, transparent)` }}
              />
            );
          })}

          {sections.map((s, i) => {
            const spot = ISLAND_SPOTS[s.id];
            if (!spot) return null;
            const isLit = lit === s.id;
            return (
              <button
                key={s.id}
                onClick={() => open(s.id)}
                onPointerEnter={() => setHover(s.id)}
                onPointerLeave={() => setHover((h) => (h === s.id ? null : h))}
                onFocus={() => setHover(s.id)}
                onBlur={() => setHover((h) => (h === s.id ? null : h))}
                title={s.blurb}
                className="island-sign-wrap absolute z-10 -translate-x-1/2 -translate-y-full outline-none"
                style={{ left: `${spot.sign[0]}%`, top: `${spot.sign[1]}%`, animationDelay: `${(i % 5) * -0.7}s` }}
              >
                <span
                  className={`island-sign relative flex items-center gap-[0.5cqw] whitespace-nowrap rounded-full bg-white/95 py-[0.35cqw] pl-[0.35cqw] pr-[0.9cqw] shadow-[0_0.4cqw_1cqw_rgba(0,0,0,0.25)] ring-2 ring-white ${isLit ? "island-sign-lit" : ""}`}
                  style={{ ["--glow" as string]: s.glow }}
                >
                  <span className="grid h-[2.6cqw] w-[2.6cqw] min-h-7 min-w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-inner">
                    {icon(s.id)}
                  </span>
                  <span className={`text-[max(11px,1.05cqw)] font-extrabold leading-none ${s.text}`}>{s.label}</span>
                  {isLit && <span aria-hidden className="island-ring pointer-events-none absolute -inset-1 rounded-full" />}
                </span>
                {/* the post down to the landmark */}
                <span aria-hidden className="mx-auto block h-[1.2cqw] w-[0.25cqw] min-w-[2px] rounded-b bg-white/90 shadow" />
              </button>
            );
          })}
        </div>
      </div>

      {/* clouds and birds passing over */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="island-cloud absolute top-[6%] text-5xl opacity-90" style={{ animationDuration: "48s" }}>☁️</span>
        <span className="island-cloud absolute top-[70%] text-6xl opacity-80" style={{ animationDuration: "64s", animationDelay: "-30s" }}>☁️</span>
        <span className="island-cloud absolute top-[38%] text-4xl opacity-70" style={{ animationDuration: "56s", animationDelay: "-12s" }}>☁️</span>
        <span className="island-bird absolute top-[14%] text-2xl" style={{ animationDuration: "22s" }}>🕊️</span>
        <span className="island-bird absolute top-[22%] text-xl" style={{ animationDuration: "26s", animationDelay: "-9s" }}>🕊️</span>
        <span className="island-boat absolute bottom-[6%] text-4xl" style={{ animationDuration: "40s" }}>⛵</span>
        <span className="island-fish absolute bottom-[14%] left-[8%] text-2xl">🐬</span>
      </div>
    </div>
  );
}
