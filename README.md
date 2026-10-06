# RAD-LAB

Bilingual (Arabic / English) web-based educational radiography simulation platform for radiologic technology students, imaging professionals, instructors and universities.

Users position a patient, set X-ray technique, press **Expose**, then receive a simulated result, a score and explanatory feedback. Full spec: [`docs/RAD-LAB_Project_Specification.md`](docs/RAD-LAB_Project_Specification.md).

> **Medical content is provisional.** All technique values (kVp, mAs, SID, centering, collimation, rotation tolerance) are demo placeholders and have **not** been clinically validated. The result image is a labelled placeholder, not a radiograph.

## Current MVP scope (Session 1)

Adult Chest X-ray — PA Erect, practice mode, no accounts, no backend.

Implemented:
- Landing page, case library, language switcher (English LTR / Arabic RTL, URL-prefixed `/en`, `/ar`).
- Data-driven typed case model; first case `chest-pa-erect`.
- Patient positioning workspace (2D SVG): front view + plan view reacting to rotation, central-ray centering, collimation, SID, projection.
- X-ray console: projection, kVp, mAs, SID, breathing instruction, Expose.
- Rule-based evaluation engine + configurable weighted scoring (25/20/15/20/10/10).
- Placeholder result image reflecting detected faults (rotation, clipping, exposure, poor inspiration…), per-check feedback in both languages, retry / restart.
- Unit tests for the evaluation and scoring logic.

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
    xray-console/      Technique console
    evaluation/        Rule engine, result types, result UI
    scoring/           Weighted score aggregation
  stores/              Zustand simulation store
  i18n/                next-intl routing/request/navigation
  lib/                 Small helpers
```

## Adding a case
Create a `RadCase` object in `src/data/cases/`, register it in `src/data/cases/index.ts`. Rules are declarative (`equals`, `range`, `coverage`); bilingual feedback lives in the case. No new page needed.

## Known limitations
- Medical values unvalidated; result image is a placeholder schematic.
- Practice mode only; Assessment Mode is typed (`SimulationMode`) but not implemented.
- Only PA / AP / lateral selectable; AP-portable and lateral scenarios not authored.
- Collimation failures also lower centering-related coverage (field is centred on the central ray) — intentional.
- No persistence, accounts or backend.

## Roadmap
See spec §22: technique console behaviour, validated image variants, assessment mode, AP portable, lateral chest, instructor tools, further exams, CT/MRI.
