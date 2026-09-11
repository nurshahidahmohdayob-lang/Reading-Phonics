/* The class lists as the school system has them.

   Only the tracker owner may call this, and the API key stays on the server.
   Returns the children who are in a Year 1–6 class and Active or Pending. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import { schoolStudents, StudentsApiNotConfigured } from "@/lib/studentsApi";

export async function GET() {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!isTrackerOwner(session?.email)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  try {
    const { students, guardians } = await schoolStudents();
    return NextResponse.json({ ok: true, students, guardians });
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
