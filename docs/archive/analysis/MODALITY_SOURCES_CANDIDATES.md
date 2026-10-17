# Candidate authoritative sources and openly licensed imagery, per modality

**Status: candidate lists only. Everything is "to verify".** This session did not open, download or read any of these sources and did not download or commit any asset. Titles, editions, numbers and licences below are recalled from general knowledge and **must be re-checked at the source by a human (or a later session reading the full text) before any statement or image derived from them is used** (CLAUDE.md rule 1; `ASSET_PROVENANCE_AND_LICENSES.md`).

Source policy (owner brief): authoritative sources limited to **IAEA, WHO, AAPM, ACR, IEC *concepts* (standards are paywalled — use the concepts/definitions only, quote nothing), and peer-reviewed literature indexed in PubMed**. Each use is classified with an evidence class (`PLATFORM_ARCHITECTURE.md` §6). Image policy: CC0 > CC BY > others only after review; avoid NC, ND, SA, request-access/credentialed datasets, redistribution-prohibiting terms.

Status legend: **Read** = read in full in an earlier session; **To verify** = not read here. Licence column = *as stated at the source, as recalled*.

## 0. Already used / still unread (Chest PA carry-forward)

| Source | Use | Status |
|---|---|---|
| IAEA and WHO material cited in `docs/RAD-LAB_Medical_Reference_Chest_PA*.md` | Chest PA positioning, technique, image quality | Supplied by the owner as project references; not re-verified here |
| Chung L et al. 2020 (PLoS ONE, marker audit); Fuller M 2016 (J Med Radiat Sci editorial) | marker evidence | **Read in full** (Session 5): support *concept* only, no scoring rule |
| ACR practice parameter(s) for general / chest / digital radiography | marker rubric, Lateral/AP | **Unread** — could not be read in Session 10 (network egress); read before Sessions 12–13 (S10-1 numbering) |
| Barry et al., J Med Radiat Sci 2016;63:148–54 and the Australian Institute of Radiography professional-practice guideline it cites | marker practice | **Unread** |

## 1. X-ray (general radiography)

### Authoritative sources (to verify title / edition / access)
- **IAEA** — *Diagnostic Radiology Physics: A Handbook for Teachers and Students* (2014; chapters on projection radiography, DR detectors, image quality, patient dose); IAEA Radiation Protection of Patients (RPOP) website (radiography pages; free); IAEA Human Health Series reports on diagnostic radiology QA.
- **WHO** — *Manual of Diagnostic Imaging* (radiographic technique and anatomy/positioning volumes); WHO *Communicating Radiation Risks in Paediatric Imaging* (radiation-risk communication).
- **AAPM** — Report No. 116 *An Exposure Indicator for Digital Radiography* (TG-116; basis of EI/EIT/DI concepts); TG-151 *Ongoing Quality Control in Digital Radiography*; AAPM reports on DR acceptance testing.
- **IEC** — IEC 62494-1 (exposure index of digital X-ray imaging systems; the *concept* of EI/EIT/DI that the Technique reference already uses). Concepts only.
- **ACR** — Practice Parameter for General Radiography; ACR–AAPM–SIIM Technical Standard for Electronic Practice of Medical Imaging; ACR Appropriateness Criteria (indication → exam; relevant to Learn).
- **PubMed** — search plan (no citations recalled): `("radiography"[MeSH] AND "radiographic image enhancement") AND positioning`; "exposure index" "deviation index"; "rotation" "chest radiograph" "quality criteria"; "side marker" audit.

