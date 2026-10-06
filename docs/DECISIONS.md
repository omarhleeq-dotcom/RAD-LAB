# RAD-LAB — decisions log

Owner-approved decisions (D1–D7), the decisions that are still open (O2–O5; O1 was resolved by D7), and the implementation choices a session made on its own authority that the owner may overrule (S7-x). Architecture-level records live in [`adr/`](adr/README.md); this file is the short, dated list of *what was decided and by whom*, so later sessions do not re-open them.

Recorded in Session 7 (2026-10-06). The wording of D1–D6 follows the owner's instruction for that session; D7 was added on 2026-10-06 in a docs-only follow-up on the same PR.

## Owner-approved decisions

| ID | Decision | Effect on the work |
|---|---|---|
| **D1** | **Keep ONE mode (Practice) for now.** Split *Simulate* from *Practice* only if a no-hints, timed or exam-like variant is needed. | The platform stays at Practice for Chest PA; the five-mode hierarchy of ADR-0003 is a target, not a commitment. Resolves `PLATFORM_ARCHITECTURE.md` §12 item 6. |
| **D2** | **Build the platform shell BEFORE Chest Lateral.** | The shell (catalogue, exam hub, mode containers) is **Session 9**, before Chest Lateral (**Session 11**); Session 8 is D7 and Session 10 is the deferred engine generalisation (renumbered after D7 was approved). Resolves §12 item 7. |
| **D3** | **Assess mode is deferred to the end of the roadmap** (sign-in, attempt storage, retention and privacy, server scoring). | No accounts, storage or server scoring until then; engines stay pure and serialisable (ADR-0008, ADR-0009). Resolves §12 item 9. |
| **D4** | **CT dose: teach definitions (CTDIvol, DLP) first; numeric reference levels only with a cited published source and its country or region.** | Applies to the CT sessions (14–15). Resolves §12 item 10. |
| **D5** | **First CT / MRI / US imagery: own-work schematics and synthetic phantoms, always labelled "schematic / synthetic - not a patient image" in EN and AR.** Schematics are clear, not photorealistic, by design. Realistic images only later, from verified open licences, for Simulate / Practice. | The label is mandatory wherever such an image appears. Resolves §12 item 11 for the first imagery. |
| **D6** | **Hosting: Cloudflare Pages project `rad-lab`, deployed by GitHub Actions; the repo stays private; the site must not be shared before the Zero Trust email restriction is enabled; never paste tokens or secrets.** | See [`DEPLOYMENT.md`](DEPLOYMENT.md). Partly resolves §12 item 8 (hosting beyond the pilot, custom domain and preview audience are still open). |
| **D7** | **Baseline demographic mismatch: ALIGN the patient case data (age, sex, pronouns, name, etc.) to the baseline image (adult female, about 21). The image is NOT changed.** Approved by the owner on 2026-10-06. Execute in **Session 8**, following the safe sequence in [`session-7-demographics-impact.md`](session-7-demographics-impact.md): text-only changes first (including the Arabic `home.patientLine` template that uses masculine "عمره"), then anything touching medical values or scoring only after review. Goldens / snapshots are regenerated only where the change is intentional and listed. | Resolves O1. **IMPLEMENTED in Session 8 (2026-10-06, branch `session-8-demographics`, draft PR — see [`session-8-demographics-alignment.md`](session-8-demographics-alignment.md)):** case = adult female, 21; Arabic made sex-aware; no scoring / technique change (proved). Session 7 had only analysed the impact. The owner is also asked not to expect any scoring change from D7 — no rule, weight or technique value reads age or sex. |

## Open decisions

None of these blocks Sessions 8–9. Until decided, each stays labelled provisional in the product.

| ID | Open decision | State / recommendation | Where |
|---|---|---|---|
| ~~**O1**~~ | ~~**Baseline demographic mismatch**: the baseline radiograph is a 21-year-old woman (A-001); the case patient is a 45-year-old man.~~ | **RESOLVED by D7 (2026-10-06):** align the case data to the image (adult female, about 21); the image is not changed. Executed in Session 8; impact and safe order: [`session-7-demographics-impact.md`](session-7-demographics-impact.md). | `session-5-baseline-options.md` |
| **O2** | **Provisional 27 × 31 cm required region** (and the ≈ 1.5 cm strips between it and the baseline's landmark box). | Keep the labelled demo region, adopt a baseline matching it, or measure on a validated baseline. | `session-5-qa.md` §0.2; checklist §A |
| **O3** | **Marker rubric**: an educator defines presence / side / in-field / weight, and the viewer-side convention. | Marker stays unscored (weight 0); a wrong-side marker is a critical finding. Chung 2020 and Fuller 2016 give no rule. Needed before Lateral / AP because the convention differs per projection. | `session-5-qa.md` §0.1 |
| **O4** | **Unread sources**: the ACR digital-radiography / chest practice parameters and the Australian Institute of Radiography professional-practice guideline (cited by Barry et al.). | To be read before the marker rubric and before the Lateral / AP reference documents. | `session-5-qa.md` §0.1 |
| **O5** | **Educator and medical-physicist review** of everything in `REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md`, **including the Arabic text and the wording of the preview banner**. | No Chest PA value or Arabic string is validated. Arabic is machine-assisted until an educator signs it off. | checklist A–G; `ARABIC_TERMINOLOGY.md` |

## Session 7 implementation choices (made without the owner; the owner may overrule)

| ID | Choice | Why |
|---|---|---|
| **S7-1** | The **default case of an exam keeps the exam id as its public id** (`chest-pa-erect`); any other case is `<exam id>/<case id>`. | Routes, shared preview links and the render noise seed (derived from the id) stay identical — a requirement of "zero behaviour change". The Session 9 shell may introduce `/{exam}/{mode}?case=…`. **Clarified (Session 9, Option A):** `/{exam}/{mode}` is shorthand for the tail of `/{locale}/{modality}/{exam}/{mode}[?case=…]` (ADR-0011); exam ids stay unique per modality. |
| **S7-2** | `RadCase` is kept as a **compatibility view** composed from `ExamDefinition` + `CaseDefinition`; the engine, renderer, store and UI were not migrated to the two definitions. | Strangler pattern (ADR-0004): migrating consumers is behaviour-neutral but large; each step is cheaper to prove once a second exam exists. |
| **S7-3** | The simulated patient's **attenuation moved to the case** (`CaseDefinition.patientTechnique`); the protocol stays in the exam. | A larger patient is a new case, not a new exam. Value unchanged (1). |
| **S7-4** | **Not generalised** (hard-wired to Chest PA): `SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `CriticalFindingId`, the console JSX, the positioning scene art, the required `RadiographAssetSpec` landmark groups, and the move into `modalities/xray/*`. | Rule of three: no second exam exists to say what the vocabulary needs, and the UI / scene parts cannot be made data-driven without risking visible change. Details: `PLATFORM_ARCHITECTURE.md` §2.4. The Session 7 prompt, not `ROADMAP_SESSIONS.md`, set the scope. |
