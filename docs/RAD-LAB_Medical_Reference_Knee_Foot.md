# RAD-LAB — Medical Reference: Knee AP, Knee Lateral, Foot AP (DP) and Foot AP Medial Oblique (adult, supine / lateral recumbent, digital radiography)

**Purpose:** the reference for the S14.4 limb batch — `knee-ap`, `knee-lateral`, `foot-ap`, `foot-oblique` (S14.4-1) — written *before* any code (S10-2 "Reference first"). It follows `RAD-LAB_Medical_Reference_Elbow.md` as its format template.
**Scope:** adult, digital radiography, **RIGHT side** in this batch (S14.4-2). **Not built:** foot lateral (Bontrager p.234, routine in the book but excluded by owner decision, S14.4-1), weight-bearing foot views, knee skyline / intercondylar / oblique / weight-bearing views, ankle. Paediatric, casts / splints, pathology are out of scope.
**Use:** content reference for the build in the same session (Phase B); the owner required it to be committed and pushed first. No code, data, message or image file was added by Phase A.
**Status:** DRAFT. Every clinical value is provisional until the O5 educator / physicist review (not a gate, S10b-20). Decisions: `DECISIONS.md` S14.4-1 … S14.4-11, open items O56 … O67.

## 0. Honest summary of the evidence
- **One source for all positioning and technique facts: `BONTRAGER-9`** (9th ed., printed **p.224–225** lower-limb common, **p.232** foot AP / DP, **p.233** foot AP medial oblique, **p.246** knee AP, **p.249** knee lateral (mediolateral)), the governing authority (S10b-25). The claims were read by the owner from Bontrager 9e, chapter 6, and supplied in the S14.4 prompt; Claude Code did not read the book and did not re-verify them. PDF page = printed page + 20.
- Bontrager is **silent** (as supplied) on: mAs, AEC, any numeric rotation tolerance (for the knee the *effect* of over- / under-rotation is described, not a number of degrees), partial kV bands, any SID upper bound, any collimation margin or centring tolerance in cm, the image scale, the viewer-side display of a single-limb marker, and the visual appearance of under- / over-exposure. These are **class B teaching choices or class C owner choices**, never Bontrager.
- The four images are attached originals, **owner-verified** (Commons imageinfo was HTTP 429 twice, S14.4-6). Scale (cm / px) and every landmark position are **by-eye estimates** (O62).

## 1. Sources
### 1.1 Sources read
| # | Citation | Access status | What it supports (and only this) | Sole support allowed? |
|---|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager's Textbook of Radiographic Positioning and Related Anatomy*, 9th ed., Elsevier, 2018 — **printed p.224–225, 232, 233, 246, 249**; marker rules p.32–33, 36 in [`sources/BONTRAGER-9.md`](sources/BONTRAGER-9.md) | read by the owner; claims supplied in the S14.4 prompt; **not re-verified by Claude Code** | Lower-limb technique, foot and knee positioning, central ray, SID, receptor, collimation, digital kV, image criteria | **Yes — it governs** (S10b-25); every clinical value stays provisional (O5). |
### 1.2 Sources not read
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| A supporting source for limb technique | mAs / AEC, exposure practice, second opinion on kV and SID | not obtained for limbs | O26 |
| Bontrager p.234 (foot lateral) | foot lateral projection | excluded by owner decision (S14.4-1) | — |

## 2. Classification (S14.4-3)
**A** = Bontrager value (page cited, `common-reference`, provisional) · **B** = engine teaching choice (bands, margins, tolerances, rotation bands; named as such in user-visible feedback and `REVIEW_PACKAGE.md`) · **C** = owner choice (category weights, critical findings, scope) · **U** = unknown, source needed (not implemented as validated). *(Older references write B / T / D / U for A / B / C / U; the mapping is A = B-old, B = T, C = D.)*

## 3. Common to all four exams (Bontrager p.224–225)
| Topic | What this reference can state | Class |
|---|---|---|
| SID | **minimum 40 in (102 cm)**; no upper bound | A (minimum); full / partial bands **B** |
| Exposure for the lower limb | low-to-medium kV, **short exposure time**, **small focal spot**; digital overall **70–85 kV** range for the lower limb | A (the per-exam kV bands below are from the exam pages) |
| Grid | parts **distal to the knee are non-grid**; a grid is used when the part is **> 10 cm**; the average knee is 9–13 cm so either may be used — this text: non-grid ≤ 10 cm, grid > 10 cm, **especially for the AP knee** | A. **v1 has no grid control** (S11-3): the case's knee is "average, either" and the grid is stated as context, not scored (O64) |
| Collimation | **four-sided** collimation preferred | A |
| Shielding | **gonadal shielding** is good practice | A; stated, not scored |
| Marker | an anatomic **R / L marker** on the **lateral margin of the collimation field**, **without covering anatomy** | A (presence, placement); single-limb display = **C** letter-only `fixed-side` (S14.4-2) |
| Motion / respiration | no motion; not applicable | keep-still check weight 0, as the hand |

