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
| 6 | field / collimation mask | unexposed outside the collimated field (and beyond the source image) with a soft penumbra |
| 7 | annotation | the learner's L/R marker, drawn on top, clipped by the field |

## 3. Baseline asset

CC0 1.0, *Normal posteroanterior (PA) chest radiograph (X-ray)*, Mikael Häggström, Wikimedia Commons. Master `3124c4cf…` verified byte-identical to the Commons record (registry **A-001**); derived clean baseline with the embedded "Dx"/"Sin" annotations neutralised over non-anatomical background (**A-002**); 1000-px web copy actually served (**A-003**). The learner's marker is a separate annotation layer and is never part of the asset.

**The baseline is an educational appearance reference. It shows a different patient (a young adult woman) from the case patient (45-year-old man). The result UI says so** ("not an image of the case patient"). Case demographics and all Session 1–3 technique/attenuation data were deliberately **not** changed (see Limitations and Session 5).

## 4. Which state drives which effect

`RadiographResultState` (schema v2 — v1 plus `patientResponse`) was inspected first. Everything below is driven only by existing state; nothing is fabricated from an unrelated control.

| Effect | Driven by (state field) | Clinical principle class | Visual mapping |
|---|---|---|---|
| Baseline appearance | none (no fault effects) | EDUCATIONAL SIMPLIFICATION | the asset |
| **Rotation** → thoracic asymmetry, spinous line vs. clavicles, small transradiancy difference | `geometry.rotationDeg` | COMMON REFERENCE (WHO: spinous processes ≈ midway between medial clavicle ends) | educational approximation; **never** a whole-image rotation; no px↔° claim |
| **Collimation clipping** | `geometry.fieldCm`, `clippedSides` | VALIDATED (geometry) | anatomy outside the field is *actually unexposed*, per side |
| **Centering** | `geometry.centralRay` → field (field is centred on the ray) | VALIDATED (geometry) | field moves; anatomy stays where it is on the detector |
| **Excess field** | `findings` (`collimation-excess`) | EDUCATIONAL SIMPLIFICATION | larger exposed region only; **no scatter/contrast penalty drawn** (provisional, no physical model) |
| **Scapulae** | `patient.shoulders` | COMMON REFERENCE (IAEA: medial scapular borders outside the lungs) | schematic overlay over lateral lung fields |
| **Chin** | `patient.chin` | EDUCATIONAL SIMPLIFICATION | schematic jaw/soft-tissue shadow over the apices; control ≠ angle |
| **Reduced inspiration** | `patientResponse.inspiration` | COMMON REFERENCE (deep/full inspiration) | shorter lung fields, higher diaphragm; no rib-count rule |
| **Motion** | `patientResponse.motion` | VALIDATED (motion → loss of sharpness) | blur; magnitude educational, not a distance |
| **Low exposure** | `exposure.quantumNoise` (level, 1/√ratio) | VALIDATED (DR principle) | deterministic quantum-noise-like texture + loss of fine low-contrast detail; **brightness held normalised** |
| **Excess exposure** | `exposure.tendency` / `doseAwareness` | VALIDATED (DR principle) | **no change to the picture by design** — never darkened; the problem is shown by DI / dose-awareness feedback |
| **Low penetration** | `exposure.penetration === "low"` | COMMON REFERENCE (IAEA: retrocardiac lung / mediastinum visualised) | reduced structure contrast inside mediastinal / cardiac / retrocardiac zones only; independent of mAs |
| **Marker** | `patient.marker` (side + detector-relative position) | EDUCATIONAL SIMPLIFICATION | drawn where placed; clipped by the field; never corrected |
| Projection not simulated | `geometry.projection` ≠ PA | scope | PA appearance shown with a notice |

Every plan effect carries `drivers` (state paths) and an evidence record in the image-quality reference's own classification, mapped to the five project evidence classes (`EVIDENCE_CLASSES`); the learner sees the class next to each explanation.

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

## 6. Coordinate mapping, bands and the landmark box

