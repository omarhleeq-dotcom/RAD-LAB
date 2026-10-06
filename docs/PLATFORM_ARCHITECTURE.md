# RAD-LAB — platform architecture (design Session 6; exam/case split implemented Session 7)

**Status: mostly design.** Session 6 wrote this document without changing behaviour. **Session 7 implemented one part of it — the `ExamDefinition` / `CaseDefinition` split behind a `composeCase()` compatibility view — as a pure refactor with zero behaviour change** (§2.4 says exactly what exists, where, and what is still hard-wired). Everything else here is still a proposal. Owner decisions D1–D6 are in [`DECISIONS.md`](DECISIONS.md). Decisions are recorded as ADRs in [`adr/`](adr/README.md); the proposed order of work is in [`ROADMAP_SESSIONS.md`](ROADMAP_SESSIONS.md); candidate sources and datasets are in [`MODALITY_SOURCES_CANDIDATES.md`](MODALITY_SOURCES_CANDIDATES.md).

> RAD-LAB is an **educational** platform. No medical value in this document is validated. Where a value or rule is suggested for a future exam it is marked *illustrative* and must pass the evidence gate (§6) before it reaches a learner.

## 1. Target: an integrated imaging-education platform

Not only a radiography simulator: one product where a learner (and later an instructor) picks **what to study** and **how to study it**.

```
modality  →  exam  →  mode
X-ray        Chest PA erect       Learn      read structured teaching content
CT           Chest Lateral        Reference  look up facts, parameters, anatomy, safety (searchable, cited)
MRI          Chest AP (portable)  Simulate   free-play sandbox: change a parameter, see the educational effect, no score
US           …                    Practice   a case with hints, immediate feedback and a score (today's Chest PA)
                                  Assess     a case with no help; result at the end; recorded (needs backend)
```

Definitions (the spec §9 names only Practice and Assessment; Learn / Reference / Simulate are new here — see "Owner decisions" §12):

| Mode | Purpose | Needs a case? | Scored? | Help shown? | Needs backend? |
|---|---|---|---|---|---|
| Learn | guided explanation (text, diagrams, schematic figures) | no | no | n/a | no |
| Reference | structured, cited lookup (terms, protocols as *examples*, safety, anatomy) | no | no | n/a | no |
| Simulate | sandbox for one concept (e.g. "what does kVp do?") | optional | no | explanations always | no |
| Practice | case + rubric + feedback + retry (**exists for Chest PA**) | yes | yes (educational) | yes | no |
| Assess | case + rubric, no hints, answers withheld, attempt recorded | yes | yes | **no** | **yes** (identity, storage, privacy) |

**Maturity ladder per modality** (a modality enters at the bottom and climbs only when its evidence and asset gates are met):

`Learn + Reference` → `Simulate` → `Practice` → `Assess`.
X-ray is at Practice. CT, MRI and US start at Learn + Reference. Assess comes last everywhere because it needs decisions outside the front-end (accounts, storage, privacy, integrity — ADR-0009).

## 2. Current architecture, as-is (Sessions 1–5; §2.1–2.3 describe `main` @ `1e4a2f0` before Session 7 — §2.4 is the Session 7 delta)

### 2.1 Layers (enforced by convention + `src/features/radiograph/architecture.test.ts`)

```
src/domain/            pure types (case, simulation vocabulary, technique, patient, radiograph, result-state)
  ↑
src/features/{evaluation,scoring,technique,patient,simulation(geometry),radiograph(plan,pipeline)}   pure logic, no React
  ↑
src/stores/simulation-store.ts      zustand: activeCase, settings, phase, result
  ↑
UI: src/features/{positioning,xray-console,patient,evaluation,radiograph,simulation}/*.tsx, src/app/[locale]/**
data: src/data/cases/*   (RadCase objects)      i18n: messages/{en,ar}.json, src/i18n/*
```

Data flow of one attempt:
`SimulationSettings` → `evaluate(case, settings)` (`features/evaluation/engine.ts`) → `EvaluationResult { checks, score, variants, criticalFindings, exposure, resultState }` → `buildRenderPlan(resultState, case)` (`features/radiograph/plan.ts`) → pure `renderRadiograph` (`pipeline.ts`) → canvas (`RadiographCanvas.tsx`). Scoring never reads pixels; the renderer never imports the engine.

### 2.2 What is already generic, what is Chest-PA-specific

"Generic" = would work unchanged for another 2D radiography exam that fits the same vocabulary. "Parameterised" = logic is generic but a type or union hard-codes Chest-PA vocabulary. "Chest-PA-specific" = needs replacing or data-driving.

