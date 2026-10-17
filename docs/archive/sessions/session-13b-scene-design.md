# Session 13b — Scene design pass (S13b-1, closes O13)

**Scope:** the positioning-workspace DRAWINGS of the three chest exams (PA, Lateral, AP supine), one visual language, phone-first, EN + AR. Visual only: no scoring, no scenario / case / technique data, no baseline or result images, no engine mechanism. Medical facts are unchanged; no new clinical value was introduced (see "Questions for the educator").

## Shape audit (before → after)
`det` = detector view (`DetectorWorkspace` + figure), `plan` = `PlanView`, `side` = `ApSupineView` / the PA `SideDiagram` in `PatientCues`.

| Scene / view | Shape (before) | Represented | Verdict → after |
|---|---|---|---|
| Lateral det | head circle + white triangle | head, nose | abstract → `HeadProfile` (skull, face profile, ear, jaw line; tilts with the chin choice) |
| Lateral det | rect under the head | neck | kept (redrawn in the style tokens) |
| Lateral det | rounded rect 314 × (h+70), ran past the detector | trunk | **no real shape; its overrun below the detector was the unexplained grey band** → side-profile trunk path (chest wall, kyphosis) ending exactly at the detector edge |
| Lateral det | rounded rect (lung field) | both lungs superimposed | kept |
| Lateral det | large circle, unlabelled | heart (anterior, low) | **unexplained** → oblique ellipse + label "Heart" |
| Lateral det | 2 curved lines (arc + amber dashed arc), vertical line, vertical bar | diaphragm, posterior ribs (rotation), sternum, spine | kept (scored cue: rotation); sternum / spine unchanged |
| Lateral det | thick line up / rounded rect over the lung | arms raised / lowered | **arms drawn as a blob** → near + far arm with shoulder, elbow, hand; lowered arms lie over the lung field with an amber dashed outline + "Arms over the lungs" (guides ON only) |
| Lateral det | dashed ellipse over the apices | jaw when the chin is tucked | kept (scored fault), now with a head that visibly tilts |
| Lateral det | `<line x1=0 … stroke="none">` | nothing | **removed** |
| Lateral plan | ellipse + nose wedge | thorax + facing | head circle + arms (raised: beside the head; lowered: at the shoulder ends, amber dashed outline with guides) |
| PA / AP det | circle + rect + trapezoid | head, neck, shoulders / trunk | oval head with jaw line, shoulder caps, **arms at the sides**; trunk now continues to the detector edge (the black strip under the trunk was dead space) |
| PA / AP det | 2 ellipses (scapulae), clavicle lines + 2 discs, spine dashed line, jaw ellipse | scapulae (scored), clavicles, spinous line (rotation), jaw (chin) | kept |
| PA plan | ellipse + wedge, green dashed line | thorax / nose, "square to detector" reference | head circle + arms added; reference line kept |
| PA side | rect legs, rect trunk, circle head, triangle, circle shoulder, curve | legs, trunk, head + chin, shoulder, scapula | head → `HeadProfile` (chin cue), arm hangs, labels Anterior / Posterior / Head / Feet / Detector |
| AP side | 2 rects (bed, detector) | bed, detector | detector slab now sized to the 43 cm long axis, field shown on it, bed + back rest |
| AP side | rect + circle | torso, head | **semi-erect rotated the wrong way (patient sank into the bed)** → silhouette with head, neck, chest, near arm; the head end rises with the detector (+30°, drawing value) |
| AP side | tube rect rotated by `+angle` | tube | **housing tilted opposite to its own beam** → rotates by `−angle` (pinned by `apSideLayout` tests) |
| AP side | fixed target, fixed cone | central ray, beam | central ray now at the learner's ray position on the slab, cone to the field ends; SID along the beam |
| All | "Detector / Bucky" / "الكاسيت / البكي" | detector | → "Detector" / «الكاشف» (new key `scene.detector`; `positioning.detector` is now unused) |

Nothing interactive was removed: crosshair, 8 amber collimation handles, marker, their pointer / keyboard / ARIA behaviour, accessible names and the viewBox of the detector view are unchanged.

