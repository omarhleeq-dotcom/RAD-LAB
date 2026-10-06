# RAD-LAB — Medical Reference: Adult Chest AP (erect / semi-erect / supine; fixed or mobile detector) — positioning, technique, image quality

**Purpose:** evidence pack for the Chest AP exam (roadmap Session 10, docs only), written before any rule, control or asset.
**Scope:** adult, frontal **AP** chest, general digital radiography (DR). The set-up variants (erect in the department, semi-erect / supine on a ward, mobile / portable unit) are listed because the roadmap names them; **which of them is an exam, a patient-state control or a case is an open owner decision (O9)**. Not lateral (see the Lateral reference), not paediatric / neonatal.
**Use:** educational simulation design. Not a substitute for local protocols or educator / radiologist review.
**Format:** follows [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md). **Status:** **DRAFT — AP positioning rules are "source needed"; technique is described only as observed local practice.** Nothing here has been reviewed by an educator or physicist (O5).

## 0. Honest summary of the evidence

1. As for Lateral, the authoritative criteria sources (EC EUR 16260, IAEA publications, ACR parameters, WHO chest manual PDF, StatPearls / NCBI Bookshelf, RCR / AIR) **could not be read** (§1.2). **No AP positioning rule, centring point, field, SID target, kVp, mAs, scoring tolerance or critical finding is asserted as sourced.**
2. Seven open-access full texts were read through the official NCBI E-utilities and one abstract. They support, with different strength: (a) AP technique in practice is **local-protocol, detector and software dependent** (kVp ≈ 95–110, no grid in several set-ups, scatter-correction software, different EI targets — R2–R5); (b) an AP image differs measurably from a PA image (cardiac-size and mediastinal-width interpretation — R6, R7); (c) the AP chest on a wireless detector is a higher-reject, more demanding projection (R8); (d) in severely ill, often AP / mobile patients, inspiration-related quality criteria are commonly not met and technical criteria should not override diagnostic value (R9).
3. The one source on AP SID (Fitzgerald & Lockwood 2025) is **abstract only**; it cannot be the sole support for an AP SID value, so the AP SID reference stays "source needed".
4. The AP **marker / display convention** and the **set-up variants** are open owner decisions (O8, O9); nothing is decided.

## 1. Sources: what was read, and what each supports

Source rules are those of the template (§1). "Full text checked" = full-text XML of an open-access PMC article retrieved through the official NCBI E-utilities (`efetch`) on 2026-10-06 and read; no captcha was bypassed and no mirror or cache used.

