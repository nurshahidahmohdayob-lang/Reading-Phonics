"use client";

import { useState } from "react";
import {
  allJollySounds,
  jollyGroups,
  GROUP_TITLES,
  GROUP_GUIDE,
  type JollySound,
} from "@/app/jolly";
import { letterSounds } from "@/app/alphabet";
import { lessons } from "@/app/lessons";
import { speak, playClip, stopSpeech } from "@/lib/speak";
import ActivityCenter from "@/components/ActivityCenter";
import WordSounds from "@/components/tabs/WordSounds";

const SOUND_RATE = 1.05;
type Mode = "sounds" | "blending";

export default function Phonics() {
  const [mode, setMode] = useState<Mode>("sounds");

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      {/* Sub-navigation */}
      <div className="flex w-full max-w-sm gap-2 rounded-2xl bg-white/70 p-1.5 shadow-sm backdrop-blur dark:bg-zinc-800/70">
        {(
          [
            { id: "sounds", label: "🔤 Sounds" },
            { id: "blending", label: "🧩 Blending" },
          ] as { id: Mode; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            aria-current={mode === t.id}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
              mode === t.id
                ? "bg-brand-600 text-white shadow"
                : "text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex w-full flex-1 flex-col items-center">
        {mode === "sounds" ? <Sounds /> : <WordSounds />}
      </div>
    </div>
  );
}

/* ---------- Sounds: phonics groups enriched with letter-sound detail ---------- */

/* Candy palette cycled across the group cards. */
const GROUP_STYLES = [
  { bg: "bg-gradient-to-br from-[#FFD9EA] to-[#FFC0DB]", text: "text-pink-700" },
  { bg: "bg-gradient-to-br from-[#FFE8C9] to-[#FFD3A1]", text: "text-orange-700" },
  { bg: "bg-gradient-to-br from-[#CFF5E1] to-[#A7E9C8]", text: "text-emerald-700" },
  { bg: "bg-gradient-to-br from-[#FFF4BD] to-[#FFE88C]", text: "text-amber-700" },
  { bg: "bg-gradient-to-br from-[#D3EBFF] to-[#ABD9FF]", text: "text-sky-700" },
  { bg: "bg-gradient-to-br from-[#E9DFFF] to-[#D2C0FF]", text: "text-violet-700" },
];

function Sounds() {
  const [selected, setSelected] = useState<JollySound>(allJollySounds[0]);
  const [playing, setPlaying] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [openGroup, setOpenGroup] = useState<number | null>(null);

  // Letter-sound detail (IPA, mouth guide) for single-letter sounds.
  const alpha =
    selected.label.length === 1
      ? letterSounds.find((l) => l.letter === selected.label) ?? null
      : null;
  // Rich lesson (example words + mini-games) for some single letters.
  const lesson = lessons.find((l) => l.letter === selected.label);

  /** The song verse for this letter: /sounds/<id>-chant.mp3, else TTS chant. */
  function song(s: JollySound) {
    playClip(`${s.id}-chant`, () =>
      speak(`${s.say}, ${s.say}, ${s.word}!`, SOUND_RATE),
    );
  }

  /** Just the sound, as sung in the song: /sounds/<id>.mp3, else TTS. */
  function pureSound(s: JollySound) {
    playClip(s.id, () => speak(s.say, SOUND_RATE));
  }

  function choose(s: JollySound) {
    setSelected(s);
    pureSound(s);
    // Bring the big letter card (and its activities) into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const groupData = jollyGroups.find((g) => g.group === openGroup);

  function enterGroup(group: number) {
    const sounds = jollyGroups.find((g) => g.group === group)!.sounds;
    setOpenGroup(group);
    setSelected(sounds[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- Activities open as their own page ---- */
  if (playing && lesson) {
    return <ActivityCenter lesson={lesson} onClose={() => setPlaying(false)} />;
  }

  /* ---- Group picker: pastel cards like the home menu ---- */
  if (!groupData) {
    return (
      <div className="flex w-full flex-col items-center">
        <TeacherNotes
          showWhy={showWhy}
          setShowWhy={setShowWhy}
          showGuide={showGuide}
          setShowGuide={setShowGuide}
        />
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
          {jollyGroups.map(({ group, sounds }, gi) => {
            const style = GROUP_STYLES[gi % GROUP_STYLES.length];
            const [label, letters] = GROUP_TITLES[group].split(" · ");
            return (
              <button
                key={group}
                onClick={() => enterGroup(group)}
                className={`group flex flex-col items-center gap-2 rounded-[2rem] ${style.bg} ${style.text} px-4 py-7 shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-xl active:scale-95`}
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70 text-4xl shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-110">
                  {sounds[0].emoji}
                </span>
                <span className="text-lg font-extrabold">{label}</span>
                <span className="text-center font-mono text-sm font-bold opacity-80">
                  {letters}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---- Inside a group: its letters and activities ---- */
  return (
    <div className="flex w-full flex-col items-center">
      {/* Back to all groups */}
      <div className="mb-4 flex w-full">
        <button
          onClick={() => setOpenGroup(null)}
          className="flex items-center gap-1 rounded-full bg-white px-5 py-2.5 font-bold text-zinc-600 shadow-sm transition-all hover:shadow active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← All groups
        </button>
      </div>
      {/* Detail card */}
      <div className="flex w-full flex-col items-center gap-2 rounded-[2rem] bg-gradient-to-br from-[#E9DFFF] to-[#CDB6FF] px-6 py-8 text-violet-900 shadow-lg ring-4 ring-white/60">
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">
          Group {selected.group}
          {selected.note ? ` · ${selected.note}` : ""}
        </span>
        <button
          onClick={() => pureSound(selected)}
          className="text-7xl font-black lowercase text-violet-700 drop-shadow-sm sm:text-8xl"
        >
          {selected.label}
        </button>
        <span className="text-lg font-bold">
          {alpha ? `${alpha.ipa} · ` : ""}
          <span className="inline-flex items-center gap-1">
            {selected.emoji} {selected.word}
          </span>
        </span>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => song(selected)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-base font-bold text-white shadow-md active:scale-95"
          >
            🎵 Song
          </button>
          <button
            onClick={stopSpeech}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2 text-base font-bold text-white shadow-md active:scale-95"
          >
            ⏹ Stop
          </button>
          <button
            onClick={() => pureSound(selected)}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-base font-bold text-violet-700 shadow-sm backdrop-blur active:scale-95"
          >
            🔊 Just the sound
          </button>
        </div>
      </div>

      {/* Action */}
      <Panel title="🙆 Action" body={selected.action} readRate={0.95} />

      {/* How to make the sound (single letters only) */}
      {alpha && (
        <Panel
          title={`🗣️ How to make the ${selected.label} sound`}
          body={alpha.guide}
          readRate={0.95}
        />
      )}

      {/* Activities + example words for letters that have them */}
      {lesson && (
        <button
          onClick={() => setPlaying(true)}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-600 px-6 py-4 text-xl font-extrabold text-white shadow-lg transition-all hover:bg-brand-700 active:scale-[0.98]"
        >
          🎮 Play Activities
        </button>
      )}
      {lesson && lesson.words.length > 0 && (
        <div className="mt-4 grid w-full grid-cols-3 gap-3">
          {lesson.words.map((word) => (
            <button
              key={word.text}
              onClick={() => speak(word.text, 0.95)}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-zinc-100 bg-white px-3 py-4 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-4xl">{word.emoji}</span>
              <span className="text-sm font-bold lowercase text-zinc-700 dark:text-zinc-200">
                {word.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* This group's sounds */}
      <div className="mt-8 w-full">
        <h2 className="mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
          {GROUP_TITLES[groupData.group]}
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {groupData.sounds.map((s) => (
            <button
              key={s.id}
              onClick={() => choose(s)}
              aria-current={s.id === selected.id}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 shadow-sm transition-all active:scale-90 ${
                s.id === selected.id
                  ? "bg-brand-600 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-brand-50 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-base font-extrabold lowercase">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

function TeacherNotes({
  showWhy,
  setShowWhy,
  showGuide,
  setShowGuide,
}: {
  showWhy: boolean;
  setShowWhy: (fn: (v: boolean) => boolean) => void;
  showGuide: boolean;
  setShowGuide: (fn: (v: boolean) => boolean) => void;
}) {
  return (
    <>
      {/* Teacher note: why 7 groups */}
      <div className="mb-4 w-full">
        <button
          onClick={() => setShowWhy((v) => !v)}
          aria-expanded={showWhy}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-left text-sm font-bold text-brand-700 active:scale-[0.99] dark:bg-brand-950 dark:text-brand-300"
        >
          <span>ℹ️ For teachers: why are sounds taught in groups?</span>
          <span>{showWhy ? "▲" : "▼"}</span>
        </button>
        {showWhy && (
          <div className="mt-2 space-y-2 rounded-2xl border-2 border-brand-100 bg-white p-5 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <p>
              This phonics programme combines several proven approaches —
              <strong> synthetic phonics</strong> (sounding out and blending),
              <strong> multisensory actions</strong> for each sound, and
              <strong> word-family</strong> practice. The sounds are taught in a
              carefully chosen order, <strong>not alphabetically</strong>, about
              one sound a day so children build reading skills quickly.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Group 1 (s a t i p n) comes first</strong> because these
                six sounds make more simple words than any other six letters, so
                children can start blending and reading real words (sat, pin,
                tap, nap) almost straight away.
              </li>
              <li>
                The order is by <strong>usefulness, not the alphabet</strong>, so
                children build many decodable words early and stay motivated.
              </li>
              <li>
                <strong>Easily-confused letters</strong> (like b and d) are put
                in different groups so they are never taught together.
              </li>
              <li>
                <strong>Single-letter sounds (groups 1–3) come first;</strong>{" "}
                digraphs like sh, ch, th, ai and ee follow, then the{" "}
                <strong>extended code</strong> (groups 8–9: igh, air, ear, ph…)
                once children blend confidently.
              </li>
            </ul>
            <p className="font-semibold text-brand-700 dark:text-brand-300">
              Teach each group in order, review earlier sounds daily, and move on
              once children can hear, say, and blend them.
            </p>
          </div>
        )}
      </div>

      {/* Guide: what's in each group */}
      <div className="mb-4 w-full">
        <button
          onClick={() => setShowGuide((v) => !v)}
          aria-expanded={showGuide}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-left text-sm font-bold text-brand-700 active:scale-[0.99] dark:bg-brand-950 dark:text-brand-300"
        >
          <span>📋 What&apos;s in each group, and how to teach it</span>
          <span>{showGuide ? "▲" : "▼"}</span>
        </button>
        {showGuide && (
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border-2 border-brand-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {GROUP_GUIDE.map((g) => (
              <div
                key={g.group}
                className="rounded-xl bg-brand-50/60 p-3 dark:bg-zinc-800/60"
              >
                <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  Group {g.group}
                  <span className="ml-2 font-mono text-zinc-500 dark:text-zinc-400">
                    {g.sounds}
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                  {g.focus}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <strong className="font-semibold">How to teach:</strong>{" "}
                  {g.tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Panel({
  title,
  body,
  readRate,
}: {
  title: string;
  body: string;
  readRate: number;
}) {
  return (
    <div className="mt-4 w-full rounded-2xl border-2 border-brand-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-brand-600 dark:text-brand-400">
          {title}
        </h3>
        <button
          onClick={() => speak(body, readRate)}
          className="shrink-0 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-bold text-brand-700 active:scale-95 dark:bg-brand-950 dark:text-brand-300"
        >
          🔊 Read
        </button>
      </div>
      <p className="mt-2 text-zinc-700 dark:text-zinc-200">{body}</p>
    </div>
  );
}
