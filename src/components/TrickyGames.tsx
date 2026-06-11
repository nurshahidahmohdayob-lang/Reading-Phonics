"use client";

import { useEffect, useRef, useState } from "react";
import type { TrickySet, TrickyWord } from "@/app/tricky";
import { speak, playClip, praise } from "@/lib/speak";
import { sample, shuffle } from "@/lib/random";

/** Say a tricky word with its real recording, falling back to TTS. */
function sayWord(word: string) {
  playClip(`tricky-${word.toLowerCase()}`, () => speak(word, 0.85));
}

type GameId = "missing" | "spell" | "train" | "whack" | "same";

const GAMES: {
  id: GameId;
  title: string;
  blurb: string;
  emoji: string;
  color: string;
  text: string;
}[] = [
  {
    id: "missing",
    title: "Missing Word",
    blurb: "Fill the gap in the sentence",
    emoji: "✏️",
    color: "from-[#CFF5E1] to-[#A7E9C8]",
    text: "text-emerald-700",
  },
  {
    id: "spell",
    title: "Spell It",
    blurb: "Hear the word, tap its letters",
    emoji: "🐝",
    color: "from-[#FFE8C9] to-[#FFD3A1]",
    text: "text-orange-700",
  },
  {
    id: "train",
    title: "Word Train",
    blurb: "Tap the words in the order you heard",
    emoji: "🚂",
    color: "from-[#D3EBFF] to-[#ABD9FF]",
    text: "text-sky-700",
  },
  {
    id: "whack",
    title: "Whack-a-Word",
    blurb: "Bop the word when it pops up!",
    emoji: "🔨",
    color: "from-[#FFD9EA] to-[#FFC0DB]",
    text: "text-pink-700",
  },
  {
    id: "same",
    title: "Same or Not?",
    blurb: "Does the voice match the card?",
    emoji: "🤔",
    color: "from-[#E9DFFF] to-[#D2C0FF]",
    text: "text-violet-700",
  },
];

