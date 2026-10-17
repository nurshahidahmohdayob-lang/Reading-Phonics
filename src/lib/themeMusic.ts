/* Background music for 3D Drawings, one tune per place, made on the fly
   with Web Audio — no files to download, and it never repeats exactly.

   jungle  bouncy marimba, a shaker and the odd bird
   meadow  a gentle flute over soft chords, with birdsong
   ocean   slow warm chords over rolling waves, and bubbles
   space   a deep hum, drifting chords and twinkling stars

   Browsers only let sound start after a tap, so call startThemeMusic from
   one (or after one has happened). Browser-only. */

export type MusicTheme = "jungle" | "meadow" | "ocean" | "space";

type Theme = {
  bpm: number;
  /** Chords as semitones above A4 (440 Hz), one per bar. */
  chords: number[][];
  /** The notes a melody may use, semitones above A4. */
  scale: number[];
  /** Plays one beat: what happens on beat `b` of the bar, chord `c`. */
  beat: (t: number, b: number, c: number[], m: Engine) => void;
  /** Background sound under the music, started once. */
  bed?: (m: Engine) => void;
};

const hz = (semi: number) => 440 * Math.pow(2, semi / 12);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

class Engine {
  ctx: AudioContext;
  out: GainNode;
  wet: GainNode;
  private stops: (() => void)[] = [];
  private noiseBuf: AudioBuffer;
  /** Melody position in the scale, for a stepwise wander. */
  step = 4;

  constructor(ctx: AudioContext, volume: number) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2);
    this.out.connect(ctx.destination);
    // A soft room: decaying noise as the reverb's impulse.
    const verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.5;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    verb.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.35;
    this.wet.connect(verb).connect(this.out);
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }

  /** Where a sound goes: dry, plus some reverb. */
  private send(node: AudioNode, reverb = 0.5) {
    node.connect(this.out);
    if (reverb > 0) {
      const g = this.ctx.createGain();
      g.gain.value = reverb;
      node.connect(g).connect(this.wet);
    }
  }

  /** One note with an envelope. */
  tone(
    t: number,
    freq: number,
    dur: number,
    {
      type = "sine" as OscillatorType,
      vol = 0.2,
      attack = 0.01,
      reverb = 0.5,
      vibrato = 0,
      detune = 0,
    } = {},
  ) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      const depth = this.ctx.createGain();
      lfo.frequency.value = 5;
      depth.gain.value = freq * vibrato;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.1);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    this.send(g, reverb);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A wooden bar: a sine and its bright fourth harmonic, quickly gone. */
  marimba(t: number, freq: number, vol = 0.22) {
    this.tone(t, freq, 0.7, { vol, reverb: 0.3 });
    this.tone(t, freq * 4, 0.12, { vol: vol * 0.25, reverb: 0.2 });
  }

  /** A bell or star: pure, high, long tail. */
  bell(t: number, freq: number, vol = 0.08) {
    this.tone(t, freq, 2.5, { vol, reverb: 1 });
    this.tone(t, freq * 2.76, 0.8, { vol: vol * 0.3, reverb: 1 });
  }

  /** A slow swelling chord. */
  pad(t: number, notes: number[], dur: number, vol = 0.05, type: OscillatorType = "triangle") {
    for (const s of notes) {
      for (const d of [-7, 7]) {
        this.tone(t, hz(s), dur, { type, vol, attack: dur * 0.4, detune: d, reverb: 0.8 });
      }
    }
  }

  /** A burst of filtered noise: shakers, splashes. */
  noise(t: number, dur: number, freq: number, vol = 0.05, q = 1, type: BiquadFilterType = "bandpass") {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    this.send(g, 0.2);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  /** A soft low drum. */
  drum(t: number, freq = 90, vol = 0.25) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(freq * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g);
    this.send(g, 0.1);
    o.start(t);
    o.stop(t + 0.45);
  }

  /** A bird: a few quick upward or downward whistles. */
  chirp(t: number) {
    const base = 2200 + Math.random() * 1600;
    const n = 2 + Math.floor(Math.random() * 3);
    const up = Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      const s = t + i * 0.11;
      const o = this.ctx.createOscillator();
      o.frequency.setValueAtTime(up ? base : base * 1.4, s);
      o.frequency.exponentialRampToValueAtTime(up ? base * 1.4 : base, s + 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.035, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.08);
      o.connect(g);
      this.send(g, 0.6);
      o.start(s);
      o.stop(s + 0.1);
    }
  }

  /** A bubble: a short rising blip. */
  bubble(t: number) {
    const f = 300 + Math.random() * 500;
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 2.5, t + 0.08);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g);
    this.send(g, 0.5);
    o.start(t);
    o.stop(t + 0.12);
  }

  /** Waves: noise through a slowly opening and closing filter, swelling. */
  waves() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 500;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const depth = this.ctx.createGain();
    depth.gain.value = 0.045;
    lfo.connect(depth).connect(g.gain);
    const lfo2 = this.ctx.createGain();
    lfo2.gain.value = 350;
    lfo.connect(lfo2).connect(f.frequency);
    src.connect(f).connect(g);
    this.send(g, 0.3);
    src.start();
    lfo.start();
    this.stops.push(() => {
      src.stop();
      lfo.stop();
    });
  }

  /** A low steady hum, slowly breathing. */
  drone(semi: number, vol = 0.06) {
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const oscs = [-5, 5].map((d) => {
      const o = this.ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(semi);
      o.detune.value = d;
      return o;
    });
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 300;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const depth = this.ctx.createGain();
    depth.gain.value = 200;
    lfo.connect(depth).connect(f.frequency);
    for (const o of oscs) o.connect(f);
    f.connect(g);
    this.send(g, 0.7);
    for (const o of [...oscs, lfo]) o.start();
    this.stops.push(() => [...oscs, lfo].forEach((o) => o.stop()));
  }

  /** The next melody note: mostly a step, now and then a leap, kept in range. */
  wander(scale: number[]) {
    const r = Math.random();
    const move = r < 0.7 ? pick([-1, 1]) : r < 0.85 ? pick([-2, 2]) : 0;
    this.step = Math.max(0, Math.min(scale.length - 1, this.step + move));
    return scale[this.step];
  }

  fadeOut(then: () => void) {
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => {
      this.stops.forEach((s) => {
        try {
          s();
        } catch {}
      });
      this.out.disconnect();
      then();
    }, 900);
  }
}

