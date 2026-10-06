# Session 4 — Chest PA educational radiograph renderer

Primary medical/evidence source: [`RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md`](RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md) (the "image-quality reference"). Earlier references: `RAD-LAB_Medical_Reference_Chest_PA.md` (positioning) and `…_Technique.md`. Asset provenance: [`ASSET_PROVENANCE_AND_LICENSES.md`](ASSET_PROVENANCE_AND_LICENSES.md).

> **This is an educational simulator, not a diagnostic or clinically validated imaging system.** The renderer shows labelled educational approximations of image-quality effects. No pixel amount, blur radius or noise amplitude here is calibrated to real rotation, patient movement, a real detector, or dose.

The pattern used throughout is the one the reference prescribes:

```
validated clinical concept → simulation state → labelled educational visual approximation
```

never *invented pixel effect → claimed clinical truth*.

## 1. What was built

- A deterministic **Chest PA result renderer** that turns `RadiographResultState` into an educational radiograph (canvas, pure pipeline).
- A CC0 **baseline radiograph** with a project-wide **asset provenance registry**.
- **Patient Instructions / تعليمات المريض**: the learner speaks to the patient (breathing + keep-still); the simulation derives *inspiration* and *motion* states deterministically.
- A post-exposure **"What shaped this image"** explanation (EN + AR) linking learner actions to visible effects, each with an evidence class.

Not built (out of scope by instruction): AP/lateral simulation, pathology, assessment mode, accounts, backend, Session 5 work.

## 2. Architecture

```
SimulationSettings ──evaluate()──▶ EvaluationResult ─┬─ score / checks / feedback   (authoritative, pure)
        │                                            └─ resultState: RadiographResultState (schema v2)
        └─ derivePatientResponse(case.patientCooperation, settings) ─▶ resultState.patientResponse

resultState ──buildRenderPlan(state, case)──▶ RenderPlan   (pure, serialisable, no pixels)
RenderPlan + source luminance ──renderRadiograph()──▶ display luminance   (pure, Node-testable)
RadiographCanvas (React) ── draws it, then the learner's marker as an annotation layer
```

| Module | Role |
|---|---|
| `domain/patient.ts`, `features/patient/response.ts` | instruction → assumed response model (pure) |
| `domain/radiograph.ts`, `data/cases/chest-pa-radiograph.ts` | asset landmarks as **case data** (no per-case literals in the renderer) |
| `features/radiograph/plan.ts` | `RadiographResultState` → `RenderPlan`; effect list with drivers + evidence |
| `features/radiograph/pipeline.ts` | pixel pipeline (pure; counter-based hash noise; no DOM/React/clock) |
| `features/radiograph/tuning.ts` | **all** educational magnitudes in one reviewable file |
| `features/radiograph/RadiographCanvas.tsx`, `RadiographEffects.tsx` | canvas + explanation UI |
| `features/evaluation/ResultImage.tsx`, `ResultPanel.tsx` | result view |

**Rendering approach.** A 2D `<canvas>` with a pure luminance pipeline (no WebGL, no new dependency). Reasons: the effects are per-pixel warps, blurs and additive noise on one greyscale image; a CPU pipeline is simple, deterministic (byte-identical output for the same plan), unit-testable in Node without a browser, and fast enough (≈ 0.1–0.8 s for 840 × 1032 px even for a combined-error result, run once per exposure). CSS filters/SVG filters were rejected because they are not byte-deterministic across browsers and cannot be tested in Node. A future case or projection reuses `buildRenderPlan` / `renderRadiograph` with a different `RadiographAssetSpec`.

**Scoring independence (CLAUDE.md rule 3).** Scoring, evaluation, technique and patient logic never import the renderer and never read pixels; the renderer never imports the engine. `architecture.test.ts` enforces this (and bans `Math.random`/`crypto` randomness anywhere in `features/`, and locale/mirroring code in the renderer).

### Fixed layer order (so effects never fight each other)

