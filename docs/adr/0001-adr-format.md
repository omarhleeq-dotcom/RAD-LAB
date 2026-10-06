# ADR-0001 — Record decisions as ADRs
**Status:** Accepted · **Date:** 2026-10-06 · **Session 6**

## Context
Decisions so far live in session documents (`session-N-*.md`) and CLAUDE.md. As modalities are added, decisions need a stable, linkable home that outlives a session.

## Decision
Short ADRs in `docs/adr/`, numbered, one decision each, always with alternatives considered. CLAUDE.md rule 8 ("document significant architectural decisions") points here.

## Alternatives considered
- **Keep decisions in session docs** — chronological, hard to find, mixes decision with narrative.
- **One long architecture document only** — good for the whole picture (kept as `PLATFORM_ARCHITECTURE.md`), poor for tracking *why* and status per decision.
- **GitHub issues/discussions** — private repo, not versioned with the code, not readable offline.

## Consequences
Small overhead per decision; a Proposed ADR is an explicit request for an owner decision.
