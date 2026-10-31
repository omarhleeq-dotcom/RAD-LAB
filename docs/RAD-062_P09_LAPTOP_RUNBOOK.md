# RAD-062 P9 — owner laptop CLI, single 3+5a DB day

Authority: [approved plan and owner amendment](RAD-062_3-5A_PLAN_2026-10-30.md#تعديل-المالك-الحاكم-اللابتوب-وcli-واستثناء-الهاتف-للطوارئ), [DECISIONS](DECISIONS.md#rad062-plan-3-5a-owner-2026-10-30), and the owner's P9 instruction. This is a reviewed procedure for later owner execution. This PR executes no live SQL. Merge is dormant. P10 promotion, marker, guards and UI are outside P9.

**Current disposition: conditional STOP.** [P9b proofs and consumer analysis](RAD-062_P09B_REPORT_2026-10-30.md) resolve the two source-level blockers only when the fresh rehearsal passes: effective-equal restored ACLs pass whole-package readiness, real grants fail, normalized B passes the restored pre-M01 copy and rejects M01–M08, and frozen B still passes the unrestored current schema. No required check, migration, classification or marker changes here. Every other STOP below remains. A synthetic pass never substitutes for the owner's restore/version/operational evidence.

**Chosen path (b): DB day and P10 back to back.** Reserve a maximum **60-minute window from first live M01 COMMIT through successful P10 verification/attestation and normal deployment**. Prepare/review P10 and its exact new complete-catalogue checks before starting; book the owner/reviewer and phone rehearsal in that same window. Do not start if the work cannot fit. There is no accepted overnight/intermediate state. If any unexpected failure occurs or the window expires: stop, keep gate closed/NOLOGIN/secret DISABLED, prohibit promotion and new Assess starts, diagnose on a fresh restore and review a forward fix/rescheduled window. Do not roll back blindly or claim the old marker attests the added schema.

B false is an owner verification failure, not a runtime kill switch: the deployed static site does not execute B, and the offline build gate hashes its unchanged bytes without querying DB. No automatic banner, route shutdown or downtime follows from B itself; existing Practice/account/P1 routes remain served. M01 independently enforces names server-side before the new name UI is promoted: invalid/missing names can reject sign-up, account-name writes and Assess entry/start. Closed gate already prevents new Assess attempts; no open assignments/unsettled sessions are allowed. Tell the owner this possible name-validation rejection is the user-visible risk during the window. Do not promise zero behavioural impact or open the gate to test it. P10 deployment/phone failures keep the hold in place.


Use Bash on the owner's laptop, an encrypted local volume excluded from cloud sync, PostgreSQL client tools matching production, Supabase CLI login if needed, Node/npm, Docker and `gcloud` with its own login. Run from repository root on the reviewed commit. Never use shell tracing, command-line passwords, connection strings, terminal recording, `tee`, cloud artifacts, or participant exports. No provider dump is taken in CI or this workspace. Full logical backup is the sole exception for sensitive data files: it stays only on the owner's encrypted laptop, never in Git/chat/PR/cloud. Evidence shared outside the laptop contains counts, versions, checksums and yes/no only.

## 1. Preconditions — no mutation

**Command:**

```bash
set -euo pipefail
set +x
unset PGSERVICE PGSERVICEFILE PGHOSTADDR PGOPTIONS PGPASSFILE
npm run docs:context -- --pr 173
npm run status:summary -- --id RAD-086
node scripts/assess/rad062-db-day.mjs verify
```

**Expected:** #173 merged; reviewed main/commit; RAD-086 actually completed on the laptop, including daily local Docker backups, encrypted reconciliation, tested restore and rejection of the old Supavisor credential/cache. Eight verified migration digests, zero database connections. Do not infer RAD-086 completion from a merged backend PR; the laptop procedure and tools are in the [RAD-086 runbook](RAD-086_LAPTOP_BACKUP_RUNBOOK.md).

**STOP:** unreviewed changes, unverified prerequisite, missing emergency v1 packet, laptop absent, backup/recovery/old-credential rejection unproved. Read [v1 phone packet](RAD-059_PHONE_PACKET.md) and [containment runbook](RAD-059_PHONE_RUNBOOK.md); keep them available independently of this laptop. Do not execute containment SQL just to satisfy this preflight.

Load credentials/selectors into this shell only, using the owner's existing password manager. The following prompts hide the password; input is never written to a file:

```bash
read -r -p 'Expected reviewed Supabase project ref: ' RAD062_EXPECTED_PROJECT_REF
export RAD062_EXPECTED_PROJECT_REF
export PGHOST="db.${RAD062_EXPECTED_PROJECT_REF}.supabase.co"
export PGPORT=5432 PGDATABASE=postgres PGUSER=postgres PGSSLMODE=verify-full
read -r -p 'Local CA certificate path: ' PGSSLROOTCERT
export PGSSLROOTCERT
read -r -s -p 'Database password: ' PGPASSWORD
export PGPASSWORD
read -r -p 'Reviewed cloud project: ' RAD062_CLOUD_PROJECT
export RAD062_CLOUD_PROJECT
live() { node scripts/assess/rad062-db-day.mjs "$@" --live --project-ref "$RAD062_EXPECTED_PROJECT_REF"; }
```

**Expected:** no password output; host is the direct endpoint of exactly the independently confirmed project ref. Helpers reject other endpoints and remote requests missing either explicit selector. Connection strings and service files are unsupported. Do not weaken TLS to make a connection work.

**If the direct endpoint is unreachable** (the owner's laptop and hotspot have no global IPv6, so `db.<ref>.supabase.co` fails with "Network is unreachable"), use the explicit **session-pooler** variant instead of the `PGHOST`/`PGUSER` lines above ([RAD-086 decisions D-A and D-C](DECISIONS.md#rad086-followup-owner-2026-10-31)). The host is copied by the owner from the project's Connect panel (Session pooler tab, port 5432); it is never derived, detected or used as a fallback:

```bash
read -r -p 'Session pooler host from the Connect panel: ' RAD062_POOLER_HOST
export RAD062_POOLER_HOST PGHOST="$RAD062_POOLER_HOST" PGPORT=5432 PGUSER="postgres.${RAD062_EXPECTED_PROJECT_REF}"
live() { node scripts/assess/rad062-db-day.mjs "$@" --live --session-pooler --project-ref "$RAD062_EXPECTED_PROJECT_REF"; }
```

The helper then accepts only a host matching `aws-N-<region>-N.pooler.supabase.com` equal to `RAD062_POOLER_HOST`, user exactly `postgres.<ref>`, port exactly 5432 (the 6543 transaction pooler is refused), `PGSSLMODE=verify-full` and a CA file. It serves `preflight`, `backup`, `counts`, `checks` and, by owner decision D-C (2026-10-31), `apply` with exactly the same selectors; a 6543, host, user or TLS mismatch is refused for `apply` as for every other action. `restore` stays local-only and `verify` stays offline, so neither accepts `--session-pooler`. The direct path above is unchanged.

**Command:**

```bash
gcloud secrets versions list assess-worker-config --project "$RAD062_CLOUD_PROJECT" --format=json |
  jq '{disabled:([.[]|select(.state=="DISABLED")]|length),other:([.[]|select(.state!="DISABLED" and .state!="DESTROYED")]|length)}'
```

**Expected:** metadata only; all existing usable versions DISABLED, `other=0`; independently confirm the reviewed secret/project in Console and Scheduler PAUSED/ABSENT, zero running executions. No Reveal/Download/Enable/start action. Absence or UNKNOWN does not prove disabled. Export the following attestations only after checking the evidence:

```bash
export RAD062_SECRET_STATE=DISABLED RAD062_RAD086_VERIFIED=yes RAD062_V1_PACKET_AT_HAND=yes
live preflight --execute
```

**Expected:** gate_rows=1, open_gates=0, worker_roles=2, login_roles=0, worker_connections=0, open_assignments=0, unsettled_sessions=0; numeric production `server_version_num` recorded privately. Both assess_job_a/b must exist and be NOLOGIN; assess_worker also must not LOGIN. All assignments must already be closed through their authorized workflow, without SQL edits by this runbook.

**STOP:** any nonzero prohibited count, missing role, open assignment, unknown/ENABLED secret, failed CLI/permissions/query, or active/grading/awaiting-manual session. Do not start workers, create roles or close assignments to bypass this stop.

Before taking the backup, inspect frozen B on the **unrestored current live schema**, using the already verified direct PG selectors (read only):

```bash
psql -X -v ON_ERROR_STOP=1 -f supabase/checks/rad085-p1-b-ready.sql
```

**Expected:** every one of the 13 rows ready=true, initialized phase. **STOP:** any false/null/SQL error; do not use the restored-copy diagnostic to excuse drift on the original schema. This owner command is not executed by the agent.

## 2. RAD-086 full logical backup — live reads, local files only

**Command:**

```bash
pg_dump --version
pg_dumpall --version
read -r -p 'New directory on encrypted non-synced laptop volume: ' RAD062_BACKUP_DIR
export RAD062_BACKUP_DIR
mkdir -m 700 "$RAD062_BACKUP_DIR"
live backup
live backup --execute
```

**Expected:** client major matches production (prefer same patch release); first call is dry run with zero connections. Second creates exactly `roles.sql` (all roles, no password verifiers), `project.dump` (full database schema AND data, no schema/table filters), and `checksums.json` outside checkout. It refuses existing output files. Permissions are 0700 directory/0600 files. Roles metadata without reusable passwords is intentional; Auth/schema/data remain in the complete database archive. No table-by-table phone backup or selected participant export substitutes for this backup.

**Command:**

```bash
python3 - <<'PY'
import hashlib,json,os,pathlib
p=pathlib.Path(os.environ['RAD062_BACKUP_DIR'])
h=json.loads((p/'checksums.json').read_text())
assert sorted(h)==['project.dump','roles.sql']
for f,d in h.items():
    assert hashlib.sha256((p/f).read_bytes()).hexdigest()==d
    print(f,d)
PY
```

**Expected:** two SHA-256 values; record these and the reviewed commit/version on the encrypted laptop only. Archive exit zero plus a checksum proves transfer integrity, not restorability. Do not upload the backup or checksum evidence files to this PR.

**STOP:** version incompatibility, permission error, incomplete dump, changed checksum, unclear managed-schema/extension coverage, cloud-synced location or any secret exposure. Partial files are unusable; preserve or remove locally under the owner's policy, then use a new directory for a fresh full backup. No retries that silently omit protected schemas, roles or data.

## 3. Restore, apply M01–M08, verify on local PostgreSQL

Install the same production major/patch as closely as available, with required extensions. Record actual version and every gap. Production compatibility rehearsal also targets PostgreSQL 17.11 per the plan; pinned CI PostgreSQL 18.4 alone does not prove that compatibility. An unavailable matching version/extension or an unexplained catalogue difference stops the day.

Use fresh local paths outside checkout. `initdb` bootstrap role is deliberately different from the roles in the production dump; verify it does not already occur in the production role inventory without printing that inventory. Never restore over an existing local database. Keep PostgreSQL logs on the encrypted volume; no remote listening or payload logging.

**Command:**

```bash
read -r -p 'New encrypted local PostgreSQL data directory: ' RAD062_LOCAL_DATA
read -r -p 'New local Unix socket directory (simple absolute path): ' RAD062_LOCAL_SOCKET
export RAD062_LOCAL_DATA RAD062_LOCAL_SOCKET
mkdir -m 700 "$RAD062_LOCAL_SOCKET"
initdb -D "$RAD062_LOCAL_DATA" -U rad062_restore_admin --auth-local=trust --encoding=UTF8 --no-locale
pg_ctl -D "$RAD062_LOCAL_DATA" -l "$RAD062_LOCAL_DATA/local.log" -o "-c listen_addresses='' -k $RAD062_LOCAL_SOCKET -p 55432 -c log_statement=none -c log_min_error_statement=panic -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0" -w start
PGHOST="$RAD062_LOCAL_SOCKET" PGPORT=55432 PGUSER=rad062_restore_admin PGDATABASE=postgres createdb rad062_rehearsal
localdb() { PGHOST="$RAD062_LOCAL_SOCKET" PGPORT=55432 PGUSER=rad062_restore_admin PGDATABASE=rad062_rehearsal node scripts/assess/rad062-db-day.mjs "$@"; }
localdb restore
localdb restore --execute
localdb preflight --execute
```

**Expected:** zero remote listeners, fresh local DB, checksum-verified roles/schema/data restored with original ownership/ACLs, two restored archives, version recorded. The live environment is never changed by `localdb`. Verify local and production version numbers match as closely as available and document every difference; do not reuse a production socket forward. Never use `--no-owner`, `--no-acl`, ignore restore errors or normalize catalogues to make readiness pass. Managed extensions/roles may require a separately reviewed local reproduction; failure means STOP, not selective restore.

**STOP:** role collision, restore error, mismatch, unknown local data, nonlocal socket or failed preconditions. Nothing in this step touches live. Do not run local role creation or migration history initialization against production.

**Command (eight separate calls, fail-fast):**

```bash
# Before any additions, on the restored copy only:
PGHOST="$RAD062_LOCAL_SOCKET" PGPORT=55432 PGUSER=rad062_restore_admin PGDATABASE=rad062_rehearsal \
  psql -X -v ON_ERROR_STOP=1 -f scripts/assess/sql/rad062-b-diagnostic.sql
localdb apply --migration M01 --execute
localdb apply --migration M02 --execute
localdb apply --migration M03 --execute
localdb apply --migration M04 --execute
localdb apply --migration M05 --execute
localdb apply --migration M06 --execute
localdb apply --migration M07 --execute
localdb apply --migration M08 --execute
# Frozen B is deliberately inspected separately during the bounded window below.
```

**Expected:** cumulative committed migration counts 1 through 8. Each original file retains its own BEGIN, lock timeout 5s, statement timeout 30s and COMMIT; migration history insertion shares that transaction. `checks` still runs **every manifest required check, unchanged**, then `rad062-ready.sql`, and still fails on false/null/error. It is expected to fail at frozen B after M01–M08; do not call that full acceptance. Use the transition inspection below to measure the exact expected failure and verify the remaining checks independently. Intentional false `restore_verified`/`runtime_or_launch_verified` claims remain false and never attest operations.

M06/M08 fail their own entire transaction if any reviewed v1 body anchor is absent. The final readiness check fingerprints bodies, attributes, ACLs, relations and FK inventory; successful COMMIT alone is insufficient. The synthetic command below explicitly witnesses all ten M06 guards and eight M08 patches, forces failure before each COMMIT and compares catalogue/data/ledger rollback in memory:

```bash
node scripts/assess/rad062-restore-rehearsal.mjs
```

**Expected:** exit 0; eight applied, eight rollback witnesses, eighteen anchors, zero effective ACL differences, readiness_passed=1/readiness_failures=0, four tampered-grant failures; original_b_ready=1, restored_b_diagnostic_ready=1, tampered_b_diagnostic_failed=1, post_package_b_diagnostic_failures=7, baseline_check_failures=1 and required_check_failures=1 (frozen B only). This command creates synthetic databases only, never consumes a provider backup or credential. **It is diagnostic QA, not permission to continue after the owner restore/checks fail.**

**STOP:** any unexpected failure above, unavailable 17.11 compatibility proof, readiness false, other required check false or unexplained catalogue/data difference. Frozen B's exact documented catalogue failure is allowed only as a measured transition into immediate P10 under path (b), never as final acceptance. Do not change a required check or classification in P9b. Preserve v1 OIDs/signatures/owners/ACL/config and restored data, allowing only the reviewed M01/M06/M08 body changes. Existing legacy/P1/RAD-060 and P1–P8 semantic/race tests remain required; run `npm run check` and all CI commands recorded in the report before authorizing the day.

### Transition inspection — local restore first, then identical live post-apply reads

Before M01, run the non-required diagnostic above: all 13 rows must be ready=true (default initialized phase). Synthetic QA explicitly selects pre-initializer; never select that phase on production to conceal missing initialization. Frozen B may fail **relations only** on the restored pre-M01 copy due to ACL order; the original unrestored schema must still pass all rows. Any other failure stops.

After M08, inspect the unchanged B and the diagnostic separately on the local copy:

```bash
for RAD062_CHECK in supabase/checks/rad085-p1-b-ready.sql scripts/assess/sql/rad062-b-diagnostic.sql; do
  PGHOST="$RAD062_LOCAL_SOCKET" PGPORT=55432 PGUSER=rad062_restore_admin PGDATABASE=rad062_rehearsal \
    psql -X -v ON_ERROR_STOP=1 -f "$RAD062_CHECK"
done
```

Both must report false **exactly** for columns, constraints, effective_privileges, functions, indexes, relations, triggers; all other rows true. The diagnostic is a B-only baseline, **not** an M08 successor; false after additions is required. Its ACL normalization must not normalize bodies, ignore additions or edit catalogues. SQL exit zero alone does not prove boolean readiness.

For **each other** path in `frontend-schema.json.checks`, and `supabase/checks/rad062-ready.sql`, run the same local `psql -X -v ON_ERROR_STOP=1 -f PATH` command separately; inspect every assertion as true, excluding only the explicitly disclaimed operational claims. No filtering rows, suppressing errors or claiming an overall `checks` pass. The source rehearsal verifies every required file and asserts only B fails. Record counts/yes-no only. Repeat these independent reads on live after M08 using the already verified direct PG selectors (omit the local PG overrides), with the same exact failure set. Any other result means STOP. P10 must replace/promote reviewed checks for the **whole installed catalogue**, run them all successfully, then compute/attest the new marker; do not reuse B or this diagnostic as acceptance.

## 4. Counts only on restored copy

**Command:**

```bash
localdb counts --execute
```

**Expected:** only numeric fields: profiles failing the exact M01 name validator; distinct authors above three drafts, above ten revisions in any one draft, above 4 MiB and 8 MiB logical usage; database bytes and flags for decimal 300/350/400 MB; reserved peak bytes. No names, email, IDs, documents or answers are selected for output. Author usage uses the quota function including drafts/refs/revisions/review packages/provenance/candidates. Actual DB size after restore may differ from live due to bloat; reserve peak headroom, do not infer production capacity solely from restored size.

**STOP:** query failure, non-count output or any unexplained quota violation. Never truncate/delete protected rows to satisfy a limit. At ≥300 MB warn owner and reassess peak; ≥350 MB requires reviewed smaller batches/capacity plan; ≥400 MB stops growth/new starts. For this one fixed migration batch, any ≥300 MB flag or inadequate reserved peak headroom stops until the owner reviews capacity. Preserve existing attempt settlement. Read-only counts authorize no cleanup.

## 5. Live apply — only after every prior gate succeeds

Reaching this step requires the proofs above, reviewed successful owner restore evidence and the booked back-to-back P10 window; no SQL is authorized to the agent by this document.

**Command:**

```bash
node scripts/assess/rad062-db-day.mjs verify
live preflight --execute
# Only after reviewed complete restore, exact transition inspection, all other gates and booked P10 window:
export RAD062_RESTORE_VERIFIED=yes
live apply --migration M01
live apply --migration M01 --execute
live apply --migration M02 --execute
live apply --migration M03 --execute
live apply --migration M04 --execute
live apply --migration M05 --execute
live apply --migration M06 --execute
live apply --migration M07 --execute
live apply --migration M08 --execute
```

**Pooler variant (D-C):** with the `live()` function defined in step 1 for the pooler, the commands above are unchanged: `live` already carries `--session-pooler`, so `preflight`, `apply` and the post-apply reads go through the session pooler (port 5432, `verify-full`). Each migration is still one transaction with its ledger insert; a drop of the pooled connection around COMMIT is UNKNOWN exactly as on the direct path, resolved only by an independent read through the same selectors. The raw `psql` transition reads use the same `PGHOST`/`PGUSER` exports.

**Expected:** verify hashes **all eight actual files** against deferred SHA-256 entries in `frontend-schema.json` before connecting; each apply rechecks them and closed-state conditions. Dry run connects zero times. Apply advances exactly the contiguous eight-version ledger, one transaction per migration. No Supabase `db push`, historical M1–M4/B replay, initializer, generic SQL file flag or unattended all-migration loop. Record counts/exit status per step on the laptop. No password or migration rows are printed.

**STOP at first error, timeout, hash/order mismatch or ambiguous ACK.** Earlier committed migrations stay committed; failed migration and ledger insertion roll back together. Network failure around COMMIT is UNKNOWN until an independent read confirms history and readiness. Never rerun blindly: the helper refuses an already recorded migration. Do not continue the next line after a failed command, or hand-edit the ledger to make it contiguous.

### Failure, forward fix and rollback notes

**Immediate command:**

```bash
live preflight --execute
```

**Expected:** still closed/NOLOGIN/no connections/no open assignments, secret confirmed DISABLED through step 1 metadata command. **STOP:** any unknown state; use the appropriate reviewed emergency packet/owner containment procedure. Pre-M05 uses v1; after complete M01–M08 the owner reviews the v2 exception in step 7. Do not use v1 to claim capture of awaiting-manual.

Prefer a reviewed new forward migration after diagnosing the first failure on a fresh restore. Never change applied migration bytes. M01 restores B function bodies and drops only new validator/trigger/RPC before use; M02 removes only unused v2 objects; M03 restores M02 draft_save_v2 and removes its new quota objects/triggers; M04 removes unused pool objects; M05 removes unused manual/freeze additions; M06 restores saved v1 bodies/attributes and removes unused new objects/column; M07 removes unused manual endpoints; M08 restores its saved patched bodies/ACLs and removes only its unused objects. Dependency removal is reverse M08→M01, based on the actual committed prefix. Exact notes at the top of each migration govern. Never DROP CASCADE, drop v1, erase answers/results/rights/receipts, or extend decided retention. After any use, preserve snapshots and forward-fix only.

There is **no generic destructive rollback command**: stop and prepare/review an exact inverse from the verified backup on a new local copy, prove catalogue/data equality against the pre-day backup, then authorize its live use separately. P9's executable rollback proof is the synthetic failure-before-COMMIT rehearsal in step 3. Full archive recovery is local first, never an unreviewed overwrite of live. A second repair window may be necessary after failure; keep everything dormant and prohibit partial promotion. Record UNKNOWN rather than success if ACK/counter/cross-version evidence is incomplete.

## 6. Live post-apply — independent reads

**Command:**

```bash
# Perform the transition inspection above against live PG selectors first.
# live checks --execute still fails frozen B; it cannot attest final acceptance.
live preflight --execute
live counts --execute
gcloud secrets versions list assess-worker-config --project "$RAD062_CLOUD_PROJECT" --format=json |
  jq '{disabled:([.[]|select(.state=="DISABLED")]|length),other:([.[]|select(.state!="DISABLED" and .state!="DESTROYED")]|length)}'
```

**Expected:** transition inspection matches exactly; every other required check and RAD-062 readiness passes; gate still closed, both logins NOLOGIN, no worker connections/open assignments/unsettled sessions; secret disabled and zero executions. Record actual live database bytes, reserved peak and threshold flags, with counts only. No marker change.

**STOP:** any false/unknown result outside the exact B transition set, changed secret/runtime state, capacity issue or expired/unavailable P10 window. Do not promote or begin a real exam.

## 7. Owner switches to phone — v2 stop dry run and verify

**Exact phone SQL commands:** run the complete SQL block under §1 of [unchanged P5 phone packet](RAD-062_P05_PHONE_PACKET.md#1-الإيقاف--معاملة-واحدة) once, then its §2 independent verify block in a new SQL Editor query after COMMIT. These are the reviewed source commands, not laptop CLI generation. Repeat stop once to prove idempotence, and verify immediately and again after 60 seconds per [RAD-059 runbook](RAD-059_PHONE_RUNBOOK.md). Review Scheduler/executions/secret metadata on the phone, keeping PAUSED/ABSENT, zero runs and DISABLED. Do not create a live attempt, start a worker or enable a secret for the rehearsal.

**Expected:** STOPPED twice; independent STOPPED verification, zero worker backends/unheld sessions, unchanged counts and original timers/answers/results, gate closed. Missing rotation role is visible in packet counts, not hidden as proof of provisioning. Cloud/cache/runtime verification fields remain false until separately proved.

**Owner instruction precedence:** packet prose says after P10; the current P9 instruction explicitly requires this controlled post-install, pre-promotion dry run. This narrow exception applies only after all eight migrations, package readiness and every other gate pass, with only the exact frozen B transition failure measured, with product/worker/secret dormant. Both packet files remain byte-identical. It does not authorize v2 on the current schema or early promotion.

**STOP:** PARTIAL/FAILED/unknown ACK, phone inability, missing awaiting-manual coverage, changed data/timer/counts or any verification/cloud failure. Keep closed and resolve; no written-exam promotion until successful phone evidence.

## 8. Handoff to P10 — no promotion here

**Command:**

```bash
npm run docs:context
npm run status:summary -- --id RAD-062
npm run status:summary -- --id RAD-086
```

**Expected:** owner supplies redacted yes/no/count/version/checksum evidence of RAD-086, complete backup and restore, exact reviewed migration bytes/history, exact transition inspection, package readiness, capacity, and the phone dry run, within the reserved window. No final acceptance until P10 whole-catalogue checks pass. P10 alone reviews required/check classification and guards, computes the real new marker, and the owner sets it after DB-day evidence. P9 leaves the current marker and deployed product unchanged.

**STOP:** any missing evidence or unresolved check/version/rollback issue. Do not mark RAD-062/RAD-086 done from a merge, set a marker, flip availability, open gate, enable logins/secret or claim first-exam readiness. Channels/ACK receipt/alternate responder, privacy/rights/O4 and 4b/5b remain independent.
