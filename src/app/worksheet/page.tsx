"use client";

/* The page a child opens from a worksheet link or QR code: the worksheet for
   one story, done on their own device. No sign-in — the link carries only the
   story and the worksheet level, nothing about any child (lib/worksheetLink).
   Everything is built and marked here, in the browser. */

import { useEffect, useState } from "react";
import OnlineWorksheet from "@/components/OnlineWorksheet";
import { readWorksheetLink } from "@/lib/worksheetLink";
import type { WorksheetInput } from "@/lib/worksheet";

export default function WorksheetPage() {
  const [input, setInput] = useState<WorksheetInput | null | undefined>(undefined);

  useEffect(() => {
    const read = () => setInput(readWorksheetLink(window.location.hash));
    const frame = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", read);
    };
  }, []);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#D8EEFF] via-[#EEF8FF] to-[#E6F6E0] dark:from-zinc-950 dark:to-zinc-900">
      {input === undefined ? (
        <p className="pt-24 text-center text-lg font-bold text-zinc-400">One moment…</p>
      ) : input === null ? (
        <div className="mx-auto max-w-md px-6 pt-24 text-center">
          <div className="text-6xl">🔎</div>
          <h1 className="mt-3 text-2xl font-extrabold text-zinc-700">This worksheet link doesn&apos;t work</h1>
          <p className="mt-2 font-semibold text-zinc-500">Ask your teacher for the link again.</p>
        </div>
      ) : (
        <OnlineWorksheet input={input} />
      )}
    </main>
  );
}
