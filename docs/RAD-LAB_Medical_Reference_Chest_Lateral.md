# RAD-LAB — Medical Reference: Adult Chest Lateral (erect) — positioning, technique, image quality

**Purpose:** evidence pack for the Chest Lateral exam (roadmap Session 10, docs only). It is written *before* any rule, control or asset, as `ROADMAP_SESSIONS.md` requires.
**Scope:** adult, erect, general digital radiography (DR), lateral chest projection only. Not AP, not portable, not paediatric.
**Use:** educational simulation design. Not a substitute for local protocols or educator / radiologist review.
**Format:** follows [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md). **Status:** **DRAFT — most Lateral rules are still "source needed".** Read §1 first: it says which sources could be read in full in this session and which could not. Nothing here has been reviewed by an educator or physicist (O5).

## 0. Honest summary of the evidence

1. The authoritative lateral-chest criteria sources the Chest PA references lean on — the European Commission quality-criteria guideline (EUR 16260), IAEA-TECDOC-1423, the WHO chest manual, the ACR practice parameters, the RCR audit criteria — **could not be read in full in this session** (network egress to those hosts was blocked or required a captcha; see §1). Where the PA references cite them, this document does **not** re-use their lateral content from memory.
2. What *was* read in full is thin on lateral specifics: one single-site dose / technique study with lateral values (Junda 2021), one multi-centre DRL paper with lateral rooms (Dalah 2025), one reject-rate study (Atkinson 2020), the three side-marker papers already used for PA (Chung 2020, Fuller 2016, Barry 2016), plus abstracts on the role of the lateral view.
3. Therefore **no lateral positioning rule, centring point, field size, SID, kVp, mAs, image-quality threshold or scoring tolerance is asserted here as sourced.** Each is "source needed" (§3–§6) so that Session 11 does not build on unsupported values. A short list of *unverified leads* (§1.3) records statements found in search-result summaries of third-party pages; they are **not evidence** and must be verified against a primary source before use.
4. The **marker convention for the lateral projection is not decided** (§5, owner decision O6).

## 1. Sources: what was read, and what each supports

Rules: authoritative / peer-reviewed sources only; no blogs, forums, commercial technique charts or unsourced teaching sites as medical authority. "Read" means the full text (or, where stated, the abstract) was retrieved and checked in this session on 2026-10-06 through the NCBI E-utilities (PubMed / PMC full-text XML). No text is copied beyond short quotes.

### 1.1 Read