The baseline's *anatomy landmark box* (apices, lateral lung/rib margins, costophrenic angles) is mapped onto `RadCase.requiredAnatomy` so that a field edge that cuts the required region also cuts the drawn anatomy (otherwise a "clipped" score could sit next to a complete-looking image). The two aspect ratios differ, so the mapping is slightly anisotropic (≈ 13 % in x). The source image does not cover the whole 35 × 43 cm detector: ≈ 1.8 cm on each side and ≈ 5 cm at the bottom are **beyond the reference image** and render as unexposed black; the UI says so ("dark margins lie outside the collimated field or beyond the edge of the reference image"). The required-anatomy region itself is a Session 2 provisional demo value.

The Session 2 default marker position (lower-left corner) lies partly outside a typical tight field, so a learner who does not move it sees a clipped marker (an "L" can lose its foot and look like a bar). This is the faithful consequence of marker-vs-field geometry and is explained by the existing marker feedback.

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

243 unit tests pass (151 before Session 4 → +92). New / extended suites:

- `patient/response.test.ts` (19): correct vs incorrect breathing; keep-still vs omitted/wrong; inspiration ⟂ motion for all 12 combinations; determinism; **motion and inspiration not inferred from kVp/mAs/SID/rotation/AEC/geometry/chin/shoulders/projection**; swappable profile; weight-0 scoring (score identical for every instruction); readiness does not leak the answer.
- `radiograph/plan.test.ts` (21): correct baseline; box→region mapping; rotation cues (sign, proportionality, clamp, no angle/transform); centering moves the field not the anatomy; each clipping direction; excess field = no penalty; scapulae/chin flags; inspiration/motion from the patient response only; low-exposure vs excess-exposure vs penetration separation; motion ⟂ noise; marker placement/side/never auto-corrected/visible fraction; non-PA flag; combined errors; determinism/serialisability/seed from the case; evidence + drivers on every effect.
- `radiograph/pipeline.test.ts` (33, on a synthetic phantom, Node): byte-identical repeat renders; **rotation moves the spinous column ± and keeps the image footprint and lateral margins (not a whole-image rotation)**; reduced inspiration raises the diaphragm edge and keeps the apex; monotonic vertical map; **all four clipping directions leave the clipped anatomy unexposed and nothing outside the field carries signal**; open field applies no penalty; **low exposure adds noise and does not change mean brightness (mAs 0.5–2)**; noise grows as exposure falls; **excess exposure is pixel-identical to the reference for mAs up to 40 (no darkening)**; brightness invariant across five exposures; **low penetration lowers structure contrast only in dense zones with no brightness shift and is not repaired by mAs**; motion blurs edges, adds no noise, does not change brightness; low exposure does not blur; overlays are local; combined errors compose; input immutability.
- `radiograph/architecture.test.ts`: scoring/technique/patient logic never imports the renderer or reads pixels; renderer never imports the engine; pipeline/plan are pure; no randomness; canvas LTR and locale-agnostic; logical CSS only in new components.
- `i18n/messages.test.ts` (+7): EN/AR parity (already enforced) plus every effect and instruction translated, Arabic text is Arabic, disclaimers present, no brightness-as-exposure wording, no measured-quantity claims, instruction wording never labelled right/wrong.
- `simulation-store.test.ts` (+4), `result-state.test.ts` (+1), updated settings fixtures in four older test files (a new required setting).

## 9. Real-browser verification

Playwright 1.x + Chromium against the **production build** (`npm run build && next start`), driving the real UI only (never the store): `scripts/verify-session4.mjs` (not a project dependency; `npm i --no-save playwright`). Matrix: **EN (LTR) and AR (RTL)** × **desktop 1440 × 900 (mouse)**, **tablet 820 × 1180 (touch, taps)**, **mobile 390 × 844 (touch, taps)**.

