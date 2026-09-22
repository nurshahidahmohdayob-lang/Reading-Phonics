"use client";

/* The page a phone lands on after scanning the QR on the class screen.

   One job: photograph a child's drawing, lift it off the paper here on the
   phone, and send it to the screen that showed the code. No sign-in — the
   code in the link is the permission, and it expires — and nothing about the
   class is readable from this page. */

import { useEffect, useRef, useState } from "react";
import { cutOutDrawing, shrinkCutout, type Cutout } from "@/lib/cutout";

type Stage = "ready" | "working" | "sent" | "error";

export default function ScanPage() {
  const [code, setCode] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("ready");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Cutout | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const fromHash = window.location.hash.replace(/^#/, "").trim();
      setCode(/^[a-z2-9]{12}$/.test(fromHash) ? fromHash : "");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  async function send(file: File | undefined) {
    if (!file || !code) return;
    setStage("working");
    setMessage("");
    try {
      const cut = await cutOutDrawing(file);
      const small = await shrinkCutout(cut.dataUrl);
      setPreview(small);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          code,
          dataUrl: small.dataUrl,
          width: small.width,
          height: small.height,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setStage("error");
        setMessage(
          typeof data?.error === "string"
            ? data.error
            : "That didn't send. Try again.",
        );
        return;
      }
      setSentCount((n) => n + 1);
      setStage("sent");
    } catch (e) {
      setStage("error");
      setMessage(
        e instanceof Error ? e.message : "That didn't work. Try again.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (code === null) {
    return (
      <Shell>
        <p className="text-sm font-bold text-zinc-400">One moment…</p>
      </Shell>
    );
  }

  if (code === "") {
    return (
      <Shell>
        <div className="text-5xl">📷</div>
        <h1 className="mt-2 text-lg font-extrabold text-zinc-800 dark:text-zinc-100">
          Scan the code on the screen
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Open <b>3D Drawings</b> on the class screen, tap{" "}
          <b>📱 Scan with my phone</b>, and point your camera at the code it
          shows.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-5xl">🪄</div>
      <h1 className="mt-2 text-lg font-extrabold text-zinc-800 dark:text-zinc-100">
        Send a drawing to the screen
      </h1>
      <p className="mt-1 text-xs font-semibold text-zinc-400">
        Linked to the class screen · {sentCount} sent
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void send(e.target.files?.[0])}
      />

      {preview && (
        <div className="mt-4 grid h-48 w-full place-items-center rounded-2xl bg-gradient-to-b from-[#A6D9FF] to-[#E9F6FF]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.dataUrl}
            alt="The drawing you sent"
            className="max-h-44 max-w-[80%] object-contain drop-shadow-lg"
          />
        </div>
      )}

      {stage === "sent" && (
        <p className="mt-3 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ It&apos;s on the screen
        </p>
      )}
      {stage === "error" && (
        <p className="mt-3 text-center text-sm font-bold text-rose-500">
          {message}
        </p>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={stage === "working"}
        className="mt-4 w-full rounded-full bg-[#0A4F29] px-7 py-4 text-lg font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
      >
        {stage === "working"
          ? "✨ Cutting it out…"
          : stage === "sent"
            ? "📷 Send another drawing"
            : "📷 Take a photo of the drawing"}
      </button>
      <p className="mt-2 text-center text-xs font-semibold text-zinc-400">
        Lay the drawing flat in good light, with all of it in the picture.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] p-5">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[2rem] bg-white/95 p-6 text-center shadow-lg ring-4 ring-white/60 dark:bg-zinc-900/95">
        {children}
      </div>
    </main>
  );
}
