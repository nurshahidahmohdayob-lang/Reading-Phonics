"use client";

/* A sign-in lasts a working day (SESSION_HOURS), but a class screen is often
   left open far longer — overnight, over a weekend. When it runs out the page
   still looks signed in, while every request to the server is refused.

   Any screen that gets a 401 back calls askToSignIn(), and the sign-in gate
   (components/AuthGate.tsx) puts up a "sign in again" bar over the app —
   without throwing away whatever is on screen, such as a child half-way
   through a story. */

export const SIGN_IN_NEEDED = "phonics-sign-in-needed";

export function askToSignIn(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SIGN_IN_NEEDED));
  }
}