// Semitones from A4. C major / G major / D major / A-flavoured scales.
const C = { C: 3, D: 5, E: 7, F: 8, G: 10, A: 12, B: 14 };

const THEMES: Record<MusicTheme, Theme> = {
  // Bouncy and bright: marimba over a shaker, a bird now and then.
  jungle: {
    bpm: 104,
    chords: [
      [C.C - 24, C.E - 12, C.G - 12],
      [C.A - 36, C.C - 12, C.E - 12],
      [C.F - 24, C.A - 24, C.C - 12],
      [C.G - 24, C.B - 24, C.D - 12],
    ],
    scale: [C.C, C.D, C.E, C.G, C.A, C.C + 12, C.D + 12, C.E + 12, C.G + 12],
    beat(t, b, c, m) {
      const e = 60 / 104 / 2; // an eighth
      if (b === 0) m.drum(t, 80, 0.2);
      if (b === 2) m.drum(t, 110, 0.12);
      m.marimba(t, hz(c[0]), 0.16);
      m.marimba(t + e, hz(c[1 + (b % 2)]), 0.1);
      m.noise(t + e, 0.06, 6000, 0.025, 2);
      m.noise(t, 0.04, 7000, 0.015, 2);
      if (Math.random() < 0.75) m.marimba(t, hz(m.wander(this.scale)), 0.17);
      if (Math.random() < 0.45) m.marimba(t + e, hz(m.wander(this.scale)), 0.13);
      if (Math.random() < 0.04) m.chirp(t + Math.random());
    },
  },
  // Calm and sunny: a flute line over soft chords, with birds.
  meadow: {
    bpm: 76,
    chords: [
      [C.G - 24, C.B - 24, C.D - 12],
      [C.E - 24, C.G - 24, C.B - 24],
      [C.C - 24, C.E - 24, C.G - 24],
      [C.D - 24, C.F + 1 - 24, C.A - 24],
    ],
    scale: [C.G - 12, C.A - 12, C.B - 12, C.D, C.E, C.G, C.A, C.B, C.D + 12],
    beat(t, b, c, m) {
      const q = 60 / 76;
      if (b === 0) m.pad(t, c, q * 4.2, 0.045);
      if (b % 2 === 0) m.tone(t, hz(c[0] - 12), q * 1.8, { vol: 0.08, reverb: 0.4 });
      m.tone(t + q / 2, hz(c[1 + (b % 2)]), q, { type: "triangle", vol: 0.04, reverb: 0.5 });
      if (Math.random() < 0.7) {
        const long = Math.random() < 0.4;
        m.tone(t, hz(m.wander(this.scale)), long ? q * 2 : q * 0.95, {
          type: "triangle",
          vol: 0.15,
          attack: 0.06,
          vibrato: 0.006,
          reverb: 0.7,
        });
      }
      if (Math.random() < 0.08) m.chirp(t + Math.random() * q);
    },
  },
  // Slow and dreamy, under the waves, with bubbles.
  ocean: {
    bpm: 60,
    chords: [
      [C.D - 24, C.F + 1 - 24, C.A - 24, C.E - 12],
      [C.B - 36, C.D - 24, C.F + 1 - 24, C.A - 24],
      [C.G - 36, C.B - 36, C.D - 24, C.F + 1 - 24],
      [C.A - 36, C.C + 1 - 24, C.E - 24, C.G - 24],
    ],
    scale: [C.D - 12, C.E - 12, C.F + 1 - 12, C.A - 12, C.B - 12, C.D, C.E, C.F + 1],
    bed: (m) => m.waves(),
    beat(t, b, c, m) {
      if (b === 0) m.pad(t, c, 5, 0.035, "sine");
      if (b === 0) m.tone(t, hz(c[0] - 12), 4, { vol: 0.1, attack: 0.5, reverb: 0.6 });
      if (Math.random() < 0.5) m.bell(t + Math.random() * 0.5, hz(m.wander(this.scale)), 0.06);
      if (Math.random() < 0.25) {
        const s = t + Math.random();
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) m.bubble(s + i * 0.09);
      }
    },
  },
  // Floating: a deep hum, slow chords and twinkling stars.
  space: {
    bpm: 54,
    chords: [
      [C.C - 24, C.G - 24, C.D - 12, C.E - 12],
      [C.A - 36, C.E - 24, C.B - 24, C.C - 12],
      [C.F - 36, C.C - 24, C.G - 24, C.A - 24],
      [C.G - 36, C.D - 24, C.A - 24, C.B - 24],
    ],
    scale: [C.C + 12, C.D + 12, C.E + 12, C.G + 12, C.A + 12, C.C + 24, C.D + 24, C.E + 24],
    bed: (m) => m.drone(C.C - 36, 0.05),
    beat(t, b, c, m) {
      if (b === 0) m.pad(t, c, 6, 0.03, "sine");
      if (Math.random() < 0.55) m.bell(t + Math.random() * 0.4, hz(pick(this.scale)), 0.045);
      if (Math.random() < 0.25) m.bell(t + 0.5, hz(pick(this.scale)), 0.03);
    },
  },
};

