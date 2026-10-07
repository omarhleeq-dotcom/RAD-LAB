# Session S14-0 — Generalisation for limbs (byte-identical refactor)

Decision: `DECISIONS.md` S14-0 (open item O20). Scope per the owner's prompt: remove chest-specific assumptions that would force every limb exam to add bespoke branches, **without changing any behaviour**. No new exam, data, image, wording, scoring or Arabic. Generalised only against the needs the exam recipe (§2, §3C, §10) lists (S10-2: reference first); nothing speculative.

## 1. What changed and why

| # | Change | Why (limb need) |
|---|---|---|
| 1 | `ProjectionId` = open `string` (`domain/simulation.ts`). `src/data/projections.ts`: `PROJECTIONS` registry (`wordingNs?`) + `isRegisteredProjection`. `validateExam` rejects an unregistered projection. | A limb exam has its own projections (e.g. AP / lateral hand); registering one is a data entry, not a shared-type edit. |
| 2 | `WordingNs` = open `string`; `wordingNsOf` reads the registry. `ResultImage`, `ResultPanel` and `RadiographEffects` already took their namespace from it, so they needed **no change** and carry no per-exam branch. | A limb's projection-specific result wording (`radiograph.<ns>.*`) needs no code. |
| 3 | `features/positioning/scene-layouts.tsx`: `SceneLayout` (detector figure, second view, cues component, five message paths). `PositioningView` takes `layout` instead of `variant: "pa" \| "lateral" \| "ap"`; `scenes.tsx` builds `SCENES` from the three chest layouts. | A limb scene on the shared view = one layout entry; a scene that is not a variation of it registers its own component in `SCENES` (unchanged mechanism). |
| 4 | `features/positioning/detector-figures.tsx`: `DetectorFigure` (alt key, midline key, text alternative, `Drawing`, `Orientation`). `DetectorWorkspace` takes a `figure` object instead of the `"chest-pa" \| "chest-lateral"` string and has no `lateralFigure` / `lateral` branches (the PA figure keeps its own narrowed-thorax rule for a lateral-left projection). | The detector view is where the body part is drawn. |
| 5 | `PatientCues.tsx`: the `lateral` / `ap` flags became three components (`PatientCues` = PA, `LateralPatientCues`, `ApPatientCues`) with the same JSX; the layout names the one to use. | A limb has its own cues panel. |
| 6 | `scripts/qa/label-collisions.mjs` + `scripts/qa/label-states/chest-ap-supine.json`; how to run it: `exam-recipe.md` §4a. | The S13b-2 measurement was a throw-away. |
| 7 | New guards: `src/features/qa/scene-dom.test.ts` (+ `scripts/qa/scene-dom/hashes.json`), `src/features/exam/registries.test.ts`. | Proof (below) and the registry contract. Existing tests were not edited. |

## 2. Byte-identity proof

- **Rendered output** — `scene-dom.test.ts` server-renders (`renderToStaticMarkup`, next-intl provider, real EN / AR messages) the positioning scene (practice **and** assessment, i.e. guides ON / OFF) and the full `ResultPanel` (score, image alt text, effect cards) of **Chest PA, Lateral and AP** for ~25 settings states each (initial; rotation ±8 / 3; chin and shoulder flips; marker L / R / none / moved; ray off-centre; tight collimation; SID 120 / 200; each projection id; low / high kV; low mAs; tube ±10 for the AP; every option of every exam choice control), EN and AR: **408 renderings (266 distinct)**. The SHA-256 of each was captured from the code **before** the refactor (two captures were identical, i.e. deterministic) and stored in `scripts/qa/scene-dom/hashes.json`; after the refactor all 408 match. Changing one stored hash makes the test fail (checked). The hashes are never regenerated to make a change pass.
- **Unchanged files**: `scripts/qa/characterisation/*`, `scripts/qa/golden/*`, `src/data/exams|cases/*`, `public/images/*`, `assets/*`, `messages/*.json`, every existing test file (`git diff origin/main --stat` lists none of them).
- Existing audits (Playwright + axe, EN / AR × 1440 / 390): Chest PA (`a11y-audit.mjs`), Lateral, AP — see the PR report.

## 3. Not done (and why)

`SceneId` / `SCENE_IDS` (one registered list, compile-time checked against `SCENES`; opening it removes the check without removing the list), `CriticalFindingId` / `CRITICAL_DETECTORS`, `EffectId`, `ImageVariantId`, `CATEGORIES`, `SimulationSettings` (`chinPosition` / `shoulderPosition`), the console JSX, the renderer's chest anatomy, and `planRotationDeg` / the PlanView sign (O19 — not touched). None has a concrete limb need in a merged reference yet. The `ResultPanel` projection label still casts `value as "pa-erect"` to reach a typed message key (cosmetic).

