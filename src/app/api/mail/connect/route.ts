/* Start connecting the teacher's Zera mailbox: send them to Microsoft to
   sign in and allow the app to send mail as them. Microsoft returns them to
   /api/mail/callback. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import { authorizeUrl, mailConfig, mailConfigured } from "@/lib/msGraph";

export async function GET() {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!isTrackerOwner(session?.email) || !session?.email) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  const cfg = mailConfig();
  if (!cfg || !mailConfigured()) {
    return NextResponse.json({ ok: false, configured: false });
  }
  const url = await authorizeUrl(cfg, session.email);
  return NextResponse.redirect(url);
}
