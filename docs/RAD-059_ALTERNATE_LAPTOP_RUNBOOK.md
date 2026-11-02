# RAD-059 — later owner laptop window

**Preparation only; implementation is blocked. Do not apply SQL from this batch.**
The [report](RAD-059_ALTERNATE_REPORT_2026-11-02.md) records the timeout evidence and scope; the [owner reply](DECISIONS.md#rad059-protocol-review-owner-2026-11-02) permits narrow guard expectations and selects multi-RPC protocol review.
The alternate migration and successor check do not yet exist. Steps 2–4 below are a review plan requiring a completed implementation, green required QA and separate owner permission.
Authority: [owner decisions 1–11](DECISIONS.md#rad059-alternate-owner-2026-11-02). No gate opening, worker start, rotation, new role or secret Enable belongs to this window.

## Protocol for review — not approved for implementation

The owner selected **independent per-phase limits and a multi-RPC review**. This proposal replaces the original single-call completion contract and needs acceptance before implementation. It requires no new browser dependency or provider account for the alternate.

| Proposed RPC | Fixed contract and authority |
|---|---|
| `emergency_alternate_set_v1(p_target uuid)` / `emergency_alternate_remove_v1()` | Approved owner only via existing is_owner; chosen target must be approved, unsuspended and not pending deletion. Singleton appointment, revision increases on set/remove; no self-appointment by the alternate. |
| `emergency_alternate_read_v1(p_after bigint, p_limit integer)` | Owner-only appointment/audit read, stable cursor and limit1–100; approved-account picker reuses bounded owner directory. No new student-data endpoint. |
| `emergency_stop_v1(p_operation uuid)` | Authenticate auth.uid(), acquire locks, bind operation to caller and current appointment revision; return existing receipt for replay. First call creates a pending operation, not STOPPED. Owner may start independently. |
| `emergency_stop_phase_v1(p_operation uuid, p_phase smallint)` | Only phases0–5; require exact next phase, or return the stored result for an already committed phase. No SQL/role/project/session input. Reauthorize each call and after every lock wait; the client cannot skip phases or act under an old revision. |
| `emergency_stop_receipt_v1(p_operation uuid)` | Reauthorize before returning only the caller's aggregate receipt; owner may read all. A removed/suspended/deleted alternate cannot replay an old success. No student data, identifiers or raw errors. |

Each RPC is a separate committed database request. The browser confirmation starts a finite sequential loop of at most six phase requests and a receipt read, not a timer/daemon/poll. Transport uncertainty stops automatic advancement; retry the **same operation and phase** or read the receipt. A page reload loses no server receipt; a private local incident log records the operation mapping, never Git.

| Phase | Effect and verification scope |
|---|---|
| 0 gate | Exclusive launch_gate lock; insert closed singleton if missing and set enabled=false, preserving reviewed v2 semantics. |
| 1 login_a | NOLOGIN for existing assess_job_a only; absence reported, no role provisioning. |
| 2 login_b | NOLOGIN for existing assess_job_b only; absence harmless and reported. |
| 3 terminate | Across databases, terminate only pg_stat_activity.usename assess_job_a/b (session_user even after SET ROLE); no Supavisor/shared/non-worker termination. |
| 4 freeze | Call unchanged assess.freeze_v2(); preserve original submission/deadline and capture all four reviewed states. |
| 5 verify | Fresh snapshot: one closed gate, existing slots NOLOGIN, zero worker backends and zero unheld sessions using the reviewed v2 predicate. Return counts/phase flags only; cloud/cache claims remain false. |

**Actual deadline enforcement is a release blocker:** the trusted API connection must arm statement_timeout≤5s **before** issuing each phase's top-level SELECT, with lock_timeout=2s. Function SET/set_config does not provide this. Inspect the provider/PostgREST request transaction behavior and prove it with real request-level timeout witnesses before applying. An existing stricter API deadline is acceptable if its behavior is proved; an unbounded/unknown deadline fails closed. No shared-role timeout/settings change is authorized by this proposal.
If the existing gateway cannot prove that guarantee, STOP: a trusted server executor sending SET LOCAL then SELECT as separate commands would need an explicitly reviewed hosting/file scope. Do not hide the gap behind AbortController, a browser timeout, a new extension, a background job or new credentials.
Do not catch QUERY_CANCELED and then continue work inside the same request: the timer is not rearmed. The timed-out phase rolls back its transactional effects; a later, newly bounded receipt/reconciliation request records a fixed timeout/UNKNOWN phase result. Other errors may be caught as fixed codes within the phase. This relocates timeout handling across transactions and is an explicit contract change for review.
Gate/NOLOGIN/freeze commits from earlier phases survive a later failure. Backend termination is nontransactional: a canceled phase may already have killed some sessions, so absence of its receipt is UNKNOWN, never FAILED-with-no-effects. Reconciliation reads actual facts before recording an outcome. A failed phase must be settled explicitly before later phases; it must not block the remaining containment phases permanently.
Proposed lock order for set/remove/start/phase: profiles table SHARE ROW EXCLUSIVE (consistent with existing C2/erasure), affected profile rows in user_id order, emergency singleton, operation row, then gate/sessions for the selected phase. Recheck account, pending deletion and appointment/revision after every wait. Do not hold a sessions lock while attempting worker termination. Prove both winner orders against suspension/deletion and existing start/freeze paths; any lock-order conflict is STOP.
Removal commits a revision change under the same serialization lock. A phase already holding the lock may commit before removal; after removal completes, that account cannot advance a pending operation or obtain a new STOPPED response. Owner continuation starts an independently authorized operation; the removed alternate gains no fallback power.
Proposed receipt states: pending/uncertain internal state never maps to STOPPED. A terminal receipt is STOPPED only when all six phase results are committed and phase5 verifies containment; otherwise PARTIAL if any effect is proven, FAILED if no effect is proven, and UNKNOWN remains visible until reconciled. Receipts include completion time and are historical evidence, not proof of current cloud/cache state.
Abuse control needs a measured, reviewed bound: one pending operation globally, serialized phase advancement, no duplicate audit rows on phase replay. During an active incident reuse the pending operation rather than rate-limit containment. Limit creation of redundant completed-stop receipts only after a current containment check; do not impose a lifetime quota that can block a later incident. Exact retention/capacity limits remain part of implementation review.
Proposed audit: protected actor/action/time/revision/operation/phase flags, owner-only bounded reads, no student/answer/score/secret/raw error. Appointment user FK cascades on deletion; nullable appointed_by/audit actor FKs SET NULL, with no identity tombstone. Extend the anchored D3 FK inventory only in the new migration and prove erasure/reconciliation; if this differs from existing erasure policy, STOP for an explicit decision. Receipt retention and restore handling must follow the existing erasure journal, not recreate deleted identities.
All RPCs: SECURITY DEFINER, search_path='', reviewed SQL owner able to ALTER only the two fixed job roles and terminate their backends; fail preconditions atomically if that authority cannot be held safely. Revoke PUBLIC/anon, grant only intended entrypoints to authenticated; private helpers/API-role table access denied. No gate open, LOGIN, recover/unhold, start, secret, grading, account/group/membership/D3 or appointment power for the alternate.
The owner-panel picker/audit and alternate confirmation UI remain dormant until a separate promotion. The browser has no resume/undo and cannot present six requests as one atomic transaction. EN/AR390/1440/axe, phase replay, disconnect before/after COMMIT, both removal orders, erasure, forbidden APIs and both PostgreSQL modes are required before acceptance. Owner-only cloud steps and channels/ACK stay independent.

## 1. Freeze source and evidence before the window

Use the owner laptop and protected RAD-086 configuration. Pin the reviewed merged preparation SHA, clean checkout, migration SHA256 and successor-check SHA256; agree the later promotion PR and its exact changed catalogue/check paths before any live apply.
Keep the new migration deferred and feature false throughout apply and verification. The current requiredMigrations/checks and marker stay unchanged in preparation:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker
```

Expected `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`.
Read AGENTS/HANDOFF, current status and report. Require both real-PostgreSQL modes used by CI, fresh encrypted backup verification and rehearsal on the restored copy, authorization/removal/concurrency/ACL/erasure proofs, and EN/AR390/1440/axe on the reviewed head.
Retain only the live DB and daily encrypted laptop backup under the accepted one-laptop risk; no third copy is required. Evidence belongs to a protected encrypted local log; Git gets redacted UTC/results only.
Owner/reviewer confirms the live project, existing session-pooler host, port5432, database and TLS CA from [P9](RAD-062_P09_LAPTOP_RUNBOOK.md#1-preconditions--no-mutation). Use `PGSSLMODE=verify-full`; no transaction-pooler/direct-DB substitution or guessed selectors.
Keep `set +x`, `umask 077`, protected password files; never print environment, passwords, connection strings or raw errors. Existing old worker credential must already be local and privately bound to the correct slot/path. If absent, mark revocation **Not run**; never Enable a secret to obtain it.

## 2. Read-only preflight on live; rehearsal on a restored copy

Owner checks dashboard identity and metadata: Scheduler PAUSED/ABSENT, zero pending/running executions, all targeted numeric secret versions DISABLED; FREE project available after inactivity.
Use a fresh administrative connection through the reviewed session-pooler path, with read-only transactions, lock2s/statement5s, to verify:

- Exactly one closed gate; existing assess_job_a required and optional assess_job_b NOLOGIN; no worker backends across databases; no unheld active/grading/grading-failed/awaiting-manual sessions.
- Current reviewed catalogue/ACL/D3 inventory and every current required readiness boolean; false/null/missing/unknown means STOP. Do not apply a historical readiness to a successor catalogue.
- Fresh encrypted RAD-086 backup verified; rehearse apply, missing-prerequisite whole-transaction rollback and successor checks only on a disposable restored target. Keep definition/OID/ACL/config/FK baseline encrypted locally.

Use [unchanged v2 verification](../supabase/checks/assess-emergency-stopped-v2.sql) and [backlog read](../supabase/checks/rad059-backlog-health.sql). Neither proves credential rejection or cloud containment.
If any precheck fails, stop the apply window and preserve containment. Do not repair data/grants or create roles to pass it.

## 3. Apply once, then independently verify — currently blocked

After implementation and review resolve the report's blockers, the intended files are `supabase/migrations/20261102000200_rad059_emergency_alternate.sql` and `supabase/checks/rad059-alternate-ready.sql`.
Their final reviewed bytes must provide atomic prerequisite/anchor assertions and successor catalogue/ACL verification before this plan becomes executable.
Apply the reviewed migration once with `psql -X -v ON_ERROR_STOP=1 -f` only in a separately authorized live window. Expect one COMMIT. A connection loss around COMMIT is UNKNOWN: inspect independently, never rerun automatically.
On a new connection run the new successor check, unchanged compatible required checks, and v2 stop verification. Inspect every boolean; compare protected baseline for changes outside the reviewed scope.
Existing M09/D3 checks fingerprint full assess catalogues: adding tables/functions can require reviewed successor checks in the later promotion PR. Do not edit existing checks or pretend their old digests attest the new catalogue.
Before COMMIT, abort rolls back the migration. After COMMIT, keep containment and prepare a reviewed forward fix; never restore erased accounts or rerun old migrations.

## 4. Live old-credential proof — one attempt only

No non-production project or test roles. No worker startup, LOGIN, secret Enable, credential rotation, worker RPC or repeated probes.
Owner uses the reviewed [phone containment procedure](RAD-059_PHONE_RUNBOOK.md): Pause/Cancel, full v2 stop and COMMIT, then Disable all targeted secret versions. Confirm NOLOGIN and zero worker backends independently.
Record t0 as the latest of stop COMMIT, confirmed termination and confirmed secret DISABLED. Wait **at least120seconds outside any SQL transaction**. Any returning backend or new containment resets t0; a60second snapshot does not satisfy this wait.
Confirm administrative connectivity/TLS on the same path before the attempt; network failure is UNKNOWN. Check the privately verified old credential is already local. A missing/wrong/unproven credential is **Not run**, not AUTH_REJECTED.
The following is a plain-psql procedure, not a new revocation tool. It assumes the reviewed PGHOST/PGPORT/PGDATABASE/PGSSLMODE/PGSSLROOTCERT remain selected, a private old-worker PGUSER and old-password file path have been verified, and the shell runs on the owner's protected laptop.
Store evidence only inside the unlocked encrypted RAD-086 evidence volume, not Downloads, repo or an unencrypted temporary directory. Enter file paths/user selector privately; these are not passwords. Do not copy this block into a CI job.

```bash
set +x
umask 077
read -r -p 'Protected encrypted evidence directory: ' RAD059_EVIDENCE
test -d "$RAD059_EVIDENCE" || exit 1
read -r -p 'Already-local old worker password file path: ' RAD059_OLD_PASSFILE
test -r "$RAD059_OLD_PASSFILE" || { echo 'Not run'; exit 1; }
read -r -p 'Reviewed old worker session-pooler user selector: ' RAD059_OLD_USER
RAD059_ATTEMPT=$(mktemp -d "$RAD059_EVIDENCE/old-credential.XXXXXXXX")
if LC_ALL=C PGUSER="$RAD059_OLD_USER" PGPASSFILE="$RAD059_OLD_PASSFILE" PGCONNECT_TIMEOUT=5 \
 psql -X --no-password -qAt -v ON_ERROR_STOP=1 \
 -c 'begin read only; select 1; rollback;' \
 >"$RAD059_ATTEMPT/stdout" 2>"$RAD059_ATTEMPT/stderr"; then
 RAD059_CLASS=ACCEPTED
elif LC_ALL=C rg -q '^psql: error: connection to server .*FATAL:  (password authentication failed for user|role ".*" is not permitted to log in)' "$RAD059_ATTEMPT/stderr"; then
 RAD059_CLASS=AUTH_REJECTED
else
 RAD059_CLASS=UNKNOWN
fi
printf '%s\n' "$RAD059_CLASS"
unset RAD059_OLD_USER RAD059_OLD_PASSFILE
```

Only this one worker connection attempt is allowed. The query is a read-only constant and psql closes its connection immediately on exit; no interactive worker session is left open. Local raw files remain private and are encrypted at rest; do not print them.
The anchored English libpq FATAL messages are a conservative allowlist. Pooler-specific errors, changed formatting, TLS/DNS/timeout/unavailable project, missing password, or an error after successful authentication stay UNKNOWN. The owner/reviewer must validate the exact provider rejection privately; no broad “any failure means rejected” rule.
ACCEPTED means **FAILED revocation** even if a later check rejects. Immediately run the unchanged owner stop packet to terminate any surviving job-role backends, verify zero, keep gate closed/NOLOGIN/secret DISABLED and record FAILED; do not attempt the old credential again.
AUTH_REJECTED is evidence only for the privately verified credential/path/time; it is not a guarantee for all pooler nodes forever. Record slot expiry as a possible independent cause; never enable LOGIN as a control. UNKNOWN or Not run leaves RAD-059 blocked.
After the attempt, a new administrative connection verifies the unchanged v2 stop counts; owner rechecks cloud metadata. Record t0, attemptUTC, elapsed≥120, classification, containment and redacted results in the encrypted log. No raw errors or account/project identifiers in Git.

## 5. Alternate and channels drill, then a separate promotion PR

The existing P5v2 phone copy/paste drill is **already proven by the owner2026-11-01**; the #205 OPEN ITEM is closed. It does not prove the new alternate or old worker credential rejection.
After the feature is implemented, reviewed and promoted, prove appointment/removal and stop from the alternate's normal account, the30minute absence rule, critical immediate containment, per-signal/per-responder TEST and human ACK, and owner-only cloud steps per the [phone checklist](RAD-059_PHONE_RUNBOOK.md#قرارات2026-11-02--القنوات-والبديلc).
SQL stop while the owner is absent leaves cloud spending containment unproved; lack of provider authority is explicit. No gate opening without adequate coverage.
At the end of successful apply/verification/revocation evidence, prepare a **separate reviewed promotion PR** that moves the new migration from deferred to required, selects the reviewed successor checks, enables the literal feature flag and derives the new marker. The present preparation never changes requiredMigrations/checks/Variables.
Owner alone coordinates the later Variable update and promotion merge in its separately authorized window, followed by normal CI/Deploy Pages and phone checks. No manual extra deployment or gate bypass.
Any pre-promotion alternate app drill must use the reviewed disposable rehearsal build; do not flip a live flag early to manufacture a test. After promotion, prove the live drill before closing RAD-059.
RAD-059 stays open until **channels/ACK + alternate + live revocation** are evidenced and accepted; promotion/merge alone does not close it or authorize exams.
