# RAD-LAB — Medical Reference: Hand PA and Hand Lateral (adult, seated at the table, digital radiography)

**Purpose:** the reference for the next limb exam batch — `hand-pa` and `hand-lateral` (S14.2-1) — written *before* any code (S10-2 "Reference first"). It uses `RAD-LAB_Medical_Reference_Wrist.md` as its format template and records what the hand needs beyond the wrist builder (§8) as input for S14.2b / S14.2c.
**Scope:** adult, seated at the end of the table, hand PA and hand lateral (fan lateral p.152; extension / flexion alternatives p.153), digital radiography, non-grid. **PA oblique hand is out of v1.** Other limb parts, paediatric, casts / splints / devices, foreign-body localisation as an exam goal, and pathology are out of scope.
**Use:** content reference for a later exam session; **nothing in this file is implemented**. No code, data, projection registration, test, message or image file was added by the session that wrote it (S14.2a, docs only).
**Status:** DRAFT. Every clinical value is provisional until the O5 educator / physicist review (not a gate, S10b-20). Template: [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md). Decisions: `DECISIONS.md` S14.2-1 … S14.2-5, O32 … O37.

## 0. Honest summary of the evidence
- **One source for all positioning and technique facts: `BONTRAGER-9`** (9th ed., printed **p.150** PA hand, **p.152** fan lateral hand, **p.153** lateral in extension / flexion), the governing authority (S10b-25). The claims were read **by the owner's advisor** and verified against the owner's copy; Claude Code did not read the book and did not re-verify them (same status as every other BONTRAGER-9 claim). PDF page = printed page + 20 (a locator note). *(In the PDF text extraction "Cp joint" = MCP joint.)*
- Bontrager is **silent** (as supplied) on: mAs, AEC, any numeric rotation tolerance, partial kV bands, any SID upper bound, any numeric collimation margin or centring tolerance in cm, any forearm-coverage tolerance, and the viewer-side display of a single-limb marker. These are **teaching choices or owner decisions** (§3–§5), never written as medical facts. No supporting source was read for limbs (O26): **no rule here has a second source**.
- **No hand image is verified yet.** Two owner-found Commons candidates exist (§8.8) but were **not checked through the Commons API** in this session; they are candidates only, nothing was downloaded.
- Wrist baselines A-010 … A-013 stop at the proximal metacarpals and **cannot be reused** for the hand.

## 1. Sources
Source rules: as the template (authoritative only; textbooks cited by printed page, paraphrased, no text or figures reused; Radiopaedia excluded; third-party student notes never cited).

### 1.1 Sources read
| # | Citation | Access status | What it supports (and only this) | Sole support allowed? |
|---|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager's Textbook of Radiographic Positioning and Related Anatomy*, 9th ed., Elsevier, 2018 — **printed p.150 (PA hand), p.152 (fan lateral hand), p.153 (lateral extension / flexion)**; general marker rules p.32–33, 36 in [`sources/BONTRAGER-9.md`](sources/BONTRAGER-9.md) | read by the owner's advisor; **not re-verified by Claude Code** | Hand positioning, central ray, SID, receptor, collimation, digital kV, true-PA / true-lateral criteria (§3, §4, §6) | **Yes — it governs** (S10b-25); every clinical value stays provisional (O5). |

