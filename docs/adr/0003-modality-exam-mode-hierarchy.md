# ADR-0003 — Hierarchy modality → exam → mode (Learn, Reference, Simulate, Practice, Assess)
**Status:** Proposed; **amended by owner decision D1 (Session 7): keep ONE mode (Practice) for now** — the five-mode hierarchy is a target, split Simulate from Practice only if a no-hints, timed or exam-like variant is needed · **Date:** 2026-10-06

## Context
The target is an integrated imaging-education platform, not a chest simulator. Spec §18 lists X-ray, CT, MRI; US is added by the owner. A learner needs to *read* about an exam, *look things up*, and *practise*; the existing app only offers practice with scoring.

## Decision
Three-level catalogue: **modality** (X-ray, CT, MRI, US) → **exam** (e.g. Chest PA erect) → **mode** (Learn, Reference, Simulate, Practice, Assess). Routes `/[locale]/[modality]/[exam]/[mode]`; each exam declares which modes exist and their status. Today's Chest PA experience is *Practice*.

## Alternatives considered
- **Flat case list (today)** — does not scale to non-simulated content; no home for Learn/Reference.
- **Mode first** (Learn › X-ray › Chest PA) — duplicates the exam list per mode and hides what an exam offers.
- **Anatomy/region first** (Chest › X-ray/CT/MRI/US) — attractive pedagogically (compare modalities of one region) but the *engines, safety and assets* differ per modality; kept as a future cross-link ("same region in other modalities"), not the primary hierarchy.
- **Fewer modes** (Learn + Practice + Assess) — Reference (searchable, cited facts) and Simulate (sandbox, no rubric) have different content/evidence rules; merging them blurs the evidence gate (§6.2).

## Consequences
+ New modalities ship Learn/Reference without an engine. + The roadmap is visible in the UI. − A route migration (redirect for `/simulation/[caseId]`). − Owner decided (D1) to keep one mode for now; the shell (Session 8, D2: before Chest Lateral) is built around exam → Practice, with Learn / Reference containers and room for more modes.
