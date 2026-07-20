"use client";

import { useEffect, useRef } from "react";
import { LETTER_STROKES } from "@/app/letterStrokes";

const INK = "#8559d6";

/**
 * Traces a letter the way it is written: a pen dot follows each stroke in
 * order, drawing the line behind it, over a faint target letter. Remount (via a
 * `key` on the parent) to replay. Falls back to a plain letter if we have no
 * stroke data for the glyph.
 */
export default function LetterTrace({
  glyph,
  size,
}: {
  glyph: string;
  size: number;
}) {
  const strokes = LETTER_STROKES[glyph] ?? [];
  const pathEls = useRef<(SVGPathElement | null)[]>([]);
  const penRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const paths = pathEls.current.filter((p): p is SVGPathElement => !!p);
    const pen = penRef.current;
    if (!paths.length || !pen) return;

    const lens = paths.map((p) => p.getTotalLength());
    paths.forEach((p, i) => {
      p.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
      p.style.strokeDashoffset = `${lens[i]}`;
    });

    const GAP = 260; // pause between strokes (ms)
    const MS_PER_PX = 5.5; // pen speed
    const MIN = 420; // shortest stroke time
    const durs = lens.map((l) => Math.max(MIN, l * MS_PER_PX));
    const starts: number[] = [];
    let acc = 0;
    durs.forEach((d, i) => {
      starts[i] = acc;
      acc += d + GAP;
    });
    const totalT = acc;

    pen.style.opacity = "0";
    let raf = 0;
    let startT: number | null = null;

    const frame = (t: number) => {
      if (startT === null) startT = t;
      const el = t - startT;
      let penPlaced = false;
      for (let i = 0; i < paths.length; i++) {
        const s = starts[i];
        const d = durs[i];
        const prog = el >= s + d ? 1 : el <= s ? 0 : (el - s) / d;
        paths[i].style.strokeDashoffset = `${lens[i] * (1 - prog)}`;
        if (prog > 0 && prog < 1 && !penPlaced) {
          const pt = paths[i].getPointAtLength(lens[i] * prog);
          pen.setAttribute("transform", `translate(${pt.x},${pt.y})`);
          pen.style.opacity = "1";
          penPlaced = true;
        }
      }
      if (el < totalT) raf = requestAnimationFrame(frame);
      else pen.style.opacity = "0";
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // No stroke data — just show the letter so nothing breaks.
  if (!strokes.length) {
    return (
      <svg viewBox="0 0 300 300" width={size} height={size} style={{ maxWidth: "90vw" }}>
        <text
          x="150"
          y="150"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={210}
          fontWeight={900}
          fill={INK}
        >
          {glyph}
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 300" width={size} height={size} style={{ maxWidth: "90vw" }}>
      {/* guide lines */}
      <line x1="0" y1="120" x2="300" y2="120" stroke="#e3ddf6" strokeWidth="1.5" strokeDasharray="4 7" />
      <line x1="0" y1="230" x2="300" y2="230" stroke="#c9bdee" strokeWidth="2" />
      {/* faint target letter */}
      {strokes.map((d, i) => (
        <path
          key={`t${i}`}
          d={d}
          fill="none"
          stroke="#ece7fb"
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* ink strokes, revealed as the pen moves */}
      {strokes.map((d, i) => (
        <path
          key={`i${i}`}
          ref={(el) => {
            pathEls.current[i] = el;
          }}
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={13}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* the pen */}
      <g ref={penRef} style={{ opacity: 0 }}>
        <circle r="9" fill={INK} />
        <text x="7" y="-9" fontSize="28">✏️</text>
      </g>
    </svg>
  );
}
