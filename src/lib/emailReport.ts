"use client";

/* Email a child's reading report to their parent.

   There's no mail server behind the app, so this does the two things a
   teacher would otherwise do by hand: it saves the report as a file, then
   opens their own mail app (Gmail, Outlook, Mail…) with the parent's address,
   a subject and a written summary already filled in. The teacher attaches the
   saved file and presses send — so the message always comes from the school
   account, never from the app. */

import { downloadReport, reportFilename, type ReportData } from "./reportPrint";
import type { TermNo } from "./tracker";

/** The written summary that goes in the body of the email. */
export function emailBody(
  d: ReportData,
  term: TermNo,
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
    `Lexile measure: ${d.lexile}${d.lexileBand ? ` (${d.lexileBand})` : ""}`,
  );
  if (!d.beginning) lines.push(`Book level: ${d.levelGrade}`);
  lines.push("");
  lines.push("What these two numbers mean:");
  lines.push(
    "- Lexile is WHAT your child can read — how difficult a text they can handle. A bigger number means harder books.",
  );
  lines.push(
    "- The score % is HOW WELL they read the passage in front of them: accuracy 40%, fluency 30%, understanding 30%.",
  );
  lines.push(
    "- The two do not have to match. A higher Lexile with a lower score means your child is reading harder text but not yet smoothly — exactly where guided reading helps most.",
  );

  const tips = d.support.slice(0, 3);
  if (tips.length) {
    lines.push("");
    lines.push(`How you can help ${d.studentName} at home:`);
    for (const t of tips) lines.push(`- ${t}`);
  }
  if (d.practice.length) {
    lines.push("");
    lines.push(`Words to practise: ${d.practice.slice(0, 10).join(", ")}`);
  }

  lines.push("");
  lines.push(
    `The full report is attached as ${reportFilename(d)} — open it in any web browser to see the charts, and use Print > Save as PDF if you'd like a PDF copy.`,
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

/** Save the report, then open the teacher's mail app with it written up. */
export function emailReport(
  to: string,
  d: ReportData,
  term: TermNo,
  teacherName?: string,
): void {
  if (typeof window === "undefined") return;
  downloadReport(d); // so there's a file to attach
  const href =
    `mailto:${encodeURIComponent(to)}` +
    `?subject=${encodeURIComponent(emailSubject(d, term))}` +
    `&body=${encodeURIComponent(emailBody(d, term, teacherName))}`;
  // A beat, so the download starts before the mail app takes focus.
  setTimeout(() => {
    window.location.href = href;
  }, 400);
}
