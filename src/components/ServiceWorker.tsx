"use client";

/* Registers public/sw.js, which caches the build's static files so the
   installed app opens quickly. Pages and the API always go to the network,
   so a new deploy is live immediately. */

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // The dev server reuses the same /_next/static names between edits, so
    // the worker's cache-forever rule would pin the page to old code. In
    // development, take away any worker and cache left from before instead.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => caches.keys())
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .catch(() => {});
      return;
    }
    const register = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* unsupported or blocked — the app works the same without it */
        });
    // After load, so it never competes with the first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
