"use client";

import { useEffect, useMemo, useState } from "react";
import { passageLevels, type Passage, type PassageLevel } from "@/app/passages";
import { classifyAccuracy } from "@/app/stories";
import { lookup } from "@/app/dictionary";
import {
  alignReading,
  rateAttempt,
  scoreReading,
  type Rating,
  type ReadingReport,
} from "@/lib/reading";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { speak, praise } from "@/lib/speak";

type Step = "choose" | "read" | "report" | "coach";

export default function GuidedReading() {
  const [step, setStep] = useState<Step>("choose");
  const [level, setLevel] = useState<PassageLevel | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [report, setReport] = useState<ReadingReport | null>(null);

  function pickPassage(lvl: PassageLevel, p: Passage) {
    setLevel(lvl);
    setPassage(p);
    setReport(null);
    setStep("read");
  }

  if (step === "read" && passage && level) {
    return (
      <ReadAloud
        passage={passage}
        level={level}
        onBack={() => setStep("choose")}
        onDone={(r) => {
          setReport(r);
          setStep("report");
        }}
      />
    );
  }

  if (step === "report" && report && passage && level) {
    return (
      <Report
        report={report}
        passage={passage}
        level={level}
        onRetry={() => setStep("read")}
        onCoach={() => setStep("coach")}
        onHome={() => setStep("choose")}
      />
    );
  }

  if (step === "coach" && report) {
    return (
      <Coach
        words={report.practiceWords}
        onDone={() => setStep("report")}
      />
    );
  }

  return <Choose onPick={pickPassage} />;
}

/* ---------- Choose a passage by level ---------- */

const PER_PAGE = 10;

