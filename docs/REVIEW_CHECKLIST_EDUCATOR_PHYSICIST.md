# Consolidated review checklist — educator / medical physicist

One list for everything Sessions 2–5 left for expert review. Tick, correct in the named file, and note the reviewer and date. Nothing here has been clinically validated.

## A. Positioning and geometry (`src/data/cases/chest-pa-erect.ts`)
- [ ] Required anatomy region 27 × 31 cm and its position (apices → costophrenic angles, both lungs). *(A Session 5 revision to 27 × 28 cm was reverted: no reference supports it. The baseline's landmark box is 27 × 28 cm of it, leaving ≈ 1.5 cm strips of neck / upper abdomen above and below: a field edge in a strip fails the score although every drawn lung stays visible; the result screen now labels this “margin only” — see `session-5-qa.md` §0.2.)* Decide: keep the demo region and its labelling, or adopt a baseline matching the region / measure the region on a validated baseline.
- [ ] Centering target (midline; level 18.5 cm ≈ mid-thoracic / T7 teaching landmark) and tolerances (±1.4 / ±3 cm lateral, ±2.2 / ±5.4 cm vertical).
- [ ] Rotation bands ±2° full / ±5° partial; whether a picture within ±2° should be drawn symmetric (Session 5 decision).
- [ ] 5 cm excess-field margin.
- [ ] Chin and shoulder rules and the schematic overlays (position, density).
- [ ] **Marker convention** (PA display: L on the viewer's right, R on the left; **no verified source defines it**) and whether presence / side / in-field placement should be **scored** (currently weight 0; a wrong-side marker is a critical finding). Default marker size / positions. Evidence verification: §A.1 below.

### A.1 Marker evidence — verification result (Session 5 fix pass 3, 2026-10-06; full texts read)
Both studies were read in full from PMC. Nothing here has been validated by an educator.

| Source | What it actually is / measured | Supports (a) presence | (b) correct side | (c) inside the field |
|---|---|---|---|---|
| **Chung L, Kumar S, Oldfield J, Phillips M, Stratfold M.** A clinical audit of anatomical side marker use in a pediatric medical imaging department. *PLoS ONE* 2020;15(11):e0242594. doi:10.1371/journal.pone.0242594 · PMID 33232340 · PMC7685512 | Single-site paediatric audit (421 radiographs, 0–18 y) of marker presence, type (radiopaque / digital) and side + 11 interviews. 99 % present; 4 absent, 4 on the incorrect side (1.9 %). “Best / acceptable / undesirable practice” defined by the authors' own team discussion. | **Yes, as practice** (absent = “undesirable practice”) | **Yes, as an audited error** (4 / 421); says nothing about which viewer side L / R goes on | **Not measured** (Table 1 blank; Limitations: marker outside the field “not captured”). Mentioned only as background citing other work; a digital post-processing marker counts as “acceptable” |
| **Fuller M.** Side marker creep: have radiographers changed their side marker habits? (editorial) *J Med Radiat Sci* 2016;63(3):143–144. doi:10.1002/jmrs.181 · PMID 27648276 · PMC5016621 | Two-page opinion on the Barry audit (J Med Radiat Sci 2016;63:148–54, doi:10.1002/jmrs.176, PMID 27648278); no data; one anecdote (situs inversus) and a second-hand 2002 case report (one iatrogenic death). | Opinion (“automated reflex”) | Opinion / case reports (harm from side mix-up) | **Opinion** only (“place a radiopaque side marker within the primary beam”) |

Verdict: they support the *concept* that a marker should be present and correct, which is why a **wrong-side marker is a critical finding** and why the marker stays a visible, taught interaction. They do **not** supply a scoring rule, weight, credit split, in-field measurement or the viewer-side convention, and the repository's own references keep marker behaviour unscored until such a rule exists — so the marker is **unscored (weight 0)**. Wording that went beyond the sources (“incorrectly positioned”, “mandatory practice”, “neonatal death” as a finding, “inside the field supported by audits”) was corrected.
- [ ] Confirm the decision, or define the rubric (what is scored: presence? side? in-field? over-anatomy? weight?) and read the still-unverified sources: ACR digital-radiography / chest practice parameters, the Australian Institute of Radiography professional practice guideline cited by Barry et al.
- [ ] Confirm the viewer-side convention (PA display: patient left = viewer right) against a departmental teaching standard.

## B. Technique (`chest-pa-technique.ts`)
- [ ] kVp reference range 100–150 and demo band 110–125.
- [ ] Reference point 120 kVp · 3.2 mAs · 180 cm → DI 0; kVp exponent 3; one attenuation; detector/grid assumption.
- [ ] DI scoring bands ±1 / ±3.
- [ ] SID: 180 cm reference; bands 175–185 full, 150–200 partial.
- [ ] AEC: 3-field layout, preferred lung-field chambers, anatomy factors, backup behaviour.
- [ ] Readiness advisories (breathing, marker, keep-still).

## C. Image rendering (`features/radiograph/tuning.ts`, `chest-pa-radiograph.ts`)
- [ ] All magnitudes: rotation shifts, 12 % reduced inspiration, blur, noise σ / detail loss, penetration contrast kept (30 %).
- [ ] Landmark box, dense zones, scapula / jaw geometry; the uniform-scale (“contain”) mapping and the 1.5 cm strips above / below the drawn landmark box inside the 31 cm region.
- [ ] Reduced-inspiration cues without a rib-count rule; transradiancy tilt under rotation.
- [ ] The grey “no reference data” hatch (now ≈ 7 cm at the bottom of an open field) and its wording.
- [ ] Which findings have no visible effect (SID, kVp in range, excess exposure) — acceptable pedagogically?

## D. Patient instructions
- [ ] Cooperation profile assumptions (non-“deep breath” wording → reduced inspiration; no/“relax” keep-still → motion).
- [ ] Should the keep-still instruction be scored; how to weight Breathing / patient instructions.

## E. Scoring and wording
- [ ] Pass mark 70 and the “educational pass mark” wording.
- [ ] **Critical findings** (`scoring.criticalFindings`: wrong projection, visible patient motion, wrong-side marker → always “below the educational pass mark”; numeric score and weights unchanged). Concept = COMMON QUALITY CRITERION (maps to the “common reference” class); implementation = PROVISIONAL / educational. Confirm the list (should a missing marker, or other errors, be critical too?), the reason wording (EN / AR), and that “normally repeated in practice” is acceptable teaching language (the Positioning reference warns this is not an automatic real-world reject decision).
- [ ] All EN feedback sentences (rotation, excess field, inspiration, projection, kVp, SID) against local teaching.
- [ ] Evidence classification shown per rule.

## F. Arabic
- [ ] Every term in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) and all case text.

## G. Assets
- [ ] Baseline (young woman) vs case patient (45-year-old man): choose per [`session-5-baseline-options.md`](session-5-baseline-options.md).
- [ ] Registry [`ASSET_PROVENANCE_AND_LICENSES.md`](ASSET_PROVENANCE_AND_LICENSES.md) A-001 … A-005.

## H. Pilot preview and platform (Session 6)
- [ ] Preview banner wording, EN and AR: "Educational prototype — not for clinical use; values pending educator/physicist review" / «نموذج تعليمي أولي — ليس للاستخدام السريري؛ القيم بانتظار مراجعة مدرّس أو فيزيائي طبي» (`messages/*.json` → `common.previewBanner`).
- [ ] Platform design decisions listed in [`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md) §12 (mode set, Assess prerequisites, dose reference levels policy, acceptable sources / imagery).

