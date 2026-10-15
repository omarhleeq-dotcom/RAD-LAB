# RAD-LAB — Medical Reference: Shoulder PA oblique, scapular Y lateral

**Purpose:** reference and Needs only, before code (S10-2).
**Scope:** adult scapular Y lateral shoulder, primary **PA oblique** technique described on Bontrager p.201. Owner supplied a Y link on2026-10-15 and explicitly limited work to docs/Bontrager data. Final erect/recumbent scenario not selected. Right side is an uploader statement. This adds a separate reference alongside Grashey; it does not replace its merged decisions. No Neer outlet, ordinary AP, axillary, diagnostic simulation or implementation.
**Use:** documentation, not a calibrated clinical protocol or approved grading specification.
**Status:** DRAFT; source claims `common-reference`, provisional pending O5. Decisions S-SHOULDER-Y-REF-1/2; O92–O94 in [DECISIONS.md](DECISIONS.md).

## 0. Honest summary of the evidence

- Read Bontrager9 **printed p.201, PDF221**, directly as text and visually from the owner's PDF already obtained through Drive; title/edition/ISBN checked in the previous source session. Book/page images remain outside Git. No text or figure reproduced.
- This is **PA oblique scapular Y lateral**, not Grashey (p.196), not Neer outlet. Body obliquity varies45°–60°; anatomical alignment determines a true lateral. The source warns against rotating the arm if fracture/dislocation is suspected. Neither the numerical angle nor an ideal midpoint alone proves correct positioning.
- Commons canonical page and official imageinfo API read2026-10-15. CC0 confirmed independently for **Y itself**. Description explicitly says **slightly skewed** and recurrent dislocation, not an ideal asymptomatic baseline. No original image bytes downloaded or imported in this phase, so no computed master checksum comparison.
- Attachments are one Y-description screenshot, one **Grashey** licence screenshot and the **same Grashey radiograph bytes** supplied earlier. The latter is not the Y candidate. This mismatch is recorded without relabelling or editing it.
- No mAs/EI/calibration, grade weights/critical list, numerical error bands, cm/px or validated one-image model on p.201. No values borrowed from Grashey/pelvis. Historical shielding not adopted; O86 remains. The discussion of a possible3D core is not implementation authorization or a design change in this phase.

## 1. Sources

### 1.1 Sources read