### Candidate openly licensed imagery (all to verify at the file/dataset page)
| Candidate | Licence as stated at source (recalled) | Notes |
|---|---|---|
| Wikimedia Commons *Category: X-rays of normal chest* and sibling categories (individual files, e.g. A-001 already registered) | per file; CC0 or CC BY acceptable, **BY-SA excluded**; check each file page and `extmetadata` | Verified record exists for A-001 only; candidates in `docs/archive/sessions/session-5-baseline-options.md` |
| Wikimedia Commons images of lateral chest / AP chest / extremity / abdomen radiographs | per file | needed for Sessions 12–14 (S10-1 numbering); must check projection, annotations, patient demographics |
| NIH Clinical Center **ChestX-ray14** (frontal chest, 112k images) | NIH states free download; exact licence/terms on the distribution page **to verify**; previous session flagged "needs per-use terms review" | de-identification claim to verify; many images are low-resolution (1024²), report-derived labels (not for rule validation) |
| NLM **Open-i** / PMC open-access figures | each figure carries its article's licence (many CC BY, many NC/SA) | per-image check; useful only for figures, not as simulation baselines |
| **Own-work synthetic/schematic art** (RAD-LAB) | CC0 by owner decision | zero licence risk; must be labelled schematic, not diagnostic |
| Excluded by policy | MIMIC-CXR / CheXpert (credentialed or research-agreement); Radiopaedia (CC BY-NC-SA); any NC/SA/request-access set | listed so nobody re-proposes them |

## 2. CT

### Authoritative sources (to verify)
- **AAPM** — Report 96 *The Measurement, Reporting, and Management of Radiation Dose in CT* (CTDIvol, DLP concepts); Report 204 *Size-Specific Dose Estimates (SSDE)* and Report 220 follow-up; AAPM Adult/Pediatric Routine CT Protocol resources (protocol *examples* — class vendor/local-dependent); AAPM TG-233/CT image-quality reports (to verify numbers).
- **IEC** — IEC 60601-2-44 (CT equipment particular requirements; dose-index *concepts*, display of CTDIvol/DLP). Concepts only.
- **IAEA** — IAEA Human Health Series on CT quality/dose (e.g. *Quality Assurance Programme for CT*, to verify number); IAEA TRS-457 *Dosimetry in Diagnostic Radiology: An International Code of Practice* (CT dosimetry); RPOP CT pages; *Diagnostic Radiology Physics* handbook CT chapters.
- **ACR** — CT Accreditation Program requirements (image quality/dose items); ACR–AAPM Technical Standard for Diagnostic Medical Physics Performance Monitoring of CT; ACR Appropriateness Criteria; ACR Manual on Contrast Media (contrast workflow; Learn/Reference).
- **WHO** — WHO guidance on radiation protection in medical imaging (general); to verify CT-specific items.
- **PubMed** — search plan: `"tomography, x-ray computed"[MeSH] AND ("radiation dosage"[MeSH] AND "diagnostic reference levels")`; window width/level educational reviews; slice thickness/kernel/noise relationship reviews.

### Candidate openly licensed data (to verify)
| Candidate | Licence as stated at source (recalled) | Notes |
|---|---|---|
| **TotalSegmentator CT dataset** (Zenodo) | CC BY 4.0 (recalled) | many full-body CTs with labels; check de-identification statement, size (tens of GB: use derived downsampled slices only) |
| **The Cancer Imaging Archive (TCIA)** collections | **per collection**: many CC BY 4.0 / CC BY 3.0, some CC BY-NC, some restricted | choose a collection explicitly licensed CC BY; never assume the site-wide statement |
| **LIDC-IDRI** (via TCIA) | CC BY 3.0 (recalled) | chest CT with nodules → pathology; avoid for Learn unless pathology teaching is in scope and reviewed |
| **CT-ORG / AMOS / FLARE-type** organ datasets | licences vary (CC BY / CC BY-SA) | check each; SA excluded |
| Medical Segmentation Decathlon | CC BY-SA 4.0 (recalled) | **excluded** (SA) |
| Wikimedia Commons CT slices | per file | small, per-file, good for Reference figures |
| **Mathematical phantoms** (Shepp–Logan and similar; own implementation) | no licence issue (own code/work) | ideal for the CT Simulate sandbox (windowing, noise, kernel as labelled approximations) |

## 3. MRI

### Authoritative sources (to verify)
- **ACR** — *ACR Manual on MR Safety* (current edition; the primary authority for zones, screening, implants, contrast-related MR items) and ACR Manual on Contrast Media; ACR MRI Accreditation Program requirements.
- **IEC** — IEC 60601-2-33 (MR equipment: static field, gradient dB/dt, SAR operating modes). Concepts only.
- **AAPM** — Report 100 *Acceptance Testing and Quality Assurance Procedures for MRI Facilities*; AAPM MR-related TG reports (to verify numbers).
- **IAEA** — *Diagnostic Radiology Physics* handbook MRI chapter; IAEA Human Health Series items on MRI safety/QA (to verify).
- **WHO** — WHO Manual of Diagnostic Imaging (MRI volume if applicable; to verify); WHO/ICNIRP-related static-field health criteria (concept; to verify).
- **PubMed** — start from the ACR guidance on MR safe practice (Kanal E et al., J Magn Reson Imaging 2013 — recalled; verify citation) and review articles on MR safety (implants, zones, SAR, projectile risk); sequence-basics educational reviews (`"magnetic resonance imaging"[MeSH] AND (education OR "image quality")`).

