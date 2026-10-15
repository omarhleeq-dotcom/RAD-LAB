# RAD-LAB — Medical Reference: Pelvis AP (adult, supine, digital radiography)

**Purpose:** source-backed reference and Needs assessment before any implementation (S10-2).
**Scope:** one routine AP pelvis including both hips, adult, non-trauma, supine. The owner selected pelvis on 2026-10-15 after supplying an image candidate. No frog-leg, inlet/outlet, Judet, unilateral hip, erect or trauma examination in this phase. This scope does not claim those views are unnecessary clinically.
**Use:** docs only; not an approved scoring specification or implementation authorization.
**Status:** DRAFT, pending educator/physicist review (O5). Clinical facts are `common-reference` and provisional. Decisions: S-PELVIS-REF-1/2; open items O81–O86 in [DECISIONS.md](DECISIONS.md).

## 0. Honest summary of the evidence

- The owner's complete PDF was fetched through connected Google Drive, kept outside Git, and checked against its title/copyright pages: Lampignano/Kendrick, **9th edition, 2018**, ISBN 978-0-323-39966-1. Printed **p.279** is AP pelvis (PDF page 299); **p.271–272** explain lower-limb rotation (PDF pages 291–292). These pages were read directly; p.279 was also checked visually. Earlier advisor extracts are not being re-verified wholesale.
- p.279 supports technique, setup, centering, required anatomy, suspended respiration and image-quality criteria. p.271–272 distinguish whole-pelvis rotation from internal rotation of the legs. A single rotation setting must not stand for both.
- No source read here supplies a universal mAs, EI/EIT/DI limit, scoring weights, critical-finding list, numerical error tolerances, scale in cm/px or a validated one-image deformation model. None is filled from earlier limb exams.
- The owner supplied **one radiograph and two screenshots**, not three radiographs. The Commons file page was read on 2026-10-15; it declares public domain. Its licensing status does not establish clinical suitability. The attached preview contains an R marker and other edge graphics; the owner subsequently requested deterministic pixel cleanup (S-PELVIS-REF-2). The original and cleaned review derivative are registered as A-034/A-035 outside public paths; no product use is approved.
- Shielding statements in the 2018 book are historical source content, not a current protocol adopted by this reference. No shielding control or scoring rule is proposed; current practice needs physicist review (O86).

## 1. Sources

### 1.1 Sources read