## Visual language (reuse for every later scene)
- Tokens: `features/positioning/scene-style.ts` (`SCENE` colours, `STROKE` weights, `LABEL_SIZE`). The scenes sit on the console panel, which is dark in both themes, so the tokens are fixed (text ≥ 7:1, strokes ≥ 3:1 on `#0b141b`); a scene never invents a hex value.
- Parts: `SceneParts.tsx` — `SceneLabel` (dark halo, `direction: ltr`), `SceneArrow` (polygon head, no glyph arrows), `HeadProfile` (profile + chin tilt).
- Patient colours: trunk `#5d778a`, head `#7b93a5`, near limb `#9db6c6`, far limb darker; lung `#33516a`; amber = the beam and the learner's controls; green = "correct" guides; sky = plain guides.
- Every scene draws what is scored (and nothing the result reveals); the faulty state of a scored cue is visible by shape (arms over the lungs, jaw over the apices), and is only outlined / labelled when "Show practice guides" is ON.
- Labels: Head ↑ / Feet ↓ on the top corners of the detector view, then Anterior / Posterior (lateral) or the patient's right / left (frontal, guides ON); Anterior / Posterior / Head / Feet in the side views. Image-convention directions are never mirrored in RTL (SVG `direction: ltr`).
- Every drawing has a text alternative (`scene.altFrontal`, `altLateral`, `altSide`, plan `positioning.alt`) built from the learner's own settings.
- No dead space: figures end at the detector edge; the plan view viewBox is cropped to its content.

## Proof that nothing else changed
`git diff main` touches only `src/features/positioning/*`, `messages/*.json` (`scene.*` added, nothing edited) and docs. Not touched: `scripts/qa/characterisation/*`, `scripts/qa/golden/*`, `public/images/*`, `assets/*`, `src/data/*`, `src/features/{evaluation,scoring,radiograph,simulation,exam,...}`. The full suite (901 tests incl. the 53-scenario characterisation and the golden checksums) passes unchanged. No scene / DOM hash or snapshot exists in the repo; the redrawn scenes change only the SVG markup of `DetectorWorkspace`, `LateralFigure`, `FrontalFigure` (new, the PA / AP figure moved out of `DetectorWorkspace`), `PlanView`, `ApSupineView`, `PatientCues`' `SideDiagram`.

## Not done / reported
- O19 (the PA / Lateral plan view of a wrongly chosen AP projection turns the opposite way) is untouched; the new head / arm shapes make the turn slightly more visible.
- The PA `rotationGuide` Arabic still says «الكاسيت» (existing key, owner-proposed correction list).


# S13b-2 — owner feedback round (colour code, labels, plan view, Lateral figure, AP figures)
Visual only, same constraints as S13b-1 (no scoring / data / image / engine change; interactions unchanged; `planRotationDeg` and O19 untouched).

## What changed (points A–D of the feedback)
| Point | Change |
|---|---|
| A1 colour code | `scene-style.ts`: anatomy = muted cool greys / blues, every fill dark (luminance < 0.12), no accent hue; interactive elements and the beam = ONE accent (amber) on a dark under-stroke (`UnderStroked`, crosshair, collimation field); guides = two colours only: green = targets (centring zone, SID reference), sky = reference lines and the fault outline (midline, "square", arms over the lungs), always told apart by shape / label as well. Contrast is pinned by `scene-style.test.ts` (numbers below). |
| A2 labels | `SceneLabel` = text on a measured semi-opaque dark pill (no stroke halo, so Arabic joins are not smeared). Arabic SID reads «SID 120 سم» (`scene.sidValue`), the tube angle and rotation readouts isolate their numbers (LRM) so the degree sign stays attached. |
| A3 Head / Feet | Head ↑ at the top-left, Feet ↓ at the BOTTOM edge (detector views); Anterior / Posterior (lateral) or the patient's right / left (frontal, guides ON) on the second row. Never mirrored in RTL. |
| A4 collisions | Every label has its own slot. `/tmp` script (not committed) measured every `<text>` box at 390 and 1440 px, EN and AR, guides ON / OFF, lateral arms raised / lowered, AP supine / semi-erect × tube angle 0 / 10 / −10 × SID 100 / 120 / 200: 128 states, 0 overlaps, 0 labels outside the viewBox. |
| A5 Arabic | «الكاسيت» → «الكاشف» in the scene strings (list in `ARABIC_TERMINOLOGY.md`). |
| B plan view | Redrawn larger: top-down head, shoulder / chest ellipse, arms, the detector as a thick labelled bar, tube + beam, rotation as an arc between the reference axis and the shoulder axis with its value outside the body, the SID on ONE axis with its reference tick (a dotted extension from the tube to the tick when the SID is shorter than the reference). |
| C Lateral | New profile head (no ear / eye circle, one silhouette with the neck, chin tilt), profile thorax, shoulder girdle, tapered outlined arms; see the checklist. |
| D1 AP frontal | Detector surface and edge differ from the body fill; body outline and the arms (tapered, outlined, separate from the trunk) stay readable; trunk continues to the detector edge; the collimation dim is lighter. |
| D2 AP side | Profile silhouette (head with face up, chest, near arm, thigh / leg / foot), head end raised with the detector when semi-erect; all labels inside the viewBox with margin; the tube angle has its own slot; the SID is a dimension line parallel to the central ray from the tube to the detector with the reference tick on the same line. SID scale 0.62 px / cm so a long SID with a raised head end stays in the frame. |

