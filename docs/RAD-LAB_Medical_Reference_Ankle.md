# RAD-LAB — Medical Reference: Ankle AP and Ankle Lateral (adult, supine / lateral recumbent, digital radiography)

**Purpose:** the reference for the S14.5 limb pair — `ankle-ap`, `ankle-lateral` (S14.5-1) — written *before* any code (S10-2 "Reference first"). Format template: `RAD-LAB_Medical_Reference_Knee_Foot.md`.
**Scope:** adult, digital radiography, **LEFT side inferred** (S14.5-2). **Not built:** AP mortise (15°, Bontrager p.240, routine in the book but no image, S14.5-1), AP oblique 45° and AP stress (special views, p.243), weight-bearing views. Paediatric, casts / splints, pathology are out of scope.
**Use:** content reference for the build in the same session (Phase B), committed and pushed first. Phase A adds docs, the two image masters and nothing else.
**Status:** DRAFT. Every clinical value is provisional until the O5 educator / physicist review (not a gate, S10b-20). Decisions: `DECISIONS.md` S14.5-1 … S14.5-*, open items O75 …

## 0. Honest summary of the evidence
- **One source for all positioning and technique facts: `BONTRAGER-9`** (9th ed., printed **p.239** ankle AP, **p.242** ankle lateral; context only **p.240** AP mortise and **p.243** AP stress; the lower-limb common considerations **p.224–225** are reused from `RAD-LAB_Medical_Reference_Knee_Foot.md` §3 and were not re-read). It is the governing authority (S10b-25). The claims were read by the owner and supplied in the S14.5 prompt; Claude Code did not read the book and did not re-verify them.
- Bontrager is **silent** (as supplied) on: SID maximum, mAs, AEC, any rotation / tilt tolerance in degrees (the *effect* of rotation is described), any centring tolerance, any collimation margin in cm, the image scale, the viewer-side display of a single-limb marker, the limit of dorsiflexion for the lateral, and the visual appearance of under- / over-exposure. These are **class B teaching choices or class C owner choices**, never class A.
- The two images are attached originals, **owner-verified** (the Commons API answered HTTP 429 on the one request and its one retry, S14.5-3). Scale (cm / px) and every landmark position will be **by-eye estimates** (O62 class).
- **Side is an inference** (S14.5-2): the Commons pages do not state it; it is read from the fibula position on the AP image (fibula on the viewer's right = a LEFT ankle in an AP view). An educator should confirm (O76).

## 1. Sources
### 1.1 Sources read
| # | Citation | Access status | What it supports (and only this) | Sole support allowed? |
|---|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager's Textbook of Radiographic Positioning and Related Anatomy*, 9th ed., Elsevier, 2018 — **printed p.239, 242** (values); p.240, 243 (context); p.224–225, 32–33, 36 as in `sources/BONTRAGER-9.md` | read by the owner; claims supplied in the S14.5 prompt; **not re-verified by Claude Code** | Ankle technique, positioning, central ray, SID, receptor, collimation, digital kV, image criteria | **Yes — it governs** (S10b-25); every clinical value stays provisional (O5). |
### 1.2 Sources not read
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| A supporting source for limb technique | mAs / AEC, exposure practice, SID upper bound | not obtained for limbs | O26 |
| Bontrager p.240 (mortise), p.243 (stress) | mortise / stress views | context only; not built (S14.5-1) | — |

## 2. Classification (S14.5-4)
**A** = Bontrager value (page cited, `common-reference`, provisional) · **B** = engine teaching choice (named as such in user-visible feedback and `REVIEW_PACKAGE.md`) · **C** = owner choice (weights, critical findings, marker rule, scope) · **U** = unknown, source needed (not implemented as validated).

## 3. Common to both exams
| Topic | Statement | Class |
|---|---|---|
| SID | **minimum 40 in (102 cm)**; no upper bound | A (minimum); full / partial bands **B** (102–110 full, 95–130 partial) |
| Receptor | **24 × 30 cm, portrait** | A |
| Grid | **non-grid** (the ankle is distal to the knee, p.224–225) | A. **v1 has no grid control** (S11-3): stated as context, not scored |
| kV | digital **70 ± 5 kV** (analog **60 ± 5**) | A; the full band is 65–75 kV; the partial band 60–80 kV is **B** |
| Central ray | **perpendicular** to the receptor, both exams | A; the ±2° / ±5° tube-angle bands are **B** (feedback only; not drawn on the result image) |
| Collimation | **four-sided** collimation; to the lateral skin margins (AP); distal tibia-fibula to the mid-metatarsals (lateral) | A (principle); margins in cm **B** |
| Shielding | gonadal shielding is good practice | A; stated in Needs, **not scored** |
| Marker | an anatomic **R / L marker** on the lateral margin of the collimation field, without covering anatomy (p.32–33, 36, 224–225) | A (presence, placement); single-limb display = **C** letter-only `fixed-side`, side **L** |
| Motion | no motion | keep-still check weight 0, as the other limb exams |

## 4. Ankle AP (p.239) — `ankle-ap`
| Topic | Statement | Class |
|---|---|---|
| Technical factors | min SID 102 cm; IR 24 × 30 cm portrait; non-grid; digital 70 ± 5 kV (analog 60 ± 5) | A |
| Patient | **supine, legs fully extended, a pillow** under the head; the ankle joint centred to the CR and to the IR long axis; **do not force dorsiflexion** | A; posture = context only |
| True AP | lower leg **not rotated**; the intermalleolar line is **not** parallel to the IR (the lateral malleolus is about **15° more posterior** than the medial one) | A; the console value 0 = this true AP |
| Central ray | **perpendicular**, midway between the malleoli | A |
| Collimation | to the lateral skin margins; includes the distal tibia-fibula and the **proximal half of the metatarsals** | A (list); region extent **B** |
| Criteria | distal third of tibia-fibula, both malleoli, talus, proximal half of the metatarsals, soft tissue; **long axis aligned with the collimation field and the IR**; **no rotation = medial mortise open, lateral mortise closed**; some overlap of the distal fibula by the tibia and the talus; **four-sided collimation**; no motion; **talus penetrated** (cortex and trabeculae) with soft tissue visible | A |

## 5. Ankle lateral (p.242) — `ankle-lateral`
| Topic | Statement | Class |
|---|---|---|
| Technical factors | same as the AP (min SID 102 cm; 24 × 30 cm portrait; non-grid; digital 70 ± 5 kV) | A |
| Patient | **lateral recumbent, affected side down**, knee flexed **about 45°**, the other leg behind; a support under the knee as needed for a true lateral; the foot **dorsiflexed so the sole is at a right angle to the leg, as far as tolerated, not forced** | A; posture = context only |
| Central ray | **perpendicular**, to the **medial malleolus** | A |
| Collimation | distal tibia-fibula to the mid-metatarsals | A (list); region extent **B** |
| Criteria | distal third of tibia-fibula with the **fibula overlapped by the tibia**; talus and calcaneus in lateral profile; **5th metatarsal tuberosity, navicular, cuboid** seen; **no rotation = the distal fibula over the posterior half of the tibia**; **tibiotalar joint open with a uniform space**; the field includes the distal third of the lower leg, calcaneus, 5th metatarsal tuberosity and soft tissue; no motion; the lateral malleolus seen through the distal tibia and talus; soft tissue visible for effusion | A |

## 6. Conventions and decisions
- **Side (S14.5-2):** LEFT, **inferred** from the fibula position (O76). It lives only in the exam's `positioning.markerRule = { kind: "fixed-side", side: "L" }` (letter only, as the wrist / hand / elbow and, for R, the knee / foot). No new field. If a left lower limb needs more than that → stop and report.
- **Rotation:** magnitude-only; ±2° full / ±5° partial are **class B**; no direction text; no PlanView; the sign of `rotationDeg` is defined by the result image and written down before coding. The AP's mortise rule and the lateral's fibula-over-posterior-tibia rule are Bontrager *effects*, not tolerances. Whether the effect can be drawn honestly from one image is decided per exam in Phase B (§10).
- **Critical findings (class C):** `missing-marker`, `wrong-side-marker` only. Weights **28 / 22 / 17 / 22 / 11** (class C, as hand / elbow / knee / foot). **No breathing criterion.**
- **Not scored (unscored context items, precedent O24):** grid (Bontrager: non-grid), shielding, the knee flexion (≈ 45°) and the foot dorsiflexion of the lateral, supine / recumbent posture, pillow.

## 7. Images (S14.5-3, S14.5-5) — owner-attached originals, owner-verified
| Exam | File as attached | Facts from the file (Commons page, via the owner) | Burned-in text / edge | Coverage gate (by eye) |
|---|---|---|---|---|
| ankle-ap | 728 × 1631 px, 324,767 B, SHA-1 `798b5775…`; JFIF only, no EXIF | "X-ray of the ankle of a 24 year old male by frontal projection, taken because of continuing pain 3 weeks after a sprain. No injuries are seen." 24 Oct 2017, Mikael Häggström, own work, CC0 | no text or marker seen; a **bright ringing strip along the left edge (≈ 8 columns, 2 columns in the dark upper part)** and a **1-px bright last column at the right edge (rows 759–1630)** | **PASS WITH A LIMIT:** distal tibia-fibula (≈ 13 cm above the joint), both malleoli, talus and the upper calcaneus are inside; the image ends at the talus / calcaneus — **the proximal half of the metatarsals is not shown** (O77) |
| ankle-lateral | 932 × 1678 px, 394,422 B, SHA-1 `566abbd5…`; JFIF only, no EXIF | same patient and date; "lateral projection (albeit somewhat suboptimal by not seeing straight through the ankle joint)"; CC0 | no text or marker seen; a smooth bright gradient at the left edge (soft tissue, ≈ 10 columns, no step; not repaired) | **PASS WITH LIMITS:** distal tibia and fibula, talus and calcaneus in profile, heel soft tissue; the **navicular and cuboid are only partly at the left edge and the 5th metatarsal tuberosity is not shown** (O77); residual obliquity documented (O78) |

Sprain history and the lateral's "somewhat suboptimal" note are **documented limits**; the baseline is not "fixed" (S14.5-3). **Nothing about the sprain or pathology appears in student-facing text.** The age (24) and sex (male) come from the image descriptions only (S14.5-6).
Handling in Phase B (S14.4-17 precedent): only the edge artefact is repaired (overwrite by the nearest clean column / row); EXIF is absent; no ruler or device was seen on the full images (high-contrast views).

## 8. Rotation honesty gate (decided per exam in Phase B, S-STD-1 (4))
Cues Bontrager names: **AP** — medial mortise open, lateral mortise closed, some overlap of the distal fibula by the tibia and talus; **lateral** — distal fibula over the posterior half of the tibia, lateral malleolus seen through the distal tibia / talus, tibiotalar joint open. The candidate honest approximations (reusing the S14.4 generic limb kinds; one baseline image; labelled educational) are the knee-AP-style two-layer drawing (fibula / tibia layers) for the AP and the knee-lateral-style far / near copies for the lateral. Each must be drawable honestly or the exam stops and reports (S-STD-1 (4)).

## 9. Arabic terms (proposed, DRAFT, pending educator review; receptor = «الكاشف», never «الكاسيت»)
ankle (the joint) مفصل الكاحل · ankle (the region) منطقة الكاحل · talus عظم الكاحل (as in the knee / foot reference) · medial / lateral malleolus الكعب الإنسي / الكعب الوحشي · mortise (ankle mortise) تجويف مفصل الكاحل · distal tibia / fibula الطرف السفلي للظنبوب / للشظية · calcaneus عظم العقب · navicular الزورقي · cuboid النردي · 5th metatarsal tuberosity حدبة المشط الخامس · dorsiflexion ثني ظهري (للقدم) · lateral recumbent استلقاء جانبي · soft tissue الأنسجة الرخوة. All machine-assisted drafts; "ankle" and "talus" share the root word in common usage, so the UI uses «مفصل الكاحل» for the joint and «عظم الكاحل» for the bone.

## 10. Needs (the engine, for Phase B)
| Item | Need | Mark | Note |
|---|---|---|---|
| `projection` ids | `ankle-ap`, `ankle-lateral` | **new** | `PROJECTIONS` registry |
| `bodyPart` | `ankle` | **new** | `BODY_PART_IDS` |
| Side | LEFT lower limb via `markerRule.side: "L"` | **no new field** | the shared builder's hard-wired "right" wording must read the side (R output byte-identical); anything beyond → stop |
| Detector | 24 × 30 cm portrait | **same** as knee / foot | |
| Tube angulation | perpendicular (0°) for both | **uses `tubeAngulationDeg`** | feedback only |
| Marker | letter-only `fixed-side`, side L | **same mechanism** | |
| Weights / critical findings | 28 / 22 / 17 / 22 / 11; marker pair | **same** | |
| Rotation effects | AP and lateral, one model each | **new model ids on the existing generic kinds** | gate in §8 |
| Scene | detector view + side view per exam (own art, `crispMarker`, S-VIS-1a guide-label layout) | **new art** | |
| Assets | two left-ankle CC0 originals (§7) | **owner-verified** | O75 |

## 11. Teaching choices (explicit list; none is Bontrager)
kV partial band (60–80 kV), SID full / partial bands (only the 102 cm minimum is Bontrager), centring tolerances (cm), tube-angle tolerance bands (±2° / ±5°), the excess-collimation margins, the required regions (an engine estimate of Bontrager's anatomy lists, limited by what each baseline shows), the rotation bands (±2° / ±5°), the image scale (cm / px), the manual exposure reference point (a model anchor, O26). Numeric values are fixed in the build and recorded in `REVIEW_PACKAGE.md`.

## 12. Open items
**O75** Commons verification of the two images · **O76** left side inferred from the fibula position · **O77** coverage gaps against Bontrager (AP: proximal half of the metatarsals; lateral: 5th metatarsal tuberosity, navicular, cuboid) · **O78** the lateral baseline's residual obliquity and the sprain history · **O79** edge-artefact repair of the masters · **O80** scale and landmarks by eye. Details in `DECISIONS.md`.

## 13. Development rules
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; Bontrager governs (S10b-25). Nothing about pathology appears in student-facing text.
