# RAD-LAB — Medical Reference: Elbow AP (fully extended) and Elbow Lateral (90° flexed) (adult, seated at the table, digital radiography)

**Purpose:** the reference for the next limb exam batch — `elbow-ap` (fully extended) and `elbow-lateral` (lateromedial, 90° flexion) (S14.3-1) — written *before* any code (S10-2 "Reference first"). It follows `RAD-LAB_Medical_Reference_Hand.md` as its format template.
**Scope:** adult, seated at the end of the table, digital radiography, non-grid. **Other elbow projections are not built:** the acute-flexion and partial-flexion AP variants (Bontrager p.167–168, documented as not built), obliques, trauma / horizontal-beam lateral, 30–35° flexion (only when specifically indicated). Paediatric, casts / splints, pathology and fat-pad *diagnosis* are out of scope.
**Use:** content reference for a later exam session; **nothing in this file is implemented**. No code, data, projection registration, test, message or image file was added by the session that wrote it (S14.2b phase 2, docs only).
**Status:** DRAFT. Every clinical value is provisional until the O5 educator / physicist review (not a gate, S10b-20). Decisions: `DECISIONS.md` S14.3-1 … S14.3-4, O42 … O44.

## 0. Honest summary of the evidence
- **One source for all positioning and technique facts: `BONTRAGER-9`** (9th ed., printed **p.166** AP elbow fully extended, **p.172** lateromedial elbow), the governing authority (S10b-25). The claims were supplied by the owner's advisor and verified by the advisor against the owner's copy; Claude Code did not read the book and did not re-verify them. PDF page = printed page + 20.
- Bontrager is **silent** (as supplied) on: mAs, AEC, any numeric rotation tolerance, partial kV bands, any SID upper bound, any numeric collimation margin or centring tolerance, the viewer-side display of a single-limb marker. These are **teaching choices or owner decisions**, never medical facts.
- **No elbow image has been chosen** (O42). Nothing was searched, downloaded or verified for this reference.
- Wrist and hand baselines (A-010 … A-017) do not show the elbow and cannot be reused.

## 1. Sources
### 1.1 Sources read
| # | Citation | Access status | What it supports (and only this) | Sole support allowed? |
|---|---|---|---|---|
| R1 | Lampignano JP, Kendrick LE. *Bontrager's Textbook of Radiographic Positioning and Related Anatomy*, 9th ed., Elsevier, 2018 — **printed p.166 (AP elbow, fully extended), p.172 (lateromedial elbow)**; marker rules p.32–33, 36 in [`sources/BONTRAGER-9.md`](sources/BONTRAGER-9.md) | read by the owner's advisor; **not re-verified by Claude Code** | Elbow positioning, central ray, SID, receptor, collimation, digital kV, true-AP / true-lateral criteria | **Yes — it governs** (S10b-25); every clinical value stays provisional (O5). |
### 1.2 Sources not read
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| A supporting source for limb technique | mAs / AEC, exposure practice, second opinion on kV and SID | not obtained for limbs | O26 |
| Bontrager p.167–168 (acute / partial flexion AP) | alternative AP variants | out of v1 | — |

## 2. Classification
**B** = Bontrager value (page cited, `common-reference`, provisional) · **T** = engine teaching choice (named as such in user-visible feedback and `REVIEW_PACKAGE.md`) · **D** = open owner / educator decision · **U** = unknown, source needed (not implemented as validated).

