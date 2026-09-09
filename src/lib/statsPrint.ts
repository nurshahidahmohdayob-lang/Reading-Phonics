/** Opens the class reading statistics as a clean, printable HTML page in a new
    tab — the same numbers and charts as the Statistics view, laid out for
    sharing and for “Save as PDF”. Modelled on reportPrint.ts. */

import { LEXILE_BANDS, lexileLabel, type TermStats } from "./lexileStats";

/** The ordinal Lexile ramp, light → dark (same values as globals.css). */
const RAMP = ["#7cc39a", "#59b183", "#3f9a6b", "#2c8154", "#1d6740", "#0a4f29"];
/** Where each band starts — drawn as hairlines behind the per-child bars. */
const MARKS = [100, 300, 500, 700, 850];

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STYLE = `
* { box-sizing: border-box; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; background: #f4f4f5; }
.bar { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #e4e4e7; padding: 10px 16px; z-index: 5; }
.btn { border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 800; cursor: pointer; }
.btn.print { background: #0a4f29; color: #fff; }
.btn.dl { background: #f1f5f9; color: #0f172a; }
.hint { font-size: 12px; color: #71717a; }
.page { max-width: 900px; margin: 18px auto; background: #fff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
h1 { font-size: 24px; margin: 0 0 2px; }
.sub { color: #71717a; font-weight: 600; font-size: 13px; }
.scope { font-size: 30px; font-weight: 900; margin: 6px 0 0; }
.row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.card { flex: 1 1 160px; border: 1px solid #e4e4e7; border-radius: 14px; padding: 12px 14px; }
.card .k { font-size: 10px; letter-spacing: .04em; text-transform: uppercase; color: #a1a1aa; font-weight: 800; }
.card .v { font-size: 20px; font-weight: 900; margin-top: 2px; }
.card .vs { font-size: 11px; color: #71717a; font-weight: 700; margin-top: 2px; }
.section { margin-top: 24px; }
.section h2 { font-size: 16px; margin: 0 0 2px; }
.section .note { font-size: 12px; color: #71717a; font-weight: 600; margin: 0 0 10px; }

/* charts */
.brow { display: flex; align-items: center; gap: 12px; margin: 7px 0; }
.brow .lab { width: 150px; flex: none; font-weight: 800; font-size: 12px; }
.brow .lab small { display: block; color: #a1a1aa; font-weight: 700; font-size: 10px; }
.brow .track { position: relative; flex: 1; height: 16px; display: flex; align-items: center; }
.brow .fill { position: relative; z-index: 1; height: 13px; border-radius: 0 4px 4px 0; }
.brow .val { width: 96px; flex: none; text-align: right; font-weight: 800; font-size: 12px; }
.brow .val small { color: #a1a1aa; font-weight: 700; margin-left: 4px; }
.brow .zero { color: #d4d4d8; }
.mark { position: absolute; top: 0; bottom: 0; width: 1px; background: #f1f1f3; }
.axis { display: flex; align-items: center; gap: 12px; margin-top: 2px; }
.axis .ln { position: relative; flex: 1; height: 14px; border-top: 1px solid #f1f1f3; }
.axis .tk { position: absolute; top: 2px; transform: translateX(-50%); font-size: 9px; font-weight: 700; color: #d4d4d8; }
.delta { font-size: 10px; font-weight: 800; margin-left: 5px; }
.delta.up { color: #059669; } .delta.down { color: #b45309; } .delta.same { color: #a1a1aa; }

/* band groups */
.group { border: 1px solid #e4e4e7; border-radius: 12px; padding: 10px 12px; margin-top: 8px; }
.group .gh { font-weight: 800; font-size: 13px; }
.group .gr { color: #a1a1aa; font-weight: 700; font-size: 11px; margin-left: 6px; }
.group .ga { font-size: 11px; color: #71717a; font-weight: 600; margin-top: 1px; }
.names { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
.chip { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 3px 9px; font-weight: 800; font-size: 12px; }
.chip small { color: #a1a1aa; margin-left: 5px; }
.dot { display: inline-block; width: 9px; height: 9px; border-radius: 999px; margin-right: 6px; vertical-align: middle; }

/* table */
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #a1a1aa; border-bottom: 1px solid #e4e4e7; padding: 6px 8px; }
td { padding: 6px 8px; border-bottom: 1px solid #f4f4f5; font-weight: 600; }
td.num, th.num { text-align: right; }

/* explainer */
.explain { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 12px 16px; margin-top: 24px; }
.explain .eh { font-weight: 800; font-size: 14px; color: #075985; }
.explain .egrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
.explain .ebox { background: #fff; border: 1px solid #bae6fd; border-radius: 10px; padding: 9px 12px; }
.explain .et { font-weight: 800; font-size: 13px; color: #075985; }
.explain .ebox p { margin: 3px 0 0; font-size: 12px; font-weight: 600; color: #0c4a6e; }
.explain .escale { color: #0369a1 !important; font-size: 11px !important; font-weight: 700 !important; }
.explain .enote { margin: 9px 0 0; font-size: 12px; font-weight: 600; color: #0c4a6e; }
.foot { margin-top: 18px; font-size: 11px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 10px; }
@media (max-width: 640px) {
  .page { padding: 20px 16px; }
  .explain .egrid { grid-template-columns: 1fr; }
  .brow .lab { width: 100px; }
  .brow .val { width: 74px; }
}
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bar { display: none; }
  .page { box-shadow: none; margin: 0; border-radius: 0; max-width: none; padding: 0; }
  .section, .row, .explain, .group { break-inside: avoid; }
  tr { break-inside: avoid; }
}
`;