| # | Source | Access status | Supports (and only this) | Sole support for a technique value / rule / critical finding / convention? |
|---|---|---|---|---|
| R1 | Junda M, Muller H, Friedrich-Nel H. *Local diagnostic reference levels for routine chest X-ray examinations at a public sector hospital in central South Africa.* **Health SA Gesondheid 2021;26:1622.** doi:10.4102/hsag.v26i0.1622 · PMID 34522394 · PMC8424719 | **full text checked** | One site, 60 patients (60–80 kg), each with PA and lateral chest, CR and DR. **Observed** lateral technique: kVp mean 117 (range 103–125), mAs mean 9.7 (3.4–19.8) vs PA kVp 113.7, mAs 3.6 (1.0–5.6); SID 180 cm except 6 of 120 images at 150 cm; manual and automatic exposure both used, so ranges are wide. Patient thickness: lateral mean 29.2 cm (18–37) vs PA 23.5 cm (18–31). Entrance skin air kerma: lateral 0.6 mGy mean for both CR and DR vs PA 0.2 / 0.1; local DRL 0.8 mGy (lateral) vs 0.3 mGy (PA). It states the EC recommends an SID of 180 (140–200) cm for chest — a **secondary** statement of the EC guideline, not the guideline itself. | Only if it states the rule itself — it states no lateral rule |
| R2 | Dalah EZ, Zarooni MMA, Binismail FY, Beevi HA. *Typical and Local Diagnostic Reference Levels for Chest and Abdomen Radiography Examinations in Dubai Health Sector.* **J Imaging 2025;11(1):21.** doi:10.3390/jimaging11010021 · PMID 39852334 · PMC11766229 | **full text checked** (tables and discussion read; DAP values not reused here) | Multi-centre (A–E) real-world acquisition settings per room for chest PA, AP and LAT, e.g. room A-R1 LAT 110–120 kVp, 2.10–8.70 mAs, SID 180 cm, AEC, 6:1 grid. DRLs differ by projection; AP is highest vs PA and LAT. An added 0.1 mm Cu filter reduced the LAT DAP TDRL by 6 % (PA 21 %). Supports: lateral technique is **local-protocol dependent**, AEC and grids are used in practice. | Only if it states the rule itself — it states no lateral rule |
| R3 | Atkinson S, Neep M, Starkey D. *Reject rate analysis in digital radiography: an Australian emergency imaging department case study.* **J Med Radiat Sci 2020;67:72–79.** doi:10.1002/jmrs.343 · PMID 31318181 · PMC7063252 | **full text checked** | One emergency department, 90,298 DR images: lateral chest 17 % of images acquired, **803 / 15,028 rejected (5 %)**, equal to PA chest (873 / 17,302). Context only: the lateral chest is a high-volume, comparatively low-reject projection there; says nothing about *why* images are rejected. | Only if it states the rule itself — it states no lateral rule |
| R4 | Chung L, Kumar S, Oldfield J, Phillips M, Stratfold M. *A clinical audit of anatomical side marker use in a pediatric medical imaging department.* **PLoS ONE 2020;15(11):e0242594.** doi:10.1371/journal.pone.0242594 · PMID 33232340 · PMC7685512 | **full text checked** (re-read) | Audit of 421 paediatric radiographs, 137 of them lateral projections of all body parts. Markers counted as errors if absent or on the incorrect side; its own "best / acceptable / undesirable" practice standards are the authors' own. **It reports no lateral-specific marker rule, no viewer-side convention and no result for chest laterals.** | Only if it states the rule itself — it states no lateral rule |
| R5 | Fuller M. *Side marker creep: have radiographers changed their side marker habits?* **J Med Radiat Sci 2016;63(3):143–144.** doi:10.1002/jmrs.181 · PMID 27648276 · PMC5016621 | **full text checked** (re-read) | Opinion editorial: a radiopaque marker should be placed within the primary beam as a reflex. No lateral convention. | Only if it states the rule itself — it states no lateral rule |
| R6 | Barry K, Kumar S, Linke R, Dawes E. *A clinical audit of anatomical side marker use in a paediatric medical imaging department.* **J Med Radiat Sci 2016;63(3):148–154.** doi:10.1002/jmrs.176 · PMID 27648278 · PMC5016612 | **full text checked** (re-read) | Audit of marker practice; no lateral-specific rule. | Only if it states the rule itself — it states no lateral rule |
| R7 | Kluthke RA, Kickuth R, Bansmann PM. *The additional value of the lateral chest radiograph for the detection of small pulmonary nodules — a ROC analysis.* **Br J Radiol 2016;89(1067):20160394.** doi:10.1259/bjr.20160394 · PMID 27605206 | **abstract only — full text not checked** | 45 patients with and 45 without small pulmonary nodules, four radiologists, CT as reference: mean Az 0.75 (PA alone) vs 0.77 (PA + lateral), no significant difference (p = 0.384); sensitivity fell with the added view. Supports: the **indication for a lateral is a clinical-justification question**, not "always"; teach it as a conditional add-on. | **No** (abstract only) — such items stay "source needed" |
| R8 | Kurihara Y, Yakushiji YK, Nakajima Y, et al. *The vertical displacement sign: a technique for differentiating between left and right ribs on the lateral chest radiograph.* **Clin Radiol 1999;54(6):367–369.** doi:10.1053/crad.1999.0177 · PMID 10406336 | **abstract only — full text not checked** | 109 lateral chest radiographs; the "vertical displacement sign" identified right vs left ribs in 105 / 107 (98 %), the older "big rib sign" in 74 / 95 (78 %). Supports: **the side of the patient can be inferred from the lateral image itself**, so the marker is not the only laterality cue (relevant to O6; it does **not** give a marker convention). | **No** (abstract only) — such items stay "source needed" |
| R9 | Austin JH. *The lateral chest radiograph in the assessment of nonpulmonary health and disease.* **Radiol Clin North Am 1984 Sep.** PMID 6382428 | **abstract only — full text not checked** | The lateral contains data on thoracic cage, pleura, heart, pericardium, bronchi and upper abdomen; slightly oblique projections that deviate from the "true" lateral are reviewed and "careful attention" to them is advocated. Supports only: **a "true lateral" vs obliquity concept exists** — not its appearance criteria or tolerance. | **No** (abstract only) — such items stay "source needed" |
| R10 | Vañó E, Guibelalde E, Morillo A, et al. *Evaluation of the European image quality criteria for chest examinations.* **Br J Radiol 1995;68(816):1349.** doi:10.1259/0007-1285-68-816-1349 · PMID 8777597 | **abstract only — full text not checked** | Confirms the European Commission image-quality criteria for chest examinations exist, were applied to many films, and were proposed to be reduced to "simple essential indicators". Gives no lateral criterion in the abstract. | **No** (abstract only) — such items stay "source needed" |
| R11 | Robinson AE. *The lateral chest radiograph: is it doomed to extinction?* **Acad Radiol 1998 May.** doi:10.1016/s1076-6332(98)80148-7 · PMID 9597098 | **record only — no abstract; not checked** | Not used for any claim. | No |
| R12 | Ellis SM, Flower C. *The WHO manual of diagnostic imaging: radiographic anatomy and interpretation of the chest and the pulmonary system.* World Health Organization, 2012, ISBN 9241546778 (WHO publication page read) | **landing page only — PDF blocked; not checked** | Existence and edition only. | No |

