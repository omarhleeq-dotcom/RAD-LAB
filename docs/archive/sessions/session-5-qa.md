# Session 5 — Chest PA: full QA, polish and end-to-end testing

Scope: Chest PA only. No new features, no new medical rules, top-level weights unchanged (25/20/15/20/10/10), rendering deterministic, scoring never reads pixels, no anatomy mirroring in RTL. **This is an educational simulator, not a diagnostic or clinically validated system.**

Related: [`docs/archive/sessions/session-5-qa-matrix.md`](session-5-qa-matrix.md) (all 53 scenarios) · [`docs/archive/sessions/session-5-baseline-options.md`](session-5-baseline-options.md) · [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](../../REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md) · [`ARABIC_TERMINOLOGY.md`](../../ARABIC_TERMINOLOGY.md) · contact sheet [`session-5-renders/matrix-contact-sheet.jpg`](../../session-5-renders/matrix-contact-sheet.jpg).

## 0. Review fix pass (same branch / PR #5; before merge)
Four review items; no top-level weight and no numeric score was changed by any of them.

| # | Item | Outcome | Tests |
|---|---|---|---|
| 1 | Wrong projection must not pass (AP / lateral for a requested PA exam scored 92.9–100) | A wrong projection is now a **critical finding**: below the educational pass mark whatever the number. The number stays 92.9 (projection is 2 of 7 positioning weight) | `critical-findings.test.ts` ("1 · a wrong projection must not pass"), matrix `projection-ap` / `projection-lateral` |
| 2 | Critical findings gate the pass mark | New case-data rule list `scoring.criticalFindings`: **wrong projection**, **visible patient motion**, **wrong-side marker**. Any one forces `score.passed = false` (“Below the educational pass mark”); `score.total`, the checks' credits and the weights 25/20/15/20/10/10 are untouched (`score.thresholdMet` still reports the numeric result). The reason is shown in a “Critical findings” panel in EN and AR with its evidence. Pure detection in `features/evaluation/critical.ts` | `critical-findings.test.ts` (incl. “numeric score unchanged”, “weights unchanged”, bilingual, classification), matrix test “critical findings gate the pass mark in every scenario, derived independently of the engine” |
| 3 | Revert the required-anatomy / centering change | `requiredAnatomy` back to **27 × 31 cm**, centering target back to **y −0.14**; no repo reference supports 27 × 28 / −0.15 (the three references give no cm values at all; the aspect ratio of the baseline picture is not a clinical criterion). The renderer keeps a **distortion-free uniform scale**: the baseline's landmark box is fitted *inside* the region (width-limited: 27 × 28.0 cm drawn, centred in the 27 × 31 region); anything the baseline does not cover is the existing grey “no reference data” hatch. A field cutting the costophrenic angles / lower lungs **still fails** (`clip-bottom`: `collimation-clipping` ✕, clipped side = bottom) | `plan.test.ts` (box inside region, centred, uniform), `engine.test.ts` (“reference-based values, not fitted to the baseline”, “a field that clips the costophrenic angles still fails”) |
| 4 | Marker-side scoring: research | **Sources read in full (fix pass 3, §0.1): they do not support a scoring rule → marker kept UNSCORED (weight 0)**; a wrong-side marker still gates the pass mark through item 2 | `critical-findings.test.ts` (“marker check stays unscored”), `marker-laterality.test.ts` |

**Known consequence of item 3 → investigated and handled in fix pass 3 (§0.2).** The fitted baseline does not span the whole 31 cm region height, so a field edge that cuts the 1.5 cm strips above / below the drawn landmark box fails the clipping *score* while the picture still shows the full drawn lungs. §0.2 explains the cause, why the criterion and score were deliberately **not** changed, what the picture does show, and the new honest labelling.

### 0.1 Marker-side evidence (item 4) — verified from the full text in fix pass 3
Question: do the two cited studies support **scoring** the marker as (a) presence, (b) correct side, (c) placement inside the field?

**Read in full** (PMC full-text pages fetched directly on 2026-10-06; not summaries):

