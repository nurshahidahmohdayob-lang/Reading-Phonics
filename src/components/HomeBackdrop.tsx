"use client";

/* The home screen's background, in the island's cartoon-game style: a bright
   deep-blue sky with slowly turning sun rays, outlined cartoon clouds drifting
   across, jungle leaves framing the bottom corners and swaying in the breeze,
   and the two young readers sitting in front. The clouds and leaves are
   Blender renders (blender/home_backdrop.py). Sections keep the plain
   Backdrop. */

const CLOUDS = [
  { src: "home-cloud-a", top: "9%", w: "clamp(140px,17vw,300px)", dur: 95, delay: -10 },
  { src: "home-cloud-b", top: "26%", w: "clamp(110px,12vw,220px)", dur: 120, delay: -70 },
  { src: "home-cloud-a", top: "48%", w: "clamp(90px,9vw,170px)", dur: 140, delay: -35 },
  { src: "home-cloud-b", top: "4%", w: "clamp(100px,10vw,190px)", dur: 110, delay: -90 },
];

export default function HomeBackdrop() {
  return (
    <div aria-hidden className="home-sky pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* the sun and its turning rays */}
      <div className="home-rays absolute -right-[22vmax] -top-[22vmax] h-[60vmax] w-[60vmax]" />
      <div className="home-sun absolute -right-16 -top-16 h-56 w-56 rounded-full" />

      {CLOUDS.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`/images/home-bg/${c.src}.webp`}
          alt=""
          className="home-cloud absolute left-0 select-none"
          style={{ top: c.top, width: c.w, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        />
      ))}

      {/* jungle leaves in the bottom corners */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home-bg/home-jungle.webp" alt="" className="home-jungle home-jungle-left absolute bottom-0 left-0 select-none" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home-bg/home-jungle.webp" alt="" className="home-jungle home-jungle-right absolute bottom-0 right-0 select-none" />

      {/* butterflies */}
      <span className="anim-flutter absolute left-[12%] top-[38%] text-2xl">🦋</span>
      <span className="anim-flutter absolute right-[14%] top-[58%] text-xl" style={{ animationDelay: "-3s" }}>🦋</span>

      {/* the two young readers */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-girl.png" alt="" className="anim-bob absolute bottom-2 left-6 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/reader-boy.png" alt="" className="anim-bob absolute bottom-2 right-8 z-20 hidden h-28 w-auto drop-shadow-lg sm:block sm:h-36" />
    </div>
  );
}