## 3. Positioning
| Topic | What this reference can state | Class / status |
|---|---|---|
| Patient state (both) | seated at the **end of the table**; shield radiosensitive tissue outside the region of interest | **B**; stated, not scored in v1 |
| SID (both) | **minimum 102 cm** (40 in, conversion) | **B** (minimum); the upper bound and the full / partial bands are **T** |
| Grid / screens (both) | **non-grid**, detail screens | **B**; stated, not a control |
| Receptor (both) | **24 × 30 cm**, the **smallest available**, collimated on **four sides** to the area of interest. AP: **landscape** for two exposures or **portrait** for one; lateral: **portrait** | **B**; the exam's detector orientation = **D** (O43) |
| AP — position | elbow **fully extended** if possible; **hand supinated**; arm and forearm **aligned with the long axis** of the receptor; elbow joint centred; the patient leans laterally as needed; **palpate the epicondyles** so the interepicondylar plane is **parallel to the receptor** | **B**; arm / hand posture = context only |
| AP — central ray | **perpendicular**, to the **mid-elbow joint, about 2 cm distal to the midpoint of the line between the epicondyles** | **B** (tube angulation expected 0°) |
| Lateral — position | elbow **flexed 90°**; forearm aligned with the long axis of the receptor; elbow joint centred; **shoulder dropped** so that humerus and forearm lie in **one horizontal plane**; hand / wrist in true lateral, **thumb side up**; interepicondylar plane **perpendicular** to the receptor; a **support under the hand / wrist** for a heavy forearm so the forearm is parallel to the receptor | **B**; shoulder level / support = context only |
| Lateral — central ray | **perpendicular**, to the **mid-elbow joint, about 4 cm medial to the palpable posterior surface of the olecranon** | **B** (tube angulation 0°) |
| Marker | anatomic R / L marker on every image, inside the lateral edge of the collimated field, not over essential anatomy (p.32–33, 36); the single-limb display convention is **not given** | **B** (presence, side, placement); display = **D**, proposed letter-only `fixed-side` (S14.3-3) |
| Respiration / motion | not applicable / no motion (keep-still check weight 0) | as the hand |

## 4. Technique (digital radiography)
| Topic | What can be stated | Class / status |
|---|---|---|
| kVp — AP extended | analog **65–75**; digital **70 ± 5** (65–75) (p.166) | **B**; partial bands **T** |
| kVp — lateral | analog **60–70**; digital **70 ± 5** (65–75) (p.172) | **B**; partial bands **T** |
| mAs / AEC | none given | **U** — no numeric mAs target (S10b-9); manual reference point = **T** |
| Exposure appearance | not stated in the claims supplied | **U** (do not transfer wrist / hand wording; O35 pattern) |
| Fat pads | anterior and posterior fat pads **visible** is a lateral criterion; **90° flexion is needed** to show the posterior fat pad (30–35° flexion only when specifically indicated) | **B**; criterion text only, no fat-pad pathology claim |

## 5. Conventions and decisions
- **Marker:** letter-only `fixed-side`, as S14.1c-4 / S14.2-2 (proposed; S14.3-3). Case side: one side per case; the side comes from the exam data in v1 (O29).
- **Rotation:** magnitude-only; ±2° full / ±5° partial are **teaching choices**; no direction text; no PlanView; `planRotationDeg` / O19 untouched (same policy as the hand). The sign of `rotationDeg` is defined by the result image and written down before coding.
- **Critical findings:** `missing-marker` and `wrong-side-marker` only. Weights 28 / 22 / 17 / 22 / 11 unless a reason is found (then stop and report).
- **Not scored:** shielding, support under the hand / wrist, shoulder level, hand supination, patient lean, grid.

## 6. Image quality and result rendering
| Criterion / effect | Statement | Class / status |
|---|---|---|
| AP — coverage | distal humerus, elbow joint space and proximal radius and ulna visible | **B** |
| AP — no rotation | **epicondyles in profile**; radial head, neck and tubercle **separated or only slightly superimposed by the ulna** | **B**; rotation effect feasibility **open (O44, gate for S14.3)** |
| AP — joint | olecranon **seated in the olecranon fossa** in full extension; **joint space open** | **B**; context |
| AP — centring | CR and collimation centre at the mid-elbow | **B** |
| Lateral — alignment | forearm aligned with the long axis; elbow flexed 90° | **B** |
| Lateral — true lateral | **three concentric arcs** of the trochlear sulcus; **double ridges** of the capitulum and trochlea; the **trochlear notch**; **epicondyles superimposed**; about **half of the radial head superimposed** by the coronoid process, olecranon in profile | **B**; rotation effect feasibility **open (O44)** |
| Lateral — fat pads | anterior and posterior fat pads visible | **B**; no pathology claim |
| Lateral — centring | CR and collimation centre at the mid-elbow | **B** |
| Not implemented as clinical truth | fractures, effusions (fat-pad displacement), any pathology; numeric exposure index; detail beyond the baseline | **never** |

