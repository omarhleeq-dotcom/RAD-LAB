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
- **Delivered:** [`sources/REGISTER.md`](sources/REGISTER.md) (3 sources read + every blocked / abstract-only source with status "not obtained") and [`sources/EC16260.md`](sources/EC16260.md), [`sources/WHO-CHEST.md`](sources/WHO-CHEST.md), [`sources/STATPEARLS-POS.md`](sources/STATPEARLS-POS.md). **Read by the owner's advisor (Claude chat) from owner-supplied copies** — the repository session did not fetch or re-read the originals. The Lateral and AP references were updated where these sources support an item (the rest stays "source needed"); `SESSION_11_NEEDS_SUMMARY.md` and O3–O9 got evidence only — **no decision, rubric, value, code or asset changed**. **Follow-up (same PR):** ACR-CHEST and ACR-PORTABLE notes added; WHO-TECH read and registered (delta); S10b-1 and the PA marker-presence scoring of S10b-8 are implemented in one "PA scoring update" session after physicist review (not Session 11); provisional owner decisions S10b-1…26 (BONTRAGER-9 governing authority S10b-25; O6 / O8 / O11 closed) recorded in `DECISIONS.md` (docs only); [`REVIEW_PACKAGE.md`](REVIEW_PACKAGE.md) created. Still unread: the ACR digital-radiography parameter, IAEA hosts, AIR / RCR, Fitzgerald 2025 full text, and the abstract-only items (they gate Sessions 12–13, not Session 11). EC16260 has **no AP criteria**.
- **Scope:** create `docs/sources/REGISTER.md` (id, title, publisher, year / edition, licence / terms, commercial-use note, access status, claims supported) and per-source extraction notes `docs/sources/<id>.md` (paraphrased claims with page numbers) for the sources the Lateral / AP references still need (their §1.2 and `SESSION_11_NEEDS_SUMMARY.md` §3). **PDFs are never committed**; the owner attaches PDFs for reading only, limited to the needed pages; future sessions read the notes, not the PDFs. Text is paraphrased and cited (S10-3).
- **Prerequisites:** this PR (Session 10) merged; the owner supplies the needed pages. **Not built in Session 10.**
- **Acceptance:** docs only; every claim in a note has a page number and a paraphrase; the Lateral / AP "source needed" items it resolves are updated in their references' §8 Needs sections; no code, asset or golden changes.
- **Size:** **M**.

## Session 11b — PA scoring update (behaviour change, Chest PA only) — **PARTLY DONE as a draft PR**
- **Delivered:** S10b-1 kV (already matched the engine; pinned by tests), S10b-26 SID (full credit 180–185, reference 183), PA marker presence (`missing-marker` critical finding mirroring wrong-side). **Then (S11c):** convention fixed (S11c-1) and S10b-3 rotation-direction feedback delivered (S11c-2); O12 closed. Records: `DECISIONS.md` S11b-1, O12.