let ctx: AudioContext | null = null;
let engine: Engine | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let current: MusicTheme | null = null;

/** Play `theme`'s music, crossfading from whatever was playing. */
export function startThemeMusic(theme: MusicTheme, volume = 0.6) {
  if (typeof window === "undefined") return;
  if (current === theme && engine) {
    void ctx?.resume();
    return;
  }
  stopThemeMusic();
  try {
    ctx ??= new AudioContext();
  } catch {
    return;
  }
  void ctx.resume();
  const m = new Engine(ctx, volume);
  const T = THEMES[theme];
  T.bed?.(m);
  engine = m;
  current = theme;
  const beatLen = 60 / T.bpm;
  let next = ctx.currentTime + 0.1;
  let n = 0;
  // Schedule a little ahead so a busy page doesn't make it stutter.
  timer = setInterval(() => {
    while (next < m.ctx.currentTime + 0.4) {
      const bar = Math.floor(n / 4);
      T.beat(next, n % 4, T.chords[bar % T.chords.length], m);
      next += beatLen;
      n++;
    }
  }, 100);
}

/** Fade the music out. */
export function stopThemeMusic() {
  if (timer) clearInterval(timer);
  timer = null;
  const m = engine;
  engine = null;
  current = null;
  m?.fadeOut(() => {});
}

/** Pause and resume with the page, without losing the place. */
export function pauseThemeMusic(paused: boolean) {
  if (!ctx) return;
  void (paused ? ctx.suspend() : ctx.resume());
}
