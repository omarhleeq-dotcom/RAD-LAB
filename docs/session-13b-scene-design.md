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
