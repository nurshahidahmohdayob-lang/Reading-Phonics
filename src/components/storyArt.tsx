/* The pictures in the interactive stories (components/InteractiveStory):
   every character and prop drawn as a storybook illustration in SVG, so the
   stories never fall back on emoji. Each drawing stands on the bottom edge
   of its box (the feet, wheels or base touch y = the box's height), faces
   right, and is drawn in a flat cartoon style with a dark outline. */

import type { ReactNode } from "react";

const INK = "#3b2a2f";
const SKIN = "#f6c9a0";
const line = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** A drawing: its box (width × height) and what's in it. */
type Art = { w: number; h: number; draw: ReactNode };

const eye = (x: number, y: number, r = 2.6) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={INK} />
    <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.35} fill="#fff" />
  </g>
);
const shut = (x: number, y: number, w = 4) => <path d={`M${x - w / 2} ${y} q${w / 2} ${w / 2.2} ${w} 0`} fill="none" {...line} strokeWidth={1.8} />;
const cheek = (x: number, y: number, r = 3) => <circle cx={x} cy={y} r={r} fill="#ff8fa3" opacity={0.6} />;
const coins = (pts: [number, number][]) =>
  pts.map(([x, y], i) => (
    <g key={i}>
      <ellipse cx={x} cy={y} rx={6} ry={3.2} fill="#f5c542" {...line} strokeWidth={1.6} />
      <ellipse cx={x} cy={y - 0.6} rx={3.4} ry={1.4} fill="#ffe27a" />
    </g>
  ));
const crown = (x: number, y: number, s = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-14 8 L-12 -8 L-6 0 L0 -11 L6 0 L12 -8 L14 8 Z" fill="#f5c542" {...line} />
    <circle cx={0} cy={2} r={2.2} fill="#e8433a" />
    <circle cx={-8} cy={3} r={1.6} fill="#3a7be8" />
    <circle cx={8} cy={3} r={1.6} fill="#3a7be8" />
  </g>
);

