# RAD-LAB

Bilingual (Arabic / English) web-based educational radiography simulation platform for radiologic technology students, imaging professionals, instructors and universities.

Users position a patient, set X-ray technique, press **Expose**, then receive a simulated result, a score and explanatory feedback. Full spec: [`docs/RAD-LAB_Project_Specification.md`](docs/RAD-LAB_Project_Specification.md).

> **Medical content is provisional.** All technique values (kVp, mAs, SID, centering, collimation, rotation tolerance) are demo placeholders and have **not** been clinically validated. The result radiograph is an **educational simulation** built on a CC0 reference image (not an image of the case patient, not diagnostic); all visual effects are labelled educational approximations.

## Current MVP scope (Session 1)

Adult Chest X-ray — PA Erect, practice mode, no accounts, no backend.

Implemented:
- Landing page, case library, language switcher (English LTR / Arabic RTL, URL-prefixed `/en`, `/ar`).
- Data-driven typed case model; first case `chest-pa-erect`.
- Patient positioning workspace (2D SVG): front view + plan view reacting to rotation, central-ray centering, collimation, SID, projection.
- X-ray console: projection, kVp, mAs, SID, breathing instruction, Expose (extended in Session 3, below).
- Rule-based evaluation engine + configurable weighted scoring (25/20/15/20/10/10).
- Placeholder result image reflecting detected faults (rotation, clipping, exposure, poor inspiration…), per-check feedback in both languages, retry / restart.
- Unit tests for the evaluation and scoring logic.

## Session 2 — interactive positioning
Draggable central-ray target and collimator handles (mouse/touch/keyboard + slider alternatives), normalized detector coordinates, L/R side marker, chin/shoulder cues, richer rotation/SID visuals and direction-aware centering/coverage feedback. See [`docs/session-2-positioning.md`](docs/session-2-positioning.md) for decisions and the validated/simplified/provisional rule table.

## Session 3 — technique & exposure console
Vendor-neutral console (kVp, mAs, SID, Manual/AEC with chamber selection, readiness), a deterministic target-relative detector-exposure model (DI, noise, penetration, dose awareness), evidence-classified technique scoring, and a renderer-facing `RadiographResultState` for Session 4. Digital brightness is never used as an exposure indicator. See [`docs/session-3-technique.md`](docs/session-3-technique.md).

## Session 4 — educational radiograph renderer
A deterministic, canvas-based Chest PA result renderer driven by `RadiographResultState`: rotation (anatomical cues, never whole-image rotation), centering / collimation clipping, scapula and chin overlap, reduced inspiration, patient motion (blur), low detector exposure (quantum-noise-like texture, brightness kept normalised), excess exposure (deliberately no visible change), low penetration (dense-region visibility), and the learner's marker as a separate annotation layer. New **Patient Instructions** (breathing + keep-still): the learner chooses what to say; inspiration and motion are derived deterministically from a patient-cooperation profile — RAD-LAB does not measure real inspiration or movement. A project-wide asset registry lives in [`docs/ASSET_PROVENANCE_AND_LICENSES.md`](docs/ASSET_PROVENANCE_AND_LICENSES.md). See [`docs/session-4-radiograph-renderer.md`](docs/session-4-radiograph-renderer.md).

## Session 5 — Chest PA QA and polish
End-to-end QA of the whole Chest PA workflow with a 52-scenario matrix (fully correct, every single error, realistic combinations) in which the **score, the feedback and the rendered image describe the same findings**; a laterality audit; a medical-consistency audit of every rule and sentence against the repository references; a uniform-scale (distortion-free) baseline mapping inside the unchanged required-anatomy region; **critical findings** (wrong projection, visible patient motion, wrong-side marker) that force “Below the educational pass mark” without changing the numeric score or weights; bilingual text alternative for the radiograph; accessibility fixes (axe: 0 violations); golden-image visual regression; GitHub Actions CI (typecheck, lint, tests, build). See [`docs/session-5-qa.md`](docs/session-5-qa.md), [`docs/session-5-qa-matrix.md`](docs/session-5-qa-matrix.md), [`docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md), [`docs/ARABIC_TERMINOLOGY.md`](docs/ARABIC_TERMINOLOGY.md) and [`docs/session-5-baseline-options.md`](docs/session-5-baseline-options.md).

## Educational, non-diagnostic disclaimer
RAD-LAB is an **educational simulator**. It is not a diagnostic, clinical or dose-calculation tool and must not be used for patient care. The radiograph shown is a reference image of a different patient with simulated, approximate effects; technique values, tolerances and visual magnitudes are provisional demonstration data awaiting educator / medical-physicist review. Scores are educational, not real-world accept / reject decisions.

## Tech stack
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand · next-intl · Vitest · ESLint.
(shadcn/ui was not needed yet; the few controls are small custom components.)

## Getting started
```bash
npm install
npm run dev        # http://localhost:3000  (redirects to /en)
npm run check      # typecheck + lint + tests
npm run build && npm start
```

### QA tooling (manual; not part of CI)
```bash
npm run qa:golden                      # regenerate scripts/qa/golden/matrix.json after an intended change
npm run build && npx next start -p 3100 &
npm i --no-save playwright axe-core    # not project dependencies
npm run qa:visual                      # full EN/AR × desktop/tablet/mobile browser matrix + golden-image compare
npm run qa:a11y                        # axe-core + keyboard/focus audit
```

## Project structure
```
messages/              UI strings (en.json, ar.json)
docs/                  Project specification
src/
  app/[locale]/        Routes: home, simulation/[caseId]
  components/          Shared UI (RangeField, LanguageSwitcher)
  domain/              Pure types: case model, settings, categories, locales
  data/cases/          Case definitions (data only) + registry
  features/
    simulation/        Workspace composition, geometry helpers
    positioning/       Patient positioning view + controls
    xray-console/      Technique console (steppers, AEC panel, readiness)
    technique/         Pure exposure model: DI, AEC, readiness, console stepping
    patient/           Patient instructions panel + pure instruction → response model
    radiograph/        Render plan + pure pixel pipeline + canvas (Session 4)
    evaluation/        Rule engine, result types, result UI
    scoring/           Weighted score aggregation
  stores/              Zustand simulation store
  i18n/                next-intl routing/request/navigation
  lib/                 Small helpers
```

## Adding a case
Create a `RadCase` object in `src/data/cases/`, register it in `src/data/cases/index.ts`. Rules are declarative (`equals`, `range`, `coverage`); bilingual feedback lives in the case. No new page needed.

## Known limitations
- Medical values unvalidated; the result radiograph is an educational simulation (effect magnitudes are uncalibrated approximations).
- Practice mode only; Assessment Mode is typed (`SimulationMode`) but not implemented.
- Only PA / AP / lateral selectable; AP-portable and lateral scenarios not authored.
- The collimated field is centred on the central ray (like a real collimator), so mis-centering can clip anatomy — intentional.
- On touch devices the positioning workspace suppresses panning while editable; scroll via the surrounding gutter.
- No persistence, accounts or backend.

## Roadmap
See spec §22: technique console behaviour, validated image variants, assessment mode, AP portable, lateral chest, instructor tools, further exams, CT/MRI.
