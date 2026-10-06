# Review package for the educator / medical physicist (O5, S10b-17)

**Status:** created in the Session 10b follow-up (docs only). Everything below is **provisional**: nothing is validated, nothing in code, data or scoring changed. The long list of Chest PA items is in [`REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md); this file adds the items created since (Sessions 10 – 10b). Decisions are in [`DECISIONS.md`](DECISIONS.md); sources in [`sources/REGISTER.md`](sources/REGISTER.md).

**Source provenance for the reviewer:** claims in `docs/sources/*.md` were recorded from the owner's advisor reading (full text read by the advisor; not re-verified against the originals by Claude Code). **Please spot-check the locators** against the originals (EC16260 PDF pp.15, 20, 21; WHO-CHEST pp.3, 4, 5, 17, 27–29, 32; ACR-CHEST Sec I, IV, VI; ACR-PORTABLE Sec I, II, IV, VI; STATPEARLS-POS sections "Projections", "Positioning – Chest" and its licence).

Reviewer key: **E** = radiography educator · **P** = medical physicist · **AR** = Arabic reviewer.

## 1. Provisional owner decisions (2026-10-06)

| ID | Provisional item | Source / basis | Question for the reviewer | Who |
|---|---|---|---|---|
| S10-5 | Lateral / AP marker default = unscored, ungated (until a full-text source and owner decision) | Owner decision; no source states a lateral / AP viewer-side convention | Is there a published convention for the marker letter on a lateral and an AP chest display? | E |
| S10b-1 | PA kV rubric: optimal 120–140; partial 100–119 and 141–150 | EC16260 p.20 (125 kV example); WHO-CHEST p.3 (120–140 good, contrast drops above 140); ACR-CHEST (120–150) | Are these bands acceptable for a teaching rubric? Is partial credit up to 150 kVp appropriate given WHO p.3? (changes PA scoring later) | P |
| S10b-2 | AEC: PA either lateral lung chamber; Lateral central; AP portable manual exposure recorded | EC16260 p.20–21; ACR-PORTABLE Sec IV | Is the central chamber right for a lateral on current systems? Is "either lateral chamber" right for PA (EC example names the right lateral chamber)? | P |
| S10b-3 | Rotation scored by magnitude only; sign not interpreted | WHO-CHEST p.28 gives a direction (not used) | Is ignoring the sign acceptable for teaching? | E |
| S10b-4 | Lateral offers both sides; left correct by default; right only if the case requests it | ACR-CHEST Sec I, IV (routine = PA + left lateral); STATPEARLS-POS | Confirm the left default and when a right lateral is the correct choice. | E |
| S10b-5 | Lateral centring: T7 level, mid-axillary line | **No read source** for the erect lateral (STATPEARLS-POS T7 is for the lateral decubitus); WHO-TECH to obtain | Confirm the level and the mid-axillary line for the erect lateral. | E |
| S10b-6 | Lateral: both arms raised above the head, clear of the lung fields | EC16260 p.21; STATPEARLS-POS | Confirm; is a one-arm-down variant ever acceptable? | E |
| S10b-7 | Lateral rotation: posterior rib separation ≤ 1 cm acceptable | **No primary source** (EC16260 p.21 states the criterion, not a distance) | Is 1 cm a defensible teaching tolerance? What should replace it if not? | E, P |
| S10b-8 | Marker presence required and scored (PA, Lateral, AP); PA letter rule unchanged; Lateral / AP letter unscored; AP patient-position label | ACR-CHEST Sec IV QC; ACR-PORTABLE QC | Presence weight? Is scoring presence acceptable when the letter rule is unscored? Which position labels are expected? | E |
| S10b-9 | No numeric mAs target; exposure as under / adequate / over; correct AEC chamber | ACR (mid-grey display); owner decision | How should "adequate" be defined without an EI target? (EI / DI limits are not universal — PA Technique reference) | P |
| S10b-10 | AP: SID ≥ 183 cm optimal, 102–183 acceptable, < 102 incorrect; kVp 70–100 without grid, > 100 with grid | ACR-PORTABLE Sec IV (ranges); 72 in = 183 cm, 40 in = 102 cm are conversions, not source | ACR states ranges, not a grading scheme: is this grading fair? Is 183 cm "optimal" for a supine patient? | E, P |
| S10b-11 | AP magnification computed from geometry, shown for teaching, not scored | Geometry (derivation, not a medical claim); WHO-CHEST p.4 (direction, mechanism) | Verify the formula, the object-distance assumption and the display. | P |
| S10b-12 | Session 13 starts with the supine portable AP | ACR-PORTABLE Sec IV; WHO-CHEST p.4, 17 | Confirm this is the right first AP variant; confirm how it is positioned (no positioning source read). | E |
| S10b-13 | Critical findings (Lateral / AP): anatomy cut-off, arm over lung fields (Lateral), missing marker, gross exposure error | Owner decision, same gate structure as PA | Finalise the list and the thresholds. | E |
| S10b-14 | Lateral / AP reuse the PA weights (25/20/15/20/10/10) | Owner decision | Are these weights sensible for a lateral and an AP? | E |
| S10b-15 | 27 × 31 cm region stays provisional for v1 (O2) | Demo value; WHO-TECH to obtain | Is the demo region acceptable for v1? | E |
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