Existing PA sources (IAEA-TECDOC-1423, StatPearls positioning, the AAPM / IEC / ICRP technique sources) are documented in the three PA reference files; they are **not** re-used for lateral claims here.

### 1.2 Not read (blocked or captcha-walled; do not cite as read)

| Source | Claim it would support (open item, alongside O4) | Why not read |
|---|---|---|
| European Commission, *European guidelines on quality criteria for diagnostic radiographic images*, EUR 16260 EN (1996) — has a chest lateral section (image criteria, technique) | The most likely primary source for lateral criteria and reference technique. | PDF host blocked by the egress proxy; EC publications host blocked. **Not read.** |
| IAEA-TECDOC-1423 (2004) — the repository's PA image-criteria source | Whether it contains lateral criteria. | `iaea.org` returned 403 / payment-required; publication host blocked. **Not read** (for lateral). |
| IAEA publication host (`www-pub.iaea.org`: TECDOC-796 / TECDOC-1423 / TE_1447 PDFs, as linked in the PA Technique reference §17) | Lateral image criteria and example technique, if present. | Blocked by the egress proxy (curl and WebFetch); not bypassed. **Not read.** |
| ACR practice parameters (chest radiography; digital radiography) | Marker / identification, lateral technique, O3 / O4. | Redirected to a third-party host; not followed. **Not read.** |
| WHO chest manual PDF (R12) | Lateral anatomy and technical-quality text. | `iris.who.int` blocked. **Not read.** |
| NCBI Bookshelf: StatPearls *X-ray Radiographic Patient Positioning* (NBK557488); *A Systematic Approach to Chest Radiographic Analysis* | Positioning text for the lateral. | Captcha challenge; **not bypassed**. **Not read.** |
| RCR *adapted anatomical image criteria* (PA chest only exists as a page), AIR professional practice guideline, Bontrager / Merrill textbooks, Radiopaedia | Positioning detail; textbook conventions. | Hosts blocked; textbooks are not open-checkable. **Not read.** Textbooks and Radiopaedia are secondary and are not used as medical authority here. |

### 1.3 Unverified leads (NOT evidence)
Statements found only in search-result summaries of third-party pages (none of them opened in full, none a primary source). Recorded so an educator can confirm or refute them against EUR 16260, ACR, WHO or StatPearls; **none may be implemented, scored or shown to a learner on this basis.**

| # | Lead | Where it would matter |
|---|---|---|
| L1 | Left lateral is the usual default side. | O7; control options |
| L2 | Both arms are raised above the head so the humeri are out of the field. | arm-position control; effect |
| L3 | Marker side: one summary said the side *nearest the tube* is marked for lateral projections; textbook convention elsewhere is usually stated as the side nearest the detector. **These conflict.** | O6 (A vs B) |
| L4 | Rotation cues: posterior ribs superimposed (separation of about 1 cm at 180 cm SID quoted as the limit), sternum in profile. | rotation rule / effect |
| L5 | At least ten posterior ribs above the diaphragm; open thoracic intervertebral spaces. | inspiration / quality criteria |

