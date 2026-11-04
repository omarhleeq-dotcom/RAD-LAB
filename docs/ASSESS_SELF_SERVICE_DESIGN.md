# Assess self-service exams — design (RAD-105)

**Status: design only. Nothing here is implemented, applied or approved.** No product code, SQL, migration, Google Cloud or Supabase change follows from this file; every phase needs the owner's explicit go ([DECISIONS](DECISIONS.md#assess-self-service-owner-2026-11-05) OD9 resumes Assess *scope*, not any phase). Evidence labels: **Verified** (read in this repository), **Inferred** (reasoned, not run), **Not verified** (outside sources not read here; the phase that depends on it must read them first).

Goal (OD1–OD5): a supervisor schedules an exam in the app and it opens, closes and is graded by itself; the owner is needed only for the emergency stop, which overrides everything.

## 0. What exists today (Verified from source)

- **Gate:** `assess.launch_gate` (one row, `enabled`). It is checked only when a session **starts** (`start_v2`); `command_v2`/submit are authorised by assignment/target/hold, not by the gate. About a dozen check files assert the gate is *closed* (`closed_gate` rows).
- **Assignments:** `assess.assignments(id, owner_id, version_id, revision, source_group_ids, published_at, closed_at)` plus `targets`. There is **no open/close time**; closing is manual (`assignment_close_v2`, revision +1). Duration/maxAttempts live in the immutable published version document (`durationSeconds` 1…604 800).
- **Sessions:** `deadline` is set at start; `claim_v2`/`maintain_v1` move due `active` sessions to `grading`, so expiry needs a *runner*, not a human. `claim_v2` takes one session per call with a lease/token and `for update skip locked` (no double grading).
- **Per-session emergency hold** (`emergency_held_at`) blocks commands and claims: this is the OD5 override and stays as is.
- **Worker:** Cloud Run Job `assess-worker`, 1 task, 0 retries, 300 s, DB role slot `assess_job_b` (NOLOGIN at rest), credential in Secret Manager, no-restore attestation in `assess-worker-recovery` (≤ 48 h, issued by hand). D-W6: one attempt graded per run, run by hand.
- **Authoring/import:** `AuthoringFlow`, `QuestionImport` (+ parser/validator), `assess.authoring_drafts/revisions`, bridge roles; "author notes do NOT create ContentReview" (migration comment).

## 1. Exam windows

**Model.** Add to `assess.assignments`: `opens_at timestamptz`, `closes_at timestamptz` (UTC), both required for new assignments; `check (closes_at > opens_at and closes_at − opens_at ≤ interval '7 days')`. Per-attempt duration stays in the immutable version document (no per-assignment override: the document is reviewed content and the erasure/immutability triggers protect it). Supervisors choose only the window; the UI shows "full-length latest start = closes_at − duration".

**Time.** Stored UTC; entered and shown in Asia/Amman via the browser's IANA database (`Intl`), never a hard-coded offset (Jordan is UTC+3 today; the code must not assume it). Tests cover the conversion both ways and an ambiguous/non-existent local time.

**Enforcement (DB, server clock `clock_timestamp()`):**
- `start_v2`: allow only if `launch_gate.enabled` (global kill switch) **and** `opens_at ≤ now < closes_at` **and** assignment not closed. The existing gate test stays; the window test is added next to it.
- Session deadline: `least(started + duration, closes_at)` (**DS-2**: truncation, no grace — same end time for everyone; recommended).
- `command_v2`/submit: unchanged authority plus `now < deadline` (already implied) and the hold; additionally the kill switch is **not** re-checked mid-attempt (an in-flight student is not cut off by a gate flip; the emergency hold is the tool for that).
- Nothing "opens" or "closes": time comparison does it, so no scheduler is involved in opening.

**Edit/cancel (supervisor, own assignment only):**

| State | Allowed |
|---|---|
| Before `opens_at` | change both times; cancel (`closed_at` set, never opens) |
| Open, no attempt started | shorten `closes_at` (not before now + 1 min), extend up to the 7-day cap, close now |
| Open, attempts exist | close now; extend only; no shortening below existing latest deadline |
| After `closes_at` | none (read-only) |

