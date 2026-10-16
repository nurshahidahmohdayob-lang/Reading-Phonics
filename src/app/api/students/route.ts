/* The class lists as the school system has them.

   Only the tracker owner may call this, and the API key stays on the server.
   Returns the children who are in Year 1–6 and Active or Pending, and how
   many children's year groups are still being looked up (`checking`). */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import { schoolStudents, StudentsApiNotConfigured } from "@/lib/studentsApi";

// Up to a few dozen children's records are looked up per call.
export const maxDuration = 60;

export async function GET() {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  // An expired sign-in is the usual reason, and the page can fix that by
  // asking the teacher to sign in again — so say which it is.
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "signed-out" },
      { status: 401 },
    );
  }
  if (!isTrackerOwner(session.email)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Only the Class Tracker's owner can sync with the school system.",
      },
      { status: 403 },
    );
  }

  try {
    const { students, contacts, guardians, checking } = await schoolStudents();
    return NextResponse.json({ ok: true, students, contacts, guardians, checking });
  } catch (err) {
    if (err instanceof StudentsApiNotConfigured) {
      return NextResponse.json({ ok: false, configured: false });
    }
    return NextResponse.json(
      { ok: false, error: "The school system didn’t answer. Try again." },
      { status: 502 },
    );
  }
}
