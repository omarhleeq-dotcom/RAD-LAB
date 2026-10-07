# RAD-LAB — Medical Reference: Wrist PA and Wrist Lateral (adult, seated at the table, digital radiography)

**Purpose:** the reference for the first non-chest X-ray exams — two **separate exams**, `wrist-pa` and `wrist-lateral` (S14.1-2) — written *before* any code (S10-2 "Reference first"). It also records, from the real code, what the wrist needs that the engine does not have yet (§8–§9), as the input of the generalisation session S14.1b.
**Scope:** adult, seated at the end of the table, wrist PA and wrist lateral (thumb-up), digital radiography, non-grid. **Oblique wrist is out of v1.** Other joints, paediatric, casts / splints / devices and pathology are out of scope.
**Use:** content reference for a later exam session; **nothing in this file is implemented**. No code, data, projection registration, test or image file was added by the session that wrote it (S14.1a, docs only).
**Status:** DRAFT. Every clinical value is provisional until the O5 educator / physicist review (not a gate, S10b-20). Template: [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md). Decisions: `DECISIONS.md` S14.1-1 … S14.1-6, O21 … O26.

## 0. Honest summary of the evidence
- **One source for all positioning and technique facts: `BONTRAGER-9`** (9th ed., printed **p.156** PA wrist, **p.158** lateral wrist), the governing authority (S10b-25). The claims were read **by the owner's advisor** from the owner's copy and handed over in the S14.1 prompt; Claude Code did not read the book and did not re-verify the claims (same status as every other BONTRAGER-9 claim in the register). PDF page = printed page + 20 (a locator note, not a claim).
- Bontrager is **silent** on: mAs, AEC for the wrist, any numeric rotation tolerance, any kV band outside the stated ±5, any SID upper bound, the viewer-side display of a single-limb marker, any numeric collimation margin in cm. These are **teaching choices or owner decisions** (§3–§5), never written as medical facts. No second source was read for the wrist (EC16260, ACR, WHO-TECH were not read for limbs): **no rule here is supported by a supporting source**.
- **No wrist image has been verified.** The Wikimedia Commons shortlist (S13c-1 procedure) was attempted and **blocked: HTTP 429 on the first request and on the single allowed retry** (§8.8, O25). Nothing was downloaded; no image is chosen.
- Rule families with no source: AEC / mAs, rotation tolerance numbers, SID upper bound, partial kV bands, marker display on a single limb → all labelled in §3–§5.

## 1. Sources
Source rules: as the template (authoritative only; textbooks cited by printed page, paraphrased, no text or figures reused; Radiopaedia excluded; third-party student notes never cited).

### 1.1 Sources read
| # | Citation | Access status | What it supports (and only this) | May it be the *sole* support for a value / rule / critical finding / convention? |
|---|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager's Textbook of Radiographic Positioning and Related Anatomy*, 9th ed., Elsevier, 2018 — **printed p.156 (PA wrist), p.158 (lateral wrist)**; general marker / identification rules p.32–33, 36 already recorded in [`sources/BONTRAGER-9.md`](sources/BONTRAGER-9.md) | read by the owner's advisor; claims supplied by the owner; **not re-verified by Claude Code** | Wrist positioning, central ray, SID, receptor, collimation, digital kV, true-PA / true-lateral criteria (§3, §4, §6) | **Yes — it governs** (S10b-25), but every clinical value stays provisional (O5). |

### 1.2 Sources not read
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| A supporting source for limb technique (EC16260 has no limb section recorded; ACR general / digital radiography parameters; WHO-TECH limb chapters) | mAs / AEC for the wrist, exposure-index practice, a second opinion on kV and SID | not obtained for limbs | O26 (educator may supply) |
| Bontrager's oblique wrist (p.157) | the oblique projection | out of v1 | — |

### 1.3 Leads
None recorded.

## 2. Classification
Evidence classes are the five of `EVIDENCE_CLASSES`. In this file: **B** = Bontrager value (page cited, class `common-reference`, provisional); **T** = engine teaching choice (class `educational-simplification`, named as such in the user-visible feedback and in `REVIEW_PACKAGE.md`, S12-1); **D** = open owner / educator decision; **U** = unknown, source needed. "Source needed" items are not implemented as validated.

