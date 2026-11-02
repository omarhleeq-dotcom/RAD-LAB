# RAD-085 / RAD-059 — one owner laptop window

Preparation only; **no live permission is granted by either Draft PR**. The owner and reviewer must approve the final preparation and promotion heads, green required CI and the whole window before step 2. Follow the [M09 pattern](RAD-062_M09_LAPTOP_RUNBOOK.md), [0200 protocol/revocation](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md), [0300 decisions and daily follow-up](RAD-085_FIXES_LAPTOP_RUNBOOK.md), [approved values/text](DECISIONS.md#rad085-owner-approvals-2026-11-02) and [RAD-086 recovery](RAD-086_LAPTOP_BACKUP_RUNBOOK.md).

Use WSL Ubuntu on the owner laptop, repository `~/RAD-LAB`, the existing encrypted RAD-086 store, protected password files and the reviewed postgres **session-pooler** path on port5432. Do not use transaction pooling, guess selectors, obtain secrets, enable LOGIN, appoint an alternate, start a worker or open the gate. Keep both [v1](RAD-059_PHONE_PACKET.md) and [v2](RAD-062_P05_PHONE_PACKET.md) phone packets available independently. Commands are sequential; execute one numbered step, inspect its expected result, then continue. Any false/null/missing/duplicate result, command failure or UNKNOWN means **STOP**. Never paste a whole step into an input prompt; there are no `read` prompts here.

## 1. Freeze both reviewed heads and prepare the shell (offline)

The executable preparation source is pinned below to commit `8edbee944402e351a15c628ae182afa7f5649203` from PR A. The promotion source is pinned to commit `3d6824ff40acd4b5f9e06199a548e6dda0aef65a` from [Draft PR B #213](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/213). Review both pinned commits and final PR documentation before the window. PR A must first be merged; review this pinned source and the final runbook together. Keep this source for steps1–9. Never use PR B's checkout for SQL. Have the promotion reviewed and locally available before live apply; it remains Draft/unmerged pending evidence.

```bash
set -euo pipefail
set +x
umask 077
cd ~/RAD-LAB
export RAD_WINDOW_PREP_SHA='8edbee944402e351a15c628ae182afa7f5649203'
export RAD_WINDOW_PROMOTION_SHA='3d6824ff40acd4b5f9e06199a548e6dda0aef65a'
[[ "$RAD_WINDOW_PREP_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$RAD_WINDOW_PROMOTION_SHA" =~ ^[0-9a-f]{40}$ ]]
test -z "$(git status --porcelain)"
git fetch origin main
git fetch origin "$RAD_WINDOW_PREP_SHA" "$RAD_WINDOW_PROMOTION_SHA"
git cat-file -e "${RAD_WINDOW_PREP_SHA}^{commit}"
git cat-file -e "${RAD_WINDOW_PROMOTION_SHA}^{commit}"
git merge-base --is-ancestor "$RAD_WINDOW_PREP_SHA" origin/main
git checkout --detach "$RAD_WINDOW_PREP_SHA"
test "$(git rev-parse HEAD)" = "$RAD_WINDOW_PREP_SHA"
NODE_OPTIONS=--dns-result-order=ipv4first npm ci
export RAD_WINDOW_0200='supabase/migrations/20261102000200_rad059_emergency_alternate.sql'
export RAD_WINDOW_0300='supabase/migrations/20261102000300_rad085_rights_write_disclosures.sql'
node --input-type=module <<'NODE'
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WINDOW_MIGRATIONS,M09_CHECKS} from './scripts/assess/rad085-window-rehearsal.mjs';
const m=JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8'));
if(JSON.stringify(m.checks)!==JSON.stringify(M09_CHECKS))throw Error('STOP current checks');
for(const [f,sha] of Object.entries(WINDOW_MIGRATIONS)) {
 if(m.requiredMigrations.includes(f)||m.deferredMigrations[f]?.sha256!==sha||
 createHash('sha256').update(readFileSync('supabase/migrations/'+f)).digest('hex')!==sha)throw Error('STOP migration classification/digest');
}
console.log('reviewed_deferred_migrations=2');
NODE
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker
```

Expected `reviewed_deferred_migrations=2` and current marker `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`. Independently compare the currently deployed marker/project in dashboard metadata. STOP for dirty/unreviewed source or a mismatched marker. Required CI must include both embedded and pinned Supabase17.11 ICU modes and the encrypted backup rehearsal; local “Not run” is not proof. Inspect PR B's exact manifest, successor, guards and marker offline now; step10 must already be coordinated with owner/reviewer.

## 2. Select the protected connection and evidence directory

Only after the separate owner permission, unlock the existing encrypted evidence volume. Replace these path/host placeholders privately from the established RAD-086/P9 configuration. They are selectors and paths, **never passwords or connection strings**. Do not put passwords in exports, history or arguments. The existing `pgpass` file must already contain the trusted credential, mode0600, outside Git. Do not print it or the environment.

```bash
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSWORD DATABASE_URL SUPABASE_DB_URL
export PGHOST='REPLACE_WITH_REVIEWED_SESSION_POOLER_HOST'
export PGPORT=5432 PGDATABASE=postgres PGUSER=postgres.vlacestfruxooznrcjqc
export PGSSLMODE=verify-full
export PGSSLROOTCERT='/REPLACE_WITH_EXISTING_CA_PATH'
export PGPASSFILE="$HOME/.config/rad-lab-backup/pgpass"
export PGCONNECT_TIMEOUT=15
export RAD_WINDOW_EVIDENCE='/REPLACE_WITH_UNLOCKED_ENCRYPTED_EVIDENCE_DIRECTORY'
[[ "$PGHOST" != REPLACE_* ]]
[[ "$PGSSLROOTCERT" != /REPLACE_* && "$RAD_WINDOW_EVIDENCE" != /REPLACE_* ]]
test -r "$PGSSLROOTCERT" && test -r "$PGPASSFILE" && test -d "$RAD_WINDOW_EVIDENCE"
test "$(stat -c %a "$PGPASSFILE")" = 600
export RAD_WINDOW_LOG
RAD_WINDOW_LOG=$(mktemp -d "$RAD_WINDOW_EVIDENCE/window.XXXXXXXX")
chmod 700 "$RAD_WINDOW_LOG"
owner_sql() {
 if ! psql -X --no-password -v ON_ERROR_STOP=1 "$@" 2>"$RAD_WINDOW_LOG/last-psql.stderr"; then
  echo 'STOP SQL failure or UNKNOWN; review protected evidence locally; never rerun automatically' >&2
  return 1
 fi
}
```

Expected no output/errors. Independently confirm the host, database, project and certificate with the reviewed configuration, plus Scheduler PAUSED/ABSENT, zero pending/running executions and **all targeted numeric secret versions DISABLED** in provider metadata. Missing encrypted volume/configuration, wrong TLS/project or unproven containment is STOP. Never print the protected stderr file.

## 3. Read-only post-M09 preflight, including the authenticated request timeout

```bash
owner_sql -c "begin read only; set local lock_timeout='2s'; set local statement_timeout='5s'; select current_user='postgres' and session_user='postgres' operator_ok; select count(*)=1 and bool_and(not enabled) closed_gate from assess.launch_gate; select exists(select 1 from pg_roles where rolname='assess_job_a' and not rolcanlogin) required_slot_ok; select not exists(select 1 from pg_roles where rolname in ('assess_job_a','assess_job_b','assess_worker') and rolcanlogin) nologin; select count(*)=0 no_worker_connections from pg_stat_activity where usename in ('assess_job_a','assess_job_b','assess_worker'); select inventory=assess.d3_fk_inventory_v1() exact_d3 from assess.erasure_fk_contract; commit;"
owner_sql <<'SQL'
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
SQL
for RAD_WINDOW_CHECK in \
 supabase/checks/training-ready.sql \
 supabase/checks/comparison-ready.sql \
 supabase/checks/assess-mixed-ready.sql \
 supabase/checks/assess-practical-ready.sql \
 supabase/checks/rad062-p1-b-m09-ready.sql \
 supabase/checks/assess-history-ready.sql \
 supabase/checks/assess-retention-ready.sql \
 supabase/checks/owner-dashboard-ready.sql \
 supabase/checks/owner-deletion-surveys-ready.sql \
 supabase/checks/rad062-m09-ready.sql
do owner_sql -f "$RAD_WINDOW_CHECK"; done
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
owner_sql -f supabase/checks/rad059-backlog-health.sql
```

Expected every assertion true, exactly one `authenticated_request_bound_ok=t`; all10 current checks pass. Unitless timeout means milliseconds; absent/zero/unrecognized/duplicate or >8000ms is STOP, never ALTER configuration to pass. Inspect every result: psql exit0 does not imply true. V2 must say STOPPED, gate_closed/login_disabled=true, backend_sessions/unheld_sessions=0; missing_roles may be0 or1 (job_a required, job_b optional). Its pooler/cloud/runtime proof fields intentionally remain false. Preserve stopped assignments and settled-session requirements from P9. Backlog health must meet the [phone thresholds](RAD-059_PHONE_RUNBOOK.md); warnings/unknowns require review before applying.

## 4. Protect the catalogue, take a fresh encrypted backup and rehearse

```bash
owner_sql -qAt -c "begin read only; select jsonb_build_object('oid',p.oid,'catalogue',to_jsonb(p),'definition',pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('assess','emergency') or (n.nspname='public' and p.prolang in (select oid from pg_language where lanname in ('sql','plpgsql'))) order by p.oid; commit;" > "$RAD_WINDOW_LOG/functions-before.jsonl"
owner_sql -qAt -c "begin read only; select jsonb_build_object('oid',oid,'catalogue',to_jsonb(k),'definition',pg_get_constraintdef(oid)) from pg_constraint k where contype='f' order by oid; commit;" > "$RAD_WINDOW_LOG/fks-before.jsonl"
node scripts/ops/laptop-backup.mjs run
node scripts/ops/laptop-backup.mjs verify daily
(
 unset PGHOST PGHOSTADDR PGSERVICE PGSERVICEFILE DATABASE_URL SUPABASE_DB_URL RAD062_EXPECTED_PROJECT_REF RAD062_POOLER_HOST
 node scripts/assess/rad085-window-rehearsal.mjs
)
```

Expected verified fresh encrypted daily/latest backup. Rehearsal counts: pre_m09_checks=10, order_refused=1, refusal_unchanged=1, alternate_committed=1, alternate_ready=1, review_committed=1, review_ready=1, unchanged_checks=8, baseline_preserved=1, reviewed_added_fks=7, teardown_pass=1. It restores into the pinned Supabase17.11 ICU image with `--network=none`, `--pull=never`, no published ports, then removes the target/volume/socket. Restore checks counts/roles/ICU and journals evidence under RAD-086. Missing image/tool, any STOP or absent teardown proof blocks live apply. No restore to live, no third backup copy, no row payload export. Keep catalogue evidence encrypted locally under existing retention. The rehearsal verifies both migration SHAs against the reviewed deferred manifest before any migration query.

## 5. Apply 0200 exactly once; verify before proceeding

Reconfirm approved heads, current source SHA, unchanged database since backup, closed gate/NOLOGIN/secret DISABLED and permission. No stale backup/preflight. The next command mutates live **only when the owner executes it**.

```bash
test "$(git rev-parse HEAD)" = "$RAD_WINDOW_PREP_SHA"
owner_sql -f "$RAD_WINDOW_0200"
```

Expected exactly one COMMIT. A precondition/lock/timeout failure rolls back the whole transaction; STOP. **Connection loss around COMMIT = UNKNOWN. Never rerun automatically**, even when psql exits nonzero. Classify independently on a fresh connection using protected baseline and successor checks; no history rewrite, partial SQL, drop/recreate or body repair.

On a new connection:

```bash
owner_sql -f supabase/checks/rad059-alternate-ready.sql
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
```

Expected every `ok=true`; V2 STOPPED with zero backends/unheld sessions and required slot present as in step3. Compare baseline existing OIDs/ACL/config/definitions/FKs privately: 0200 adds emergency objects and five reviewed FKs, four to profiles with ON DELETE SET NULL and one phases→operations cascade. Existing functions are unchanged. Any mismatch/unknown is STOP before0300. Do not appoint anyone or exercise emergency RPCs in this step.

## 6. Apply 0300 exactly once; verify the successor

```bash
owner_sql -f "$RAD_WINDOW_0300"
```

Expected exactly one COMMIT; the complete post-0200 catalogue is checked before any new object. Failure/connection loss has the same STOP/UNKNOWN/no-automatic-rerun rule as step5. Never reapply0200 after0300: the old preflight deliberately refuses this catalogue.

```bash
owner_sql -f supabase/checks/rad085-review-ready.sql
for RAD_WINDOW_CHECK in \
 supabase/checks/training-ready.sql \
 supabase/checks/comparison-ready.sql \
 supabase/checks/assess-mixed-ready.sql \
 supabase/checks/assess-practical-ready.sql \
 supabase/checks/assess-history-ready.sql \
 supabase/checks/assess-retention-ready.sql \
 supabase/checks/owner-dashboard-ready.sql \
 supabase/checks/owner-deletion-surveys-ready.sql
do owner_sql -f "$RAD_WINDOW_CHECK"; done
owner_sql -qAt -c "begin read only; select jsonb_build_object('oid',p.oid,'catalogue',to_jsonb(p),'definition',pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('assess','emergency') or (n.nspname='public' and p.prolang in (select oid from pg_language where lanname in ('sql','plpgsql'))) order by p.oid; select inventory=assess.d3_fk_inventory_v1() exact_d3 from assess.erasure_fk_contract; commit;" > "$RAD_WINDOW_LOG/functions-after.jsonl"
owner_sql -qAt -c "begin read only; select jsonb_build_object('oid',oid,'catalogue',to_jsonb(k),'definition',pg_get_constraintdef(oid)) from pg_constraint k where contype='f' order by oid; commit;" > "$RAD_WINDOW_LOG/fks-after.jsonl"
```

Expected all11 successor `ok=true`, all eight retained checks' assertions true. Never run rad062-m09-ready.sql, rad062-p1-b-m09-ready.sql or rad059-alternate-ready.sql after0300. Reviewer compares protected baseline: existing function OIDs/ACL/owner/config/properties and all existing FKs stay identical; only the reviewed function bodies, new consent/quota functions, quota tables/triggers, consent constraint and seven total additive FKs change. Two extra FKs are quota usage→profiles cascade and quota usage→limits. The rehearsal proves the exact changed-body/FK set; live review must match it. STOP on drift; preserve results/erasure and prepare a reviewed forward fix on a fresh restored copy, never restore erased identities.

**Between0300 and promotion:** S1 triggers are active immediately; grading requires personal v3 consent, which the current UI cannot collect until promotion; the P3 opaque request payload is compatible with the current adapter. Keep normal use paused and containment intact. Promotion must follow in this same window after steps7–9; do not postpone it to a later session or open admission to bridge the interval. If any later prerequisite fails, STOP with containment preserved and arrange a reviewed recovery; never promote to hide failed evidence.

## 7. Establish t0 and wait for the single old-credential attempt

On the owner's phone execute the complete unchanged [v2 stop block](RAD-062_P05_PHONE_PACKET.md), COMMIT, and independently verify on a new connection. Follow [RAD-059 containment](RAD-059_PHONE_RUNBOOK.md): Pause/Cancel, confirm zero executions, Disable every targeted secret version. Verify zero worker backends/NOLOGIN. Record t0 only **after** the latest confirmed stop COMMIT, termination and secret DISABLED. Do not Enable a secret to obtain the old credential.

```bash
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
export RAD_WINDOW_T0
RAD_WINDOW_T0=$(date -u +%s)
date -u +%FT%TZ > "$RAD_WINDOW_LOG/t0-utc"
sleep 120
owner_sql -c 'begin read only; select 1 administrative_path_ok; rollback;'
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
test "$(( $(date -u +%s) - RAD_WINDOW_T0 ))" -ge 120
```

Expected STOPPED and admin constant1 over the same trusted TLS/path. Wait≥120seconds **outside any transaction**;60seconds is insufficient. Any returning backend/new stop resets t0 and requires a fresh≥120s wait. Failed admin connectivity/TLS is UNKNOWN, never AUTH_REJECTED; STOP before attempting. The owner/reviewer must privately verify the already-local old password file and exact slot/user/path first.

## 8. One old-credential attempt, never retry

Set the old-user selector/password-file **path** privately; no passwords in this block. Leave placeholders if the credential is absent or unproven; classification is then Not run and the window stops before promotion.

```bash
export RAD_WINDOW_OLD_USER='REPLACE_WITH_VERIFIED_OLD_WORKER_USER_SELECTOR'
export RAD_WINDOW_OLD_PASSFILE='/REPLACE_WITH_ALREADY_LOCAL_OLD_PASSWORD_FILE'
export RAD_WINDOW_CLASS='Not run'
if [[ "$RAD_WINDOW_OLD_USER" != REPLACE_* && "$RAD_WINDOW_OLD_PASSFILE" != /REPLACE_* ]] && test -r "$RAD_WINDOW_OLD_PASSFILE"; then
 export RAD_WINDOW_ATTEMPT
 RAD_WINDOW_ATTEMPT=$(mktemp -d "$RAD_WINDOW_LOG/old-credential.XXXXXXXX")
 date -u +%FT%TZ > "$RAD_WINDOW_ATTEMPT/attempt-utc"
 if LC_ALL=C PGUSER="$RAD_WINDOW_OLD_USER" PGPASSFILE="$RAD_WINDOW_OLD_PASSFILE" PGCONNECT_TIMEOUT=5 \
  psql -X --no-password -qAt -v ON_ERROR_STOP=1 -c 'begin read only; select 1; rollback;' \
  >"$RAD_WINDOW_ATTEMPT/stdout" 2>"$RAD_WINDOW_ATTEMPT/stderr"; then
  RAD_WINDOW_CLASS=ACCEPTED
 elif test "$(LC_ALL=C grep -c '[^[:space:]]' "$RAD_WINDOW_ATTEMPT/stderr" 2>/dev/null)" = 1 && LC_ALL=C grep -Eq '^psql: error: connection to server .*FATAL:  (password authentication failed for user|role ".*" is not permitted to log in)' "$RAD_WINDOW_ATTEMPT/stderr"; then
  RAD_WINDOW_CLASS=AUTH_REJECTED
 else
  RAD_WINDOW_CLASS=UNKNOWN
 fi
fi
printf '%s\n' "$RAD_WINDOW_CLASS" > "$RAD_WINDOW_LOG/revocation-class"
printf '%s\n' "$RAD_WINDOW_CLASS"
unset RAD_WINDOW_OLD_USER RAD_WINDOW_OLD_PASSFILE
```

Expected AUTH_REJECTED **only** for that privately verified credential/path/time and one nonempty anchored English FATAL line. Owner/reviewer validates the provider rejection privately. Mixed/extra lines, pooler-specific errors, changed formatting, DNS/TLS/timeout/unavailable project or errors after authentication = UNKNOWN. Missing/wrong/unproven credential = Not run. ACCEPTED = FAILED revocation; immediately execute unchanged owner stop/termination again and verify zero. No second credential attempt, no worker RPC/startup, LOGIN, rotation or secret Enable. Raw stdout/stderr stays encrypted locally and must never be pasted/committed. Record slot expiry as a possible independent rejection cause. Any classification other than AUTH_REJECTED blocks promotion and leaves RAD-059 unresolved.

## 9. Re-verify containment independently

```bash
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
sleep 60
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
owner_sql -f supabase/checks/rad085-review-ready.sql
test "$RAD_WINDOW_CLASS" = AUTH_REJECTED
```

Expected STOPPED twice, zero worker backends/unheld sessions, NOLOGIN, every successor `ok=true`; owner independently rechecks Scheduler PAUSED/ABSENT, zero executions and all secret versions DISABLED. Repeat the unchanged phone stop block to prove idempotence, independently verify again if executed. Record redacted UTC/counts/classification and t0/attempt elapsed≥120; every mismatch/unknown is STOP. SQL does not prove cloud/cache containment or human ACK.

## 10. Coordinated promotion, normal automation and owner checks

Only after the owner accepts steps1–9 evidence: on GitHub review the exact PR B code commit already frozen at step1 and confirm that later commits only finalize documentation and its separately derived marker. The owner alone sets repository Settings → Secrets and variables → Actions → Variables → `PILOT_SCHEMA_VERIFIED` to **that exact reviewed PR B marker**: `pilot-v1:a3d6a4050f7d7a232bea9dac5f8bdeacb1ef5baec6bef5cd6091fed89bb65123`, then merges the separately approved promotion in this same window. No agent Variable/merge action. Expected deploy/schema gate failure before this Variable change is never bypassed. PR B moves both migrations to required, replaces the obsolete check pair with rad085-review-ready.sql, keeps the eight valid checks, enables both literal guards and pins the new marker. It must not be merged before live evidence.

Expected normal required CI and Deploy Pages success; owner phone checks login/Practice/Assess entry, approved Terms/disclosures and personal v3 re-consent with synthetic accounts. Follow the [alternate appointment/removal and channels/ACK drill](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#5-alternate-and-channels-drill-then-a-separate-promotion-pr) and daily rights/erasure follow-up. Gate stays closed, worker NOLOGIN, secret DISABLED; promotion alone closes neither RAD-059 nor RAD-085 and grants no real-exam launch. No manual deployment, frontend rollback, old SQL rerun or restoration over erased data. Any post-COMMIT recovery requires a reviewed forward change and separate owner action.
