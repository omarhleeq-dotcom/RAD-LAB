# Session 5 — scenario matrix (generated)

Generated from `scripts/qa/scenarios.json` + `scripts/qa/golden/matrix.json` (`npm run qa:golden` regenerates the JSON; this table is rebuilt from it). Score, educational pass mark (critical findings gate it without changing the number), critical findings, non-passing checks (◐ partial, ✕ fail), picture effects and the number of findings labelled “not drawn in this image”.

| Scenario | Group | What it is | Score | Pass mark | Critical | Non-passing checks | Effects in the picture | Not-drawn labels |
|---|---|---|---|---|---|---|---|---|
| `correct` | correct | Fully correct exam | 100 | meets |  | — | marker |  |
| `correct-R` | correct | Fully correct, R marker (viewer's left) | 100 | meets |  | — | marker |  |
| `correct-aec` | correct | Fully correct, AEC with both lung-field chambers | 100 | meets |  | — | marker |  |
| `correct-edge` | correct | Edge of every tolerance, still full credit | 100 | meets |  | — | marker |  |
| `projection-ap` | single | AP instead of PA | 93.8 | below | wrong-projection | `projection`✕ | projection, marker |  |
| `projection-lateral` | single | Lateral instead of PA | 93.8 | below | wrong-projection | `projection`✕ | projection, marker |  |
| `rotation-pos4` | single | Rotation +4° (partial) | 90 | meets |  | `rotation`◐ | rotation, marker |  |
| `rotation-pos12` | single | Rotation +12° | 80 | meets |  | `rotation`✕ | rotation, marker |  |
| `rotation-neg12` | single | Rotation −12° | 80 | meets |  | `rotation`✕ | rotation, marker |  |
| `rotation-pos3` | single | Rotation +3° (just outside the full-credit band) | 90 | meets |  | `rotation`◐ | rotation, marker |  |
| `centering-x-partial` | single | Central ray 2.5 cm off the midline (partial) | 96.3 | meets |  | `centering-lateral`◐ | centering, marker |  |
| `centering-x-off` | single | Central ray 3.5 cm off the midline, no clipping | 92.5 | meets |  | `centering-lateral`✕ | centering, marker |  |
| `centering-y-high` | single | Central ray too low on the chest (field slides down; apices cut) | 84.7 | meets |  | `collimation-clipping`✕, `collimation-excess`◐, `centering-vertical`✕ | collimation-clipping, excess-field, centering, marker |  |
| `centering-y-low` | single | Central ray too high on the chest (field slides up; lower lungs cut) | 86.3 | meets |  | `collimation-clipping`✕, `centering-vertical`✕ | collimation-clipping, centering, marker |  |
| `clip-top` | single | Field cuts the apices | 84.7 | meets |  | `collimation-clipping`✕, `side-marker`◐, `centering-vertical`✕ | collimation-clipping, centering, marker |  |
| `clip-bottom` | single | Field cuts the costophrenic angles | 86.3 | meets |  | `collimation-clipping`✕, `centering-vertical`✕ | collimation-clipping, centering, marker |  |
| `clip-left` | single | Field cuts the viewer's left lung edge | 86.3 | meets |  | `collimation-clipping`✕, `centering-lateral`✕ | collimation-clipping, centering, marker |  |
| `clip-right` | single | Field cuts the viewer's right lung edge | 84.7 | meets |  | `collimation-clipping`✕, `side-marker`◐, `centering-lateral`✕ | collimation-clipping, centering, marker |  |
| `excess-field` | single | Fully open field | 94.7 | meets |  | `collimation-excess`◐, `centering-vertical`◐ | excess-field, centering, marker |  |
| `chin-tucked` | single | Chin tucked | 96.9 | meets |  | `chin`✕ | chin, marker |  |
| `shoulders-relaxed` | single | Shoulders not rolled forward | 96.9 | meets |  | `shoulders`✕ | scapulae, marker |  |
| `marker-none` | single | No side marker | 96.9 | meets |  | `side-marker`✕ | baseline |  |
| `marker-L-wrong-side` | single | L marker placed on the viewer's left | 96.9 | below | wrong-side-marker | `side-marker`✕ | marker |  |
| `marker-R-wrong-side` | single | R marker placed on the viewer's right | 96.9 | below | wrong-side-marker | `side-marker`✕ | marker |  |
| `marker-cut-by-field` | single | L marker partly outside a narrower field | 98.4 | meets |  | `side-marker`◐ | marker |  |
| `sid-150` | single | SID 150 cm (partial) | 91 | meets |  | `dose-optimization`◐, `sid`◐ | excess-exposure, marker | 2 |
| `sid-120` | single | SID 120 cm | 86 | meets |  | `dose-optimization`◐, `sid`✕ | excess-exposure, marker | 2 |
| `sid-200` | single | SID 200 cm (partial) | 91 | meets |  | `exposure-adequacy`◐, `sid`◐ | low-exposure, marker | 1 |
| `kvp-105` | single | kVp 105 (below the demo band, inside the reference range) | 94 | meets |  | `kvp`◐, `exposure-adequacy`◐ | low-exposure, marker | 1 |
| `kvp-70` | single | kVp 70 (below the reference range) | 96 | meets |  | `kvp`✕ | low-penetration, marker |  |
| `kvp-140` | single | kVp 140 (above the demo band, inside the reference range) | 94 | meets |  | `kvp`◐, `dose-optimization`◐ | excess-exposure, marker | 2 |
| `mas-low` | single | mAs 1 (below target) | 92 | meets |  | `exposure-adequacy`✕ | low-exposure, marker |  |
| `mas-very-low` | single | mAs 0.5 (insufficient) | 92 | meets |  | `exposure-adequacy`✕ | low-exposure, marker |  |
| `mas-above` | single | mAs 5 (above target) | 96 | meets |  | `dose-optimization`◐ | excess-exposure, marker | 1 |
| `mas-excess` | single | mAs 12.5 (excess, dose-creep risk) | 92 | meets |  | `dose-optimization`✕ | excess-exposure, marker | 1 |
| `aec-centre-only` | single | AEC reading the dense central chamber only | 96 | meets |  | `dose-optimization`◐, `aec-chambers`◐ | excess-exposure, marker | 2 |
| `aec-outside-field` | combo | AEC chambers outside a narrowed light field (backup limit) | 84.2 | meets |  | `collimation-clipping`✕, `side-marker`◐, `dose-optimization`✕, `aec-chambers`✕ | collimation-clipping, excess-exposure, marker | 2 |
| `breathing-expiration` | single | “Breathe out and hold it” | 90 | meets |  | `breathing`✕ | inspiration, marker |  |
| `breathing-normal` | single | “Breathe normally” | 90 | meets |  | `breathing`✕ | inspiration, marker |  |
| `breathing-none` | single | No breathing instruction | 90 | meets |  | `breathing`✕ | inspiration, marker |  |
| `motion-none` | single | No instruction about keeping still | 100 | below | patient-motion | `motion-instruction`✕ | motion, marker |  |
| `motion-relax` | single | “Relax — you can move naturally” | 100 | below | patient-motion | `motion-instruction`✕ | motion, marker |  |
| `combo-rotation-clip` | combo | Rotated and mis-collimated | 66.3 | below |  | `collimation-clipping`✕, `rotation`✕, `centering-lateral`✕ | rotation, collimation-clipping, centering, marker |  |
| `combo-low-kvp-low-mas` | combo | Low kVp and low mAs | 88 | meets |  | `kvp`✕, `exposure-adequacy`✕ | low-exposure, low-penetration, marker |  |
| `combo-low-kvp-high-mas` | combo | Low kVp compensated with mAs (does not repair penetration) | 92 | meets |  | `kvp`✕, `dose-optimization`◐ | excess-exposure, low-penetration, marker | 1 |
| `combo-preparation` | combo | Chin, shoulders, breathing and keep-still all missed | 83.8 | below | patient-motion | `chin`✕, `shoulders`✕, `breathing`✕, `motion-instruction`✕ | scapulae, chin, inspiration, motion, marker |  |
| `combo-ap-rotated` | combo | AP projection and rotation | 73.8 | below | wrong-projection | `projection`✕, `rotation`✕ | projection, rotation, marker |  |
| `combo-short-sid-excess` | combo | Short SID with unchanged mAs (excess exposure, magnification) | 86 | meets |  | `dose-optimization`◐, `sid`✕ | excess-exposure, marker | 2 |
| `combo-aec-clipped` | combo | AEC with the lung chambers, field cutting the left edge | 86.3 | meets |  | `collimation-clipping`✕, `centering-lateral`✕ | collimation-clipping, centering, marker |  |
| `combo-marker-and-clip` | combo | Wrong-side marker and a narrow field | 90.6 | below | wrong-side-marker | `collimation-clipping`✕, `side-marker`✕ | collimation-clipping, marker |  |
| `combo-all-wrong` | combo | Everything wrong at once | 18.6 | below | wrong-projection, patient-motion, wrong-side-marker | `projection`✕, `collimation-clipping`✕, `chin`✕, `shoulders`✕, `side-marker`✕, `rotation`✕, `centering-lateral`✕, `kvp`✕, `exposure-adequacy`✕, `sid`✕, `breathing`✕, `motion-instruction`✕ | projection, rotation, collimation-clipping, centering, scapulae, chin, inspiration, motion, low-exposure, low-penetration, marker | 1 |
| `initial-state` | combo | The case's starting state, exposed untouched | 13.6 | below | wrong-projection, patient-motion | `projection`✕, `collimation-clipping`✕, `collimation-excess`◐, `chin`✕, `shoulders`✕, `side-marker`✕, `rotation`✕, `centering-lateral`✕, `centering-vertical`✕, `kvp`✕, `dose-optimization`◐, `sid`✕, `breathing`✕, `motion-instruction`✕ | projection, rotation, collimation-clipping, excess-field, centering, scapulae, chin, inspiration, motion, excess-exposure, low-penetration | 2 |
