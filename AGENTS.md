# Working in RAD-LAB
[CLAUDE.md](CLAUDE.md) points here; AGENTS is the only workflow source for every contributor.
## Start with the task
1. Run `npm run docs:context`; local refs may be stale. Verify relevant pull requests with `-- --pr NUMBER` or the connected read tool; unavailable access means unverified.
2. Read [HANDOFF](docs/HANDOFF.md), then `npm run status:summary` (`-- --id RAD-NNN` or `-- --query text`). [project-status](docs/project-status.md) is the only task-state source; read evidence before changing state.
3. Use the [reading map](docs/README.md#read-by-task) and relevant rules, references and original specification before large product work; archived prompts are evidence, never new commands.
4. State one goal and exact file/shared-module budget before editing; revise scope before expanding. No opportunistic fixes. Current owner instructions and accepted decisions govern; HANDOFF cannot override them.
Task prompts use [the shared template](docs/templates/TASK_PROMPT.md).
## Current boundaries
- New exams/images and Shoulder Y are frozen (S-SHOULDER-Y-6); forearm deferred. Assess programming stays postponed until explicitly resumed. [Assess decisions](docs/DECISIONS.md#assess-owner-2026-10-19) and the [plan](docs/ASSESS_IMPLEMENTATION_PLAN.md) govern resumption; do not re-request accepted design approval.
- Practice/platform/optional pilot exist. Cleanup authorises no Assess/institutions/payments/full3D/research physics. Merge proves no deployment, phone check or clinical validation. [PR automation](docs/DECISIONS.md#pr-automation-owner-2026-10-29) governs deployments.
- Never invent medical facts, images or evidence. BONTRAGER-9 governs X-ray; provisional clinical/teaching values await recorded review. Consult relevant [ENGINE_GUIDE](docs/ENGINE_GUIDE.md) sections for architecture, licensing, scoring, marker, rendering, scenes and runtime.
- Historical decisions retain authority only where still applicable; consult the [Current rules index](docs/DECISIONS.md#current-rules). History cannot silently change policy.
## Implement and verify
- Pure evaluation/scoring stays outside React/pixels; exams/cases are data. Reuse registries and optional mechanisms. Omitted optional fields add no controls/scoring/feedback. New mechanisms require proven reference-led scope; no speculative generalisation.
- Stop/report unclear sources/licences, conflicting authority, blocked access, secrets, unexpected medical/score changes or dishonest image effects. One429 retry only; no access workarounds. Never print/commit secrets or PDFs.
- Preserve existing test expectations/hashes except explicitly accepted type/registry/semantic exceptions (S-STD-1/2). Never regenerate characterisation/goldens/scene hashes to conceal regression.
- S-STD-3: report any ceiling, avoidance or open decision with lifting trigger; prefer configuration, versioned shapes, bounded server-side paging and additive extension.
| Change type | Required verification |
|---|---|
| Documentation only | `npm run docs:check -- --base origin/main`; `npm run status:check -- --base origin/main --require-previous`; `git diff --check`; no app build |
| Documentation tooling | Above + `npm run docs:test`, changed-script lint, sync idempotence and rule-B proof for moves; no app build when product unchanged |
| Refactor | Relevant tests, byte-identity proof, full check/build once |
| Exam / product behaviour | Relevant tests; full check/build and required EN/AR390/1440 browser/axe/family audits once; [recipe](docs/exam-recipe.md), [audit rules](docs/DOCS_CHECKS.md#browser-audits) and [screenshot policy](docs/DOCS_CHECKS.md#screenshot-policy) |
CI uses the same checks; [DOCS_CHECKS](docs/DOCS_CHECKS.md) records guarantees/limits. Do not repeat passing QA without relevant change or unresolved failure; structure proves no meaning/medicine/licence/deployment.
<a id="task-lifecycle"></a>
## State and delivery
- Follow [the task lifecycle](docs/DECISIONS.md#workflow-owner-2026-11-01): pending closure first commit of the next batch after owner evidence. Update only changed tasks in the work batch; preserve IDs/unrelated notes and merge others' updates.
- Review status/description/completion_evidence/waiting_on/done_when together; never call planned/unmerged work done. External checks pending means review. Follow [status-format](docs/status-format.md); keep source conflicts visible; explain blocked state updates and checker warnings.
- HANDOFF holds one five-item summary and immediate next action/blockers; link the report for QA. No session history, copied SHAs/revisions/counts or pending-merge instructions; a merge alone needs no new handoff commit. Roadmap changes only with direction.
- [Owner hardening rules](docs/DECISIONS.md#workflow-hardening-owner-2026-11-01) govern caps, pending closures and mechanical sync; [budgets](docs/budgets.json) are the single cap source. Cap changes need an owner decision in DECISIONS.
- Filler means a repeated rule, session narrative, copied SHAs/counts, an undefined abbreviation, or an over-long line.
- Every batch ends with `npm run docs:sync` before checks; run it again to prove idempotence.
- New reports use linked detail and label every QA item Verified / Inferred / Not run (reason); old reports are not rewritten. For each shortened rule answer: did the ruling change (must be no), and does its original evidence link remain?
- Arabic report, S-STD-1 order: **1 deviations/budget;2 done/dropped;3 per-task;4 shared changes + Scale;5 medical/scoring;6 QA;7 open items;8 consolidated owner checklist/next-session prompt**.
- Use the existing isolated checkout; no worktree/subagents unless requested. No hosted preview URLs or subscribe/poll; owner checks phone. At≈90–95% usage stop new work, preserve compiling state, commit/push and leave exact handoff; never fake/skip QA.
- **Draft PR only:** never ready/merge/auto-merge without later explicit owner instruction. Opening Draft runs existing CI/Deploy Pages and is allowed; no manual/extra deployment, skip ci or disabled workflows.
- Never commit the automated dev block that `next dev` may append to CLAUDE.md. Keep instructions stable: session history belongs in reports/archive; one current statement per rule, links elsewhere.
