# Assess gate W1–W8 — reviewed owner packages

**Preparation only. Nothing here grants permission or has been run live.** Each live step needs the owner's separate written permission. Keep the gate closed, slots NOLOGIN and every secret version DISABLED until the [gate runbook](ASSESS_GATE_OPEN_RUNBOOK.md) §4 order reaches a step. Rules 0.1–0.2 of that runbook apply to every step: compare with **Expected**; anything else is **STOP**. Evidence: [batch report](RAD-085_GATE_W_REPORT_2026-11-03.md).

## Verdict per item

| ID | Status | One-line reason |
|---|---|---|
| W1 | **Decision-needed (D-W1)** | Role, slot, grants and checks are rehearsed. The binding refuses any role with TEMP, and PUBLIC holds TEMP in production; lifting it is a shared ACL change |
| W2+W3 | **Ready-for-owner** (after W1, W4, W5) | Laptop transport: in-memory password, local SCRAM verifier over `owner_sql` stdin, plaintext only to a new numeric secret version that is disabled at once |
| W4 | **STOP** | The image built by `build-worker.mjs` is synthetic-only by construction, so no production grading image exists yet |
| W5 | **Decision-needed (D-W5)** | The FREE direct host is IPv6-only. Cloud Run reaches IPv6 only through Direct VPC egress on a dual-stack subnet, which is unproven here. A credential-free probe is packaged |
| W6 | **Accepted 2026-11-03** | Proposal: Scheduler stays absent or paused; the owner runs sequential manual executions. One execution grades at most one attempt, inside 24 h |
| W7 | **STOP** | The deployed student UI is v1 only: written items cannot be assigned or taken, and no reviewed production content-install path exists |
| W8 | **Rejected 2026-11-03** | Every submission needs the worker before it can be graded or reach manual grading |

