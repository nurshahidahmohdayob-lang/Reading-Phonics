"use client";

/* The home screen's background: the island floats in a galaxy. A deep
   purple-blue space with twinkling stars, glowing nebula clouds, comets,
   a big ringed cartoon planet, a passing UFO, and the two young readers
   sitting on cratered moon rocks. Drawn here (stars on a canvas, the rest
   in CSS) in the island's bold outlined cartoon style. Sections keep the
   plain Backdrop. */

import { useEffect, useRef } from "react";

export default function HomeBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);

  // Twinkling stars.
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      p: Math.random() * 6,
      gold: Math.random() < 0.15,
    }));
    let raf = 0;
    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = (c.width = c.clientWidth * dpr);
      const h = (c.height = c.clientHeight * dpr);
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t / 900 + s.p));
        ctx.fillStyle = s.gold ? "#ffe680" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!calm) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div aria-hidden className="home-space pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="home-nebula absolute inset-0" />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />

      {/* comets */}
      <span className="home-comet absolute left-[4%] top-[22%]" />
      <span className="home-comet absolute left-[40%] top-[70%]" style={{ animationDelay: "-4s" }} />
      <span className="home-comet absolute left-[62%] top-[30%]" style={{ animationDelay: "-8.5s" }} />

      {/* a big ringed planet where the sun was */}
      <div className="home-bigplanet absolute -right-[4vmax] -top-[5vmax] h-[22vmax] w-[22vmax]">
        <span className="home-bigplanet-ring absolute" />
      </div>
      {/* a little moon */}
      <div className="home-moon absolute left-[6%] top-[14%] h-[5vmax] w-[5vmax] rounded-full" />

      {/* a UFO drifting across */}
      <span className="home-ufo absolute top-[34%] text-3xl">🛸</span>

      {/* moon rocks for the young readers */}
      <div className="home-rock absolute -bottom-[6vmax] -left-[5vmax] h-[20vmax] w-[30vmax] rounded-[50%]" />
      <div className="home-rock absolute -bottom-[6vmax] -right-[5vmax] h-[20vmax] w-[30vmax] rounded-[50%]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-girl.png" alt="" className="anim-bob absolute bottom-3 left-6 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-boy.png" alt="" className="anim-bob absolute bottom-3 right-8 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
    </div>
  );
}