| ID | Citation/access | Supports | Sole support allowed? |
|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager’s Textbook of Radiographic Positioning and Related Anatomy*,9th ed. Elsevier2018, ISBN9780323399661. **p.201**, PDF221; text and visual page checked. [Source notes](sources/BONTRAGER-9.md). | Y positioning, warning, technique, image criteria | Yes for stated facts under S10b-25, provisional O5; no invented scoring/model values |
| R2 | [Commons file page](https://commons.wikimedia.org/wiki/File:Y-projection_X-ray_of_a_normal_shoulder.jpg), HTTP200 and official imageinfo API read2026-10-15 | Y licence/author/metadata and uploader description | Image evidence only, not a medical authority or confirmation of normality/optimal pose |
| R3 | Existing BONTRAGER-9 marker notes p.32–33, earlier advisor reading, not newly rechecked | General anatomical marker principle | No automatic Y display convention or critical gate |

Copyrighted book: paraphrased facts and printed locators only, no scans/figures committed. No student notes or Radiopaedia.

### 1.2 Missing inputs

| Input | Needed for | Open item |
|---|---|---|
| Matched original Y bytes and educator image review | Master checksum, orientation/side, markers, coverage, suitability of skewed baseline | O92; page/API available but original not downloaded in this reference phase |
| Local detector/grid/manual-AEC protocol | mAs/time/EI/attenuation, AEC/calibration | O93; not supplied |
| Educator/owner rubric and scenario | Erect/recumbent selection, controls, marker, critical list, tolerances and weights | O93; not supplied |
| Contemporary shielding guidance | Any modern shielding teaching | O86; not reviewed, not scored |

### 1.3 Leads

None. Neighbouring projections are not substituted for this one.

## 2. Classification

**A SOURCE-BACKED:** explicit p.201 facts, `common-reference`, provisional underO5. **B TEACHING CHOICE:** future model/geometry/tolerances (`educational-simplification` only once explicitly chosen). **C OWNER DECISION:** scenario/rubric/display, not selected here. **U unknown — source needed:** missing local protocol/rubric named in§1.2, no invented values. Reading a fact does not assign `validated` status.

## 3. Positioning

| Topic | Statement | Basis/status |
|---|---|---|
| Patient | Erect or recumbent; erect usually more comfortable | R1 p.201, A; no selected initial case |
| Body | Anterior oblique, patient facing detector. Align the line between superior scapular angle and AC articulation perpendicular to detector; obliquity may range **45°–60°** with patient variation | R1 p.201, A; not a universal angle/grade plateau or sign convention |
| Arm | Slight abduction if possible to keep proximal humerus off ribs; **do not attempt arm rotation**, particularly with suspected fracture/dislocation | R1 p.201, A; no degree target for abduction, no forced movement |
| Center | Scapulohumeral joint at CR/detector center; approximately **5cm below AC joint** | R1 p.201, A; different locator from Grashey's superolateral shoulder reference |
| CR | Perpendicular to detector, directed to that joint; grid centerline alignment | R1 p.201, A; do not borrow Neer caudal angulation |
| SID | Minimum **102cm** | R1 p.201, A; upper/full-credit/partial bounds not supplied |
| Respiration | Suspend respiration during exposure, no specific phase | R1 p.201, A; no chest inspiration response |
| Collimation | Four sides to area of interest | R1 p.201, A; no cm margin/engine rectangle supplied |
| Recumbent alternative | When condition requires, opposite AP oblique with injured shoulder elevated | R1 p.201 contextual alternative; not automatically in selected PA scope or inferred candidate acquisition |
| Marker | Anatomical side needs explicit convention; candidate described as right | R3/R2; later display/scoring choiceO93 |

## 4. Technique (digital radiography)

| Topic | Statement | Basis/status |
|---|---|---|
| Detector | **24×30cm portrait** | R1 p.201, A; not Grashey's landscape options |
| Grid | Vertical grid, CR aligned to centerline | R1 p.201, A; context, not authority to add a global grid control |
| kV | Digital **80±5kV**, arithmetic75–85kV; analog75±5kV context only | R1 p.201, A; partial-credit range not supplied |
| mAs/time/AEC | No numerical mAs/time or AEC chamber/calibration rule established on read page | U, local protocolO93; manual-only not source mandate |
| EI/EIT/DI | No numerical target/limit chosen | U O93; brightness is not exposure evidence |
| Exposure/motion | Sharp bony borders, scapular-body outline visible through proximal humerus, no motion | R1 p.201, A; no calibrated exposure index implied |
| Habitus | Body obliquity varies by patient; no numeric attenuation factor | R1 p.201 for positioning; U for quantitative exposure |
| Shielding |2018 instruction is historical source context only | O86, no product/scoring rule adopted |

## 5. Conventions and owner decisions

- O93: choose scenario/posture, arm options that respect safety, respiration assessment, manual/AEC scope, side/display convention, weights/pass mark and critical findings. Do not copy Grashey's erect-only decision or limb rubric.
- O94: body angle is absolute obliquity versus residual rotation error; define representation/sign later. The45°–60° source range describes inter-patient variation. It does **not** establish that every angle gives equally correct positioning for one patient, nor an ideal52.5°.
- O92: a page labelled “normal” but described as “slightly skewed” with recurrent-dislocation history cannot be silently adopted as an ideal answer image. Review, select another image, or explicitly document a nonideal baseline and its limits before code. No arbitrary “correction” by guessed image rotation.
- Grashey decisions S-SHOULDER-2-1…7 remain specific to Grashey. They do not pass Y's independent model/positioning gate.

## 6. Image quality and rendering

| Criterion/effect | Source statement / limit | Status |
|---|---|---|
| Coverage | True lateral scapula, proximal humerus and scapulohumeral joint | R1 p.201, A; image-specific bounds O92/O93 |
| Scapular body | Thin body seen on end without rib superimposition | R1 p.201, A |
| Y shape | Acromion/coracoid nearly symmetric upper limbs ofY | R1 p.201, A |
| Head alignment | Head superimposed at base ofY **if not dislocated** | R1 p.201, A; cannot universally score displacement as positioning error independently of pathology |
| Diagnostic context | Page describes head below coracoid in anterior dislocation, below acromion in posterior dislocation | R1 p.201, context only; no diagnostic case/detector or simulated dislocation authorized |
| Exposure/motion | §4 criteria | A; generic blur/noise only as labelled teaching approximations |
| Rotation model | Scapula/humerus/ribs overlap and Y symmetry need truthful representation; one image hides anatomy | O94 gate not passed; no inherited Grashey joint-closure model |
| Chest effects | No lung expansion/chest scapular displacement/chin effects | Omit them; phase-neutral breath suspension does not deform shoulder |

**Do not implement as clinical truth:** fabricated fracture/dislocation, moving the head to create a diagnosis, arbitrary second bone surfaces, an ideal unskewed baseline claimed from this candidate, brightness-based exposure, or guaranteed accuracy at every45°–60°. Report feasibility limits before any renderer/model work.

## 7. Arabic terms (proposed)

DRAFT, machine-assisted pending educator/Arabic review: scapularY lateral=الإسقاط الجانبي للوح الكتف على شكلY؛ PA oblique=إسقاط خلفي أمامي مائل؛ acromion=الأخرم؛ coracoid process=الناتئ الغرابي؛ superior/inferior scapular angle=الزاوية العلوية/السفلية للوح الكتف؛ AC joint=المفصل الأخرمي الترقوي؛ scapulohumeral joint=المفصل الكتفي العضدي. [Terminology](ARABIC_TERMINOLOGY.md). No UI strings changed.

## 8. Needs (complete assessment; unresolved inputs explicitly named)

Compared with Chest PA and current limb/pelvis mechanisms. Every mark is **same**, **differs**, **new**, or **unknown — source needed**. Complete assessment does not mean approved implementation.

### 8.1 Controls

| Current/PA | Y requirement | Mark | Mapping/input |
|---|---|---|---|
| Projection/body part | Separate Y projection/shoulder exam | new | Future registry data; nothing registered now |
| Rotation | Anterior obliquity, patient-specific45°–60° context | differs | Existing numeric range/possible local offset; representation/signO94 |
| Arm/chest shoulders | Slight abduction as tolerated, no arm rotation | differs | Existing choices can express positioning; omit chest rolled-forward controls;O93 |
| CR/collimation/SID/kV/mAs | Generic controls, different source targets/geometry | differs | §3–4;O93 local model/protocol |
| Optional tube angle | Perpendicular | same | Existing mechanism; tolerances undecided |
| Breathing | Phase-neutral suspension | differs | Pelvis exam-specific choice precedent, no lung response |
| Keep still | Independent instruction/response | same | Existing motion mechanism; assessment policyO93 |
| Posture | Erect or recumbent source possibilities | differs | Initial case not selected; AP alternative separate scope decision |
| Grid/AEC | Grid context; AEC/calibration missing | unknown — source needed | Local DR protocol§1.2,O93 |

### 8.2 Categories

| PA | Y | Mark | Note |
|---|---|---|---|
| Positioning/rotation/centering/exposure/SID | Concepts relevant, new anatomical rules | differs | Per-exam configuration exists;O93 |
| Inspiration | Breath suspension, no lung criterion | differs | Existing custom category possible; not selected |
| Weights/pass mark | Not selected | unknown — source needed | Educator/owner rubric§1.2,O93 |

### 8.3 Critical findings

| PA | Y | Mark | Note |
|---|---|---|---|
| Critical gates | Exact list not selected | unknown — source needed | Rubric§1.2,O93; no inherited critical list |
| Dislocation/safety | Head alignment is conditional; no forced arm rotation | differs | Reference warning only; no synthetic diagnostic detector |

### 8.4 Effects

| Current | Y | Mark | Note |
|---|---|---|---|
| Clipping/noise/motion | Generic mechanisms potentially reusable | same | Reconfigure source geometry, no pixel-based scoring |
| Lung/jaw/chest effects | Omitted | differs | Not Y anatomy |
| ScapularY and humeral overlap | Independent visual feasibility | new | O94; no existing validatedY model |

### 8.5 Scene

| PA | Y | Mark | Note |
|---|---|---|---|
| Thorax drawing | Body obliquity and scapulaY/humerus/ribs, separate arm pose | new | Existing scene/layout/style registry sufficient structurally |
| Detector |24×30 portrait | differs | Data supports it; no global rewrite |
| Guides/alt/accessibility | Same requirements | same | Later EN/AR browser/axe/label audit if code authorized |

### 8.6 Landmarks

| PA field | Y | Mark | Note |
|---|---|---|---|
| anatomyBox/projection/scale | New source-specific geometry | differs | O92/O93; no coordinates/cm-per-pixel selected |
| Lung/jaw/chest groups | Omitted | differs | Already optional; no accidental midline-triggered chest effect |
| Y landmarks/model | Scapula/acromion/coracoid/humerus relationship | new | O94 feasibility first, not fabricated hidden anatomy |

### 8.7 Case fields

| Field | Y | Mark | Note |
|---|---|---|---|
| Patient/order/provisional/initial | Existing schema | same | No case authored; uploader male31/right/history remains attributed |
| Technique/cooperation | New protocol, no inspiration response | differs | O93 local calibration; breath neutral |
| Baseline | Y candidate separate from attachedGrashey | new | O92; source explicitly nonideal |

### 8.8 Assets (no image fetched/imported in reference phase)

| Item | Verified information / limit |
|---|---|
| Canonical URL | <https://commons.wikimedia.org/wiki/File:Y-projection_X-ray_of_a_normal_shoulder.jpg>; page/API HTTP200 read2026-10-15 |
| Author/date/source | Mikael Häggström;27August2017; own work, as recorded by Commons |
| Licence | **CC0 1.0**, independently verified on Y file page/API; commercial use/modification/redistribution permitted, no required attribution; voluntary credit appropriate |
| Metadata | API reports1546×2269px,645433bytes, SHA-1 `3c14918e35e543793853568a9b92484f4e0d03b7`. **Published metadata only**, not a computed downloaded-master match |
| Uploader description | Slightly skewedY, right shoulder, man31 with recurrent dislocation; no visible skeletal/soft-tissue abnormalities reported; rotator-cuff dysfunction not seen. No claim of asymptomatic normality |
| Attachments |1000170780.jpg is Y-description screenshot.1000170774.jpg licence screenshot title is Grashey.1000170773.jpg is byte-identical to prior Grashey attachment: SHA-256 `48642ce1755e37a07e5db49c12869ccbca118888169a14b067af5a8d7e16e5b5` |
| Processing/adoption | None. No download of originalY, asset import/A-id, pixel cleanup/correction or served copy; suitability and original markers/coverage not independently inspectedO92 |

## 9. Generalisation mapping

| Item | Assessment |
|---|---|
| Settings/controls | Existing numeric/choice mechanisms plausibly suffice; body-angle conventionO94; no new global field justified |
| Categories | Existing per-exam category mechanism; rubricO93 |
| Image variants/effects | Generic blur/noise/clipping available; independent model honesty gateO94 before new effects |
| Critical registry | Exists; no new detector justified before policy |
| Console JSX | Existing data-driven controls; no speculative rewrite |
| Scene art | New exam-localY scene; not a new rendering framework |
| Landmark groups | Optional groups suffice structurally; actual model/asset still unresolved |
| modalities/xray move / RadCase migration | Not needed; deferred |

No generalisation authorized. Discussion of3D/DRR does not change current architecture or authorize code. Any real shared gap needs separate scope after merged reference.

## 10. Open items

O92 Y-image/skew/suitability/master and mismatched attachments; O93 scenario/protocol/rubric/marker/geometry; O94 independent body-angle and model feasibility. O5 clinical/Arabic and O86 contemporary shielding remain. GrasheyO88/O89/O91 unaffected; itsO87 verification stays closed as recorded inPR#37.

## 11. Development rules

Docs only per current owner request. Reference must merge before later implementation; even after merge, no code without new owner direction. No automatic shoulder series or shared3D engine. Never invent medical facts/targets, reuse textbook figures, relabel Grashey asY, or correct skew by guessing. Keep existing exams/images/tests untouched.

## 12. Settlement before code — RAD-036 gates (2026-10-15, docs only; **result: STOPPED, nothing built**)

Two gates were required before any code. Neither passed; no exam, asset, model or test was added. Decisions: S-SHOULDER-Y-1…5; open items O92 (updated), O94 (updated), O97 (new) in [DECISIONS.md](DECISIONS.md).

### 12.1 Gate 1 — image (O92): NOT settled

- Original downloaded from the official upload URL (`upload.wikimedia.org`, after the Commons API and `Special:FilePath` returned HTTP 429 twice; one pause and a direct retry, then stop). Computed **SHA-1 `3c14918e35e543793853568a9b92484f4e0d03b7`** (equals the value the API reported on the earlier read, §8.8; the API itself could not be re-queried today), **SHA-256 `87bc9e6e5c65f5b39e3b98a233e9d0e9808205c812b2e2a4d5897081c761d051`**, 645,433 bytes, 1546×2269 px, JPEG. Kept in a scratch directory only; **nothing imported, no A-id**.
- Visual observations (not a clinical assessment; educator must judge): a burned-in marker **"Dx"** in the dark air region at the upper left (≈ x 240–320, y 215–300 px) and a **tiny letter fragment at the right edge over the thorax** (≈ x 1536–1546, y ≈ 1240). Frame covers clavicle, acromion, humeral head and shaft, scapular blade and ribs. The picture does **not** read as a clean, symmetrical Y: the clavicle runs across the top almost en face, the scapular blade is wide and overlapped medially by ribs, and the humeral head lies lateral to the blade rather than clearly at a Y fork. This agrees with the uploader's "slightly skewed". The file name says "normal" while the description gives recurrent dislocation.
- Consequence: the unchanged image cannot be presented as "correct Y", and a result image that never shows a Y error cannot be claimed to teach one. Removing "Dx" from air is possible by the pelvis A-035 precedent (pixel edit confined to a uniform region, documented); the edge fragment lies on soft-tissue texture and would be retouching over anatomy-like pixels. **No pixel rotation to correct the skew.**
- The owner's prompt left the image choice (A = use this candidate as a documented non-ideal baseline / B = propose alternatives) and the marker choice unfilled, so neither was assumed. A single standard web search found no CC0 / public-domain / CC BY clean Y radiograph (Netter images are all-rights-reserved, Radiopaedia is excluded by S10-3); Commons itself could not be searched because of the rate limit.

### 12.2 Gate 2 — model honesty (O94): NOT passed

Throw-away prototype outside the repository (numpy band warps on the original; nothing committed):

| Candidate cue | Result | Verdict |
|---|---|---|
| Widen / narrow the scapular blade (horizontal stretch of a band around the blade) ×1.3 / ×0.75 | The band necessarily contains the humeral shaft and the rib overlap, which are the very structures superimposed on the blade: the shaft kinks, ribs stretch or squash. Narrowing below the baseline would fabricate an on-end (thin) scapula that the picture does not contain | Not honest |
| Spread / squeeze the Y arms (acromion vs coracoid) | Arms are superimposed on the clavicle and ribs; moving them changes clavicle length and bends the Y, not a rotation effect | Not honest |
| Shift the humeral head off the Y base | Reads immediately as a subluxation / dislocation; source says head alignment is conditional on "not dislocated" and may not be treated as a positioning error | Forbidden (O94, §6) |

The starting rotation of the baseline is unknown and its direction of error unknown, so even a monotone cue would be relative to an unknown zero. **No single truthful cue exists from this one image.** The inherited Grashey joint-closure idea does not apply (different anatomy).

### 12.3 Options for the owner (nothing implemented until chosen)

1. **Feedback-and-scene only (image never changes).** Build `shoulder-y-erect` with the body angle scored by feedback and the setup drawing, the radiograph identical for every angle (arm precedent: S-SHOULDER-2-5), baseline accepted explicitly as non-ideal with labelled limits, "Dx" removed from air. Feasible, but it departs from the product rule that results show the error and teaches little on the image side. Requires the owner to answer the marker and image questions and to accept that departure.
2. **Another image.** Owner supplies, or approves a candidate for, a clean CC0 / public-domain / CC BY Y radiograph (recipe §5: no markers, devices or disease), then Gate 1 and Gate 2 repeat on it. A cleaner Y might still fail Gate 2.
3. **Defer Y** and continue with another exam.

**Recommendation: option 3 unless the owner can supply a clean licensed Y; if the owner wants progress now, option 1 with the limits above.**