1. Chung L, Kumar S, Oldfield J, Phillips M, Stratfold M. *A clinical audit of anatomical side marker use in a pediatric medical imaging department: A quantitative and qualitative investigation.* **PLoS ONE 2020;15(11):e0242594.** doi:10.1371/journal.pone.0242594 · PMID 33232340 · PMCID PMC7685512.
   - **What it measured:** retrospective audit of 421 radiographs (patients 0–18 y, one Australian women's-and-children's hospital, Jul 2016–Jun 2017) for *presence* and *type* (radiopaque / digital) of the marker, and whether it was on the *correct side*; plus 11 radiographer interviews on barriers. Results: markers present on 99 %; 4 radiographs had none and 4 had a marker on the incorrect side (8 / 421 = 1.9 % “incorrect/absent”); radiopaque 20.4 %, digital 76.7 %.
   - **Standards were the authors' own**: “best / acceptable / undesirable practice” were “derived based on discussions with the research team”, not taken from a guideline. Best = radiopaque marker on the correct side; acceptable = a *digital* marker on the correct side, or digital correction of a wrong radiopaque marker; undesirable = no marker.
   - **Placement inside the field was NOT measured**: its Table 1 leaves “Placement of radiopaque ASM (radiation field)” blank for this study, and the Limitations say a radiopaque marker positioned outside the field of view “was not captured”. “A radiopaque marker within the primary radiation field” appears only as background, attributed to earlier work (their refs 7, 8, 10).
   - Anecdotes in the interviews (marker covering anatomy on neonatal chests, repeats) are qualitative quotes, not measured outcomes.
2. Fuller M. *Side marker creep: have radiographers changed their side marker habits?* (editorial) **J Med Radiat Sci 2016;63(3):143–144.** doi:10.1002/jmrs.181 · PMID 27648276 · PMCID PMC5016621.
   - **What it is:** a two-page opinion editorial on the Barry et al. audit (J Med Radiat Sci 2016;63:148–54, doi:10.1002/jmrs.176, PMID 27648278, PMC5016612 — abstract and introduction also read; 400 images, a lead marker matching the anatomy within the primary beam on 22 %, a correct digital marker on 72.3 %, 22 images with no marker). It reports no data of its own.
   - **What it argues:** placing a radiopaque marker *within the primary beam before exposure* should be an “automated reflex”; omitting it risks harm. Evidence offered: one anecdote (a chest radiograph without a marker, repeat showed situs inversus) and a 2002 report (Finnbogason et al., two legal cases of neonatal pneumothorax side mix-up, one with an “iatrogenic death” — cited second-hand). It quotes a 2015 conference abstract (Khosa) for “placement of markers so that they do not obscure anatomy” and says annotations should avoid bony anatomy.
   - It does **not** say which viewer side L / R belongs on.

