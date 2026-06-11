"use client";

import { useEffect, useState } from "react";
import { levels as storyLevels } from "@/app/stories";
import { speak, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

const TOTAL_LEVELS = 50;

/** Strip punctuation/case so spoken and printed words can be compared. */
function norm(w: string) {
  return w.toLowerCase().replace(/[.,!?;:'"”“]/g, "");
}

/* All usable sentences from the whole story library, easiest (shortest)
   first — so level 1 gets tiny sentences and level 50 gets long ones. */
const ALL_SENTENCES: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lvl of storyLevels) {
    for (const story of lvl.stories) {
      for (const raw of story.pages[0].text.match(/[^.!?]+[.!?]?/g) ?? []) {
        const s = raw.trim();
        const n = s.split(/\s+/).length;
        if (n >= 3 && n <= 14 && !seen.has(s.toLowerCase())) {
          seen.add(s.toLowerCase());
          out.push(s);
        }
      }
    }
  }
  return out.sort(
    (a, b) => a.split(/\s+/).length - b.split(/\s+/).length || a.localeCompare(b),
  );
})();

/** Deterministic slice of sentences for a level: higher level = harder. */
function levelSentences(level: number, count: number): string[] {
  const n = ALL_SENTENCES.length;
  if (n === 0) return [];
  const start = Math.floor(((level - 1) / TOTAL_LEVELS) * n);
  const stride = Math.max(1, Math.floor(n / TOTAL_LEVELS / count) || 1);
  return Array.from(
    { length: count },
    (_, k) => ALL_SENTENCES[(start + k * stride) % n],
  );
}

type GameId = "build" | "find" | "missing" | "flash";

const GAMES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  {
    id: "build",
    title: "Sentence Builder",
    blurb: "Put the words back in order",
    emoji: "🧩",
    color: "from-[#E9DFFF] to-[#D2C0FF]",
    text: "text-violet-700",
  },
  {
    id: "find",
    title: "Word Finder",
    blurb: "Hear a word, find it in the sentence",
    emoji: "🔎",
    color: "from-[#FFD9EA] to-[#FFC0DB]",
    text: "text-pink-700",
  },
  {
    id: "missing",
    title: "Sentence Halves",
    blurb: "Join each beginning to its ending",
    emoji: "🔗",
    color: "from-[#CFF5E1] to-[#A7E9C8]",
    text: "text-emerald-700",
  },
  {
    id: "flash",
    title: "Flash Sentence",
    blurb: "Remember the sentence you saw",
    emoji: "⚡",
    color: "from-[#FFF4BD] to-[#FFE88C]",
    text: "text-amber-700",
  },
];

/* Level-button colours by band of ten. */
const LEVEL_BANDS = [
  "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB] text-pink-700",
  "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1] text-orange-700",
  "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] text-emerald-700",
  "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] text-sky-700",
  "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] text-violet-700",
];

function storeKey(game: GameId) {
  return `storygames-${game}`;
}

