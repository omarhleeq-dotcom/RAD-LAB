# Session 14.4 — Knee AP / lateral and Foot AP (DP) / medial oblique (right side)

Exam session (recipe, S-STD-1). Reference: [`RAD-LAB_Medical_Reference_Knee_Foot.md`](RAD-LAB_Medical_Reference_Knee_Foot.md) (Phase A, committed and pushed before any code). Decisions: `DECISIONS.md` S14.4-1 … S14.4-18, open items O56 … O71 (O66 closed).

## 1. What was built
- **Images (A-022 … A-029):** four owner-attached **right-limb** CC0 originals, **owner-verified** (Commons `imageinfo` HTTP 429 twice, O56). Burned-in "Dx" (and the oblique's mark / bottom frame line), the masters' bright edge strips and the foot AP's bottom frame line are removed (S14.4-7, S14.4-17); `scripts/derive-knee-foot-baselines.py`. Web copies: knees 1067 × 1913 / 1133 × 1939, foot AP 1061 × 2405, oblique 1077 × 1960.
- **Exams** `knee-ap` (p.246), `knee-lateral` (p.249), `foot-ap` (p.232), `foot-oblique` (p.233): one builder `src/data/exams/xray/lower-limb-common.ts` (+ `lower-limb-geometry.ts`, `lower-limb-technique.ts`), four 5-line exam files, one case builder `src/data/cases/lower-limb-case.ts` (+ `lower-limb-radiographs.ts`, `lower-limb-patient.ts`), four 12-line case files. RIGHT side: `markerRule: { kind: "fixed-side", side: "R" }` (S14.4-12: no new field), manual technique, tube angulation (S11 mechanism, S14.4-14), 24 × 30 cm portrait, categories 28 / 22 / 17 / 22 / 11, critical findings = missing / wrong-side marker.
- **Rotation effects** (S14.4-15): `src/features/lower-limb-model/lower-limb-model.ts` (one 2.5D model, shared by the scene and the result warp) + three generic limb kinds (`limb-warp`, `limb-layers`, `limb-copies`) that reuse the hand / elbow pixel steps.
- **Scene:** `LowerLimbFigure.tsx` (detector view, outlines in `lower-limb-outlines.json`, read by eye), `LowerLimbSideView.tsx` (side view with the TILTED tube and an end-view rotation gauge), registrations in `detector-figures.tsx`, `scene-layouts.tsx`, `scenes.tsx`; `crispMarker` and the S-VIS-1a margin guide labels are used.

## 2. Shared code (all optional, absent = old output)
Listed in `DECISIONS.md` S14.4-13. Existing-test edit: the scene-id list in `generalisation.test.ts` only. New tests: four exam test files, `lower-limb-rotation.test.ts`, `scene-dom-lower-limb.test.ts` (one new hash file per exam).

## 3. Proof that earlier exams are unchanged
`git diff origin/main --stat` is empty over `scripts/qa/characterisation`, `scripts/qa/golden`, `scripts/qa/scene-dom/{hashes,wrist-hashes,hand-hashes,elbow-hashes}.json`, `public/images/{chest*,wrist,hand,elbow}`, `assets/source/{chest*,wrist,hand,elbow}` and every chest / wrist / hand / elbow exam and case file. `messages/*.json` only gained keys (588 → 700 each, none removed or changed, checked key by key). `characterisation.test.ts` and the four older scene-dom tests pass unchanged. Result-image code paths are unchanged when the three new landmark kinds are absent.

## 4. QA run
`npm run check`, `npm run build`, `scripts/qa/lower-limb-audit.mjs <exam>` for the four exams (Playwright EN / AR × 1440 / 390, axe WCAG 2 A/AA, no horizontal overflow, a correct attempt through the real UI scores 100, a wrong one shows the critical finding), `scripts/qa/label-collisions.mjs --obstacles` with `label-states/{knee,foot}-*.json` (projection × rotation × tube angle, 36 states × guides on / off per exam). Human review of the 390 px screenshots including the result pages.

## 5. Not done / limits
Foot lateral, weight-bearing foot, skyline knee, ankle; a left / right case pair on one exam (O29); `render.pxPerCm` (O68); one-sided collimation margin of the foot exams (O69); tube angle not drawn on the result image; scale and landmarks by eye (O62); the knee lateral's flexion ≈ 45° (O58) and osteophyte (O57); Commons verification (O56); Arabic review.
