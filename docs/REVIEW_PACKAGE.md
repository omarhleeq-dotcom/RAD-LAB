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
