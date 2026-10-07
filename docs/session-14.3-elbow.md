# Session 14.3 — Elbow AP (extended) and Elbow Lateral (flexed 90°)

Exam session (recipe, S-STD-1). Reference: [`RAD-LAB_Medical_Reference_Elbow.md`](RAD-LAB_Medical_Reference_Elbow.md). Decisions: `DECISIONS.md` S14.3-5 … S14.3-12, open items O47 … O52 (O43 / O44 answered).

## 1. What was built
- **Images (A-018 … A-021):** owner-attached CC0 files, **owner-verified** (Commons API HTTP 429 twice, O47). AP: "Sin" filled, "F" and a frame line cropped (S14.3-7, O48); lateral: no text. `scripts/derive-elbow-baselines.py`.
- **Exams** `elbow-ap` (p.166) and `elbow-lateral` (p.172): one builder `src/data/exams/xray/elbow-common.ts` (+ `elbow-geometry.ts`, `elbow-technique.ts`), left elbow, manual technique, 28 / 22 / 17 / 22 / 11, critical findings = missing / wrong-side marker, letter-only `fixed-side` marker.
- **Cases** `src/data/cases/elbow-ap.ts`, `elbow-lateral.ts` (+ `*-radiograph.ts`, `elbow-patient.ts`).
- **Rotation effects** from ONE image each, from one small model `src/features/elbow-model/elbow-model.ts` that the scene and the result image share (S14.3-10 / -11): AP epicondyle narrowing + radius / ulna apart or superimposed; lateral doubled condyle outline and radial head / coronoid (60 % / 40 %). Concentric arcs and double ridges are **not** drawn.
- **Scene:** `ElbowFigure.tsx` (detector view), `ElbowSideView.tsx` (side view), `elbow-visual.ts`; no PlanView, no chest cue panel.

## 2. Rules and values
Every Bontrager value (p.166 / 172) and every teaching choice is listed in `REVIEW_PACKAGE.md` S14.3-R1…R12; the teaching choices are named as such in the learner-visible feedback text.

## 3. Proof that Chest, Wrist and Hand are unchanged
`git diff origin/main --stat` over `scripts/qa/characterisation`, `scripts/qa/golden`, `scripts/qa/scene-dom/{hashes,wrist-hashes,hand-hashes}.json`, `public/images/{chest*,wrist,hand}`, `assets/source/{chest*,wrist,hand}`, the chest / wrist / hand exam and case files is empty. New guard: `scripts/qa/scene-dom/elbow-hashes.json` (added only).

## 4. QA
Targeted tests during work; full QA once at the end (see the PR description). Scripts: `scripts/qa/elbow-audit.mjs <exam>`, `scripts/qa/label-states/elbow-*.json`.

## 5. Not done / open
O47 … O52; the optional marker visual setting does not exist (O51); other elbow projections; applying the 2.5D model to the wrist (O45).
