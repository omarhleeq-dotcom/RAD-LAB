# Review package for the educator / medical physicist (O5, S10b-17)

**Review is not a gate (S10b-20, owner decision 2026-10-06, final):** this review is **not** a gate for sessions or for owner use; it is **recommended before commercial release or before teaching students**. The owner (radiography degree) is the first-line content reviewer; the "Educational prototype — not for clinical use" banner stays.

**Status:** created in the Session 10b follow-up (docs only). Everything below is **provisional**: nothing is validated, nothing in code, data or scoring changed. The long list of Chest PA items is in [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md); this file adds the items created since (Sessions 10 – 10b). Decisions are in [`DECISIONS.md`](DECISIONS.md); sources in [`sources/REGISTER.md`](sources/REGISTER.md).

**Source provenance for the reviewer:** claims in `docs/sources/*.md` were recorded from the owner's advisor reading (full text read by the advisor; not re-verified against the originals by Claude Code). **Please spot-check the locators** against the originals (EC16260 PDF pp.15, 20, 21; WHO-CHEST pp.3, 4, 5, 17, 27–29, 32; ACR-CHEST Sec I, IV, VI; ACR-PORTABLE Sec I, II, IV, VI; WHO-TECH pp.4, 6–10; BONTRAGER-9 pp.32, 33, 36, 81–84, 87, 92, 94, 96; CLARK-12 p.10; STATPEARLS-POS sections "Projections", "Positioning – Chest" and its licence).

Reviewer key: **E** = radiography educator · **P** = medical physicist · **AR** = Arabic reviewer.

