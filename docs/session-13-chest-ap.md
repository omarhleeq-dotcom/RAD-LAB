# Session 13 — Chest AP (supine) implementation

**Governing authority:** BONTRAGER-9 p.96–97 (S10b-25). Decisions: `DECISIONS.md` S13-1 … S13-5 (plus S10b-*, S12-12 … S12-14). Everything clinical is **provisional** until the O5 review; numbers that are not Bontrager are labelled engine teaching choices.

## What was built (only S11 / S12 mechanisms; no new engine mechanism)
| Piece | Where |
|---|---|
| Exam `chest-ap-supine` (route `/{locale}/xray/chest-ap-supine[/practice]`) | `src/data/exams/xray/chest-ap-supine.ts`, registry `src/data/exams/index.ts` |
| Case `adult-demo` (continues the PA / lateral patient, now unable to stand; initial settings deliberately wrong) | `src/data/cases/chest-ap-supine.ts`, `index.ts` |
| Technique profile (PA profile; Arabic AEC labels with «الكاشف») | `chest-ap-technique.ts` |
| Baseline spec + landmarks (by eye) | `src/data/cases/chest-ap-radiograph.ts`; images A-008 / A-009 (NIH ChestX-ray14, secondary terms, O16) |
| Controls: `state` choice (S11-5), `tubeAngulationDeg` (S11-2), default `anatomical-side` marker rule | exam data |
| Scene id `chest-ap-supine`: the PA frontal detector view + `ApSupineView` (side view: supine / semi-erect, tube angle, SID) + AP cues; minimal, no polish (S12-14 / O13) | `features/positioning/*` |
| Result wording namespace `radiograph.ap.*` (`wordingNsOf`; the lateral namespace now uses the same helper) | `features/radiograph/wording.ts`, `ResultImage`, `RadiographEffects`, `ResultPanel` |

## Rules (weights = PA, S10b-14)
Positioning 25: projection ×2, position (supine) ×1, coverage ×2, excess ×1, shoulders ×1 (scored, not drawn), marker ×1 (patient's anatomical side, PA display). Rotation 20: magnitude only (S13-4). Centering 15: midline, T7, tube angle (~5° caudad; bands = teaching choice). Exposure 20: kVp, DI adequacy, dose awareness. SID 10. Breathing 10 (8–9 posterior ribs acceptable, not scored). Critical findings: wrong projection, motion, wrong-side marker, missing marker.

## Proof that Chest PA and Lateral are unchanged
`scripts/qa/characterisation/*`, `scripts/qa/golden/*`, `public/images/chest-pa|chest-lateral`, `assets/source/chest-pa|chest-lateral`, `src/data/exams/xray/chest-pa-*|chest-lateral-*`, `src/data/cases/chest-pa-*|chest-lateral-*`: no diff; `characterisation.test.ts` passes unchanged. The only existing test edited: `generalisation.test.ts` (the scene registry list gains `chest-ap-supine`). PA / Lateral components keep their output when the new optional props (`variant="ap"`, `ap`, `wording`) are absent.

## QA
`scripts/qa/ap-audit.mjs` (Playwright + axe, EN / AR × 1440 / 390): setup and result pages (axe WCAG 2 A / AA: no violations), no horizontal overflow, a fully correct attempt through the real UI scores 100 with no critical finding, a wrong attempt shows `missing-marker`.

## Not done (S13-5)
SID / position label on the image, landscape detector, manual-exposure enforcement, chin check, scapula / jaw overlays, semi-erect variant, credits page, AP direction rule (source needed); O19 (PA / Lateral plan view of a wrong AP choice).

## Fix round (S13-6, S13-7)
Rotation sign defined by the result image (checked, AP consistent, nothing changed; O17 closed, O19 opened); projection button labelled by the patient position through the optional `ChoiceControlSpec.projectionLabels` (data) — see `DECISIONS.md`.
