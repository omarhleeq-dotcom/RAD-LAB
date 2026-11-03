# Assess gate — owner runbook to OPEN for real students and to CLOSE again

**This page is preparation only. It grants no permission and runs nothing.** Opening needs a separate written owner permission (step 0.3). Source authority: [phone restore order](RAD-059_PHONE_RUNBOOK.md#الاستعادة--قرار-مستقل-عكس-الاعتمادات-والبوابة-آخرًا), [window runbook](RAD-085_RAD-059_WINDOW_RUNBOOK.md), [worker LOGIN package](ASSESS_WORKER_LOGIN.md), [RAD-059 decisions 1–14](DECISIONS.md#rad059-alternate-owner-2026-11-02), [Supavisor rule](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01) and the [launch audit](LAUNCH_READINESS_AUDIT_2026-11-02.md).

## Current verdict — read before Wednesday

- **CLOSE (§8) is executable now** from reviewed sources: the phone stop packet, its verification and the cloud steps.
- **OPEN is blocked at §4.** Several worker-enablement steps have no reviewed source in the repository. They are marked **MISSING** below. Do not improvise them, and do not run §5 (gate open) while any MISSING item is unresolved.
- Steps §1–§3 are read-only. You may run them to confirm readiness, but they open nothing.
- The owner-stated D11 (RAD-059 old-credential revocation accepted on the 2026-11-01 Supavisor evidence) is **not yet recorded in DECISIONS**. Record it after #213, in the next state batch.

| ID | MISSING item | Why there is no reviewed source | Lifting trigger |
|---|---|---|---|
| W1 | Production role `assess_grading_worker` plus a LOGIN slot whose only membership is that role | The current worker binding requires that membership ([server-runtime.ts:109](../src/features/assess/server-runtime.ts)). The role is created only in fixtures ([rehearsal:217](../scripts/assess/rad085-worker-rehearsal.mjs)). The reviewed provision grants `assess_worker` instead ([provision:35](../supabase/manual/assess-worker-login-provision.sql)). | A reviewed migration or manual SQL with a rehearsal, plus an owner decision |
| W2 | LOGIN activation with a new password and `VALID UNTIL` ≤90 days | [ASSESS_WORKER_LOGIN](ASSESS_WORKER_LOGIN.md#الملفات-والمراحل) states there is no activation SQL. The phone line `alter role … login` only re-enables an existing credential. | A reviewed activation transport that never pastes a password |
| W3 | New credential: rotation, not Enable | The revoked old credential must not be reused (D11; [worker report §7](archive/reports/2026-10/RAD-085_WORKER_LOCAL_REPORT_2026-10-26.md#7-المراقبة-والتكلفة-وبوابات-التشغيل): no reuse of historical credentials). The uploader handles version 1 only ([upload-worker-secret.py:16](../scripts/assess/upload-worker-secret.py)). | A reviewed new-version uploader or new secret, plus an IAM review |
| W4 | Cloud Run Job image built from `build-worker.mjs`, pushed and pinned by registry digest | The build is local-only (`runtimeOrLaunchVerified: false`), and no registry was created. The historical trial image is invalid after B8 ([phone runbook](RAD-059_PHONE_RUNBOOK.md#تجهيز-المالك-قبل-نافذة-مستقلة)). | A reviewed push/deploy procedure and digest binding |
| W5 | Network path for the grading worker | The grading binding refuses the session pooler ([server-runtime.ts:49](../src/features/assess/server-runtime.ts)). Reachability of the direct host from Cloud Run is unproven. | A reviewed connection decision and a TLS probe |
| W6 | Scheduler Resume (continuous operation) | The phone runbook allows Resume only with a separate continuous-operation decision that proves no overlap. No such decision exists. | An owner decision (cron, retries 0, maxRetryDuration 0) |
| W7 | Live end-to-end Assess smoke procedure (§6) | No reviewed live smoke script or recipe exists. The UI path in §6 is Inferred. | A reviewed smoke recipe, plus synthetic-data retention/erasure |
| W8 | Opening without a worker (written-only exams) | No source states that a manual-only flow works without the worker, or permits it. | An owner decision after review |

## 0. Rules for every step

0.1 Run one numbered step, compare it with **Expected**, then continue. A false/null/missing/duplicate result, a command error, UNKNOWN, or an output you do not recognise means **STOP**. Then keep the gate closed or run §8.
0.2 Never paste passwords, connection strings, emails, UUIDs or screenshots of secrets into Git, chat or shell arguments. Evidence goes to the encrypted RAD-086 store; Git receives only redacted times and results ([decision 6](DECISIONS.md#rad059-alternate-owner-2026-11-02)).
0.3 Permission sentence, which the owner writes in the encrypted log and in the session before §4 (template; fill the brackets privately):

> I, the RAD-LAB owner, permit opening assess.launch_gate on project vlacestfruxooznrcjqc on [YYYY-MM-DD] between [HH:MM] and [HH:MM] UTC for [N] real students, using worker slot [assess_job_a|assess_job_b], secret version [number] and Job image digest [sha256:…]. Preconditions P1–P12 are evidenced in my encrypted log, MISSING items W1–W8 are resolved by [reviewed PR numbers], and I am the present responder with [the appointed alternate|no alternate] covering.

## 1. Preconditions checklist — every box needs evidence

| # | Precondition | Evidence / expected | Source |
|---|---|---|---|
| P1 | Promotion #213 merged; Variable `PILOT_SCHEMA_VERIFIED` = `pilot-v1:a3d6a4050f7d7a232bea9dac5f8bdeacb1ef5baec6bef5cd6091fed89bb65123` | GitHub: merged; Settings → Variables shows the exact value | [window §10](RAD-085_RAD-059_WINDOW_RUNBOOK.md#10-coordinated-promotion-normal-automation-and-owner-checks) |
| P2 | CI and Deploy Pages green on the merge commit | Actions: both workflows succeed on that commit; no bypass | same |
| P3 | Owner phone check after deploy | Login, Practice, Assess entry, approved Terms/disclosures, personal v3 re-consent with synthetic accounts | same; [G7](LAUNCH_READINESS_AUDIT_2026-11-02.md#3-الشروط-المفتوحة-بحسب-المهمة) |
| P4 | 0200 and 0300 applied once; successor checks pass | Window steps 5–6: every `ok=true` | [window §5–6](RAD-085_RAD-059_WINDOW_RUNBOOK.md#5-apply-0200-exactly-once-verify-before-proceeding) |
| P5 | Old-credential revocation accepted | D11 (owner-stated); recorded in DECISIONS before opening | [Supavisor rule](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01) |
| P6 | RAD-041 isolation: three phases | `pending`: checks 1,2; `approved`: `TOTAL 4 checks: PASS 4 FAIL 0 UNKNOWN 0`; `suspended`: 1,6,5 PASS; no FAIL/UNKNOWN | [RAD-041 runbook §3](RAD-041_LIVE_ISOLATION_RUNBOOK.md#3-المراحل-الثلاث-بالترتيب) |
| P7 | Channels: TEST signal received by each responder; human ACK `ACK / id / UTC / owner\|alternate / action / next check` | Encrypted log rows for budget email, the three alert policies and the Supabase Usage read; receipt proven, not just Save | [decisions 1–2, 6](DECISIONS.md#rad059-alternate-owner-2026-11-02) |
| P8 | Alternate appointed; drill done | Appoint/remove, stop from the alternate account, 30-minute absence rule, critical immediate containment | [alternate §5](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#5-alternate-and-channels-drill-then-a-separate-promotion-pr) |
| P9 | FREE plan inactivity pause checked | Dashboard shows the project active; plan for activity under one week | [decision 11](DECISIONS.md#rad059-alternate-owner-2026-11-02) |
| P10 | Fresh RAD-086 backup the same day | `laptop-backup.mjs verify daily` passes | [RAD-086](RAD-086_LAPTOP_BACKUP_RUNBOOK.md) |
| P11 | Open owner decisions D1–D9 recorded (content/O108, FREE, RAD-047, G8) | DECISIONS entries exist | [audit §8](LAUNCH_READINESS_AUDIT_2026-11-02.md#8-قائمة-المالك-الموحدة-والمسار-الحرج-وبرومبت-المتابعة) |
| P12 | W1–W8 resolved by merged reviewed PRs; permission sentence 0.3 written | PR links in the encrypted log | this page |

## 2. Laptop shell (WSL Ubuntu, `~/RAD-LAB`) — offline checks first

```bash
set -euo pipefail
set +x
umask 077
cd ~/RAD-LAB
test -z "$(git status --porcelain)"
git fetch origin main
git checkout --detach origin/main
NODE_OPTIONS=--dns-result-order=ipv4first npm ci
node -e "const m=require('./scripts/pages/frontend-schema.json');if(!m.checks.includes('supabase/checks/rad085-review-ready.sql')||m.checks.length!==9)throw Error('STOP manifest');console.log('promoted_checks=9')"
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker
```

**Expected:** `promoted_checks=9`, then exactly `pilot-v1:a3d6a4050f7d7a232bea9dac5f8bdeacb1ef5baec6bef5cd6091fed89bb65123`, the same value as the Variable in P1. **STOP** on a dirty tree, any other marker or an npm error.

Next, run the **unchanged** [window step 2 block](RAD-085_RAD-059_WINDOW_RUNBOOK.md#2-select-the-protected-connection-and-evidence-directory) with the same private placeholders. It defines `owner_sql` and `RAD_WINDOW_LOG`. **Expected:** no output. Missing encrypted volume, wrong TLS or a wrong project means **STOP**.

## 3. Read-only preflight (opens nothing)

3.1 Containment, roles and timeout bound. Run the first two `owner_sql` commands of [window step 3](RAD-085_RAD-059_WINDOW_RUNBOOK.md#3-read-only-post-m09-preflight-including-the-authenticated-request-timeout) unchanged. **Expected:** every column `t`, including `closed_gate`, `nologin`, `no_worker_connections`, `exact_d3` and `authenticated_request_bound_ok`.

3.2 The nine promoted checks: the successor plus the eight retained checks. Never run `rad062-m09-ready`, `rad062-p1-b-m09-ready` or `rad059-alternate-ready` after 0300.

```bash
for RAD_GATE_CHECK in $(node -p "require('./scripts/pages/frontend-schema.json').checks.join(' ')"); do
 echo "== $RAD_GATE_CHECK"; owner_sql -f "$RAD_GATE_CHECK"; done
```

**Expected:** every printed assertion true and every `ok=t`. The successor `rad085-review-ready.sql` shows all rows `ok=t`. Exit code 0 alone is not proof; read each row.

3.3 Emergency-stopped state, backlog, erasure and operations.

```bash
owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql
owner_sql -f supabase/checks/rad059-backlog-health.sql
owner_sql -f supabase/checks/rad085-erasure-health.sql
owner_sql -f supabase/checks/assess-operations-monitor.sql
```

**Expected:**
- V2 shows `STOPPED`, `gate_closed=t`, `login_disabled=t`, `backend_sessions=0` and `unheld_sessions=0`. `missing_roles` is 0 or 1. The pooler/cloud fields stay `f` by design.
- Backlog: every `awaiting_manual_ge_*` is 0, and `held` is reviewed before continuing ([phone thresholds](RAD-059_PHONE_RUNBOOK.md)).
- Erasure health: nothing unresolved near day 30 ([daily routine](RAD-085_FIXES_LAPTOP_RUNBOOK.md#المتابعة-اليومية-دون-تمديد)).
- Monitor: `active`, `grading` and grading-failed counts are as expected for a closed gate.
- Any error or timeout is UNKNOWN, never zero. **STOP**.

3.4 Cloud metadata, read-only, from the phone ([phone runbook](RAD-059_PHONE_RUNBOOK.md#تجهيز-المالك-قبل-نافذة-مستقلة)):
- Scheduler is PAUSED or ABSENT.
- Executions: zero running.
- Secret Manager: every numeric version DISABLED.
- Job configuration: record the image digest, tasks, parallelism, retries, timeout and service account. Never use `latest`, and never execute the Job here.

## 4. Worker enablement — reviewed ORDER, blocked by MISSING items

This order is fixed by the [phone restore section](RAD-059_PHONE_RUNBOOK.md#الاستعادة--قرار-مستقل-عكس-الاعتمادات-والبوابة-آخرًا). The gate and the Scheduler always come last. Keep the Scheduler PAUSED, the gate closed and zero executions throughout.

| Step | Reviewed action | Status |
|---|---|---|
| 4.1 Image/Job check | Job → Configuration: image digest equals the reviewed build of `build-worker.mjs` at the promoted commit; limits: task count 1, parallelism 1, retries 0, timeout 300 s, CPU 1, memory 512Mi (proposed for owner decision) | **MISSING W4**: no reviewed pushed image; the trial image is forbidden |
| 4.2 Secret | Decisions require a **new credential (rotation)**. Enabling the revoked old version is forbidden. Only after W3: Secret Manager → Versions → the reviewed new numeric version → Enable; Expected ENABLED; never `latest` | **MISSING W3** |
| 4.3 Role LOGIN | Exactly **one** slot that matches the secret; never both. Read the slots read-only first (phone query: `rolname, rolcanlogin, rolvaliduntil`). The phone `alter role assess_job_a login` line is **not** usable: that slot is a member of `assess_worker`, its old credential is revoked, and the current worker refuses it | **MISSING W1, W2, W5** |
| 4.4 Recover frozen attempts | Only owner-selected attempts inside 7 days, one `assess.recover_v1` per transaction, as in phone restore steps 4–5 | Reviewed; run only if V2 showed frozen attempts |
| 4.5 Readiness again | §3.2 plus the matching LOGIN check of [phone packet 5.a/5.b](RAD-059_PHONE_PACKET.md#5a-فحص-login--اختر-الدور-المطابق-للسر-فقط): `active_catalogue_valid=t` | 5.a/5.b validate the `assess_worker` slot model; for the grading-worker model this is **MISSING W1** |
| 4.6 One bounded run | Only with a separate run permission: Jobs → Execute once. Expected: one completion, matching tick, then zero executions; re-read SQL afterwards. Exit 0 alone proves nothing | Reviewed text; depends on W1–W5 |
| 4.7 Scheduler Resume | Last of all, and only with a continuous-operation decision that proves no overlap; otherwise it stays PAUSED/ABSENT | **MISSING W6** |

## 5. Gate open — exact reviewed SQL (only after §4 is complete and §0.3 is written)

Verbatim from the [phone restore section](RAD-059_PHONE_RUNBOOK.md#الاستعادة--قرار-مستقل-عكس-الاعتمادات-والبوابة-آخرًا). It is the last SQL step and needs a present responder.

```sql
begin;
set local lock_timeout='2s';
set local statement_timeout='5s';
update assess.launch_gate set enabled=true where singleton;
select count(*)=1 and bool_and(enabled) gate_open from assess.launch_gate;
commit;
```

**Expected:** `gate_open=t`, then COMMIT. Any failure, doubt or lost connection means UNKNOWN: run §8 at once. Never rerun automatically.

## 6. Immediate smoke test — ONE synthetic student (MISSING W7: Inferred UI path)

Use the RAD-041 synthetic student account only, never a real participant. Before and after, run `owner_sql -f supabase/checks/assess-operations-monitor.sql`.
1. As the owner or supervisor: create one assignment for the synthetic group, containing one auto-graded item and one written item.
2. As the synthetic student on the phone: accept the personal v3 consent, start, answer and submit. **Expected:** a submitted screen; the monitor shows one more `grading` or `awaiting-manual` session.
3. Worker: within one bounded run, the auto-graded part is graded. **Expected:** the result is visible to the student; monitor counts settle; zero failed executions. Otherwise **STOP → §8**.
4. Written item: owner/supervisor opens the grading entry in Assess ([5b screen](RAD-062_PHASE5B_SCREEN_REPORT_2026-11-02.md)), grades, then finalises. **Expected:** the receipt is shown and the student sees the final result according to visibility. Finalise must happen within 168 h.
5. Record redacted counts and UTC only. Synthetic rows stay under normal pilot retention. Erasure of synthetic accounts follows the existing erasure path; nothing new is invented here.

## 7. First hour monitoring (cadence Inferred: T+0, +15, +30, +60 min)

- Read `assess-operations-monitor.sql` and `rad059-backlog-health.sql` at each mark. Any increase in failed or held sessions, or any UNKNOWN, means §8.
- Cloud Monitoring policies: failure (completed non-success >0 over 5 min), overlap (`running_executions` >1) and long run (>0 for 420 s). Any open incident means §8 ([phone runbook alerts](RAD-059_PHONE_RUNBOOK.md#تشغيل-التنبيهات-لاحقًا--مالك-فقط)).
- Budget email and a manual Supabase Usage read at T+60. Any unexpected spend means §8.
- Acknowledge every signal with an ACK line. If there is no owner ACK within 30 minutes, the alternate stops; for a critical signal, whoever detects it stops immediately ([decision 2](DECISIONS.md#rad059-alternate-owner-2026-11-02)).

## 8. CLOSE / rollback — reviewed, executable now

Phone, in this exact order ([phone runbook table](RAD-059_PHONE_RUNBOOK.md#الإيقاف-الكامل--خطوات-المالك-بالترتيب)):
1. Cloud Scheduler → every schedule targeting the Job → Pause. **Expected:** PAUSED or ABSENT.
2. Cloud Run → Jobs → Executions → Cancel every running execution. **Expected:** zero running.
3. Supabase SQL Editor → assemble the complete [v2 stop block](RAD-062_P05_PHONE_PACKET.md#1-الإيقاف--معاملة-واحدة) → Run once. **Expected:** `STOPPED`, then COMMIT. On PARTIAL/FAILED, keep containment and rerun the whole block after ROLLBACK. The alternate may instead use the in-app "Emergency stop" confirmation (option C), which covers SQL only.
4. Secret Manager → Versions → Disable every targeted numeric version. **Expected:** all DISABLED. Never Reveal, Download or Destroy.
5. New query → [v2 verification](RAD-062_P05_PHONE_PACKET.md#2-تحقق-مستقل-بعد-commit--قراءة-فقط), now and again after 60 s. **Expected:** `STOPPED`, `gate_closed=t`, `login_disabled=t`, `backend_sessions=0`, `unheld_sessions=0`. Re-check Executions, Versions and the Scheduler.

Laptop alternative for step 5: `owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql`.

If a credential was used while the gate was open, it is not revoked until it is proven rejected: terminate sessions, wait ≥120 s outside any transaction, then make one rejection attempt per [window steps 7–8](RAD-085_RAD-059_WINDOW_RUNBOOK.md#7-establish-t0-and-wait-for-the-single-old-credential-attempt). ACCEPTED means FAILED: repeat the stop and keep everything closed. After closing, do not reopen without a new written permission sentence and a full §1–§5 pass.
