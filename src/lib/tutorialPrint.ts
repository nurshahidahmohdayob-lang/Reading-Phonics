/** Opens the "How to use this app" tutorial in a new tab as a clean, printable
    HTML page (with the tool screenshots), ready to Save as PDF. Modelled on
    reportPrint.ts. */

import {
  GUIDE_TOOLS,
  GUIDE_INTRO,
  ASSESSMENT_WALKTHROUGH,
  READER_BANDS,
} from "@/app/guideContent";

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
.btn.print { background: #f59e0b; color: #3a2a00; }
.btn.dl { background: #f1f5f9; color: #0f172a; }
.hint { font-size: 12px; color: #71717a; }
.page { max-width: 820px; margin: 18px auto; padding: 0 16px 40px; }
.hero { background: linear-gradient(135deg, #FFF4BD, #FFE1A6); border-radius: 18px; padding: 26px 28px; text-align: center; }
.hero .ic { font-size: 40px; }
h1 { font-size: 26px; margin: 6px 0 6px; }
.intro { color: #7c5a10; font-weight: 600; max-width: 560px; margin: 0 auto; }
.homeimg { display: block; width: 100%; max-width: 560px; margin: 16px auto 4px; border-radius: 14px; box-shadow: 0 1px 6px rgba(0,0,0,.12); }
.cap { font-size: 12px; color: #a1701f; font-weight: 600; }
.order { text-align: center; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #a1a1aa; margin: 22px 0 12px; }
.tool { background: #fff; border-radius: 16px; padding: 20px 22px; margin: 0 0 14px; box-shadow: 0 1px 4px rgba(0,0,0,.08); break-inside: avoid; page-break-inside: avoid; }
.thead { display: flex; align-items: center; gap: 12px; }
.emoji { width: 52px; height: 52px; flex: none; display: grid; place-items: center; font-size: 28px; background: #f4f4f5; border-radius: 14px; }
.thead h2 { font-size: 18px; margin: 0; }
.purpose { margin: 2px 0 0; color: #3f3f46; font-weight: 600; font-size: 14px; }
.shot { display: block; width: 100%; margin: 14px 0 0; border-radius: 12px; border: 1px solid #ececf0; }
ul { margin: 14px 0 0; padding: 0; list-style: none; }
li { background: #f8fafc; border-radius: 10px; padding: 8px 12px; margin: 0 0 7px; font-weight: 600; font-size: 14px; }
li::before { content: "•  "; color: #f59e0b; font-weight: 900; }
@media print {
  .bar { display: none; }
  body { background: #fff; }
  .page { margin: 0 auto; }
  .tool, .hero { box-shadow: none; border: 1px solid #ececf0; }
}
`;

export function openTutorial(): void {
  const origin = window.location.origin;

  const tools = GUIDE_TOOLS.map((t, i) => {
    const steps = t.steps.map((s) => `<li>${esc(s)}</li>`).join("");
    return `<section class="tool">
      <div class="thead">
        <span class="emoji">${t.emoji}</span>
        <div>
          <h2>${i + 1}. ${esc(t.label)}</h2>
          <p class="purpose">${esc(t.purpose)}</p>
        </div>
      </div>
      <img class="shot" src="${origin}/images/tutorial/${t.id}.jpg" alt="${esc(t.label)} screen" />
      <ul>${steps}</ul>
    </section>`;
  }).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>How to use Phonics Pals</title>
  <style>${STYLE}</style>
</head>
<body>
  <div class="bar">
    <strong>How to use this app</strong>
    <button class="btn print" onclick="window.print()">🖨️ Print</button>
    <button class="btn dl" onclick="downloadPage()">⬇️ Download</button>
    <span class="hint">Use “Save as PDF” in the print dialog for a PDF copy.</span>
  </div>

  <div class="page">
    <div class="hero">
      <div class="ic">📖</div>
      <h1>How to use this app</h1>
      <p class="intro">${esc(GUIDE_INTRO)}</p>
      <img class="homeimg" src="${origin}/images/tutorial/home.jpg" alt="The app home screen with all nine tools" />
      <div class="cap">The home screen — tap any tool to open it.</div>
    </div>

    <div class="order">Suggested order — sounds first, reading last</div>

    ${tools}
  </div>

  <script>
    function downloadPage() {
      var doc = '<!doctype html>' + document.documentElement.outerHTML;
      var blob = new Blob([doc], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'how-to-use-phonics-pals.html';
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
    alert("Please allow pop-ups for this site to open the printable tutorial.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/* ---------- Reading Assessment guide: one section per A4 page ---------- */

const BAND_HEX: Record<string, string> = {
  rose: "#e11d48",
  amber: "#d97706",
  sky: "#0284c7",
  emerald: "#059669",
};

const A4_STYLE = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; background: #f4f4f5; }
.bar { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #e4e4e7; padding: 10px 16px; z-index: 5; }
.btn { border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 800; cursor: pointer; }
.btn.print { background: #e11d48; color: #fff; }
.btn.dl { background: #f1f5f9; color: #0f172a; }
.hint { font-size: 12px; color: #71717a; }
.doc { max-width: 820px; margin: 18px auto; padding: 0 16px 40px; }
.sheet { background: #fff; border-radius: 18px; padding: 30px 34px; margin: 0 auto 16px; box-shadow: 0 1px 5px rgba(0,0,0,.09); }
.hero { background: linear-gradient(135deg, #FFE3E0, #FFC9C2); text-align: center; }
.hero .ic { font-size: 42px; }
.hero h1 { font-size: 26px; margin: 6px 0 8px; color: #7f1d1d; }
.hero .intro { color: #9f1239; font-weight: 600; max-width: 560px; margin: 0 auto; }
.mic { margin: 18px auto 0; max-width: 600px; text-align: left; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; font-size: 13.5px; font-weight: 600; color: #92400e; }
.step-head { display: flex; align-items: center; gap: 12px; }
.num { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; font-weight: 900; font-size: 18px; color: #fff; background: linear-gradient(140deg, #f43f5e, #7c3aed); }
.tag { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #0284c7; }
.step-head h2 { font-size: 19px; margin: 2px 0 0; }
.body { margin: 14px 0 0; font-size: 14.5px; font-weight: 600; color: #3f3f46; line-height: 1.55; }
.shot { display: block; width: 100%; margin: 16px auto 0; border-radius: 12px; border: 1px solid #ececf0; }
.cap { margin-top: 8px; text-align: center; font-size: 12px; font-weight: 700; color: #a1a1aa; }
.bands h2 { font-size: 20px; margin: 0 0 4px; }
.bands .sub { color: #71717a; font-weight: 600; font-size: 14px; margin: 0 0 14px; }
.band { border-radius: 12px; background: #f8fafc; padding: 12px 14px; margin: 0 0 9px; }
.band .top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.band .name { font-weight: 800; font-size: 15px; }
.band .range { font-size: 12px; font-weight: 800; color: #a1a1aa; }
.band .desc { margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #3f3f46; }
@media print {
  .bar { display: none; }
  body { background: #fff; }
  .doc { max-width: none; margin: 0; padding: 0; }
  .sheet {
    box-shadow: none; border-radius: 0; margin: 0;
    min-height: calc(297mm - 24mm);
    display: flex; flex-direction: column; justify-content: center;
    break-after: page; page-break-after: always;
  }
  .sheet:last-child { break-after: auto; page-break-after: auto; }
  .shot { max-height: 150mm; width: auto; max-width: 100%; }
}
`;

export function openAssessmentGuide(): void {
  const origin = window.location.origin;
  const total = ASSESSMENT_WALKTHROUGH.length;

  const steps = ASSESSMENT_WALKTHROUGH.map(
    (s, i) => `<section class="sheet">
      <div class="step-head">
        <span class="num">${i + 1}</span>
        <div>
          <div class="tag">${esc(s.tag)}</div>
          <h2>${esc(s.title)}</h2>
        </div>
      </div>
      <p class="body">${esc(s.body)}</p>
      <img class="shot" src="${origin}/images/tutorial/${s.img}.jpg" alt="${esc(s.title)}" />
      <div class="cap">Step ${i + 1} of ${total}</div>
    </section>`,
  ).join("");

  const bands = READER_BANDS.map(
    (b) => `<div class="band">
      <div class="top">
        <span class="name" style="color:${BAND_HEX[b.tone]}">${esc(b.band)}</span>
        <span class="range">${esc(b.range)}</span>
      </div>
      <div class="desc">${esc(b.desc)}</div>
    </div>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reading Assessment — Guide</title>
  <style>${A4_STYLE}</style>
</head>
<body>
  <div class="bar">
    <strong>Reading Assessment — guide</strong>
    <button class="btn print" onclick="window.print()">🖨️ Print</button>
    <button class="btn dl" onclick="downloadPage()">⬇️ Download</button>
    <span class="hint">Each section prints on its own A4 page. Use “Save as PDF” for a PDF copy.</span>
  </div>

  <div class="doc">
    <section class="sheet hero">
      <div class="ic">📋</div>
      <h1>Reading Assessment — step by step</h1>
      <p class="intro">A full read-aloud check that measures decoding, fluency and comprehension, then gives a reading level you can match straight to books. About five minutes per child.</p>
      <div class="mic">🎤 <b>Before you start:</b> open the app in <b>Google Chrome</b> and tap <b>Allow</b> on the microphone popup — the read-aloud needs it. No microphone? You can still type every score by hand.</div>
    </section>

    ${steps}

    <section class="sheet bands">
      <h2>What the reader levels mean</h2>
      <p class="sub">The accuracy % places the child in one of four bands — it tells you whether a book is just right, or too hard.</p>
      ${bands}
    </section>
  </div>

  <script>
    function downloadPage() {
      var doc = '<!doctype html>' + document.documentElement.outerHTML;
      var blob = new Blob([doc], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'reading-assessment-guide.html';
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
    alert("Please allow pop-ups for this site to open the printable guide.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
