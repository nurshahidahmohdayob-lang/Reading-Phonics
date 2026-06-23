# Reading Assessment — Validity & Reliability Reference

A cited comparison of this app's Reading Assessment against the major reading
assessments schools use, plus what we can/can't claim and the study needed to
claim "valid and reliable" with evidence.

> All figures below were gathered by a multi-source deep-research pass and
> adversarially verified (3-vote, 0 refuted) against the primary technical
> manuals and peer-reviewed sources listed at the end.

## What this app's assessment is

An **Informal Reading Inventory (IRI) / running-record–style** classroom
screener. It measures oral reading **accuracy**, **fluency (WCPM)**,
**comprehension** and **vocabulary**; uses the **Betts 98% / 95%**
independent / instructional / frustration thresholds; asks **8 four-option
comprehension questions** per ~100-word passage; maps to approximate
Lexile/grade bands; and is teacher- or speech-recognition-scored. Composite
weighting: **Accuracy 40 / Fluency 30 / Comprehension 30** (comprehension
includes vocabulary). It is **not normed and not yet empirically validated**.

## The bars everyone is measured against

- **NCII (National Center on Intensive Intervention)** rates screeners on five
  dimensions: reliability, validity, classification accuracy, bias, sample
  representativeness.
  - Full **reliability** rating: CI lower bound around the median reliability **≥ 0.70**.
  - Full **validity** rating: each validity-correlation CI lower bound **≥ 0.60**.
  - Full **classification accuracy**: **AUC ≥ 0.80** with **sensitivity & specificity ≥ 0.80**.
- Field conventions: **kappa ≥ .70 = "strong agreement"**; **.90+ "excellent",
  .80+ "good"** reliability. Rule of thumb: **≥ .80 for screening, ≥ .90 for
  high-stakes individual decisions.**

## Per-assessment numbers (verified against primary sources)

| Assessment | Reliability | Validity | Norm-ref? | NCII verdict |
|---|---|---|---|---|
| **STAR Reading** (Renaissance) | IRT-adaptive → no Cronbach's α; split-half / CSEM instead. **CSEM ≈ 16–17 scaled units** | **Meta-analysis: 789 correlations, N≈2.95M, overall validity 0.79**; concurrent ~0.74, predictive 0.71–0.80. AUC 0.84–0.93 | **Yes** — 2024 norms from **6,405,124 students** | **Convincing** reliability (gr 1–11) & validity |
| **DIBELS 8 ORF** (U. Oregon) | **Test–retest median .91** (.86–.94); alt-form **.92 to >.99**; **inter-rater ICC .994 / .992 / .996** (gr 1/2/3) | Concurrent w/ DIBELS Next **.75–.91**; w/ Iowa Total Reading **.50–.83**; predictive **.45–.82**. **SEM 5–13 WCPM** | **Yes** (national CTL norms) | **Reliability: full bubble all grades.** Validity: **half (gr 1–5), empty (gr 6–8)** |
| **Acadience Reading ORF** | **Inter-rater .97–.99** (shadow-scored); alt-form **.91–.97** (gr 1–6), .66 (K) | Concurrent **.73–.80** (gr 1–6); predictive **.48–.80**; AUC **0.88–0.92** (gr 3–6) | **Yes** — norms from **~1,780,000 students** | ORF reliability **convincing** (gr 3–6); validity convincing gr 3–5, partial gr 6 |
| **F&P BAS** | **No published reliability coefficients found** | Not reported by publisher | **No** | Not on NCII chart; **APM Reports (2023): BAS "often wrong"** |
| **DRA2** | Same IRI/leveling class — **no robust published coefficients** | Not reported | **No** | — |

## The key finding for *this* tool

This app is **not** in STAR/DIBELS's class (those are normed, standardized,
protocol/computer-scored). It is an **IRI / leveling / running-record** tool, so
the honest benchmark is the published reliability of *that* class — which is
**modest**:

- **"Benchmarking/levelling assessments (e.g., F&P BAS, DRA2) are a form of IRI
  that are not standardised, and publishers do not always evaluate or report
  their validity and reliability."** (Nomanis; echoed by APM Reports)
- **Single-passage running records are not reliable.** A generalizability study
  found **each student must read ≥ 3 passages** for a reliable score; passages
  matter more than raters. (J. Educational Research)
- **Instructional-level placement is shaky:** across three books all leveled at a
  student's instructional level, categorical placements agreed only **~67–70%**
  of the time, **kappa < .50**; **over half of the lowest-skilled students
  actually read at frustration level** on "instructional" books. (Burns et al.
  2015, J. School Psychology)