## 4. Foot AP / dorsoplantar (p.232) — `foot-ap`
| Topic | Statement | Class |
|---|---|---|
| Receptor | **24 × 30 cm, portrait**, non-grid | A |
| kV | digital **65 ± 5 kV** (analog 60 ± 5); partial bands | A; bands **B** |
| Patient | **supine, knee flexed, sole flat on the receptor**; long axis of the foot aligned with the CR and with the receptor portion | A; posture = context only |
| Central ray | angled **10° toward the heel** (perpendicular to the metatarsals); **high arch ≈ 15°, low arch ≈ 5°**; **no angle for a foreign body**; directed to the **base of the 3rd metatarsal** | A. The case is an **average arch** (class C) so the target angle is 10° |
| Collimation | to the foot margins on four sides | A |
| Criteria | **whole foot** (all phalanges, metatarsals, navicular, cuneiforms, cuboid); **no rotation = nearly equal spacing of metatarsals 2–5**; **bases of the 1st and 2nd metatarsals generally separated, bases 2–5 overlapping**; **joint between the 1st and 2nd cuneiforms shown**; **sesamoids seen through the 1st metatarsal head**; collimation to the area of interest | A |

## 5. Foot AP medial oblique (p.233) — `foot-oblique`
| Topic | Statement | Class |
|---|---|---|
| Technical factors | same as the foot AP (24 × 30 cm portrait, non-grid, digital 65 ± 5 kV) | A |
| Central ray | **perpendicular** to the receptor, to the **base of the 3rd metatarsal** (tube angle 0°) | A |
| Position | rotate the foot **medially** so the **plantar surface is 30°–40° to the receptor plane** (this text recommends **40°**, dorsum parallel to the receptor — the book gives both wordings; the exam uses **40°** as the target, 30°–40° accepted) | A |
| Collimation | to the skin margins on four sides | A |
| Criteria | **entire foot from the distal phalanges to the posterior calcaneus and proximal talus**; metatarsals 3–5 **free of superimposition**, 1st / 2nd free except at the bases; **5th metatarsal tuberosity in profile**; cuboid joint spaces and **sinus tarsi open** | A |
| Obliquity | the angle is a **patient / positioning** quantity; the simulator does not model it as a control in v1 (the effect of a wrong obliquity is shown through the existing rotation control; Bontrager gives the target, no tolerance) | numeric tolerance **B** |

## 6. Knee AP (p.246) — `knee-ap`
| Topic | Statement | Class |
|---|---|---|
| Receptor | **24 × 30 cm portrait**; grid / bucky if the part is **> 10 cm**, non-grid if **< 10 cm** | A (grid not a control, O64) |
| kV | digital **75 ± 5 kV** (analog 65–75); partial bands | A; bands **B** |
| Patient | **supine, no pelvic rotation, leg fully extended**; the leg rotated **internally 3°–5°** so that the **interepicondylar line is parallel to the receptor** | A; posture = context only |
| Central ray | **parallel to the tibial plateau**: **perpendicular** for an average patient (**ASIS-to-table 19–24 cm**), **3–5° caudad** if < 19 cm, **3–5° cephalad** if > 24 cm; centred about **1.25 cm (½ in) distal to the patellar apex** | A. The case is an **average** patient (class C): target 0° |
| Collimation | to the skin margins | A |
| Criteria | **distal femur and proximal tibia / fibula**; **open femorotibial joint, tibial facets seen on end**; **symmetric condyles and joint space (no rotation)**; **about the medial half of the fibular head superimposed by the tibia**; **intercondylar eminence centred in the fossa**; **centre of the field at the mid-knee joint** | A |