### 1.1 Read
| # | Citation | Access status | Supports (and only this) | Sole support for a technique value / rule / critical finding / convention? |
|---|---|---|---|---|
| R1 | Fitzgerald A, Lockwood P. *The effect to dose and diagnostic quality of limiting source-to-image distance on anterior-posterior semi-erect adult chest X-rays.* **J Med Imaging Radiat Sci 2025;56(4):101986.** doi:10.1016/j.jmir.2025.101986 · PMID 40383107 | **abstract only — full text not checked** | Phantom study (Alderson Rando, hospital bed, AP semi-erect 45°), SIDs 180 / 150 / 100 cm: entrance skin dose rose 40.1 % (53.7 µGy) at 150 cm and 121.5 % (329.9 µGy) at 100 cm vs 180 cm; image-quality score fell at 100 cm (p = 0.03, lower-lung reproduction scored poor); authors recommend keeping 180 cm. Context: mobile examinations often have reduced SID because of ward space. | **No** (abstract only) — the AP SID target stays "source needed" |
| R2 | Brady Z, Scoullar H, Grinsted B, Ewert K, Kavnoudias H. *Technique, radiation safety and image quality for chest X-ray imaging through glass and in mobile settings during the COVID-19 pandemic.* **Phys Eng Sci Med 2020;43(3):765–779.** doi:10.1007/s13246-020-00899-8 · PMID 32662037 · PMC7355508 | **full text checked** | One hospital's through-glass erect **AP** technique: 67 % of images at 110 kV, mean 5.5 mAs, SID 180–300 cm; phantom scatter measurements used erect AP at SID 180 cm and supine at SID 125 cm (120 kV, 20 mAs) and a through-glass AP at SID 205 cm. Supports: **mobile AP set-ups use a wide range of SID**; the values are one site's COVID-era practice, not recommendations. | No — observed practice |
| R3 | Gange CP, Pahade JK, Cortopassi I, Bader AS, Bokhari J, et al. *Social distancing with portable chest radiographs during the COVID-19 pandemic: assessment of radiograph technique and image quality obtained at 6 feet and through glass.* **Radiol Cardiothorac Imaging 2020;2(6):e200420.** doi:10.1148/ryct.2020200420 · PMID 33778645 · PMC7673079 | **full text checked** | One institution's modified portable technique: 110 kVp even for the smallest patients (10th-percentile BMI 21), **no anti-scatter grid** (scatter-improvement software instead; the article notes conventional grids are very sensitive to positioning errors / grid cut-off), **target EI 300 vs 200 for the standard portable technique at that site** because the higher kVp changes detector exposure. Supports: portable technique and EI target are **vendor / local-protocol dependent**; grid cut-off is an AP / mobile-specific failure mode. | No — observed local practice |
| R4 | Lawson M, Qian L, Lau KK, Lau T, Massey D, Badawy M. *Efficacy of the scatter correction algorithm in portable chest radiography.* **Emerg Radiol 2022;29(5):809–817.** doi:10.1007/s10140-022-02063-z · PMID 35612644 · PMC9130995 | **full text checked** | Phantom + clinical images: the exposure conditions replicated the local protocol for **erect portable AP chest** on an average-sized patient (**100 kVp, 180 cm SID**); a scatter-correction algorithm improved image quality without more dose; all images were diagnostic. Supports: processing software can stand in for a grid (**vendor dependent**). | No — observed local practice |
| R5 | Dalah EZ, Zarooni MMA, Binismail FY, Beevi HA. *Typical and local diagnostic reference levels for chest and abdomen radiography examinations in Dubai health sector.* **J Imaging 2025;11(1):21.** doi:10.3390/jimaging11010021 · PMID 39852334 · PMC11766229 | **full text checked** (tables and discussion; DAP values not reused) | Real-world rooms: AP chest at **95–100 kVp**, 2.10–11.13 mAs, **no grid**, AEC (room A-R1; SID not stated for AP). The AP projection has the **highest** DRL of PA / AP / LAT for the same weight band; an added 0.1 mm Cu filter cut the AP DAP typical DRL by more than 60 % (PA 21 %). Supports: AP technique is local-protocol dependent and a dose-optimisation target. | No — observed local practice |
| R6 | Simkus P, Gutierrez Gimeno M, Banisauskaite A, Noreikaite J, McCreavy D, et al. *Limitations of cardiothoracic ratio derived from chest radiographs to predict real heart size: comparison with magnetic resonance imaging.* **Insights Imaging 2021;12:158.** doi:10.1186/s13244-021-01097-0 · PMID 34731329 · PMC8566609 | **full text checked** | States that the cardiothoracic ratio is considered reliable only from an erect PA radiograph and that supine position and other AP projections **overestimate cardiac size by magnification**; the study analysed PA radiographs only (AP excluded). **Caution:** its one-sentence mechanism ("heart being closer to the imaging cassette") is inconsistent with the geometry for an AP projection and must not be reused. | No — a background statement, not a measured AP result |
| R7 | Lai V, Tsang WK, Chan WC, Yeung TW. *Diagnostic accuracy of mediastinal width measurement on posteroanterior and anteroposterior chest radiographs in the depiction of acute nontraumatic thoracic aortic dissection.* **Emerg Radiol 2012;19(4):309–315.** doi:10.1007/s10140-012-1034-3 · PMID 22415593 · PMC3396328 | **full text checked** | 220 patients (PA and AP groups): mediastinal-width measurements differ between PA and AP and PA was more accurate; the optimal cut-offs differ by projection (they are pathology-specific and **not** for the simulator); in that dataset measured values did not differ significantly between sitting and supine AP films. Supports: AP and PA appearances are **not interchangeable**. | No |
| R8 | Atkinson S, Neep M, Starkey D. *Reject rate analysis in digital radiography: an Australian emergency imaging department case study.* **J Med Radiat Sci 2020;67(1):72–79.** doi:10.1002/jmrs.343 · PMID 31318181 · PMC7063252 | **full text checked** | Department average reject rate 9 %; **AP chest on a wireless detector** had a reject rate above that average and above the fixed-detector equivalent; authors call such projections more challenging for patient position, detector / tube alignment and exposure adjustment. (PA and lateral chest: 5 %.) Supports: AP / mobile chest is a demanding projection. | No |
| R9 | O'Reilly P, Abu Awwad D, Lewis S, Ekpo E, Reed W. *Assessing chest radiographic quality and the influence of COVID-19 pathology: the Australian experience.* **J Med Radiat Sci 2025;72(2):234–243.** doi:10.1002/jmrs.852 · PMID 39745120 · PMC12159245 | **full text checked** | 25 radiographers / students rated 70 CXRs (mostly AP: e.g. PA:AP 5:25 in the COVID group) against the 10 criteria of the 1996 European guidelines (a *secondary* use of that guideline); severe pathology lowered quality scores, especially inspiration-related criteria, without necessarily lowering diagnostic value; no difference for "medial border of the scapulae outside the lung fields"; the authors urge prioritising diagnostic ability over technical quality. Supports: for AP / mobile / ill patients, **technical criteria are an educational standard, not a reject decision**. | No |
| R10 | Chung 2020 (PMID 33232340), Fuller 2016 (PMID 27648276), Barry 2016 (PMID 27648278) — as cited in the Lateral reference R4–R6 | **full text checked** (re-read for the Lateral reference) | Side-marker practice audits / opinion; **no AP-specific marker rule and no viewer-side convention** (Chung's AP/PA group, n = 216, is one combined category). | No |

Sources used by the Chest PA references are not re-used for AP claims here.

### 1.2 Not read (blocked, captcha-walled or paywalled; not bypassed)
| Source | Claim it would support (open item, alongside O4) | Why not read |
|---|---|---|
| European Commission, *European guidelines on quality criteria for diagnostic radiographic images*, EUR 16260 (1996) | The 10 chest image criteria and example technique (SID, kV, grid) — to establish whether anything applies to AP and what the PA / lateral values are | Hosts blocked by the egress proxy. R9 only *uses* the criteria. |
| IAEA publication host (TECDOC-796 / -1423 / TE_1447 PDFs) | Chest criteria and example technique; portable / mobile guidance if present | `www-pub.iaea.org` blocked (curl and WebFetch); `iaea.org` returned 403 / payment required. |
| ACR practice parameters (chest radiography; digital radiography; any portable-chest text) | AP / mobile technique, patient identification / marker, criteria | Redirected to a third-party host; not followed. |
| WHO chest manual PDF (Ellis & Flower 2012, ISBN 9241546778) | AP-versus-PA appearance, erect-versus-supine signs, technical-quality text | `iris.who.int` blocked; landing page only. |
| NCBI Bookshelf — StatPearls *X-ray Radiographic Patient Positioning* (NBK557488) | AP positioning (erect, supine, mobile), rotation, SID | Captcha challenge; not bypassed. |
| Fitzgerald & Lockwood 2025 full text (publisher site) | An AP SID reference value and its image-quality criteria (R1 is abstract only) | Publisher host not reachable / not open access through E-utilities. |
| RCR / AIR criteria and guideline, textbooks (Bontrager / Merrill), Radiopaedia | Positioning conventions, marker convention | Hosts blocked; textbooks and Radiopaedia are secondary and not used as authority. |

### 1.3 Unverified leads (NOT evidence)
None were collected for AP in this session (no search-result summaries were used as support). The PLATFORM_ARCHITECTURE §4.3 table lists "tube angulation", "shoulder / scapula position" and "grid decision as a control" as AP-specific candidates marked **"sources needed"**; they remain unverified placeholders.

## 2. Classification
The five evidence classes of `EVIDENCE_CLASSES` apply (`validated`, `common-reference`, `vendor-protocol-dependent`, `educational-simplification`, `provisional`). "Source needed" = no class assignable; not implemented, or only as `provisional` with a TODO.

## 3. Positioning (adult AP chest)
| Topic | What this reference can state | Class / status |
|---|---|---|
| Role of AP vs PA | AP and PA are not interchangeable for interpretation: cardiac size is overestimated on AP / supine (R6, background statement) and mediastinal-width measurements differ and are less accurate on AP in one study (R7). The PA reference's "PA reduces cardiac magnification" is consistent with this. | common-reference (concept; no magnitude) |
| Patient state (erect / semi-erect / supine) | The set-ups exist in practice (R1, R2, R4, R7); **which are in scope and how they are positioned: source needed** (O9). In R7's data sitting and supine AP values did not differ significantly (small groups). | source needed |
| Arms, shoulders / scapulae, chin | **Source needed** (PA rules do not transfer). | source needed |
| Rotation / alignment | **Source needed.** | source needed |
| Centring point and level; central-ray direction; tube angulation | **Source needed.** The PA value must not be copied. | source needed |
| SID | Observed: 180 cm (R2 erect, R4 local protocol), 125 cm supine set-up (R2), 180–300 cm through glass (R2). R1 (abstract only) reports higher dose and lower quality at 150 and 100 cm in a semi-erect phantom. **No AP SID reference can be derived** (R1 abstract only; R2–R4 observed practice). | source needed (full text); observed practice local |
| Respiration | **Source needed** for the target. Patients who need AP / mobile imaging often cannot take or hold a full inspiration, and inspiration-related criteria are the ones most often unmet (R9). | context supported (R9); target source needed |
| Collimation / required anatomy | **Source needed.** The PA 27 × 31 cm demo region (O2) is not an AP value. | source needed |
| Detector placement and anti-scatter grid | Mobile detector placement is operator-dependent; conventional grids are sensitive to positioning errors / cut-off (R3). Whether a grid is used varies: none in R3 and in R5's AP rooms. **Whether a grid decision is a learner control: source needed.** | observed (R3, R5); control: source needed |

## 4. Technique (digital radiography)
| Topic | What can be stated | Class / status |
|---|---|---|
| kVp | Observed: 95–100 kVp (R5 AP rooms), 100 (R4 local erect portable AP), 110 (R2, R3 through glass). **No AP kVp reference.** The PA statement that one exact kVp is not universally correct applies. | vendor-protocol-dependent; reference: source needed |
| mAs / AEC | Observed: mean 5.5 mAs through glass (R2); 2.10–11.13 mAs with AEC in one AP room (R5). **No target.** | vendor-protocol-dependent |
| Grid / scatter | No grid in R3 and R5's AP rooms; software scatter correction improved image quality at no dose cost in one study (R3, R4). | vendor-protocol-dependent |
| Exposure index | One site chose a target EI of 300 for a 110 kVp technique and 200 for its standard portable technique (R3). This confirms the PA decision: **no universal EIT / DI limit; brightness is never an exposure indicator**. | vendor-protocol-dependent; PA rule carried over |
| Dose / optimisation | AP has the highest DRL of PA / AP / LAT in R5; a Cu filter lowered AP DAP substantially. Reduced SID increases entrance dose in a phantom (R1, abstract only). Observations, not rules. | observed (local); R1 context only |
| Geometry (magnification) | **Derivation, not a medical claim:** projection magnification of an object is SID / (SID − object-to-detector distance); an AP chest places the heart farther from the detector than a PA chest, so AP magnifies the heart more. The sources give the direction (R6, R7), **no factor**. | derivation (geometry); magnitude: source needed |
| Motion, patient size | Motion principle unchanged (PA reference); AP-specific differences: **source needed**. | principle: validated (PA reference) |

## 5. Conventions and open owner decisions

### 5.1 Marker / display convention for AP (O8 — not decided)
**Established by the sources read:** side identification is expected on radiographs as best practice (R10); **none states an AP-specific rule or a viewer-side convention.**
**Derivation, not a medical claim:** an AP frontal image is a frontal display like PA; whether the PA display convention in the code (`markerSide`: patient left = viewer right, "as if the viewer faces the patient") applies unchanged to AP, or the viewer sees a mirror-reversed arrangement, is a *display convention* that this reference cannot source. ADR-0010 says such conventions are per-projection data.

| # | Option | Source status |
|---|---|---|
| A | **Same viewer-half convention as PA** (patient left = viewer right), stored as AP exam data | **Source needed** (display convention for AP) |
| B | A different AP display / marker convention stored as data | **Source needed** |
| C | **Marker presence only** (placed, inside the field, not over anatomy); letter not checked; no wrong-side critical finding | Supported as best practice for presence (R10); no letter rule sourced |
| D | **Defer**: unscored, ungated marker, as PA today | Needs no new medical claim |

### 5.2 Set-up variants (O9 — not decided)
Erect (department), semi-erect, supine, mobile / portable: **exam vs patient-state control vs case** is a structural owner decision. Evidence status: all four exist in the sources read (R1, R2, R4, R7), none is positioned from a read positioning source. A patient-state **control** keeps one exam; separate exams multiply scenes, landmarks and baselines. The roadmap entry (Session 13) says "erect / supine / portable" and "portable / ICU context decided (spec §6)" — the spec decision is not recorded in `DECISIONS.md`.

## 6. Image quality and result rendering (AP)
| Criterion / effect | Statement | Class / status |
|---|---|---|
| Frontal PA-like criteria (symmetry, coverage, sharpness) | Not sourced for AP. The 10 EC criteria are used with AP images in R9 but their content was not read. | source needed |
| Heart / mediastinum magnification vs PA | Direction supported (R6 background, R7 measured, geometry §4); **magnitude: source needed.** The existing `magnified-geometry` variant is driven by short SID in PA; an AP-specific projection effect would be new. | concept: common-reference / geometry; magnitude: source needed |
| Reduced inspiration | Commonly unmet in ill / AP patients (R9). Appearance mapping: source needed. | context supported; appearance: source needed |
| Grid cut-off | Conventional grids are sensitive to positioning errors / cut-off (R3). Appearance and applicability: source needed. | concept (single full-text statement) — **new effect, source needed** |
| Scatter processing | Software scatter correction can improve image quality (R3, R4). Do not simulate vendor processing. | vendor-protocol-dependent |
| Scapulae over the lung fields | Not sourced for AP (R9: no pathology difference in the scapula criterion, which says nothing about AP vs PA). | source needed |
| Motion; low detector exposure; excess exposure; low penetration | Same validated DR principles as PA (PA Image-Quality reference). | validated (PA reference) |
| "Do NOT implement as clinical truth" | The PA list applies unchanged. Additionally: no cardiac magnification factor, no AP SID / kVp / mAs / EIT value, no AP mediastinal-width cut-off (R7's are disease-specific), no "AP is wrong" rule — AP is often the only possible projection (R9). | rule |

## 7. Arabic terms (proposed)
Proposed AP terms are in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) ("Session 10 — Chest AP"), **pending educator review**; no existing UI string was changed.

## 8. Needs (for the generalisation session)
Compared with **Chest PA as implemented today**. Marks: **same** · **differs** · **new** · **unknown — source needed**. Combined with Lateral in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md).

