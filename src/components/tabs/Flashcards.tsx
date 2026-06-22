"use client";

import { useEffect, useRef, useState } from "react";
import { jollyGroups, GROUP_TITLES } from "@/app/jolly";
import { wordFamilies, type WordCard } from "@/app/words";
import { playSoundClip, speak, stopSpeech } from "@/lib/speak";
import { openFlashcards } from "@/lib/flashcardPrint";

type Mode = "menu" | "sounds" | "words";

/* A single, soft pastel for each phonics group (cycled for word families).
   `card` = the flip-card background (one solid tone, no gradient),
   `pick` = the selected picker chip, `bgHex` = the same colour as a hex so the
   printed card matches the screen. Pastels are light, so cards use dark text. */
const COLORS = [
  { card: "bg-[#FFEAF2]", pick: "bg-pink-200 text-pink-900", bgHex: "#FFEAF2" },
  { card: "bg-[#FFEEDD]", pick: "bg-orange-200 text-orange-900", bgHex: "#FFEEDD" },
  { card: "bg-[#FFF8D6]", pick: "bg-amber-200 text-amber-900", bgHex: "#FFF8D6" },
  { card: "bg-[#E5F7EC]", pick: "bg-emerald-200 text-emerald-900", bgHex: "#E5F7EC" },
  { card: "bg-[#E3F5F6]", pick: "bg-teal-200 text-teal-900", bgHex: "#E3F5F6" },
  { card: "bg-[#E8F2FF]", pick: "bg-sky-200 text-sky-900", bgHex: "#E8F2FF" },
  { card: "bg-[#ECEFFF]", pick: "bg-indigo-200 text-indigo-900", bgHex: "#ECEFFF" },
  { card: "bg-[#F2EAFF]", pick: "bg-violet-200 text-violet-900", bgHex: "#F2EAFF" },
  { card: "bg-[#FFECE6]", pick: "bg-rose-200 text-rose-900", bgHex: "#FFECE6" },
];
const colorFor = (i: number) => COLORS[i % COLORS.length];

export default function Flashcards() {
  const [mode, setMode] = useState<Mode>("menu");

  function back() {
    stopSpeech();
    setMode("menu");
  }

  if (mode === "sounds") return <SoundDeck onBack={back} />;
  if (mode === "words") return <WordDeck onBack={back} />;
  return <Menu onPick={(m) => setMode(m)} />;
}

/* ---------- Choose a deck: sounds first, then blending ---------- */

