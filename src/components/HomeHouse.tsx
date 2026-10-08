"use client";

/* The home screen as a reading house: one Blender-rendered doll's house with
   its roof off (blender/home_house.py), on a floating island in the forest.
   Every section has a room (or a spot in the garden) with a sign on it.
   Polly the parrot flies to the sign a child points at and says its name, and
   a path of light runs from the front door to that room; tapping a sign sends
   a ring of light round it and a glow over its floor, then opens the section.
   Music notes rise from the music room, stars twinkle in the observatory,
   and the fountain bubbles. Sign positions
   come from the render (app/homeHouse.ts). */

import { useEffect, useRef, useState } from "react";
import { HOUSE_IMAGE, HOUSE_SIZE, HOUSE_SPOTS } from "@/app/homeHouse";
import { speak } from "@/lib/speak";

const RATIO = HOUSE_SIZE.w / HOUSE_SIZE.h;
/** The light path is drawn in a 100-wide box of the picture's shape. */
const PATH_Y = HOUSE_SIZE.h / HOUSE_SIZE.w;

export type HouseSection = {
  id: string;
  label: string;
  blurb: string;
  /** Tailwind text colour for the label, e.g. "text-pink-700". */
  text: string;
  /** The glow colour for this section. */
  glow: string;
};

export default function HomeHouse({
  sections,
  icon,
  onOpen,
}: {
  sections: HouseSection[];
  icon: (id: string) => React.ReactNode;
  onOpen: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  const said = useRef<string | null>(null);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = lit ?? hover;
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? "";

  // Polly says the name of the room being pointed at, once it's been pointed
  // at for a moment (so sweeping across the house stays quiet).
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

  const at = (id: string, k: "sign" | "foot") => HOUSE_SPOTS[id]?.[k];
  const aim = target ? HOUSE_SPOTS[target] : undefined;
  const door = at("hub", "foot") ?? [40, 80];
  // Polly waits by the front door, and perches just above and to the right of
  // the sign being pointed at, clear of its words.
  const polly: [number, number] = aim ? [aim.sign[0] + 5, Math.max(aim.sign[1] - 5.5, 3)] : [door[0] + 3, door[1] - 6];
  const trail = aim
    ? `M${door[0]} ${door[1] * PATH_Y} Q ${(door[0] + aim.foot[0]) / 2} ${Math.min(door[1], aim.foot[1]) * PATH_Y - 6} ${aim.foot[0]} ${aim.foot[1] * PATH_Y}`
    : null;

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
    // The house's island floats over the forest glade (components/ForestBackdrop),
    // as big as the screen allows, cropping a little island off the sides if
    // it must, never the house.
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `min(max(100vw, 100dvh * ${RATIO}), 1.3 * min(100vw, 100dvh * ${RATIO}))`,
          aspectRatio: `${HOUSE_SIZE.w} / ${HOUSE_SIZE.h}`,
          containerType: "inline-size",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HOUSE_IMAGE} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />

        {/* life in the house: notes from the music room, stars in the
            observatory, bubbles from the fountain */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {at("soundout", "foot") &&
            ["♪", "♫", "♪"].map((n, i) => (
              <span
                key={`n${i}`}
                className="house-note absolute"
                style={{ left: `${at("soundout", "foot")![0] - 3 + i * 2}%`, top: `${at("soundout", "foot")![1] - 6}%`, animationDelay: `${i * -1.05}s` }}
              >
                {n}
              </span>
            ))}
          {at("tricky", "foot") &&
            [[-3, -3], [2.5, -6], [0, -9], [-4.5, -7], [4, -2]].map(([dx, dy], i) => (
              <span
                key={`t${i}`}
                className="house-twinkle absolute"
                style={{ left: `${at("tricky", "foot")![0] + dx}%`, top: `${at("tricky", "foot")![1] + dy}%`, animationDelay: `${i * -0.35}s` }}
              />
            ))}
          {at("fountain", "sign") &&
            [[-1.5, 0], [1.2, 0.6], [0, -0.5], [2, -0.2]].map(([dx, dy], i) => (
              <span
                key={`b${i}`}
                className="house-bubble absolute"
                style={{ left: `${at("fountain", "sign")![0] + dx}%`, top: `${at("fountain", "sign")![1] + dy}%`, animationDelay: `${i * -0.65}s` }}
              />
            ))}
        </div>

        {/* light over the floor of the room being pointed at or opened */}
        {sections.map((s) => {
          const foot = at(s.id, "foot");
          if (!foot || (hover !== s.id && lit !== s.id)) return null;
          return (
            <span
              key={`halo-${s.id}`}
              aria-hidden
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] ${lit === s.id ? "house-halo-burst" : "house-halo"}`}
              style={{ left: `${foot[0]}%`, top: `${foot[1]}%`, width: "11cqw", height: "6cqw", background: `radial-gradient(closest-side, ${s.glow}, transparent)` }}
            />
          );
        })}

        {/* the path of light from the front door to the room being pointed at */}
        {trail && (
          <svg aria-hidden className="house-trail pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 100 ${100 * PATH_Y}`} preserveAspectRatio="none">
            <path d={trail} />
          </svg>
        )}

        {sections.map((s, i) => {
          const spot = HOUSE_SPOTS[s.id];
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
              className="house-sign-wrap absolute z-10 -translate-x-1/2 -translate-y-full outline-none"
              style={{ left: `${spot.sign[0]}%`, top: `${spot.sign[1]}%`, animationDelay: `${(i % 5) * -0.7}s` }}
            >
              <span
                className={`house-sign relative flex items-center gap-[0.5cqw] whitespace-nowrap rounded-full bg-white/95 py-[0.35cqw] pl-[0.35cqw] pr-[0.9cqw] shadow-[0_0.35cqw_0.9cqw_rgba(0,0,0,0.3)] ring-2 ring-white ${isLit ? "house-sign-lit" : ""}`}
                style={{ ["--glow" as string]: s.glow }}
              >
                <span className="grid h-[2.2cqw] w-[2.2cqw] min-h-7 min-w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-inner">
                  {icon(s.id)}
                </span>
                <span className={`text-[max(13px,1cqw)] font-extrabold leading-none ${s.text}`}>{s.label}</span>
                {isLit && <span aria-hidden className="house-ring pointer-events-none absolute -inset-1 rounded-full" />}
              </span>
              {/* the post down into the room */}
              <span aria-hidden className="mx-auto block h-[1cqw] w-[0.22cqw] min-w-[2px] rounded-b bg-white/90 shadow" />
            </button>
          );
        })}

        {/* Polly the parrot, the house's guide */}
        <div
          aria-hidden
          className="house-polly pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: `${polly[0]}%`, top: `${polly[1]}%` }}
        >
          <span className={`block text-[max(26px,2.8cqw)] leading-none ${target ? "house-polly-flap" : "house-polly-idle"}`}>🦜</span>
          <span className="absolute bottom-[85%] left-[70%] whitespace-nowrap rounded-[0.8cqw] bg-white px-[0.7cqw] py-[0.4cqw] text-[max(11px,0.95cqw)] font-extrabold text-zinc-700 shadow-md">
            {target ? `Let's do ${label(target)}!` : "Hi! Pick a room!"}
          </span>
        </div>
      </div>
    </div>
  );
}
