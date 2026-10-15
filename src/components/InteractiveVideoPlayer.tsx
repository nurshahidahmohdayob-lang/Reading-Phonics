"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InteractiveVideo } from "@/app/interactiveVideos";

/* An interactive video: the read-aloud plays from YouTube and pauses at each
   question. The child taps an answer, sees whether it was right and why,
   then the video carries on. After the story, a short written answer.

   Skipping ahead doesn't skip a question: any question whose moment has
   passed is asked as soon as it's reached. The first answer tapped is the
   one that counts. onChange gets everything so far, in the shape the class
   page sends to the teacher. */

export type VideoResult = {
  answers: { label: string; value: string }[];
  text: string;
  score: { score: number; total: number } | null;
  images: string[];
};

type YTPlayer = {
  getCurrentTime(): number;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const before = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        before?.();
        resolve(window.YT!);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

/** The same order every time for the same question, but not right-first. */
function shuffled(options: string[], seed: string): string[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out = [...options];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const COLOURS = [
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-fuchsia-500",
];

export default function InteractiveVideoPlayer({
  video,
  onChange,
}: {
  video: InteractiveVideo;
  onChange?: (r: VideoResult) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  /** The child's first answer to each question, by index. */
  const [answers, setAnswers] = useState<Record<number, string>>({});
  /** The question on screen now, or null while the video plays. */
  const [asking, setAsking] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [writing, setWriting] = useState("");
  // The clock below reads these without restarting the player.
  const answersRef = useRef(answers);
  const askingRef = useRef(asking);
  useEffect(() => {
    answersRef.current = answers;
    askingRef.current = asking;
  }, [answers, asking]);

  const qs = video.questions;
  const options = useMemo(
    () => qs.map((q) => shuffled(q.options, video.id + q.q)),
    [qs, video.id],
  );
  const right = Object.entries(answers).filter(
    ([i, a]) => qs[+i].options[0] === a,
  ).length;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const holder = box.current;
    if (!holder) return;
    const el = document.createElement("div");
    holder.appendChild(el);
    loadYouTube().then((YT) => {
      if (!alive) return;
      player.current = new YT.Player(el, {
        videoId: video.youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1 },
        events: {
          onReady: () => alive && setReady(true),
          onError: () => alive && setFailed(true),
          onStateChange: (e) => {
            if (e.data === 0) setFinished(true); // ended
          },
        },
      });
      // Watch the clock: pause at the first unanswered question that's due.
      timer = setInterval(() => {
        const p = player.current;
        if (
          !p ||
          askingRef.current !== null ||
          typeof p.getCurrentTime !== "function"
        )
          return;
        const t = p.getCurrentTime();
        const due = qs.findIndex(
          (q, i) => t >= q.at && answersRef.current[i] === undefined,
        );
        if (due >= 0) {
          p.pauseVideo();
          setAsking(due);
        } else if (t >= video.end) {
          p.pauseVideo();
          setFinished(true);
        }
      }, 250);
    });
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      try {
        player.current?.destroy();
      } catch {}
      player.current = null;
      holder.innerHTML = "";
    };
  }, [video, qs]);

  // Tell the page what the child has done so far.
  useEffect(() => {
    const lines = qs.map((q, i) => ({
      label: `${i + 1}. ${q.q}`,
      value:
        answers[i] === undefined
          ? "—"
          : `${answers[i]} ${answers[i] === q.options[0] ? "✓" : `✗ (answer: ${q.options[0]})`}`,
    }));
    lines.push({ label: `✍️ ${video.writing}`, value: writing.trim() || "—" });
    const answered = Object.keys(answers).length;
    onChange?.({
      answers: lines,
      text: `🎬 ${video.title}: ${right} out of ${qs.length} right${answered < qs.length ? ` (${answered} answered)` : ""}.`,
      score: answered ? { score: right, total: qs.length } : null,
      images: [],
    });
  }, [answers, writing, qs, video, right, onChange]);

  function choose(i: number, value: string) {
    if (answers[i] !== undefined) return;
    setAnswers((a) => ({ ...a, [i]: value }));
  }

  function carryOn() {
    setAsking(null);
    player.current?.playVideo();
  }

  const q = asking !== null ? qs[asking] : null;
  const chosen = asking !== null ? answers[asking] : undefined;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* progress: one dot per question */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {qs.map((qq, i) => (
          <span
            key={i}
            title={`Question ${i + 1}`}
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${
              answers[i] === undefined
                ? asking === i
                  ? "bg-amber-400 text-white ring-2 ring-amber-200"
                  : "bg-zinc-200 text-zinc-500"
                : answers[i] === qq.options[0]
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-400 text-white"
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>

      <div
        className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div
          ref={box}
          className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        />
        {!ready && !failed && (
          <p className="absolute inset-0 grid place-items-center font-bold text-white/80">
            Loading the video…
          </p>
        )}
        {failed && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <p className="font-bold text-white">
              The video won&apos;t play here.{" "}
              <a
                className="underline"
                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch it on YouTube
              </a>{" "}
              and answer below.
            </p>
          </div>
        )}

        {/* the question, over the paused video */}
        {q && asking !== null && (
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-[2px]">
            <div className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-2xl sm:p-5">
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-600">
                Question {asking + 1} of {qs.length}
              </p>
              <p className="mt-1 text-lg font-extrabold leading-snug text-zinc-800 sm:text-xl">
                {q.q}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options[asking].map((o, k) => {
                  const isRight = o === q.options[0];
                  const state =
                    chosen === undefined
                      ? ""
                      : isRight
                        ? "right"
                        : chosen === o
                          ? "wrong"
                          : "dim";
                  return (
                    <button
                      key={o}
                      onClick={() => choose(asking, o)}
                      disabled={chosen !== undefined}
                      aria-pressed={chosen === o}
                      className={`rounded-2xl px-3 py-3 text-left text-base font-extrabold text-white shadow-md transition-all active:scale-95 ${
                        state === "right"
                          ? "bg-emerald-500 ring-4 ring-emerald-200"
                          : state === "wrong"
                            ? "bg-rose-500 ring-4 ring-rose-200"
                            : state === "dim"
                              ? `${COLOURS[k]} opacity-40`
                              : COLOURS[k]
                      }`}
                    >
                      {state === "right" ? "✓ " : state === "wrong" ? "✗ " : ""}
                      {o}
                    </button>
                  );
                })}
              </div>
              {chosen !== undefined && (
                <div className="mt-3 flex flex-col items-center gap-2 text-center">
                  <p
                    className={`text-base font-extrabold ${chosen === q.options[0] ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {chosen === q.options[0] ? "🎉 Well done!" : "Not quite."}{" "}
                    <span className="font-semibold text-zinc-600">{q.why}</span>
                  </p>
                  <button
                    onClick={carryOn}
                    className="rounded-full bg-[#0A4F29] px-6 py-2.5 text-base font-extrabold text-white shadow active:scale-95"
                  >
                    ▶ Keep watching
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] font-semibold text-zinc-400">
        {video.credit}
      </p>

      {(finished || Object.keys(answers).length === qs.length) && (
        <div className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-md ring-2 ring-amber-100">
          <p className="text-center text-xl font-extrabold text-[#0A4F29]">
            ⭐ {right} out of {qs.length} right
          </p>
          <label
            htmlFor="iv-writing"
            className="mt-3 block font-extrabold text-zinc-700"
          >
            ✍️ {video.writing}
          </label>
          <textarea
            id="iv-writing"
            value={writing}
            onChange={(e) => setWriting(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-2 w-full rounded-2xl border-4 border-amber-200 px-3 py-2 text-base font-semibold outline-none focus:border-amber-400"
            placeholder="I would like to…"
          />
          <p className="mt-1 text-center text-sm font-bold text-zinc-500">
            When you&apos;re done, press Submit at the bottom.
          </p>
        </div>
      )}
    </div>
  );
}
