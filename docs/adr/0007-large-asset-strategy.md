# ADR-0007 — Large volumes live outside git, described by a checksummed manifest
**Status:** Proposed (nothing implemented). Owner decision D5 (Session 7) narrows the first imagery: own-work schematics and synthetic phantoms labelled "schematic / synthetic - not a patient image" (EN + AR), so no large real volume is needed before the realistic-imagery stage · **Date:** 2026-10-06

## Context
CT/MRI volumes are tens of MB; the pilot is "connect the repo and deploy"; Cloudflare Pages has per-file and per-deployment limits (**to verify**). Today's assets are ≤ 1 MB.

## Decision
Keep in git: derivation scripts, registry entries (A-xxx), manifest (id, URL, sha256, bytes, dimensions, orientation, licence), and assets up to a small budget. Serve large derived series (per-slice WebP/AVIF/JPEG tiles + an index, or video for US) from object storage (e.g. Cloudflare R2) behind the same origin, immutable hashed URLs, lazy per slice. A test checks manifest ⇄ registry ⇄ checksum. Never commit unmodified masters of large datasets; document where to re-fetch them.

## Alternatives considered
- **Commit everything** — repo bloat, slow clones, hits host limits.
- **Git LFS** — breaks simple Git-connected builds on some hosts, quota/billing, still ships files to the build.
- **A DICOM/PACS server (Orthanc, dcm4chee)** — real-world fidelity but needs a server, PHI-grade ops and DICOM licensing diligence; overkill for education with open de-identified derivatives.
- **Synthetic phantoms only** — cheapest, no licence/privacy risk, good for Simulate; but low realism; kept as the *first* option and a fallback.
- **Server-side image generation** — not static; needs a backend.

## Consequences
+ Repo stays small; assets are verifiable and cacheable. − Another system to operate (bucket); CORS/CSP `img-src`/`connect-src` must allow it (currently `'self'` only — same-origin routing avoids changing the CSP).
