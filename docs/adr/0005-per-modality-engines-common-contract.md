# ADR-0005 — One engine module per modality behind a common contract
**Status:** Proposed (not implemented; Session 7 kept the single X-ray engine in `features/*` and did not create `src/modalities/`) · **Date:** 2026-10-06

## Context
CT, MRI and US differ from radiography in state (protocols, sequences, probe pose), results (volumes, series, live frames) and safety content (`PLATFORM_ARCHITECTURE.md` §4.4). They must still share navigation, content, evidence/licensing, i18n and scoring-gate semantics.

## Decision
`ModalityModule { evaluate, buildPlan, defaultSettings, View }` per modality in `src/modalities/<id>/`, all pure below the `View`. The platform shell knows only this interface and the catalogue. A modality never imports another modality. Shared pieces (evidence types, `LocalizedText`, result summary, mode switcher) live in shared `domain/` and `components/`.

## Alternatives considered
- **One universal engine with a huge settings schema** — a lowest-common-denominator model that fits no modality well and couples safety-critical MRI rules to X-ray tuning.
- **Separate apps / packages per modality (monorepo)** — strongest isolation, but triples tooling, i18n, hosting and navigation; revisit if teams or release cadences diverge.
- **Plugin loading at runtime (micro-frontends)** — operational complexity with no pilot benefit.
- **X-ray only, other modalities as static content** — viable for Learn/Reference (which need no engine) and is what the roadmap starts with; the contract is only needed when a modality reaches Simulate.

## Consequences
+ Modalities evolve independently; lazy-load each `View` (bundle size). − Some duplication across engines is accepted until a third consumer justifies extraction (rule of three).
