/* Send the reports. One message per parent, from the teacher's own mailbox.

   POST { messages: [{ to: string[], subject, body }] }
     -> { ok: true, results: [{ ok, to, error? }] }
     -> { ok: false, configured: false }  no Microsoft setup yet
     -> { ok: false, connected: false }   mailbox not connected yet */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import { mailConfigured, sendAs, type Outgoing } from "@/lib/msGraph";

const MAX = 200;

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!isTrackerOwner(session?.email) || !session?.email) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  if (!mailConfigured()) {
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: { messages?: Outgoing[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }

  const messages = (Array.isArray(body.messages) ? body.messages : []).slice(
    0,
    MAX,
  );
  const valid =
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        Array.isArray(m.to) &&
        m.to.length > 0 &&
        m.to.every((a) => typeof a === "string" && /.+@.+\..+/.test(a)) &&
        typeof m.subject === "string" &&
        typeof m.body === "string",
    );
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }

  const sent = await sendAs(session.email, messages);
  if (!sent.ok) {
    if (sent.error === "not connected") {
      return NextResponse.json({ ok: false, connected: false });
    }
    return NextResponse.json({ ok: false, error: sent.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, results: sent.results });
}
