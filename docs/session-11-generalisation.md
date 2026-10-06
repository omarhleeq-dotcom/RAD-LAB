# Session 11 — engine generalisation against the Chest Lateral + Chest AP needs

**Scope (S10-1, S10-2, S10b-19, S11-1 … S11-4):** build only the generic mechanisms that [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md) marks *Needed*, as optional additions that Chest PA does not use. **No Lateral / AP exam, case, asset, medical value or scoring rule was added** (Sessions 12 / 13), and none of the S10b PA scoring changes (kV, SID, rotation direction, marker presence) was made.

## Mechanisms (all optional; Chest PA declares none of them)
| Needs row | Mechanism | Where |
|---|---|---|
| S11-1 marker rule per exam | `PositioningSpec.markerRule`: `anatomical-side` (default = PA, AP) or `detector-side` (Lateral; reads the exam's choice control). One pure function shared by scoring, the critical finding and the render plan | `src/features/simulation/marker-rule.ts`; `domain/case.ts` |
| S11-2 tube angulation | Optional numeric setting `tubeAngulationDeg` (+ = caudad) with an optional control; absent = 0°. Range rules can target it; carried in the result state only when declared; console slider only when declared | `domain/simulation.ts` (`numericSetting`), `ConsolePanel` |
| Control kinds (enum) | `ExamDefinition.choiceControls` + `SimulationSettings.choices`; `EqualsRule` may target `choices.<id>`; bilingual labels are data; generic console radio group | `domain/case.ts`, `engine.ts`, `ConsolePanel`, `ResultPanel` |
| Categories | Categories are the keys of `scoring.categoryWeights` (order = score order); extra categories bring `categoryLabels` | `features/scoring/score.ts`, `ResultPanel` |
| Variants / effects | `ImageVariantId`, `EffectId` are open vocabularies over a typed core; unregistered variants are reported "not drawn", never a crash; `unregisteredVariants(exam)` is tested | `radiograph/consistency.ts`, `plan.ts` |
| Critical findings | Detector registry `CRITICAL_DETECTORS`; `validateExam` rejects an id without a detector | `features/evaluation/critical.ts` |
| Scene | Registry resolving `ExamDefinition.scene.id` (one scene today) | `features/positioning/scenes.tsx` |
| Landmark groups | `scapulae`, `jaw`, `denseZones`, `midlineU` optional; the renderer draws only effects whose group exists | `domain/radiograph.ts`, `pipeline.ts`, `plan.ts` |
| Per-projection attenuation | `patient.attenuationByProjection?` falls back to the scalar | `features/technique/model.ts` (`attenuationFor`) |

**Not built (decisions / deferred):** grid control (S11-3, grid fixed for chest v1); patient-build attribute (S11-4); patient-state control (O9 — the generic choice control can carry it when decided); SceneSpec-generated art, the `modalities/xray/*` move and migrating consumers off `RadCase` (deferred in the Needs summary).

## Byte-identical proof for Chest PA
- `scripts/qa/characterisation/*` (53 scenarios, composed case, golden checksums) and `scripts/qa/golden/*` were **not touched** (`git diff` is empty for `scripts/` and `public/`) and `characterisation.test.ts` passes: score, verdict, checks, EN/AR feedback and alt text, evaluation result, render plan and render hash are byte-identical.
- The composed PA case has no new field (`generalisation.test.ts` asserts PA declares no optional control, choice, marker rule, per-projection attenuation or optional setting; result state carries no angulation / choices).
- A static build of `main` and of this branch was driven in Chromium (EN and AR, 1280 and 390 px): the practice page DOM after load, the page DOM after pressing Expose with the initial settings, and the result canvas pixels have identical SHA-256 hashes.
- Existing tests: 3 test files only got `!` non-null assertions where PA landmark fields became optional types (no assertion changed).
