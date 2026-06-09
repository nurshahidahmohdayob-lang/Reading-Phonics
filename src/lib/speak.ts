/* Robust wrapper around the Web Speech API. Browsers (especially Chrome) have
   a few quirks that cause "no sound":
   - getVoices() is empty until the async "voiceschanged" event fires;
   - the synth can get stuck in a paused state and needs resume();
   - the utterance can be garbage-collected mid-speech, cutting it off.
   We warm voices up, keep a reference to the active utterance, and resume(). */

let warmedUp = false;
let activeUtterance: SpeechSynthesisUtterance | null = null;

function warmUp() {
  if (warmedUp || typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  warmedUp = true;
  // Touch getVoices() and listen for the async load so voices are ready.
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}

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

/** Speak text aloud using the browser's built-in voice. */
export function speak(text: string, rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  warmUp();

  // Stop anything already playing so taps don't queue up.
  if (synth.speaking || synth.pending) synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.1;
  utterance.lang = "en-US";
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;

  // Keep a reference so the utterance isn't garbage-collected mid-speech.
  activeUtterance = utterance;
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };

  synth.speak(utterance);
  // Chrome can leave the queue paused; nudge it to actually play.
  synth.resume();
}

/**
 * Unlock the speech engine. Some browsers only allow speech after a real user
 * gesture, so we play a silent utterance on the first tap to "prime" it.
 */
export function primeSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  warmUp();
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
  window.speechSynthesis.resume();
}

/** Short spoken praise for correct answers. */
const PRAISE = ["Great job!", "Well done!", "You got it!", "Awesome!", "Yes!"];

export function praise() {
  speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], 1);
}
