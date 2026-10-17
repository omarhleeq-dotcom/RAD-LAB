# Session 14.5 — Ankle AP and Ankle lateral (left side, inferred)

Exam session (recipe, S-STD-1). Reference: [`RAD-LAB_Medical_Reference_Ankle.md`](../../RAD-LAB_Medical_Reference_Ankle.md) (Phase A, committed and pushed before any code). Decisions: `DECISIONS.md` S14.5-1 … S14.5-8, open items O75 … O80.

## 1. Plan
- **Phase A (docs only):** reference, provenance A-030 … A-033, `REGISTER` / `BONTRAGER-9` page lists, review-package rows, decisions, open items, the two masters under `assets/source/ankle/` (provenance masters, not served).
- **Phase B (code):** build `ankle-ap` first, then `ankle-lateral`, each its own commit with its own tests, by extending the S14.4 lower-limb builder (`lower-limb-common`, `lower-limb-geometry`, `lower-limb-technique`, case builder), the lower-limb rotation model, `LowerLimbFigure` / `LowerLimbSideView` and the registries. New hash files only (`scripts/qa/scene-dom/ankle-ap-hashes.json`, `ankle-lateral-hashes.json`). No UI redesign, no opportunistic fixes.

## 2. Gates (a failed gate stops the build and is reported)
1. **Coverage gate:** the required region is defined from what each baseline honestly shows (class B); every gap against Bontrager is documented (O77). An exam is dropped only if even the distal tibia-fibula, both malleoli and the talus are not shown.
2. **Rotation honesty gate (S-STD-1 (4)):** the rotation effect is drawn on the result image only if it is honest from one image, with labelled limits; otherwise feedback only.
3. **Side gate (S14.5-2):** the left side must need nothing beyond `markerRule.side`; a new field or new side-specific scene code → stop and report.
4. **Resolution gate:** `render.pxPerCm` from the master resolution, never above it (80 px / cm at the assumed scale); a master that supports less than 24 px / cm → stop and report.
5. **Guard gate (S14.5-8):** only new hash files; protected paths unchanged at the end (`git diff origin/main` over them is empty and listed).

## 3. What was built (Phase B)
- **Exams** `ankle-ap` (p.239) and `ankle-lateral` (p.242) from the S14.4 builder (`lower-limb-common.ts`, ankle texts in `lower-limb-ankle-texts.ts`, case builder `lower-limb-case.ts`): LEFT (inferred) via `markerRule.side` only, manual technique, 24 × 30 cm portrait, categories 28 / 22 / 17 / 22 / 11, critical = missing / wrong-side marker, tube angle perpendicular (feedback only).
- **Images** A-031 / A-033 (`scripts/derive-ankle-baselines.py`); `render.pxPerCm` 48; regions limited by the baselines (O77).
- **Rotation** (S14.5-11): AP = `limb-warp` smooth warp, lateral = `limb-copies`; models in `features/lower-limb-model`.
- **Scene:** `AnkleAp` / `AnkleLateral` in `LowerLimbFigure.tsx` (outlines `ankle-outlines.ts`), ankle leg / foot in `LowerLimbSideView.tsx`.
- Decisions S14.5-9…13; open items O75…O80.

## 4. Proof that earlier exams are unchanged
All 39 existing exam / case-definition / composed-case dumps are byte-identical before and after (compared file by file); `git diff origin/main` is empty over `scripts/qa/characterisation`, `scripts/qa/golden`, the eight earlier scene-dom hash files, `public/images/{chest*,wrist,hand,elbow,knee,foot}`, `assets/source/{chest*,wrist,hand,elbow,knee,foot}`, every earlier exam / case file and `lower-limb-outlines.json`; the one existing-test edit is the scene-id list of `generalisation.test.ts`.

## 5. QA run
`npm run check` equivalents (typecheck, eslint, vitest), `npm run build`, `scripts/qa/ankle-audit.mjs <exam>` (Playwright EN / AR × 1440 / 390, axe WCAG 2 A/AA, no overflow, a correct attempt through the UI scores 100, a wrong one shows the critical finding), `scripts/qa/label-collisions.mjs --obstacles` with `label-states/ankle-*.json` (clean), human review of the setup and result screenshots.

## 6. Limits
Mortise / stress views not built; left side inferred (O76); AP lacks the metatarsals and the lateral the 5th metatarsal tuberosity (O77); the lateral baseline's obliquity (O78); the fibula's overlap and independent talus motion are not drawn; Commons verification (O75); Arabic review.
