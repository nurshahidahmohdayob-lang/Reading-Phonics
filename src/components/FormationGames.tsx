"use client";

import { useEffect, useState } from "react";
import { speak, playClip, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";
import SoundSimon from "@/components/games/SoundSimon";

/** Letters whose mirror image is clearly "backwards" (and never looks like
    another real letter, the way a mirrored b looks like d). */
const MIRROR_POOL = "acefghjkmnrstyz".split("");
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function sayLetter(letter: string) {
  playClip(letter, () => speak(letter, 0.85));
}

type GameId = "mirror" | "case" | "order" | "simon";

const GAMES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  {
    id: "mirror",
    title: "Mirror Spot",
    blurb: "Tap the letters facing the right way",
    emoji: "🪞",
    color: "from-[#D3EBFF] to-[#ABD9FF]",
    text: "text-sky-700",
  },
  {
    id: "case",
    title: "Big & Small",
    blurb: "Sort letters into BIG and small bins",
    emoji: "🔠",
    color: "from-[#CFF5E1] to-[#A7E9C8]",
    text: "text-emerald-700",
  },
  {
    id: "order",
    title: "Alphabet Order",
    blurb: "Which letter comes next?",
    emoji: "🔤",
    color: "from-[#FFD9EA] to-[#FFC0DB]",
    text: "text-pink-700",
  },
  {
    id: "simon",
    title: "Sound Simon",
    blurb: "Echo the growing chain of sounds",
    emoji: "🔔",
    color: "from-[#FFF4BD] to-[#FFE88C]",
    text: "text-amber-700",
  },
];

