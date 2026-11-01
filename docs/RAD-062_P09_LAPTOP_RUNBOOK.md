# RAD-062 P9 — owner laptop CLI, single 3+5a DB day

Authority: [approved plan and owner amendment](RAD-062_3-5A_PLAN_2026-10-30.md#تعديل-المالك-الحاكم-اللابتوب-وcli-واستثناء-الهاتف-للطوارئ), [DECISIONS](DECISIONS.md#rad062-plan-3-5a-owner-2026-10-30), and the owner's P9 instruction. This is a reviewed procedure for later owner execution. This PR executes no live SQL. Merge is dormant. P10 promotion, marker, guards and UI are outside P9.

**Current disposition: conditional STOP.** [P9b proofs and consumer analysis](RAD-062_P09B_REPORT_2026-10-30.md) resolve the two source-level blockers only when the fresh rehearsal passes: effective-equal restored ACLs pass whole-package readiness, real grants fail, normalized B passes the restored pre-M01 copy and rejects M01–M08, and frozen B still passes the unrestored current schema. No required check, migration, classification or marker changes here. Every other STOP below remains. A synthetic pass never substitutes for the owner's restore/version/operational evidence.

**Chosen path (b): DB day and P10 back to back.** Reserve a maximum **60-minute window from first live M01 COMMIT through successful P10 verification/attestation and normal deployment**. Prepare/review P10 and its exact new complete-catalogue checks before starting; book the owner/reviewer and phone rehearsal in that same window. Do not start if the work cannot fit. There is no accepted overnight/intermediate state. If any unexpected failure occurs or the window expires: stop, keep gate closed/NOLOGIN/secret DISABLED, prohibit promotion and new Assess starts, diagnose on a fresh restore and review a forward fix/rescheduled window. Do not roll back blindly or claim the old marker attests the added schema.

B false is an owner verification failure, not a runtime kill switch: the deployed static site does not execute B, and the offline build gate hashes its unchanged bytes without querying DB. No automatic banner, route shutdown or downtime follows from B itself; existing Practice/account/P1 routes remain served. M01 independently enforces names server-side before the new name UI is promoted: invalid/missing names can reject sign-up, account-name writes and Assess entry/start. Closed gate already prevents new Assess attempts; no open assignments/unsettled sessions are allowed. Tell the owner this possible name-validation rejection is the user-visible risk during the window. Do not promise zero behavioural impact or open the gate to test it. P10 deployment/phone failures keep the hold in place.


Use Bash on the owner's laptop, an encrypted local volume excluded from cloud sync, PostgreSQL client tools matching production, Supabase CLI login if needed, Node/npm, Docker and `gcloud` with its own login. Run from repository root on the reviewed commit. Never use shell tracing, command-line passwords, connection strings, terminal recording, `tee`, cloud artifacts, or participant exports. No provider dump is taken in CI or this workspace. Full logical backup is the sole exception for sensitive data files: it stays only on the owner's encrypted laptop, never in Git/chat/PR/cloud. Evidence shared outside the laptop contains counts, versions, checksums and yes/no only.

## P10 window checklist — owner only

**M02 collation STOP — source fix under review.** The pinned PostgreSQL18.4 image with its original en_US.utf8 locale failed `20261030000200_rad062_provenance_v2.sql` with SQLSTATE55000, `unreviewed M02 identity edge`: the same 37 FK edges compared unequal only by order (name columns sort in C, the JSON text keys sorted in the database collation). With owner approval, because M01–M08 were never applied live, P10 now sorts those text keys with `collate "C"` in M02 and M05 and in the text sort keys of `rad062-ready.sql` and `rad062-p1-b-ready.sql`; expected digests are unchanged. Required checks pass on C and en_US.UTF-8 synthetic databases; see the P10 report. Do not book/start the DB-day window or merge P10 until that fix is reviewed and CI `check` is fully green. Restore evidence must preserve the real production encoding/collation/locale provider (precondition in §1), not silently inherit a different local default. The owner-approved order below remains the procedure.

The owner's P10 continuation governs this order. Prepare/review Draft #175 before DB day; only the owner merges inside the booked ≤60-minute window after M01–M08 are applied and verified on live. No agent live SQL, Variable writes, ready/merge/auto-merge, gate opening, LOGIN or secret enablement. The historical P9 transition sections below retain the original B inspections. P10 requires `rad062-p1-b-ready.sql` and `rad062-ready.sql`: before M01 use frozen B; after all eight run **every P10 manifest check** and inspect every readiness boolean as true except explicit operational non-claims. Migration SHA pins in `guardedFeatures.rad062.migrationSha256` match the reviewed bytes (M02/M05 updated by the collation fix).

1. Owner applies M01–M08 on live in order after all P9 prerequisites, and verifies catalogue-probe prefix/hash/closed state and all promoted required checks.
2. Owner sets the new marker Variable from the P10 report/PR body. The agent never sets it.
3. Owner merges P10 in the same window.
4. CI `check` and Deploy Pages must be green for that merged commit through normal automation.
5. Owner checks sign-up, login, Practice and the Assess name gate on the phone; keep launch gate closed, workers NOLOGIN and secret DISABLED.
6. Owner runs the full emergency stop v2 phone dry run and independent verification, including repeat/idempotence and the prescribed 60-second verification. Both packets remain byte-identical.

Until the window, the PR deploy job is expected red **only for the old marker**; CI `check` must be fully green. Any other failure is unexpected and blocks the window. No workflow bypass, skip-ci, manual/extra deployment or hosted preview access.

**Rollback inside the window:** if anything fails after merge, keep gate closed/NOLOGIN/secret DISABLED. Owner first restores the old marker Variable from reviewed pre-P10 evidence, then merges a normal reviewed revert PR for P10 within the window; no reset or force-push. Recheck normal CI/Deploy Pages and phone containment. The revert restores the old source marker contract but leaves M01–M08 installed: it does not claim frozen B accepts the installed catalogue. Preserve data and use the reviewed P9 forward-fix/repair-window procedure for any DB problem; never reopen the gate from the revert alone.

**Staleness:** if main advances before DB day, merge updated main into `rad062/p10-promotion` without rebase/force-push, inspect the diff and unchanged SQL/emergency bytes, rerun affected QA, recompute with `--print-marker`, update the report and PR body only, and re-review before booking the window.

## 1. Preconditions — no mutation

**Command:**

```bash
set -euo pipefail
set +x
unset PGSERVICE PGSERVICEFILE PGHOSTADDR PGOPTIONS PGPASSFILE
npm run docs:context -- --pr 174
npm run status:summary -- --id RAD-086
node scripts/assess/rad062-db-day.mjs verify
```

**Expected:** #174 merged; reviewed main/commit; RAD-086 actually completed on the laptop, including daily local Docker backups, encrypted reconciliation, tested restore and rejection of the old Supavisor credential/cache. Eight verified migration digests, zero database connections. Do not infer RAD-086 completion from a merged backend PR; the laptop procedure and tools are in the [RAD-086 runbook](RAD-086_LAPTOP_BACKUP_RUNBOOK.md).

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

The helper then accepts only a host matching `aws-N-<region>-N.pooler.supabase.com` equal to `RAD062_POOLER_HOST`, user exactly `postgres.<ref>`, port exactly 5432 (the 6543 transaction pooler is refused), `PGSSLMODE=verify-full` and a CA file. It serves `preflight`, `backup`, `counts`, `checks`, read-only `probes` and, by owner decision D-C (2026-10-31), `apply` with exactly the same selectors; a 6543, host, user or TLS mismatch is refused for `apply` as for every other action. `restore` stays local-only and `verify` stays offline, so neither accepts `--session-pooler`. The direct path above is unchanged.

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

Before accepting the rehearsal, the owner checks live database ownership using the verified live selectors above. This command is read-only and prints **yes/no only**; the agent never runs it:

```bash
if ! RAD062_LIVE_OWNER_POSTGRES=$(psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select case when exists (select from pg_database d join pg_roles r on r.oid=d.datdba where d.datname=current_database() and r.rolname='postgres') then 'yes' else 'no' end; rollback;" 2>/dev/null); then
  printf '%s\n' no
  exit 1
fi
printf '%s\n' "$RAD062_LIVE_OWNER_POSTGRES"
test "$RAD062_LIVE_OWNER_POSTGRES" = yes
```

**Expected:** exactly `yes` and exit zero. **STOP:** `no`, error or unknown ownership. A rehearsal result is valid only after this owner check says yes; synthetic success or the image's default roles never proves live parity. Retain the yes/no privately with the reviewed backup evidence before clearing live selectors for §3. This is the [owner-approved temporary ownership condition](DECISIONS.md#rad062-restore-owner-parity-2026-11-01), not permission to change live ownership.

Before taking the backup, inspect frozen B on the **unrestored current live schema**, using the already verified direct PG selectors (read only):

```bash
psql -X -v ON_ERROR_STOP=1 -f supabase/checks/rad085-p1-b-ready.sql
```

**Expected:** every one of the 13 rows ready=true, initialized phase. **STOP:** any false/null/SQL error; do not use the restored-copy diagnostic to excuse drift on the original schema. This owner command is not executed by the agent.

Record the locale identity with the verified live selectors (read only), before any dump. The owner's first RAD-086 run (2026-10-31) observed **ICU `i`, `datlocale=en-US`, `datcollate=datctype=en_US.UTF-8`, UTF8**; never infer libc from the two libc locale fields. Accept exactly `c` (libc, null datlocale) or `i` (ICU, non-empty strictly validated datlocale); STOP for every other provider or invalid locale. This records evidence, not permission to change production.

```bash
RAD062_LOCALE_META=$(psql -X -At -v ON_ERROR_STOP=1 -c "select row_to_json(m) from (select datlocprovider,datlocale,datcollate,datctype from pg_database where datname=current_database()) m")
export RAD062_LOCALE_META
node --input-type=module - <<'JS'
import { validateLocale } from './scripts/ops/laptop-backup-lib.mjs';
validateLocale(JSON.parse(process.env.RAD062_LOCALE_META));
JS
```

**STOP:** missing/invalid metadata, unknown provider, empty ICU datlocale or any query/validation failure. Retain the four fields privately with the backup; no default provider or locale substitution. The reviewed ICU pattern is `^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8}){0,7}$` with absolute end-of-input (no trailing newline). Unsupported ICU forms require review.

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
printf '%s\n' "$RAD062_LOCALE_META" > "$RAD062_BACKUP_DIR/db-meta.json"
chmod 600 "$RAD062_BACKUP_DIR/db-meta.json"
```

**Expected:** client major matches production (prefer same patch release); first call is dry run with zero connections. Second creates exactly `roles.sql` (all roles, no password verifiers), `project.dump` (full database schema AND data, no schema/table filters), and `checksums.json` outside checkout; the following command records the locale identity in `db-meta.json`. It refuses existing output files. Permissions are 0700 directory/0600 files. Roles metadata without reusable passwords is intentional; Auth/schema/data remain in the complete database archive. No table-by-table phone backup or selected participant export substitutes for this backup.

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

## 3. Owner-only RAD-086 Docker restore and full P10 rehearsal

**Ownership parity is conditional on §1:** the owner must obtain `yes` from the live read-only ownership command. The rehearsal alone changes its throwaway restored database owner to postgres before any pre-M01 check, as [approved by the owner](DECISIONS.md#rad062-restore-owner-parity-2026-11-01). This addresses the measured CREATE FUNCTION/42501 STOP caused by the RAD-086 target's administrative ownership; [the P10 report](RAD-062_P10_REPORT_2026-10-30.md) records current CI evidence. Do not book the window or export restore verified before the full command passes and all owner conditions hold.

The owner runs one command from the checkout, using the existing private RAD-086 configuration and its `daily`/latest completed backup. No local PostgreSQL server/client installation is needed. Docker must use the local Unix daemon socket `/var/run/docker.sock`; have the exact image below present (the RAD-086 runbook documents its pull). A missing image/tool is STOP, never a fallback.

**Command (one invocation, fail-fast):**

```bash
node scripts/assess/rad062-laptop-rehearsal.mjs
```

Clear live PG selectors in this shell first. No arguments, live selector, connection URL or non-loopback `PGHOST` is accepted; even a local socket forward supplied through `PGHOST` is refused. The command never reads live. The RAD-086 configuration locates local backup files and the encrypted reconciliation log only; it does not select a provider connection.

The command reuses `laptop-restore-test.mjs` exports and the actual `restoreTest` implementation: `supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`, checksum verification, `prepareRolesSql` including the exact supabase_admin rolconfig post-load check, the two-pass `restorePlan`, event metadata checks and snapshot counts. It uses a fresh throwaway volume and a private Unix socket, `--network none`, no published ports, and teardown in `finally` on success or STOP. It restores neither over an existing DB nor over a provider/socket forward. The default RAD-086 command, outputs and tests retain their accepted behaviour; an optional callback runs this rehearsal before teardown.

**Expected:** target created from template0 with the recorded provider and both libc locale fields: ICU uses `--locale-provider=icu --icu-locale=<datlocale>`, libc uses `--locale-provider=libc`. Provider, datlocale (including null for libc), collate and ctype must all match before and after restore. The bootstrap cluster locale does not determine the target DB locale. Zero remote listeners, fresh local DB, checksum-verified roles/schema/data restored with original ownership/ACLs, two restored archives, version recorded. The server must match the backup's recorded version, exactly 17.11 for the RAD-086 production backup. Record any version gap; unavailable matching version/extension or unexplained catalogue difference stops the day. Never use `--no-owner`, `--no-acl`, ignore restore errors or normalize catalogues to make readiness pass. Managed extension/role reproduction uses the pinned reviewed RAD-086 path; failure means STOP, not selective restore.

After restoreTest finishes, the rehearsal uses docker exec/psql as supabase_admin to run `ALTER DATABASE rad_restore OWNER TO postgres` in the throwaway target only. PostgreSQL 15+ public schema ownership follows pg_database_owner; this restores the database-owner privilege relationship expected from live **only if §1 returned yes**. Before and after the change it compares postgres attributes/config and membership snapshots, verifies postgres remains non-superuser, and verifies the target owner afterwards. No GRANT, role/attribute/config/membership changes, SET ROLE, schema owner changes or migration/check changes. Any mismatch is `database_owner` STOP; the shared RAD-086 restore behaviour and tests are unchanged.

Before M01, the command separately runs the diagnostic and **frozen B**, in the default initialized phase. The diagnostic must pass completely. On this **restored** copy, frozen B must fail **exactly `relations`**, with the other 12 rows ready=true: all 13 original kinds must be present exactly once, and every ready value must be boolean (no nulls). Zero failures, another/additional false kind, missing/unknown/duplicate kinds or SQL error means `pre_frozen_b` STOP. This restores the accepted [P9b ruling and original evidence](RAD-062_P09B_REPORT_2026-10-30.md), superseding the earlier contradictory instruction to require all frozen B rows ready after restore. It is a measured expectation, not a waiver: pinned Supabase17.11 synthetic CI first printed only `["relations"]` before this set was encoded, matching P9b18.4. Frozen B must still be completely ready on the **unrestored live schema** in the owner-only read above. No pre-initializer override or initializer replay is allowed on the restored production copy.

The pinned image uses peer authentication with an ident map for its local socket. Before connecting, the command verifies the first matching rule, assigns a fresh random credential to postgres through local supabase_admin, and prepends only `local rad_restore postgres scram-sha-256` to this throwaway container's HBA. It verifies reload and the rule, and compares postgres role attributes/config and memberships before/after in memory. This socket-authentication step preserves the ownership established by the approved database-owner step above, and leaves object catalogues, grants, role attributes/config, memberships and supautils behaviour intact. The credential travels through stdin after session statement/error-payload logging is disabled, never through argv/env, host files or output. There are still no published ports or network access; the credential and HBA disappear with teardown. Any setup mismatch is `socket_auth` STOP.

It then connects directly as `postgres`, verifying session_user=current_user=postgres and rolsuper=false, and invokes the existing `apply` helper separately for M01 through M08 in order. It never applies as supabase_admin or via SET ROLE from a superuser. If this identity cannot apply the unchanged package under supautils/privileges, **STOP and report**; no elevation or role/catalogue repair.

**Expected:** cumulative committed migration counts 1 through 8. Each original file retains its own BEGIN, lock timeout 5s, statement timeout 30s and COMMIT. The helper submits the source verbatim and reads the fixed catalogue probes before and after it; no ledger row or other live object is added. After M08 every P10 manifest check runs separately, including `rad062-ready.sql` and `rad062-p1-b-ready.sql`, with every assertion true except the explicit false operational non-claims `restore_verified`/`runtime_or_launch_verified`. False/null/error is STOP. Frozen B is inspected separately as a transition witness and is never part of successful P10 acceptance. The command then performs both transition inspections and the §4 counts **before teardown**.

The synthetic CI test alone supplies an explicit diagnostic callback for full PostgreSQL errors; owner main() has no flag or environment switch to enable it. Only numeric counts/yes-no fields or fixed STOP codes reach stdout/stderr; failures identify `restore:<stage>` or the rehearsal stage (including `connect` and `invalid_names` separately from `capacity`), with SQLSTATE/errno class only; no names, data, hosts, passwords or raw driver/restore errors. Successful output includes database_owner_postgres=1, postgres_role_unchanged=1, pre_m01_diagnostic_ready=1, pre_m01_frozen_b_ready=0, pre_m01_frozen_b_failures=1, postgres_non_superuser=1, migrations_committed=8, checks_passed equal to the manifest length, transition_inspections_passed=2, rehearsal_pass=1 and teardown_pass=1. Exit 0 is required. **`RAD062_RESTORE_VERIFIED=yes` may be exported only after this command passes and §1 live ownership is yes**; a standalone RAD-086 restore proof or synthetic pass does not authorize that export.

**STOP:** collation mismatch, missing ICU support or en_US.UTF-8 in the exact local version/image, role collision, restore error, mismatch, unknown local data, nonlocal socket or failed preconditions; unavailable matching 17.11/extensions; any unexpected pre-M01 result, including a frozen B failure set other than exactly relations or any missing/duplicate kind or null; wrong/elevated apply identity; failed migration, required check, transition, counts or teardown. Nothing in this step touches live. Do not create roles or a Supabase migration ledger locally or live to bypass a STOP.

M06/M08 fail their own entire transaction if any reviewed v1 body anchor is absent. The final readiness check fingerprints bodies, attributes, ACLs, relations and FK inventory; successful COMMIT alone is insufficient. The synthetic command below explicitly witnesses all ten M06 guards and eight M08 patches, forces failure before each COMMIT and compares catalogue/data/probe rollback in memory:

```bash
node scripts/assess/rad062-restore-rehearsal.mjs
```

**Expected:** exit 0; source provider/datlocale/collate/ctype reproduced exactly on template0 and independently verified; eight applied, eight rollback witnesses, eighteen anchors, zero effective ACL differences, readiness_passed=1/readiness_failures=0, four tampered-grant failures; original_b_ready=1, restored_b_diagnostic_ready=1, tampered_b_diagnostic_failed=1, post_package_b_diagnostic_failures=7, baseline_check_failures=1 and required_check_failures=1 (frozen B only). This command creates synthetic databases only, never consumes a provider backup or credential. **It is diagnostic QA, not permission to continue after the owner restore/checks fail.**

**STOP:** any unexpected failure above, unavailable 17.11 compatibility proof, readiness false, other required check false or unexplained catalogue/data difference. Frozen B's exact documented catalogue failure is allowed only as a measured transition into immediate P10 under path (b), never as final acceptance. Do not change a required check or classification in P9b. Preserve v1 OIDs/signatures/owners/ACL/config and restored data, allowing only the reviewed M01/M06/M08 body changes. Existing legacy/P1/RAD-060 and P1–P8 semantic/race tests remain required; run `npm run check` and all CI commands recorded in the report before authorizing the day.

### Transition inspection — local restore first, then identical live post-apply reads

The single §3 command performs these inspections on the restored copy before teardown. Before M01, the non-required diagnostic must have all 13 rows ready=true; frozen B must have exactly the false-kind set `{relations}`, all other rows true, all 13 original kinds exactly once, and no nulls. Both use the default initialized phase. Any deviation, including zero failures, is `pre_frozen_b` STOP. Synthetic QA initializes its own empty fixture; it does not weaken the owner's phase requirement. The **unrestored live schema** must pass every frozen B row in the owner-only read above; a restored-copy result never substitutes for that evidence.

After M08, unchanged frozen B and the diagnostic must each report false **exactly** for columns, constraints, effective_privileges, functions, indexes, relations, triggers; all other rows true. The diagnostic is a B-only baseline, not an M08 successor; these seven false rows are required transition evidence. Its ACL normalization must not normalize bodies, ignore additions or edit catalogues. SQL exit zero alone does not prove boolean readiness.

Every path in `frontend-schema.json.checks` runs separately and must pass, including RAD-062 whole-package readiness. No filtering rows, suppressing errors or claiming frozen B passes after M08. Record counts/yes-no only. The frozen B transition witness is outside the P10 manifest. The earlier P9 synthetic baseline failure count of one belongs to its historical B manifest; the current P10 manifest must have zero failures.

The owner repeats the independent transition reads on live after M08 using the already verified live PG selectors (no local PG overrides):

```bash
for RAD062_CHECK in supabase/checks/rad085-p1-b-ready.sql scripts/assess/sql/rad062-b-diagnostic.sql; do
  psql -X -v ON_ERROR_STOP=1 -f "$RAD062_CHECK"
done
```

Repeat each P10 manifest check separately on live and inspect every assertion, excluding only the explicit operational non-claims, with the same exact transition failure set. Any other result means STOP. P10 must promote the reviewed checks for the whole installed catalogue and run them all successfully before computing/attesting the marker; never use frozen B or this diagnostic as acceptance. Live reads remain owner-only, never this rehearsal command.

## 4. Counts only on restored copy

**Command:** included in the single §3 invocation, after all checks/transition inspections and before teardown. Do not reconnect to a removed container or run counts through a live selector.

**Expected:** only numeric fields: profiles failing the exact M01 name validator; distinct authors above three drafts, above ten revisions in any one draft, above 4 MiB and 8 MiB logical usage; database bytes and flags for decimal 300/350/400 MB; reserved peak bytes. No names, email, IDs, documents or answers are selected for output. Author usage uses the quota function including drafts/refs/revisions/review packages/provenance/candidates. Actual DB size after restore may differ from live due to bloat; reserve peak headroom, do not infer production capacity solely from restored size.

**STOP:** query failure, non-count output or any unexplained quota violation. Never truncate/delete protected rows to satisfy a limit. At ≥300 MB warn owner and reassess peak; ≥350 MB requires reviewed smaller batches/capacity plan; ≥400 MB stops growth/new starts. For this one fixed migration batch, any ≥300 MB flag or inadequate reserved peak headroom stops until the owner reviews capacity. Preserve existing attempt settlement. Read-only counts authorize no cleanup.

## 5. Live apply — only after every prior gate succeeds

Reaching this step requires the proofs above, reviewed successful owner restore evidence and the booked back-to-back P10 window; no SQL is authorized to the agent by this document.

**Decision C — catalogue evidence, no ledger:** the owner measured the real latest backup TOC as supabase_migrations schema=0, schema_migrations table=0, assess schema=1 after M01/42P01. All previous installs were SQL Editor/phone packets; a standard Supabase CLI ledger is not a prerequisite. Do not create an eight-row ledger: a later `supabase db push` could otherwise reapply every earlier unrecorded migration. [Decision C and evidence](DECISIONS.md#rad062-catalogue-probes-2026-11-01) supersede historical ledger instructions.

Each fixed probe is `pg_catalog.to_regprocedure(signature) IS NOT NULL`, read without executing the function. Each listed function is new in its own migration's original transaction, false beforehand, and not dropped by later M01–M08. No body digest is needed for these eight new artefacts. These witnesses establish the committed prefix; full catalogue readiness remains independently required and detects body/ACL/catalogue drift.

| Migration | Fixed signature | Reviewed source |
|---|---|---|
| M01 | `public.rad062_valid_full_name(text)` | [own CREATE FUNCTION](../supabase/migrations/20261030000100_rad062_full_name.sql) |
| M02 | `assess.validate_provenance_v2(jsonb,text,boolean)` | [own CREATE FUNCTION](../supabase/migrations/20261030000200_rad062_provenance_v2.sql) |
| M03 | `assess.authoring_limits_v1()` | [own CREATE FUNCTION](../supabase/migrations/20261030000300_rad062_authoring_limits.sql) |
| M04 | `assess.random_pool_maximum_v1(jsonb,jsonb,jsonb)` | [own CREATE FUNCTION](../supabase/migrations/20261030000400_rad062_random_pool.sql) |
| M05 | `assess.freeze_v2()` | [own CREATE FUNCTION](../supabase/migrations/20261030000500_rad062_manual_foundation_freeze.sql) |
| M06 | `assess.require_lifecycle_v2(uuid,integer)` | [own CREATE FUNCTION](../supabase/migrations/20261030000600_rad062_lifecycle_v2.sql) |
| M07 | `assess.manual_authorize_v1(uuid)` | [own CREATE FUNCTION](../supabase/migrations/20261030000700_rad062_manual_grading.sql) |
| M08 | `assess.health_v2()` | [own CREATE FUNCTION](../supabase/migrations/20261030000800_rad062_erasure_operations.sql) |

`live probes --execute` is a read-only, fresh connection using the same selector/TLS/port guards as other reads. It prints only m01..m08 as 0/1, migrations_observed and prefix_contiguous. Before M01 expect all eight=0, migrations_observed=0 and prefix_contiguous=1; after M_n expect precisely m01..m0n=1 and later probes=0. Any hole/null/error is STOP. After an uncertain ACK, a fresh read is mandatory before any recovery decision; the helper never retries automatically.

**Command:**

```bash
node scripts/assess/rad062-db-day.mjs verify
live preflight --execute
live probes --execute
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

**Pooler variant (D-C):** with the `live()` function defined in step 1 for the pooler, the commands above are unchanged: `live` already carries `--session-pooler`, so `preflight`, `apply` and the post-apply reads go through the session pooler (port 5432, `verify-full`). Each migration is still its unchanged source transaction, with catalogue probes before and after; a drop of the pooled connection around COMMIT is UNKNOWN exactly as on the direct path, resolved only by an independent read through the same selectors. The raw `psql` transition reads use the same `PGHOST`/`PGUSER` exports.

**Expected:** verify hashes **all eight actual files** against deferred SHA-256 entries in `frontend-schema.json` before connecting; each apply rechecks them and closed-state conditions. Dry run connects zero times. Apply requires exactly the contiguous prefix of eight reviewed catalogue probes: previous probes true, the selected and later probes false; after COMMIT exactly the prefix including the selected migration must be true. No Supabase `db push`, historical M1–M4/B replay, initializer, generic SQL file flag or unattended all-migration loop. Record counts/exit status per step on the laptop. Only counts/0–1 probe flags are printed, never passwords, catalogue identities or rows.

**STOP at first error, timeout, hash/order mismatch or ambiguous ACK.** Earlier committed migrations stay committed; a failed transaction rolls back its own artefact, so its probe remains false. Network failure around COMMIT is UNKNOWN: stop the apply session, then run `live probes --execute` in a fresh command invocation/connection with the same verified selectors. This read alone resolves which prefix committed; it does not authorize retry or waive readiness. Never rerun blindly: a true selected probe is refused. Do not continue the next line after a failed command, create a ledger, or create/drop/patch probe artefacts to force a prefix. Holes, nulls/errors, unexpected true/false or uncertain fresh reads remain STOP.

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
live probes --execute
live preflight --execute
live counts --execute
gcloud secrets versions list assess-worker-config --project "$RAD062_CLOUD_PROJECT" --format=json |
  jq '{disabled:([.[]|select(.state=="DISABLED")]|length),other:([.[]|select(.state!="DISABLED" and .state!="DESTROYED")]|length)}'
```

**Expected:** m01..m08=1, migrations_observed=8 and prefix_contiguous=1 from the new connection; transition inspection matches exactly; every other required check and RAD-062 readiness passes; gate still closed, both logins NOLOGIN, no worker connections/open assignments/unsettled sessions; secret disabled and zero executions. Record actual live database bytes, reserved peak and threshold flags, with counts only. No marker change.

**STOP:** any false/unknown result outside the exact B transition set, changed secret/runtime state, capacity issue or expired/unavailable P10 window. Do not promote or begin a real exam.

## 7. Owner switches to phone — v2 stop dry run and verify

**Exact phone SQL commands:** run the complete SQL block under §1 of [unchanged P5 phone packet](RAD-062_P05_PHONE_PACKET.md#1-الإيقاف--معاملة-واحدة) once, then its §2 independent verify block in a new SQL Editor query after COMMIT. These are the reviewed source commands, not laptop CLI generation. Repeat stop once to prove idempotence, and verify immediately and again after 60 seconds per [RAD-059 runbook](RAD-059_PHONE_RUNBOOK.md). Review Scheduler/executions/secret metadata on the phone, keeping PAUSED/ABSENT, zero runs and DISABLED. Do not create a live attempt, start a worker or enable a secret for the rehearsal.

**Expected:** STOPPED twice; independent STOPPED verification, zero worker backends/unheld sessions, unchanged counts and original timers/answers/results, gate closed. Missing rotation role is visible in packet counts, not hidden as proof of provisioning. Cloud/cache/runtime verification fields remain false until separately proved.

**Owner instruction precedence:** the P10 continuation supersedes the earlier P9 timing exception. Run this phone dry run only after all eight migrations and promoted checks pass, the owner sets the marker and merges P10, normal CI/Deploy Pages are green, and the phone product checks above succeed, all inside the same window. This matches packet prose after P10; both packet files remain byte-identical. Never use v2 on an incomplete schema or open the gate for the rehearsal.

**STOP:** PARTIAL/FAILED/unknown ACK, phone inability, missing awaiting-manual coverage, changed data/timer/counts or any verification/cloud failure. Keep closed and resolve; no written-exam promotion until successful phone evidence.

## 8. Owner window completion — no agent promotion

**Command:**

```bash
npm run docs:context
npm run status:summary -- --id RAD-062
npm run status:summary -- --id RAD-086
```

**Expected:** owner supplies redacted yes/no/count/version/checksum evidence of RAD-086, complete backup and restore, exact reviewed migration bytes/catalogue-probe prefix, exact transition inspection, package readiness and capacity before the owner sets the marker and merges P10. Complete the phone checks and v2 dry run after green normal CI/Deploy Pages, within the same reserved window. No final acceptance until all promoted whole-catalogue checks and phone evidence pass. The agent computes the source marker only; the owner alone sets the Variable after DB-day evidence and before merge.

**STOP:** any missing evidence or unresolved check/version/rollback issue. Do not mark RAD-062/RAD-086 done from a merge, set a marker, flip availability, open gate, enable logins/secret or claim first-exam readiness. Channels/ACK receipt/alternate responder, privacy/rights/O4 and 4b/5b remain independent.
