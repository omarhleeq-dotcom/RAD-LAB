# Exam recipe — adding one X-ray exam to RAD-LAB

Derived from what Chest Lateral (S12) and Chest AP supine (S13) actually touched (`git diff` of PRs #16, #17, #18), not from memory. **Binding rules live elsewhere and are only linked here:** [`DECISIONS.md`](DECISIONS.md) (binding), [`../CLAUDE.md`](../CLAUDE.md), [`session-11-generalisation.md`](session-11-generalisation.md), [`session-12-chest-lateral.md`](session-12-chest-lateral.md), [`session-13-chest-ap.md`](session-13-chest-ap.md), [`session-13b-scene-design.md`](session-13b-scene-design.md), [`sources/REGISTER.md`](sources/REGISTER.md), [`REVIEW_PACKAGE.md`](REVIEW_PACKAGE.md), [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md), [`ASSET_PROVENANCE_AND_LICENSES.md`](ASSET_PROVENANCE_AND_LICENSES.md).

**Scope of this recipe:** an exam that fits the **existing chest-built engine** using only the S11 optional mechanisms. If an exam needs something the engine does not have (see §2 "Hard-wired"), that is **not** an exam session: stop, list the need, and propose a separate, byte-identical generalisation session (reference first, rule of three — S10-2, S7-4).

---

## 1. Checklist per exam (in this order; tick each in the PR description)

0. **Reference first (S10-2).** The exam's reference (`docs/RAD-LAB_Medical_Reference_<Exam>.md`, from `templates/EXAM_REFERENCE_TEMPLATE.md`) is merged to main with a completed Needs section. No reference → no implementation.
1. **Source notes.** Governing authority is `BONTRAGER-9`, cited **by printed page** (S10b-25); on conflict Bontrager wins; where silent use EC16260 → ACR → WHO-TECH → WHO-CHEST, then an owner decision. Paraphrase only, short quotes at most, no text/figures reused, no third-party student notes, no Radiopaedia (S10-3). Add claims with locators to `docs/sources/BONTRAGER-9.md` (and the register row if a new source). Abstract-only sources are never the sole support for a value, rule, critical finding or convention.
2. **Label every value (before writing data).** For each number / rule, decide one of: *Bontrager value* (page cited) · *engine teaching choice* (e.g. partial kV bands, SID upper limit, rotation ±2°/±5°, tube-angle bands) · *provisional owner decision*. Teaching choices must be **named as such in the user-visible feedback text and in `REVIEW_PACKAGE.md`** (S12-1). Every medical rule carries one of the five `EVIDENCE_CLASSES`; everything clinical is `provisional: true` with a TODO until the O5 review. Never invent a numeric EI/EIT or a universal DI limit; no numeric mAs target (S10b-9).
3. **Owner decisions needed** (marker convention, image, anything the sources don't settle) are listed as questions up front; a decision is recorded in `DECISIONS.md` **before** the code relies on it.
4. **Exam / case / technique data** (files in §3). Weights = the PA weights unless a decision says otherwise (S10b-14) and sum to 100; initial state is deliberately *not* the answer; the case text says the baseline is a different person (S12-4).
5. **Controls through S11 mechanisms only** — see the table in §2. No new engine mechanism in an exam session.
6. **Baseline image + provenance** — §5. Records A-0xx (master) + A-0xx+1 (derived web copy) in `ASSET_PROVENANCE_AND_LICENSES.md`, a row in `sources/REGISTER.md` ("Image assets"), a derive script, a landmarks spec file.
7. **Scene** — registered scene id + drawing per §4. Scored cues are drawn; what is scored but not drawn is recorded as a gap and labelled "not drawn in this image".
8. **EN + AR strings.** All UI text in `messages/en.json` + `messages/ar.json` (keys in sync); case/exam text as `LocalizedText` with both locales; logical CSS; numbers/units `dir="ltr"`. **Every new Arabic string is DRAFT, machine-assisted**: add a dated section "Session N — <exam> strings added to the UI (DRAFT, pending owner / educator review)" to `ARABIC_TERMINOLOGY.md` listing each term. Use «الكاشف» for the detector (never «الكاسيت»).
9. **`REVIEW_PACKAGE.md`**: a new "Session N additions" subsection, one row per provisional item (ID, item, source/basis, question for the reviewer, who). No clinical value may exist that is not either cited or listed here.
10. **`DECISIONS.md`**: one entry per decision (S{N}-k) + open items (O-numbers) for gaps; never edit existing entries — supersede with a new one.
11. **Tests** (§7) incl. the byte-identity proof for every earlier exam.
12. **Audits**: `scripts/qa/<exam>-audit.mjs` + `<exam>-labels.json` (Playwright + axe), run once at the end (§7).
13. **Docs + PR**: `docs/session-N-<exam>.md` (built / rules / proof of byte-identity / QA / not done), one CLAUDE.md note, roadmap line; open a **draft PR**, report, only then mark ready.

---

## 2. S11 generic mechanisms (what an exam may use)

Details and proof: [`session-11-generalisation.md`](session-11-generalisation.md). All are optional; Chest PA declares none. Ask first: *can this be said as data?*

| Need | Mechanism (data on `ExamDefinition` / `CaseDefinition`) | Used by |
|---|---|---|
| Marker letter / side rule | `positioning.markerRule` kinds (`features/simulation/marker-rule.ts`): default `anatomical-side`, `detector-side`; display convention `markerSide` | Lateral (detector-side), AP (default) |
| Tube angulation | `controls.tubeAngulationDeg` (+ = caudad, absent = 0°) + range rule | AP |
| Extra enum controls | `choiceControls` (e.g. `side`, `arms`, `state`), validated EN+AR; button text by position via `ChoiceControlSpec.projectionLabels` (S13-7) | Lateral, AP |
| Scoring categories | per-exam keys of `categoryWeights` (collimation is scored under `positioning`) | all |
| Critical findings | id in `CriticalFindingId` + detector in `CRITICAL_DETECTORS` (`features/evaluation/critical.ts`) | Lateral `arms-over-lungs` |
| Scene | `SCENE_IDS` (`domain/exam.ts`; `SceneId` is an open string since S14.1b) + `SCENES` registry (`features/positioning/scenes.tsx`); a scene on the shared positioning view is a `SceneLayout` (`scene-layouts.tsx`: detector figure from `detector-figures.tsx`, second view, cues (optional since S14.1b: a limb scene declares none), texts) — S14-0 | all |
| Optional landmark groups | on the asset spec (e.g. no scapula group → "not drawn") | AP |
| Attenuation | `attenuationByProjection` (fallback 1 = PA reference, not measured) | Lateral 2× (provisional) |
| Baseline projection | `RadiographAssetSpec.projection?` (absent = PA); `midlineU` or the lateral separation fallback | Lateral, AP |
| Optional chest-only fields (S14.1b) | `chinPosition` / `shoulderPosition` / `breathing` in the initial settings, `availableBreathing`, `patientCooperation.inspirationResponse`, `radiograph.lungApexV` / `diaphragmDomeV`, `technique.aec` are all optional: a limb exam omits them (no cue panel, no breathing control / rule / category, no inspiration warp, manual-only technique). `validateExam` / `validateCase` check them exactly when declared | chest exams declare all |
| Body part | `BODY_PART_IDS` in `src/data/modalities.ts` (`BodyPartId` open; `validateExam` checks it) — S14.1b | chest |
| Effect hook (S14.1b) | `EXTRA_EFFECTS` / `EffectDefinition` in `features/radiograph/plan.ts`: concept + magnitude + drivers + a pure `active` predicate; **no effect registered yet, and no pixel step in the hook** (the first limb effect adds its step, landmark group and `tuning.ts` magnitudes — S14.1c) | none yet |
| Projection | `PROJECTIONS` registry (`src/data/projections.ts`; `ProjectionId` is an open string, `validateExam` checks it) — S14-0 | all |
| Result wording | `radiograph.<ns>.*`, the namespace declared on the projection in `PROJECTIONS`, read by `wordingNsOf`; falls back to common wording | Lateral, AP |

**Hard-wired to Chest (rule of three; needs a generalisation session if the new exam needs more):** the positioning scene art, the pixel steps of the chest anatomy effects (scapula / jaw / lung warp / spine shift — now run only when the asset declares the landmark group), the console JSX for any control that is not a range or an enum choice, and the chest-named message keys (`CATEGORIES` message labels, `chin-overlap` etc.). `SimulationSettings` chest cues, breathing, `bodyPart`, `SceneId`, the lung landmarks and the AEC section stopped being hard-wired in S14.1b; `CriticalFindingId`, `EffectId`, `ImageVariantId` are open vocabularies (G10 verified: a limb needs no new variant id). Limbs, abdomen, pelvis, head and spine will hit several of these (new anatomy effects, a new scene family; a new projection id is now only a registry entry, S14-0). **That is the first thing to check in step 0**: list the needs from the reference; if any is outside this table, stop and report (§9).

---

## 3. Exact touch-points (from the real Lateral / AP diffs)

**A. New files (every exam)**

| File | Content |
|---|---|
| `src/data/exams/xray/<exam>.ts` | the `ExamDefinition` (controls, rules, tolerances, scoring, critical findings, scene/render bindings, evidence) |
| `src/data/exams/xray/<exam>-technique.ts` | `ExamTechniqueProfile` (kV / mAs / SID protocol, AEC layout, evidence wording) |
| `src/data/cases/<exam>.ts` | the `CaseDefinition` (patient, order text, baseline, cooperation, attenuation, initial state) |
| `src/data/cases/<exam>-radiograph.ts` | `RadiographAssetSpec` (id, `src`, `projection`, `midlineU`, landmarks "read by eye", note "different person / not ground truth") |
| `public/images/<exam>/…` | web copy only (stripped) |
| `assets/source/<exam>/…` | provenance master (not served) |
| `scripts/derive-<exam>-baseline.py` | reproducible derivation; checks the master's checksum first; run with `python3 -I` |
| `src/features/exam/<exam>.test.ts` | per-exam tests (§7) |
| `scripts/qa/<exam>-audit.mjs`, `scripts/qa/<exam>-labels.json` | Playwright + axe audit and its label list |
| `docs/session-N-<exam>.md` | session record |

**B. Registrations (one line each; forgetting one is the usual bug)**

| Registry | File | Edit |
|---|---|---|
| Exams | `src/data/exams/index.ts` | import + append to `EXAMS` |
| Cases | `src/data/cases/index.ts` | import + append to `CASE_DEFINITIONS` |
| Scene id | `src/domain/exam.ts` | append to `SCENE_IDS` (validated by `validateExam`; `registries.test.ts` and `limb-generalisation.test.ts` check it against `SCENES`) |
| Body part (if new) | `src/data/modalities.ts` | append to `BODY_PART_IDS` |
| Scene component | `src/features/positioning/scenes.tsx` (+ `scene-layouts.tsx` / `detector-figures.tsx` if it reuses the shared view) | `SCENES["<scene-id>"]` |
| Projection (if new) | `src/data/projections.ts` | one entry in `PROJECTIONS` (+ `console.projections.<id>` messages) |
| Critical detector (if new) | `src/features/evaluation/critical.ts` | `CriticalFindingId` + `CRITICAL_DETECTORS` entry |
| Registry-list test | `src/features/exam/generalisation.test.ts` | extend the scene / detector lists and `unregisteredVariants(<exam>)` — **the only existing test an exam session may edit**, and only this list |
| Wording namespace (if its result wording differs) | `wordingNs` on the projection's entry in `src/data/projections.ts` + `messages/*.json` `radiograph.<ns>.*` | AP added `ap`; no code edit (S14-0) |

Routing needs **no edit**: `/{locale}/{modality}/{exam}[/practice]` comes from `EXAMS` + `CASE_DEFINITIONS` through `features/platform/resolve.ts` (ADR-0011); no per-exam page. `src/data/modalities.ts` and `public/_redirects` were not touched by Lateral or AP.

**C. Bespoke code that Lateral / AP still needed (a gap the recipe cannot remove — keep it minimal and optional, absent = old output):**
- Scene drawing: the figure / second view / cues components themselves (`LateralFigure.tsx` / `ApSupineView.tsx` / `FrontalFigure.tsx` pattern), registered as a `DetectorFigure` + `SceneLayout` (S14-0: no flags or branches in `PositioningView`, `DetectorWorkspace`, `PatientCues`).
- Result image: the wording namespace comes from the projection registry (S14-0); no branch in `ResultImage.tsx`, `ResultPanel.tsx`, `RadiographEffects.tsx`. Lateral also `plan.ts`, `pipeline.ts`, `tuning.ts` (rotation drawn as doubled posterior wall) and `domain/radiograph.ts` (`projection?`).
- Each such addition: every visual magnitude in `features/radiograph/tuning.ts` as an EDUCATIONAL approximation; no pixel read-back; no randomness.

**D. Docs touched in every exam PR:** `DECISIONS.md`, `REVIEW_PACKAGE.md`, `ARABIC_TERMINOLOGY.md`, `ASSET_PROVENANCE_AND_LICENSES.md`, `sources/REGISTER.md` (+ `sources/<id>.md` for new claims), `CLAUDE.md` (one bullet), `ROADMAP_SESSIONS.md` (one "Delivered" line). `messages/en.json` + `messages/ar.json` always together.

---

## 4. Scene design

Full rules and the shape audit: [`session-13b-scene-design.md`](session-13b-scene-design.md). **Never invent a hex value or a stroke weight**: import from `src/features/positioning/scene-style.ts` (`SCENE`, `STROKE`, `UNDER`, `LABEL_SIZE`); parts from `SceneParts.tsx` (`SceneLabel`, `SceneArrow`, `HeadProfile`) and `FrontalFigure.tsx`.

**Colour code (pinned by `scene-style.test.ts`; a failing contrast test means the colour is wrong, not the test):**
- **Anatomy** = muted cool grey-blue, every fill dark (luminance < 0.12), no accent hue, thin outline (`edge`, `bone`). Patient parts: trunk / head / near limb / far limb / lung from `SCENE`.
- **Interactive elements and the beam** (collimation field, crosshair, handles, marker, tube beam) = ONE accent, **amber** (`beam`), always on a dark `underStroke`.
- **Guides** (practice guides ON only) = at most two colours: **green** (`good`) = targets (centring zone, reference SID, "square" tick); **sky blue** (`guide`) = reference lines and the fault outline. Always also told apart by shape / label, never by colour alone.
- Every accent ≥ 3:1 on every anatomy fill it can cross; label text ≥ 7:1 on its pill.
- **Labels** = text on a measured dark semi-opaque pill (no stroke halo — it smears Arabic joins); every label has its own slot; no overlaps, none outside the viewBox (measure at 390 and 1440, EN and AR, guides ON/OFF, every state that moves a label).
- **Directions:** Head ↑ top-left, Feet ↓ at the **bottom edge** of detector views; then Anterior / Posterior (lateral) or the patient's right / left (frontal, guides ON); side views: Anterior / Posterior / Head / Feet / Detector. Direction labels and anatomy are image conventions: SVG `direction: ltr`, **never mirrored in RTL**. Numbers isolated with LRM so the unit stays attached.
- **Scored ⇒ drawn.** The faulty state of a scored cue is visible by shape (arms over the lungs, jaw over the apices); only outlined / labelled with guides ON. Never draw what the result reveals. Figures end exactly at the detector edge (no dead space); plan-view viewBox cropped to content.
- Every drawing has a text alternative built from the learner's own settings (`scene.alt*`); pointer / keyboard / ARIA of crosshair, 8 collimation handles and marker unchanged.

**Anatomical checklist pattern** (the Lateral figure's list, S13b-2 — write one per new figure and verify it on screenshots EN + AR, 390 px, guides ON/OFF, every choice state):
1. Orientation and direction labels. 2. Landmark lines that mark the field (sternum, spine, …) in the right place. 3. Joints / girdles the exam scores or must stay clear of. 4. Organs and the structures the beam / rules refer to, labelled if non-obvious. 5. Figure meets the detector edge, no overrun. 6. Proportions (head ≈ 0.3 chest depth, tapered limbs, no extra circles). 7. Each choice state (raised/lowered, supine/semi-erect…) visibly different. 8. **Scored and drawn** vs **scored but not drawn** vs **not modelled** — the last two are recorded as gaps (`REVIEW_PACKAGE` §1d, an O-item, and the "not drawn in this image" label), plus assumptions deliberately kept out of the drawing (exact heart outline, bone detail).

Draw a shape audit (shape → what it represents → keep / fix / remove) for any scene you touch; unexplained shapes are bugs.

### 4a. Label-collision measurement (reusable script, S14-0)

`scripts/qa/label-collisions.mjs <exam-id> [--spec scripts/qa/label-states/<exam>.json] [--max-states 200]` — Playwright against a running build (`npm run build && npx next start -p 3100 &`, `npm i --no-save playwright axe-core`, `BASE=http://localhost:3100`). For the exam's practice page it measures, **EN + AR × 390 / 1440 px × guides ON / OFF × every state of the exam's axes**, each scene label box (the text box padded as the pill in `SceneLabel`) and reports labels that overlap another label of the same drawing or leave the drawing's `viewBox` (both in SVG user units), plus the smallest on-screen label size. Exit 1 on any collision, out-of-frame label or if no label was found; the JSON goes to `$OUT` (default `/tmp/rad-lab-qa-labels-<exam>`).

States are the product of the axes: by default every radio group in the positioning section plus rotation at min / 0 / max; a `--spec` JSON names the axes explicitly (`radios`: message paths or `{en, ar}` legends, e.g. an exam's own choice-control legend; `sliders`: label → values, `"min"` / `"max"` allowed — include extremes such as the tube angle). It refuses to run above `--max-states`. **Run it once per scene change, over the full state set; do not rerun it for every small edit.** Add `scripts/qa/label-states/<exam>.json` with the exam. Example: `chest-ap-supine.json` (36 states).

---

## 5. Baseline image sourcing (S12-13 amended by S13c-1)

**Default route (from S14): Claude Code searches Wikimedia Commons itself and shortlists 2–3 candidates per exam; the owner approves one or rejects all.** The owner-supplied route of S12-13 stays valid as an alternative (owner sends canonical file-page URL, author, licence line and original file; Claude Code verifies).

Each shortlisted candidate must be verified and reported with: **canonical file-page URL, author, licence line, date, pixel resolution**, and a one-line fit note. Acceptance criteria — all required:
- Licence **CC0, public domain or CC BY** only. No NC / ND / SA, no fair use, no "free for educational use".
- A **normal** radiograph of the **correct projection and anatomy** for the exam; adequate resolution (derived web copy ≥ ~1000 px on the long side is the Lateral/AP practice).
- No burned-in text, rulers, dates, side markers that contradict the convention, or identifiers; **no devices, tubes, lines, implants; no pathology**.
- Not the PA case person (S12-4); a teaching approximation, never ground truth.

**Procedure:** one retry on HTTP 429, then stop — no mirrors, caches or rate-limit workarounds. A blocked site / captcha = **stop and report**. Then, after approval: download the original, record SHA-1 / SHA-256, strip all metadata (derive script; re-read the output: no EXIF), keep the master under `assets/source/<exam>/` (not served) and the web copy under `public/images/<exam>/`, write the two A-0xx records (fields as A-006 / A-007: name, type, filename, author, source URL, licence + URL, modification/commercial-use, attribution, paths, modifications, verification date/method, checksum, file facts, de-identification evidence, notes), a REGISTER row, and `RadiographAssetSpec` with landmarks "read by eye". A credit line under the result image where attribution is required (or voluntarily).

**Never used:** Radiopaedia, Kenhub, Google Images results, ResearchGate, Kaggle outputs, research-only datasets, book images. **Datasets** only after their terms are read, recorded and the owner approves (extends S12-5). `NIH ChestX-ray14` is **chest-frontal only** and is used under the recorded **secondary** terms (O16: re-verify at the official NIH page); not an option for limbs / abdomen.

**No clean free image for the exam?** Defer that exam (drop it from the batch) or ask the owner to decide: purchase, written permission, or an own-work schematic labelled "schematic — not a patient image" (D5). Never fabricate a diagnostic radiograph; unvalidated result visuals stay labelled placeholders.

---

## 6. Rotation / marker / convention reminders

- **Sign (S11c-1, S12-2, S12-9, S13-6):** the sign of `rotationDeg` is defined by the **result image / detector view**, and it is one thing per exam: PA positive = patient's **left** side toward the receptor (spine shifts to the viewer's right). `planRotationDeg(projection, r)` in `visual-model.ts` must agree: PA `−r`, `lateral-left` `−r`, `ap-erect` `+r`. Lateral: positive = front turned away from the receptor in a left lateral. **AP:** the same *image* sign means the opposite *physical* turn to the PA (S12-2's "same turn in every projection" does not hold for the AP); **O19 is open** (the PA/Lateral exams' plan view for a wrongly chosen AP turns the other way — owner decision pending). Do not touch the plan sign or O19 in an exam session; for a new projection, write the sign down in `DECISIONS.md` first and pin it with a renderer test (a synthetic stripe moves right for +θ, left for −θ).
- **Feedback is magnitude-only** (no direction text) wherever the source gives no direction rule (Lateral S12-3, AP S13-4). ±2° / ±5° are engine teaching choices; label them.
- **Marker:** PA display, patient left = viewer right. The convention lives in `positioning.markerSide` + `markerRule` and is used by both scoring (`evalMarker`) and the renderer (`RenderPlan.marker`); x < 0 is always the viewer's left, never mirrored in RTL. Lateral: anterior on the viewer's left, letter = side nearest the detector (S12-7). Wrong half / wrong letter = critical `wrong-side-marker`; missing = critical `missing-marker`. A new exam's convention is an owner decision (Bontrager p.36: it varies by department); never a silent default.
- **Patient state / instructions:** the learner chooses an instruction, never the defect; inspiration / motion come only from `patientCooperation` (deterministic).
- **Exposure:** low exposure = noise + detail loss, never brightness; excess exposure never darkens; digital brightness is not an exposure indicator.

---

## 7. Batching and test policy

**Batching.** One session may deliver several **similar exams from the same Bontrager chapter**: start with **2**, never more than **4**. One commit and one test file per exam (so one can be reverted alone). Do shared groundwork (new shared registry entries, shared Arabic terms) in its own commit first. **An exam that fails (no clean image, a source gap, a byte-identity break, an unresolved owner question) is dropped from the PR and recorded as an O-item** — it never blocks or half-ships with the others. Mixed modalities or a needed generalisation are never batched with exam work.

**Tests while working:** targeted only — `npx vitest run src/features/exam/<exam>.test.ts` plus the tests of files you touched (`scene-style.test.ts`, `visual-model.test.ts`, `characterisation.test.ts` after any shared-code edit). Per-exam tests (copy the shape of `chest-ap.test.ts`): `validateExam` / `validateCase` empty, weights sum to 100, only S11/S12 mechanisms, a fully correct attempt scores 100 with no critical finding, initial state is not the answer, each critical finding fires, every teaching-choice band labelled as such, rotation magnitude-only (±θ identical) and sign pinned, marker rule, result image deterministic and representative only for the baseline projection, wrong projection critical, EN + AR text complete (no «الكاسيت»).

**Once at the end:** `npm run check` (typecheck + lint + all tests) and `npm run build`; then the exam's audit — `npm run build && npx next start -p 3100 &`, `BASE=http://localhost:3100 node scripts/qa/<exam>-audit.mjs` (Playwright + axe WCAG 2 A/AA, **EN/AR × 1440 / 390**, no horizontal overflow, a correct attempt through the real UI scores 100, a wrong one shows its critical findings). Also run the existing audits/matrix for earlier exams when shared UI code changed. Plus the scene label-collision measurement if a scene was drawn (§4a).

**Shared-UI changes:** run `npx vitest run src/features/qa/scene-dom.test.ts` — the S14-0 guard that the rendered scene and result panel of every earlier exam are hash-identical; a new exam's states are added to it only by extending it, never by regenerating the existing hashes.

**Byte-identity proof (every exam PR):** `git diff main --stat -- scripts/qa/characterisation scripts/qa/golden public/images/<each earlier exam> assets/source/<each earlier exam> src/data/exams/xray/<earlier>* src/data/cases/<earlier>*` is empty; `characterisation.test.ts` passes unchanged. **Never run `npm run qa:characterise` to make something pass.**

---

## 8. Prompt template for Claude Code (one block; fill the `{…}`)

```text
SESSION {N}: {exam list} — exam recipe run. Start from updated main. Branch `{branch}`. Open a DRAFT PR. No subagents, no polling.

Read first: docs/exam-recipe.md (follow it exactly), docs/DECISIONS.md (binding), CLAUDE.md, the reference(s) docs/RAD-LAB_Medical_Reference_{…}.md, docs/sources/BONTRAGER-9.md.
EXAMS (batch, in this order, one commit + one test file each; max {2–4}): {exam ids}
BONTRAGER PAGES (printed pages, paraphrase only): {exam → pages}
IMAGES: {exam → "shortlist 2–3 from Commons for owner approval" | "owner supplies file: …" | "approved: <URL, author, licence>"}
DECISIONS ALREADY MADE: {S-numbers / one-line owner answers: marker convention, tolerances, labels…}
OWNER QUESTIONS (ask me first if a source or rule is missing — do not guess): {list or "none"}
EXTRA CONSTRAINTS: {e.g. scope exclusions, wording}

Rules: recipe §1 checklist in order; S11/S12 mechanisms only; medical values only from cited Bontrager pages or labelled engine teaching choices (provisional: true + REVIEW_PACKAGE row); AR strings DRAFT + ARABIC_TERMINOLOGY; scene per recipe §4; no change to Chest PA / Lateral / AP output (byte-identity proof); never regenerate the characterisation. An exam that cannot be finished cleanly is dropped from the PR and reported.
Tests: targeted while working; once at the end npm run check + npm run build + the exam audits (EN/AR × 1440/390).
STOP AND REPORT (do not work around): the "Always stop and report" list in docs/exam-recipe.md §9, any conflict between this prompt and docs/ADRs/DECISIONS.md, any blocked command, captcha or HTTP block (one 429 retry only), secrets (never print them).
FINAL REPORT (plain text): files changed per exam, DECISIONS / REVIEW_PACKAGE / ARABIC entries added, images shortlisted/used with provenance, byte-identity proof, gaps/ambiguities, what was dropped. Mark the PR ready only after the report.
=== END OF {EXAM-BATCH} PROMPT ===
```

**Advisor pre-session list** (the owner / advisor fills this before the prompt is sent):
- [ ] Exams and their order; confirm they are in the same Bontrager chapter and the reference of each is merged.
- [ ] **Source pages:** printed Bontrager page numbers per exam (positioning, CR, SID, kV, marker, criteria); any other source to read.
- [ ] **Images:** shortlist route or owner-supplied file per exam; any anatomy that is unlikely to have a free image (decide defer / schematic / purchase now).
- [ ] **Owner questions answered:** marker / display convention, side / laterality handling, rotation sign for the projection, required cases (left/right), what is scored but not drawn.
- [ ] Anything out of scope (variants, patient build, devices), and the decision IDs to cite.
- [ ] Arabic reviewer availability (AR stays DRAFT regardless).

---

## 8a. Session prompt skeleton (S-STD-1)

Prompts follow the **Session prompt standard** ([`DECISIONS.md`](DECISIONS.md) **S-STD-1**: change budget, no opportunistic fixes, optional-field rule, effect honesty, test-edit rule, QA by session type, 8-section final report, usage guard). Generic rules (branch, draft PR, no polling, usage, stop conditions) are in `CLAUDE.md` and this recipe and are **not** repeated in prompts. Short skeleton:

```text
SESSION: [ID] — [ONE GOAL]
Follow CLAUDE.md, docs/exam-recipe.md and S-STD-1. Start from updated main (predecessors merged: [..]) else STOP AND REPORT. New branch, DRAFT PR only, no subscribe/poll, never open or share preview URL.
READ ONLY: [reference doc], [DECISIONS sections], [provenance if assets].
OWNER DECISIONS (record first as [IDs]): [..]
SCOPE: [numbered tasks]
ALLOWED SHARED CHANGES: [list]
CHANGE BUDGET: [expected files]
OUT OF SCOPE: [list]
SESSION TYPE: [DOCS | REFACTOR | EXAM] → QA accordingly.
Conflict with repo docs/decisions, unsourced medical value, dishonest effect, or budget overflow → STOP AND REPORT, change nothing.
Final report in the standard 8-section order.
```

---

## 9. Definition of done / Always stop and report

**Definition of done (all):**
- Every §1 checklist item ticked in the PR; `npm run check` + `npm run build` pass; the audit passes EN/AR × 1440/390 (no axe violations, no overflow).
- Byte-identity proof for PA, Lateral, AP (and every later exam) empty/green; characterisation untouched.
- No clinical value without a cited page or a "teaching choice / provisional" label in the UI text **and** `REVIEW_PACKAGE.md`; weights sum to 100; evidence class on every rule.
- Provenance records, REGISTER rows, derive script, stripped metadata, credit line; licence of every asset clear.
- EN/AR keys in sync; AR draft listed in `ARABIC_TERMINOLOGY.md`; RTL checked; scene colours/labels per §4, contrast test green.
- `DECISIONS.md` entries (new only), O-items for every gap, `docs/session-N-*.md`, CLAUDE.md bullet, roadmap line. Draft PR, final report delivered, only then ready.

**Always stop and report (never work around):**
- A medical value, tolerance or scoring weight would change **unexpectedly**, or a rule has no source and no owner decision.
- **Byte-identity breaks** for PA, Lateral or AP (any characterisation / golden / existing-exam file diff, or an existing test that must change beyond the §3B registry list).
- The exam needs an engine mechanism outside §2 (new `ProjectionId`, anatomy effect, settings shape, console control, scene family) → propose a generalisation session instead.
- **Licence unclear** (not CC0 / public domain / CC BY, terms unreadable, identifiers / devices / pathology in the image, only a secondary source).
- A site is **blocked** (HTTP 403/429 after the one allowed retry, captcha, Cloudflare), a command is denied, or a secret would be printed.
- Any conflict between the prompt and `DECISIONS.md` / ADRs / CLAUDE.md; a source conflict with Bontrager; an open O-item (O14, O16, O19…) that the exam would silently depend on.
- A recurring dependency would be added; anything in `src/`, `messages/`, data or goldens is touched in a **docs-only** session.

---

## 10. Known gaps in this recipe

**Closed by S14-0** (byte-identical; [`session-14-limbs-generalisation.md`](session-14-limbs-generalisation.md)): scene / result-image code is registry-driven (`SceneLayout`, `DetectorFigure`, projection registry) rather than flags and branches; `ProjectionId` / `WordingNs` are open; the label-collision measurement is a committed script (§4a); the S12-12 order note is in `ROADMAP_SESSIONS.md`.

**Still open:**
- What a limb exam must still add (its effects with their pixel steps and landmark groups, scene art and the second view, projection / scene / body-part registrations, console labels): `session-14-limbs-generalisation.md` §4 and §6.3. Each is generalised only against a merged limb reference (S10-2).
- **Closed by S14.1b** (byte-identical): G1–G5 and G9 (optional chest-only fields, open `SceneId` / `bodyPart`, optional lung landmarks and AEC) and the G6 effect hook; G10 verified (no new variant id). `CATEGORIES` is the core six with per-exam keys (S11). `validateExam(exam, registries?)` takes the registries as an optional argument so a test can validate a synthetic exam without touching production data.
- Typing note: `ExamDefinition<T>` / `RadCase<T>` are generic over the technique profile only so that the chest exams keep `technique.aec` required for the code and tests that name them; platform code takes `AnyExamDefinition` / `RadCase`. When the first limb exam is added to `EXAMS` / `CASES`, those arrays become the broad type and the few chest tests that read `…technique.aec` through them need a narrowing (S14.1c).
- `planRotationDeg` (plan-view sign, O19) still switches on `"ap-erect"`; a new projection that needs a plan view must decide its sign first (§6).
- No documented procedure yet for a *credits page* (O18) or for the SID / position image label (S10b-22, O18).
- The label script found, on the unchanged AP scene, an Arabic-only overlap at tube angle +15° with guides ON (O20, `DECISIONS.md`).

**Found by the wrist pilot (S14.1a, 2026-10-07; `DECISIONS.md` S14.1-1 … S14.1-6; reference `RAD-LAB_Medical_Reference_Wrist.md` §9):**
- **The recipe does not say the order of a first non-chest exam: reference → byte-identical generalisation → exams.** A limb exam cannot be one session even with a reference; the §9 "stop and report" list is the rule that forced the split. Add this to §8 "Advisor pre-session list": *check §2 against the reference's Needs before sending an exam prompt.*
- **Open vocabularies are already open.** `CriticalFindingId` and `EffectId` are open strings (a detector / concept + magnitude record + pipeline step registers them); §2 "Hard-wired" and the S14-0 doc §3 still call them closed. The real chest-shaped requirements for a limb: `chinPosition` / `shoulderPosition` in `SimulationSettings` and the compose / `validateCase` path (G1), `availableBreathing` / `inspirationResponse` and the always-rendered breathing control (G2), the closed `SCENE_IDS` list (G3), `bodyPart: "chest"` in `domain/exam.ts`, `domain/case.ts`, `compose.ts` (G4), required `lungApexV` / `diaphragmDomeV` on `RadiographAssetSpec` and the lung / spine assumptions in `pipeline.ts` (G5), the technique profile's chest `aec` shape (G9). Adding a limb *effect* (the wrist rotation criteria) is new renderer behaviour, not a data entry (G6).
- **Weights rule is incomplete:** "weights = the PA weights" has no answer for an exam without a PA category (a wrist has no breathing). The reference must state the weight decision (O22) before the exam session.
- **Marker convention for a single limb** is not covered by §6 (viewer-half rules assume a trunk): decide O21 in the reference.
- **Image shortlist can be blocked** (Commons API HTTP 429 twice in S14.1a). §5 says "stop and report" but not whether the rest of a docs session proceeds; the wrist session completed the docs and recorded the shortlist as outstanding (O25). Add a fallback: the shortlist may be done in a short docs-only follow-up, and the exam session starts only with an owner-approved image.
- **The prompt template (§8) has no slot for "reference merged?"** and no slot for the per-exam category list when categories differ from the PA six.
- Template `EXAM_REFERENCE_TEMPLATE.md` §8.1 is chest-worded ("PA today"); for a limb the Needs rows were written against the engine's *settings fields* instead — the wrist reference's §8–§9 (gap ids G1…G10, proposed change, owning session, byte-identity proof) is a usable pattern for the next modality.

**Found by the wrist exams (S14.1c, 2026-10-07):**
- **A single-limb marker rule is not in §2:** the S11 kinds always check the viewer half. S14.1c added `markerRule: fixed-side` (letter only). Add it to §2 and to the §6 marker reminder; a right-wrist case needs the side on the case (O29).
- **The detector view's "Head / Feet" labels are chest-only:** a limb declares `DetectorFigure.axis`. `positioning.markerHint` is chest-worded: a limb scene sets `SceneTexts.markerHint`.
- **Hard-wired list update (§2):** a limb's rotation is an `EffectDefinition` with `limb` + a pixel step + a landmark group (`limbRotation`); the core chest rotation effect is skipped for such an asset.
- **Required anatomy can be limited by the baseline image** (the wrist images stop at the proximal metacarpals): decide before data whether the exam's region follows Bontrager or the image (S14.1c-7, O28).
- **The scene-dom guard is per exam family:** add a separate wrist file (`scene-dom-wrist.test.ts`) rather than editing the chest hashes; the wrist hashes are the new guard from the day they exist.
- **Label script limits:** it varies only the axes named in `label-states/<exam>.json` (rotation here); a side view whose labels follow the ray, SID or projection needs those axes added (not done).
- **`ExamDefinition<T>` widening needed no chest-test narrowing** in practice (platform code takes `AnyExamDefinition`).
- Audit script for a limb: `scripts/qa/wrist-audit.mjs <exam-id>` (adapted from `ap-audit.mjs`; mAs station index and the male patient's instruction wording are exam-specific).
