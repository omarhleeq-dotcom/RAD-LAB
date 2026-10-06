# ADR-0008 — Deterministic engines; renderers never feed scoring; disclosure is a policy
**Status:** Accepted (Sessions 3–5, enforced by `architecture.test.ts`) · **Date:** 2026-10-06

## Context
Scores must be reproducible, explainable and auditable (later: Assess, instructors). Renderers use canvas and could drift between browsers.

## Decision
Evaluation is a pure function of settings + definition; no randomness (seeded hash noise only), no clock, no pixels. `ResultState → RenderPlan → pure pipeline` and the renderer never imports the engine. What the learner sees by mode (hints, expected values, effect cards, notes) is a *disclosure policy* applied to the same `EvaluationResult`, not different computations. Extended to volumes/probes by adding a display-only `ViewState`.

## Alternatives considered
- **Score from the rendered image** (image-quality metrics) — circular, non-reproducible across browsers, invites "scoring the artefact instead of the decision".
- **Server-side scoring** — needed eventually for tamper-proof Assess, but would make the pilot non-static; the pure engine can run server-side later unchanged (it is deterministic and serialisable).
- **Randomised variation per attempt** — makes goldens, review and fair assessment impossible.

## Consequences
+ Golden-testable refactors (Session 7), replayable attempts. − Realism limited to labelled approximations.
