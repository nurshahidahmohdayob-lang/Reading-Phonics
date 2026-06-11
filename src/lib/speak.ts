/* Speech for the app. Primary path streams real spoken audio from our own
   /api/tts route (works without any browser voices installed). If that audio
   can't play, we fall back to the Web Speech API. A "phonics-audio" event is
   emitted with "ok" or "fail" so the UI can show a diagnostic. */

let currentAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let session = 0;
let warmed = false;

/** Start loading speech-synthesis voices early (for the fallback). */
export function initSpeech() {
  if (warmed || typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  warmed = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}

export function voiceCount(): number {
  if (typeof window === "undefined" || !window.speechSynthesis) return -1;
  return window.speechSynthesis.getVoices().length;
}

function emit(detail: "ok" | "fail") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("phonics-audio", { detail }));
  }
}

function clampRate(rate: number): number {
  return Math.min(1.2, Math.max(0.5, rate));
}

/** Split text into ≤180-char chunks on word boundaries (TTS length limit). */
function chunkText(text: string, max = 180): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      chunks.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : [text];
}

function stopAll() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.onplaying = null;
    currentAudio.pause();
    currentAudio = null;
  }
  if (
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    (window.speechSynthesis.speaking || window.speechSynthesis.pending)
  ) {
    window.speechSynthesis.cancel();
  }
}

/* ---- Web Speech API fallback ---- */

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => /^en[-_]/i.test(v.lang) && v.localService) ??
    voices.find((v) => /^en[-_]/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0]
  );
}

function synthSpeak(text: string, rate: number, token: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    emit("fail");
    return;
  }
  const synth = window.speechSynthesis;
  initSpeech();

  const run = () => {
    if (token !== session) return;
    if (synth.getVoices().length === 0) {
      emit("fail");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1.1;
    u.lang = "en-US";
    const voice = pickEnglishVoice();
    if (voice) u.voice = voice;
    activeUtterance = u;
    u.onstart = () => emit("ok");
    u.onend = () => {
      if (activeUtterance === u) activeUtterance = null;
    };
    u.onerror = () => emit("fail");
    synth.speak(u);
    synth.resume();
  };

  if (synth.getVoices().length === 0) {
    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      synth.removeEventListener("voiceschanged", go);
      run();
    };
    synth.addEventListener("voiceschanged", go);
    setTimeout(go, 300);
  } else {
    run();
  }
}

/* ---- Public API ---- */

/** Speak text aloud (audio first, browser voice as fallback). */
export function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !text.trim()) return;
  stopAll();
  const token = ++session;
  const chunks = chunkText(text);
  const playbackRate = clampRate(rate);
  let playedOk = false;

  const playFrom = (i: number) => {
    if (token !== session || i >= chunks.length) return;
    const audio = new Audio(
      `/api/tts?tl=en&q=${encodeURIComponent(chunks[i])}`,
    );
    currentAudio = audio;
    audio.playbackRate = playbackRate;
    audio.onplaying = () => {
      playedOk = true;
      emit("ok");
    };
    audio.onended = () => {
      if (token === session) playFrom(i + 1);
    };
    const onFail = () => {
      if (token === session && !playedOk) synthSpeak(text, rate, token);
    };
    audio.onerror = onFail;
    audio.play().catch(onFail);
  };

  playFrom(0);
}

/** Play a pre-recorded clip from /public/sounds/<name>.mp3. If the file
    doesn't exist (or can't play), run the fallback — usually a speak() call —
    so recordings can be added one at a time. */
export function playClip(name: string, fallback?: () => void) {
  if (typeof window === "undefined") return;
  stopAll();
  const token = ++session;
  const audio = new Audio(`/sounds/${encodeURIComponent(name)}.mp3`);
  currentAudio = audio;
  let playedOk = false;
  audio.onplaying = () => {
    playedOk = true;
    emit("ok");
  };
  const onFail = () => {
    if (token === session && !playedOk) fallback?.();
  };
  audio.onerror = onFail;
  audio.play().catch(onFail);
}

/** Stop whatever is currently playing (clips, TTS, or browser speech). */
export function stopSpeech() {
  session++; // invalidate any queued chunks and fallbacks
  stopAll();
}

/** Speak a grapheme (letter or digraph) with the recorded phonics clip from
    /public/sounds, falling back to the TTS approximation. */
export function playSoundClip(grapheme: string, fallbackSay: string, rate = 0.85) {
  playClip(grapheme.toLowerCase(), () => speak(fallbackSay, rate));
}

/** Warm up the speech engine on first interaction. */
export function primeSpeech() {
  initSpeech();
}

/** Short spoken praise for correct answers. */
const PRAISE = ["Great job!", "Well done!", "You got it!", "Awesome!", "Yes!"];

export function praise() {
  speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], 1);
}
