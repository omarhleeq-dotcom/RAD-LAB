# Session 2 — Interactive positioning workspace

Medical baseline: `RAD-LAB_Medical_Reference_Chest_PA.md` (the "reference"). Nothing here adds medical values beyond it.

## Architecture decisions
- **Normalized state.** `SimulationSettings.centralRay` is `{x,y}` in [-1,+1] over the detector (x: -1 = left edge *as drawn*, y: -1 = top). `collimation` is `{width,height}` as a fraction of the detector. Case data (required anatomy, marker size) stays in cm; `features/simulation/coords.ts` converts. Pixels never enter state.
- **Pure geometry** in `features/simulation/coords.ts` (client→view→norm→cm, letterbox-aware, clamping, edge drag, nudge) and `geometry.ts` (field, coverage, marker rects). React only calls them.
- **RTL vs anatomy.** The workspace SVG is `direction: ltr` and pointer maths uses physical screen boxes, so Arabic mirrors the surrounding UI but never the anatomy. "Left/right" in feedback means left/right of the detector view (patient-side naming is not defined by the reference).
- **Field stays centred on the central ray** (as on a real collimator). Dragging an edge sets the half-extent on that axis, so mis-centering has real consequences (clipping). This replaces nothing from Session 1; only the units changed.
- **Scoring weights unchanged (25/20/15/20/10/10).** Positioning now has internal subchecks (relative weights): projection 2, collimation-clipping 2, collimation-excess 1, chin 1, shoulders 1, side-marker 0 (shown, unscored). Session 1's single collimation rule was split into clipping vs excess, per the reference ("penalize separately or within positioning").
- **Rules are traceable:** every `CheckRule` has `evidence {status, reference, note}`; a test enforces it.
- **Guides** (target zone, midline, SID reference, cue list) are gated by `mode === "practice"` and a learner toggle, so Assessment mode can hide them.
- Session 1 bug fixed: vertical-centering feedback used inverted "too high/low" wording relative to value direction; it is now direction-explicit.

## Medical rule classification
| Rule | Status | Reference |
|---|---|---|
| PA erect projection | VALIDATED | §2 Patient orientation, §3A |
| Chin elevated, clear of apices | VALIDATED | §2 Head and shoulders, §5.8 |
| Shoulders forward, scapulae out of lungs | VALIDATED | §2, §5.9 |
| Breathing: full inspiration, suspended | VALIDATED | §2 Respiration |
| Rotation neutral (target) | VALIDATED target; ±2°/±5° bands PROVISIONAL → EDUCATIONAL SIMPLIFICATION | §2, §3B, §6 |
| Midline alignment | VALIDATED target; tolerance PROVISIONAL → EDUCATIONAL SIMPLIFICATION | §2, §3C |
| Mid-thoracic / T7 vertical target | EDUCATIONAL SIMPLIFICATION (centre of required-anatomy region, not measured T7); tolerance PROVISIONAL | §2, §3C |
| Coverage: apices, lungs, CP angles | VALIDATED criteria; region size in cm PROVISIONAL → EDUCATIONAL SIMPLIFICATION | §2 Coverage, §3D |
| Excess field | principle VALIDATED; 5 cm margin PROVISIONAL | §2, §3D |
| SID 180 cm | VALIDATED target; ±5 / 150–200 bands PROVISIONAL | §2 |
| Side marker placement | EDUCATIONAL SIMPLIFICATION, unscored | §3F |
| kVp / mAs bands | PROVISIONAL (carried from Session 1, not changed) | §4 |

Rotation visual (spine shift, lung asymmetry) is a drawing model only; scoring uses `rotationDeg`. No pixel-to-degree claim is made (§6).

## Open / TODO(medical-review)
Centering and rotation tolerances; required-anatomy region size; marker side-vs-patient-side rule; kVp/mAs/AEC; rotation sign meaning.