| Claim in code / UI / docs | Supported by | Verdict |
|---|---|---|
| (a) a marker is expected on every image | Chung (audit: absent marker = “undesirable practice”, authors' standard); Fuller (opinion); Barry (“globally accepted best practice”, secondary) | supported as **professional best practice**; not a validated scoring rule |
| (b) a wrong-side marker is an error | Chung (4 / 421 on the incorrect side counted as errors); Fuller (harm anecdote + case reports, second-hand) | supported **as a labelling error**; *which viewer side L / R belongs on* is **not** in either paper |
| (c) the marker belongs inside the primary field | Fuller (opinion); Chung background citing other work; Barry measured “lead marker … within the primary beam” | supported **as a best-practice statement for a radiopaque marker**, not as a measured outcome of Chung; a post-processing digital marker is “acceptable practice” and has no in-field requirement |
| (d) the marker must not obscure anatomy | Positioning ref §3F; Fuller quoting a conference abstract; Chung interview quote | weak (reference + opinion) |
| a **weight** for the marker, or a credit split (half credit outside the field / over anatomy) | nothing | **unsupported** |

**Wording corrected.** The previous revision's summary overstated the sources in four places, now fixed in this section, the case-data evidence notes, the checklist and the render-plan concept text: (1) “missing / **incorrectly positioned** markers are audited as errors” — Chung audited missing / wrong-*side*, not position; (2) Fuller “treats markers as **mandatory practice**” — it is an opinion that this should be a reflex; (3) “a reported neonatal death from side misidentification” — second-hand, from a 2002 case report cited by Fuller; (4) “(c) inside the primary field is supported by audits” — Chung did not measure it. The earlier text also said the pages were read “through a page-reading tool … summaries”; this pass read the PMC pages directly.

**Decision (conservative): the marker is reverted to UNSCORED (weight 0).** Reasons: both studies are a single-site audit (paediatric) and an editorial, neither defines a scoring rule, weight or credit split, and neither establishes the viewer-side mapping that a correct-side score would need; the repository's own references say marker behaviour stays unscored “until a validated scoring rule is defined” (Positioning ref §3F) and patient-side correctness “remains unscored unless a validated orientation mapping is adopted” (Image-quality ref, Side marker). The commit reverts 38ccc5e (“score the side marker”): `side-marker` weight 1 → 0, label “Side marker (not scored)”, no half / no credit rules, golden matrix restored. Top-level weights 25/20/15/20/10/10 are unchanged (the marker never touched them). **The wrong-side marker remains a critical finding** (pass-mark gate, item 2) because the concept “the image must identify the correct patient side” is in the Image-quality reference (ACR side identification) and Chung counts wrong-side markers as errors; its orientation convention remains an EDUCATIONAL display convention (`positioning.markerSide`). A *missing* marker is neither scored nor gated.

**Still not verified:** the ACR digital-radiography / chest practice parameters (gravitas.acr.org) were not opened (egress proxy); no IAEA, WHO or AAPM source on the topic was found; the Australian Institute of Radiography professional practice guideline cited by Barry is a lead for the reviewer, not read. A reviewer who wants the marker scored should read those and define the rubric (presence? side? in-field? weight?) — see the checklist.

### 0.2 Scoring vs picture at the region edges (fix pass 3, item 1)
**Cause.** The clipping check compares the field with `RadCase.requiredAnatomy`, a provisional **27 × 31 cm demo region** (case data; the references give no cm values). The renderer fits the baseline's landmark box (apices → costophrenic angles, lateral lung margins; read by eye) into that region with one uniform scale: width-limited, 27 × 28.0 cm, centred. That leaves ≈ 1.5 cm strips above and below the box. A field edge inside a strip fails the clipping score while every drawn lung, rib and costophrenic angle stays exposed.

**What is in the strips (looked at the baseline).** Real baseline pixels: lower neck / upper-chest soft tissue above the apices, and the upper abdomen (diaphragm dome, stomach bubble) below the costophrenic angles. No lung, rib or costophrenic angle lies in them. The renderer already draws them and the field mask already removes them exactly at the field edge — so the picture is geometrically consistent with the field; it just does not lose any *lung*.

**Decision: the clinical criterion and the score are NOT adapted to the picture** (as instructed). The references define the criterion as inclusion of the apices, both lungs, costophrenic angles and the whole rib cage above the diaphragm; the cm size of the region is a provisional demo value. Making the picture “look clipped” would mean inventing anatomy or hiding drawn lung under hatch (the “no reference data” hatch is for detector area the baseline does not cover — here it *does* cover it), so that was rejected. Instead the plan now classifies each clipped side (`RenderPlan.landmarkClippedSides` vs `marginOnlySides`, computed from the field edge against the landmark box, cm geometry only, never pixels) and the UI says so: effect card note, a note under the clipping check, and the image text alternative (EN + AR): “Margin only at the top: the field cuts only the margin of the provisional required region … the picture shows those structures complete.” A cut that reaches the drawn lungs is classified as landmark clipping and removes them exactly as before. Left / right edges are always landmark clipping (the box spans the region's full width).

**Tests** (`src/features/radiograph/clipping-margin.test.ts`, 12): region still 27 × 31 and strips exist; a strip-only cut still **fails** the check and an edge just outside the region passes; plan classification top / bottom / mixed / lateral / none; text-alternative data; pixel agreement (strip content masked at the edge, drawn lungs / costophrenic angles exposed for a margin-only cut, lungs masked for a landmark cut). New matrix scenario `clip-margin-only` (field 3.7–33.3 cm: both strips cut, lungs intact; score 92.9, clipping ✕, marker fully recorded) is checked in the real UI in EN / AR / all devices (two “margin only” notes). Existing: all 53 scenarios agree on clipped sides (matrix).

**Open decision (owner / reviewer):** adopt a baseline matching the region, or measure the region on a validated baseline, so the strips disappear; the label is a stop-gap that keeps the mismatch visible.

## 1. Preflight
- PR #4 (Session 4) was merged (`7c2a9c3`); the Session 5 branch starts from that `main`.
- All references and Session 2–4 docs read before any change.
- **Laterality on main verified**: the CC0 baseline's own “Dx” (right) / “Sin” (left) annotations sit on the viewer's left / right, with the heart apex and gastric bubble on the viewer's right; the case convention is `markerSide: { L: "viewer-right", R: "viewer-left" }`; in the correct-baseline render the L marker lies on the viewer's right, and the browser matrix asserts it in EN and AR. No laterality fix was needed as task #1.

## 2. Method: one scenario matrix, three views of the same finding
`scripts/qa/scenarios.json` (53 scenarios: 4 fully correct, 42 single errors, 7 combinations incl. the untouched starting state) is the single source of truth, used by

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
| Keep-still instruction unscored; marker unscored | no scoring rule in references | unchanged (conservative); both can now trigger a critical finding (fix pass §0) |

## 6. Renderer polish
- **Aspect-preserving mapping**: done (bug #4, fix pass §0 item 3): uniform scale, landmark box centred in the 27 × 31 cm region, ≈ 1.8 cm side bands and ≈ 7 cm bottom band of “no reference data” hatch (a ≈ 0.2 cm sliver at the top). The grey hatch and its explanation are kept.
- **Low penetration / motion magnitudes**: compared at normal display size (420 px wide; `matrix-contact-sheet.jpg`, `kvp-70`, `motion-none` goldens). Both are clearly visible, so **no magnitude was changed**; all keep the “Educational visual approximation” label.

## 7. Accessibility and UX
Tools: `scripts/qa/a11y-audit.mjs` (axe-core WCAG 2.0/2.1 A + AA incl. contrast) on home, set-up and result screens, EN and AR, desktop 1440 and mobile 390 (touch): **0 violations** after fixes #6–#7. Keyboard: 29 tab stops, every one with a visible focus ring (3 px outline), DOM order = visual order (positioning → patient instructions → console → Expose → result), result reachable, Retry works with Enter. Canvas: dynamic bilingual text alternative (#5). No horizontal overflow at 1440, 820 and 390. Numbers/units stay `dir="ltr"`. Arabic terminology for educator review: [`ARABIC_TERMINOLOGY.md`](../../ARABIC_TERMINOLOGY.md).

## 8. Visual regression
- Goldens: `scripts/qa/golden/images/<scenario>.png` (53 greyscale PNGs, 420 × 516, 6.0 MB; registry A-005) + `scripts/qa/golden/matrix.json`.
- Compare: `npm run build && npx next start -p 3100`, then `node scripts/qa/run-matrix.mjs` (mean abs diff < 0.75 grey levels and < 0.2 % pixels off by > 8). Update intentionally with `--update-goldens` / `npm run qa:golden`.
- **CI** (`.github/workflows/ci.yml`): typecheck, lint, unit tests, build only. No secrets, no Playwright. The unit-level golden (phantom render hash) runs in CI.

## 9. Results
Run on 2026-10-06 (fix pass 3, final) against the production build of branch head:

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 problems) |
| `npm test` (full unit suite) | **662 / 662** in 22 files (644 before this pass + 12 `clipping-margin.test.ts` + 6 matrix tests for the new scenario) |
| `npm run build` | pass |
| Browser matrix `scripts/qa/run-matrix.mjs` — EN + AR × desktop 1440×900 (53 scenarios), tablet 820×1180 and mobile 390×844 touch (7 scenarios each) | **3159 / 3159** checks (score, effects, cards, labels, “margin only” notes, alt text, marker side in pixels, golden image, RTL/device pixel identity, overflow, console errors) |
| `scripts/qa/a11y-audit.mjs` (axe WCAG A/AA, keyboard, focus, canvas alt) EN/AR × desktop/mobile | 0 violations (32 ok/info) |
| GitHub Actions workflow | added; runs on the PR |

## 10. Decisions for owner (conservative defaults applied)
1. ~~Required-anatomy region 27 × 28 cm~~ — **reverted** (fix pass): the region stays 27 × 31 cm / target y −0.14 (no reference supports a change). The 1.5 cm strip mismatch is explained and labelled in §0.2; still open: adopt a baseline matching the region, or measure the region on it.
2. **Wrong projection** now gates the pass mark (critical finding); its numeric score (92.9) is deliberately unchanged. Open: whether Assessment Mode should also cap the number.
3. **Keep-still and marker checks remain unscored** (score stays 100) but visible motion and a wrong-side marker are critical findings that gate the pass mark. A missing marker is neither scored nor gated. Open: §0.1 — the two sources read in full do not support a scoring rule; a reviewer must define the rubric (presence / side / in-field / weight) and the viewer-side convention before the marker is scored.
4. **Rotation inside ±2° is drawn symmetric** (picture agrees with the score), i.e. the picture is not continuous at the band edge.
5. **Baseline mismatch**: unchanged; see [`docs/archive/sessions/session-5-baseline-options.md`](session-5-baseline-options.md) (only 2 real candidates, neither verified as an adult male PA of good quality).
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
