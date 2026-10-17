# Session 3 — Technique & exposure console

Primary medical reference: `RAD-LAB_Medical_Reference_Chest_PA_Technique.md` ("technique ref"). Positioning baseline: `RAD-LAB_Medical_Reference_Chest_PA.md` ("positioning ref"). Both are now stored in `docs/`. No other source was used; numbers the references do not supply are configurable, classified, and never shown as universal.

## What was implemented
- **Vendor-neutral educational console** (`features/xray-console/`): SID, kVp and mAs numeric displays with − / + (tap, press-and-hold, Enter/Space) and sliders; Manual / AEC mode switch; AEC chamber selector (diagram + checkboxes); readiness panel; Expose. Works with mouse, touch and keyboard, 44 px targets, EN/AR, RTL.
- **Deterministic exposure model** (`features/technique/`, pure, no React): detector-exposure ratio, DI, noise / penetration / dose-awareness tendencies, AEC termination, readiness, console stepping.
- **Technique protocol profile as case data** (`data/cases/chest-pa-technique.ts`, type `TechniqueProfile`).
- **Four evidence-labelled technique subchecks** inside the existing Exposure category; evidence class + reference shown per check in the result.
- **Post-exposure analysis** (`TechniqueResult`): metrics, DI gauge, AEC outcome, "why" lessons, and a "model assumptions & evidence" list.
- **Renderer-facing result state** (`domain/result-state.ts`, built in `features/evaluation/result-state.ts`) for Session 4.
- Placeholder result image no longer maps exposure to brightness (noise tendency only).

## Architecture changes
```
domain/technique.ts      types: EvidenceClass, TechniqueProfile, DetectorExposureResult, AEC types
domain/result-state.ts   RadiographResultState (renderer input)
features/technique/      di · model · aec · readiness · stations   (pure)  + TechniqueResult (UI)
features/evaluation/     engine now evaluates `technique` rules; builds resultState
stores/                  setSetting snaps numeric values to the console; expose() requires readiness
```
- `SimulationSettings` gained `exposureMode` and `aecChambers`. **SID is still the single `sidCm`** shared by the plan view, the SID rule and the exposure model.
- `RadCase` gained `technique: TechniqueProfile`; `controls.mas.stations` (an R10-style series) is console hardware, not a target.
- `ImageVariantId` `underexposed`/`overexposed` were replaced by `low-exposure`, `excess-exposure` and `low-penetration` so no variant name implies brightness. Existing Session 1/2 behaviour is otherwise unchanged; the old `kvp`/`mas` range rules were replaced (see Scoring).
- `EvidenceStatus` widened from 3 to the 5 classes of technique ref §2.

## The four concepts, kept separate
| Concept | Where | Notes |
|---|---|---|
| A. Selectable range | `RadCase.controls` | hardware limits only |
| B. Educational protocol target | `technique.manual.reference`, `kvp.targetBand`, `aec.*` | PROVISIONAL |
| C. Scoring tolerance | `technique.deviation`, `kvp.referenceRange` | PROVISIONAL |
| D. Evidence class | on every group/rule + `assumptions` | shown to the learner |

## Technique model
```
ratio = EI/EIT = (mAs / mAs_target) where
  mAs_target = mAs_ref · attenuation / ( (kVp/kVp_ref)^n · (SID_ref/SID)² · detectorResponse )
DI = 10·log10(ratio)
```
Manual: `ratio` as above. AEC: `ratio` comes only from where the chambers sense (below); kVp, SID and patient attenuation change the mAs the AEC *delivers*, not the receptor exposure. Everything is target-relative: **no numeric EI or EIT exists anywhere** (a test enforces this). There is no brightness/density output at all.

Derived: `tendency` (insufficient / below / target-range / above / excessive, from the DI bands), `quantumNoise` (relative = 1/√ratio, plus a level), `penetration` (kVp vs the common reference range; independent of mAs — extra mAs cannot repair it), `doseAwareness` (optimized / below-target / above-target / dose-creep-risk).

## Manual mode
Learner selects kVp and mAs. mAs steps through stations (0.5 … 40) and starts from a value (12) that is not a station; the first step lands on the adjacent one. In AEC the manual mAs is kept but unused and shown as AUTO.

