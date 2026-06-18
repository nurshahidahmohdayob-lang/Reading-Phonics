"use client";

import { useState } from "react";

/** Full-screen kids' sky wallpaper: glowing sun, puffy clouds drifting at
    different depths, birds, a rainbow, rolling hills, and (on the front page)
    a boy reading in the bottom-right corner. The sky is playable too — tap a
    cloud or the sun and it boings. Everything else clicks straight through. */

const CLOUDS = [
  { top: "8%", scale: 1, duration: 70, delay: -10, opacity: 0.95 },
  { top: "18%", scale: 0.6, duration: 95, delay: -40, opacity: 0.7 },
  { top: "30%", scale: 0.8, duration: 80, delay: -65, opacity: 0.8 },
  { top: "12%", scale: 0.45, duration: 110, delay: -90, opacity: 0.55 },
  { top: "42%", scale: 0.55, duration: 100, delay: -25, opacity: 0.5 },
];

const BIRDS = [
  { top: "6%", duration: 38, delay: -12, size: "text-xl" },
  { top: "24%", duration: 55, delay: -35, size: "text-base" },
];

export default function Backdrop({ playful = false }: { playful?: boolean }) {
  const [boings, setBoings] = useState<Set<number>>(new Set());

  /** id -1 is the sun, 0+ are clouds. */
  function boing(id: number) {
    setBoings((s) => new Set(s).add(id));
    setTimeout(
      () =>
        setBoings((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        }),
      700,
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden dark:opacity-30"
    >
      {/* Sun with a breathing glow — tap it for a boing */}
      <div
        onPointerDown={() => boing(-1)}
        className={`anim-sun pointer-events-auto absolute -right-16 -top-16 h-56 w-56 cursor-pointer rounded-full ${
          boings.has(-1) ? "anim-boing" : ""
        }`}
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #FFFBD6, #FFE066 55%, #FFC93C)",
        }}
      />

      {/* Drifting clouds at different depths — tappable */}
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="cloud-drift"
          style={{
            top: c.top,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            opacity: c.opacity,
          }}
        >
          <div
            onPointerDown={() => boing(i)}
            className={`cloud pointer-events-auto cursor-pointer ${
              boings.has(i) ? "anim-boing" : ""
            }`}
            style={
              {
                "--s": c.scale,
                transform: `scale(${c.scale})`,
              } as React.CSSProperties
            }
          />
        </div>
      ))}

      {/* Birds crossing the sky */}
      {BIRDS.map((b, i) => (
        <span
          key={i}
          className="bird-fly opacity-70"
          style={{
            top: b.top,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <span className={`anim-flutter ${b.size}`}>
            <span className="inline-block" style={{ transform: "scaleX(-1)" }}>
              🐦
            </span>
          </span>
        </span>
      ))}

      {/* Rainbow peeking from behind the hills */}
      <div className="absolute bottom-[4%] left-[6%] h-32 w-64 overflow-hidden opacity-60">
        <div
          className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, transparent 56%, #BFE0FF 57%, #BFE0FF 64%, #BDE7C8 65%, #BDE7C8 72%, #FFE8A3 73%, #FFE8A3 80%, #FFC9D8 81%, #FFC9D8 88%, transparent 89%)",
          }}
        />
      </div>

      {/* Rolling hills along the bottom */}
      <div
        className="absolute -bottom-28 left-[-12%] h-64 w-[75%] rounded-[50%]"
        style={{
          background: "linear-gradient(#C4ECB0, #93D584)",
          boxShadow: "inset 0 14px 24px rgba(255,255,255,0.5)",
        }}
      />
      <div
        className="absolute -bottom-32 right-[-12%] h-72 w-[80%] rounded-[50%]"
        style={{
          background: "linear-gradient(#B0E5C0, #7FCB92)",
          boxShadow: "inset 0 14px 24px rgba(255,255,255,0.45)",
        }}
      />

      {/* A butterfly fluttering over the left hill */}
      <span
        className="anim-flutter absolute bottom-[15%] left-[24%] text-xl opacity-80"
        style={{ animationDuration: "2.4s" }}
      >
        🦋
      </span>

      {/* Front page only: the boy reading, tucked into the bottom-right. */}
      {playful && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/images/reader-boy.png"
          alt=""
          className="anim-bob absolute bottom-2 right-10 hidden h-24 w-auto drop-shadow-md sm:block sm:h-32"
        />
      )}
    </div>
  );
}