| Area | File(s) | Verdict | Notes |
|---|---|---|---|
| Rule engine kinds | `features/evaluation/engine.ts` (`equals`, `range`, `coverage`, `centering`, `marker`, `technique`) | **Generic** | Rules are case data; engine has no chest literals. Rule `setting` is typed to the fixed `SimulationSettings` keys |
| Score aggregation | `features/scoring/score.ts` | **Generic** (weights from `RadCase.scoring`; sum-to-100 tested) | Iterates the fixed `CATEGORIES` tuple |
| Critical findings | `features/evaluation/critical.ts`, `domain/case.ts` `CriticalFindingId` | **Parameterised** | Gate mechanism is generic; the id union has 3 chest-era ids and `isPresent` is a switch |
| Geometry / coords | `features/simulation/geometry.ts`, `coords.ts` | **Generic** | Normalised detector coordinates, field/clipping/overlap maths; marker laterality via case data (`positioning.markerSide`) |
| Technique model | `features/technique/{model,aec,di,stations,readiness}.ts`, `domain/technique.ts` | **Generic for DR radiography**; `AecAnatomy = "lung" \| "mediastinum" \| "outside-patient"` is chest vocabulary | Everything numeric comes from `RadCase.technique` (`TechniqueProfile`) |
| Patient response | `features/patient/response.ts`, `domain/patient.ts` | **Generic mechanism**; `BreathingId`, `MotionInstructionId` fixed unions | Cooperation profile is case data |
| Result state | `domain/result-state.ts`, `features/evaluation/result-state.ts` | **Parameterised** | Fields `chin`, `shoulders`, `breathing`, `marker` are baked into the schema (v2) |
| Render plan | `features/radiograph/plan.ts`, `consistency.ts` | **Parameterised** | `EffectId` union (`scapulae`, `chin`, `inspiration`, …) and the evidence/approximation tables are chest-image effects |
| Pixel pipeline | `features/radiograph/pipeline.ts`, `tuning.ts` | **Mixed** | Hash noise, blur, mask, penumbra, penetration are generic; warps (`lungApexV`, `diaphragmDomeV`), `scapulaOverlay`, jaw overlay are chest-specific |
| Asset landmarks | `domain/radiograph.ts` (`RadiographAssetSpec`), `data/cases/chest-pa-radiograph.ts` | **Chest-specific shape** | `scapulae`, `jaw`, `lungApexV`, `denseZones` are required fields |
| Positioning visuals | `features/positioning/{DetectorWorkspace,PlanView,PatientCues,visual-model}.tsx` | **Chest-PA-specific art** | Hand-drawn SVG of a frontal chest patient (lungs, clavicles, scapulae, chin) in code, not data |
| Console UI | `features/xray-console/*`, `features/patient/PatientInstructionsPanel.tsx` | **Parameterised** | Controls are hard-wired JSX (kVp, mAs, SID, mode, chambers, breathing, motion); labels come from i18n |
| Simulation vocabulary | `domain/simulation.ts` | **Chest-PA-specific** | `ProjectionId`, `ChinPositionId`, `ShoulderPositionId`, `CATEGORIES` (six fixed), `ImageVariantId` (`chin-overlap`, `scapulae-overlap`, `poor-inspiration`…), a flat fixed `SimulationSettings` |
| Case model | `domain/case.ts` | **Parameterised** | `modality: "general-radiography"; bodyPart: "chest"` literal types; one object merges *exam definition* (rules, tolerances, controls) with *case* (patient, scenario, initial state) |
| Registry / routes | `data/cases/index.ts`, `app/[locale]/page.tsx` (flat list + hard-coded `ROADMAP`), `app/[locale]/simulation/[caseId]/page.tsx` | **Generic but flat** | One route shape; no modality/exam/mode hierarchy |
| Store | `stores/simulation-store.ts` | **Generic** over case id | `mode` is always `"practice"`; no mode gating |
| i18n | `messages/*.json`, `src/i18n/*`, `domain/localized.ts` | **Generic** | `LocalizedText` requires every locale; key-parity tested (`i18n/messages.test.ts`) |
| Evidence | `domain/technique.ts` (`EVIDENCE_CLASSES`), `components/EvidenceBadge.tsx` | **Generic** | Five classes; every medical rule carries one |
| QA | `features/qa/*`, `scripts/qa/*` | **Pattern is generic** | 53-scenario matrix, goldens, browser matrix; scenario ids/settings are Chest PA |
| Asset registry | `docs/ASSET_PROVENANCE_AND_LICENSES.md` | **Generic policy** | A-001…A-005 all one chest image chain |

### 2.3 What this means for the next exams

- *(Session 7 update: the "merged exam/case object" blocker below is removed — see §2.4.)* **Chest Lateral / Chest AP** share the *rule kinds*, geometry, technique model, scoring, renderer core and QA pattern. They are blocked from being "data only" by: the fixed `SimulationSettings` / `CATEGORIES` / `ImageVariantId` vocabulary, the chest-specific `RadiographAssetSpec` and effect table, the SVG positioning art, and the merged exam/case object. All five are *generalisation refactors with a mechanical, golden-checked proof* (Session 7), not redesigns.
- **CT / MRI / US** share almost nothing below the UI: different settings (protocol parameters, sequence parameters, probe pose), different results (volumes, image series, live B-mode), different safety content and different asset sizes. They share: `LocalizedText`/i18n, evidence classes, asset registry, the scoring-gate pattern, the "state → plan → pure renderer, no pixel scoring" principle, and navigation (§9).

### 2.4 Session 7 outcome: exam / case split (implemented) and what is still hard-wired

**Implemented** (pure refactor; zero behaviour change, proved below):