export type StatsReportData = {
  /** "Year 2" or "All classes". */
  scopeLabel: string;
  term: number;
  stats: TermStats;
  /** Mean Lexile change vs Term 1, for children assessed in both. */
  growth: { delta: number; n: number };
  /** Per-child change since their last assessed term, keyed "yearKey:name". */
  deltas: Record<string, number>;
};

export function openStatsReport(d: StatsReportData): void {
  if (typeof window === "undefined") return;

  const { stats, scopeLabel, term } = d;
  const assessed = stats.results.length;
  const dateStr = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const filename = `${scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-term-${term}-reading-statistics.html`;

  const maxCount = Math.max(1, ...stats.byBand.map((b) => b.students.length));
  const axisMax = Math.max(
    500,
    Math.ceil(Math.max(0, ...stats.results.map((r) => r.lexile)) / 100) * 100,
  );
  const marks = MARKS.filter((m) => m < axisMax);
  const markSpans = marks
    .map(
      (m) => `<span class="mark" style="left:${(m / axisMax) * 100}%"></span>`,
    )
    .join("");
  const axis = `<div class="axis"><span class="lab" style="width:150px;flex:none"></span>
    <span class="ln">${marks.map((m) => `<span class="tk" style="left:${(m / axisMax) * 100}%">${m}L</span>`).join("")}</span>
    <span class="val" style="width:96px;flex:none"></span></div>`;

  // Chart 1 — children per band.
  const bandRows = stats.byBand
    .map((b, i) => {
      const n = b.students.length;
      const pct = assessed ? Math.round((n / assessed) * 100) : 0;
      return `<div class="brow">
        <div class="lab"><span class="dot" style="background:${RAMP[i]}"></span>${esc(b.band.label)}<small>${esc(b.band.range)}</small></div>
        <div class="track">${n ? `<div class="fill" style="width:${Math.max(4, (n / maxCount) * 100)}%;background:${RAMP[i]}"></div>` : ""}</div>
        <div class="val${n ? "" : " zero"}">${n}${n ? `<small>${pct}%</small>` : ""}</div>
      </div>`;
    })
    .join("");

  // Chart 2 — every child's own Lexile.
  const childRows = stats.results
    .map((r) => {
      const i = LEXILE_BANDS.findIndex((b) => b.key === r.band.key);
      const dl = d.deltas[`${r.yearKey}:${r.name}`];
      const delta =
        dl === undefined
          ? ""
          : `<span class="delta ${dl > 0 ? "up" : dl < 0 ? "down" : "same"}">${dl > 0 ? "+" : dl < 0 ? "−" : "±"}${Math.abs(dl)}L</span>`;
      return `<div class="brow">
        <div class="lab">${esc(r.name)}${scopeLabel === "All classes" ? `<small>${esc(r.year)}</small>` : ""}</div>
        <div class="track">${markSpans}<div class="fill" style="width:${Math.max(2, (r.lexile / axisMax) * 100)}%;background:${RAMP[i]}"></div></div>
        <div class="val">${esc(r.lexileText)}${delta}</div>
      </div>`;
    })
    .join("");

  // Children grouped into their bands, hardest first.
  const groups = [...stats.byBand]
    .map((b, i) => ({ ...b, colour: RAMP[i] }))
    .filter((b) => b.students.length)
    .reverse()
    .map(
      (b) => `<div class="group">
        <div><span class="dot" style="background:${b.colour}"></span><span class="gh">${esc(b.band.label)}</span><span class="gr">${esc(b.band.range)} · ${b.students.length} child${b.students.length === 1 ? "" : "ren"}</span></div>
        <div class="ga">${esc(b.band.about)}</div>
        <div class="names">${b.students.map((s) => `<span class="chip">${esc(s.name)}<small>${esc(s.lexileText)}</small></span>`).join("")}</div>
      </div>`,
    )
    .join("");

  const tableRows = stats.results
    .map(
      (r) => `<tr>
      <td>${esc(r.name)}</td>
      <td>${esc(r.year)}</td>
      <td>${esc(r.lexileText)}</td>
      <td>${esc(r.band.label)} <span style="color:#a1a1aa">${esc(r.band.range)}</span></td>
      <td>${esc(r.record.report.categoryLabel)}</td>
      <td class="num">${r.record.report.composite}%</td>
      <td>${esc(r.record.savedAt.slice(0, 10))}</td>
    </tr>`,
    )
    .join("");

  const topBand = stats.byBand.reduce((best, b) =>
    b.students.length > best.students.length ? b : best,
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(scopeLabel)} — Reading Statistics, Term ${term}</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="bar">
    <strong>Reading Statistics</strong>
    <button class="btn print" onclick="window.print()">🖨️ Print</button>
    <button class="btn dl" onclick="downloadPage()">⬇️ Download</button>
    <span class="hint">Use “Save as PDF” in the print dialog for a PDF copy.</span>
  </div>

  <div class="page">
    <h1>Class Reading Statistics 📊</h1>
    <div class="sub">Term ${term} · ${esc(dateStr)}</div>
    <div class="scope">${esc(scopeLabel)}</div>

    <div class="row">
      <div class="card"><div class="k">Assessed</div><div class="v">${assessed}</div><div class="vs">of ${assessed + stats.missing} children</div></div>
      <div class="card"><div class="k">Class median</div><div class="v">${stats.median === null ? "—" : esc(lexileLabel(stats.median))}</div><div class="vs">average ${stats.mean === null ? "—" : esc(lexileLabel(stats.mean))}</div></div>
      <div class="card"><div class="k">Range</div><div class="v">${stats.min && stats.max ? `${esc(lexileLabel(stats.min.lexile))}–${esc(lexileLabel(stats.max.lexile))}` : "—"}</div><div class="vs">${stats.max ? `highest: ${esc(stats.max.name)}` : ""}</div></div>
      <div class="card"><div class="k">${term === 1 ? "Most common" : "Growth vs Term 1"}</div><div class="v">${
        term === 1
          ? esc(topBand.band.label)
          : d.growth.n
            ? `${d.growth.delta >= 0 ? "+" : "−"}${Math.abs(d.growth.delta)}L`
            : "—"
      }</div><div class="vs">${
        term === 1
          ? `${topBand.students.length} children`
          : d.growth.n
            ? `${d.growth.n} child${d.growth.n === 1 ? "" : "ren"} compared`
            : "needs Term 1 results"
      }</div></div>
    </div>

    <div class="section">
      <h2>Reading levels across the class</h2>
      <p class="note">${esc(scopeLabel)} · Term ${term} · children per Lexile band</p>
      ${bandRows}
    </div>

    <div class="section">
      <h2>Every child’s Lexile level</h2>
      <p class="note">Highest reader first${term > 1 ? " · the small number is the change since their last assessed term" : ""}</p>
      ${childRows}
      ${axis}
    </div>

    <div class="section">
      <h2>Children by reading level</h2>
      ${groups}
    </div>

    <div class="section">
      <h2>All results</h2>
      <table>
        <thead><tr><th>Student</th><th>Class</th><th>Lexile</th><th>Lexile band</th><th>Reader category</th><th class="num">Score</th><th>Assessed</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <div class="explain">
      <div class="eh">👪 What these numbers mean</div>
      <div class="egrid">
        <div class="ebox">
          <div class="et">Lexile / band — <i>what</i> they can read</div>
          <p>The difficulty of text the child can handle, measured from the word check. Bigger number = harder books.</p>
          <p class="escale">BR–99L Emerging · 100–299L Early · 300–499L Developing · 500–699L Independent · 700–849L Advanced · 850L+ Proficient</p>
        </div>
        <div class="ebox">
          <div class="et">Score % — <i>how well</i> they read it</div>
          <p>How they read the passage in front of them: accuracy 40%, fluency 30%, understanding 30%. This score names the reader category.</p>
          <p class="escale">90–100% Independent · 75–89% Instructional · 60–74% Developing · below 60% Emerging</p>
        </div>
      </div>
      <p class="enote"><b>The two do not have to match.</b> A <b>higher Lexile with a lower score</b> means the child is reading harder text but not yet smoothly — the level where guided reading helps most. A <b>lower Lexile with a high score</b> means they read their level confidently and are ready to be stretched.</p>
    </div>

    <div class="foot">Phonics Pals &amp; Guided Reading · Zera International School · generated ${esc(dateStr)}</div>
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
    alert("Please allow pop-ups for this site to open the statistics report.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
