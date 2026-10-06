# Proposed roadmap — Sessions 7+

**Status: Sessions 7 (exam/case split), 8 (D7 demographics) and 9 (shell) done; Session 10 (Chest Lateral and AP references, docs only) delivered as drafts; Session 10b (source library, docs only, S10-4) done as a draft PR (EC16260, WHO-CHEST, STATPEARLS-POS in `docs/sources/`); Sessions 11+ are a proposal for the owner. Order changed by S10-1: Lateral reference (10) → generalisation limited to the Lateral reference's needs (11) → Lateral implementation (12).** Owner decisions D1–D7 are in [`DECISIONS.md`](DECISIONS.md). Rationale and design: [`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md); decisions: [`adr/`](adr/README.md); sources/imagery candidates: [`MODALITY_SOURCES_CANDIDATES.md`](MODALITY_SOURCES_CANDIDATES.md). Order follows the owner's brief; it deliberately departs from spec §25 (Session 7 = Practice/Assessment) because Assess needs backend/privacy decisions (ADR-0009).

Size scale (rough, one focused cloud session ≈ M): **S** ≈ ½ session · **M** ≈ 1 · **L** ≈ 2 · **XL** ≈ 3+ (may split). Sizes are guesses and exclude owner/expert review time.

## Gate G0 — before Session 7 (non-code, owner) — partly resolved in Session 7
- Connect the Cloudflare preview (`DEPLOYMENT.md`), enable Zero Trust Access with the reviewers' emails.
- Start educator / medical-physicist review of `REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md` and the Arabic table; decide the **baseline mismatch** (**decided: D7**, align the case data to the image — Session 8), the **27 × 31 cm region**, and the **marker rubric** — or consciously carry them as open (they stay labelled provisional either way).
- ~~Decide: Simulate ≠ Practice? shell before or after Lateral?~~ **Decided:** D1 one mode (Practice) for now; D2 shell before Lateral. Baseline mismatch **decided: D7** (O1 resolved). Still open: 27 × 31 cm region (O2), marker rubric (O3), unread sources (O4), educator / physicist review incl. Arabic and banner wording (O5).

## Session 7 — Engine generalisation (refactor, Chest PA unchanged) — **DONE in part (exam/case split); the rest deferred**

> **Delivered (PR for branch `ccr-d6617413-5q6htb`):** `ExamDefinition` / `CaseDefinition` + `composeCase()` + validators + Chest PA split into exam and case data + registries, proved byte-identical by `scripts/qa/characterisation/` and the goldens. **Deferred by the Session 7 prompt (its scope wins over the bullet list below):** `ControlSpec[]` / generalised `SimulationSettings`, per-exam `CATEGORIES` / `ImageVariantId` / `EffectId` / critical-finding vocabularies, data-driven console and `SceneSpec`, optional `RadiographAssetSpec` groups, the `modalities/xray/*` move. They now form Session 11 (a separate zero-behaviour refactor after the shell and after the Lateral reference, S10-1; see its entry for why). Detail: `PLATFORM_ARCHITECTURE.md` §2.4.

- **Scope:** introduce `ExamDefinition` / `CaseDefinition` / `ControlSpec[]` and per-exam scoring categories behind a `compose()` that still yields today's `RadCase`; generalise `SimulationSettings`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `RadiographAssetSpec` (optional landmark groups), critical-finding ids to data-declared vocabularies; make the console and the positioning scene generate from data (`ControlSpec`, `SceneSpec`); move code into `modalities/xray/*`. **No new exam, no UI change.**
- **Acceptance:** all 53 scenario goldens (`scripts/qa/golden/matrix.json`), 53 image goldens, the 662+ unit tests, weights 25/20/15/20/10/10, the EN/AR × desktop/tablet/mobile Playwright matrix and axe audit are **identical**; the architecture test still forbids pixel scoring and randomness.
- **Prerequisites:** Session 6 merged; G0 not required.
- **Evidence needs:** none (no new medical content).
- **Asset needs:** none.
- **Risks:** silent behaviour drift (mitigated by goldens); over-abstracting before a second exam exists (mitigate: only generalise what Lateral/AP *needs*; rule of three); store/UI churn.
- **Size:** **L**.

