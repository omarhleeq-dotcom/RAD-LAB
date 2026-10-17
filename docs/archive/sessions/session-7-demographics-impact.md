# Session 7 — impact of aligning the case demographics to the baseline image

**Status: analysis only. Nothing was changed. Owner decision D7 (2026-10-06) approved aligning the case data to the image; it is executed in Session 8 following §3.** The case patient is still a 45-year-old male; the baseline radiograph (A-001) is still described by its author as a 21-year-old woman. This note lists every place the case's age, sex, pronouns, name, build or thickness appear or influence anything, what would change if the case were aligned to the baseline image (**adult female, about 21**), and the safest order of work. It is the input to decision **D7** in [`DECISIONS.md`](../../DECISIONS.md) ("baseline demographic mismatch"; the recommendation to align the case to the image was approved by the owner on 2026-10-06; O1 is resolved).

Method: repository-wide search (`src/`, `messages/`, `scripts/`, `docs/`) for age/sex/pronoun/name/build/thickness words in English and Arabic, then a check of every reader of `patient.age`, `patient.sex`, `patient.description`, `technique.patient` and the technique `attenuation`; the Session 7 characterisation snapshot (`scripts/qa/characterisation/`) was searched for the same strings to see what the golden proofs actually pin.

Legend — **T** = text-only (wording, no effect on any score, medical value or picture) · **M** = could affect a medical value, a score or a picture (none today; listed because a future change in that place would) · **P** = proof / documentation artefact.

## 1. Inventory

### 1.1 Data (where the demographics live)

