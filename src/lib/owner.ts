"use client";

/* Whose drawings these are.

   A class computer is signed into by whoever is teaching in that room, and
   the next teacher should not find last lesson's drawings waiting for them,
   nor be able to delete them. So everything a teacher scans is filed under
   an owner key, derived from the address they signed in with.

   The key is a hash, not the address itself: a shared machine's storage is
   readable by anyone who opens the browser's developer tools, and a staff
   email address does not need to sit there in plain sight. It is stable for
   the same address on every device, which is all the app needs of it. */

const GUEST = "guest";

let cached: Promise<string> | null = null;

async function hashed(email: string): Promise<string> {
  const text = `phonics-drawings:${email}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    return Array.from(new Uint8Array(digest).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Somewhere without the crypto API (an old browser, or plain http): still
  // separate one teacher from another, just not as unguessably.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `x${h.toString(16)}`;
}

async function lookUp(): Promise<string> {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return GUEST;
    const data = await res.json();
    const email =
      typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
    return email ? await hashed(email) : GUEST;
  } catch {
    // Offline, or the session has gone: keep them in their own corner rather
    // than tipping their drawings into somebody else's.
    return GUEST;
  }
}

/** The signed-in teacher's own key. Asked for once per page. */
export function currentOwner(): Promise<string> {
  cached ??= lookUp();
  return cached;
}

/** Forget who it was — on signing out, so the next teacher starts clean. */
export function forgetOwner(): void {
  cached = null;
}
