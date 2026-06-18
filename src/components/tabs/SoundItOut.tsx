"use client";

import { useEffect, useRef, useState } from "react";
import { segment, type Grapheme } from "@/lib/segment";
import { lookup } from "@/app/dictionary";
import { playSoundClip, speak } from "@/lib/speak";

/* A few words to tempt a tap when the box is empty. */
const EXAMPLES = ["cat", "ship", "rain", "frog", "cake", "night", "queen"];

export default function SoundItOut() {
  const [text, setText] = useState("");
  const [word, setWord] = useState(""); // the word we're sounding out
  const [parts, setParts] = useState<Grapheme[]>([]);
  const [active, setActive] = useState(-1); // tile lit during a blend
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(-1);
  }

  useEffect(() => stop, []);

  /** Take whatever is typed and break it into sounds. */
  function build(raw: string) {
    stop();
    const clean = raw.toLowerCase().replace(/[^a-z]/g, "");
    setWord(clean);
    setParts(segment(clean));
  }

  function play(p: Grapheme) {
    if (p.silent) return;
    stop();
    playSoundClip(p.clip, p.say);
  }

  /** Light up each sound in turn, then say the whole word. */
  function blend() {
    if (!parts.length) return;
    stop();
    const step = 950;
    let t = 0;
    parts.forEach((p, i) => {
      timers.current.push(
        setTimeout(() => {
          setActive(i);
          if (!p.silent) playSoundClip(p.clip, p.say);
        }, t),
      );
      // Silent letters get a quick beat; sounded letters get the full step.
      t += p.silent ? 380 : step;
    });
    timers.current.push(
      setTimeout(() => {
        setActive(-1);
        speak(word, 0.8);
      }, t),
    );
  }

  const entry = word ? lookup(word) : null;

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Type any word, then sound it out and blend it!
      </p>

      {/* Type a word */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          build(text);
        }}
        className="mt-5 flex w-full max-w-md flex-col items-center gap-3 sm:flex-row"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a word…"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-2xl border-4 border-violet-200 bg-white px-5 py-3 text-center text-2xl font-black lowercase tracking-wide text-zinc-700 shadow-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="w-full rounded-2xl bg-violet-600 px-6 py-3 text-lg font-extrabold text-white shadow-lg transition-all active:scale-95 sm:w-auto"
        >
          Sound it out
        </button>
      </form>

      {/* Example chips when nothing has been built yet */}
      {!parts.length && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="text-sm font-semibold text-zinc-400">
            …or try one of these:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((w) => (
              <button
                key={w}
                onClick={() => {
                  setText(w);
                  build(w);
                }}
                className="rounded-full bg-white px-4 py-2 font-bold text-violet-600 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 dark:bg-zinc-800 dark:text-violet-300"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The blender */}
      {parts.length > 0 && (
        <div className="mt-6 flex w-full flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] px-6 py-8 text-violet-900 shadow-lg ring-4 ring-white/60">
          {entry && <div className="text-7xl">{entry.emoji}</div>}

          {/* The whole word, tap to hear it */}
          <button
            onClick={() => speak(word, 0.85)}
            className="text-5xl font-black lowercase tracking-wide drop-shadow-sm"
          >
            {word}
          </button>

          {/* One tile per sound */}
          <div className="flex flex-wrap items-end justify-center gap-2">
            {parts.map((p, i) => (
              <button
                key={i}
                onClick={() => play(p)}
                className={`flex h-20 min-w-16 items-center justify-center rounded-2xl px-2 text-4xl font-black shadow-md transition-all active:scale-90 ${
                  p.silent ? "opacity-40" : ""
                } ${
                  active === i
                    ? "scale-110 bg-white text-violet-600"
                    : "bg-white/60 backdrop-blur hover:bg-white/80"
                }`}
              >
                {p.g}
              </button>
            ))}
          </div>

          <button
            onClick={blend}
            className="flex items-center gap-2 rounded-full bg-violet-600 px-8 py-3 text-xl font-extrabold text-white shadow-lg active:scale-95"
          >
            🔉 Blend it!
          </button>

          {entry && (
            <p className="max-w-sm text-center text-sm font-semibold opacity-80">
              {entry.meaning}
            </p>
          )}
          <p className="text-sm font-semibold opacity-70">
            Tap a letter for its sound, or blend the whole word.
          </p>
        </div>
      )}
    </div>
  );
}
