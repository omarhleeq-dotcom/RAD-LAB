# Proposed roadmap — Sessions 7+

**Status: proposal for the owner; nothing started.** Rationale and design: [`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md); decisions: [`adr/`](adr/README.md); sources/imagery candidates: [`MODALITY_SOURCES_CANDIDATES.md`](MODALITY_SOURCES_CANDIDATES.md). Order follows the owner's brief; it deliberately departs from spec §25 (Session 7 = Practice/Assessment) because Assess needs backend/privacy decisions (ADR-0009).

Size scale (rough, one focused cloud session ≈ M): **S** ≈ ½ session · **M** ≈ 1 · **L** ≈ 2 · **XL** ≈ 3+ (may split). Sizes are guesses and exclude owner/expert review time.

## Gate G0 — before Session 7 (non-code, owner)
- Connect the Cloudflare preview (`DEPLOYMENT.md`), enable Zero Trust Access with the reviewers' emails.
- Start educator / medical-physicist review of `REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md` and the Arabic table; decide the **baseline mismatch** (`session-5-baseline-options.md`), the **27 × 31 cm region**, and the **marker rubric** — or consciously carry them as open (they stay labelled provisional either way).
- Decide: Simulate ≠ Practice? shell before or after Lateral? (open decisions 6–7).

## Session 7 — Engine generalisation (refactor, Chest PA unchanged)
- **Scope:** introduce `ExamDefinition` / `CaseDefinition` / `ControlSpec[]` and per-exam scoring categories behind a `compose()` that still yields today's `RadCase`; generalise `SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `RadiographAssetSpec` (optional landmark groups), critical-finding ids to data-declared vocabularies; make the console and the positioning scene generate from data (`ControlSpec`, `SceneSpec`); move code into `modalities/xray/*`. **No new exam, no UI change.**
- **Acceptance:** all 53 scenario goldens (`scripts/qa/golden/matrix.json`), 53 image goldens, the 662+ unit tests, weights 25/20/15/20/10/10, the EN/AR × desktop/tablet/mobile Playwright matrix and axe audit are **identical**; the architecture test still forbids pixel scoring and randomness.
- **Prerequisites:** Session 6 merged; G0 not required.
- **Evidence needs:** none (no new medical content).
- **Asset needs:** none.
- **Risks:** silent behaviour drift (mitigated by goldens); over-abstracting before a second exam exists (mitigate: only generalise what Lateral/AP *needs*; rule of three); store/UI churn.
- **Size:** **L**.

## Session 8 — Platform shell: catalogue, exam hub, mode containers
- **Scope:** `/[locale]/[modality]/[exam]` hub + mode tiles; redirect for `/simulation/[caseId]`; breadcrumb and mode switcher; Learn/Reference *containers* (generic content-block renderer, `LocalizedText` blocks with `SourceRef`, review badges); X-ray Chest PA exposes Practice + a small Learn/Reference seed written from existing reference docs; remove the hard-coded roadmap chips. Static export still works.
- **Prerequisites:** Session 7 (catalogue reads `ExamDefinition`); owner decision on mode set.
- **Evidence:** Learn/Reference text must be derived from the repo's Chest PA reference documents (cited sections) — no new medical claims.
- **Assets:** none new (schematic SVG only, own work).
- **Risks:** link breakage for shared pilot URLs (redirects); i18n key growth; Arabic review backlog.
- **Size:** **M–L**. *(Owner may swap with Session 9; see G0.)*

## Session 9 — Chest Lateral
- **Scope:** write `RAD-LAB_Medical_Reference_Chest_Lateral*.md` first (positioning, technique, image quality — same standard as PA), then `ExamDefinition` + case + baseline + landmarks + scene + scenario matrix + goldens; add only the new effect modules/rule kinds the reference requires.
- **Prerequisites:** Session 7; **marker rubric / convention decision**; unread ACR/AIR sources read; baseline asset sourced.
- **Evidence needs:** lateral-specific positioning, centring, technique and quality criteria from IAEA/WHO/ACR (not recalled from memory); marker convention for lateral.
- **Assets:** a lateral chest radiograph, openly licensed (CC0/CC BY), verified at source, registered (A-006+), landmarks authored; no fabricated image.
- **Risks:** source scarcity for a good lateral baseline (fallback: schematic/phantom, clearly labelled, lowers realism); new superimposition/rotation cues are uncalibrated approximations; sign-off still outstanding.
- **Size:** **L–XL** (reference + asset + QA matrix).

## Session 10 — Chest AP (erect / supine / portable)
- **Scope:** reference document, exam definition, patient-state control, geometry/magnification effect (OID/SID), AP-vs-PA appearance cues, critical findings; reuse the scenario-matrix template.
- **Prerequisites:** Sessions 7 and 9 (second exam proves the vocabulary); portable/ICU context decided (spec §6).
- **Evidence needs:** AP/portable positioning and technique (SID, grid decisions, patient positioning limits) from IAEA/WHO/ACR/PubMed; DI/EI statements via the existing technique reference classes.
- **Assets:** AP chest baseline(s) (erect and/or supine appearance), registered.
- **Risks:** more variants → more matrix scenarios; supine/portable realism claims easy to overstate; projection-specific marker/laterality issues.
- **Size:** **L–XL**.

## Session 11 — More X-ray exams (batch of 2–3, one at a time)
- **Scope:** candidates in priority order from spec §18/§22: abdomen, upper extremity (e.g. hand/wrist), lower extremity (e.g. knee/ankle); each = reference doc + exam definition + case + baseline + matrix. Choose by **available openly licensed baselines and reference sources**, not by clinical importance alone.
- **Prerequisites:** Sessions 7–10 stable; educator input on priority.
- **Evidence needs:** per exam, as above; extremity positioning needs per-view sources.
- **Assets:** one baseline radiograph per view (registered).
- **Risks:** scene art per body part (SVG); effect catalogue growth; review load; do **not** start more than one exam per session.
- **Size:** **M–L per exam**.

## Session 12 — CT: Learn + Reference
- **Scope:** modality entry in the catalogue (status: preview), content only (no engine): what CT is, scan geometry, key parameters, dose concepts (CTDIvol, DLP — definitions), windowing concept, protocol *examples* clearly classed, safety/contrast overview; glossary EN/AR; Reference tables with `SourceRef`s. Static schematic figures (own work).
- **Prerequisites:** Session 8 (content containers); CT sources read (AAPM 96/204, IAEA, ACR) and the CT reference document written.
- **Evidence needs:** dose-metric definitions and units; no numeric reference levels unless sourced and labelled local/provisional.
- **Assets:** schematic SVG only (own); optional Commons figures (verified).
- **Risks:** dose numbers mistaken for clinical limits; Arabic CT terminology; scope creep into image reading.
- **Size:** **M–L**.

## Session 13 — CT: simple simulation (CTDIvol / DLP + windowing)
- **Scope:** `ModalityModule` for CT: choose scan range on a localiser, kV / mA / pitch / collimation / slice thickness / kernel (limited set), compute **CTDIvol and DLP from formulas/definitions with a documented educational scanner model**, window/level viewer on a small pre-built volume; Simulate (sandbox) first, Practice only if rules are sourced.
- **Prerequisites:** Session 12; volume asset decision (ADR-0007: manifest, bucket or small downsampled set); owner approval of synthetic-phantom-first.
- **Evidence needs:** CTDIvol/DLP definitions (AAPM 96 / IEC concept), relationships to pitch/mAs as `educational-simplification`; any reference-level comparison provisional.
- **Assets:** a small CT volume — **own phantom (CC0)** preferred, or an openly licensed de-identified series (verified, registered, ≤ budget).
- **Risks:** presenting computed dose as a patient-dose estimate (needs prominent "educational model" label); volume size/perf on phones; windowing "correct answers" are protocol/local dependent.
- **Size:** **XL** (may split: dose model; viewer).

## Session 14 — MRI: safety module, then Learn + Reference
- **Scope:** (a) **MRI safety module first** — zones/screening checklist as *Learn/Reference* with a safety gate type designed for later Practice; strictest evidence tier, ACR MR safety manual read in full; (b) MRI Learn/Reference (T1/T2 contrast concepts, sequence parameters TR/TE/TI, coils, artefacts overview), schematic figures.
- **Prerequisites:** Session 8; ACR MR Safety manual (and IEC 60601-2-33 *concepts*) read; educator/physicist reviewer for safety text.
- **Evidence needs:** every safety statement traceable; no implant specifics without sources; visible "not a screening tool" notice.
- **Assets:** schematic only; optional openly licensed MRI figures (verified).
- **Risks:** **highest content risk in the roadmap** (safety read as authoritative); no review capacity → ship nothing rather than provisional safety claims in Practice; Arabic safety wording.
- **Size:** **L** (module) + **M–L** (Learn/Reference).

## Session 15 — Ultrasound: Learn + Reference
- **Scope:** content-only entry: principles (concepts), probes, controls (frequency, depth, gain, focus), scan technique and planes, artefacts overview, MI/TI concepts; schematic figures.
- **Prerequisites:** Session 8; US sources read (ACR-AIUM-SPR-SRU parameter, WHO manual).
- **Evidence needs:** technique criteria per exam from the practice parameter/WHO manual; no thresholds unless sourced.
- **Assets:** schematic SVG (own); optionally licence-clean Commons figures.
- **Risks:** realism expectations ("it's real-time"): set expectations that Simulate (probe pose → frame look-up) is a later, separate session with its own asset plan.
- **Size:** **M**.

## Later (not scheduled; each needs an owner decision first)
- **MRI / US Simulate** (parameter presets → pre-computed series; probe-pose → sweep look-up). Needs asset capture/derivation plan and a performance budget.
- **Assessment mode + instructor tools** — only after ADR-0009 prerequisites: auth, storage/retention, privacy notice, integrity (server-side evaluation), instructor roles, reviewed non-provisional rules. Likely a backend decision session first (**M**, no code) then implementation (**XL**).
- **Pediatric / difficulty-level cases** (spec §6–7) — new `CaseDefinition`s once exams are stable.
- **Authoring tool / JSON import** for instructors (ADR-0004 keeps definitions serialisable).

## Dependency overview
```
G0 (owner review/decisions) ─┐
Session 6 (this PR) → 7 engine → 8 shell ─┬→ 9 Lateral → 10 AP → 11 more X-ray
                                           ├→ 12 CT L/R → 13 CT sim
                                           ├→ 14 MRI safety + L/R
                                           └→ 15 US L/R
                          Assess/backend decision (any time after 8) → Assess (last)
```
Sessions 9–11 and 12–15 are independent once 7–8 exist; run them in the order the owner prefers (default: the order above — X-ray depth before new modalities).

## Per-session ground rules (all sessions)
Read the spec, CLAUDE.md and the previous session doc first; write the reference document before the rules; every medical rule has an evidence class; every external asset is registered in the same commit; no Chest PA behaviour change unless the session says so; `npm run check` + `npm run build` + browser matrix EN/AR at the end; a short decisions-for-owner list in every final report.
