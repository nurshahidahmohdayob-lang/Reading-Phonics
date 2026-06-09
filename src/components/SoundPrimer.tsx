"use client";

import { useEffect, useState } from "react";
import { primeSpeech } from "@/lib/speak";

/**
 * Shows a one-time "tap to enable sound" hint. Browsers often block speech
 * until the first user interaction, so the first tap/keypress anywhere primes
 * the speech engine and dismisses the hint.
 */
export default function SoundPrimer() {
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setNeedsTap(true);

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
    };
  }, []);

  if (!needsTap) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg">
        🔊 Tap anywhere to turn on sound
      </div>
    </div>
  );
}