### 1.2 Sources not read
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| A supporting source for limb technique (ACR general / digital parameters, WHO-TECH limb chapters, Clark's limb chapters) | mAs / AEC, exposure practice, second opinion on kV and SID | not obtained for limbs | O26 (open since S14.1a) |
| Bontrager PA oblique hand | oblique projection | out of v1 | — |

### 1.3 Leads
None recorded.

## 2. Classification
**B** = Bontrager value (page cited, `common-reference`, provisional) · **T** = engine teaching choice (`educational-simplification`; named as such in user-visible feedback and `REVIEW_PACKAGE.md`, S12-1) · **D** = open owner / educator decision · **U** = unknown, source needed (not implemented as validated).

## 3. Positioning
Common to both projections unless stated. Page numbers are printed pages of BONTRAGER-9.

| Topic | What this reference can state | Class / status |
|---|---|---|
| Patient state | seated at the end of the table, **hand and forearm extended** (p.150, 152) | **B**; stated, not scored in v1 (S14.2-4) |
| Alignment | long axis of hand / forearm **aligned with the long axis of the receptor** (p.150, 152) | **B** (drives the centring-x rule) |
| PA hand | hand **pronated**, **palm in contact with the receptor**, fingers **spread slightly**; hand and wrist centred to the receptor (p.150) | **B** |
| Fan lateral (preferred when the phalanges are the area of interest) | hand rotated to lateral, **thumb side up**; fingers and thumb **spread in a fan** on radiolucent blocks, all digits separated and **parallel to the receptor**; metacarpals not rotated; a **45° foam step support** is listed (p.152) | **B**; support / fan details = context only (S14.2-4) |
| Lateral in extension (alternative) | thumb side up; fingers and thumb **extended against a support block**, fingers and metacarpals superimposed (p.153) | **B** |
| Lateral in flexion (alternative) | thumb side up; fingers in **natural flexion**, thumb lightly touching the first finger; may be less painful (p.153) | **B** |
| Lateral alternatives, use | extension / flexion are also used for **foreign-body localisation** and **displaced metacarpal fractures** (p.153) | **B**; context only, not an exam goal |
| Central ray | **perpendicular** to the receptor (p.150, 152, 153) → tube angulation expected 0° | **B** |
| CR target — PA | **third MCP joint** (p.150) | **B** |
| CR target — fan lateral | **second MCP joint** (p.152) | **B** |
| CR target — lateral extension / flexion | **second–fifth MCP joints** (p.153) | **B** |
| SID | **minimum 40 in = 102 cm** (conversion, not source) (p.150, 152) | **B** (minimum); the upper bound and the full / partial bands are **T** |
| Receptor | **24 × 30 cm, portrait**, but the **smallest available** receptor is used and the beam is collimated to the area of interest (p.150, 152) | **B** (size, portrait); the exam's detector aspect is **D** (O36) |
| Collimation | on **four sides**, to the outer margins of the hand and wrist (p.150, 152) | **B** (what must be included); numeric excess margin = **T** |
| Anatomy demonstrated | **entire hand and wrist plus about 2.5 cm (1 in) of distal forearm** (p.150, 152) | **B**; the forearm-coverage tolerance = **T** (the baseline may limit it, O35) |
| Both hands requested (PA) | **expose them separately** for correct CR placement (p.150) | **B**; context only (one hand per case) |
| Shielding | shield radiosensitive tissue outside the region of interest (p.150, 152) | **B**; context only (S14.2-4) |
| Compensation filter | may be used in the fan lateral because of thickness differences (p.152) | **B**; context only |
| Marker | anatomic R / L marker on every image, inside the lateral edge of the collimated field, not over essential anatomy (p.32–33, already recorded); single-limb display convention **not given** | **B** (presence, side, placement); display convention = **D**, decided for v1 as letter-only fixed-side (S14.2-2) |
| Grid | **non-grid**, detail screens (p.150, 152) | **B**; stated, not a control (S11-3) |
| Respiration | not applicable | — |
| Motion | no motion | keep-still check follows the existing `patient-motion` pattern, weight 0 until an educator rubric exists (CLAUDE.md, Session 4) |

## 4. Technique (digital radiography)
| Topic | What can be stated | Class / status |
|---|---|---|
| kVp — PA | digital **60 ± 5 kV** (55–65); analog 60–70 (p.150) | **B** (full-credit band); partial bands **T** |
| kVp — fan lateral | digital **65 ± 5 kV** (60–70); analog 60–70 (p.152) | **B**; partial bands **T** |
| kVp — extension / flexion | same as the fan lateral (p.153) | **B**; partial bands **T** |
| mAs / AEC | Bontrager (as supplied) gives **no mAs and no AEC rule** | **U** — no numeric mAs target (S10b-9); exposure adequacy graded against an engine reference labelled **T**; no AEC (S14.2-4) |
| Exposure appearance | not stated for the hand in the claims supplied for S14.2a | **U** (do not transfer the wrist's trabecular / fat-pad wording without a hand source; O35) |
| Detail screens / grid | detail screens, non-grid (p.150, 152) | **B**, stated |
| Compensation filter | optional in the fan lateral (p.152) | **B**; not a control |
| Patient size | none (adult representative case; a different size is a new case, S7-3) | — |

## 5. Conventions and decisions
Nothing here is decided unless it cites a decision id.

- **Marker (S14.2-2).** Letter-only `fixed-side` rule as S14.1c-4 / O21: the letter must equal the examined side (L); presence and "inside the field, not over the required anatomy" only; no viewer-half check.
- **Case side (S14.2-2).** LEFT hand in both projections (candidate images are a left hand). A right-hand case needs the side on the case (O29 stays open).
- **Rotation (S14.2-3).** Magnitude-only feedback; ±2° full / ±5° partial are **teaching choices (T)**; no direction text; no PlanView; `planRotationDeg` / O19 untouched. The sign of `rotationDeg` is defined by the result image (as S14.1c-2) and is written down in S14.2b before coding (O34).
- **Weights (S14.2-5).** 28 / 22 / 17 / 22 / 11 (positioning / rotation / centering / exposure / sid) as the wrist. Nothing in the hand pages supplies a reason to differ.
- **Critical findings (S14.2-5).** `missing-marker` and `wrong-side-marker` only.
- **Not scored (S14.2-4):** shielding, compensation filter, foam support, finger position / fan spread / flexion or extension posture, thumb obliquity, hand-and-forearm-on-plane, grid. Each could later become a `choiceControl` + rule with its Bontrager page (O30 pattern). **Stop-and-report trigger:** if the reference showed a *measurable* criterion among these, S14.2a would have stopped; none was found in the supplied claims — the finger / thumb criteria below are image-appearance cues, judged only as part of the rotation effect if the baseline can show them (O32).

## 6. Image quality and result rendering
| Criterion / effect | Statement | Class / status |
|---|---|---|
| True PA — rotation | **symmetric concavities** of the metacarpal shafts and phalanges of digits 2–5; **equal soft tissue on each side** of phalanges 2–5 (p.150) | **B**; effect = educational approximation, feasibility open (O32) |
| True PA — digits | digits **slightly separated**, soft tissues **not overlapping**; **MCP and IP joints open** (correct CR location and full pronation); **thumb appears oblique** (expected) (p.150) | **B**; thumb obliquity is *expected*, never penalised |
| True PA — centring | CR and collimation centre at the **third MCP joint** (p.150) | **B** |
| Fan lateral — criteria | fingers equally separated; phalanges in true lateral with **open joint spaces** (fingers parallel to the receptor); thumb slightly oblique, free of superimposition, joints open; **distal radius and ulna superimposed**, **metacarpals superimposed**; CR / collimation centre at the **second MCP joint** (p.152) | **B** |
| Extension / flexion lateral — criteria | distal radius / ulna superimposed; **metacarpals and phalanges superimposed**; thumb slightly oblique, free of superimposition, joints open; CR at second–fifth MCP joints (p.153) | **B** |
| Coverage | entire hand, wrist and about 2.5 cm of distal forearm (p.150, 152) | **B**; required-anatomy box is data; tolerance **T**; limited by the baseline (O35) |
| Exposure | low exposure = noise + detail loss; excess never darkens; no EI number | engine rule (CLAUDE.md Session 3/4); magnitudes **T** |
| Not implemented as clinical truth | any fracture, foreign body or pathology appearance; numeric exposure index; any claim that grey level proves exposure; detail beyond the baseline image; finger-fan / flexion posture effects; shielding | **never** |

## 7. Arabic terms (proposed, DRAFT, pending educator review)
Not added to the UI by this session. For the exam session, to go into `ARABIC_TERMINOLOGY.md` under a dated heading then: hand اليد · fingers / phalanges الأصابع / السلاميات · metacarpals مشط اليد · MCP joint المفصل السلامي المشطي · thumb الإبهام · fan lateral جانبي بوضع المروحة · extension / flexion بسط / ثني · distal forearm الساعد السفلي · receptor **الكاشف** (never «الكاسيت»). All machine-assisted drafts.

## 8. Needs (for S14.2b / S14.2c)
Marks as the wrist reference: **same** · **differs** · **new** · **unknown**. Gaps are noted against the **wrist builder** (§8.9); S11 / S14-0 / S14.1b mechanisms are assumed to exist as merged.

### 8.1 Controls
| Item | Hand | Mark | Note |
|---|---|---|---|
| `projection` | `hand-pa`, `hand-lateral`; `availableProjections` includes both so a wrong one is selectable | **new id** | `PROJECTIONS` registry |
| `rotationDeg` | rotation about the forearm long axis; ±2° / ±5° **T**; magnitude-only | **same** pattern | sign by result image (O34) |
| `centralRay` | PA: third MCP; lateral: variant-dependent (§3) | **differs** (target) | data; see O36 / §8.4 |
| `collimation` | four sides: entire hand + wrist + ~2.5 cm distal forearm | **differs** (region) | data; coverage rule |
| `sidCm` | ≥ 102 cm; bands **T** | **same** pattern | range rule |
| `kvp` | 55–65 PA / 60–70 lateral (**B**); partial bands **T** | **same** pattern | `kvp-band` |
| `mas` | manual only; no AEC | **same** as wrist | S14.2-4 |
| `tubeAngulationDeg` | omitted (CR perpendicular) | **same** | absent = 0° |
| `breathing`, `chin`, `shoulder` | not applicable | **same** as wrist | already optional |
| `motionInstruction` | applicable; weight 0 | **same** | |
| `sideMarker` | L, letter-only `fixed-side` | **same** | S14.2-2 |
| `choiceControls` | none in v1 | — | S14.2-4 |

### 8.2 Scoring categories
positioning (incl. collimation, marker), rotation, centering, exposure, sid = **28 / 22 / 17 / 22 / 11** (S14.2-5).

### 8.3 Critical findings
`missing-marker`, `wrong-side-marker` (S14.2-5; both exist in `CRITICAL_DETECTORS`). Whether `wrong-projection` / `patient-motion` are wanted follows the wrist decision (O24, answered in S14.1c); not re-opened here.

### 8.4 Image variants / effects
Reuse `correct`, `rotated`, `wrong-projection`, `clipped`, `low-exposure`, `excess-exposure`, `motion`. The **rotation effect** needs hand-specific landmark bands (PA: metacarpal shafts / phalanges / soft-tissue sides; lateral: radius–ulna and metacarpal / phalangeal superimposition). Whether one baseline image can show these honestly is the **stop-and-report question O32**.

### 8.5 Positioning scene
A seated-at-table hand scene. The wrist `WristSideView` (S14.1c) is a side view for a wrist; a hand needs at least the detector-view drawing of a whole hand + 2.5 cm forearm and, for the lateral, a thumb-up posture. **Aspect handling (O36):** the receptor is 24 × 30 cm portrait; the lateral baseline candidate is ~0.32 wide : tall, so the scene's detector aspect must follow the exam (data), not a fixed 18 × 24 assumption.

### 8.6 Landmark groups (`RadiographAssetSpec`)
`anatomyBox` (hand + wrist + distal forearm), `midlineU` (long axis), the wrist's optional `limbRotation` group needs **hand bands** (new fields or a generalised group; S14.2b decides, byte-identical for chest and wrist). Required third / second–fifth MCP target points are CR targets, stored as data.

### 8.7 Case fields
`bodyPart: "hand"` (registered like `"wrist"`); `modality: "general-radiography"`; patient = candidate image person (31 y male) as for the wrist images, flagged "same person as the wrist case"; `patientTechnique` = 1 (labelled); side L.

### 8.8 Assets (licence-verified only; **none fetched or added**)
Owner-found candidates (**unverified by the Commons API**, not reviewed as file pages): hand PA 1466 × 2082 and hand lateral 686 × 2123 px; both **left** side, 31-year-old male, Uddevalla Hospital, 29 Oct 2017, own work, **CC0 as seen by the owner**. Burned-in text: "Sin" mirrored top-left of the PA; "SIDA" bottom-right of the lateral. See open questions (§10) for what S14.2b must verify. Acceptance criteria (S13c-1 / wrist §8.8): normal adult hand; no burned-in text / ruler / date after the least-invasive documented modification; no devices / casts / pathology; CC0 / public domain / CC BY only; side stated by the source; resolution adequate for the derived web copy.

### 8.9 Gaps between the wrist builder and the hand (short note, no code)
Wrist builder = `src/data/exams/xray/wrist-common.ts` (one builder for two exams) plus `limb-effects.ts`, `WristSideView`, `fixed-side` marker.
1. **Detector size and aspect:** the wrist is an 18 × 24 cm portrait; the hand is 24 × 30 cm portrait and the lateral baseline is very narrow (~0.32). Whether the builder / scene take the aspect from data (O36).
2. **Required-anatomy region:** hand + wrist + ~2.5 cm forearm vs the wrist's "distal radius / ulna → mid-metacarpals"; the forearm margin depends on the lateral baseline (O35).
3. **CR target:** wrist = one midcarpal point for both exams; hand = third MCP (PA) and second MCP or second–fifth MCP (lateral, variant-dependent). Possibly a single point vs a range target (O36).
4. **Rotation effect bands:** the wrist `limbRotation` group names wrist bands; the hand needs phalangeal / soft-tissue-symmetry (PA) and metacarpal-phalangeal superimposition (lateral) cues (O32).
5. **Scene:** the wrist side view does not show a hand with fingers; a hand scene is new art (scene-style tokens, label-collision script).
6. **`bodyPart` / projection ids / wording namespace** to register (`hand`, `hand-pa`, `hand-lateral`).
7. **Lateral variant** (fan / extension / flexion) is exam-visible text and the CR target — decided in S14.2b from the image (O33).
8. **kV bands:** the wrist's PA 55–65 coincides with the hand PA (60 ± 5); the lateral 60–70 coincides (65 ± 5) — no change expected, but the exposure reference point must be re-labelled for the hand.

## 9. Teaching choices (explicit list; none is sourced)
The following are **engine teaching choices (T)** and must be named as such in user-visible feedback and `REVIEW_PACKAGE.md`: **kV partial bands** (both projections), **SID full-credit and partial bands** (Bontrager gives only the 102 cm minimum), **centring tolerances** (cm), the **excess-collimation margin** (cm), **rotation tolerances** (±2° full / ±5° partial), the **forearm-coverage tolerance** (Bontrager: "about 2.5 cm"), and the manual **exposure reference point** (no clinical claim, S10b-9). Their numeric values are fixed in S14.2c, not here.

## 10. OPEN QUESTIONS FOR S14.2b
**(a) Image candidates (O32 prerequisite).** Verify **both** Commons file pages and licences through the Commons API; record filenames, authors, and SHA-1 then. Handle burned-in text by the **least-invasive documented modification** — crop where possible, otherwise fill with the background; document each in `ASSET_PROVENANCE_AND_LICENSES.md`. Report the **remaining distal-forearm coverage in the lateral** (Bontrager wants about 2.5 cm; record a known limit if shorter). Wrist baselines A-010 … A-013 stop at the proximal metacarpals and cannot be reused.
**(b) Rotation cues from one baseline (O32).** Can PA cues (metacarpal / phalangeal symmetry, soft-tissue balance) and lateral cues (radius / ulna and metacarpal superimposition) be represented honestly from one baseline image? If not → **STOP AND REPORT before building the effect** (S-STD-1 (4)).
**(c) Lateral variant (O33).** Which variant the lateral image supports (it appears to be the extension variant, p.153). The reference covers all three; the exam text, CR target and criteria follow the chosen one.
**(d) CR target and collimation coverage (O36).** Third MCP (PA) and second–fifth MCP (lateral extension) as scored targets, with a source-backed geometry; collimation coverage as an anatomy box on four sides.
**(e) IR 24 × 30 portrait and aspect ratio in the scene (O36).** The lateral is very tall and narrow (~0.32).
Also: sign of `rotationDeg` per exam (O34); forearm / hand exposure appearance wording has no hand source (§4).

## 11. Open owner decisions and open items
**O32** rotation cues from one baseline (stop-and-report gate) · **O33** lateral variant · **O34** hand rotation sign (written in S14.2b) · **O35** forearm coverage and hand exposure-appearance wording limits · **O36** receptor aspect / CR target geometry in the scene · **O37** Forearm AP + Lateral deferred (no licence-verified image). Carried over: O26 (no supporting limb source), O29 (marker side data), O30 (unscored items). Details in `DECISIONS.md`.

## 12. Development rules
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; Bontrager governs (S10b-25); one source only, so no conflict handling is possible here.
