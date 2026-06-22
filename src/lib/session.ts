/**
 * Tiny stateless session: a signed token stored in an httpOnly cookie.
 * Server-side only — never import this into a client component. The token is
 * `base64url(payload).base64url(HMAC-SHA256(payload))`, signed with
 * SESSION_SECRET so it can't be forged or tampered with.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "pp_session";

export type Session = {
  /** Staff id from the API. */
  sub: string | number;
  /** Display name shown in the app. */
  name: string;
  email: string;
  /** Expiry, unix seconds. */
  exp: number;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", secret()).update(data).digest());
}

/** Hours a session lasts (env-configurable, default 12). */
export function sessionHours(): number {
  const n = Number(process.env.SESSION_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

/** Build a signed token for a staff member. */
export function createToken(
  staff: { sub: string | number; name: string; email: string },
): { token: string; maxAge: number } {
  const maxAge = Math.floor(sessionHours() * 3600);
  const payload: Session = { ...staff, exp: Math.floor(Date.now() / 1000) + maxAge };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return { token: `${body}.${sign(body)}`, maxAge };
}

/** Verify a token and return its session, or null if invalid/expired. */
export function verifyToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);
  // Constant-time compare; bail if lengths differ.
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Session;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}
