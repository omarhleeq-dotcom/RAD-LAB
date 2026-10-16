# RAD-LAB

Bilingual Arabic/English educational radiography simulator. Learners choose an exam and case, position the patient, set technique, expose, and review simulated results with educational scores and feedback.

> **Educational prototype — not for clinical use.** Medical content, teaching tolerances, image effects and Arabic text remain provisional pending the recorded human reviews. Reference radiographs are not images of the fictional case patients. The preview banner and medical disclaimer remain visible.

RAD-LAB is not a diagnostic, clinical or dose-calculation tool and must not be used for patient care. Scores are educational, not real-world accept/reject decisions. Simulated image effects are approximate and do not replace educator/medical-physicist review.

## Current implementation

Snapshot: main `f90b3c9` after [PR #80](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/80), 2026-10-16. The [exam registry](src/data/exams/index.ts) contains 17 X-ray exams: Chest PA/Lateral/AP supine, Wrist PA/Lateral, Hand PA/Lateral, Elbow AP/Lateral, Knee AP/Lateral, Foot AP/Oblique, Ankle AP/Lateral, Pelvis AP supine and Shoulder Grashey erect. This is an inventory of implemented code, not clinical validation or proof of a live deployment.

- Home is a quiet empty dashboard. The exam library starts with categories; selecting one reveals its exams and search. Browser Back returns from an exam to its list, then to category cards. There are no extra custom return buttons.
- Practice is available. Assess, scientific-content navigation and future categories remain unavailable; no invented evaluation history or mastery metrics.
- When both validated public Supabase variables are configured, the pilot provides email/password self-registration, confirmation and owner approval (`pending` → `approved`, or `suspended`), saved Practice attempts, activity/feedback and the owner participant/CSV UI. Ordinary approved password sign-in opens Home; a safe explicit pre-login destination is preserved.
- With pilot configuration absent or invalid, account features and their network requests are off and the educational pages remain open. On a configured build, the session UI gate allows protected pages only for approved accounts; the account, Terms and not-found views remain reachable. Static assets/HTML are still downloadable: database access is protected separately by Supabase authentication and RLS.
- The front end is a static Cloudflare Pages export, with an optional Supabase identity/Postgres backend. Provider configuration, live migrations, backups and remaining owner checks are documented separately; a merge does not prove deployment.

New exams and image imports are frozen by S-SHOULDER-Y-6. CT/MRI/US remain v2 work. The owner has also postponed the next programming phase, including the next “my attempts” step, while documentation is aligned. See [current status](docs/project-status.md), [handoff](docs/HANDOFF.md) and the [documentation index](docs/README.md).

## Architecture and routes

`ExamDefinition` describes an exam; `CaseDefinition` describes one patient scenario. Registries and `composeCase()` resolve the compatibility view consumed by the simulator. Evaluation/scoring are separate from React and pixel rendering; renderers never score pixels. Controls, projection/scene bindings and limb effects use the implemented optional mechanisms, not a claim that every future modality is already generic.

Public route shapes (the UI gate above still applies):

```text
/{locale}
/{locale}/{modality}
/{locale}/{modality}/{exam}
/{locale}/{modality}/{exam}/practice[?case=...]
```

Old `/simulation/{caseId}` routes redirect through the [legacy registry](src/data/legacy-routes.ts). Language changes preserve route/query; anatomy and laterality never mirror with RTL. The library stores category selection in its URL fragment.

```text
messages/                 English and Arabic UI strings
docs/                     Current guides, medical references and historical records
src/app/[locale]/         Localised platform/account/owner and exam routes
src/data/exams/            Exam definitions and registry
src/data/cases/            Patient cases and registry
src/features/platform/    Catalogue, presentation metadata and route resolution
src/features/exam/        Composition and validation
src/features/pilot/       Optional pilot account/data UI
src/features/positioning/ Registered scene/layout/figure views
src/features/evaluation/  Pure checks and result UI
src/features/scoring/     Pure score aggregation
src/features/radiograph/  Render plans, effects and pixel pipeline
src/stores/               Simulation state
supabase/migrations/      Pilot database functions, grants and RLS migrations
scripts/                  Build, preview, QA and status tools
```

## Run locally

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · next-intl · Vitest · ESLint. Use the repository lockfile.

```bash
npm ci
npm run dev
npm run check
npm run build && npm start
npm run build:pages
npm run status:check
```

Pilot public-variable setup and synthetic verification: [Supabase setup](docs/PILOT_SUPABASE_SETUP.md). Hosting: [deployment guide](docs/DEPLOYMENT.md). Never put a service/secret key into public variables or Git. Local setup is separate from provisioning a live provider project.

## Add or change exam/case data

Read [CLAUDE.md](CLAUDE.md), the [exam recipe](docs/exam-recipe.md) and the merged medical reference/Needs first. New exam/image work is currently frozen. An authorised case change creates a `CaseDefinition` tied to an existing `ExamDefinition` and registers it; `composeCase()` produces the simulator's `RadCase` view. Do not create a direct `RadCase` as the primary data definition or a per-case page. Run the existing validators and the checks required by the recipe.

## Verification and limits

`npm run check` covers types, lint and unit/characterisation/scene guards. Manual browser tools and historical evidence are indexed in [docs](docs/README.md); consult the current UI report before choosing a script, because older catalogue audits may assert superseded navigation. Golden/hash generation is reserved for an explicitly authorised behaviour change under S-STD-1; it is not a repair command for a failing guard.

The DOCS-ALIGN-1 session runs documentation/status checks only. The application QA recorded for #80 is historical evidence, not a fresh build/browser run or a live-phone check. Outstanding review, licence, deployment and provider items remain in the status file.

## Historical milestones

Sessions 1–6 established Chest PA, positioning, technique, rendering, QA and preview hosting. Their records remain in place: [positioning](docs/archive/sessions/session-2-positioning.md), [technique](docs/archive/sessions/session-3-technique.md), [rendering](docs/archive/sessions/session-4-radiograph-renderer.md), [QA](docs/archive/sessions/session-5-qa.md) and [deployment](docs/DEPLOYMENT.md). Later exam/platform records are linked from the [documentation index](docs/README.md). The [original specification](docs/RAD-LAB_Project_Specification.md) remains the product brief, amended by the recorded owner decisions.
