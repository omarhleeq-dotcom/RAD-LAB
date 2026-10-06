# Session 12 — Chest Lateral (erect) implementation

**Governing authority:** BONTRAGER-9 p.84–85, 94 (S10b-25). Decisions: `DECISIONS.md` S12-1 … S12-11 (plus S10b-*). Everything clinical here is **provisional** until the O5 review; numbers that are not Bontrager are labelled engine teaching choices.

## What was built (only S11 mechanisms; no new engine mechanism)
| Piece | Where |
|---|---|
| Exam `chest-lateral-erect` (route `/{locale}/xray/chest-lateral-erect[/practice]`) | `src/data/exams/xray/chest-lateral-erect.ts`, registry `src/data/exams/index.ts` |
| Case `adult-demo` (the patient story continues the PA case; baseline is a different person, S12-4) | `src/data/cases/chest-lateral-erect.ts`, `index.ts` |
| Technique profile (PA profile + lateral AEC layout / evidence wording) | `chest-lateral-technique.ts` |
| Baseline asset spec + landmarks (read by eye) | `src/data/cases/chest-lateral-radiograph.ts`; image A-006 / A-007 |
| Marker rule `detector-side`, choice controls `side` and `arms`, per-projection attenuation, scene registry entry `chest-lateral` | S11 mechanisms |
| Critical finding `arms-over-lungs` (detector registry) | `features/evaluation/critical.ts` |
| Scene: the PA positioning view with `variant="lateral"` (hand-drawn `LateralFigure`, lateral cue panel, lateral texts) | `features/positioning/*` |
| Result image: lateral baseline, rotation drawn as doubled posterior chest wall; lateral message namespaces | `plan.ts`, `pipeline.ts`, `tuning.ts`, `ResultImage`, `RadiographEffects`, `messages/*.json` |

Small generic additions the Lateral needed (all optional, PA declares none): `RadiographAssetSpec.projection?` (representative = simulated projection equals it; absent = PA), `composeCase` carries `choiceControls` only when declared, `TUNING.rotation.separation*`, `lateralSeparation()` (used only for an asset with no `midlineU`).

## Rules and scoring (weights = PA, S10b-14)
Positioning 25: projection ×2, side against the detector ×1 (left expected), coverage clipping ×2 / excess ×1, chin ×1, arms ×1, marker ×1 (scored from S12). Rotation 20: magnitude only, ±2° / ±5° (S12-8). Centering 15: mid-thorax and T7 (provisional tolerances = PA). Exposure 20: kVp (110–125 full; partial bands are teaching choices), DI adequacy, dose awareness, AEC explanation (central chamber). SID 10: 180–185 full (183 minimum; 185 and 150–200 are teaching choices). Breathing 10 (second full inspiration wording). Critical findings: wrong projection, patient motion, wrong marker, missing marker, arms not raised.

## Proof that Chest PA is unchanged
- `scripts/qa/characterisation/*`, `scripts/qa/golden/*`, `public/images/chest-pa/*`, `assets/source/chest-pa/*`, `src/data/exams/xray/chest-pa-*.ts`, `src/data/cases/chest-pa-*.ts`: **no diff** (`git diff main --stat -- <paths>` is empty); `characterisation.test.ts` (53 scenarios: score, verdict, checks, EN / AR feedback and alt text, render plan, render hash, composed case, golden checksums) passes unchanged.
- The only existing tests edited: `visual-model.test.ts` (the lateral plan-sign line, intended, S12-9) and `generalisation.test.ts` (registry lists now include the Lateral scene and detector).
- PA-exam DOM: the PA figure is wrapped in a fragment only; `PositioningView` / `DetectorWorkspace` / `PatientCues` keep their PA output when the new optional props are absent. The PA Playwright matrix (desktop + mobile, EN + AR) was re-run against the production build.

## QA
`scripts/qa/lateral-audit.mjs` (Playwright + axe; EN/AR × desktop 1440 / mobile 390): hub, set-up and result pages (axe WCAG 2 A/AA: no violations), no horizontal overflow, a fully correct attempt driven through the real UI scores 100 with no critical finding, a wrong attempt shows `arms-over-lungs` and `wrong-side-marker`.

## Not done / future (S12-6, S12-11)
CR / receptor lowering for broad shoulders (S10b-24), wheelchair / cart variants, required right lateral cases, chin / arm overlays, lean control, anatomy cut-off and gross-exposure critical findings, lateral inspiration rib rule, validated landmarks, real (educator-checked) rotation appearance.
