# Session 14.5 — Ankle AP and Ankle lateral (left side, inferred)

Exam session (recipe, S-STD-1). Reference: [`RAD-LAB_Medical_Reference_Ankle.md`](RAD-LAB_Medical_Reference_Ankle.md) (Phase A, committed and pushed before any code). Decisions: `DECISIONS.md` S14.5-1 … S14.5-8, open items O75 … O80.

## 1. Plan
- **Phase A (docs only):** reference, provenance A-030 … A-033, `REGISTER` / `BONTRAGER-9` page lists, review-package rows, decisions, open items, the two masters under `assets/source/ankle/` (provenance masters, not served).
- **Phase B (code):** build `ankle-ap` first, then `ankle-lateral`, each its own commit with its own tests, by extending the S14.4 lower-limb builder (`lower-limb-common`, `lower-limb-geometry`, `lower-limb-technique`, case builder), the lower-limb rotation model, `LowerLimbFigure` / `LowerLimbSideView` and the registries. New hash files only (`scripts/qa/scene-dom/ankle-ap-hashes.json`, `ankle-lateral-hashes.json`). No UI redesign, no opportunistic fixes.

## 2. Gates (a failed gate stops the build and is reported)
1. **Coverage gate:** the required region is defined from what each baseline honestly shows (class B); every gap against Bontrager is documented (O77). An exam is dropped only if even the distal tibia-fibula, both malleoli and the talus are not shown.
2. **Rotation honesty gate (S-STD-1 (4)):** the rotation effect is drawn on the result image only if it is honest from one image, with labelled limits; otherwise feedback only.
3. **Side gate (S14.5-2):** the left side must need nothing beyond `markerRule.side`; a new field or new side-specific scene code → stop and report.
4. **Resolution gate:** `render.pxPerCm` from the master resolution, never above it (80 px / cm at the assumed scale); a master that supports less than 24 px / cm → stop and report.
5. **Guard gate (S14.5-8):** only new hash files; protected paths unchanged at the end (`git diff origin/main` over them is empty and listed).

## 3. Status
Phase A done (this commit). Phase B: see the final report.