Each change bumps `revision` and writes the existing audit trail; cap on changes per assignment (e.g. 10) to bound churn. Window length default in the UI: 24 h; hard cap 7 days (**DS-2**).

**Gate semantics (DS-7).** Recommended: the gate stays **enabled permanently** in normal operation and is a pure kill switch (emergency stop closes it; "Resume", §5, reopens it). This keeps the table, ACLs and shapes unchanged. Consequence: the `closed_gate` rows (about a dozen check files) must become "gate state is the expected one" in successor checks (see §9 P0/P1) — they would otherwise fail every preflight.

## 2. Worker automation (Cloud Scheduler)

- **Trigger:** one Cloud Scheduler job, cron `*/5 * * * *`, HTTP target = the Cloud Run Jobs `run` API for `assess-worker`, authenticated by a dedicated service account `assess-scheduler` with permission to run **this one Job only** (resource-level binding, no project-level role). Exact role/permission: **Not verified** — read Google's Cloud Run + Scheduler pages in P4 before writing the script.
- **API:** `cloudscheduler.googleapis.com` must be enabled (it is not today — Scheduler is ABSENT per the 2026-11-04 preflight). Enabling it is a project change, done only in the final window.
- **Always armed:** secret `assess-worker-config` version **ENABLED** permanently and slot `assess_job_b` **LOGIN** permanently; the emergency stop NOLOGINs it (§5). Attestation is retired by §3.
- **Cadence rationale (DS-3, recommended):** fixed 5 minutes; an *idle* run must be cheap: connect, verifier check, "anything due?" query, exit. Student wait for a result ≤ ~5 min + batch time. "Only while a window is open" is not possible with a static cron; the idle-run design gives the same cost effect.
- **Batch:** replace "one attempt per run" (D-W6) by a bounded loop: ≤ 20 attempts or ≤ 240 s per run (task timeout stays 300 s). At 5 min cadence this is ≥ 240 attempts/hour. **S-STD-3 ceiling** and lifting trigger in §9.
- **Overlap/idempotency:** Job `parallelism 1`, `tasks 1`, `max-retries 0`; the run takes a session-level `pg_try_advisory_lock` and a second run exits "busy"; independent of that, `claim_v2` leases + `skip locked` + `finish_v2` token make double-grading impossible (Verified from source). A crashed run's lease expires and the next tick retries (existing 24 h/7 d rules).
- **Cost (Inferred, measure in P3):** 288 runs/day. At ~5–10 s per idle run ≈ 43 000–86 000 vCPU-s/month at 1 vCPU/512 Mi, plus Scheduler's per-job charge. Whether this fits the free tier is **Not verified** (read the pricing pages in P4); the existing 5 USD budget with 10/25/50/80/100 % alerts is the backstop. A side benefit: regular DB activity keeps the free Supabase project from pausing (Inferred).
- **Stop:** the in-app stop (gate closed, slot NOLOGIN, sessions terminated/held) is enough: ticks then fail at login and do nothing. Pausing the Scheduler job stays an optional owner phone step (it cannot be done from the app). Expect failed-execution alerts after a stop; that is the intended reminder (rate-limit the notification channel to 1/h; **DS-8** covers resume).
- **Monitoring (adds to the three existing policies):** (a) no *successful* execution for 30 min while armed (metric absence); (b) worker logs `oldest_pending_seconds`, `credential_days_left`, `batch`, `outcome`; log-based alerts when pending age > 15 min or days left < 30; (c) existing failed/running policies stay.

## 3. Automatic recovery verifier (RAD-097)

**Problem.** A DB-held epoch alone is restored together with the database, so it cannot detect a restore. It needs a monotone value held **outside** the database.

**Design (DS-4, recommended):** DB table `assess.restore_epoch(singleton, epoch uuid, seq bigint, accepted_at)`; function `witness_tick_v1()` (security definer, EXECUTE only for the worker role) increments `seq` and returns `(epoch, seq)`. Outside the DB, a private bucket object `witness.json` `{projectRef, epoch, seq, updatedAt}` readable/writable only by `assess-job` at bucket level, written with a generation precondition. Every run: read witness → `witness_tick_v1()` → require `epoch` equal and `db.seq ≥ witness.seq` → write witness with the new seq → only then claim work.

