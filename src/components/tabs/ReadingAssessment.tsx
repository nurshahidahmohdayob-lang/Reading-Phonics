"use client";

import { useEffect, useRef, useState } from "react";
import { levels, classifyAccuracy, type Level, type StoryQuiz } from "@/app/stories";
import { assessmentPassages, type AssessPassage } from "@/app/assessment";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { rateAttempt, alignReading, type Rating } from "@/lib/reading";
import { speak, stopSpeech, chime, praise } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";

/* ---------- Stage 1: a 50-word ladder from easiest to ~Lexile 1050 ---------- */
/* Ordered easy → hard and tagged to a reading level (Year 1 → Year 6). The
   list is read in order and stops once the student misses 3 words in a row. */
const LADDER: { w: string; lvl: number }[] = [
  // Year 1 — single-syllable, simple CVC
  { w: "is", lvl: 0 }, { w: "at", lvl: 0 }, { w: "cat", lvl: 0 }, { w: "dog", lvl: 0 },
  { w: "pin", lvl: 0 }, { w: "sun", lvl: 0 }, { w: "hat", lvl: 0 }, { w: "bed", lvl: 0 },
  { w: "run", lvl: 0 },
  // Year 2 — blends & digraphs
  { w: "ship", lvl: 1 }, { w: "rain", lvl: 1 }, { w: "hand", lvl: 1 }, { w: "jump", lvl: 1 },
  { w: "fish", lvl: 1 }, { w: "with", lvl: 1 }, { w: "that", lvl: 1 }, { w: "must", lvl: 1 },
  { w: "sing", lvl: 1 },
  // Year 3 — two syllables, common longer words
  { w: "green", lvl: 2 }, { w: "dream", lvl: 2 }, { w: "sport", lvl: 2 }, { w: "happy", lvl: 2 },
  { w: "found", lvl: 2 }, { w: "little", lvl: 2 }, { w: "around", lvl: 2 }, { w: "garden", lvl: 2 },
  // Year 4 — multisyllable
  { w: "brave", lvl: 3 }, { w: "strange", lvl: 3 }, { w: "follow", lvl: 3 }, { w: "family", lvl: 3 },
  { w: "animal", lvl: 3 }, { w: "suddenly", lvl: 3 }, { w: "remember", lvl: 3 }, { w: "important", lvl: 3 },
  // Year 5 — richer vocabulary
  { w: "planted", lvl: 4 }, { w: "powerful", lvl: 4 }, { w: "wonderful", lvl: 4 }, { w: "dangerous", lvl: 4 },
  { w: "carefully", lvl: 4 }, { w: "treasure", lvl: 4 }, { w: "discover", lvl: 4 }, { w: "mountain", lvl: 4 },
  // Year 6 — advanced, up to ~Lexile 1050
  { w: "whispering", lvl: 5 }, { w: "determined", lvl: 5 }, { w: "mysterious", lvl: 5 }, { w: "magnificent", lvl: 5 },
  { w: "imagination", lvl: 5 }, { w: "curiosity", lvl: 5 }, { w: "responsibility", lvl: 5 }, { w: "extraordinary", lvl: 5 },
];
/** Stop the word check once this many words in a row are missed (ceiling). */
const STOP_AFTER_MISSES = 3;

/** Suggested level = the hardest level the reader actually read a word from. */
function wordLevel(ratings: Record<string, Rating>): number {
  let max = -1;
  for (const it of LADDER) {
    if (ratings[it.w] === "green") max = Math.max(max, it.lvl);
  }
  return max; // -1 (emerging) .. 5
}

type Phase = "intro" | "words" | "suggest" | "passage" | "comprehension" | "report";
type Comp = { correct: number; total: number } | "skipped" | null;