**Consequence for Session 11 and 12:** an educator (or a session with unrestricted network access) must read the §1.2 sources — at minimum **EUR 16260 (chest lateral)**, the **ACR parameters**, the **WHO chest manual** and the **StatPearls positioning chapter** — and fill every "source needed" below *before* any lateral rule is implemented. This extends open decision O4.

## 2. Classification (same system as the Chest PA references)

Every rule must carry one of the five evidence classes in `EVIDENCE_CLASSES`: **validated**, **common-reference**, **vendor-protocol-dependent**, **educational-simplification**, **provisional** (the last three are never shown to a learner as validated truth). In this document, "**source needed**" means no class can be assigned yet; such an item must not be implemented, or only as `provisional` with a TODO.

## 3. Positioning (adult erect lateral)

| Topic | What this reference can state | Class / status |
|---|---|---|
| Indication / role of the lateral | A lateral is an *additional* view, not automatic; its added diagnostic value for small nodules was not significant in one ROC study (R7); the lateral shows thoracic cage, pleura, heart, pericardium, bronchi, upper abdomen (R9). | common-reference (concept, abstracts only) |
| Which side is placed against the detector (left vs right lateral) | **Source needed.** *Not* a medical fact to assume: the repository's `ProjectionId` already contains `"lateral-left"`, but no source has been read that says left lateral is the default or why. | source needed → O7 |
| Arm position | **Source needed.** | source needed |
| Shoulder / chin position | **Source needed** (PA rules for shoulders and chin do **not** transfer). | source needed |
| Centring point and level; central-ray direction | **Source needed.** The PA value (mid-thoracic, ≈ T7 teaching landmark) must not be copied. | source needed |
| Midsagittal-plane alignment / "true lateral" | The concept of a true lateral and of slightly oblique deviations exists (R9). **Appearance criteria and any tolerance: source needed.** | concept: common-reference (abstract); criteria: source needed |
| SID | **Source needed** as a reference value. Observed practice: 180 cm in 114 / 120 lateral+PA images in one hospital (R1) and in the Dubai rooms shown (R2); R1 quotes the EC range 180 (140–200) cm for chest (secondary). Do **not** adopt the PA 180 cm anchor for lateral as "validated" from these. | observed practice (local) — not validated for lateral |
| Respiration | **Source needed** for the lateral (PA: full inspiration, suspended — IAEA via the PA reference). | source needed |
| Collimation / required anatomy | **Source needed** for what the field must include (lungs, sternum, spine, posterior costophrenic sulci) and for any numerical region size. The PA 27 × 31 cm demo region is provisional (O2) and is **not** a lateral value. | source needed |

## 4. Technique (digital radiography)