## Session 11 — Engine generalisation, part 2 (deferred from Session 7; zero behaviour change again), limited to the Chest Lateral reference's needs
- **Status (2026-10-06): implemented as a draft PR** — mechanisms only, Chest PA byte-identical; see [`session-11-generalisation.md`](session-11-generalisation.md). Decisions S11-1 … S11-4 in `DECISIONS.md`.
- **Scope:** the items Session 7 left hard-wired (`PLATFORM_ARCHITECTURE.md` §2.4): `ControlSpec[]` replacing the fixed `SimulationSettings` keys, per-exam scoring categories / `ImageVariantId` / `EffectId` / critical-finding vocabularies, a data-driven console and `SceneSpec` for the positioning view, optional `RadiographAssetSpec` landmark groups, the move to `modalities/xray/*`, and migrating consumers off the `RadCase` compat view. Apply the rule of three: generalise **only the rows marked "Needed" in the "Needs for Session 11" / S7-4 mapping of [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md) and the Chest AP reference — combined in [`SESSION_11_NEEDS_SUMMARY.md`](SESSION_11_NEEDS_SUMMARY.md)** (§8–§9 of each; S10-1, S10-2; the rule of three is met by PA + Lateral + AP for the mechanisms), nothing speculative; everything marked "deferred" there stays deferred (e.g. the `modalities/xray/*` move and migrating consumers off `RadCase`).
- **Why a separate session and not part of the shell (Session 9):** the shell *intentionally changes* visible routes, navigation and page structure, so its browser matrix and screenshots are expected to change; this refactor must change **nothing**, and its proof (the Session 7 characterisation snapshot plus byte-identical goldens, the full matrix and axe) is only meaningful if no intentional change is mixed in. A combined session would make a diff impossible to attribute. Doing it after the shell also means the catalogue and routes already exist when the console and scene become data-driven.
- **Acceptance:** `scripts/qa/characterisation/*` (including `chest-pa-case.json` and the 11 Arabic effect-text leaves of `chest-pa-scenarios.json`, as hand-edited by Session 8) and all goldens byte-identical; unit tests; EN/AR × desktop/tablet/mobile matrix and axe identical; architecture guards unchanged.
- **Prerequisites:** Sessions 7, 8, 9, 10 and 10b — both references merged to main with completed "Needs" sections (S10-2) — **status: Sessions 7–10 merged; 10b is this draft PR (met when merged); the §8 sections are complete and were only refined by 10b**; owner decision O9 if a patient-state control is wanted. **Evidence / assets:** none. **Risks:** over-abstraction (mitigated by the rule of three); store / UI churn; the console and scene are the most visible code, so keep the matrix as the judge.
- **Size:** **L**.
## Session 12 — Chest Lateral (implementation)
- **First step (S10b-16):** the **commercial-licence audit of all registered assets (O10)**, before any new asset is added.
- **Scope:** *(reference moved to Session 10 by S10-1.)* First complete [`RAD-LAB_Medical_Reference_Chest_Lateral.md`](RAD-LAB_Medical_Reference_Chest_Lateral.md) — every "source needed" item resolved from a primary source read in full — then `ExamDefinition` + case + baseline + landmarks + scene + scenario matrix + goldens; add only the new effect modules/rule kinds the reference requires.
- **Prerequisites:** Sessions 7–11 (exam/case split, D7 demographics, shell, Lateral reference, generalisation limited to the Lateral reference's needs); **O6 marker convention decided** and **O7** (lateral side(s)); the unread sources of the reference §1.2 (EUR 16260, ACR, WHO chest manual, StatPearls, IAEA) read; baseline asset sourced.
- **Evidence needs:** lateral-specific positioning, centring, technique and quality criteria from IAEA/WHO/ACR (not recalled from memory); marker convention for lateral.
- **Assets:** a lateral chest radiograph, openly licensed (CC0/CC BY), verified at source, registered (A-006+), landmarks authored; no fabricated image.
- **Risks:** source scarcity for a good lateral baseline (fallback: schematic/phantom, clearly labelled, lowers realism); new superimposition/rotation cues are uncalibrated approximations; educator / physicist sign-off (O5) is recommended before release or teaching but is not a gate (S10b-20).
- **Size:** **L–XL** (reference + asset + QA matrix).

## Session 13 — Chest AP (erect / supine / portable) (implementation)
- **Starts with the supine portable AP (S10b-12, provisional); semi-erect and erect are added later through the same mechanism.**
- **Scope:** *(reference moved to Session 10 by S10-2: [`RAD-LAB_Medical_Reference_Chest_AP.md`](RAD-LAB_Medical_Reference_Chest_AP.md), a draft whose "source needed" items must be resolved first)* exam definition, patient-state control (if O9 decides so), geometry/magnification effect (OID/SID), AP-vs-PA appearance cues, critical findings; reuse the scenario-matrix template.
- **Prerequisites:** Sessions 7–12; the AP reference merged with a completed "Needs" section and its blocked sources read (S10-2); **O8** marker / display convention and **O9** set-up variants decided; portable/ICU context decided (spec §6 — not recorded in `DECISIONS.md`).
- **Evidence needs:** AP/portable positioning and technique (SID, grid decisions, patient positioning limits) from IAEA/WHO/ACR/PubMed; DI/EI statements via the existing technique reference classes.
- **Assets:** AP chest baseline(s) (erect and/or supine appearance), registered.
- **Risks:** more variants → more matrix scenarios; supine/portable realism claims easy to overstate; projection-specific marker/laterality issues.
- **Size:** **L–XL**.

> **Alignment note (S14-0, 2026-10-07):** the order in force is S12-12 (`DECISIONS.md`): X-ray v1 first (Chest AP → S13b scene design → exam recipe → **S14-0 generalisation for limbs** → limbs → abdomen & pelvis → head → spine → Assess → Release); CT / MRI / US are v2; ribs / sternum are out of v1; limbs = 2 basic projections each. Where the sections below disagree, `DECISIONS.md` and `exam-recipe.md` win. S14-0 delivered: `session-14-limbs-generalisation.md`.

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

## Session 12 status
Delivered: Chest Lateral exam, case, asset (A-006 / A-007), scene, tests and QA — see `docs/session-12-chest-lateral.md` and `DECISIONS.md` S12-1 … S12-11. Open: re-verify A-006 on Commons; educator review (O5); chin / arm overlays; broad-shoulder CR lowering and wheelchair / cart variants.

## Session 14.1 (wrist pilot) — split decided 2026-10-07 (`DECISIONS.md` S14.1-3; DECISIONS wins on conflict)
- **S14.1a — docs only:** [`RAD-LAB_Medical_Reference_Wrist.md`](RAD-LAB_Medical_Reference_Wrist.md) (Wrist PA + Lateral, Bontrager p.156 / 158; Needs section with gaps G1–G10). The Commons image shortlist is outstanding (O25).
- **S14.1b — byte-identical limb generalisation** (reference §9.3): optional chin / shoulder / breathing / lung fields / AEC, open scene id and `bodyPart`, an effect-registry hook, a test-only synthetic limb fixture. Starts after the reference is merged.
- **S14.1c — the two wrist exams** (`wrist-pa`, `wrist-lateral`) under `exam-recipe.md` (reference §9.4); images approved by the owner; owner decisions O21–O24 answered first.
- **S14.1c — delivered (draft PR #23):** `wrist-pa` and `wrist-lateral` (left wrist, CC0 baselines A-010…A-013, fixed-side marker rule, wrist rotation effect, own side-view scene). Open: O27–O31.
- **S14.2b — delivered (draft PR):** `hand-pa` and `hand-lateral` (extension variant, S14.2-6; left hand, owner-attached CC0 baselines A-014…A-017, hand rotation effect kinds, own side-view scene). Open: O39–O41. Elbow reference docs: see `docs/session-14.2b-hand.md` §7 (phase 2).
- **S14.3 — delivered (draft PR):** `elbow-ap` and `elbow-lateral` (left elbow, owner-attached CC0 baselines A-018…A-021, elbow rotation model and effect kinds, own side-view scene). Open: O47–O52. Record: `docs/session-14.3-elbow.md`.
- **S14.4 — delivered (draft PR #29):** `knee-ap`, `knee-lateral`, `foot-ap`, `foot-oblique` (right limbs, owner-attached CC0 baselines A-022…A-029, lower-limb rotation model and three generic limb kinds, tube-angle control, own side-view scene with a tilted tube). Reference first: `docs/RAD-LAB_Medical_Reference_Knee_Foot.md`. Open: O56–O71. Record: `docs/session-14.4-knee-foot.md`.

## Continuation checkpoint — 2026-10-11
- **S14.5 — delivered and merged in PR #31:** `ankle-ap` and `ankle-lateral`, left side inferred, manual technique, baselines A-030…A-033, lower-limb models, scenes, tests, audit and label states. Record: [`session-14.5-ankle.md`](session-14.5-ankle.md); reference: [`RAD-LAB_Medical_Reference_Ankle.md`](RAD-LAB_Medical_Reference_Ankle.md). Open: O75–O80. Verified base on `main`: `41183265d3e94b35cd7a939c61184a6199b29dcb`.
- **Owner-selected continuation:** finish missing limb exams before abdomen/pelvis. Forearm AP + Lateral is explicitly deferred in O37 and is the next proposed candidate, not an approved medical specification. The current repository has no forearm reference or extracted Bontrager forearm claims. Obtain the governing source material and a licence-verified, adequate baseline pair; complete and merge the reference with its Needs section before implementation. Do not infer that all limb exams are complete from the 15 registered exams.
- **Session continuity:** current state and the next-conversation prompt are in [`HANDOFF.md`](HANDOFF.md); the checkpoint report is [`session-continuity-2026-10-11.md`](session-continuity-2026-10-11.md). The Arabic result-feedback formatting defect found during environment setup remains a separate, unapproved coding task.

### Continuation verification — 2026-10-15

- S14.5 remains the last completed exam phase (PR #31, merged). Latest verified `main`: `f19257ebd5cefc8f9ec2320782cb91cfa7e70d88` (PR #32, unified status). The handoff branch was not merged; it now incorporates that main update for a docs-only draft PR.
- No forearm reference or implementation started: governing source and approved images remain unavailable. Next step is source acquisition, then reference + Needs only; O37 remains open (RAD-027). Record: [session-continuity-2026-10-15.md](session-continuity-2026-10-15.md).

### Pelvis AP reference — 2026-10-15 (owner-selected scope change)

- Owner selected pelvis after supplying a candidate image; forearm remains deferred (O37, RAD-027). This explicitly supersedes the earlier next-task suggestion; no additional limb completion is claimed.
- [Pelvis AP reference](RAD-LAB_Medical_Reference_Pelvis_AP.md) + complete Needs assessment written from direct BONTRAGER-9 p.271–272, 279 reading. Draft PR #33, not merged; no exam/generalisation code. O81–O86 await review. Status RAD-028 is review, not done.
- Owner-requested background-only marker removal: original/derivative A-034/A-035 + reproducible pixel script, not served to the product. Clinical suitability remains O84/RAD-029.
- Next: owner review/decisions and reference merge, then scope the next phase; current choice controls may suffice for independent leg position and phase-neutral breath suspension, so no speculative generalisation. [Session record](session-pelvis-ap-reference-2026-10-15.md).

### Pelvis AP implementation — S-PELVIS-1, 2026-10-15 (merged PR #34)

- Reference merged via PR #33 at `f531a660c3a184677bb82807e6e06158a3a48857`; owner then requested the existing exam approach after reviewing rotation on previous images.
- Implemented `pelvis-ap-supine` only: independent pelvic rotation, bilateral leg stance and phase-neutral respiration; manual DR/grid context, anatomical marker; A-036 copy of cleaned A-035, pelvis model reusing existing `limb-warp`, own scene and new guard.
- QA: typecheck/lint (existing O38 warning only), 63 files/1629 tests, production build, EN/AR ×1440/390 browser/axe 84 checks, label/obstacle matrix648 states with no overlaps/out-of-frame labels. Earlier15 composed cases byte-identical; old images/data/hash/golden/characterisation files unchanged. No deployment/merge by agent.
- [PR #34](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/34) merged by owner at `8ba28769a9b870cef9f7cab835af8cafd1b4083a`, RAD-030 done; O5/O81 calibration, O84/O85 suitability/approximation and O86 remain. Record: [session-pelvis-ap-implementation.md](session-pelvis-ap-implementation.md).

### Shoulder reference — S-SHOULDER-REF, 2026-10-15 (merged PR #36; settlement before code in progress)

Owner selected shoulder next. One candidate is described as **AP glenoid/Grashey**, so this phase covers that view only. BONTRAGER-9 printed p.196/PDF216 read directly and visually checked; [reference/complete Needs](RAD-LAB_Medical_Reference_Shoulder_Grashey.md). No code or asset import. Reference merged to main (PR #36). **Settlement before code (docs only):** image identity verified on Commons (SHA-1 matches the API; O87 closed), observations recorded, **erect-only posture**, absolute-angle control with the 35°–45° plateau, arm posture without image effect, and the rotation cue limited to joint-space closure (S-SHOULDER-2-1…7, reference §12). Numbers, detector, marker, rubric still open (O88/O89/O91); RAD-033 waits for the owner to confirm. Source/clinical claims remain provisional O5; no automatic ordinary AP/Y/axillary series. Sessions: [reference](session-shoulder-grashey-reference-2026-10-15.md), [settlement](session-shoulder-grashey-settlement-2026-10-15.md).

### Shoulder scapular Y — S-SHOULDER-Y-REF, 2026-10-15 (reference merged PR #38, no code)

Owner explicitly selected docs/Bontrager work only and suppliedY link. [Reference/complete Needs](RAD-LAB_Medical_Reference_Shoulder_Y.md), printedp.201/PDF221 directly text/visual checked. OfficialY page/API verifyCC0; source says slightly skewed. Attached radiograph/licence are previousGrashey; no asset import/correction. O92–O94 open, clinical reviewO5/O86. GrasheyPR#36/#37 remains merged; no implementation of either shoulder view. Session: [Y reference](session-shoulder-y-reference-2026-10-15.md).

Shoulder Y reference/Needs merged by owner in [PR #38](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/38), commit `5821c4ec31a231529eb230d26f9f7e7b219fb0db`; RAD-034 done as documentation only. RAD-035/O92 and O93/O94 remain; no implementation authorized by the merge.

### Shoulder Grashey implementation — S-SHOULDER-3, 2026-10-15 (merged PR #40)

- Reference merged via PR #36, settlement via PR #37 (`b8d870f`). Implemented `shoulder-grashey-erect` only: erect, 24×30 cm landscape, fixed marker letter R, absolute-angle body turn with the 35°–45° plateau, arm choice without image effect, one joint-space cue through the generic `limb-warp`; A-037/A-038 (CC0, SHA-1 verified).
- Merged by the owner in PR #40 (`e7cbc85`). QA: `npm run check` (66 files / 1644 tests), build, browser/axe 84 checks EN/AR × 1440/390, label matrix 648 states clean; the 16 earlier exams byte-identical. Record: [session-shoulder-grashey-implementation-2026-10-15.md](session-shoulder-grashey-implementation-2026-10-15.md). Open: O95, O96, O88, O89, O91, O5, O86.

### Shoulder Y gates — RAD-036, 2026-10-15 (docs only, stopped before code)

Both gates failed to pass: the candidate image is not settled (burned-in markers, not a clean symmetrical Y, "slightly skewed") and a prototype found no honest single image cue (O94). No `shoulder-y-erect` was built; no asset imported. Options and recommendation (defer unless a clean licensed Y exists) in [reference §12](RAD-LAB_Medical_Reference_Shoulder_Y.md); decisions S-SHOULDER-Y-1…5, open O92 / O94 / O97. Record: [session-shoulder-y-gates-2026-10-15.md](session-shoulder-y-gates-2026-10-15.md). Grashey (RAD-033) merged via PR #40.

**Owner decision (2026-10-15): Shoulder Y deferred; new images and exams frozen** (S-SHOULDER-Y-6). Next work = non-exam aspects of the project, chosen by the owner.

### Asset licence audit — RAD-018, 2026-10-15 (docs only)

Local integrity of all registered assets confirmed; five CC0 masters re-verified at Commons with byte identity, others by page or candidate title (Commons API / downloads rate-limited, stopped). **Release blocker: NIH terms for A-008 unread (O101).** Record: [ASSET_LICENCE_AUDIT_2026-10-15.md](ASSET_LICENCE_AUDIT_2026-10-15.md); open items O100–O102. Release (RAD-023) still waits on the owner's banner decision and the credits-page session.

### Pilot platform slice — plan 2026-10-15 (docs only)

Owner direction: the pilot needs invited accounts (owner invites, e-mail + own password) to evaluate the testers' experience (attempts, usage errors, notes, survey). Plan, alignment with this roadmap and conflicts (CLAUDE.md "no auth / DB", ADR-0002, the same-origin preview rule): [`PILOT_PLATFORM_PLAN.md`](PILOT_PLATFORM_PLAN.md). Order: RAD-040 provider verification (docs) → RAD-041 accounts → RAD-042 attempts / events → RAD-043 consent / notes / survey → RAD-044 owner dashboard; credits page (RAD-045) in parallel. Learn / Reference, Assess (server-side scoring), organisations, subscriptions and payment stay after the pilot (ADR-0009 unchanged).

- **RAD-042 (S-PILOT-9):** saved Practice attempts (`attempts` table, third migration applied by hand) + events `exam_opened` / `attempt_started` / `attempt_submitted` / `attempt_retry`; engine untouched. Consent screen (RAD-043) must precede inviting others.
- **RAD-043a (S-PILOT-10):** consent = tick "I agree to Terms and Privacy" at sign-up + `/{locale}/terms` draft page; nothing saved without consent (app + DB, fourth migration). RAD-043b (feedback note, survey link) still open.
- **RAD-044a (S-PILOT-8):** owner page `/{locale}/owner` (participant list, approve / suspend from the app; second migration `20261016000100_owner_list_participants.sql` applied by the owner by hand). Remaining RAD-044: attempts / notes views and CSV export, after RAD-042 / RAD-043.
- **RAD-044b (S-PILOT-12):** attempts + notes per participant code on the owner page and two CSV downloads (no e-mail); no migration (RLS already lets the owner read). Closes RAD-044.

**RAD-040 done as DOCS (2026-10-15, status `review`):** provider comparison from official documentation in [`PILOT_PROVIDER_COMPARISON_2026-10-15.md`](PILOT_PROVIDER_COMPARISON_2026-10-15.md); proposed Supabase Free (Frankfurt) pending the owner's S-PILOT-2 acceptance (DECISIONS S-PILOT-3); Q1–Q4 proposed; Cloudflare Access + D1 unevaluated (host blocked). (RAD-041 itself moved to `in_progress` with 041a below.)

**RAD-041a done (2026-10-15, CODE, in review):** schema + RLS + isolation tests + build-time CSP + owner setup guide ([`session-rad-041a-accounts-backend-2026-10-15.md`](session-rad-041a-accounts-backend-2026-10-15.md), DECISIONS S-PILOT-5). **RAD-041b done (2026-10-15, CODE, in review):** Supabase client, `/{locale}/account`, activity events, secret-key build guard ([`session-rad-041b-account-ui-2026-10-15.md`](session-rad-041b-account-ui-2026-10-15.md), DECISIONS S-PILOT-7); verified against a mocked Supabase only; the owner's live checklist is in that record.


## RAD-047a / RAD-047b — scalability audit and proposed core batches

**RAD-047a (DOCS, review; executed 2026-10-15, requested record label 2026-10-16):** [audit and evidence](session-rad-047a-scalability-audit-2026-10-16.md), from updated main `1b0405f` after #58/#59/#60. S-PILOT-13 fixes assumed scale (500/~25k attempts, design 5,000/~250k). Full-chain seeded PGlite EXPLAIN covers current reads/indexes; no application code/migration/live project changed. The current owner page/export cap is below the assumed volume; local 10× tables exceed the published Free database quota. Proposed decisions S-PILOT-14…23 remain open; audit review/merge is not policy acceptance.

**RAD-047b (proposed/planned, not started):** [ordered implementation plan](RAD_047B_IMPLEMENTATION_PLAN.md): .1 migration chain/indexes/equivalent RLS/longer new participant codes (8-file budget); .2 owner paging/filter/count/export (13); .3 shape/producer/Practice versions and configured locales (16, narrow existing-test approval first). Conditional retention/quotas/org/consent policy batches require exact owner answers and separate budgets. [Ready prompt for .1](prompts/rad-047b-core-foundation.md). Per invoked 047a prompt, keep umbrella RAD-047 review and add a separate status task only after owner plan acceptance. No new exams, instructors, tenancy, Assess, analytics product or paid service is approved by this sequence. No implementation in 047a; HANDOFF ≤80 lines, status format 1.1.
