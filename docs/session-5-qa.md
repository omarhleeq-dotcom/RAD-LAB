# Session 5 — Chest PA: full QA, polish and end-to-end testing

Scope: Chest PA only. No new features, no new medical rules, top-level weights unchanged (25/20/15/20/10/10), rendering deterministic, scoring never reads pixels, no anatomy mirroring in RTL. **This is an educational simulator, not a diagnostic or clinically validated system.**

Related: [`session-5-qa-matrix.md`](session-5-qa-matrix.md) (all 52 scenarios) · [`session-5-baseline-options.md`](session-5-baseline-options.md) · [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md) · [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) · contact sheet [`session-5-renders/matrix-contact-sheet.jpg`](session-5-renders/matrix-contact-sheet.jpg).

## 0. Review fix pass (same branch / PR #5; before merge)
Four review items; no top-level weight and no numeric score was changed by any of them.

| # | Item | Outcome | Tests |
|---|---|---|---|
| 1 | Wrong projection must not pass (AP / lateral for a requested PA exam scored 92.9–100) | A wrong projection is now a **critical finding**: below the educational pass mark whatever the number. The number stays 92.9 (projection is 2 of 7 positioning weight) | `critical-findings.test.ts` ("1 · a wrong projection must not pass"), matrix `projection-ap` / `projection-lateral` |
| 2 | Critical findings gate the pass mark | New case-data rule list `scoring.criticalFindings`: **wrong projection**, **visible patient motion**, **wrong-side marker**. Any one forces `score.passed = false` (“Below the educational pass mark”); `score.total`, the checks' credits and the weights 25/20/15/20/10/10 are untouched (`score.thresholdMet` still reports the numeric result). The reason is shown in a “Critical findings” panel in EN and AR with its evidence. Pure detection in `features/evaluation/critical.ts` | `critical-findings.test.ts` (incl. “numeric score unchanged”, “weights unchanged”, bilingual, classification), matrix test “critical findings gate the pass mark in every scenario, derived independently of the engine” |
| 3 | Revert the required-anatomy / centering change | `requiredAnatomy` back to **27 × 31 cm**, centering target back to **y −0.14**; no repo reference supports 27 × 28 / −0.15 (the three references give no cm values at all; the aspect ratio of the baseline picture is not a clinical criterion). The renderer keeps a **distortion-free uniform scale**: the baseline's landmark box is fitted *inside* the region (width-limited: 27 × 28.0 cm drawn, centred in the 27 × 31 region); anything the baseline does not cover is the existing grey “no reference data” hatch. A field cutting the costophrenic angles / lower lungs **still fails** (`clip-bottom`: `collimation-clipping` ✕, clipped side = bottom) | `plan.test.ts` (box inside region, centred, uniform), `engine.test.ts` (“reference-based values, not fitted to the baseline”, “a field that clips the costophrenic angles still fails”) |
| 4 | Marker-side scoring: research | **Supported (practice) → added as a scored Positioning subcheck** (`side-marker`, relative weight 1: missing = no credit, wrong side = no credit, outside field / over anatomy = half credit). Top-level weights and every other category unchanged; the viewer side L / R belongs on stays an educational convention. See §0.1 | `critical-findings.test.ts`, `engine.test.ts`, `marker-laterality.test.ts`, matrix |

**Known consequence of item 3 (decision for owner).** The fitted baseline does not span the whole 31 cm region height, so a field edge that cuts the 1.5 cm strips above / below the drawn landmark box fails the clipping *score* while the picture still shows the full drawn lungs. This is the honest limit of a 27 × 31 cm provisional region against a 27 × 28 cm baseline; it is documented, not hidden, and goes away if a baseline matching the region (or a region measured on the baseline) is adopted by a reviewer. All 52 scenarios still agree on which sides are clipped (matrix test); only `clip-top`'s numbers moved (83.6 → 85.4; its fixed-cm field no longer counts as an excess field against the 31 cm region).

