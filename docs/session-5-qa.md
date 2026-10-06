# Session 5 — Chest PA: full QA, polish and end-to-end testing

Scope: Chest PA only. No new features, no new medical rules, top-level weights unchanged (25/20/15/20/10/10), rendering deterministic, scoring never reads pixels, no anatomy mirroring in RTL. **This is an educational simulator, not a diagnostic or clinically validated system.**

Related: [`session-5-qa-matrix.md`](session-5-qa-matrix.md) (all 52 scenarios) · [`session-5-baseline-options.md`](session-5-baseline-options.md) · [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md) · [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) · contact sheet [`session-5-renders/matrix-contact-sheet.jpg`](session-5-renders/matrix-contact-sheet.jpg).

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
| 4 | **Anisotropic baseline mapping** (≈ 10–13 % in x) distorted proportions incl. cardiothoracic-ratio appearance | Required-anatomy region is now 27 × 28 cm (was 27 × 31), equal in aspect to the baseline's landmark box (860 × 892 px); one uniform scale; centering target moved 18.5 → 18.3 cm (y −0.14 → −0.15). Clipped scores and clipped anatomy still agree (matrix test, all 52 scenarios) | `plan.test.ts`, `engine.test.ts` |
| 5 | **Static, generic alt text** on the radiograph canvas | Text alternative built from the plan (visible findings, clipped sides, marker side / wrong side / cut off), EN + AR | browser matrix (`run-matrix.mjs`) |
| 6 | **Colour contrast** of the “warn” colour on tinted backgrounds 3.75–4.1 : 1 (AA needs 4.5) | `--color-warn` #a86400 → #8a5300 (≥ 5.0 : 1) | `scripts/qa/a11y-audit.mjs` (axe: 0 violations) |
| 7 | **Touch / pointer targets** < 24 px (range sliders 16 px, back link and summaries 20 px) | min 24 px height | `a11y-audit.mjs` |
| 8 | Result headings “Acceptable image / Needs improvement” read as a real-world accept/reject decision (the reference warns against that) | “Meets / Below the educational pass mark” + a note | messages tests |
| 9 | `leftLungScale` / `rightLungScale` named patient-style sides but drawn on the viewer's left / right | renamed `viewerLeft/RightLungScale` | laterality audit test |
| 10 | No “not a diagnostic system” statement on every page | footer disclaimer (EN + AR) | browser matrix / a11y audit |

Findings that are **design decisions, not bugs** (kept, listed under “Decisions for owner”): a wrong projection still scores 92.9 (projection is 2 of 7 positioning weight); unscored checks (marker, keep-still) can be flagged while the score stays 100.

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
| Keep-still instruction unscored; marker unscored | no scoring rule in references | unchanged (conservative) |

## 6. Renderer polish
- **Aspect-preserving mapping**: done (bug #4). Side effects: the image now starts at the detector top (no hatch sliver), the bottom “no reference data” band is larger (≈ 7 cm) and the side bands unchanged (≈ 1.8 cm). The grey hatch and its explanation are kept.
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
| `npm test` | **611 / 611** (was 276; +335, mostly the matrix: 52 scenarios × 7 agreement tests + golden + laterality audit + regressions) |
| `npm run build` | pass |
| Browser matrix `scripts/qa/run-matrix.mjs` — EN + AR × desktop 1440×900 (52 scenarios), tablet 820×1180 and mobile 390×844 touch (7 scenarios each) | **2686 / 2686** checks (score, effects, cards, labels, alt text, marker side in pixels, golden image, RTL/device pixel identity, overflow, console errors) |
| `scripts/qa/a11y-audit.mjs` (axe WCAG A/AA, keyboard, focus, canvas alt) EN/AR × desktop/mobile | 0 violations |
| GitHub Actions workflow | added; first run happens on the PR |

## 10. Decisions for owner (conservative defaults applied)
1. **Required-anatomy region 27 × 31 → 27 × 28 cm** (and centering target y −0.14 → −0.15) so the baseline maps without distortion. Provisional educational values; it slightly changes which fields clip. Alternative: keep 27 × 31 and accept the distortion — not recommended.
2. **Wrong projection still “passes”** (AP/lateral selected: 92.9 / 100). Not changed (weights are configuration; inventing a critical-error rule is out of scope). Recommend a critical-error cap in the Assessment Mode design.
3. **Keep-still and marker checks remain unscored** (the picture is blurred / the marker flagged while the score is 100).
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
3. Assessment Mode: gate effect cards, DI analysis, “not drawn” notes, guides; decide critical-error rules and patient-instruction scoring.
4. Then AP portable (new asset + renderer), keeping this matrix as the template.