Owner decisions 2026-11-03 ([decisions](DECISIONS.md#launch-practice-only-owner-2026-11-03)): Practice-only launch on Thursday; deviations 1–2 and D-W6 accepted; W8 rejected; D-W1, D-W5, W4 and W7 deferred until after launch. The fixed order for the owner's live steps is the table in [§9](#9-owner-live-steps-in-order).

## 1. W1 — grading role and one LOGIN slot

**Artefacts:** [provision](../supabase/manual/assess-grading-worker-provision.sql), [read-only check](../supabase/checks/assess-grading-worker-ready.sql) (not in the promoted manifest), [LOGIN step 4.3](../supabase/manual/assess-grading-worker-login.sql), and the [D-W1 proposal](../supabase/manual/assess-grading-worker-public-temp.sql).

**Slot choice:** `assess_job_b`. It is absent in production (2026-11-01 roles snapshot), and the byte-identical [v2 stop packet](RAD-062_P05_PHONE_PACKET.md#1-الإيقاف--معاملة-واحدة) and the in-app emergency stop already cover only `assess_job_a` and `assess_job_b`. A new name would escape the stop. `assess_job_a` keeps its historical `assess_worker` membership and revoked credential, and is never reused.

**Least privilege, derived from the binding** (`createGradingWorkerBinding`): the binding calls only `maintain_v1`, `claim_v1`, `finish_v1`, `fail_v1` and `health_v1`. Its ACL query refuses any other EXECUTE in `assess`, any table privilege in `assess`, `public` or `auth`, database CREATE or TEMP, and schema CREATE. Its login query requires NOINHERIT, no administrative flags, a future `VALID UNTIL`, and exactly one membership (in `assess_grading_worker`, with SET true, INHERIT false and ADMIN false). The group itself must be NOLOGIN with no memberships. The provision therefore grants only USAGE on `assess`, EXECUTE on those five functions, and CONNECT to the slot. The same grants appear in the existing fixture at `rad085-worker-rehearsal.mjs`.

**Rehearsal (Verified locally, three modes):** embedded PostgreSQL 18.4 and pinned 17.11, each with the latest migrations plus `productionShapeSql`, and the pinned Supabase 17.11.0.016 image with the real 2026-11-01 roles and catalogue, using the non-superuser `postgres` as operator. The run covers:

- an open gate is refused before any change, and re-apply refuses with nothing changed;
- with PUBLIC TEMP present, `binding_acl_ready=f` and LOGIN is refused;
- with D-W1 applied and after a fresh-credential activation, the exact binding login and ACL queries, taken from `server-runtime.ts`, return allowed for the slot;
- `health_v1` works; table access, `recover_v1`, `set role assess_worker` and temp tables are denied;
- on Supabase, a real SCRAM login works and a wrong password is rejected;
- the v2 stop packet returns STOPPED and the slot can no longer log in.

Test file: `scripts/assess/grading-worker-rehearsal.test.mjs`.

**D-W1 (owner decision).** PostgreSQL has no per-role DENY, so the TEMP condition can only be lifted by revoking TEMP from PUBLIC. The proposal first grants TEMP explicitly to every existing role that has it now, except the new group and slot, and then revokes TEMP from PUBLIC. The rehearsal proves that every existing role, the database owner `postgres` (which the stop packet's temporary table needs) and the in-catalogue roles keep TEMP. Risk: a role created later by Supabase gets no TEMP (Inferred low). Rollback: `grant temporary on database postgres to public;`. Alternatives: weaken the binding guard (forbidden), or accept no worker (W8 rejected).

**Owner steps (laptop, after the `owner_sql` setup of runbook §2; each step needs written permission):**

| Step | Command | Expected | STOP if |
|---|---|---|---|
| W1.1 | `owner_sql -f supabase/manual/assess-grading-worker-provision.sql` | one row `assess-grading-worker-provision/1 \| t`, then COMMIT | any error, such as `already provisioned`, a closed-gate failure or a postcondition failure; nothing is changed |
| W1.2 | `owner_sql -f supabase/checks/assess-grading-worker-ready.sql` | every structure row `t`; `credential_window`, `slot_login` and `binding_login_ready` `f`; `binding_acl_ready` `f` until D-W1 | any structure row `f`, or an error |
| W1.3 (only after D-W1 is recorded) | `owner_sql -f supabase/manual/assess-grading-worker-public-temp.sql`, then W1.2 again | `…public-temp/1 \| t \| t`; `binding_acl_ready=t` | any error. Practice smoke on the phone right after: login, one Practice case. On any failure run the rollback line |

## 2. W2+W3 — activation transport and new secret version

**Artefacts:** [transport](../scripts/assess/rotate-grading-credential.py) and [tests](../scripts/assess/test_rotate_grading_credential.py). These replace the version-1-only uploader for this purpose; the old uploader stays unchanged as history.

**Design:**

- The password is 48 alphanumeric characters from `secrets`, generated in memory. It is never prompted for, never placed in argv or the environment, never written to a file and never printed.
- The plaintext goes only into a new numeric version of `assess-worker-config`, through `gcloud … versions add --data-file=-`. The payload is `{host: db.<ref>.supabase.co, port 5432, database, user assess_job_b, password, ca}`. The host matches D-W5 option A or B.
- The new version is disabled immediately and checked with `describe`. Only then is the SQL written to stdout. That SQL sets the password from a locally computed SCRAM-SHA-256 verifier with `VALID UNTIL` of 90 days or less, and the role stays **NOLOGIN**.
- Before generating anything, the script refuses: a terminal as stdout, any ENABLED version, unknown metadata or bad arguments. An uncertain upload or disable step means no SQL is sent and no retry happens. It never uses Enable, `latest` or Destroy.
- Deviation, for review: the task text puts LOGIN in the transport. The package keeps LOGIN for step 4.3 instead, so the slot stays closed until after the secret is enabled. The binding result is the same.

**Proof:** an RFC 7677 known-answer test; in every DB mode, a fake secret sink checks that the stored `pg_authid` value equals the verifier recomputed from the sink plaintext; a real SCRAM login on the Supabase image. Not run: real gcloud or Secret Manager.

**Residual risk (Inferred):** the verifier can appear in provider statement logs (FREE: 24 h) or in psql's protected stderr file on a syntax error. A verifier only allows offline guessing, and a 48-character random password makes that infeasible.

**Laptop prerequisites:** the Google Cloud CLI is installed in WSL and `gcloud auth login` uses the owner account. Answer **N** to any prompt that enables an API or changes the default project. The CA is at `~/assess-ca/prod-ca-2021.crt` (pinned SHA-256 checked).

| Step | Command | Expected | STOP if |
|---|---|---|---|
| W2.1 | `gcloud secrets versions list assess-worker-config --project=project-bff9124a-ec31-4d57-bc0 --format="table(name,state)"` | every row DISABLED or DESTROYED | any ENABLED row |
| W2.2 | `set -o pipefail; python3 -I scripts/assess/rotate-grading-credential.py --valid-days 30 \| owner_sql -f -` | stderr `PASS: secret version N added and DISABLED …`; one row `assess-grading-credential/1 \| t \| f`; write N in the encrypted log | any `STOP:`, a non-zero exit or a psql error. Read metadata (W2.1) and disable any new version; never rerun blindly |
| W2.3 | W1.2 check | `credential_window=t`, `slot_login=f` | otherwise |
| W2.4 IAM review | `gcloud secrets get-iam-policy assess-worker-config --project=project-bff9124a-ec31-4d57-bc0` and `gcloud projects get-iam-policy project-bff9124a-ec31-4d57-bc0 --flatten=bindings[].members --filter="bindings.members:assess-job@" --format="value(bindings.role)"` | the secret policy grants `roles/secretmanager.secretAccessor` to the `assess-job` service account only; no project-level Secret Manager role for it | any other member or a project-wide accessor role |

**Rollback:** Secret Manager → Versions → N → Disable. The slot goes NOLOGIN through the v2 stop packet (§8 of the gate runbook), which covers `assess_job_b`. Disabling the version does not end an open DB session; follow the 120-second rejection rule in the [Supavisor decision](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01).

## 3. W4 — image (STOP)

**Finding (Verified from source):** `worker-main.mjs` (line 1) is a "Local synthetic image only". Its checks refuse to run unless all of the following hold:

- `RAD085_SYNTHETIC_WORKER=1` (line 34);
- the manifest contains `localOnly: true` (line 37; `build-worker.mjs` line 29);
- the destination is `rad085-postgres`/`rad085_synthetic` (line 43);
- a synthetic reconciliation permit is mounted (line 49). Line 48 says: "No operational verifier exists."

Pushing that image would always end `STOP`. A production entrypoint needs new reviewed code: a secret mount path, a production destination check, and an **operational recovery verifier** whose meaning the owner must decide. One possibility is a signed "no restore since the baseline" attestation. This batch writes no such code.

**Lifting trigger:** an owner decision on the production recovery verifier, then a reviewed entrypoint PR with its own image rehearsal.

**Procedure chosen for later: Cloud Shell.** It is browser-based, already authenticated, has Docker, and builds with no laptop Docker install. Use a laptop instead only if Cloud Shell's disk is full. Steps, once the entrypoint exists:

1. `git clone` the repository; `git checkout --detach <promoted merge commit>`; `npm ci`.
2. Run `node scripts/assess/build-worker.mjs` twice. **Expected:** the same `manifestSha256` both times.
3. `docker pull` the pinned `node:24.19.0-bookworm-slim@sha256:a9f5f7c9…` base. Then build with `docker build --network=none -t europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime/assess-grading-worker:<commit12> <output dir>`.
4. Run `gcloud auth configure-docker europe-west3-docker.pkg.dev` and answer **Y** only to this registry prompt. Then `docker push`. Record the pushed `sha256:` digest.
5. Update the Job by digest: `gcloud run jobs update assess-worker --region=europe-west3 --image=…/assess-grading-worker@sha256:<digest> --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=300s --cpu=1 --memory=512Mi --service-account=assess-job@project-bff9124a-ec31-4d57-bc0.iam.gserviceaccount.com --set-secrets=<entrypoint path>=assess-worker-config:<N>`. Answer **N** to any execute prompt, and never use `--execute-now`.
6. **Digest binding check:** `gcloud run jobs describe assess-worker --region=europe-west3 --format=yaml`. **Expected:** the image line ends in exactly the recorded `@sha256:` digest; limits are 1/1/0/300 s/1 CPU/512Mi; the secret version is numeric, never `latest`; zero executions.

## 4. W5 — network path (Decision-needed)

**Sources:**

- [Supabase connecting](https://supabase.com/docs/guides/database/connecting-to-postgres): the direct host `db.<ref>.supabase.co` is IPv6-only unless the IPv4 add-on is enabled.
- [Supabase IPv4](https://supabase.com/docs/guides/platform/ipv4-address): the add-on is for paid plans, replaces the AAAA record with an A record, and can cause about a minute of downtime when toggled.
- [Cloud Run dual-stack](https://docs.cloud.google.com/run/docs/configuring/vpc-dual-stack-subnet): jobs can execute on a dual-stack subnet through Direct VPC egress; external IPv6 needs `roles/compute.publicIpAdmin` on the Cloud Run service agent; NAT64 is not supported.
- [VPC subnets](https://docs.cloud.google.com/vpc/docs/subnets): external IPv6 is internet-routable, and the Standard Tier is labelled Preview.

No page states that a job reaches a public AAAA destination, and no prices were read. Both are **Not verified**.

**Probe (credential-free):** [`direct-tls-probe.mjs`](../scripts/assess/direct-tls-probe.mjs). It does IPv6 DNS, TCP, a PostgreSQL SSLRequest, and TLS with the pinned Supabase root and a hostname check, then closes. It sends no user, password or query, and mounts no secret. It prints `{outcome, stage, family}` only. Tests: [probe tests](../scripts/assess/direct-tls-probe.test.mjs). The image was built locally and run with no network: Expected `STOP stage dns`, Verified.

**Probe procedure (Cloud Shell, written permission, no Assess state touched):**

1. `node scripts/assess/direct-tls-probe.mjs --build-context ~/assess-ca/prod-ca-2021.crt`, then build and push the image by digest as in W4 steps 3–4, with image name `assess-direct-tls-probe`.
2. `gcloud compute networks create radlab-egress --subnet-mode=custom`, then `gcloud compute networks subnets create radlab-egress-ew3 --network=radlab-egress --region=europe-west3 --range=10.8.0.0/26 --stack-type=IPV4_IPV6 --ipv6-access-type=EXTERNAL`. The subnet's IPv6 access type cannot be changed later.
3. Grant the Cloud Run service agent `roles/compute.publicIpAdmin`. This is a project IAM change, so record it.
4. `gcloud run jobs create assess-direct-tls-probe --region=europe-west3 --image=…@sha256:<digest> --network=radlab-egress --subnet=radlab-egress-ew3 --vpc-egress=all-traffic --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=60s --cpu=1 --memory=512Mi`. Use no secret. Then execute it once with `--wait`.
5. **Expected** in the execution log: `{"outcome":"PASS","stage":"complete","family":6}`. Any other stage is **STOP**, and the stage names where the path failed.

**Options for the owner:**

- **A (recommended if the probe passes):** dual-stack Direct VPC egress. There is no plan change and the binding and Supavisor rule stay intact. Cost and the Preview label are unverified.
- **B:** the Supabase IPv4 add-on. It requires a paid plan, contradicting [D1](DECISIONS.md#launch-records-owner-2026-11-03) (FREE), and toggling it can cause brief downtime.
- **C:** the session pooler. The binding refuses it, and using it would need a guard change plus acceptance of the [Supavisor revocation finding](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01). Not recommended.

The binding is unchanged in this batch.

## 5. W6 — Scheduler decision proposal

The proposal: **the Scheduler stays ABSENT or PAUSED. The owner runs one bounded manual Execute at a time, sequentially, after each exam batch.** Because the runs are sequential, they cannot overlap.

Facts (Verified from source):

- `executeGradingWorker` calls `runAssessJobs(worker, 1)`, so one execution runs `maintain_v1(1)` and at most **one** claim.
- `maintain_v1` moves an unleased `grading` attempt to `grading-failed` 24 h after submission, with `retry_at = submitted_at + 7 days`.
- `claim_v1` needs `submitted_at > now − 7 days` and `retry_at <= now`, so after 24 h only the owner's `recover_v1` can bring an attempt back, and only until day 7.

Cadence:

1. Before the batch, read the `grading` count from the operations monitor. That count is N.
2. Run N executions one after another, each after the previous one reports completion, all within **24 h** of the last submission. Aim for the same day.
3. Re-read the monitor after the runs. **Expected:** `grading` is 0 and failed is 0.
4. Anything missed after 24 h needs the recovery steps of phone restore steps 4–5, before day 7.

Lifting trigger for a Scheduler: about 10 or more attempts per batch, or a decision for unattended grading with proven no-overlap (retries 0, `maxRetryDuration` 0).

## 6. W7 — live smoke recipe (STOP)

**Blockers (Verified from source):**

- `assign_v1` accepts only `schema_version=1` versions (`20261020000600_assess_assignments.sql:104`).
- The patched `start_v1` denies non-v1 assignments (`20261030000600_rad062_lifecycle_v2.sql:400`).
- The static UI calls only `start_v1`/`command_v1` (`runner-data.ts:91`).

So **a written item cannot be assigned or taken through the deployed product**. The requested "one auto plus one written" smoke, manual grading and finalisation are not executable. Content installation (`installMixedContent`) needs a trusted `assess_worker` port, and no reviewed production install path exists. Real content also waits for O108 ([D2](DECISIONS.md#launch-records-owner-2026-11-03)).

**Recipe for later (auto-only, after W1–W6 and a content decision).** Use the RAD-041 synthetic accounts only.

0. Read-only precondition: `select count(*) filter (where available and schema_version=1) from assess.versions`. **Expected:** at least 1, otherwise STOP.
1. Run the monitor before: `owner_sql -f supabase/checks/assess-operations-monitor.sql`.
2. The owner assigns that version to the synthetic participant only.
3. The synthetic participant, on the phone, consents with v3, then starts, answers and submits. **Expected:** the submitted screen, and the monitor shows `grading` up by 1.
4. One bounded Execute, under W6. **Expected:** one completion, the result visible to the student, the monitor settled, zero failed executions.
5. Record redacted counts and UTC times. Erase the synthetic account through the existing owner deletion path: deactivate, then finalise.

## 7. W8 — no-worker opening (proposed: rejected)

Verified:

- Lifecycle v2: `command_v2` submit sets `state='grading'` (`20261030000600_rad062_lifecycle_v2.sql:214`). Only `finish_v2` sets `awaiting-manual` (line 312), and manual grading reads only `awaiting-manual` (`20261030000700_rad062_manual_grading.sql:48,60`).
- Deployed v1: `command_v1` submit sets `grading` (`20261020000700_assess_lifecycle.sql:246`), and only `finish_v1` sets `graded` (line 322).

Without a worker, every submission stays in `grading`, then fails at 24 h and becomes void at 7 days. W8 cannot be lifted; the proposal is to record it as rejected.

## 8. Open owner decisions

D-W1 (PUBLIC TEMP), D-W5 (network option A, B or C, after the probe), D-W6 (manual cadence), a W4 recovery-verifier decision, and W7 scope: auto-only smoke, plus a content-install path. Until all of these are recorded and merged, **§5 of the gate runbook stays blocked**.

## 9. Owner live steps in order

Device: L = laptop (WSL, `owner_sql`), CS = Cloud Shell, P = phone. Every step needs **a separate written permission** except the read-only ones marked R.

| # | Step | Device | Permission |
|---|---|---|---|
| 1 | Gate runbook §2–§3 read-only preflight | L, P | R |
| 2 | Record D-W1, D-W5, D-W6, the W4 verifier decision and W7 scope in DECISIONS | — | owner decision |
| 3 | W5 probe procedure (network, IAM, probe Job) | CS | written |
| 4 | Production entrypoint PR merged (W4 lift), then build, push and record the digest | CS | written |
| 5 | W1.1 provision, then W1.2 check | L | written; check R |
| 6 | W1.3 D-W1 TEMP change, then a Practice smoke | L, P | written |
| 7 | W2.1 metadata read, W2.2 transport, W2.3 check, W2.4 IAM review | L | W2.2 written; others R |
| 8 | W4 step 5 Job update by digest, step 6 binding check | CS | written; check R |
| 9 | Runbook 4.2: enable version N | P | written |
| 10 | Runbook 4.3: `owner_sql -f supabase/manual/assess-grading-worker-login.sql`, then the W1.2 check (all `t`) | L | written |
| 11 | Runbook 4.4–4.6: recover if needed, readiness, one bounded Execute | L, P | written (run permission) |
| 12 | Permission sentence 0.3, then runbook §5 gate open | L or P | written |
| 13 | W7 smoke (auto-only), §7 monitoring; §8 close on any doubt | P, L | written |