## 3. Positioning
Common to both exams unless stated. Page numbers are printed pages of BONTRAGER-9.

| Topic | What this reference can state | Class / status |
|---|---|---|
| Patient state | seated at the end of the table; shoulder, elbow and wrist on the **same horizontal plane** (p.156, 158) | **B**; stated, **not scored in v1** (§5 D-list, O24) |
| Hand / wrist — PA | hand **pronated**, hand **arched slightly** so the wrist / carpals contact the receptor closely (p.156) | **B**; not scored in v1 |
| Hand / wrist — lateral | **thumb-up** lateral, fingers comfortably extended; a **radiolucent support block** and a **sandbag** are allowed (p.158) | **B** |
| Alignment | hand / wrist **long axis aligned with and centred on the receptor long axis** (p.156, 158) | **B** (drives the centring-x rule) |
| Rotation — PA | true PA is shown by: **equal concavity on both sides of the proximal metacarpal shafts**; **near-equal distances between the proximal metacarpals**; **distal radius and ulna separated** (only minimal superimposition at the distal radioulnar joint is allowed); not every intercarpal space is open — some overlap is normal (p.156) | **B** (the criteria); the **tolerance** ±2° / ±5° is **T** |
| Rotation — lateral | true lateral is shown by: **ulnar head superimposed over the distal radius**; **proximal 2nd–5th metacarpals superimposed / aligned** (p.158) | **B** (criteria); tolerance **T** |
| Central ray | **perpendicular** to the receptor, directed to the **midcarpal area** (p.156, 158) → tube angulation expected 0° | **B** |
| SID | **minimum 40 in = 102 cm** (conversion, not source) (p.156, 158) | **B** (minimum); the upper bound is **T** |
| Receptor | **18 × 24 cm, portrait, the smallest available**; collimate to the area of interest (p.156, 158) | **B** |
| Collimation | on **all four sides**, to include the **distal radius and ulna** and the **mid-metacarpal area** (p.156, 158); lateral shows at least the distal radius / ulna, the carpals and the mid-metacarpal area (p.158) | **B** (what must be included); the numeric margin (cm) is **T / D** (§8.1) |
| Marker | an anatomic R / L side marker is required on every image, inside the lateral part of the collimated border of the side identified, not over essential anatomy (p.32–33, already recorded); single-limb display convention is **not given** | **B** (presence, side, placement); **display convention = D (O21)** |
| Grid | **non-grid** (p.156, 158) | **B**; stated, **not a control** (no grid control, S11-3) |
| Shielding | shield radiosensitive tissues outside the region of interest (p.156, 158) | **B**; stated, **not scored in v1** |
| Respiration | not applicable | — |
| Motion | no motion (p.156, 158) | **B**; the keep-still check follows the existing `patient-motion` pattern, weight 0 until an educator rubric exists (CLAUDE.md, Session 4) |

## 4. Technique (digital radiography)
| Topic | What can be stated | Class / status |
|---|---|---|
| kVp — PA | digital **60 ± 5 kV** (i.e. 55–65); analog 60–70 (p.156) | **B** (full-credit band 55–65, S14.1-4); partial bands **T** |
| kVp — lateral | digital **65 ± 5 kV** (i.e. 60–70); analog 60–70 (p.158) | **B** (full-credit band 60–70); partial bands **T** |
| mAs / AEC | Bontrager (as supplied) gives **no mAs and no AEC rule** for the wrist | **U** — no numeric mAs target (S10b-9); exposure adequacy is graded against the engine's own reference, labelled **T** (GAP G9) |
| Exposure appearance | the image should show **optimal density and contrast**, **sharp bony trabecular markings** and **soft-tissue margins (fat pads)** (p.156, 158) | **B** (qualitative); digital brightness is never an exposure indicator; no EI / EIT / DI number |
| Detail screens / grid | detail screens, non-grid (p.156, 158) | **B**, stated |
| Dose | collimate, smallest receptor, shield (p.156, 158) | **B** |
| Patient size | none (adult representative case; a different size is a new case, S7-3) | — |

## 5. Conventions and open owner decisions
Options and sources; **nothing here is decided** unless it cites a decision id.

