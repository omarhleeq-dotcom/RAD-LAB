# Architecture Decision Records

Short records of the main platform decisions (Session 6). Status values: **Proposed** (design only, awaiting owner), **Accepted** (already true in the code or deployment), **Superseded**. Nothing marked Proposed is implemented. Design detail: [`../PLATFORM_ARCHITECTURE.md`](../PLATFORM_ARCHITECTURE.md); order of work: [`../ROADMAP_SESSIONS.md`](../ROADMAP_SESSIONS.md).

| # | Decision | Status |
|---|---|---|
| [0001](0001-adr-format.md) | Record decisions as ADRs | Accepted |
| [0002](0002-static-first-hosting-cloudflare-pages.md) | Static-first pilot hosting on Cloudflare Pages, private repo | Accepted (repo prepared; owner connects) |
| [0003](0003-modality-exam-mode-hierarchy.md) | Hierarchy modality → exam → mode, five modes | Proposed |
| [0004](0004-declarative-exam-definitions.md) | Declarative exam + case definitions replace the fixed `RadCase` / `SimulationSettings` | Proposed |
| [0005](0005-per-modality-engines-common-contract.md) | One engine module per modality behind a common contract | Proposed |
| [0006](0006-evidence-and-licensing-gate.md) | Evidence classes and the asset registry as a platform-wide gate | Accepted for X-ray, proposed to extend |
| [0007](0007-large-asset-strategy.md) | Large volumes live outside git, described by a checksummed manifest | Proposed |
| [0008](0008-deterministic-no-pixel-scoring.md) | Deterministic engines; renderers never feed scoring; disclosure is a policy | Accepted |
| [0009](0009-modes-progression-assess-last.md) | New modalities climb Learn+Reference → Simulate → Practice → Assess; Assess last | Proposed |
| [0010](0010-orientation-conventions-are-data.md) | Image orientation conventions are data and never mirrored by RTL | Accepted for X-ray, proposed to extend |

## Template
```
# ADR-NNNN — Title
Status · Date · Deciders (owner / session)
## Context
## Decision
## Alternatives considered (and why not)
## Consequences (good / bad / follow-ups)
```
