# ADR-0006 — Evidence classes and the asset registry as a platform-wide gate
**Status:** Accepted for X-ray (Sessions 3–5); proposed to extend to every modality. Owner decisions D4 (CT dose: definitions first, numeric levels only with a cited source and region) and D5 (first CT/MRI/US imagery: labelled schematics / synthetic phantoms) apply it · **Date:** 2026-10-06

## Context
CLAUDE.md rule 1: no invented medical facts; unvalidated values are provisional. The five evidence classes and `ASSET_PROVENANCE_AND_LICENSES.md` exist. CT dose figures and especially MRI safety content raise the stakes.

## Decision
Every rule, value, feedback sentence, effect and Learn/Reference statement carries an evidence class + `SourceRef` (or is `provisional` and badged). Every external asset has a registry entry in the same commit. Mode policy (`PLATFORM_ARCHITECTURE.md` §6.2): Assess may use only reviewed, non-provisional scoring rules. Sources are limited to IAEA, WHO, AAPM, ACR, IEC *concepts* and peer-reviewed (PubMed) literature; each candidate is marked "to verify" until a human has read it. MRI safety content is the strictest tier; numeric dose reference levels are never universal.

## Alternatives considered
- **Per-modality ad-hoc rules** — drift; MRI safety would not inherit the discipline.
- **Rely on a final clinical review only** — late, unscalable; wrong content would already be woven into rules and feedback.
- **Accept CC BY-SA / NC datasets** — widens the pool of images, but SA obliges derivatives to share alike and NC blocks institutional/commercial use (the spec anticipates universities); excluded unless the owner approves a specific case.
- **Use AI-generated imagery for Learn** — unvalidated anatomy/pathology would break rule 1; allowed only as clearly labelled schematic art made by RAD-LAB.

## Consequences
+ Uniform trust model, reviewable. − Slower authoring: reference documents must be written (and sources read) before each exam is coded.