export default function FormationGames({ onClose }: { onClose: () => void }) {
  const [game, setGame] = useState<GameId | null>(null);
  const active = GAMES.find((g) => g.id === game);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Top bar */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <button
          onClick={() => (game ? setGame(null) : onClose())}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {game ? "Games" : "Writing"}
        </button>
        <span className="text-lg font-bold">✍️ Letter games</span>
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
          <>
            <h2 className="mb-1 text-2xl font-extrabold">Choose a game 🎮</h2>
            <p className="mb-6 text-zinc-500">
              Letter shapes, big and small, and alphabet order
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGame(g.id)}
                  className={`group flex flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br ${g.color} ${g.text} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                    {g.emoji}
                  </span>
                  <span className="text-lg font-bold">{g.title}</span>
                  <span className="text-center text-sm font-semibold opacity-80">
                    {g.blurb}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-center">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold">
              <span className="text-3xl">{active.emoji}</span> {active.title}
            </h2>
            {game === "mirror" && <MirrorSpot />}
            {game === "case" && <CaseMatch />}
            {game === "order" && <AlphabetOrder />}
            {game === "simon" && <SoundSimon />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Game 1: Mirror Spot ---------- */

const MIRROR_ROUNDS = 3;

type MirrorTile = { id: number; flipped: boolean };

function buildMirrorRound() {
  const letter = sample(MIRROR_POOL, 1)[0];
  const correctCount = 3 + Math.floor(Math.random() * 2); // 3 or 4
  const tiles: MirrorTile[] = shuffle(
    Array.from({ length: 8 }, (_, i) => ({ id: i, flipped: i >= correctCount })),
  ).map((t, id) => ({ ...t, id }));
  return { letter, tiles, correctCount };
}

function MirrorSpot() {
  const [round, setRound] = useState(() => buildMirrorRound());
  const [step, setStep] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [missCount, setMissCount] = useState(0);
  const [done, setDone] = useState(false);

  const complete = found.size === round.correctCount;

  useEffect(() => {
    if (complete && !done) {
      praise();
      const t = setTimeout(() => {
        if (step + 1 >= MIRROR_ROUNDS) setDone(true);
        else {
          setStep((s) => s + 1);
          setRound(buildMirrorRound());
          setFound(new Set());
        }
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [complete, done, step]);

  function tap(tile: MirrorTile) {
    if (found.has(tile.id) || complete) return;
    if (!tile.flipped) {
      setFound((prev) => new Set(prev).add(tile.id));
      sayLetter(round.letter);
    } else {
      setMissCount((m) => m + 1);
      speak("Oops, that one is backwards!");
    }
  }

  function restart() {
    setRound(buildMirrorRound());
    setStep(0);
    setFound(new Set());
    setMissCount(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🪞</div>
        <h3 className="text-2xl font-bold">Sharp eyes!</h3>
        <p className="text-zinc-500">Misses: {missCount}</p>
        <button
          onClick={restart}
          className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Play again 🔁
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {MIRROR_ROUNDS}
      </p>
      <p className="text-center text-lg font-semibold">
        Some letters are backwards! Tap every{" "}
        <span className="rounded-lg bg-sky-100 px-3 py-1 text-2xl font-black text-sky-700">
          {round.letter}
        </span>{" "}
        facing the right way
      </p>
      <p className="text-sm text-zinc-400">
        Found {found.size} of {round.correctCount}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {round.tiles.map((tile) => {
          const caught = found.has(tile.id);
          return (
            <button
              key={tile.id}
              onClick={() => tap(tile)}
              disabled={caught}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl text-5xl font-black shadow-md ring-2 ring-white/70 transition-all active:scale-90 ${
                caught
                  ? "bg-green-100 text-green-600"
                  : "bg-white text-zinc-700 hover:scale-105 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
              style={
                tile.flipped && !caught ? { transform: "scaleX(-1)" } : undefined
              }
            >
              {caught ? "⭐" : round.letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Game 2: Big & Small (sorting bins) ---------- */

const BIN_ROUNDS = 10;

type BinCard = { letter: string; upper: boolean };

function buildBinCards(): BinCard[] {
  return Array.from({ length: BIN_ROUNDS }, () => ({
    letter: sample(ALPHABET, 1)[0],
    upper: Math.random() < 0.5,
  }));
}

function CaseMatch() {
  const [cards, setCards] = useState<BinCard[]>(() => buildBinCards());
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"yay" | "nope" | null>(null);
  const [done, setDone] = useState(false);

  const card = cards[step];

  useEffect(() => {
    if (card && !done) sayLetter(card.letter);
  }, [card, done]);

  function drop(saysUpper: boolean) {
    if (feedback) return;
    if (saysUpper === card.upper) {
      praise();
      setScore((s) => s + 1);
      setFeedback("yay");
    } else {
      speak(card.upper ? "That one is a BIG letter!" : "That one is a small letter!");
      setFeedback("nope");
    }
    setTimeout(() => {
      setFeedback(null);
      if (step + 1 >= cards.length) setDone(true);
      else setStep(step + 1);
    }, 900);
  }

  function restart() {
    setCards(buildBinCards());
    setStep(0);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🧺</div>
        <h3 className="text-2xl font-bold">Sorting champion!</h3>
        <p className="text-zinc-500">
          Score: {score} / {cards.length}
        </p>
        <button
          onClick={restart}
          className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Play again 🔁
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Letter {step + 1} of {cards.length} · 💚 {score}
      </p>
      <p className="text-zinc-500">Is this a BIG letter or a small letter?</p>
      <div
        className={`flex h-28 w-28 items-center justify-center rounded-3xl text-6xl font-black shadow-lg transition-colors ${
          feedback === "yay"
            ? "bg-green-100 text-green-700"
            : feedback === "nope"
              ? "bg-rose-100 text-rose-600"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        }`}
      >
        {card.upper ? card.letter.toUpperCase() : card.letter}
      </div>
      <div className="flex gap-5">
        <button
          onClick={() => drop(true)}
          className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] px-8 py-5 text-sky-700 shadow-md ring-4 ring-white/60 transition-all active:scale-90"
        >
          <span className="text-3xl">🧺</span>
          <span className="text-xl font-black">BIG</span>
        </button>
        <button
          onClick={() => drop(false)}
          className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] px-8 py-5 text-emerald-700 shadow-md ring-4 ring-white/60 transition-all active:scale-90"
        >
          <span className="text-3xl">🧺</span>
          <span className="text-xl font-black">small</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Game 3: Alphabet Order ---------- */

const ORDER_ROUNDS = 5;

type OrderRound = { run: string[]; answer: string; options: string[] };

function buildOrderRounds(): OrderRound[] {
  return sample(
    Array.from({ length: 23 }, (_, i) => i), // start index for a run of 3
    ORDER_ROUNDS,
  ).map((start) => {
    const run = ALPHABET.slice(start, start + 3);
    const answer = ALPHABET[start + 3];
    const decoys = sample(
      ALPHABET.filter((c) => c !== answer && !run.includes(c)),
      2,
    );
    return { run, answer, options: shuffle([answer, ...decoys]) };
  });
}

function AlphabetOrder() {
  const [rounds, setRounds] = useState<OrderRound[]>(() => buildOrderRounds());
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const round = rounds[step];

  function pick(letter: string) {
    if (letter === round.answer) {
      praise();
      sayLetter(letter);
      setWrong(null);
      setScore((s) => s + 1);
      if (step + 1 >= rounds.length) setDone(true);
      else setStep(step + 1);
    } else {
      setWrong(letter);
      speak("Try again");
    }
  }

  function restart() {
    setRounds(buildOrderRounds());
    setStep(0);
    setScore(0);
    setWrong(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-7xl">🔤</div>
        <h3 className="text-2xl font-bold">Alphabet ace!</h3>
        <p className="text-zinc-500">
          Score: {score} / {rounds.length}
        </p>
        <button
          onClick={restart}
          className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Play again 🔁
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <p className="text-zinc-500">Which letter comes next?</p>
      <div className="flex items-center gap-3">
        {round.run.map((c) => (
          <span
            key={c}
            className="flex h-16 w-14 items-center justify-center rounded-2xl bg-white text-4xl font-black text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200"
          >
            {c}
          </span>
        ))}
        <span className="flex h-16 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-pink-400 text-3xl font-black text-pink-400">
          ?
        </span>
      </div>
      <div className="flex gap-4">
        {round.options.map((letter) => (
          <button
            key={letter}
            onClick={() => pick(letter)}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-sm transition-all active:scale-90 ${
              wrong === letter
                ? "animate-pulse bg-rose-200 text-rose-700"
                : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