function Menu({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Flip a card to check yourself. Start with letter sounds, then blend
        words!
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        <button
          onClick={() => onPick("sounds")}
          className="group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-brand-400 to-brand-600 px-6 py-10 text-white shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-5xl shadow-sm transition-transform group-hover:scale-110">
            🔤
          </span>
          <span className="text-2xl font-extrabold">① Letter Sounds</span>
          <span className="text-center text-sm font-semibold opacity-90">
            See the letter, say the sound, flip for a picture
          </span>
        </button>

        <button
          onClick={() => onPick("words")}
          className="group flex flex-col items-center gap-3 rounded-[2rem] bg-gradient-to-br from-teal-400 to-teal-600 px-6 py-10 text-white shadow-lg ring-4 ring-white/60 transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-5xl shadow-sm transition-transform group-hover:scale-110">
            🧩
          </span>
          <span className="text-2xl font-extrabold">② Blend Words</span>
          <span className="text-center text-sm font-semibold opacity-90">
            See the picture, blend the sounds into a word
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------- A reusable flip card ---------- */

function FlipCard({
  flipped,
  onFlip,
  accent,
  front,
  back,
}: {
  flipped: boolean;
  onFlip: () => void;
  accent: string;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  return (
    <div className="flip w-full max-w-[500px]">
      <div
        onClick={onFlip}
        className={`flip-inner h-[20rem] w-full cursor-pointer sm:h-[24rem] ${
          flipped ? "is-flipped" : ""
        }`}
      >
        <div
          className={`flip-face flex flex-col items-center justify-center gap-4 rounded-[2rem] ${accent} px-6 text-center text-zinc-800 shadow-lg ring-4 ring-white/60 print:text-zinc-900 print:shadow-none print:ring-1 print:ring-zinc-300 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]`}
        >
          {front}
        </div>
        <div className="flip-face flip-back flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-white px-6 text-center shadow-lg ring-4 ring-white/60 dark:bg-zinc-900">
          {back}
        </div>
      </div>
    </div>
  );
}

/* A consistent footer: prev / counter / next. */
function Nav({
  index,
  total,
  onPrev,
  onNext,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <nav className="mt-6 flex w-full max-w-[500px] items-center justify-between gap-4">
      <button
        onClick={onPrev}
        className="flex h-14 flex-1 items-center justify-center rounded-full bg-white text-lg font-bold text-zinc-700 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
      >
        ← Back
      </button>
      <span className="shrink-0 text-sm font-bold text-zinc-400">
        {index + 1} / {total}
      </span>
      <button
        onClick={onNext}
        className="flex h-14 flex-1 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-md hover:bg-brand-600 active:scale-95"
      >
        Next →
      </button>
    </nav>
  );
}

/* ---------- Deck 1: letter-sound flashcards ---------- */

function SoundDeck({ onBack }: { onBack: () => void }) {
  const [g, setG] = useState(0); // which jolly group
  const [i, setI] = useState(0); // which card in the group
  const [flipped, setFlipped] = useState(false);

  const sounds = jollyGroups[g].sounds;
  const card = sounds[i];

  function go(delta: number) {
    stopSpeech();
    setFlipped(false);
    setI((prev) => (prev + delta + sounds.length) % sounds.length);
  }
  function pickGroup(ng: number) {
    stopSpeech();
    setG(ng);
    setI(0);
    setFlipped(false);
  }
  function hear(e?: React.MouseEvent) {
    e?.stopPropagation();
    stopSpeech();
    playSoundClip(card.label, card.say);
  }
  function printDeck() {
    stopSpeech();
    openFlashcards(
      `Letter Sounds · Group ${jollyGroups[g].group}`,
      sounds.map((s) => ({
        front: [
          { text: s.label, cls: "big" as const },
          ...(s.note ? [{ text: s.note, cls: "sub" as const }] : []),
        ],
        back: [
          { text: s.emoji, cls: "emoji" as const },
          { text: s.word, cls: "word" as const },
          { text: `starts with “${s.label}”`, cls: "sub" as const },
        ],
      })),
      colorFor(g).bgHex,
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Decks
        </button>
        <button
          onClick={printDeck}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-95"
        >
          🖨️ Print / Download
        </button>
      </div>

      {/* Group picker */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {jollyGroups.map((grp, idx) => (
          <button
            key={grp.group}
            onClick={() => pickGroup(idx)}
            className={`h-9 w-9 rounded-full text-sm font-extrabold shadow-sm transition-all active:scale-90 ${
              idx === g
                ? colorFor(idx).pick
                : "bg-white text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {grp.group}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-zinc-400">
        {GROUP_TITLES[jollyGroups[g].group]}
      </p>

      <div className="mt-4 flex w-full flex-col items-center">
        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
          accent={colorFor(g).card}
          front={
            <>
              <span className="text-8xl font-black lowercase drop-shadow-sm">
                {card.label}
              </span>
              {card.note && (
                <span className="rounded-full bg-white/60 px-3 py-1 text-sm font-bold text-zinc-700">
                  {card.note}
                </span>
              )}
              <button
                onClick={hear}
                className="rounded-full bg-white/90 px-6 py-2.5 text-lg font-extrabold text-brand-700 shadow active:scale-95"
              >
                🔊 Hear sound
              </button>
              <span className="text-sm font-semibold text-zinc-500">
                tap the card to flip 🔄
              </span>
            </>
          }
          back={
            <>
              <span className="text-8xl">{card.emoji}</span>
              <span className="whitespace-nowrap text-5xl font-black lowercase text-zinc-700 dark:text-zinc-100">
                {card.word}
              </span>
              <span className="text-base font-semibold text-zinc-400">
                {card.word} starts with “{card.label}”
              </span>
              <button
                onClick={hear}
                className="rounded-full bg-brand-100 px-6 py-2.5 text-lg font-extrabold text-brand-700 shadow active:scale-95 dark:bg-brand-950 dark:text-brand-300"
              >
                🔊 Hear sound
              </button>
            </>
          }
        />

        <Nav
          index={i}
          total={sounds.length}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
        />
      </div>
    </div>
  );
}

/* ---------- Deck 2: blending flashcards ---------- */

function WordDeck({ onBack }: { onBack: () => void }) {
  const [f, setF] = useState(0); // which word family
  const [i, setI] = useState(0); // which card in the family
  const [flipped, setFlipped] = useState(false);
  const [active, setActive] = useState(-1); // lit sound during a blend
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const family = wordFamilies[f];
  const words = family.words;
  const card = words[i];

  function stopBlend() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActive(-1);
  }
  useEffect(() => stopBlend, []);

  function go(delta: number) {
    stopBlend();
    stopSpeech();
    setFlipped(false);
    setI((prev) => (prev + delta + words.length) % words.length);
  }
  function pickFamily(nf: number) {
    stopBlend();
    stopSpeech();
    setF(nf);
    setI(0);
    setFlipped(false);
  }

  function hearSound(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    stopBlend();
    playSoundClip(card.sounds[idx] ?? card.say[idx], card.say[idx]);
  }

  /** Light each sound in turn, then say the whole word. */
  function blend(e: React.MouseEvent, w: WordCard) {
    e.stopPropagation();
    stopBlend();
    stopSpeech();
    const step = 850;
    w.say.forEach((s, idx) => {
      timers.current.push(
        setTimeout(() => {
          setActive(idx);
          playSoundClip(w.sounds[idx] ?? s, s);
        }, idx * step),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setActive(-1);
        speak(w.text, 0.8);
      }, w.say.length * step),
    );
  }

  function printDeck() {
    stopBlend();
    stopSpeech();
    openFlashcards(
      `Blend Words · ${family.family} family`,
      words.map((w) => ({
        front: [
          { text: w.emoji, cls: "emoji" as const },
          { text: "What word?", cls: "sub" as const },
        ],
        back: [
          { text: w.text, cls: "word" as const },
          { text: w.sounds.join(" · "), cls: "sub" as const },
        ],
      })),
      colorFor(f).bgHex,
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full bg-zinc-100 px-4 py-2 font-semibold text-zinc-600 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
        >
          ← Decks
        </button>
        <button
          onClick={printDeck}
          className="rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm active:scale-95"
        >
          🖨️ Print / Download
        </button>
      </div>

      {/* Word-family picker */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {wordFamilies.map((fam, idx) => (
          <button
            key={fam.family}
            onClick={() => pickFamily(idx)}
            className={`rounded-full px-3 py-1.5 text-sm font-bold shadow-sm transition-all active:scale-95 ${
              idx === f
                ? colorFor(idx).pick
                : "bg-white text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {fam.family}
          </button>
        ))}
      </div>

      <div className="mt-4 flex w-full flex-col items-center">
        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
          accent={colorFor(f).card}
          front={
            <>
              <span className="text-[7rem] leading-none">{card.emoji}</span>
              <span className="text-lg font-bold text-zinc-600">
                What is this word?
              </span>
              <span className="text-sm font-semibold text-zinc-500">
                tap the card to flip 🔄
              </span>
            </>
          }
          back={
            <>
              <span className="whitespace-nowrap text-6xl font-black lowercase text-zinc-700 dark:text-zinc-100">
                {card.text}
              </span>
              <div className="flex flex-wrap items-end justify-center gap-2">
                {card.sounds.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => hearSound(idx, e)}
                    className={`flex h-16 min-w-12 items-center justify-center rounded-2xl px-2 text-3xl font-black lowercase shadow-sm transition-all active:scale-90 ${
                      active === idx
                        ? "scale-110 bg-teal-500 text-white"
                        : "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-zinc-800 dark:text-teal-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => blend(e, card)}
                className="rounded-full bg-teal-500 px-7 py-2.5 text-lg font-extrabold text-white shadow-lg active:scale-95"
              >
                🔉 Blend it!
              </button>
            </>
          }
        />

        <Nav
          index={i}
          total={words.length}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
        />
      </div>
    </div>
  );
}