| # | Layer | What happens |
|---|---|---|
| 1 | projection / anatomy | geometric warps of the source: reduced inspiration (vertical), rotation (horizontal, coordinated cues) |
| 2 | positioning effects | schematic scapula / jaw overlays, in *source* space so they move with the anatomy |
| 3 | motion | loss of sharpness (blur) of the anatomy — *before* noise, because quantum noise arises at the detector and is not blurred by patient motion |
| 4 | technique effects | low penetration (dense zones) → low-exposure fine-detail loss → quantum-noise-like texture |
| 5 | display processing | brightness normalised to the pre-technique level inside the field |
| 6 | field / collimation mask | unexposed (dark) outside the collimated field, soft penumbra; inside the field, detector area the source image does not cover is a neutral grey **"no reference data" hatch** (never black) |
| 7 | annotation | the learner's L/R marker, drawn on top, clipped by the field |

## 3. Baseline asset

CC0 1.0, *Normal posteroanterior (PA) chest radiograph (X-ray)*, Mikael Häggström, Wikimedia Commons. Master `3124c4cf…` verified byte-identical to the Commons record (registry **A-001**); derived clean baseline with the embedded "Dx"/"Sin" annotations neutralised over non-anatomical background (**A-002**); 1000-px web copy actually served (**A-003**). The learner's marker is a separate annotation layer and is never part of the asset.

**The baseline is an educational appearance reference. It shows a different patient (a young adult woman) from the case patient (45-year-old man). The result UI says so** ("not an image of the case patient"). Case demographics and all Session 1–3 technique/attenuation data were deliberately **not** changed (see Limitations and Session 5).

## 4. Which state drives which effect

`RadiographResultState` (schema v2 — v1 plus `patientResponse`) was inspected first. Everything below is driven only by existing state; nothing is fabricated from an unrelated control.

Each effect has **two separate evidence records**: the clinical **concept** (what is true in radiography, with its evidence class) and the **rendered magnitude** (how much is drawn). The concept may be validated or a common criterion; **the rendered magnitude is always an EDUCATIONAL VISUAL APPROXIMATION** (or "nothing drawn"). Nothing visual in this renderer is a clinically validated appearance, and the UI says so on every card ("Clinical concept: …" / "Rendered magnitude: Educational visual approximation").

| Effect | Driven by (state field) | Clinical **concept** (class · source) | Rendered **magnitude** |
|---|---|---|---|
| Baseline appearance | none (no fault effects) | EDUCATIONAL SIMPLIFICATION · asset requirements | none — the asset as is |
| **Rotation** → thoracic asymmetry, spinous line vs. clavicles, small transradiancy difference | `geometry.rotationDeg` | COMMON REFERENCE · WHO: spinous processes ≈ midway between the medial clavicle ends; rotation changes that relationship and hemithoracic projection (direction evidence-supported; body morphology changes it) | EDUCATIONAL VISUAL APPROXIMATION · never a whole-image rotation; no px↔° claim |
| **Collimation clipping** | `geometry.fieldCm`, `clippedSides` | VALIDATED · anatomy outside the field is not imaged (geometry) | EDUCATIONAL VISUAL APPROXIMATION · the field edge is exact; where the anatomy lies under it follows an approximate landmark mapping (§6) |
| **Centering** | `geometry.centralRay` → field | VALIDATED · the field follows the central ray | none — the field moves, the anatomy does not |
| **Excess field** | `findings` (`collimation-excess`) | EDUCATIONAL SIMPLIFICATION | none — larger exposed region only; **no scatter/contrast penalty** (provisional, no physical model) |
| **Scapulae** | `patient.shoulders` | COMMON REFERENCE · IAEA: medial scapular borders outside the lung fields | EDUCATIONAL VISUAL APPROXIMATION · schematic overlay shape, position and density |
| **Chin** | `patient.chin` | VALIDATED · chin elevated / clear of the upper chest is the Session 2 positioning rule (the control is not an angle) | EDUCATIONAL VISUAL APPROXIMATION · schematic jaw / soft-tissue shadow |
| **Reduced inspiration** | `patientResponse.inspiration` | COMMON REFERENCE · deep/full inspiration; reduced inspiration tends to show reduced expansion and higher diaphragms (direction evidence-supported); no rib-count rule | EDUCATIONAL VISUAL APPROXIMATION · fixed 12 % shortening of apex→dome, raised diaphragm |
| **Motion** | `patientResponse.motion` | VALIDATED · patient/respiratory motion reduces sharpness | EDUCATIONAL VISUAL APPROXIMATION · fixed blur size, not a movement distance |
| **Low exposure** | `exposure.quantumNoise` (level, 1/√ratio) | VALIDATED · insufficient detector exposure increases noise and impairs low-contrast information (AAPM/ACR) | EDUCATIONAL VISUAL APPROXIMATION · deterministic noise amplitude + detail loss; **brightness held normalised**; not a real detector's noise, EI or dose |
| **Excess exposure** | `exposure.tendency` / `doseAwareness` | VALIDATED · DR can look acceptable across a broad exposure range (dose creep) | none — **no change to the picture by design**; never darkened; shown by DI / dose-awareness feedback |
| **Low penetration** | `exposure.penetration === "low"` | COMMON REFERENCE · IAEA: retrocardiac lung / mediastinum should be visualised | EDUCATIONAL VISUAL APPROXIMATION · fixed fraction of local contrast kept in dense zones only; independent of mAs |
| **Marker** | `patient.marker` (side + detector-relative position) | EDUCATIONAL SIMPLIFICATION · annotation behaviour, patient-side correctness unscored | EDUCATIONAL VISUAL APPROXIMATION · a glyph at the placed position, clipped by the field, never corrected |
| Projection not simulated | `geometry.projection` ≠ PA | scope | none — PA appearance shown with a notice |

