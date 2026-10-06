# RAD-LAB — Medical Reference: Adult Chest Lateral (erect) — positioning, technique, image quality

**Purpose:** evidence pack for the Chest Lateral exam (roadmap Session 10, docs only). It is written *before* any rule, control or asset, as `ROADMAP_SESSIONS.md` requires.
**Scope:** adult, erect, general digital radiography (DR), lateral chest projection only. Not AP, not portable, not paediatric.
**Use:** educational simulation design. Not a substitute for local protocols or educator / radiologist review.
**Format:** follows [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md). **Status:** **DRAFT — updated in Session 10b with the source library (EC16260, WHO-CHEST, STATPEARLS-POS; `sources/REGISTER.md`); items those sources do not support are still "source needed".** Read §1 first: it says which sources could be read in full in this session and which could not. Nothing here has been reviewed by an educator or physicist (O5).

## 0. Honest summary of the evidence

1. The authoritative lateral-chest criteria sources the Chest PA references lean on — the European Commission quality-criteria guideline (EUR 16260), IAEA-TECDOC-1423, the WHO chest manual, the ACR practice parameters, the RCR audit criteria — **could not be read in full in this session** (network egress to those hosts was blocked or required a captcha; see §1). Where the PA references cite them, this document does **not** re-use their lateral content from memory.
2. What *was* read in full is thin on lateral specifics: one single-site dose / technique study with lateral values (Junda 2021), one multi-centre DRL paper with lateral rooms (Dalah 2025), one reject-rate study (Atkinson 2020), the three side-marker papers already used for PA (Chung 2020, Fuller 2016, Barry 2016), plus abstracts on the role of the lateral view.
3. Therefore **no lateral positioning rule, centring point, field size, SID, kVp, mAs, image-quality threshold or scoring tolerance is asserted here as sourced.** Each is "source needed" (§3–§6) so that Session 11 does not build on unsupported values.
4. The **marker convention for the lateral projection is not decided** (§5, owner decision O6).
5. **Session 10b update:** three sources were added through the source library (`sources/REGISTER.md`; read by the owner's advisor from owner-supplied copies, not by a repository session): **EC16260** (PDF p.15, p.21), **WHO-CHEST** (p.4, 5, 17, 27) and **STATPEARLS-POS** (section "Positioning – Chest"). They resolve the lateral inspiration / arms / superimposition criteria, the example technique (FFD, kV, grid, AEC chamber), the dose ratio vs PA and the landmark list, and give a **single secondary-source** statement for the side against the receptor. They give **no** lateral centring level, rib-count rule, obliquity tolerance, mAs, scoring tolerance or marker convention. Where sources overlap or differ, §3–§6 say so.

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

### 1.1b Read through the source library (Session 10b)
Registered in [`sources/REGISTER.md`](sources/REGISTER.md); claims with locators in `sources/<id>.md`. **Read by: owner's advisor, from an owner-supplied copy** (or owner-pasted text for StatPearls); not re-checked by the repository session. Facts are cited and paraphrased only (S10-3).

| # | Source | Locators | Supports (lateral) | Sole support? |
|---|---|---|---|---|
| S1 | [EC16260](sources/EC16260.md) — European Commission, *Quality Criteria for Diagnostic Radiographic Images*, EUR 16260 (1996) | PDF p.15, p.21 (owner's copy) | Lateral image criteria, dose criterion and example technique; standard-adult scope; "never reject only for missing criteria" | A criteria source in its own right, but a 1996 example technique → `common-reference`, not universal |
| S2 | [WHO-CHEST](sources/WHO-CHEST.md) — WHO manual of diagnostic imaging, chest (2006) | p.4, 5 (Fig 2.4), 17, 27 | Role of the lateral; annotated lateral landmark list; marker used to check orientation | Qualitative statements only |
| S3 | [STATPEARLS-POS](sources/STATPEARLS-POS.md) — *X-ray Radiographic Patient Positioning*, NBK565865 | "Positioning – Chest" (no pages) | Lateral positioning: left side against the receptor, arms up, chin, no rotation / tilt, centring | **Single secondary source** → "educator to confirm" |
| S4 | [ACR-CHEST](sources/ACR-CHEST.md) — ACR–SPR–STR *Practice Parameter for the Performance of Chest Radiography* (2022, amended 2023; United States) | Sec I, IV, VI | Routine exam = erect PA + **left lateral** at full inspiration; grid ≥ 10:1; SID ≥ 72 in (183 cm, conversion, not source) routine upright; mid-grey; marker incl. side and patient position | Professional-society parameter; claims supplied by the owner (advisor reading); `common-reference` (US); no lateral image criteria in the notes |

Existing PA sources (IAEA-TECDOC-1423, the AAPM / IEC / ICRP technique sources) are documented in the three PA reference files; they are **not** re-used for lateral claims here.

### 1.2 Not read (blocked or captcha-walled; do not cite as read)

| Source | Claim it would support (open item, alongside O4) | Why not read |
|---|---|---|
| ~~European Commission, EUR 16260 EN (1996)~~ | **Now read (Session 10b) as S1 / EC16260** (PDF p.15, p.20–21; by the owner's advisor). | Was blocked in Session 10. |
| IAEA-TECDOC-1423 (2004) — the repository's PA image-criteria source | Whether it contains lateral criteria. | `iaea.org` returned 403 / payment-required; publication host blocked. **Not read** (for lateral). |
| IAEA publication host (`www-pub.iaea.org`: TECDOC-796 / TECDOC-1423 / TE_1447 PDFs, as linked in the PA Technique reference §17) | Lateral image criteria and example technique, if present. | Blocked by the egress proxy (curl and WebFetch); not bypassed. **Not read.** |
| ACR practice parameters (chest radiography; digital radiography) | Marker / identification, lateral technique, O3 / O4. | **Chest radiography now read as S4 / ACR-CHEST** (supplied by the owner, Session 10b follow-up). The digital-radiography parameter is **not read**. |
| ~~WHO chest manual PDF (R12)~~ | **Now read (Session 10b) as S2 / WHO-CHEST** (p.3–5, 17, 27–29, 32; by the owner's advisor). | Was blocked in Session 10. |
| ~~NCBI Bookshelf: StatPearls *X-ray Radiographic Patient Positioning*~~ (correct id **NBK565865**; the earlier NBK557488 was wrong) | **Now read (Session 10b) as S3 / STATPEARLS-POS** (owner-pasted text; no page numbers). | Was captcha-walled in Session 10. |
| NCBI Bookshelf: *A Systematic Approach to Chest Radiographic Analysis* | Positioning text for the lateral. | Captcha challenge; **not bypassed**. **Not read.** |
| RCR *adapted anatomical image criteria* (PA chest only exists as a page), AIR professional practice guideline, Bontrager / Merrill textbooks | Positioning detail; textbook conventions. | Hosts blocked; textbooks are not open-checkable. **Not read.** Textbooks are not used as sources for now (S10-5); educator review covers gaps. |

### 1.3 Leads
None recorded. Statements taken from search-result summaries or secondary sites were removed (S10-3: commercial product, no secondary-site reliance; Radiopaedia is not used at all). Items they touched were left "source needed" in Session 10; Session 10b resolved some of them from S1–S3 (§3, §6). Rib counts for lateral inspiration, obliquity cues / tolerance and the marker side stay **source needed** (§3, §5, §6).

**Consequence for Session 11 and 12:** EUR 16260, the WHO chest manual, StatPearls, and (Session 10b follow-up) the two ACR chest parameters (ACR-CHEST, ACR-PORTABLE) are now in the source library; **WHO-TECH** (radiographic technique and projections; lateral centring level and shoulder position) is registered as *to obtain*. Still unread: the **ACR digital-radiography parameter**, the **IAEA publications**, RCR / AIR criteria and the abstract-only items (`sources/REGISTER.md` §3). Every "source needed" below that S1–S3 do not resolve must still be filled from a primary source *before* any lateral rule is implemented. This extends open decision O4.

## 2. Classification (same system as the Chest PA references)

Every rule must carry one of the five evidence classes in `EVIDENCE_CLASSES`: **validated**, **common-reference**, **vendor-protocol-dependent**, **educational-simplification**, **provisional** (the last three are never shown to a learner as validated truth). In this document, "**source needed**" means no class can be assigned yet; such an item must not be implemented, or only as `provisional` with a TODO.

## 3. Positioning (adult erect lateral)

| Topic | What this reference can state | Class / status |
|---|---|---|
| Indication / role of the lateral | A lateral is an *additional* view, not automatic; its added diagnostic value for small nodules was not significant in one ROC study (R7); the lateral shows thoracic cage, pleura, heart, pericardium, bronchi, upper abdomen (R9). | common-reference (concept, abstracts only) |
| Which side is placed against the detector (left vs right lateral) | **Left side against the receptor** (reason given: minimises cardiac magnification) — S3 "Positioning – Chest". **Single secondary source; educator to confirm.** EC16260 (S1, p.21) and WHO-CHEST (S2) do not state the side. `ProjectionId` already contains `"lateral-left"`. | provisional (single secondary source; educator to confirm) → O7 |
| Left lateral as the routine lateral (Session 10b follow-up) | **ACR-CHEST (S4, Sec I, IV): the routine examination is an erect PA plus a LEFT lateral at full inspiration** (may be modified by the physician or qualified technologist). With S3 this is now **two independent statements** (a professional-society practice parameter and a secondary review) for the left side. Owner decision **S10b-4** (provisional; both sides offered, left correct by default, right only when the case requests it) — see §12. | common-reference (S4) + S3; educator to confirm (O5) |
| Arm position | Arms **raised clear of the thorax** is an image criterion (S1 p.21); S3: arms raised and crossed above the head. The two agree in direction. | common-reference (S1, criterion) + S3 (positioning) |
| Shoulder / chin position | **Chin extended** — S3 (single secondary source; educator to confirm). **Shoulders: source needed** (PA rules for shoulders do **not** transfer). | chin: provisional (single secondary source); shoulders: source needed |
| Centring point and level; central-ray direction | S3: thorax centred on the central ray and on the receptor in the anterior–posterior direction (S3 "Projections": the central ray passes from one side to the other). **No centring level for the lateral erect is stated** — the T7 in S3 belongs to the lateral *decubitus* and must not be transferred. The PA value (≈ T7) must not be copied. | A–P centring: provisional (S3); level: **source needed** |
| Centring level — owner decision (Session 10b follow-up) | **S10b-5 (provisional):** central ray at the T7 level, mid-axillary line. **No read source supports the T7 level for the lateral erect** (S3's T7 is for the lateral *decubitus*; S1 p.21, S2 and S4 state no level). Stays provisional until WHO-TECH (`sources/REGISTER.md` §3, to obtain) is verified. | provisional (owner decision; no read source) |
| Midsagittal-plane alignment / "true lateral" | S3: no rotation or tilt. S1 p.21: **posterior lung borders superimposed** is the image criterion. The concept of slightly oblique deviations exists (R9, abstract). **Any numeric tolerance or rib-separation distance: source needed** (none stated). | criterion: common-reference (S1); tolerance: source needed |
| SID | EC16260 example technique (S1 p.21): **same FFD as the PA — 180 (140–200) cm**. Observed practice agrees (180 cm in 114 / 120 images in R1; the Dubai rooms in R2). This is an example technique, not a universal rule. | common-reference (S1 example technique); observed practice local |
| SID — ACR (Session 10b follow-up) | ACR-CHEST (S4, Sec VI): SID **at least 72 in (183 cm — conversion, not source)** for routine upright chest radiography, 40 in (102 cm — conversion, not source) when clinically necessary. Agrees in direction with S1's 180 (140–200) cm; the two values differ slightly at the low end (140 vs 183 cm) — document, keep configurable. | common-reference (S1, S4) |
| Respiration | **Full inspiration with suspended respiration** (S1 p.21). **No lateral rib-count rule is given** — none may be invented from the PA rib counts. | common-reference (S1); rib count: source needed |
| Respiration — ACR (Session 10b follow-up) | The routine PA + left lateral is performed at **full inspiration** (S4, Sec I). Still no lateral rib-count rule. | common-reference (S1, S4) |
| Collimation / required anatomy | The image must show the structures listed in S1 p.21: trachea, costophrenic angles, posterior heart border, aorta, mediastinum, diaphragm, sternum, thoracic spine (WHO Fig 2.4, S2 p.5, labels the same region, plus the retrosternal and retrocardiac spaces). **Any numerical region size: source needed.** The PA 27 × 31 cm demo region is provisional (O2) and is **not** a lateral value. | structures: common-reference (S1, S2); region size: source needed |

## 4. Technique (digital radiography)

| Topic | What can be stated | Class / status |
|---|---|---|
| Lateral needs more exposure than PA for the same patient | **Observed** in one site: mAs ≈ 2.7× PA (9.7 vs 3.6), kVp 117 vs 113.7, patient path 29.2 vs 23.5 cm (R1); the lateral entrance air kerma and DRL are higher than PA (R1, R2). This is attenuation physics plus local practice; **no target mAs/kVp is derived from it.** | vendor-protocol-dependent; magnitude provisional |
| kVp / mAs / AEC / grid for lateral | **Example technique (S1 p.21):** same device, grid, focal spot, filtration and FFD as the PA; **125 kV**; exposure time < 40 ms (PA: < 20 ms, 125 kV). A 1996 example, not a universal protocol (the PA Technique reference §3.2 applies); **no mAs** is given. S2 p.3: 120–140 kV penetrates the mediastinum better, contrast falls above 140 kV. Real settings vary widely: lateral kVp ≈ 100–125 and mAs ≈ 2–20 in the central cases of R1–R2 (R2's per-room table also contains much larger outliers), with AEC and 6:1–13:1 grids in R2. The PA technique rules (kVp band, AEC, DI discussion) are **not** automatically valid for lateral. | source needed; observed ranges are local-protocol dependent |
| Technique — ACR (Session 10b follow-up) | S4 (Sec IV, VI; chest radiography in general, adults): high-kV technique **120–150 kVp**; anti-scatter at least equal to a **10:1 grid, preferably 12:1** (grid or air gap); mid-grey parenchyma; technique charts posted; focal spot ≤ 2.0 mm (0.6–1.2 mm recommended); PA exposure time ≤ 40 ms. The lateral-specific exposure time is not stated in the notes (S1: < 40 ms). Owner decisions **S10b-2** (AEC: central chamber), **S10b-9** (no numeric mAs; exposure scored as a category) — see §12. | common-reference (S1, S4; US / EC) |
| AEC chamber choice for a lateral | EC16260 example technique: **central chamber** for the lateral (S1 p.21) vs the **right lateral chamber** for the PA (S1 p.20): the chamber differs per projection. Vendor chamber layouts still vary; this is an example, not a universal rule (PA Technique reference §4). | common-reference (S1 example); layout: vendor-protocol-dependent |
| Dose criterion (reference level for a standard patient) | Entrance surface dose **1.5 mGy for the lateral vs 0.3 mGy for the PA — a ratio of 5** (S1 p.21, p.20; standard 70 kg adult). Supports that the lateral needs substantially more incident exposure. R1's local DRL (0.8 vs 0.3 mGy, ≈ 2.7×) is smaller — a local observation, not a contradiction. **No dose value is shown to a learner or scored** (RAD-LAB has none for PA either). | common-reference (S1); not for scoring |
| Exposure index / deviation index | The PA decisions stand: **brightness is never an exposure indicator; no invented numeric EI/EIT/DI limit**. Whether a lateral-specific EIT exists in any vendor/IEC source: **source needed**. | PA rule carried over (validated principle); lateral target: source needed |
| Dose creep / optimisation | PA wording applies unchanged (principle). Filtration changes affected PA and LAT DAP differently (R2) — an observation, not a rule. | validated principle (PA reference); numbers local |
| Exposure time / motion | Motion blur principle unchanged. Whether lateral needs a different time/instruction: **source needed**. | principle validated (PA reference); lateral specifics: source needed |
| Patient size | Lateral path is longer than PA (R1: 18–37 cm vs 18–31 cm) — see "Needs for Session 11": attenuation is projection-dependent. EC16260 criteria apply to standard-size adults (about 70 kg; S1 p.15). | observed (one site) + S1 scope |

## 5. Marker convention for the lateral projection — OPEN (not decided)

**Facts established by the sources read:** side identification is expected on radiographs as best practice (R4, R5, R6, as already recorded for PA in `session-5-qa.md` §0.1); WHO-CHEST (S2 p.17) says the side marker is used to check that the film is the right way round — **it gives no lateral convention**; EC16260 (S1) and StatPearls (S3) were read for the lateral and state **no marker rule**. **ACR-CHEST (S4, Sec IV QC; Session 10b follow-up): each image must be permanently marked with the right or left side and the patient position** — marker *presence* is stated by a professional-society parameter; **no viewer-side / lateral letter convention** is given. Owner decision **S10b-8**: presence required and scored; the Lateral letter convention stays unscored per S10-5 until a source exists. **None of the sources states a convention for lateral projections** (R4's 137 laterals are all body parts, no rule). R8 shows the patient's side can often be inferred from the lateral image itself.

**A derivation, not a medical claim (marked as such):** the PA convention in the code (`PositioningSpec.markerSide`: L on the viewer's right half, R on the left) maps the marker letter to a *horizontal half of the displayed detector*. In a lateral display the horizontal axis of the detector runs anterior ↔ posterior, not patient left ↔ right, so a viewer-half rule cannot transfer unchanged. The wrong-side-marker critical finding, `evalMarker` and `RenderPlan.marker` all use that rule today. A lateral therefore needs a **different rule kind or no scored marker rule**.

**Options (owner decision O6 — presented, not chosen):**

| # | Option | What it would mean | Source status |
|---|---|---|---|
| A | **Marker names the patient side nearest the detector** (left lateral → "L"), placed anywhere inside the field, not over anatomy | Rule kind: letter must match the *selected side-against-detector* control, not a screen half | **Source needed.** |
| B | **Marker names the patient side nearest the tube** | As A with the opposite mapping | **Source needed.** A and B are mutually exclusive: choose only from a primary source. |
| C | **Marker presence only** (placed or not, inside the field, not obscuring anatomy); letter correctness not checked | No wrong-side critical finding for lateral | Supported as *best practice* by R4–R6 for presence; no source for letter rules. Closest to the current PA state (marker weight 0, side-correctness educational). |
| D | **Display convention fixed in data** (which way the anterior faces on the displayed image) and a letter rule attached to it | A new data field in `ExamDefinition.positioning`; ADR-0010 ("orientation conventions are data") | **Source needed** for the display orientation of a lateral chest. |
| E | **Defer**: ship the lateral exam without a scored or gated marker, marker control shown as in PA but unscored | No critical finding; marker check weight 0 | Consistent with O3 (no rubric yet). |

**Provisional default (S10-5):** option **E** (unscored, ungated) until a full-text source and a final owner decision, required before Session 12. PA behaviour is unchanged. **Recommendation:** none made here. Any of A–D needs a primary source (ACR / EC / AIR) read first; E is the only option that needs no new medical claim. The decision is the owner's (O6 in `DECISIONS.md`).

## 6. Image quality and result rendering (lateral)

| Criterion / effect | Statement | Class / status |
|---|---|---|
| True-lateral alignment / obliquity | Criterion: **posterior lung borders superimposed** (S1 p.21); no rotation or tilt at positioning (S3). Concept of oblique deviation: R9. **Appearance magnitude and any numeric tolerance: source needed.** **No numeric thresholds.** | criterion: common-reference (S1); magnitude: source needed |
| Inspiration | Criterion: full inspiration with suspended respiration (S1 p.21). **No lateral rib-count rule** (PA rib counts do not transfer). WHO p.29 (S2) describes poor inspiration for the frontal view only. | criterion: common-reference (S1); appearance mapping: source needed |
| Arms / humeral superimposition | Criterion: arms raised **clear of the thorax** (S1 p.21). WHO Fig 2.4 (S2 p.5) labels a **skin fold from the arm** as a feature of the lateral. Appearance and magnitude of the arm cue: **source needed.** | criterion: common-reference (S1); appearance: source needed |
| Coverage | Structures the lateral must show: trachea, costophrenic angles, sharp posterior heart border, aorta, mediastinum, diaphragm, sternum, thoracic spine (S1 p.21); WHO Fig 2.4 labels: substernal line, retrosternal space, trachea, aorta, left and right bronchi, posterior heart border, retrocardiac space, right and left hemidiaphragms, scapulae, skin fold from the arm (S2 p.5). Lung-field extent / region size: source needed. | structures: common-reference (S1, S2) |
| Motion; low detector exposure (noise); excess exposure (no darkening); low penetration | Same validated DR principles as PA (PA Image-Quality reference): detector-exposure effects change noise / detail, not brightness; no invented EI. The lateral-specific *places* where sharpness / penetration is judged are now named: posterior heart border, aorta, mediastinum, diaphragm, sternum and thoracic spine (S1 p.21) and the retrosternal / retrocardiac spaces (S2 p.5). How each should look at low penetration: **source needed.** | principles: validated (PA reference); landmark names: common-reference (S1, S2); appearance: source needed |
| Laterality of structures | A lateral image carries side information in the anatomy (R8: right vs left ribs; gastric bubble and cardiac silhouette signs); a renderer must not rely on this to score a marker. | concept supported (abstract) |
| Scoring philosophy | EC16260 p.15 (S1): an image that meets all the clinical requirements must never be rejected only because some image criteria are not met. Consistent with the PA reference ("Image rejection") and O'Reilly 2025 (AP reference R9): lateral criteria are an educational standard, not a reject decision. **No rubric changed** (evidence for O5). | evidence for educator review |
| "Do NOT implement as clinical truth" | The PA list (§ "Do NOT implement as clinical truth", items 1–12) applies unchanged. Additionally: do not state a rib-separation distance or a degrees-of-obliquity mapping, a universal lateral SID, kVp or mAs, or a lateral EI target, until a primary source is read. | rule |

## 7. Arabic terms (proposed)
Proposed Lateral terms are in [`ARABIC_TERMINOLOGY.md`](ARABIC_TERMINOLOGY.md) ("Session 10 — Chest Lateral"), **pending educator review**; no existing UI string was changed.

## 8. Needs (for the generalisation session)
Compared with **Chest PA as implemented today** (`SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `CriticalFindingId`, `RadiographAssetSpec`, scene `chest-pa-frontal`). Marks: **same** as PA · **differs** · **new** · **unknown — source needed**. Combined with Chest AP in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md).

### 8.1 Controls (what the student sets)
| Item (PA today) | Lateral | Mark | Note / missing source |
|---|---|---|---|
| `projection` (enum PA / AP / lateral-left) | same control; required = lateral; option list includes the lateral side(s) | **differs** | whether `lateral-right` is offered: O7 |
| Side placed against the detector | an enum control PA does not have | **new** (existence now supported by S3 only — **single secondary source; educator to confirm**) | §3; O7 |
| `rotationDeg` | departure from a true lateral: same numeric idea, different label, feedback, tolerance | **differs** | tolerance: source needed |
| `centralRay` | same control; different target; detector x axis runs anterior ↔ posterior | **differs** | target: source needed |
| `collimation` | same control; different required region | **differs** | region: source needed |
| `chinPosition` | S3 says chin extended for the lateral; whether a learner control is needed is an educator decision | **unknown** | S3 (single secondary source) |
| `shoulderPosition` | PA shoulders-forward replaced by an arm-position control (arms raised clear of the thorax: S1 p.21; arms raised and crossed above the head: S3) | **differs / new** (existence supported) | option values and shoulders: source needed |
| `sideMarker`, `markerPosition` | marker rule differs | **differs** | O6 |
| `sidCm`, `kvp`, `mas`, `exposureMode`, `aecChambers` | same controls. Example technique (S1 p.21): FFD 180 (140–200) cm, 125 kV, grid, **central** AEC chamber (PA: right lateral). **AEC chamber choice differs per projection**; mAs and ranges unknown | **same** (controls) / **differs** (AEC target) / **unknown** (mAs, ranges) | `ExamDefinition.technique` + `controls`; ACR / IAEA still unread |
| `breathing` | same control; target = full inspiration, suspended respiration (S1 p.21) | **same** | rib-count rule: not given |
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
| `rotated` / `rotation` (hemithoracic asymmetry, clavicles) | lateral obliquity cue: posterior lung borders no longer superimposed (S1 p.21), not clavicles | **differs** | appearance and magnitude: source needed |
| `poor-inspiration` / `inspiration` | lateral appearance | **differs / unknown** | |
| `scapulae-overlap` / `scapulae`; `chin-overlap` / `chin` | arms-not-clear-of-the-thorax cue (S1 p.21; skin fold from the arm, S2 p.5) replaces scapulae; chin unknown | **new** (existence supported) / **unknown** | appearance: source needed |
| `magnified-geometry` | same mechanism (SID / OID geometry) | **same** | |
| `marker` | | **differs** | O6 |
| — | superimposition of the posterior lung borders (S1 p.21) | **new** (existence supported) | magnitude: source needed |

### 8.5 Positioning scene
| PA | Lateral | Mark | Note |
|---|---|---|---|
| Hand-drawn SVG `chest-pa-frontal`; `SCENE_IDS = ["chest-pa-frontal"]`; `scene.id` declared, resolved by nothing | patient in profile, arm position, side against the detector, horizontal central ray; detector axis meaning (A–P) as data (ADR-0010) | **new** | art contents: source needed (§3) |

### 8.6 Landmark groups (`RadiographAssetSpec`)
| PA field | Lateral | Mark | Note |
|---|---|---|---|
| `anatomyBox`, `lungApexV` | same concept, new values | **same** (concept) | |
| `midlineU` | no frontal midline | **differs / unknown** | replacement unknown (the posterior lung borders are the superimposition reference, S1 p.21) |
| `diaphragmDomeV` (one value) | right and left hemidiaphragms are labelled in WHO Fig 2.4 (S2 p.5) and R8 | **differs** | representation unknown |
| `scapulae` (required) | **Corrected in Session 10b:** scapulae *are* labelled on the WHO lateral (S2 p.5), so "not applicable" was wrong; the arm cue is a skin fold (S2) and arms clear of the thorax (S1) — whether a landmark group is needed is an educator / Session 12 decision | **new / unknown** | |
| `jaw` (required) | likely not needed | **unknown** | |
| `denseZones` | retrosternal and retrocardiac spaces (S2 p.5) and thoracic spine (S1 p.21) | **differs** | region geometry: source needed |
| **Candidate lateral landmark group names (Session 10b)** | trachea; sternum / substernal line; retrosternal space; aorta; left and right bronchi; posterior heart border; retrocardiac space; mediastinum; right and left hemidiaphragms; costophrenic angles; thoracic spine; scapulae; skin fold from the arm (union of S1 p.21 and S2 p.5 Fig 2.4) | **new** (names supported; which are *required* groups is not) | positions: author from the baseline; Session 12 |

### 8.7 Case fields (`CaseDefinition`)
| Field | Lateral | Mark | Note |
|---|---|---|---|
| patient, order text, condition, clinical scenario | same fields; indication wording unknown (R7: lateral is conditional) | **same** / **unknown** | |
| `patientTechnique.attenuation` (one scalar per case) | a patient attenuates more along the lateral path (R1: 29.2 vs 23.5 cm); EC16260's lateral entrance dose criterion is 5× the PA's (S1 p.20–21) — supports **projection-dependent attenuation** (direction and rough scale of the reference doses; **not** an attenuation factor) | **differs / new** | a per-exam factor or per-projection value; magnitude: source needed (S7-3) |
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
- **"Source needed" items (after Session 10b):** centring **level**; shoulder position; side against the detector (single secondary source, educator to confirm — O7); mAs and any lateral kVp / SID range beyond the EC example; AEC chamber layout beyond the EC example; lateral inspiration rib-count rule; rotation / obliquity appearance and tolerance; arm cue appearance; lateral EI target; lateral-specific critical findings; category weights; lateral-path attenuation magnitude; required region size; marker rule; baseline asset.
- **Resolved in Session 10b (item → source):** inspiration criterion → S1 p.21; arms raised clear → S1 p.21 (+ S3); posterior lung borders superimposed → S1 p.21; AEC chamber, kV, grid, FFD, exposure time → S1 p.21 (example technique); dose ratio vs PA → S1 p.20–21; landmark list → S1 p.21 + S2 p.5 (Fig 2.4); default side → S3 only (provisional, educator to confirm); A–P centring and chin → S3 only.

## 12. Owner decisions recorded after Session 10b (pointers only)
Recorded in [`DECISIONS.md`](DECISIONS.md) as **S10b-1 … S10b-17** (each *provisional, owner decision 2026-10-06, pending educator/physicist review (O5)*; docs only — **no code, data or scoring changed**; implementation in the session named there). Lateral-relevant: **S10b-2** (AEC central chamber) · **S10b-4** (both sides offered; left default; closes O7) · **S10b-5** (T7 / mid-axillary centring; provisional until WHO-TECH) · **S10b-6** (both arms raised, clear of the lung fields) · **S10b-7** (posterior rib separation ≤ 1 cm acceptable; **no primary source — educator to confirm**) · **S10b-8** (marker presence required and scored; Lateral letter convention stays unscored) · **S10b-9** (no numeric mAs; exposure category) · **S10b-13** (critical findings) · **S10b-14** (PA weights reused for v1) · **S10b-15** (27 × 31 cm provisional) · **S10b-16** (asset audit first in Session 12). The items above in §3–§6 that say "source needed" stay marked as such; the decisions are owner choices, not evidence. The review list is [`REVIEW_PACKAGE.md`](REVIEW_PACKAGE.md).

## 11. Development rules
As the Chest PA reference §8: do not invent values; record the source of every rule; separate validated rule / educational simplification / provisional value; if sources disagree, document it and keep the rule configurable.