```
src/domain/exam.ts                  ExamDefinition, CaseDefinition, ExamTechniqueProfile, PatientTechniqueModel, SCENE_IDS, RENDERER_IDS
src/features/exam/compose.ts        composeCase(exam, case) → RadCase (compat view, memoised); publicCaseId()
src/features/exam/validate.ts       validateExam(), validateCase()  — structural checks (weights = 100, rule ↔ control/option
                                    consistency, initial state inside console range, cooperation answers every instruction, EN+AR text,
                                    evidence class present, known scene/renderer id). No medical judgement.
src/data/exams/index.ts             EXAMS registry, getExam()
src/data/exams/xray/chest-pa-erect.ts        ExamDefinition: controls, rules, tolerances, scoring weights + pass mark + critical findings,
                                    positioning (centering, marker convention `markerSide`), requiredAnatomy, detector, option lists,
                                    possibleErrors, imageCriteria, evidence, scene { "chest-pa-frontal" }, render { "radiograph-2d" }
src/data/exams/xray/chest-pa-technique.ts    technique PROTOCOL (ExamTechniqueProfile = TechniqueProfile minus patient)
src/data/cases/chest-pa-erect.ts    CaseDefinition "adult-demo" (patient, order text, condition, patient attenuation, initial state)
                                    + `chestPaErect = composeCase(exam, case)`
src/data/cases/chest-pa-radiograph.ts / chest-pa-patient.ts   case-level baseline asset + landmarks / cooperation profile (unchanged)
src/data/cases/index.ts             CASE_DEFINITIONS, CASES (composed), getCase()
```

- **What moved where.** Exam: everything that says what the exam *is*. Case: everything that is one patient scenario. The one split inside an existing object is `TechniqueProfile`: the protocol is the exam's, `patient.attenuation` is the case's (`CaseDefinition.patientTechnique`), merged back by `composeCase`. Rules, weights, tolerances, wording and every value were moved by line range, not retyped.
- **Compatibility.** `RadCase` is unchanged and is what the engine, renderer, store, routes and UI still consume. The default case of an exam keeps the exam id as its public id (`chest-pa-erect`), so routes, shared links and the noise seed are unchanged (decision S7-1).
- **Proof of zero change.** `scripts/qa/characterisation/` (committed *before* the refactor; never regenerated) pins, for all 53 scenarios, score / per-category scores / critical findings / verdict / every check with EN+AR feedback / result-screen message keys and EN+AR text / EN+AR canvas alt text / the full evaluation result / the full render plan / a SHA-256 of the phantom render, plus the composed case object and the SHA-256 of all 53 golden PNGs. `src/features/qa/characterisation.test.ts` compares byte-for-byte in CI. The browser golden comparison (`scripts/qa/run-matrix.mjs`, 3159/3159) and the full EN/AR × device matrix were run on the final head with zero regenerated images; axe 0 violations; results in [`session-7-engine-generalisation.md`](session-7-engine-generalisation.md).
- **"Data-only exam" check.** `src/features/exam/exam.test.ts` builds a *fixture* exam (different required projection and category weights) from the Chest PA exam and runs the real engine: the rule, the critical-finding gate and the weights all follow the data. Not a shipped exam.

**Still hard-wired to Chest PA** (left as is on purpose; each needs the second exam to say what it must become — rule of three — or would change the UI):

| Area | Where | Why left | Next |
|---|---|---|---|
| `SimulationSettings` (flat, fixed keys), `EnumSettingKey`, `NumericSettingKey` | `domain/simulation.ts` | A control list (`ControlSpec[]`) needs the Lateral exam's real controls to design; rules/console/store/result-state all key off it | Session 9, with Lateral |
| `CATEGORIES` / `CategoryId` (six fixed), `ImageVariantId`, `EffectId` + evidence tables, `CriticalFindingId` + `isPresent` switch | `domain/simulation.ts`, `features/radiograph/{plan,consistency}.ts`, `features/evaluation/critical.ts` | i18n labels for categories / effects are message keys, not data; generalising now would be speculative | Session 9 (add only what Lateral needs) |
| Console and positioning scene | `features/xray-console/*`, `features/positioning/*` (hard-wired JSX / hand-drawn SVG) | Generating them from data is a visible-UI refactor with no second consumer; `ExamDefinition.scene` / `.render` are declarative ids that nothing resolves yet | when a second scene exists |
| `RadiographAssetSpec` required landmark groups (`scapulae`, `jaw`, `lungApexV`, `denseZones`) | `domain/radiograph.ts` | Chest-specific shape; optional groups need a second asset | Session 9 |
| Folder move to `modalities/xray/{engine,renderer,views}` | — | Pure churn with no behavioural benefit before a second modality | with the first non-X-ray engine |
| Consumers of `RadCase` | engine, plan, store, UI | Strangler pattern: migrate one at a time, delete the compat view last | Session 8+ |

Differences from `ROADMAP_SESSIONS.md` Session 7: the prompt for this session limited the scope to the exam/case split plus proof; it did not include generalising the vocabularies, the data-driven console / scene, or the `modalities/` move (rows above). The 662-test baseline is now 682 (4 characterisation + 16 exam/case tests); weights, the engine, the renderer and all goldens are unchanged.

## 3. Target module structure

Principles: keep CLAUDE.md rule 3 (pure logic below React), add one level — **modality** — and keep **exam definitions as data**. No new dependency is implied.

```
src/
  domain/
    platform/            ModalityId, ModeId, ExamDefinition, CaseDefinition, ControlSpec, ReviewStatus,
                         AssetManifest, AttemptRecord (type only; Assess later)
    evidence.ts          EvidenceClass, Evidence, SourceRef            (moved from technique.ts; re-exported)
    localized.ts
  modalities/            one folder per modality; each exports a ModalityModule (below)
    xray/
      engine/            evaluate(), rules, technique model, patient response  (today's features/evaluation|scoring|technique|patient)
      renderer/          plan, pipeline, tuning, effects registry
      views/             positioning scene renderer (data-driven SceneSpec), console (generated from ControlSpec[])
      content/           learn + reference loaders
    ct/   mri/   us/     added later, each starting with content/ only
  data/
    exams/<modality>/<exam>.ts      ExamDefinition objects (rules, controls, scoring, scene, render spec)
    cases/<exam>/<case>.ts          CaseDefinition (patient, scenario, initial state, cooperation profile, asset ref)
    content/<modality>/<topic>.ts   Learn / Reference content (LocalizedText blocks with SourceRef)
    assets.manifest.ts              asset ids → path/url, sha256, registry id (A-xxx), size
  platform/              catalogue (modality → exam → mode), mode policy, navigation helpers, review-status gate
  stores/                simulation store (per modality session), preferences
  features/ → components shared across modalities (EvidenceBadge, RangeField, ResultSummary, ModeSwitcher)
  app/[locale]/[modality]/[exam]/[mode]/page.tsx
```