### 8.1 Controls (what the student sets)
| Item (PA today) | AP | Mark | Note / missing source |
|---|---|---|---|
| `projection` | same control; required = AP (`ap-erect` already exists in the option list) | **same** (control) | AP variants: O9 |
| Patient state (erect / semi-erect / supine) | a control PA does not have, if O9 chooses a control | **new** (existence **unknown**) | O9; positioning source (§1.2) |
| `rotationDeg` | same idea; AP feedback / tolerance unknown | **same** / **unknown** | source needed |
| `centralRay`, `collimation` | same controls; different targets / region | **differs / unknown** | source needed |
| `chinPosition`, `shoulderPosition` | AP equivalents unknown | **unknown** | source needed |
| Tube angulation | PLATFORM §4.3 lists it as a candidate | **new** (existence **unknown**) | source needed |
| `sidCm` | same control; AP reference / range unknown; ward-limited SID | **same** (control) / **unknown** (values) | R1 full text |
| `kvp`, `mas`, `exposureMode`, `aecChambers` | same controls; protocol unknown (observed 95–110 kVp) | **same** / **unknown** | EC / ACR / IAEA |
| Grid in / out | PLATFORM §4.3: "grid decision as a control"; R3, R5 show both practices | **new** (existence **unknown**) | source needed |
| `breathing`, `motionInstruction` | same controls; patient ability to comply lower (R9) → a case matter | **same** | |
| `sideMarker`, `markerPosition` | | **differs / unknown** | O8 |