function Choose({
  onPick,
}: {
  onPick: (l: PassageLevel, p: Passage) => void;
}) {
  const [level, setLevel] = useState<PassageLevel | null>(null);
  const [page, setPage] = useState(0);

  if (!level) {
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          Read aloud and I&apos;ll be your reading coach. Pick your level first.
        </p>
        <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {passageLevels.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLevel(l);
                setPage(0);
              }}
              className="flex items-center gap-4 rounded-2xl border-2 border-zinc-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${l.swatch} ${l.swatchText} font-bold`}
              >
                <span className="text-[10px] uppercase opacity-80">Lexile</span>
                <span className="text-xs leading-tight">{l.lexileRange}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold">
                  {l.grade}{" "}
                  <span className="text-sm font-medium text-zinc-400">
                    · Age {l.age}
                  </span>
                </span>
                <span className="text-sm font-semibold text-indigo-500">
                  {l.wpmLow}–{l.wpmHigh} wpm · ≥{l.accuracyGoal}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <div className="flex w-full items-center gap-3">
        <button
          onClick={() => setLevel(null)}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Levels
        </button>
        <span
          className={`rounded-full ${level.swatch} ${level.swatchText} px-4 py-1.5 text-sm font-bold`}
        >
          {level.grade} · {level.lexileRange}
        </span>
      </div>
      <h2 className="mt-6 text-xl font-extrabold">Pick something to read 🎤</h2>
      {(() => {
        const pageCount = Math.ceil(level.passages.length / PER_PAGE);
        const start = page * PER_PAGE;
        const slice = level.passages.slice(start, start + PER_PAGE);
        return (
          <>
            <p className="text-sm text-zinc-400">
              {start + 1}–{start + slice.length} of {level.passages.length}
            </p>
            <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {slice.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPick(level, p)}
                  className="flex items-center gap-4 rounded-2xl border-2 border-zinc-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-5xl">{p.emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">{p.title}</span>
                    <span className="text-sm text-zinc-400">
                      {p.lexile}L · {p.text.split(/\s+/).length} words
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <nav className="mt-6 flex w-full items-center justify-between gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-base font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
              >
                ← Prev
              </button>
              <span className="shrink-0 text-sm font-semibold text-zinc-400">
                Page {page + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-indigo-500 text-base font-bold text-white shadow-md hover:bg-indigo-600 active:scale-95 disabled:opacity-40"
              >
                Next 10 →
              </button>
            </nav>
          </>
        );
      })()}
    </div>
  );
}

/* ---------- Read aloud with live scoring (Reading Progress) ---------- */

function ReadAloud({
  passage,
  level,
  onBack,
  onDone,
}: {
  passage: Passage;
  level: PassageLevel;
  onBack: () => void;
  onDone: (r: ReadingReport) => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const words = useMemo(() => passage.text.split(/\s+/), [passage.text]);
  const spoken = useMemo(
    () => (transcript ? transcript.split(/\s+/) : []),
    [transcript],
  );
  const status = useMemo(
    () => alignReading(words, spoken),
    [words, spoken],
  );
  const currentIndex = status.indexOf("pending");
  const correctSoFar = status.filter((s) => s === "correct").length;

  function begin() {
    reset();
    setStartedAt(Date.now());
    start();
  }

  function finish() {
    stop();
    const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 1;
    onDone(scoreReading(words, status, elapsed));
  }

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          onClick={() => {
            stop();
            onBack();
          }}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Pick another
        </button>
        <span
          className={`rounded-full ${level.swatch} ${level.swatchText} px-3 py-1 text-xs font-bold`}
        >
          {level.grade} · {passage.lexile}L
        </span>
      </div>

      <h2 className="mt-5 text-xl font-extrabold">{passage.title}</h2>
      <p className="text-sm text-zinc-400">
        {correctSoFar} / {words.length} words read
      </p>

      {/* Passage with live highlighting */}
      <div className="mt-5 w-full rounded-3xl bg-white p-6 text-2xl font-bold leading-relaxed shadow-lg dark:bg-zinc-900">
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          {words.map((w, i) => {
            const s = status[i];
            const isCurrent = i === currentIndex && listening;
            return (
              <button
                key={i}
                onClick={() => speak(w.replace(/[.,!?;:"]/g, ""))}
                className={`rounded-lg px-1 transition-colors ${
                  s === "correct"
                    ? "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-100"
                    : s === "missed"
                      ? "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
                      : isCurrent
                        ? "ring-2 ring-indigo-400"
                        : "text-zinc-700 dark:text-zinc-200"
                }`}
              >
                {w}
              </button>
            );
          })}
        </p>
      </div>

      {/* Controls */}
      {!supported ? (
        <div className="mt-6 rounded-2xl bg-amber-50 px-5 py-4 text-center text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          🎙️ Reading-aloud detection needs Chrome or Edge. You can still tap any
          word to hear it, or{" "}
          <button
            onClick={() => speak(passage.text, 0.8)}
            className="font-bold underline"
          >
            listen to the whole passage
          </button>
          .
        </div>
      ) : (
        <div className="mt-6 flex w-full items-center justify-center gap-4">
          {!listening ? (
            <button
              onClick={begin}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95"
            >
              🎤 Start reading
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex animate-pulse items-center gap-2 rounded-full bg-rose-500 px-8 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95"
            >
              ⏹ I&apos;m done
            </button>
          )}
        </div>
      )}
      {listening && (
        <p className="mt-3 text-sm text-zinc-400">
          Listening… read the words out loud 👂
        </p>
      )}
    </div>
  );
}

/* ---------- Fluency report (Reading Progress) ---------- */

function Report({
  report,
  passage,
  level,
  onRetry,
  onCoach,
  onHome,
}: {
  report: ReadingReport;
  passage: Passage;
  level: PassageLevel;
  onRetry: () => void;
  onCoach: () => void;
  onHome: () => void;
}) {
  const stars = report.accuracy >= 95 ? 3 : report.accuracy >= 80 ? 2 : 1;
  const verdict = classifyAccuracy(level.source, report.accuracy);
  const accuracyMet = report.accuracy >= level.accuracyGoal;
  const wpmMet = report.wcpm >= level.wpmLow;

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <h2 className="text-2xl font-extrabold">Your reading report 📊</h2>
      <p className="text-zinc-400">
        &ldquo;{passage.title}&rdquo; · {passage.lexile}L · {level.grade}
      </p>

      <div className="mt-3 text-4xl">
        {"⭐".repeat(stars)}
        <span className="opacity-20">{"⭐".repeat(3 - stars)}</span>
      </div>

      {/* Reading-level verdict against the year's benchmark */}
      <div
        className={`mt-4 rounded-full px-5 py-2 text-base font-bold ${verdict.tone}`}
      >
        {verdict.label} — {verdict.meaning}
      </div>

      <div className="mt-6 grid w-full grid-cols-3 gap-4">
        <Stat
          label="Accuracy"
          value={`${report.accuracy}%`}
          goal={`goal ≥${level.accuracyGoal}%`}
          met={accuracyMet}
        />
        <Stat
          label="Words correct"
          value={`${report.correct}/${report.attempted || report.total}`}
        />
        <Stat
          label="Words / min"
          value={`${report.wcpm}`}
          goal={`goal ${level.wpmLow}–${level.wpmHigh}`}
          met={wpmMet}
        />
      </div>

      {report.practiceWords.length > 0 ? (
        <div className="mt-6 w-full rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/40">
          <h3 className="font-bold text-amber-800 dark:text-amber-200">
            Words to practice
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.practiceWords.map((w) => (
              <span
                key={w}
                className="rounded-lg bg-white px-3 py-1.5 font-bold text-rose-600 shadow-sm dark:bg-zinc-900"
              >
                {w}
              </span>
            ))}
          </div>
          <button
            onClick={onCoach}
            className="mt-4 w-full rounded-full bg-indigo-600 px-6 py-3 text-lg font-extrabold text-white shadow active:scale-95"
          >
            🧑‍🏫 Practice with Coach
          </button>
        </div>
      ) : (
        <div className="mt-6 w-full rounded-2xl bg-green-50 p-5 text-center font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
          🎉 Perfect reading! No words to practice.
        </div>
      )}

      <div className="mt-6 flex w-full gap-3">
        <button
          onClick={onRetry}
          className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-zinc-700 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
        >
          🔁 Read again
        </button>
        <button
          onClick={onHome}
          className="flex-1 rounded-full bg-zinc-100 px-6 py-3 font-bold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          New passage
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  goal,
  met,
}: {
  label: string;
  value: string;
  goal?: string;
  met?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white py-5 shadow-sm dark:bg-zinc-900">
      <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
        {value}
      </span>
      <span className="text-xs font-semibold uppercase text-zinc-400">
        {label}
      </span>
      {goal && (
        <span
          className={`mt-1 text-[11px] font-semibold ${
            met
              ? "text-green-600 dark:text-green-400"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {met ? "✓ " : ""}
          {goal}
        </span>
      )}
    </div>
  );
}

/* ---------- Word coach (Reading Coach) ---------- */

const STAR: Record<Rating, { color: string; label: string; say: string }> = {
  green: { color: "text-green-500", label: "Perfect!", say: "Perfect!" },
  yellow: {
    color: "text-yellow-400",
    label: "Almost — try again",
    say: "Almost! Try again.",
  },
  red: {
    color: "text-rose-500",
    label: "Let's keep trying",
    say: "Let's try again.",
  },
};

function Coach({ words, onDone }: { words: string[]; onDone: () => void }) {
  const { supported, listening, transcript, start, stop } =
    useSpeechRecognition();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, Rating>>({});
  const [showMeaning, setShowMeaning] = useState(false);

  const word = words[index];
  const rating = results[index];
  const entry = word ? lookup(word) : null;

  // Score the spoken word the moment we hear something.
  useEffect(() => {
    if (!listening || !word || !transcript.trim()) return;
    const said = transcript.split(/\s+/);
    const r = rateAttempt(word, said);
    stop();
    setResults((prev) => ({ ...prev, [index]: r }));
    if (r === "green") praise();
    else speak(STAR[r].say, 1);
  }, [transcript, listening, word, index, stop]);

  function goTo(i: number) {
    stop();
    setShowMeaning(false);
    setIndex(i);
  }

  if (!word) {
    return (
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-extrabold">Nothing to practice!</h2>
        <button
          onClick={onDone}
          className="rounded-full bg-indigo-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Back to report
        </button>
      </div>
    );
  }

  const greens = Object.values(results).filter((r) => r === "green").length;

  return (
    <div className="flex w-full max-w-2xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={() => {
            stop();
            onDone();
          }}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Report
        </button>
        <span className="text-sm font-bold text-zinc-400">
          Word {index + 1} / {words.length} · 💚 {greens}
        </span>
      </div>

      {/* Word progress stars */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {words.map((w, i) => {
          const r = results[i];
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Practice ${w}`}
              className={`text-xl ${
                r ? STAR[r].color : "text-zinc-300 dark:text-zinc-700"
              } ${i === index ? "scale-125" : ""}`}
            >
              ★
            </button>
          );
        })}
      </div>

      <h2 className="mt-5 text-lg font-bold text-zinc-500">
        Let&apos;s practice this word
      </h2>

      <div className="mt-4 flex w-full flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 px-6 py-10 text-white shadow-xl">
        <span className="text-6xl font-black lowercase tracking-wide drop-shadow">
          {word}
        </span>

        {/* Result star */}
        {rating && (
          <div className="flex flex-col items-center gap-1">
            <span className={`text-5xl ${STAR[rating].color}`}>★</span>
            <span className="text-sm font-semibold">{STAR[rating].label}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => speak(word, 0.85)}
            className="rounded-full bg-white/25 px-5 py-3 font-bold backdrop-blur active:scale-95"
          >
            🔊 Sound
          </button>
          <button
            onClick={() => speak(word, 0.4)}
            className="rounded-full bg-white/25 px-5 py-3 font-bold backdrop-blur active:scale-95"
          >
            🐢 Slowly
          </button>
          <button
            onClick={() => setShowMeaning((v) => !v)}
            className="rounded-full bg-white/25 px-5 py-3 font-bold backdrop-blur active:scale-95"
          >
            📖 Meaning
          </button>
          {supported &&
            (listening ? (
              <button
                onClick={stop}
                className="animate-pulse rounded-full bg-rose-500 px-5 py-3 font-bold active:scale-95"
              >
                ⏹ Listening…
              </button>
            ) : (
              <button
                onClick={start}
                className="rounded-full bg-white px-5 py-3 font-bold text-indigo-600 active:scale-95"
              >
                🎤 Say it
              </button>
            ))}
        </div>
      </div>

      {/* Picture dictionary */}
      {showMeaning && (
        <div className="mt-4 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {entry ? (
            <>
              <span className="text-7xl">{entry.emoji}</span>
              <span className="text-xl font-extrabold lowercase text-indigo-600 dark:text-indigo-400">
                {word}
              </span>
              <p className="text-lg text-zinc-700 dark:text-zinc-200">
                {entry.meaning}
              </p>
              <button
                onClick={() => speak(`${word}. ${entry.meaning}`, 0.85)}
                className="mt-1 rounded-full bg-indigo-100 px-5 py-2 font-bold text-indigo-700 active:scale-95 dark:bg-indigo-950 dark:text-indigo-300"
              >
                🔊 Read meaning
              </button>
            </>
          ) : (
            <>
              <span className="text-6xl">🔎</span>
              <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                Picture coming soon — let&apos;s sound it out together!
              </p>
              <button
                onClick={() => speak(word, 0.5)}
                className="rounded-full bg-indigo-100 px-5 py-2 font-bold text-indigo-700 active:scale-95 dark:bg-indigo-950 dark:text-indigo-300"
              >
                🐢 Sound it out
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex w-full gap-3">
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          className="flex-1 rounded-full bg-white px-6 py-3 font-bold text-zinc-700 shadow-sm active:scale-95 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
        >
          ← Back
        </button>
        {index < words.length - 1 ? (
          <button
            onClick={() => goTo(index + 1)}
            className="flex-1 rounded-full bg-indigo-500 px-6 py-3 font-bold text-white shadow active:scale-95"
          >
            Next word →
          </button>
        ) : (
          <button
            onClick={() => {
              stop();
              onDone();
            }}
            className="flex-1 rounded-full bg-green-500 px-6 py-3 font-bold text-white shadow active:scale-95"
          >
            Finish 🎉
          </button>
        )}
      </div>
    </div>
  );
}