## AEC model (vendor-neutral)
Three fields (left / centre / right of the detector view). Selected chambers count only if ≥ 50 % of their area is inside the collimated light field (so centring and collimation matter). The AEC terminates on the mean *signal* of active chambers; a chamber under denser anatomy sees less signal, so the lungs end above target (harmonic mean of per-anatomy factors). With no active chamber it runs to a backup limit. The demo's preference for the lung-field chambers is an educational, protocol-specific choice; the UI states that real systems differ and no combination is claimed universal. The chamber check is weight 0 (explains the result); its consequence is scored once through DI.

## EI / EIT / DI handling
`deviationIndex(ei, eit)`, `deviationIndexFromRatio`, `exposureRatioFromDI`. DI = 0 on target, ≈ +3 for 2×, ≈ −3 for ½. EI is never called dose. The ±1 (full) and ±3 (partial) bands are PROVISIONAL demo tolerances; there is no universal pass/fail limit.

## SID integration
Same `sidCm`. Manual: `(SID_ref/SID)²` scales receptor exposure. AEC: compensated. The existing SID rule (geometry/magnification, 10 % category) is unchanged apart from reclassification and extra exposure wording.

## Dose awareness
`dose-optimization` fails/partials above the target band; `exposure-adequacy` only penalises the low side. Therefore more mAs is not rewarded (tested: the exposure category score peaks near target and falls on both sides). No patient dose is calculated.

## Readiness
`assessReadiness` reports workflow status only (never correctness): **blocked** = exposure already made, value outside the console range, AEC with no chamber; **caution** = no breathing instruction, no side marker, AEC chambers all outside the field. `expose()` is refused when blocked. Wrong-but-complete setups are "ready" (tested), so Practice Mode does not leak the answer.

## Result-state architecture
`RadiographResultState` (schema v1): geometry (projection, rotation, SID, central ray, field cm, clipped sides), patient prep (chin, shoulders, breathing, marker), technique (mode, kVp, manual mAs, chambers), full `DetectorExposureResult`, variants and non-passing findings. Plain serialisable data from pure functions; a renderer must consume it and must not score by pixels. `EvaluationResult.resultState` and `.exposure` carry it.

## Scoring decisions
Global weights unchanged (25/20/15/20/10/10). Exposure subchecks (relative weights): `kvp` 1, `exposure-adequacy` 2, `dose-optimization` 2, `aec-chambers` 0 (AEC only). The Session 1 `kvp` and `mas` range rules were replaced: a fixed "correct mAs band" is exactly what the references forbid. The mode choice itself is unscored. Every rule carries status, reference, class, explanation and corrective feedback in EN + AR (tested).

## Medical rule classification
| Rule | Class | Ref |
|---|---|---|
| DI = 10·log10(EI/EIT); DI 0 / ±3 meaning | VALIDATED | §6.3 |
| Brightness is not an exposure meter on DR | VALIDATED | §5 |
| EI ≠ patient dose; no universal Chest-PA EIT | VALIDATED | §6.1–6.2 |
| mAs ↔ X-ray quantity; quantum noise ∝ 1/√exposure | VALIDATED physics | §8 |
| kVp ↔ spectrum / penetration / output | VALIDATED physics | §8 |
| Inverse-square distance–intensity | VALIDATED physics | §9 |
| SID → simulated detector exposure mapping | EDUCATIONAL SIMPLIFICATION | §9 |
| AEC purpose (consistent exposure, thickness compensation) | VALIDATED | §4 |
| DR can hide excess exposure (dose creep); optimization goal | VALIDATED | §7 |
| High-kVp chest; 100–150 kV range | COMMON REFERENCE / NOT UNIVERSAL | §3.2 |
| 180 cm SID | COMMON REFERENCE (reclassified from "validated target" in the Session 2 table, per technique ref §3.1) | §3.1 |
| Demo kVp target band 110–125 | PROVISIONAL / local-protocol | §3.2, §15.3 |
| Reference point 120 kVp · 3.2 mAs · 180 cm → DI 0 | PROVISIONAL | §3.3, §15.2 |
| Receptor exposure ∝ kVp³ | EDUCATIONAL SIMPLIFICATION (magnitude not validated) | §14 |
| DI scoring bands ±1 / ±3 | PROVISIONAL | §6.4, §15.5 |
| SID score bands (±5, 150–200) | PROVISIONAL | §3.1 |
| AEC chamber layout, selection, combination, termination, backup | VENDOR / LOCAL-PROTOCOL DEPENDENT | §4 |
| AEC anatomy factors (lung 1, mediastinum 1.8, air 0.4, backup 4×) | EDUCATIONAL SIMPLIFICATION | §4 |
| Detector / grid assumption | VENDOR / LOCAL-PROTOCOL DEPENDENT | §3.3, §12 |
| One reference adult attenuation | EDUCATIONAL SIMPLIFICATION | §10 |
| Exposure time | not modelled (future) | §11 |

