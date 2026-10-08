"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { forgetOwner } from "@/lib/owner";
import { SIGN_IN_NEEDED } from "@/lib/signInNeeded";

type Status = "loading" | "out" | "in";

/** Wraps the whole app: shows a sign-in screen until a staff member signs in,
    then reveals the app with a small greeting + sign-out control. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  // The sign-in ran out while the page stayed open: say so, and offer to sign
  // in again over the top, rather than wiping what's on screen.
  const [expired, setExpired] = useState(false);
  const [reauth, setReauth] = useState(false);
  const pathname = usePathname();
  // Public by design: a parent's report link (it carries one child's report
  // inside the link), and the phone page that sends a drawing to the class
  // screen (the code in its link is the permission, and it expires). Neither
  // can read anything about the school, so neither asks to sign in. Nor does
  // an online worksheet: its link carries a story and a level, nothing else.
  // Nor the class activities page, which a class code opens (lib/assignments),
  // nor the interactive stories, which hold nothing but the stories.
  const isPublic =
    !!pathname &&
    (pathname.startsWith("/report") ||
      pathname.startsWith("/scan") ||
      pathname.startsWith("/worksheet") ||
      pathname.startsWith("/class") ||
      pathname.startsWith("/play"));

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d?.signedIn) {
          setName(d.name ?? "");
          setStatus("in");
        } else {
          setStatus("out");
        }
      })
      .catch(() => alive && setStatus("out"));
    return () => {
      alive = false;
    };
  }, []);

  // Check again whenever the teacher comes back to the page, and every few
  // minutes while it's open. Only a definite "not signed in" counts — being
  // offline for a moment mustn't look like being signed out.
  useEffect(() => {
    if (status !== "in") return;
    const check = () => {
      fetch("/api/me")
        .then((r) => {
          if (r.status === 401) setExpired(true);
        })
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const onNeeded = () => setExpired(true);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(SIGN_IN_NEEDED, onNeeded);
    const timer = window.setInterval(check, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(SIGN_IN_NEEDED, onNeeded);
      window.clearInterval(timer);
    };
  }, [status]);

  async function signOut() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      // The next teacher to sign in at this screen gets their own drawings,
      // not whatever this one scanned.
      forgetOwner();
      setName("");
      setStatus("out");
    }
  }

  if (isPublic) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF]">
        <div className="anim-bob text-5xl">🐣</div>
      </div>
    );
  }

  if (status === "out") {
    return (
      <SignIn
        onSignedIn={(n) => {
          setName(n);
          setStatus("in");
        }}
      />
    );
  }

  return (
    <>
      <button
        onClick={signOut}
        className="fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition-all hover:bg-white active:scale-95 dark:bg-zinc-800/85 dark:text-zinc-200"
        title={name ? `Signed in as ${name}` : "Sign out"}
      >
        <span className="max-w-[40vw] truncate">👋 {name || "Signed in"}</span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span className="text-rose-500">Sign out</span>
      </button>
      {children}

      {expired && !reauth && (
        <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
          <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl bg-amber-100 px-4 py-3 text-center text-sm font-bold text-amber-900 shadow-lg ring-2 ring-amber-300 dark:bg-amber-950 dark:text-amber-100">
            <span>
              ⏰ Your sign-in has run out, so nothing new can be saved or
              synced.
            </span>
            <button
              onClick={() => setReauth(true)}
              className="rounded-full bg-amber-500 px-4 py-1.5 font-extrabold text-white shadow active:scale-95"
            >
              Sign in again
            </button>
          </div>
        </div>
      )}

      {reauth && (
        <div className="fixed inset-0 z-[70] flex overflow-y-auto">
          <SignIn
            onSignedIn={(n) => {
              forgetOwner();
              // Someone else signing in at this screen gets a fresh page, not
              // the last teacher's work.
              if (name && n && n !== name) {
                window.location.reload();
                return;
              }
              setName(n);
              setExpired(false);
              setReauth(false);
            }}
            onCancel={() => setReauth(false)}
          />
        </div>
      )}
    </>
  );
}

/* ---------- Sign-in screen ---------- */

function SignIn({
  onSignedIn,
  onCancel,
}: {
  onSignedIn: (name: string) => void;
  /** Signing in again over the app: a way back without signing in. */
  onCancel?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        onSignedIn(data.name ?? "");
      } else {
        setError(data?.error ?? "Sign-in failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#A6D9FF] via-[#D8EEFF] to-[#F4FBFF] px-4 py-10 dark:from-zinc-900 dark:via-[#1c1726] dark:to-black">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[2rem] bg-white/80 p-8 text-center shadow-xl ring-4 ring-white/60 backdrop-blur dark:bg-zinc-900/80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/reader-girl.png"
          alt=""
          className="anim-bob h-28 w-auto drop-shadow-md"
        />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-pink-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
              Phonics Pals & Guided Reading
            </span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            For school staff — please sign in to continue.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@school email"
            autoFocus
            autoComplete="email"
            className="w-full rounded-2xl border-4 border-violet-200 bg-white px-4 py-3 text-center font-bold text-zinc-700 shadow-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="staff password"
            autoComplete="current-password"
            className="w-full rounded-2xl border-4 border-violet-200 bg-white px-4 py-3 text-center font-bold text-zinc-700 shadow-sm outline-none focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-violet-600 px-6 py-3 text-lg font-extrabold text-white shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs font-semibold text-zinc-400">
          We check your email against the school staff directory.
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-zinc-500 underline underline-offset-4"
          >
            Not now — back to the app
          </button>
        )}
      </div>
    </div>
  );
}
