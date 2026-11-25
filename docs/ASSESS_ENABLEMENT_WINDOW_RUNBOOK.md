# Assess enablement — one owner laptop window

**This page grants no permission.** Steps 0–1 ran live once on 2026-11-04 and the window stopped at 2.2 ([report](archive/reports/2026-11/ASSESS_WINDOW_2026-11-04.md)); steps 2–10 have not run. It is the single ordered script for the window recorded in [the window decision](DECISIONS.md#assess-window-owner-2026-11-03). Sources stay authoritative and are not repeated here in full: the [gate runbook](ASSESS_GATE_OPEN_RUNBOOK.md) (rules §0, preflight §2–§3, order §4, open §5, close §8), the [W packages](ASSESS_GATE_W_PACKAGES.md) (W1–W5 steps and the §9 order), the [W4 report](RAD-085_W4_ENTRYPOINT_REPORT_2026-11-03.md), the [window runbook step 2](RAD-085_RAD-059_WINDOW_RUNBOOK.md#2-select-the-protected-connection-and-evidence-directory), [RAD-086](RAD-086_LAPTOP_BACKUP_RUNBOOK.md) and the [phone runbook](RAD-059_PHONE_RUNBOOK.md). If this page and a source disagree, **STOP** and follow the source.

## Rules for the whole window

- **Devices.** L = laptop WSL Ubuntu shell in `~/RAD-LAB`, which also runs Docker Desktop for every image build and push. B = laptop browser (Cloud Shell tab, Google Cloud console, Supabase dashboard). P = phone. One device at a time; never paste a whole step into a prompt.
- **One step at a time.** Compare with **Expected**. A false/null/missing/duplicate row, an error, a timeout, UNKNOWN or an output you do not recognise is **STOP**: run that step's rollback, keep the gate closed, and end the window. No rerun of a mutating command; no improvised fix.
- **Secrets.** Rule 0.2 of the gate runbook: no password, connection string, email, UUID or secret screenshot in Git, chat, shell arguments or this page. Evidence lines go to the encrypted RAD-086 store; Git receives only redacted times and results.
- **gcloud prompts.** Answer **N** to every prompt (enable an API, change the default project, execute now), except where a step says **Y**.
- **Source.** Every device uses the same `origin/main` commit, recorded once in step 0 as `RAD_WINDOW_MAIN`. That commit must contain this runbook and `scripts/assess/recovery-attestation.mjs`; otherwise use the manual template in W4 step 6.
- **Times** below are Inferred estimates. Total ≈ 4 h. If the window will run past 48 h after step 6, stop at step 9 instead.

## Permission sentences (written by the owner, never by an agent)

**Every window is new.** A window starts at step 0 with fresh verification, a fresh step 1.5 backup (its own `baselineAt`) and a new owner-written sentence. The 2026-11-04 window (17:38 UTC, at most 5 h) has ended: never reuse its sentence, `RAD_WINDOW_MAIN`, `baselineAt` or logs.

**Window sentence**, written in the encrypted log and in the session before step 1. Fill the brackets privately:

> I, the RAD-LAB owner, permit the Assess enablement window on [YYYY-MM-DD] from [HH:MM] UTC for at most [H] hours, on Supabase project vlacestfruxooznrcjqc and Google Cloud project project-bff9124a-ec31-4d57-bc0, following ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md at commit [first 12 characters of RAD_WINDOW_MAIN], steps 0–10 in order: the W5 probe image and the W4 image built and pushed by digest from the laptop; the W5 network, probe Job, mount check and cleanup; W1 provision; the D-W1 TEMP change and a Practice smoke; the W2/W3 credential version; the recovery attestation and Job update by digest; secret Enable; slot LOGIN; one bounded run on an empty queue; close; and the P7 delivery test. Any STOP ends the window with that step's rollback. This sentence does not open assess.launch_gate.

**Synthetic smoke sentence** (step 8 only, written just before 8.3):

> I permit opening assess.launch_gate on project vlacestfruxooznrcjqc on [YYYY-MM-DD] between [HH:MM] and [HH:MM] UTC, at most 30 minutes, for one RAD-041 synthetic account only and no real student, using slot assess_job_b, secret version [N], attestation version [M] and Job image digest [sha256:…]. I am present and monitoring, and I close it with gate runbook §8 right after the smoke or at the end time, whichever comes first.

The gate runbook §0.3 sentence for real students is **not usable in this window**: real students wait for a real human alternate and drill ([decision](DECISIONS.md#assess-window-owner-2026-11-03)).

## Step table

| # | Step | Device | Min | Permission | STOP → rollback |
|---|---|---|---|---|---|
| 0 | Laptop readiness and connectivity probe | L, B | 20 | read-only | Nothing changed; end the window |
| 1 | Read-only preflight, P9 Active, P10 fresh backup | L, B | 25 | read-only (backup writes only the laptop store) | Nothing changed; end the window |
| 2 | Docker preflight and probe image (L); W5 network, probe Job, mount check, cleanup, D-W5 (Cloud Shell) | L, B | 45 | window sentence | From 2.3: delete probe Jobs, dummy secret, subnet, network and the IAM binding; before it nothing is created; end the window |
| 3 | W4 build twice, push, record digest | L | 20 | window sentence | Image is unused; record it; end the window |
| 4 | W1 provision, check, D-W1 TEMP, Practice smoke | L, P | 15 | window sentence | D-W1 rollback line; slot stays NOLOGIN |
| 5 | W2.1–W2.4 credential version, checks, IAM review | L | 15 | window sentence | Disable version N; slot stays NOLOGIN |
| 6 | Recovery secret, attestation, Job update, binding check | B (Cloud Shell) | 20 | window sentence | Disable versions M and N; never execute |
| 7 | 4.2 Enable N, 4.3 LOGIN, 4.5 readiness, 4.6 one run | B, L | 20 | window sentence | Gate runbook §8 |
| 8 | Synthetic smoke: open, assign, submit, run, close | L, B, P | 30 | synthetic smoke sentence | Gate runbook §8 at once |
| 9 | Close and final verification, evidence lines | P, B, L | 20 | window sentence | Repeat §8; record UNKNOWN |
| 10 | P7 provider alert and budget delivery test | B, P | 25 | window sentence | Delete the test policy; record PARTIAL |

## 0. Laptop readiness (L, B; 20 min)

0.1 Shell, source and DNS (L):

```bash
set -euo pipefail; set +x; set +H; umask 077
export PAGER=cat
cd ~/RAD-LAB && test -z "$(git status --porcelain)"
NODE_OPTIONS=--dns-result-order=ipv4first git fetch origin main && git checkout --detach origin/main
export RAD_WINDOW_MAIN="$(git rev-parse HEAD)"; echo "$RAD_WINDOW_MAIN"
test -f docs/ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md && test -f scripts/assess/recovery-attestation.mjs
grep -m1 '^nameserver' /etc/resolv.conf && getent ahostsv4 registry.npmjs.org | head -1
NODE_OPTIONS=--dns-result-order=ipv4first npm ci --no-audit --no-fund
```

**Expected:** a 40-character commit (write it in the log), one `nameserver` line, one IPv4 line, then `added N packages`. `set +H` turns off bash history expansion, which breaks any command that contains `!` (found live 2026-11-04). **STOP** on a dirty tree, no nameserver or no IPv4 answer: the WSL DNS fix from the earlier window is not active ([cleanup report](TEST_CLEANUP_REPORT_2026-11-02.md); WSL has no IPv6, npm needs `ipv4first`).

0.2 Google Cloud CLI (L):

```bash
gcloud --version | head -1
gcloud auth list --filter=status:ACTIVE --format="value(account)" | wc -l
gcloud config get-value project
```

**Expected:** a version line; exactly `1` active account (the owner's; do not print it into Git); project `project-bff9124a-ec31-4d57-bc0`. If the project prints `(unset)` or differs, set it with `gcloud config set project project-bff9124a-ec31-4d57-bc0` (allowed here) and answer **N** to any API prompt, then repeat the third command. **STOP** if gcloud is missing or not logged in: `gcloud auth login` is done by the owner in the browser, never from a pasted token.

0.3 CA files (L). Both files are public certificates. **Recovery comes first, then the read:** if the target is missing, install it from the RAD-086 CA only when that source's DER SHA-256 equals the pin; the target is never overwritten, and a different source hash is **STOP** (nothing is written). Then read both:

```bash
CA_PIN=807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa
CA_T=~/assess-ca/prod-ca-2021.crt; CA_S=~/.config/rad-lab-backup/supabase-ca.crt
if [ ! -e "$CA_T" ]; then
 if [ "$(openssl x509 -in "$CA_S" -outform DER | sha256sum | cut -c1-64)" = "$CA_PIN" ]; then
  install -d -m 700 ~/assess-ca && install -m 600 "$CA_S" "$CA_T" && echo CA_INSTALLED
 else echo 'STOP: RAD-086 CA hash differs from the pin; nothing written'; fi
fi
stat -c '%a %n' ~/assess-ca "$CA_T"
for f in "$CA_T" "$CA_S"; do openssl x509 -in "$f" -outform DER | sha256sum | cut -c1-64; done
[ "$(openssl x509 -in "$CA_T" -outform DER | sha256sum | cut -c1-64)" = "$CA_PIN" ] && echo PIN_OK || echo 'STOP: target hash is not the pin'
```

**Expected:** `CA_INSTALLED` only when the target was missing; modes `700` for the directory and `600` for the file (any other mode is **STOP**); then the pin for the first file (pinned by the W2 transport and the W5 probe) and `PIN_OK`. The second is the RAD-086 CA used by `owner_sql`; it must open with a future `notAfter` ([A6](RAD-086_LAPTOP_BACKUP_RUNBOOK.md#a-one-time-setup-wsl-ubuntu-shell)). **STOP** on `STOP:` output, an `openssl` error or any hash that is not the pin. In the 2026-11-04 window both files gave the pin.

0.4 `owner_sql` and connectivity probe (L). Unlock the encrypted evidence volume, then run the **unchanged** [window step 2 block](RAD-085_RAD-059_WINDOW_RUNBOOK.md#2-select-the-protected-connection-and-evidence-directory) with the private placeholders filled as follows, without printing them: `PGHOST` from the `poolerHost` key of `~/.config/rad-lab-backup/config.json` (for example `export PGHOST="$(node -p "require(process.env.HOME+'/.config/rad-lab-backup/config.json').poolerHost")"`; the command substitution prints nothing), and `RAD_WINDOW_EVIDENCE` a directory under `$HOME` on the BitLocker-encrypted disk. Then:

```bash
getent ahostsv4 "$PGHOST" | head -1
timeout 20 bash -c "exec 3<>/dev/tcp/$PGHOST/5432" && echo TCP_OK
owner_sql -qAt -c "begin read only; select current_user='postgres' operator_ok, (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) closed_gate; rollback;"
```

**Expected:** one IPv4 line, `TCP_OK`, then `t|t`. **KNOWN ISSUE:** this laptop's network has timed out on port 5432 to the pooler before. If `TCP_OK` does not print within 20 s: switch the laptop to the phone hotspot (the pooler is IPv4, so the hotspot's missing IPv6 does not matter), wait 30 s and repeat 0.4 once. Never switch to port 6543, the direct host or `sslmode=require`. **STOP** if neither network gives `TCP_OK` and `t|t`: the window does not start.

0.5 Laptop browser (B): open Cloud Shell for the same project, the Cloud Run Jobs page (`europe-west3`), Secret Manager and the Supabase dashboard. Answer **N** to Cloud Shell prompts except authorising Cloud Shell itself.

## 1. Read-only preflight (L, B; 25 min)

1.1 Gate runbook [§2 offline checks](ASSESS_GATE_OPEN_RUNBOOK.md#2-laptop-shell-wsl-ubuntu-rad-lab--offline-checks-first) (marker lines only; the tree is already at `RAD_WINDOW_MAIN`). **Expected:** `promoted_checks=9` and the P1 marker.
1.2 Gate runbook [§3.1–§3.3](ASSESS_GATE_OPEN_RUNBOOK.md#3-read-only-preflight-opens-nothing) unchanged. **Expected** as written there: every row `t`, V2 `STOPPED`, backlog `awaiting_manual_ge_*` 0, monitor `active`/`grading`/failed 0.
1.3 §3.4 cloud metadata in the browser: Scheduler ABSENT or PAUSED; zero running executions; every `assess-worker-config` version DISABLED; record the current Job image, limits and service account.
1.4 P9 (B): the Supabase dashboard shows the project **Active**, not paused.
1.5 P10 (L):

```bash
node scripts/ops/laptop-backup.mjs run && node scripts/ops/laptop-backup.mjs verify daily
```

**Expected:** the B2 JSON line with `count_errors` 0, then `{"verified_files":2,…}`. Write the backup completion time in the log as a canonical UTC string with milliseconds; it is `baselineAt` for step 6 ([review decision](DECISIONS.md#assess-window-review-owner-2026-11-03)).
**STOP → rollback:** nothing was changed. End the window.

## 2. W5 probe, mount check and D-W5 (L for the image, Cloud Shell for the cloud steps; 45 min)

**Image route** ([owner decision](DECISIONS.md#assess-push-owner-2026-11-04)): both images are built and pushed from Docker Desktop in laptop WSL, by digest. Cloud Shell neither builds nor pushes; network, IAM and the probe Jobs stay there. The pinned base, `--network=none` and digest binding are unchanged. The 2026-11-04 Cloud Shell push failure ("connection refused", twice) is not evidence for or against this route.

2.1 Docker and registry preflight (L, read-only; never enable an API):

```bash
export REG=europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime
docker version --format '{{.Client.Version}} {{.Server.Version}} {{.Server.Os}}/{{.Server.Arch}}'
gcloud artifacts repositories describe assess-runtime --location=europe-west3 --project=project-bff9124a-ec31-4d57-bc0 --format="value(format)"
gcloud services list --enabled --project=project-bff9124a-ec31-4d57-bc0 --filter="config.name=artifactregistry.googleapis.com" --format="value(config.name)"
```

**Expected:** a line ending `linux/amd64` (owner-reported before this window: client and server 29.8.2, linux, x86_64; a different version is recorded, not a STOP); `DOCKER`; `artifactregistry.googleapis.com`. Those owner-reported observations prove neither push access nor the cause of the earlier refusal, so they are re-read here. **STOP** on another OS or architecture, an unreachable Docker server, a missing repository, a format other than `DOCKER`, or the API not listed. Nothing was changed.

2.2 Probe image (L). The only changes are a temporary build directory and, at the `configure-docker` line, the laptop's Docker config (a credential-helper entry for this one registry):

```bash
cd ~/RAD-LAB
P1="$(node scripts/assess/direct-tls-probe.mjs --build-context ~/assess-ca/prod-ca-2021.crt)"
RAD_PROBE_CTX="$(node -p 'JSON.parse(process.argv[1]).output' "$P1")"; echo "$RAD_PROBE_CTX"
docker pull node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
docker build --network=none -t "$REG/assess-direct-tls-probe:${RAD_WINDOW_MAIN:0:12}" "$RAD_PROBE_CTX"
gcloud auth configure-docker europe-west3-docker.pkg.dev
docker push "$REG/assess-direct-tls-probe:${RAD_WINDOW_MAIN:0:12}"
docker inspect --format '{{json .RepoDigests}}' "$REG/assess-direct-tls-probe:${RAD_WINDOW_MAIN:0:12}"
gcloud artifacts docker images list "$REG" --include-tags --format="value(package,version)"
```

Run the lines one at a time. Answer **Y** only to the `configure-docker` registry prompt. **Expected:** a `radlab-direct-tls-probe-` directory path; the pull reports the pinned `sha256:a9f5…29df`; a successful build; a push ending `digest: sha256:<64 hex>`; exactly one `…/assess-direct-tls-probe@sha256:<64 hex>` entry; and the registry listing shows that same digest. Record it as `RAD_PROBE_DIGEST` in the log. **STOP** on a `STOP` JSON from the build script, a different base digest, any build or push error (including "connection refused": no retry and no other route), a missing or doubled digest, or a listing that lacks the digest. **STOP → rollback:** the pushed image, if any, is unused; record it. The Docker config entry may be removed by hand. No cloud resource was created; end the window.

2.3 Network, IAM and probe Job (Cloud Shell). **`REG` exists only in the laptop shell; Cloud Shell is a separate environment, so nothing below uses it.** First carry the recorded digest across by hand and validate it before any network or IAM change (type the 64 hex characters from the 2.2 log; do not paste from a file):

```bash
RAD_PROBE_DIGEST='sha256:<64 hex from 2.2>'
unset RAD_PROBE_IMAGE
if [[ "$RAD_PROBE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
 RAD_PROBE_IMAGE="europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime/assess-direct-tls-probe@${RAD_PROBE_DIGEST}"
 echo "$RAD_PROBE_IMAGE"
else echo 'STOP: digest is not sha256:<64 lowercase hex>'; fi
gcloud artifacts docker images describe "${RAD_PROBE_IMAGE:?STOP: probe image not set}" --format="value(image_summary.digest)"
```

**Expected:** one image reference ending `@` plus exactly the 2.2 digest (compare it with the 2.2 `docker inspect` line), then the same digest from the registry (read-only). **STOP before step 2 below** on `STOP:` output, a different digest, or a describe error: nothing has been created, so end the window. Re-run this block, with the digest typed again, if Cloud Shell restarts.

Run [W5 probe steps 2–5](ASSESS_GATE_W_PACKAGES.md#4-w5--network-path-decision-needed) exactly, using `--image="${RAD_PROBE_IMAGE:?STOP: probe image not set}"` in step 4 (step 1 was done in 2.2). For step 3, the Cloud Run service agent is `service-<PROJECT_NUMBER>@serverless-robot-prod.iam.gserviceaccount.com`; read the number with `gcloud projects describe project-bff9124a-ec31-4d57-bc0 --format="value(projectNumber)"` and compare the agent name with IAM → "Include Google-provided role grants" before granting (Inferred from the Cloud Run docs; not verified live). No `set -e` in any Cloud Shell block, because a failing command would close Cloud Shell; read every **Expected** line and **STOP** on any difference. **Expected:** `{"outcome":"PASS","stage":"complete","family":6}` in the execution log.

2.4 Mount check and cleanup (Cloud Shell). Run W5 steps 6–8 (dummy secret, `assess-mount-probe`, type and mode lines) with `--image="${RAD_PROBE_IMAGE:?STOP: probe image not set}"` (step 7), set as in 2.3. **Expected:** `/run/recovery` `dir`, and `assess-recovery.json` `file`. Then the step 8 cleanup, plus the credential-free TLS probe Job:

```bash
gcloud run jobs delete assess-mount-probe --region=europe-west3
gcloud secrets delete assess-mount-probe-dummy --project=project-bff9124a-ec31-4d57-bc0
gcloud run jobs delete assess-direct-tls-probe --region=europe-west3
```

Answer **Y** only to these three delete prompts. **Expected:** three `Deleted` lines.

2.5 **D-W5, pre-decided:** PASS/complete/6 **and** `file` → option A is accepted; keep `radlab-egress`, `radlab-egress-ew3` and the service-agent role, and continue. **Any other result → STOP the window.** Options B and C stay undecided.
**STOP → rollback (from 2.3 on):** delete what exists of the two probe Jobs and the dummy secret (2.4), then `gcloud compute networks subnets delete radlab-egress-ew3 --region=europe-west3`, `gcloud compute networks delete radlab-egress`, and remove the `roles/compute.publicIpAdmin` binding from the service agent. Record the failing stage or type lines only. No Assess state was touched.

## 3. W4 image by digest (L; 20 min)

Run [W4 steps 1–4](ASSESS_GATE_W_PACKAGES.md#3-w4--image-ready-for-review-after-the-launch) in the laptop clone, which is already at `RAD_WINDOW_MAIN` from step 0.1. One line at a time:

3.1 Build twice and compare (the worker's two-build manifest comparison):

```bash
B1="$(node scripts/assess/build-grading-worker.mjs)"; B2="$(node scripts/assess/build-grading-worker.mjs)"
H1="$(node -p 'JSON.parse(process.argv[1]).manifestSha256' "$B1")"; H2="$(node -p 'JSON.parse(process.argv[1]).manifestSha256' "$B2")"
[ -n "$H1" ] && [ "$H1" = "$H2" ] && echo "MANIFEST_SAME $H1" || echo 'STOP: manifest hashes differ'
RAD_W4_OUT="$(node -p 'JSON.parse(process.argv[1]).output' "$B2")"; echo "$RAD_W4_OUT"
```

**Expected:** `MANIFEST_SAME` and one 64-hex hash (write it in the log as `RAD_W4_MANIFEST`; it is not a secret and goes to Cloud Shell for step 6); a `rad085-grading-worker-build-` directory path. **STOP** on `STOP:` or any build error.

3.2 Pinned base, build, push, digest:

```bash
docker pull node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
docker build --network=none -t "$REG/assess-grading-worker:${RAD_WINDOW_MAIN:0:12}" "$RAD_W4_OUT"
docker push "$REG/assess-grading-worker:${RAD_WINDOW_MAIN:0:12}"
docker inspect --format '{{json .RepoDigests}}' "$REG/assess-grading-worker:${RAD_WINDOW_MAIN:0:12}"
gcloud artifacts docker images list "$REG" --include-tags --format="value(package,version)"
```

`REG` and the registry credential helper come from step 2; if this is a new shell, set `REG` again and, only if pushes now ask for credentials, repeat the `gcloud auth configure-docker europe-west3-docker.pkg.dev` line (**Y** to that registry prompt only). **Expected:** the pinned base digest; a successful build; a push ending `digest: sha256:<64 hex>`; exactly one `…/assess-grading-worker@sha256:<64 hex>` entry, which is the recorded digest; and the registry listing shows the same digest. **STOP** on a different base digest, a build or push error (no retry, no other route), more than one digest, or a digest that differs from the registry's.
**STOP → rollback:** the pushed image is unused; record it and end the window (step 2 network stays; it changes nothing on its own).

## 4. W1 provision and D-W1 (L, P; 15 min)

| Sub-step | Command or action | Expected | STOP → rollback |
|---|---|---|---|
| 4.1 | `owner_sql -f supabase/manual/assess-grading-worker-provision.sql` | one row `assess-grading-worker-provision/1 \| t`, COMMIT | nothing changed (single transaction); end the window |
| 4.2 | `owner_sql -f supabase/checks/assess-grading-worker-ready.sql` | structure rows `t`; `credential_window`, `slot_login`, `binding_login_ready`, `binding_acl_ready` `f` | end the window; the NOLOGIN role without a credential stays, recorded |
| 4.3 | `owner_sql -f supabase/manual/assess-grading-worker-public-temp.sql`, then 4.2 again | `…public-temp/1 \| t \| t`; `binding_acl_ready=t` | `owner_sql -c "grant temporary on database postgres to public;"` (the file's rollback line), then 4.2 |
| 4.4 | Phone: log in, open Practice, finish one case | the case result screen, as before the change | the 4.3 rollback line at once, then end the window |

## 5. W2/W3 credential transport (L; 15 min)

Run [W2.1–W2.4](ASSESS_GATE_W_PACKAGES.md#2-w2w3--activation-transport-and-new-secret-version) exactly, with `--valid-days 30` in W2.2. **Expected:** W2.1 no ENABLED row; W2.2 stderr `PASS: secret version N added and DISABLED …` and one row `assess-grading-credential/1 | t | f` (write N in the log); W2.3 `credential_window=t`, `slot_login=f`; W2.4 only `assess-job` holds `roles/secretmanager.secretAccessor` on the secret, with no project-wide Secret Manager role.
**STOP → rollback:** read W2.1 again and disable every new version; never rerun W2.2. The slot stays NOLOGIN. End the window.

## 6. Recovery attestation and Job by digest (Cloud Shell; 20 min)

6.1 W4 step 5 once: create `assess-worker-recovery` and grant the accessor role to `assess-job` only; repeat the W2.4 IAM review for both secrets.

6.2 W4 step 6 with the helper (decision B: `restoresSinceBaseline` 0, at most 48 h). The helper needs only Node and the pinned clone, with no `npm ci` and no build. In Cloud Shell: `git clone https://github.com/omarhleeq-dotcom/RAD-LAB.git ~/RAD-LAB && cd ~/RAD-LAB` (if `~/RAD-LAB` exists, `cd ~/RAD-LAB && git fetch origin main`), then `git checkout --detach <RAD_WINDOW_MAIN from step 0.1> && git rev-parse HEAD`; **Expected** the same commit. The manifest file stays on the laptop, so use the approved `--manifest-sha256` fallback with the `RAD_W4_MANIFEST` hash from step 3.1. Pass `--no-restore-since-baseline` only if no production restore has happened since `baselineAt`. `baselineAt` is the completion time of the step 1.5 backup verified in **this** window:

```bash
node scripts/assess/recovery-attestation.mjs --manifest-sha256 <RAD_W4_MANIFEST from step 3.1> \
 --baseline-at <YYYY-MM-DDTHH:MM:SS.000Z> --valid-hours 48 --no-restore-since-baseline \
 | gcloud secrets versions add assess-worker-recovery --project=project-bff9124a-ec31-4d57-bc0 --data-file=-
```

**Expected:** stderr `PASS: issuedAt … expiresAt …`, then `Created version [M]`; write M and both times in the log. Any `STOP <reason>` means nothing was sent. The worker refuses a clock ahead of Cloud Run (`issuedAt > now`); keep the shell clock synchronised.

6.3 W4 step 7, with the option A network flags added because the worker must reach the IPv6 direct host. **Order (window 2026-11-05, [owner amendment](DECISIONS.md#assess-window-2026-11-05-owner)):** Cloud Run refuses a Job that references a DISABLED secret version, so first Enable version N of `assess-worker-config` (slot still NOLOGIN, nothing executes), then read the `volumes:` list of `gcloud run jobs describe assess-worker --region=europe-west3 --format=yaml` and remove every unmounted leftover volume with `--remove-volume=<name>` in the update below; `--set-secrets` does not remove old volumes.

```bash
gcloud run jobs update assess-worker --region=europe-west3 \
 --image=europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime/assess-grading-worker@sha256:<step 3 digest> \
 --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=300s --cpu=1 --memory=512Mi \
 --service-account=assess-job@project-bff9124a-ec31-4d57-bc0.iam.gserviceaccount.com \
 --network=radlab-egress --subnet=radlab-egress-ew3 --vpc-egress=all-traffic \
 --set-secrets=/run/secrets/assess-worker.json=assess-worker-config:<N>,/run/recovery/assess-recovery.json=assess-worker-recovery:<M>
```

Answer **N** to any execute prompt; never `--execute-now`.

6.4 W4 step 8 binding check (also count volumes: each must be mounted; leftovers from earlier `--set-secrets` calls are removed, not tolerated): `gcloud run jobs describe assess-worker --region=europe-west3 --format=yaml`. **Expected:** the image ends in the step 3 digest; 1/1/0/300 s/1 CPU/512Mi; both secret versions numeric (N, M); network `radlab-egress`, subnet `radlab-egress-ew3`, egress all-traffic; zero executions.
**STOP → rollback:** disable versions M and N (Secret Manager → Versions → Disable); never execute the Job. End the window.

## 7. Enable, LOGIN, readiness, one bounded run (B, L; 20 min)

| Sub-step | Action | Expected | STOP → rollback |
|---|---|---|---|
| 7.1 (4.2) | Secret Manager → `assess-worker-config` → version N → Enable | N ENABLED, every other version DISABLED | disable N |
| 7.2 (4.3) | `owner_sql -f supabase/manual/assess-grading-worker-login.sql` | one row `assess-grading-worker-login/1 \| t \| t`, COMMIT | gate runbook §8 |
| 7.3 (4.5) | gate runbook §3.2, then `owner_sql -f supabase/checks/assess-grading-worker-ready.sql` | nine checks `ok=t`; every worker-ready row `t`. After W1 the review-ready `functions` actual is `445cb753be66f07d7b5d5eee22cec0e2` (`5fcd5e71…` only without the W1 grants): `ok=f` on that one row is the owner-accepted state until the [proposed fix](DECISIONS.md#rad085-review-ready-proposal-2026-11-05) lands | §8 |
| 7.4 | monitor before: `owner_sql -f supabase/checks/assess-operations-monitor.sql` | `grading` 0, failed 0 (empty queue) | §8 |
| 7.5 (4.6) | Cloud Run → Jobs → `assess-worker` → Execute once (or `gcloud run jobs execute assess-worker --region=europe-west3 --wait`) | one execution succeeded; its log has one line with `"outcome":"COMPLETE","code":"complete"` and `graded` 0; then zero running | §8; never re-execute |
| 7.6 | 7.4 again | unchanged counts | §8 |

## 8. Synthetic smoke — open, smoke, close (L, B, P; 30 min)

This is the single exception to "the gate opens only for a scheduled exam window": at most 30 minutes, owner present, synthetic accounts only, closed by §8 right after.

Use one RAD-041 synthetic account (approved, never the owner's, never a real participant; never an account appointed as alternate; currently no alternate is appointed). Auto-graded only ([W7 recipe](ASSESS_GATE_W_PACKAGES.md#6-w7--live-smoke-recipe-stop)); written items have no deployed path.

1. Precondition (L): `owner_sql -qAt -c "begin read only; select count(*) filter (where available and schema_version=1) from assess.versions; rollback;"`. **Expected:** at least `1`. If `0`: skip to step 9; the smoke is Not run (content waits for O108).
2. Owner assigns that version to the synthetic participant only (B, owner pages). The assignment does not need the gate open.
3. Owner writes the synthetic smoke sentence, then runs the gate runbook [§5](ASSESS_GATE_OPEN_RUNBOOK.md#5-gate-open--exact-reviewed-sql-only-after-4-is-complete-and-03-is-written) SQL, copied verbatim (L):

```bash
owner_sql <<'SQL'
begin;
set local lock_timeout='2s';
set local statement_timeout='5s';
update assess.launch_gate set enabled=true where singleton;
select count(*)=1 and bool_and(enabled) gate_open from assess.launch_gate;
commit;
SQL
```

   **Expected:** `gate_open=t`, then COMMIT. Write the UTC time. Any error or lost connection is UNKNOWN → §8 at once; never rerun.
4. Phone as the synthetic participant: v3 consent, start, answer, submit. **Expected:** the submitted screen; monitor `grading` 1.
5. One bounded Execute as in 7.5. **Expected:** `COMPLETE`, `graded` 1; the result is visible to the synthetic participant in the "سجل التقييم" tab (not on the exam page); monitor `grading` 0 and failed 0; zero running executions.
6. Close at once: gate runbook [§8](ASSESS_GATE_OPEN_RUNBOOK.md#8-close--rollback--reviewed-executable-now), steps 1–5 (step 9 below). Write the UTC close time. Open time target ≤ 15 min; hard limit 30 min.

**STOP → rollback:** any other screen, count or log line, or reaching the end time → §8 at once. Synthetic rows follow normal retention and the existing owner deletion path.

## 9. Close and final verification (P, B, L; 20 min)

1. Gate runbook §8 steps 1–5: Scheduler ABSENT; zero running executions; the v2 stop block once (phone SQL Editor) → `STOPPED`; Secret Manager: disable N in `assess-worker-config` **and** M in `assess-worker-recovery`; v2 verification now and after 60 s. **Expected:** `STOPPED`, `gate_closed=t`, `login_disabled=t`, `backend_sessions=0`, `unheld_sessions=0`; laptop `owner_sql -f supabase/checks/assess-emergency-stopped-v2.sql` agrees.
2. If step 8 did not run, still run §8 so the window ends with LOGIN off and both versions disabled (LOGIN off is the default; keeping LOGIN would need a reviewed gate-only close, which does not exist).
3. `owner_sql -f supabase/checks/assess-grading-worker-ready.sql`. **Expected:** structure rows `t`, `slot_login=f`, `binding_acl_ready=t`.
4. Evidence lines for the encrypted log (redacted; no UUID, email, password or raw output):

```text
window <date> <start>-<end> UTC; commit <12>; network 0.4 <home|hotspot>
W5 PASS/complete/6; mount file; probe resources deleted
W4 manifestSha256 <64>; digest sha256:<64>
W1 provisioned; D-W1 applied; Practice smoke ok
W2 version N=<n> valid-days 30; IAM ok; attestation M=<m> issued <t> expires <t>
4.6 COMPLETE graded 0; smoke <run|not run: no v1 version> open <t> close <t> graded 1
close STOPPED x2; N and M DISABLED; Scheduler ABSENT; executions 0
```

**STOP → rollback:** PARTIAL/FAILED/UNKNOWN → ROLLBACK and rerun the whole v2 stop block, keep every version disabled, and record UNKNOWN.

## 10. P7 provider alert and budget delivery (B, P; 25 min)

Follow the [phone runbook alert section](RAD-059_PHONE_RUNBOOK.md#تشغيل-التنبيهات-لاحقًا--مالك-فقط): the three Cloud Monitoring policies on `cloud_run_job`, owner email channel, then **Test notification** where the console offers it; the budget email; a manual Supabase Usage read. **Expected:** each email **received** on the phone, with its UTC time and an ACK line in the encrypted log. Save alone is not receipt.
**STOP → rollback:** a missing metric or label, a paid or custom metric prompt, or no receipt → do not improvise; delete only a policy this step created, and record P7 PARTIAL with the reason.

## After the window — before any real student

Normal operation after this window is governed by [OD1–OD9](DECISIONS.md#assess-self-service-owner-2026-11-05) and the [self-service design](ASSESS_SELF_SERVICE_DESIGN.md); the bullets below remain the interim rules until its phases are approved and the final switch-on window is done.

- Appoint a real human alternate and run the short drill ([alternate runbook §5](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#5-alternate-and-channels-drill-then-a-separate-promotion-pr)). Until then only synthetic smoke may run.
- First real exam window procedure: a scheduled window with the owner present; a new attestation version and Job update (6.2–6.4); 7.1–7.3 again; the gate runbook §0.3 sentence; §5; small cohort first; [W6 cadence](ASSESS_GATE_W_PACKAGES.md#5-w6--scheduler-decision-proposal) inside 24 h; §8 right after.
- Still open: W7 written items and content (O108), RAD-097, P7 if PARTIAL.
