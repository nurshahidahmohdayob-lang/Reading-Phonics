/* "What these numbers mean" — the panel that explains Lexile vs score.

   One source of wording and layout, shared by the child's report and the
   class statistics report (and mirrored in the app's Statistics view). Both
   scales are laid out as a list, one band per line, so they can be scanned
   rather than read. */

export const LEXILE_SCALE: [string, string][] = [
  ["BR–99L", "Emerging"],
  ["100–299L", "Early"],
  ["300–499L", "Developing"],
  ["500–699L", "Independent"],
  ["700–849L", "Advanced"],
  ["850L+", "Proficient"],
];

export const SCORE_SCALE: [string, string][] = [
  ["90–100%", "Independent"],
  ["75–89%", "Instructional"],
  ["60–74%", "Developing"],
  ["below 60%", "Emerging"],
];

export const EXPLAINER_CSS = `
.explain { background: #f5fafe; border: 1px solid #cfe6f7; border-radius: 14px; padding: 16px 18px; margin-top: 24px; }
.explain .eh { font-weight: 800; font-size: 15px; color: #0b4a6f; }
.explain .esub { font-size: 12px; font-weight: 600; color: #5b7f96; margin-top: 2px; }
.explain .egrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
.explain .ebox { background: #fff; border: 1px solid #dceaf5; border-radius: 12px; padding: 12px 14px; }
.explain .et { font-weight: 800; font-size: 14px; color: #0b4a6f; }
.explain .eq { font-size: 12px; font-weight: 800; color: #2b7fb8; text-transform: uppercase; letter-spacing: .03em; margin-top: 1px; }
.explain .ed { margin: 7px 0 0; font-size: 12.5px; font-weight: 600; color: #33556a; line-height: 1.45; }
.explain .scale { width: 100%; border-collapse: collapse; margin-top: 9px; }
.explain .scale td { padding: 3px 0; font-size: 12px; border-top: 1px solid #eef5fa; }
.explain .scale tr:first-child td { border-top: 0; }
.explain .scale .k { font-weight: 800; color: #0b4a6f; white-space: nowrap; width: 84px; }
.explain .scale .v { font-weight: 600; color: #5b7f96; text-align: right; }
.explain .ecmp { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.explain .case { background: #fff; border: 1px solid #dceaf5; border-radius: 10px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; color: #33556a; line-height: 1.45; }
.explain .case b { display: block; color: #0b4a6f; font-size: 12.5px; margin-bottom: 2px; }
.explain .efoot { margin: 10px 0 0; font-size: 12px; font-weight: 600; color: #5b7f96; }
@media (max-width: 640px) {
  .explain .egrid, .explain .ecmp { grid-template-columns: 1fr; }
}
`;

function scaleRows(rows: [string, string][]): string {
  return rows
    .map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`)
    .join("");
}

/** `who` is "your child" on a parent's report, "the child" on a class one. */
export function explainerHtml(who: "your child" | "the child"): string {
  return `<div class="explain">
  <div class="eh">👪 What these numbers mean</div>
  <div class="esub">Two different measures — read them together.</div>

  <div class="egrid">
    <div class="ebox">
      <div class="et">Lexile</div>
      <div class="eq">what ${who} can read</div>
      <p class="ed">How difficult a text ${who} can handle, measured from the word check. A bigger number means harder books.</p>
      <table class="scale">${scaleRows(LEXILE_SCALE)}</table>
    </div>
    <div class="ebox">
      <div class="et">Score %</div>
      <div class="eq">how well they read it</div>
      <p class="ed">How they read the passage in front of them — accuracy 40%, fluency 30%, understanding 30%. This score is what names the reader level.</p>
      <table class="scale">${scaleRows(SCORE_SCALE)}</table>
    </div>
  </div>

  <div class="ecmp">
    <div class="case"><b>Higher Lexile · lower score</b>Reading harder text, but not yet smoothly — exactly the level where guided reading helps most.</div>
    <div class="case"><b>Lower Lexile · higher score</b>Reading this level confidently and with understanding — ready to be stretched.</div>
  </div>

  <p class="efoot">So the two are not meant to match. <b>Accuracy level</b>, where it is shown, is narrower still — just the words read correctly in this one passage.</p>
</div>`;
}