### 8.2 Scoring categories
| PA | AP | Mark | Note |
|---|---|---|---|
| Six fixed ids, weights 25/20/15/20/10/10 | exam declares own list / weights; `sid` may matter more or less; breathing weight low expectation vs ill patients (R9) is an educator decision | **unknown** | weights are configuration |

### 8.3 Critical findings
| PA | AP | Mark | Note |
|---|---|---|---|
| `wrong-projection` | a PA shown for an AP order | **same** | |
| `patient-motion` | same principle | **same** | |
| `wrong-side-marker` | rule depends on O8 | **differs / unknown** | |
| — | any AP-specific critical finding (e.g. grid cut-off) | **unknown** | no source |

### 8.4 Image variants / effects
| PA | AP | Mark | Note |
|---|---|---|---|
| `correct`, `motion`, `low-exposure`, `excess-exposure`, `low-penetration`, `clipped`, `wrong-projection`; effects `baseline`, `collimation-clipping`, `excess-field`, `centering`, `motion`, `low-exposure`, `excess-exposure`, `low-penetration`, `projection` | projection-independent principles | **same** | |
| `magnified-geometry` | projection-driven AP magnification vs PA | **differs / new** | magnitude: source needed |
| `rotated` / `rotation`, `poor-inspiration` / `inspiration` | same effects; AP appearance / mapping | **same** / **unknown** | |
| `scapulae-overlap`, `chin-overlap` | AP behaviour | **unknown** | |
| — | grid cut-off | **new / unknown** | R3 |
| `marker` | | **differs** | O8 |

