/** Opens a child's reading-assessment result in a new tab as a clean,
    interactive, printable HTML report. Modelled on flashcardPrint.ts. */

export type ReportStrand = { label: string; weight: number; score: number | null };

export type ReportData = {
  studentName: string;
  dateStr: string;
  categoryLabel: string;
  categoryNote: string;
  categoryRange: string;
  categoryAbout: string;
  composite: number;
  accuracyBand: { pct: number; label: string; range: string; note: string } | null;
  levelGrade: string;
  term: number;
  lexile: string;
  lexileBand: string;
  age: number;
  strands: ReportStrand[];
  support: string[];
  practice: string[];
  running: {
    words: number;
    errors: number;
    selfCorrections: number;
    accuracy: number;
    wpm: number | null;
    wpmGoal: string;
    band: string;
  } | null;
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function barColor(score: number | null): string {
  if (score == null) return "#d4d4d8";
  if (score >= 80) return "#34d399";
  if (score >= 55) return "#fbbf24";
  return "#fb7185";
}

const STYLE = `
* { box-sizing: border-box; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; background: #f4f4f5; }
.bar { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #e4e4e7; padding: 10px 16px; }
.btn { border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 800; cursor: pointer; }
.btn.print { background: #e11d48; color: #fff; }
.btn.dl { background: #f1f5f9; color: #0f172a; }
.hint { font-size: 12px; color: #71717a; }
.page { max-width: 820px; margin: 18px auto; background: #fff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
h1 { font-size: 24px; margin: 0 0 2px; }
.sub { color: #71717a; font-weight: 600; font-size: 13px; }
.name { font-size: 30px; font-weight: 900; margin: 6px 0 0; }
.row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; }
.card { flex: 1 1 200px; border: 1px solid #e4e4e7; border-radius: 14px; padding: 14px 16px; }
.card .k { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: #a1a1aa; font-weight: 800; }
.card .v { font-size: 22px; font-weight: 900; margin-top: 2px; }
.card .vs { font-size: 12px; color: #71717a; font-weight: 700; margin-top: 2px; }
.section { margin-top: 22px; }
.section h2 { font-size: 16px; margin: 0 0 10px; }
.strand { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
.strand .lab { width: 170px; font-weight: 800; font-size: 13px; }
.strand .lab small { color: #a1a1aa; font-weight: 700; }
.track { flex: 1; height: 12px; background: #f4f4f5; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; border-radius: 999px; }
.strand .pct { width: 46px; text-align: right; font-weight: 800; font-size: 13px; }
.callout { border-radius: 14px; padding: 14px 16px; font-weight: 600; }
.callout.up { background: #d1fae5; color: #065f46; }
.callout.stay { background: #dbeafe; color: #1e3a8a; }
.callout.down { background: #fef3c7; color: #92400e; }
.callout .t { font-size: 17px; font-weight: 900; }
.callout .r { font-size: 13px; opacity: .9; margin-top: 3px; }
ul.tips { margin: 6px 0 0; padding-left: 20px; }
ul.tips li { margin: 5px 0; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; border-radius: 8px; padding: 3px 9px; font-weight: 800; font-size: 14px; }
.bandrow { border: 1px solid #e4e4e7; border-radius: 10px; padding: 8px 12px; margin-top: 6px; }
.bandrow.cur { border-color: #fb7185; box-shadow: 0 0 0 2px #fecdd3; }
.bandrow .bl { font-weight: 800; }
.bandrow .br { float: right; font-weight: 700; color: #71717a; font-size: 12px; }
.bandrow .curtag { color: #e11d48; font-weight: 800; font-size: 12px; margin-left: 8px; }
.bandrow .ba { font-size: 12px; color: #52525b; font-weight: 600; margin-top: 2px; }
.foot { margin-top: 18px; font-size: 11px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 10px; }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.stats { font-weight: 700; font-size: 13px; color: #3f3f46; margin: 0; }
@media (max-width: 640px) { .cols2 { grid-template-columns: 1fr; } }
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bar { display: none; }
  /* Fill the whole A4 page (297mm − 2×12mm margins = 273mm printable). */
  .page {
    box-shadow: none; margin: 0; border-radius: 0; max-width: none; padding: 0;
    min-height: 273mm; display: flex; flex-direction: column;
  }
  h1 { font-size: 26px; }
  .name { font-size: 32px; }
  .row { margin-top: 18px; }
  .card { padding: 16px 18px; }
  .section { margin-top: 26px; }
  .bandrow { padding: 11px 14px; margin-top: 10px; }
  .bandrow .ba { font-size: 13px; }
  .strand { margin: 13px 0; } .track { height: 14px; }
  ul.tips li { margin: 8px 0; font-size: 14px; }
  .support { flex: 1; }
  .section, .row, .cols2 { break-inside: avoid; }
}
`;

export function openReport(d: ReportData): void {
  if (typeof window === "undefined") return;

  const filename =
    (d.studentName || "student")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-reading-report.html";

  const strandRows = d.strands
    .map((s) => {
      const pct = s.score == null ? 0 : s.score;
      const label = s.score == null ? "—" : `${s.score}%`;
      return `<div class="strand">
        <div class="lab">${esc(s.label)} <small>${s.weight}%</small></div>
        <div class="track"><div class="fill" style="width:${pct}%;background:${barColor(s.score)}"></div></div>
        <div class="pct">${label}</div>
      </div>`;
    })
    .join("");

  const bandRow = (
    b: { label: string; range: string; about: string },
    cur: boolean,
  ) =>
    `<div class="bandrow${cur ? " cur" : ""}">
      <span class="bl">${b.label}</span><span class="br">${b.range}</span>${cur ? '<span class="curtag">★ this child</span>' : ""}
      <div class="ba">${esc(b.about)}</div>
    </div>`;

  const READER_BANDS = [
    { label: "Emerging Reader", range: "below 60%", about: "Just beginning — learning letter sounds and first words. Needs lots of support and very easy, decodable books." },
    { label: "Developing Reader", range: "60–74%", about: "Building decoding and fluency. Reads simple texts with guided practice and still meets many tricky words." },
    { label: "Instructional Reader", range: "75–89%", about: "Reads well with a little teaching support. The ideal zone for guided reading and learning new skills." },
    { label: "Independent Reader", range: "90–100%", about: "Reads this level smoothly and on their own, with strong understanding. Ready for more challenging books." },
  ];
  const readerLegend = READER_BANDS.map((b) =>
    bandRow(b, b.label === d.categoryLabel),
  ).join("");

  const ACC_BANDS = [
    { label: "Independent", range: "98–100%", about: "Reads accurately on their own — ready for harder books." },
    { label: "Instructional", range: "95–97%", about: "Reads with a little teaching support — the ideal level for guided reading." },
    { label: "Frustration", range: "below 95%", about: "Too many words missed — this text is too hard, so step down a level." },
  ];
  const accLegend = d.accuracyBand
    ? ACC_BANDS.map((b) => bandRow(b, b.label === d.accuracyBand!.label)).join("")
    : "";

  const tips = d.support.map((t) => `<li>${esc(t)}</li>`).join("");
  const chips = d.practice.map((w) => `<span class="chip">${esc(w)}</span>`).join("");

  const running = d.running
    ? `<p class="stats">${d.running.words} words · ${d.running.errors} errors · ${d.running.selfCorrections} self-corrections · ${d.running.accuracy}% (${esc(d.running.band)})${d.running.wpm != null ? ` · ${d.running.wpm} wpm (goal ${esc(d.running.wpmGoal)})` : ""}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(d.studentName)} — Reading Report</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="bar">
    <strong>Reading Report</strong>
    <button class="btn print" onclick="window.print()">🖨️ Print</button>
    <button class="btn dl" onclick="downloadPage()">⬇️ Download</button>
    <span class="hint">Use “Save as PDF” in the print dialog for a PDF copy.</span>
  </div>

  <div class="page">
    <h1>Reading Assessment Report 📋</h1>
    <div class="sub">${esc(d.dateStr)}</div>
    <div class="name">${esc(d.studentName)}</div>

    <div class="row">
      <div class="card"><div class="k">Reader level</div><div class="v">${esc(d.categoryLabel)}</div><div class="vs">Overall ${d.composite}% · ${esc(d.categoryRange)}</div></div>
      <div class="card"><div class="k">Reading level</div><div class="v">${esc(d.levelGrade)} · Term ${d.term}</div><div class="vs">Age ${d.age}</div></div>
      <div class="card"><div class="k">Lexile</div><div class="v">${esc(d.lexile)}</div><div class="vs">${esc(d.lexileBand)}</div></div>
    </div>

    <div class="cols2">
      <div class="section">
        <h2>Reader level: ${esc(d.categoryLabel)}</h2>
        <p style="font-weight:600;margin:0 0 8px">Overall ${d.composite}% — in the ${esc(d.categoryRange)} band.</p>
        ${readerLegend}
      </div>
      ${
        d.accuracyBand
          ? `<div class="section">
        <h2>Reading accuracy: ${d.accuracyBand.pct}%</h2>
        <p style="font-weight:600;margin:0 0 8px"><b>${esc(d.accuracyBand.label)} level (${esc(d.accuracyBand.range)}).</b></p>
        ${accLegend}
      </div>`
          : "<div></div>"
      }
    </div>

    <div class="cols2">
      <div class="section">
        <h2>What we measured</h2>
        ${strandRows}
      </div>
      ${d.running ? `<div class="section"><h2>Running record</h2>${running}</div>` : "<div></div>"}
    </div>

    <div class="section support">
      <h2>How to support ${esc(d.studentName)}</h2>
      <ul class="tips">${tips}</ul>
      ${chips ? `<div style="font-weight:800;margin-top:8px;font-size:13px">Practise these words:</div><div class="chips">${chips}</div>` : ""}
    </div>

  </div>

  <script>
    function downloadPage() {
      var doc = '<!doctype html>' + document.documentElement.outerHTML;
      var blob = new Blob([doc], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = ${JSON.stringify(filename)};
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups for this site to open the printable report.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