- **Marker display (O21).** The letter is the patient's **anatomical side** (S10b-22 rule, p.32–33, 36); placement inside the lateral edge of the field, not over anatomy. What is **not** given: which viewer half a single limb's marker belongs in. Options: **A** letter + presence + "inside the field, not over the required anatomy" only (no viewer-half check); **B** a department convention stored as data (e.g. a marker zone beside the radial or ulnar edge); **C** the PA-chest viewer-half convention (meaningless for one limb). *Prompt direction (S14.1 prompt): scored anatomical-side marker, "display convention as S12-7 / S13", case specifies the side, baseline image side must match.* Recommendation: **A + one stored side per case** for v1; B only with a source.
- **Category weights (O22).** The PA weights are 25 / 20 / 15 / 20 / 10 / 10 (positioning / rotation / centering / exposure / sid / breathing). A wrist has **no breathing**; the S14.1 prompt says "reuse PA weights unless the recipe says otherwise". The recipe says only "weights = the PA weights unless a decision says otherwise (S10b-14) and sum to 100". Options: **A** drop `breathing` and redistribute proportionally (positioning 28, rotation 22, centering 17, exposure 22, sid 11 = 100); **B** give the 10 to `positioning`; **C** keep a `motion` category (10) fed by the keep-still check — but that check is weight 0 until a rubric exists. Recommendation: **A**. Owner decides.
- **Rotation sign (O23).** The sign of `rotationDeg` is defined by the result image per exam (recipe §6; PA `−r`, lateral-left `−r`, ap-erect `+r`). A wrist needs its own sign (forearm pronation / supination about the long axis) and, if it uses the plan view, `planRotationDeg` has no wrist case and still switches on `"ap-erect"` (O19 open). Feedback stays **magnitude-only** (Bontrager gives no direction rule for the wrist), as S12-3 / S13-4. Write the sign down before coding; pin it with a renderer test.
- **Case side (O24).** v1: one wrist per case (R **or** L), stated by the case; the baseline image's side must match; the learner chooses the marker letter. Which side(s) to ship, and whether the exam may offer both, is an owner choice.
- **Not scored in v1 (educator decision, O24):** shoulder / elbow / wrist horizontal plane, hand arch, shielding. Each could become a `choiceControl` + rule later, each with its Bontrager page. Scored ⇒ drawn (recipe §4): the scene must not hide these as invisible requirements — it shows them as labelled drawing context only.
- **Critical findings (educator decision, provisional):** exactly **`missing-marker`** and **`wrong-side-marker`** (both already exist in `CRITICAL_DETECTORS`). **No others** (S14.1 prompt). A wrong projection stays a normal critical finding because the exam order names the projection (`wrong-projection` exists); the prompt's "minimal list" means the educator-chosen *new* ones — **confirm** whether `wrong-projection` / `patient-motion` (both existing, and present in the PA / Lateral / AP exams) are wanted on the wrist (O24).

## 6. Image quality and result rendering
| Criterion / effect | Statement | Class / status |
|---|---|---|
| True PA | equal metacarpal-shaft concavity, near-equal proximal metacarpal spacing, distal radius / ulna separated (p.156) | **B**; the rotation effect is drawn as an educational approximation (new renderer effect, GAP G6) |
| True lateral | ulnar head over the distal radius; proximal 2nd–5th metacarpals superimposed (p.158) | **B**; same |
| Coverage | distal radius / ulna, carpals, at least the mid-metacarpal area (p.158; PA also p.156) | **B**; the clipping effect and the required-anatomy box are data (§8.6) |
| Exposure | low exposure = noise + detail loss; excess exposure never darkens; soft-tissue margins and trabeculae are the quality cue (p.156, 158) | **B** concept; magnitudes **T**; no EI number |
| Not implemented as clinical truth | any fracture / pathology appearance; any numeric exposure index; any claim that a displayed grey level proves exposure; anatomical detail beyond the baseline image; the arched-hand / contact effect; shielding; shoulder-elbow-wrist plane | **never** |

## 7. Arabic terms (proposed, DRAFT, pending educator review)
Not added to the UI by this session. Listed for the exam session, to be added to `ARABIC_TERMINOLOGY.md` under a dated heading then: wrist الرسغ · carpals عظام الرسغ · metacarpals mid-shaft منتصف مشط اليد · distal radius / ulna الطرف السفلي للكعبرة والزند · ulnar head رأس الزند · pronated / thumb-up مُنْكَبّة / الإبهام لأعلى · midcarpal وسط الرسغ · receptor **الكاشف** (never «الكاسيت»). All machine-assisted drafts.

