# Prompt: RAD-047a — scalability audit (copy into a new conversation)

Kept in the repository so it is not lost with a chat. Task: [RAD-047](../project-status.md). Binding rule behind it: CLAUDE.md rule 9 / DECISIONS S-STD-3.

```text
SESSION: RAD-047a — Scalability audit of the pilot core + decisions (DOCS)
Follow CLAUDE.md (rule 9 / S-STD-3 is in force), docs/exam-recipe.md and S-STD-1. Start from updated main (PR #58 and #59 merged) else STOP AND REPORT. New branch, DRAFT PR only, no subscribe/poll, never open or share preview URL. No secret keys, no real participant data.

OWNER GOAL (verbatim intent): build a CORE that scales from ANY angle (users, data volume, new exams / modalities, new data types, new roles / organisations, new languages, Assess mode, analytics / export) so that growth never forces redoing work. Principle to honour together with CLAUDE.md rule of three: no speculative features; make the foundation not block them (ids, versions, constraints, indexes, migration process). Every finding is classified: CHEAP-NOW-EXPENSIVE-LATER (do in 047b), DEFER (with the trigger that would make it necessary), or NOT NEEDED.

ASSUMED SCALE (owner-approved in chat, record first as S-PILOT-13): 500 participants, ~50 attempts each (~25k attempts, ~few hundred k events) in the first 6 months; design for 10x (5,000 participants, ~250k attempts). Runs on Supabase (Frankfurt) + static Cloudflare Pages.

READ ONLY: docs/HANDOFF.md, docs/project-status.md, docs/PILOT_PLATFORM_PLAN.md, docs/PILOT_SUPABASE_SETUP.md, DECISIONS S-PILOT-1…12, S-STD-3 and O103…O105, ADR-0002, docs/PLATFORM_ARCHITECTURE.md, supabase/migrations/*, src/features/pilot/*, src/features/pilot-db/*.

SCOPE (audit every axis, evidence from the code / migrations, no guessing):
1. DATA VOLUME: owner reads (src/features/pilot/useOwnerData.ts loads up to 10,000 rows into the browser, offset paging), CSV export cap, index coverage per real query (EXPLAIN on seeded PGlite data), `events` growth and retention, per-user write limits / abuse, row-size limits, Supabase free-tier limits (official docs only, else UNVERIFIED), backup / restore (O105).
2. SCHEMA RIGIDITY: hard-coded checks that block growth (e.g. `locale in ('en','ar')`, `role`, `status` sets, exam / case id formats), jsonb shape versioning for `settings` / `result` / event payloads, `definition_version` meaning, optional `org_id` (Plan), multi-tenant readiness, instructor role, ON DELETE behaviour vs retention / erasure requests.
3. CHANGE PROCESS: migrations are applied by hand in the SQL editor today; assess a safe repeatable process (ordered files, idempotence, a staging project vs production, rollback, a CI check that the migration chain builds in PGlite), without paid services.
4. FRONTEND / ARCHITECTURE: owner page and exports (server-side paging / filtering / aggregates via owner-only SQL functions vs client-side), how a new exam / modality / mode / language reaches the pilot tables with NO schema change, Assess (server-side scoring) seams, analytics / export seams.
5. SECURITY AT SCALE: RLS cost on large tables (is_owner() per row), SECURITY DEFINER functions, privacy promises in the Terms vs bigger exports (free-text notes with personal data in CSV: owner raised it; options = automatic flag for e-mail / phone-like text, export without note text, masking; propose, do not implement).
6. DELIVERABLES: (a) docs/session-rad-047a-scalability-audit-<date>.md with a findings table (id, axis, evidence file:line, risk at assumed scale and at 10x, class CHEAP-NOW / DEFER+trigger / NOT NEEDED, proposed fix, needs migration yes/no); (b) an ordered RAD-047b implementation plan with change budget, migrations list, tests and QA; (c) DECISIONS S-PILOT-13 (assumed scale) and PROPOSED S-PILOT-14… (one per decision the owner must take); (d) HANDOFF (keep it <= 80 lines), ROADMAP_SESSIONS and project-status updated in format 1.1 (RAD-047 exists: update it, add RAD-047b as a task when the plan is accepted; waiting_on required for open tasks); (e) a ready-to-copy prompt for RAD-047b saved under docs/prompts/.

ALLOWED CHANGES: docs only (the files in 6). No code, no migration, no messages, no package changes.
CHANGE BUDGET: ~5 docs files + 1 new session record + 1 prompt file. Anything beyond → STOP AND REPORT.
SCALE CHECK (S-STD-3): this session adds no ceiling (docs only); its job is to find the existing ones.
OUT OF SCOPE: implementing any fix, new features, text scrubbing of notes, forgot-password page (RAD-046), new exams, CLAUDE.md changes (propose only).
SESSION TYPE: DOCS → QA = markdown / status checks only (`npm run status:check`), no app build. Seeded-data EXPLAIN runs may use PGlite scripts kept in the scratchpad, not committed.
Facts about Supabase limits / behaviour come from official docs only, with the URL and date; otherwise mark UNVERIFIED. Conflict with repo docs or decisions, or a finding that needs an owner decision before it can be classified → list it, do not decide it, keep going on the rest.
Final report in Arabic in the standard 8-section order, ending with a ready-to-copy prompt for RAD-047b.
```