| ID | Citation and access | Supports | Sole support allowed? |
|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager’s Textbook of Radiographic Positioning and Related Anatomy*, 9th ed. Elsevier, 2018. ISBN above. **Printed p.279; p.271–272**. Full relevant page text read directly from owner-provided PDF via Drive; p.279 visually checked. [Source notes](sources/BONTRAGER-9.md). | AP pelvis technique, position, criteria; leg-rotation effects and safety exception | Yes for facts explicitly stated, under S10b-25. No support for invented rubric/tolerances. O5 remains. |
| R2 | [Commons canonical file page](https://commons.wikimedia.org/wiki/File:X-ray_of_the_pelvis_of_an_18_year_old_male_-_case_1_-_anteroposterior.jpg), read 2026-10-15 | Image provenance, age/sex and normal/AP description **as stated by uploader**, declared licence and original dimensions | No: not a medical positioning or scoring reference, nor independent confirmation of normality. |
| R3 | Existing BONTRAGER-9 notes, printed p.32–33, 36; advisor reading recorded earlier, not newly rechecked | General anatomical marker requirement and placement context | No pelvis-specific display convention is inferred from the chest-specific p.36 wording. O83. |

R1 is all rights reserved: paraphrase facts with printed-page locators only; no scan, figure, photograph or book text reused in the application or committed to Git. R2 is an image candidate, not a new medical authority. No third-party student summary or Radiopaedia source used.

### 1.2 Sources/protocols not read or not supplied

| Missing input | What it would settle | Status / item |
|---|---|---|
| Pelvis-specific local detector/AEC protocol and physicist review | mAs reference, AEC use/chambers/backup, EI target | Not supplied; O81/O83. A diagram on p.279 is not a calibrated AEC protocol. |
| Educator/owner pelvis rubric | Weights, critical findings, error bands, breathing assessment and marker/display convention | Not supplied; O81/O83. These are decisions, not missing Bontrager facts. |
| Current authoritative shielding protocol reviewed by physicist | Whether and how contemporary shielding guidance should appear | Not reviewed in this phase; O86. |

### 1.3 Leads

None. No clinical claim taken from a search-result snippet.

## 2. Classification

**A — SOURCE-BACKED:** R1, `common-reference`, still provisional until O5. **B — TEACHING CHOICE:** future engine tolerances, scale, model anchors and visual approximations; not selected here. **C — OWNER DECISION:** scope, rubric, convention and simplified controls; scope and external marker-cleanup instruction selected here. **U — unknown / input needed:** no implementation as validated. Other available evidence classes (`validated`, `vendor-protocol-dependent`, `educational-simplification`, `provisional`) remain available when justified; nothing here is educator-validated.

## 3. Positioning

| Topic | Paraphrased fact | Basis/status |
|---|---|---|
| Patient | Supine; arms beside the body or across upper chest; head pillow and knee support described. The erect alternative in the book is outside this phase. | R1 p.279, A |
| Alignment | Midsagittal plane aligned with table center and CR; no pelvis rotation, with equal tabletop-to-ASIS distances. | R1 p.279, A |
| Legs | Separate feet/legs, then internally rotate the **whole lower limbs 15°–20°** for the routine non-trauma position. This is independent of pelvic rotation. | R1 p.279 and p.271–272, A |
| Safety boundary | Do not internally rotate the legs for suspected hip fracture/dislocation; minimize movement of the affected leg. No trauma case is proposed here. | R1 p.279; fracture caution also p.271, A |
| CR | Perpendicular to IR; midline, halfway between ASIS level and pubic symphysis, approximately **5 cm below ASIS**; CR centered to IR. | R1 p.279, A. No centering tolerance in cm given. |
| Hip-routine exception | Book describes a center approximately **5 cm lower** for a hip routine to include more proximal femur. | R1 p.279, A; **outside routine pelvis scope**, not a second target. |
| SID | Minimum **102 cm**. No upper bound or credit bands adopted. | R1 p.279, A |
| IR | **35 × 43 cm, landscape** (43 cm across, 35 cm high). | R1 p.279, A |
| Collimation/anatomy | Four-sided restriction to the examination area; pelvic girdle, L5, sacrum, coccyx, femoral heads/necks and greater trochanters demonstrated. | R1 p.279, A. Region box/margins need asset assessment, O81/O84. |
| Respiration | Suspend respiration during exposure. | R1 p.279, A. It does **not** prescribe deep inspiration or expiration phase. |
| Marker | General anatomical R/L marker principle retained; bilateral display/scoring needs explicit agreement. | R3; C pending O83. Do not copy single-limb `fixed-side`. |

## 4. Technique (digital radiography)

| Topic | Statement | Basis/status |
|---|---|---|
| kV | Digital **85 ± 5 kV**; arithmetic interval **80–90 kV**. Analog **80 ± 5 kV** is source context only. | R1 p.279, A. This is not approval of partial-credit bands or a universal protocol. |
| Grid | Book specifies a grid. | R1 p.279, A. No new grid control is justified; a protocol can declare grid context. Do not copy a non-grid distal-limb detector profile. |
| mAs/time | No numeric target or exposure-time value supplied on the read AP pelvis page. | U, O81; detector/protocol-dependent. |
| AEC | No textual pelvis-specific calibration/chamber selection rule established by the pages read. | U, O83; manual-only is an option requiring agreement, not a Bontrager mandate. |
| Exposure quality | L5/sacrum and femoral-head/acetabular borders remain discernible through superimposed anatomy, while pubic/ischial detail is retained; sharp trabeculae support absence of motion. | R1 p.279, A |
| EI/DI | No EI, EIT or DI threshold selected; display brightness is not exposure evidence. | Existing project rules; U for numerical protocol, O81. |
| Habitus | No patient-specific attenuation or quantitative build factor established from this candidate. | U, O81; any later model value is B, not measured anatomy. |
| Shielding | p.279 describes 2018 shielding recommendations, including coverage constraints; this session does not adopt them into training or scoring. | O86: current review before any product wording. |

## 5. Conventions and open owner decisions

- **O82 — independent positioning:** use `rotationDeg` for pelvic axial rotation only. A discrete, exam-declared `choiceControls` option for bilateral leg positioning could reuse existing machinery without new numeric settings. Independently adjustable left/right angles or a continuous leg-angle requirement would need a separately scoped generalisation. No option adopted here.
- **O83 — breathing:** the existing `BreathingId` has deep-inspiration-hold and expiration-hold, but no phase-neutral suspend-respiration instruction. Do not substitute either as a medical target. A new choice control with honest feedback is an option; extending the breathing/patient-response vocabulary would need separate review and preservation of earlier outputs.
- **O83 — rubric/marker/technique:** choose categories and weights, critical findings, anatomical marker convention, and manual/AEC scope explicitly. The five-category limb weights and marker-only critical pair are precedents, not decisions for pelvis. Pelvis shows both sides; `fixed-side: L/R` from single-limb exams is inappropriate by default. Existing `anatomical-side` plus owner-approved `markerSide` may fit; image orientation must not change with RTL.
- Do not assign a numeric rotation tolerance from the leg-positioning 15°–20° range: it describes a different physical action. No default sign or sensitivity is taken from the ankle model.

## 6. Image quality and result rendering

| Criterion/effect | Source statement or implementation limit | Status |
|---|---|---|
| Pelvis rotation | Symmetry of iliac wings, obturator foramina and visible ischial spines; a narrowed right foramen relative to the left indicates rightward pelvic rotation (and conversely). | R1 p.279, A; rotation magnitude/sign mapping needs O85. |
| Femoral rotation | Appropriate internal rotation profiles the femoral necks; lesser trochanters absent or only tips visible. Greater trochanters comparable. External/neutral leg position changes neck foreshortening and lesser-trochanter visibility. | R1 p.271–272, 279, A; separate from pelvic rotation. |
| Coverage | Entire specified anatomy in the collimated field; source does not provide an engine rectangle, pixel/cm scale or excess-margin threshold. | R1 p.279, A for anatomy; B pending O81/O84 for geometry. |
| Sharpness/exposure | Criteria in §4. A motion/noise/penetration teaching effect is not a diagnosis or pixel-derived score. | R1 p.279 plus project constraints. |
| One-image effects | Chest lung/diaphragm/scapula/jaw effects do not represent a pelvis. Generic limb warps are not already a validated pelvis model. | O85: feasibility gate before code. |

**Do not implement as clinical truth:** fabricated fractures or pathology, an invented EI target, brightness as exposure, a fake breath-dependent pelvis deformation, or an inferred relationship between whole-pelvis rotation and both femoral rotations. If one image cannot depict a scored cue honestly, report the limit and use explicit feedback-only treatment if approved. No medical or pixel model has been built in this phase.

## 7. Arabic terms (proposed)

Draft, machine-assisted, pending educator/Arabic review; no UI strings changed. Pelvis = الحوض; pelvic girdle = الحزام الحوضي; AP pelvis = إسقاط أمامي خلفي للحوض; ASIS = الشوكة الحرقفية الأمامية العلوية; pubic symphysis = الارتفاق العاني; obturator foramen = الثقبة السدادية; greater/lesser trochanter = المدور الكبير/الصغير; femoral neck = عنق عظم الفخذ; internal rotation = دوران داخلي; suspend respiration = حبس النَّفَس أثناء التعريض; image receptor = الكاشف. See [ARABIC_TERMINOLOGY.md](ARABIC_TERMINOLOGY.md).

## 8. Needs (complete assessment; unresolved inputs are named, not invented)

Compared with Chest PA and the currently merged limb mechanisms. These are reference needs, not implemented controls. **same**, **differs**, **new**, **unknown — source needed** are assessment marks. A completed assessment with open decisions does not authorize code.

### 8.1 Controls

| PA/current item | Pelvis requirement | Mark | Mapping/input |
|---|---|---|---|
| Projection/body part | AP pelvis, pelvis | new | Future registry entries only; no exam registered now. |
| `rotationDeg` | Whole-pelvis rotation judged by pelvic symmetry | differs | Same numeric storage/range mechanism; new anatomy/model, O81/O85. |
| No independent femoral rotation | Both legs internally positioned separately from pelvis | new | R1 p.271–272, 279; candidate `choiceControls`, O82. |
| CR/collimation/SID/kV/mAs | Same generic controls, different source targets/geometry | differs | R1 p.279, §3–4; missing model/protocol numbers O81. |
| Optional tube angulation | Perpendicular CR | same | Existing optional control can represent it if selected; tolerances B, O81. |
| Chest deep-inspiration instruction | Phase-neutral suspended respiration | differs | R1 p.279; existing breathing response is chest inspiration, O83. |
| Chin/shoulders | No chest cue controls | differs | Omit optional fields, as limbs already do. |
| Keep still | No motion/sharp trabeculae | same | Existing motion instruction/response can be reused; assessment policy O83. |
| AEC / grid | Grid context; AEC/manual scope unresolved | unknown — source needed | Local pelvis detector/AEC protocol (§1.2), O83. Grid is not currently a selectable control. |

### 8.2 Scoring categories

| PA | Pelvis | Mark | Note |
|---|---|---|---|
| Positioning/rotation/centering/exposure/SID | Relevant concepts; new exam-specific rules | differs | Data-driven rules; do not copy numerical bands, O81. |
| Breathing/inspiration category | Suspended respiration, no lung-expansion criterion | differs | O83; omit chest inspiration detector/effects. |
| Weights/pass mark | Not sourced or selected | unknown — source needed | Educator/owner rubric (§1.2), O83. No weights assigned. |

### 8.3 Critical findings

| PA | Pelvis | Mark | Note |
|---|---|---|---|
| Wrong projection, motion, marker gates | Exact list not approved | unknown — source needed | Educator/owner rubric (§1.2), O83. Open critical registry exists; no automatic adoption. |
| Trauma risk | No trauma scenario in scope | differs | Safety warning in reference; not a fabricated fracture detector. |

### 8.4 Image variants/effects

| PA/current | Pelvis | Mark | Note |
|---|---|---|---|
| Clipping, exposure/noise, motion, geometry | Generic mechanisms potentially reusable | same | Reconfigure for pelvic baseline and protocol; do not score pixels. |
| Frontal chest rotation / inspiration / scapula / jaw | Not pelvic anatomy | differs | Do not declare chest landmark groups. |
| Pelvic symmetry and femoral rotation | Separate, honest cues needed | new | O85; no automatic generic warp selection. |

### 8.5 Positioning scene

| PA | Pelvis | Mark | Note |
|---|---|---|---|
| Standing thorax drawing | Supine pelvis and both proximal femora; leg position distinct from pelvic turn | new | Registered scene/layout/detector-figure mechanisms exist. New artwork would be separate implementation. |
| Detector | Landscape 43 × 35 cm | differs | Existing detector data can store this; no global landscape refactor justified. |
| Guides/text alternatives | Same bilingual/accessibility requirements | same | Scene style and collision checks apply in later code QA. |

### 8.6 Landmark groups

| PA field | Pelvis | Mark | Note |
|---|---|---|---|
| `anatomyBox`, asset projection/size | New source-specific coverage and geometry | differs | Required anatomy R1; coordinates/scale not set, O84/O85. |
| Lung, jaw, scapula, spine chest groups | Omitted | differs | Already optional. Do not set `midlineU` just to trigger chest rotation. |
| Pelvic/femoral effect landmarks | No validated pelvic model currently registered | new | O85; absent effects remain absent, feedback-only option requires agreement. |

### 8.7 Case fields

| Field | Pelvis | Mark | Note |
|---|---|---|---|
| Patient/order/provisional/initial state | Existing CaseDefinition shape | same | Candidate described as male, 18 by R2; no case created or demographic inference from pixels. |
| Patient technique/cooperation | Pelvis attenuation/instruction response | differs | No lung-inspiration assumption; model inputs O81/O83. |
| Baseline image | Candidate below, not adopted | new | O84; no served image or registry asset ID yet. |

### 8.8 Assets (review only; owner-requested cleanup, no served asset)

| Field | Verified information / limit |
|---|---|
| Canonical page | R2, file “X-ray of the pelvis of an 18 year old male - case 1 - anteroposterior.jpg” |
| Author/source/date | Staff, Department of Radiology, UC San Diego Health; bonepit.com; **14 March 2018**, as recorded on R2 |
| Licence | Public domain / Public Domain Mark 1.0; page records VRT ticket 2018030210000886. Verified from the file page, not just screenshot; commercial use allowed by that declaration. |
| Original metadata from page | **2675 × 2084 px**, 493,556 B; SHA-1 on page `0f895d77d5aef214ad0caaee13fbf0dafb11b5a0`. The original was subsequently downloaded for the owner-requested cleanup and its computed SHA-1 matched this value exactly (A-034). |
| Owner attachment | `1000168371.jpg`: **1280 × 997 px**, SHA-256 `8e58e9c2fa621e262e8a3053ed3d6f5e96ba08d6a64c4bfe2e7e1911c30f8e6e`. Matching filename/aspect/appearance suggests the case-1 preview; not byte-verified against original. Other two attachments are licence/info screenshots. |
| Suitability | Candidate only: pelvis and proximal femora visually present; R plus additional left-edge lettering/circular graphic remain. Formal coverage against p.279, image orientation and normality need review. Owner requested marker removal: A-035 changes background pixels only; no crop or anatomy reconstruction. |
| Decision | O84: review coverage and clinical suitability of A-034/A-035 before product adoption. A-035 removes R, lettering and circular graphic only in x=[0,96), y=[850,1300); 27,522 pixels changed; **0 pixels outside that background rectangle changed**. Lossless PNG, original resolution, no EXIF. Script: `scripts/derive-pelvis-baseline.py`. Both files remain under `assets/source/pelvis/`, not served. Any later missing-marker attempt must not show a burned-in marker. |

## 9. Generalisation mapping (S7-4)

| Mechanism | Assessment before code |
|---|---|
| SimulationSettings / controls | Pelvis rotation uses current numeric setting; discrete leg position could use existing choices (O82). No continuous second-angle field justified until chosen. |
| Categories/rules | Existing per-exam category keys and range/enum rules can express selected rubric. Values/weights remain decisions O81/O83. |
| ImageVariantId / EffectId | Open vocabularies already exist; new pelvic effect may need registration/model after O85. Do not invent a new generic architecture now. |
| CriticalFindingId | Open registry; selected findings only, O83. No implementation in this phase. |
| Console JSX / patient instructions | Generic choices already exist. Phase-neutral breath hold via choices may avoid a new breathing mechanism; modifying chest breathing semantics is not justified. O83 decides. |
| Scene | New pelvic art on current scene/layout/detector registries, not mirrored chest/ankle anatomy. |
| RadiographAssetSpec | Basic geometry already available; new pelvic landmark/model binding only if honest representation is feasible (O85). |
| Move to modalities/xray; migrate RadCase consumers | Not required by this reference; remain deferred. |

**Conclusion:** no blanket generalisation session approved. Resolve O81–O85, then decide whether an optional mechanism is actually missing. Generic choices and registries may cover the needed controls; independent continuous angles or a breath-response extension would be separate, scoped, byte-identical work **after this reference is merged**. No implementation gate is silently waived.

## 10. Open items

O81 numerical model/tolerances/protocol; O82 independent pelvis/leg controls; O83 rubric, breathing, marker and AEC scope; O84 image suitability/derivative; O85 honest one-image model/landmarks; O86 shielding currency. Definitions in [DECISIONS.md](DECISIONS.md). O37 (forearm) remains open and unimplemented.

## 11. Development rules

Reference must be merged into main before generalisation/implementation. Every future value needs a source or explicit teaching/owner label and review entry. No old test, golden, characterisation, hash, image or exam data changed in this phase. The only non-document additions are the owner-requested image review pair and its deterministic derivation script. Never reuse textbook images in the product. Existing exams must retain their outputs in any later refactor. No unrelated translation/UI fixes.
