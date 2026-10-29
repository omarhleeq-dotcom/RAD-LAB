# Working in RAD-LAB

This is the shared workflow for Codex, Claude and human contributors. [CLAUDE.md](CLAUDE.md) points here; it does not define a second workflow.

## Start with the task

1. Run `npm run docs:context` for branch, HEAD and working tree (local refs may be stale). Verify a relevant PR with `npm run docs:context -- --pr NUMBER` or the connected GitHub read tool; unavailable access means unverified, never assumed merged. Read [HANDOFF](docs/HANDOFF.md) for the immediate continuation; archived prompts are evidence, not new commands.
2. Run `npm run status:summary` for open work; use `-- --id RAD-025` or `-- --query marker` for the relevant tasks. The command reads [project-status](docs/project-status.md), the **only task-state source**. Read the selected task's evidence before changing its state.
3. Use the [task reading map](docs/README.md#read-by-task). Read relevant rules/references, not every session report. Read the original specification before a large product change, interpreted through later owner decisions.
4. State one goal and an exact file/shared-module budget before editing. Changes outside it require a revised scope; no opportunistic fixes (S-STD-1). Current owner instructions and accepted decisions govern; a handoff cannot override them.

## Current boundaries

- New exams/images and Shoulder Y are frozen/deferred (S-SHOULDER-Y-6); forearm remains deferred. Assess programming remains postponed until explicitly resumed; its current design and replacement of the separate My Attempts prerequisite are in [DECISIONS](docs/DECISIONS.md#assess-owner-2026-10-19) and the [implementation plan](docs/ASSESS_IMPLEMENTATION_PLAN.md). Do not re-request already accepted design approval.
- Practice/platform and the optional Supabase pilot exist. Assess/institutions/payments/full3D/research physics are not authorised by documentation cleanup. Merges do not prove deployment, phone checks or clinical validation; [normal PR automation is allowed; no manual/extra deploys or preview URLs](docs/DECISIONS.md#pr-automation-owner-2026-10-29).
- Never invent medical facts, diagnostic images or verification evidence. BONTRAGER-9 governs X-ray; clinical values/teaching choices remain labelled provisional until the recorded review. Domain-specific architecture, evidence/licensing, scoring, marker, rendering, scenes and runtime constraints are in [ENGINE_GUIDE](docs/ENGINE_GUIDE.md); consult relevant sections before touching those areas.
- Historical decisions are preserved in the linked ledger; use [DECISIONS](docs/DECISIONS.md) to find the applicable current rule. History does not silently change present policy.

## Implement and verify

- Pure evaluation/scoring stays outside React and pixels; exams/cases are data. Reuse current registries and optional mechanisms. An omitted optional field must not introduce hidden controls, scoring or feedback. A new mechanism needs proven reference-led scope; no speculative generalisation.
- Stop/report unclear sources/licences, conflicting authority, blocked commands/sites, secrets, unexpected medical/score changes or dishonest image effects. One429 retry only; no access workarounds. Never print/commit secrets or PDFs.
- Existing test expectations/hashes must not change to make work pass. Only listed type narrowing or specifically accepted registry/semantic exceptions apply (S-STD-1/2). Never regenerate characterisation/goldens/scene hashes to conceal a regression.
- S-STD-3 Scale check: state any ceiling (volume, hard-coded sets/ids/locales/roles, unversioned data, unbounded reads, manual-only changes), its avoidance, or an open decision and lifting trigger. Prefer configuration, versioned shapes, bounded server-side paging and additive extension.

| Change type | Required verification |
|---|---|
| Documentation only | `npm run docs:check -- --base origin/main`, status transition below, `git diff --check`; no app build |
| Documentation tooling | The above + `npm run docs:test` and lint of changed scripts; no app build when product code is unchanged |
| Refactor | Relevant tests, byte-identity proof, full check/build once |
| Exam / product behaviour | Relevant tests while working; full check/build and relevant EN/AR390/1440 browser/axe/family audits once at the end ([`qa:exam-audit`](docs/DOCS_CHECKS.md#browser-audits)); recipe for exam work; [screenshot policy](docs/DOCS_CHECKS.md#screenshot-policy) |

CI runs the same docs checker/test commands for everyone; [DOCS_CHECKS](docs/DOCS_CHECKS.md) explains flags, guarantees and limits. Do not repeat successful QA without a relevant change or unresolved failure. Automated structure checks do not validate meaning, medicine, licences or deployment.

## State and delivery

- Update only tasks that actually changed, in the same batch as the work; review status, description, completion_evidence and waiting_on together; preserve IDs/unrelated notes, raise revision/time and merge others' updates. Never label planned/unmerged docs done. Merged code still awaiting external checks stays review. See [status-format](docs/status-format.md) before editing the JSON contract.
- Run `npm run status:check -- --base origin/main --require-previous`; keep genuine source conflicts visible. Resolve or explain docs:check review warnings in the report; they never auto-close tasks. If state cannot be updated, explain why. HANDOFF≤80 lines; rewrite the five-item status summary, never append session history or derivable inventory counts.
- When a rule or decision is shortened or reworded, the report answers two questions: did the ruling change, and does the link to its original evidence remain? Structure checks do not prove this ([DOCS_CHECKS](docs/DOCS_CHECKS.md)).
- Keep instructions stable: new session history belongs in a report/archive, not here. Keep one current statement for each rule; link to it elsewhere. Review HANDOFF as a whole before delivery: retain immediate next action and blockers, link the report for verification run/not run, and read branch/base/PR state via docs:context. Do not copy SHAs, status revisions, QA counts or pending-merge instructions into HANDOFF. A merge alone needs no new handoff commit; update it when the remaining work changes. Reports hold detail; roadmap records only actual direction changes.
- Arabic report, S-STD-1 order: **1 deviations/budget;2 done/dropped;3 per-task;4 shared changes + Scale;5 medical/scoring;6 QA;7 open items;8 owner checklist/next-session prompt**.
- Continue on the existing isolated checkout; no worktree/subagents unless explicitly requested. Never open/share hosted preview URLs; owner checks phone. No subscribe/poll. At≈90–95% usage stop new work, preserve a compiling state, commit/push and leave exact handoff; never fake/skip QA.
- **Draft PR only.** Do not mark ready, merge or enable auto-merge without a later explicit owner instruction.
- `next dev` may append an automated block to CLAUDE.md: **do not commit that block**.