## Tests added (151 total, was 48)
`di`, `model` (manual, SID, kVp, noise, penetration, patient/system inputs), `aec`, `readiness`, `stations`, `technique-scoring` (subchecks, evidence, AEC, anti-"more mAs", separation of A–D, no numeric EIT), `result-state`, `simulation-store` (kVp/mAs/SID state, mode switch, chambers, lock, Retry, Restart, aliasing, determinism), `messages` (EN/AR key parity, placeholders, Arabic script, evidence labels, bilingual case data). Session 1/2 engine tests were kept; only those asserting the removed `kvp`/`mas` range rules and the old variant names were rewritten with the same intent.

## Checks run
`npm run check` (typecheck + lint + 151 tests) and `npm run build` pass.

## Browser verification (Playwright + Chromium, production build)
Six runs: EN desktop 1440×900, AR desktop, EN mobile 390×844 (touch), AR mobile, EN tablet 820×1180 (touch), AR tablet — ~60 assertions each, plus visual inspection of screenshots. Exercised: kVp/mAs/SID buttons, slider keys (arrows/Home/End), Enter/Space on stepper buttons, press-and-hold, touch taps; Manual↔AEC; chamber selection by keyboard, mouse and tap (diagram and checkboxes); Session 2 positioning (projection, breathing, chin, shoulders, marker, rotation, central-ray keyboard nudge and drag, collimation sliders); Expose, locked controls, result, technique analysis, Retry (keeps settings), Restart (full reset). Verified `dir`, no horizontal overflow at every stage, no console/page errors, single SID shared with the plan view.

## Issues found and fixed during verification
- Console slider inherited `direction: rtl`, so ArrowRight *lowered* the value in Arabic, contradicting the LTR − / + row → sliders forced `dir="ltr"`.
- Letter-spacing on the Arabic "AUTO" readout broke letter joining → spacing only on numerals.
- Arabic keyboard hint mixed Latin key names in an RTL sentence → reworded in Arabic.
- First mAs step from the non-station start value (12) skipped to 16 → stepping now lands on the adjacent station (tested).
- Press-and-hold could keep firing after the button disabled at a range end → stops when a step changes nothing.
- Lint (`react-hooks/refs`) → hold-to-repeat moved to a `StepButton` component.

## Remaining limitations
- The model is qualitative/educational; it predicts neither a real detector's EI nor any dose, and no exposure time/motion is modelled.
- One patient attenuation, one detector/grid profile (the engine accepts others as data).
- AEC: three fields, mean-signal combination, no backup mAs/time cap control, no per-vendor behaviour.
- Result image is still a labelled placeholder (noise overlay only).
- Practice Mode only; the post-exposure analysis is not yet gated for Assessment Mode.
- Pre-existing: a long Arabic label in the Session 2 fine-adjust row wraps its value chip on mobile.

## Needs educator / medical-physicist validation
kVp target band; reference technique point and kVp exponent; DI scoring bands; SID tolerance; AEC layout, anatomy factors and backup behaviour; the preferred lung-field chamber choice; Arabic terminology (EI, DI, AEC, quantum noise, dose creep); whether readiness advisories (breathing, marker) match local workflow.

## Recommended scope for Session 4
Image renderer consuming `RadiographResultState` (noise from `quantumNoise`, penetration, clipping, rotation, chin/scapula overlays; display brightness handled only in the renderer's processing step), still labelled placeholder until validated imagery exists. Gate the post-exposure analysis for Assessment Mode. No new medical claims.