`ModalityModule` — the only thing the platform shell knows about a modality:

```ts
interface ModalityModule<Settings, Result, Plan> {
  id: ModalityId;
  maturity: ("learn" | "reference" | "simulate" | "practice" | "assess")[];   // what is implemented
  defaultSettings(exam: ExamDefinition, c: CaseDefinition): Settings;
  evaluate(exam, c, settings): EvaluationResult<Result>;       // pure, deterministic, no pixels
  buildPlan(result: Result, exam, c): Plan;                    // pure, serialisable
  View: React.ComponentType<{ exam; case; mode }>;             // lazy-loaded; owns controls + result rendering
}
```

Dependency rule: `domain` ← `modalities/*/engine|renderer` (pure) ← `stores` ← UI. A modality never imports another modality. `platform/` imports only `ModalityModule` interfaces and the catalogue. Content (Learn/Reference) is data + a generic block renderer, so a new modality can ship **without** an engine.

## 4. Exam-definition and case schema

### 4.1 Split today's `RadCase` — **done in Session 7 for the fields below; see §2.4 for paths and for what remains**

| Concept | Contains | Today | Target |
|---|---|---|---|
| **ExamDefinition** | what the exam *is*: controls, rules, tolerances, scoring categories + weights, critical findings, scene, result-render spec, technique profile *family*, evidence, review status | was inside `RadCase` (`rules`, `controls`, `scoring`, `technique`, `positioning`, `availableProjections`…) | **implemented**: `data/exams/xray/chest-pa-erect.ts` (`domain/exam.ts`). Review status is `provisional` + exam-level `evidence`; a fuller `ReviewStatus` (reviewers, dates, open questions) is not built |
| **CaseDefinition** | one patient scenario on that exam: patient, clinical scenario, patient condition, initial state, cooperation profile, baseline asset, difficulty, which rules are active | was inside `RadCase` (`patient`, `clinicalScenario`, `initialSettings`, `patientCooperation`, `radiograph`) | **implemented**: `data/cases/chest-pa-erect.ts` (id `adult-demo`; the target path `cases/<exam>/<case>.ts` is deferred until an exam has more than one case). Difficulty and per-case rule activation are not built |

Chest PA = 1 exam + 1 case; a pediatric or "needs reinforcement" patient is a *new case*, not a new exam. The migration keeps `RadCase` as a compatibility view — **implemented as `composeCase(exam, case)`** (`features/exam/compose.ts`) — so the engine and goldens did not change in the first step.

### 4.2 Sketch (illustrative TypeScript; **not** implemented — the implemented types are in `src/domain/exam.ts` and are narrower: no `ControlSpec[]`, no `modes`, no `simulation` union, scoring categories are still the fixed `CategoryId` set)

```ts
type ModalityId = "xray" | "ct" | "mri" | "us";
type ModeId = "learn" | "reference" | "simulate" | "practice" | "assess";

interface ExamDefinition {
  schemaVersion: 1;
  id: string;                         // "chest-pa-erect"
  modality: ModalityId;
  region: string;                     // "chest"
  family?: string;                    // groups variants: chest → { pa-erect, lateral, ap-portable }
  title: LocalizedText;  summary: LocalizedText;
  modes: Partial<Record<ModeId, { status: "available" | "preview" | "planned"; contentRef?: string }>>;
  review: ReviewStatus;               // provisional, reviewers[], dates, open questions (feeds the checklist)
  evidence: Evidence;                 // exam-level class + SourceRef[]
  simulation?: RadiographySim | CtSim | MriSim | UsSim;   // discriminated by `kind`; absent = Learn/Reference only
  cases: string[];                    // CaseDefinition ids
}

interface ControlSpec {               // replaces the fixed SimulationSettings keys
  id: string;                         // "rotationDeg", "chin", "kvp", "centralRay"
  kind: "enum" | "range" | "point" | "size" | "toggle" | "multi";
  group: "positioning" | "technique" | "patient" | "setup" | "display";
  unit?: string;  bounds?: { min: number; max: number; step: number; stations?: number[] };
  options?: string[];                 // enum ids → i18n keys under controls.<exam>.<id>.<option>
  default?: unknown;                  // the CaseDefinition's initial state may override
  modes?: ModeId[];                   // visibility per mode (Assess hides hints; sandbox shows all)
}

interface RadiographySim {
  kind: "radiography";
  controls: ControlSpec[];
  detector: DetectorSpec;  regions: Record<string, DetectorRegion>;      // "requiredAnatomy"
  rules: RuleSpec[];                  // existing kinds + new kinds registered in the engine's rule registry
  scoring: { categories: { id: string; label: LocalizedText; weight: number }[];   // sum = 100 (tested)
             passThreshold: number; criticalFindings: CriticalFindingRule[] };
  technique: TechniqueProfileRef;     // existing TechniqueProfile shape
  scene: SceneSpec;                   // data-driven positioning view (layers, anchors, patient figure parameters)
  result: { renderer: "radiograph-2d"; effects: EffectBinding[]; asset: RadiographAssetSpec };
}
```