export default function ReadingAssessment() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [wordRatings, setWordRatings] = useState<Record<string, Rating>>({});
  const [suggestIdx, setSuggestIdx] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [comp, setComp] = useState<Comp>(null);

  useEffect(() => () => stopSpeech(), []);

  const passage = assessmentPassages[suggestIdx];

  function restart() {
    setWordRatings({});
    setAccuracy(null);
    setMissed([]);
    setComp(null);
    setPhase("words");
  }

  if (phase === "words") {
    return (
      <WordRunner
        onExit={() => {
          stopSpeech();
          setPhase("intro");
        }}
        onDone={(r) => {
          setWordRatings(r);
          setSuggestIdx(Math.max(0, wordLevel(r)));
          setPhase("suggest");
        }}
      />
    );
  }

  if (phase === "suggest") {
    const lvl = levels[suggestIdx];
    const emerging = wordLevel(wordRatings) < 0;
    return (
      <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
        <div className="mt-2 flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFC9C2] px-6 py-8 text-center text-rose-900 shadow-lg ring-4 ring-white/60">
          <div className="text-6xl">📚</div>
          <p className="text-sm font-bold uppercase tracking-wide opacity-70">
            Suggested book level
          </p>
          <h2 className="text-3xl font-extrabold">{lvl.grade}</h2>
          <p className="font-semibold opacity-80">
            {emerging
              ? "Still building the first words — let's try the easiest book together."
              : `Age ${lvl.age} · Lexile ${lvl.lexileRange}`}
          </p>
          <p className="text-sm font-semibold opacity-70">{lvl.description}</p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setPhase("passage")}
              className="rounded-full bg-rose-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg active:scale-95"
            >
              📖 Read a story →
            </button>
            <button
              onClick={() => {
                setComp("skipped");
                setPhase("report");
              }}
              className="rounded-full bg-white/70 px-6 py-3 font-bold text-rose-700 shadow-sm active:scale-95"
            >
              Skip to result
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "passage") {
    return (
      <PassageReader
        passage={passage}
        level={levels[suggestIdx]}
        onExit={() => setPhase("suggest")}
        onDone={(acc, miss) => {
          setAccuracy(acc);
          setMissed(miss);
          setPhase("comprehension");
        }}
      />
    );
  }

  if (phase === "comprehension") {
    return (
      <Comprehension
        passage={passage}
        onResult={(correct, total) => {
          setComp({ correct, total });
          setPhase("report");
        }}
        onSkip={() => {
          setComp("skipped");
          setPhase("report");
        }}
      />
    );
  }

  if (phase === "report") {
    return (
      <Report
        wordRatings={wordRatings}
        suggestIdx={suggestIdx}
        accuracy={accuracy}
        missed={missed}
        comp={comp}
        onRetry={restart}
        onHome={() => setPhase("intro")}
      />
    );
  }

  // Intro
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <div className="mt-2 flex w-full max-w-xl flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFC9C2] px-6 py-9 text-center text-rose-900 shadow-lg ring-4 ring-white/60">
        <div className="text-7xl">📋</div>
        <h2 className="text-2xl font-extrabold">Reading Assessment</h2>
        <ol className="flex flex-col gap-2 text-left text-sm font-semibold opacity-80">
          <li>1️⃣ Read words from easy to hard → we suggest a book level</li>
          <li>2️⃣ Read a short story at that level out loud</li>
          <li>3️⃣ Answer a comprehension question (you can skip this)</li>
          <li>4️⃣ Get the reading level that fits the student</li>
        </ol>
        <button
          onClick={() => setPhase("words")}
          className="mt-1 rounded-full bg-rose-500 px-10 py-3.5 text-xl font-extrabold text-white shadow-lg active:scale-95"
        >
          ▶ Start
        </button>
        <p className="text-xs font-semibold opacity-70">
          Best in Chrome or Edge for the microphone — or mark each item by hand.
        </p>
      </div>
    </div>
  );
}

/* ---------- Stage 1 runner: read each word, mic auto-scores ---------- */