## 7. Knee lateral, mediolateral (p.249) — `knee-lateral`
| Topic | Statement | Class |
|---|---|---|
| Receptor | **18 × 24 or 24 × 30 cm portrait**; grid if the part is > 10 cm (not a control, O64). This exam uses **24 × 30 cm** (the larger listed size, class C) | A; choice **C** |
| kV | digital **75 ± 5 kV**; partial bands | A; bands **B** |
| Patient | **lateral recumbent** (or horizontal beam); knee flexed **20°–30°**; a true lateral = **posterior borders of the femoral condyles superimposed**, **patella plane perpendicular** to the receptor | A; posture = context only |
| Central ray | **5°–7° cephalad** (**7–10°** for a short patient with a wide pelvis, **≈ 5°** for a tall male with a narrow pelvis; **perpendicular** if the lower leg can be raised to the plane of the femur); centred about **2.5 cm (1 in) distal to the medial epicondyle** | A. The case is an **average** build (class C): target 6° cephalad (the middle of 5–7°) |
| Collimation | to the skin margins, including femur, tibia and fibula | A |
| Criteria | **patella in profile**, patellofemoral and knee joints **open**; **over-rotation = less fibular-head superimposition by the tibia, under-rotation = more**; **distal borders of the condyles superimposed with the cephalad angle**; **joint at the centre of the field** | A |

## 8. Conventions and decisions
- **Side (S14.4-2):** the batch is the **RIGHT** side (all four images are right limbs). The side becomes a small **optional** field of the exam / case (default L), so every existing left exam / case is byte-identical; marker = `fixed-side` with `side: "R"` (letter only, S14.1c-4 / O21).
- **Rotation:** magnitude-only; ±2° full / ±5° partial are **class B** teaching choices; no direction text; no PlanView; `planRotationDeg` / O19 untouched; the sign of `rotationDeg` is defined by the result image and written down before coding (S14.4 build decisions). The knee lateral's over- / under-rotation rule (fibular head, condyle borders) and the foot AP's metatarsal-spacing rule are Bontrager *effects*, not tolerances.
- **Critical findings (class C):** `missing-marker`, `wrong-side-marker` only. Weights **28 / 22 / 17 / 22 / 11** (class C, as hand / elbow).
- **Not scored:** shielding, grid, posture details (knee flexion of the lateral, supine position), arch height as a patient attribute.

## 9. Images (S14.4-6 … S14.4-9) — owner-attached originals, owner-verified
| Exam | File as attached | Facts from the file | Commons title (search, HTTP 200) | Burned-in text | Coverage gate (by eye) |
|---|---|---|---|---|---|
| knee-ap | 1067 × 1913 px, 250,133 B, SHA-1 `14c69348…` | right knee, AP, 5 Jan 2018 (owner) | `File:X-ray of a normal knee by anteroposterior projection.jpg` (**unconfirmed match**) | "Dx" mirrored, left edge in the dark background (≈ x 55–105, y 885–930) | **PASS:** distal femur, femorotibial joint, proximal tibia and fibula inside the image |
| knee-lateral | 1133 × 1939 px, 292,935 B, SHA-1 `9351b3c4…` | right knee, lateral, 5 Jan 2018 (owner); **flexion ≈ 45° read by eye** (O58) vs Bontrager 20–30°; **minimal osteophyte at the superior patellofemoral rim per the Commons description** (O57) | `File:X-ray of a normal knee by lateral projection.jpg` (**unconfirmed match**) | "Dx" (mirrored) in the soft-tissue shadow's dark background, left (≈ x 150–230, y 1185–1240) | **PASS:** patella, distal femur, joint, proximal tibia and fibula inside the image |
| foot-ap | 1061 × 2431 px, 836,201 B, SHA-1 `ab0e4059…`; **owner stated 1067 × 1913 px — mismatch (O59)**; carries an EXIF block | right foot, DP, 28 Jul 2017 (owner) | not found by the one search made (title **unknown**) | "Dx" in an angled label box, top right corner | **PASS:** all phalanges, metatarsals, cuneiforms, navicular, cuboid, with talus / calcaneus partly at the bottom edge |
| foot-oblique | 1077 × 2029 px, 571,297 B, SHA-1 `100926d4…`; carries an EXIF block | right foot, oblique, 28 Jul 2017 (owner) | not found (title **unknown**) | "Dx" in an angled label box (top right) + a small rectangular mark near the middle of the forefoot + a bright frame line at the bottom edge | **PASS WITH A LIMIT:** the bottom edge ends at the proximal tarsals — the **posterior calcaneus is not inside the image** (O61); the required region ends at the image's bottom (as the wrist, S14.1c-7) |