Key changes versus today: (1) settings become a **declarative control list** (typed per exam, validated at load by a schema test) instead of one global interface; (2) scoring **categories are declared** per exam (spec §10: "weights can vary per exam type"), the six Chest categories being one declaration; (3) effects are **bound by id** (`EffectBinding { effectId, driver, tuningKey }`) so an exam picks from an effect catalogue; (4) the positioning view is a `SceneSpec`.

### 4.2a Declarative scene / render bindings (Session 7)
`ExamDefinition.scene = { id: "chest-pa-frontal" }` and `.render = { renderer: "radiograph-2d" }` are ids validated against `SCENE_IDS` / `RENDERER_IDS`. They document which code draws the exam but nothing resolves them yet: there is one scene (hand-drawn SVG in `features/positioning`) and one renderer. A registry lookup (`SCENES[id]`, `RENDERERS[id]`) is added when the second one exists (§2.4).

### 4.3 How Chest PA, Chest Lateral and Chest AP differ — as data

Values below are **illustrative placeholders** to show *where* each difference lives. Every medical value must come from a reference document of the same standard as `docs/RAD-LAB_Medical_Reference_Chest_PA*.md`, written and read **before** the exam is authored (roadmap Sessions 9–10).

| Aspect | Chest PA erect (exists) | Chest Lateral (future) | Chest AP (future; erect / supine / portable) |
|---|---|---|---|
| `family` / `id` | `chest` / `chest-pa-erect` | `chest` / `chest-lateral` | `chest` / `chest-ap-…` |
| Projection control | `projection` enum; required = `pa-erect` | same control; required = lateral; **which side against the detector** is a new `enum` control | required = AP; patient state (erect / supine / semi-erect) is a new `enum` control |
| Patient-position controls | `rotationDeg`, `chin`, `shoulders` | e.g. arm position, true-lateral alignment (new controls; **sources needed**) | e.g. shoulder / scapula position, rotation, tube angulation (**sources needed**) |
| Centering / collimation | midline + level, required region | different target + required region (data) | different target; portable set-up adds geometry limits |
| Technique | `TechniqueProfile` PA (kVp 100–150 reference range; demo band; DI model) | its own profile (different attenuation, AEC chamber layout) | own profile; SID typically differs by set-up (**sources needed**); grid decision as a control |
| Marker | `markerSide` convention | convention for lateral (**undefined — needs a source; owner decision**) | convention for AP |
| Scoring categories | six, 25/20/15/20/10/10 | declared by the exam (may reuse six names with other weights) | declared by the exam |
| Critical findings | wrong projection, motion, wrong-side marker | exam's own list (data) | exam's own list (data) |
| Positioning scene | PA SVG scene | lateral `SceneSpec` (new art — one-off) | AP / supine / portable `SceneSpec` |
| Result renderer | `radiograph-2d` + chest PA landmarks | `radiograph-2d` + **new baseline + landmarks (asset need)** | same + new baseline |
| New effect modules? | – | likely (e.g. superimposition / rotation cue unlike PA) — add **once** to the effect catalogue | likely (magnification from geometry, AP-vs-PA appearance) |
| Code needed | – | scene art, effect modules, new rule kinds *only if* the vocabulary does not cover them | same |

Honest scope of "no code per exam": an exam inside the existing control / rule / effect vocabulary is data-only; a **new physical effect, new rule kind or new scene primitive** needs one reusable module, after which the *next* exam that uses it is data-only.

### 4.4 How CT, MRI and US differ

| | General radiography (X-ray) | CT | MRI | Ultrasound |
|---|---|---|---|---|
| Learner decisions | position, centre, collimate, technique, patient instruction | patient set-up, scan range on a localiser, protocol, kV/mA/pitch/collimation/kernel/slice thickness, contrast phase, display window | **safety screening first**, coil, positioning, sequence choice and parameters (TR/TE/TI, flip angle, FOV, matrix, averages), contrast | probe choice, frequency/depth/gain/focus, probe position/angle/pressure, scan planes |
| Result | one 2D image | volume (stack) + dose report (CTDIvol, DLP) | one or more series (T1/T2/FLAIR/DWI …) + time / SAR info | live B-mode loop driven by the probe pose |
| Simulation approach | rule-based effects on one baseline (today) | **look-up on a pre-reconstructed volume**: choose slices / reformats; image-quality effects (noise, kernel, thickness) as labelled approximations; **dose from tabulated/formula values**, never a physics engine | **pre-computed sequence volumes** indexed by a small set of parameter presets; interpolation between presets as a labelled approximation; no Bloch simulation | **sweep-volume or cine look-up**: probe pose → frame from a recorded/synthetic sweep; no wave physics |
| State shape | `SimulationSettings` (flat) | `CtProtocol` + `ScanRange` + `ViewState{window, level, sliceIndex, plane}` | `MriSafetyScreen` + `CoilSetup` + `Sequence[]` + `ViewState` | `ProbePose{position, angle, rotation, pressure}` + `UsPreset` + `ViewState{depth, gain, freeze}` |
| Evaluation | rules vs tolerances → checks | rules: coverage of range, protocol appropriate to indication, dose indicators vs **local/reference levels (provisional)**, window appropriate | **safety rules are gates** (a missed contraindication fails the attempt regardless of other points), coverage, sequence/parameter suitability | acquisition criteria (plane, structure in view, depth), image-optimisation choices |
| Real-time | no (one exposure) | no (scan = one action; scrolling = view state) | no (sequence selection) | **yes**: continuous input → continuous frame; needs a frame-loop contract, deterministic for a given pose |
| Heaviest asset | one ~150 KB image | 100–500 slice volume | several series | cine/sweep loops |
| Biggest risk | wrong rules | dose numbers read as clinical | **safety content read as authoritative** | pose-to-image realism / look-up coverage |
| Contracts reused | all in §5 | scoring, feedback, evidence, deterministic render plan | same + safety-gate type | same + frame-loop contract |