## 4. What a limb exam must still add

1. **Reference first** (S10-2) with a Needs section; owner decisions (marker convention, rotation sign, image) in `DECISIONS.md`.
2. **Data**: `ExamDefinition`, `CaseDefinition`, technique profile, `RadiographAssetSpec` (+ image provenance), validated by `validateExam` / `validateCase`.
3. **Registrations**: `EXAMS`, `CASE_DEFINITIONS`, `SCENE_IDS` + `SCENES`, **`PROJECTIONS`** (new projection ids, with `wordingNs` if its result wording differs) and `console.projections.<id>` / `radiograph.<ns>.*` messages (EN + AR).
4. **Scene**: a `DetectorFigure` (the limb drawing, in detector space, never mirrored in RTL) and a `SceneLayout` (second view, cues component, texts) — or its own scene component — using the shared scene tokens (`scene-style.ts`, `SceneParts`); then the label-collision script (recipe §4a) with an axes spec.
5. **Engine pieces still chest-shaped** (add against the limb reference, byte-identically for the chest exams): anatomy **effects** (`EffectId`, `plan.ts`, `RadiographEffects` wording `radiograph.effects.*`), **image variants** (`ImageVariantId`, `consistency.ts`), **critical findings** (`CriticalFindingId` + `CRITICAL_DETECTORS`), the chest-only **settings** (`chinPosition` / `shoulderPosition` are required fields of `SimulationSettings` — a limb exam must either map its cues onto them or generalise the shape in its own session), the renderer's lung / spine / rib anatomy in `pipeline.ts`, and the console JSX for any control that is not a range or an enum choice.
6. **Plan-view sign** for a new projection that uses `PlanView` (decide in `DECISIONS.md` first; `planRotationDeg` still switches on `"ap-erect"`; O19 open).
7. Tests (recipe §7), extended guard hashes for the new exam (never regenerate the existing ones), docs, REVIEW_PACKAGE rows, Arabic DRAFT list, provenance records.

## 5. Finding (not fixed)

The label script (run once over the 36-state AP set, EN / AR × 390 / 1440 × guides ON / OFF, 288 measurements): **24 collisions, all the same** — Arabic, guides ON, tube angle +15°: «الأنبوب» × «المرجع 183 سم» in the AP side view. Pre-existing (the AP markup is hash-identical to before). Recorded as **O20**; fixing it changes rendered output, so it is a separate, owner-approved AP follow-up. Smallest label on screen: 10.6 px (1440) / 10.8 px (390). No label left its drawing's frame in any state.

---

# S14.1b — limb generalisation, round 2 (byte-identical; decisions `DECISIONS.md` S14.1b-1 / S14.1b-2)

Scope: exactly the S14.1b scope of `RAD-LAB_Medical_Reference_Wrist.md` §9 (G1–G6, G9, G10 check). No wrist data, exam, projection, scene art, image, wording, Arabic, effect, `planRotationDeg` / O19 or O20 change. The chest exams are byte-identical.

## 6.1 What changed, per gap — and why it is behaviour-neutral