### 0.1 Marker-side evidence (item 4)
Question: do authoritative sources (IAEA, WHO, AAPM, ACR, PubMed only) support **scoring** anatomical side-marker practice / wrong-side errors, and which viewer side belongs to L / R in a PA display?

**Read (PMC / PubMed-indexed, fetched through a page-reading tool, i.e. summaries of the open-access pages, not the PDFs):**
- Chung et al., *A clinical audit of anatomical side marker use in a pediatric medical imaging department*, PLoS One 2020 (PMC7685512): radiographs are legal records; best practice is a **radiopaque marker placed within the primary radiation field before exposure**, annotating the correct side; missing / incorrectly positioned markers are audited as errors (0.95 % missing in that department).
- Fuller M., *Side marker creep: have radiographers changed their side marker habits?*, J Med Radiat Sci 2016 (PMC5016621) (editorial on Barry et al. audit): markers should be treated as mandatory practice and stay inside the primary beam; missing / wrong markers carry patient-safety consequences (e.g. missed situs inversus; a reported neonatal death from side misidentification).
- The repository's own references: Image-quality ref (current ACR digital-radiography guidance requires side identification to be visible) and Positioning ref §3F (marker must not obscure important anatomy).

**Not verifiable:** the ACR practice parameters (gravitas.acr.org) are still blocked by the environment's egress proxy; no IAEA, WHO or AAPM source on the topic was found. **No source read defines which viewer side L / R belongs on** — that mapping remains an EDUCATIONAL display convention (`positioning.markerSide`, PA display: patient left = viewer right).