- **Teacher scoring is inconsistent:** when **114 teachers scored an identical
  pre-coded running record**, accuracy varied widely, especially in
  interpretation. (J. Early Childhood Literacy)
- Published IRI alternate-form reliabilities: **Basic Reading Inventory only
  .64 / .72 / .73** (ind/inst/frust). The stronger **QRI-4**: comprehension
  reliabilities **all > .80, 75% ≥ .90**, alternate forms agree on instructional
  level **71–84%** — a realistic ceiling for a *well-built* IRI.

**Implication:** this app can credibly aim for the QRI-style ceiling
(comprehension reliability ~.80, level agreement ~70–85%). The single-passage
placement weakness is real; the **adaptive book-trials** partly mitigate it by
adding reading samples — the right instinct.

## What we can / cannot claim today

- ✅ **Can claim:** content-valid informal classroom screener built on recognized
  Betts thresholds and a defensible 40/30/30 weighting; useful for placement,
  grouping, book-matching, and progress monitoring.
- ❌ **Cannot yet claim:** "valid and reliable" as a *measured* property, nor
  equivalence to F&P / Lexile / grade levels — there are **no empirical
  coefficients yet** (the same gap the established IRIs are criticized for).

## The validation study that would let us claim it (target numbers)

1. **Test–retest reliability** — re-assess the same ~50–100 students per grade
   band **2–4 weeks apart** → target **r ≥ .80** (DIBELS clears .91).
2. **Inter-rater reliability** — two raters score the same readings → target
   **ICC ≥ .90 or kappa ≥ .70** (Acadience clears .97–.99; this is where IRIs
   fail, so prioritize it).
3. **Alternate-form reliability** — the two passages per level → target
   **r ≥ .80**, level-agreement **≥ 75%** (QRI ~71–84%).
4. **Concurrent / criterion validity** — assess the same students with **STAR,
   DIBELS, or a state test** → target correlation with **CI lower bound ≥ .60**
   (NCII's bar; STAR's own validity is .79).
5. **Classification accuracy** — against an "at-risk" criterion → target
   **AUC ≥ .80, sensitivity & specificity ≥ .80**.
6. **Sample** — NCII-style screening evidence generally wants **n ≥ 100 per
   grade**; a credible pilot can start at ~50/grade.

Hit #1–#4 and the tool can defensibly state "reliability ≥ .80, validity ≥ .60,
consistent with published IRIs" — **with data**, which is the only thing that
converts "well-designed" into "valid and reliable."

## Sources (all fetched & verified)

- STAR Reading Technical Manual (FL): https://flfast.org/content/contentresources/en/SRRPTechnicalManual_FL.pdf
- Renaissance STAR meta-analysis: https://research.renaissance.com/research/133
- DIBELS 8 Technical Manual: https://dibels.uoregon.edu/sites/default/files/DIBELS8-TechnicalManual_04152020.pdf
- DIBELS 8 Research Brief 1801: https://dibels.uoregon.edu/sites/default/files/DIBELS8thEdition_TechRpt1801_ResearchBrief.pdf
- Acadience Reading K–6 Norms / Technical Report 32: https://acadiencelearning.org/wp-content/uploads/2026/01/AcadienceReadingK-6_NormsTechReport32.pdf
- NCII Academic Screening Tools Chart: https://charts.intensiveintervention.org/ascreening
- NCII chart resource + standards overviews: https://intensiveintervention.org/resource/academic-screening-tools-chart · https://intensiveintervention.org/resource/screening-standards-overviews
- F&P BAS critique (APM Reports, 2023): https://www.apmreports.org/story/2023/12/11/benchmark-assessment-system-reading-test-often-wrong
- Burns et al. 2015 (IRI instructional-level reliability): https://www.sciencedirect.com/science/article/abs/pii/S0022440515000709
- Running-record generalizability study (J. Educational Research): https://www.tandfonline.com/doi/abs/10.3200/JOER.100.2.113-126
- Teacher running-record scoring accuracy (J. Early Childhood Literacy): https://journals.sagepub.com/doi/abs/10.1177/14687984211027198
- Critical analysis of eight IRIs (Reading Rockets): https://www.readingrockets.org/topics/assessment-and-evaluation/articles/critical-analysis-eight-informal-reading-inventories
- Critical analysis of eight IRIs (ERIC EJ883879): https://eric.ed.gov/?id=EJ883879
- Benchmarking/levelling critique (Nomanis): https://www.nomanis.com.au/blog/single-post/benchmarking-assessments-and-levelling-should-be-consigned-to-history

---

*Research method: 5 search angles → 19 sources fetched → 77 claims extracted →
25 adversarially verified (3-vote, 0 refuted). Generated for the
`reading-phonics` project.*