Therefore each modality is its own `ModalityModule`; they share the shell, content system, evidence/licensing gate, scoring-gate pattern, i18n and navigation (ADR-0005).

## 5. Contracts

### 5.1 Scoring (exists; generalised, not changed)
- Pure function `(exam, case, settings) → EvaluationResult`; no pixels, no clock, no randomness.
- `CheckResult { ruleId, category, outcome pass|partial|fail, credit 0|0.5|1, weight, scored, observed, feedback: LocalizedText, variant?, evidence }`. A weight-0 check is *taught but unscored* (marker, keep-still today).
- Category weights are exam configuration and **sum to 100** (tested). Pass mark is configuration.
- **Critical findings gate the pass mark; they never change the number or the weights** (Session 5). For MRI, *safety* findings extend this: a `safetyGate` that is reported before, and never averaged into, a score.
- Per-mode rule: Practice shows score, checks, feedback, expected values. Assess **withholds** hints, expected values, effect cards and notes until submission; the same `EvaluationResult` is computed, a *disclosure policy* (`mode → visible fields`) decides what the UI may show. This is why `EvaluationResult` is kept free of presentation (ADR-0008).

### 5.2 Feedback
Every statement shown to a learner is a `LocalizedText` {en, ar} in data, carries an evidence class, and explains *what was done, why it matters, the effect on the image, the correction* (spec §10). Numbers/units are `dir="ltr"`. A statement without evidence metadata cannot be added (type-enforced).

### 5.3 Renderer
`ResultState (serialisable) → RenderPlan (pure, serialisable) → pure pipeline → pixels`. Invariants kept for every modality: no reading pixels into state/scoring; no randomness (seeded hash); every magnitude in one `tuning` file labelled *educational approximation*; "drawn" vs "scored from settings, not drawn" consistency registry; the picture is `direction: ltr` and anatomy/orientation is never mirrored by RTL.
Generalisation: a renderer is registered by id (`radiograph-2d`, `ct-slice-viewer`, `mri-series-viewer`, `us-bmode-player`); its input is a plan type owned by the modality. Viewers for volumes add a **ViewState** (window/level, slice, plane) that is *display-only*: changing it never changes a score unless the exam explicitly scores window choice, in which case it is an ordinary setting.

### 5.4 Attempt record (type only; for Assess later)
`AttemptRecord { examId, caseId, mode, settingsTimeline[], finalSettings, result, startedAt, submittedAt, engineVersion, contentVersion }` — everything needed to *replay* an attempt deterministically. Defined now so engines stay serialisable; **no storage is implemented** (ADR-0009).

## 6. Evidence classification and licensing, per modality

### 6.1 Evidence classes (already platform policy for X-ray)
`validated · common-reference · vendor-protocol-dependent · educational-simplification · provisional`. The last three are never presented as validated clinical truth. Every rule, value, feedback sentence and visual effect carries one, with a `SourceRef` (document + section, or PubMed ID) or "none" for provisional. A **review gate** (`ExamDefinition.review`) records reviewer, date and open questions; `provisional: true` content is badged in the UI.

### 6.2 What each mode may contain

| Mode | Content rule |
|---|---|
| Learn / Reference | Each factual statement cites a source or is class `provisional` and badged. Reference tables of protocols are **examples** (class `vendor-protocol-dependent`/`educational-simplification`), never "the" protocol. |
| Simulate | Effects are labelled educational approximations; magnitudes in tuning files; no claim of calibration. |
| Practice | Rules need class + source; unsourced rules are `provisional` and **unscored or low-weight** until reviewed (marker precedent). |
| Assess | Only rules reviewed by a named educator/physicist and no `provisional` scoring rule; reviewed content frozen by `contentVersion`. |

### 6.3 Per-modality policy

| | Evidence policy | Highest-risk content | Licensing / imagery policy |
|---|---|---|---|
| **X-ray** | As today (IAEA/WHO references, technique reference classes). DI/EI: do not invent numeric EIT or a universal DI limit. | exposure/technique values, marker conventions | Registry rule (A-xxx in the same commit); CC0 > CC BY > other after review; no ND/NC/SA without explicit owner approval; **no fabricated diagnostic radiographs** — baseline imagery stays labelled "educational baseline, not clinical ground truth". |
| **CT** | Dose metrics (CTDIvol, DLP) are *defined quantities*: formulas/definitions `common-reference` (AAPM/IEC concept), **numeric reference levels are local/regional → `vendor-protocol-dependent`/provisional**. Protocol examples never presented as a standard of care. | dose numbers, contrast guidance | Volumes from openly licensed, **de-identified** sources only; dataset terms (DUA / credentialed access) disqualify; check for embedded identifiers (DICOM headers, facial reconstructions). Synthetic phantoms (own work, CC0) are first choice for Simulate. |
| **MRI** | **Safety content is the strictest tier.** Only statements traceable to the ACR MR safety manual / IEC concepts; anything else is `provisional` and *not shown in Practice/Assess scoring*. Visible "educational — not a screening tool" notice. Sequence parameter effects (TR/TE/…) are `educational-simplification` unless sourced. | implant/zone/contrast safety | As CT; plus no real patient-specific implant data. |
| **US** | Acoustic safety indices (MI/TI) are *concepts* (IEC/AIUM); thresholds only if sourced. Scan-plane/technique criteria need ACR practice-parameter or PubMed support. | probe-pose → image realism claims | Cine/sweeps: licence **and** consent/de-identification; prefer synthetic or self-recorded phantom sweeps (own work, CC0). |