## Session 8 — Implement D7: align the patient case data to the baseline image (small; demographics only) (**done 2026-10-06** — [`session-8-demographics-alignment.md`](session-8-demographics-alignment.md))
- **Scope:** owner decision **D7** — change the case's age, sex, pronouns, name (none exists) and the Arabic gendered wording to match the baseline image (adult female, about 21); **the image is not changed**. Follow the sequence in [`session-7-demographics-impact.md`](session-7-demographics-impact.md) §3: (1) educator confirms the Arabic wording; (2) text-only commit: neutral Arabic `home.patientLine` (today it uses the masculine "عمره"); (3) text-only commit: `CaseDefinition` patient fields and the case's EN/AR text; (4) only then, and only after review, anything that touches a medical value or scoring (none is expected: no rule, weight or technique value reads age or sex; `attenuation` stays as is unless a *sourced* build value is approved).
- **Acceptance (as executed — the impact note was wrong about the scenarios file, see the Session 8 doc §2):** `golden-image-checksums.json`, the 53 PNG goldens and `matrix.json` stay **byte-identical**; `chest-pa-case.json` (5 leaves) and `chest-pa-scenarios.json` (11 Arabic effect-text leaves) were hand-edited, nothing regenerated wholesale. Originally: only `chest-pa-case.json` is regenerated, in the commit that makes the intentional change, with its diff reviewed and listed in the PR; browser check EN/AR × desktop/tablet/mobile for the patient line wrapping; then update the docs that mention the mismatch (checklist, session-4/5 notes, `PLATFORM_ARCHITECTURE.md` §12).
- **Prerequisites:** Session 7 merged; D7 (done); Arabic educator available for the four strings (otherwise ship the text-only change labelled provisional, like the rest of the Arabic).
- **Evidence needs:** none new (no medical content; do not add sex- or age-specific teaching content).
- **Assets:** none (the image is unchanged).
- **Risks:** Arabic grammar (gender agreement, generic المريض); scope creep into attenuation / protection teaching; accidentally regenerating more than the case snapshot.
- **Size:** **S**.

## Session 9 — Platform shell: catalogue, exam hub, Practice route (D2: before Chest Lateral; after Session 8) — **DONE (PR "Session 9: platform shell (D2)")**
- **Done-state:** routes `/{locale}` (catalogue) → `/{locale}/{modality}` → `/{locale}/{modality}/{exam}` → `/{locale}/{modality}/{exam}/practice[?case=]` (ADR-0011, Option A); modalities/modes from `src/data/modalities.ts`, exams/cases through the existing registries; CT / MRI / Ultrasound listed as "coming soon" (name only); shared shell (skip link, banner on every page incl. the bilingual 404, breadcrumb, language switch that keeps the query, route-change focus); old `/{locale}/simulation/chest-pa-erect` redirects (`_redirects`, `next.config` redirects, client stub); static deep links; axe 0 on every page. Exam behaviour byte-identical (characterisation + goldens untouched). **Not built (owner scope, D1/D3/D5):** mode switcher, Learn / Reference containers and seed content, Simulate, Assess, any CT/MRI/US content. These remain future work under the original scope below. The generalisation formerly numbered Session 10 is now **Session 11** (S10-1).
- **Original scope (partly superseded by the above):**
- **Scope:** `/[locale]/[modality]/[exam]` hub + mode tiles; redirect for `/simulation/[caseId]`; breadcrumb and mode switcher; Learn/Reference *containers* (generic content-block renderer, `LocalizedText` blocks with `SourceRef`, review badges); X-ray Chest PA exposes Practice + a small Learn/Reference seed written from existing reference docs; remove the hard-coded roadmap chips. Static export still works.
- **Prerequisites:** Session 7 (done: catalogue reads `ExamDefinition`; the default case keeps the exam id as its public id, so `/simulation/chest-pa-erect` is unchanged until the redirect exists). Mode set decided: D1, one mode (Practice) for now — Learn / Reference are containers.
- **Evidence:** Learn/Reference text must be derived from the repo's Chest PA reference documents (cited sections) — no new medical claims.
- **Assets:** none new (schematic SVG only, own work).
- **Risks:** link breakage for shared pilot URLs (redirects); i18n key growth; Arabic review backlog.
- **Size:** **M–L**. *(D2: the shell comes before Chest Lateral.)*