## 1. Provisional owner decisions (2026-10-06)

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S10-5 | *(Superseded by S10b-21 / S10b-22: the Lateral / AP marker defaults are replaced by Bontrager's rules.)* | — | — | — |
| S10b-1 | kV rubric (PA / Lateral / AP): optimal 110–125; partial 100–109 and 126–150 (PA part implemented in the "PA scoring update" session after physicist review) | Optimal 110–125 = **BONTRAGER-9 p.81, 92, 94, 96 (governing, S10b-25)**; the **partial bands 100–109 and 126–150 are an engine teaching choice, not Bontrager (S12-1)**; supporting: EC16260 p.20, WHO-CHEST p.3, ACR-CHEST, WHO-TECH p.6 | Confirm the bands (WHO-CHEST p.3 says contrast drops above 140 kV; partial credit runs to 150). | P |
| S10b-2 | AEC: PA either lateral lung chamber; Lateral central; AP portable manual exposure recorded | EC16260 p.20–21; ACR-PORTABLE Sec IV | Is the central chamber right for a lateral on current systems? Is "either lateral chamber" right for PA (EC example names the right lateral chamber)? | P |
| S10b-3 | Rotation: magnitude scored; direction feedback allowed as teaching feedback | BONTRAGER-9 p.83 (governing); WHO-CHEST p.28 | Confirm the direction rule (sternal clavicle end closest to the spine = side rotated toward the receptor) and its wording. | E |
| S10b-4 | Lateral offers both sides; left correct by default; right only if the case requests it | ACR-CHEST Sec I, IV (routine = PA + left lateral); WHO-TECH p.7 (normally left, right optional); STATPEARLS-POS | Confirm the left default and when a right lateral is the correct choice. | E |
| S10b-5 | Lateral centring: mid-thorax, T7 (final under S10b-25) | BONTRAGER-9 p.94 (governing); CLARK-12 p.10 (T7; its 5 cm anterior offset not adopted); WHO-TECH p.7 illustration | Confirm. | E |
| S10b-6 | Lateral: arms raised above the head; arm support allowed | BONTRAGER-9 p.82, 94 (governing); WHO-TECH p.7, EC16260 p.21 (supporting) | Confirm; is a one-arm-down variant ever acceptable? | E |
| S10b-18 | Lateral stance: upright and straight, weight even on both feet; any lean = feedback | BONTRAGER-9 p.84, 94 (governing); WHO-TECH p.7 (supporting; slightly forward allowed there) | Confirm that any lean is feedback. | E |
| S10b-7 | Lateral rotation: ≈ 1 cm posterior rib separation normal at 183 cm; more = rotation | BONTRAGER-9 p.84, 94 (governing); WHO-TECH p.7, EC16260 p.21 (supporting) | Confirm the 1 cm and the wording. | E, P |
| S10b-21 | Lateral marker = side closest to the detector (left lateral → L); presence and letter scored from Session 12 (closes O6) | BONTRAGER-9 p.32, 36 (governing) | Confirm the rule and the department-dependent display orientation of laterals. | E |
| S10b-22 | AP marker letter = patient's anatomical side on the lateral field edge, as PA; SID and supine / semi-erect labels; scored from Session 13 (closes O8) | BONTRAGER-9 p.32–33, 36, 96 (governing) | Confirm; which labels are expected? | E |
| S10b-23 | AP technique (S13): CR ≈ 5° caudad to T7, 8–10 cm below the jugular notch, landscape receptor, grid; SID ≥ 183 optimal, lower bound per ACR-PORTABLE; heart larger, 8–9 posterior ribs, clavicles horizontal | BONTRAGER-9 p.87, 96 (governing); ACR-PORTABLE | Confirm the SID lower bound for supine (Bontrager p.96 says minimum 183 cm or as possible) and the AP criteria. | E, P |
| S10b-24 | Lateral CR / receptor lowered ≥ 2.5 cm for broad shoulders (teaching feedback) | BONTRAGER-9 p.94 | Confirm. | E |
| S10b-25 | **Governing-authority rule:** BONTRAGER-9 wins on any conflict; then ACR / EC / WHO; then owner decision | Owner decision | (Owner rule; the reviewer may flag Bontrager values they disagree with.) | E, P |
| S10b-26 | PA / Lateral SID target ≥ 183 cm; 180 cm treated as rounding (PA part in the "PA scoring update" session) | BONTRAGER-9 p.92, 94 give the **minimum 72 in (183 cm) only**; the **185 cm upper full-credit limit and the 150–200 cm partial band are engine teaching choices (S12-1)** | Confirm the minimum, and whether the 185 / 150–200 teaching bands are acceptable. | E, P |
| S10b-8 | Marker presence required and scored for PA and AP; Lateral presence recorded, not scored in v1; PA letter rule unchanged; Lateral / AP letter unscored; AP patient-position label | ACR-CHEST Sec IV QC; ACR-PORTABLE QC; WHO-TECH p.6, 8, 10 (marker on PA / AP; none on the lateral pages) | Presence weight? Should the lateral marker be scored? Is scoring presence acceptable when the letter rule is unscored? Which position labels are expected? | E |
| S10b-9 | No numeric mAs target; exposure as under / adequate / over; correct AEC chamber | ACR (mid-grey display); WHO-TECH p.4 (values locally adjusted), p.6–7 (lateral about twice the PA mAs); owner decision | How should "adequate" be defined without an EI target? (EI / DI limits are not universal — PA Technique reference) | P |
| S10b-10 | AP upright: SID ≥ 183 cm optimal, 102–183 acceptable, < 102 incorrect; supine / semi-erect: ≥ 102 cm correct, longer preferred; kVp 70–100 without grid, > 100 with grid | ACR-PORTABLE Sec IV (ranges); WHO-TECH p.8, 10 (120 kV with grid); 72 in = 183 cm, 40 in = 102 cm are conversions, not source | ACR states ranges, not a grading scheme: is this grading fair? Is the upright / supine split right? | E, P |
| S10b-11 | AP magnification computed from geometry, shown for teaching, not scored | Geometry (derivation, not a medical claim); WHO-CHEST p.4 (direction, mechanism) | Verify the formula, the object-distance assumption and the display. | P |
| S10b-12 | Session 13 starts with the supine portable AP | ACR-PORTABLE Sec IV; WHO-CHEST p.4, 17; WHO-TECH p.10 | Confirm this is the right first AP variant; confirm how it is positioned (no positioning source read). | E |
| S10b-13 | Critical findings (Lateral / AP): anatomy cut-off (apices, costophrenic angles, lower diaphragm), arm over lung fields (Lateral), missing marker (PA / AP only), gross exposure error | Owner decision, same gate structure as PA | Finalise the list and the thresholds. | E |
| S10b-14 | Lateral / AP reuse the PA weights (25/20/15/20/10/10) | Owner decision | Are these weights sensible for a lateral and an AP? | E |
| S10b-15 | 27 × 31 cm region stays provisional for v1 (O2) | Demo value; WHO-TECH pp.6–10 lists 35 × 43 / 35 × 35 adult, 24 × 30 child film sizes; BONTRAGER-9 p.92, 94 uses 35 × 43 cm (not decisive) | Is the demo region acceptable for v1? | E |
| S10b-19 | Session 11 Needs verdicts unchanged; the S10b-14 / S10b-12 simplifications are options only | Owner decision | (Information only — no clinical question.) | — |
| S10b-16 | Asset commercial-licence audit first in Session 12 (O10) | S10-3 | (Owner / legal, not clinical) | — |

## 2. Items that rest on one secondary source, an abstract, or no source

| Item | Basis | Question | Who |
|---|---|---|---|
| Left side against the receptor for the lateral | STATPEARLS-POS (secondary) + ACR-CHEST routine left lateral | Confirm; reason given: minimises cardiac magnification | E |
| Chin extended / A–P centring for the lateral | STATPEARLS-POS only | Confirm both | E |
| Lateral SID 180 (140–200) cm (EC) vs ≥ 183 cm (ACR) | EC16260 p.20–21; ACR-CHEST Sec VI | Which range should the lateral teach? | E, P |
| Lateral dose ratio 5× PA (EC) | EC16260 p.20–21 | Is a projection-dependent attenuation scalar acceptable as an educational model? (no dose is shown or scored) | P |
| EC "example technique" (125 kV, grid, AEC chamber, time) | EC16260 (1996, film-screen era) | Still a sensible teaching example for DR? | P |
| Lateral landmark list | EC16260 p.21; WHO-CHEST p.5 (Fig 2.4) | Which landmarks are required for a lateral to be diagnostic? | E |
| AP clavicles over the apices; heart magnification direction; skin-fold pseudo-pneumothorax | WHO-CHEST pp.4, 27 | Are these cues appropriate to teach, and how should they look? | E |
| Lateral as a conditional add-on | Abstract only (Kluthke 2016) | Does the indication wording need a full-text source? | E |
| Scoring philosophy: "never reject only for missing criteria" | EC16260 p.15; O'Reilly 2025 | Is the educational-not-reject framing acceptable in the UI wording? | E |

### 1b. Session 12 additions (2026-10-07; docs only so far)

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S12-1 | Wording: kV partial bands 100–109 / 126–150 and SID 185 upper limit / 150–200 partial band are **engine teaching choices**, not Bontrager | BONTRAGER-9 gives 110–125 kV and a 183 cm minimum only | Are these teaching bands acceptable? | E, P |
| S12-1 | **Lung-scale under rotation** (the viewer-side lung drawn larger, `rotationVisual`) is an **educational approximation** | Bontrager silent; WHO-CHEST p.28 only (rotated-toward hemithorax looks darker, not larger) | Is the drawing acceptable, or should it be removed / changed? | E, P |
| S12-3 | **Lateral rotation tolerance in degrees** is an **engine teaching choice**: Bontrager gives about 1 cm of normal posterior-rib separation at 183 cm (p.84, 94) and no angle; the degree value (recorded when implemented) is a mapping chosen by the engine | BONTRAGER-9 p.84–85, 94 (the 1 cm only) | Confirm the 1 cm teaching rule and the degree mapping chosen. | E, P |
| S12-3 | Lateral rotation feedback is **magnitude-only**; the straight lateral is the reference (slight anterior rotation for rib superimposition is not modelled) | BONTRAGER-9 p.84–85 | Confirm. | E |
| S12-2 | Lateral rotation **sign convention** (positive = same turn as PA-positive; drives drawings only) | Engine convention, S11c-1 | (Information; no clinical claim.) | — |
| S12-4 | The Lateral baseline is a **representative normal adult lateral radiograph, not the same person as the PA case**; labelled a teaching approximation | Owner decision | Is the mismatch with the PA case acceptable for teaching? | E |
| S12-6 | Lateral v1 omits CR / receptor lowering for broad shoulders and the wheelchair / cart variants | BONTRAGER-9 p.94–95 | Confirm these are acceptable future variants. | E |
| S12-7 | Lateral marker display convention: anterior chest on the viewer's left, L in the viewer's-left margin, R in the right margin; a correct letter on the other margin is a wrong marker | BONTRAGER-9 p.36 (letter = side closest to the receptor; display varies by department) | Is one fixed convention acceptable for teaching, and should a letter on the other margin be a critical finding? | E |
| S12-8 | **Lateral rotation tolerance ±2° / ±5° is an engine teaching choice** (separation ≈ 2·a·sin θ, assumed half-width a = 14 cm) | BONTRAGER-9 p.84, 94 (about 1 cm only) | Is the assumed half-width and the resulting angle acceptable? | E, P |
| S12-10 | Lateral exposure: per-projection attenuation 2× (provisional teaching value, no mAs target); AEC central chamber, outer fields over dense anatomy | WHO-TECH p.6–7; EC16260 p.21; S10b-2, S10b-9 | Is a factor of 2 acceptable as a teaching value? Is the three-field lateral AEC layout sensible? | P |
| S12-11 | Chin and arms are scored but not drawn on the lateral image; `arms-over-lungs` is a critical finding; the final list of lateral critical findings (cut-off, gross exposure) is open | BONTRAGER-9 p.84–85, 94; S10b-13 | Confirm the list of critical findings. | E |
| S12 asset | The Lateral baseline is a normal adult lateral of a **different person** from the PA case; labelled a teaching approximation; landmarks read by eye; arms / chin overlays absent | A-006 / A-007 | Confirm the landmark placement and that the mismatch is acceptable. | E |

### 1c. Session 13 additions (Chest AP supine; all provisional)

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S13-3 | **Tube-angle bands are an engine teaching choice:** full credit 3–7°, partial 1–10°, around Bontrager's "about 5° caudad" (perpendicular to the sternum) | BONTRAGER-9 p.96–97 (the 5° only) | Are the bands acceptable? Is 0° (clavicles over the apices) rightly only partial / fail? | E, P |
| S13-3 | AP rotation ±2° / ±5° (the PA numbers) | BONTRAGER-9 p.96 (equal distances; no angle) | Acceptable for the AP? | E, P |
| S13-3 | AP SID: full 180–185 cm, partial 102–200 cm (183 minimum where possible is Bontrager; the label requirement when shorter is not modelled) | BONTRAGER-9 p.96; ACR-PORTABLE Sec IV (102 cm) | Confirm the bands and whether the SID label should be scored. | E, P |
| S13-4 / S13-6 | AP rotation: magnitude only; the p.83 direction rule is not applied to the AP; the sign is defined by the result image (positive = spine to the viewer's right), which is the opposite physical turn to the PA | BONTRAGER-9 p.83, 96 | What is the AP direction rule (source needed)? | E |
| S13-2 | Weights = PA; critical findings = PA four; marker scored (weight 1, anatomical side, PA display); `state` supine expected; chin not scored | S10b-13, S10b-14, S10b-22 | Confirm. | E |
| S13-1 | Baseline = NIH ChestX-ray14 AP of a different person; position of the original exposure unknown; supine is a teaching approximation; landmarks read by eye; lower diaphragm cropped | A-008 / A-009 | Confirm the landmarks and that the mismatch with the patient and the position is acceptable. | E |
| S13 | AP attenuation 1 (AP path = PA reference); lateral selected by mistake uses the provisional 2× | S10b-9 | Acceptable? | P |

### 1d. Session 13b additions (scene drawings; no clinical value changed)

| ID | Provisional item | Basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S13b-1 | **Semi-erect AP drawing:** the head end is raised by 30° (a drawing value, never scored); patient and detector rise together; the tube angle is drawn from the VERTICAL, not from the perpendicular to the raised detector | none (no source gives a semi-erect angle or reference) | What is the usual head-end elevation, and is the tube angle measured from the vertical or from the detector perpendicular in a semi-erect AP? | E |
| S13b-1 | AP shoulders "rolled forward" is drawn as the shoulder lifting off the bed (side view) and the scapulae moving out of the lung field (detector view); arms are drawn at the sides, no hand / forearm rotation is shown | BONTRAGER-9 p.96 (shoulders rolled forward) | Is that an acceptable depiction of "arms rotated medially"? Should the hands be drawn? | E |
| S13b-1 | Lateral arms raised: both arms up beside the head with the hands resting near the top of the head; lowered: arms hanging over the lung field | BONTRAGER-9 p.84, 94 (arms raised) | Is the raised-arm posture drawn acceptably (support, crossed arms)? | E |
| S13b-1 | Frontal arms hang at the sides for the PA and AP; no hands-on-hips or elbow position is drawn | none in the repo notes | Should the PA show the hand / elbow position? | E |
| S13b-1 | Detector / tube drawings are not to scale (SID is drawn at 0.62 px per cm along the beam, the detector at 4.4 px per cm) | schematic | Acceptable as a schematic? | E |
| S13b-2 | **Lateral thorax drawing assumptions (all schematic):** the kyphosis curve of the thoracic spine, the heart as an oblique ellipse anterior and low, the two diaphragm domes as two close arcs, the shoulder joint above the lung field, arms lowered hanging straight down over the lung field; no scapula, humerus or vertebral detail is drawn | BONTRAGER-9 p.84, 94 (position, arms raised) only; no landmark geometry in the repo | Are these positions acceptable as a schematic? Should the lowered arm hang straight or be flexed? | E |
| S13b-2 | AP side view: the head is drawn face up on the bed, the near arm along the side, the leg and foot are generic; the SID is drawn parallel to the central ray from the tube to the detector, the reference tick on the same line | none (schematic) | Acceptable? | E |
| S13b-2 | Plan view: the rotation arc is drawn between the reference axis and the shoulder axis; for a lateral the reference axis lies along the beam | S12-2 / S13-6 conventions (unchanged) | Confirm the reference axis for the lateral. | E |

### 1e. Session 14.1a additions (Wrist PA / Lateral; docs only, teaching-choice values; nothing implemented, all provisional)

Reference: [`RAD-LAB_Medical_Reference_Wrist.md`](RAD-LAB_Medical_Reference_Wrist.md). Numbers marked "proposal" are **not yet fixed**; S14.1c fixes them and updates this table.

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S14.1-4a | **kV partial-credit bands** outside the Bontrager full bands 55–65 (PA) / 60–70 (lateral); proposal: about 10 kV beyond each edge of the full band | BONTRAGER-9 p.156 / 158 give only 60 ± 5 / 65 ± 5 (digital); the partial bands are an engine teaching choice | Acceptable partial range for a digital wrist? | E, P |
| S14.1-4b | **SID:** minimum 102 cm (40 in) is Bontrager; the **upper full-credit limit and the partial band are a teaching choice** (proposal by analogy with S13-3: full credit within a few cm of 102) | BONTRAGER-9 p.156 / 158 (minimum only) | What upper limit would a department accept? | E |
| S14.1-4c | **Rotation tolerance ±2° full, ±5° partial, magnitude-only feedback** for the wrist (the numbers of the chest exams) | none (Bontrager gives the image criteria, no tolerance) | Are chest-sized tolerances sensible for forearm pronation / supination? Should the lateral differ? | E |
| S14.1-4d | **Numeric collimation margin** around distal radius / ulna and mid-metacarpals | BONTRAGER-9 p.156 / 158 give what to include, not a margin | How tight / loose is acceptable? | E |
| S14.1-4e | **Exposure reference for the wrist** (a manual-technique teaching constant; **no numeric mAs target, no EI / EIT / DI number, no AEC claim**) | Bontrager as supplied is silent on mAs / AEC (O26) | Is manual-only acceptable? Supply a source for mAs / AEC if one exists. | E, P |
| S14.1-4f | **Critical findings:** `missing-marker` and `wrong-side-marker` only (educator decision, provisional); whether `wrong-projection` / `patient-motion` also apply (O24) | BONTRAGER-9 p.32–33 (marker required, side) | Agree with the minimal list? | E |
| S14.1-4g | **Category weights without breathing** (option A: 28 / 22 / 17 / 22 / 11) (O22) | derived from the PA weights S10b-14; not a medical claim | Which distribution? | E |
| S14.1-4h | **Marker display on a single limb** (O21) and **unscored items** (shoulder-elbow-wrist plane, hand arch, shielding) | BONTRAGER-9 p.32–33, 36, 156, 158 | Is the unscored list acceptable for v1? | E |
| S14.1-4i | Spot-check of the **advisor-supplied wrist claims** (p.156, 158, as in the reference §3–§4) against the printed pages | claims not re-verified by Claude Code | Confirm each claim and page number. | E |

### 2b. Session 14.1c additions (wrist PA and wrist lateral; all provisional)
| ID | Item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S14.1c-R1 | **Rotation effect drawn from ONE baseline image (since S-VIS-1b: 2.5D wrist model, gain 2.3× a teaching exaggeration; PA: unequal metacarpal spacing + the ulna and radius moving as two layers; lateral: far / near copies of the bands that must be superimposed; numbers by eye, O73).** An EDUCATIONAL VISUAL APPROXIMATION; sign defined by the result image, no direction of turn claimed (S14.1c-2, S14.1c-5, O31) | Criteria: BONTRAGER-9 p.156 / 158; magnitudes: `tuning.ts` `limbRotation` (none sourced) | Do these cues read as the true-PA / true-lateral criteria, or are real rotated radiographs needed? | E, P |
| S14.1c-R2 | Rotation tolerance ±2° full / ±5° partial (the chest numbers) | none (engine teaching choice) | Acceptable for the wrist? | E |
| S14.1c-R3 | kV: full 55–65 (PA) / 60–70 (lateral) are Bontrager; **partial 50–70 (PA) / 55–75 (lateral) are teaching choices** | BONTRAGER-9 p.156 / 158; S14.1c-6 | Partial bands? | E |
| S14.1c-R4 | SID: 102 cm minimum is Bontrager; **full band 102–110, partial 95–130 cm are teaching choices** | BONTRAGER-9 p.156 / 158 | Upper limit? | E |
| S14.1c-R5 | **Manual exposure reference point** (60 / 65 kV, 2.5 mAs, 102 cm → DI 0; kV exponent 3; attenuation 1) — a model anchor with no clinical claim; no numeric mAs target, no AEC (O26) | none | Is a manual-only, anchor-based exposure check acceptable until a limb technique source is read? | P |
| S14.1c-R6 | Centring tolerances (±0.7 / ±0.9 cm full, ±1.8 / ±2.2 cm half) and the midcarpal target read by eye on the baselines | BONTRAGER-9 p.156 / 158 (target); tolerances none | Tolerances and target position? | E |
| S14.1c-R7 | **3.5 cm excess-collimation margin** (the field must also include the marker) | none | Margin? | E |
| S14.1c-R8 | **Required region is limited by the baseline images**: they end at the proximal metacarpals, so the mid-metacarpal area Bontrager names cannot be shown (O28) | S14.1c-7 | Accept, or source better images? | E |
| S14.1c-R9 | Category weights 28 / 22 / 17 / 22 / 11 (O22 option A); critical findings = missing and wrong-side marker only; marker rule `fixed-side` (letter only, no viewer half; side fixed in exam data, O29) | S14.1b-1, S14.1c-4 | Weights, gate list, single-limb marker convention? | E |
| S14.1c-R10 | Unscored context in the scene (shoulder-elbow-wrist level, hand arch, shielding, grid) and the unscored keep-still check (weight 0) | reference §5; O30 | Which should become scored? | E |
| S14.1c-R11 | Case patient 31-year-old male, same real left wrist in both exams (per the Commons description; CC0, A-010…A-013); lateral baseline cropped to remove a burned-in side text | S14.1c-1, S14.1c-3 | Is using the image's own description acceptable? | Owner |
| S14.1c-R12 | Arabic wrist terms and sentences (DRAFT) | `ARABIC_TERMINOLOGY.md` Session 14.1c | Confirm or correct. | AR |
| S14.2b-R1 | **Hand PA / lateral (extension) classification.** SOURCE-BACKED (Bontrager): PA CR at the third MCP joint; lateral CR at the centre of the second–fifth MCP joints; perpendicular CR; SID minimum 102 cm; 24 × 30 cm portrait receptor; non-grid; digital kV 60 ± 5 (PA) / 65 ± 5 (lateral); entire hand and wrist plus about 2.5 cm of distal forearm; true-PA / true-lateral criteria | BONTRAGER-9 p.150 / 153 | Confirm against the book | E |
| S14.2b-R2 | kV: **partial bands 50–70 (PA) / 55–75 (lateral) are teaching choices** | none | Partial bands? | E |
| S14.2b-R3 | SID: **full band 102–110 cm, partial 95–130 cm are teaching choices** | BONTRAGER-9 p.150 / 153 (minimum only) | Upper limit? | E |
| S14.2b-R4 | Rotation ±2° full / ±5° partial; magnitude-only feedback | none | Acceptable for the hand? | E |
| S14.2b-R5 | Centring tolerances (≈ ±0.7 cm x / ±0.75 cm y full, ≈ ±1.8 cm half) and the two MCP targets **read by eye** on the baselines | BONTRAGER-9 (target joints); tolerances none | Tolerances and target position? | E |
| S14.2b-R6 | **Excess-collimation margin: PA 3.5 cm, lateral 6.5 cm** (the field is centred on the ray and the MCP lies off the middle of the required region, so the lateral has an unavoidable one-sided excess of ≈ 5.6 cm; O40) | none | Margin? Allow an offset field? | E |
| S14.2b-R7 | **Required region** = fingertips → 2.5 cm below the radiocarpal joint; **image scale 0.0113 cm / px assumed** (not measured); the baselines show more forearm (PA ≈ 3 cm, lateral ≈ 4 cm beyond the 2.5 cm line) (O41) | BONTRAGER-9 ("about 2.5 cm"); scale none | Accept the estimate, or supply a calibrated image? | E |
| S14.2b-R8 | **Hand rotation drawing = educational approximation from ONE image**: PA = a horizontal bump over the phalangeal and metacarpal bands (unequal spacing; bone and soft tissue move together; the concavity change itself is not drawn); lateral = a second, offset copy of the finger / metacarpal column and of the distal radius / ulna (the thumb is excluded). No direction of turn is claimed (O31, O32 closed with these limits) | BONTRAGER-9 p.150 / 153 (criteria) | Acceptable teaching images, or real rotated radiographs needed? | E |
| S14.2b-R9 | Manual exposure reference point (60 / 65 kV, 2.5 mAs, 102 cm → DI 0; attenuation 1): a model anchor, no clinical claim, no AEC. **No exposure-appearance wording** is used (no hand source, O35) | none | As R5 of the wrist | P |
| S14.2b-R10 | Weights 28 / 22 / 17 / 22 / 11; critical findings = missing / wrong-side marker only; letter-only `fixed-side` marker (L) | S14.2-5, S14.2-8 | Weights, gate list? | E |
| S14.2b-R11 | Not scored (context only): finger spread / extension posture, thumb obliquity, shielding, compensation filter, foam support, grid | reference §5; O30 | Which should become scored? | E |
| S14.2b-R12 | Case patient 31-year-old male, the same real left hand in both exams (per the author; CC0 as seen by the owner, Commons API HTTP 429, O39); burned-in text removed by a documented fill (S14.2-7); one small local fill artefact remains in the lateral | S14.2-8, S14.2-9 | Is using the image's own description acceptable? | Owner |
| S14.2b-R13 | Arabic hand terms and sentences (DRAFT); the scene labels use the abbreviation «MCP» | `ARABIC_TERMINOLOGY.md` Session 14.2b | Confirm or correct. | AR |
| S14.2b-R14 | **Hand 2.5D rotation model** (all numbers illustrative, read by eye): tube cross-sections (bone widths 54–80 px, palm 860 × 310 px, forearm 580 × 340 px), digit depth arch (Z −40…+25 px), thumb Z −310…−368 px (from the lateral baseline), digit X-spread factor 0.3 / 0.6 in the lateral pose, drawn gain 2.3° per degree, rotation axis (forearm) at x 490 (PA) / 460 (lateral) px | none (engine / teaching choice) | Is this an acceptable teaching illustration of the turn about the forearm axis? | E |
| S14.2b-R15 | Result render options: hand result at 48 px/cm (cap 1.8 Mpx), hand-lateral view = region + marker + 3 cm; thumb cap 0.06 of the width in the PA picture; picture limits of O46 | none | — | E |

### 2c. Session 14.3 additions (elbow AP and elbow lateral; all provisional)
| ID | Item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S14.3-R1 | **Classification.** SOURCE-BACKED (Bontrager p.166 / 172, as supplied by the advisor): AP CR perpendicular at the mid-elbow joint ≈ 2 cm distal to the epicondylar midpoint; lateral CR perpendicular at the mid-elbow; SID minimum 102 cm; 24 × 30 cm receptor, four-sided collimation; non-grid; digital 70 ± 5 kV; true-AP / true-lateral criteria | BONTRAGER-9 p.166, 172 | Confirm the criteria and the kV band for digital use | E |
| S14.3-R2 | kV: **partial 60–80 kV (both) is a teaching choice** | none | Partial band? | E |
| S14.3-R3 | SID: **102–110 cm full, 95–130 cm partial are teaching choices** (only the 102 cm minimum is Bontrager) | none | Band? | E |
| S14.3-R4 | Centring tolerances (≈ ±0.7 / ±0.75 cm full, ≈ ±1.8 cm half), collimation excess margins (AP 3 cm, lateral 4.5 cm), the extent of both required regions | none (engine teaching choices; O40-like one-sided margin in the lateral) | Acceptable? | E |
| S14.3-R5 | Rotation tolerance ±2° full / ±5° partial, magnitude only, no direction text | none | Acceptable for the elbow? | E |
| S14.3-R6 | **Elbow rotation drawings = educational approximations from ONE image each** (AP: epicondyles narrow, radius / ulna apart or superimposed; lateral: doubled condyle outline and radial head / coronoid, 60 % / 40 %); the concentric arcs and double ridges are NOT drawn; all numbers illustrative (gain 2.3, columns, Z offsets, half-distances 95 / 75 px) | criteria BONTRAGER-9 p.166 / 172; magnitudes `elbow-model.ts`, `tuning.ts` (O49, O50) | Acceptable teaching images? | E / P |
| S14.3-R7 | Manual exposure reference (70 kV, 2.5 mAs, 102 cm → DI 0; attenuation 1): a model anchor, no clinical claim, no AEC. No exposure-appearance wording (no elbow source, O35) | none | As R5 of the wrist | P |
| S14.3-R8 | Weights 28 / 22 / 17 / 22 / 11; critical findings = missing / wrong-side marker; letter-only `fixed-side` marker (L) | S14.3-5 | Weights, gate list? | E |
| S14.3-R9 | Not scored (context only): shielding, anode-heel placement, fat-pad visibility, arm / shoulder position, flexion-angle exceptions, support under the hand, grid | reference §5; S14.3-5 | Which should become scored? | E |
| S14.3-R10 | Case patient 31-year-old male, the same real left elbow in both exams (per the author; CC0 as seen by the owner, Commons API HTTP 429, O47); AP: "Sin" filled, "F" and a frame line cropped (O48); lateral: no text | S14.3-5…7 | Is using the image's description acceptable? | O |
| S14.3-R11 | Arabic elbow terms and sentences (DRAFT) | `ARABIC_TERMINOLOGY.md` Session 14.3 | Confirm or correct. | AR |
| S14.3-R12 | Result render options: 48 px/cm (cap 1.8 Mpx), view = region + marker + 0.5 cm; image scale 0.0155 cm / px assumed (O49) | none | — | E |

### 2d. Session 14.4 additions (knee AP / lateral, foot AP / oblique, right side; Phase A rows — the build rows are added with the code; all provisional)
| ID | Item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| **S14.4-R1** | **Classification.** SOURCE-BACKED (Bontrager, as supplied by the owner): foot AP CR 10° toward the heel (high arch 15°, low arch 5°) at the base of the 3rd metatarsal; foot oblique CR perpendicular, plantar surface 30°–40° (40° recommended); knee AP CR parallel to the tibial plateau (perpendicular for ASIS-to-table 19–24 cm, 3–5° caudad < 19 cm, 3–5° cephalad > 24 cm), 1.25 cm distal to the patellar apex; knee lateral flexion 20°–30°, CR 5°–7° cephalad, 2.5 cm distal to the medial epicondyle; receptors, SID minimum 102 cm, non-grid distal to the knee and grid > 10 cm; digital 65 ± 5 kV (foot) / 75 ± 5 kV (knee); true-position criteria | BONTRAGER-9 p.224–225, 232, 233, 246, 249 | Confirm the criteria, angles and kV bands for digital use | E |
| **S14.4-R2** | **Knee lateral baseline contains a minimal osteophyte at the superior patellofemoral rim** (per its Commons description) — accepted by the owner as a near-normal teaching image; no pathology wording in the product | Commons description via the owner (A-024, O57) | Is the image acceptable as a normal baseline? | E |
| **S14.4-R3** | **Knee lateral baseline flexion ≈ 45° by eye vs Bontrager 20°–30°**; no medical value changed | A-024, O58 | Is a flatter image needed? | E |
| **S14.4-R4** | kV partial bands, SID full / partial bands, centring and tube-angle tolerance bands, excess-collimation margins, required regions, rotation ±2° / ±5°, manual reference point: **teaching choices** (values fixed in the build, to be added here with the code) | none (class B) | Acceptable? | E / P |
| **S14.4-R5** | Case choices (class C): average patient (knee AP 0°, knee lateral 6° cephalad target) and average arch (foot AP 10°); knee lateral on 24 × 30 cm; weights 28 / 22 / 17 / 22 / 11; critical findings = missing / wrong-side marker; right-side letter-only `fixed-side` marker | S14.4-3 | Weights, gate list, case choices? | E |
| **S14.4-R6** | Grid rule (> 10 cm) is stated but not a control; shielding, posture, arch height as a patient attribute are not scored | reference §3, §8 (O64) | Which should become scored? | E |
| **S14.4-R7** | Images: four right-limb CC0 originals, owner-verified (Commons `imageinfo` 429), burned-in "Dx" handled in Phase B; foot oblique stops at the proximal tarsals (O61); scale and landmarks by eye (O62); foot DP file size differs from the owner's statement (O59) | A-022 … A-029 | Acceptable teaching images? | E / O |
| **S14.4-R8** | Arabic knee / foot terms and sentences (DRAFT; added to `ARABIC_TERMINOLOGY.md` with the UI strings in the build) | reference §11 | Confirm or correct | AR |
| **S14.4-R9** | **Build values — Bontrager (class A, as supplied):** foot AP CR 10° toward the heel (cephalad, −10° on the control) at the base of the 3rd metatarsal; foot oblique CR perpendicular, plantar surface 30°–40° (40° recommended); knee AP CR perpendicular for an average patient, 1.25 cm below the patellar apex (the picture places it at the joint); knee lateral CR 5°–7° cephalad at the joint; kV 65 ± 5 (foot) / 75 ± 5 (knee); SID minimum 102 cm; 24 × 30 cm receptor | BONTRAGER-9 p.224-225, 232, 233, 246, 249 | Confirm the values for digital use | E |
| **S14.4-R10** | **Build values — engine teaching choices (class B):** kV partial bands (55–75 foot, 65–85 knee), SID 102–110 / 95–130 cm, tube-angle bands (foot AP −12…−8 / −15…−5, perpendicular ±2° / ±5°, knee lateral partial −10…−3), foot oblique partial band 25°–45°, rotation ±2° / ±5° (magnitude only), centring tolerances (±0.7 / ±0.75 cm full), excess margins (knee 3.5, foot AP 6.5, oblique 7.5 cm), required regions, image scale (0.0125 / 0.0100 / 0.0090 cm / px), manual reference point (65 / 75 kV, 2.5 mAs, 102 cm → DI 0) | S14.4-3, S14.4-14, S14.4-16 (none is Bontrager) | Acceptable? | E / P |
| **S14.4-R11** | **Rotation drawings = educational approximations from ONE image each:** foot AP / oblique (columns displaced by depth, oblique value = angle − 40°), knee AP (whole-leg warp + fibula / tibia layers), knee lateral (far / near copies); illustrative gain 2.3, depth offsets, half-distances; the picture's own foot obliquity is unmeasured; tuberosity profile, cuboid spaces, sinus tarsi, patella plane, tibial facets not drawn | BONTRAGER-9 criteria; `lower-limb-model.ts` (O62, O63, O71) | Acceptable teaching images? | E / P |
| **S14.4-R12** | **Case choices (class C):** 31-year-old male for the knees (Commons snippet), the foot cases the same adult description (unconfirmed, O65); average build (ASIS-to-table about 21 cm) and average arch; right limb; critical findings = missing / wrong-side marker (letter only); weights 28 / 22 / 17 / 22 / 11 | S14.4-3, S14.4-12 | Weights, case wording? | E / O |
| **S14.4-R13** | **Images (S14.4-17):** masters carry a bright edge strip and burned-in text; web copies = fills / crops (foot AP 1061 × 2405, oblique 1077 × 1960); faint patches may remain at high contrast; the knee lateral shows a minimal osteophyte at the superior patellofemoral rim (per its Commons description) and a flexion of ≈ 45° vs Bontrager 20°–30° (O57, O58) | A-022 … A-029 | Acceptable baselines? | E |

### 2e. Session 14.5 additions (ankle AP / lateral, left side inferred; Phase A rows — the build rows are added with the code; all provisional)
| ID | Item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| **S14.5-R1** | **Classification.** SOURCE-BACKED (Bontrager, as supplied by the owner): SID minimum 102 cm; 24 × 30 cm portrait, non-grid; digital 70 ± 5 kV; CR perpendicular (AP midway between the malleoli, lateral at the medial malleolus); AP true position = lower leg not rotated, intermalleolar line not parallel to the receptor (lateral malleolus about 15° more posterior); lateral knee flexion about 45°, foot dorsiflexed as tolerated; image criteria (medial mortise open / lateral closed; fibula over the posterior half of the tibia; tibiotalar joint open) | BONTRAGER-9 p.239, p.242 | Values match the book? | E |
| **S14.5-R2** | **Side LEFT is inferred** from the fibula position on the AP image (the Commons pages do not state it) | A-030, O76 | Confirm the side. | E |
| **S14.5-R3** | **Baselines: a 24-year-old male, 3 weeks after a sprain, no injuries seen; the lateral is \"somewhat suboptimal\" (not straight through the joint)** — accepted as documented limits; no pathology wording in the product | Commons descriptions via the owner (A-030, A-032, O78) | Acceptable as normal teaching images? | E |
| **S14.5-R4** | **Coverage gaps:** the AP lacks the proximal half of the metatarsals; the lateral lacks a clear 5th metatarsal tuberosity (navicular / cuboid partial); the required regions are limited to what the images show | O77 | Acceptable? | E |
| **S14.5-R5** | kV partial band 60–80, SID bands, centring and tube-angle tolerances, excess-collimation margins, required regions, rotation ±2° / ±5°, manual reference point: **teaching choices** (values fixed in the build, to be added here with the code) | none (class B) | Acceptable? | E / P |
| **S14.5-R6** | **Build values (class B, fixed in the build):** kV partial band 60–80; SID 102–110 full / 95–130 partial; centring ±0.06 / ±0.05 normalised full, ±0.15 / ±0.12 partial (≈ ±0.7 / ±0.75 cm, ±1.8 cm); tube angle and rotation ±2° / ±5°; excess-collimation margin 5 cm (AP) / 4.5 cm (lateral); required regions AP ≈ 8.3 × 16.3 cm, lateral ≈ 11.3 × 18.9 cm; scale 0.0125 cm / px; manual reference point 70 kV, 2.5 mAs at 102 cm (model anchor) | `lower-limb-geometry.ts`, `lower-limb-common.ts`, `lower-limb-technique.ts` (S14.5-9) | Acceptable? | E / P |
| **S14.5-R7** | **Rotation drawings (illustrative):** AP = one smooth warp of leg and ankle by the malleolus / plafond columns (the fibula's overlap is not drawn); lateral = far / near copies of the distal-fibula and tibiotalar windows; gain 2.3; depths and half-distances by eye | `lower-limb-model.ts` (S14.5-11, O80) | Acceptable teaching images? | E / P |
| **S14.5-R8** | **Case choices (class C):** 24-year-old male (the image descriptions only); left ankle (inferred); critical findings = missing / wrong-side marker (letter only); weights 28 / 22 / 17 / 22 / 11; no pathology wording | S14.5-5, S14.5-6 | Weights, wording? | E / O |

## 3. PA discrepancies (O11)
Provisional decisions S10b-1…3: kV range (EC / WHO / ACR vs the repo's 100–150 band), AEC chamber mapping (EC right lateral chamber vs the repo's detector-view left/right), rotation sign (WHO p.28 direction not interpreted). Questions are in rows S10b-1, S10b-2, S10b-3 above.

## 4. Existing open items (not new)
O2 (27 × 31 cm region), the whole Chest PA checklist, the preview banner wording and all Arabic (below) — see [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md).

## 5. Arabic review groups (all machine-assisted, none reviewed) — [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md)

| Group | Content | Status |
|---|---|---|
| **AR-A** | Chest PA UI terms (first table): categories, console, positioning, feedback, effect cards, technique, evidence badges, result strings, **preview banner** | in the UI today |
| **AR-B** | Session 8 feminine forms for the female case (patient instructions, home card, case text) | in the UI today |
| **AR-C** | Session 9 platform shell strings (catalogue, breadcrumb, 404, redirect stub, Practice blurb) | in the UI today |
| **AR-D** | Session 10 Chest Lateral proposed terms | **not in the UI**; the marker row is not to be adopted before O6 |
| **AR-E** | Session 10 Chest AP proposed terms | **not in the UI** |

Question for the AR reviewer: confirm or correct each term in the final column of `ARABIC_TERMINOLOGY.md`; keep left / right wording as "the viewer's side of the displayed image".

## 6. Owner-proposed Arabic corrections (owner-approved, to apply in a UI text session; no UI string changed)
Listed in full in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md), section "Owner-proposed corrections". Question for the **AR** reviewer on each: accept, reject or reword. Covers: breath wording (نَفَس), "able to stand" wording, the age pattern (number agreement 3–10), "الكاشف" for detector throughout (keep "البكي" for Bucky), "لوحا الكتف", the posterior costophrenic angle term, "البقاء ساكنًا", preference for "الإسقاط", and three new terms (leaning slightly forwards, holding the support arm, patient-position label). Collimation and quantum-noise wording are left to the educator.

## Pelvis AP reference — 2026-10-15 (docs only, no UI/code)

| Item | Source/basis | Review question | Reviewer |
|---|---|---|---|
| PELVIS-R1: SID ≥102 cm, IR 35 × 43 cm landscape, grid, digital 85 ± 5 kV | BONTRAGER-9 p.279, direct reading | Confirm reference interpretation and local technique applicability; no mAs/EI/AEC calibration chosen | Educator/physicist, O5/O81/O83 |
| PELVIS-R2: supine alignment, legs internally rotated 15°–20°, perpendicular CR about 5 cm below ASIS, four-sided coverage | p.271–272, 279 | Confirm non-trauma scope and strict separation of pelvic rotation from leg positioning; retain fracture/dislocation warning | Educator, O82 |
| PELVIS-R3: pelvic symmetry, trochanter/neck criteria, exposure detail/no motion | p.279 | Which cues can be represented honestly from one radiograph? No pixel model or tolerances approved | Educator, O81/O85 |
| PELVIS-R4: suspend respiration, no specified phase | p.279 | Agree instruction/assessment without reusing chest inspiration as a pelvis target | Educator/owner, O83 |
| PELVIS-R5: rubric, marker, AEC/manual scope | No settled pelvis rubric/protocol | Choose weights/critical list/marker convention; do not copy single-limb defaults | Educator/owner/physicist, O83 |
| PELVIS-R6: owner-supplied image, public-domain page | Commons case-1 page read 2026-10-15; candidate not clinical ground truth | Confirm coverage and suitability; burned-in marker/edge graphics require documented treatment before adoption | Educator/owner, O84 |
| PELVIS-R7: historical shielding content | 2018 book, not adopted | Review contemporary authoritative practice before product wording; not scored in this phase | Physicist, O86 |
| PELVIS-R8: Arabic proposed terms | Machine-assisted draft in ARABIC_TERMINOLOGY | Review anatomy and phase-neutral breath-hold wording | Arabic reviewer/educator |

## Pelvis AP implementation — S-PELVIS-1, pending educator/physicist/Arabic review

| Item | Basis | Question / limitation |
|---|---|---|
| Clinical setup / technique | BONTRAGER-9 p.271–272,279 | Confirm non-trauma supine scope, ≥102cm, grid, digital80–90kV, perpendicular CR and phase-neutral breath suspension. Trauma warning retained. |
| Numerical grading | Explicit engine teaching choices, same previous-exam pattern (S-PELVIS-1-3) | rotation ±2°/±5°; SID102–110/95–130; kV partial75–95; centering1/2.5cm; max excess2.6cm; weights25/20/15/20/10/10, pass70, marker-only critical gate. None is a clinical tolerance/rubric. |
| Exposure model | Anchor85kV/2.5mAs/102cm, exponent3, attenuation1, inherited generic DI bands | Not a clinical mAs prescription, calibrated device or universal EI/DI standard. Manual-only is a v1 simplification. |
| Geometry and resolution | Box100…2640/30…2070 of2675×2084, scale0.015cm/px, CR(1337.5,1042); render48px/cm | All by-eye/assumed, not measured patient dimensions; below original pixel resolution. O84. |
| Pelvic rotation | Existing generic `limb-warp`, authored monotone anchors, gain2.3 | One-image asymmetry, not measured projection; no independent occlusion reconstruction. Scene/result share anchors. O85. |
| Leg position | Internal15°–20° source-backed; neutral/external choices separate | Position shown schematically; hidden trochanters and femoral-neck foreshortening NOT synthesized. Failed rule explicitly labelled not drawn. |
| Respiration and motion | Phase-neutral choice, no chest inspiration model | Breath instruction assessed without deforming lungs/pelvis; keep-still drives visible motion blur but has no separate scored/observed-instruction row. No change to the prior ResultPanel translation issue. |
| Image/Arabic | A-034/A-035/A-036; machine-assisted bilingual additions | Confirm source description/coverage/normality, new Arabic wording and anatomy. Historical shielding is not a new product protocol. |

## Shoulder Grashey reference — S-SHOULDER-REF, pending review

| Item | Source/basis | Review question / owner |
|---|---|---|
| SHOULDER-R1 clinical setup | BONTRAGER-9 p.196, directly read | Educator: confirm adult non-acute-trauma Grashey scope, body35°–45° with habitus/posture variability, separate neutral arm posture, CR/joint and collimation criteria |
| SHOULDER-R2 technique | p.196: SID≥102cm, landscape18×24 or24×30, grid, digital75–85kV, phase-neutral suspension | Physicist/educator: choose posture/detector/local protocol. No mAs/EI/error bands/rubric selected, O88/O89 |
| SHOULDER-R3 image | Owner CC0/description screenshots; API403, exact link supplied; official page HTTP403 | Owner/educator: canonical match and original, coverage/side, recurrent-dislocation history suitability; not asymptomatic normal, O87/O91 |
| SHOULDER-R4 model | No implementation; source describes joint-space/rim overlap, not a pixel warp | Educator/owner: feasibility/sign/absolute-versus-offset angle; no hidden-surface fabrication, O90 |
| SHOULDER-R5 Arabic/shielding | Draft terms; historical2018 shielding not adopted | Arabic/educator and physicist reviews O5/O86; no new UI or shielding scoring |
