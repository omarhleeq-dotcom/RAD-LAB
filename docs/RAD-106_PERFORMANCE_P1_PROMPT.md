# RAD-106 — performance P1: owner directory requests and read deadlines

## Mode
Implement P1 only on the existing performance Draft, branch `codex/rad106-performance`.
Its temporary base is `claude/rad105-promotion`; do not push to that base or modify #242.
Keep the Draft open; no Ready, merge, rebase, force-push, deployment or live commands.

## Goal
Reduce duplicate owner-directory reads and bound their waiting time without changing returned data, permissions or paging.

## Read first
Read AGENTS, HANDOFF, FEATURE_MAP, status RAD-106, the performance decision and the complete 31-item audit:
`docs/archive/reports/2026-11/RAD-106_PERFORMANCE_AUDIT_2026-11-06.md`.
Verify the actual performance PR/head and both base refs through GitHub; fetch before edits. Do not work on a stale checkout.
Use the existing isolated checkout; no new worktree or sub-agents.
The audit uses #242 head1519d285 for evidence; recheck the relevant shared code on the actual work head.

## Scope + file budget
Maximum12 changed paths for this P1 batch; announce the exact chosen list before editing.
Production: OwnerPanel.tsx, OwnerDirectory.tsx, owner-dashboard-data.ts under src/features/pilot/.
If needed, one new helper: src/features/pilot/owner-directory-request.ts.
Tests: src/features/pilot/owner-directory-request.test.ts and src/features/pilot/owner-directory-ui.test.ts.
Browser evidence: scripts/qa/owner-directory-performance.mjs only if existing harnesses cannot cover the case.
Docs: DECISIONS, HANDOFF, project-status, one dated P1 Arabic report, archive/reports/README.
Reuse directoryPage, FIRST, getPilotClient, SessionProvider, existing DTO parsers and synthetic owner/browser harnesses.
Do not add a generic query framework, dependency or cache service.

## Pending closures to record first
Record the completed read-only audit and owner-approved start of P1; RAD-106 is not done.
Keep #242 unchanged. Its accepted preparation is not a merge, deployment or live success.

## Acceptance criteria
Measure baseline request count, bytes and time to first usable directory with synthetic accounts; distinguish production-mode behavior from StrictMode effects.
At matching owner, authorization generation, revision, search/status, cursor/boundary and limit, counts/list share one read rather than two.
Keep global counts correct when list filters differ; do not share nonidentical queries or completed stale results.
Preserve page20, order, cursor/boundary, pending-deletion exclusion, DTO and installed RPC contracts.
No cross-account/session sharing or persistent storage of directory data; invalidate on identity/revision/mutation changes.
Add an explicit bounded read deadline, reusing the existing15s convention if appropriate, and cancel unused reads safely.
One consumer unmounting must not abort another active consumer; account changes and timeout must not publish late data or leave loading stuck.
Do not add automatic retries, change writes, cache authorization, or infer rollback from timeout.
Regression evidence must cover cold matching reads, filtered reads, refresh after mutation, sign-out/account switch, partial unmount, slow/error/timeout and late responses.
Use deterministic request/byte counts and repeatable timing; synthetic delay savings are not a claimed real-user speedup.

## Out of scope
No SQL/RPC/index/manifest/marker/golden changes; no Assess protocol, worker, clock, scoring, medical/image/font or layout redesign.
Do not change owner-data.ts or deferred adapters, saved-results500-row semantics, profile/auth deadlines or S3 runners in P1.
Measure those later candidates only if useful; no Redis, telemetry/RUM, new service, cloud backup, paid resource or production access.

## Verification
Run targeted new regressions plus existing owner UX/directory/auth checks without weakening expectations.
Run required EN/AR390/1440 owner browser/axe checks and repository-required check/build/health checks; retain unrelated accepted evidence.
Run docs:sync twice, docs:check and status:check --require-previous against the actual PR base, then git diff --check.
Push only this branch, update the same Draft description and report exact final-head CI; no manual workflow dispatch or deployment.
Follow existing network/TLS policy. A blocked proof remains unverified; continue independent authorized work without pretending success.

## STOP conditions and report
Report protected-contract conflicts, missing authority/access or an expansion beyond the budget before dependent changes; never bypass a guard.
Deliver the Arabic S-STD-1 report1–8, at most150 lines, with before/after evidence and Verified/Inferred/Not run.
State final SHA/files/CI, residual limits and a proposed P2 scope conditional on coordination review; do not start P2.

