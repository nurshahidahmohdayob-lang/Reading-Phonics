/* Can the app send email as this teacher, and has she connected her mailbox?

   GET    -> { configured, connected, account }
   DELETE -> forget the connected mailbox */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import {
  connectedAccount,
  disconnectMailbox,
  mailConfigured,
} from "@/lib/msGraph";

async function owner(): Promise<string | null> {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  return isTrackerOwner(session?.email) ? (session?.email ?? null) : null;
}

export async function GET() {
  const email = await owner();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  if (!mailConfigured()) {
    return NextResponse.json({ ok: true, configured: false, connected: false });
  }
  const account = await connectedAccount(email).catch(() => null);
  return NextResponse.json({
    ok: true,
    configured: true,
    connected: !!account,
    account,
  });
}

export async function DELETE() {
  const email = await owner();
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  await disconnectMailbox(email);
  return NextResponse.json({ ok: true });
}
