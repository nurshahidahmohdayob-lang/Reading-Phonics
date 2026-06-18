"use client";

import { POS_COLOR, POS_ORDER, POS_SHORT } from "@/app/dictionary";

/** A toggle for grammar colours plus a colour key, shared by Stories and
    Guided Reading so each word's colour shows what kind of word it is. */
export default function GrammarLegend({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={onToggle}
        aria-pressed={on}
        className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-sm transition-all active:scale-95 ${
          on
            ? "bg-brand-600 text-white"
            : "bg-white text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        🎨 Grammar colours: {on ? "on" : "off"}
      </button>
      {on &&
        POS_ORDER.map((pos) => (
          <span
            key={pos}
            className={`rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-extrabold capitalize shadow-sm ${POS_COLOR[pos]} dark:bg-zinc-800/85`}
          >
            {POS_SHORT[pos]}
          </span>
        ))}
    </div>
  );
}
