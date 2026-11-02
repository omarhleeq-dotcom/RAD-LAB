# RAD-059 — later owner laptop window

**Prepared dormant implementation. No live step until separate owner permission, complete QA and reviewed promotion artifacts.**
Authority: [decisions 1–11](DECISIONS.md#rad059-alternate-owner-2026-11-02), [multi-RPC direction](DECISIONS.md#rad059-protocol-review-owner-2026-11-02), and [binding decisions 12–14](DECISIONS.md#rad059-implementation-owner-2026-11-02). No gate opening, worker start, rotation, new role or secret Enable belongs to this window.

<a id="protocol-for-review--not-approved-for-implementation"></a>
## Implemented phase protocol — dormant until promotion

The historical anchor above remains for existing links; decisions12–14 authorize implementation and supersede the old five-second proposal. [Report](RAD-059_ALTERNATE_REPORT_2026-11-02.md).
Owner-only set/remove/read RPCs appoint at most one approved account. `emergency_access_v1` reveals only the caller's current capability. `emergency_stop_v1(uuid)` starts/reuses an operation; `emergency_stop_phase_v1(uuid,smallint)` commits one ordered phase; `emergency_stop_receipt_v1(uuid)` reads its aggregate receipt. No actor, role, project or SQL input.

| Phase | Fixed effect |
|---|---|
| 1 | Exclusive gate lock, close admission. |
| 2 | Existing assess_job_a NOLOGIN. |
| 3 | Existing optional assess_job_b NOLOGIN; no role provisioning. |
| 4 | Terminate only those worker session_user identities, across databases and even after SET ROLE. |
| 5 | Unchanged assess.freeze_v2(): hold all four reviewed states without extending submission/deadlines. |
| 6 | Fresh aggregate verification: one closed gate, NOLOGIN, zero worker backends and zero unheld sessions. |

Each call uses the existing authenticated per-request statement_timeout (8s by default), armed by PostgREST before SELECT; no setting change. Each function sets lock_timeout=2s. All new RPCs fix UTC locally to preserve the reviewed v2 168-hour deadlines, even if the API request selects another timezone. A request timeout rolls back only that request; earlier committed phases remain. QUERY_CANCELED is not caught inside the RPC; the client displays UNKNOWN and reads a separate receipt before continuing unfinished phases. Lock/other phase failures record a false phase result and allow the remaining containment phases to proceed. There is no service restart/undo.
Replay returns committed receipts without repeating effects. There is one unfinished operation per actor/revision. Healthy redundant new-operation requests reuse the last STOPPED receipt within30s; any unsafe current fact permits a fresh stop immediately. STOPPED is historical database evidence, never cloud/cache proof.
Lock order: profiles table, emergency singleton, operation, then the phase's gate/sessions locks. Account status/pending deletion and appointment/revision are checked after waits. Removal commits a new revision under the same lock; the removed account cannot obtain a new stop success or advance its old operation. Owner starts an independently authorized operation if needed.
Audit stores actor/action/time/revision/operation and phase booleans only, with owner-only paged reads. Existing C2/D3 erasure sets actor references to NULL and preserves events; no identity tombstone. Appointing does not grant any other product authority or provider access.

### Read-only authenticated request-timeout preflight — STOP if absent or >8s

Run this entire query as the trusted owner connection before apply; it only inspects role configuration. Unitless PostgreSQL timeout values mean milliseconds. Zero/unrecognized/duplicate/absent values fail closed; do not ALTER ROLE/DATABASE or PostgREST to make it pass.

```sql
begin read only;
set local lock_timeout='2s';
set local statement_timeout='5s';
with configured as (
 select regexp_match(split_part(setting,'=',2),'^([0-9]+)(ms|s|min|h|d)?$') parts
 from pg_roles r cross join lateral unnest(r.rolconfig) setting
 where r.rolname='authenticated' and setting like 'statement_timeout=%'
), limits as (
 select (parts[1])::numeric * case coalesce(parts[2],'ms')
  when 'ms' then 1 when 's' then 1000 when 'min' then 60000 when 'h' then 3600000 when 'd' then 86400000 end milliseconds
 from configured
)
select count(*)=1 and coalesce(bool_and(milliseconds>0 and milliseconds<=8000),false) authenticated_request_bound_ok from limits;
rollback;
```

Expected exactly one row, authenticated_request_bound_ok=true. Missing/false/unknown is STOP; the eight-second assumption is not proof. No alternate API request or worker connection is needed for this read.

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

## 3. Apply once, then independently verify

The reviewed files are [migration](../supabase/migrations/20261102000200_rad059_emergency_alternate.sql) and [successor](../supabase/checks/rad059-alternate-ready.sql). Compare their SHA256 with the deferred manifest/review before applying.
The new migration asserts the complete reviewed M09 catalogue, existing NOLOGIN slots and operator authority atomically. It creates only the emergency schema, fixed public RPCs and an additive D3 identity-FK contract; it changes no existing function body or role/database/PostgREST setting.
Apply the migration once with `psql -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261102000200_rad059_emergency_alternate.sql` only in the separately authorized owner window. Expect one COMMIT. Connection loss around COMMIT is UNKNOWN: inspect independently, never rerun automatically.
On a fresh connection run `psql -X -v ON_ERROR_STOP=1 -f supabase/checks/rad059-alternate-ready.sql`, then every unchanged current required check and the v2 independent stop verification. Inspect every boolean, not merely psql exit status. All must pass; expected fingerprints include exact emergency owner/config/ACL/columns/FKs/policies/indexes as well as the unchanged M09 package.
Compare protected baseline OIDs/definitions/ACLs for existing objects; only the reviewed additive identity-FK inventory changes. The new objects live outside assess, so the current M09 catalogue checks remain compatible; promotion adds the new successor while retaining the existing checks.
Before COMMIT, failure rolls back all new objects and the FK inventory update. After COMMIT, keep containment and prepare a reviewed forward fix; never restore erased accounts or rerun old migrations. A dormant frontend is not an attestation of the applied new catalogue.

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
elif test "$(LC_ALL=C grep -c '[^[:space:]]' "$RAD059_ATTEMPT/stderr" 2>/dev/null)" = 1 && LC_ALL=C grep -Eq '^psql: error: connection to server .*FATAL:  (password authentication failed for user|role ".*" is not permitted to log in)' "$RAD059_ATTEMPT/stderr"; then
 RAD059_CLASS=AUTH_REJECTED
else
 RAD059_CLASS=UNKNOWN
fi
printf '%s\n' "$RAD059_CLASS"
unset RAD059_OLD_USER RAD059_OLD_PASSFILE
```

Only this one worker connection attempt is allowed. The query is a read-only constant and psql closes its connection immediately on exit; no interactive worker session is left open. Local raw files remain private and are encrypted at rest; do not print them.
Only one nonempty stderr line matching the anchored English libpq FATAL allowlist can classify AUTH_REJECTED. Mixed failures or extra detail lines remain UNKNOWN. Pooler-specific errors, changed formatting, TLS/DNS/timeout/unavailable project, missing password, or an error after successful authentication stay UNKNOWN. The owner/reviewer must validate the exact provider rejection privately; no broad “any failure means rejected” rule.
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

## 6. Pilot-end audit cleanup

The owner records the announced pilot end privately and schedules deletion of emergency audit/operations within six calendar months of that announcement, alongside the other pilot data under Terms. This is an owner retention obligation, not a new scheduled service.
The private SQL-operator helper `emergency.purge_after_pilot_v1(p_ended_at)` can delete the emergency events and phase receipts after the announced end; it rejects a future end time. It has no API-role EXECUTE grant. Use only the privately verified announcement time in the approved end-of-pilot erasure window, then verify zero emergency audit/operations and cleared appointment identity. Do not retain an identity mapping or reimport erased actor references from backups; follow the existing RAD-086 journal/reconciliation procedure.