| Gap | Change | Why nothing changes for the chest |
|---|---|---|
| **G1** | `SimulationSettings.chinPosition` / `shoulderPosition` optional; `RadiographResultState.patient.chin` / `shoulders` optional (keys written only when present, in the same position); `SceneLayout.Cues` optional and `PositioningView` renders it only when the layout has one and both cue values exist; the chest figure drawings keep a type-level fallback that never applies to a chest exam. `validateCase` never required the two fields (no check added or removed). | Every chest case declares both, so every branch takes the old path; the 408 scene-dom hashes and the characterisation are unchanged. |
| **G2** | `breathing` (settings, result state), `availableBreathing` (exam, `RadCase`, composed only when declared), `PatientCooperationProfile.inspirationResponse` optional; `derivePatientResponse` gives a neutral `"adequate"` without them; `PatientInstructionsPanel` renders the breathing group only when the exam declares it; `validateExam` / `validateCase` require a breathing value, option list and response **exactly when** the exam declares breathing, and reject a `breathing` weight / rule without it. | Chest exams declare breathing; the panel JSX, the response object and the validation outcome are identical. |
| **G3** | `SceneId` = open `string` (`domain/exam.ts`); `SCENE_IDS` stays as the pure registered-id list that `validateExam` uses (logic must not import the React scene components); `registries.test.ts` (unchanged) and the new test check that list against `SCENES`. | Same three ids; same validation. |
| **G4** | `BodyPartId` open string (`domain/simulation.ts`); `ExamDefinition.bodyPart` / `RadCase.bodyPart` use it; registry `BODY_PART_IDS` (`["chest"]`) in `src/data/modalities.ts`, checked by `validateExam`. | The chest value is still `"chest"`; `exam.test.ts` pin unchanged. |
| **G5** | `lungApexV` / `diaphragmDomeV` optional on `RadiographAssetSpec`; the inspiration warp (`plan.ts`, `pipeline.ts` `inspirationLut`) runs only when both exist; the scapula overlay also needs a shoulder value. Spine / scapula / jaw / midline steps were already gated by the optional landmark groups. | The chest assets declare everything; the golden images are unchanged. |
| **G6 (hook)** | `EffectDefinition` + `EXTRA_EFFECTS` (empty) in `plan.ts`; `buildRenderPlan(state, case, extraEffects = EXTRA_EFFECTS)` appends registered, active effects after the core ones and lets a fault drop the baseline card. **No wrist effect, no pixel step** (the step is added by the first limb exam that needs one, S14.1c). | With nothing registered the plan is the same object as before. |
| **G9 (shape)** | `TechniqueProfile.aec` optional (manual-only exam). `evaluateAec` returns "nothing sensed", `computeDetectorExposure` reads an `"aec"` setting as manual, readiness ignores AEC, the console offers only Manual, `validateExam` rejects an `aec-chambers` rule without `aec`. No wrist values. | Chest profiles declare `aec`; the chest data files are untouched because `ExamDefinition<T>` / `RadCase<T>` default to the AEC-required chest shape (typing only). |
| **G10** | **Checked, no change.** `ImageVariantId` is already `CoreImageVariantId \| (string & {})`; `effectsOfVariant` and `unregisteredVariants` already treat an unregistered id as "not drawn". The ids a wrist needs (`correct`, `rotated`, `wrong-projection`, `clipped`, `low-exposure`, `excess-exposure`, `motion`, plus `low-penetration`) all exist in `VARIANT_EFFECTS`; the chest-named ids (`chin-overlap`, `scapulae-overlap`, `poor-inspiration`) are simply not used by a limb. `RULE_EFFECTS` is keyed by rule id (open): a wrist rule needs an entry only if it should draw something. | — |

## 6.2 Test-only synthetic limb fixture

`src/features/exam/__fixtures__/synthetic-limb.ts` — an `ExamDefinition` + `CaseDefinition` with no chin / shoulder / breathing / AEC / lung fields, its own placeholder ids (`synthetic-limb`, `synthetic-scene`, `synthetic-ap`) and placeholder numbers; **not** registered in `EXAMS` / `CASES`, not routed, not user-visible, no medical content. `limb-generalisation.test.ts` (16 tests) proves: it validates only against its own registries and is rejected by the platform ones; composes without the chest-only keys; scores without a breathing category; carries no chin / shoulders / breathing in the result state; manual-only technique; the plan and the pixels render (deterministically) for an asset without lung / scapula / jaw / midline landmarks; the inspiration warp is never built without lung landmarks; the effect hook adds an effect and drops the baseline card for a fault; the patient-instructions panel and the positioning view omit the breathing control / cue choices for the fixture and still show them for the chest.

## 6.3 What S14.1c still adds

The two wrist exams as data; registrations (`EXAMS`, `CASE_DEFINITIONS`, `SCENE_IDS` + `SCENES`, `PROJECTIONS`, `BODY_PART_IDS`: `"wrist"`); the two rotation effects with their pixel steps, landmark groups and `tuning.ts` magnitudes (the hook is in place, G6); the technique values and the manual `reference` (labelled teaching constants, O26); the seated-at-table scene (`DetectorFigure` + `SceneLayout` without `Cues`, or its own component); images from the owner-approved shortlist (O25); EN + AR strings; REVIEW_PACKAGE rows; extended scene-dom hashes **added, never regenerated**; wrist rotation sign and plan-view use (O23, O19 untouched). Widening `EXAMS` / `CASES` to the broad exam type will need a narrowing in the few chest tests that read `…technique.aec` through them.

## 6.4 Existing-test edits (type-only, reported)

Six lines in three existing test files gained a non-null assertion (`!`) because the fields they read became optional: `patient/response.test.ts` (3 lines: `availableBreathing`, `inspirationResponse`), `radiograph/pipeline.test.ts` (2: `lungApexV`, `diaphragmDomeV`), `i18n/messages.test.ts` (1: `availableBreathing`). No expectation, value or behaviour changed; `npm run typecheck` includes test files, so the assertions are required for it to pass.
