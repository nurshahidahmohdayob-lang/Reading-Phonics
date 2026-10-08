"use client";

/* Interactive stories, open to anyone with the link (no sign-in): pick a
   story and read along. /play lists them; /play#<id> opens one. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fredoka } from "next/font/google";
import GardenBackdrop from "@/components/GardenBackdrop";
import InteractiveStory from "@/components/InteractiveStory";
import { StoryArt } from "@/components/storyArt";
import { INTERACTIVE_STORIES, findInteractiveStory } from "@/app/interactiveStories";

const gameFont = Fredoka({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

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
    <main className="relative min-h-dvh bg-[#4b8c34] px-4 pb-10 pt-4">
      <GardenBackdrop />
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* the wooden sign along the top, with the way home and back */}
        <header className="game-header relative mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-[1.6rem] px-3 py-3 sm:px-5">
          <Link href="/" className={`${gameFont.className} candy candy-gold justify-self-start`}>
            🏠 Home
          </Link>
          <h1 className={`${gameFont.className} game-title justify-self-center whitespace-nowrap text-center leading-none`}>Interactive Stories</h1>
          {story ? (
            <button onClick={() => (window.location.hash = "")} className={`${gameFont.className} candy candy-green justify-self-end`}>
              📚 All stories
            </button>
          ) : (
            <span />
          )}
        </header>

        {story ? (
          <InteractiveStory key={story.id} story={story} onClose={() => (window.location.hash = "")} />
        ) : (
          <div className="section-panel relative mx-auto max-w-3xl rounded-[2rem] px-4 py-6 sm:px-8">
            <p className={`${gameFont.className} text-center text-lg font-semibold text-[#5a3a1a]`}>Tap a story, then tap the characters and the words!</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {INTERACTIVE_STORIES.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-4 rounded-[1.6rem] bg-white p-4 shadow-md ring-2 ring-[#f2d9a6] transition-all hover:-translate-y-0.5 active:scale-[.98]"
                >
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#bfe8a8] to-[#7cc86a] p-2.5 ring-2 ring-[#3a9e3a]">
                    <StoryArt id={s.cover} className="block max-h-full w-full" />
                  </span>
                  <span>
                    <span className={`${gameFont.className} block text-xl font-bold text-[#3a2410]`}>{s.title}</span>
                    <span className="text-sm font-bold text-[#8a6a40]">{s.level} · {s.pages.length} pages</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
