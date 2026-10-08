"use client";

/* Plays an interactive story (app/interactiveStories): a painted scene per
   page with characters and props on it, and the page's lines read aloud one
   after another, each word lighting up as it's spoken. Characters speak in
   their own voice and bounce while they talk. Tap a character or a prop to
   make it move (characters say something too), tap a word to hear it, tap a
   speaker's name to hear their line again. Arrows, a swipe or the arrow keys
   turn the page.

   Speech comes from the app's /api/tts audio. Word highlighting follows the
   audio's clock, sharing the line's length out over its words by their
   length, with a little extra for punctuation pauses. Voices are the same
   recording played faster and higher (small characters) or slower and
   deeper (big ones). If the audio can't play, the browser's own voice reads
   the line instead and its word events drive the highlight. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Andika, Fraunces } from "next/font/google";
import { sayWord } from "@/lib/sayWord";
import { stopSpeech } from "@/lib/speak";
import type { Actor, InteractiveStory as Story, Line, Scenery, Voice } from "@/app/interactiveStories";
import { StoryArt } from "@/components/storyArt";

const body = Andika({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const display = Fraunces({ subsets: ["latin"], weight: ["700", "800"], display: "swap" });

/** Playback speed (and so pitch) for each voice. */
const VOICE: Record<Voice, { rate: number; pitch: number; keepPitch: boolean }> = {
  narrator: { rate: 0.95, pitch: 1, keepPitch: true },
  normal: { rate: 1.0, pitch: 1.1, keepPitch: false },
  small: { rate: 1.18, pitch: 1.6, keepPitch: false },
  big: { rate: 0.84, pitch: 0.6, keepPitch: false },
};

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** When each word starts, as a fraction of the line: longer words and
    words before a pause take longer. */
