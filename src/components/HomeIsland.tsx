"use client";

/* The home screen as a living island floating in the Galaxy of Words: one
   Blender-rendered island (blender/home_island.py) in space, with cartoon
   planets and a rocket orbiting it, with a landmark for every
   section and a sign on each. Polly the parrot flies to the sign a child
   points at and says its name, and a path of light runs from the lagoon to
   that landmark; tapping a sign sends a ring of light round it and a glow
   under its landmark, then opens the section. Music notes rise from the
   microphone, stars twinkle round the Tricky Words tower, bubbles rise from
   the lagoon, clouds and birds drift over, and the island floats. Sign
   positions come from the render (app/homeIsland.ts). */

import { useEffect, useRef, useState } from "react";
import { ISLAND_IMAGE, ISLAND_LANDMARKS, ISLAND_SPOTS, ISLAND_SIZE } from "@/app/homeIsland";
import { speak } from "@/lib/speak";

/** Where Polly waits when nobody is pointing at anything: by the lagoon. */
const PERCH: [number, number] = [57, 40];

/** The picture is 16:9; the light path is drawn in a 100 × 56.25 box. */
const PATH_Y = ISLAND_SIZE.h / ISLAND_SIZE.w;

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
  const said = useRef<string | null>(null);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = lit ?? hover;
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? "";

  // Polly says the name of the place being pointed at, once it's been
  // pointed at for a moment (so sweeping across the island stays quiet).
  useEffect(() => {
    clearTimeout(sayTimer.current);
    if (!hover || hover === said.current) return;
    sayTimer.current = setTimeout(() => {
      said.current = hover;
      speak(label(hover), 0.95);
    }, 450);
    return () => clearTimeout(sayTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover]);
  useEffect(() => {
    if (!hover) said.current = null;
  }, [hover]);

  const spotOf = (id: string | null) => (id ? ISLAND_SPOTS[id] : undefined);
  const aim = spotOf(target);
  // Polly perches just above and to the right of the sign, clear of its words.
  const polly: [number, number] = aim ? [aim.sign[0] + 6, Math.max(aim.sign[1] - 6.5, 3)] : PERCH;
  const lagoon = ISLAND_SPOTS.lagoon?.foot ?? [50, 44];
  const trail = aim && target !== "interactive"
    ? `M${lagoon[0]} ${lagoon[1] * PATH_Y} Q ${(lagoon[0] + aim.foot[0]) / 2} ${Math.min(lagoon[1], aim.foot[1]) * PATH_Y - 4} ${aim.foot[0]} ${aim.foot[1] * PATH_Y}`
    : null;
  const at = (id: string, k: "sign" | "foot") => ISLAND_SPOTS[id]?.[k];

  const open = (id: string) => {
    if (lit) return;
    setLit(id);
    if (said.current !== id) speak(label(id), 0.95);
    setTimeout(() => {
      onOpen(id);
      setLit(null);
    }, 650);
  };

  return (
    <div className="absolute inset-0">

      {/* the island, as big as fits, with room above for the tallest signs */}
      <div className="absolute inset-0 flex items-center justify-center px-2 pb-2 pt-10" style={{ containerType: "size" }}>
        <div
          className="island-float relative w-full"
          style={{ aspectRatio: `${ISLAND_SIZE.w} / ${ISLAND_SIZE.h}`, maxHeight: "100%", maxWidth: `calc((100cqh - 3rem) * ${ISLAND_SIZE.w / ISLAND_SIZE.h})`, containerType: "inline-size" }}
        >
          {/* the glow under the island, as it floats in space */}
          <span aria-hidden className="island-glow pointer-events-none absolute left-1/2 top-[64%] h-[34%] w-[84%] -translate-x-1/2 rounded-[50%]" />
          <Orbit />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ISLAND_IMAGE} alt="" draggable={false} className="absolute inset-0 z-[1] h-full w-full select-none" />

          {/* The landmarks, each its own 3D animation loop (rendered in
              Blender, frame by frame) standing on its plaza: they turn,
              sway and bounce, and jump and glow when pointed at. Drawn back
              to front so nearer ones overlap farther ones. */}
          {Object.entries(ISLAND_LANDMARKS)
            .sort(([a], [b]) => (ISLAND_SPOTS[a]?.foot[1] ?? 0) - (ISLAND_SPOTS[b]?.foot[1] ?? 0))
            .map(([id, lm], i) => {
              const sec = sections.find((x) => x.id === id);
              const foot = ISLAND_SPOTS[id]?.foot;
              const on = target === id;
              return (
                <div key={`lm-${id}`} className="contents">
                  {foot && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-black/30 blur-[3px]"
                      style={{ left: `${foot[0]}%`, top: `${foot[1]}%`, width: `${lm.w * 0.6}%`, height: `${lm.w * 0.2}%` }}
                    />
                  )}
                  <div
                    onPointerEnter={sec ? () => setHover(id) : undefined}
                    onPointerLeave={sec ? () => setHover((h) => (h === id ? null : h)) : undefined}
                    onClick={sec ? () => open(id) : undefined}
                    aria-hidden
                    className={`island-lm absolute z-[1] ${sec ? "cursor-pointer" : "pointer-events-none"} ${on ? (lit === id ? "island-lm-lit" : "island-lm-on") : ""}`}
                    style={{ left: `${lm.x}%`, top: `${lm.y}%`, width: `${lm.w}%`, height: `${lm.h}%`, ["--glow" as string]: sec?.glow ?? "transparent", animationDelay: `${i * -0.37}s` }}
                  >
                    <div className="h-full w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/home-landmarks/${id}.webp?v=${ISLAND_IMAGE.split("v=")[1] ?? ""}`}
                        alt=""
                        draggable={false}
                        className="island-lm-strip block h-full max-w-none select-none"
                        style={{ width: `${lm.frames * 100}%`, animationTimingFunction: `steps(${lm.frames})`, animationDuration: `${["tricky", "tracker", "storyplay"].includes(id) ? 3.2 : 2.2}s`, animationDelay: `${i * -0.29}s` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

          {/* life on the island: notes from the microphone, stars round the
              tower, bubbles in the lagoon */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
            {at("guided", "foot") &&
              ["♪", "♫", "♪"].map((n, i) => (
                <span
                  key={`n${i}`}
                  className="island-note absolute"
                  style={{ left: `${at("guided", "foot")![0] + (i - 1) * 2.4}%`, top: `${at("guided", "foot")![1] - 10}%`, animationDelay: `${i * -1.05}s` }}
                >
                  {n}
                </span>
              ))}
            {at("tricky", "sign") &&
              [[-3, 6], [3.5, 2], [0, -3], [-4.5, 0], [4.5, 9]].map(([dx, dy], i) => (
                <span
                  key={`t${i}`}
                  className="island-twinkle absolute"
                  style={{ left: `${at("tricky", "sign")![0] + dx}%`, top: `${at("tricky", "sign")![1] + dy}%`, animationDelay: `${i * -0.35}s` }}
                />
              ))}
            {[[-7, 3], [6, 4], [-3, 7], [8, 0]].map(([dx, dy], i) => (
              <span
                key={`b${i}`}
                className="island-bubble absolute"
                style={{ left: `${lagoon[0] + dx}%`, top: `${lagoon[1] + dy}%`, animationDelay: `${i * -0.65}s` }}
              />
            ))}
          </div>

          {/* the path of light from the lagoon to the place being pointed at */}
          {trail && (
            <svg aria-hidden className="island-trail pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible" viewBox={`0 0 100 ${100 * PATH_Y}`} preserveAspectRatio="none">
              <path d={trail} />
            </svg>
          )}

          {/* Polly the parrot, the island's guide */}
          <div
            aria-hidden
            className="island-polly pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ left: `${polly[0]}%`, top: `${polly[1]}%` }}
          >
            <span className={`block text-[max(26px,3.6cqw)] leading-none ${target ? "island-polly-flap" : "island-polly-idle"}`}>🦜</span>
            <span className="absolute bottom-[85%] left-[70%] whitespace-nowrap rounded-[1cqw] bg-white px-[0.9cqw] py-[0.5cqw] text-[max(11px,1.1cqw)] font-extrabold text-zinc-700 shadow-md">
              {target ? `Let's do ${label(target)}!` : "Hi! Pick a place!"}
            </span>
          </div>

          {/* light under the landmark being pointed at or opened */}
          {sections.map((s) => {
            const spot = ISLAND_SPOTS[s.id];
            if (!spot || (hover !== s.id && lit !== s.id)) return null;
            return (
              <span
                key={`halo-${s.id}`}
                aria-hidden
                className={`pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-[50%] ${lit === s.id ? "island-halo-burst" : "island-halo"}`}
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
                  className={`island-sign relative flex items-center gap-[0.6cqw] whitespace-nowrap rounded-full bg-white/95 py-[0.4cqw] pl-[0.4cqw] pr-[1.1cqw] shadow-[0_0.4cqw_1cqw_rgba(0,0,0,0.25)] ring-2 ring-white ${isLit ? "island-sign-lit" : ""}`}
                  style={{ ["--glow" as string]: s.glow }}
                >
                  <span className="grid h-[3.4cqw] w-[3.4cqw] min-h-8 min-w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-inner">
                    {icon(s.id)}
                  </span>
                  <span className={`text-[max(13px,1.5cqw)] font-extrabold leading-none ${s.text}`}>{s.label}</span>
                  {isLit && <span aria-hidden className="island-ring pointer-events-none absolute -inset-1 rounded-full" />}
                </span>
                {/* the post down to the landmark */}
                <span aria-hidden className="mx-auto block h-[1.2cqw] w-[0.25cqw] min-w-[2px] rounded-b bg-white/90 shadow" />
              </button>
            );
          })}
        </div>
      </div>

      {/* a satellite and a sparkle passing over */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="island-bird absolute top-[14%] text-2xl" style={{ animationDuration: "34s" }}>🛰️</span>
        <span className="island-bird absolute top-[22%] text-xl" style={{ animationDuration: "40s", animationDelay: "-15s" }}>✨</span>
      </div>
    </div>
  );
}

/** Cartoon planets and a rocket on an orbit round the island: behind it on
    the far side of the orbit, in front of it on the near side. */
const BODIES = [
  { kind: "planet", size: 4.2, colour: "#ff6fb1", ring: false, offset: 0 },
  { kind: "planet", size: 5.6, colour: "#4fc3ff", ring: true, offset: 2.1 },
  { kind: "rocket", size: 3.4, colour: "", ring: false, offset: 3.4 },
  { kind: "planet", size: 3.4, colour: "#ffc93c", ring: false, offset: 4.6 },
] as const;

function Orbit() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const place = (now: number) => {
      const t = calm ? 0 : (now - start) / 1000;
      BODIES.forEach((b, i) => {
        const el = refs.current[i];
        if (!el) return;
        const a = t * 0.16 + b.offset;
        const x = 50 + Math.cos(a) * 57;
        const y = 60 + Math.sin(a) * 19;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        // Far side of the orbit (top) is behind the island; near side in front.
        el.style.zIndex = Math.sin(a) < 0 ? "0" : "3";
        el.style.scale = String(0.8 + 0.25 * (Math.sin(a) + 1) / 2);
        if (b.kind === "rocket") el.style.rotate = `${(Math.atan2(Math.cos(a) * 19, -Math.sin(a) * 57) * 180) / Math.PI + 45}deg`;
      });
      if (!calm) raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <span aria-hidden className="island-orbit pointer-events-none absolute left-[-7%] top-[41%] z-0 h-[38%] w-[114%] rounded-[50%]" />
      {BODIES.map((b, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-hidden
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${b.kind === "rocket" ? "island-rocket" : "island-planet"} ${b.ring ? "island-planet-ringed" : ""}`}
          style={{ width: `${b.size}cqw`, height: `${b.size}cqw`, ["--c" as string]: b.colour, fontSize: `${b.size}cqw` }}
        >
          {b.kind === "rocket" ? "🚀" : null}
        </span>
      ))}
    </>
  );
}