- **Desktop, both languages — 20 acquisitions:** correct baseline; rotation + and −; clipping top / bottom / left / right; low exposure; excess exposure; low penetration; scapulae; chin; reduced inspiration; motion; marker R (clipped by the field), marker clipped out of the field, marker L and R fully visible (moved by keyboard); AP projection (not-representative notice); combined errors.
- **Tablet and mobile, both languages — 6 acquisitions each:** correct, rotation, clipping, low exposure, motion, combined.
- Per acquisition (≈ 36 assertions): `html dir`; no result and no explanation before exposure (Practice Mode does not leak); the expected effects are present and the forbidden ones absent (e.g. motion ⇒ no inspiration/low-exposure effect); the explanation cards match the canvas; no raw setting ids shown; no horizontal overflow; radiograph inside the viewport; canvas `direction: ltr`; zero console errors / page errors.
- Cross-checks: **the same acquisition gives a byte-identical radiograph (PNG hash) in EN and AR and on desktop/tablet/mobile** (RTL does not mirror the anatomy or the marker; rendering is deterministic); excess exposure is pixel-identical to the correct picture; every fault differs from the correct picture; rotation + and − differ.
- Keyboard: arrow keys change the breathing and the keep-still instruction; marker moved with Shift+Arrow; Retry keeps the instructions, clears the result, and exposing again reproduces the identical picture.
- **Results:** full matrix **788 / 788** checks passed; follow-up runs after the last changes: Retry/determinism **141 / 141**, visible-marker scenarios **65 / 65** each. Screenshots were inspected visually (page and image, desktop/tablet/mobile, EN/AR): baseline, rotation ±, clipping on all four sides, noise, penetration, motion, inspiration, scapulae, chin, markers, combined errors, mobile scaling, RTL layout. A contact sheet of the effects is in [`session-4-effects-contact-sheet.jpg`](session-4-effects-contact-sheet.jpg) (registry **A-004**).

### Defects found and fixed during verification / visual inspection
1. **Pre-existing (Sessions 1–3): enum settings were shown untranslated in the result feedback** (“Your setting: pa-erect / tucked / no-instruction”) in both languages, because `evalRule` dropped `observedKind`. Fixed; regression test in `engine.test.ts` and a raw-id assertion in the browser script.
2. Visual tuning from inspecting renders (not logic bugs): scapula overlay was too faint to read (raised), motion blur and quantum noise were too strong (reduced), rotation was too subtle at 10–12° (raised).
3. Verification-script defects (not product): an mAs value that is not a console station silently selected the minimum; fixed and now asserted.
4. Observed, kept by design: with the Session 2 default marker position and a typical field, the marker's lower edge is cut by the field, so an “L” can look like a bar. That is the faithful geometric consequence (and the existing marker feedback says it is partly outside the field); the visible-marker scenarios confirm L/R render correctly and are not mirrored in Arabic.

## 10. Limitations

- **Baseline patient mismatch.** The reference radiograph is a 21-year-old woman; the case patient is a 45-year-old man. Treated strictly as an appearance baseline, labelled in the UI; case data deliberately untouched.
- One baseline image: all variation is synthetic. Effects are approximations of a *direction*; none reproduces how a real radiograph of a rotated, moving or under-exposed patient looks.
- Scapula and jaw overlays are schematic drawings, not real anatomy from the reference image.
- The reference image covers ≈ 88 % of the detector height and ≈ 90 % of its width; the rest renders black.
- The landmark box and zones were placed by eye on this image (TODO(medical-review)).
- Anisotropic (≈ 13 %) mapping of the landmark box onto the Session 2 required-anatomy region.
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

## 12. Recommended Session 5 scope (QA, not new features)

1. **Decide the baseline/patient mismatch:** either align the case demographics with the CC0 baseline (young adult female) or source an open-licence adult-male PA baseline (documenting it in the registry), then re-check the landmarks.
2. Educator/physicist review of §11 items 1–6 and adjust `tuning.ts` / asset data only.
3. Visual regression harness: commit golden canvas hashes/screenshots for the scenarios in `scripts/verify-session4.mjs`; run Playwright in CI.
4. Resolve the detector-coverage gap (reference image vs. 35 × 43 cm detector) — by a baseline that covers the detector or by case data.
5. Gate post-exposure explanations (effect cards, DI analysis) for Assessment Mode.
6. Accessibility pass on the canvas (text alternative summarising the applied effects), zoom/pan on mobile.
7. Decide scoring integration for patient instructions (§5).
