/* Lexile statistics for the Class Tracker.

   Turns saved assessment reports into the numbers the Statistics view draws:
   every child's Lexile measure, which reading band they sit in, and the class
   averages per term.

   The bands match lexileBand() in app/assessment.ts, so a child's band here is
   the same one printed on their report. */

import { studentKey } from "@/app/roster";
import type { TermNo, TrackerRecord, TrackerStore } from "./tracker";

export type LexBand = {
  /** Stable id, also the CSS variable suffix (--lex-1 … --lex-6). */
  key: string;
  label: string;
  /** Printed Lexile range, e.g. "300–499L". */
  range: string;
  /** Inclusive lower bound; the band runs up to the next band's low. */
  low: number;
  /** Plain-English hint for parents / teachers. */
  about: string;
};

/** Ordered easiest → hardest. Ranges mirror lexileBand() in app/assessment.ts. */
export const LEXILE_BANDS: LexBand[] = [
  {
    key: "1",
    label: "Emerging",
    range: "BR–99L",
    low: -Infinity,
    about: "First words and letter sounds",
  },
  {
    key: "2",
    label: "Early",
    range: "100–299L",
    low: 100,
    about: "Simple sentences, lots of pictures",
  },
  {
    key: "3",
    label: "Developing",
    range: "300–499L",
    low: 300,
    about: "Short stories, growing fluency",
  },
  {
    key: "4",
    label: "Independent",
    range: "500–699L",
    low: 500,
    about: "Early chapter books, reads alone",
  },
  {
    key: "5",
    label: "Advanced",
    range: "700–849L",
    low: 700,
    about: "Longer texts and richer vocabulary",
  },
  {
    key: "6",
    label: "Proficient",
    range: "850L+",
    low: 850,
    about: "Year 6 and beyond, reads to learn",
  },
];

/** The Lexile a report was filed at. "BR99" / "BR99L" count as 50 (Beginning). */
export function lexileValue(lexile: string): number | null {
  const s = (lexile || "").trim().toUpperCase();
  if (!s) return null;
  if (s.startsWith("BR")) return 50;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function bandOf(lex: number): LexBand {
  let band = LEXILE_BANDS[0];
  for (const b of LEXILE_BANDS) if (lex >= b.low) band = b;
  return band;
}

export type StudentResult = {
  name: string;
  year: string;
  yearKey: string;
  lexile: number;
  /** As printed on the report, e.g. "1010L" or "BR99". */
  lexileText: string;
  band: LexBand;
  record: TrackerRecord;
};

export type TermStats = {
  term: TermNo;
  /** Every assessed child in this scope, hardest reader first. */
  results: StudentResult[];
  /** Children in scope who have no report for this term. */
  missing: number;
  mean: number | null;
  median: number | null;
  min: StudentResult | null;
  max: StudentResult | null;
  /** One entry per band, easiest → hardest (empty bands included). */
  byBand: { band: LexBand; students: StudentResult[] }[];
};

export type Scoped = { name: string; year: string; yearKey: string };

/** Roll up one term for a set of students (a class, or every class). */
export function termStats(
  students: Scoped[],
  store: TrackerStore,
  term: TermNo,
): TermStats {
  const results: StudentResult[] = [];
  let missing = 0;

  for (const s of students) {
    const rec = store[studentKey(s.yearKey, s.name)]?.[term];
    const lex = rec ? lexileValue(rec.report.lexile) : null;
    if (!rec || lex === null) {
      missing++;
      continue;
    }
    results.push({
      name: s.name,
      year: s.year,
      yearKey: s.yearKey,
      lexile: lex,
      lexileText: rec.report.lexile,
      band: bandOf(lex),
      record: rec,
    });
  }

  results.sort((a, b) => b.lexile - a.lexile || a.name.localeCompare(b.name));

  const values = results.map((r) => r.lexile).sort((a, b) => a - b);
  const mean = values.length
    ? Math.round(values.reduce((n, v) => n + v, 0) / values.length)
    : null;
  const median = values.length
    ? values.length % 2
      ? values[(values.length - 1) / 2]
      : Math.round(
          (values[values.length / 2 - 1] + values[values.length / 2]) / 2,
        )
    : null;

  return {
    term,
    results,
    missing,
    mean,
    median,
    min: results.length ? results[results.length - 1] : null,
    max: results.length ? results[0] : null,
    byBand: LEXILE_BANDS.map((band) => ({
      band,
      students: results.filter((r) => r.band.key === band.key),
    })),
  };
}

/** Show a stored Lexile the way the reports do. */
export function lexileLabel(lex: number): string {
  return lex < 100 ? "BR99" : `${lex}L`;
}