The text "Dx" is Swedish *dexter* (right). Handling, to be applied in Phase B (S14.2-7 policy): crop where it removes the text without cutting anatomy, otherwise fill with sampled background; strip EXIF; no rulers or devices remain. Scale and landmarks are estimates (O62).

## 10. Rotation honesty gate (to be decided in Phase B, one decision per exam)
Cues Bontrager names: **foot AP** — equal spacing of metatarsals 2–5, bases separated / overlapped; **foot oblique** — metatarsals 3–5 free of superimposition, 5th metatarsal tuberosity in profile, open cuboid spaces / sinus tarsi; **knee AP** — symmetric condyles and joint space, about the medial half of the fibular head covered by the tibia, eminence centred in the fossa; **knee lateral** — posterior borders of the condyles superimposed, fibular-head overlap, patella in profile. Each must be drawable honestly from one image or the exam stops and reports (S-STD-1 (4)). The drawing is an educational approximation.

## 11. Arabic terms (proposed, DRAFT, pending educator review; male forms; receptor = «الكاشف»)
knee الركبة · foot القدم · femur عظم الفخذ · tibia الظنبوب (القصبة) · fibula الشظية · patella الرضفة · femoral condyle لقمة عظم الفخذ · tibial plateau الهضبة الظنبوبية · fibular head رأس الشظية · metatarsal مشط القدم (عظم مشطي) · phalanges السلاميات · calcaneus العقِب (عظم العقب) · talus الكاحل (عظم الكاحل) · navicular الزورقي · cuboid النردي · cuneiform الإسفيني · sesamoid السمسماني · dorsoplantar ظهري أخمصي · medial oblique مائل إنسي · plantar surface الأخمص · heel العقب · cephalad / caudad نحو الرأس / نحو القدمين · interepicondylar line الخط بين اللقيمتين. All machine-assisted drafts.

## 12. Needs (the engine, for Phase B)
| Item | Need | Mark | Note |
|---|---|---|---|
| `projection` ids | `knee-ap`, `knee-lateral`, `foot-ap`, `foot-oblique` | **new** | `PROJECTIONS` registry |
| `bodyPart` | `knee`, `foot` | **new** | `BODY_PART_IDS` |
| Side | RIGHT; optional exam / case field, default L | **new, optional** | O29 closes when done |
| Detector | 24 × 30 cm portrait (knee lateral: 24 × 30, class C) | **same** as the hand | |
| Tube angulation | foot AP 10° (heel direction), knee lateral 5–7° cephalad (6° target), knee AP 0° (average), foot oblique 0° | **uses `tubeAngulationDeg`** (S11, AP chest) — to be checked on a limb scene | if it needs a new mechanism → stop and report |
| Marker | letter-only `fixed-side` with side R | **same, side differs** | |
| Weights / critical findings | 28 / 22 / 17 / 22 / 11; marker pair | **same** | |
| Rotation effects | four new landmark kinds | **new** | gate in §10 |
| Scene | detector view + side view per exam, `crispMarker`, S-VIS-1a guide-label layout | **new art** | |
| Assets | four right-limb CC0 originals (§9) | **owner-verified** | O56 |

## 13. Teaching choices (explicit list; none is Bontrager)
kV partial bands, SID full / partial bands (only the 102 cm minimum is Bontrager), centring tolerances (cm), tube-angle tolerance bands, the excess-collimation margins, the required regions (an engine estimate of Bontrager's anatomy lists), the rotation bands (±2° / ±5°), the image scale (cm / px), the manual exposure reference point (a model anchor, no clinical claim, O26). Numeric values are fixed in the build and recorded in `REVIEW_PACKAGE.md`, not here.

## 14. Open items
**O56** Commons verification of the four images · **O57** knee-lateral osteophyte (educator) · **O58** knee-lateral flexion ≈ 45° vs 20–30° · **O59** foot-AP file size mismatch / EXIF · **O60** burned-in text handling · **O61** foot oblique coverage (posterior calcaneus) · **O62** scale and landmarks by eye · **O63** foot oblique obliquity read by eye · **O64** grid rule not a control · **O65** foot patient description unverified · **O66** right-side support (CLOSED by S14.4-12: the exam's marker rule carries the side, no new field) · **O67** knee-AP leg internal rotation 3–5° and the image's own rotation. Details in `DECISIONS.md`.

## 15. Development rules
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; Bontrager governs (S10b-25); one source only, so no conflict handling is possible. Nothing about pathology appears in student-facing text.
