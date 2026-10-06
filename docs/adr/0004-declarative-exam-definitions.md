# ADR-0004 — Declarative exam and case definitions replace the fixed `RadCase` / `SimulationSettings`
**Status:** Proposed · **Date:** 2026-10-06

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