## 7. Arabic terms (proposed, DRAFT, pending educator review)
elbow المرفق · humerus العضد · radius / ulna الكعبرة / الزند · epicondyle اللقيمة · olecranon المرفق (الزج) / الزجّ · olecranon fossa حفرة الزج · radial head رأس الكعبرة · coronoid process النتوء الإكليلي · trochlea البكرة · capitulum الرأس (اللقيمة) · fat pad الوسادة الدهنية · extended ممدود · flexed 90° مثني 90°. Receptor **الكاشف**. All machine-assisted drafts.

## 8. Needs (for S14.3b / S14.3c)
Marks as the hand reference: **same** · **differs** · **new** · **unknown**.
| Item | Elbow | Mark | Note |
|---|---|---|---|
| `projection` ids | `elbow-ap`, `elbow-lateral` | **new** | `PROJECTIONS` registry |
| `bodyPart` | `elbow` | **new** | `BODY_PART_IDS` |
| Detector | 24 × 30 cm; **AP landscape or portrait** (one or two exposures), lateral portrait | **differs** | O43 (the hand was portrait for both) |
| Centring target | AP: mid-elbow, ≈ 2 cm distal to the epicondylar midpoint; lateral: mid-elbow, ≈ 4 cm medial to the olecranon surface | **differs** | read by eye on the baselines |
| Required anatomy | distal humerus + joint + proximal radius / ulna (collimated to the area of interest) | **differs** | region from the baseline, tolerance **T** |
| kV | 70 ± 5 both | **differs** (hand 60 / 65) | partial bands **T** |
| Rotation controls | forearm / arm turn about the long axis | **same** pattern | sign by the result image |
| Rotation effect | AP: epicondyle profile, radial head / neck / tubercle vs ulna; lateral: arcs / ridges superimposed, ≈ half radial head covered | **new landmark kinds** | feasibility = **O44** |
| Scene | detector view (arm along the long axis) + side view (seated, humerus and forearm horizontal; lateral: 90° elbow) | **new art** | the lateral's 90° bend needs a new figure |
| Marker | letter-only `fixed-side` | **same** | |
| Weights / critical findings | 28 / 22 / 17 / 22 / 11; marker pair | **same** | |
| Assets | one AP and one lateral normal adult elbow, CC0 / PD / CC BY | **unknown** | O42 |

## 9. Teaching choices (explicit list; none is sourced)
kV partial bands (both), SID bands (only the 102 cm minimum is Bontrager), centring tolerances (cm), the excess-collimation margin, rotation tolerances (±2° / ±5°), the manual exposure reference point. Numeric values are fixed in the exam session, not here.

## 10. OPEN QUESTIONS FOR S14.3b
**(a) Images (O42).** Choose and verify one AP (extended) and one lateral (≈ 90° flexed) normal elbow (CC0 / PD / CC BY; no text / ruler / devices / pathology). Handle burned-in text by the least-invasive documented modification (S14.2-7 policy). Verify through the Commons API; if blocked, owner-verified with an open item as for the hand (O39).
**(b) Detector orientation (O43).** AP landscape vs portrait; the baseline's aspect decides.
**(c) Rotation cues from one baseline (O44 — gate for S14.3).** Can epicondyle profile and radial head / neck / ulna overlap (AP) and the concentric arcs / ridges / epicondyle superimposition (lateral) be represented honestly from one image? If not → **STOP AND REPORT before building the effect** (S-STD-1 (4)); the exam is dropped.
**(d)** Sign of `rotationDeg` per exam; the 90° flexion is a pose, not a control (v1).

## 11. Open owner decisions and open items
**O42** images not yet chosen · **O43** detector orientation of the AP · **O44** rotation-cue feasibility (gate). Carried over: O26, O29, O30, O39. Details in `DECISIONS.md`.

## 12. Development rules
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; Bontrager governs (S10b-25); one source only, so no conflict handling is possible here.
