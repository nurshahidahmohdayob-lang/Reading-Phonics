"use client";

import { useEffect, useRef, useState } from "react";
import type { WordCard, WordFamily } from "@/app/words";
import { playSoundClip, speak, chime, praise, stopSpeech } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

/* ---------- shared helpers ---------- */

type Round = { target: WordCard; options: WordCard[] };

/** Rounds use only THIS family's words, so all options rhyme (e.g. every
    option is an "-ap" word) and the child must blend to choose. */
function buildRounds(family: WordFamily): Round[] {
  const words = family.words;
  const optionCount = Math.min(4, words.length);
  const count = Math.min(8, words.length);
  return sample(words, count).map((target) => {
    const pool = words.filter((w) => w.text !== target.text);
    return { target, options: shuffle([target, ...sample(pool, optionCount - 1)]) };
  });
}

/** Sound each letter out, then say the whole word. */
function useBlend() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => () => {
    clear();
    stopSpeech();
  }, []);
  return (w: WordCard) => {
    stopSpeech();
    clear();
    const stepMs = 700;
    w.say.forEach((s, i) =>
      timers.current.push(
        setTimeout(() => playSoundClip(w.sounds[i] ?? s, s), i * stepMs),
      ),
    );
    timers.current.push(
      setTimeout(() => speak(w.text, 0.8), w.say.length * stepMs),
    );
  };
}

function WinScreen({
  title,
  detail,
  onAgain,
  onBack,
}: {
  title: string;
  detail?: string;
  onAgain: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE07F] px-12 py-10 text-center text-amber-900 shadow-lg ring-4 ring-white/60">
      <div className="text-7xl">🏆</div>
      <h3 className="text-2xl font-extrabold">{title}</h3>
      {detail && <p className="font-bold opacity-80">{detail}</p>}
      <div className="flex gap-3">
        <button
          onClick={onAgain}
          className="rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white shadow active:scale-95"
        >
          🔁 Play again
        </button>
        <button
          onClick={onBack}
          className="rounded-full bg-white px-6 py-3 font-bold text-amber-700 shadow active:scale-95"
        >
          ← More games
        </button>
      </div>
    </div>
  );
}