function loadDone(game: GameId): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(storeKey(game)) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function StoryGames({
  title,
  onClose,
}: {
  title: string;
  text: string;
  onClose: () => void;
}) {
  const [game, setGame] = useState<GameId | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const active = GAMES.find((g) => g.id === game);

  function openGame(id: GameId) {
    setGame(id);
    setDone(loadDone(id));
    setLevel(null);
  }

  function completeLevel() {
    if (!game || level === null) return;
    setDone((prev) => {
      const next = new Set(prev).add(level);
      localStorage.setItem(storeKey(game), JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Top bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={() =>
            level !== null ? setLevel(null) : game ? setGame(null) : onClose()
          }
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {level !== null ? "Levels" : game ? "Games" : "Story"}
        </button>
        <span className="truncate px-2 font-bold">
          {active ? `${active.emoji} ${active.title}` : title}
        </span>
        <button
          onClick={onClose}
          aria-label="Close games"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-500 active:scale-95 dark:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="mt-8 flex w-full max-w-3xl flex-1 flex-col items-center">
        {!active ? (
          /* ---- Game picker ---- */
          <>
            <h2 className="mb-1 text-2xl font-extrabold">Story games 🎮</h2>
            <p className="mb-6 text-zinc-500">
              Four games · 50 levels each · sentences get harder as you climb!
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openGame(g.id)}
                  className={`group flex flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br ${g.color} ${g.text} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                    {g.emoji}
                  </span>
                  <span className="text-lg font-bold">{g.title}</span>
                  <span className="text-center text-sm font-semibold opacity-80">
                    {g.blurb}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                    50 levels
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : level === null ? (
          /* ---- Level grid for the chosen game ---- */
          <>
            <p className="mb-1 rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-violet-500 shadow-sm">
              ⭐ {done.size} / {TOTAL_LEVELS} levels done
            </p>
            <p className="mb-5 text-sm text-zinc-400">
              Pick a level — sentences grow longer as the numbers climb
            </p>
            <div className="grid w-full grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(
                (lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`relative flex h-12 items-center justify-center rounded-2xl text-base font-black shadow-sm ring-2 ring-white/70 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-90 ${
                      LEVEL_BANDS[Math.floor((lvl - 1) / 10)]
                    }`}
                  >
                    {lvl}
                    {done.has(lvl) && (
                      <span className="absolute -right-1 -top-1 text-xs">⭐</span>
                    )}
                  </button>
                ),
              )}
            </div>
          </>
        ) : (
          /* ---- Playing a level ---- */
          <LevelPlay
            key={`${game}-${level}`}
            game={game as GameId}
            level={level}
            onWin={completeLevel}
            onNext={() =>
              setLevel(level < TOTAL_LEVELS ? level + 1 : null)
            }
            onLevels={() => setLevel(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- One level of any game ---------- */

function LevelPlay({
  game,
  level,
  onWin,
  onNext,
  onLevels,
}: {
  game: GameId;
  level: number;
  onWin: () => void;
  onNext: () => void;
  onLevels: () => void;
}) {
  const [won, setWon] = useState(false);

  function handleDone() {
    setWon(true);
    onWin();
  }

  if (won) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-12 py-10 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
        <div className="text-7xl">🏆</div>
        <h3 className="text-2xl font-extrabold">Level {level} complete!</h3>
        <div className="flex gap-3">
          <button
            onClick={onLevels}
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
    );
  }

  return (
    <>
      <p className="mb-4 rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-zinc-500 shadow-sm">
        Level {level} of {TOTAL_LEVELS}
      </p>
      {game === "build" && (
        <SentenceBuilder sentences={levelSentences(level, 3)} onDone={handleDone} />
      )}
      {game === "find" && (
        <WordFinder sentences={levelSentences(level, 5)} onDone={handleDone} />
      )}
      {game === "missing" && (
        <SentenceHalves sentences={levelSentences(level, 3)} onDone={handleDone} />
      )}
      {game === "flash" && (
        <FlashSentence sentences={levelSentences(level, 3)} onDone={handleDone} />
      )}
    </>
  );
}

/* ---------- Game 1: Sentence Builder ---------- */

type BuildTile = { word: string; id: number };

function SentenceBuilder({
  sentences,
  onDone,
}: {
  sentences: string[];
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [tiles, setTiles] = useState<BuildTile[]>([]);
  const [placed, setPlaced] = useState(0);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [wrongId, setWrongId] = useState<number | null>(null);

  const sentence = sentences[step];
  const words = sentence ? sentence.split(/\s+/) : [];
  const complete = placed === words.length && words.length > 0;

  useEffect(() => {
    if (!sentence) return;
    setTiles(shuffle(sentence.split(/\s+/).map((word, id) => ({ word, id }))));
    setPlaced(0);
    setUsed(new Set());
    speak(sentence, 0.8);
  }, [sentence]);

  if (!sentence) return null;

  function tap(tile: BuildTile) {
    if (used.has(tile.id) || complete) return;
    if (norm(tile.word) === norm(words[placed])) {
      setUsed((prev) => new Set(prev).add(tile.id));
      setPlaced((p) => p + 1);
      if (placed + 1 === words.length) {
        praise();
        speak(sentence, 0.85);
        setTimeout(() => {
          if (step + 1 >= sentences.length) onDone();
          else setStep(step + 1);
        }, 1600);
      }
    } else {
      setWrongId(tile.id);
      speak("Try again");
      setTimeout(() => setWrongId(null), 600);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Sentence {step + 1} of {sentences.length}
      </p>
      <button
        onClick={() => speak(sentence, 0.8)}
        className="flex items-center gap-3 rounded-full bg-brand-100 px-6 py-3 text-lg font-bold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the sentence
      </button>

      <div className="flex min-h-16 w-full flex-wrap items-center justify-center gap-2 rounded-3xl bg-white p-5 shadow-lg dark:bg-zinc-900">
        {words.map((w, i) =>
          i < placed ? (
            <span
              key={i}
              className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xl font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
            >
              {w}
            </span>
          ) : (
            <span
              key={i}
              className="h-9 w-14 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700"
            />
          ),
        )}
        {complete && <span className="text-2xl">🎉</span>}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tap(tile)}
            disabled={used.has(tile.id)}
            className={`rounded-2xl px-4 py-3 text-xl font-bold shadow-sm transition-all active:scale-90 ${
              used.has(tile.id)
                ? "bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600"
                : wrongId === tile.id
                  ? "animate-pulse bg-rose-200 text-rose-700"
                  : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {tile.word}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Game 2: Word Finder ---------- */

type FindRound = { sentence: string; target: string };

function WordFinder({
  sentences,
  onDone,
}: {
  sentences: string[];
  onDone: () => void;
}) {
  const [rounds] = useState<FindRound[]>(() =>
    sentences.map((sentence) => {
      const candidates = sentence
        .split(/\s+/)
        .map(norm)
        .filter((w) => w.length >= 3);
      return {
        sentence,
        target: candidates.length
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : norm(sentence.split(/\s+/)[0]),
      };
    }),
  );
  const [step, setStep] = useState(0);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);

  const round = rounds[step];

  useEffect(() => {
    if (round) speak(round.target, 0.85);
  }, [round]);

  if (!round) return null;

  function pick(word: string, i: number) {
    if (norm(word) === round.target) {
      praise();
      setWrongIdx(null);
      if (step + 1 >= rounds.length) onDone();
      else setStep(step + 1);
    } else {
      setWrongIdx(i);
      speak("Try again");
      setTimeout(() => setWrongIdx(null), 600);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <button
        onClick={() => speak(round.target, 0.85)}
        className="flex items-center gap-3 rounded-full bg-brand-100 px-6 py-4 text-xl font-bold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the word
      </button>
      <p className="text-zinc-500">Tap that word in the sentence</p>
      <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-3xl bg-white p-6 text-2xl font-bold shadow-lg dark:bg-zinc-900">
        {round.sentence.split(/\s+/).map((w, i) => (
          <button
            key={i}
            onClick={() => pick(w, i)}
            className={`rounded-xl px-2 py-1 transition-colors ${
              wrongIdx === i
                ? "animate-pulse bg-rose-200 text-rose-700"
                : "text-zinc-700 hover:bg-brand-100 dark:text-zinc-200 dark:hover:bg-brand-950"
            }`}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Game 3: Sentence Halves ---------- */

type HalfPair = { id: number; left: string; right: string };

function splitHalves(sentence: string): { left: string; right: string } {
  const words = sentence.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return { left: words.slice(0, mid).join(" "), right: words.slice(mid).join(" ") };
}

function SentenceHalves({
  sentences,
  onDone,
}: {
  sentences: string[];
  onDone: () => void;
}) {
  const [pairs] = useState<HalfPair[]>(() =>
    sentences.map((sen, id) => ({ id, ...splitHalves(sen) })),
  );
  const [rights] = useState(() => shuffle(pairs.map((p) => p.id)));
  const [chosenLeft, setChosenLeft] = useState<number | null>(null);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [wrongRight, setWrongRight] = useState<number | null>(null);

  const complete = solved.size === pairs.length && pairs.length > 0;

  useEffect(() => {
    if (complete) {
      praise();
      const t = setTimeout(onDone, 1400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  if (!pairs.length) return null;

  function pickLeft(id: number) {
    if (solved.has(id)) return;
    setChosenLeft(id);
    speak(pairs[id].left, 0.85);
  }

  function pickRight(id: number) {
    if (solved.has(id) || chosenLeft === null) return;
    if (id === chosenLeft) {
      setSolved((prev) => new Set(prev).add(id));
      setChosenLeft(null);
      speak(`${pairs[id].left} ${pairs[id].right}`, 0.85);
    } else {
      setWrongRight(id);
      speak("Try again");
      setTimeout(() => setWrongRight(null), 600);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-zinc-500">
        Tap a beginning, then tap the ending that finishes it!
      </p>
      <div className="grid w-full grid-cols-2 gap-3">
        {/* Beginnings, in order */}
        <div className="flex flex-col gap-3">
          {pairs.map((p) => (
            <button
              key={p.id}
              onClick={() => pickLeft(p.id)}
              disabled={solved.has(p.id)}
              className={`min-h-16 rounded-2xl border-4 px-4 py-3 text-left text-base font-bold shadow-sm transition-all active:scale-[0.98] sm:text-lg ${
                solved.has(p.id)
                  ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-950"
                  : chosenLeft === p.id
                    ? "border-brand-400 bg-white text-brand-700 dark:bg-zinc-900"
                    : "border-transparent bg-white text-zinc-700 hover:border-brand-200 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {p.left}…
            </button>
          ))}
        </div>
        {/* Endings, shuffled */}
        <div className="flex flex-col gap-3">
          {rights.map((id) => (
            <button
              key={id}
              onClick={() => pickRight(id)}
              disabled={solved.has(id)}
              className={`min-h-16 rounded-2xl border-4 px-4 py-3 text-left text-base font-bold shadow-sm transition-all active:scale-[0.98] sm:text-lg ${
                solved.has(id)
                  ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-950"
                  : wrongRight === id
                    ? "animate-pulse border-rose-400 bg-white text-rose-600 dark:bg-zinc-900"
                    : "border-transparent bg-white text-zinc-700 hover:border-brand-200 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              …{pairs[id].right}
            </button>
          ))}
        </div>
      </div>
      {complete && <span className="text-3xl">🎉</span>}
    </div>
  );
}

/* ---------- Game 4: Flash Sentence ---------- */

type FlashRound = { sentence: string; options: string[] };

/** A slightly wrong copy: two neighbouring words swapped. */
function swapped(sentence: string): string {
  const words = sentence.split(/\s+/);
  if (words.length < 3) return words.slice().reverse().join(" ");
  const i = 1 + Math.floor(Math.random() * (words.length - 2));
  const copy = [...words];
  [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
  return copy.join(" ");
}

function FlashSentence({
  sentences,
  onDone,
}: {
  sentences: string[];
  onDone: () => void;
}) {
  const [rounds] = useState<FlashRound[]>(() =>
    sentences.map((sentence) => {
      const wrong1 = swapped(sentence);
      let wrong2 = swapped(sentence);
      if (wrong2 === wrong1) wrong2 = swapped(wrong1);
      return {
        sentence,
        options: shuffle(
          [sentence, wrong1, wrong2].filter(
            (v, i, arr) => arr.indexOf(v) === i,
          ),
        ),
      };
    }),
  );
  const [step, setStep] = useState(0);
  const [showing, setShowing] = useState(true);
  const [wrong, setWrong] = useState<string | null>(null);

  const round = rounds[step];

  useEffect(() => {
    if (!round) return;
    setShowing(true);
    speak(round.sentence, 0.85);
    const t = setTimeout(() => setShowing(false), 3000);
    return () => clearTimeout(t);
  }, [round]);

  if (!round) return null;

  function pick(option: string) {
    if (showing) return;
    if (option === round.sentence) {
      praise();
      setWrong(null);
      if (step + 1 >= rounds.length) onDone();
      else setStep(step + 1);
    } else {
      setWrong(option);
      speak("Try again");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <div className="flex min-h-24 w-full items-center justify-center rounded-3xl bg-white px-6 py-6 text-center text-xl font-bold shadow-lg dark:bg-zinc-900 sm:text-2xl">
        {showing ? (
          <span className="text-violet-600">“{round.sentence}”</span>
        ) : (
          <span className="text-3xl">🙈</span>
        )}
      </div>
      <p className="text-zinc-500">
        {showing
          ? "Remember this sentence…"
          : "Which sentence did you see?"}
      </p>
      {!showing && (
        <div className="flex w-full flex-col gap-3">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`rounded-2xl border-4 bg-white px-5 py-4 text-lg font-bold shadow-sm transition-all active:scale-[0.98] dark:bg-zinc-900 ${
                wrong === opt
                  ? "animate-pulse border-rose-400 text-rose-600"
                  : "border-transparent text-zinc-700 hover:border-brand-300 dark:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
