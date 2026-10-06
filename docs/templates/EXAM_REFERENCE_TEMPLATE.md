# TEMPLATE — Exam reference document (copy to `docs/RAD-LAB_Medical_Reference_<Exam>.md`)

> Derived from the structure of the Chest PA references (`RAD-LAB_Medical_Reference_Chest_PA.md`, `_Technique.md`, `_Image_Quality.md`): source hierarchy → positioning → technique → image quality / result effects → sources → development rules. This template adds what the platform needs from a reference *before* any code exists: a per-claim source table, a **Needs** section (what the exam needs that Chest PA does not already have) and the generalisation mapping.
>
> **Standing rule (S10-2, "Reference first"):** no generalisation or implementation session for an exam may start until its reference is **merged to main** and its **§8 Needs section is complete** (every row marked, every "unknown" tied to a named missing source). References run at least one step ahead of code. Generalisation is done only against concrete needs from merged references — never against placeholders.
>
> Delete this box and the guidance in *italics* when copying.

# RAD-LAB — Medical Reference: <Exam name> (<population, position, detector technology>)

**Purpose / Scope / Use / Status** — *one line each. Scope states population (adult / paediatric), position, projection, detector type. Status is DRAFT until an educator has reviewed (O5); say so.*

## 0. Honest summary of the evidence
*3–5 bullets: what was read in full, what was only an abstract, what was blocked, therefore which rule families are "source needed". If a whole family (positioning, technique, quality) has no read source, say it here.*

## 1. Sources
Source rules (all references): authoritative / peer-reviewed only (IAEA, WHO, AAPM, ACR, ICRP, IEC *concepts*, PubMed-indexed literature, EC / professional-society guidelines); no blogs, forums, commercial charts, textbooks-as-authority, Radiopaedia, search-engine snippets. Full text of open-access PMC articles may be retrieved only through the official NCBI E-utilities (`efetch`). **Never** bypass a captcha; never use mirrors, caches or other unofficial routes for a blocked site. No text copied beyond short quotes. Do not add a candidate source to the repository unless it was actually read and cited.

### 1.1 Sources read
| # | Citation (authors, year, journal / publisher, vol:pages, DOI, PMID / PMCID) | Access status | What it supports (and only this) | May it be the *sole* support for a technique value, scoring rule, critical finding or convention? |
|---|---|---|---|---|
| R1 | | **full text checked** · **abstract only — full text not checked** · | | *Full text: only if it states the rule itself. Abstract only: **never** — such items stay "source needed" unless a full-text source supports them.* |

### 1.2 Sources not read (blocked / paywalled / not retrievable)
| Source | Claim it would support | Why not read | Open item |
|---|---|---|---|
| | | *egress blocked · captcha (not bypassed) · paywall · not found* | *list in the final report next to O4* |

### 1.3 Unverified leads (NOT evidence)
*Statements seen only in search-result summaries or secondary pages. Never implemented, scored or shown to a learner on this basis. Each names where it would matter.*

## 2. Classification
*Reuse the five evidence classes of `EVIDENCE_CLASSES` (`validated`, `common-reference`, `vendor-protocol-dependent`, `educational-simplification`, `provisional`). "source needed" = no class can be assigned; the item is not implemented, or only as `provisional` with a TODO.*

## 3. Positioning
| Topic | What this reference can state (cite R#) | Class / status |
|---|---|---|
*Rows (as Chest PA §2–§3): patient orientation / state; head, shoulders, arms; rotation / alignment; centring point and level; central-ray direction; SID; respiration; collimation / required anatomy; marker.*

## 4. Technique (digital radiography)
| Topic | What can be stated (cite R#) | Class / status |
|---|---|---|
*Rows (as Chest PA Technique): kVp, mAs, AEC and chamber layout, grid, exposure time / motion, exposure index (never brightness; no invented EI / EIT / DI numbers), patient size / habitus, dose optimisation.*

## 5. Conventions and open owner decisions
*Marker / laterality / display orientation, and any other convention. Present **options with their sources**; **do not decide**. Each becomes an O-number in `DECISIONS.md`. Mark pure derivations as "derivation, not a medical claim".*

## 6. Image quality and result rendering
| Criterion / effect | Statement (cite R#) | Class / status |
|---|---|---|
*Rows: each quality criterion; each effect the renderer would need; an explicit "do NOT implement as clinical truth" list (start from the Chest PA list).*

## 7. Arabic terms (proposed)
*Added to `docs/ARABIC_TERMINOLOGY.md` under a dated heading, marked **pending educator review**; never changes an existing UI string.*

## 8. Needs (for the generalisation session)
Compare the exam with **Chest PA as implemented today** (`SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `CriticalFindingId`, `RadiographAssetSpec`, scene `chest-pa-frontal`). Every row carries exactly one mark:

- **same** as PA · **differs** (say how) · **new** · **unknown — source needed** (name the missing source from §1.2)

### 8.1 Controls (what the student sets)
| Item (PA today) | This exam | Mark | Note / missing source |
|---|---|---|---|
### 8.2 Scoring categories
| PA | This exam | Mark | Note |
|---|---|---|---|
### 8.3 Critical findings
| PA | This exam | Mark | Note |
|---|---|---|---|
### 8.4 Image variants / effects
| PA | This exam | Mark | Note |
|---|---|---|---|
### 8.5 Positioning scene
| PA | This exam | Mark | Note |
|---|---|---|---|
### 8.6 Landmark groups (`RadiographAssetSpec`)
| PA field | This exam | Mark | Note |
|---|---|---|---|
### 8.7 Case fields (`CaseDefinition`)
| Field | This exam | Mark | Note |
|---|---|---|---|
### 8.8 Assets (licence-verified only; **none fetched or added** in a reference session)
| Asset | Status (open / sourced + registry id) |
|---|---|

## 9. Generalisation (S7-4) mapping
| S7-4 item | Needed by this exam? why | Or: not needed → deferred |
|---|---|---|
| `SimulationSettings` / `ControlSpec[]` | | |
| `CATEGORIES` / `CategoryId` | | |
| `ImageVariantId` / `EffectId` | | |
| `CriticalFindingId` + `isPresent` | | |
| Console JSX | | |
| Positioning scene art | | |
| `RadiographAssetSpec` landmark groups | | |
| Move to `modalities/xray/*` | | |
| Migrating consumers off `RadCase` | | |

*Rule of three: prefer generalising only what two or more exams (PA counts) need; list items needed by one exam only as "needed by <exam>" and say why generalising them now is, or is not, justified.*

## 10. Open owner decisions and open items
*O-numbers added to `DECISIONS.md`; blocked sources listed with the claim each would support (also copied to the session report next to O4); remaining "source needed" items.*

## 11. Development rules (carry from Chest PA §8)
Do not invent values; record the source of every medical rule; separate validated rule / educational simplification / provisional value; if sources disagree, document it and keep the rule configurable.