### 6.4 Imagery rules for all modalities
1. Registry entry before commit; unmodified master kept apart from derived files; checksum; verification method and date.
2. Open licences only (CC0, CC BY; others after review). **Avoid** NC, ND, SA, request-access and credentialed datasets, and any licence that prohibits redistribution.
3. Never present synthetic, generated or composited images as diagnostic. Never alter anatomy deceptively (the A-002 annotation-removal rule generalises: interpolation only over non-anatomy).
4. Privacy: de-identified only; strip metadata; no faces/jewellery/text overlays that identify; no patient narratives copied from a source.
5. Large binary assets are not committed without owner approval and follow §8.

## 7. i18n and RTL rules

Carried forward (CLAUDE.md rule 4) and extended:
1. All UI strings in `messages/en.json` + `ar.json` with identical keys (tested); all content in `LocalizedText`/content blocks with both locales. A modality's glossary lives next to `ARABIC_TERMINOLOGY.md` (one table per modality) and must be reviewed by a domain educator before an exam leaves `provisional`.
2. Logical CSS only (`ms-`, `ps-`, `border-s-`); `dir="ltr"` for numbers, units, parameter names (kVp, mAs, TR, TE, CTDIvol, DLP), DICOM-style tags and sequence names; Arabic text flows RTL around them.
3. **Image orientation conventions are data, never locale.** Radiograph: patient left = viewer right (PA convention in the case). CT/MRI display conventions (axial: patient right on viewer's left; orientation letters) are declared per viewer in data and **never mirrored by RTL**; the viewer chrome (buttons, sliders' labels) may mirror, the image and its orientation labels may not.
4. Sliders/steppers over numeric technique values are `dir="ltr"` even in RTL (existing rule).
5. Test both directions in the browser matrix (EN/AR × desktop/tablet/mobile) for every new view; one parity test per exam that its AR strings exist and contain Arabic script where required.
6. Arabic wording is machine-assisted until an educator signs it off; the sign-off is recorded in `ExamDefinition.review`.
7. Pilot banner (Session 6) appears on every page in both languages and is removed only by an owner decision.

## 8. Asset size strategy (CT / MRI / US volumes)

Today: one 147 KB web-resolution JPEG (A-003, the file the app loads), a 780 KB full-resolution derivative (A-002) in `public/`, a 906 KB provenance master (A-001) in `assets/source/`, and 53 goldens (6 MB). Git is fine for that; it is **not** for volumes.

Rough sizes (estimates, 8-bit): one 256×256 slice = 64 KB raw; a 256×256×200 volume = 13 MB raw; 4 MRI series ≈ 52 MB raw; a 10 s, 480×360, 15 fps ultrasound loop ≈ 1–3 MB as modern video. Per-slice WebP/AVIF commonly cuts a volume to a few MB (to measure on real data).

Strategy:
1. **Budget per exam** (design target, to confirm): initial load ≤ ~2 MB; Learn/Reference pages ≤ ~500 KB; a CT/MRI exam's volume ≤ ~8 MB downsampled, streamed lazily.
2. **Derive, don't ship masters.** Keep the unmodified master *outside* the repo (or not at all), commit only a derivation script, the registry entry and the checksum — the A-001…A-003 pattern, with the master location documented.
3. **Manifest** (`assets.manifest`): id, path/URL, sha256, bytes, registry id, licence, derivation script, *dimensions + orientation convention*. A test fails if a referenced asset is missing from the registry or its checksum differs.
4. **Format**: stack of per-slice WebP/AVIF/JPEG tiles (or a single tiled sprite) fetched on demand by slice index; pre-downsampled; an index JSON per series. Video (MP4/WebM) for US. Quantise to 8 bit; window/level applied in the viewer from stored 8-bit data (document that this is an educational reduction, not a diagnostic window).
5. **Where it lives**: small assets in `public/`; large series on object storage behind the same host (Cloudflare R2 behind the Pages site, or a public bucket) with immutable hashed URLs and `Cache-Control: immutable`; avoid Git LFS (breaks the "connect repo and deploy" pilot flow, adds quota). Cloudflare Pages has per-file and per-deployment limits (published as 25 MiB per file and 20 000 files at the time of writing — **to verify**), another reason to keep volumes out of `public/`.
6. **Privacy**: strip all metadata at derivation time; verify no burned-in text.
7. **Offline / low bandwidth** (field learners on phones): lazy load per slice; show a size warning for > 5 MB; keep Learn/Reference usable without volumes.
8. **Determinism**: derived assets are reproducible from the script; goldens for viewers are checked on the decoded pixels, as today.

## 9. Navigation / information architecture

Choose modality → exam → mode, mobile-first (the owner reviews on a phone).

