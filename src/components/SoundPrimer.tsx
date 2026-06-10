"use client";

import { useEffect, useState } from "react";
import { initSpeech, primeSpeech, speak } from "@/lib/speak";

/**
 * Primes the speech engine on first interaction and shows a hint until then.
 * If audio genuinely fails to play, surfaces a diagnostic with a test button.
 */
export default function SoundPrimer() {
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    initSpeech();
    setNeedsTap(true);

    const onAudio = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "ok") setFailed(false);
      else if (detail === "fail") setFailed(true);
    };
    window.addEventListener("phonics-audio", onAudio);

    const onFirst = () => {
      primeSpeech();
      setNeedsTap(false);
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
      window.removeEventListener("phonics-audio", onAudio);
    };
  }, []);

  if (failed) {
    return (
      <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg">
          <span>🔇 Sound couldn&apos;t play. Check the tab isn&apos;t muted and your volume is up.</span>
          <button
            onClick={() => speak("hello, can you hear me?")}
            className="rounded-full bg-white px-4 py-1.5 font-bold text-rose-600 active:scale-95"
          >
            🔊 Test sound
          </button>
        </div>
      </div>
    );
  }

  if (!needsTap) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
        🔊 Tap anywhere to turn on sound
      </div>
    </div>
  );
}
