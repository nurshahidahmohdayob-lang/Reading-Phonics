"use client";

/* A story's colouring page, opened from a link the teacher shares
   (…/colour#<share code>-<story id>). No sign-in: the child types their
   name, colours, and taps Submit, and the picture goes to the teacher whose
   code is in the link (lib/colouring.ts). */

import { useEffect, useState } from "react";
import ForestBackdrop from "@/components/ForestBackdrop";
import StoryColouring from "@/components/StoryColouring";
import { levels, type Story } from "@/app/stories";

function fromHash(): { code: string; story: Story } | null {
  const m = /^#?\s*([a-z2-9]{12})-(y\d-\d\d)\s*$/.exec(decodeURIComponent(location.hash));
  if (!m) return null;
  const story = levels.flatMap((l) => l.stories).find((s) => s.id === m[2]);
  return story ? { code: m[1], story } : null;
}

export default function ColourPage() {
  const [page, setPage] = useState<{ code: string; story: Story } | null | "loading">("loading");

  useEffect(() => {
    const read = () => setPage(fromHash());
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <main className="relative min-h-dvh bg-[#4b7f2e] px-4 pb-10 pt-6">
      <ForestBackdrop soft />
      <div className="section-panel relative z-10 mx-auto max-w-5xl rounded-[2rem] px-4 py-6 sm:px-8">
        {page === "loading" ? null : page ? (
          <StoryColouring key={page.story.id} story={page.story} shareCode={page.code} />
        ) : (
          <p className="py-16 text-center text-lg font-bold text-zinc-600">
            This colouring link isn&apos;t complete. Ask your teacher to send it again. 🖍️
          </p>
        )}
      </div>
    </main>
  );
}
