/* Service worker for the installed app.

   Deliberately small. Next.js gives its build files hashed, permanent names
   under /_next/static, so those are safe to serve from the cache forever —
   that's what makes a second launch quick. Everything else (pages, the API,
   sign-in) goes to the network as usual, so nothing can go stale and a
   deploy is picked up straight away. */

const CACHE = "phonics-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from earlier versions of this worker.
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build assets, fonts and images: serve from cache, fill it on first use.
  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|svg|webp|woff2?|mp3)$/.test(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    (async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })(),
  );
});
