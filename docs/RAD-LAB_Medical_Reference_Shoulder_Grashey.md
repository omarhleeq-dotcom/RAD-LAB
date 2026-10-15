# RAD-LAB — Medical Reference: Shoulder AP oblique, glenoid cavity (Grashey)

**Purpose:** reference and complete Needs assessment before implementation (S10-2).
**Scope:** one adult, non-acute-trauma shoulder projection: AP oblique for the glenoid cavity, Grashey method. Owner selected shoulder on 2026-10-15; this narrower reference scope matches the attached description. Right side is reported by the uploader, not independently established from pixels. Erect versus supine implementation is undecided. Ordinary AP internal/external rotation, scapular Y, axillary, other shoulder views and code are excluded.
**Use:** documentation only; not a clinical protocol or approved scoring specification.
**Status:** merged to main (PR #36, 2026-10-15); `common-reference`, clinical claims provisional pending educator/physicist review O5. Decisions/open items: S-SHOULDER-REF-1, S-SHOULDER-2-1…7, O87–O91 in [DECISIONS.md](DECISIONS.md). **§12 (2026-10-15, after merge)** records the image match and the posture / simulation-limit settlement made before any code.

## 0. Honest summary of the evidence

- Read **Bontrager 9, printed p.196 (PDF page216)** directly from the owner's complete PDF already obtained through Drive; text and page visually checked. Edition/ISBN were checked during the pelvis phase. The PDF and rendered page stay outside Git. No book text or figure is reused.
- p.196 supplies Grashey setup, technique and quality criteria. It is **not an ordinary unrotated Shoulder AP**: the body turns 35°–45° toward the affected side; arm position is separate. Anatomy/erect-versus-supine changes the rotation required to make the scapular body parallel to the detector.
- The three attachments are **one radiograph plus two screenshots**, not three projections. Screenshot description says AP glenoid/Grashey, right shoulder, man31 with recurrent dislocation; it reports no visible skeletal/soft-tissue abnormality and says the rotator-cuff dysfunction is not seen. These are uploader statements, not a new diagnosis or evidence of an asymptomatic normal volunteer.
- Licensing screenshot states CC0 1.0 and author Mikael Häggström, own work, dated27August2017. The exact title/URL is truncated. Commons API discovery returned HTTP403; no bypass attempted. At reference time the Commons API and file page returned HTTP 403/429 and the match was open. **Closed after the merge (§12.1):** the canonical page and the official API were read, the original was downloaded outside Git and its SHA-1 equals the SHA-1 Commons declares (O87 identity/licence/master). No image is in Git or served.
- No scoring weights, critical-finding list, numerical error bands, mAs/EI calibration, image scale or validated single-image shoulder rotation model supplied by p.196. No numbers copied from pelvis/limbs. Historical shielding wording is not adopted as current guidance (O86).

## 1. Sources

### 1.1 Sources read

| ID | Citation/access | Supports | Sole support allowed? |
|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager’s Textbook of Radiographic Positioning and Related Anatomy*, 9th ed. Elsevier2018, ISBN9780323399661. **Printed p.196**, PDF216; directly read and visually checked. [Notes](sources/BONTRAGER-9.md). | Grashey positioning, digital technique and image criteria | Yes for stated facts, provisional under O5; not inferred tolerances/rubric. |
| R2 | Owner attachments1000170774.jpg (licence),1000170773.jpg (radiograph),1000170771.jpg (description). Screenshots read2026-10-15. | Candidate provenance/CC0 declaration and uploader description only | No medical positioning, scoring or diagnostic authority; canonical matching pending O87. |
| R3 | Existing BONTRAGER-9 source notes p.32–33: anatomical marker principles, earlier advisor reading, not re-read here | General marker requirement/context | No shoulder-specific viewer-half or critical gate inferred. O89. |
| R4 | Wikimedia Commons file page and official API (`prop=imageinfo`), read 2026-10-15 (§12.1); original downloaded to a scratch directory outside Git | File identity, author, licence template, size, upload history, SHA-1; observations of the image itself (§12.2) | Identity / licence only. Not a positioning, scoring or diagnostic authority. |

R1 is all rights reserved: paraphrase facts with printed-page citations only. No student summaries, Radiopaedia, copied figures or scans in product/Git.

### 1.2 Missing inputs / not read

| Input | What it settles | Status |
|---|---|---|
| Exact Commons file page/original metadata | Bind screenshot to exact original, licence and identity; inspect full coverage/graphics | **Done 2026-10-15 (§12.1–12.2)**; clinical-context review of the full original stays O91 |
| Local DR/grid/manual or AEC protocol, educator/physicist review | mAs/time, AEC/chambers, EI/EIT, attenuation/calibration | Not supplied; O88/O89 |
| Shoulder assessment rubric/owner convention | Numeric tolerances, weights, critical findings, side/display, selected posture | Not supplied; O88/O89 |
| Contemporary shielding guidance | Current patient-shielding teaching | Not reviewed; O86, outside scoring |

### 1.3 Leads

None. No search snippets treated as sources. Other shoulder pages/views were not used to populate this exam.

## 2. Classification

- **A SOURCE-BACKED:** stated facts on p.196; evidence class `common-reference`, always provisional pending O5, never `validated` solely because read.
- **B TEACHING CHOICE:** a future simulator's scale, geometry, angle sign/model, tolerances and numerical exposure model; not selected here (`educational-simplification` when explicitly adopted).
- **C OWNER DECISION:** scenario/posture, display convention, assessment policy and weights; pending O89.
- **U unknown — source needed:** local protocol values with missing input named in §1.2. No implementation and no invented values. `vendor-protocol-dependent`/`provisional` apply only with an identified basis.

## 3. Positioning

| Topic | Statement | Basis/status |
|---|---|---|
| Patient | Erect or supine; erect may be less painful if condition permits; supports under raised shoulder/hip when recumbent | R1 p.196, A; one initial scenario undecided O89 |
| Body rotation | Rotate **35°–45° toward affected side**, making scapular body parallel to detector. Rounded shoulders and recumbency may need more rotation. Right-side illustration is RPO | R1 p.196, A; neither a ±error tolerance nor universal ideal40°. Numeric sign/absolute-versus-offset mapping O90 |
| Arm | Slight abduction, flexed arm, neutral rotation | R1 p.196, A; **no numeric abduction/flexion angle supplied**. Do not substitute ordinary AP external-rotation positioning |
| Center | Scapulohumeral joint; about **5cm inferior and5cm medial** to superolateral shoulder border | R1 p.196, A; pixel target/allowance not supplied |
| CR | Perpendicular to detector, centered to joint | R1 p.196, A; no scored angle bands supplied |
| Detector placement | Top about5cm above shoulder; lateral edge about5cm from lateral humerus | R1 p.196, A; not an engine excess-collimation threshold |
| SID | Minimum **102cm** | R1 p.196, A; no maximum/full-credit upper bound on this page |
| Respiration | Suspend respiration during exposure; no specified inspiration/expiration phase | R1 p.196, A; use no chest inspiration model |
| Collimation | Upper/lateral field borders at soft-tissue margins; region of interest included | R1 p.196, A; remaining rectangular engine bounds and cm margins require O88/O91 |
| Marker | An anatomical marker must be addressed; candidate described as right | R3 and R2; C pending O89; do not infer side from absent marker |

## 4. Technique (digital radiography)

| Topic | Statement | Basis/status |
|---|---|---|
| Receptor | **18×24cm or24×30cm, landscape** | R1 p.196, A; choose one explicitly later. Portrait attachment does not redefine source receptor orientation |
| Grid | Grid specified | R1 p.196, A; protocol context need not add a new global grid control |
| kV | Digital **80±5kV**, arithmetic interval75–85kV. Analog75±5kV is context only | R1 p.196, A; no partial-credit range inferred |
| mAs/exposure time | No number on this page | U, local protocol O88; no clinical mAs recommendation |
| AEC | No chamber/calibration rule established from p.196 | U, local protocol O89; manual-only is a possible later simplification, not source mandate |
| EI/EIT/DI | No numerical targets or universal thresholds selected | U O88; brightness never an exposure indicator |
| Exposure/motion quality | Sharp trabeculae, visible soft-tissue margins and joint-space/axillary detail without motion | R1 p.196, A; qualitative, not a universal numerical exposure limit |
| Habitus | Positioning varies with shoulder shape; no numeric attenuation factor | R1 p.196 for positioning only; exposure calibration U O88 |
| Shielding | Historical2018 recommendation not adopted as current protocol/control | O86, not scored |

## 5. Conventions and open owner decisions

O89: choose initial erect or supine adult scenario and detector size, manual/AEC scope, marker policy and display convention, categories/weights/critical list. Right-only fixed-side marking is an existing option; it still needs an explicit decision and matched source laterality. Do not interpret p.196's illustrated marker position as a universal viewer-half rule for oblique shoulder.

O90: distinguish **absolute body obliquity35°–45°** from residual error around an adopted pose. The foot oblique precedent shows an absolute value can use existing numeric controls plus an exam-local offset; this is implementation precedent, not authority to select40° or a sign. Arm posture is separate, probably representable by `choiceControls`. Do not use one slider for both. Report model limits before choosing scoring/visual feedback.

## 6. Image quality and result rendering

| Criterion/effect | What is supported / limit | Basis/status |
|---|---|---|
| Glenoid profile | Glenoid in profile without humeral-head superimposition | R1 p.196, A |
| Joint space | Open scapulohumeral joint; anterior/posterior glenoid rims superimposed | R1 p.196, A; no numeric pixel-width rule supplied |
| Coverage | Region of interest with upper/lateral collimation per §3; soft tissues/joint/axilla visible | R1 p.196, A; candidate full coverage O91 |
| Motion/exposure | Sharp bony/soft-tissue detail per §4 | R1 p.196, A; generic blur/noise only as labelled approximations |
| Rotation/arm effects | A single Grashey image does not reveal hidden surfaces or establish truthful glenoid-rim/humeral occlusion changes | O90; gate result in §12.4: **passed with labelled limits for ONE cue (joint-space closure)**; rim superimposition and arm-pose effects are not drawn |
| Chest effects | Lung expansion, chest scapular displacement, chin or jaw mechanisms do not describe this exam | Omit them; breath instruction does not deform shoulder anatomy |

**Do not implement as clinical truth:** fabricated fracture/dislocation/rotator-cuff damage, hidden glenoid or humeral surfaces, brightness-based exposure, a fake deep-inspiration target, or a universal40° optimum. If one-image rotation cannot honestly show the scored criterion, report the limitation/options before code; do not silently label an arbitrary warp as validated.

## 7. Arabic terms (proposed)

Machine-assisted DRAFT, pending educator/Arabic review: shoulder=الكتف; AP oblique (Grashey)=الإسقاط الأمامي الخلفي المائل للكتف (غراشي); glenoid cavity=الجوف الحقاني; glenoid rim=حافة الجوف الحقاني; scapulohumeral joint=المفصل الكتفي العضدي; humeral head=رأس العضد; scapular body=جسم لوح الكتف; neutral arm rotation=دوران محايد للذراع; suspend respiration=حبس النَّفَس أثناء التعريض. [Terminology](ARABIC_TERMINOLOGY.md). No UI strings changed.

## 8. Needs (complete assessment; unresolved inputs named)

Compared with Chest PA and merged limb/pelvis mechanisms. Each row has exactly one mark: **same**, **differs**, **new**, **unknown — source needed**. Assessment complete does not mean every decision is resolved or code authorized.

### 8.1 Controls

| PA/current item | Grashey need | Mark | Mapping/input |
|---|---|---|---|
| Projection/body part | Shoulder Grashey registration | new | Registry entries only in later code |
| Rotation | Absolute body obliquity35°–45°, varying with anatomy/posture | differs | Existing numeric range + optional local offset precedent; no new global setting demonstrated. O90 |
| Arm/shoulder | Slight abduction, flexed arm, neutral rotation | differs | Exam-declared choices can separate this from body turn; chest rolled-forward control inappropriate. O89/O90 |
| CR/collimation/SID/kV/mAs | Generic controls, source-specific targets and asset geometry | differs | §3–4; unspecified numeric model O88 |
| Tube angulation | Perpendicular | same | Existing optional mechanism; source does not define grading bands |
| Breathing | Phase-neutral suspension | differs | Pelvis `choices.respiration` precedent; no need to extend chest BreathingId |
| Keep still | Instruction/response for motion | same | Existing independent motion mechanism, policy O89 |
| Posture | Erect versus supine initial case | differs | Choice only if both are explicitly in later scope; no new patient-state engine assumed |
| Grid/AEC | Grid context; manual/AEC calibration unresolved | unknown — source needed | Local DR protocol §1.2, O88/O89 |

### 8.2 Scoring categories

| PA | Grashey | Mark | Note |
|---|---|---|---|
| Positioning/rotation/centering/exposure/SID | Relevant, different source rules | differs | Exam-declared categories already available; O88 for bands |
| Inspiration category | Breath suspension without lung-expansion scoring | differs | Existing pelvis custom respiration category is precedent |
| Weights/pass mark | Not selected | unknown — source needed | Educator/owner rubric §1.2, O89 |

### 8.3 Critical findings

| PA | Grashey | Mark | Note |
|---|---|---|---|
| Critical gates | Exact list not selected | unknown — source needed | Educator/owner rubric §1.2, O89; no copied marker/wrong-projection/trauma gate |
| Acute trauma/pathology | Excluded scenario | differs | No synthetic diagnosis or rotator-cuff detector |

### 8.4 Image variants/effects

| PA/current | Grashey | Mark | Note |
|---|---|---|---|
| Clipping/noise/motion | Generic effects potentially reusable | same | New geometry/technique required; never score pixels |
| Chest lung/scapula/jaw effects | Omitted | differs | Not shoulder projection modelling |
| Body/arm rotation cues | New shoulder-specific visual feasibility assessment | new | O90, not a claimed mechanism gap or approval to warp |

### 8.5 Positioning scene

| PA | Grashey | Mark | Note |
|---|---|---|---|
| Thorax scene | Shoulder/scapula/humerus and body obliquity, independent arm pose | new | Existing scene/layout/style registration; honest anatomical cues needed |
| Detector | Landscape18×24 or24×30 | differs | Existing dimensions support both, O89 selection |
| Bilingual guides/alt/labels | Existing accessibility requirements | same | Later browser/axe/collision audit |

### 8.6 Landmark groups

| PA field | Grashey | Mark | Note |
|---|---|---|---|
| Asset projection/size/anatomyBox | Source-specific shoulder coverage/geometry | differs | O87/O91 original missing; no scale/CR pixels chosen |
| Lung/jaw/chest scapula groups | Omitted | differs | Already optional; never trigger chest midline effects accidentally |
| Shoulder effect landmarks | Glenoid/humerus/scapula feasibility needed | new | O90, no reused pelvis anatomy/model |

### 8.7 Case fields

| Field | Grashey | Mark | Note |
|---|---|---|---|
| Patient/order/initial/provisional | Existing case shape | same | No case authored; uploader male31/recurrent dislocation must remain attributed, O91 |
| Technique/cooperation | Shoulder calibration and no inspiration response | differs | Local protocol §1.2, O88/O89 |
| Baseline | One unverified candidate, not adopted | new | O87/O91 |

### 8.8 Assets (none fetched or added in reference phase)

| Item | Evidence/status |
|---|---|
| Candidate | Owner radiograph1000170773.jpg,848×1280; screenshots1000170774.jpg/1000170771.jpg,616×1280 each |
| Licence/author/date | CC0 1.0; Mikael Häggström; own work;27August2017 **as shown by owner screenshots**, not independently reverified |
| Projection/clinical context | Screenshot says AP glenoid/Grashey, right shoulder, man31, recurrent dislocation and no visible abnormality; not an asymptomatic-normal claim |
| Exact URL/master | Owner supplied exact canonical title/link below; verified against the Commons page and API on 2026-10-15 (§12.1) |
| Owner-supplied canonical URL | <https://commons.wikimedia.org/wiki/File:Anteroposterior_glenoid_(Grashey_view)_X-ray_of_a_normal_shoulder.jpg>; supplied 2026-10-15; read independently on 2026-10-15 (§12.1) |
| Pixel processing | None. No cleanup, rotation, crop or public copy. No obvious marker visible in supplied radiograph; original not checked, so absence unconfirmed |
| Product suitability | Coverage, image orientation, anatomical side and clinical context require educator/owner review O91 |
| Registry | Attachment SHA-256 `48642ce1755e37a07e5db49c12869ccbca118888169a14b067af5a8d7e16e5b5`; checksum identifies attachment only, not Commons master. **Verified master (§12.1): SHA-1 `74f436796ab839c9edd89ebbebfd08598c5e8337`, SHA-256 `16927a1303eca61691e1048c3c2545bd4bd44df2060f11fd04b7315658d4c9d4`, 641,341 bytes, 1193×1800.** No A-id allocated: nothing imported into the repository yet. Register verified master/derived assets together in the implementation phase |

## 9. Generalisation mapping

| Item | Assessment |
|---|---|
| SimulationSettings/controls | Existing numeric/choice controls plausibly suffice; absolute/offset rotation representation O90. No proven need for a new global field |
| Categories | Per-exam categories already support concept set; exact rubric pending O89 |
| ImageVariantId/EffectId | Generic clipping/noise/blur exist; honest shoulder model gate O90 before new effect declarations |
| Critical registry | Mechanism exists; no new detector justified before an approved list |
| Console JSX | Existing data-driven choices; no speculative rewrite |
| Scene art | New exam-specific scene, not a generic scene framework |
| Asset landmarks | Optional groups suffice structurally; anatomy/model still need evidence/feasibility |
| modalities/xray move / migrate RadCase | Not required; deferred |

No independent generalisation work is justified by this phase. If later feasibility reveals a real shared mechanism gap, scope it separately **after this reference merges** and preserve prior behaviour.

## 10. Open items

O87 identity/licence/master **closed** (§12.1; import and re-verification before release remain); O88 numeric protocol/tolerances/geometry; O89 posture/arm/respiration **settled** (§12.3), detector size / marker / rubric / critical list / manual-AEC open; O90 honesty gate **passed with labelled limits** (§12.4), numbers open; O91 clinical context / coverage / laterality: observations in §12.2, clinical review open. O5 medical/Arabic review and O86 contemporary shielding remain. Source gaps named in §1.2; no guesses.

## 11. Development rules

Reference/Needs must merge to main before code. No unrelated fixes or edits to old goldens/hashes/data. Clinical claims remain provisional; teaching choices clearly labelled and listed in REVIEW_PACKAGE. New assets require master/provenance/derivation records before product use. Keep anatomy unmirrored in Arabic. Next phase resolves image identity and remaining scope/model choices; it does not automatically implement a full shoulder series.

## 12. Settlement before code (2026-10-15, after the merge of this reference in PR #36)

Docs-only phase. No application code, no registry / scene / asset change, nothing imported into Git. The numbers below were *measured on the downloaded original in a scratch directory outside Git*; the by-eye statements are labelled as such. Decisions: DECISIONS.md S-SHOULDER-2-1…7.

### 12.1 Image identity — verified (closes O87)

| Item | Result (read 2026-10-15) |
|---|---|
| File page | `File:Anteroposterior_glenoid_(Grashey_view)_X-ray_of_a_normal_shoulder.jpg` — HTTP 200 (the earlier 403 / 429 did not recur) |
| Licence | Commons page carries the **CC0 1.0 Universal Public Domain Dedication** template; category `CC-Zero`; owner screenshot agrees |
| Author / source / date | Mikael Häggström; "Own work"; **27 August 2017** (creation date). Single file version, uploaded 21 December 2017 09:54 UTC, no re-uploads |
| Description (page wikitext) | projectional radiograph of the **right shoulder of a 31-year-old man with recurrent shoulder dislocation**; "no skeletal or soft tissue abnormalities (the malfunctioning rotator cuff is not seen)" — identical to the owner's screenshot |
| Original file | 1,193 × 1,800 px, JPEG (JFIF, 96 dpi, no EXIF), **641,341 bytes**; the owner's 848 × 1280 attachment is the same aspect ratio (a downscaled view) |
| Checksums of the original | **SHA-1 `74f436796ab839c9edd89ebbebfd08598c5e8337` = the SHA-1 declared by the Commons API for the current version** (`prop=imageinfo`, same size and dimensions); SHA-256 `16927a1303eca61691e1048c3c2545bd4bd44df2060f11fd04b7315658d4c9d4` |
| Not possible here | A byte comparison with the owner's own attachment (the attachment is a screenshot and is not in this environment) |

The file *name* says "normal shoulder" while the *description* says recurrent dislocation. The product must not call the patient normal or asymptomatic (O91).

### 12.2 Observations on the original (by eye plus simple pixel statistics; **not** a clinical assessment)

| Observation | Consequence |
|---|---|
| Humeral head, glenoid, acromion, coracoid, lateral clavicle and the proximal humeral shaft are in the frame; the frame ends in mid-shaft, so the **lower scapular body is not in the frame** | A "scapular body parallel to the detector" cue cannot be drawn or checked on this image |
| After contrast enhancement the joint shows an **open dark crescent between the humeral head and one curved glenoid line** (no second rim line); this agrees with the p.196 criteria as the owner's image | Usable as the zero-error (criteria met) picture; whether the glenoid is "truly in profile" is an educator judgement (O91 / O5) |
| Anatomy is consistent with a **right shoulder in AP display** (humerus on the viewer's left, clavicle / coracoid toward the right) | Supports the uploader's side; the side must still live in one place (`markerRule.side`) |
| No marker or burned-in text found in the four corners (bright-pixel scan; not exhaustive) | An interactive marker overlay or a fixed-side rule is still needed (O89) |
| The **right dark margin is a straight line tilted about 11–13° from the vertical** (fitted on the five rows where the margin lies inside the frame) | The frame is probably a rotated / cropped copy or an oblique collimator field, not a raw detector frame: collimation and excess-margin scoring must be defined by eye over the exposed region and labelled so (O88) |
| A darker, noise-bearing plateau with sharp curved borders lies below the glenoid neck (local high-pass noise 10 vs 10–14 in neighbouring bone, so it is **not** noise-free retouching) | No retouching evidenced; the statistic does not prove absence; its flat upper contour is flagged for the educator (O91) |
| The patient's posture (erect or supine) at acquisition is **not stated and not visible** | The case text must not state a posture for the baseline person |

### 12.3 Posture and control scope — settled (S-SHOULDER-2-3, -4, -5)

- **Initial scenario: erect only.** p.196 allows erect or supine and says erect may be less painful; supine adds a support under the shoulder / hip and "may need more rotation" with **no number**, so offering both would force an invented mapping. Supine is deferred until a source or owner rule gives the extra rotation.
- **Body obliquity** is ONE numeric console control showing the **absolute angle toward the affected side** (foot-oblique precedent: absolute value + exam-local offset). The source band **35°–45°** is the full-credit interval and is an equal-credit plateau: **no 40° optimum**. Partial-credit margins and the control's range are engine teaching choices to be set and labelled in RAD-033, not here.
- **Arm posture** is a separate `choiceControls` entry, independent of the body angle. The only source-backed value is "neutral rotation, slight abduction, flexed elbow"; the other options are teaching distractors and have **no image effect** (S-SHOULDER-2-5).
- Respiration stays phase-neutral suspension (pelvis precedent); keep-still keeps the existing independent motion mechanism. Detector size, marker policy, weights, critical list and manual-versus-AEC stay open (O88 / O89).

### 12.4 Honesty gate for the one-image rotation cue (O90) — passed with labelled limits (S-SHOULDER-2-6)

A throw-away prototype (outside the repository) applied a smooth horizontal band warp to the original, moving the humeral-head side toward the glenoid and compressing the gap. Result, by eye:

| Question | Answer |
|---|---|
| Can the **open joint space** criterion be shown as violated? | **Yes, as one cue:** the dark crescent narrows and closes; nothing hidden is invented. Large shifts (≈7 % of the image width in the prototype) deform the round head contour, so the gain must be capped |
| Can **glenoid-rim superimposition** (anterior / posterior rims) be shown? | **No.** The image has one rim line; a second rim would be hidden anatomy. The criterion is scored by feedback only and is **not drawn** |
| Can **humeral-head superimposition** be shown as real overlap? | **No.** A column warp compresses, it does not add densities; no layered overlap is claimed |
| Does the image reveal **which way** the turn went? | **No.** The source gives no direction-specific appearance. The cue is the same for a deviation on either side; feedback is **magnitude-only for the image**, but may say "below / above the 35°–45° band" because that band is an absolute, source-backed interval |
| Does **arm posture** change the image? | **No.** Greater-tubercle / humeral-head appearance cannot be produced from one image; arm posture is drawn in the scene and scored by feedback only (pelvis leg precedent) |
| Dead band | The baseline is rendered **unchanged anywhere inside 35°–45°** (the source says the angle needed varies with build, and the true angle of the baseline is unknown); the cue grows only outside the band, with distance from the nearest band edge. This is an **educational simplification** (B) and must be listed in REVIEW_PACKAGE |
| New pixel algorithm needed? | **No** — the existing generic `limb-warp` step with a shoulder-specific model; the optional dead-band lives in the model function |

If the implementation finds that the existing step cannot reproduce this cue without distorting the head beyond recognition, it stops and reports before adding code (S-STD-1 (4)).

### 12.5 Still open after this settlement

O88 numbers (control range, partial-credit margins, cue gain and cap, scale, exposure anchor, collimation by-eye box); O89 detector size (18 × 24 or 24 × 30), marker policy and viewer-half, weights, critical list, manual / AEC; O91 clinical-context review of the full original; O5 and O86 unchanged. Importing the original (with an A-id, checksum above and a registered derivation, if any) is the first step of RAD-033, not of this phase.
