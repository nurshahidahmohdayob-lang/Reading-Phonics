"use client";

/* "Install this app" — the home-screen prompt.

   Chrome, Edge and Android hand us a real install prompt (beforeinstallprompt)
   that we can fire from our own button. Safari on iPhone and iPad has no such
   event, so there we show the two-step instruction instead. Once the app is
   installed and opened from the home screen it runs in standalone mode and
   this disappears — and a teacher who dismisses it isn't asked again. */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED = "phonics.install.dismissed";

/** iOS share symbol — a box with an arrow coming out of the top. */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-0.5 inline-block align-[-2px]"
      aria-hidden="true"
    >
      <path d="M12 3v11" />
      <path d="M8.5 6.5 12 3l3.5 3.5" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="mx-0.5 inline-block align-[-2px]"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" strokeWidth="1.6" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export default function InstallApp() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [howTo, setHowTo] = useState(false);
  // A parent opening their child's report shouldn't be asked to install
  // the teachers' app.
  const pathname = usePathname();
  const parentPage = !!pathname && pathname.startsWith("/report");

  useEffect(() => {
    // Nothing to offer if it's already installed, or was waved away before.
    const suppressed = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS reports it here instead.
        (window.navigator as { standalone?: boolean }).standalone === true;
      if (standalone) return true;
      try {
        return !!window.localStorage.getItem(DISMISSED);
      } catch {
        return false; // private browsing — just show it
      }
    };

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep it for our own button
      if (suppressed()) return;
      setDeferred(e as InstallEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Safari has no install event, so offer the instructions instead —
    // after a frame, so the page paints first.
    const frame = requestAnimationFrame(() => {
      if (suppressed()) return;
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        // iPadOS reports itself as a Mac, but a Mac has no touch screen.
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (!ios) return;
      setIsIOS(true);
      setShow(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function close() {
    setShow(false);
    try {
      window.localStorage.setItem(DISMISSED, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) {
      setHowTo(true);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setShow(false);
  }

  if (!show || parentPage) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/10 backdrop-blur dark:bg-zinc-900/95">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
            Install Phonics Pals
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {isIOS
              ? "Add it to your home screen to open it like an app."
              : "Keep it on your home screen — it opens like an app."}
          </p>

          {(isIOS || howTo) && (
            <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {isIOS ? (
                <>
                  <li>
                    Tap the Share button <ShareIcon /> at the bottom of Safari.
                  </li>
                  <li>
                    Choose <b>Add to Home Screen</b> <PlusIcon />, then{" "}
                    <b>Add</b>.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Open the browser menu <span aria-hidden>⋮</span>.
                  </li>
                  <li>
                    Choose <b>Install app</b> (or <b>Add to Home screen</b>).
                  </li>
                </>
              )}
            </ol>
          )}

          <div className="mt-2 flex gap-2">
            {!isIOS && (
              <button
                onClick={() => void install()}
                className="rounded-full bg-[#0A4F29] px-4 py-1.5 text-xs font-bold text-white active:scale-95"
              >
                Install
              </button>
            )}
            <button
              onClick={close}
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-bold text-zinc-500 active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={close}
          aria-label="Close"
          className="shrink-0 rounded-lg px-1.5 py-0.5 text-sm font-bold text-zinc-400 hover:text-zinc-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