export default function TrickyGames({
  set,
  onClose,
}: {
  set: TrickySet;
  onClose: () => void;
}) {
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
          ← {game ? "Games" : "Words"}
        </button>
        <span className="flex items-center gap-2 text-lg font-bold">
          {set.emoji}
          <span className="rounded-lg bg-brand-100 px-3 py-1 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {set.color} set
          </span>
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
          <>
            <h2 className="mb-1 text-2xl font-extrabold">Choose a game 🎮</h2>
            <p className="mb-6 text-zinc-500">
              Practice the {set.color.toLowerCase()} tricky words
            </p>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
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
            {game === "missing" && <MissingWord set={set} />}
            {game === "spell" && <SpellIt set={set} />}
            {game === "train" && <WordTrain set={set} />}
            {game === "whack" && <WhackWord set={set} />}
            {game === "same" && <SameOrNot set={set} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Shared bits ---------- */

function WinCard({
  emoji,
  title,
  detail,
  onAgain,
}: {
  emoji: string;
  title: string;
  detail?: string;
  onAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-7xl">{emoji}</div>
      <h3 className="text-2xl font-bold">{title}</h3>
      {detail && <p className="text-zinc-500">{detail}</p>}
      <button
        onClick={onAgain}
        className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
      >
        Play again 🔁
      </button>
    </div>
  );
}

/* ---------- Game 1: Missing Word ---------- */

type Round = { target: TrickyWord; options: TrickyWord[] };

function buildRounds(set: TrickySet, n = 5): Round[] {
  return sample(set.words, Math.min(n, set.words.length)).map((target) => ({
    target,
    options: shuffle([
      target,
      ...sample(set.words.filter((w) => w.word !== target.word), 2),
    ]),
  }));
}

function MissingWord({ set }: { set: TrickySet }) {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(set));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState(false);

  const round = rounds[step];
  const gapped = round.target.sentence.replace(
    new RegExp(`\\b${round.target.word}\\b`, "i"),
    "_____",
  );

  function pick(w: TrickyWord) {
    if (solved) return;
    if (w.word === round.target.word) {
      praise();
      setWrong(null);
      setSolved(true);
      setScore((s) => s + 1);
      speak(round.target.sentence, 0.85);
      setTimeout(() => {
        setSolved(false);
        if (step + 1 >= rounds.length) setDone(true);
        else setStep(step + 1);
      }, 1800);
    } else {
      setWrong(w.word);
      speak("Try again");
    }
  }

  function restart() {
    setRounds(buildRounds(set));
    setStep(0);
    setScore(0);
    setWrong(null);
    setSolved(false);
    setDone(false);
  }

  if (done)
    return (
      <WinCard
        emoji="🌟"
        title="Well done!"
        detail={`Score: ${score} / ${rounds.length}`}
        onAgain={restart}
      />
    );

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length}
      </p>
      <div className="rounded-3xl bg-white px-8 py-6 text-center text-2xl font-bold shadow-lg dark:bg-zinc-900">
        {solved ? (
          <span className="text-emerald-600">“{round.target.sentence}” ✓</span>
        ) : (
          <>“{gapped}”</>
        )}
      </div>
      <p className="text-zinc-500">Which word fills the gap?</p>
      <div className="flex flex-wrap justify-center gap-4">
        {round.options.map((w) => (
          <button
            key={w.word}
            onClick={() => pick(w)}
            className={`rounded-2xl border-4 bg-white px-6 py-5 text-2xl font-black shadow-sm transition-all active:scale-95 dark:bg-zinc-900 ${
              wrong === w.word
                ? "animate-pulse border-rose-400 text-rose-600"
                : "border-transparent text-zinc-700 hover:border-brand-300 dark:text-zinc-200"
            }`}
          >
            {w.word}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Game 2: Spell It ---------- */

type LetterTile = { ch: string; id: number };

/** Jumble letters, guaranteeing they never start in the correct order. */
function scramble(chars: string[]): string[] {
  if (new Set(chars).size < 2) return [...chars];
  const original = chars.join("");
  let out = shuffle(chars);
  for (let i = 0; i < 12 && out.join("") === original; i++) out = shuffle(chars);
  return out;
}

function SpellIt({ set }: { set: TrickySet }) {
  const [words, setWords] = useState<TrickyWord[]>(() => sample(set.words, 4));
  const [step, setStep] = useState(0);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [placed, setPlaced] = useState(0);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const word = words[step];
  const letters = word ? word.word.split("") : [];
  const complete = placed === letters.length && letters.length > 0;

  useEffect(() => {
    if (!word) return;
    setTiles(scramble(word.word.split("")).map((ch, id) => ({ ch, id })));
    setPlaced(0);
    setUsed(new Set());
    sayWord(word.word);
  }, [word]);

  function tap(tile: LetterTile) {
    if (used.has(tile.id) || complete) return;
    if (tile.ch.toLowerCase() === letters[placed].toLowerCase()) {
      setUsed((prev) => new Set(prev).add(tile.id));
      setPlaced((p) => p + 1);
      if (placed + 1 === letters.length) {
        praise();
        sayWord(word.word);
        setTimeout(() => {
          if (step + 1 >= words.length) setDone(true);
          else setStep(step + 1);
        }, 1500);
      }
    } else {
      setWrongId(tile.id);
      speak("Try again");
      setTimeout(() => setWrongId(null), 600);
    }
  }

  function restart() {
    setWords(sample(set.words, 4));
    setStep(0);
    setDone(false);
  }

  if (done)
    return <WinCard emoji="🐝" title="Spelling star!" onAgain={restart} />;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Word {step + 1} of {words.length}
      </p>
      <button
        onClick={() => sayWord(word.word)}
        className="flex items-center gap-3 rounded-full bg-brand-100 px-6 py-4 text-xl font-bold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the word
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((ch, i) => (
          <div
            key={i}
            className={`flex h-14 w-12 items-center justify-center rounded-2xl text-2xl font-black ${
              i < placed
                ? "bg-white text-emerald-600 shadow-sm"
                : "border-2 border-dashed border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {i < placed ? ch : ""}
          </div>
        ))}
        {complete && <span className="self-center text-2xl">🎉</span>}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tap(tile)}
            disabled={used.has(tile.id)}
            style={
              used.has(tile.id)
                ? undefined
                : ({
                    "--tilt": `${(tile.id % 5) * 3 - 6}deg`,
                    animationDelay: `-${tile.id * 0.4}s`,
                  } as React.CSSProperties)
            }
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-sm transition-all active:scale-90 ${
              used.has(tile.id)
                ? "bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600"
                : wrongId === tile.id
                  ? "animate-pulse bg-rose-200 text-rose-700"
                  : "tile-wiggle bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {tile.ch}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Game 3: Word Train (order memory) ---------- */

const TRAIN_ROUNDS = 4;

function WordTrain({ set }: { set: TrickySet }) {
  const [sequence, setSequence] = useState<string[]>(() =>
    sample(set.words, 3).map((w) => w.word),
  );
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const cards = useRef<string[]>(shuffle([...sequence]));

  // Speak the three words in order, like train cars rolling past — each
  // word plays to the END before the next one starts.
  const seqToken = useRef(0);
  function playSequence(words: string[]) {
    const token = ++seqToken.current;
    const playFrom = (i: number) => {
      if (token !== seqToken.current || i >= words.length) return;
      const w = words[i];
      playClip(
        `tricky-${w.toLowerCase()}`,
        () => speak(w, 0.85), // onEnd below also covers this fallback
        () => setTimeout(() => playFrom(i + 1), 350),
      );
    };
    playFrom(0);
  }

  useEffect(() => {
    if (!done) playSequence(sequence);
    return () => {
      seqToken.current++; // leaving the round cancels the chain
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, done]);

  function newRound() {
    const seq = sample(set.words, 3).map((w) => w.word);
    cards.current = shuffle([...seq]);
    setSequence(seq);
    setPicked([]);
    setWrong(null);
  }

  function pick(word: string) {
    if (picked.includes(word)) return;
    if (word === sequence[picked.length]) {
      const next = [...picked, word];
      setPicked(next);
      sayWord(word);
      if (next.length === sequence.length) {
        praise();
        setTimeout(() => {
          if (step + 1 >= TRAIN_ROUNDS) setDone(true);
          else {
            setStep((s) => s + 1);
            newRound();
          }
        }, 1300);
      }
    } else {
      setWrong(word);
      speak("Listen again!");
      setTimeout(() => setWrong(null), 600);
      playSequence(sequence);
      setPicked([]);
    }
  }

  function restart() {
    setStep(0);
    setDone(false);
    newRound();
  }

  if (done) return <WinCard emoji="🚂" title="All aboard! Great memory!" onAgain={restart} />;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Train {step + 1} of {TRAIN_ROUNDS}
      </p>
      <button
        onClick={() => playSequence(sequence)}
        className="flex items-center gap-3 rounded-full bg-brand-100 px-6 py-4 text-xl font-bold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear the train again
      </button>
      <p className="text-zinc-500">
        Tap the words in the order you heard them
      </p>

      {/* The train being loaded */}
      <div className="flex items-center gap-2 text-3xl">
        <span>🚂</span>
        {sequence.map((_, i) => (
          <span
            key={i}
            className={`flex h-12 min-w-16 items-center justify-center rounded-xl px-2 text-base font-black ${
              i < picked.length
                ? "bg-emerald-100 text-emerald-700"
                : "border-2 border-dashed border-zinc-300 text-transparent dark:border-zinc-700"
            }`}
          >
            {i < picked.length ? picked[i] : "·"}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {cards.current.map((word) => (
          <button
            key={word}
            onClick={() => pick(word)}
            disabled={picked.includes(word)}
            className={`rounded-2xl border-4 px-6 py-5 text-2xl font-black shadow-sm transition-all active:scale-95 ${
              picked.includes(word)
                ? "border-transparent bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600"
                : wrong === word
                  ? "animate-pulse border-rose-400 bg-white text-rose-600 dark:bg-zinc-900"
                  : "border-transparent bg-white text-zinc-700 hover:border-brand-300 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Game 4: Whack-a-Word ---------- */

const WHACK_GOAL = 5;
const HOLES = 6;

function WhackWord({ set }: { set: TrickySet }) {
  const [target] = useState(() => sample(set.words, 1)[0].word);
  const [active, setActive] = useState<{ hole: number; word: string } | null>(
    null,
  );
  const [hits, setHits] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [bopped, setBopped] = useState(false);
  const hitsRef = useRef(0);

  const done = hits >= WHACK_GOAL;

  // Pop a word out of a random hole on a steady beat.
  useEffect(() => {
    if (done) {
      setActive(null);
      return;
    }
    const interval = setInterval(() => {
      if (hitsRef.current >= WHACK_GOAL) return;
      const isTarget = Math.random() < 0.45;
      const word = isTarget
        ? target
        : sample(set.words.filter((w) => w.word !== target), 1)[0].word;
      setActive({ hole: Math.floor(Math.random() * HOLES), word });
      setBopped(false);
      setTimeout(() => setActive(null), 950);
    }, 1250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function whack(word: string) {
    if (bopped) return;
    setBopped(true);
    if (word === target) {
      praise();
      hitsRef.current += 1;
      setHits((h) => h + 1);
    } else {
      setMissCount((m) => m + 1);
      speak("Not that one");
    }
  }

  function restart() {
    hitsRef.current = 0;
    setHits(0);
    setMissCount(0);
    setActive(null);
  }

  if (done)
    return (
      <WinCard
        emoji="🔨"
        title="Bop champion!"
        detail={`Misses: ${missCount}`}
        onAgain={restart}
      />
    );

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center text-lg font-semibold">
        Bop the word{" "}
        <button
          onClick={() => sayWord(target)}
          className="rounded-lg bg-brand-100 px-3 py-1 text-xl font-black text-brand-700 dark:bg-brand-950 dark:text-brand-300"
        >
          {target} 🔊
        </button>{" "}
        when it pops up!
      </p>
      <p className="text-sm text-zinc-400">
        Bopped {hits} of {WHACK_GOAL} · Misses: {missCount}
      </p>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: HOLES }, (_, i) => {
          const popped = active?.hole === i;
          return (
            <button
              key={i}
              onClick={() => popped && whack(active!.word)}
              className={`flex h-20 w-24 items-end justify-center rounded-b-[3rem] rounded-t-2xl pb-2 sm:h-24 sm:w-28 shadow-inner transition-colors ${
                popped
                  ? "bg-gradient-to-b from-[#CFF5E1] to-[#A7E9C8]"
                  : "bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
              }`}
            >
              {popped ? (
                <span className="animate-bounce rounded-xl bg-white px-2.5 py-1.5 text-base font-black sm:px-3 sm:py-2 sm:text-lg text-zinc-700 shadow-md">
                  {active!.word}
                </span>
              ) : (
                <span className="text-2xl opacity-40">🕳️</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Game 5: Same or Not? ---------- */

const SAME_ROUNDS = 8;

type SameRound = { shown: string; spoken: string };

function buildSameRounds(set: TrickySet): SameRound[] {
  return Array.from({ length: SAME_ROUNDS }, () => {
    const shown = sample(set.words, 1)[0].word;
    const matches = Math.random() < 0.55;
    const spoken = matches
      ? shown
      : sample(set.words.filter((w) => w.word !== shown), 1)[0].word;
    return { shown, spoken };
  });
}

function SameOrNot({ set }: { set: TrickySet }) {
  const [rounds, setRounds] = useState<SameRound[]>(() => buildSameRounds(set));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"yay" | "nope" | null>(null);
  const [done, setDone] = useState(false);

  const round = rounds[step];

  useEffect(() => {
    if (round && !done) {
      const t = setTimeout(() => sayWord(round.spoken), 400);
      return () => clearTimeout(t);
    }
  }, [round, done]);

  function answer(saysSame: boolean) {
    if (feedback) return;
    const isSame = round.shown === round.spoken;
    if (saysSame === isSame) {
      praise();
      setScore((s) => s + 1);
      setFeedback("yay");
    } else {
      speak(isSame ? "They were the same!" : "They were different!");
      setFeedback("nope");
    }
    setTimeout(() => {
      setFeedback(null);
      if (step + 1 >= rounds.length) setDone(true);
      else setStep(step + 1);
    }, 1100);
  }

  function restart() {
    setRounds(buildSameRounds(set));
    setStep(0);
    setScore(0);
    setDone(false);
  }

  if (done)
    return (
      <WinCard
        emoji="🤔"
        title="Word judge!"
        detail={`Score: ${score} / ${rounds.length}`}
        onAgain={restart}
      />
    );

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-semibold text-zinc-400">
        Round {step + 1} of {rounds.length} · 💚 {score}
      </p>
      <div
        className={`flex h-28 w-64 items-center justify-center rounded-3xl text-4xl font-black shadow-lg transition-colors ${
          feedback === "yay"
            ? "bg-green-100 text-green-700"
            : feedback === "nope"
              ? "bg-rose-100 text-rose-600"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        }`}
      >
        {round.shown}
      </div>
      <button
        onClick={() => sayWord(round.spoken)}
        className="flex items-center gap-2 rounded-full bg-brand-100 px-5 py-2.5 font-bold text-brand-700 shadow-sm active:scale-95 dark:bg-brand-950 dark:text-brand-300"
      >
        🔊 Hear it again
      </button>
      <p className="text-zinc-500">Is the spoken word the SAME as the card?</p>
      <div className="flex gap-4">
        <button
          onClick={() => answer(true)}
          className="rounded-2xl bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] px-8 py-5 text-2xl font-black text-emerald-700 shadow-md ring-4 ring-white/60 transition-all active:scale-90"
        >
          👍 Same
        </button>
        <button
          onClick={() => answer(false)}
          className="rounded-2xl bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB] px-8 py-5 text-2xl font-black text-pink-700 shadow-md ring-4 ring-white/60 transition-all active:scale-90"
        >
          👎 Different
        </button>
      </div>
    </div>
  );
}
