# Feature reuse map

Before implementing a feature, list the existing entry below that covers it. Extend its data or API;
justify a new mechanism against the merged reference and [engine constraints](ENGINE_GUIDE.md#architecture-and-optional-mechanisms).
The freeze and optional-field rules still apply; this map grants no new product scope.

| Need | Reuse before adding code |
|---|---|
| Exams, cases, projections | `src/data/exams/index.ts`, `src/data/cases/index.ts`, `src/data/projections.ts`, `src/data/modalities.ts`; `composeCase`, `validateExam`, `validateCase`; family builders in `src/data/exams/xray/` |
| Evaluation and score | `src/features/evaluation/engine.ts`, `result-state.ts`, `critical.ts`, `centering.ts`; `src/features/scoring/score.ts`; pure domain types in `src/domain/` |
| Optional controls and feedback | `ExamDefinition` controls/rules, optional patient and marker specifications; [recipe mechanism list](exam-recipe.md#2-s11-generic-mechanisms-what-an-exam-may-use); omitted fields stay inactive |
| Scenes and rendering | `src/features/positioning/scenes.tsx`, `scene-layouts.tsx`, `SceneParts.tsx`, `scene-style.ts`; `src/features/radiograph/pipeline.ts`; existing family models and warp/layer helpers |
| Workspace and state | `src/features/simulation/SimulationWorkspace.tsx`, `PhoneWorkspace.tsx`, `workspace-tabs.ts`; existing store actions; no scoring inside React |
| Text and direction | `messages/en.json`, `messages/ar.json`, `src/i18n/routing.ts`, `navigation.ts`, `src/domain/localized.ts`; anatomy/canvas remain LTR |
| Pilot and Assess | Existing pilot client, access, saved-results and paging helpers; versioned Assess contracts and RPC boundaries; `scripts/pages/frontend-schema.json` pins remain authoritative |
| Browser QA | `scripts/qa/workspace.mjs` driver/startPractice; `page-checks.mjs` axe/overflow; existing family audits and matrix; retain assertion order, CLI, output and screenshot paths |
| Documentation and state | `scripts/docs/`, `scripts/status/`, `docs/budgets.json`; task state in project-status; run docs:sync twice |

Code Health: `health:source` uses the original jscpd baseline settings (2.99% +0.5pp), exact-content/file-pair
long-clone exceptions, Knip and transitive pure-layer checks. `health:sizes` runs after build:pages and reads
[KiB caps](budgets.json) authorised in [DECISIONS](DECISIONS.md#code-health-size-owner-2026-11-03).
The HTML method excludes lazy chunks absent from HTML, RSC, fonts and images; existing image bytes are measure-only.

Knip entries in `knip.json` are executable QA/operations CLIs, test/setup/framework hooks, or actual esbuild library
entrypoints in build-runtime/build-connection-probe. They are roots, not unused-file exclusions. New scripts are
not automatically promoted to entries. Locally used exports are live (`ignoreExportsUsedInFile`); unused symbols
outside those live implementations must match an exact file/kind/name/reason in `scripts/code-health/policy.json`.
No file, directory or pattern is exempted. Entry exports are library/CLI API; Knip follows their dependencies.
Reviewed dependency exceptions: playwright/axe-core are optional manual browser tools; embedded-postgres is a
platform-specific optional runtime payload; tailwindcss is loaded through @tailwindcss/postcss. Generated
assess-job.cjs/worker.cjs imports resolve only inside their packaged output. age/age-keygen/patch/pg_dump/psql
are required external CLI tools, not npm packages. No exception permits a new unused npm dependency.
Each retained dead symbol and its removal trigger is declared in the [report](CODE_HEALTH_REPORT_2026-11-03.md).

Scale: caps are configuration; clone exceptions bind content and occurrence count, and symbol exceptions bind
one export. The pure-layer graph rejects React/Next/Zustand, TSX, stores and DOM dependencies, including indirect
imports. It cannot establish the clinical correctness of formulas or discover every semantically duplicated UI
formula; review still keeps evaluation/scoring outside React. No medical or scene source is changed by these gates.
