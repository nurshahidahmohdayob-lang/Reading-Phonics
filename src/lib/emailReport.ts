"use client";

/* Email a child's reading report to their parent.

   There's no mail server behind the app, so this opens a compose window with
   the parent's address, a subject and the message already written — including
   a link that opens that one child's report in a browser. The teacher presses
   send, so the message goes from their own mailbox, never from the app.

   Which mailbox is the point of lib/mailPrefs.ts: by default it composes in
   Outlook on the web, signed in as the school account, rather than handing
   the message to whatever mail app the computer happens to use.

   The link carries the report inside it (see lib/reportLink.ts): no sign-in,
   no attachment to lose, and it can't reach any other child's report. */

import type { ReportData } from "./reportPrint";
import { displayLexile } from "./lexileStats";
import { reportLink } from "./reportLink";
import { composeUrl, readMailVia } from "./mailPrefs";
import type { TermNo } from "./tracker";

/** The written summary that goes in the body of the email. */
export function emailBody(
  d: ReportData,
  term: TermNo,
  link: string,
  teacherName?: string,
): string {
  const lines: string[] = [];
  lines.push("Dear Parent/Guardian,");
  lines.push("");
  // dateStr is usually the assessment date, but a report filed from paper can
  // hold "Term 2" — don't repeat the term back at the parent.
  const when =
    d.dateStr && !/^term\s*\d/i.test(d.dateStr.trim()) ? ` (${d.dateStr})` : "";
  lines.push(
    `Here is ${d.studentName}'s reading assessment for Term ${term}${when}.`,
  );
  lines.push("");
  lines.push(
    `Reader level: ${d.categoryLabel} — overall score ${d.composite}%`,
  );
  lines.push(
    `Lexile measure: ${displayLexile(d.lexile)}${d.lexileBand ? ` (${d.lexileBand})` : ""}`,
  );
  if (!d.beginning) lines.push(`Book level: ${d.levelGrade}`);
  lines.push("");
  lines.push(`Open ${d.studentName}'s full report here:`);
  lines.push(link);
  lines.push(
    "It opens in any web browser — no sign-in needed — and the Print button there will save it as a PDF if you'd like to keep a copy.",
  );
  lines.push("");
  lines.push("Kind regards,");
  if (teacherName) lines.push(teacherName);
  lines.push("Phonics Pals & Guided Reading · Zera International School");
  return lines.join("\n");
}

export function emailSubject(d: ReportData, term: TermNo): string {
  return `Reading report — ${d.studentName} · Term ${term}`;
}

/** Open a compose window with the message and the parent's link ready. */
export async function emailReport(
  to: string,
  d: ReportData,
  term: TermNo,
  teacherName?: string,
  from?: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const link = await reportLink(d);
  const via = readMailVia();
  const url = composeUrl(
    via,
    to,
    emailSubject(d, term),
    emailBody(d, term, link, teacherName),
    from,
  );
  // The web mailboxes open in their own tab; the desktop app takes over here.
  if (via === "app") window.location.href = url;
  else window.open(url, "_blank", "noopener");
}

/** Put just the parent link on the clipboard — for WhatsApp, webmail, etc. */
export async function copyReportLink(d: ReportData): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const link = await reportLink(d);
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    // Clipboard blocked (older browser, or no permission) — show it instead.
    window.prompt("Copy this link for the parent:", link);
    return false;
  }
}
