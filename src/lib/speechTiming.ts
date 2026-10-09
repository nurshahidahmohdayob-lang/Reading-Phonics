/* When each word starts in a recording of a line being read aloud, worked
   out from the sound itself, so the words can light up in time with the
   voice. The recordings (Google's text-to-speech, via /api/tts) come with no
   word timings, so: find where the speech starts and ends (skipping the
   silence round it), find the pauses in it, line the longest pauses up with
   the line's punctuation (where a reader pauses), share each phrase's time
   out over its words by their length (the last word of a phrase is drawn
   out), then nudge each word onto the start of a burst of sound nearby,
   since a word usually begins just after a tiny gap. */

/** Roughly how many syllables a word has: its groups of vowels. */
function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 1;
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** A word a reader pauses after (it ends a clause or sentence). */
const pausesAfter = (word: string) => /[,.;:!?…]["”’)]*$/.test(word);

/**
 * When each word of `text` starts in the audio, in seconds of the audio's
 * own time (as `audio.currentTime` counts it), or null if no speech is found.
 * `samples` is the audio's first channel at `rate` samples a second.
 */
export function timeWords(samples: Float32Array, rate: number, text: string): number[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  // Loudness in 10 ms frames.
  const FRAME = 0.01;
  const hop = Math.max(1, Math.round(rate * FRAME));
  const frames = Math.floor(samples.length / hop);
  const loud = new Float32Array(frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) sum += samples[i] * samples[i];
    loud[f] = Math.sqrt(sum / hop);
    if (loud[f] > peak) peak = loud[f];
  }
  if (!peak) return null;
  const voiced = (f: number) => loud[f] > peak * 0.07;

  // Where the speech starts and ends.
  let start = 0;
  while (start < frames && !voiced(start)) start++;
  let end = frames - 1;
  while (end > start && !voiced(end)) end--;
  if (start >= end) return null;
  end += 1;

  // The pauses inside it: quiet stretches of 70 ms or more.
  const gaps: { from: number; to: number }[] = [];
  for (let f = start; f < end; ) {
    if (voiced(f)) {
      f++;
      continue;
    }
    const from = f;
    while (f < end && !voiced(f)) f++;
    if (f - from >= 7) gaps.push({ from, to: f });
  }

  // Line the longest pauses up with the punctuation, in order. If the voice
  // paused less often than the punctuation suggests, use the pauses there are
  // for the punctuation nearest to where they fall.
  const breaks = words.map((w, i) => (i < words.length - 1 && pausesAfter(w) ? i : -1)).filter((i) => i >= 0);
  // How long each word takes, roughly: its syllables and letters, and more
  // for the last word of a phrase, which readers draw out.
  const weight = words.map((w, i) => 0.5 * syllables(w) + 0.12 * w.replace(/[^a-z]/gi, "").length + 0.25 + (i === words.length - 1 || pausesAfter(w) ? 0.5 : 0));
  const total = weight.reduce((a, b) => a + b, 0);
  const at = (i: number) => weight.slice(0, i + 1).reduce((a, b) => a + b, 0) / total; // fraction of the line done after word i
  const used = [...gaps].sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, breaks.length).sort((a, b) => a.from - b.from);
  const anchors: { word: number; from: number; to: number }[] = [];
  if (used.length === breaks.length) {
    used.forEach((g, k) => anchors.push({ word: breaks[k], ...g }));
  } else {
    let next = 0;
    for (const g of used) {
      const f = (g.from - start) / (end - start);
      let best = -1;
      for (let k = next; k < breaks.length; k++) if (best < 0 || Math.abs(at(breaks[k]) - f) < Math.abs(at(breaks[best]) - f)) best = k;
      if (best < 0) break;
      anchors.push({ word: breaks[best], ...g });
      next = best + 1;
    }
  }

  // Where bursts of sound begin after a gap of 30 ms or more: word starts.
  const onsets: number[] = [];
  for (let f = start + 1, quiet = 0; f < end; f++) {
    if (!voiced(f)) quiet++;
    else {
      if (quiet >= 3) onsets.push(f);
      quiet = 0;
    }
  }

  // Share each phrase's stretch of speech over its words, then move each
  // word (after the first of its phrase) onto the nearest burst start within
  // 0.22 s, keeping them in order.
  const starts: number[] = new Array(words.length);
  let first = 0;
  let from = start;
  for (const seg of [...anchors, { word: words.length - 1, from: end, to: end }]) {
    const last = seg.word;
    const span = seg.from - from;
    const w = weight.slice(first, last + 1);
    const sum = w.reduce((a, b) => a + b, 0) || 1;
    let t = from;
    let prev = from;
    for (let i = first; i <= last; i++) {
      const slot = (span * weight[i]) / sum;
      let at = t;
      if (i > first) {
        // a burst no more than 0.22 s early, and early enough in this word's
        // own share of time that it isn't really the next word starting
        let best = -1;
        for (const o of onsets) {
          if (o <= prev || o >= seg.from || o < t - 22 || o > t + slot * 0.7) continue;
          if (best < 0 || Math.abs(o - t) < Math.abs(best - t)) best = o;
        }
        if (best >= 0) at = best;
        at = Math.max(at, prev + 3);
      }
      starts[i] = at * FRAME;
      prev = at;
      t += slot;
    }
    first = last + 1;
    from = seg.to;
  }
  return starts;
}
