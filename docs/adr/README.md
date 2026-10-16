# Architecture Decision Records

Current index as of main `f90b3c9` after #80 (2026-10-16). ADRs preserve dated decisions; their implementation sections may be historical snapshots. Current code/status: [platform architecture](../PLATFORM_ARCHITECTURE.md), [project status](../project-status.md), [owner decisions](../DECISIONS.md) and [pilot setup](../PILOT_SUPABASE_SETUP.md). Accepted records are not evidence of clinical validation or a live deployment.

Implemented: the exam/case split, X-ray projection/scene registries, Practice routes, static hosting artefacts and the optional pilot Supabase slice. Still future: the five-mode product, non-X-ray engines, large-volume asset hosting and Assess. New exams/images are frozen and the next programming phase is postponed; see the [handoff](../HANDOFF.md). Older statements such as “remaining for the second exam” describe the record's date, not the current code.

Status labels: **Accepted** = recorded decision; **Proposed** = future design; **Superseded** = replaced by a later cited decision. Partial implementation is stated separately below.

| # | Decision | Status |
|---|---|---|
| [0001](0001-adr-format.md) | Record decisions as ADRs | Accepted |
| [0002](0002-static-first-hosting-cloudflare-pages.md) | Static-first pilot hosting on Cloudflare Pages (project `rad-lab`, GitHub Actions deploy), private repo | Accepted (D6) |
| [0003](0003-modality-exam-mode-hierarchy.md) | Hierarchy modality → exam → mode, five modes | Route hierarchy implemented (ADR-0011); only Practice available, five-mode target remains proposed (D1) |
| [0004](0004-declarative-exam-definitions.md) | Declarative exam + case definitions replace the fixed `RadCase` / `SimulationSettings` | Accepted; exam/case split plus later optional controls, per-exam categories and scene/projection registries implemented; full `ControlSpec[]`/consumer migration remain proposals; ADR text records Session 7 |
| [0005](0005-per-modality-engines-common-contract.md) | One engine module per modality behind a common contract | Proposed (not implemented) |
| [0006](0006-evidence-and-licensing-gate.md) | Evidence classes and the asset registry as a platform-wide gate | Accepted for X-ray; D4, D5 extend it |
| [0007](0007-large-asset-strategy.md) | Large volumes live outside git, described by a checksummed manifest | Proposed |
| [0008](0008-deterministic-no-pixel-scoring.md) | Deterministic engines; renderers never feed scoring; disclosure is a policy | Accepted |
| [0009](0009-modes-progression-assess-last.md) | New modalities climb Learn+Reference → Simulate → Practice → Assess; Assess last | Accepted (D3) |
| [0010](0010-orientation-conventions-are-data.md) | Image orientation conventions are data and never mirrored by RTL | Accepted for X-ray, proposed to extend |
| [0011](0011-routing-url-scheme-and-static-deep-links.md) | Public URL scheme `/{locale}/{modality}/{exam}/practice[?case=]`, old-URL redirects, static deep links | Accepted (Session 9, Option A) |

## Template
```
# ADR-NNNN — Title
Status · Date · Deciders (owner / session)
## Context
## Decision
## Alternatives considered (and why not)
## Consequences (good / bad / follow-ups)
```
