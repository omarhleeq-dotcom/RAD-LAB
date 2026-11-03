# Assess gate — owner runbook to OPEN for real students and to CLOSE again

**This page is preparation only. It grants no permission and runs nothing.** Opening needs a separate written owner permission (step 0.3). Source authority: [phone restore order](RAD-059_PHONE_RUNBOOK.md#الاستعادة--قرار-مستقل-عكس-الاعتمادات-والبوابة-آخرًا), [window runbook](RAD-085_RAD-059_WINDOW_RUNBOOK.md), [worker LOGIN package](ASSESS_WORKER_LOGIN.md), [RAD-059 decisions 1–14](DECISIONS.md#rad059-alternate-owner-2026-11-02), [Supavisor rule](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01) and the [launch audit](LAUNCH_READINESS_AUDIT_2026-11-02.md).

## Current verdict — read before Wednesday

- **CLOSE (§8) is executable now** from reviewed sources: the phone stop packet, its verification and the cloud steps.
- **OPEN is blocked at §4.** W4 and W7 are STOP and W1/W5/W6 need owner decisions (table below). Do not improvise, and do not run §5 (gate open) while any item is not Ready-for-owner and executed.
- Steps §1–§3 are read-only. You may run them to confirm readiness, but they open nothing.
- D11 (RAD-059 old-credential revocation accepted on the 2026-11-01 Supavisor evidence) is recorded in [launch records](DECISIONS.md#launch-records-owner-2026-11-03).

Status after the [W1–W8 packages](ASSESS_GATE_W_PACKAGES.md) (reviewed and rehearsed locally; nothing run live):

| ID | Item | Status | Package / lifting trigger |
|---|---|---|---|
| W1 | Production role `assess_grading_worker` plus slot `assess_job_b` (only membership that role) | **Decision-needed (D-W1)** | [W1](ASSESS_GATE_W_PACKAGES.md#1-w1--grading-role-and-one-login-slot): provision/check/LOGIN SQL rehearsed in three modes; the binding refuses TEMP and PUBLIC holds TEMP, so the owner decides the PUBLIC TEMP change |
| W2 | LOGIN activation, `VALID UNTIL` ≤90 days, no pasted password | **Ready-for-owner** after W1/W4/W5 | [W2+W3](ASSESS_GATE_W_PACKAGES.md#2-w2w3--activation-transport-and-new-secret-version): SCRAM verifier over `owner_sql` stdin; LOGIN only at 4.3 |
| W3 | New credential (rotation, not Enable) and IAM review | **Ready-for-owner** after W1/W4/W5 | same package: new numeric version, disabled at once; IAM review step W2.4 |
| W4 | Job image from `build-worker.mjs`, pinned by digest | **STOP** | [W4](ASSESS_GATE_W_PACKAGES.md#3-w4--image-stop): that image is synthetic-only; needs a recovery-verifier decision and a reviewed production entrypoint |
| W5 | Network path for the grading worker | **Decision-needed (D-W5)** | [W5](ASSESS_GATE_W_PACKAGES.md#4-w5--network-path-decision-needed): FREE direct host is IPv6-only; credential-free TLS probe Job packaged; options A/B/C |
| W6 | Scheduler / continuous operation | **Decision-needed (D-W6)** | [W6](ASSESS_GATE_W_PACKAGES.md#5-w6--scheduler-decision-proposal): Scheduler absent/paused, sequential manual Execute, one attempt per run, within 24 h |
| W7 | Live end-to-end smoke (§6) | **STOP** | [W7](ASSESS_GATE_W_PACKAGES.md#6-w7--live-smoke-recipe-stop): no written-item path in the deployed v1 UI and no reviewed content install; auto-only recipe ready for later |
| W8 | Opening without a worker | **Rejected (proposed)** | [W8](ASSESS_GATE_W_PACKAGES.md#7-w8--no-worker-opening-proposed-rejected): every submission needs the worker |

## 0. Rules for every step

0.1 Run one numbered step, compare it with **Expected**, then continue. A false/null/missing/duplicate result, a command error, UNKNOWN, or an output you do not recognise means **STOP**. Then keep the gate closed or run §8.
0.2 Never paste passwords, connection strings, emails, UUIDs or screenshots of secrets into Git, chat or shell arguments. Evidence goes to the encrypted RAD-086 store; Git receives only redacted times and results ([decision 6](DECISIONS.md#rad059-alternate-owner-2026-11-02)).
0.3 Permission sentence, which the owner writes in the encrypted log and in the session before §4 (template; fill the brackets privately):

> I, the RAD-LAB owner, permit opening assess.launch_gate on project vlacestfruxooznrcjqc on [YYYY-MM-DD] between [HH:MM] and [HH:MM] UTC for [N] real students, using worker slot assess_job_b, secret version [number] and Job image digest [sha256:…]. Preconditions P1–P12 are evidenced in my encrypted log, items W1–W7 are resolved and W8 recorded rejected by [reviewed PR numbers], and I am the present responder with [the appointed alternate|no alternate] covering.

## 1. Preconditions checklist — every box needs evidence

| # | Precondition | Evidence / expected | Source |
|---|---|---|---|
| P1 | Promotion #213 merged; Variable `PILOT_SCHEMA_VERIFIED` = `pilot-v1:3d8b505ca8605f99f226475ced8e7aa1db576a5829c66cc5e6499e1aab4c18b7` | **Evidenced 2026-11-03 (owner-stated, redacted).** GitHub: merged; Settings → Variables shows the exact value | [window §10](RAD-085_RAD-059_WINDOW_RUNBOOK.md#10-coordinated-promotion-normal-automation-and-owner-checks); marker per the [#217 calibration](RAD-085_PREFLIGHT_CALIBRATION_REPORT_2026-11-03.md) |
| P2 | CI and Deploy Pages green on the merge commit | **Evidenced 2026-11-03 (owner-stated, redacted).** Actions: both workflows succeed on that commit; no bypass | same |
| P3 | Owner phone check after deploy | **Evidenced 2026-11-03 (owner-stated, redacted).** Login, Practice, Assess entry, approved Terms/disclosures, personal v3 re-consent with synthetic accounts | same; [G7](LAUNCH_READINESS_AUDIT_2026-11-02.md#3-الشروط-المفتوحة-بحسب-المهمة) |
| P4 | 0200 and 0300 applied once; successor checks pass | **Evidenced 2026-11-03 (owner-stated, redacted).** Window steps 5–6: every `ok=true` | [window §5–6](RAD-085_RAD-059_WINDOW_RUNBOOK.md#5-apply-0200-exactly-once-verify-before-proceeding) |
| P5 | Old-credential revocation accepted | **Evidenced 2026-11-03 (owner-stated, redacted).** [D11](DECISIONS.md#launch-records-owner-2026-11-03) recorded | [Supavisor rule](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01) |
| P6 | RAD-041 isolation: three phases | **Evidenced 2026-11-03 (owner-stated, redacted).** 9/9 PASS. `pending`: checks 1,2; `approved`: `TOTAL 4 checks: PASS 4 FAIL 0 UNKNOWN 0`; `suspended`: 1,6,5 PASS; no FAIL/UNKNOWN | [RAD-041 runbook §3](RAD-041_LIVE_ISOLATION_RUNBOOK.md#3-المراحل-الثلاث-بالترتيب) |
| P7 | Channels: TEST signal received by each responder; human ACK `ACK / id / UTC / owner\|alternate / action / next check` | **PARTIAL 2026-11-03:** mechanism proven with an owner-controlled test account; a real human alternate is not yet appointed; provider-native alert/budget delivery unproven. Encrypted log rows for budget email, the three alert policies and the Supabase Usage read; receipt proven, not just Save | [decisions 1–2, 6](DECISIONS.md#rad059-alternate-owner-2026-11-02) |
| P8 | Alternate appointed; drill done | **PARTIAL 2026-11-03:** mechanism proven with an owner-controlled test account; a real human alternate is not yet appointed; provider-native alert/budget delivery unproven. Appoint/remove, stop from the alternate account, 30-minute absence rule, critical immediate containment | [alternate §5](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#5-alternate-and-channels-drill-then-a-separate-promotion-pr) |
| P9 | FREE plan inactivity pause checked | **Evidenced 2026-11-03 (owner-stated: project Active).** Dashboard shows the project active; plan for activity under one week. Re-check on the opening day. | [decision 11](DECISIONS.md#rad059-alternate-owner-2026-11-02) |
| P10 | Fresh RAD-086 backup the same day | **Evidenced 2026-11-03 (owner-stated, redacted).** `laptop-backup.mjs verify daily` passes. Repeat on the opening day if it is later. | [RAD-086](RAD-086_LAPTOP_BACKUP_RUNBOOK.md) |
| P11 | Open owner decisions D1–D9 recorded (content/O108, FREE, RAD-047, G8) | **Evidenced 2026-11-03 (owner-stated, redacted).** [D1–D9](DECISIONS.md#launch-records-owner-2026-11-03) recorded | [audit §8](LAUNCH_READINESS_AUDIT_2026-11-02.md#8-قائمة-المالك-الموحدة-والمسار-الحرج-وبرومبت-المتابعة) |
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

**Expected:** `promoted_checks=9`, then exactly `pilot-v1:3d8b505ca8605f99f226475ced8e7aa1db576a5829c66cc5e6499e1aab4c18b7`, the same value as the Variable in P1. **STOP** on a dirty tree, any other marker or an npm error.

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

## 4. Worker enablement — reviewed ORDER, blocked by W4/W7 and owner decisions

This order is fixed by the [phone restore section](RAD-059_PHONE_RUNBOOK.md#الاستعادة--قرار-مستقل-عكس-الاعتمادات-والبوابة-آخرًا). The gate and the Scheduler always come last. Keep the Scheduler PAUSED, the gate closed and zero executions throughout.

| Step | Reviewed action | Status |
|---|---|---|
| 4.1 Image/Job check | [W4 step 6](ASSESS_GATE_W_PACKAGES.md#3-w4--image-stop): image digest equals the reviewed build at the promoted commit; tasks 1, parallelism 1, retries 0, timeout 300 s, CPU 1, 512Mi; numeric secret version | **STOP W4** (no production image yet) |
| 4.2 Secret | Secret Manager → Versions → the version N recorded at W2.2 → Enable; Expected ENABLED; never the revoked version 1, never `latest` | Ready after W2.2; depends on W1/W4/W5 |
| 4.3 Role LOGIN | `owner_sql -f supabase/manual/assess-grading-worker-login.sql` (slot `assess_job_b` only; refuses if the gate is open, `assess_job_a` can log in, expiry is not 1 h–90 days, membership drifted or the group has TEMP). The phone `alter role assess_job_a login` line is **not** usable | Ready after D-W1 and W2 |
| 4.4 Recover frozen attempts | Only owner-selected attempts inside 7 days, one `assess.recover_v1` per transaction, as in phone restore steps 4–5 | Reviewed; run only if V2 showed frozen attempts |
| 4.5 Readiness again | §3.2, then `owner_sql -f supabase/checks/assess-grading-worker-ready.sql`: every row `t` (replaces packet 5.a/5.b, which validate the `assess_worker` model) | Ready after 4.3 |
| 4.6 One bounded run | Only with a separate run permission: Jobs → Execute once. Expected: one completion, matching tick, then zero executions; re-read SQL afterwards. Exit 0 alone proves nothing. One run grades at most one attempt ([W6](ASSESS_GATE_W_PACKAGES.md#5-w6--scheduler-decision-proposal)) | Depends on W1–W5 |
| 4.7 Scheduler | Stays PAUSED/ABSENT under the D-W6 proposal; Resume needs a separate continuous-operation decision | **Decision-needed W6** |

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

## 6. Immediate smoke test — ONE synthetic student (W7 STOP: use the [auto-only recipe](ASSESS_GATE_W_PACKAGES.md#6-w7--live-smoke-recipe-stop))

Use the RAD-041 synthetic student account only, never a real participant. Before and after, run `owner_sql -f supabase/checks/assess-operations-monitor.sql`.
1. As the owner or supervisor: create one assignment for the synthetic group from an available v1 version (auto-graded only; written items have no deployed v1 path, see W7).
2. As the synthetic student on the phone: accept the personal v3 consent, start, answer and submit. **Expected:** a submitted screen; the monitor shows one more `grading` session.
3. Worker: within one bounded run, the auto-graded part is graded. **Expected:** the result is visible to the student; monitor counts settle; zero failed executions. Otherwise **STOP → §8**.
4. Written item and manual finalise: **not executable** with the deployed v1 UI ([W7](ASSESS_GATE_W_PACKAGES.md#6-w7--live-smoke-recipe-stop)); the [5b screen](RAD-062_PHASE5B_SCREEN_REPORT_2026-11-02.md) applies only once a v2 student path exists.
5. Record redacted counts and UTC only. Synthetic rows stay under normal pilot retention. Erasure of synthetic accounts follows the existing owner deletion path (deactivate, then finalise); nothing new is invented here.

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
