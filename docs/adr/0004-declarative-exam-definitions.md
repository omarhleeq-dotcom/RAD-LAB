# ADR-0004 — Declarative exam and case definitions replace the fixed `RadCase` / `SimulationSettings`
**Status:** Accepted; **partially implemented in Session 7** · **Date:** 2026-10-06 (implemented 2026-10-06)

## Context
`RadCase` merges the *exam* (rules, tolerances, controls, scoring) with a *case* (patient, scenario, initial state) and is typed to chest (`bodyPart: "chest"`). `SimulationSettings`, `CATEGORIES` and `ImageVariantId` are fixed unions with chest vocabulary (`chinPosition`, `scapulae-overlap`, …). CLAUDE.md rule 2 says "cases are data"; adding Lateral/AP would otherwise mean editing shared unions and UI.

## Decision
Split into `ExamDefinition` (declarative `ControlSpec[]`, rules, per-exam scoring categories, scene, render spec, evidence, review status) and `CaseDefinition` (patient, scenario, initial state, cooperation profile, asset). Keep today's `RadCase` as a derived compatibility view during the migration; prove equivalence with the 53-scenario golden and 53 image goldens before removing it.

## Alternatives considered
- **Per-exam code modules** (a TS file per exam with its own types) — maximum freedom, but every exam re-implements settings/UI, contradicts "data-driven cases", and multiplies QA.
- **Generic `RadCase<Settings>`** — keeps types but still needs per-exam React for controls; pushes variability into generics rather than data.
- **JSON + JSON Schema, authored outside TS** — good for a future authoring tool/instructor editing; loses compile-time checks and `LocalizedText` completeness today. Keep TS objects now, make them *serialisable* so a JSON/CMS source can be added later.
- **A small DSL** — over-engineering.

## Consequences
+ An exam inside the existing vocabulary is data-only; controls and the console can be generated. − A one-time refactor (Session 7) touching engine types and the store; risk controlled by golden equivalence. − New effects / rule kinds / scene primitives still need code once.

## Implementation status (Session 7)
- **Done:** `ExamDefinition` / `CaseDefinition` (`src/domain/exam.ts`); `composeCase()` compat view (`src/features/exam/compose.ts`); `validateExam` / `validateCase` (`src/features/exam/validate.ts`); Chest PA split into `src/data/exams/xray/chest-pa-erect.ts` + `chest-pa-technique.ts` and `src/data/cases/chest-pa-erect.ts`; registries `src/data/exams/index.ts`, `src/data/cases/index.ts`. Equivalence proven by `scripts/qa/characterisation/` (byte-identical, CI) plus the existing goldens. The simulated patient's attenuation is case data; the technique protocol is exam data.
- **Not done (remaining gaps):** declarative `ControlSpec[]` replacing the fixed `SimulationSettings`; per-exam scoring categories / `ImageVariantId` / `EffectId` / `CriticalFindingId` vocabularies; data-driven console and `SceneSpec` (only declarative `scene` / `render` ids exist, unresolved); optional `RadiographAssetSpec` landmark groups; migrating consumers off `RadCase`. Left for the second exam (rule of three). See `PLATFORM_ARCHITECTURE.md` §2.4 and decision S7-4 in `DECISIONS.md`.
- **Alternative that held:** TS objects (serialisable), not JSON/Schema; `validateExam` gives the structural safety a schema would.
