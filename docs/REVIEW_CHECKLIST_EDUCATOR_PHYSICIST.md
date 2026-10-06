# Consolidated review checklist — educator / medical physicist

One list for everything Sessions 2–5 left for expert review. Tick, correct in the named file, and note the reviewer and date. Nothing here has been clinically validated.

## A. Positioning and geometry (`src/data/cases/chest-pa-erect.ts`)
- [ ] Required anatomy region 27 × 31 cm and its position (apices → costophrenic angles, both lungs). *(A Session 5 revision to 27 × 28 cm was reverted: no reference supports it. The baseline picture covers only 27 × 28 cm of it — see `session-5-qa.md` §0.)*
- [ ] Centering target (midline; level 18.5 cm ≈ mid-thoracic / T7 teaching landmark) and tolerances (±1.4 / ±3 cm lateral, ±2.2 / ±5.4 cm vertical).
- [ ] Rotation bands ±2° full / ±5° partial; whether a picture within ±2° should be drawn symmetric (Session 5 decision).
- [ ] 5 cm excess-field margin.
- [ ] Chin and shoulder rules and the schematic overlays (position, density).
- [ ] **Marker convention** (PA display: L on the viewer's right, R on the left; no verified source defines it) and the new scored `side-marker` subcheck (Positioning, relative weight 1; wrong side = no credit; also a critical finding). Default marker size / positions. Sources: `session-5-qa.md` §0.1.

## B. Technique (`chest-pa-technique.ts`)
- [ ] kVp reference range 100–150 and demo band 110–125.
- [ ] Reference point 120 kVp · 3.2 mAs · 180 cm → DI 0; kVp exponent 3; one attenuation; detector/grid assumption.
- [ ] DI scoring bands ±1 / ±3.
- [ ] SID: 180 cm reference; bands 175–185 full, 150–200 partial.
- [ ] AEC: 3-field layout, preferred lung-field chambers, anatomy factors, backup behaviour.
- [ ] Readiness advisories (breathing, marker, keep-still).

## C. Image rendering (`features/radiograph/tuning.ts`, `chest-pa-radiograph.ts`)
- [ ] All magnitudes: rotation shifts, 12 % reduced inspiration, blur, noise σ / detail loss, penetration contrast kept (30 %).
- [ ] Landmark box, dense zones, scapula / jaw geometry; the uniform-scale (“contain”) mapping and the 1.5 cm strips above / below the drawn landmark box inside the 31 cm region.
- [ ] Reduced-inspiration cues without a rib-count rule; transradiancy tilt under rotation.
- [ ] The grey “no reference data” hatch (now ≈ 7 cm at the bottom of an open field) and its wording.
- [ ] Which findings have no visible effect (SID, kVp in range, excess exposure) — acceptable pedagogically?

## D. Patient instructions
- [ ] Cooperation profile assumptions (non-“deep breath” wording → reduced inspiration; no/“relax” keep-still → motion).
- [ ] Should the keep-still instruction be scored; how to weight Breathing / patient instructions.

## E. Scoring and wording
- [ ] Pass mark 70 and the “educational pass mark” wording.
- [ ] **Critical findings** (`scoring.criticalFindings`: wrong projection, visible patient motion, wrong-side marker → always “below the educational pass mark”; numeric score and weights unchanged). Concept = COMMON QUALITY CRITERION (maps to the “common reference” class); implementation = PROVISIONAL / educational. Confirm the list (should a missing marker, or other errors, be critical too?), the reason wording (EN / AR), and that “normally repeated in practice” is acceptable teaching language (the Positioning reference warns this is not an automatic real-world reject decision).
- [ ] All EN feedback sentences (rotation, excess field, inspiration, projection, kVp, SID) against local teaching.
- [ ] Evidence classification shown per rule.

## F. Arabic
- [ ] Every term in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) and all case text.

## G. Assets
- [ ] Baseline (young woman) vs case patient (45-year-old man): choose per [`session-5-baseline-options.md`](session-5-baseline-options.md).
- [ ] Registry [`ASSET_PROVENANCE_AND_LICENSES.md`](ASSET_PROVENANCE_AND_LICENSES.md) A-001 … A-005.