## 8. Needs (for the generalisation session S14.1b)
Marks: **same** as the chest engine today · **differs** · **new** · **unknown — source needed**. A **GAP** is a need the S11 / S14-0 mechanisms cannot express; each GAP has an id (G1…) resolved in §9.

### 8.1 Controls (what the student sets)
| Item (chest today) | Wrist | Mark | Note / mechanism |
|---|---|---|---|
| `projection` | `wrist-pa` (exam 1) / `wrist-lateral` (exam 2); `availableProjections` has both so a wrong projection is selectable | **new id** | covered: `PROJECTIONS` registry (S14-0) |
| `rotationDeg` (±8°) | rotation of the wrist about the forearm long axis; magnitude-only feedback; ±2° / ±5° **T** | **differs** | covered as numeric control; sign + plan view → G7 |
| `centralRay` | CR to the midcarpal area, perpendicular; centring x (long axis) and y | **same** | covered (`CenteringRule`); target is data |
| `collimation` | 4 sides to include distal radius / ulna and mid-metacarpals | **same** | covered; coverage rule; the required region is data on an 18 × 24 cm portrait detector |
| `sidCm` | ≥ 102 cm | **differs** | covered (range rule; values are data) |
| `kvp` | 55–65 PA / 60–70 lateral (**B**) | **differs** | covered (`kvp-band` technique rule) |
| `mas`, `exposureMode`, `aecChambers` | manual mAs; AEC layout of the chest has lung / mediastinum chambers | **differs** | **GAP G9** (technique profile requires `aec` + `AecAnatomy` of the chest) |
| `tubeAngulationDeg` | expected 0° (Bontrager: perpendicular) | **same** | covered (optional control; either omit it — absent = 0 — or declare it with a range rule); recommendation: omit |
| `chinPosition`, `shoulderPosition` | **do not exist for a wrist** | **GAP** | **G1** (required fields of `SimulationSettings`; `PositioningView` renders the cues; `validateCase` / compose touch them) |
| `breathing` + inspiration | not applicable | **GAP** | **G2** (`availableBreathing` required; `validateExam` / `validateCase` need it; `PatientInstructionsPanel` always renders the breathing control; `derivePatientResponse` needs `inspirationResponse`) |
| `motionInstruction` | applicable (no motion) | **same** | covered; keep-still weight 0 (CLAUDE.md) |
| `sideMarker`, `markerPosition` | R / L, anatomical side | **differs** | covered by `markerRule: anatomical-side` + `markerSide` data; display convention O21 |
| `choiceControls` | none required in v1 (arch / plane / shield are not scored) | — | covered when added later |

### 8.2 Scoring categories
| Chest PA | Wrist | Mark | Note |
|---|---|---|---|
| positioning, rotation, centering, exposure, sid, breathing (25/20/15/20/10/10) | positioning (incl. collimation, marker), rotation, centering, exposure, sid; **no breathing** | **differs** | covered: categories are the keys of `categoryWeights` (S11-5); weights decision **O22** |

### 8.3 Critical findings
| Chest PA | Wrist | Mark | Note |
|---|---|---|---|
| `wrong-projection`, `patient-motion`, `missing-marker`, `wrong-side-marker` | `missing-marker`, `wrong-side-marker` (educator decision, provisional; `wrong-projection` / `patient-motion` O24) | **same ids** | covered: all four exist in `CRITICAL_DETECTORS`. `CriticalFindingId` is already an open string — **not a gap** (the S14-0 note "closed list" is out of date for the type; the detector table is the registry). |

