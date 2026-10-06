# Session 7 — engine generalisation: exam / case split (pure refactor, zero behaviour change)

Scope (set by the Session 7 prompt): split today's Chest-PA-specific `RadCase` into `ExamDefinition` and `CaseDefinition`, so a new exam (Chest Lateral, Chest AP) can later be added mostly as data; Chest PA must behave exactly as before. Plus the decisions log and the demographics-impact analysis. No feature, UI, asset, medical value, threshold or wording was changed. Design: [`PLATFORM_ARCHITECTURE.md`](PLATFORM_ARCHITECTURE.md) §2.4, [`adr/0004-declarative-exam-definitions.md`](adr/0004-declarative-exam-definitions.md); decisions: [`DECISIONS.md`](DECISIONS.md); analysis: [`session-7-demographics-impact.md`](session-7-demographics-impact.md).

## 1. Method (strict order)
1. **Characterisation first** (commit `ac6b8b5`, no production change): `src/features/qa/characterisation.ts` writes `scripts/qa/characterisation/` — for all 53 QA-matrix scenarios: score, per-category scores, critical findings, verdict, every check (id, outcome, credit, weight, evidence, EN + AR label and feedback), the result-screen message keys with EN + AR text, EN + AR canvas alt text, the complete evaluation result, the complete render plan JSON, a SHA-256 of the phantom render; plus the composed case object and the SHA-256 of all 53 golden PNGs. Generated on `main` (c78ef13) with `npm run qa:characterise`.
2. **Refactor in small commits** (`9e45022` types + compose + validators; `5cef1b7` data split + registries; `5d17136` fixture test, doc comments, CLAUDE.md; docs commit).
3. **Re-compare**: the snapshot test was run after every step without regenerating anything. It is part of the unit suite and therefore of CI (`src/features/qa/characterisation.test.ts`, byte-for-byte; on a mismatch it prints a structural diff). **Never regenerate it to make a refactor pass.**

## 2. New structure
```
domain/exam.ts                       ExamDefinition · CaseDefinition · ExamTechniqueProfile · PatientTechniqueModel
features/exam/compose.ts             composeCase(exam, case) → RadCase (compat view; memoised; default case keeps the exam id)
features/exam/validate.ts            validateExam · validateCase (structural)
data/exams/index.ts                  EXAMS · getExam
data/exams/xray/chest-pa-erect.ts    exam: controls, rules, tolerances, weights, critical findings, positioning, scene/render ids, evidence
data/exams/xray/chest-pa-technique.ts technique protocol (moved; `patient` block removed)
data/cases/chest-pa-erect.ts         case "adult-demo" (patient, order, condition, attenuation, initial state) + chestPaErect = compose(...)
data/cases/index.ts                  CASE_DEFINITIONS · CASES · getCase
```
Unchanged production files (empty `git diff` since the snapshot commit): `features/evaluation/engine.ts`, `features/scoring/*`, `features/radiograph/{plan,pipeline,tuning}.ts`, `messages/*`, `scripts/qa/golden/*`, `scripts/qa/scenarios.json`. The routes (`/[locale]/simulation/chest-pa-erect`) and the render noise seed are unchanged because the default case keeps the exam id (S7-1).

## 3. Proof of zero behaviour change
| Proof | Result |
|---|---|
| Characterisation snapshot, 53 scenarios (`chest-pa-scenarios.json`, 2.3 MB) vs the file committed before the refactor | **byte-identical** (test passes; `git diff ac6b8b5 HEAD -- scripts/qa/characterisation` is empty) |
| Composed case object (`chest-pa-case.json`) | **byte-identical** — the composed `RadCase` is value-identical to the former hand-written object |
| Golden image checksums (`golden-image-checksums.json`) and `scripts/qa/golden/matrix.json` | **identical**; **0 images regenerated** (`git status` clean after the browser run) |
| Browser golden comparison + full matrix `scripts/qa/run-matrix.mjs` (EN + AR × desktop 53 scenarios, tablet / mobile subset) on the production build | **3159 / 3159** checks (same count as Session 5) |
| axe audit `scripts/qa/a11y-audit.mjs` (EN/AR × desktop/mobile) | 0 violations (32 ok/info) |
| `npm run preview:smoke` against the static export | 200 / 200 |

## 4. Checks (final head)
| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 problems) |
| `npm test` (full unit suite) | **682 / 682** in 24 files (662 existing + 4 characterisation + 16 exam / case) |
| `npm run build` | pass |
| `npm run build:pages` (static export) | pass |

New tests (`src/features/exam/exam.test.ts`, 16): registry and ids; structural validation of exam and case; memoised composition; exam fields come from the exam, scenario fields from the case; attenuation from the case, protocol from the exam; a second case of the same exam is a case (own id, same rules); a case of another exam is refused; the validators catch bad weights / missing weights / duplicate rule ids / impossible `expected` / missing Arabic / unknown scene / initial state out of range / unanswered instruction; **a fixture exam** (different required projection and category weights, built from data only) run through the real engine follows the data (rule, critical-finding gate, weights). The architecture guard now also covers `features/exam` (no renderer import, no pixels).

## 5. Left unrefactored, and why
See `PLATFORM_ARCHITECTURE.md` §2.4 and decision S7-4. In short: `SimulationSettings` / `ControlSpec[]`, `CATEGORIES`, `ImageVariantId`, `EffectId`, `CriticalFindingId`, the console JSX and the positioning scene art, the required `RadiographAssetSpec` landmark groups, the `modalities/xray/*` folder move, and migrating consumers off `RadCase`. Each either needs the second exam to say what it must become (rule of three; an over-abstraction here would be guessed and then reworked), or is a visible-UI refactor with no benefit before then. Nothing was left unrefactored because of a *discovered* behaviour dependency; there was none. `ExamDefinition.scene` / `.render` are declared ids that nothing resolves yet.

## 6. Differences from `ROADMAP_SESSIONS.md` Session 7
The roadmap bullet list also names generalising the vocabularies, a data-driven console and `SceneSpec`, optional landmark groups and the `modalities/` move, and "identical" Playwright + axe. The prompt for this session defined a narrower goal (exam / case split, proof, decisions, docs) and said the prompt wins; the roadmap now records that those items moved to Session 9. Playwright and axe were run and are identical.

## 7. Notes for the next session (Session 8, shell before Lateral — D2)
- The catalogue can read `EXAMS` / `CASE_DEFINITIONS` directly; `CASES` stays the compat view for the existing routes.
- A baseline or demographic change belongs to a `CaseDefinition` (see the demographics note); it is the only kind of change that should regenerate `chest-pa-case.json`.
