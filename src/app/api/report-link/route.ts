/* Make short links for reports (see lib/shortLinks.ts).

   POST { reports: ReportData[] } -> { ok: true, ids: string[] }, one id per
   report, in order. Tracker owner only. Without cloud storage it answers
   { ok: false, configured: false } and the client uses the long links. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";
import { isTrackerOwner } from "@/lib/trackerAccess";
import { shortLinksReady, saveReportLink } from "@/lib/shortLinks";
import type { ReportData } from "@/lib/reportPrint";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!isTrackerOwner(session?.email)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }
  if (!shortLinksReady()) {
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: { reports?: ReportData[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }
  const reports = Array.isArray(body.reports) ? body.reports.slice(0, 500) : [];
  if (
    !reports.length ||
    reports.some((r) => !r || typeof r.studentName !== "string")
  ) {
    return NextResponse.json(
      { ok: false, error: "bad request" },
      { status: 400 },
    );
  }

  try {
    const ids = await Promise.all(reports.map((r) => saveReportLink(r)));
    return NextResponse.json({ ok: true, ids });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn’t save the links. Try again." },
      { status: 502 },
    );
  }
}