**Detection.** A restore to any backup older than the last run returns a smaller `seq` (or a different `epoch`) → mismatch. A restore into a *new* project fails the existing `projectRef` binding. Undetected: a restore to a state less than one tick old (no data lost; **S-STD-3 ceiling**).

**Fail closed.** Missing/unreadable witness, malformed JSON, `db.seq < witness.seq`, epoch mismatch, or tick error → `STOP restore-suspected`, no claim, non-zero exit (alerts). The witness stays ahead of the DB, so every later run also stops: it cannot self-heal.

**After a real restore (the only owner step):** reconcile as today (RAD-086 procedure), then one in-app owner action "Accept restored database" (typed confirmation) that writes a new `epoch`, `seq = 0` and `accepted_at`; the worker adopts it only when `accepted_at` is newer than the witness `updatedAt`. Owner-only; the alternate cannot.

**Migration from the attestation:** R1 *shadow* (witness written and compared, result logged, attestation still required) → R2 *enforcing* (attestation not required; rehearsal proves a restored DB image is refused — this is RAD-097's `done_when`) → R3 remove the attestation secret and mount from the Job (using `--remove-volume`, §8 volumes) and retire `recovery-attestation.mjs`. Until R2, M=1 (expires 2026-11-06T22:25Z) is the only protection and nothing real runs.

Alternative not recommended: `pg_control_system().system_identifier` alone — whether an in-place Supabase restore changes it is **Not verified**; kept as an extra field in the witness, not the only check.

## 4. Credential lifecycle (OD4)

Facts: version N=2 is valid until 2026-12-04; a Postgres role can change its own password but not its own `VALID UNTIL`; rotation needs DB admin and Secret Manager write; Supavisor caches credentials (revocation needs NOLOGIN + ≥ 120 s wait + proof the old one is rejected — [RAD-059 item 4](DECISIONS.md#rad059-alternate-owner-2026-11-02), [Supavisor finding](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01)).

| Option | Privilege | Manual work | Failure mode |
|---|---|---|---|
| **A (DS-5, recommended): long validity + alert + one command** | none new | ~once a year, existing `rotate-grading-credential.py` wrapped in one reviewed command, ~10 min | expiry: login fails, worker fails closed, grading delayed (no data loss), alerts fire at 60/30/14/7/1 days before |
| B: automatic rotation | rotator needs `CREATEROLE`-class DB power and Secret Manager version write, so a compromised rotator can mint DB logins | none | rotation half-done = lockout needing the owner anyway |
| C: GitHub Action one-click | stores DB admin + GCP credentials in GitHub | click | widest secret surface |

Recommendation A: set validity to 365 days when the credential is next issued (final window; replaces N=2's December cliff), alert from the worker's `credential_days_left` log field, owner runs the one command yearly. Lifting trigger to B: owner rejects a yearly step *and* a threat review of the rotator is accepted.

Who holds what: owner = DB admin + GCP owner (laptop/phone); `assess-job` SA = accessor on the two secrets + bucket object access; `assess-scheduler` SA = run this Job; worker role = EXECUTE on the five grading functions + `witness_tick_v1` only (no table grants).

## 5. Supervisor and student UX (EN/AR; 390 and 1440)

**Supervisor** (extends the existing authoring and assignment screens; exact component list confirmed by reading them in P2):
1. **Create from the item bank:** pick auto-graded items (up to the existing 200-item draft limit; first exam = 20), preview, submit for the existing validation; no new item types.
2. **Schedule:** opens/closes pickers (Asia/Amman), shows UTC-independent text "opens Sat 09:00 – closes Sat 11:00 (Amman)", latest full-length start, and the cap error in words.
3. **Assign:** groups or "all students"; existing target review/confirm step.
4. **Live status** (paged, ≤ 200 rows per page, server-side): not started / in progress / submitted / graded / missed, with counts and last-update time.
5. **Results:** the existing per-assignment results view; export unchanged.

**Student:** list shows *upcoming* (opens time), *open* (Start; or *Resume* with time left), *submitted* — **"Your result is in سجل التقييم" with a link** (until graded: "grading in progress, usually a few minutes"), *closed/expired* ("this exam ended; you did not start it" / "your time ended"), *cancelled*, and an *empty* state. The result stays `visibility=after-submission` in the history tab (Verified in the smoke); this closes the 2026-11-05 UX gap with a link, not a new results surface.

**Owner:** the in-app stop is unchanged (OD5). **DS-8 (recommended):** add an owner-only in-app **Resume** (typed confirmation) that reverses exactly the in-app stop effects (gate, NOLOGIN, holds) — without it, resuming after any stop needs SQL on the laptop, which breaks OD1's spirit for the rare case. It cannot enable the Google secret; therefore the in-app stop must not disable it (it cannot today).

**Strings:** new EN/AR strings only for these screens; no medical text, no score or feedback change.

## 6. Content: the 20-item exam (OD8)

- **Read-only inventory first (P6.0):** which auto-graded items already exist in production catalogue versions and their provenance, so that "the already tested items" is a counted list, not an assumption. **Not verified** until then — this design does not assume the smoke exam's items are suitable.
- **Path (DS-6, recommended):** build it through the **existing authoring flow** (draft → structural validation → publish) with the 20 reused items; no ad-hoc SQL. If the flow cannot publish reviewed items without a ContentReview record, add that record through the existing review mechanism, not a bypass. Fallback only if the flow cannot express the exam: a reviewed install file with digest, as the E/F installs, applied in the final window.
- **Owner's one-time review (DS-6):** read the 20 items (stem, options, key) once and record acceptance; independent O108 reviewers remain RAD-063. Recommended: the owner signs this exam's content; broader O108 stays an accepted, explicit limit ("only this exam, no new items without review").
- No new or changed medical text from this programme.

## 7. Gap ledger

"Phase" refers to §9. *Accepted risk* needs the owner's confirmation (**DS-10**).

| Gap | Source | Closed by / status |
|---|---|---|
| Independent reviews O108 | RAD-056, RAD-063 | P6 for the one exam's content; the broader programme **accepted risk** (limit: no unreviewed items) |
| Real alternate drill; real person | RAD-059, OD7 | Final window drill (alternate participates); **Not run** until then — OD7 states the person, not the drill |
| P7 provider receipt (email actually arrives) | RAD-059 | Final window: trigger a real budget/Monitoring test notice to all 3 channels (**Not run**: no console test button) |
| Old-credential rejection proof | RAD-059 item 5, Supavisor finding RAD-082/086 | Final window, with the 365-day credential issue: NOLOGIN → ≥ 120 s → old credential refused |
| Alternate coverage during unattended windows | OD1, RAD-059 rule N = 30 min | P4/P7: alerts to both; **accepted risk**: nobody is awake for a night window |
| P2 consent disclosure acknowledgement | RAD-062 done_when | Owner confirms (not evidenced in the 11-05 records) before P7 |
| Rights/privacy O4 / D3 | RAD-085 | Out of this programme except as a P7 pre-check; stays RAD-085 |
| W7 written items, content | RAD-062, OD6 | **Deferred by OD6** (not a gap here) |
| Two orphan unmounted secret volumes | window 11-05 | P4: `--remove-volume` ×2 in the Job update, before any version is disabled |
| `rad085-review-ready` functions hash | window 11-05 | P0 (below); **blocks any preflight** |
| Result visible only in "سجل التقييم" | smoke | P2 link and states |
| Attestation expires 2026-11-06; credential 2026-12-04 | window 11-05 | R2 (§3) and 365-day issue (§4) |
| Restore detection | RAD-097 | P5 |

**`rad085-review-ready.sql` proposal (not applied; DS-9).** Live production returns `functions` = `445cb753be66f07d7b5d5eee22cec0e2` while line 34 expects `5fcd5e713c9e39b74f39ba6a969080d5`; the difference is the five `EXECUTE` grants to `assess_grading_worker` from W1 (the fingerprint without that grantee is `5fcd5e71…`, proved live). Naively replacing the expected value breaks the CI DB lane, whose databases have no W1 (calibration test expects every row `ok`) — **Inferred from source, Not run**. Recommended change: exclude the grantee `assess_grading_worker` from the ACL part of the `functions` fingerprint (keeps `5fcd5e71…` on both), and leave the exact worker grants to `assess-grading-worker-ready.sql` (17 rows, already `t`). Consequences, all required together: (1) the file's bytes change, so `requiredMarker` (`scripts/pages/pilot-schema-gate.mjs`: hash over origin + migrations + every manifest check) changes `pilot-v1:3d8b505c…` to a new value; (2) the owner must set the new `PILOT_SCHEMA_VERIFIED` GitHub Variable **before the first Deploy after the merge**, or the deploy gate blocks; (3) `scripts/pages/frontend-schema.json` lists the file by path only (no per-file hash), so no pin edit there, but the manifest tests (`frontend-manifest.test.ts`, `rad085-review-fixes`, `rad085-production-calibration`, `rad062-catalogue-rehearsal`) must be re-run in the DB lane; (4) mutation proof: a fingerprint change that is *not* the worker grantee must still fail. Alternative if the owner prefers the literal request: accept two values `{5fcd5e71…, 445cb753…}` with a row naming which state was found. This must land before any further preflight; if it does not, the runbook note (window runbook 7.3) is the interim rule.

## 8. Threat-model delta

| New exposure | Control |
|---|---|
| Worker always armed (LOGIN + secret ENABLED) | DB role = EXECUTE on 5 grading functions + witness tick only; no table grants; egress via the existing VPC path; credential ≤ 365 d; emergency stop NOLOGINs it |
| Scheduler can run the Job | separate SA, run permission on this one Job; Job has no public invoker |
| Supervisor-run windows (no owner present) | window cap 7 d, change cap per assignment, server-clock enforcement, supervisor scope = own assignments only (existing `assignment_scopes`), audit rows on every change |
| Grading load spikes | batch ≤ 20/≤ 240 s, advisory lock, lease + skip locked; paging ≤ 200 for status views; the existing pilot write quotas |
| Restored DB graded against stale state | witness (§3) fails closed |
| Unattended failure | alerts to 3 channels, absence alert (30 min), pending-age and credential-days alerts, budget 5 USD |
| Override | per-session emergency hold + gate kill switch + NOLOGIN; owner and alternate in-app, unchanged |
| Witness bucket tamper | object access only for `assess-job`; no public access; tamper requires GCP privilege (already total) |

Residual (declared): an attacker with GCP owner power defeats everything here; Supabase free-tier has no provider backups (Terms), so the restore path depends on the laptop backups (RAD-086).

## 9. Phased plan (docs/impl; each phase = its own Draft PR, owner go per phase)

| Phase | Content | File budget | Tests | Hash/pin impact |
|---|---|---|---|---|
| **P0** | Fix `rad085-review-ready` (DS-9); gate-state-aware successor checks for the `closed_gate` rows (about a dozen check files) | ≤ 6 | DB lane + mutation | marker changes → `PILOT_SCHEMA_VERIFIED` update by owner |
| **P1** | Migration: window columns, `start_v2`/session deadline, schedule/edit/cancel RPCs, status RPC, `restore_epoch` + `witness_tick_v1` (shadow only) | ≤ 14 | DB lane (real PG), clock tests, RLS/scope, erasure-immutability interplay | new migration in manifest; function fingerprints + relations hash + marker change; pins for changed browser call set |
| **P2** | Supervisor and student UI (§5), EN/AR strings | ≤ 14 | unit, browser EN/AR 390/1440, axe, family audits per AGENTS | `frontend-schema.json` sha256 pins for changed files; Code Health KiB budget (assess 500) |
| **P3** | Worker: batch loop, advisory lock, idle fast path, log fields, witness client (shadow→enforcing flag); new image | ≤ 10 | image rehearsal (CI), double-run/overlap, kill-in-flight | new manifest sha and digest |
| **P4** | Idempotent infra scripts + runbook for Scheduler, SAs, bucket, alert policies, Job update with `--remove-volume`; cost reading | ≤ 8 | script tests, dry-run mode | none (docs/scripts) |
| **P5** | Verifier rehearsal: restored-DB image refused; owner "Accept restored database" + "Resume" | ≤ 10 | DB lane restore rehearsal | migration/pin changes as P1/P2 |
| **P6** | Content: inventory, 20-item exam via authoring, owner review record | ≤ 6 | validators, provenance tests | none expected |
| **P7** | **ONE owner laptop window** (below) | runbook only | — | marker value set |

**P7 contents, in order:** fresh backup + verification; apply migrations (live SQL, each with Expected/STOP); push image by digest; Job update with `--remove-volume` for the leftovers; enable Scheduler API, create SAs/bucket/Scheduler job/alert policies; issue the 365-day credential, ENABLE secret, LOGIN; witness shadow→enforce and rehearsal-equivalent live refusal check; alternate drill with the real alternate; P7 receipt test; old-credential rejection; set `PILOT_SCHEMA_VERIFIED`; install the 20-item exam; **proof run:** a supervisor schedules a synthetic exam ~15 min ahead, a synthetic student takes it, it is graded by the Scheduler with the owner doing nothing, then the emergency stop and Resume are exercised once. After that no routine manual step remains.

**S-STD-3 ceilings and lifting triggers:** batch cap 20 / 240 s per run (lift: sustained pending age > 15 min or cohort > ~200 per window → raise cadence to 1 min or add a second run path); window cap 7 days (lift: a legitimate longer exam, owner decision); 5-minute latency (lift: complaints); yearly manual rotation (lift: DS-5 option B after threat review); restore undetected within one tick (accepted); witness is single-project, single-bucket; supervisor status paging 200 rows (lift: server-side search); unattended windows rely on email alerts only (lift: a paid pager channel, none now).

## 10. Owner checklist (Arabic)

أجب بنعم/لا أو بالتعديل؛ لكل بند توصية واحدة:

1. **DS-1:** هل توافق على المراحل P0–P7 بهذا الترتيب كاستئناف صريح لبرمجة Assess، مع إذن منفصل لكل مرحلة؟ (التوصية: نعم، ابدأ بـP0).
2. **DS-2:** نافذة الامتحان: انتهاء الوقت عند `closes_at` دون مهلة إضافية، وسقف 7 أيام، والافتراضي 24 ساعة؟ (التوصية: نعم).
3. **DS-3:** تشغيل العامل كل 5 دقائق، بدفعة ≤ 20 محاولة أو 240 ثانية، بدل محاولة واحدة لكل تشغيل؟ (التوصية: نعم).
4. **DS-4:** التحقق التلقائي من الاستعادة بشاهد خارجي (عدّاد في القاعدة + ملف في دلو خاص) على ثلاث مراحل ثم إلغاء التصديق؟ (التوصية: نعم).
5. **DS-5:** اعتماد العامل بصلاحية 365 يومًا مع تنبيه، وتدوير سنوي بأمر واحد من اللابتوب، بدل التدوير الآلي؟ (التوصية: نعم).
6. **DS-6:** بناء الامتحان من العناصر الـ20 عبر واجهة التأليف الحالية (لا SQL يدوي) وأن تراجع أنت العناصر مرة واحدة وتسجّل القبول، مع بقاء O108 الأوسع خارج النطاق كخطر مقبول؟ (التوصية: نعم).
7. **DS-7:** إبقاء البوابة مفتوحة دائمًا كمفتاح إيقاف عام فقط، وتحويل فحوص «البوابة مغلقة» إلى «الحالة المتوقعة»؟ (التوصية: نعم).
8. **DS-8:** إضافة زر «استئناف» للمالك وحده داخل التطبيق بعد الإيقاف الطارئ (وزر «قبول القاعدة المستعادة» بعد استعادة حقيقية)؟ (التوصية: نعم).
9. **DS-9:** إصلاح `rad085-review-ready` الآن باستبعاد مستفيد العامل من البصمة (تبقى `5fcd5e71…`)، مع تحديث `PILOT_SCHEMA_VERIFIED` عندك قبل أول نشر بعد الدمج؟ (التوصية: نعم، قبل أي preflight).
10. **DS-10:** هل تؤكد المخاطر المقبولة في دفتر الفجوات: O108 الأوسع، ونافذة ليلية بلا مستيقظ سوى التنبيهات البريدية، واحتمال استعادة أحدث من دقائق قليلة؟ وهل أُقرّ إفصاح الموافقة P2؟ (التوصية: تأكيد كل بند على حدة).
