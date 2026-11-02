# RAD-062 M09 — later owner laptop window

**Prepared promotion only. No step below runs until the owner gives separate live permission.** Steps 1–6 use the reviewed pre-promotion main SHA with M09 still deferred; [Draft #200](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/200) is merged only at step 7. [Approved design §4.7](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md), [authority](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02), [server evidence](RAD-062_SUPERVISOR_GRADING_SERVER_REPORT_2026-11-02.md).

Use the owner laptop, protected local RAD-086 configuration and trusted postgres session-pooler connection from [P9](RAD-062_P09_LAPTOP_RUNBOOK.md#1-preconditions--no-mutation). No credentials in arguments, logs, shell history or Git. Commands assume that runbook's verified PGHOST/PGPORT/PGUSER/PGDATABASE/PGSSLMODE=verify-full/PGSSLROOTCERT and protected password file; do not guess selectors or reuse old credentials. Keep `set +x`. Book owner/reviewer and the reviewed coordinated promotion PR before the window; no unattended transition or automatic retry.

## 1. Freeze source, reviews, restore and channels

Only after explicit permission, run **all steps 1–6, including the step-3 rehearsal**, on the reviewed pre-promotion main SHA `3c887cb31f523f3a49128305da50dd433f8e6a0c`, where M09 is still in deferredMigrations. Do not check out the promotion PR for these steps: the owner window uses that reviewed pre-promotion source and its deferred manifest throughout these steps; the promotion PR separately pins the reviewed M09 SHA for either classified state. This PR remains Draft and unmerged until step 7. Set that exact reviewed pre-promotion SHA and source paths:

```bash
set -euo pipefail
set +x
read -r -p 'Reviewed merged commit SHA: ' RAD062_M09_REVIEWED_SHA
test "$(git rev-parse HEAD)" = "$RAD062_M09_REVIEWED_SHA"
test -z "$(git status --porcelain)"
read -r -p 'Reviewed promotion PR head SHA (available locally): ' RAD062_M09_PROMOTION_SHA
[[ "$RAD062_M09_PROMOTION_SHA" =~ ^[0-9a-f]{40}$ ]]
git cat-file -e "${RAD062_M09_PROMOTION_SHA}^{commit}"
test "$(git show "${RAD062_M09_PROMOTION_SHA}:supabase/checks/rad062-p1-b-m09-ready.sql" | sha256sum | cut -d ' ' -f 1)" = 'f286232c9bdd171413c4df20c3e70276c348ca61d8e6d44c7717ece756f3c4a6'
RAD062_M09_SQL=supabase/migrations/20261102000100_rad062_supervisor_grading_authorization.sql
RAD062_M09_READY=supabase/checks/rad062-m09-ready.sql
sha256sum "$RAD062_M09_SQL" "$RAD062_M09_READY"
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker
```

Expected current marker: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`. Independently compare the printed SQL SHA to deferredMigrations.sha256 and the reviewed PR. Required CI must be entirely green, including both M09 PostgreSQL modes, Supabase17.11 ICU and encrypted restore rehearsals. The report's Not run items are blockers until proved; PG18 alone is insufficient. Confirm RAD-086 backup/reconciliation/restore from its own evidence. Check both unchanged phone packets are available independently. STOP for any missing proof.

[RAD-059 delivery ACK/alternate responder](RAD-059_PHONE_RUNBOOK.md) and [RAD-085 rights/privacy/consent](project-status.md) remain gate-opening prerequisites, not M09 apply-window preconditions, per the [owner decision](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02); all other preconditions remain.

Coordinate steps 5–8 before starting: after step 5 verification and step 6 containment, in step 7 the owner opens this GitHub repository's Settings → Secrets and variables → Actions → Variables, sets `PILOT_SCHEMA_VERIFIED` to the exact new marker printed by the separately reviewed promotion PR for `https://vlacestfruxooznrcjqc.supabase.co`, then merges that PR inside this same window before step 8. Its deploy/schema gate is expected to fail while the Variable still holds the old marker; that expected failure never authorizes a gate bypass or an early Variable change. The [promotion report](RAD-062_M09_PROMOTION_REPORT_2026-11-02.md) supplies the reviewed promotion marker and QA limits; this preparation supplies no live permission.

## 2. Read-only preflight on the existing M08 database

Use the exact project and fresh connection; independently verify project identity and currently deployed old marker in dashboard metadata. Observe worker secret DISABLED, Scheduler PAUSED/ABSENT, zero worker executions through the existing [P9 metadata procedure](RAD-062_P09_LAPTOP_RUNBOOK.md). Do not enable or edit Variables, jobs or credentials.

```bash
psql -X -v ON_ERROR_STOP=1 -c "begin read only; select current_database(),current_user,session_user; select count(*)=1 and bool_and(not enabled) closed_gate from assess.launch_gate; select rolname,not rolcanlogin nologin from pg_roles where rolname in ('assess_job_a','assess_job_b','assess_worker'); select count(*)=0 no_worker_connections from pg_stat_activity where usename in ('assess_job_a','assess_job_b','assess_worker'); select inventory=assess.d3_fk_inventory_v1() exact_d3 from assess.erasure_fk_contract; commit;"
psql -X -v ON_ERROR_STOP=1 -f supabase/checks/rad062-ready.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/checks/rad062-p1-b-ready.sql
```

Expected postgres/session identity and approved project, one closed gate, all present worker logins NOLOGIN, no worker connections, exact D3, all six old readiness booleans true. Require assess_job_a present; optional job_b may be absent per P9. Readiness SQL returning false does not make psql fail: inspect **every** row. STOP on false/null/missing/duplicate/unknown state. Never run the new readiness against M08. Keep existing stopped assignments and settled-session constraints from P9; no closing/deleting data to bypass preflight.

## 3. Protect baseline and take a fresh backup; rehearse only the restored copy

```bash
umask 077
RAD062_M09_EVIDENCE=$(mktemp -d "$HOME/rad062-m09-baseline.XXXXXXXX")
chmod 700 "$RAD062_M09_EVIDENCE"
psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select jsonb_build_object('oid',p.oid,'definition',pg_get_functiondef(p.oid),'catalogue',to_jsonb(p)) from pg_proc p where p.pronamespace='assess'::regnamespace order by p.oid; commit;" > "$RAD062_M09_EVIDENCE/functions.jsonl"
psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select jsonb_build_object('oid',oid,'definition',pg_get_constraintdef(oid)) from pg_constraint where contype='f' order by oid; commit;" > "$RAD062_M09_EVIDENCE/fks.jsonl"
node scripts/ops/laptop-backup.mjs run
node scripts/ops/laptop-backup.mjs verify daily
(
 unset PGHOST PGHOSTADDR PGSERVICE PGSERVICEFILE DATABASE_URL SUPABASE_DB_URL RAD062_EXPECTED_PROJECT_REF RAD062_POOLER_HOST
 node scripts/assess/rad062-m09-rehearsal.mjs
)
```

Expected verified encrypted latest backup and rehearsal counts: pre_m08_ready=1, anchor_rollbacks=2, m09_committed=1, post_m09_ready=1, foreign_keys_unchanged=1, teardown_pass=1. The rehearsal uses RAD-086 restoreTest and its counts/ICU/roles verification, then changes only the disposable target. It never reruns M01–M08. It emits no row payloads. Keep evidence encrypted/protected locally under the existing retention policy; no upload or old-backup restoration to live.

## 4. Apply M09 once

Reconfirm permission, SHA, secret DISABLED and closed gate immediately before applying. No changes since backup/preflight; if stale, restart preparation in a newly approved window.

```bash
psql -X -v ON_ERROR_STOP=1 -f "$RAD062_M09_SQL"
```

Expected one COMMIT. Preconditions compare the complete reviewed M08 catalogue; exact counted anchors and property/OID/ACL/config/FK assertions run inside the transaction. Missing/double anchor or drift aborts the **entire** migration. A dropped connection around COMMIT is UNKNOWN: never rerun automatically; use an independent connection and saved definitions to classify old or new catalogue. No schema_migrations history rewrite, drop/recreate, grant or manual body repair.

## 5. Independent post-apply verification

Keep HEAD on the pre-promotion SHA. The new B successor exists only in the reviewed promotion commit: extract its exact bytes from that local Git object into the protected evidence directory and verify SHA256 before executing it. Step 1 must already have confirmed that reviewed commit and artifact are available; do not wait until after live apply to obtain them.

```bash
git show "${RAD062_M09_PROMOTION_SHA}:supabase/checks/rad062-p1-b-m09-ready.sql" > "$RAD062_M09_EVIDENCE/rad062-p1-b-m09-ready.sql"
printf '%s  %s\n' 'f286232c9bdd171413c4df20c3e70276c348ca61d8e6d44c7717ece756f3c4a6' "$RAD062_M09_EVIDENCE/rad062-p1-b-m09-ready.sql" | sha256sum -c -
psql -X -v ON_ERROR_STOP=1 -f "$RAD062_M09_READY"
psql -X -v ON_ERROR_STOP=1 -f "$RAD062_M09_EVIDENCE/rad062-p1-b-m09-ready.sql"
for RAD062_M09_OTHER_CHECK in \
  supabase/checks/training-ready.sql \
  supabase/checks/comparison-ready.sql \
  supabase/checks/assess-mixed-ready.sql \
  supabase/checks/assess-practical-ready.sql \
  supabase/checks/assess-history-ready.sql \
  supabase/checks/assess-retention-ready.sql \
  supabase/checks/owner-dashboard-ready.sql \
  supabase/checks/owner-deletion-surveys-ready.sql
do
  psql -X -v ON_ERROR_STOP=1 -f "$RAD062_M09_OTHER_CHECK"
done
psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select jsonb_build_object('oid',p.oid,'catalogue',to_jsonb(p)-'prosrc') from pg_proc p where p.pronamespace='assess'::regnamespace order by p.oid; select inventory=assess.d3_fk_inventory_v1() exact_d3 from assess.erasure_fk_contract; select count(*)=1 and bool_and(not enabled) closed_gate from assess.launch_gate; commit;" > "$RAD062_M09_EVIDENCE/post.jsonl"
psql -X -qAt -v ON_ERROR_STOP=1 -c "begin read only; select jsonb_build_object('oid',oid,'definition',pg_get_constraintdef(oid)) from pg_constraint where contype='f' order by oid; commit;" > "$RAD062_M09_EVIDENCE/post-fks.jsonl"
cmp "$RAD062_M09_EVIDENCE/fks.jsonl" "$RAD062_M09_EVIDENCE/post-fks.jsonl"
```

All six new M09 readiness booleans true, every rad062-p1-b-m09-ready.sql row true and every boolean assertion in the eight unchanged required checks true (except their explicitly disclaimed operational claims); exact FK identity and unchanged function OID/ACL/owner/config/properties compared with protected baseline; only six reviewed manual function bodies differ. No row changes by M09; inspect application tables via protected local count evidence if needed without printing user data. The block above runs both M09 successors plus all eight unchanged required checks. Replace old rad062-ready with rad062-m09-ready AND old rad062-p1-b-ready with rad062-p1-b-m09-ready, in their original manifest positions. Never run either old rad062-ready.sql or old rad062-p1-b-ready.sql against M09, and never interpret the unchanged dormant marker as attesting M09.

## 6. Phone containment and independent verification

Follow the complete unchanged [P5 v2 packet](RAD-062_P05_PHONE_PACKET.md) stop block on the phone, then its independent verify query in a new SQL Editor connection. Repeat stop for idempotence; verify immediately and after the prescribed60seconds per [RAD-059](RAD-059_PHONE_RUNBOOK.md). Verify PAUSED/ABSENT, zero runs, secret DISABLED and NOLOGIN independently. Preserve [v1 packet](RAD-059_PHONE_PACKET.md) for its original lifecycle; do not use it to claim capture of awaiting-manual. No real attempt or worker startup for this rehearsal. Any affected packet/dry-run is STOP.

## 7. Later coordinated promotion, owner only

Keep steps 1–6 on the reviewed pre-promotion main SHA above. After successful step 5 verification and step 6 containment, the owner alone opens this GitHub repository’s Settings → Secrets and variables → Actions → Variables and sets `PILOT_SCHEMA_VERIFIED` to the exact marker printed from reviewed [Draft #200](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/200) for `https://vlacestfruxooznrcjqc.supabase.co`: `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`. Then the owner merges that PR in this same separately authorized window, before step 8. It moves M09 from deferred to required and replaces exactly the two RAD-062 readiness paths; guardedFeatures.rad062 stays unchanged. Its deploy/schema gate is expected to fail until the Variable is updated here; do not bypass the gate. Do not compute a provisional marker by editing the pre-promotion checkout or attest M09 with the old marker. If the promotion PR, owner permission or new marker is missing, STOP before live step4.

## 8. Normal automation and phone check

Verify normal required CI and Deploy Pages for the promoted merge, then owner phone checks login/Practice/Assess entry and containment. Keep gate closed, worker NOLOGIN, secret DISABLED and no interim MCQ launch until screen5b and every independent launch prerequisite pass. Record actual evidence and unknowns; merge does not prove live verification.

Before COMMIT: rollback restores the whole catalogue. After COMMIT: preserve student results and erasure; diagnose on a fresh restored copy and prepare a reviewed forward migration with gate closed. Never edit applied M09, restore erased identities, delete attempts or re-run old migrations. Any frontend/marker rollback requires its own coordinated reviewed PR and owner window; old readiness cannot validate M09 bodies.

Separate permission text: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة والقنوات، وفق دليل M09 وخطواته1–8 ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