### Candidate openly licensed data (to verify)
| Candidate | Licence as stated at source (recalled) | Notes |
|---|---|---|
| **OpenNeuro** datasets | most are CC0 (OpenNeuro asks for CC0/PDDL-style licence; **check each dataset's `LICENSE`**) | brain MRI mostly; check defacing (face removed) and multi-sequence availability |
| **BrainWeb** simulated brain database (McGill) | free for research; redistribution terms **to verify** | simulated T1/T2/PD with known ground truth; would be a good "not a real patient" source if terms allow |
| **IXI dataset** | CC BY-SA 3.0 (recalled) | **excluded** (SA) |
| **TCIA MRI collections** | per collection | as CT |
| fastMRI, Human Connectome Project, UK Biobank, ADNI | data-use agreements / credentialed access | **excluded** (request-access) |
| Wikimedia Commons MRI images | per file | small Reference figures |
| **Own-work schematic sequence diagrams / parametric phantoms** | CC0 by owner decision | safest for Learn (what TR/TE/TI do, T1/T2 contrast) |

## 4. Ultrasound

### Authoritative sources (to verify)
- **ACR** — ACR–AIUM–SPR–SRU Practice Parameter(s) for the performance of ultrasound examinations (general and per organ); ACR Ultrasound Accreditation Program requirements.
- **WHO** — *WHO Manual of Diagnostic Ultrasound* (2nd ed.; technique, probe use, anatomy, basic physics).
- **IEC** — IEC 62359 (thermal/mechanical index determination) and IEC 60601-2-37 (ultrasonic diagnostic equipment safety): concepts of MI/TI and output display. Concepts only.
- **AAPM** — AAPM Ultrasound Task Group reports on QC of real-time B-mode scanners (e.g. TG-1; verify citation: *Real-time B-mode ultrasound quality control test procedures*, Med Phys 1998 — recalled).
- **IAEA** — *Diagnostic Radiology Physics* handbook, ultrasound chapter; IAEA material on point-of-care ultrasound (to verify).
- **PubMed** — search plan: `"ultrasonography"[MeSH] AND (education OR "simulation training")`; probe handling/ergonomics; ALARA/mechanical index reviews.

### Candidate openly licensed data (to verify)
| Candidate | Licence as stated at source (recalled) | Notes |
|---|---|---|
| Wikimedia Commons ultrasound images/clips | per file; CC0 / CC BY acceptable | small, individually verified; check for patient identifiers |
| **CAMUS** (cardiac US, via Creatis) | research-use terms (to verify) | likely **excluded** unless terms allow redistribution |
| **BUSI** breast ultrasound (Dataset in Brief) | stated CC0 on some mirrors (**to verify**: authoritative source differs) | pathology-centred; not for anatomy/technique teaching |
| POCUS / lung-US datasets (various, e.g. Born et al.) | mixed (some NC / research-only) | check each |
| **Self-recorded phantom sweeps** (an educational phantom, no patient involved) | CC0 by owner decision | best path for *probe-pose → frame* look-up (Simulate/Practice) |
| **Synthetic B-mode images** (own, labelled synthetic) | CC0 by owner decision | speckle-textured schematic only; must not be called diagnostic |

## 5. Using this list
1. A session that wants to use a source first reads it in full and updates its row to **Read** (as Session 5 did for Chung/Fuller), writes the modality's reference document, and only then authors rules.
2. A session that wants an image first verifies the licence at the source (Commons: API `extmetadata` + SHA-1, as for A-001), checks the de-identification/metadata, then registers it in `ASSET_PROVENANCE_AND_LICENSES.md` **in the same commit**.
3. Anything not meeting §0 policy stays excluded here, with the reason, so it is not re-proposed.
