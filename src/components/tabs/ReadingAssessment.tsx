"use client";

import { useEffect, useRef, useState } from "react";
import { levels, type Level, type Story } from "@/app/stories";
import {
  passagesForLevel,
  lexileBand,
  placementDecision,
  benchmarkBand,
  type AssessPassage,
  type BenchmarkBand,
  type PlacementAction,
  type QKind,
} from "@/app/assessment";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { alignReading, type Rating } from "@/lib/reading";
import { speak, stopSpeech, chime, praise } from "@/lib/speak";
import { sayWord } from "@/lib/sayWord";
import { openReport } from "@/lib/reportPrint";

/* ---------- Stage 1: the Cambridge graded word list, easiest → ~Lexile 1050 ----------
   Words, Lexiles and `lvl` (0 = Year 1 … 5 = Year 6) come from the Cambridge
   reading word list. `lex` is each word's Lexile measure — the reader is placed
   at the Lexile of the hardest word they read correctly (BR99 is stored as 50
   so it sorts as the easiest). */
const LADDER: { w: string; lvl: number; lex: number }[] = [
  // Year 1 · BR99–418L
  { w: "Mom", lvl: 0, lex: 50 }, { w: "Dad", lvl: 0, lex: 50 }, // BR99
  { w: "my", lvl: 0, lex: 50 }, { w: "is", lvl: 0, lex: 50 }, // BR99
  { w: "here", lvl: 0, lex: 50 }, { w: "and", lvl: 0, lex: 50 }, // BR99
  { w: "went", lvl: 0, lex: 190 }, { w: "are", lvl: 0, lex: 190 },
  { w: "they", lvl: 0, lex: 247 }, { w: "with", lvl: 0, lex: 247 },
  { w: "came", lvl: 0, lex: 304 }, { w: "saw", lvl: 0, lex: 304 },
  { w: "one", lvl: 0, lex: 361 }, { w: "then", lvl: 0, lex: 361 },
  { w: "opened", lvl: 0, lex: 418 }, { w: "must", lvl: 0, lex: 418 },
  // Year 2 · 470–570L
  { w: "know", lvl: 1, lex: 475 }, { w: "most", lvl: 1, lex: 475 },
  { w: "could", lvl: 1, lex: 530 }, { w: "really", lvl: 1, lex: 530 }, // 530/420
  { w: "moment", lvl: 1, lex: 470 }, { w: "suddenly", lvl: 1, lex: 470 },
  { w: "important", lvl: 1, lex: 520 }, { w: "searched", lvl: 1, lex: 520 },
  { w: "courage", lvl: 1, lex: 570 }, { w: "especially", lvl: 1, lex: 570 },
  // Year 3 · 620–687L
  { w: "measure", lvl: 2, lex: 620 }, { w: "silence", lvl: 2, lex: 620 },
  { w: "attempt", lvl: 2, lex: 687 }, { w: "exclaimed", lvl: 2, lex: 687 },
  // Year 4 · 754–830L
  { w: "species", lvl: 3, lex: 754 }, { w: "figure", lvl: 3, lex: 754 },
  { w: "delicious", lvl: 3, lex: 820 }, { w: "timid", lvl: 3, lex: 820 }, // 820/740
  { w: "incredibly", lvl: 3, lex: 785 }, { w: "exaggerated", lvl: 3, lex: 785 },
  { w: "vacant", lvl: 3, lex: 830 }, { w: "moisture", lvl: 3, lex: 830 },
  // Year 5 · 875–920L
  { w: "dissatisfied", lvl: 4, lex: 875 }, { w: "contribution", lvl: 4, lex: 875 },
  { w: "tolerance", lvl: 4, lex: 920 }, { w: "acknowledge", lvl: 4, lex: 920 },
  // Year 6 · 965–1050L
  { w: "multitude", lvl: 5, lex: 965 }, { w: "consequences", lvl: 5, lex: 965 },
  { w: "treachery", lvl: 5, lex: 1010 }, { w: "belligerent", lvl: 5, lex: 1010 }, // 1010/925
  { w: "loathe", lvl: 5, lex: 967 }, { w: "ingenuous", lvl: 5, lex: 967 },
  { w: "quench", lvl: 5, lex: 1009 }, { w: "catastrophe", lvl: 5, lex: 1009 },
  { w: "simultaneous", lvl: 5, lex: 1050 }, { w: "vengeance", lvl: 5, lex: 1050 },
];
// Stop the word check once the child has read this many words wrongly (in
// total, not in a row) — then suggest the reading level and go to Stage 2.
const STOP_AFTER_MISSES = 2;

/** Where the reader stopped in Stage 1: the hardest word read correctly, by
    Lexile. That Lexile IS the word-check reading level — Stage 2 then decides
    whether to move up to the next level. Returns null if nothing was read. */
function wordStop(ratings: Record<string, Rating>): { lvl: number; lex: number } | null {
  let best: { lvl: number; lex: number } | null = null;
  for (const it of LADDER) {
    if (ratings[it.w] === "green" && (best === null || it.lex > best.lex)) {
      best = { lvl: it.lvl, lex: it.lex };
    }
  }
  return best;
}

/** Show a Lexile measure, using "BR" for Beginning Reader (our stored 50). */
function lexLabel(lex: number | null): string {
  if (lex === null) return "Beginning Reader";
  return lex < 100 ? "BR99L" : `${lex}L`;
}

/** Place within a year by term (1–3): fluency-band base, comprehension nudge. */
function placeByTerm(
  suggestIdx: number,
  accuracy: number | null,
  compScore: number | null,
): { levelIdx: number; term: number } {
  let levelIdx = suggestIdx;
  let term = 2;
  if (accuracy !== null) {
    const label = benchmarkBand(accuracy).label;
    if (label === "Frustration") {
      levelIdx = Math.max(0, suggestIdx - 1);
      term = 3;
    } else if (label === "Independent") term = 3;
    else term = 2;
  }
  if (compScore !== null) {
    if (compScore < 50 && term > 1) term -= 1;
    else if (compScore >= 90 && term < 3) term += 1;
  }
  return { levelIdx, term };
}

/* ---------- Shared types ---------- */

type Phase = "intro" | "words" | "suggest" | "passage" | "comprehension" | "report";
type ReadResult = {
  accuracy: number; // %
  totalWords: number;
  errors: number;
  selfCorrections: number;
  wpm: number | null;
};
type CompResult = {
  compCorrect: number;
  compTotal: number;
  vocabCorrect: number;
  vocabTotal: number;
};
type Comp = CompResult | "skipped" | null;

/* ---------- Top level ---------- */

