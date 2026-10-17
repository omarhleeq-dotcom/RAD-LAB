# Session 14.2b — Hand PA + Hand Lateral (extension) exams (and Elbow reference, phase 2)

Reference: [`RAD-LAB_Medical_Reference_Hand.md`](../../RAD-LAB_Medical_Reference_Hand.md) (S14.2a). Decisions: `DECISIONS.md` S14.2-6 … S14.2-11, O39 … O41; elbow: S14.3-1 … S14.3-4, O42 … O44.

## 1. Built
- `hand-pa` (Bontrager p.150) and `hand-lateral` (p.153, **extension** variant, S14.2-6): left hand, 31-year-old male, 24 × 30 cm detector, manual technique only, categories 28 / 22 / 17 / 22 / 11, critical findings = missing / wrong-side marker, letter-only `fixed-side` marker (L).
- Data: one builder `src/data/exams/xray/hand-common.ts` (+ `hand-technique.ts`, `hand-geometry.ts`), cases `src/data/cases/hand-*.ts`, scene `HandFigure.tsx` + `HandSideView.tsx` + `hand-visual.ts`, strings `messages/*` (`positioningHand`, `sceneHand`, `radiograph.hand-*`).
- Baselines A-014 … A-017 (owner-attached, **owner-verified CC0**; Commons API HTTP 429 twice, O39); burned-in text removed by a documented fill (S14.2-7, `scripts/derive-hand-baselines.py`).

## 2. Rules and values
Source-backed (Bontrager): CR targets (PA third MCP; lateral centre of MCP 2–5), perpendicular CR, SID minimum 102 cm, receptor, non-grid, digital kV 60 ± 5 / 65 ± 5, coverage "entire hand and wrist plus about 2.5 cm of distal forearm", true-PA / true-lateral criteria. Teaching choices (named in the feedback text and `REVIEW_PACKAGE.md` S14.2b-R1…R13): kV partial bands, SID bands, centring tolerances, excess margins (PA 3.5 / lateral 6.5 cm, O40), rotation ±2° / ±5°, scale 0.0113 cm / px, region lower edge, manual reference point. No exposure-appearance wording (O35).

## 3. Shared code (small, optional, byte-identical for chest and wrist)
`LimbRotationLandmarks` kinds `hand-pa` / `hand-lateral` (`domain/radiograph.ts`), `LimbRotationPlan.kind`, `limbRotationConcept` / `limbRotationPlan` branches (`limb-effects.ts`), `handPaSpacingShiftU` + two branches in `limbRotationValue` (`pipeline.ts`), two constants in `tuning.ts`; registry entries (exams, cases, projections, `BODY_PART_IDS`, `SCENE_IDS`, `SCENES`, detector figures, layouts). Existing-test edit: `generalisation.test.ts` scene list (recipe §3B, accepted precedent S-STD-2).

## 4. Proof of no regression
`git diff origin/main` over `scripts/qa/characterisation`, `scripts/qa/golden`, `scripts/qa/scene-dom/hashes.json` + `wrist-hashes.json`, chest / wrist images and masters, chest / wrist exam, case and test files is empty; `messages/*.json` only gained keys (checked key by key). `characterisation.test.ts`, `scene-dom.test.ts`, `scene-dom-wrist.test.ts` pass unchanged. New guard: `scene-dom-hand.test.ts` / `hand-hashes.json` (PA keys unchanged when the lateral was added).

## 5. QA run
`npm run check` (1112 tests), `npm run build`, `scripts/qa/hand-audit.mjs hand-pa|hand-lateral` and `wrist-audit.mjs wrist-pa|wrist-lateral` against `next start` (Playwright EN / AR × 1440 / 390, axe WCAG 2 A/AA, no horizontal overflow, a correct attempt through the UI scores 100, a wrong one shows the critical finding), `label-collisions.mjs` for both hand exams (12 states each × guides ON / OFF): 0 overlaps, 0 outside the frame. Not run: a human check on a phone; Arabic review.

## 6. Not done / limits
Fan lateral, flexion lateral, PA oblique; forearm; O19 / O20; shared result resolution (24 px / cm, finger detail is soft); the lateral's one-sided excess margin (O40); scale and landmarks by eye (O41); one small fill artefact in the lateral baseline.

## 7. Phase 2 — Elbow reference (docs only)
`RAD-LAB_Medical_Reference_Elbow.md`, the Elbow section of `sources/BONTRAGER-9.md`, REGISTER, S14.3-1…4, O42…O44. No code, scene or asset.

## 8. S14.2b-FIX (phone-review fixes; DECISIONS S14.2b-FIX-1…4, O45, O46)
1. **Sharpness:** cause = 24 px/cm shared canvas vs ≈ 88 px/cm baselines; fix = optional `render.pxPerCm` (hand 48, cap 1.8 Mpx).
2. **Lateral layout:** optional `render.viewMarginCm` (3 cm) → `RenderPlan.view`.
3. **Rotation:** one 2.5D model (`features/hand-model`) for the scene and the result warp; continuous over ±15°, one sign (odd part), tests in `hand-rotation.test.ts` (continuity, base-pose silhouettes, sign, no folding) and `render-options.test.ts`.
Regression: chest and wrist untouched (`git diff origin/main` empty over characterisation, goldens, chest / wrist hashes, images, data, tests; the shared renderer paths are unchanged when `render` / `view` / hand kinds are absent).
