"use client";

/* The home screen: a tidy board of bright tiles, one per section, in a
   frosted frame over the softly blurred forest glade
   (components/ForestBackdrop). Each tile is its section's colour, with its
   picture and name. Pointing at a tile lifts it and Polly says its name;
   tapping it sends a ring of light round it, then opens the section. */

import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/speak";

export type HomeSection = {
  id: string;
  label: string;
  blurb: string;
  /** Tailwind gradient stops for the tile, e.g. "from-[#FFA3CF] to-[#FF75B5]". */
  bg: string;
  /** Tailwind text colour for the label, e.g. "text-pink-900". */
  text: string;
  /** The glow colour for this section. */
  glow: string;
};

export default function HomeSigns({
  sections,
  icon,
  onOpen,
}: {
  sections: HomeSection[];
  icon: (id: string) => React.ReactNode;
  onOpen: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  const said = useRef<string | null>(null);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = lit ?? hover;
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? "";

  // Polly says the name of the tile being pointed at, once it's been pointed
  // at for a moment (so sweeping across the board stays quiet).
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
    <div className="absolute inset-0 flex items-center justify-center px-2 pb-3 pt-8">
      {/* five tiles to a row, the last row centred */}
      <div className="home-board relative flex h-full max-h-[38rem] w-full max-w-6xl flex-wrap content-stretch justify-center gap-4 rounded-[2rem] p-5">
        {sections.map((s) => {
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
              className={`home-tile relative flex h-[calc((100%-2rem)/3)] min-h-0 basis-[calc((100%-4rem)/5)] flex-col items-center justify-center gap-2 rounded-[1.4rem] bg-gradient-to-br ${s.bg} px-2 py-2 outline-none ${isLit ? "home-tile-lit" : ""}`}
              style={{ ["--glow" as string]: s.glow }}
            >
              <span className="grid aspect-square h-[48%] max-h-20 min-h-10 shrink-0 place-items-center rounded-full bg-white/90 p-2 shadow-[inset_0_-3px_0_rgba(0,0,0,0.08),0_3px_8px_rgba(0,0,0,0.15)]">
                {icon(s.id)}
              </span>
              <span className={`text-center text-base font-extrabold leading-tight lg:text-lg ${s.text}`}>{s.label}</span>
              {isLit && <span aria-hidden className="home-ring pointer-events-none absolute -inset-1 rounded-[1.6rem]" />}
            </button>
          );
        })}

        {/* Polly the parrot perches on the board's corner and says where you're going */}
        <div aria-hidden className="pointer-events-none absolute -top-10 right-4 flex items-end gap-1">
          <span className="mb-3 rounded-xl bg-white px-2.5 py-1.5 text-sm font-extrabold text-zinc-700 shadow-md">
            {target ? `Let's do ${label(target)}!` : "Hi! Pick a place!"}
          </span>
          <span className={`block text-4xl leading-none ${target ? "home-polly-flap" : "home-polly-idle"}`}>🦜</span>
        </div>
      </div>
    </div>
  );
}