| Topic | What can be stated | Class / status |
|---|---|---|
| Lateral needs more exposure than PA for the same patient | **Observed** in one site: mAs ≈ 2.7× PA (9.7 vs 3.6), kVp 117 vs 113.7, patient path 29.2 vs 23.5 cm (R1); the lateral entrance air kerma and DRL are higher than PA (R1, R2). This is attenuation physics plus local practice; **no target mAs/kVp is derived from it.** | vendor-protocol-dependent; magnitude provisional |
| kVp / mAs / AEC / grid for lateral | **Source needed** for any reference protocol. Real settings vary widely: lateral kVp ≈ 100–125 and mAs ≈ 2–20 in the central cases of R1–R2 (R2's per-room table also contains much larger outliers), with AEC and 6:1–13:1 grids in R2. The PA technique rules (kVp band, AEC, DI discussion) are **not** automatically valid for lateral. | source needed; observed ranges are local-protocol dependent |
| AEC chamber choice for a lateral | **Source needed.** The PA chamber layout (three chambers) must not be assumed. | source needed |
| Exposure index / deviation index | The PA decisions stand: **brightness is never an exposure indicator; no invented numeric EI/EIT/DI limit**. Whether a lateral-specific EIT exists in any vendor/IEC source: **source needed**. | PA rule carried over (validated principle); lateral target: source needed |
| Dose creep / optimisation | PA wording applies unchanged (principle). Filtration changes affected PA and LAT DAP differently (R2) — an observation, not a rule. | validated principle (PA reference); numbers local |
| Exposure time / motion | Motion blur principle unchanged. Whether lateral needs a different time/instruction: **source needed**. | principle validated (PA reference); lateral specifics: source needed |
| Patient size | Lateral path is longer than PA (R1: 18–37 cm vs 18–31 cm) — see "Needs for Session 11": attenuation is projection-dependent. | observed (one site) |

## 5. Marker convention for the lateral projection — OPEN (not decided)

**Facts established by the sources read:** side identification is expected on radiographs as best practice (R4, R5, R6, as already recorded for PA in `session-5-qa.md` §0.1); **none of them states a convention for lateral projections** (R4's 137 laterals are all body parts, no rule). R8 shows the patient's side can often be inferred from the lateral image itself.

**A derivation, not a medical claim (marked as such):** the PA convention in the code (`PositioningSpec.markerSide`: L on the viewer's right half, R on the left) maps the marker letter to a *horizontal half of the displayed detector*. In a lateral display the horizontal axis of the detector runs anterior ↔ posterior, not patient left ↔ right, so a viewer-half rule cannot transfer unchanged. The wrong-side-marker critical finding, `evalMarker` and `RenderPlan.marker` all use that rule today. A lateral therefore needs a **different rule kind or no scored marker rule**.

**Options (owner decision O6 — presented, not chosen):**

| # | Option | What it would mean | Source status |
|---|---|---|---|
| A | **Marker names the patient side nearest the detector** (left lateral → "L"), placed anywhere inside the field, not over anatomy | Rule kind: letter must match the *selected side-against-detector* control, not a screen half | **Source needed** (commonly taught; found only in unverified search summaries — see §1.3 L3). |
| B | **Marker names the patient side nearest the tube** | As A with the opposite mapping | **Source needed**; *conflicts* with A in unverified summaries (§1.3 L3) — do not choose without a primary source. |
| C | **Marker presence only** (placed or not, inside the field, not obscuring anatomy); letter correctness not checked | No wrong-side critical finding for lateral | Supported as *best practice* by R4–R6 for presence; no source for letter rules. Closest to the current PA state (marker weight 0, side-correctness educational). |
| D | **Display convention fixed in data** (which way the anterior faces on the displayed image) and a letter rule attached to it | A new data field in `ExamDefinition.positioning`; ADR-0010 ("orientation conventions are data") | **Source needed** for the display orientation of a lateral chest. |
| E | **Defer**: ship the lateral exam without a scored or gated marker, marker control shown as in PA but unscored | No critical finding; marker check weight 0 | Consistent with O3 (no rubric yet). |

**Recommendation:** none made here. Any of A–D needs a primary source (ACR / EC / AIR) read first; E is the only option that needs no new medical claim. The decision is the owner's (O6 in `DECISIONS.md`).

## 6. Image quality and result rendering (lateral)

| Criterion / effect | Statement | Class / status |
|---|---|---|
| True-lateral alignment / obliquity | Concept exists (R9). Appearance cues (e.g. separation of the posterior ribs, sternum in profile) are **unverified leads** (§1.3 L4–L5), not usable. **No numeric thresholds.** | concept: common-reference; cues and magnitude: source needed |
| Inspiration | **Source needed** for lateral appearance criteria (PA rib counts do not transfer). | source needed |
| Arms / humeral superimposition | **Source needed** (lead L2). | source needed |
| Coverage | Which structures a lateral must include: **source needed.** | source needed |
| Motion; low detector exposure (noise); excess exposure (no darkening); low penetration | Same validated DR principles as PA (PA Image-Quality reference): detector-exposure effects change noise / detail, not brightness; no invented EI. The lateral-specific *places* where penetration shows (e.g. spine through the heart, retrosternal / retrocardiac regions) are **source needed**. | principles: validated (PA reference); lateral landmarks: source needed |
| Laterality of structures | A lateral image carries side information in the anatomy (R8: right vs left ribs; gastric bubble and cardiac silhouette signs); a renderer must not rely on this to score a marker. | concept supported (abstract) |
| "Do NOT implement as clinical truth" | The PA list (§ "Do NOT implement as clinical truth", items 1–12) applies unchanged. Additionally: do not state a rib-separation distance or a degrees-of-obliquity mapping, a universal lateral SID, kVp or mAs, or a lateral EI target, until a primary source is read. | rule |

## 7. Arabic terms (proposed)
Proposed Lateral terms are in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) ("Session 10 — Chest Lateral"), **pending educator review**; no existing UI string was changed.

## 8. Needs (for the generalisation session)
Compared with **Chest PA as implemented today** (`SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `CriticalFindingId`, `RadiographAssetSpec`, scene `chest-pa-frontal`). Marks: **same** as PA · **differs** · **new** · **unknown — source needed**. Combined with Chest AP in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md).

### 8.1 Controls (what the student sets)
| Item (PA today) | Lateral | Mark | Note / missing source |
|---|---|---|---|
| `projection` (enum PA / AP / lateral-left) | same control; required = lateral; option list includes the lateral side(s) | **differs** | whether `lateral-right` is offered: O7 |
| Side placed against the detector | an enum control PA does not have | **new** (existence **unknown**) | §3; EC / ACR / StatPearls (§1.2) |
| `rotationDeg` | departure from a true lateral: same numeric idea, different label, feedback, tolerance | **differs** | tolerance: source needed |
| `centralRay` | same control; different target; detector x axis runs anterior ↔ posterior | **differs** | target: source needed |
| `collimation` | same control; different required region | **differs** | region: source needed |
| `chinPosition` | whether needed is unknown (likely not) | **unknown** | source needed |
| `shoulderPosition` | PA shoulders-forward replaced by an arm-position control | **differs / new** | values: source needed |
| `sideMarker`, `markerPosition` | marker rule differs | **differs** | O6 |
| `sidCm`, `kvp`, `mas`, `exposureMode`, `aecChambers` | same controls; protocol values, ranges, chamber layout unknown | **same** (controls) / **unknown** (values) | EC / ACR (§1.2); `ExamDefinition.technique` + `controls` |
| `breathing` | same control; lateral target unknown | **same** / **unknown** | source needed |
| `motionInstruction` | same | **same** | |
| Console presentation | PA JSX hard-wires the PA control set; Lateral needs a console built from a control list | **new** | S7-4 |

### 8.2 Scoring categories
| PA | Lateral | Mark | Note |
|---|---|---|---|
| Six fixed ids (`positioning, rotation, centering, exposure, sid, breathing`), weights 25/20/15/20/10/10, pass mark 70 | exam declares its own list and weights (owner / educator decision, sum 100); a category outside the fixed union cannot be added as data today | **unknown** | weights are configuration (rule 5), not a sourced fact |

### 8.3 Critical findings
| PA (`CriticalFindingId`) | Lateral | Mark | Note |
|---|---|---|---|
| `wrong-projection` | a PA / AP shown for a lateral order | **same** | |
| `patient-motion` | same principle | **same** | |
| `wrong-side-marker` (viewer-half rule) | the viewer-half rule does not transfer (§5) | **differs / unknown** | O6 |
| — | any lateral-specific critical finding | **unknown** | no source |

### 8.4 Image variants / effects
| PA | Lateral | Mark | Note |
|---|---|---|---|
| `correct`, `wrong-projection`, `motion`, `low-exposure`, `excess-exposure`, `low-penetration`, `clipped`; effects `baseline`, `collimation-clipping`, `excess-field`, `centering`, `motion`, `low-exposure`, `excess-exposure`, `low-penetration`, `projection` | projection-independent principles | **same** | lateral penetration landmarks: source needed |
| `rotated` / `rotation` (hemithoracic asymmetry, clavicles) | lateral obliquity cue, not clavicles | **differs** | appearance: source needed |
| `poor-inspiration` / `inspiration` | lateral appearance | **differs / unknown** | |
| `scapulae-overlap` / `scapulae`; `chin-overlap` / `chin` | arm / humeral superimposition cue replaces scapulae; chin unknown | **new / unknown** | |
| `magnified-geometry` | same mechanism (SID / OID geometry) | **same** | |
| `marker` | | **differs** | O6 |
| — | superimposition of the two hemithoraces | **new / unknown** | |

### 8.5 Positioning scene
| PA | Lateral | Mark | Note |
|---|---|---|---|
| Hand-drawn SVG `chest-pa-frontal`; `SCENE_IDS = ["chest-pa-frontal"]`; `scene.id` declared, resolved by nothing | patient in profile, arm position, side against the detector, horizontal central ray; detector axis meaning (A–P) as data (ADR-0010) | **new** | art contents: source needed (§3) |

### 8.6 Landmark groups (`RadiographAssetSpec`)
| PA field | Lateral | Mark | Note |
|---|---|---|---|
| `anatomyBox`, `lungApexV` | same concept, new values | **same** (concept) | |
| `midlineU` | no frontal midline | **differs / unknown** | replacement unknown |
| `diaphragmDomeV` (one value) | two hemidiaphragms visible (R8) | **differs** | representation unknown |
| `scapulae` (required) | not applicable; arm / humerus group | **new / unknown** | |
| `jaw` (required) | likely not needed | **unknown** | |
| `denseZones` | retrosternal / retrocardiac / spine regions | **differs / unknown** | |

### 8.7 Case fields (`CaseDefinition`)
| Field | Lateral | Mark | Note |
|---|---|---|---|
| patient, order text, condition, clinical scenario | same fields; indication wording unknown (R7: lateral is conditional) | **same** / **unknown** | |
| `patientTechnique.attenuation` (one scalar per case) | a patient attenuates more along the lateral path (R1: 29.2 vs 23.5 cm); attenuation is projection-dependent | **differs / new** | a per-exam factor or per-projection value; magnitude: source needed (S7-3) |
| `patientCooperation` | same model; arm-raising ability as a cooperation dimension unknown | **same** / **unknown** | |
| `initialSettings` | same (not the answer) | **same** | |
| `radiograph` (baseline + landmarks) | new asset | **new** | §8.8 |
| demographics (D7) | baseline's apparent patient must match the case patient | **same** (rule) | |

### 8.8 Assets (licence-verified only — none fetched or added)
| Asset | Status |
|---|---|
| Lateral chest baseline radiograph, openly licensed (CC0 / CC BY), verified at source, provenance (registry `A-006+`), annotations neutralised, landmarks authored | **OPEN — none sourced.** `MODALITY_SOURCES_CANDIDATES.md` lists Wikimedia Commons lateral chest images as "to verify". A schematic / phantom fallback lowers realism and must be labelled. |
| Scene art (own-work SVG) | to be authored in Session 12 |

## 9. Generalisation (S7-4) mapping — Lateral
| S7-4 item | Needed by Lateral? | Why |
|---|---|---|
| `SimulationSettings` / `ControlSpec[]` | **Needed** (limited) | Controls without a PA key (side against detector, arm position); `rotationDeg` changes meaning. Only the control kinds Lateral uses (enum, numeric, point, size). |
| `CATEGORIES` / `CategoryId` | **Needed** | The exam declares its own categories / weights; the fixed union plus per-id message keys blocks it. |
| `ImageVariantId` / `EffectId` | **Needed** (limited) | Arm / lateral-obliquity effects and variants; PA ones must keep working. Members unknown until §6 is sourced. |
| `CriticalFindingId` + `isPresent` | **Needed** (limited) | The wrong-side-marker viewer-half rule does not transfer; O6 decides what replaces it. |
| Console JSX | **Needed**, minimal | New controls must render; PA-only JSX would force per-exam components (rule 2). PA DOM must stay identical. |
| Positioning scene art | **Scene registry: needed** · fully generated art: **deferred** | A second scene exists → `scene.id` resolution is justified; generating SVG from a `SceneSpec` is not required for one more hand-drawn scene. |
| `RadiographAssetSpec` landmark groups | **Needed** | `scapulae`, `jaw`, `midlineU`, `denseZones`, one `diaphragmDomeV` do not fit a lateral (§8.6) → optional / per-exam. |
| Move to `modalities/xray/*` | **Not needed → deferred** | No Lateral dependency; tied to the first non-X-ray engine. |
| Migrating consumers off `RadCase` | **Not needed → deferred** | S7-2 strangler; Lateral composes through `composeCase()`. |

The combined mapping across PA, Lateral and AP is in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md).

## 10. Open owner decisions and open items
- **O6** marker convention (§5) · **O7** lateral side(s) offered (§3) — in `DECISIONS.md`.
- **Blocked sources, each with the claim it would support** (extends O4): see §1.2 (EC EUR 16260, IAEA publication host, ACR parameters, WHO chest PDF, NCBI Bookshelf / StatPearls, RCR / AIR criteria).
- **"Source needed" items:** side against detector; arm / shoulder / chin position; centring point and level; SID, kVp, mAs, AEC chamber layout for lateral; breathing criteria; required coverage and region size; rotation / obliquity appearance and tolerance; inspiration criteria; lateral EI target; lateral-specific critical findings; category weights; lateral-path attenuation magnitude; marker rule; baseline asset.

## 11. Development rules
As the Chest PA reference §8: do not invent values; record the source of every rule; separate validated rule / educational simplification / provisional value; if sources disagree, document it and keep the rule configurable.