function wordStarts(text: string): number[] {
  const weights = words(text).map((w) => w.replace(/[^a-z0-9]/gi, "").length + 2 + (/[.!?]["”]?$/.test(w) ? 4 : /[,;:]$/.test(w) ? 2 : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let at = 0;
  return weights.map((w) => {
    const start = at / total;
    at += w;
    return start;
  });
}

type Playing = { line: number; word: number } | null;

export default function InteractiveStory({ story, onClose }: { story: Story; onClose?: () => void }) {
  const [page, setPage] = useState(-1); // -1 is the cover
  const [playing, setPlaying] = useState<Playing>(null);
  const [acting, setActing] = useState<Record<number, number>>({}); // actor index -> animation run
  const token = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef(0);
  const touch = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => {
    token.current++;
    cancelAnimationFrame(raf.current);
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
      audio.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    stopSpeech();
    setPlaying(null);
  }, []);

  /** Say one line in a voice, lighting up its words; resolves when done
      (or false if stopped). */
  const say = useCallback((text: string, voice: Voice, onWord: (i: number) => void): Promise<boolean> => {
    const my = token.current;
    const v = VOICE[voice];
    const starts = wordStarts(text);
    return new Promise((resolve) => {
      const browserVoice = () => {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
        if (!synth || my !== token.current) return resolve(my === token.current);
        const u = new SpeechSynthesisUtterance(text);
        u.rate = Math.min(1.3, v.rate * 0.95);
        u.pitch = v.pitch;
        const offsets: number[] = [];
        let pos = 0;
        for (const w of words(text)) {
          pos = text.indexOf(w, pos);
          offsets.push(pos);
          pos += w.length;
        }
        u.onboundary = (e) => {
          if (my !== token.current) return;
          let i = offsets.findIndex((o) => o > e.charIndex) - 1;
          if (i < 0) i = e.charIndex >= offsets[offsets.length - 1] ? offsets.length - 1 : 0;
          onWord(i);
        };
        u.onend = () => resolve(my === token.current);
        u.onerror = () => resolve(my === token.current);
        onWord(0);
        synth.speak(u);
      };

      const a = new Audio(`/api/tts?tl=en&q=${encodeURIComponent(text.slice(0, 200))}`);
      audio.current = a;
      a.playbackRate = v.rate;
      (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = v.keepPitch;
      const tick = () => {
        if (my !== token.current) return;
        if (a.duration > 0) {
          const f = a.currentTime / a.duration;
          let i = 0;
          while (i + 1 < starts.length && starts[i + 1] <= f) i++;
          onWord(i);
        }
        raf.current = requestAnimationFrame(tick);
      };
      a.onplaying = () => {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(tick);
      };
      a.onended = () => {
        cancelAnimationFrame(raf.current);
        resolve(my === token.current);
      };
      a.onerror = () => {
        cancelAnimationFrame(raf.current);
        browserVoice();
      };
      a.play().catch(() => {
        cancelAnimationFrame(raf.current);
        browserVoice();
      });
    });
  }, []);

  const voiceOf = useCallback((line: Line): Voice => (line.who ? story.cast[line.who]?.voice ?? "normal" : "narrator"), [story]);

  /** Read the page's lines from `from` on. */
  const readPage = useCallback(
    async (p: number, from = 0, only = false) => {
      stop();
      const lines = story.pages[p]?.lines ?? [];
      for (let l = from; l < lines.length; l++) {
        const ok = await say(lines[l].text, voiceOf(lines[l]), (w) => setPlaying({ line: l, word: w }));
        if (!ok) return;
        if (only) break;
        await new Promise((r) => setTimeout(r, 350));
      }
      setPlaying(null);
    },
    [say, stop, story, voiceOf],
  );

  const go = useCallback(
    (to: number) => {
      const next = Math.max(-1, Math.min(story.pages.length, to));
      setPage(next);
      setActing({});
      if (next >= 0 && next < story.pages.length) void readPage(next);
      else stop();
    },
    [readPage, stop, story.pages.length],
  );

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go, page]);

  const tapActor = (i: number, actor: Actor) => {
    setActing((m) => ({ ...m, [i]: (m[i] ?? 0) + 1 }));
    const c = actor.cast ? story.cast[actor.cast] : null;
    if (c) {
      stop();
      void say(c.tap, c.voice, () => {});
    }
  };

  const current = page >= 0 && page < story.pages.length ? story.pages[page] : null;
  const speaking = playing && current ? current.lines[playing.line]?.who : undefined;

  return (
    <div
      ref={root}
      tabIndex={0}
      className={`${body.className} mx-auto w-full max-w-4xl outline-none`}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 60) go(page + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_14px_40px_-16px_rgba(20,40,20,0.45)] ring-1 ring-black/5 dark:bg-zinc-900">
        {page === -1 ? (
          <Cover story={story} onStart={() => go(0)} />
        ) : page === story.pages.length ? (
          <TheEnd story={story} onAgain={() => go(0)} onClose={onClose} />
        ) : (
          current && (
            <>
              <Scene scenery={current.scene}>
                {current.actors.map((a, i) => {
                  const c = a.cast ? story.cast[a.cast] : null;
                  const talking = !!c && speaking === a.cast;
                  const run = acting[i];
                  return (
                    <button
                      key={`${page}-${i}-${run ?? 0}`}
                      onClick={() => tapActor(i, a)}
                      aria-label={c ? c.name : "picture"}
                      className="absolute -translate-x-1/2 -translate-y-full select-none leading-none"
                      style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.size}cqw` }}
                    >
                      <span
                        className={`block ${talking ? "act-talk" : run ? `act-${a.action ?? "hop"}` : a.action === "float" ? "act-idle-float" : ""}`}
                        style={{ transform: a.flip ? "scaleX(-1)" : undefined }}
                      >
                        <StoryArt id={a.art ?? c?.art ?? "puff"} className="block w-full drop-shadow-[0_0.5cqw_0.3cqw_rgba(0,0,0,0.25)]" />
                      </span>
                    </button>
                  );
                })}
              </Scene>

              <div className="flex flex-col gap-2 px-5 py-5 sm:px-7">
                {current.lines.map((line, l) => {
                  const c = line.who ? story.cast[line.who] : null;
                  const on = playing?.line === l;
                  return (
                    <div key={l} className={`flex flex-wrap items-baseline gap-x-2 rounded-2xl px-3 py-1.5 transition-colors ${on ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                      {c && (
                        <button
                          onClick={() => void readPage(page, l, true)}
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold text-white shadow-sm active:scale-95"
                          style={{ background: c.colour }}
                          title={`Hear ${c.name}`}
                        >
                          {c.name}
                        </button>
                      )}
                      <p className={`text-[1.45rem] leading-[1.7] sm:text-[1.6rem] ${c ? "font-bold" : ""}`} style={c ? { color: c.colour } : undefined}>
                        {words(line.text).map((w, j) => (
                          <span key={j}>
                            <button
                              onClick={() => {
                                stop();
                                sayWord(w.replace(/[^a-z']/gi, ""));
                              }}
                              className={`rounded-md px-0.5 transition-colors ${
                                on && playing?.word === j ? "bg-[#F7B917] text-[#0A4F29]" : "hover:bg-amber-200/60"
                              } ${!c ? "text-zinc-800 dark:text-zinc-100" : ""}`}
                            >
                              {w}
                            </button>{" "}
                          </span>
                        ))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {page >= 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => go(page - 1)}
            aria-label="Previous page"
            className="grid h-14 w-14 place-items-center rounded-full bg-white text-3xl font-black text-[#0A4F29] shadow-md active:scale-95 dark:bg-zinc-800"
          >
            ‹
          </button>
          <div className="flex flex-col items-center gap-2">
            {page < story.pages.length && (
              <button
                onClick={() => (playing ? stop() : void readPage(page))}
                className="rounded-full bg-[#F7B917] px-5 py-2.5 text-lg font-bold text-[#0A4F29] shadow active:scale-95"
              >
                {playing ? "⏹ Stop" : "🔊 Read to me"}
              </button>
            )}
            <div className="flex gap-1.5">
              {story.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === page ? "w-7 bg-[#0A4F29]" : "w-2.5 bg-zinc-300 dark:bg-zinc-600"}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => go(page + 1)}
            disabled={page >= story.pages.length}
            aria-label="Next page"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#0A4F29] text-3xl font-black text-white shadow-md active:scale-95 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function Cover({ story, onStart }: { story: Story; onStart: () => void }) {
  return (
    <button onClick={onStart} className="relative block w-full text-left" aria-label={`Start ${story.title}`}>
      <Scene scenery={story.pages[0].scene}>
        <span className="absolute left-1/2 top-[8%] w-[24cqw] -translate-x-1/2 drop-shadow-lg act-idle-float">
          <StoryArt id={story.cover} className="block w-full" />
        </span>
        <span className="absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-[1.5cqw] px-4 text-center">
          <span className={`${display.className} rounded-[2cqw] bg-white/85 px-[3cqw] py-[1cqw] text-[6cqw] font-extrabold leading-tight text-[#0A4F29] shadow-lg`}>
            {story.title}
          </span>
          <span className="rounded-full bg-[#F7B917] px-[3cqw] py-[1cqw] text-[3cqw] font-bold text-[#0A4F29] shadow-lg">▶ Read with me</span>
        </span>
      </Scene>
    </button>
  );
}

function TheEnd({ story, onAgain, onClose }: { story: Story; onAgain: () => void; onClose?: () => void }) {
  return (
    <Scene scenery={story.pages[story.pages.length - 1].scene}>
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-[2cqw]">
        <span className="w-[16cqw] act-idle-float">
          <StoryArt id={story.cover} className="block w-full" />
        </span>
        <span className={`${display.className} rounded-[2cqw] bg-white/85 px-[4cqw] py-[1cqw] text-[8cqw] font-extrabold italic text-[#0A4F29] shadow-lg`}>The End</span>
        <span className="flex gap-[2cqw]">
          <button onClick={onAgain} className="rounded-full bg-[#F7B917] px-[3cqw] py-[1cqw] text-[3cqw] font-bold text-[#0A4F29] shadow-lg active:scale-95">
            🔁 Read again
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded-full bg-white px-[3cqw] py-[1cqw] text-[3cqw] font-bold text-[#0A4F29] shadow-lg active:scale-95">
              📚 More stories
            </button>
          )}
        </span>
      </span>
    </Scene>
  );
}

/** A painted background: sky, distant shapes and ground, drawn in SVG. */
function Scene({ scenery, children }: { scenery: Scenery; children: React.ReactNode }) {
  const night = scenery === "castle";
  const snowy = scenery === "snow" || scenery === "villageSnow";
  const sky = night ? ["#1e2a5a", "#4b3d8f"] : snowy ? ["#cfe6f7", "#eef6fc"] : scenery === "sea" ? ["#7cc6f2", "#d6f0ff"] : ["#86cdf6", "#dff3ff"];
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ containerType: "inline-size" }}>
      <svg viewBox="0 0 160 90" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`sky-${scenery}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky[0]} />
            <stop offset="1" stopColor={sky[1]} />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill={`url(#sky-${scenery})`} />
        {night && [12, 30, 48, 70, 96, 118, 140, 22, 60, 104, 150].map((x, i) => <circle key={i} cx={x} cy={6 + ((i * 7) % 26)} r={0.5} fill="#fff8d6" />)}
        {scenery === "castle" && (
          <g stroke="#14142a" strokeWidth={0.5} strokeLinejoin="round">
            <rect x="52" y="34" width="56" height="40" fill="#3a3a62" />
            <rect x="42" y="22" width="16" height="52" fill="#43436e" />
            <rect x="102" y="22" width="16" height="52" fill="#43436e" />
            {[42, 47.5, 53, 102, 107.5, 113].map((x) => <rect key={x} x={x} y="18.5" width="5" height="4" fill="#43436e" />)}
            {[52, 60, 68, 76, 84, 92, 100].map((x) => <rect key={x} x={x} y="31" width="5" height="3.5" fill="#3a3a62" />)}
            {[40, 46, 52, 58, 64, 70].map((y, i) => <path key={y} d={`M${52 + (i % 2) * 4} ${y} h50`} stroke="#2e2e52" strokeWidth={0.4} />)}
            <path d="M74 74 V62 a6 6 0 0 1 12 0 V74 Z" fill="#ffd27a" />
            <rect x="48" y="32" width="4" height="6" rx="2" fill="#ffd27a" />
            <rect x="108" y="32" width="4" height="6" rx="2" fill="#ffd27a" />
            <path d="M50 18.5 V8 M110 18.5 V8" stroke="#14142a" strokeWidth={0.6} />
            <path d="M50 8 l7 2.5 l-7 2.5 Z" fill="#e8433a" />
            <path d="M110 8 l7 2.5 l-7 2.5 Z" fill="#3a7be8" />
          </g>
        )}
        {(scenery === "snow" || scenery === "villageSnow") && (
          <g stroke="#6f87a0" strokeWidth={0.4} strokeLinejoin="round">
            <path d="M0 60 L30 22 L58 60 Z" fill="#9fb8cf" />
            <path d="M22 32 L30 22 L38 32 L33 30 L30 34 L27 30 Z" fill="#fff" />
            <path d="M40 62 L82 14 L126 62 Z" fill="#8fa9c2" />
            <path d="M72 26 L82 14 L92 26 L86 24 L82 29 L78 24 Z" fill="#fff" />
            <path d="M100 62 L135 28 L170 62 Z" fill="#9fb8cf" />
            <path d="M128 36 L135 28 L142 36 L138 35 L135 38 L132 35 Z" fill="#fff" />
          </g>
        )}
        {scenery === "village" && (
          /* the dragon's mountain, far off behind the village */
          <g stroke="#6f87a0" strokeWidth={0.4} strokeLinejoin="round">
            <path d="M104 56 L138 18 L172 56 Z" fill="#a9bfd4" />
            <path d="M130 27 L138 18 L146 27 L142 26 L138 30 L134 26 Z" fill="#fff" />
          </g>
        )}
        {(scenery === "road" || scenery === "farm" || scenery === "village") && (
          <g stroke="#5c9c42" strokeWidth={0.4}>
            <ellipse cx="30" cy="72" rx="60" ry="22" fill="#9fd77e" />
            <ellipse cx="130" cy="74" rx="62" ry="24" fill="#8ccd6a" />
          </g>
        )}
        {(scenery === "village" || scenery === "villageSnow") && (
          <g stroke="#3b2a2f" strokeWidth={0.5} strokeLinejoin="round">
            {[
              [14, 52, "#e8a87c"],
              [46, 48, "#f2d06b"],
              [96, 50, "#9ec7e8"],
              [128, 54, "#e88a8a"],
            ].map(([x, y, c], i) => {
              const X = Number(x);
              const Y = Number(y);
              return (
                <g key={i}>
                  <rect x={X + 11} y={Y - 10} width={3} height={6} fill="#a0522d" />
                  <rect x={X} y={Y} width={18} height={15} fill={String(c)} />
                  <path d={`M${X - 2.5} ${Y} L${X + 9} ${Y - 9} L${X + 20.5} ${Y} Z`} fill={scenery === "villageSnow" ? "#ffffff" : "#b5523b"} />
                  <path d={`M${X + 7} ${Y + 15} V${Y + 9} a2 2 0 0 1 4 0 V${Y + 15} Z`} fill="#6b4226" />
                  <rect x={X + 2} y={Y + 3.5} width={4} height={4} fill="#fff3b0" />
                  <rect x={X + 12} y={Y + 3.5} width={4} height={4} fill="#fff3b0" />
                </g>
              );
            })}
          </g>
        )}
        {scenery === "sea" && <rect y="56" width="160" height="34" fill="#3aa0d8" />}
        {/* the ground */}
        <rect y="70" width="160" height="20" fill={night ? "#3b4a3a" : snowy ? "#f4f8fb" : "#6dbb4f"} />
        {scenery === "road" && <rect y="76" width="160" height="9" fill="#8a8f98" />}
        {scenery === "road" && [8, 34, 60, 86, 112, 138].map((x) => <rect key={x} x={x} y="80" width="12" height="1.2" fill="#f5f5f5" />)}
        {snowy && <path d="M0 70 Q40 66 80 70 T160 70 V72 H0 Z" fill="#ffffff" />}
      </svg>
      {children}
    </div>
  );
}
