# Exam recipe — adding one X-ray exam to RAD-LAB

Read [AGENTS](../AGENTS.md) for the shared workflow and [the relevant ENGINE_GUIDE sections](ENGINE_GUIDE.md) for domain constraints. This recipe is an operational checklist for an authorised exam session, not a session log. Clinical authority, source evidence and per-exam choices are linked from [DECISIONS](DECISIONS.md), [REVIEW_PACKAGE](REVIEW_PACKAGE.md) and [source register](sources/REGISTER.md).

**Scope:** the current registry-driven chest/limb/pelvis/shoulder engine. **New exams/images are frozen (S-SHOULDER-Y-6); this is guidance for a separately authorised future exam session, not permission to resume it.** Use existing optional mechanisms (§2). If an exam needs something the engine does not have (see §2 "Remaining bespoke needs"), that is **not** an exam session: stop, list the need, and propose a separate, byte-identical generalisation session (reference first, rule of three — S10-2, S7-4).

---

## 1. Checklist per exam (in this order; tick each in the PR description)

0. **Reference first (S10-2).** The exam's reference (`docs/RAD-LAB_Medical_Reference_<Exam>.md`, from `templates/EXAM_REFERENCE_TEMPLATE.md`) is merged to main with a completed Needs section. No reference → no implementation.
1. **Source notes.** Governing authority is `BONTRAGER-9`, cited **by printed page** (S10b-25); on conflict Bontrager wins; where silent use EC16260 → ACR → WHO-TECH → WHO-CHEST, then an owner decision. Paraphrase only, short quotes at most, no text/figures reused, no third-party student notes, no Radiopaedia (S10-3). Add claims with locators to `docs/sources/BONTRAGER-9.md` (and the register row if a new source). Abstract-only sources are never the sole support for a value, rule, critical finding or convention.
2. **Label every value (before writing data).** For each number / rule, decide one of: *Bontrager value* (page cited) · *engine teaching choice* (e.g. partial kV bands, SID upper limit, rotation ±2°/±5°, tube-angle bands) · *provisional owner decision*. Teaching choices must be **named as such in the user-visible feedback text and in `REVIEW_PACKAGE.md`** (S12-1). Every medical rule carries one of the five `EVIDENCE_CLASSES`; everything clinical is `provisional: true` with a TODO until the O5 review. Never invent a numeric EI/EIT or a universal DI limit; no numeric mAs target (S10b-9).
3. **Owner decisions needed** (marker convention, image, anything the sources don't settle) are listed as questions up front; a decision is recorded in `DECISIONS.md` **before** the code relies on it.
4. **Exam / case / technique data** (files in §3). Categories and weights are an explicit per-exam decision and sum to100; do not assign PA breathing/category weights to a limb (S14.1b-1/O22); initial state is deliberately *not* the answer; the case text says the baseline is a different person (S12-4).
5. **Controls through existing optional mechanisms only** — see the table in §2. No new engine mechanism in an exam session.
6. **Baseline image + provenance** — §5. Records A-0xx (master) + A-0xx+1 (derived web copy) in `ASSET_PROVENANCE_AND_LICENSES.md`, a row in `sources/REGISTER.md` ("Image assets"), a derive script, a landmarks spec file.
7. **Scene** — registered scene id + drawing per §4. Scored cues are drawn; what is scored but not drawn is recorded as a gap and labelled "not drawn in this image".
8. **EN + AR strings.** All UI text in `messages/en.json` + `messages/ar.json` (keys in sync); case/exam text as `LocalizedText` with both locales; logical CSS; numbers/units `dir="ltr"`. **Every new Arabic string is DRAFT, machine-assisted**: add a dated section "Session N — <exam> strings added to the UI (DRAFT, pending owner / educator review)" to `ARABIC_TERMINOLOGY.md` listing each term. Use «الكاشف» for the detector (never «الكاسيت»).
9. **`REVIEW_PACKAGE.md`**: a new "Session N additions" subsection, one row per provisional item (ID, item, source/basis, question for the reviewer, who). No clinical value may exist that is not either cited or listed here.
10. **`DECISIONS.md`**: one entry per decision (S{N}-k) + open items (O-numbers) for gaps; never edit existing entries — supersede with a new one.
11. **Tests** (§7) incl. the byte-identity proof for every earlier exam.
12. **Audits**: `scripts/qa/<exam>-audit.mjs` + `<exam>-labels.json` (Playwright + axe), run once at the end (§7).
13. **Docs + PR**: `docs/session-N-<exam>.md` (built / rules / proof of byte-identity / QA / not done), update current status/handoff and roadmap where changed; update CLAUDE.md only if a standing rule changes, never append session history. Open a **Draft PR only**; the owner reviews/merges manually.

---

## 2. S11 generic mechanisms (what an exam may use)

Details and proof: [`docs/archive/sessions/session-11-generalisation.md`](archive/sessions/session-11-generalisation.md). The table includes later merged limb mechanisms; Chest PA keeps its original declarations/output. Optional additions are absent unless declared. Ask first: *can this be said as data?*

| Need | Mechanism (data on `ExamDefinition` / `CaseDefinition`) | Used by |
|---|---|---|
| Marker letter / side rule | `positioning.markerRule` kinds (`features/simulation/marker-rule.ts`): `anatomical-side`, `detector-side`, `fixed-side` (letter only, no viewer-half check); display/default position `markerSide`, optional bone exclusion `markerKeepOut` (absent = whole required-anatomy box). Weight and critical findings are separately declared per exam | Lateral, AP, limbs, pelvis, Grashey |
| Tube angulation | `controls.tubeAngulationDeg` (+ = caudad, absent = 0°) + range rule | AP, knee/foot; feedback and tilted-tube scene only where no honest image effect exists |
| Extra enum controls | `choiceControls` (e.g. `side`, `arms`, `state`), validated EN+AR; button text by position via `ChoiceControlSpec.projectionLabels` (S13-7) | Lateral, AP |
| Scoring categories | per-exam keys of `categoryWeights` (collimation is scored under `positioning`) | all |
| Critical findings | id in `CriticalFindingId` + detector in `CRITICAL_DETECTORS` (`features/evaluation/critical.ts`) | Lateral `arms-over-lungs` |
| Scene | `SCENE_IDS` (`domain/exam.ts`; `SceneId` is an open string since S14.1b) + `SCENES` registry (`features/positioning/scenes.tsx`); a scene on the shared positioning view is a `SceneLayout` (`scene-layouts.tsx`: detector figure from `detector-figures.tsx`, second view, cues (optional since S14.1b: a limb scene declares none), texts) — S14-0 | all |
| Optional landmark groups | on the asset spec (e.g. no scapula group → "not drawn") | AP |
| Attenuation | `attenuationByProjection` (fallback 1 = PA reference, not measured) | Lateral 2× (provisional) |
| Baseline projection | `RadiographAssetSpec.projection?` (absent = PA); `midlineU` or the lateral separation fallback | Lateral, AP |
| Optional chest-only fields (S14.1b) | `chinPosition` / `shoulderPosition` / `breathing` in the initial settings, `availableBreathing`, `patientCooperation.inspirationResponse`, `radiograph.lungApexV` / `diaphragmDomeV`, `technique.aec` are all optional: a limb exam omits them (no cue panel, no breathing control / rule / category, no inspiration warp, manual-only technique). `validateExam` / `validateCase` check them exactly when declared | chest exams declare all |
| Body part | `BODY_PART_IDS` in `src/data/modalities.ts` (`BodyPartId` open; `validateExam` checks it) — S14.1b | chest, upper/lower limbs, pelvis, shoulder |
| Effect hook (S14.1b) | `EXTRA_EFFECTS` / `EffectDefinition` in `features/radiograph/plan.ts`: concept + magnitude + drivers + a pure `active` predicate; registered effects supply optional `limb` / `conceptOf`, `RadiographAssetSpec.limbRotation` and existing pixel steps. `limb-warp`, `limb-layers`, `limb-copies` take displacement from the registered model (S14.4); the core chest rotation effect is skipped when `limbRotation` is declared; a matching new model/concept is not a new pixel algorithm | wrist/hand/elbow/lower limbs, pelvis/Grashey via existing warp |
| Projection | `PROJECTIONS` registry (`src/data/projections.ts`; `ProjectionId` is an open string, `validateExam` checks it) — S14-0 | all |
| Result wording | `radiograph.<ns>.*`, the namespace declared on the projection in `PROJECTIONS`, read by `wordingNsOf`; falls back to common wording | Lateral, AP |
| Limb display | `DetectorFigure.axis`, `SceneTexts.markerHint` / `rotationLabel`; optional `render.pxPerCm` / `viewMarginCm` control resolution and viewport, never scoring | family-specific axis/hint labels; configured limb resolution |
| Model sharing | One family 2.5D model drives scene and result displacements; explicit one-image limits, no hidden anatomy synthesis. See family decisions and REVIEW_PACKAGE | hand, elbow, wrist, lower limbs, pelvis, shoulder |
| Validation/types | `validateExam(exam, registries?)` supports synthetic registries. `ExamDefinition<T>` / `RadCase<T>` parameterise technique; platform uses broad `AnyExamDefinition` / `RadCase`. Do not require AEC on manual-only definitions | chest retains its AEC typing; limb registration needed no chest-test narrowing |

**Remaining bespoke needs (rule of three):** each exam still needs honest scene art/second view, model/landmark/concept data, projection/scene/body-part registrations and console labels. Chest-specific pixel algorithms/landmarks and message keys are not a generic anatomy engine; an enum/range is data, a new control shape or pixel algorithm is a mechanism. Check the merged reference's Needs against this table **before** scheduling: reference → separate byte-identical generalisation **if needed** → exams. Existing limb/model shapes are reusable; no blanket requirement to repeat limb generalisation already merged (S14.1b). Sources: archived limb generalisation §4/§6.3 and S14.1c/S14.4.

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
| Registry-list test | `src/features/exam/generalisation.test.ts` | only explicitly permitted registry-list extensions; all other existing-test edits follow S-STD-1 (type-only unless separately approved). S-STD-2 exceptions do not grant a general semantic-edit allowance |
| Wording namespace (if its result wording differs) | `wordingNs` on the projection's entry in `src/data/projections.ts` + `messages/*.json` `radiograph.<ns>.*` | AP added `ap`; no code edit (S14-0) |

Routing needs **no edit**: `/{locale}/{modality}/{exam}[/practice]` comes from `EXAMS` + `CASE_DEFINITIONS` through `features/platform/resolve.ts` (ADR-0011); no per-exam page. `src/data/modalities.ts` and `public/_redirects` were not touched by Lateral or AP.

**C. Bespoke code that Lateral / AP still needed (a gap the recipe cannot remove — keep it minimal and optional, absent = old output):**
- Scene drawing: the figure / second view / cues components themselves (`LateralFigure.tsx` / `ApSupineView.tsx` / `FrontalFigure.tsx` pattern), registered as a `DetectorFigure` + `SceneLayout` (S14-0: no flags or branches in `PositioningView`, `DetectorWorkspace`, `PatientCues`).
- Result image: the wording namespace comes from the projection registry (S14-0); no branch in `ResultImage.tsx`, `ResultPanel.tsx`, `RadiographEffects.tsx`. Lateral also `plan.ts`, `pipeline.ts`, `tuning.ts` (rotation drawn as doubled posterior wall) and `domain/radiograph.ts` (`projection?`).
- Each such addition: every visual magnitude in `features/radiograph/tuning.ts` as an EDUCATIONAL approximation; no pixel read-back; no randomness.

**D. Docs for an authorised exam PR:** `DECISIONS.md`, `REVIEW_PACKAGE.md`, `ARABIC_TERMINOLOGY.md`, `ASSET_PROVENANCE_AND_LICENSES.md`, `sources/REGISTER.md` (+ `sources/<id>.md` for new claims), `HANDOFF.md`, `project-status.md`, `ROADMAP_SESSIONS.md` (one "Delivered" line). `messages/en.json` + `messages/ar.json` always together.

---

## 4. Scene design

Use [scene design and bilingual constraints](ENGINE_GUIDE.md#scene-design-and-bilingual-ui): tokens, colour/contrast, LTR anatomy, text alternatives and input semantics. They are maintained there, not copied here. The [original shape audit](archive/sessions/session-13b-scene-design.md) is an example when drawing a new family.

**Anatomical checklist pattern** (the Lateral figure's list, S13b-2 — write one per new figure and verify it on screenshots EN + AR, 390 px, guides ON/OFF, every choice state):
1. Orientation and direction labels. 2. Landmark lines that mark the field (sternum, spine, …) in the right place. 3. Joints / girdles the exam scores or must stay clear of. 4. Organs and the structures the beam / rules refer to, labelled if non-obvious. 5. Figure meets the detector edge, no overrun. 6. Proportions (head ≈ 0.3 chest depth, tapered limbs, no extra circles). 7. Each choice state (raised/lowered, supine/semi-erect…) visibly different. 8. **Scored and drawn** vs **scored but not drawn** vs **not modelled** — the last two are recorded as gaps (`REVIEW_PACKAGE` §1d, an O-item, and the "not drawn in this image" label), plus assumptions deliberately kept out of the drawing (exact heart outline, bone detail).

**Limb details:** clip drawing to detector; soft tissue darker than bones; use family axes (e.g. fingers/forearm), not chest Head/Feet defaults. Required anatomy can only cover what the baseline honestly shows; decide and record any Bontrager coverage gap before data (O28/O61/O77). Keep scene/model geometry estimates and undrawn criteria in REVIEW_PACKAGE.

Draw a shape audit (shape → what it represents → keep / fix / remove) for any scene you touch; unexplained shapes are bugs.

### 4a. Label-collision measurement (reusable script, S14-0)

`scripts/qa/label-collisions.mjs <exam-id> [--spec scripts/qa/label-states/<exam>.json] [--max-states 200]` — Playwright against a running build (`npm run build && npx next start -p 3100 &`, `npm i --no-save playwright axe-core`, `BASE=http://localhost:3100`). For the exam's practice page it measures, **EN + AR × 390 / 1440 px × guides ON / OFF × every state of the exam's axes**, each scene label box (the text box padded as the pill in `SceneLabel`) and reports labels that overlap another label of the same drawing or leave the drawing's `viewBox` (both in SVG user units), plus the smallest on-screen label size. Exit 1 on any collision, out-of-frame label or if no label was found; the JSON goes to `$OUT` (default `/tmp/rad-lab-qa-labels-<exam>`).

States are the product of the axes: by default every radio group in the positioning section plus rotation at min / 0 / max; a `--spec` JSON names the axes explicitly (`radios`: message paths or `{en, ar}` legends, e.g. an exam's own choice-control legend; `sliders`: label → values, `"min"` / `"max"` allowed — include extremes such as the tube angle). It refuses to run above `--max-states`. It tests **only axes named in the spec**; moving side-view labels require ray/centring, SID, projection and tube-angle axes as relevant, not rotation alone. A passing limited-state audit is not proof for omitted axes. Known AP Arabic overlap at +15° guides ON (O20) remains recorded; this docs session does not close it. **Run it once per scene change, over the full state set; do not rerun it for every small edit.** Add `scripts/qa/label-states/<exam>.json` with the exam. Example: `chest-ap-supine.json` (36 states).

---

## 5. Baseline image sourcing (S12-13 amended by S13c-1)

**Default route (from S14): Claude Code searches Wikimedia Commons itself and shortlists 2–3 candidates per exam; the owner approves one or rejects all.** The owner-supplied route of S12-13 stays valid as an alternative (owner sends canonical file-page URL, author, licence line and original file; Claude Code verifies).

Each shortlisted candidate must be verified and reported with: **canonical file-page URL, author, licence line, date, pixel resolution**, and a one-line fit note. Acceptance criteria — all required:
- Licence **CC0, public domain or CC BY** only. No NC / ND / SA, no fair use, no "free for educational use".
- A **normal** radiograph of the **correct projection and anatomy** for the exam; adequate resolution (derived web copy ≥ ~1000 px on the long side is the Lateral/AP practice).
- No burned-in text, rulers, dates, side markers that contradict the convention, or identifiers; **no devices, tubes, lines, implants; no pathology**.
- Not the PA case person (S12-4); a teaching approximation, never ground truth.

**Procedure:** one retry on HTTP 429, then stop — no mirrors, caches or rate-limit workarounds. A blocked site / captcha = **stop and report**. In a docs session, record the blocked shortlist and continue independent documentation only; use a short docs follow-up or owner-supplied verification route explicitly approved for that asset. An implementation starts only with an approved image, never an assumed licence. Then, after approval: download the original, record SHA-1 / SHA-256, strip all metadata (derive script; re-read the output: no EXIF), keep the master under `assets/source/<exam>/` (not served) and the web copy under `public/images/<exam>/`, write the two A-0xx records (fields as A-006 / A-007: name, type, filename, author, source URL, licence + URL, modification/commercial-use, attribution, paths, modifications, verification date/method, checksum, file facts, de-identification evidence, notes), a REGISTER row, and `RadiographAssetSpec` with landmarks "read by eye". A credit line under the result image where attribution is required (or voluntarily). Inspect the outer30px for ringing/frame lines as well as text/EXIF; use the least-invasive documented fill or bottom/right crop. Top/left crops shift coordinates and need corresponding landmark updates; never crop silently. Existing owner-verified/secondary-source exceptions keep their precise labels and outstanding review limits (asset register/O100/O101).

**Never used:** Radiopaedia, Kenhub, Google Images results, ResearchGate, Kaggle outputs, research-only datasets, book images. **Datasets** only after their terms are read, recorded and the owner approves (extends S12-5). `NIH ChestX-ray14` is **chest-frontal only** and is used under the recorded **secondary** terms (O16: re-verify at the official NIH page); not an option for limbs / abdomen.

**No clean free image for the exam?** Defer that exam (drop it from the batch) or ask the owner to decide: purchase, written permission, or an own-work schematic labelled "schematic — not a patient image" (D5). Never fabricate a diagnostic radiograph; unvalidated result visuals stay labelled placeholders.

---

## 6. Rotation / marker / convention reminders

- **Sign (S11c-1, S12-2, S12-9, S13-6):** the sign of `rotationDeg` is defined by the **result image / detector view**, and it is one thing per exam: PA positive = patient's **left** side toward the receptor (spine shifts to the viewer's right). `planRotationDeg(projection, r)` in `visual-model.ts` must agree: PA `−r`, `lateral-left` `−r`, `ap-erect` `+r`. Lateral: positive = front turned away from the receptor in a left lateral. **AP:** the same *image* sign means the opposite *physical* turn to the PA (S12-2's "same turn in every projection" does not hold for the AP); **O19 is open** (the PA/Lateral exams' plan view for a wrongly chosen AP turns the other way — owner decision pending). Do not touch the plan sign or O19 in an exam session; for a new projection, write the sign down in `DECISIONS.md` first and pin it with a renderer test (a synthetic stripe moves right for +θ, left for −θ).
- **Feedback is magnitude-only** (no direction text) wherever the source gives no direction rule (Lateral S12-3, AP S13-4). ±2° / ±5° are engine teaching choices; label them.
- **Marker:** PA patient left = viewer right; x<0 is viewer left and never RTL-mirrored. Lateral anterior is viewer left; letter = nearest detector side (S12-7). `anatomical-side`/`detector-side` use their declared half rule; `fixed-side` judges the letter alone. Presence, inside-field and anatomy-exclusion checks still apply. Side lives in `markerRule.side` for existing one-side exams, **not a new field**; right/left cases on the same exam are the future case-side need O29. Numeric weight is separate: Chest PA check stays0, other exams may be weighted; missing/wrong critical gates follow the exam's declared list, not a universal default. New conventions require an owner decision (Bontrager p.36). Scene and renderer share the convention.
- **Absolute-angle controls:** foot oblique internal model value = console angle−40°; Grashey uses a35°–45° equal-credit plateau with unchanged baseline, no40° optimum, one joint-closure cue outside it. Reusing a warp never licenses hidden anatomy reconstruction or an arm image effect (S-SHOULDER-2/3).

- **Patient state / instructions:** the learner chooses an instruction, never the defect; inspiration / motion come only from `patientCooperation` (deterministic).
- **Exposure:** low exposure = noise + detail loss, never brightness; excess exposure never darkens; digital brightness is not an exposure indicator.

---

## 7. Batching and test policy

**Batching.** One session may deliver several **similar exams from the same Bontrager chapter**: start with **2**, never more than **4**. One commit and one test file per exam (so one can be reverted alone). Do shared groundwork (new shared registry entries, shared Arabic terms) in its own commit first. **An exam that fails (no clean image, a source gap, a byte-identity break, an unresolved owner question) is dropped from the PR and recorded as an O-item** — it never blocks or half-ships with the others. Mixed modalities or a needed generalisation are never batched with exam work.

**Tests while working:** targeted only — `npx vitest run src/features/exam/<exam>.test.ts` plus the tests of files you touched (`scene-style.test.ts`, `visual-model.test.ts`, `characterisation.test.ts` after any shared-code edit). Per-exam tests (copy the shape of `chest-ap.test.ts`): `validateExam` / `validateCase` empty, weights sum to 100, only merged optional mechanisms, a fully correct attempt scores 100 with no critical finding, initial state is not the answer, each critical finding fires, every teaching-choice band labelled as such, rotation magnitude-only (±θ identical) and sign pinned, marker rule, result image deterministic and representative only for the baseline projection, critical list matches the per-exam decision (limbs do not automatically gain a wrong-projection/motion critical), EN + AR text complete (no «الكاسيت»).

**Once at the end:** `npm run check` (typecheck + lint + all tests) and `npm run build`; then the exam's audit — `npm run build && npx next start -p 3100 &`, `BASE=http://localhost:3100 node scripts/qa/<exam>-audit.mjs` (Playwright + axe WCAG 2 A/AA, **EN/AR × 1440 / 390**, no horizontal overflow, a correct attempt through the real UI scores 100, a wrong one shows its critical findings). Also run the existing audits/matrix for earlier exams when shared UI code changed. Plus the scene label-collision measurement if a scene was drawn (§4a).

**Shared-UI changes:** run `npx vitest run src/features/qa/scene-dom.test.ts` — the S14-0 guard that the rendered scene and result panel of every earlier exam are hash-identical; add a new family guard/hash file for that family only (wrist/hand/elbow/lower-limb/ankle precedents), never regenerate chest/earlier hashes. Family guards render only their own projections. Adapt audit scripts to actual controls/mAs stations/patient wording; do not blindly copy the chest audit.

**Byte-identity proof (every exam PR):** `git diff main --stat -- scripts/qa/characterisation scripts/qa/golden public/images/<each earlier exam> assets/source/<each earlier exam> src/data/exams/xray/<earlier>* src/data/cases/<earlier>*` is empty; `characterisation.test.ts` passes unchanged. **Never run `npm run qa:characterise` to make something pass.**

---

## 8. Prompt template for Claude Code (one block; fill the `{…}`)

Use the single short S-STD-1 skeleton in §8a. Fill exam order, **reference merged?**, printed Bontrager pages, owner-approved image/provenance route, per-exam categories/weights, marker/rotation decisions and gaps in its scope/read/decision fields. No implementation while S-SHOULDER-Y-6 or the owner postponement applies.

**Advisor pre-session list** (the owner / advisor fills this before the prompt is sent):
- [ ] Compare the merged reference Needs against §2; separate genuine new mechanisms into byte-identical generalisation first.
- [ ] Exams and their order; confirm they are in the same Bontrager chapter and the reference of each is merged.
- [ ] **Source pages:** printed Bontrager page numbers per exam (positioning, CR, SID, kV, marker, criteria); any other source to read.
- [ ] **Images:** shortlist route or owner-supplied file per exam; any anatomy that is unlikely to have a free image (decide defer / schematic / purchase now).
- [ ] **Owner questions answered:** marker / display convention, side / laterality handling, rotation sign for the projection, required cases (left/right), what is scored but not drawn.
- [ ] Anything out of scope (variants, patient build, devices), and the decision IDs to cite.
- [ ] Arabic reviewer availability (AR stays DRAFT regardless).

---

## 8a. Session prompt skeleton (S-STD-1)

Generic workflow, QA/delivery and stop conditions are in [AGENTS](../AGENTS.md). Fill only task-specific information:

```text
SESSION: [ID] — [one goal / session type]
BASE / PREDECESSORS: [verified commit / merged references]
READ FOR THIS TASK: [reference + relevant current decisions/guide sections]
SCOPE / EXCLUSIONS: [what changes, existing mechanisms, honest effects/limits]
OWNER DECISIONS: [existing IDs; unresolved questions without guessed answers]
FILES / SHARED BUDGET: [exact list]
SCALE CHECK: [specific ceiling and avoidance]
VERIFICATION: [task-specific checks in addition to AGENTS]
```

---

## 9. Definition of done / Always stop and report

Follow [AGENTS implement/verify and delivery](../AGENTS.md#implement-and-verify) and §7 for QA. Before an exam PR, verify: checklist §1 complete; prior exams' behaviour/hashes protected; source/provisional/teaching-choice labels and REVIEW_PACKAGE accurate; provenance/derivation/credits complete; EN/AR/RTL and family scene/label audits complete; current status/handoff reflect evidence, not plans.

Exam-specific stop gates: no merged reference/approved image; a mechanism outside §2; an unresolved source/convention/O-item the exam silently relies on; unapproved prior-output or test-semantic change; unclear commercial licence or dishonest effect. Record the gap and defer the exam; do not invent data or expand the scope. Never regenerate old guards to pass. New exams/images remain frozen until explicitly resumed.

---

<a id="10-known-gaps-in-this-recipe"></a>
## 10. Gap navigation (compatibility)

The former chronological gap list is distributed into §2 mechanisms/Needs, §4/§4a scene/axis limits, §5 sourcing, §6 conventions, §7 guards and §8 readiness. This anchor remains for old references; it does not add mechanisms or close open items. The [initial archive-stage report](DOCS_ARCHIVE_2_REPORT.md#قاعدة-وفجوة-إلى-موضعها-الجديد) maps every former bullet to its new home or explicit closed evidence.

Remaining cross-exam concerns: O19 plan-view sign (§6), O20 AP Arabic label collision (§4a), O29 case-level side (§6), baseline coverage/one-image limits (§4/§5), and incomplete label-state axes (§4a). **O18 is mixed:** credits exist after RAD-045, but the original SID/position-label, landscape/build and manual-enforcement requests cannot all be declared done by that delivery; see [DECISIONS](DECISIONS.md) and the current status before acting. Registry optionality, fixed-side, generic limb steps and render resolution are implemented, not new open gaps (§2).
