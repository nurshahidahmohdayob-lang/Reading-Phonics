"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* The Web Speech API's SpeechRecognition isn't in TypeScript's DOM lib,
   so we declare the minimal surface we use. */
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [i: number]: SRResult };
}
interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recRef = useRef<RecognitionLike | null>(null);
  const finalRef = useRef(""); // finalized words, kept across auto-restarts
  const wantRef = useRef(false); // user intends to keep listening

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setSupported(true);

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interim += r[0].transcript + " ";
      }
      setTranscript((finalRef.current + interim).trim());
    };

    rec.onend = () => {
      // The engine stops itself after a pause; resume if still wanted.
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    rec.onerror = () => setListening(false);
    recRef.current = rec;

    return () => {
      wantRef.current = false;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    finalRef.current = "";
    setTranscript("");
    wantRef.current = true;
    setListening(true);
    try {
      rec.start();
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
  }, []);

  return { supported, listening, transcript, start, stop, reset };
}