Every plan effect carries `drivers` (state paths), a `concept` record (one of the five project `EVIDENCE_CLASSES`, mapped from the image-quality reference's own classification) and a `magnitude` record (`educational-visual-approximation` or `none`, never "validated"); both are shown to the learner next to each explanation, and tests enforce the split.

### Magnitudes (all EDUCATIONAL; see `tuning.ts`)
Rotation: spinous column shift 0.4 % image-width per degree (Gaussian σ 6 % so the medial clavicle ends move far less), interior shift 0.15 %/°, transradiancy tilt 0.3 %/° (clamped to the console's ±20°). Reduced inspiration: apex→dome distance shortened by 12 %. Motion: 0.35 cm vertical × 0.12 cm horizontal box blur. Noise: σ = 9 · √(relativeNoise² − 1) grey levels, applied only when the model's noise level is *increased/marked*; fine-detail gain 1/(1 + 0.25·(relativeNoise² − 1)). Low penetration keeps 30 % of local structure contrast in the dense zones. None of these is calibrated.

## 5. Patient Instructions (addition to the Session 4 scope)

The learner acts as the radiographer and **chooses what to say, never the defect**. There is no control named "poor inspiration", "patient moved" or "add motion".

```
learner action          →  simulated patient response       →  resulting image-quality state  →  visual effect
(instruction chosen)       (cooperation profile, data)         (derived, deterministic)           (educational approximation)
breathing instruction   →  follows it                       →  inspiration: adequate | reduced →  raised diaphragm / shorter lungs
keep-still instruction  →  holds still, or does not         →  motion: none | motion           →  loss of sharpness
```

| Distinction | Content |
|---|---|
| **Learner action** | `breathing` (existing setting, relocated into the new panel) and the new `motionInstruction`: *none* / *"Stay still and don't move until I tell you."* / *"Relax — you can move naturally."* Four breathing wordings as before. Nothing is marked right or wrong before exposure. |
| **Simulated patient response** | `RadCase.patientCooperation` (`PatientCooperationProfile`): a deterministic table instruction → outcome. The case ships one profile, *cooperative adult*. **An educational assumption, not a measurement.** |
| **Resulting state** | `RadiographResultState.patientResponse = { profileId, instructions, inspiration, motion }`. Inspiration depends only on the breathing instruction and motion only on the keep-still instruction (tested for every combination); neither reads kVp, mAs, SID, rotation, exposure mode or any geometry. |
| **Evidence-supported principle** | Deep/full inspiration with suspended respiration is a common PA chest quality criterion (IAEA/WHO); motion reduces sharpness (validated). |
| **Educational approximation** | That *this* instruction makes *this* simulated patient inspire fully / hold still, and every visual magnitude. |

**RAD-LAB does not measure actual patient inspiration or movement.** No universal rib-count rule is used. There is no randomness: the same actions always give the same outcome.

**Growth path.** Different patients (needing reinforcement, difficulty following breathing instructions) are different `PatientCooperationProfile` data; a test swaps the profile with no engine change. No scenario system was built.

### Scoring decision (top-level weights unchanged: 25/20/15/20/10/10)
- The breathing instruction is scored exactly as before (rule `breathing`, Breathing category).
- The keep-still instruction is a **weight-0, unscored** check (`motion-instruction`, like the side marker): its feedback and the `motion` variant are shown, but the score is provably unchanged (tested). Reason: the image-quality reference supports motion → blur (validated) but defines no scoring rule for the instruction itself, and splitting the 10 % Breathing weight would be an unsupported invention.
- **Recommended later integration:** if educators adopt a patient-instruction rubric, give the Breathing category a second weighted subcheck (or rename it "Patient instructions") with explicit weights approved by an educator; keep the unscored status until then.
- **Readiness** (workflow status, never correctness) gained one advisory: no keep-still instruction given. A "wrong" instruction is still "ready", so Practice Mode does not leak the answer.

## 6. Coordinate mapping, coverage gap and the default marker

The baseline's *anatomy landmark box* (apices, lateral lung/rib margins, costophrenic angles) is mapped onto `RadCase.requiredAnatomy` so that a field edge that cuts the required region also cuts the drawn anatomy (otherwise a "clipped" score could sit next to a complete-looking image). The two aspect ratios differ, so the mapping is **anisotropic (≈ 13 % in x)**. **This distorts anatomical proportions, including the apparent cardiothoracic ratio, and the result must not be used to judge heart size, lung width or any proportion** (see Limitations and review items).

**Detector coverage gap.** The source image does not cover the whole 35 × 43 cm detector: ≈ 1.8 cm each side and ≈ 5 cm at the bottom lie beyond the reference image. In digital radiography black reads as direct unattenuated exposure, and dark areas are also what the collimator shadow looks like, so those areas are **not** drawn black. Inside the field they are a **neutral grey diagonal hatch ("no reference data")** that cannot be mistaken for exposure, collimation or anatomy; outside the collimated field the detector stays the dark collimator shadow. The hatch is drawn after all image effects, so noise, blur, penetration or rotation never bleed into it, and display-brightness normalisation ignores it. The UI note (EN + AR) explains both treatments.

**Marker laterality convention (single source of truth).** *PA display: the patient's left appears on the viewer's right* (as if the viewer faces the patient; the baseline image has the heart on the viewer's right). Therefore **L belongs on the viewer's right half of the image and R on the viewer's left half**. The convention is case data (`RadCase.positioning.markerSide`) and is used by **both** marker scoring (`evalMarker`) and rendering (`RenderPlan.marker.viewerSide / wrongSide`); detector x < 0 is always the viewer's left, whatever the UI language or direction (tests assert that scoring, geometry and the renderer contain no locale/direction code, and the browser matrix checks the glyph side in EN and AR). The convention is an **educational simplification** (the references define no marker-side rule): the check stays **unscored (weight 0)**, a wrong-side marker is flagged in the feedback (EN + AR) together with any other remark, and it is drawn exactly where the learner placed it — never corrected or mirrored. TODO(medical-review): confirm the convention and decide whether marker side should be scored.

*Root cause of the laterality bug found in review.* Session 2 had no laterality notion at all: the marker check only tested presence, field and overlap, and the default marker position was the same for L and R (the viewer's left), so the default "L" sat on the patient's *right* and the check passed it. The Session 4 default-marker change kept that side-independent position. The workspace caption "Detector view (from the tube)" was also inconsistent with a radiograph-display convention (viewed from the tube the patient's left would be on the viewer's left); it now reads "Detector view as displayed (patient's left on the viewer's right)". Fix: per-side default positions (L → viewer's right margin, R → viewer's left margin), the shared convention above, the wrong-side feedback, and a practice-guide line stating the convention. Switching L ↔ R while the marker is still at its default moves it to the other side's default; a marker the learner moved is never relocated.

**Default marker.** The Session 2 default marker position (lower-left corner, 3 cm) lay partly outside a typical correct field, so a learner who never moved it saw an "L" with its foot cut off (looking like a bar). Each default is now a 2.2 cm marker in the lateral margin of its own side (x ≈ 1.7–3.9 cm for R, 31.1–33.3 cm for L; y ≈ 10.9–13.1 cm): inside a typical correct field (≥ ≈ 33 cm wide, central ray within ≈ ±0.7 cm of the midline) and outside the required-anatomy region. A narrower or clearly off-centre field still genuinely clips or drops the marker (behaviour kept, tested). Data changed: marker size, per-side default positions, `markerSide`.

## 7. Deliberately NOT implemented

| Not implemented | Why |
|---|---|
| Brightness changes for low or excess exposure | The references forbid teaching DR exposure as brightness (AAPM TG-116 / ACR). Brightness is normalised in display processing and tested. |
| Visible effect for excess exposure | By design (dose creep is invisible); shown through DI / dose awareness and an explanation card. |
| Contrast/scatter penalty for a large field | No physical model → provisional (reference table). |
| Effect for *high* penetration (high kVp) | The reference defines only reduced visibility for *low* penetration; high-kVp contrast loss is compensated by display processing and is vendor/processing dependent. |
| SID magnification / geometric unsharpness | Not requested in this session's effect list; Session 3 keeps the SID rule and exposure physics. |
| Hilar / mediastinal rotation effects beyond the spinous shift | The reference allows them "only if the asset/model supports them"; a single 2D image cannot separate layers. |
| AP / lateral appearance | Out of scope; selecting them shows the PA appearance with an explicit "not representative" notice. |
| Rotation→degrees claim, rib-count inspiration rule, blur→distance, noise→EI/dose, universal DI limit, EIT | Forbidden by the reference ("Do NOT implement as clinical truth"). |
| Per-pixel scoring or any pixel read-back into state | Architecture rule; enforced by tests. |

## 8. Tests

276 unit tests pass (151 before Session 4 → +125). New / extended suites:

- `patient/response.test.ts` (19): correct vs incorrect breathing; keep-still vs omitted/wrong; inspiration ⟂ motion for all 12 combinations; determinism; **motion and inspiration not inferred from kVp/mAs/SID/rotation/AEC/geometry/chin/shoulders/projection**; swappable profile; weight-0 scoring (score identical for every instruction); readiness does not leak the answer.
- `radiograph/plan.test.ts` (21): correct baseline; box→region mapping; rotation cues (sign, proportionality, clamp, no angle/transform); centering moves the field not the anatomy; each clipping direction; excess field = no penalty; scapulae/chin flags; inspiration/motion from the patient response only; low-exposure vs excess-exposure vs penetration separation; motion ⟂ noise; marker placement/side/never auto-corrected/visible fraction; non-PA flag; combined errors; determinism/serialisability/seed from the case; evidence + drivers on every effect.
- `radiograph/pipeline.test.ts` (33, on a synthetic phantom, Node): byte-identical repeat renders; **rotation moves the spinous column ± and keeps the image footprint and lateral margins (not a whole-image rotation)**; reduced inspiration raises the diaphragm edge and keeps the apex; monotonic vertical map; **all four clipping directions leave the clipped anatomy unexposed and nothing outside the field carries signal**; open field applies no penalty; **low exposure adds noise and does not change mean brightness (mAs 0.5–2)**; noise grows as exposure falls; **excess exposure is pixel-identical to the reference for mAs up to 40 (no darkening)**; brightness invariant across five exposures; **low penetration lowers structure contrast only in dense zones with no brightness shift and is not repaired by mAs**; motion blurs edges, adds no noise, does not change brightness; low exposure does not blur; overlays are local; combined errors compose; input immutability.
- **Laterality regression tests** — `evaluation/marker-laterality.test.ts` (new): the convention is case data and agrees with the baseline (L on the cardiac side); each marker's default lies on its own side; correct-side L/R pass, swapped ones are flagged (EN and AR text present, same verdict, midline flagged, flagged together with outside-field), unscored (score identical, weights unchanged); rendering draws the glyph where placed (never corrected or mirrored) and `wrongSide` agrees with the check for every sampled position; scoring/geometry/renderer contain no locale/direction code. Plus messages tests for the convention text.
- **Fix-pass regression tests** — `pipeline.test.ts` ("detector area the baseline does not cover"): the uncovered bands exist; inside the field they are exactly the two neutral grey hatch values (never black, > 60 grey levels above the collimator shadow) and alternate; outside the collimated field the same area is the dark shadow; the hatch is byte-identical under noise, blur, penetration and rotation; brightness normalisation ignores it. `plan.test.ts` ("default marker"): the default marker is complete (fraction 1 and the `side-marker` check passes) in every typical correct field × central ray × L/R, stays outside the required-anatomy region, equals the initial marker position, and is still dropped/clipped by a narrowed field. `plan.test.ts` ("concept and rendered magnitude"): every effect has both records; magnitude is never "validated"; validated/evidence-supported concepts (motion, noise, penetration, rotation, scapulae, jaw, inspiration) still carry an approximate magnitude; effects that draw nothing say so.
- `radiograph/architecture.test.ts`: scoring/technique/patient logic never imports the renderer or reads pixels; renderer never imports the engine; pipeline/plan are pure; no randomness; canvas LTR and locale-agnostic; logical CSS only in new components.
- `i18n/messages.test.ts` (+7): EN/AR parity (already enforced) plus every effect and instruction translated, Arabic text is Arabic, disclaimers present, no brightness-as-exposure wording, no measured-quantity claims, instruction wording never labelled right/wrong.
- `simulation-store.test.ts` (+4), `result-state.test.ts` (+1), updated settings fixtures in four older test files (a new required setting).

## 9. Real-browser verification

Playwright 1.x + Chromium against the **production build** (`npm run build && next start`), driving the real UI only (never the store): `scripts/verify-session4.mjs` (not a project dependency; `npm i --no-save playwright`). Matrix: **EN (LTR) and AR (RTL)** × **desktop 1440 × 900 (mouse)**, **tablet 820 × 1180 (touch, taps)**, **mobile 390 × 844 (touch, taps)**.

- **Desktop, both languages — 22 acquisitions:** correct baseline; rotation + and −; centering off (field shifted, no clipping); clipping top / bottom / left / right; low exposure; excess exposure; low penetration; scapulae; chin; reduced inspiration; motion; the **default marker** L and R (never moved) and a marker genuinely dropped by a narrowed field; **fully open field (grey "no reference data" hatch probes)**; AP projection (not-representative notice); combined errors.
- **Tablet and mobile, both languages — 6 acquisitions each:** correct, rotation, clipping, low exposure, motion, combined.
- Per acquisition (≈ 36 assertions): `html dir`; no result and no explanation before exposure (Practice Mode does not leak); the expected effects are present and the forbidden ones absent (e.g. motion ⇒ no inspiration/low-exposure effect); the explanation cards match the canvas; no raw setting ids shown; no horizontal overflow; radiograph inside the viewport; canvas `direction: ltr`; zero console errors / page errors.
- Cross-checks: **the same acquisition gives a byte-identical radiograph (PNG hash) in EN and AR and on desktop/tablet/mobile** (RTL does not mirror the anatomy or the marker; rendering is deterministic); excess exposure is pixel-identical to the correct picture; every fault differs from the correct picture; rotation + and − differ.
- Keyboard: arrow keys change the breathing and the keep-still instruction; Retry keeps the instructions, clears the result, and exposing again reproduces the identical picture.
- **Results:** full matrix **972 / 972** checks passed on the production build after the laterality fix (earlier matrices: 906 / 906 after the first fix pass, 788 / 788 before it). The laterality scenarios (default L, default R, L moved to the wrong side, R moved to the wrong side, marker dropped by a narrow field) run on every device in EN and AR and assert the glyph is on the correct image half, never on the other half, and flagged in the feedback only when wrong. The default-marker check counts bright glyph pixels in the marker's detector area (recorded in full ⇒ > 80, dropped ⇒ 0); the hatch check reads canvas pixels in the uncovered bands of an open field (exactly the two hatch greys, never black). Screenshots were inspected visually (page and image, desktop/tablet/mobile, EN/AR). Rendered results for review are committed under [`session-4-renders/`](session-4-renders/) (13 cases in EN and AR + a contact sheet per language + a magnified low-penetration comparison; registry **A-004**).

### Defects found and fixed during verification / visual inspection
1. **Pre-existing (Sessions 1–3): enum settings were shown untranslated in the result feedback** (“Your setting: pa-erect / tucked / no-instruction”) in both languages, because `evalRule` dropped `observedKind`. Fixed; regression test in `engine.test.ts` and a raw-id assertion in the browser script.
2. Visual tuning from inspecting renders (not logic bugs): scapula overlay was too faint to read (raised), motion blur and quantum noise were too strong (reduced), rotation was too subtle at 10–12° (raised).
3. Verification-script defects (not product): an mAs value that is not a console station silently selected the minimum; fixed and now asserted.
4. **Found in review, fixed in the fix passes:** (0) **wrong-side default marker** — see "Root cause" in §6 (no laterality convention in Session 2; side-independent default);  (a) detector areas beyond the reference image were drawn **black**, which reads as direct exposure and is confusable with the collimator shadow → now a neutral grey hatch; (b) the Session 2 default marker position was partly outside a typical correct field, so an “L” lost its foot and looked like a bar → new default inside the field (§6); (c) evidence labels merged the clinical concept with the drawn magnitude → separate "Clinical concept" / "Rendered magnitude" records (§4). Each has regression tests.

## 10. Limitations

- **Anisotropic landmark mapping (≈ 13 % in x) distorts anatomical proportions**, including the apparent **cardiothoracic ratio**, lung width and heart size. The renderer is for image-quality cues only and must not be used to teach or judge proportions. Not changed in this session (it keeps field cuts and drawn anatomy consistent with the Session 2 required-anatomy region); it needs a Session 5 decision.
- **Baseline patient mismatch.** The reference radiograph is a 21-year-old woman; the case patient is a 45-year-old man. Treated strictly as an appearance baseline, labelled in the UI; case data deliberately untouched.
- One baseline image: all variation is synthetic. Effects are approximations of a *direction*; none reproduces how a real radiograph of a rotated, moving or under-exposed patient looks.
- Scapula and jaw overlays are schematic drawings, not real anatomy from the reference image.
- The reference image covers ≈ 88 % of the detector height and ≈ 90 % of its width; the rest is drawn as a neutral grey "no reference data" hatch inside the field (never black).
- The landmark box and zones were placed by eye on this image (TODO(medical-review)).
- Marker laterality is an educational display convention (PA display, patient left = viewer right); the check is unscored; an educator should confirm it.
- Single cooperation profile; keep-still instruction is unscored; Practice Mode only (the post-exposure analysis and effect cards are not yet gated for Assessment Mode).
- Mobile: the result image is shown at the working resolution of 840 × 1032 px scaled by CSS; no zoom/pan, no window/level control.
- AP and lateral are shown as "not representative".

## 11. Items requiring educator / medical-physicist review

1. All magnitudes in `tuning.ts` (rotation shifts, 12 % inspiration, blur, noise, penetration contrast kept).
2. Landmark box, scapula and jaw geometry, dense-zone placement (`chest-pa-radiograph.ts`).
3. Whether a keep-still instruction should be scored, and how (see §5).
4. The cooperation profile assumptions (every non-"deep breath" wording → reduced inspiration; absent/"relax" keep-still instruction → motion).
5. Whether the reduced-inspiration cue set (shorter lungs, higher diaphragm) is acceptable without a rib-count rule.
6. Arabic terminology (hemithorax, transradiancy, quantum noise, dose creep, spinous processes).
7. The appearance baseline vs the case patient (demographics, habitus).
8. Whether the transradiancy tilt under rotation should be kept.
9. **The ≈ 13 % anisotropic mapping and its effect on anatomical proportions (cardiothoracic ratio appearance):** keep, change the required-anatomy region, or source a baseline whose proportions fit the detector.
11. The marker-laterality convention and whether marker side should be scored (currently weight 0).
10. The grey hatch wording / appearance for "no reference data", and the 2.2 cm default marker size and position.

## 12. Recommended Session 5 scope (QA, not new features)

1. **Decide the baseline/patient mismatch:** either align the case demographics with the CC0 baseline (young adult female) or source an open-licence adult-male PA baseline (documenting it in the registry), then re-check the landmarks.
2. Educator/physicist review of §11 items 1–6 and adjust `tuning.ts` / asset data only.
3. Visual regression harness: commit golden canvas hashes/screenshots for the scenarios in `scripts/verify-session4.mjs`; run Playwright in CI.
4. Resolve the detector-coverage gap (reference image vs. 35 × 43 cm detector) — by a baseline that covers the detector or by case data — **and the ≈ 13 % anisotropic mapping that distorts anatomical proportions, including cardiothoracic-ratio appearance**; the two are best solved together.
5. Gate post-exposure explanations (effect cards, DI analysis) for Assessment Mode.
6. Accessibility pass on the canvas (text alternative summarising the applied effects), zoom/pan on mobile.
7. Decide scoring integration for patient instructions (§5).
