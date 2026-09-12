import type { MetadataRoute } from "next";

/* Makes the site installable: teachers can add it to a phone, tablet or
   laptop home screen and open it like an app — its own icon, no browser bars,
   and it updates itself on every deploy. */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Phonics Pals & Guided Reading",
    short_name: "Phonics Pals",
    description:
      "Playful phonics, guided reading and the class reading tracker for Zera International School.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#A6D9FF",
    theme_color: "#0A4F29",
    categories: ["education"],
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        // Android crops icons to its own shape; this one keeps the crest
        // inside the safe zone so nothing is cut off.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