## Session 10 — Chest Lateral **and Chest AP** references (docs only) — **DONE as drafts (S10-1, S10-2)**
- **Delivered:** the reusable [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md); [`RAD-LAB_Medical_Reference_Chest_AP.md`](RAD-LAB_Medical_Reference_Chest_AP.md) (same template and rules; open owner decisions O8 marker / display convention and O9 set-up variants); the combined [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md) (PA · Lateral · AP, each S7-4 item → needed by which exam / deferred); and [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md): sources read and what each supports; positioning / technique / image-quality tables where every unsourced item is "source needed"; the **marker-convention options** (decision **O6**, not decided); a **"Needs for Session 11"** section (Lateral vs Chest PA: controls, categories, critical findings, variants / effects, scene, landmark groups, case fields, assets) and the S7-4 mapping; proposed Arabic terms in `ARABIC_TERMINOLOGY.md` (pending educator review). No code, data, golden, test or asset changed.
- **Why first (S10-1):** the original Session 10 had to limit the generalisation to "what Chest Lateral needs", and no Lateral reference existed to say what that is (rule of three, `PLATFORM_ARCHITECTURE.md` §2.4). Writing the reference first removes the guesswork.
- **Limit of these drafts:** the authoritative criteria sources (EC EUR 16260, IAEA publications, ACR, WHO chest PDF, StatPearls, AIR / RCR) could not be read in the session (network egress / captcha, not bypassed); each reference lists them with the claim they would support (§1.2). They must be read before Sessions 12–13. **Under S10-2 Session 11 starts only after both references are merged to main with completed §8 "Needs" sections.**
- **Prerequisites:** Session 9. **Evidence / assets:** read-only research; no asset fetched or added. **Size:** **M**.

## Session 10b — Source library (docs only) — inserted before Session 11 by S10-4; later sessions are not renumbered — **DONE as a draft PR**
- **Delivered:** [`sources/REGISTER.md`](sources/REGISTER.md) (3 sources read + every blocked / abstract-only source with status "not obtained") and [`sources/EC16260.md`](sources/EC16260.md), [`sources/WHO-CHEST.md`](sources/WHO-CHEST.md), [`sources/STATPEARLS-POS.md`](sources/STATPEARLS-POS.md). **Read by the owner's advisor (Claude chat) from owner-supplied copies** — the repository session did not fetch or re-read the originals. The Lateral and AP references were updated where these sources support an item (the rest stays "source needed"); `SESSION_11_NEEDS_SUMMARY.md` and O3–O9 got evidence only — **no decision, rubric, value, code or asset changed**. Still unread: ACR, IAEA hosts, AIR / RCR, Fitzgerald 2025 full text, and the abstract-only items (they gate Sessions 12–13, not Session 11). EC16260 has **no AP criteria**.
- **Scope:** create `docs/sources/REGISTER.md` (id, title, publisher, year / edition, licence / terms, commercial-use note, access status, claims supported) and per-source extraction notes `docs/sources/<id>.md` (paraphrased claims with page numbers) for the sources the Lateral / AP references still need (their §1.2 and `SESSION_11_NEEDS_SUMMARY.md` §3). **PDFs are never committed**; the owner attaches PDFs for reading only, limited to the needed pages; future sessions read the notes, not the PDFs. Text is paraphrased and cited (S10-3).
- **Prerequisites:** this PR (Session 10) merged; the owner supplies the needed pages. **Not built in Session 10.**
- **Acceptance:** docs only; every claim in a note has a page number and a paraphrase; the Lateral / AP "source needed" items it resolves are updated in their references' §8 Needs sections; no code, asset or golden changes.
- **Size:** **M**.