### 8.4 Image variants / effects
| Chest PA | Wrist | Mark | Note |
|---|---|---|---|
| effects: baseline, rotation, collimation-clipping, excess-field, centering, scapulae, chin, inspiration, motion, low/excess exposure, low-penetration, marker, projection | wrist needs: baseline, **rotation (wrist-specific: metacarpal concavity / spacing for PA; ulna-over-radius / metacarpal superimposition for lateral)**, collimation-clipping, excess-field, centering, motion, low/excess exposure, low-penetration, marker, projection | **differs** | `EffectId` is already an open vocabulary (S11): an effect needs a concept record, a magnitude record (tables in `plan.ts`) and a pipeline step. The wrist rotation effect has no pipeline step and **no pixel model** — **G6**. `scapulae`, `chin`, `inspiration` are simply not declared (optional landmark groups, S11) — covered, but `lungApexV` / `diaphragmDomeV` / `anatomyBox` are **required** fields of the asset spec — **G5**. |
| `ImageVariantId` (core ids + open tail? to be confirmed by S14.1b) | reuse `correct`, `rotated`, `wrong-projection`, `clipped`, `low-exposure`, `excess-exposure`, `motion` | **same ids** | confirm in S14.1b that no new variant id is needed; chest-named ids (`chin-overlap`, `scapulae-overlap`, `poor-inspiration`) are unused |

### 8.5 Positioning scene
| Chest PA | Wrist | Mark | Note |
|---|---|---|---|
| `chest-pa-frontal` (standing patient, frontal figure, chin / shoulder cues) | a **seated-at-table** scene: forearm / hand on the detector, tube above, plan or side view for SID, detector view with a hand / wrist drawing, marker, collimation, centring; no chin / shoulder cues | **new** | `SceneId` / `SCENE_IDS` is a **closed list** → **G3**; the scene body is bespoke art (a `DetectorFigure` + `SceneLayout`, or its own component) — recipe §3C, §4; tokens from `scene-style.ts` |

### 8.6 Landmark groups (`RadiographAssetSpec`)
| Chest field | Wrist | Mark | Note |
|---|---|---|---|
| `anatomyBox`, `midlineU?`, `lungApexV`, `diaphragmDomeV` (required), `scapulae?`, `jaw?`, `denseZones?` | `anatomyBox` (distal radius / ulna … mid-metacarpals) ✔; `midlineU` = forearm / hand long axis ✔ (optional already); `lungApexV`, `diaphragmDomeV` are **meaningless** | **GAP** | **G5** make the two lung fields optional (byte-identical for the chest); wrist landmark groups (carpal region, metacarpal shaft markers, distal radioulnar joint, ulnar head) are **new optional groups** needed by the rotation effect (G6) |

### 8.7 Case fields (`CaseDefinition`)
| Field | Wrist | Mark | Note |
|---|---|---|---|
| `patient` (age, sex, description) | representative adult, **not** tied to the chest case person; teaching approximation | **same** | covered |
| `patientTechnique` (attenuation) | 1 (reference, not measured) or a teaching value | **same** | covered (labelled) |
| `patientCooperation` | `inspirationResponse` required | **GAP** | G2 |
| `initialSettings` | contains `chinPosition` / `shoulderPosition` | **GAP** | G1 |
| `bodyPart` (exam + `RadCase` + `compose`) | `"wrist"` | **GAP** | **G4** literal `"chest"` in `domain/exam.ts`, `domain/case.ts` (`RadCase`), `features/exam/compose.ts`, `exam.test.ts` pin |
| `modality` | `"general-radiography"` | **same** | covered |
| orientation display (marker / side) | O21 | **unknown** | decision |

### 8.8 Assets (licence-verified only; **none fetched or added** in a reference session)
| Asset | Status |
|---|---|
| PA wrist baseline | **open — shortlist not obtained** (Commons API HTTP 429, first request and the one allowed retry, 2026-10-07). O25. |
| Lateral wrist baseline | **open — same** |

**Acceptance criteria for the shortlist (S13c-1, to apply when the block clears):** normal adult wrist; no burned-in text, ruler, date; no devices / casts / pathology; **CC0 / public domain / CC BY only**; the anatomical side stated by the source; ideally both projections of the same wrist; resolution adequate (≥ ~1000 px on the long axis for the derived web copy). Each candidate is reported with canonical `commons.wikimedia.org/wiki/File:…` URL, author, licence line, date, resolution and side. The owner approves the final candidates in S14.1c; no image is downloaded before that.

## 9. Generalisation (S7-4) mapping, gaps and the three-session split