export const ART = {
  hen: {
    w: 100,
    h: 100,
    draw: (
      <g>
        <path d="M44 84 L42 97 M56 84 L58 97 M38 98 L46 98 M54 98 L62 98" stroke="#f08a24" strokeWidth={3.4} strokeLinecap="round" />
        <path d="M24 56 Q6 44 14 26 Q22 38 30 40 Q22 30 28 20 Q36 36 38 44 Z" fill="#fff" {...line} />
        <ellipse cx={50} cy={64} rx={30} ry={23} fill="#fff" {...line} />
        <path d="M36 62 Q50 48 66 60 Q54 78 36 62 Z" fill="#efe7da" {...line} strokeWidth={1.8} />
        <circle cx={70} cy={38} r={14} fill="#fff" {...line} />
        <path d="M60 28 Q60 16 67 22 Q69 12 75 20 Q81 14 81 26 Z" fill="#e8433a" {...line} />
        <ellipse cx={80} cy={51} rx={3.5} ry={5.5} fill="#e8433a" {...line} strokeWidth={1.6} />
        <path d="M82 36 L94 41 L82 46 Z" fill="#f5b72a" {...line} />
        {eye(73, 35)}
        {cheek(74, 44, 2.6)}
      </g>
    ),
  },
  fox: {
    w: 100,
    h: 100,
    draw: (
      <g>
        <path d="M24 70 Q2 64 6 38 Q20 48 32 60 Z" fill="#e8742a" {...line} />
        <path d="M6 38 Q3 46 6 53 Q12 46 15 45 Z" fill="#fff" {...line} strokeWidth={1.6} />
        {[28, 40, 58, 68].map((x) => (
          <g key={x}>
            <rect x={x} y={76} width={7} height={22} rx={3} fill="#e8742a" {...line} />
            <rect x={x} y={90} width={7} height={8} rx={3} fill="#4a3030" />
          </g>
        ))}
        <ellipse cx={48} cy={70} rx={28} ry={15} fill="#e8742a" {...line} />
        <ellipse cx={70} cy={72} rx={8} ry={10} fill="#fff4e6" />
        <path d="M62 30 L66 14 L74 28 Z M76 30 L84 14 L86 32 Z" fill="#e8742a" {...line} />
        <path d="M66 26 L67 19 L71 26 Z M79 28 L83 20 L83 29 Z" fill="#4a3030" />
        <path d="M58 46 Q62 28 78 30 Q94 34 97 46 Q86 58 66 58 Z" fill="#e8742a" {...line} />
        <path d="M80 46 Q90 44 97 46 Q90 55 80 53 Z" fill="#fff4e6" />
        <circle cx={97} cy={46} r={2.6} fill={INK} />
        <path d="M74 40 q3 -2.5 6 0" fill="none" {...line} strokeWidth={1.8} />
        <circle cx={77.5} cy={41.2} r={1.5} fill={INK} />
        <path d="M84 53 q-4 2 -7 -1" fill="none" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
  knight: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <rect x={27} y={76} width={10} height={22} rx={3} fill="#a9b3c2" {...line} />
        <rect x={43} y={76} width={10} height={22} rx={3} fill="#a9b3c2" {...line} />
        <path d="M25 98 h13 M42 98 h13" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <rect x={8} y={50} width={12} height={26} rx={6} fill="#c3ccd8" {...line} />
        <path d="M18 48 Q40 38 62 48 L60 80 L20 80 Z" fill="#c3ccd8" {...line} />
        <rect x={20} y={69} width={40} height={5} fill="#8a5a2b" />
        <circle cx={40} cy={58} r={5} fill="#3a7be8" {...line} strokeWidth={1.6} />
        <path d="M58 54 L76 54 L76 68 Q67 80 58 68 Z" fill="#3a7be8" {...line} />
        <path d="M67 56 V74 M60 63 H74" stroke="#f5c542" strokeWidth={2.5} />
        <path d="M40 12 Q46 -2 60 4 Q50 6 47 15 Z" fill="#e8433a" {...line} />
        <rect x={21} y={10} width={38} height={36} rx={17} fill="#c3ccd8" {...line} />
        <rect x={27} y={21} width={26} height={17} rx={6} fill={SKIN} {...line} strokeWidth={1.8} />
        {shut(34, 28)}
        {shut(46, 28)}
        <ellipse cx={40} cy={34} rx={2} ry={1.6} fill={INK} />
        {cheek(31, 32, 2)}
        {cheek(49, 32, 2)}
      </g>
    ),
  },
  knightBed: {
    w: 160,
    h: 100,
    draw: (
      <g>
        <rect x={10} y={84} width={8} height={14} fill="#7a4a24" {...line} />
        <rect x={142} y={84} width={8} height={14} fill="#7a4a24" {...line} />
        <rect x={6} y={30} width={16} height={60} rx={6} fill="#9a5f2e" {...line} />
        <rect x={138} y={50} width={16} height={40} rx={6} fill="#9a5f2e" {...line} />
        <rect x={16} y={64} width={128} height={22} rx={4} fill="#f4efe6" {...line} />
        <ellipse cx={38} cy={60} rx={17} ry={9} fill="#fff" {...line} />
        <path d="M30 40 Q36 26 50 30 Q44 33 42 39 Z" fill="#e8433a" {...line} strokeWidth={1.8} />
        <circle cx={40} cy={50} r={14} fill="#c3ccd8" {...line} />
        <rect x={40} y={43} width={13} height={13} rx={5} fill={SKIN} {...line} strokeWidth={1.6} />
        {shut(47, 48, 3.5)}
        <ellipse cx={48} cy={53} rx={1.6} ry={1.2} fill={INK} />
        <path d="M50 66 Q92 40 144 60 L144 84 L50 84 Z" fill="#3a7be8" {...line} />
        <path d="M70 58 Q84 52 98 52 M66 70 Q100 60 140 70 M62 80 H140" stroke="#8fb8ff" strokeWidth={3} fill="none" />
      </g>
    ),
  },
  king: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <path d="M14 96 L22 46 Q40 38 58 46 L66 96 Z" fill="#7b3fc4" {...line} />
        <rect x={35} y={46} width={10} height={50} fill="#fff" />
        <rect x={14} y={90} width={52} height={7} rx={2} fill="#fff" {...line} strokeWidth={1.6} />
        {[20, 30, 50, 60, 40].map((x) => <circle key={x} cx={x} cy={93.5} r={1.1} fill={INK} />)}
        <circle cx={40} cy={60} r={1.1} fill={INK} />
        <circle cx={40} cy={74} r={1.1} fill={INK} />
        <path d="M22 50 Q10 62 14 74" stroke="#7b3fc4" strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d="M58 50 Q70 62 66 74" stroke="#7b3fc4" strokeWidth={9} strokeLinecap="round" fill="none" />
        <circle cx={14} cy={76} r={4} fill={SKIN} {...line} strokeWidth={1.6} />
        <circle cx={66} cy={76} r={4} fill={SKIN} {...line} strokeWidth={1.6} />
        <circle cx={40} cy={30} r={14} fill={SKIN} {...line} />
        <path d="M27 31 Q28 52 40 54 Q52 52 53 31 Q47 39 40 38 Q33 39 27 31 Z" fill="#eee" {...line} strokeWidth={1.8} />
        <path d="M33 37 Q40 33 47 37" fill="none" stroke="#ddd" strokeWidth={3} />
        {eye(35, 27, 2.2)}
        {eye(45, 27, 2.2)}
        {crown(40, 14, 0.95)}
      </g>
    ),
  },
  dragon: {
    w: 140,
    h: 100,
    draw: (
      <g>
        <path d="M76 44 Q74 4 112 6 Q100 18 116 22 Q104 30 112 42 Z" fill="#2a8f3a" {...line} />
        <path d="M98 64 Q126 66 132 46 L138 56 L131 52 Q124 76 96 70 Z" fill="#3bb54a" {...line} />
        <ellipse cx={74} cy={60} rx={30} ry={18} fill="#3bb54a" {...line} />
        <ellipse cx={70} cy={67} rx={22} ry={9} fill="#f6d365" />
        {[62, 74, 86].map((x) => <path key={x} d={`M${x - 5} 44 L${x} 34 L${x + 5} 44 Z`} fill="#f6d365" {...line} strokeWidth={1.8} />)}
        <path d="M62 78 l-3 12 l7 -4 M84 78 l1 12 l6 -6" fill="#3bb54a" {...line} />
        <path d="M58 50 Q44 36 36 40 L46 60 Z" fill="#3bb54a" {...line} />
        <path d="M54 40 Q48 2 84 10 Q74 22 86 30 Q70 34 72 46 Z" fill="#46c957" {...line} />
        <ellipse cx={32} cy={40} rx={18} ry={14} fill="#3bb54a" {...line} />
        <path d="M30 28 L34 16 L40 28 Z M40 30 L48 20 L48 32 Z" fill="#f6d365" {...line} strokeWidth={1.8} />
        <ellipse cx={16} cy={46} rx={11} ry={7.5} fill="#3bb54a" {...line} />
        <circle cx={10} cy={44} r={1.4} fill={INK} />
        <circle cx={15} cy={43} r={1.4} fill={INK} />
        <ellipse cx={32} cy={36} rx={5} ry={5.5} fill="#fff" {...line} strokeWidth={1.6} />
        <circle cx={30} cy={37} r={2.6} fill={INK} />
        <path d="M24 30 L36 32" {...line} strokeWidth={2.4} />
        <path d="M10 52 Q18 56 26 51" fill="none" {...line} strokeWidth={1.8} />
        <path d="M14 52 l2 4 l2 -3.5 M20 53 l2 3.5 l1.5 -4" fill="#fff" stroke={INK} strokeWidth={1} />
      </g>
    ),
  },
  fizz: {
    w: 100,
    h: 100,
    draw: (
      <g>
        <path d="M30 84 Q6 88 8 70 Q10 60 18 64 Q14 72 22 76 Z" fill="#b57be6" {...line} />
        <path d="M28 46 Q12 30 22 22 Q28 34 38 40 Z" fill="#f59fcf" {...line} />
        <ellipse cx={46} cy={70} rx={25} ry={27} fill="#b57be6" {...line} />
        <ellipse cx={50} cy={76} rx={15} ry={18} fill="#e7d0fb" />
        {[62, 70, 78, 86].map((y) => <path key={y} d={`M38 ${y} Q50 ${y + 3} 62 ${y}`} stroke="#c9a6ef" strokeWidth={1.4} fill="none" />)}
        <ellipse cx={34} cy={96} rx={10} ry={4} fill="#9d5fd6" {...line} />
        <ellipse cx={60} cy={96} rx={10} ry={4} fill="#9d5fd6" {...line} />
        <path d="M44 22 L46 8 L54 20 Z M60 20 L66 8 L68 22 Z" fill="#ffd36e" {...line} strokeWidth={1.8} />
        <circle cx={56} cy={34} r={20} fill="#b57be6" {...line} />
        <ellipse cx={72} cy={42} rx={11} ry={8.5} fill="#c99bf0" {...line} />
        <circle cx={76} cy={40} r={1.3} fill={INK} />
        <circle cx={80} cy={41} r={1.3} fill={INK} />
        <ellipse cx={54} cy={31} rx={5.5} ry={6.5} fill="#fff" {...line} strokeWidth={1.6} />
        <ellipse cx={66} cy={31} rx={5} ry={6} fill="#fff" {...line} strokeWidth={1.6} />
        <circle cx={55} cy={34} r={2.8} fill={INK} />
        <circle cx={66} cy={34} r={2.6} fill={INK} />
        <circle cx={54} cy={32.6} r={0.9} fill="#fff" />
        <path d="M49 23 Q54 21 58 24 M62 24 Q66 21 70 23" fill="none" {...line} strokeWidth={1.6} />
        {cheek(48, 41, 4.5)}
        {cheek(70, 49, 3.5)}
        <path d="M68 48 q3 2 6 0" fill="none" {...line} strokeWidth={1.6} />
        <path d="M58 60 Q64 52 70 50 M40 60 Q36 52 44 50" stroke="#b57be6" strokeWidth={8} strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  tomas: {
    w: 70,
    h: 100,
    draw: (
      <g>
        <rect x={22} y={74} width={10} height={22} rx={3} fill="#2d5aa8" {...line} />
        <rect x={38} y={74} width={10} height={22} rx={3} fill="#2d5aa8" {...line} />
        <path d="M18 97 h15 M37 97 h15" stroke="#6b4226" strokeWidth={5} strokeLinecap="round" />
        <path d="M14 46 Q35 38 56 46 L58 80 L12 80 Z" fill="#e8433a" {...line} />
        <path d="M35 46 V80" stroke={INK} strokeWidth={1.4} />
        {[56, 64, 72].map((y) => <circle key={y} cx={38.5} cy={y} r={1.2} fill={INK} />)}
        <path d="M16 52 Q30 66 48 58" stroke="#e8433a" strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d="M54 52 Q42 68 24 60" stroke="#d53a31" strokeWidth={9} strokeLinecap="round" fill="none" />
        <rect x={20} y={40} width={30} height={8} rx={4} fill="#f5c542" {...line} strokeWidth={1.8} />
        <path d="M26 40 v8 M33 40 v8 M40 40 v8" stroke="#3bb54a" strokeWidth={2.4} />
        <rect x={42} y={44} width={7} height={16} rx={3} fill="#f5c542" {...line} strokeWidth={1.6} />
        <circle cx={35} cy={28} r={14} fill="#d9a066" {...line} />
        <path d="M20 26 Q35 0 50 26 Z" fill="#3a7be8" {...line} />
        <rect x={19} y={22} width={32} height={6} rx={3} fill="#fff" {...line} strokeWidth={1.6} />
        <circle cx={35} cy={8} r={5} fill="#fff" {...line} strokeWidth={1.6} />
        {eye(30, 32, 2.2)}
        {eye(40, 32, 2.2)}
        {cheek(26, 37, 2.6)}
        {cheek(44, 37, 2.6)}
        <path d="M31 39 l2 -1.5 l2 1.5 l2 -1.5 l2 1.5" fill="none" {...line} strokeWidth={1.4} />
      </g>
    ),
  },
  gran: {
    w: 70,
    h: 100,
    draw: (
      <g>
        <path d="M26 80 v16 M44 80 v16" stroke="#d8b49a" strokeWidth={5} />
        <path d="M20 97 h11 M39 97 h11" stroke="#5b3a68" strokeWidth={5} strokeLinecap="round" />
        <path d="M18 60 L52 60 L58 84 L12 84 Z" fill="#7b3fc4" {...line} />
        <path d="M20 44 Q35 38 50 44 L52 62 L18 62 Z" fill="#ec7fb0" {...line} />
        <path d="M20 48 Q8 36 10 22" stroke="#ec7fb0" strokeWidth={8} strokeLinecap="round" fill="none" />
        <path d="M50 48 Q62 36 60 22" stroke="#ec7fb0" strokeWidth={8} strokeLinecap="round" fill="none" />
        <circle cx={10} cy={19} r={4} fill={SKIN} {...line} strokeWidth={1.6} />
        <circle cx={60} cy={19} r={4} fill={SKIN} {...line} strokeWidth={1.6} />
        <circle cx={35} cy={14} r={7} fill="#d7d7dd" {...line} />
        <circle cx={35} cy={30} r={13} fill={SKIN} {...line} />
        <path d="M22 28 Q24 14 35 16 Q46 14 48 28 Q42 20 35 21 Q28 20 22 28 Z" fill="#d7d7dd" {...line} strokeWidth={1.8} />
        <circle cx={30} cy={30} r={4} fill="#fff" fillOpacity={0.4} {...line} strokeWidth={1.4} />
        <circle cx={40} cy={30} r={4} fill="#fff" fillOpacity={0.4} {...line} strokeWidth={1.4} />
        <path d="M34 30 h2" {...line} strokeWidth={1.4} />
        <circle cx={30} cy={30} r={1.4} fill={INK} />
        <circle cx={40} cy={30} r={1.4} fill={INK} />
        <ellipse cx={35} cy={38} rx={2.6} ry={3} fill="#7a2a3a" {...line} strokeWidth={1.4} />
        {cheek(26, 36, 2.4)}
        {cheek(44, 36, 2.4)}
      </g>
    ),
  },
  villager: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <path d="M34 66 L22 84 L14 96 M40 66 L52 82 L62 92" stroke="#6b4a2b" strokeWidth={8} strokeLinecap="round" fill="none" />
        <path d="M10 97 h9 M58 93 l8 -2" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d="M30 42 L22 56 L10 52" stroke="#2f9e8f" strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d="M28 38 Q42 34 50 40 L44 70 L28 68 Z" fill="#2f9e8f" {...line} />
        <path d="M46 44 L58 54 L66 46" stroke="#2f9e8f" strokeWidth={7} strokeLinecap="round" fill="none" />
        <circle cx={44} cy={24} r={12} fill="#c98a5a" {...line} />
        <path d="M30 20 Q44 2 58 18 Z" fill="#8a5a2b" {...line} />
        <path d="M26 20 h36" {...line} strokeWidth={3} />
        <circle cx={49} cy={24} r={3} fill="#fff" {...line} strokeWidth={1.4} />
        <circle cx={50} cy={24.5} r={1.5} fill={INK} />
        <ellipse cx={52} cy={31} rx={2.4} ry={2.8} fill="#7a2a3a" {...line} strokeWidth={1.2} />
      </g>
    ),
  },
  van: {
    w: 160,
    h: 100,
    draw: (
      <g>
        <path d="M8 40 Q8 26 22 26 L112 26 Q122 26 128 36 L146 54 Q152 58 152 66 L152 82 L8 82 Z" fill="#e8433a" {...line} />
        <path d="M114 34 L126 34 L140 54 L114 54 Z" fill="#bfe6ff" {...line} />
        {[20, 50, 80].map((x) => (
          <g key={x}>
            <rect x={x} y={34} width={24} height={20} rx={4} fill="#bfe6ff" {...line} />
            <circle cx={x + 12} cy={48} r={6} fill="#fff" {...line} strokeWidth={1.6} />
            <path d={`M${x + 8} 42 q1 -5 4 -2 q2 -4 4 1`} fill="#e8433a" {...line} strokeWidth={1.4} />
            <path d={`M${x + 17} 47 l4 1.5 l-4 1.5 z`} fill="#f5b72a" />
            <circle cx={x + 14} cy={46.5} r={1.1} fill={INK} />
          </g>
        ))}
        <rect x={4} y={74} width={152} height={8} rx={4} fill="#c7c7c7" {...line} />
        <circle cx={148} cy={64} r={4} fill="#ffe27a" {...line} strokeWidth={1.6} />
        <path d="M8 62 H150" stroke="#fff" strokeWidth={3} opacity={0.7} />
        {[40, 120].map((x) => (
          <g key={x}>
            <circle cx={x} cy={84} r={13} fill="#333" {...line} />
            <circle cx={x} cy={84} r={5} fill="#bbb" />
          </g>
        ))}
      </g>
    ),
  },
  sun: {
    w: 100,
    h: 100,
    draw: (
      <g>
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M50 6 L55 20 L45 20 Z" fill="#ffb627" transform={`rotate(${i * 30} 50 50)`} />
        ))}
        <circle cx={50} cy={50} r={27} fill="#ffd23a" {...line} />
        {eye(41, 46, 2.6)}
        {eye(59, 46, 2.6)}
        {cheek(36, 55)}
        {cheek(64, 55)}
        <path d="M42 58 Q50 66 58 58" fill="none" {...line} />
      </g>
    ),
  },
  moon: {
    w: 100,
    h: 100,
    draw: (
      <g>
        <path d="M60 10 A40 40 0 1 0 90 74 A32 32 0 1 1 60 10 Z" fill="#fff2b0" {...line} />
        {shut(42, 50, 6)}
        {cheek(40, 58, 3)}
        <path d="M44 64 q4 3 8 0" fill="none" {...line} strokeWidth={1.8} />
      </g>
    ),
  },
  cloud: {
    w: 120,
    h: 70,
    draw: (
      <path
        d="M24 66 Q6 66 8 50 Q10 36 26 38 Q28 18 50 20 Q62 6 80 16 Q98 12 102 30 Q118 32 116 48 Q114 66 96 66 Z"
        fill="#fff"
        stroke="#cfe0ee"
        strokeWidth={2.5}
      />
    ),
  },
  tree: {
    w: 90,
    h: 110,
    draw: (
      <g>
        <path d="M40 110 L42 66 Q45 60 48 66 L50 110 Z" fill="#8a5a2b" {...line} />
        <circle cx={45} cy={42} r={26} fill="#3fae4a" {...line} />
        <circle cx={24} cy={56} r={18} fill="#3fae4a" {...line} />
        <circle cx={66} cy={56} r={18} fill="#3fae4a" {...line} />
        <circle cx={45} cy={62} r={16} fill="#3fae4a" />
        <circle cx={36} cy={32} r={7} fill="#6fd06f" />
        <circle cx={58} cy={48} r={2.5} fill="#e8433a" />
        <circle cx={30} cy={56} r={2.5} fill="#e8433a" />
      </g>
    ),
  },
  snowflake: {
    w: 60,
    h: 60,
    draw: (
      <g stroke="#fff" strokeWidth={3.4} strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 1.5px #8fb8d8)" }}>
        {[0, 60, 120].map((r) => (
          <g key={r} transform={`rotate(${r} 30 30)`}>
            <path d="M30 6 V54" />
            <path d="M24 12 L30 18 L36 12 M24 48 L30 42 L36 48" />
          </g>
        ))}
      </g>
    ),
  },
  puff: {
    w: 80,
    h: 60,
    draw: (
      <g fill="#e6e9ef" stroke="#b9c0cc" strokeWidth={2}>
        <circle cx={22} cy={40} r={14} />
        <circle cx={40} cy={30} r={18} />
        <circle cx={60} cy={40} r={14} />
        <circle cx={40} cy={44} r={14} stroke="none" />
      </g>
    ),
  },
  smoke: {
    w: 60,
    h: 110,
    draw: (
      <g fill="#c9ccd4" stroke="#9aa0ad" strokeWidth={2}>
        <circle cx={30} cy={96} r={12} />
        <circle cx={36} cy={76} r={14} />
        <circle cx={26} cy={54} r={15} />
        <circle cx={34} cy={30} r={16} />
        <circle cx={28} cy={12} r={11} />
      </g>
    ),
  },
  goldSack: {
    w: 100,
    h: 100,
    draw: (
      <g>
        <path d="M30 48 Q18 70 24 92 Q50 100 76 92 Q82 70 70 48 Z" fill="#b07a3a" {...line} />
        <path d="M34 48 Q50 40 66 48 L60 38 Q50 34 40 38 Z" fill="#9a6a30" {...line} />
        <path d="M36 46 Q50 52 64 46" stroke="#f5c542" strokeWidth={3} fill="none" />
        <text x={50} y={80} textAnchor="middle" fontSize={22} fontWeight={900} fill="#f5c542" stroke={INK} strokeWidth={1}>£</text>
        {coins([
          [14, 96],
          [86, 96],
          [92, 90],
          [44, 34],
        ])}
      </g>
    ),
  },
  crown: { w: 40, h: 30, draw: crown(20, 19, 1.3) },
  zzz: {
    w: 90,
    h: 90,
    draw: (
      <g fontWeight={900} fontFamily="Arial Rounded MT Bold, Arial, sans-serif" fill="#7fb2ff" stroke="#fff" strokeWidth={3} paintOrder="stroke">
        <text x={8} y={84} fontSize={34}>Z</text>
        <text x={34} y={58} fontSize={28}>Z</text>
        <text x={58} y={34} fontSize={22}>Z</text>
      </g>
    ),
  },
  medal: {
    w: 60,
    h: 90,
    draw: (
      <g>
        <path d="M14 2 L30 40 L46 2 L36 2 L30 18 L24 2 Z" fill="#3a7be8" {...line} />
        <path d="M22 2 L30 22 L38 2" fill="#e8433a" />
        <circle cx={30} cy={62} r={24} fill="#f5c542" {...line} />
        <circle cx={30} cy={62} r={16} fill="#ffe27a" />
        <path d="M30 50 L33.5 58 L42 58.5 L35.5 64 L37.5 72.5 L30 68 L22.5 72.5 L24.5 64 L18 58.5 L26.5 58 Z" fill="#f0a500" />
      </g>
    ),
  },
  trophy: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <path d="M18 18 Q2 18 6 36 Q10 50 26 52" fill="none" stroke="#e0a520" strokeWidth={6} />
        <path d="M62 18 Q78 18 74 36 Q70 50 54 52" fill="none" stroke="#e0a520" strokeWidth={6} />
        <path d="M16 10 H64 Q64 56 40 62 Q16 56 16 10 Z" fill="#f5c542" {...line} />
        <rect x={34} y={60} width={12} height={16} fill="#e0a520" {...line} />
        <rect x={20} y={76} width={40} height={22} rx={3} fill="#8a5a2b" {...line} />
        <rect x={28} y={82} width={24} height={9} rx={2} fill="#f5c542" />
        <path d="M28 18 Q30 40 38 48" stroke="#fff" strokeWidth={4} opacity={0.6} fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  woodbox: {
    w: 100,
    h: 70,
    draw: (
      <g>
        <path d="M10 20 L90 20 L84 68 L16 68 Z" fill="#b07a3a" {...line} />
        <path d="M13 36 H87 M15 52 H85" stroke="#7a4f22" strokeWidth={2} />
        <path d="M10 20 L90 20 L86 28 L14 28 Z" fill="#4a3020" {...line} />
        <path d="M78 64 l8 -3 l1 5 z" fill="#9a6a30" {...line} strokeWidth={1.4} />
      </g>
    ),
  },
  warmAir: {
    w: 140,
    h: 70,
    draw: (
      <g fill="none" strokeLinecap="round" strokeWidth={6}>
        <path d="M6 20 Q40 4 70 20 T134 18" stroke="#ffb627" />
        <path d="M12 40 Q46 26 76 40 T130 40" stroke="#ff7a3c" />
        <path d="M20 60 Q52 46 82 60 T128 58" stroke="#ffd23a" />
        <circle cx={40} cy={12} r={3} fill="#fff6c2" stroke="none" />
        <circle cx={100} cy={50} r={3} fill="#fff6c2" stroke="none" />
      </g>
    ),
  },
  bunting: {
    w: 160,
    h: 50,
    draw: (
      <g>
        <path d="M2 6 Q80 34 158 6" fill="none" stroke={INK} strokeWidth={2} />
        {[14, 34, 54, 74, 94, 114, 134, 150].map((x, i) => {
          const y = 6 + 28 * (1 - ((x - 80) / 78) ** 2) * 0.62;
          return <path key={x} d={`M${x - 7} ${y} L${x + 7} ${y} L${x} ${y + 16} Z`} fill={["#e8433a", "#f5c542", "#3a7be8", "#3bb54a"][i % 4]} {...line} strokeWidth={1.4} />;
        })}
      </g>
    ),
  },
  pig: {
    w: 110,
    h: 80,
    draw: (
      <g>
        <path d="M14 40 q-10 -4 -6 -12 q4 6 8 2" fill="none" stroke="#e88aa6" strokeWidth={3} strokeLinecap="round" />
        {[26, 40, 62, 76].map((x) => <rect key={x} x={x} y={58} width={9} height={20} rx={3} fill="#f7a8c0" {...line} />)}
        <ellipse cx={50} cy={50} rx={38} ry={22} fill="#f7b3c8" {...line} />
        <path d="M74 22 L78 8 L86 22 Z M90 22 L98 10 L98 26 Z" fill="#f29ab6" {...line} />
        <circle cx={86} cy={38} r={18} fill="#f7b3c8" {...line} />
        <ellipse cx={100} cy={44} rx={9} ry={7} fill="#f08cad" {...line} />
        <circle cx={97} cy={44} r={1.6} fill={INK} />
        <circle cx={103} cy={44} r={1.6} fill={INK} />
        {eye(84, 33, 2.4)}
        {cheek(80, 44, 3)}
        <path d="M88 50 q4 3 8 0" fill="none" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
  duck: {
    w: 80,
    h: 80,
    draw: (
      <g>
        <path d="M34 66 l-4 12 h-6 M46 66 l2 12 h7" fill="none" stroke="#f08a24" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 46 Q4 30 18 34 Q30 38 34 44 Z" fill="#ffd23a" {...line} />
        <ellipse cx={38} cy={52} rx={26} ry={17} fill="#ffd23a" {...line} />
        <path d="M24 50 Q38 40 50 52 Q38 62 24 50 Z" fill="#f5c11e" {...line} strokeWidth={1.6} />
        <circle cx={56} cy={26} r={14} fill="#ffd23a" {...line} />
        <path d="M66 26 Q80 24 78 31 Q72 34 66 32 Z" fill="#f08a24" {...line} />
        {eye(58, 22, 2.4)}
        {cheek(56, 31, 2.6)}
      </g>
    ),
  },
  mud: {
    w: 140,
    h: 40,
    draw: (
      <g>
        <path d="M6 30 Q4 14 30 14 Q50 6 72 12 Q100 6 122 14 Q138 20 134 32 Q120 40 70 38 Q20 40 6 30 Z" fill="#7a4a24" {...line} />
        <ellipse cx={46} cy={24} rx={14} ry={4} fill="#9a6232" />
        <ellipse cx={96} cy={22} rx={10} ry={3} fill="#9a6232" />
        <circle cx={20} cy={8} r={3} fill="#7a4a24" />
        <circle cx={124} cy={6} r={2.5} fill="#7a4a24" />
      </g>
    ),
  },
  tub: {
    w: 140,
    h: 80,
    draw: (
      <g>
        <path d="M24 74 l-4 6 M116 74 l4 6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M8 34 H132 Q130 76 104 76 H36 Q10 76 8 34 Z" fill="#fff" {...line} />
        <rect x={4} y={30} width={132} height={8} rx={4} fill="#dfe9f2" {...line} />
        {[16, 30, 46, 60, 78, 94, 110, 124, 38, 70, 102].map((x, i) => (
          <circle key={i} cx={x} cy={i > 7 ? 18 : 28} r={i > 7 ? 7 : 9} fill="#eaf6ff" stroke="#9cc8e6" strokeWidth={1.6} />
        ))}
      </g>
    ),
  },
  bubbles: {
    w: 80,
    h: 80,
    draw: (
      <g fill="#eaf6ff" fillOpacity={0.6} stroke="#7fb6dc" strokeWidth={2}>
        <circle cx={20} cy={60} r={12} />
        <circle cx={48} cy={40} r={16} />
        <circle cx={66} cy={14} r={9} />
        <circle cx={26} cy={22} r={7} />
        <circle cx={44} cy={36} r={4} fill="#fff" stroke="none" />
      </g>
    ),
  },
  puffin: {
    w: 70,
    h: 100,
    draw: (
      <g>
        <path d="M26 92 l-6 6 h10 M42 92 l4 6 h8" fill="#f08a24" stroke="#f08a24" strokeWidth={3} strokeLinejoin="round" />
        <ellipse cx={34} cy={64} rx={22} ry={30} fill="#26262e" {...line} />
        <ellipse cx={38} cy={68} rx={14} ry={24} fill="#fff" />
        <path d="M14 56 Q4 72 14 84 Q20 70 22 60 Z" fill="#3a3a44" {...line} strokeWidth={1.8} />
        <circle cx={36} cy={26} r={18} fill="#26262e" {...line} />
        <ellipse cx={40} cy={28} rx={12} ry={11} fill="#fff" />
        <path d="M50 20 Q66 22 68 30 Q62 38 50 36 Z" fill="#f05a28" {...line} />
        <path d="M51 24 Q58 25 61 30 M50 30 h12" stroke="#f5b72a" strokeWidth={2} fill="none" />
        <circle cx={42} cy={25} r={3} fill={INK} />
        <circle cx={41} cy={24} r={1} fill="#fff" />
        <path d="M38 21 l3 -1.5 M44 28 l3 1" stroke="#f05a28" strokeWidth={1.2} />
        {cheek(40, 33, 2.4)}
      </g>
    ),
  },
  crab: {
    w: 100,
    h: 70,
    draw: (
      <g>
        {[-1, 1].map((k) => (
          <g key={k}>
            <path d={`M${50 + k * 22} 50 l${k * 14} 10 l${k * 4} 10 M${50 + k * 16} 56 l${k * 10} 12`} fill="none" stroke="#e8503a" strokeWidth={4} strokeLinecap="round" />
            <path d={`M${50 + k * 26} 40 Q${50 + k * 40} 30 ${50 + k * 38} 14`} fill="none" stroke="#e8503a" strokeWidth={5} strokeLinecap="round" />
            <path d={`M${50 + k * 38} 16 q${k * -10} -14 ${k * -2} -14 q${k * 8} 2 ${k * 8} 10 l${k * -6} -2 z`} fill="#f2603e" {...line} />
            <path d={`M${50 + k * 8} 30 v-14`} stroke={INK} strokeWidth={2} />
            <circle cx={50 + k * 8} cy={14} r={5} fill="#fff" {...line} strokeWidth={1.6} />
            <circle cx={50 + k * 8} cy={15} r={2.4} fill={INK} />
          </g>
        ))}
        <ellipse cx={50} cy={46} rx={28} ry={16} fill="#f2603e" {...line} />
        <path d="M42 50 q8 6 16 0" fill="none" {...line} strokeWidth={1.8} />
        {cheek(36, 46, 3)}
        {cheek(64, 46, 3)}
      </g>
    ),
  },
  hat: {
    w: 60,
    h: 40,
    draw: (
      <g>
        <ellipse cx={30} cy={32} rx={28} ry={7} fill="#e8433a" {...line} />
        <path d="M14 32 Q14 8 30 8 Q46 8 46 32 Z" fill="#e8433a" {...line} />
        <path d="M15 26 H45" stroke="#f5c542" strokeWidth={5} />
        <circle cx={42} cy={22} r={3.4} fill="#fff" {...line} strokeWidth={1.2} />
      </g>
    ),
  },
  rock: {
    w: 120,
    h: 50,
    draw: (
      <g>
        <path d="M6 48 Q4 26 26 18 Q44 4 70 10 Q100 10 114 30 Q118 44 112 48 Z" fill="#8d93a0" {...line} />
        <path d="M30 26 Q44 16 60 20 M78 18 Q94 20 102 32" fill="none" stroke="#b6bcc8" strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  },
  waves: {
    w: 160,
    h: 50,
    draw: (
      <g>
        {/* just the crests, curling over the sea (no block under them) */}
        {[0, 40, 80, 120].map((x) => (
          <path key={x} d={`M${x} 44 Q${x + 4} 14 ${x + 22} 12 Q${x + 36} 12 ${x + 38} 26 Q${x + 30} 20 ${x + 26} 28 Q${x + 26} 40 ${x + 40} 44 Z`} fill="#2f95d4" stroke="#1d6aa8" strokeWidth={2} strokeLinejoin="round" />
        ))}
        <path d="M6 22 Q12 13 24 13 M46 22 Q52 13 64 13 M86 22 Q92 13 104 13 M126 22 Q132 13 144 13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  },
  wind: {
    w: 120,
    h: 60,
    draw: (
      <g fill="none" strokeLinecap="round" strokeWidth={5} stroke="#cfe6f5">
        <path d="M4 16 H70 Q86 16 84 6 Q80 0 74 6" />
        <path d="M14 32 H104 Q118 32 116 20 Q112 12 104 18" />
        <path d="M4 48 H62 Q76 48 74 58" />
      </g>
    ),
  },
  robot: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <rect x={24} y={78} width={10} height={16} fill="#9aa6b8" {...line} />
        <rect x={46} y={78} width={10} height={16} fill="#9aa6b8" {...line} />
        <rect x={18} y={92} width={20} height={7} rx={3} fill="#5b6b82" {...line} />
        <rect x={42} y={92} width={20} height={7} rx={3} fill="#5b6b82" {...line} />
        <path d="M14 52 Q4 60 8 72" stroke="#9aa6b8" strokeWidth={6} strokeLinecap="round" fill="none" />
        <path d="M66 52 Q76 44 74 34" stroke="#9aa6b8" strokeWidth={6} strokeLinecap="round" fill="none" />
        <circle cx={8} cy={74} r={4.5} fill="#5b6b82" {...line} strokeWidth={1.6} />
        <circle cx={74} cy={32} r={4.5} fill="#5b6b82" {...line} strokeWidth={1.6} />
        <rect x={14} y={44} width={52} height={38} rx={8} fill="#5ec8d8" {...line} />
        <circle cx={30} cy={60} r={4} fill="#ffd23a" {...line} strokeWidth={1.4} />
        <circle cx={42} cy={60} r={4} fill="#e8433a" {...line} strokeWidth={1.4} />
        <rect x={26} y={68} width={28} height={6} rx={3} fill="#2f8fa0" />
        <path d="M40 14 V4" {...line} />
        <circle cx={40} cy={4} r={3.4} fill="#e8433a" {...line} strokeWidth={1.4} />
        <rect x={16} y={14} width={48} height={30} rx={9} fill="#9aa6b8" {...line} />
        <rect x={22} y={19} width={36} height={20} rx={6} fill="#1e2a40" />
        <rect x={28} y={24} width={7} height={8} rx={3} fill="#7cf0ff" />
        <rect x={45} y={24} width={7} height={8} rx={3} fill="#7cf0ff" />
        <path d="M33 35 q7 3 14 0" fill="none" stroke="#7cf0ff" strokeWidth={1.8} strokeLinecap="round" />
      </g>
    ),
  },
  maya: {
    w: 70,
    h: 100,
    draw: (
      <g>
        <path d="M27 80 v14 M43 80 v14" stroke="#8a5a3a" strokeWidth={5} />
        <path d="M20 97 h12 M38 97 h12" stroke="#e8433a" strokeWidth={5} strokeLinecap="round" />
        <path d="M22 44 Q35 38 48 44 L58 84 L12 84 Z" fill="#ffc93c" {...line} />
        <path d="M22 50 Q10 58 12 70 M48 50 Q60 58 58 70" stroke="#8a5a3a" strokeWidth={6} strokeLinecap="round" fill="none" />
        <path d="M14 66 h48" stroke="#f08a24" strokeWidth={2} strokeDasharray="4 4" />
        <circle cx={16} cy={20} r={8} fill="#3a2418" {...line} />
        <circle cx={54} cy={20} r={8} fill="#3a2418" {...line} />
        <circle cx={35} cy={28} r={14} fill="#a8703f" {...line} />
        <path d="M21 26 Q22 12 35 13 Q48 12 49 26 Q42 18 35 19 Q28 18 21 26 Z" fill="#3a2418" />
        <path d="M46 14 l6 -4 l-1 7 z" fill="#e8433a" />
        {eye(30, 29, 2.2)}
        {eye(40, 29, 2.2)}
        {cheek(26, 34, 2.6)}
        {cheek(44, 34, 2.6)}
        <path d="M30 35 q5 4 10 0" fill="none" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
  radio: {
    w: 100,
    h: 70,
    draw: (
      <g>
        <path d="M70 20 L86 2" {...line} strokeWidth={2.6} />
        <rect x={6} y={18} width={88} height={50} rx={10} fill="#3aa79a" {...line} />
        <circle cx={34} cy={44} r={15} fill="#2a6f67" {...line} />
        {[-8, -3, 2, 7].map((d) => <path key={d} d={`M${26} ${44 + d} h16`} stroke="#9fe0d6" strokeWidth={1.6} />)}
        <rect x={56} y={30} width={28} height={10} rx={3} fill="#fff6c2" {...line} strokeWidth={1.6} />
        <circle cx={62} cy={54} r={5} fill="#f5c542" {...line} strokeWidth={1.6} />
        <circle cx={78} cy={54} r={5} fill="#f5c542" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
  notes: {
    w: 80,
    h: 80,
    draw: (
      <g>
        <path d="M14 66 V30 L38 24 V58" fill="none" stroke="#7b3fc4" strokeWidth={3.4} />
        <ellipse cx={10} cy={66} rx={7} ry={5} fill="#7b3fc4" />
        <ellipse cx={34} cy={58} rx={7} ry={5} fill="#7b3fc4" />
        <path d="M14 34 L38 28" stroke="#7b3fc4" strokeWidth={5} />
        <path d="M60 46 V12 Q66 18 72 20" fill="none" stroke="#e8433a" strokeWidth={3.4} strokeLinecap="round" />
        <ellipse cx={56} cy={46} rx={7} ry={5} fill="#e8433a" />
      </g>
    ),
  },
  leo: {
    w: 70,
    h: 100,
    draw: (
      <g>
        <rect x={22} y={72} width={11} height={22} rx={3} fill="#7fb2ff" {...line} />
        <rect x={37} y={72} width={11} height={22} rx={3} fill="#7fb2ff" {...line} />
        <path d="M18 96 h16 M36 96 h16" stroke="#a0522d" strokeWidth={6} strokeLinecap="round" />
        <path d="M14 44 Q35 38 56 44 L56 76 L14 76 Z" fill="#7fb2ff" {...line} />
        {[50, 58, 66].map((y) => <path key={y} d={`M15 ${y} H55`} stroke="#fff" strokeWidth={3} />)}
        <path d="M16 48 Q6 60 10 72 M54 48 Q64 60 60 72" stroke="#7fb2ff" strokeWidth={8} strokeLinecap="round" fill="none" />
        <circle cx={35} cy={28} r={14} fill={SKIN} {...line} />
        <path d="M21 26 Q20 10 32 12 Q36 6 42 12 Q52 12 49 26 Q46 18 40 20 Q34 15 30 20 Q24 18 21 26 Z" fill="#c26a2a" {...line} strokeWidth={1.6} />
        {eye(30, 29, 2.2)}
        {eye(40, 29, 2.2)}
        {cheek(26, 34, 2.6)}
        {cheek(44, 34, 2.6)}
        <ellipse cx={35} cy={36} rx={2.4} ry={2} fill="#7a2a3a" />
      </g>
    ),
  },
  owl: {
    w: 80,
    h: 100,
    draw: (
      <g>
        <path d="M28 96 l-4 4 M32 96 v4 M48 96 v4 M52 96 l4 4" stroke="#f08a24" strokeWidth={3} strokeLinecap="round" />
        <path d="M18 30 L14 10 L30 22 Z M62 30 L66 10 L50 22 Z" fill="#8a5a2b" {...line} />
        <ellipse cx={40} cy={60} rx={28} ry={38} fill="#a8703a" {...line} />
        <ellipse cx={40} cy={70} rx={17} ry={24} fill="#f2d9a6" />
        {[60, 68, 76, 84].map((y) => <path key={y} d={`M32 ${y} q4 3 8 0 q4 3 8 0`} fill="none" stroke="#c99a5a" strokeWidth={1.6} />)}
        <path d="M12 52 Q4 72 16 90 Q22 70 20 56 Z M68 52 Q76 72 64 90 Q58 70 60 56 Z" fill="#8a5a2b" {...line} />
        <circle cx={28} cy={38} r={12} fill="#fff" {...line} />
        <circle cx={52} cy={38} r={12} fill="#fff" {...line} />
        <circle cx={28} cy={39} r={5.5} fill={INK} />
        <circle cx={52} cy={39} r={5.5} fill={INK} />
        <circle cx={26.5} cy={37} r={1.8} fill="#fff" />
        <circle cx={50.5} cy={37} r={1.8} fill="#fff" />
        <path d="M36 46 L40 54 L44 46 Z" fill="#f5b72a" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
  star: {
    w: 80,
    h: 80,
    draw: (
      <g>
        <circle cx={40} cy={42} r={34} fill="#ffe46a" opacity={0.3} />
        <path d="M40 6 L49 30 L74 31 L54 46 L61 71 L40 56 L19 71 L26 46 L6 31 L31 30 Z" fill="#ffd23a" {...line} />
        {shut(34, 40, 5)}
        {shut(46, 40, 5)}
        {cheek(30, 47, 3)}
        {cheek(50, 47, 3)}
        <path d="M37 50 q3 3 6 0" fill="none" {...line} strokeWidth={1.6} />
      </g>
    ),
  },
} satisfies Record<string, Art>;

export type ArtId = keyof typeof ART;

/** A drawing as an SVG that fills its box's width. */
export function StoryArt({ id, className }: { id: ArtId; className?: string }) {
  const a: Art = ART[id];
  return (
    <svg viewBox={`0 0 ${a.w} ${a.h}`} className={className} style={{ aspectRatio: `${a.w} / ${a.h}`, overflow: "visible" }} aria-hidden>
      {a.draw}
    </svg>
  );
}