## Session 11 — Engine generalisation, part 2 (deferred from Session 7; zero behaviour change again), limited to the Chest Lateral reference's needs
- **Scope:** the items Session 7 left hard-wired (`PLATFORM_ARCHITECTURE.md` §2.4): `ControlSpec[]` replacing the fixed `SimulationSettings` keys, per-exam scoring categories / `ImageVariantId` / `EffectId` / critical-finding vocabularies, a data-driven console and `SceneSpec` for the positioning view, optional `RadiographAssetSpec` landmark groups, the move to `modalities/xray/*`, and migrating consumers off the `RadCase` compat view. Apply the rule of three: generalise **only the rows marked "Needed" in the "Needs for Session 11" / S7-4 mapping of [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md) and the Chest AP reference — combined in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md)** (§8–§9 of each; S10-1, S10-2; the rule of three is met by PA + Lateral + AP for the mechanisms), nothing speculative; everything marked "deferred" there stays deferred (e.g. the `modalities/xray/*` move and migrating consumers off `RadCase`).
- **Why a separate session and not part of the shell (Session 9):** the shell *intentionally changes* visible routes, navigation and page structure, so its browser matrix and screenshots are expected to change; this refactor must change **nothing**, and its proof (the Session 7 characterisation snapshot plus byte-identical goldens, the full matrix and axe) is only meaningful if no intentional change is mixed in. A combined session would make a diff impossible to attribute. Doing it after the shell also means the catalogue and routes already exist when the console and scene become data-driven.
- **Acceptance:** `scripts/qa/characterisation/*` (including `chest-pa-case.json` and the 11 Arabic effect-text leaves of `chest-pa-scenarios.json`, as hand-edited by Session 8) and all goldens byte-identical; unit tests; EN/AR × desktop/tablet/mobile matrix and axe identical; architecture guards unchanged.
- **Prerequisites:** Sessions 7, 8, 9, 10 and 10b — both references merged to main with completed "Needs" sections (S10-2) — **status: Sessions 7–10 merged; 10b is this draft PR (met when merged); the §8 sections are complete and were only refined by 10b**; owner decision O9 if a patient-state control is wanted. **Evidence / assets:** none. **Risks:** over-abstraction (mitigated by the rule of three); store / UI churn; the console and scene are the most visible code, so keep the matrix as the judge.
- **Size:** **L**.
## Session 12 — Chest Lateral (implementation)
- **Scope:** *(reference moved to Session 10 by S10-1.)* First complete [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md) — every "source needed" item resolved from a primary source read in full — then `ExamDefinition` + case + baseline + landmarks + scene + scenario matrix + goldens; add only the new effect modules/rule kinds the reference requires.
- **Prerequisites:** Sessions 7–11 (exam/case split, D7 demographics, shell, Lateral reference, generalisation limited to the Lateral reference's needs); **O6 marker convention decided** and **O7** (lateral side(s)); the unread sources of the reference §1.2 (EUR 16260, ACR, WHO chest manual, StatPearls, IAEA) read; baseline asset sourced.
- **Evidence needs:** lateral-specific positioning, centring, technique and quality criteria from IAEA/WHO/ACR (not recalled from memory); marker convention for lateral.
- **Assets:** a lateral chest radiograph, openly licensed (CC0/CC BY), verified at source, registered (A-006+), landmarks authored; no fabricated image.
- **Risks:** source scarcity for a good lateral baseline (fallback: schematic/phantom, clearly labelled, lowers realism); new superimposition/rotation cues are uncalibrated approximations; sign-off still outstanding.
- **Size:** **L–XL** (reference + asset + QA matrix).

## Session 13 — Chest AP (erect / supine / portable) (implementation)
- **Scope:** *(reference moved to Session 10 by S10-2: [`RAD-LAB_Medical_Reference_Chest_AP.md`](RAD-LAB_Medical_Reference_Chest_AP.md), a draft whose "source needed" items must be resolved first)* exam definition, patient-state control (if O9 decides so), geometry/magnification effect (OID/SID), AP-vs-PA appearance cues, critical findings; reuse the scenario-matrix template.
- **Prerequisites:** Sessions 7–12; the AP reference merged with a completed "Needs" section and its blocked sources read (S10-2); **O8** marker / display convention and **O9** set-up variants decided; portable/ICU context decided (spec §6 — not recorded in `DECISIONS.md`).
- **Evidence needs:** AP/portable positioning and technique (SID, grid decisions, patient positioning limits) from IAEA/WHO/ACR/PubMed; DI/EI statements via the existing technique reference classes.
- **Assets:** AP chest baseline(s) (erect and/or supine appearance), registered.
- **Risks:** more variants → more matrix scenarios; supine/portable realism claims easy to overstate; projection-specific marker/laterality issues.
- **Size:** **L–XL**.

## Session 14 — More X-ray exams (batch of 2–3, one at a time)
- **Scope:** candidates in priority order from spec §18/§22: abdomen, upper extremity (e.g. hand/wrist), lower extremity (e.g. knee/ankle); each = reference doc + exam definition + case + baseline + matrix. Choose by **available openly licensed baselines and reference sources**, not by clinical importance alone.
- **Prerequisites:** Sessions 7–13 stable; educator input on priority.
- **Evidence needs:** per exam, as above; extremity positioning needs per-view sources.
- **Assets:** one baseline radiograph per view (registered).
- **Risks:** scene art per body part (SVG); effect catalogue growth; review load; do **not** start more than one exam per session.
- **Size:** **M–L per exam**.

## Session 15 — CT: Learn + Reference
- **Scope:** *(S9-4: Learn / Reference containers are built when first needed, at the latest here.)* modality entry in the catalogue (status: preview), content only (no engine): what CT is, scan geometry, key parameters, dose concepts (CTDIvol, DLP — definitions), windowing concept, protocol *examples* clearly classed, safety/contrast overview; glossary EN/AR; Reference tables with `SourceRef`s. Static schematic figures (own work).
- **Prerequisites:** Session 9 (content containers); CT sources read (AAPM 96/204, IAEA, ACR) and the CT reference document written.
- **Evidence needs:** dose-metric definitions and units; no numeric reference levels unless sourced and labelled local/provisional. **D4:** definitions (CTDIvol, DLP) first; a numeric reference level only with a cited published source and its country or region.
- **Assets:** schematic SVG only (own), labelled "schematic / synthetic - not a patient image" in EN and AR (**D5**); optional Commons figures (verified).
- **Risks:** dose numbers mistaken for clinical limits; Arabic CT terminology; scope creep into image reading.
- **Size:** **M–L**.

## Session 16 — CT: simple simulation (CTDIvol / DLP + windowing)
- **Scope:** `ModalityModule` for CT: choose scan range on a localiser, kV / mA / pitch / collimation / slice thickness / kernel (limited set), compute **CTDIvol and DLP from formulas/definitions with a documented educational scanner model**, window/level viewer on a small pre-built volume; Simulate (sandbox) first, Practice only if rules are sourced.
- **Prerequisites:** Session 15; volume asset decision (ADR-0007: manifest, bucket or small downsampled set); owner approval of synthetic-phantom-first.
- **Evidence needs:** CTDIvol/DLP definitions (AAPM 96 / IEC concept), relationships to pitch/mAs as `educational-simplification`; any reference-level comparison provisional.
- **Assets:** a small CT volume — **own phantom (CC0)** preferred, or an openly licensed de-identified series (verified, registered, ≤ budget).
- **Risks:** presenting computed dose as a patient-dose estimate (needs prominent "educational model" label); volume size/perf on phones; windowing "correct answers" are protocol/local dependent.
- **Size:** **XL** (may split: dose model; viewer).

## Session 17 — MRI: safety module, then Learn + Reference
- **Scope:** (a) **MRI safety module first** — zones/screening checklist as *Learn/Reference* with a safety gate type designed for later Practice; strictest evidence tier, ACR MR safety manual read in full; (b) MRI Learn/Reference (T1/T2 contrast concepts, sequence parameters TR/TE/TI, coils, artefacts overview), schematic figures.
- **Prerequisites:** Session 9; ACR MR Safety manual (and IEC 60601-2-33 *concepts*) read; educator/physicist reviewer for safety text.
- **Evidence needs:** every safety statement traceable; no implant specifics without sources; visible "not a screening tool" notice.
- **Assets:** schematic only; optional openly licensed MRI figures (verified).
- **Risks:** **highest content risk in the roadmap** (safety read as authoritative); no review capacity → ship nothing rather than provisional safety claims in Practice; Arabic safety wording.
- **Size:** **L** (module) + **M–L** (Learn/Reference).

## Session 18 — Ultrasound: Learn + Reference
- **Scope:** content-only entry: principles (concepts), probes, controls (frequency, depth, gain, focus), scan technique and planes, artefacts overview, MI/TI concepts; schematic figures.
- **Prerequisites:** Session 9; US sources read (ACR-AIUM-SPR-SRU parameter, WHO manual).
- **Evidence needs:** technique criteria per exam from the practice parameter/WHO manual; no thresholds unless sourced.
- **Assets:** schematic SVG (own); optionally licence-clean Commons figures.
- **Risks:** realism expectations ("it's real-time"): set expectations that Simulate (probe pose → frame look-up) is a later, separate session with its own asset plan.
- **Size:** **M**.

## Later (not scheduled; each needs an owner decision first)
- **MRI / US Simulate** (parameter presets → pre-computed series; probe-pose → sweep look-up). Needs asset capture/derivation plan and a performance budget.
- **Assessment mode + instructor tools** — **D3: the last item of the roadmap.** Only after ADR-0009 prerequisites: auth, storage/retention, privacy notice, integrity (server-side evaluation), instructor roles, reviewed non-provisional rules. Likely a backend decision session first (**M**, no code) then implementation (**XL**).
- **Pediatric / difficulty-level cases** (spec §6–7) — new `CaseDefinition`s once exams are stable.
- **Authoring tool / JSON import** for instructors (ADR-0004 keeps definitions serialisable).

## Dependency overview
```
G0 (owner review/decisions) ─┐
Session 6 → 7 exam/case split → 8 D7 demographics → 9 shell → 10 Lateral reference (docs) → 11 generalisation ─┬→ 12 Lateral → 13 AP → 14 more X-ray
                                                                                  ├→ 15 CT L/R → 16 CT sim
                                                                                  ├→ 17 MRI safety + L/R
                                                                                  └→ 18 US L/R
                          Assess/backend decision (any time after 9) → Assess (last, D3)
```
Sessions 12–14 and 15–18 are independent once 7–11 exist; run them in the order the owner prefers (default: the order above — X-ray depth before new modalities).

## Per-session ground rules (all sessions)
**Reference first (S10-2):** no generalisation or implementation session for an exam / modality starts until its reference document is merged to main and has a completed "Needs" section (template: [`templates/EXAM_REFERENCE_TEMPLATE.md`](templates/EXAM_REFERENCE_TEMPLATE.md)); references run at least one step ahead of code; generalise only against concrete needs from merged references (rule of three), never against placeholders. Source rules: authoritative only; abstract-only sources are marked and may not be the sole support for a value, rule, critical finding or convention; PMC full text only through NCBI E-utilities; no captcha bypass or unofficial mirrors; blocked sources are listed as open items next to O4 with the claim each would support.

Read the spec, CLAUDE.md and the previous session doc first; write the reference document before the rules; every medical rule has an evidence class; every external asset is registered in the same commit; no Chest PA behaviour change unless the session says so; `npm run check` + `npm run build` + browser matrix EN/AR at the end; a short decisions-for-owner list in every final report.