```
/[locale]                                   Home: hero + modality cards   (X-ray ● CT ◌ MRI ◌ US ◌ — status chips)
/[locale]/[modality]                        Exam list for the modality, grouped by region/family (Chest: PA · Lateral · AP …)
/[locale]/[modality]/[exam]                 Exam hub: summary, review/provisional badge, MODE TILES
/[locale]/[modality]/[exam]/learn
/[locale]/[modality]/[exam]/reference
/[locale]/[modality]/[exam]/simulate
/[locale]/[modality]/[exam]/practice[?case=…]    ← today's /simulation/chest-pa-erect
/[locale]/[modality]/[exam]/assess               (hidden/disabled until Assess exists)
```

- **Mode tiles** show state per `ExamDefinition.modes[mode].status`: available / preview / planned (greyed with "Coming soon" — existing string). Unavailable modes are *listed*, never hidden, so the roadmap is visible; Assess is absent from the UI until its prerequisites exist.
- **Breadcrumb** `Home › X-ray › Chest PA erect › Practice` (logical order; RTL mirrors naturally), plus a persistent mode switcher on the exam page.
- **Compatibility**: today's `/[locale]/simulation/[caseId]` stays valid via `_redirects` (static host) to `/…/xray/chest-pa-erect/practice`, so shared pilot links do not break.
- Home keeps one disclosure line + the pilot banner. The hard-coded `ROADMAP` chips are replaced by catalogue entries with `status: "planned"`.
- Static export keeps working: `generateStaticParams` over catalogue × locale; no server needed (ADR-0002). Assess later adds server concerns (auth, storage) behind a separate deployment target.
- Accessibility: mode tiles are a list of links (not tabs) so deep links and back-button work; focus order = breadcrumb → mode tiles → content.

## 10. Quality, testing and migration approach

- **Golden-first refactors.** Before any engine generalisation, freeze today's proofs. Session 7 did this with `scripts/qa/characterisation/` (scenario snapshot, composed case, golden-image checksums; compared in CI) on top of the 53-scenario golden (`scripts/qa/golden/matrix.json`), 53 PNG goldens, the unit tests and the browser matrix. A refactor passes only if these are **byte/value identical**; a legitimate behaviour change (e.g. an owner-approved demographic change) regenerates only the file it touches, in a commit that says so.
- **Strangler pattern:** `ExamDefinition`/`CaseDefinition` and `composeCase()` exist (Session 7); migrate consumers one at a time; delete the compat view last.
- Each new exam brings its own scenario matrix + goldens (template: `docs/session-5-qa.md`), its own reference document, its own review checklist section.
- CI (`ci.yml`) stays no-secrets/no-deploy; deployment is a separate GitHub Actions workflow (`deploy-pages.yml`, direct upload to Cloudflare Pages project `rad-lab`; main → production, PRs → preview; D6, ADR-0002).

## 11. Instructor / institution readiness (spec §12, not built)
Seams kept open, nothing built: serialisable `AttemptRecord`; case/exam ids stable; a catalogue that can be filtered per assessment (`assessment = { examIds, cases, attempts, timeLimit }` as a future type); disclosure policy by mode; `engineVersion`/`contentVersion` stamped on every result. Assess prerequisites are listed in ADR-0009.

## 12. Open decisions carried forward and new ones

**Carried forward (unchanged from Sessions 4–5, still open — now O1–O5 in [`DECISIONS.md`](DECISIONS.md)):**
1. **Baseline demographic mismatch**: baseline radiograph = 21-year-old woman (A-001); case patient = 45-year-old man. Options in `session-5-baseline-options.md`: (a) change case demographics to match, (b) source a male PA baseline (no verified candidate), (c) leave as labelled. *Interacts with the platform*: the baseline belongs to a `CaseDefinition`, so decision (a)/(b) is cheap now that the exam/case split exists (Session 7). Recommendation (a), awaiting approval; impact: [`session-7-demographics-impact.md`](session-7-demographics-impact.md).
2. **Provisional 27 × 31 cm required-anatomy region** and the 1.5 cm landmark-strip mismatch (checklist §A): keep the labelled demo region, adopt a baseline matching it, or measure on a validated baseline.
3. **Marker rubric**: presence / side / in-field / over-anatomy / weight, and the PA viewer-side convention — currently weight 0, wrong side is a critical finding. Sources read: Chung 2020, Fuller 2016 (neither gives a rule). Needed before Lateral/AP because the convention differs per projection.
4. **Unread sources**: ACR digital-radiography / chest practice parameters; Australian Institute of Radiography professional-practice guideline cited by Barry et al. (and the Barry audit itself) — to read before the marker rubric and before the Lateral/AP reference documents.
5. **Educator / medical-physicist review** of everything in `REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md` (A–G) and the Arabic terminology table. No Chest-PA value is validated.

**New items 6–11 were decided by the owner in Session 7 (details in [`DECISIONS.md`](DECISIONS.md)):**
6. Simulate vs Practice → **D1: one mode (Practice) for now**; split only if a no-hints / timed / exam-like variant is needed.
7. Shell before Lateral → **D2: yes, build the shell first.**
8. Hosting → **D6: Cloudflare Pages project `rad-lab` via GitHub Actions, repo private, no sharing before Zero Trust email restriction.** *Still open:* custom domain and who may see previews beyond the pilot.
9. Assess prerequisites → **D3: Assess deferred to the end of the roadmap** (identity, storage, retention, privacy, server scoring all stay undecided until then).
10. Numeric dose reference levels → **D4: teach definitions (CTDIvol, DLP) first; numeric levels only with a cited published source and its country / region.**
11. First CT/MRI/US imagery → **D5: own-work schematics and synthetic phantoms, always labelled "schematic / synthetic - not a patient image" (EN + AR); realistic images only later from verified open licences.**
