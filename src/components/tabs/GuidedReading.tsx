"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/* Candy palette cycled across cards. */
const CARD_STYLES = [
  { bg: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]", text: "text-pink-700" },
  { bg: "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1]", text: "text-orange-700" },
  { bg: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" },
  { bg: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C]", text: "text-amber-700" },
  { bg: "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF]", text: "text-sky-700" },
  { bg: "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" },
];

const LEVEL_EMOJI = ["🐣", "🌱", "🦋", "🚀", "🌈", "🏆"];

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

  function goLevels() {
    setLevel(null);
    setPassage(null);
    setStep("choose");
  }

  if (step === "read" && passage && level) {
    return (
      <ReadAloud
        passage={passage}
        level={level}
        onBack={() => setStep("choose")}
        onLevels={goLevels}
        onDone={(r) => {
          setReport(r);
          // Marks first: show the report, then the coach for the hard words.
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

  // Coming back from a read keeps the chosen level open on the story list.
  return <Choose onPick={pickPassage} initialLevel={level} />;
}

/* ---------- Custom stories (teacher/parent-added, saved on device) ---------- */

const STORY_EMOJI = ["📖", "🦄", "🐉", "🚀", "🐶", "🧚", "⚽", "🌈"];

function customKey(levelId: string) {
  return `custom-passages-${levelId}`;
}

function loadCustom(levelId: string): Passage[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(customKey(levelId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustom(levelId: string, list: Passage[]) {
  localStorage.setItem(customKey(levelId), JSON.stringify(list));
}

/* ---------- Choose a passage by level ---------- */

const PER_PAGE = 10;

function Choose({
  onPick,
  initialLevel = null,
}: {
  onPick: (l: PassageLevel, p: Passage) => void;
  initialLevel?: PassageLevel | null;
}) {
  const [level, setLevel] = useState<PassageLevel | null>(initialLevel);
  const [page, setPage] = useState(0);

  // My-own-stories for the open level.
  const [customs, setCustoms] = useState<Passage[]>(() =>
    initialLevel ? loadCustom(initialLevel.id) : [],
  );
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newEmoji, setNewEmoji] = useState("📖");

  function openLevel(l: PassageLevel) {
    setLevel(l);
    setPage(0);
    setCustoms(loadCustom(l.id));
    setAdding(false);
  }

  function addStory() {
    if (!level) return;
    const text = newText.trim().replace(/\s+/g, " ");
    if (!newTitle.trim() || text.split(" ").length < 3) return;
    const p: Passage = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      emoji: newEmoji,
      lexile: 0,
      text,
    };
    const next = [p, ...customs];
    saveCustom(level.id, next);
    setCustoms(next);
    setAdding(false);
    setNewTitle("");
    setNewText("");
    setPage(0);
  }

  function removeStory(id: string) {
    if (!level) return;
    const next = customs.filter((c) => c.id !== id);
    saveCustom(level.id, next);
    setCustoms(next);
  }

  if (!level) {
    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          Read aloud and I&apos;ll be your reading coach. Pick your level first.
        </p>
        <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {passageLevels.map((l, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <button
                key={l.id}
                onClick={() => openLevel(l)}
                className={`group flex items-center gap-4 rounded-[2rem] ${style.bg} ${style.text} p-5 text-left shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                  {LEVEL_EMOJI[i % LEVEL_EMOJI.length]}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-extrabold">
                    {l.grade}{" "}
                    <span className="text-sm font-semibold opacity-70">
                      · Age {l.age}
                    </span>
                  </span>
                  <span className="w-fit rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
                    Lexile {l.lexileRange}
                  </span>
                  <span className="text-sm font-semibold opacity-80">
                    {l.wpmLow}–{l.wpmHigh} wpm · ≥{l.accuracyGoal}% accuracy
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
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

      {/* Add your own story for this level */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 font-extrabold text-white shadow-md active:scale-95"
        >
          ➕ Add my own story
        </button>
      ) : (
        <div className="mt-3 flex w-full flex-col gap-3 rounded-[2rem] bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C] p-5 shadow-lg ring-4 ring-white/60">
          <p className="font-extrabold text-amber-800">📝 My own story</p>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Story title"
            className="rounded-2xl border-2 border-white/80 bg-white/90 px-4 py-2.5 font-bold text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400"
          />
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type the story here… (the words the student will read aloud)"
            rows={4}
            className="rounded-2xl border-2 border-white/80 bg-white/90 px-4 py-2.5 font-semibold text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-amber-400"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm font-bold text-amber-800">Picture:</span>
            {STORY_EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                className={`grid h-10 w-10 place-items-center rounded-xl text-xl transition-all active:scale-90 ${
                  newEmoji === e ? "bg-white shadow ring-2 ring-amber-400" : "bg-white/50"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addStory}
              disabled={!newTitle.trim() || newText.trim().split(/\s+/).length < 3}
              className="flex-1 rounded-full bg-brand-600 px-6 py-2.5 font-extrabold text-white shadow active:scale-95 disabled:opacity-40"
            >
              💾 Save story
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-full bg-white px-6 py-2.5 font-bold text-zinc-600 shadow-sm active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(() => {
        const allPassages = [...customs, ...level.passages];
        const pageCount = Math.ceil(allPassages.length / PER_PAGE);
        const start = page * PER_PAGE;
        const slice = allPassages.slice(start, start + PER_PAGE);
        return (
          <>
            <p className="text-sm text-zinc-400">
              {start + 1}–{start + slice.length} of {allPassages.length}
            </p>
            <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {slice.map((p, i) => {
                const style = CARD_STYLES[(start + i) % CARD_STYLES.length];
                const isCustom = p.id.startsWith("custom-");
                return (
                  <div key={p.id} className="relative">
                    <button
                      onClick={() => onPick(level, p)}
                      className={`group flex w-full items-center gap-4 rounded-[2rem] ${style.bg} ${style.text} p-5 text-left shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
                    >
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                        {p.emoji}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-extrabold">{p.title}</span>
                        <span className="w-fit rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
                          {isCustom ? "📝 My story" : `${p.lexile}L`} ·{" "}
                          {p.text.split(/\s+/).length} words
                        </span>
                      </div>
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => removeStory(p.id)}
                        aria-label={`Delete ${p.title}`}
                        className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-base shadow-md ring-2 ring-rose-200 transition-all hover:scale-110 active:scale-90"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })}
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
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand-500 text-base font-bold text-white shadow-md hover:bg-brand-600 active:scale-95 disabled:opacity-40"
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
  onLevels,
  onDone,
}: {
  passage: Passage;
  level: PassageLevel;
  onBack: () => void;
  onLevels: () => void;
  onDone: (r: ReadingReport) => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [grading, setGrading] = useState(false);

  const words = useMemo(() => passage.text.split(/\s+/), [passage.text]);
  const spoken = useMemo(
    () => (transcript ? transcript.split(/\s+/) : []),
    [transcript],
  );
  // Alignment runs quietly in the background — no markings while reading.
  const status = useMemo(
    () => alignReading(words, spoken),
    [words, spoken],
  );

  // Track the latest alignment so delayed grading sees the final words.
  const statusRef = useRef(status);
  statusRef.current = status;

  function begin() {
    reset();
    setStartedAt(Date.now());
    start();
  }

  function finish() {
    stop();
    setGrading(true);
  }

  // Grade a beat after stopping: the recogniser often delivers the last
  // stretch of speech only after the mic is closed.
  useEffect(() => {
    if (!grading) return;
    const t = setTimeout(() => {
      const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 1;
      onDone(scoreReading(words, statusRef.current, elapsed));
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grading]);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              stop();
              onBack();
            }}
            className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ← Pick another
          </button>
          <button
            onClick={() => {
              stop();
              onLevels();
            }}
            className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            📊 Levels
          </button>
        </div>
        <span
          className={`rounded-full ${level.swatch} ${level.swatchText} px-3 py-1 text-xs font-bold`}
        >
          {level.grade} · {passage.lexile}L
        </span>
      </div>

      <h2 className="mt-5 flex items-center gap-2 text-2xl font-extrabold text-amber-900 dark:text-amber-100">
        <span className="anim-bob text-3xl">{passage.emoji}</span>
        {passage.title}
      </h2>
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Read at your own pace — if a word is hard, just keep going! 💪
      </p>

      {/* Plain passage on storybook paper: no live markings while reading */}
      <div
        className="mt-5 w-full rounded-[2rem] p-7 text-2xl font-bold leading-relaxed shadow-lg ring-4 ring-white/60 dark:bg-zinc-900"
        style={{
          background:
            "radial-gradient(circle at 12% 10%, rgba(255,255,255,.65) 0 90px, transparent 90px)," +
            "linear-gradient(#FFFBEE, #FFF1D6)",
        }}
      >
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          {words.map((w, i) => (
            <button
              key={i}
              onClick={() => speak(w.replace(/[.,!?;:"]/g, ""))}
              className="rounded-lg px-1 text-zinc-800 transition-colors hover:bg-amber-200/70 active:bg-amber-300/70"
            >
              {w}
            </button>
          ))}
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
              className="flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95"
            >
              🎤 Start reading
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={grading}
              className="flex animate-pulse items-center gap-2 rounded-full bg-rose-500 px-8 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95 disabled:opacity-60"
            >
              {grading ? "✨ Checking…" : "⏹ I'm done"}
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
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
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
          color="bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] text-emerald-700"
        />
        <Stat
          label="Words correct"
          value={`${report.correct}/${report.total}`}
          goal="of the whole story"
          met={report.correct === report.total}
          color="bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF] text-sky-700"
        />
        <Stat
          label="Words / min"
          value={`${report.wcpm}`}
          goal={`goal ${level.wpmLow}–${level.wpmHigh}`}
          met={wpmMet}
          color="bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF] text-violet-700"
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
            className="mt-4 w-full rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white shadow active:scale-95"
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
  color = "bg-white text-brand-600",
}: {
  label: string;
  value: string;
  goal?: string;
  met?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-[1.5rem] ${color} py-5 shadow-md ring-4 ring-white/60`}
    >
      <span className="text-3xl font-extrabold">{value}</span>
      <span className="text-xs font-bold uppercase opacity-70">{label}</span>
      {goal && (
        <span
          className={`mt-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold ${
            met ? "text-green-600" : "opacity-70"
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
  const [index, setIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, Rating>>({});
  const [showMeaning, setShowMeaning] = useState(false);

  const word = index !== null ? words[index] : null;
  const rating = index !== null ? results[index] : undefined;
  const entry = word ? lookup(word) : null;
  const greens = Object.values(results).filter((r) => r === "green").length;

  // Score the spoken word the moment we hear something, then return to the
  // word list so the student can pick the next word themselves.
  useEffect(() => {
    if (!listening || !word || index === null || !transcript.trim()) return;
    const said = transcript.split(/\s+/);
    const r = rateAttempt(word, said);
    stop();
    setResults((prev) => ({ ...prev, [index]: r }));
    if (r === "green") praise();
    else speak(STAR[r].say, 1);
    const t = setTimeout(() => {
      setShowMeaning(false);
      setIndex(null);
    }, 1600);
    return () => clearTimeout(t);
  }, [transcript, listening, word, index, stop]);

  if (words.length === 0) {
    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-extrabold">Nothing to practice!</h2>
        <button
          onClick={onDone}
          className="rounded-full bg-brand-500 px-6 py-3 font-bold text-white shadow active:scale-95"
        >
          Back to report
        </button>
      </div>
    );
  }

  /* ---- All the tricky words at once: tap one to practice ---- */
  if (index === null || !word) {
    return (
      <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
        <div className="flex w-full items-center justify-between">
          <button
            onClick={onDone}
            className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ← Report
          </button>
          <span className="text-sm font-bold text-zinc-400">
            💚 {greens} / {words.length} words green
          </span>
        </div>

        <h2 className="mt-4 text-center text-xl font-extrabold">
          🧑‍🏫 Your words to practice
        </h2>
        <p className="text-sm text-zinc-400">
          These were hard while you read — tap any word to practice it.
        </p>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {words.map((w, i) => {
            const r = results[i];
            return (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="group flex flex-col items-center gap-1 rounded-2xl bg-white px-4 py-5 shadow-sm ring-2 ring-white/70 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:bg-zinc-900"
              >
                <span className="text-2xl font-black lowercase text-sky-700">
                  {w}
                </span>
                <span
                  className={`text-xl ${r ? STAR[r].color : "text-zinc-200 dark:text-zinc-700"}`}
                >
                  ★
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  {r ? STAR[r].label : "tap to practice"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onDone}
          className="mt-8 rounded-full bg-green-500 px-8 py-3 text-lg font-extrabold text-white shadow active:scale-95"
        >
          Finish practicing 🎉
        </button>
      </div>
    );
  }

  /* ---- Practicing one chosen word ---- */
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={() => {
            stop();
            setShowMeaning(false);
            setIndex(null);
          }}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← All words
        </button>
        <span className="text-sm font-bold text-zinc-400">
          💚 {greens} / {words.length}
        </span>
      </div>

      <h2 className="mt-5 text-lg font-bold text-zinc-500">
        Let&apos;s practice this word
      </h2>

      <div className="mt-4 flex w-full flex-col items-center gap-5 rounded-[2rem] bg-gradient-to-br from-[#D3EBFF] to-[#A4D6FF] px-6 py-10 text-sky-900 shadow-lg ring-4 ring-white/60">
        <span className="text-6xl font-black lowercase tracking-wide text-sky-700 drop-shadow-sm">
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
            className="rounded-full bg-white/70 px-5 py-3 font-bold text-sky-700 shadow-sm backdrop-blur active:scale-95"
          >
            🔊 Sound
          </button>
          <button
            onClick={() => speak(word, 0.4)}
            className="rounded-full bg-white/70 px-5 py-3 font-bold text-sky-700 shadow-sm backdrop-blur active:scale-95"
          >
            🐢 Slowly
          </button>
          <button
            onClick={() => setShowMeaning((v) => !v)}
            className="rounded-full bg-white/70 px-5 py-3 font-bold text-sky-700 shadow-sm backdrop-blur active:scale-95"
          >
            📖 Meaning
          </button>
          {supported &&
            (listening ? (
              <button
                onClick={stop}
                className="animate-pulse rounded-full bg-rose-500 px-5 py-3 font-bold text-white active:scale-95"
              >
                ⏹ Listening…
              </button>
            ) : (
              <button
                onClick={start}
                className="rounded-full bg-sky-600 px-5 py-3 font-bold text-white shadow-md active:scale-95"
              >
                🎤 Say it
              </button>
            ))}
        </div>
      </div>

      {/* Picture dictionary */}
      {showMeaning && (
        <div className="mt-4 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-brand-100 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {entry ? (
            <>
              <span className="text-7xl">{entry.emoji}</span>
              <span className="text-xl font-extrabold lowercase text-brand-600 dark:text-brand-400">
                {word}
              </span>
              <p className="text-lg text-zinc-700 dark:text-zinc-200">
                {entry.meaning}
              </p>
              <button
                onClick={() => speak(`${word}. ${entry.meaning}`, 0.85)}
                className="mt-1 rounded-full bg-brand-100 px-5 py-2 font-bold text-brand-700 active:scale-95 dark:bg-brand-950 dark:text-brand-300"
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
                className="rounded-full bg-brand-100 px-5 py-2 font-bold text-brand-700 active:scale-95 dark:bg-brand-950 dark:text-brand-300"
              >
                🐢 Sound it out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