| # | Where | What it holds | Today | Kind |
|---|---|---|---|---|
| 1 | `src/data/cases/chest-pa-erect.ts` → `patient.age`, `patient.sex` | structured demographics | `45`, `"male"` | T |
| 2 | same → `patient.description` (EN + AR) | "45-year-old male, ambulant, able to stand and follow breathing instructions." / "ذكر عمره ٤٥ عامًا، قادر على المشي والوقوف واتباع تعليمات التنفس." | repeats age and sex; AR uses masculine forms (`عمره`, `قادر`) | T |
| 3 | same → `patientCondition` (EN + AR) | "Stable. … The patient has arrived slightly turned to one side." / AR "حالته مستقرة … وصل المريض وهو مائل قليلًا …" | EN is neutral. **AR uses masculine pronouns / forms** (`حالته`, `وصل`, `وهو`, `مائل`) | T |
| 4 | same → `clinicalScenario`, `requestedExamination` | "Persistent cough for three weeks. Referred by the outpatient clinic." / "Chest X-ray, PA erect." | no age / sex / pronoun in EN; AR has none that depend on sex | T (nothing to change) |
| 5 | same → `initialSettings` (rotation 8°, chin tucked, …) | the starting state "arrived slightly turned" | not demographic | — (but #3's story and this state must stay consistent) |
| 6 | same → `patientTechnique` (`attenuation: 1`, label "Average adult (reference attenuation)" / "بالغ متوسط (توهين مرجعي)", evidence note) | the **only** build / thickness quantity in the project; read by `features/technique/model.ts:44` | one reference adult, not sex- or age-specific | **M** if ever changed |
| 7 | `src/data/exams/xray/chest-pa-technique.ts` → profile label "average adult", `kvp.targetBand` note "simulated average adult", assumption `patient-habitus` "One reference adult attenuation", AEC text "anatomical thickness" | protocol is written for an "average adult", not for a sex | no sex or age | T (wording stays true for a 21-year-old adult) |
| 8 | `src/data/exams/xray/chest-pa-erect.ts` → exam title "Adult Chest X-ray — PA Erect" / AR "للبالغ", rule feedback "Adult PA chest is taught as …" | exam is for adults | no sex; a 21-year-old is an adult | T |
| 9 | `src/data/cases/chest-pa-patient.ts` → "Cooperative adult" profile | instruction → response model | no age or sex dependence | T |
| 10 | `src/data/cases/chest-pa-radiograph.ts` (comments + evidence note), `docs/ASSET_PROVENANCE_AND_LICENSES.md` A-001 | records that the image is a different patient (21-year-old woman) | already states the mismatch | P |

### 1.2 UI and messages

| # | Where | What | Kind |
|---|---|---|---|
| 11 | `messages/en.json` `home.patientLine` = "{age}-year-old {sex}"; `sex.male/female` | rendered on the home card (`src/app/[locale]/page.tsx:36`) as "45-year-old male" → would read "21-year-old female". Neutral grammar | T |
| 12 | `messages/ar.json` `home.patientLine` = "{sex} عمره {age} عامًا"; `sex.male/female` = ذكر / أنثى | **`عمره` is masculine ("his age")**. With a female patient it would read "أنثى عمره ٢١" — grammatically wrong. Needs a neutral template (e.g. "{sex}، العمر {age} عامًا") or a gendered pair of keys. Both locale files need the same keys (parity test) | T, **but a real defect if only the data is changed** |
| 13 | `SimulationWorkspace.tsx:52` shows `description` **and** "(sex, age)" | duplicates age and sex already in the description (today "… 45-year-old male … (male, 45)") | T |
| 14 | Arabic generic "المريض" (masculine noun used generically) — on 15 lines of exam rule feedback / critical-finding text and 24 lines of `ar.json` (headings such as "حالة المريض", "تعليمات المريض", effect cards "حركة المريض") | refers to "the patient" in general, not to the case patient. Conventional in technical Arabic; strictly it is masculine, "المريضة" for a female. Which form is right for a female case is an **Arabic-educator decision** — a gendered variant would have to be case data, not exam text | T (needs educator) |
| 15 | `messages/en.json` `radiograph.educationalNote`: "not an image of the case patient"; `radiograph.alt`; `rotationHelp` "Real clavicle appearance varies with body build" | stays true after alignment (the image is still a different, real person); alt text and result strings contain **no** age / sex | T (keep) |

### 1.3 Scoring, technique, renderer, alt text, feedback

| # | Area | Does age / sex / name / build influence it? | Kind |
|---|---|---|---|
| 16 | Scoring (`features/scoring`, rule engine, weights 25/20/15/20/10/10, critical findings) | **No.** No rule reads `patient`. | — |
| 17 | Technique model (`features/technique/model.ts`) | Only through `profile.patient.attenuation` (#6). Age and sex are **not** inputs. Aligning the demographics does not change it. Modelling a different build would change exposure results and needs a **sourced** value (none exists; any value would be provisional) | **M**, only if the owner chooses to model build |
| 18 | Positioning rules (centering target y = −0.14, required region 27 × 31 cm, tolerances, detector 35 × 43 cm) | Not demographic. The 27 × 31 cm region is an adult-generic provisional value; the baseline's landmark box (≈ 27 × 28 cm) is the unrelated mismatch of Session 5 §0.2 | — (do not conflate) |
| 19 | Renderer / render plan / pixel pipeline / golden PNGs / `matrix.json` | **No.** The picture is the A-001 image plus effects; the plan holds `caseId` (the noise seed) but no demographics. | — |
| 20 | Canvas alt text, effect cards, result feedback (EN + AR) | **No age / sex / pronoun.** (AR feedback uses generic المريض, #14.) | — |
| 21 | Patient-cooperation model | No | — |
| 22 | Case-level clinical story vs image provenance | A-001's author attributes the image to a young woman who presented after a sports collision; the case story is "persistent cough". The project policy (`PLATFORM_ARCHITECTURE.md` §6.4, rule 4) is **not to copy patient narratives from a source**. Aligning age / sex does not require, and must not introduce, the image's story | T (keep separate) |
| 23 | Content the simulator does **not** contain and this change must not invent | e.g. any sex- or age-specific radiation-protection step, patient questions or appearance discussion. The repository references make no such claim; whether a female case should prompt any such teaching is a question for the educator, not something to add silently | question for educator |

### 1.4 Tests, goldens, proofs

| # | Artefact | Contains demographics? | What aligning would do |
|---|---|---|---|
| 24 | `scripts/qa/characterisation/chest-pa-case.json` (composed case) | **Yes**: `patient.age`, `patient.sex`, `description`, `patientCondition`, and AR strings (#1–3, #6) | would legitimately differ → regenerate **this file only**, in a commit labelled as an owner-approved demographic change |
| 25 | `scripts/qa/characterisation/chest-pa-scenarios.json` (53 scenarios: scores, verdicts, checks, EN/AR feedback, alt text, render plans, render hashes) | **No** age / sex / "45" / "male". It does contain generic المريض in AR feedback (#14), which is exam text and stays | must stay **byte-identical** — if it moves, something other than demographics changed |
| 26 | `scripts/qa/characterisation/golden-image-checksums.json`, the 53 PNG goldens, `scripts/qa/golden/matrix.json` | No | must stay byte-identical (no image regenerated) |
| 27 | Unit tests (`src/**/*.test.ts`) | **None** reference the case's age, sex, name or description (searched). `model.test.ts` varies `attenuation` on a copy of the profile; `exam.test.ts` builds fixture cases | no test change expected |
| 28 | `scripts/qa/run-matrix.mjs`, `a11y-audit.mjs`, `preview/smoke.mjs` (browser) | No assertion on the patient line | none, but the home and workspace must be looked at in EN and AR because the strings change length |
| 29 | `src/i18n/messages.test.ts` (EN/AR key parity) | Would catch a missing key if `patientLine` is split into two keys | keep keys in sync |
| 30 | Docs | `docs/archive/sessions/session-4-radiograph-renderer.md` (§ baseline, §11, §12), `docs/archive/sessions/session-5-baseline-options.md`, `REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md` line 54, `PLATFORM_ARCHITECTURE.md` §12 item 1, `ASSET_PROVENANCE_AND_LICENSES.md` A-001 (a description of the image — unchanged) | status lines to update when the decision is taken |

No **name** exists anywhere (the patient is unnamed), and no English pronoun (he/she/his/her) appears in case, exam or message text. Arabic carries the gender (#2, #3, #12, #14).

## 2. What would change if the case were aligned to "adult female, about 21"

Text-only (T), all in two files plus two message keys:

1. `chest-pa-erect.ts` (case): `age: 21`, `sex: "female"`; `description` EN "21-year-old female, ambulant, able to stand and follow breathing instructions." and AR with feminine agreement; `patientCondition` AR feminine ("حالتها … وصلت … وهي …") — the English is already neutral.
2. `ar.json` `home.patientLine`: replace the masculine `عمره` (neutral template or gendered keys; add to `en.json` too if keys are split).
3. Docs status lines (#30).

Not changed, and why: `attenuation` (#6) stays 1 (a 21-year-old adult female is not a different reference attenuation by any source in the repository); no rule, weight, tolerance, kVp / mAs / SID value; no render, no asset, no golden; the exam title "Adult …".

**Could affect medical values or scoring:** only #6/#17 (attenuation) and any new sex- or age-specific *content*. Aligning demographics alone touches neither. The risk is scope creep — a reviewer asking to "make the female patient attenuate differently" or to add protection teaching would be a **new, sourced** change, not part of this one.

**Could not be verified here:** the correct Arabic phrasing (feminine agreement, generic-masculine المريض) — educator review.

## 3. Recommended sequence (safest first)

1. **Owner decision** recorded in `DECISIONS.md` as **D7** (align case → image; approved 2026-10-06). Execution is Session 8; until then nothing changes.
2. **Arabic educator confirms the wording** of the four affected strings (#2, #3, #12, and whether generic المريض stays) — text only, no code.
3. **Separate commit A — message template:** fix `patientLine` in Arabic so it is grammatical for either sex (still renders correctly for the current male case). Verify home and workspace in `/ar`.
4. **Separate commit B — case data:** change the `CaseDefinition` fields in §2.1. Run the characterisation test: **only** `chest-pa-case.json` may differ; then regenerate that single file with `npm run qa:characterise`, review its diff (it must show only the demographic strings), and commit it **with** the data change and a message that says it is an owner-approved demographic change. `chest-pa-scenarios.json`, `golden-image-checksums.json`, the PNG goldens and `matrix.json` must be unchanged (CI enforces this; do not regenerate them).
5. **Do not touch `attenuation`, technique values, rules, region sizes or the baseline image in the same change.**
6. Browser check EN/AR × desktop/tablet/mobile (home card and workspace patient line wrap; no overflow), then update the docs listed in #30 and close the open decision.
7. If the owner later prefers a **male** baseline instead (option (b) of `docs/archive/sessions/session-5-baseline-options.md`), the same two data files plus a new asset registry entry change; the structure introduced in Session 7 makes that a `CaseDefinition` change (new baseline asset + landmarks), not an exam change.