function WordRunner({
  onDone,
  onExit,
}: {
  onDone: (r: Record<string, Rating>) => void;
  onExit: () => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const [idx, setIdx] = useState(0);
  const [rated, setRated] = useState<Rating | null>(null);
  const ratings = useRef<Record<string, Rating>>({});
  const consecutiveMiss = useRef(0);
  const justRated = useRef(false);
  const item = LADDER[idx];

  function record(r: Rating) {
    if (justRated.current) return;
    justRated.current = true;
    ratings.current[item.w] = r;
    setRated(r);
    stop();
    chime(r === "green");
    if (r === "green") {
      praise();
      consecutiveMiss.current = 0;
    } else {
      consecutiveMiss.current += 1;
    }
    setTimeout(() => {
      // Stop at the end of the list, or once the words get too hard (the
      // student has missed several in a row) — the ceiling is reached.
      if (
        idx + 1 >= LADDER.length ||
        consecutiveMiss.current >= STOP_AFTER_MISSES
      ) {
        onDone({ ...ratings.current });
      } else {
        setIdx(idx + 1);
      }
    }, 850);
  }

  useEffect(() => {
    justRated.current = false;
    setRated(null);
    reset();
    if (supported) {
      const t = setTimeout(start, 250);
      return () => clearTimeout(t);
    }
  }, [idx, supported, start, reset]);

  useEffect(() => {
    if (!supported || justRated.current) return;
    if (!listening || !transcript.trim()) return;
    record(rateAttempt(item.w, transcript.split(/\s+/)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening, supported]);

  useEffect(() => {
    if (!supported || justRated.current) return;
    if (!listening || transcript.trim()) return;
    const t = setTimeout(() => {
      stop();
      setTimeout(start, 300);
    }, 8000);
    return () => clearTimeout(t);
  }, [listening, transcript, supported, start, stop]);

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onExit}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Exit
        </button>
        <span className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          Word check · easy → hard
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full max-w-xl overflow-hidden rounded-full bg-white/70 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
          style={{ width: `${(idx / LADDER.length) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-bold text-zinc-400">
        {idx + 1} / {LADDER.length}
      </p>

      <div className="mt-4 flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFD0CB] px-6 py-10 text-center text-rose-900 shadow-lg ring-4 ring-white/60">
        <span className="text-sm font-bold uppercase tracking-wide text-rose-500/80">
          Read the word
        </span>
        <span className="text-6xl font-black lowercase text-zinc-800 sm:text-7xl">
          {item.w}
        </span>
        {rated ? (
          <span className="font-bold">
            {rated === "green" ? "✓ Got it!" : rated === "yellow" ? "Almost" : "Not yet"}
          </span>
        ) : supported ? (
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              listening ? "animate-pulse bg-rose-500 text-white" : "bg-white/70 text-rose-700"
            }`}
          >
            {listening ? "👂 Listening…" : "🎤 starting…"}
          </span>
        ) : (
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-rose-700">
            Mark it by hand
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => {
            stop();
            sayWord(item.w, 0.85);
          }}
          className="rounded-full bg-white px-5 py-3 font-bold text-rose-700 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-rose-300"
        >
          🔊 Hear it
        </button>
        <button
          onClick={() => record("green")}
          className="rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-sm active:scale-95"
        >
          ✓ Got it
        </button>
        <button
          onClick={() => record("red")}
          className="rounded-full bg-rose-400 px-5 py-3 font-bold text-white shadow-sm active:scale-95"
        >
          ✗ Not yet
        </button>
      </div>
    </div>
  );
}

/* ---------- Stage 2: read the passage aloud ---------- */

function PassageReader({
  passage,
  level,
  onDone,
  onExit,
}: {
  passage: AssessPassage;
  level: Level;
  onDone: (accuracy: number, missed: string[]) => void;
  onExit: () => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const [page, setPage] = useState(0);
  const pages = passage.pages;
  const fullText = pages.map((p) => p.text).join(" ");
  const words = fullText.split(/\s+/);
  const isLast = page === pages.length - 1;

  function score() {
    stop();
    const spoken = transcript.split(/\s+/).filter(Boolean);
    const status = alignReading(words, spoken);
    const correct = status.filter((s) => s === "correct").length;
    const accuracy = Math.round((correct / words.length) * 100);
    const missed = words
      .filter((_, i) => status[i] !== "correct")
      .map((w) => w.replace(/[.,!?;:"]/g, ""))
      .filter(Boolean);
    onDone(accuracy, missed);
  }

  const cur = pages[page];

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={() => {
            stop();
            onExit();
          }}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Back
        </button>
        <span className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {level.grade} · read the book
        </span>
      </div>

      <h2 className="mt-4 flex items-center gap-2 text-2xl font-extrabold">
        <span className="anim-bob text-3xl">{passage.emoji}</span>
        {passage.title}
      </h2>

      {/* The story inside an open book */}
      <div
        className="relative mt-4 w-full max-w-2xl rounded-[1.6rem] p-3 shadow-2xl sm:p-4"
        style={{ background: "linear-gradient(135deg, #B5651D 0%, #93491A 55%, #7C3D14 100%)" }}
      >
        {/* ribbon bookmark */}
        <div
          className="absolute -top-1 right-10 h-12 w-6 rounded-b-md shadow-md"
          style={{
            background: "linear-gradient(#F43F5E, #BE123C)",
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
          }}
        />
        <div
          className="relative rounded-xl"
          style={{
            background: "linear-gradient(#FFFDF4, #FBF3DC)",
            boxShadow:
              "0 3px 0 #F1E7CC, 0 6px 0 #E7DBBC, 0 9px 0 #DCCFAA, inset 0 0 28px rgba(160,120,60,.14)",
          }}
        >
          <div className="grid sm:grid-cols-2">
            {/* Left page: the picture */}
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-9 sm:border-r sm:border-amber-900/10">
              <div className="text-8xl leading-none drop-shadow-md">{cur.emoji}</div>
              <span className="text-xs font-semibold text-amber-700/50">
                page {page + 1} of {pages.length}
              </span>
            </div>
            {/* Right page: the words to read */}
            <div className="flex min-h-[12rem] flex-col items-center justify-center px-6 py-9">
              <p className="text-center text-2xl font-bold leading-relaxed text-zinc-800 sm:text-[1.7rem]">
                {cur.text}
              </p>
            </div>
          </div>
          {/* spine */}
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 sm:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(120,90,40,.10) 30%, rgba(70,45,20,.22) 50%, rgba(120,90,40,.10) 70%, transparent)",
            }}
          />
        </div>
      </div>

      {/* Page turning */}
      <nav className="mt-5 flex w-full max-w-2xl items-center justify-between gap-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-base font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Previous
        </button>
        <button
          onClick={() => speak(cur.text, 0.85)}
          className="shrink-0 rounded-full bg-amber-100 px-4 py-3 text-sm font-bold text-amber-800 shadow-sm active:scale-95"
        >
          🔊
        </button>
        <button
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          disabled={isLast}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-rose-500 text-base font-bold text-white shadow-md hover:bg-rose-600 active:scale-95 disabled:opacity-40"
        >
          Next page →
        </button>
      </nav>

      {/* Mic + finishing controls */}
      {supported && (
        <div className="mt-5">
          {!listening ? (
            <button
              onClick={() => {
                reset();
                start();
              }}
              className="rounded-full bg-rose-500 px-7 py-3 text-base font-extrabold text-white shadow-lg active:scale-95"
            >
              🎤 Start reading aloud
            </button>
          ) : (
            <span className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white">
              👂 Listening… read each page aloud
            </span>
          )}
        </div>
      )}

      {/* On the last page, finish and score */}
      {isLast && (
        <>
          {supported && listening && (
            <button
              onClick={score}
              className="mt-4 animate-pulse rounded-full bg-rose-600 px-8 py-3.5 text-lg font-extrabold text-white shadow-lg active:scale-95"
            >
              ✓ Done reading
            </button>
          )}
          <p className="mt-4 text-sm font-bold text-zinc-400">
            {supported ? "…or mark how it went:" : "How did the reading go?"}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onDone(98, [])}
              className="rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-sm active:scale-95"
            >
              Read it well
            </button>
            <button
              onClick={() => onDone(93, [])}
              className="rounded-full bg-amber-500 px-5 py-3 font-bold text-white shadow-sm active:scale-95"
            >
              Some help
            </button>
            <button
              onClick={() => onDone(85, [])}
              className="rounded-full bg-rose-400 px-5 py-3 font-bold text-white shadow-sm active:scale-95"
            >
              Found it hard
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- A browseable open book (used beside the questions) ---------- */

function OpenBook({
  title,
  emoji,
  pages,
}: {
  title: string;
  emoji: string;
  pages: { text: string; emoji: string }[];
}) {
  const [page, setPage] = useState(0);
  const cur = pages[page];
  return (
    <div className="flex w-full flex-col items-center">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold">
        <span className="anim-bob text-2xl">{emoji}</span>
        {title}
      </h3>
      <div
        className="relative w-full rounded-[1.4rem] p-2.5 shadow-2xl"
        style={{ background: "linear-gradient(135deg, #B5651D, #93491A 55%, #7C3D14)" }}
      >
        <div
          className="relative rounded-xl"
          style={{
            background: "linear-gradient(#FFFDF4, #FBF3DC)",
            boxShadow:
              "0 3px 0 #F1E7CC, 0 6px 0 #E7DBBC, inset 0 0 24px rgba(160,120,60,.14)",
          }}
        >
          <div className="grid sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-7 sm:border-r sm:border-amber-900/10">
              <div className="text-7xl leading-none">{cur.emoji}</div>
              <span className="text-[11px] font-semibold text-amber-700/50">
                page {page + 1} of {pages.length}
              </span>
            </div>
            <div className="flex min-h-[9rem] items-center justify-center px-4 py-7">
              <p className="text-center text-xl font-bold leading-relaxed text-zinc-800">
                {cur.text}
              </p>
            </div>
          </div>
        </div>
      </div>
      <nav className="mt-3 flex w-full items-center justify-between gap-3">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="flex h-10 flex-1 items-center justify-center rounded-full bg-white text-sm font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Prev
        </button>
        <button
          onClick={() => speak(cur.text, 0.85)}
          className="shrink-0 rounded-full bg-amber-100 px-3 py-2.5 text-sm font-bold text-amber-800 shadow-sm active:scale-95"
        >
          🔊
        </button>
        <button
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          disabled={page === pages.length - 1}
          className="flex h-10 flex-1 items-center justify-center rounded-full bg-rose-400 text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-40"
        >
          Next →
        </button>
      </nav>
    </div>
  );
}

/* ---------- Stage 3 (optional): comprehension beside the book ---------- */

function Comprehension({
  passage,
  onResult,
  onSkip,
}: {
  passage: AssessPassage;
  onResult: (correct: number, total: number) => void;
  onSkip: () => void;
}) {
  const questions = passage.questions;
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const correct = useRef(0);
  const quiz = questions[qi];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === quiz.answer;
    chime(ok);
    if (ok) {
      praise();
      correct.current += 1;
    }
    setTimeout(() => {
      if (qi + 1 >= questions.length) onResult(correct.current, questions.length);
      else {
        setQi(qi + 1);
        setPicked(null);
      }
    }, 1000);
  }

  return (
    <div className="flex w-full max-w-5xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          Comprehension · {qi + 1} / {questions.length}
        </span>
        <button
          onClick={onSkip}
          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-500 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          Skip → result
        </button>
      </div>

      <p className="mt-2 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Look back at the book to help answer. 📖
      </p>

      {/* Book on one side, the question on the other */}
      <div className="mt-4 grid w-full gap-6 lg:grid-cols-2 lg:items-start">
        <OpenBook title={passage.title} emoji={passage.emoji} pages={passage.pages} />

        <div className="flex flex-col items-center">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  i < qi
                    ? "bg-rose-400"
                    : i === qi
                      ? "bg-rose-300 ring-2 ring-rose-200"
                      : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <div className="mt-3 w-full rounded-2xl bg-amber-50/90 p-5 ring-2 ring-amber-200 dark:bg-amber-950/40">
            <p className="text-center text-lg font-extrabold text-amber-900 dark:text-amber-100">
              ❓ {quiz.question}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {quiz.options.map((opt, i) => {
                const isRight = picked !== null && i === quiz.answer;
                const isWrong = picked === i && i !== quiz.answer;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-bold transition-all active:scale-[0.98] ${
                      isRight
                        ? "border-green-400 bg-green-50 text-green-800"
                        : isWrong
                          ? "animate-pulse border-rose-300 bg-rose-50 text-rose-700"
                          : "border-transparent bg-white text-zinc-700 hover:border-amber-300 dark:bg-zinc-900 dark:text-zinc-200"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    {opt.label}
                    {isRight && <span className="ml-auto">🎉</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Final report ---------- */

/** Place the reader within a year by term (1–3): fluency sets the base term,
    comprehension nudges it. Frustration at the suggested level drops a year
    (placed near the top of the year below). */
function placeByTerm(
  suggestIdx: number,
  accuracy: number | null,
  comp: Comp,
): { levelIdx: number; term: number } {
  let levelIdx = suggestIdx;
  let term = 2;
  if (accuracy !== null) {
    const label = classifyAccuracy(levels[suggestIdx], accuracy).label;
    if (label === "Frustration") {
      levelIdx = Math.max(0, suggestIdx - 1);
      term = 3;
    } else if (label === "Independent") {
      term = 3;
    } else {
      term = 2;
    }
  }
  if (comp && comp !== "skipped") {
    if (comp.correct <= 2 && term > 1) term -= 1;
    else if (comp.correct >= 5 && term < 3) term += 1;
  }
  return { levelIdx, term };
}

/** Benchmark Lexile for each year and term, from the Reading Progress
    Benchmarks table (Year 1 → Year 6, Term 1 / Term 2 / Term 3). */
const TERM_LEXILE: number[][] = [
  [190, 390, 530], // Year 1
  [420, 520, 620], // Year 2
  [620, 720, 820], // Year 3
  [740, 808, 875], // Year 4
  [875, 943, 1010], // Year 5
  [950, 1000, 1050], // Year 6
];

function termLexile(levelIdx: number, term: number): string {
  return `${TERM_LEXILE[levelIdx][term - 1]}L`;
}

function Report({
  wordRatings,
  suggestIdx,
  accuracy,
  missed,
  comp,
  onRetry,
  onHome,
}: {
  wordRatings: Record<string, Rating>;
  suggestIdx: number;
  accuracy: number | null;
  missed: string[];
  comp: Comp;
  onRetry: () => void;
  onHome: () => void;
}) {
  const band =
    accuracy !== null ? classifyAccuracy(levels[suggestIdx], accuracy) : null;
  const { levelIdx: finalIdx, term } = placeByTerm(suggestIdx, accuracy, comp);
  const finalLevel = levels[finalIdx];

  const ladderMissed = LADDER.filter(
    (x) => wordRatings[x.w] && wordRatings[x.w] !== "green",
  ).map((x) => x.w);
  const practice = [...new Set([...ladderMissed, ...missed])]
    .filter((w) => w.length <= 14)
    .slice(0, 12);

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <h2 className="text-2xl font-extrabold">Reading level 📋</h2>

      <div className="mt-4 w-full max-w-xl rounded-[1.5rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFC9C2] px-6 py-6 text-center text-rose-900 shadow-lg ring-4 ring-white/60">
        <p className="text-sm font-bold uppercase tracking-wide opacity-70">
          Suitable reading level
        </p>
        <p className="mt-1 text-3xl font-extrabold">
          {finalLevel.grade} · Term {term}
        </p>
        <p className="mt-1 text-base font-extrabold opacity-90">
          Lexile {termLexile(finalIdx, term)}
        </p>
        <p className="mt-0.5 text-xs font-semibold opacity-70">
          Age {finalLevel.age} · {finalLevel.grade} band {finalLevel.lexileRange}
        </p>
        <p className="mt-1 text-sm font-semibold opacity-70">
          {finalLevel.description}
        </p>
      </div>

      {/* Detail rows */}
      <div className="mt-4 grid w-full max-w-xl grid-cols-1 gap-3">
        <Row
          emoji="🔤"
          label="Word reading"
          value={`Reached ${levels[suggestIdx].grade} words`}
        />
        {accuracy !== null && band ? (
          <Row
            emoji="📖"
            label="Story reading"
            value={`${accuracy}% accurate`}
            pill={band.label}
            pillTone={band.tone}
          />
        ) : (
          <Row emoji="📖" label="Story reading" value="Skipped" />
        )}
        <Row
          emoji="❓"
          label="Comprehension"
          value={
            comp && comp !== "skipped"
              ? `${comp.correct} / ${comp.total} correct`
              : "Skipped"
          }
          pill={
            comp && comp !== "skipped"
              ? comp.correct >= 4
                ? "Strong"
                : comp.correct >= 3
                  ? "OK"
                  : "Needs work"
              : undefined
          }
          pillTone={
            comp && comp !== "skipped"
              ? comp.correct >= 4
                ? "bg-green-100 text-green-800"
                : comp.correct >= 3
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              : undefined
          }
        />
      </div>

      {practice.length > 0 && (
        <div className="mt-4 w-full max-w-xl rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/40">
          <h3 className="font-bold text-amber-800 dark:text-amber-200">
            Practise these next
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {practice.map((w) => (
              <button
                key={w}
                onClick={() => sayWord(w)}
                className="rounded-lg bg-white px-3 py-1.5 font-bold text-rose-600 shadow-sm active:scale-95 dark:bg-zinc-900"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex w-full max-w-xl gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-zinc-700 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
        >
          🔁 Assess again
        </button>
        <button
          onClick={onHome}
          className="flex-1 rounded-full bg-rose-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({
  emoji,
  label,
  value,
  pill,
  pillTone,
}: {
  emoji: string;
  label: string;
  value: string;
  pill?: string;
  pillTone?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        <p className="font-extrabold text-zinc-700 dark:text-zinc-200">{value}</p>
      </div>
      {pill && (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${pillTone}`}>
          {pill}
        </span>
      )}
    </div>
  );
}
