# ADR-0009 — New modalities climb Learn + Reference → Simulate → Practice → Assess; Assess last
**Status:** Proposed · **Date:** 2026-10-06 · supersedes the spec's session order (§25: Session 7 = Practice/Assessment) for Assess only

## Context
Assess needs: user identity, storage of attempts, retention and privacy rules (students' performance data), integrity (no answer leakage, tamper resistance), instructor roles, legal/ownership questions (spec §28 lists database, authentication, storage of results as undecided). The pilot is static with no accounts. Content validated enough for *assessment* is stricter than for learning.

## Decision
Every new modality ships **Learn + Reference** first (no engine, no data collection), then **Simulate**, then **Practice**; **Assess** is implemented last and only after the owner decides: identity/auth provider, storage and region, retention, privacy notice/consent, who owns data, integrity model (server-side evaluation), and after reviewed non-provisional rules exist. Until then the Assess route does not exist in the UI; the engine stays serialisable (`AttemptRecord` type) so Assess can be added without redesign.

## Alternatives considered
- **Assess immediately after Practice for Chest PA (spec §25)** — most useful to instructors, but would force backend + privacy decisions now and assess on still-provisional rules.
- **Client-only "assessment" with local storage** — no identity or integrity; looks like assessment, isn't; risk of being used for real grading.
- **Skip Learn/Reference, go straight to simulation for CT/MRI/US** — highest effort and highest evidence risk before any validated content exists.

## Consequences
+ Faster visible progress with lower risk; safety content (MRI) is reviewed as text before it is simulated. − Instructor features wait; the owner should expect Assess late in the roadmap.