### 9.1 Gaps, proposed minimal change, owner session, proof
**Proof of byte-identity for every gap** is the same one (recipe §7, S14-0): `characterisation.test.ts` unchanged; `scene-dom.test.ts` (408 hashes) unchanged; `scripts/qa/golden/*`, `public/images/*`, `assets/*`, `src/data/exams|cases/*` for the three chest exams and `messages/*.json` for existing keys not edited; `git diff main --stat` over those paths empty. **Never regenerate** the characterisation or the scene hashes.

| Gap | Need | Proposed minimal change (optional, absent = today's output) | Session |
|---|---|---|---|
| **G1** chin / shoulder in `SimulationSettings`, `PositioningView`, compose, `validateCase`, patient response | a wrist has neither | make `chinPosition` / `shoulderPosition` **optional** on `SimulationSettings`; the exam declares which cue panel the scene shows (`SceneLayout.cues` already); `validateCase` checks them only when the exam's scene needs them; store defaults unchanged for the chest | S14.1b |
| **G2** breathing / inspiration | no breathing | `availableBreathing?: BreathingId[]` optional (absent ⇒ no control, no breathing rule, no `breathing` category); `PatientInstructionsPanel` hides the breathing group when absent; `inspirationResponse` optional in `PatientCooperationProfile`; `breathing` optional in settings with a neutral default read by the engine only when declared | S14.1b |
| **G3** closed `SceneId` / `SCENE_IDS` | a new scene id | open the id type (string registered in `SCENES`, validated by `validateExam` against the registry, as S14-0 did for `ProjectionId`); keep the compile-time exhaustiveness check by a test over `SCENES` | S14.1b |
| **G4** `bodyPart: "chest"` literal | `"wrist"` | widen to a union / open string registered in the catalogue (`src/data/modalities.ts`); `compose` copies it; `exam.test.ts` pin for chest stays true | S14.1b |
| **G5** required `lungApexV`, `diaphragmDomeV` (+ chest naming of `anatomyBox`) on `RadiographAssetSpec`; chest assumptions in `pipeline.ts` (lung / spine) | wrist baseline has no lung fields | make the two fields optional; the inspiration warp runs only when both exist (already gated by the breathing effect once G2 is done) | S14.1b |
| **G6** wrist rotation effects in `plan.ts` / `pipeline.ts` / `tuning.ts` | metacarpal-shaft concavity & spacing (PA), ulnar-head-over-radius & metacarpal superimposition (lateral) | **pipeline steps are not byte-identity work: they are new behaviour for new exams.** Split: S14.1b only makes the plan / pipeline accept an *effect registry* (an effect declares its landmark group, concept / magnitude record and pipeline step; the chest effects are re-registered unchanged); S14.1c adds the two wrist effects, with all magnitudes in `tuning.ts` as EDUCATIONAL approximations, deterministic, no pixel read-back; a synthetic-stripe renderer test pins the sign (recipe §6) | S14.1b (hook) + S14.1c (effects) |
| **G7** `planRotationDeg` switches on `"ap-erect"`; O19 | a sign for the wrist (if the plan view is used) | decide the sign in `DECISIONS.md` (O23) **before** S14.1c; S14.1b adds no behaviour: the function gets a per-projection sign from the projection registry **only if** the wrist uses the plan view, otherwise the scene uses a different second view (own scene) — O19 stays untouched | decision now, code S14.1c |
| **G8** console JSX for any control that is not a range or an enum choice | none needed (all wrist controls are ranges / enums / marker) | none | — |
| **G9** technique profile (`aec`, `AecAnatomy`, `anatomyRelativeExposure`) is chest-shaped; exposure adequacy needs a reference | wrist protocol: manual technique; no source for mAs / AEC | allow `aec` to be absent / manual-only in `ExamTechniqueProfile` (byte-identical for the chest); the wrist `manual.reference` is an engine teaching constant with **no clinical claim** (S10b-9), labelled; owner decision on whether AEC is offered at all (Bontrager silent) | S14.1b (shape) + S14.1c (values, REVIEW_PACKAGE) |
| **G10** `ImageVariantId` / `consistency.ts` chest-named groups | none new | none, verify only | S14.1b |

Verified **not** to be gaps: `CriticalFindingId` (open string, detector table has the two needed), `EffectId` (open vocabulary), `ProjectionId` / wording namespace (registry, S14-0), per-exam categories, tube angulation, marker rule kinds, `choiceControls`.

### 9.2 S7-4 mapping
| S7-4 item | Needed by the wrist? | Decision |
|---|---|---|
| `SimulationSettings` / `ControlSpec[]` | yes (G1, G2) — chest-only fields optional | S14.1b |
| `CATEGORIES` / `CategoryId` | no (already per-exam) | none |
| `ImageVariantId` / `EffectId` | effect registry hook (G6), variants verified (G10) | S14.1b |
| `CriticalFindingId` + `isPresent` | no (open, ids exist) | none |
| Console JSX | breathing group conditional (G2) only | S14.1b |
| Positioning scene art | yes: a new scene family (G3 id; art is exam work) | S14.1b registers, S14.1c draws |
| `RadiographAssetSpec` landmark groups | yes (G5 + new optional wrist groups) | S14.1b / S14.1c |
| Move to `modalities/xray/*`, migrating off `RadCase` | no | stay deferred |

Rule of three: the wrist is the **second** non-chest-shaped consumer after the (already optional) lateral / AP variations — G1, G2, G5 are justified by this reference alone because they are *removals of chest-only requirements*, not new abstractions; G6's effect registry is the only new abstraction and is proposed **minimal** (a hook, not a framework).

### 9.3 Proposed scope of S14.1b — byte-identical limb generalisation (code, no new exam)
In: G1, G2, G3, G4, G5, the G6 *hook*, the G9 *shape* (optional `aec`), the G10 check; plus a **conformance fixture**: a synthetic limb `ExamDefinition` + `CaseDefinition` used **only in tests** (not registered in `EXAMS`), proving `validateExam` / `validateCase` accept an exam with no chin / shoulder / breathing / AEC / lung fields, and the renderer plan builds for an asset without lung fields. Out: any wrist data, projection registration, scene art, image, wording, Arabic string, scoring value, the wrist effects, O19, O20.
Proof: the byte-identity block above, plus `scene-dom.test.ts` and `characterisation.test.ts` passing **unchanged**; `npm run check` + `npm run build`; PA / Lateral / AP audits (Playwright + axe, EN / AR × 1440 / 390) once at the end. If any chest output changes: stop and report.
Preconditions: **this reference merged to main** with §8 complete; owner decisions O22 (weights), O21 (marker display) and O23 (rotation sign) answered or explicitly deferred to S14.1c (they affect only S14.1c).

### 9.4 Proposed scope of S14.1c — the two wrist exams (recipe session, batch of 2)
Order: `wrist-pa`, then `wrist-lateral`, one commit and one test file each. Per recipe §1: data (§3 table A of the recipe), registrations (`EXAMS`, `CASE_DEFINITIONS`, `SCENE_IDS`/`SCENES`, `PROJECTIONS`: `wrist-pa`, `wrist-lateral`, with `wordingNs` only if the wording differs), the two wrist rotation effects (G6), the technique profile values (G9), the scene (own-work vector, S13b language, phone-first, EN + AR, label-collision script §4a), baseline images from the **owner-approved** shortlist (verify, strip metadata, A-0xx records, REGISTER rows, derive script, credit line), EN + AR strings (AR DRAFT in `ARABIC_TERMINOLOGY.md`, «الكاشف»), REVIEW_PACKAGE rows, DECISIONS entries, tests incl. extended scene-dom hashes **added, never regenerated**, audits once at the end. Scoring split (S14.1-4): Bontrager-sourced values labelled **B**, teaching choices **T** in the exam data, the UI feedback text and REVIEW_PACKAGE.

## 10. Open owner decisions and open items
**O21** marker display on a single limb · **O22** category weights without breathing · **O23** wrist rotation sign and plan-view use (relates to O19) · **O24** case side(s); which wrist items stay unscored; whether `wrong-projection` / `patient-motion` are wanted on the wrist · **O25** the Commons image shortlist is outstanding (429 block) · **O26** no supporting source read for limb technique / mAs / AEC (educator may supply). Remaining "source needed": mAs / AEC, SID upper bound, partial kV bands, rotation tolerance (all **T** or **D**, §3–§4). Details in `DECISIONS.md`.

## 11. Development rules
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; if sources disagree, keep the rule configurable (it is only one source here); Bontrager governs (S10b-25).
