/* Seed records for the Class Tracker — reading levels already collected on
   paper / another device, baked into the app so they appear everywhere.

   These are applied once per browser (see applySeed in lib/tracker.ts): they
   fill an empty term cell but never overwrite a real assessment, and their
   early savedAt means any later re-assessment wins. Add more entries here as
   levels come in; student names must match src/app/roster.ts exactly. */

import type { TrackerRecord } from "@/lib/tracker";
import type { ReportData } from "@/lib/reportPrint";

/** Build a minimal-but-valid record for a Year 6 word-check reading level. */
function y6(
  student: string,
  lexile: string,
  category: string,
  composite: number,
): TrackerRecord {
  const lex = parseInt(lexile, 10) || 0;
  const report: ReportData = {
    studentName: student,
    dateStr: "Term 1",
    categoryLabel: category,
    categoryNote: "",
    categoryRange:
      composite >= 90 ? "90–100%" : composite >= 75 ? "75–89%" : "60–74%",
    categoryAbout: "",
    composite,
    accuracyBand: null,
    beginning: false,
    levelGrade: "Year 6",
    term: 3,
    lexile,
    lexileBand: lex >= 850 ? "Proficient" : "Advanced",
    age: 11,
    strands: [
      { label: "Decoding accuracy", weight: 40, score: null },
      { label: "Fluency", weight: 30, score: null },
      { label: "Comprehension", weight: 30, score: null },
    ],
    support: [],
    practice: [],
    running: null,
  };
  return {
    student,
    year: "Year 6",
    yearKey: "y6",
    term: 1,
    savedAt: "2026-01-15T00:00:00Z",
    report,
  };
}

export const TRACKER_SEED: TrackerRecord[] = [
  y6("Bunny Ng Yu Shan", "1010L", "Instructional Reader", 82),
  y6("Chok Jie Yeo (Adrian)", "1050L", "Independent Reader", 92),
  y6("Hadif Hefny Bin Hasnor Hakim", "1050L", "Independent Reader", 92),
  y6("Nattania Rao A/P Jaganmohan", "1010L", "Instructional Reader", 82),
  y6("Neo Gao Jun", "1050L", "Instructional Reader", 82),
];
