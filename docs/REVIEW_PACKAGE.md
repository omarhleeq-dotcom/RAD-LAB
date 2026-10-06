# Review package for the educator / medical physicist (O5, S10b-17)

**Status:** created in the Session 10b follow-up (docs only). Everything below is **provisional**: nothing is validated, nothing in code, data or scoring changed. The long list of Chest PA items is in [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md); this file adds the items created since (Sessions 10 – 10b). Decisions are in [`DECISIONS.md`](DECISIONS.md); sources in [`sources/REGISTER.md`](sources/REGISTER.md).

**Source provenance for the reviewer:** claims in `docs/sources/*.md` were recorded from the owner's advisor reading (full text read by the advisor; not re-verified against the originals by Claude Code). **Please spot-check the locators** against the originals (EC16260 PDF pp.15, 20, 21; WHO-CHEST pp.3, 4, 5, 17, 27–29, 32; ACR-CHEST Sec I, IV, VI; ACR-PORTABLE Sec I, II, IV, VI; WHO-TECH pp.4, 6–10; BONTRAGER-9 pp.32, 33, 36, 81–84, 87, 92, 94, 96; CLARK-12 p.10; STATPEARLS-POS sections "Projections", "Positioning – Chest" and its licence).

Reviewer key: **E** = radiography educator · **P** = medical physicist · **AR** = Arabic reviewer.

## 1. Provisional owner decisions (2026-10-06)

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S10-5 | *(Superseded by S10b-21 / S10b-22: the Lateral / AP marker defaults are replaced by Bontrager's rules.)* | — | — | — |
| S10b-1 | kV rubric (PA / Lateral / AP): optimal 110–125; partial 100–109 and 126–150 (PA part implemented in the "PA scoring update" session after physicist review) | **BONTRAGER-9 p.81, 92, 94, 96 (governing, S10b-25)**; supporting: EC16260 p.20, WHO-CHEST p.3, ACR-CHEST, WHO-TECH p.6 | Confirm the bands (WHO-CHEST p.3 says contrast drops above 140 kV; partial credit runs to 150). | P |
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
| S10b-26 | PA / Lateral SID target ≥ 183 cm; 180 cm treated as rounding (PA part in the "PA scoring update" session) | BONTRAGER-9 p.92, 94 | Confirm. | E, P |
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

## 6. Owner-proposed Arabic corrections (pending educator review; no UI string changed)
Listed in full in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md), section "Owner-proposed corrections". Question for the **AR** reviewer on each: accept, reject or reword. Covers: breath wording (نَفَس), "able to stand" wording, the age pattern (number agreement 3–10), "الكاشف" for detector throughout (keep "البكي" for Bucky), "لوحا الكتف", the posterior costophrenic angle term, "البقاء ساكنًا", preference for "الإسقاط", and three new terms (leaning slightly forwards, holding the support arm, patient-position label). Collimation and quantum-noise wording are left to the educator.