## Contrast (computed, WCAG relative luminance)
Accent on each fill it can cross: amber 9.8 (bg) / 7.7 (bezel) / 8.7 (detector) / 5.0 (trunk) / 4.0 (head) / 3.5 (limb) / 4.4 (far limb) / 6.8 (lung); green 10.7 / 8.3 / 9.4 / 5.4 / 4.4 / 3.8 / 4.7 / 7.4; sky 11.2 / 8.7 / 9.8 / 5.6 / 4.6 / 3.9 / 4.9 / 7.7 — all ≥ 3:1 (minimum 3.46). Each accent on its dark under-stroke: 10.1 / 11.0 / 11.5. Anatomy outline on trunk / head / limb / far limb / lung: 4.8 / 3.9 / 3.3 / 4.2 / 6.6. Label text on its pill 16.3; on the pill composited over the lightest fill ≥ 7. Detector edge on the detector surface 3.7; the label on the detector bar 5.3.

## Lateral figure — anatomical checklist (verified on the rendered screenshots, EN and AR, 390 px, guides ON / OFF, arms raised / lowered)
1. Orientation: the patient looks to the viewer's LEFT, anterior left / posterior right (labels Anterior / Posterior), head at the top, feet off the lower edge (label Feet at the bottom edge); never mirrored in RTL. ✔
2. Anterior chest wall / sternum is the line on the left of the lung field; the thoracic spine is the band on the right with a gentle kyphosis (convex posteriorly) and the posterior ribs behind it. ✔
3. Shoulder girdle at the top (shoulder joint above the lung field); the lung apices are clear of it. In the tucked-chin state the jaw is drawn over the apices (scored fault, dashed). ✔
4. Lung field between sternum and spine; heart anterior (left) and inferior, labelled; the two diaphragm domes drawn superimposed (two close arcs). ✔
5. Trunk ends exactly at the detector's lower edge (no band below it, no overrun). ✔
6. Proportions: head about 0.3 of the chest depth, neck short, head profile with forehead, nose, lips, chin and jaw in one silhouette; no extra circle. ✔
7. Arms RAISED: both arms rise from the shoulder to elbows beside the head and the hands rest near the top of the head. Arms LOWERED: tapered arms hang from the shoulder over the lung field (outlined and labelled "Arms over the lungs" only with guides ON). Not tubes: the limbs taper shoulder → elbow → wrist → hand. ✔
8. Scored and drawn: arms, chin (head tilt + jaw over the apices), rotation (posterior-rib separation). Not drawn: anything the result shows; lean / weight distribution (not modelled, O15). ✔
Assumptions kept out of the drawing: the exact heart outline / position, the shoulder-girdle bones, the vertebral column detail (REVIEW_PACKAGE §1d).

## Byte-identity proof (S13b-2)
`git diff` against the S13b-1 head touches only `src/features/positioning/*`, `messages/*.json` (new `scene.*` keys; the Arabic «الكاسيت» → «الكاشف» replacements in `positioning.*`), docs and `CLAUDE.md`. No change in `scripts/qa/characterisation/*`, `scripts/qa/golden/*`, `public/images/*`, `assets/*`, `src/data/*`, scoring, evaluation, radiograph, simulation, exam. The full suite (905 tests incl. the 53-scenario characterisation and the golden checksums) passes unchanged; no snapshot changed.
