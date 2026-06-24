import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  findActiveStaffByEmail,
  staffName,
  StaffApiNotConfigured,
} from "@/lib/staffApi";
import { createToken, SESSION_COOKIE } from "@/lib/session";

/** Constant-time string compare (hash first so length never leaks). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim() : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    /* fall through to validation below */
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Shared staff password — checked BEFORE the directory lookup so outsiders
  // can't probe which emails are active staff without knowing the password.
  const expected = process.env.STAFF_PASSWORD;
  if (!expected) {
    return Response.json(
      { ok: false, error: "Sign-in isn't set up yet. Ask your administrator." },
      { status: 503 },
    );
  }
  if (!password || !safeEqual(password, expected)) {
    return Response.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 },
    );
  }

  let staff;
  try {
    staff = await findActiveStaffByEmail(email);
  } catch (err) {
    if (err instanceof StaffApiNotConfigured) {
      return Response.json(
        { ok: false, error: "Sign-in isn't set up yet. Ask your administrator." },
        { status: 503 },
      );
    }
    return Response.json(
      { ok: false, error: "We couldn't reach the staff directory. Try again." },
      { status: 502 },
    );
  }

  if (!staff) {
    return Response.json(
      {
        ok: false,
        error: "That email isn't an active staff member at this school.",
      },
      { status: 401 },
    );
  }

  const name = staffName(staff);
  const { token, maxAge } = createToken({
    sub: staff.id,
    name,
    email: staff.email ?? email,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return Response.json({ ok: true, name });
}
