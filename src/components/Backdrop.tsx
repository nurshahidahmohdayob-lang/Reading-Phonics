"use client";

import { useState } from "react";

/** Full-screen kids' sky wallpaper: glowing sun, puffy clouds drifting at
    different depths, birds, a rainbow, rolling hills and little kids. The
    scenery is playable too — tap a cloud or the sun and it boings, tap a kid
    and a heart pops up. Everything else clicks straight through. */

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
  const [hearts, setHearts] = useState<Record<string, number>>({});

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

  function popHeart(kid: string) {
    setHearts((h) => ({ ...h, [kid]: Date.now() }));
    setTimeout(
      () =>
        setHearts((h) => {
          const next = { ...h };
          delete next[kid];
          return next;
        }),
      950,
    );
  }

  function Heart({ id }: { id: string }) {
    if (!(id in hearts)) return null;
    return (
      <span
        key={hearts[id]}
        className="anim-heart-pop pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
      >
        ❤️
      </span>
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

      {/* Front page only: a kid flying a kite on the left hill */}
      {playful && (
        <div
          onPointerDown={() => popHeart("kite")}
          className="pointer-events-auto absolute bottom-[11%] left-[8%] hidden w-[70px] cursor-pointer sm:block"
        >
          <Heart id="kite" />
          {/* kite on its string, swaying from the kid's hand */}
          <div className="kite-sway absolute -top-28 left-9 h-28 w-px">
            <div className="h-full w-[2px] bg-white/80" />
            <div
              className="absolute -top-7 left-1/2 h-9 w-9 -translate-x-1/2 rotate-45 rounded-[6px] border-2 border-white"
              style={{ background: "linear-gradient(135deg, #FF9FBE, #FFC93C)" }}
            />
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/90" />
            <div className="absolute top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/70" />
          </div>
          <div className="absolute -bottom-1 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-emerald-900/15 blur-[2px]" />
          <div className="relative mx-auto h-10 w-10 rounded-full" style={{ background: "#F3C29B" }}>
            <div className="absolute -top-1 -left-0.5 h-6 w-[44px] rounded-t-full" style={{ background: "#2F2A26" }} />
            <div className="absolute left-2 top-[22px] h-[3px] w-2 rounded-b-full bg-[#2F2A26]" />
            <div className="absolute right-2 top-[22px] h-[3px] w-2 rounded-b-full bg-[#2F2A26]" />
          </div>
          <div className="mx-auto -mt-1 h-10 w-[60px] rounded-t-[1.6rem]" style={{ background: "#7EC8E3" }} />
          <div className="mx-auto flex w-8 justify-between">
            <div className="h-3.5 w-2 rounded-b-full" style={{ background: "#3D6B8E" }} />
            <div className="h-3.5 w-2 rounded-b-full" style={{ background: "#3D6B8E" }} />
          </div>
        </div>
      )}

      {/* Front page only: a kid bouncing a ball */}
      {playful && (
        <div
          onPointerDown={() => popHeart("ball")}
          className="pointer-events-auto absolute bottom-[7%] left-[30%] hidden w-[64px] cursor-pointer lg:block"
        >
          <Heart id="ball" />
          <div className="absolute -bottom-1 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full bg-emerald-900/15 blur-[2px]" />
          <div className="kid-bounce">
            <div className="relative mx-auto h-9 w-9 rounded-full" style={{ background: "#E8B58A" }}>
              <div className="absolute -top-1.5 left-0 h-5 w-9 rounded-t-full" style={{ background: "#8A4B26" }} />
              <div className="absolute left-2 top-[19px] h-[3px] w-2 rounded-b-full bg-[#6B4226]" />
              <div className="absolute right-2 top-[19px] h-[3px] w-2 rounded-b-full bg-[#6B4226]" />
            </div>
            <div className="mx-auto -mt-1 h-9 w-[52px] rounded-t-[1.4rem]" style={{ background: "#A8E6A1" }} />
            <div className="mx-auto flex w-7 justify-between">
              <div className="h-3 w-2 rounded-b-full" style={{ background: "#5B8C5A" }} />
              <div className="h-3 w-2 rounded-b-full" style={{ background: "#5B8C5A" }} />
            </div>
          </div>
          <div
            className="ball-bounce absolute -right-7 bottom-0 h-6 w-6 rounded-full border-2 border-white"
            style={{ background: "radial-gradient(circle at 30% 30%, #FF8A80, #E5484D)" }}
          />
        </div>
      )}

      {/* A kid sitting on the hill, lost in a book */}
      <div
        onPointerDown={() => popHeart("reader")}
        className="kid-rock pointer-events-auto absolute bottom-[10%] right-[14%] hidden w-[110px] cursor-pointer sm:block"
      >
        <Heart id="reader" />
        {/* grass shadow */}
        <div className="absolute -bottom-2 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-emerald-900/15 blur-[2px]" />
        {/* head */}
        <div
          className="relative mx-auto h-12 w-12 rounded-full"
          style={{ background: "#FFD9B3" }}
        >
          <div
            className="absolute -top-1.5 -left-0.5 h-8 w-[52px] rounded-t-full"
            style={{ background: "#6B4226" }}
          />
          <div className="absolute left-2.5 top-7 h-[3px] w-2.5 rounded-b-full bg-[#6B4226]" />
          <div className="absolute right-2.5 top-7 h-[3px] w-2.5 rounded-b-full bg-[#6B4226]" />
          <div className="absolute left-1/2 top-9 h-[3px] w-2 -translate-x-1/2 rounded-b-full bg-[#D98A6A]" />
        </div>
        {/* body */}
        <div
          className="mx-auto -mt-1.5 h-12 w-[84px] rounded-t-[2rem]"
          style={{ background: "#FF9FBE" }}
        />
        {/* open book on the lap */}
        <div className="relative -mt-8 flex justify-center">
          <div
            className="h-11 w-12 rounded-l-xl border-2 border-sky-200 bg-white"
            style={{ transform: "rotate(7deg)", boxShadow: "inset -4px 0 6px rgba(140,180,220,.25)" }}
          />
          <div
            className="h-11 w-12 rounded-r-xl border-2 border-sky-200 bg-white"
            style={{ transform: "rotate(-7deg)", boxShadow: "inset 4px 0 6px rgba(140,180,220,.25)" }}
          />
          <div
            className="page-turn absolute left-1/2 top-0 h-11 w-12 rounded-r-xl bg-[#F4FAFF]"
            style={{ boxShadow: "inset 4px 0 6px rgba(140,180,220,.3)" }}
          />
          <div className="pointer-events-none absolute left-[14px] top-3 h-[2.5px] w-7 rounded bg-sky-200" style={{ transform: "rotate(7deg)" }} />
          <div className="pointer-events-none absolute left-[15px] top-5 h-[2.5px] w-6 rounded bg-sky-100" style={{ transform: "rotate(7deg)" }} />
          <div className="absolute -left-1 top-5 h-4 w-4 rounded-full" style={{ background: "#FFD9B3" }} />
          <div className="absolute -right-1 top-5 h-4 w-4 rounded-full" style={{ background: "#FFD9B3" }} />
        </div>
      </div>
    </div>
  );
}
