"use client";

import { useEffect, useState } from "react";
import {
  TOTAL_LEVELS,
  bandForLevel,
  levelWords,
  levelDistractors,
  spellBands,
  type SpellWord,
} from "@/app/spelling";
import { speak, praise, playSoundClip } from "@/lib/speak";
import { shuffle } from "@/lib/random";

const STORE_KEY = "spelling-completed";
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function loadCompleted(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

type Tile = { g: string; id: number; isExtra: boolean };

function buildTiles(word: SpellWord, distractors: number): Tile[] {
  const extras = shuffle(
    ALPHABET.filter((c) => !word.text.includes(c)),
  ).slice(0, distractors);
  const base = [
    ...word.sounds.map((g, id) => ({ g, id, isExtra: false })),
    ...extras.map((g, i) => ({ g, id: 100 + i, isExtra: true })),
  ];
  // The word's tiles must NOT appear in spelling order — the student does
  // the arranging, not the shuffle.
  const looksSolved = (ts: Tile[]) =>
    ts
      .filter((t) => !t.isExtra)
      .map((t) => t.g)
      .join(" ") === word.sounds.join(" ");
  let tiles = shuffle(base);
  for (let i = 0; i < 15 && looksSolved(tiles) && word.sounds.length > 1; i++) {
    tiles = shuffle(base);
  }
  return tiles;
}

export default function Spelling() {
  const [completed, setCompleted] = useState<Set<number>>(loadCompleted);
  const [level, setLevel] = useState<number | null>(null);

  function markDone(lvl: number) {
    setCompleted((prev) => {
      const next = new Set(prev).add(lvl);
      localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  /* ---- Adventure map: a serpentine trail that fits in one screen ---- */
  if (level === null) {
    const COLS = 10;
    const ROW_H = 102; // vertical px between rows
    const TOP = 62;
    const rows = Math.ceil(TOTAL_LEVELS / COLS);
    const nodePos = (lvl: number) => {
      const i = lvl - 1;
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const c = row % 2 === 0 ? col : COLS - 1 - col; // snake back and forth
      // Waves and a touch of jitter so the trail wanders like a real route.
      const wave = Math.sin((c / (COLS - 1)) * Math.PI * 2 + row * 1.7) * 13;
      const wobble = Math.cos(i * 7.31) * 4;
      const drift = Math.sin(i * 12.9898) * 1.1;
      return {
        x: 7 + (86 * c) / (COLS - 1) + drift,
        y: TOP + row * ROW_H + wave + wobble,
      };
    };
    const mapHeight = TOP + (rows - 1) * ROW_H + 92;
    // A smooth curve through every level (Catmull-Rom turned into beziers).
    const pts = Array.from({ length: TOTAL_LEVELS }, (_, i) => nodePos(i + 1));
    let pathD = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      pathD += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    const firstTodo =
      Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).find(
        (l) => !completed.has(l),
      ) ?? null;

    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          🗺️ Follow the treasure trail — 50 spelling adventures to the chest!
        </p>
        <p className="mt-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-violet-500 shadow-sm">
          ⭐ {completed.size} / {TOTAL_LEVELS} levels done
        </p>

        {/* Wooden table */}
        <div
          className="mt-5 w-full max-w-4xl rounded-[2rem] p-3 shadow-xl sm:p-5"
          style={{
            background:
              "repeating-linear-gradient(180deg, #C68B4E 0px, #C68B4E 52px, #8F5E2C 52px, #8F5E2C 55px)," +
              "linear-gradient(#C68B4E, #B57A3E)",
          }}
        >
          {/* Torn parchment */}
          <div
            className="p-2 sm:p-2.5"
            style={{
              background: "#F4E6C8",
              borderRadius: "1.3rem 1.1rem 1.4rem 1rem / 1.1rem 1.4rem 1rem 1.3rem",
              boxShadow: "inset 0 0 16px rgba(146,104,58,.4), 0 4px 10px rgba(60,35,10,.35)",
            }}
          >
            {/* Ocean */}
            <div
              className="relative w-full overflow-hidden rounded-[1rem]"
              style={{
                height: mapHeight,
                background: "linear-gradient(#5EC9EA, #7AD6F2)",
              }}
            >
              {/* Sandy island */}
              <div
                className="absolute"
                style={{
                  left: "3.5%",
                  right: "3.5%",
                  top: "5%",
                  bottom: "9%",
                  background: "radial-gradient(circle at 45% 35%, #FBDF87, #F6CF66)",
                  borderRadius: "46% 54% 48% 52% / 56% 44% 58% 42%",
                  boxShadow: "0 0 0 7px rgba(255,246,205,.55)",
                }}
              />

              {/* Little waves in the water */}
              {[
                { left: "4%", top: 14 },
                { left: "90%", top: 26 },
                { left: "2%", top: mapHeight * 0.55 },
                { left: "93%", top: mapHeight * 0.72 },
                { left: "48%", top: mapHeight - 16 },
              ].map((w, i) => (
                <span
                  key={i}
                  className="absolute h-1 w-7 rounded-full bg-white/50"
                  style={w}
                />
              ))}

              {/* The dotted trail connecting the levels */}
              <svg
                aria-hidden
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 100 ${mapHeight}`}
                preserveAspectRatio="none"
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke="#C0392B"
                  strokeOpacity="0.75"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="1 11"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Start & Finish */}
              <span
                className="absolute left-[12%] -rotate-6 font-serif text-xl font-black italic text-[#7A4A1F] sm:text-2xl"
                style={{ top: 6 }}
              >
                Start
              </span>
              <span
                className="absolute right-[2%] -rotate-3 font-serif text-xl font-black italic text-[#7A4A1F] sm:text-2xl"
                style={{ top: nodePos(TOTAL_LEVELS).y - 64 }}
              >
                Finish
              </span>

              {/* Pirate scenery: sea life in the water, palms on the island */}
              <span className="absolute left-[1%] text-3xl" style={{ top: 10 }}>🐠</span>
              <span className="absolute right-[1.5%] text-2xl" style={{ top: 12 }}>⚓</span>
              <span className="absolute left-[0.5%] text-4xl" style={{ top: mapHeight * 0.36 }}>⛵</span>
              <span className="absolute left-[2.5%] text-sm" style={{ top: mapHeight * 0.33 }}>🏴‍☠️</span>
              <span className="absolute right-[0.5%] text-3xl" style={{ top: mapHeight * 0.5 }}>🧜‍♀️</span>
              <span className="absolute left-[2%] text-2xl" style={{ top: mapHeight - 42 }}>🐬</span>
              <span className="absolute left-[46%] text-2xl" style={{ top: mapHeight - 36 }}>🦀</span>
              <span className="absolute right-[2%] text-2xl" style={{ top: mapHeight - 46 }}>🐙</span>
              <span className="absolute left-[3%] text-3xl" style={{ top: TOP + ROW_H * 0.5 - 10 }}>🌴</span>
              <span className="absolute right-[3%] text-3xl" style={{ top: TOP + ROW_H * 1.5 - 10 }}>🌴</span>
              <span className="absolute left-[3%] text-2xl" style={{ top: TOP + ROW_H * 2.5 - 10 }}>🦜</span>
              <span className="absolute right-[3.5%] text-2xl" style={{ top: TOP + ROW_H * 3.5 - 10 }}>🌴</span>

              {/* Level nodes */}
          {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvl) => {
            const band = bandForLevel(lvl);
            const { x, y } = nodePos(lvl);
            const done = completed.has(lvl);
            const isHere = lvl === firstTodo;
            return (
              <div
                key={lvl}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: y }}
              >
                {isHere && (
                  <span className="anim-bob absolute -top-9 left-1/2 -translate-x-1/2 text-2xl">
                    🐣
                  </span>
                )}
                <button
                  onClick={() => setLevel(lvl)}
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] sm:h-12 sm:w-12 ${band.bg} ${band.text} font-black shadow-md ring-2 sm:text-base sm:ring-[3px] ${
                    isHere ? "ring-violet-300" : "ring-white/70"
                  } transition-all hover:scale-110 hover:shadow-lg active:scale-90`}
                >
                  {lvl}
                  {done && (
                    <span className="absolute -right-1 -top-1 text-[10px] sm:text-xs">
                      ⭐
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {/* X marks the spot — the treasure at the journey's end */}
          <span
            className="absolute -translate-x-1/2 -rotate-12 text-4xl font-black text-red-600/90"
            style={{
              left: `${nodePos(TOTAL_LEVELS).x}%`,
              top: nodePos(TOTAL_LEVELS).y + 36,
            }}
          >
            ✕
          </span>
          <span
            className="absolute -translate-x-1/2 text-4xl sm:text-5xl"
            style={{
              left: `${nodePos(TOTAL_LEVELS).x - 7}%`,
              top: nodePos(TOTAL_LEVELS).y + 28,
            }}
          >
            💰
          </span>
            </div>
          </div>
        </div>

        {/* Which colour is which land */}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {spellBands.map((band) => (
            <span
              key={band.from}
              className={`rounded-full ${band.bg} ${band.text} px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-white/70`}
            >
              {band.from}–{band.to} · {band.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PlayLevel
      // Remount on every level change so the new level starts fresh — without
      // this, "Level N+1 →" keeps the finished level's state and the next
      // level opens already showing the complete screen.
      key={level}
      level={level}
      onExit={() => setLevel(null)}
      onComplete={() => markDone(level)}
      onNext={() => setLevel(level < TOTAL_LEVELS ? level + 1 : null)}
    />
  );
}

/* ---------- Playing one level (4 words) ---------- */

function PlayLevel({
  level,
  onExit,
  onComplete,
  onNext,
}: {
  level: number;
  onExit: () => void;
  onComplete: () => void;
  onNext: () => void;
}) {
  const band = bandForLevel(level);
  const words = levelWords(level);
  const distractors = levelDistractors(level);

  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() =>
    buildTiles(words[0], distractors),
  );
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [filled, setFilled] = useState(0);
  const [wrong, setWrong] = useState<Tile | null>(null);
  const [levelDone, setLevelDone] = useState(false);

  const word = words[round];
  const wordDone = filled === word.sounds.length;

  // Say the word when a new one appears.
  useEffect(() => {
    if (!levelDone) speak(word.text, 0.8);
  }, [word, levelDone]);

  function nextWord() {
    if (round + 1 >= words.length) {
      setLevelDone(true);
      onComplete();
      praise();
    } else {
      const r = round + 1;
      setRound(r);
      setTiles(buildTiles(words[r], distractors));
      setUsed(new Set());
      setFilled(0);
      setWrong(null);
    }
  }

  function tap(tile: Tile) {
    if (used.has(tile.id) || wordDone || wrong) return;
    // Any unused tile showing the right grapheme counts (words can repeat one).
    if (tile.g === word.sounds[filled]) {
      place(tile);
    } else {
      setWrong(tile);
      speak("Try again", 1);
      setTimeout(() => setWrong(null), 700);
    }
  }

  function place(tile: Tile) {
    playSoundClip(word.sounds[filled], word.say[filled]);
    setUsed((prev) => new Set(prev).add(tile.id));
    const next = filled + 1;
    setFilled(next);
    if (next === word.sounds.length) {
      // Let the last sound clip finish before reading the whole word back.
      setTimeout(() => {
        speak(word.text, 0.85);
        setTimeout(nextWord, 1500);
      }, 950);
    }
  }

  /* ---- Level complete ---- */
  if (levelDone) {
    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-12 py-10 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
          <div className="text-7xl">🏆</div>
          <h2 className="text-2xl font-extrabold">Level {level} complete!</h2>
          <p className="font-semibold opacity-80">
            You spelled: {words.map((w) => w.text).join(", ")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onExit}
              className="rounded-full bg-white px-6 py-3 font-bold text-amber-700 shadow active:scale-95"
            >
              All levels
            </button>
            {level < TOTAL_LEVELS && (
              <button
                onClick={onNext}
                className="rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow active:scale-95"
              >
                Level {level + 1} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Playing ---- */
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm transition-all hover:shadow active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Levels
        </button>
        <span
          className={`rounded-full ${band.bg} ${band.text} px-4 py-1.5 text-sm font-extrabold ring-2 ring-white/70`}
        >
          Level {level}
        </span>
      </div>

      {/* Word progress */}
      <div className="mt-3 flex items-center gap-1.5">
        {words.map((_, i) => (
          <span
            key={i}
            className={`text-xl ${i < round ? "" : i === round ? "animate-pulse" : "opacity-30 grayscale"}`}
          >
            ⭐
          </span>
        ))}
        <span className="ml-1 text-sm font-bold text-zinc-400">
          Word {round + 1} of {words.length}
        </span>
      </div>

      <div className="mt-4 flex w-full flex-col items-center gap-6 rounded-[2rem] bg-gradient-to-br from-[#CFF5E1] to-[#9FE7C3] px-6 py-8 text-emerald-900 shadow-lg ring-4 ring-white/60">
        <div className="text-7xl">{word.emoji}</div>

        <div className="flex gap-2">
          <button
            onClick={() => speak(word.text, 0.8)}
            className="rounded-full bg-white/70 px-4 py-2 font-bold text-emerald-700 shadow-sm backdrop-blur active:scale-95"
          >
            🔊 Hear word
          </button>
          <button
            onClick={() =>
              word.sounds.forEach((g, i) =>
                setTimeout(() => playSoundClip(g, word.say[i]), i * 950),
              )
            }
            className="rounded-full bg-white/70 px-4 py-2 font-bold text-emerald-700 shadow-sm backdrop-blur active:scale-95"
          >
            🐢 Sound it out
          </button>
        </div>

        {/* Grapheme slots */}
        <div className="flex flex-wrap justify-center gap-3">
          {word.sounds.map((g, i) => {
            const isWrongHere = !!wrong && i === filled;
            return (
              <div
                key={i}
                className={`flex h-16 min-w-14 items-center justify-center rounded-2xl px-2 text-3xl font-black lowercase ${
                  i < filled
                    ? "bg-white text-emerald-600 shadow-sm"
                    : isWrongHere
                      ? "animate-pulse bg-rose-200 text-rose-700"
                      : "border-2 border-dashed border-emerald-500/50"
                }`}
              >
                {i < filled ? g : isWrongHere ? wrong!.g : ""}
              </div>
            );
          })}
        </div>

        {wordDone && (
          <span className="text-2xl font-bold">🎉 {word.text}!</span>
        )}
      </div>

      {/* Grapheme tiles */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tap(tile)}
            disabled={used.has(tile.id)}
            className={`flex h-16 min-w-16 items-center justify-center rounded-2xl px-3 text-3xl font-black lowercase shadow-sm transition-all active:scale-90 ${
              used.has(tile.id)
                ? "bg-brand-100 text-brand-400 dark:bg-zinc-800 dark:text-zinc-600"
                : wrong?.id === tile.id
                  ? "animate-pulse bg-rose-200 text-rose-700"
                  : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {tile.g}
          </button>
        ))}
      </div>
    </div>
  );
}