### 8.5 Positioning scene
| PA | AP | Mark | Note |
|---|---|---|---|
| `chest-pa-frontal` (patient faces the detector) | AP erect: patient's back to the detector, facing the tube; supine / mobile: bed, detector behind the patient, tube above | **new** (at least one scene; count depends on O9) | art: source needed |

### 8.6 Landmark groups (`RadiographAssetSpec`)
| PA field | AP | Mark | Note |
|---|---|---|---|
| `anatomyBox`, `midlineU`, `lungApexV`, `diaphragmDomeV`, `denseZones` | frontal anatomy: same groups, new values from an AP baseline | **same** (groups) | values new |
| `scapulae`, `jaw` | AP scapular / chin behaviour unknown | **unknown** | source needed |

### 8.7 Case fields (`CaseDefinition`)
| Field | AP | Mark | Note |
|---|---|---|---|
| patient, order text, condition, scenario | same fields; AP order / ward context wording unknown | **same** / **unknown** | |
| `patientTechnique.attenuation` | same scalar plausible (same body, similar path); not measured in the sources read | **same** / **unknown** | |
| `patientCooperation` | lower ability to inspire / hold still is typical of AP patients (R9) → new case profiles, not new fields | **same** (fields) | |
| `initialSettings` | patient-state initial value if O9 adds it | **same** / **new** | |
| `radiograph` | new AP baseline asset | **new** | §8.8 |