export default function ReadingAssessment() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [studentName, setStudentName] = useState("");
  const [wordRatings, setWordRatings] = useState<Record<string, Rating>>({});
  const [wordWrong, setWordWrong] = useState(0); // words read wrongly in Stage 1
  const [stopLexile, setStopLexile] = useState<number | null>(null); // Lexile of the hardest word read in Stage 1
  const [suggestIdx, setSuggestIdx] = useState(0);
  const [read, setRead] = useState<ReadResult | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [comp, setComp] = useState<Comp>(null);
  // The chosen passage (random at the suggested level — set when leaving "suggest").
  const [passage, setPassage] = useState<AssessPassage>(passagesForLevel(0)[0]);

  useEffect(() => () => stopSpeech(), []);

  function restart() {
    setWordRatings({});
    setWordWrong(0);
    setStopLexile(null);
    setRead(null);
    setMissed([]);
    setComp(null);
    setPhase("words");
  }

  function startPassage(levelIdx: number) {
    const pool = passagesForLevel(levelIdx);
    setPassage(pool[Math.floor(Math.random() * pool.length)] ?? pool[0]);
    setPhase("passage");
  }

  if (phase === "words") {
    return (
      <WordRunner
        onExit={() => {
          stopSpeech();
          setPhase("intro");
        }}
        onDone={(r, wrong) => {
          const stop = wordStop(r);
          setWordRatings(r);
          setWordWrong(wrong);
          setStopLexile(stop ? stop.lex : null);
          setSuggestIdx(stop ? stop.lvl : 0);
          setPhase("suggest");
        }}
      />
    );
  }

  if (phase === "suggest") {
    const lvl = levels[suggestIdx];
    const emerging = stopLexile === null;
    return (
      <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
        <div className="mt-2 flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] bg-gradient-to-br from-[#FFE3E0] to-[#FFC9C2] px-6 py-8 text-center text-rose-900 shadow-lg ring-4 ring-white/60">
          <div className="text-6xl">📚</div>
          <p className="text-sm font-bold uppercase tracking-wide opacity-70">
            Reading level from the word check
          </p>
          <h2 className="text-4xl font-extrabold">{lexLabel(stopLexile)}</h2>
          <p className="font-semibold opacity-80">
            {emerging
              ? "Still building first words — let's read the easiest book together."
              : `${lvl.grade} · Age ${lvl.age}`}
          </p>
          <p className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold text-rose-800">
            Now read a story at this level. Only if {studentName.trim() || "the child"}{" "}
            reads it well do we move up to the next level.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => startPassage(suggestIdx)}
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
        onDone={(result, miss) => {
          setRead(result);
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
        onResult={(r) => {
          setComp(r);
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
        studentName={studentName.trim() || "Student"}
        wordRatings={wordRatings}
        wordWrong={wordWrong}
        stopLexile={stopLexile}
        suggestIdx={suggestIdx}
        read={read}
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
        <p className="max-w-md text-sm font-semibold opacity-80">
          A full read-aloud check that measures decoding, fluency,
          comprehension and vocabulary — and gives a reading level you can match
          to books.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-rose-700">
          <span className="rounded-full bg-white/70 px-3 py-1">🔤 Accuracy 40%</span>
          <span className="rounded-full bg-white/70 px-3 py-1">⏱️ Fluency 30%</span>
          <span className="rounded-full bg-white/70 px-3 py-1">💡 Comprehension 30%</span>
        </div>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Student's name"
          autoComplete="off"
          className="w-full max-w-xs rounded-2xl border-4 border-rose-200 bg-white px-4 py-3 text-center text-lg font-bold text-zinc-700 shadow-sm outline-none focus:border-rose-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          onClick={() => setPhase("words")}
          disabled={!studentName.trim()}
          className="mt-1 rounded-full bg-rose-500 px-10 py-3.5 text-xl font-extrabold text-white shadow-lg active:scale-95 disabled:opacity-50"
        >
          ▶ Start
        </button>
        <p className="text-xs font-semibold opacity-70">
          {studentName.trim()
            ? "The child reads each word aloud — you mark it ✓ or ✗ by hand."
            : "Enter the student's name to begin."}
        </p>
      </div>

      {/* Reader-level guide — visible before the assessment starts */}
      <ReaderGuide />
    </div>
  );
}

/* ---------- Stage 1 runner: graded word list, teacher-scored ----------
   No microphone here — the child reads each word aloud and the teacher marks
   it by hand with ✓ / ✗. */

function WordRunner({
  onDone,
  onExit,
}: {
  onDone: (r: Record<string, Rating>, wrong: number) => void;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [rated, setRated] = useState<Rating | null>(null);
  // Count of words read wrongly — auto-bumped on each ✗, but the teacher can
  // type over it in the box below.
  const [wrong, setWrong] = useState(0);
  const wrongRef = useRef(0);
  const ratings = useRef<Record<string, Rating>>({});
  const missCount = useRef(0); // total words read wrongly so far
  const justRated = useRef(false);
  const item = LADDER[idx];

  function setWrongCount(n: number) {
    const v = Math.max(0, Math.round(n) || 0);
    wrongRef.current = v;
    setWrong(v);
  }

  function record(r: Rating) {
    if (justRated.current) return;
    justRated.current = true;
    ratings.current[item.w] = r;
    setRated(r);
    chime(r === "green");
    if (r === "green") {
      praise();
    } else {
      missCount.current += 1;
      setWrongCount(wrongRef.current + 1);
    }
    setTimeout(() => {
      if (idx + 1 >= LADDER.length || missCount.current >= STOP_AFTER_MISSES) {
        onDone({ ...ratings.current }, wrongRef.current);
      } else {
        justRated.current = false;
        setRated(null);
        setIdx(idx + 1);
      }
    }, 850);
  }

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
        word {idx + 1} · stops after 2 wrong
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
        ) : (
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-rose-700">
            Child reads aloud — teacher marks ✓ or ✗
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => sayWord(item.w, 0.85)}
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

      {/* Wrongly-read tally — auto-counts each ✗, type to override */}
      <label className="mt-5 flex items-center gap-3 rounded-full bg-white/70 px-5 py-2.5 text-sm font-bold text-rose-700 shadow-sm dark:bg-zinc-800 dark:text-rose-300">
        Words read wrongly
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={wrong}
          onChange={(e) => setWrongCount(Number(e.target.value))}
          className="w-16 rounded-xl bg-white px-2 py-1.5 text-center text-lg font-extrabold text-rose-700 shadow-inner ring-1 ring-rose-200 dark:bg-zinc-900 dark:text-rose-300 dark:ring-rose-900"
        />
        <span className="font-semibold text-zinc-400">of {idx + 1} read</span>
      </label>
    </div>
  );
}

/* ---------- A browseable open book ---------- */

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
            boxShadow: "0 3px 0 #F1E7CC, 0 6px 0 #E7DBBC, inset 0 0 24px rgba(160,120,60,.14)",
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

/* ---------- Stage 2: read the passage aloud (running record + fluency) ---------- */

function PassageReader({
  passage,
  level,
  onDone,
  onExit,
}: {
  passage: AssessPassage;
  level: Level;
  onDone: (result: ReadResult, missed: string[]) => void;
  onExit: () => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const [page, setPage] = useState(0);
  const [sc, setSc] = useState(0); // self-corrections (teacher-entered)
  const [wrong, setWrong] = useState(0); // misread words — seeded by the mic, adjusted by teacher
  const [didMic, setDidMic] = useState(false); // has the mic produced a starting count?
  const [excluded, setExcluded] = useState<Set<number>>(new Set()); // suggested words the teacher cleared as false positives
  const [micWpm, setMicWpm] = useState<number | null>(null);
  const [missedWords, setMissedWords] = useState<string[]>([]); // the specific words the mic flagged; shown as chips
  const startedAt = useRef<number | null>(null);
  const pages = passage.pages;
  const fullText = pages.map((p) => p.text).join(" ");
  const words = fullText.split(/\s+/);
  const isLast = page === pages.length - 1;
  const cur = pages[page];

  // The student finished reading aloud: take the mic's best guess at the misread
  // count + timing, and SEED the teacher counter with it (to adjust), rather
  // than finalising — so the result combines the mic and the teacher's ear.
  function reviewMic() {
    stop();
    const spoken = transcript.split(/\s+/).filter(Boolean);
    const status = alignReading(words, spoken);
    const elapsed = startedAt.current ? (Date.now() - startedAt.current) / 1000 : null;
    setMicWpm(elapsed && elapsed > 1 ? Math.round(words.length / (elapsed / 60)) : null);
    const flagged = words
      .filter((_, i) => status[i] !== "correct")
      .map((w) => w.replace(/[.,!?;:"]/g, ""))
      .filter(Boolean);
    setMissedWords(flagged);
    setExcluded(new Set());
    setWrong(flagged.length);
    setDidMic(true);
  }

  function finishManual(accuracy: number) {
    const errors = Math.round(words.length * (1 - accuracy / 100));
    onDone({ accuracy, totalWords: words.length, errors, selfCorrections: sc, wpm: null }, []);
  }

  // Finalise: accuracy from the (mic-seeded, teacher-adjusted) misread count.
  // Keeps the mic's timing, and trims its missed-word list to the final count.
  function finishCount() {
    const errors = Math.min(words.length, Math.max(0, wrong));
    const accuracy = Math.round(((words.length - errors) / words.length) * 100);
    let wpm = micWpm;
    if (wpm == null && startedAt.current) {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      wpm = elapsed > 1 ? Math.round(words.length / (elapsed / 60)) : null;
    }
    const kept = missedWords.filter((_, i) => !excluded.has(i));
    const missed = kept.slice(0, errors);
    onDone({ accuracy, totalWords: words.length, errors, selfCorrections: sc, wpm }, missed);
  }

  // Teacher clears a mic false-positive (or adds it back); keep the count in sync.
  function toggleSuggested(i: number) {
    const wasOut = excluded.has(i);
    const next = new Set(excluded);
    if (wasOut) next.delete(i);
    else next.add(i);
    setExcluded(next);
    setWrong((w) => Math.max(0, w + (wasOut ? 1 : -1)));
  }

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
          {level.grade} · {words.length} words
        </span>
      </div>

      <h2 className="mt-4 flex items-center gap-2 text-2xl font-extrabold">
        <span className="anim-bob text-3xl">{passage.emoji}</span>
        {passage.title}
      </h2>

      {/* Open book */}
      <div
        className="relative mt-3 w-full max-w-2xl rounded-[1.6rem] p-3 shadow-2xl sm:p-4"
        style={{ background: "linear-gradient(135deg, #B5651D 0%, #93491A 55%, #7C3D14 100%)" }}
      >
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
            boxShadow: "0 3px 0 #F1E7CC, 0 6px 0 #E7DBBC, 0 9px 0 #DCCFAA, inset 0 0 28px rgba(160,120,60,.14)",
          }}
        >
          <div className="grid sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-9 sm:border-r sm:border-amber-900/10">
              <div className="text-8xl leading-none drop-shadow-md">{cur.emoji}</div>
              <span className="text-xs font-semibold text-amber-700/50">
                page {page + 1} of {pages.length}
              </span>
            </div>
            <div className="flex min-h-[12rem] flex-col items-center justify-center px-6 py-9">
              <p className="text-center text-2xl font-bold leading-relaxed text-zinc-800 sm:text-[1.7rem]">
                {cur.text}
              </p>
            </div>
          </div>
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
          onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          disabled={isLast}
          className="flex h-12 flex-1 items-center justify-center rounded-full bg-rose-500 text-base font-bold text-white shadow-md hover:bg-rose-600 active:scale-95 disabled:opacity-40"
        >
          Next page →
        </button>
      </nav>

      {/* Mic timer control */}
      {supported && (
        <div className="mt-5">
          {!listening ? (
            <button
              onClick={() => {
                reset();
                startedAt.current = Date.now();
                start();
              }}
              className="rounded-full bg-rose-500 px-7 py-3 text-base font-extrabold text-white shadow-lg active:scale-95"
            >
              🎤 Start reading aloud
            </button>
          ) : (
            <span className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white">
              👂 Listening &amp; timing… read each page
            </span>
          )}
        </div>
      )}

      {/* On the last page: self-corrections + finish */}
      {isLast && (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm dark:bg-zinc-800">
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-300">
              Self-corrections
            </span>
            <button
              onClick={() => setSc((n) => Math.max(0, n - 1))}
              className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 font-black text-zinc-600 active:scale-90 dark:bg-zinc-700 dark:text-zinc-200"
            >
              −
            </button>
            <span className="w-5 text-center font-extrabold">{sc}</span>
            <button
              onClick={() => setSc((n) => n + 1)}
              className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 font-black text-zinc-600 active:scale-90 dark:bg-zinc-700 dark:text-zinc-200"
            >
              +
            </button>
          </div>

          {/* Read aloud first — the mic produces a starting misread count */}
          {supported && listening && (
            <button
              onClick={reviewMic}
              className="mt-4 animate-pulse rounded-full bg-rose-600 px-8 py-3.5 text-lg font-extrabold text-white shadow-lg active:scale-95"
            >
              ✓ Done reading aloud
            </button>
          )}

          {/* Misread words — the mic suggests which words tripped the student up.
              Tap a word to clear a false positive; type to override the total. */}
          <div className="mt-4 w-full max-w-md rounded-2xl bg-rose-50 p-4 text-center shadow-sm ring-2 ring-rose-100 dark:bg-rose-950/30 dark:ring-rose-900/40">
            <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
              ✍️ Words read wrongly
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {didMic && missedWords.length > 0
                ? "The mic thinks these words tripped the student up. Tap any it got wrong to drop it — slang and accents can fool the mic — or type the correct total below."
                : didMic
                  ? "The mic didn't flag any words. Type how many the student actually read wrongly."
                  : `Out of ${words.length} words, how many did the student read wrongly?`}
            </p>

            {didMic && missedWords.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {missedWords.map((w, i) => {
                  const on = !excluded.has(i);
                  return (
                    <button
                      key={`${w}-${i}`}
                      onClick={() => toggleSuggested(i)}
                      title={on ? "Counted as wrong — tap if it was actually fine" : "Not counted — tap to add back"}
                      className={`rounded-lg px-2.5 py-1 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                        on
                          ? "bg-rose-500 text-white"
                          : "bg-white text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-500"
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Total wrong — seeded from the suggestions above, editable */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => setWrong((n) => Math.max(0, n - 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-white font-black text-rose-600 shadow-sm active:scale-90 dark:bg-zinc-800"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={words.length}
                value={wrong}
                onChange={(e) =>
                  setWrong(
                    Math.max(0, Math.min(words.length, Math.round(Number(e.target.value) || 0))),
                  )
                }
                aria-label="Total words read wrongly"
                className="w-20 rounded-xl border-2 border-rose-200 bg-white text-center text-3xl font-black text-zinc-700 focus:border-rose-400 focus:outline-none dark:border-rose-900 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={() => setWrong((n) => Math.min(words.length, n + 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-white font-black text-rose-600 shadow-sm active:scale-90 dark:bg-zinc-800"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              = {Math.round(((words.length - Math.min(words.length, wrong)) / words.length) * 100)}% accuracy
              {didMic && micWpm != null && ` · ${micWpm} wpm`}
            </p>
            <button
              onClick={finishCount}
              className="mt-3 rounded-full bg-rose-600 px-7 py-3 text-base font-extrabold text-white shadow-lg active:scale-95"
            >
              ✓ Confirm result
            </button>
          </div>

          <p className="mt-4 text-sm font-bold text-zinc-400">
            …or a quick estimate:
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            <button onClick={() => finishManual(98)} className="rounded-full bg-green-500 px-5 py-3 font-bold text-white shadow-sm active:scale-95">
              Read it well
            </button>
            <button onClick={() => finishManual(93)} className="rounded-full bg-amber-500 px-5 py-3 font-bold text-white shadow-sm active:scale-95">
              Some help
            </button>
            <button onClick={() => finishManual(85)} className="rounded-full bg-rose-400 px-5 py-3 font-bold text-white shadow-sm active:scale-95">
              Found it hard
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Stage 3: comprehension + vocabulary beside the book ---------- */

const KIND_LABEL: Record<QKind, string> = {
  literal: "📖 Literal",
  inferential: "🔍 Inferential",
  vocabulary: "📚 Vocabulary",
};

function Comprehension({
  passage,
  onResult,
  onSkip,
}: {
  passage: AssessPassage;
  onResult: (r: CompResult) => void;
  onSkip: () => void;
}) {
  const questions = passage.questions;
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const tally = useRef<CompResult>({ compCorrect: 0, compTotal: 0, vocabCorrect: 0, vocabTotal: 0 });
  const quiz = questions[qi];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === quiz.answer;
    chime(ok);
    if (ok) praise();
    if (quiz.kind === "vocabulary") {
      tally.current.vocabTotal += 1;
      if (ok) tally.current.vocabCorrect += 1;
    } else {
      tally.current.compTotal += 1;
      if (ok) tally.current.compCorrect += 1;
    }
    setTimeout(() => {
      if (qi + 1 >= questions.length) onResult({ ...tally.current });
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

      <div className="mt-4 grid w-full gap-6 lg:grid-cols-2 lg:items-start">
        <OpenBook title={passage.title} emoji={passage.emoji} pages={passage.pages} />

        <div className="flex flex-col items-center">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  i < qi ? "bg-rose-400" : i === qi ? "bg-rose-300 ring-2 ring-rose-200" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <div className="mt-3 w-full rounded-2xl bg-amber-50/90 p-5 ring-2 ring-amber-200 dark:bg-amber-950/40">
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-zinc-800 dark:text-amber-300">
              {KIND_LABEL[quiz.kind]}
            </span>
            <p className="mt-2 text-center text-lg font-extrabold text-amber-900 dark:text-amber-100">
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
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-black ${
                        isRight
                          ? "bg-green-500 text-white"
                          : isWrong
                            ? "bg-rose-400 text-white"
                            : "bg-amber-200 text-amber-800"
                      }`}
                    >
                      {"ABCD"[i]}
                    </span>
                    {opt}
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

const CATEGORIES = [
  {
    min: 90,
    label: "Independent Reader",
    emoji: "🦅",
    range: "90–100%",
    tone: "from-[#CFF5E1] to-[#A7E9C8] text-emerald-800",
    note: "Reads this level alone with ease.",
    about:
      "Reads this level smoothly and on their own, with strong understanding. Ready for more challenging books.",
  },
  {
    min: 75,
    label: "Instructional Reader",
    emoji: "📘",
    range: "75–89%",
    tone: "from-[#D3EBFF] to-[#ABD9FF] text-sky-800",
    note: "Reads well with a little teaching support.",
    about:
      "Reads well with a little teaching support. This is the ideal zone for guided reading and learning new skills.",
  },
  {
    min: 60,
    label: "Developing Reader",
    emoji: "🌿",
    range: "60–74%",
    tone: "from-[#FFF4BD] to-[#FFE88C] text-amber-800",
    note: "Building skills — needs guided practice.",
    about:
      "Building decoding and fluency. Reads simple texts with guided practice and still meets many tricky words.",
  },
  {
    min: 0,
    label: "Emerging Reader",
    emoji: "🌱",
    range: "below 60%",
    tone: "from-[#FFE3E0] to-[#FFC9C2] text-rose-800",
    note: "At an earlier stage — start with easier texts.",
    about:
      "Just beginning — learning letter sounds and first words. Needs lots of support and very easy, decodable books.",
  },
];

function categoryFor(score: number) {
  return CATEGORIES.find((c) => score >= c.min) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Collapsible legend explaining each reader category, current one highlighted. */
function ReaderGuide({ currentLabel }: { currentLabel?: string }) {
  // Show easiest → most advanced so it reads like a growth ladder.
  const ladder = [...CATEGORIES].reverse();
  return (
    <details className="mt-3 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-extrabold text-zinc-600 select-none dark:text-zinc-200">
        <span>📖 What do the reader levels mean?</span>
        <span className="text-xs font-bold text-zinc-400">tap to open</span>
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {ladder.map((c) => {
          const isCurrent = c.label === currentLabel;
          return (
            <div
              key={c.label}
              className={`rounded-xl bg-gradient-to-br ${c.tone} p-3 ${
                isCurrent ? "ring-4 ring-rose-300" : "opacity-80"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.emoji}</span>
                <span className="font-extrabold">{c.label}</span>
                <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">
                  {c.range}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-rose-600">
                    ★ This child
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold opacity-90">{c.about}</p>
            </div>
          );
        })}
        <p className="mt-1 text-center text-[11px] font-semibold text-zinc-400">
          The overall score blends accuracy (40%), fluency (30%) and
          comprehension (30%, including vocabulary).
        </p>
      </div>
    </details>
  );
}

/* The three accuracy bands from the Reading Level Placement Guide (98 / 95). */
export const ACCURACY_BANDS = [
  {
    label: "Independent",
    range: "98–100%",
    emoji: "🦅",
    tone: "from-[#CFF5E1] to-[#A7E9C8] text-emerald-800",
    about:
      "Reads this text accurately and on their own — it is comfortable, so they are ready for harder books.",
  },
  {
    label: "Instructional",
    range: "95–97%",
    emoji: "📘",
    tone: "from-[#D3EBFF] to-[#ABD9FF] text-sky-800",
    about:
      "Reads most words but needs a little teaching support — the ideal level for guided reading.",
  },
  {
    label: "Frustration",
    range: "below 95%",
    emoji: "🌱",
    tone: "from-[#FFE3E0] to-[#FFC9C2] text-rose-800",
    about:
      "Too many words were missed — this text is too hard right now, so step down to an easier level.",
  },
];

/** Collapsible legend explaining each accuracy band, current one highlighted. */
function AccuracyGuide({ currentLabel }: { currentLabel?: string }) {
  return (
    <details className="mt-3 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-extrabold text-zinc-600 select-none dark:text-zinc-200">
        <span>🎯 What do the accuracy levels mean?</span>
        <span className="text-xs font-bold text-zinc-400">tap to open</span>
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {ACCURACY_BANDS.map((c) => {
          const isCurrent = c.label === currentLabel;
          return (
            <div
              key={c.label}
              className={`rounded-xl bg-gradient-to-br ${c.tone} p-3 ${
                isCurrent ? "ring-4 ring-rose-300" : "opacity-80"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.emoji}</span>
                <span className="font-extrabold">{c.label}</span>
                <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">
                  {c.range}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-rose-600">
                    ★ This child
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold opacity-90">{c.about}</p>
            </div>
          );
        })}
        <p className="mt-1 text-center text-[11px] font-semibold text-zinc-400">
          Accuracy = words read correctly ÷ total words. Bands follow the
          Reading Level Placement Guide (98% / 95%).
        </p>
      </div>
    </details>
  );
}

/* ---------- Placement decision: move up / stay / move down ---------- */

const ACTION_STYLE: Record<
  PlacementAction,
  { emoji: string; title: string; tone: string }
> = {
  up: {
    emoji: "🎉",
    title: "Ready to move up!",
    tone: "from-[#CFF5E1] to-[#A7E9C8] text-emerald-900",
  },
  stay: {
    emoji: "💪",
    title: "Just right — stay here",
    tone: "from-[#D3EBFF] to-[#ABD9FF] text-sky-900",
  },
  down: {
    emoji: "🌱",
    title: "Let's step back a level",
    tone: "from-[#FFEAC2] to-[#FFD79E] text-amber-900",
  },
};

type TryResult = {
  accuracy: number;
  totalWords: number;
  errors: number;
  wpm: number | null;
};

/** Split a one-paragraph story into ~2-sentence pages so it can be flipped. */
function paginate(book: Story): { text: string; emoji: string }[] {
  const full = book.pages.map((p) => p.text).join(" ").trim();
  const sentences = full.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [full];
  const pages: { text: string; emoji: string }[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    pages.push({ text: sentences.slice(i, i + 2).join(" "), emoji: book.emoji });
  }
  return pages.length ? pages : [{ text: full, emoji: book.emoji }];
}

/** Pick a storybook at a level — varied per child but stable during render. */
function pickBook(levelIdx: number, seed: number): Story {
  const pool = levels[levelIdx].stories;
  return pool[seed % Math.min(pool.length, 8)] ?? pool[0];
}

type StepMode = "up" | "down";
type Step =
  | { kind: "settle"; levelIdx: number }
  | { kind: "advance"; levelIdx: number; mode: StepMode };

/**
 * After a trial book is read, decide what happens next, using the Reading Level
 * Placement Guide cut-offs (98% / 95%):
 *  • exploring up   — Independent (≥98%) → climb higher; Instructional (95–97%)
 *    → this level is the right fit; Frustration (<95%) → drop to the level below
 *    (i.e. stay at the current level).
 *  • exploring down — can read it (≥95%) → settle here; still too hard (<95%) →
 *    ease down again.
 */
function nextStep(label: BenchmarkBand["label"], trialIdx: number, mode: StepMode): Step {
  const maxIdx = levels.length - 1;
  if (mode === "down") {
    if (label === "Frustration")
      return trialIdx > 0
        ? { kind: "advance", levelIdx: trialIdx - 1, mode: "down" }
        : { kind: "settle", levelIdx: 0 };
    return { kind: "settle", levelIdx: trialIdx };
  }
  // mode "up"
  if (label === "Frustration") return { kind: "settle", levelIdx: Math.max(0, trialIdx - 1) };
  if (label === "Independent")
    return trialIdx < maxIdx
      ? { kind: "advance", levelIdx: trialIdx + 1, mode: "up" }
      : { kind: "settle", levelIdx: trialIdx };
  return { kind: "settle", levelIdx: trialIdx }; // Instructional → the right level
}

function verdictText(step: Step, trialIdx: number): string {
  const trial = levels[trialIdx];
  if (step.kind === "advance") {
    return step.mode === "up"
      ? `${trial.grade} was easy to read — let's try a harder book.`
      : `${trial.grade} is still tricky — let's try an easier book.`;
  }
  const settled = levels[step.levelIdx];
  if (step.levelIdx < trialIdx)
    return `${trial.grade} was a bit hard. ${settled.grade} is the right fit — stick with it.`;
  return `${settled.grade} is the right fit — stick with it.`;
}

/* ---------- Placement: read the suggested book, then adapt the level ---------- */

/**
 * Drives the whole "read the book → adjust the level" loop from the request:
 * a move-down child reads an easier book and settles there once they can read
 * it; a move-up child tries the next-level book and only advances if they can
 * read it well, otherwise stays at the current level.
 */
function AdaptivePlacement({
  action,
  reason,
  assessedIdx,
  bookSeed,
}: {
  action: PlacementAction;
  reason: string;
  assessedIdx: number;
  bookSeed: number;
}) {
  const maxIdx = levels.length - 1;
  const assessedLevel = levels[assessedIdx];
  const style = ACTION_STYLE[action];

  const startIdx =
    action === "up"
      ? Math.min(maxIdx, assessedIdx + 1)
      : action === "down"
        ? Math.max(0, assessedIdx - 1)
        : assessedIdx;

  const [trialIdx, setTrialIdx] = useState(startIdx);
  const [mode, setMode] = useState<StepMode>(action === "down" ? "down" : "up");
  const [result, setResult] = useState<TryResult | null>(null);
  // "stay" needs no trial — settle at the current level straight away.
  const [settledIdx, setSettledIdx] = useState<number | null>(
    action === "stay" ? assessedIdx : null,
  );

  function goTo(idx: number, m: StepMode) {
    setResult(null);
    setMode(m);
    setTrialIdx(idx);
  }
  function settle(idx: number) {
    setResult(null);
    setSettledIdx(idx);
  }
  function restart() {
    setResult(null);
    setSettledIdx(null);
    setMode(action === "down" ? "down" : "up");
    setTrialIdx(startIdx);
  }

  /* ----- settled: the right level is found, keep reading here ----- */
  if (settledIdx !== null) {
    const lvl = levels[settledIdx];
    const book = pickBook(settledIdx, bookSeed + 1);
    return (
      <div className="mt-3 w-full max-w-xl">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8] px-6 py-5 text-center text-emerald-900 shadow-lg ring-4 ring-white/60">
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">
            Right reading level
          </p>
          <p className="mt-1 text-3xl font-extrabold">📗 {lvl.grade}</p>
          <p className="mt-1 text-sm font-bold opacity-90">
            This book is a good fit — keep reading at {lvl.grade}.
          </p>
        </div>
        <BookReader
          key={`settled-${settledIdx}`}
          heading={`📖 Keep reading at ${lvl.grade}`}
          book={book}
          level={lvl}
          result={result}
          onFinish={setResult}
          onReadAgain={() => setResult(null)}
        />
        <button
          onClick={restart}
          className="mt-2 w-full rounded-full bg-white px-5 py-2 text-xs font-bold text-zinc-500 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ↺ Try a different level
        </button>
      </div>
    );
  }

  /* ----- exploring: read a trial book, then adapt ----- */
  const trialLevel = levels[trialIdx];
  const book = pickBook(trialIdx, bookSeed);
  const step = result
    ? nextStep(benchmarkBand(result.accuracy).label, trialIdx, mode)
    : null;

  const atEdgeUp = action === "up" && assessedIdx >= maxIdx;
  const atEdgeDown = action === "down" && assessedIdx <= 0;
  const headerTitle = atEdgeUp
    ? "Top of the ladder! 🏆"
    : atEdgeDown
      ? "Start with the easiest books 🌱"
      : `${style.title} ${style.emoji}`;
  const headerBlurb =
    action === "up"
      ? atEdgeUp
        ? `Reading ${assessedLevel.grade} independently — already the highest level.`
        : `Read ${assessedLevel.grade} well. Let's see if a ${levels[startIdx].grade} book fits.`
      : atEdgeDown
        ? `${assessedLevel.grade} was tricky — these are the gentlest books we have.`
        : `${assessedLevel.grade} was tricky. Let's try an easier ${levels[startIdx].grade} book.`;

  return (
    <div className="mt-3 w-full max-w-xl">
      <div
        className={`rounded-[1.5rem] bg-gradient-to-br ${style.tone} px-6 py-5 text-center shadow-lg ring-4 ring-white/60`}
      >
        <p className="text-2xl font-extrabold">{headerTitle}</p>
        <p className="mt-1 text-sm font-bold opacity-90">{headerBlurb}</p>
        <p className="mt-1 text-xs font-semibold opacity-75">{reason}</p>
      </div>

      <BookReader
        key={`trial-${trialIdx}`}
        heading={`📖 Try this ${trialLevel.grade} book`}
        book={book}
        level={trialLevel}
        result={result}
        onFinish={setResult}
        onReadAgain={() => setResult(null)}
      />

      {result && step && (
        <div className="mt-2 rounded-2xl bg-white p-4 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-200">
            {verdictText(step, trialIdx)}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {step.kind === "advance" ? (
              <>
                <button
                  onClick={() => goTo(step.levelIdx, step.mode)}
                  className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-extrabold text-white shadow active:scale-95"
                >
                  {step.mode === "up"
                    ? `📘 Try the ${levels[step.levelIdx].grade} book →`
                    : `📙 Try an easier ${levels[step.levelIdx].grade} book →`}
                </button>
                <button
                  onClick={() => settle(trialIdx)}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Settle at {trialLevel.grade}
                </button>
              </>
            ) : (
              <button
                onClick={() => settle(step.levelIdx)}
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-extrabold text-white shadow active:scale-95"
              >
                📗 Use {levels[step.levelIdx].grade} — keep reading
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- A flippable book the child reads aloud → its own accuracy ---------- */

function BookReader({
  heading,
  book,
  level,
  result,
  onFinish,
  onReadAgain,
}: {
  heading: string;
  book: Story;
  level: Level;
  result: TryResult | null;
  onFinish: (r: TryResult) => void;
  onReadAgain: () => void;
}) {
  const { supported, listening, transcript, start, stop, reset } =
    useSpeechRecognition();
  const startedAt = useRef<number | null>(null);
  const pages = paginate(book);
  const words = pages.map((p) => p.text).join(" ").split(/\s+/).filter(Boolean);

  useEffect(() => () => stop(), [stop]);

  function finishMic() {
    stop();
    const spoken = transcript.split(/\s+/).filter(Boolean);
    const status = alignReading(words, spoken);
    const correct = status.filter((s) => s === "correct").length;
    const errors = words.length - correct;
    const accuracy = Math.round((correct / words.length) * 100);
    const elapsed = startedAt.current ? (Date.now() - startedAt.current) / 1000 : null;
    const wpm = elapsed && elapsed > 1 ? Math.round(words.length / (elapsed / 60)) : null;
    onFinish({ accuracy, totalWords: words.length, errors, wpm });
  }

  function finishManual(accuracy: number) {
    const errors = Math.round(words.length * (1 - accuracy / 100));
    onFinish({ accuracy, totalWords: words.length, errors, wpm: null });
  }

  function readAgain() {
    reset();
    onReadAgain();
  }

  const band = result ? benchmarkBand(result.accuracy) : null;

  return (
    <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <h3 className="mb-2 text-center text-sm font-extrabold text-zinc-600 dark:text-zinc-200">
        {heading}
      </h3>
      <OpenBook title={book.title} emoji={book.emoji} pages={pages} />

      {result ? (
        /* ----- accuracy result for this book ----- */
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
            Accuracy at {level.grade}
          </p>
          <p className="text-4xl font-black text-rose-600 dark:text-rose-300">
            {result.accuracy}%
          </p>
          {band && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${band.tone}`}>
              {band.label} · {band.meaning}
            </span>
          )}
          <div className="mt-1 flex gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>{result.totalWords} words</span>
            <span>{result.errors} errors</span>
            {result.wpm != null && <span>{result.wpm} wpm</span>}
          </div>
          <button
            onClick={readAgain}
            className="mt-1 rounded-full bg-white px-5 py-2 text-sm font-bold text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-900 dark:text-zinc-200"
          >
            🔁 Read it again
          </button>
        </div>
      ) : (
        /* ----- read-aloud controls ----- */
        <div className="mt-4 flex flex-col items-center gap-3">
          {supported &&
            (!listening ? (
              <button
                onClick={() => {
                  reset();
                  startedAt.current = Date.now();
                  start();
                }}
                className="rounded-full bg-rose-500 px-7 py-3 text-base font-extrabold text-white shadow-lg active:scale-95"
              >
                🎤 Read this aloud
              </button>
            ) : (
              <>
                <span className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white">
                  👂 Listening… read every page
                </span>
                <button
                  onClick={finishMic}
                  className="animate-pulse rounded-full bg-rose-600 px-8 py-3 text-base font-extrabold text-white shadow-lg active:scale-95"
                >
                  ✓ Done — show accuracy
                </button>
              </>
            ))}

          <p className="text-xs font-bold text-zinc-400">
            {supported ? "…or mark how it went:" : "How did the reading go?"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => finishManual(98)} className="rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-95">
              Read it well
            </button>
            <button onClick={() => finishManual(93)} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-95">
              Some help
            </button>
            <button onClick={() => finishManual(85)} className="rounded-full bg-rose-400 px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-95">
              Found it hard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Report({
  studentName,
  wordRatings,
  wordWrong,
  stopLexile,
  suggestIdx,
  read,
  missed,
  comp,
  onRetry,
  onHome,
}: {
  studentName: string;
  wordRatings: Record<string, Rating>;
  wordWrong: number;
  stopLexile: number | null;
  suggestIdx: number;
  read: ReadResult | null;
  missed: string[];
  comp: Comp;
  onRetry: () => void;
  onHome: () => void;
}) {
  const level = levels[suggestIdx];

  // ----- strand scores (0–100) -----
  const accuracy = read?.accuracy ?? null;
  const accScore = accuracy ?? 0;
  const fluencyScore =
    read?.wpm != null
      ? Math.min(100, Math.round((read.wpm / level.wpmLow) * 100))
      : accuracy != null
        ? accuracy >= 95
          ? 90
          : accuracy >= 90
            ? 70
            : 55
        : 0;
  const compScore =
    comp && comp !== "skipped" && comp.compTotal
      ? Math.round((comp.compCorrect / comp.compTotal) * 100)
      : null;
  const vocabScore =
    comp && comp !== "skipped" && comp.vocabTotal
      ? Math.round((comp.vocabCorrect / comp.vocabTotal) * 100)
      : null;
  // Combined understanding (comprehension + vocabulary) — the 30% strand.
  const understandingScore =
    comp && comp !== "skipped" && comp.compTotal + comp.vocabTotal
      ? Math.round(
          ((comp.compCorrect + comp.vocabCorrect) /
            (comp.compTotal + comp.vocabTotal)) *
            100,
        )
      : null;

  // ----- weighted composite (Accuracy 40 / Fluency 30 / Comprehension 30) -----
  const composite =
    understandingScore == null
      ? read
        ? Math.round((0.4 * accScore + 0.3 * fluencyScore) / 0.7)
        : 0
      : Math.round(0.4 * accScore + 0.3 * fluencyScore + 0.3 * understandingScore);
  const category = categoryFor(composite);

  // ----- reading level: anchored to the Stage 1 word check -----
  // The reading level IS the Lexile of the hardest word read in the word check.
  // Stage 2 only drives the move-up / stay / move-down recommendation below — it
  // never inflates this Lexile. (A child who reads only "is" stays at BR99, not
  // a Year-1 benchmark.)
  const band = accuracy != null ? benchmarkBand(accuracy) : null;
  const { term } = placeByTerm(suggestIdx, accuracy, compScore);
  const finalIdx = suggestIdx;
  const finalLevel = levels[finalIdx];
  const lexile = stopLexile ?? finalLevel.lexileLow;
  const lexileText = lexLabel(lexile);

  // ----- placement decision (Reading Level Placement Guide) -----
  const placement = placementDecision(accuracy, read ? fluencyScore : null, compScore);
  // Seeded from this child's reading so different readers see different books,
  // but the same report stays stable across re-renders (pure during render).
  const bookSeed = (read?.totalWords ?? 0) + (read?.errors ?? 0) + suggestIdx;

  const wordsAttempted = Object.keys(wordRatings).length;
  const ladderMissed = LADDER.filter(
    (x) => wordRatings[x.w] && wordRatings[x.w] !== "green",
  ).map((x) => x.w);
  const practice = [...new Set([...ladderMissed, ...missed])]
    .filter((w) => w.length <= 14)
    .slice(0, 12);

  const strands: { label: string; weight: number; score: number | null }[] = [
    { label: "Decoding accuracy", weight: 40, score: accuracy },
    { label: "Fluency", weight: 30, score: read ? fluencyScore : null },
    { label: "Comprehension", weight: 30, score: understandingScore },
  ];

  // ----- how-to-support tips (teacher-facing, also printed) -----
  const support: string[] = [];
  if (!read)
    support.push(
      "Run the full read-aloud (not just the word check) for a complete picture.",
    );
  if (accuracy != null && accuracy < 95)
    support.push(
      "Decoding: re-read decodable texts, blend sounds left-to-right, and pre-teach the practice words below.",
    );
  if (read && fluencyScore < 75)
    support.push(
      "Fluency: repeated reading of one short passage 3×, plus echo and choral reading to model smooth phrasing.",
    );
  if (understandingScore != null && understandingScore < 80)
    support.push(
      `Comprehension: pause to ask who / what / why, and have ${studentName} retell the story in their own words.`,
    );
  if (vocabScore != null && vocabScore < 80)
    support.push(
      "Vocabulary: talk about new words before reading and use them in sentences together.",
    );
  if (support.length === 0)
    support.push(
      "Strong across the board — extend with longer texts and more inferential (“why do you think…”) questions.",
    );

  function printReport() {
    openReport({
      studentName,
      dateStr: new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      categoryLabel: category.label,
      categoryNote: category.note,
      categoryRange: category.range,
      categoryAbout: category.about,
      composite,
      accuracyBand:
        accuracy != null && band
          ? { pct: accuracy, label: band.label, range: band.range, note: band.note }
          : null,
      levelGrade: finalLevel.grade,
      term,
      lexile: lexileText,
      lexileBand: lexileBand(lexile),
      age: finalLevel.age,
      strands,
      support,
      practice,
      running: read
        ? {
            words: read.totalWords,
            errors: read.errors,
            selfCorrections: read.selfCorrections,
            accuracy: read.accuracy,
            wpm: read.wpm,
            wpmGoal: `${level.wpmLow}–${level.wpmHigh}`,
            band: band?.label ?? "",
          }
        : null,
    });
  }

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <h2 className="text-2xl font-extrabold">Reading report 📋</h2>
      <p className="mt-0.5 text-lg font-extrabold text-rose-600 dark:text-rose-300">
        {studentName}
      </p>

      {/* Reader category + composite */}
      <div
        className={`mt-3 w-full max-w-xl rounded-[1.5rem] bg-gradient-to-br ${category.tone} px-6 py-5 text-center shadow-lg ring-4 ring-white/60`}
      >
        <p className="text-3xl font-extrabold">{category.label}</p>
        <p className="mt-1 text-sm font-bold opacity-80">
          Overall score {composite}% — in the {category.range} band
        </p>
        <p className="mt-1 text-sm font-semibold opacity-90">
          Why: {category.about}
        </p>
      </div>

      {/* Guide: what each reader level means */}
      <ReaderGuide currentLabel={category.label} />

      {/* Placement decision + adaptive book trials */}
      {read && (
        <AdaptivePlacement
          action={placement.action}
          reason={placement.reason}
          assessedIdx={suggestIdx}
          bookSeed={bookSeed}
        />
      )}

      {/* Level + term + Lexile band */}
      <div className="mt-3 w-full max-w-xl rounded-[1.5rem] bg-white p-5 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
          Reading level
        </p>
        <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-300">
          {lexileText} · {lexileBand(lexile)}
        </p>
        <p className="mt-0.5 font-extrabold text-zinc-700 dark:text-zinc-200">
          {finalLevel.grade} · Age {finalLevel.age}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-zinc-400">
          From the word check · {finalLevel.grade} band {finalLevel.lexileRange}
        </p>
      </div>

      {/* Stage 1 word check — level reached + words read wrongly */}
      {wordsAttempted > 0 && (
        <div className="mt-3 flex w-full max-w-xl flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-white px-5 py-3 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
            Word check ·{" "}
            <span className="text-rose-600 dark:text-rose-300">
              {lexLabel(stopLexile)}
            </span>
          </span>
          <span className="text-sm font-bold text-zinc-500">
            <span className="text-rose-600 dark:text-rose-300">{wordWrong}</span> of{" "}
            {wordsAttempted} read wrongly
          </span>
        </div>
      )}

      {/* Four-strand breakdown */}
      <div className="mt-4 w-full max-w-xl rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <h3 className="font-extrabold text-zinc-700 dark:text-zinc-200">
          What we measured
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          {strands.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {s.label}{" "}
                <span className="text-xs font-semibold text-zinc-400">{s.weight}%</span>
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    s.score == null ? "bg-zinc-300" : s.score >= 80 ? "bg-green-400" : s.score >= 55 ? "bg-amber-400" : "bg-rose-400"
                  }`}
                  style={{ width: `${s.score ?? 0}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-bold text-zinc-500">
                {s.score == null ? "—" : `${s.score}%`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-zinc-400">
          Comprehension blends {comp && comp !== "skipped" ? comp.compTotal + comp.vocabTotal : 8}{" "}
          questions{vocabScore != null && ` (vocabulary ${vocabScore}%)`}. As an
          informal check, read this as a guide (±1 term) — for a firm level, run
          a second passage at this level and compare.
        </p>
      </div>

      {/* How to support */}
      <div className="mt-4 w-full max-w-xl rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
        <h3 className="font-extrabold text-zinc-700 dark:text-zinc-200">
          🤝 How to support {studentName}
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {support.map((s, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300"
            >
              <span className="text-rose-400">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Running record */}
      {read && (
        <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Words" value={`${read.totalWords}`} />
          <Stat label="Errors" value={`${read.errors}`} />
          <Stat label="Self-corr." value={`${read.selfCorrections}`} />
          <Stat
            label="Accuracy"
            value={`${read.accuracy}%`}
            pill={band?.label}
            pillTone={band?.tone}
          />
          {read.wpm != null && <Stat label="Words / min" value={`${read.wpm}`} sub={`goal ${level.wpmLow}–${level.wpmHigh}`} />}
        </div>
      )}

      {/* Accuracy explanation */}
      {read && band && (
        <div className="mt-4 w-full max-w-xl rounded-2xl bg-white p-5 shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-200">
              Accuracy {read.accuracy}%
            </h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${band.tone}`}>
              {band.label} level · {band.range}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {band.note}
          </p>
        </div>
      )}

      {/* Accuracy-level guide */}
      {read && band && <AccuracyGuide currentLabel={band.label} />}

      {/* Practice words */}
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

      <p className="mt-4 max-w-xl text-center text-xs font-semibold text-zinc-400">
        For a reliable result, run a second passage at this level and compare —
        scores should be similar.
      </p>

      <button
        onClick={printReport}
        className="mt-5 w-full max-w-xl rounded-full bg-emerald-600 px-6 py-3.5 text-lg font-extrabold text-white shadow-lg active:scale-95"
      >
        🖨️ Open / print {studentName}&apos;s report
      </button>

      <div className="mt-3 flex w-full max-w-xl gap-3">
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

function Stat({
  label,
  value,
  sub,
  pill,
  pillTone,
}: {
  label: string;
  value: string;
  sub?: string;
  pill?: string;
  pillTone?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-sm ring-2 ring-white/70 dark:bg-zinc-900">
      <span className="text-xl font-extrabold text-zinc-700 dark:text-zinc-100">
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {sub && <span className="mt-0.5 text-[10px] font-semibold text-zinc-400">{sub}</span>}
      {pill && (
        <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${pillTone}`}>
          {pill}
        </span>
      )}
    </div>
  );
}
