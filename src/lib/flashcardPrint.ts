/**
 * Build a self-contained, interactive HTML page of flashcards and open it in a
 * new tab. The page works on its own (no app, no network):
 *
 *  - On screen: click a card to flip it (front: letter / picture, back: answer).
 *  - Print: a double-sided template — a page of fronts, then a page of backs
 *    whose card POSITIONS are mirrored left-right (so each back lands behind its
 *    own front after a long-edge duplex flip). The text itself is never
 *    mirrored — the mirroring is done by reordering cards, not flipping glyphs.
 *  - Download: saves the whole page as an .html file that stays interactive.
 */

export type PrintLine = { text: string; cls: "big" | "emoji" | "word" | "sub" };
export type PrintCard = { front: PrintLine[]; back: PrintLine[] };

/** Soft default if a card colour isn't provided. */
const DEFAULT_CARD_BG = "#EDE7FF";

/** 2 columns × 3 rows fit a portrait Letter/A4 sheet with margins. */
const COLS = 2;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLines(lines: PrintLine[]): string {
  return lines
    .map((l) => `<div class="${l.cls}">${esc(l.text)}</div>`)
    .join("");
}

/** Reverse the order of cards within each row, so the back page mirrors the
    front page column-for-column (for a long-edge duplex flip). */
function mirrorRows(items: string[]): string[] {
  const out: string[] = [];
  for (let r = 0; r < items.length; r += COLS) {
    out.push(...items.slice(r, r + COLS).reverse());
  }
  return out;
}

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
         margin: 0; background: #eef6ff; color: #2b2440; }

  /* ---- toolbar (screen only) ---- */
  .bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap;
         align-items: center; gap: 10px; justify-content: center;
         padding: 12px 16px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  .bar strong { font-size: 16px; }
  .btn { font-size: 15px; font-weight: 800; padding: 9px 18px; border: none;
         border-radius: 999px; cursor: pointer; color: #fff; }
  .btn.print { background: #8559d6; }
  .btn.dl { background: #14b8a6; }
  .hint { font-size: 12px; color: #8a86a0; max-width: 560px; }

  /* ---- interactive cards (screen only) ---- */
  h1 { text-align: center; margin: 18px 12px 4px; font-size: 22px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
          max-width: 920px; margin: 12px auto 40px; padding: 0 16px; }
  .card { perspective: 1200px; height: 300px; cursor: pointer; }
  .inner { position: relative; width: 100%; height: 100%;
           transition: transform .5s ease; transform-style: preserve-3d; }
  .card.flipped .inner { transform: rotateY(180deg); }
  .face { position: absolute; inset: 0; backface-visibility: hidden;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 14px; text-align: center;
          border-radius: 28px; border: 5px solid #fff;
          box-shadow: 0 8px 20px rgba(80,60,140,.18); padding: 16px; }
  .front { background: var(--cardbg, #ede7ff); color: #1f1a2e; }
  .back { background: #fff; color: #2b2440; transform: rotateY(180deg); }
  .big { font-size: 92px; font-weight: 900; line-height: 1; }
  .emoji { font-size: 92px; line-height: 1; }
  .word { font-size: 52px; font-weight: 900; }
  .sub { font-size: 18px; opacity: .82; }

  /* ---- printable double-sided template (print only) ---- */
  .print-only { display: none; }

  @media print {
    @page { margin: 0.4in; }
    /* Hide everything on-screen (and any 3D transforms) so only the flat,
       print template is ever rendered. */
    .bar, .grid, h1 { display: none !important; }
    body { background: #fff; }
    .print-only { display: block; }

    .sheet { page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }

    .pgrid { display: grid; grid-template-columns: repeat(${COLS}, 1fr); gap: 0.12in; }

    .pcard { height: 3in; border: 2px dashed #9aa; border-radius: 16px;
             display: flex; flex-direction: column; align-items: center;
             justify-content: center; gap: 6px; text-align: center; padding: 8px;
             break-inside: avoid; transform: none !important;
             -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* The front prints in the SAME pastel as on screen (dark text keeps it
       legible). Needs "Background graphics" enabled in the print dialog. */
    .pcard.front { background: var(--cardbg, #ede7ff);
                   -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pcard.empty { border: none; }
    .pcard .big { font-size: 58pt; font-weight: 900; line-height: 1; color: #1f1a2e; }
    .pcard .emoji { font-size: 52pt; line-height: 1; }
    .pcard .word { font-size: 30pt; font-weight: 900; }
    .pcard .sub { font-size: 11pt; opacity: .8; }
  }
`;

export function openFlashcards(
  title: string,
  cards: PrintCard[],
  cardBg?: string,
): void {
  if (typeof window === "undefined") return;

  const filename =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-flashcards.html";

  // Interactive cards for the screen.
  const screenCards = cards
    .map(
      (c) => `
      <div class="card" onclick="this.classList.toggle('flipped')">
        <div class="inner">
          <div class="face front">${renderLines(c.front)}</div>
          <div class="face back">${renderLines(c.back)}</div>
        </div>
      </div>`,
    )
    .join("");

  // Printable sheets: a fronts page, then a position-mirrored backs page.
  const empty = `<div class="pcard empty"></div>`;
  const sheets: string[] = [];
  for (let i = 0; i < cards.length; i += PER_PAGE) {
    const chunk = cards.slice(i, i + PER_PAGE);
    const fronts = chunk.map((c) => `<div class="pcard front">${renderLines(c.front)}</div>`);
    const backs = chunk.map((c) => `<div class="pcard back">${renderLines(c.back)}</div>`);
    while (fronts.length < PER_PAGE) fronts.push(empty);
    while (backs.length < PER_PAGE) backs.push(empty);
    sheets.push(`<section class="sheet"><div class="pgrid">${fronts.join("")}</div></section>`);
    sheets.push(`<section class="sheet"><div class="pgrid">${mirrorRows(backs).join("")}</div></section>`);
  }

  const cardVar = `:root{--cardbg:${esc(cardBg || DEFAULT_CARD_BG)};}`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — Flashcards</title>
  <style>${cardVar}${STYLE}</style>
</head>
<body>
  <div class="bar">
    <strong>${esc(title)}</strong>
    <button class="btn print" onclick="window.print()">🖨️ Print</button>
    <button class="btn dl" onclick="downloadPage()">⬇️ Download</button>
    <span class="hint">Tick <b>Background graphics</b> in the print dialog so the card colours print. Two-sided cards: set <b>Print on both sides</b> + <b>Flip on long edge</b> so fronts &amp; backs line up. Choose “Save as PDF” for a PDF.</span>
  </div>
  <h1>${esc(title)} — Flashcards</h1>
  <div class="grid">${screenCards}</div>
  <div class="print-only">${sheets.join("")}</div>
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
    alert("Please allow pop-ups for this site to open the printable flashcards.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
