/** One child's guided read (components/GuidedReadReport) as a clean A4 page
    in a new tab, ready to print or save as a PDF. The report works out what
    to show; this only lays it out. Modelled on reportPrint.ts. */

import type { ReadDetail } from "./guidedReadInsights";

export type GuidedReadPrint = {
  name: string;
  year: string;
  date: string;
  title: string;
  emoji: string;
  /** "Year 4 · 830L" */
  levelLine: string;
  verdict: {
    label: string;
    grade: string;
    meaning: string;
    kind: "independent" | "instructional" | "developing";
  } | null;
  stats: { label: string; value: string; note: string; met: boolean | null }[];
  /** The story with its marks; or the plain story with a note; or nothing
      (with a note) when the story isn't on this device. */
  story:
    | { kind: "marked"; words: string[]; missed: number[]; reached: number }
    | { kind: "plain"; text: string; note: string }
    | { kind: "missing"; note: string };
  /** Words to practise, when the marks were kept; null when they weren't. */
  practice: string[] | null;
  /** The summary, figures, word patterns, progress and next steps. */
  detail?: ReadDetail;
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const VERDICT_COLOURS = {
  independent: ["#dcfce7", "#166534"],
  instructional: ["#fef3c7", "#92400e"],
  developing: ["#ffe4e6", "#9f1239"],
} as const;

export function guidedReadHtml(d: GuidedReadPrint): string {
  const verdict = d.verdict
    ? `<div class="verdict" style="background:${VERDICT_COLOURS[d.verdict.kind][0]};color:${VERDICT_COLOURS[d.verdict.kind][1]}">
        <b>${esc(d.verdict.label)}</b> for a ${esc(d.verdict.grade)} story — ${esc(d.verdict.meaning)}
      </div>`
    : "";

  const stats = d.stats
    .map(
      (s) => `<div class="stat">
        <div class="slabel">${esc(s.label)}</div>
        <div class="svalue">${esc(s.value)}</div>
        ${s.note ? `<div class="snote ${s.met === null ? "" : s.met ? "met" : "unmet"}">${s.met ? "✓ " : ""}${esc(s.note)}</div>` : ""}
      </div>`,
    )
    .join("");

  let story = "";
  if (d.story.kind === "marked") {
    const { words, reached } = d.story;
    const missed = new Set(d.story.missed);
    const text = words
      .map((w, i) =>
        missed.has(i)
          ? `<span class="miss">${esc(w)}</span>`
          : i >= reached
            ? `<span class="unread">${esc(w)}</span>`
            : esc(w),
      )
      .join(" ");
    story = `<h3>The story, as they read it</h3>
      <p class="story">${text}</p>
      <p class="legend"><span><span class="miss">word</span> couldn't read it</span>${
        reached < words.length
          ? `<span><span class="unread">word</span> didn't reach it</span>`
          : ""
      }</p>`;
  } else if (d.story.kind === "plain") {
    story = `<h3>The story they read</h3>
      <p class="story">${esc(d.story.text)}</p>
      <p class="legend">${esc(d.story.note)}</p>`;
  } else {
    story = `<p class="missing">${esc(d.story.note)}</p>`;
  }

  const x = d.detail;
  const practice =
    d.practice === null
      ? ""
      : `<h3>Words to practise</h3>${
          !d.practice.length
            ? `<p class="allgood">🎉 Every word they read, they read correctly.</p>`
            : x
              ? `<div class="words">${x.words
                  .map(
                    (w) => `<div class="wordrow"><span class="chip">${esc(w.word)}</span><ul>${
                      w.patterns.length
                        ? w.patterns.map((p) => `<li><b>${esc(p.label)}</b> — ${esc(p.tip)}</li>`).join("")
                        : "<li>Practise it as a whole word: read it, spell it, read it again.</li>"
                    }</ul></div>`,
                  )
                  .join("")}</div>${
                  x.wordSummary.length ? `<p class="legend">In common: ${esc(x.wordSummary.join("; "))}.</p>` : ""
                }`
              : `<div class="chips">${d.practice.map((w) => `<span class="chip">${esc(w)}</span>`).join("")}</div>`
        }`;

  const top = x
    ? `<div class="summary"><b>Summary.</b> ${esc(x.summary)}</div>
      <h3>The reading in detail</h3>
      <dl class="facts">${x.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>`
    : "";
  const bottom = x
    ? `${
        x.history
          ? `<h3>Progress</h3>${x.history.change ? `<p class="change">${esc(x.history.change)}</p>` : ""}
        <table class="hist"><thead><tr><th>Date</th><th>Story</th><th>Level</th><th class="r">Accuracy</th><th class="r">Words / min</th></tr></thead><tbody>${x.history.rows
          .map(
            (r) => `<tr${r.current ? ' class="cur"' : ""}><td>${esc(r.date)}</td><td>${esc(r.title)}${r.current ? " (this read)" : ""}</td><td>${esc(r.grade)}</td><td class="r">${r.accuracy}%</td><td class="r">${r.wcpm}</td></tr>`,
          )
          .join("")}</tbody></table>`
          : ""
      }
      <h3>Next steps</h3>
      <ol class="steps">${x.nextSteps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.name)} — ${esc(d.title)} — Reading report</title>
<style>
* { box-sizing: border-box; }
html, body { margin: 0; background: #f4f4f5; color: #27272a;
  font-family: ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif; }
.bar { position: sticky; top: 0; display: flex; justify-content: center; gap: 10px;
  padding: 12px; background: #0A4F29; }
.bar button { border: 0; border-radius: 999px; padding: 10px 22px; font: inherit;
  font-weight: 800; font-size: 15px; cursor: pointer; background: #fff; color: #0A4F29; }
.page { max-width: 800px; margin: 24px auto; padding: 40px 44px; background: #fff;
  border-radius: 24px; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
.kicker { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .06em;
  text-transform: uppercase; color: #a1a1aa; }
.name { margin: 4px 0 0; font-size: 30px; font-weight: 800; }
.when { margin: 2px 0 0; font-size: 15px; font-weight: 600; color: #71717a; }
.title { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 18px; }
.title b { font-size: 20px; }
.pill { border-radius: 999px; background: #f4f4f5; padding: 3px 12px; font-size: 13px;
  font-weight: 700; color: #71717a; }
.verdict { margin-top: 14px; border-radius: 16px; padding: 12px 16px; font-size: 16px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
.stat { border-radius: 16px; background: #fafafa; border: 1px solid #f0f0f0; padding: 12px;
  text-align: center; }
.slabel { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: #a1a1aa; }
.svalue { margin-top: 2px; font-size: 30px; font-weight: 800; }
.snote { margin-top: 2px; font-size: 12px; font-weight: 700; color: #a1a1aa; }
.snote.met { color: #059669; }
.snote.unmet { color: #e11d48; }
h3 { margin: 24px 0 0; font-size: 15px; font-weight: 800; color: #52525b; }
.story { margin: 8px 0 0; border-radius: 16px; background: #fffbeb; padding: 16px 18px;
  font-size: 17px; font-weight: 600; line-height: 1.75; }
.miss { border-radius: 4px; background: #f43f5e; color: #fff; padding: 0 3px;
  text-decoration: line-through; text-decoration-thickness: 2px; }
.unread { color: #d4d4d8; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; margin: 6px 0 0; font-size: 12px;
  font-weight: 600; color: #a1a1aa; }
.missing { margin-top: 20px; border-radius: 16px; background: #fafafa; padding: 12px 16px;
  font-size: 14px; font-weight: 600; color: #71717a; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip { border-radius: 999px; background: #fef3c7; color: #92400e; padding: 4px 14px;
  font-size: 15px; font-weight: 700; }
.summary { margin-top: 16px; border-radius: 16px; background: #f0f9ff; color: #0c4a6e;
  padding: 12px 16px; font-size: 14px; font-weight: 600; line-height: 1.6; }
.facts { margin: 8px 0 0; border: 1px solid #f0f0f0; border-radius: 16px; }
.facts div { display: flex; gap: 16px; padding: 7px 14px; border-top: 1px solid #f4f4f5; }
.facts div:first-child { border-top: 0; }
.facts dt { width: 150px; flex-shrink: 0; font-size: 11px; font-weight: 800; letter-spacing: .06em;
  text-transform: uppercase; color: #a1a1aa; padding-top: 2px; }
.facts dd { margin: 0; font-size: 14px; font-weight: 600; }
.words { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.wordrow { display: flex; gap: 12px; align-items: flex-start; border-radius: 14px;
  background: #fffbeb; padding: 10px 12px; break-inside: avoid; }
.wordrow ul { margin: 0; padding: 0; list-style: none; font-size: 12.5px; font-weight: 600; color: #52525b; }
.wordrow .chip { flex-shrink: 0; }
.change { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #52525b; }
.hist { width: 100%; margin-top: 8px; border-collapse: collapse; font-size: 12.5px; font-weight: 600; }
.hist th { text-align: left; font-size: 10px; font-weight: 800; letter-spacing: .06em;
  text-transform: uppercase; color: #a1a1aa; padding: 6px 8px; background: #fafafa; }
.hist td { padding: 5px 8px; border-top: 1px solid #f4f4f5; color: #52525b; }
.hist .r { text-align: right; }
.hist tr.cur td { background: #fffbeb; color: #27272a; font-weight: 800; }
.steps { margin: 8px 0 0; padding-left: 22px; font-size: 14px; font-weight: 600; line-height: 1.55; }
.steps li { margin-top: 4px; }
.steps li::marker { color: #059669; font-weight: 800; }
.allgood { margin: 6px 0 0; font-size: 14px; font-weight: 600; color: #047857; }
@media print {
  @page { size: A4; margin: 14mm; }
  html, body { background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bar { display: none; }
  .page { box-shadow: none; margin: 0; padding: 0; border-radius: 0; max-width: none; }
  .story, .stats, .verdict, .summary, .facts, .hist, h3 { break-inside: avoid; }
  h3 { break-after: avoid; }
}
</style>
</head>
<body>
<div class="bar"><button onclick="window.print()">🖨️ Print or save as PDF</button></div>
<main class="page">
  <p class="kicker">Reading report</p>
  <h1 class="name">${esc(d.name)}</h1>
  <p class="when">${esc(d.year)} · ${esc(d.date)}</p>
  <div class="title"><b>${esc(d.emoji)} ${esc(d.title)}</b><span class="pill">${esc(d.levelLine)}</span></div>
  ${verdict}
  <div class="stats">${stats}</div>
  ${top}
  ${story}
  ${practice}
  ${bottom}
</main>
<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });</script>
</body>
</html>`;
}

/** Open the report in a new tab and bring up the print dialog. */
export function printGuidedRead(d: GuidedReadPrint): void {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to print the report.");
    return;
  }
  win.document.open();
  win.document.write(guidedReadHtml(d));
  win.document.close();
}
