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

const LEAVES = [
  { left: "44px", top: "26px", size: 18, dur: 4.6, delay: 0 },
  { left: "78px", top: "16px", size: 15, dur: 5.8, delay: -1.6 },
  { left: "112px", top: "34px", size: 17, dur: 5.0, delay: -3.1 },
  { left: "62px", top: "46px", size: 14, dur: 6.4, delay: -2.4 },
  { left: "96px", top: "22px", size: 16, dur: 5.3, delay: -0.8 },
  { left: "130px", top: "40px", size: 14, dur: 4.9, delay: -3.8 },
  { left: "34px", top: "40px", size: 13, dur: 6.0, delay: -1.1 },
  { left: "120px", top: "18px", size: 15, dur: 5.5, delay: -4.4 },
  { left: "54px", top: "60px", size: 12, dur: 6.6, delay: -2.9 },
  { left: "88px", top: "52px", size: 16, dur: 4.7, delay: -5.2 },
];

const BUTTERFLIES = [
  { left: "6%", top: "16%", size: 30, drift: 11, flap: 0.4, delay: 0, hue: 0 },
  { left: "86%", top: "12%", size: 24, drift: 13, flap: 0.5, delay: -2.5, hue: 55 },
  { left: "48%", top: "8%", size: 28, drift: 10, flap: 0.36, delay: -4, hue: 130 },
  { left: "90%", top: "58%", size: 26, drift: 14, flap: 0.46, delay: -1.5, hue: 190 },
  { left: "5%", top: "66%", size: 32, drift: 12, flap: 0.42, delay: -6, hue: 265 },
  { left: "72%", top: "80%", size: 22, drift: 11, flap: 0.44, delay: -3, hue: 315 },
  { left: "32%", top: "84%", size: 28, drift: 12, flap: 0.38, delay: -7.5, hue: 95 },
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
    <>
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

      {/* Distant mountains rising behind the left of the scene (behind the girl) */}
      <svg
        className="absolute bottom-[6%] left-[-6%] w-[60%] max-w-xl"
        viewBox="0 0 480 300"
        aria-hidden
      >
        <path d="M0 300 L80 60 L150 150 L240 30 L320 140 L400 80 L480 300 Z" fill="#8FBF7F" />
        <path d="M240 30 L214 74 L266 74 Z" fill="#EAF6EA" />
        <path d="M-20 300 L70 120 L160 190 L250 90 L340 180 L420 120 L500 300 Z" fill="#5FA06B" />
        <path d="M250 90 L228 122 L272 122 Z" fill="#EAF6EA" />
      </svg>

      {/* Distant mountains behind the boy on the right (mirrored) */}
      <svg
        className="absolute bottom-[6%] right-[-6%] w-[54%] max-w-lg -scale-x-100"
        viewBox="0 0 480 300"
        aria-hidden
      >
        <path d="M0 300 L80 60 L150 150 L240 30 L320 140 L400 80 L480 300 Z" fill="#8FBF7F" />
        <path d="M240 30 L214 74 L266 74 Z" fill="#EAF6EA" />
        <path d="M-20 300 L70 120 L160 190 L250 90 L340 180 L420 120 L500 300 Z" fill="#5FA06B" />
        <path d="M250 90 L228 122 L272 122 Z" fill="#EAF6EA" />
      </svg>

      {/* A tree standing back with the mountains (behind the hills) */}
      {playful && (
        <div className="absolute bottom-[6%] left-[36%] z-10 hidden flex-col items-center sm:flex">
          <span
            className="anim-sway block select-none leading-none drop-shadow-md"
            style={{ fontSize: "108px", animationDuration: "5s" }}
          >
            🌳
          </span>
          <span
            className="-mt-7 h-20 w-6 rounded-b-md shadow-md"
            style={{ background: "linear-gradient(to bottom, #8B5A2B, #5C3A1E)" }}
          />
          {LEAVES.map((l, i) => (
            <span
              key={i}
              className="leaf-fall select-none"
              style={{
                left: l.left,
                top: l.top,
                fontSize: `${l.size}px`,
                animationDuration: `${l.dur}s`,
                animationDelay: `${l.delay}s`,
              }}
            >
              🍂
            </span>
          ))}
        </div>
      )}

      {/* A second tree in the back on the right (boy's side), behind the hills */}
      {playful && (
        <div className="absolute bottom-[5%] right-3 z-10 hidden flex-col items-center sm:flex">
          <span
            className="anim-sway block select-none leading-none drop-shadow-md"
            style={{ fontSize: "140px", animationDuration: "4.5s" }}
          >
            🌳
          </span>
          <span
            className="-mt-8 h-24 w-7 rounded-b-md shadow-md"
            style={{ background: "linear-gradient(to bottom, #8B5A2B, #5C3A1E)" }}
          />
          {LEAVES.map((l, i) => (
            <span
              key={i}
              className="leaf-fall select-none"
              style={{
                left: l.left,
                top: l.top,
                fontSize: `${l.size}px`,
                animationDuration: `${l.dur}s`,
                animationDelay: `${l.delay}s`,
              }}
            >
              🍂
            </span>
          ))}
        </div>
      )}

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

      {/* Front page only: swaying trees and two kids reading in the corners. */}
      {playful && (
        <>
          <span
            className="anim-sway absolute bottom-[8%] left-[15%] hidden select-none drop-shadow-md sm:block"
            style={{ fontSize: "66px" }}
          >
            🌳
          </span>
          <span
            className="anim-sway absolute bottom-[11%] right-[28%] hidden select-none drop-shadow-md sm:block"
            style={{ fontSize: "52px", animationDuration: "6.5s", animationDelay: "-1.5s" }}
          >
            🌲
          </span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/reader-girl.png"
            alt=""
            className="anim-bob absolute bottom-2 left-8 z-20 hidden h-24 w-auto drop-shadow-md sm:block sm:h-32"
            style={{ animationDelay: "-0.8s" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/reader-boy.png"
            alt=""
            className="anim-bob absolute bottom-2 right-10 z-20 hidden h-24 w-auto drop-shadow-md sm:block sm:h-32"
          />
        </>
      )}
    </div>

      {/* Butterflies fly above the tools too, so they roam the whole page. */}
      {playful && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
        >
          {BUTTERFLIES.map((b, i) => (
            <div
              key={i}
              className="butterfly select-none"
              style={{
                left: b.left,
                top: b.top,
                fontSize: `${b.size}px`,
                animationDuration: `${b.drift}s`,
                animationDelay: `${b.delay}s`,
                filter: `hue-rotate(${b.hue}deg) saturate(1.3) drop-shadow(0 2px 3px rgba(0,0,0,.2))`,
              }}
            >
              <span style={{ animationDuration: `${b.flap}s` }}>🦋</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
