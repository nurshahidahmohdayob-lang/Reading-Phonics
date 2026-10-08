"use client";

/* The home screen: a sign for every section, set out in staggered rows over
   the forest glade (components/ForestBackdrop). Polly the parrot flies to
   the sign a child points at and says its name; tapping a sign sends a ring
   of light round it, then opens the section. */

import { useEffect, useRef, useState } from "react";
import { speak } from "@/lib/speak";

export type HomeSection = {
  id: string;
  label: string;
  blurb: string;
  /** Tailwind text colour for the label, e.g. "text-pink-700". */
  text: string;
  /** The glow colour for this section. */
  glow: string;
};

/** Where each sign goes, in % of the area: rows of 4 and 3 in turn, the
    rows of 3 sitting between the signs of the rows of 4. */
function layout(n: number): [number, number][] {
  const rows: number[] = [];
  for (let left = n, k = 0; left > 0; k++) {
    rows.push(Math.min(left, k % 2 === 0 ? 4 : 3));
    left -= rows[rows.length - 1];
  }
  const spots: [number, number][] = [];
  rows.forEach((count, r) => {
    const y = rows.length === 1 ? 45 : 10 + (r * 68) / (rows.length - 1);
    for (let i = 0; i < count; i++) spots.push([50 + (i - (count - 1) / 2) * 25.5, y]);
  });
  return spots;
}

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
  const spots = layout(sections.length);
  const spotOf = (id: string | null) => {
    const i = sections.findIndex((s) => s.id === id);
    return i >= 0 ? spots[i] : null;
  };

  // Polly says the name of the sign being pointed at, once it's been pointed
  // at for a moment (so sweeping across the signs stays quiet).
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

  // Polly waits at the bottom, and perches just above and to the right of
  // the sign being pointed at.
  const aim = spotOf(target);
  const polly: [number, number] = aim ? [aim[0] + 7, aim[1] - 6] : [88, 98];

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
      {sections.map((s, i) => {
        const [x, y] = spots[i];
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
            className="home-sign-wrap absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * -0.7}s` }}
          >
            <span
              className={`home-sign relative flex items-center gap-3 whitespace-nowrap rounded-full bg-white/95 py-2 pl-2 pr-5 shadow-[0_6px_16px_rgba(20,40,10,0.35)] ring-[3px] ring-white ${isLit ? "home-sign-lit" : ""}`}
              style={{ ["--glow" as string]: s.glow }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-inner lg:h-11 lg:w-11">{icon(s.id)}</span>
              <span className={`text-base font-extrabold leading-none lg:text-lg ${s.text}`}>{s.label}</span>
              {isLit && <span aria-hidden className="home-ring pointer-events-none absolute -inset-1 rounded-full" />}
            </span>
          </button>
        );
      })}

      {/* Polly the parrot, the guide */}
      <div aria-hidden className="home-polly pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full" style={{ left: `${polly[0]}%`, top: `${polly[1]}%` }}>
        <span className={`block text-4xl leading-none ${target ? "home-polly-flap" : "home-polly-idle"}`}>🦜</span>
        <span className={`absolute bottom-[85%] ${polly[0] > 60 ? "right-[70%]" : "left-[70%]"} whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-sm font-extrabold text-zinc-700 shadow-md`}>
          {target ? `Let's do ${label(target)}!` : "Hi! Pick a sign!"}
        </span>
      </div>
    </div>
  );
}
