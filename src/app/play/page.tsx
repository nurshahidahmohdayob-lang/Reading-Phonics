"use client";

/* Interactive stories, open to anyone with the link (no sign-in): pick a
   story and read along. /play lists them; /play#<id> opens one. */

import { useEffect, useState } from "react";
import InteractiveStory from "@/components/InteractiveStory";
import { INTERACTIVE_STORIES, findInteractiveStory } from "@/app/interactiveStories";

export default function PlayPage() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setId(window.location.hash.replace(/^#/, "") || null);
    const frame = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", read);
    };
  }, []);

  const story = id ? findInteractiveStory(id) : null;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#D8EEFF] via-[#EEF8FF] to-[#E6F6E0] px-4 pb-10 pt-6 dark:from-zinc-950 dark:to-zinc-900">
      {story ? (
        <>
          <button
            onClick={() => (window.location.hash = "")}
            className="mx-auto mb-4 block rounded-full bg-white px-4 py-2 font-bold text-zinc-600 shadow-sm active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
          >
            ← All stories
          </button>
          <InteractiveStory key={story.id} story={story} onClose={() => (window.location.hash = "")} />
        </>
      ) : (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-3xl font-extrabold text-[#0A4F29] dark:text-emerald-300">🎭 Interactive Stories</h1>
          <p className="mt-1 text-center font-semibold text-zinc-500">Tap a story, then tap the characters and the words!</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {INTERACTIVE_STORIES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-4 rounded-[1.8rem] bg-white p-5 shadow-md ring-4 ring-white/70 transition-all hover:-translate-y-0.5 active:scale-[.98] dark:bg-zinc-900"
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-amber-100 text-4xl">{s.emoji}</span>
                <span>
                  <span className="block text-xl font-extrabold text-zinc-800 dark:text-zinc-100">{s.title}</span>
                  <span className="text-sm font-bold text-zinc-400">{s.level} · {s.pages.length} pages</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
