"use client";

/* The page a parent lands on from the link in their email.

   Everything it shows comes out of the link itself (after the "#"), so it
   needs no sign-in and no database, and it can only ever show the one child's
   report that was packed into that link. */

import { useEffect, useRef, useState } from "react";
import { decodeReport } from "@/lib/reportLink";
import { reportHtml } from "@/lib/reportPrint";

type State = "loading" | "bad";

export default function ParentReportPage() {
  const [state, setState] = useState<State>("loading");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      const d = await decodeReport(window.location.hash);
      if (!d) {
        setState("bad");
        return;
      }
      // Hand the whole page over to the report document, exactly as the
      // teacher's copy looks — print button, styles and all.
      document.open();
      document.write(reportHtml(d));
      document.close();
    })();
  }, []);

  if (state === "bad") {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-[#f4f4f5] p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm">
          <div className="text-4xl">📋</div>
          <h1 className="mt-2 text-lg font-extrabold text-zinc-800">
            This reading report link didn’t open
          </h1>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            The link may have been cut short by the email or chat app it came
            through. Please ask your child’s teacher to send it again, and open
            it by tapping the whole link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[#f4f4f5]">
      <p className="text-sm font-bold text-zinc-400">Opening the report…</p>
    </main>
  );
}