function Dots({ total, step }: { total: number; step: number }) {
  return (
    <div className="mt-5 flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < step
              ? "bg-brand-400"
              : i === step
                ? "bg-brand-300 ring-2 ring-brand-200"
                : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

/* ---------- Game 1 & 2: guess (word→picture or picture→word) ---------- */

function GuessGame({
  family,
  mode,
  onBack,
}: {
  family: WordFamily;
  mode: "find" | "read"; // find: show word, tap picture · read: show picture, tap word
  onBack: () => void;
}) {
  const blend = useBlend();
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(family));
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const advance = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => advance.current.forEach(clearTimeout), []);

  const round = rounds[step];

  function choose(w: WordCard) {
    if (picked || !round) return;
    setPicked(w.text);
    const ok = w.text === round.target.text;
    chime(ok);
    if (ok) {
      praise();
      setScore((s) => s + 1);
      advance.current.push(
        setTimeout(() => {
          if (step + 1 >= rounds.length) setDone(true);
          else {
            setStep((s) => s + 1);
            setPicked(null);
          }
        }, 950),
      );
    } else {
      advance.current.push(setTimeout(() => setPicked(null), 750));
    }
  }

  function playAgain() {
    setRounds(buildRounds(family));
    setStep(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  return (
    <>
      {done ? (
        <WinScreen
          title={`${family.family} words done!`}
          detail={`You got ${score} / ${rounds.length} right.`}
          onAgain={playAgain}
          onBack={onBack}
        />
      ) : round ? (
        <>
          <Dots total={rounds.length} step={step} />
          <p className="mt-5 text-sm font-bold text-zinc-400">
            {mode === "find"
              ? "Read the word, then tap its picture"
              : "Look at the picture, then tap its word"}
          </p>

          {/* Prompt */}
          <div className="mt-2 flex flex-col items-center gap-3">
            {mode === "find" ? (
              <span className="text-6xl font-black lowercase tracking-wide text-zinc-800 dark:text-zinc-100">
                {round.target.text}
              </span>
            ) : (
              <span className="text-8xl">{round.target.emoji}</span>
            )}
            <button
              onClick={() => blend(round.target)}
              className="rounded-full bg-brand-100 px-5 py-2 text-sm font-bold text-brand-700 shadow-sm active:scale-95 dark:bg-brand-950 dark:text-brand-300"
            >
              🔉 Sound it out
            </button>
          </div>

          {/* Options */}
          <div className="mt-6 grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
            {round.options.map((opt) => {
              const isTarget = opt.text === round.target.text;
              const isRight = picked !== null && isTarget;
              const isWrong = picked === opt.text && !isTarget;
              return (
                <button
                  key={opt.text}
                  onClick={() => choose(opt)}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[1.5rem] border-4 bg-white shadow-md transition-all active:scale-95 dark:bg-zinc-900 ${
                    isRight
                      ? "border-green-400 bg-green-50"
                      : isWrong
                        ? "animate-pulse border-rose-300 bg-rose-50"
                        : "border-transparent hover:-translate-y-1 hover:border-brand-200"
                  }`}
                >
                  {mode === "find" ? (
                    <span className="text-6xl">{opt.emoji}</span>
                  ) : (
                    <span className="text-2xl font-black lowercase text-zinc-700 dark:text-zinc-200">
                      {opt.text}
                    </span>
                  )}
                  {isRight && <span className="text-2xl">🎉</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}

/* ---------- Game 3: memory match (word ↔ picture) ---------- */

type Card = { id: number; word: WordCard; kind: "word" | "pic" };

function buildCards(family: WordFamily): Card[] {
  const pairs = Math.min(5, family.words.length);
  const picks = sample(family.words, pairs);
  const cards: Card[] = [];
  let id = 0;
  for (const w of picks) {
    cards.push({ id: id++, word: w, kind: "word" });
    cards.push({ id: id++, word: w, kind: "pic" });
  }
  return shuffle(cards);
}

function MatchGame({
  family,
  onBack,
}: {
  family: WordFamily;
  onBack: () => void;
}) {
  const blend = useBlend();
  const [cards, setCards] = useState<Card[]>(() => buildCards(family));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const flipBack = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (flipBack.current) clearTimeout(flipBack.current);
  }, []);

  const pairs = new Set(cards.map((c) => c.word.text)).size;
  const won = matched.length === pairs && pairs > 0;

  function flip(card: Card) {
    if (
      flipped.length === 2 ||
      flipped.includes(card.id) ||
      matched.includes(card.word.text)
    )
      return;
    blend(card.word);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
      if (a.word.text === b.word.text && a.kind !== b.kind) {
        praise();
        setMatched((m) => [...m, a.word.text]);
        setFlipped([]);
      } else {
        chime(false);
        flipBack.current = setTimeout(() => setFlipped([]), 850);
      }
    }
  }

  function playAgain() {
    setCards(buildCards(family));
    setFlipped([]);
    setMatched([]);
  }

  if (won) {
    return (
      <WinScreen
        title={`All ${family.family} pairs matched!`}
        onAgain={playAgain}
        onBack={onBack}
      />
    );
  }

  return (
    <>
      <p className="mt-5 text-sm font-bold text-zinc-400">
        Flip two cards — match each word to its picture
      </p>
      <div className="mt-4 grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const isUp =
            flipped.includes(card.id) || matched.includes(card.word.text);
          const isMatched = matched.includes(card.word.text);
          return (
            <button
              key={card.id}
              onClick={() => flip(card)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-4 shadow-md transition-all active:scale-95 ${
                isUp
                  ? isMatched
                    ? "border-green-300 bg-green-50"
                    : "border-brand-300 bg-white dark:bg-zinc-900"
                  : "border-transparent bg-gradient-to-br from-brand-400 to-brand-600 hover:-translate-y-1"
              }`}
            >
              {isUp ? (
                card.kind === "pic" ? (
                  <span className="text-5xl">{card.word.emoji}</span>
                ) : (
                  <span className="text-xl font-black lowercase text-zinc-700 dark:text-zinc-200">
                    {card.word.text}
                  </span>
                )
              ) : (
                <span className="text-3xl text-white/90">❓</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Hub ---------- */

type GameId = "find" | "read" | "match";

const GAMES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  { id: "find", title: "Read & Find", blurb: "Read the word, tap its picture", emoji: "🔎", color: "from-[#D3EBFF] to-[#ABD9FF]", text: "text-sky-700" },
  { id: "read", title: "Picture & Read", blurb: "See a picture, tap its word", emoji: "🖼️", color: "from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" },
  { id: "match", title: "Match Pairs", blurb: "Match each word to its picture", emoji: "🃏", color: "from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" },
];

export default function BlendingGames({
  family,
  onClose,
}: {
  family: WordFamily;
  onClose: () => void;
}) {
  const [game, setGame] = useState<GameId | null>(null);

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      {/* Top bar */}
      <div className="flex w-full items-center justify-between">
        <button
          onClick={() => {
            stopSpeech();
            if (game) setGame(null);
            else onClose();
          }}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← {game ? "Games" : "Blending"}
        </button>
        <span
          className={`rounded-full bg-gradient-to-br ${family.color} ${family.text} px-4 py-1.5 text-sm font-extrabold shadow-sm`}
        >
          {family.family} words
        </span>
        <span className="w-16" />
      </div>

      {!game ? (
        <>
          <h2 className="mt-6 text-2xl font-extrabold">
            Pick a {family.family} game 🎮
          </h2>
          <p className="mb-6 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Every game uses the {family.family} words you just blended.
          </p>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGame(g.id)}
                className={`group flex flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br ${g.color} ${g.text} px-4 py-8 shadow-lg ring-4 ring-white/60 transition-transform hover:-translate-y-1 active:scale-95`}
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:scale-110">
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
      ) : game === "match" ? (
        <MatchGame
          key={`match-${family.family}`}
          family={family}
          onBack={() => setGame(null)}
        />
      ) : (
        <GuessGame
          key={`${game}-${family.family}`}
          family={family}
          mode={game}
          onBack={() => setGame(null)}
        />
      )}
    </div>
  );
}
