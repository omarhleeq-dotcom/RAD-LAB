# Platform architecture — implemented boundaries

Current code baseline: main after #81 (`6d9df04`); #82 changes documentation/tooling only. [Status](project-status.md) records remaining external checks. This guide describes structure; detailed constraints are in [ENGINE_GUIDE](ENGINE_GUIDE.md).

| Layer | Implemented now | Still proposed / constrained |
|---|---|---|
| Exam and case data | `src/domain/exam.ts`, registries, validation and composition | No new exam or image import during the owner freeze |
| Scenes and results | Projection/scene/layout/figure registries; declared effect hooks and family-specific geometry/2.5D limb models | A new effect or modality still needs a proven need and reference; not every setting or console component is generic |
| Platform and pilot | Category-first library, Practice, account approval, saved attempts/events/feedback and owner CSV code; static export plus Supabase | Live deployment, provider checks and human review have separate evidence; the UI gate does not protect downloadable static assets |
| Future product | Existing code remains extensible through data and optional mechanisms | Learn/Reference containers, CT/MRI/US, Assess, institutions/payments and full `ControlSpec[]`/folder redesign are not claimed implemented |

**Current direction:** S12-12 puts X-ray v1 before v2 modalities, subject to S-SHOULDER-Y-6's freeze. The next programming phase is postponed by the owner for documentation work. [DECISIONS](DECISIONS.md), the [recipe](exam-recipe.md), [pilot setup](PILOT_SUPABASE_SETUP.md) and [handoff](HANDOFF.md) govern current work.

## Data and runtime flow

`ExamDefinition` + `CaseDefinition` → `composeCase()` → pure evaluation/scoring → stores/UI and render plan → drawing. Rendered pixels never feed scoring. Definitions are validated; scene/projection/body-part/effect registries extend the existing X-ray engine. See the [registry](../src/data/exams/index.ts) and [recipe mechanisms](exam-recipe.md#2-s11-generic-mechanisms-what-an-exam-may-use).

Routes are `/{locale}/{modality}/{exam}/practice[?case=…]`, resolved from data rather than per-exam pages. Static Cloudflare export hosts the UI; optional Supabase provides authentication/Postgres/RLS for the pilot. The static session gate is a UI gate, not protection of downloadable HTML/assets. Configuration, consent and production evidence remain in the [pilot plan](PILOT_PLATFORM_PLAN.md) and [setup](PILOT_SUPABASE_SETUP.md).

## Future designs and historical rationale

The five-mode target, non-X-ray engines, full ControlSpec[] migration, alternative folder schemas and large-asset strategy are proposals. Do not build them from a historical diagram. [ADR index](adr/README.md) identifies accepted versus proposed records; [complete earlier design](archive/planning/PLATFORM_ARCHITECTURE-until-2026-10-16.md) retains its original headings and reasoning. New exams/images and the next programming phase remain frozen/postponed by the owner.