**Decision.** Supported: (a) a marker is expected, (b) inside the primary field, (c) on the correct side, (d) not over important anatomy. Implemented inside the existing Positioning category as the `side-marker` subcheck with relative weight 1 (Positioning now 2+2+1+1+1+1 = 8 relative points; max cost of a bad marker 25/8 = 3.1 points; top-level weights 25/20/15/20/10/10 unchanged). Wrong side → no credit and also a critical finding (item 2); missing marker → no credit, not critical (not in the owner's list). Classified PROVISIONAL (weight, credit split) over a COMMON QUALITY CRITERION concept; the L/R orientation is EDUCATIONAL. Peer-reviewed audits are not guideline-grade authority; an educator should confirm weight and convention (checklist).

## 1. Preflight
- PR #4 (Session 4) was merged (`7c2a9c3`); the Session 5 branch starts from that `main`.
- All references and Session 2–4 docs read before any change.
- **Laterality on main verified**: the CC0 baseline's own “Dx” (right) / “Sin” (left) annotations sit on the viewer's left / right, with the heart apex and gastric bubble on the viewer's right; the case convention is `markerSide: { L: "viewer-right", R: "viewer-left" }`; in the correct-baseline render the L marker lies on the viewer's right, and the browser matrix asserts it in EN and AR. No laterality fix was needed as task #1.

## 2. Method: one scenario matrix, three views of the same finding
`scripts/qa/scenarios.json` (52 scenarios: 4 fully correct, 41 single errors, 7 combinations incl. the untouched starting state) is the single source of truth, used by

1. **unit tests** (`src/features/qa/*.test.ts`, run in CI): for every scenario the score, the feedback and the render plan are put side by side and must agree; a golden file (`scripts/qa/golden/matrix.json`) pins score, non-passing checks, variants, effects, marker placement and a hash of the synthetic-phantom render;
2. **the real UI in Chromium** (`scripts/qa/run-matrix.mjs`, manual): sets every control as a learner would, exposes, then checks score shown, effect cards, “not drawn” labels, text alternative, marker glyph side in the pixels, layout and console errors against the same golden, and compares the canvas with a committed golden image.

The agreement rules (`src/features/radiograph/consistency.ts`, the single registry): every non-passing check is either **drawn** (its effect is in the picture) or **explicitly labelled “scored from your settings — not drawn in this image”** (SID; kVp inside the 100–150 kV reference range; excess detector exposure, which is invisible on DR by design; AEC chamber explanation); nothing is drawn without a non-passing check; the image-quality variant list carries the same labels.

## 3. Bugs / inconsistencies found and fixed (each has a regression test)
| # | Finding | Fix | Test |
|---|---|---|---|
| 1 | **Rotation drawn for any non-zero value** (1–2° passes the score as “no meaningful rotation” but the image and the “What shaped this image” card showed rotation) | Rotation is drawn only when the rotation check is not passed | `plan.test.ts` (Session 5), matrix “rotation drawn exactly when check fails” |
| 2 | **Findings listed that the picture cannot show** (“Increased magnification / unsharpness”, kVp-below-band text describing reduced retrocardiac visibility, excess exposure) with no hint | “not drawn in this image” label on checks and on the variant list + explanatory note; kVp texts now say when no effect is drawn | matrix tests; `engine.test.ts` |
| 3 | **SID full-credit band was 180–185 cm**, asymmetric, contradicting the documented ±5 cm | `[175, 185]` | `engine.test.ts` |
| 4 | **Anisotropic baseline mapping** (≈ 10–13 % in x) distorted proportions incl. cardiothoracic-ratio appearance | One uniform scale (“contain”): the landmark box is fitted inside the unchanged 27 × 31 cm required region and centred; uncovered area = the existing no-reference-data hatch. *(An earlier revision of this PR changed the region to 27 × 28 cm; reverted in the fix pass — §0, item 3.)* Clipped scores and clipped anatomy still agree (matrix test, all 52 scenarios) | `plan.test.ts`, `engine.test.ts` |
| 5 | **Static, generic alt text** on the radiograph canvas | Text alternative built from the plan (visible findings, clipped sides, marker side / wrong side / cut off), EN + AR | browser matrix (`run-matrix.mjs`) |
| 6 | **Colour contrast** of the “warn” colour on tinted backgrounds 3.75–4.1 : 1 (AA needs 4.5) | `--color-warn` #a86400 → #8a5300 (≥ 5.0 : 1) | `scripts/qa/a11y-audit.mjs` (axe: 0 violations) |
| 7 | **Touch / pointer targets** < 24 px (range sliders 16 px, back link and summaries 20 px) | min 24 px height | `a11y-audit.mjs` |
| 8 | Result headings “Acceptable image / Needs improvement” read as a real-world accept/reject decision (the reference warns against that) | “Meets / Below the educational pass mark” + a note | messages tests |
| 9 | `leftLungScale` / `rightLungScale` named patient-style sides but drawn on the viewer's left / right | renamed `viewerLeft/RightLungScale` | laterality audit test |
| 10 | No “not a diagnostic system” statement on every page | footer disclaimer (EN + AR) | browser matrix / a11y audit |

Findings that are **design decisions, not bugs** (kept, listed under “Decisions for owner”): a wrong projection still *scores* 92.9 (projection is 2 of 7 positioning weight) but is now below the pass mark through the critical-finding gate (§0); unscored checks (marker, keep-still) can be flagged while the score stays 100 — the gate, not the score, decides the pass mark.

## 4. Laterality audit (PA display: patient left = viewer right)
Layers audited: case data (marker convention, default marker positions, dense zone / heart on the viewer's right, symmetric scapula schematic), positioning UI (caption “Detector view as displayed (patient's left on the viewer's right)”, marker handle, practice guide line), marker scoring (`evalMarker`), geometry (`viewerSideOf`), renderer (`RenderPlan.marker`, canvas `direction: ltr`), feedback text, text alternative, AEC chamber labels (“detector view”). `src/features/qa/laterality-audit.test.ts`: one convention; scoring ⇔ plan ⇔ feedback agree on the marker side in every scenario; no feedback names a *patient* side (only “detector view / viewer”) in EN and AR; no source file in the scoring/geometry/renderer branches on locale or direction; workspace and canvas are `direction: ltr`. Browser: marker glyph probed on the correct half in EN and AR, and the canvas is byte-identical in EN and AR. Result: **no laterality defect found**; one naming defect (#9).

## 5. Medical consistency audit
Every rule, tolerance and feedback sentence was checked against the three repository references (positioning, technique, image quality). **No outside source was needed or added**; the only external study cited in text is the one already in the positioning reference (Fitzgerald A, Lockwood P. *J Med Imaging Radiat Sci* 2025, SID in AP semi-erect adult chest imaging).

| Statement / rule | Verdict | Action |
|---|---|---|
| “Check the shoulders and the **anterior superior iliac spines** are equidistant…” | not in the references | removed; reworded to the WHO spinous-process / medial-clavicle relationship (image-quality ref) |
| “Rotation … can **mimic disease**”, “distorts the heart and mediastinum” | stronger than the reference | reworded: changes the projection of the thorax; can mislead when read; appearance depends on body build |
| Excess field “**adds scatter**” | reference: no scatter penalty without a physical model | reworded to “unnecessary radiation exposure” |
| Poor inspiration “crowds lung markings … **enlarges the apparent heart size**” | not in the references | reworded to the supported cue: less expanded lungs, higher diaphragms |
| Wrong projection “changes … how the **scapulae** are shown” | not in the references | reworded to the supported statement: PA reduces cardiac magnification vs AP |
| High kVp “**lowers subject contrast and produces more scatter**” | technique ref §8 warns against such simplifications | reworded: more penetrating; acceptability depends on detector / processing / local protocol; no image effect drawn |
| Short SID: magnification and “geometric unsharpness”, dose | physics true but unsourced | reworded with the cited 2025 study (dose ↑ at < 180 cm; image quality ↓ at 100 cm in the studied setup); “does not draw magnification” |
| SID “ideal 180–185” | contradicted the documented ±5 | `[175,185]`; band stays PROVISIONAL |
| Rotation ±2° / ±5°, centering tolerances, required-anatomy size, 5 cm excess margin, 110–125 kV band, DI ±1/±3, SID 150–200 | PROVISIONAL / EDUCATIONAL (already labelled) | unchanged, still shown with their class |
| 180 cm SID, 100–150 kV | COMMON REFERENCE | unchanged |
| DI equation, brightness ≠ exposure, EI ≠ dose, no universal EIT / DI limit | VALIDATED | unchanged; no numeric EI/EIT anywhere (tests) |
| “Acceptable image” | implied a real accept/reject decision | educational pass mark wording (#8) |
| Keep-still instruction unscored; marker now scored (fix pass §0.1) | keep-still: no scoring rule in references; marker: practice supported by two peer-reviewed audits, orientation convention not | keep-still unchanged (conservative); both can trigger a critical finding |

## 6. Renderer polish
- **Aspect-preserving mapping**: done (bug #4, fix pass §0 item 3): uniform scale, landmark box centred in the 27 × 31 cm region, ≈ 1.8 cm side bands and ≈ 7 cm bottom band of “no reference data” hatch (a ≈ 0.2 cm sliver at the top). The grey hatch and its explanation are kept.
- **Low penetration / motion magnitudes**: compared at normal display size (420 px wide; `matrix-contact-sheet.jpg`, `kvp-70`, `motion-none` goldens). Both are clearly visible, so **no magnitude was changed**; all keep the “Educational visual approximation” label.

## 7. Accessibility and UX
Tools: `scripts/qa/a11y-audit.mjs` (axe-core WCAG 2.0/2.1 A + AA incl. contrast) on home, set-up and result screens, EN and AR, desktop 1440 and mobile 390 (touch): **0 violations** after fixes #6–#7. Keyboard: 29 tab stops, every one with a visible focus ring (3 px outline), DOM order = visual order (positioning → patient instructions → console → Expose → result), result reachable, Retry works with Enter. Canvas: dynamic bilingual text alternative (#5). No horizontal overflow at 1440, 820 and 390. Numbers/units stay `dir="ltr"`. Arabic terminology for educator review: [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md).

## 8. Visual regression
- Goldens: `scripts/qa/golden/images/<scenario>.png` (52 greyscale PNGs, 420 × 516, 5.9 MB; registry A-005) + `scripts/qa/golden/matrix.json`.
- Compare: `npm run build && npx next start -p 3100`, then `node scripts/qa/run-matrix.mjs` (mean abs diff < 0.75 grey levels and < 0.2 % pixels off by > 8). Update intentionally with `--update-goldens` / `npm run qa:golden`.
- **CI** (`.github/workflows/ci.yml`): typecheck, lint, unit tests, build only. No secrets, no Playwright. The unit-level golden (phantom render hash) runs in CI.

## 9. Results
Run on 2026-10-06 against the production build:

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 problems) |
| `npm test` | **644 / 644** (was 276; +335, mostly the matrix: 52 scenarios × 7 agreement tests + golden + laterality audit + regressions) |
| `npm run build` | pass |
| Browser matrix `scripts/qa/run-matrix.mjs` — EN + AR × desktop 1440×900 (52 scenarios), tablet 820×1180 and mobile 390×844 touch (7 scenarios each) | **2982 / 2982** checks (after the fix pass; includes pass-mark label, critical findings in EN/AR) (score, effects, cards, labels, alt text, marker side in pixels, golden image, RTL/device pixel identity, overflow, console errors) |
| `scripts/qa/a11y-audit.mjs` (axe WCAG A/AA, keyboard, focus, canvas alt) EN/AR × desktop/mobile | 0 violations |
| GitHub Actions workflow | added; first run happens on the PR |

## 10. Decisions for owner (conservative defaults applied)
1. ~~Required-anatomy region 27 × 28 cm~~ — **reverted** (fix pass): the region stays 27 × 31 cm / target y −0.14 (no reference supports a change). Open: the 1.5 cm strip mismatch described in §0 (adopt a baseline or a region measured on it).
2. **Wrong projection** now gates the pass mark (critical finding); its numeric score (92.9) is deliberately unchanged. Open: whether Assessment Mode should also cap the number.
3. **Keep-still remains unscored** (score stays 100) but visible motion is a critical finding that gates the pass mark. The side marker is now a scored Positioning subcheck (weight 1) and a wrong side is also critical; a missing marker is scored but not critical. Open: confirm the weight and the L/R viewer-side convention (§0.1).
4. **Rotation inside ±2° is drawn symmetric** (picture agrees with the score), i.e. the picture is not continuous at the band edge.
5. **Baseline mismatch**: unchanged; see [`session-5-baseline-options.md`](session-5-baseline-options.md) (only 2 real candidates, neither verified as an adult male PA of good quality).
6. Educational-pass-mark wording replaces “Acceptable image”.

## 11. Remaining limitations
- All Session 2–4 provisional values and visual magnitudes still await educator / medical-physicist review (checklist).
- One baseline (young woman), schematic scapula/jaw overlays, one cooperation profile, Practice Mode only (no Assessment gating of explanations/analysis).
- Golden images are tied to the Chromium build and JPEG decoder used (tolerance allows small decoder differences, not a different renderer).
- The CI does not run the browser matrix; it must be run before releases.
- Arabic text is machine-assisted and unreviewed by a domain educator.
- Mobile: no zoom/pan on the radiograph.

## 12. Recommended next steps
1. Educator / physicist review via the checklist; fix terminology.
2. Decide the baseline (data-only demographic change vs. new asset).
3. Assessment Mode: gate effect cards, DI analysis, “not drawn” notes, guides; review the critical-finding list (§0) and decide patient-instruction scoring.
4. Then AP portable (new asset + renderer), keeping this matrix as the template.
