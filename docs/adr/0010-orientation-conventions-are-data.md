# ADR-0010 — Image orientation conventions are data and never mirrored by RTL
**Status:** Accepted for X-ray (Session 4–5: `positioning.markerSide`, canvas `direction: ltr`); proposed to extend · **Date:** 2026-10-06

## Context
Arabic UI is RTL; medical images have fixed orientation conventions (PA display: patient left = viewer right; axial CT/MRI display conventions). Mirroring an image or its letter labels would teach the wrong laterality.

## Decision
Each viewer declares its orientation convention in data (marker sides, orientation letters, which side of the display is patient-left). Image areas are `direction: ltr`; scoring and rendering read the same convention field. UI chrome around the image mirrors normally; numbers/units/parameter names stay `dir="ltr"`.

## Alternatives considered
- **Mirror the whole page in RTL** — breaks laterality (a patient-safety teaching error).
- **A global "radiological convention" constant** — wrong for projections/modalities with different conventions (lateral, AP, CT vs MRI vendor display).
- **Per-component hard-coding** — the laterality bugs Session 5 audited for.

## Consequences
+ One source of truth for score + picture. − Each new projection needs its convention sourced (open decision: marker rubric).