### 8.8 Assets (licence-verified only — none fetched or added)
| Asset | Status |
|---|---|
| AP chest baseline(s) (erect AP and, if in scope, supine AP), openly licensed, verified, registered (`A-006+`), annotations neutralised, landmarks authored | **OPEN — none sourced.** |
| Scene art for the AP variants (own work) | Session 13 |

## 9. Generalisation (S7-4) mapping — AP
| S7-4 item | Needed by AP? | Why |
|---|---|---|
| `SimulationSettings` / `ControlSpec[]` | **Needed** (limited) | Possible new controls (patient state, grid, tube angulation) without a PA key; existence unknown. The *mechanism* is needed if any exists. |
| `CATEGORIES` / `CategoryId` | **Needed** | Own categories / weights. |
| `ImageVariantId` / `EffectId` | **Needed** (limited) | Projection-driven magnification and (possibly) grid cut-off effects. |
| `CriticalFindingId` + `isPresent` | **Needed** (limited) | Marker rule (O8); any AP-specific finding. |
| Console JSX | **Needed**, minimal (conditional on new controls) | |
| Positioning scene art | **Scene registry: needed** · generated art: **deferred** | One or more new hand-drawn scenes. |
| `RadiographAssetSpec` landmark groups | **Not needed beyond Lateral** for AP-erect (same groups); scapulae / jaw may need to be optional | |
| Move to `modalities/xray/*` | **Not needed → deferred** | |
| Migrating consumers off `RadCase` | **Not needed → deferred** | |

## 10. Open owner decisions and open items
- **O8** AP marker / display convention (§5.1) · **O9** AP set-up variants: exam vs control vs case, and the spec §6 portable / ICU decision (§5.2) — in `DECISIONS.md`.
- **Blocked sources, each with the claim it would support** (extends O4): §1.2.
- **"Source needed" items:** patient state; arms / shoulders / chin; rotation; centring and tube angulation; AP SID reference (needs full text); breathing target; collimation / required anatomy; grid as a control; AP kVp / mAs / AEC protocol; AP EIT; magnification magnitude; grid cut-off appearance; scapular behaviour; AP-specific critical findings; category weights; marker rule; baseline asset(s).

## 11. Development rules
As the Chest PA reference §8: do not invent values; record the source of every rule; separate validated rule / educational simplification / provisional value; if sources disagree, document it and keep the rule configurable.
