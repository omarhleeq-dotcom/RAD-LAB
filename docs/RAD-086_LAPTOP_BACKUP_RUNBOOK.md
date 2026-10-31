# RAD-086 — owner laptop: daily backup, restore proof, credential-cache test (WSL2)

Reviewed procedure for the owner's later execution on the verified laptop (Windows 11 Pro, BitLocker on C:, WSL2 Ubuntu 24.04, Node 22, psql/pg_dump 17.11 = production 17.11, Docker Desktop with WSL integration). **Nothing here has been run against the live project.** The agent ran no live SQL, set no Variables, opened no gate, enabled no LOGIN or secret and revealed no secret. Authority: [owner decisions 2026-10-31](DECISIONS.md#rad086-laptop-owner-2026-10-31), [D2](DECISIONS.md#rad085-owner-tidy-2026-10-27) (backup before the first real exam, no cloud, encrypted local reconciliation log, weekly USB copy), [RAD-059 dry run](RAD-059_OWNER_DRY_RUN_2026-10-29.md), [session-pooler rules](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي). Report: [RAD-086 report](RAD-086_REPORT_2026-10-31.md).

How it fits together: `scripts/ops/laptop-backup.mjs` (daily, read-only) writes a date-stamped directory with `roles.sql`, `project.dump`, `checksums.json` and `db-meta.json`, then adds one age-encrypted entry to a reconciliation log. `scripts/ops/laptop-restore-test.mjs` restores a chosen backup into a throwaway `postgres:17.11` container and compares table counts. Windows Task Scheduler starts the daily run through `wsl.exe`. The database connects over the **Supabase session pooler** (port 5432, IPv4) because this laptop has no global IPv6 and the direct host is IPv6-only. The pooler is an explicit setting in the config file, never detected, never a fallback.

Every step: one command, what you should see, when to STOP. At any STOP do nothing else: no retry loop, no weaker TLS, no workaround. Output is numbers or a fixed stage code, never data.

## A. One-time setup (WSL Ubuntu shell)

**A1 — tools**

```bash
node -v && psql --version && pg_dump --version && docker --version && (age --version || echo NO_AGE)
```

Expect `v22.x`, both PostgreSQL clients `17.11`, a Docker version. `NO_AGE` means do A2. STOP if the PostgreSQL client major is not 17.

**A2 — age (only if A1 printed NO_AGE)**

```bash
sudo apt-get install -y age
```

Expect it installs. STOP on any error.

**A3 — dedicated clone for the scheduled job**

```bash
git clone "$(git -C ~/RAD-LAB remote get-url origin)" ~/RAD-LAB-backup
```

Expect `Cloning into`. A separate clone keeps your branch work in `~/RAD-LAB` from changing the code the schedule runs. STOP on error.

**A4 — pin the reviewed commit and install**

```bash
cd ~/RAD-LAB-backup && git switch --detach origin/main && git log -1 --format=%h && npm ci --omit=dev --no-audit --no-fund
```

Expect a short commit hash that contains the merged RAD-086 PR, then `added N packages`. STOP if `scripts/ops/laptop-backup.mjs` does not exist. Update later only by repeating this step after reviewing a merge.

**A5 — Postgres image**

```bash
docker pull postgres:17.11 && docker image inspect postgres:17.11 --format '{{.Id}}'
```

Expect an image id `sha256:…`. STOP if the pull fails or Docker Desktop is not running.

**A6 — Supabase CA certificate (public file)**

Download it yourself from the project's dashboard (Database settings, SSL configuration, download certificate). Do not use `sslmode=require`, `--insecure` or any skip-verification option. Then:

```bash
WINHOME="$(wslpath "$(cmd.exe /c 'echo %USERPROFILE%' 2>/dev/null | tr -d '\r')")"; ls "$WINHOME/Downloads" | grep -i '\.crt$'
```

Expect your certificate file name. Then copy it (replace `FILE.crt`):

```bash
install -d -m 700 ~/.config/rad-lab-backup && install -m 600 "$WINHOME/Downloads/FILE.crt" ~/.config/rad-lab-backup/supabase-ca.crt
```

Check it:

```bash
openssl x509 -in ~/.config/rad-lab-backup/supabase-ca.crt -noout -subject -enddate
```

Expect a subject and a future `notAfter`. STOP on `unable to load certificate`.

**A7 — log encryption key (age)**

The unattended job gets only the **public** recipient: it can add log entries but cannot read any. The private identity is protected by a passphrase and kept off the laptop. Choose a strong passphrase and store it in your password manager.

```bash
age-keygen 2> ~/age-public.txt | age -p -o ~/rad-lab-log-identity.age
```

Expect two passphrase prompts. Then:

```bash
cat ~/age-public.txt
```

Expect one line `Public key: age1…` (62 characters after the colon-space). Copy that `age1…` value for A8. Prove the identity opens:

```bash
age -d ~/rad-lab-log-identity.age > /dev/null && echo IDENTITY_OK
```

Expect `IDENTITY_OK`. Now copy `~/rad-lab-log-identity.age` to the BitLocker-protected USB and to a password-manager attachment (it is useless without the passphrase), then:

```bash
rm ~/rad-lab-log-identity.age ~/age-public.txt
```

STOP if the identity does not open: do not continue with a key you cannot read. Losing the key makes old log entries unreadable but never affects the backups themselves; to rotate, generate a new key, change `ageRecipient` in the config (`init-config` refuses to overwrite: delete the old config first) and keep the old identity for old entries.

**A8 — config (non-secret)**

Copy the **Session pooler** host from the project's Connect panel (port must show 5432; the 6543 transaction-pooler tab is the wrong one). Replace the three placeholders:

```bash
cd ~/RAD-LAB-backup && node scripts/ops/laptop-backup.mjs init-config --project-ref PROJECT_REF --endpoint session-pooler --pooler-host POOLER_HOST --age-recipient AGE1_VALUE
```

Expect `{"config_written":1}`. STOP on `STOP laptop_backup:config`: a field is malformed (host must look like `aws-0-<region>-<n>.pooler.supabase.com`; ref is 20 lowercase letters). If your real pooler host does not match that shape, report the shape; the pattern is changed only by a reviewed code change.

**A9 — database password file**

The `postgres` role's password from your password manager. Typing is hidden; nothing is echoed or stored elsewhere.

```bash
node scripts/ops/laptop-backup.mjs init-password
```

Expect `{"password_file_written":1,"replaced":0}`. STOP on anything else. Check:

```bash
stat -c '%a %U %n' ~/.config/rad-lab-backup/pgpass ~/.config/rad-lab-backup/config.json
```

Expect `600 <you>` twice. The file lives in the WSL home on the BitLocker-encrypted disk, outside any checkout.

## B. First backup (attended)

**B1 — dry run, zero connections**

```bash
node scripts/ops/laptop-backup.mjs run --dry-run
```

Expect `{"dry_run":1,"database_connections":0,"client_major":17,"client_minor":11,"backups_present":0}`. STOP codes: `tools` (a client is not major 17 or `age` missing), `perms` (a file is not private or backup folder is inside a checkout), `config`.

**B2 — real backup**

```bash
node scripts/ops/laptop-backup.mjs run
```

Expect one JSON line: `backup_archives` 2, `roles_bytes`, `dump_bytes`, `toc_entries`, `tables_counted`, `count_errors` 0, `rows_total`, `server_version_num` 170011, `log_entries` 1. STOP on `STOP laptop_backup:<stage>`: `connect` (network, password or TLS verification; never lower `verify-full`), `snapshot` (the pooler or role rejected the exported snapshot or idle transaction; report it, there is deliberately no fallback to an inconsistent dump), `locale`, `counts`, `dump_roles`, `dump_data`, `toc`, `log`, `tools`. A failed run renames its folder to `<stamp>.failed` and writes a `stop` log entry; the scheduler never retries. `count_errors` above 0 means some tables could not be counted: STOP and report the number.

**B3 — verify checksums**

```bash
node scripts/ops/laptop-backup.mjs verify latest
```

Expect `{"verified_files":2,"verified_bytes":N}`. This proves integrity of what was written, not restorability (C does that).

**B4 — permissions**

```bash
stat -c '%a %n' ~/rad-lab-backups ~/rad-lab-backups/2*/*
```

Expect `700` for the root and `600` for every file in the newest folder (`checksums.json`, `db-meta.json`, `project.dump`, `roles.sql`). STOP if any differs.

## C. Restore proof into a local container

The container runs `postgres:17.11` with `--network none` (no network at all, no published port), the **live** `datcollate`/`datctype` recorded in `db-meta.json`, `--pull never`, and is removed with its volume at the end.

**C1 — dry run**

```bash
node scripts/ops/laptop-restore-test.mjs --dry-run
```

Expect `{"dry_run":1,"tables":N,"docker_started":0}`. STOP: Docker Desktop not running, image missing (A5), checksum mismatch (`verify`).

**C2 — restore and compare**

```bash
node scripts/ops/laptop-restore-test.mjs
```

Expect `tables_mismatched` 0, `container_server_version_num` 170011, `collation_match` 1, `restore_test_pass` 1. Counts were taken in the same snapshot as the dump, so any mismatch is real. STOP codes: `counts`, `collation`, `version` (container is not the production version: update `IMAGE` only by a reviewed change), `roles` or `restore` (Supabase-managed roles/objects did not load), and `extensions`, printed as `missing_extensions=a,b`: the plain Postgres image lacks extensions the project uses. That is **not a pass**. Options for you to decide, none taken here: restore with a matching `supabase/postgres` image, or the separately reviewed local reproduction already named in the [P9 runbook](RAD-062_P09_LAPTOP_RUNBOOK.md#3-restore-apply-m01m08-verify-on-local-postgresql). Never use `--no-owner`, `--no-acl`, or drop extension entries to force a pass.

**C3 — nothing left behind**

```bash
docker ps -a --filter label=rad-lab-restore-test=1 --format '{{.Names}}'
```

Expect empty output. If a name appears, run `docker rm -f -v <name>`.

**C4 — read the reconciliation log (owner only)**

```bash
install -m 600 /dev/null /dev/shm/rad-log-id && age -d /PATH/TO/rad-lab-log-identity.age > /dev/shm/rad-log-id
```

Expect a passphrase prompt (the identity lands in RAM only). Then:

```bash
node scripts/ops/laptop-backup.mjs log-read --identity /dev/shm/rad-log-id
```

Expect a JSON array: a `backup` entry (date, sizes, `dump_sha256`, `roles_sha256`, `server_version_num`, locale, `restore_test: "not_run"`) and a `restore_test` entry (`result: "pass"`, counts, image id). Then `rm /dev/shm/rad-log-id`. `STOP laptop_backup:log` with a chain error means an entry was deleted or reordered: report it. The log shows tampering by omission; it is reconciliation evidence, not a tamper-proof ledger.

## D. Automatic daily run (Windows Task Scheduler → WSL)

**D1 — absolute node path (WSL)**

```bash
command -v node
```

Expect an absolute path. Task Scheduler does not load your shell profile, so a version-manager path (nvm) may break the task; if so install system Node 22 or use that absolute path consistently.

**D2 — register the task (PowerShell on Windows, not WSL)**

Replace `USER` and the node path:

```powershell
$a = New-ScheduledTaskAction -Execute 'wsl.exe' -Argument '-d Ubuntu-24.04 --exec /usr/bin/node /home/USER/RAD-LAB-backup/scripts/ops/laptop-backup.mjs run'
$t = New-ScheduledTaskTrigger -Daily -At 3:15am
$s = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName 'RAD-LAB daily backup' -Action $a -Trigger $t -Settings $s
```

Expect the task listed with State `Ready`. The task runs as you, only while you are signed in; a missed run starts when the laptop is next available.

**D3 — prove unattended run**

```powershell
Start-ScheduledTask -TaskName 'RAD-LAB daily backup'; Start-Sleep 90; (Get-ScheduledTaskInfo -TaskName 'RAD-LAB daily backup').LastTaskResult
```

Expect `0`. Then in WSL `node scripts/ops/laptop-backup.mjs status` shows a second backup. STOP on non-zero: run B2 by hand to read the stage code.

**D4 — health check, at least weekly**

```bash
node scripts/ops/laptop-backup.mjs status
```

Expect `{"backups":N,"newest_age_days":0,...}` (0 or 1). `STOP laptop_backup:stale` (older than 2 days) or `no_backup`: investigate before relying on any backup. Nothing alerts you on its own: this check is the control.

## E. Weekly USB copy (D2 recommendation)

**E1 —** In Windows, turn on BitLocker To Go for the USB drive (right-click the drive, Turn on BitLocker). Backups hold participant data; never copy to an unencrypted drive. Expect a lock icon on the drive. STOP if BitLocker is unavailable.

**E2 — copy (drive letter `e` is an example)**

```bash
LATEST="$(ls ~/rad-lab-backups | grep -E '^[0-9]{8}T[0-9]{6}Z$' | tail -1)"; mkdir -p /mnt/e/rad-lab-backups && cp -rn ~/rad-lab-backups/"$LATEST" ~/rad-lab-backups/reconciliation /mnt/e/rad-lab-backups/ && echo "$LATEST"
```

Expect the date-stamp printed. STOP if `/mnt/e` is not your encrypted USB.

**E3 — verify the copy**

```bash
DIR=/mnt/e/rad-lab-backups/"$LATEST" python3 -c "import hashlib,json,os,pathlib;p=pathlib.Path(os.environ['DIR']);h=json.loads((p/'checksums.json').read_text());assert sorted(h)==['project.dump','roles.sql'];[print(f,hashlib.sha256((p/f).read_bytes()).hexdigest()==d) for f,d in h.items()]"
```

Expect two lines ending `True`. Eject, store the USB away from the laptop. Proposal: keep the last 4 weekly copies; overwrite the oldest.

## F. Retention proposal (owner to approve; no automatic deletion exists)

- Laptop: keep every daily for 14 days, then the Sunday backup of each week for 8 weeks, then one per month for 6 months. Delete other folders by hand, only whole date folders, never the newest restore-tested one, never before its weekly USB copy exists. Reconciliation entries are never deleted (a few hundred bytes each).
- Size is not yet known: `status` prints `newest_bytes`. Review the policy when the backup folder passes 25 GB or free disk drops below 20%. WSL disks do not shrink on their own after deletion.
- Retention of participant data in backups belongs to the privacy gate; this proposal does not decide it.

## G. Password file: create, rotate, delete

- **Create:** A9. Never `cat` the file, never paste it anywhere, never run the tools under `set -x`.
- **Rotate (do this at a time the 3:15 job will not run):** first reset the database password in the Supabase dashboard; then `node scripts/ops/laptop-backup.mjs init-password --replace` (writes a new 0600 file and replaces atomically); then B2 once by hand. A run between the two steps fails with `connect` and logs a `stop` entry; that is harmless.
- **Delete:** in PowerShell `Unregister-ScheduledTask -TaskName 'RAD-LAB daily backup'`, then `rm ~/.config/rad-lab-backup/pgpass`, then reset the database password in the dashboard. Deleting a file does not erase disk blocks; the password reset is the real revocation. If the laptop is lost or stolen: reset the password first.

## H. Supavisor old-credential / cache rejection test (RAD-059 item) — DESIGN ONLY

**Disposition: the test against the real worker credential is impossible without revealing or enabling the DISABLED secret, so that part is STOP.** The old worker password lives only in a DISABLED Secret Manager version, and the worker role is NOLOGIN, so a production attempt would be refused for the role attribute and say nothing about a Supavisor cache. A scratch-project test measures the mechanism without any production role or secret; whether it is accepted as the RAD-059 evidence is the owner's decision. `pooler_cache_verified` stays false everywhere until you record that decision.

**Procedure S (scratch project, owner-run)**: a free scratch Supabase project in the same region as production, holding no data. Replace `SREF` and `SHOST` with its ref and its session-pooler host.

**S1 — throwaway credential file**

```bash
umask 077 && mkdir -p ~/probe && openssl rand -hex 24 > ~/probe/p1
```

**S2 — scratch admin password file** (the scratch project's own `postgres` password; scratch only)

```bash
read -rs -p 'Scratch postgres password: ' SP && printf '%s:5432:postgres:postgres.%s:%s\n' "$SHOST" "$SREF" "$SP" > ~/probe/admin-pgpass; unset SP
```

**S3 — create the probe role with the throwaway password**

```bash
printf "create role rad_probe login password '%s';\n" "$(cat ~/probe/p1)" | PGPASSFILE=~/probe/admin-pgpass psql "host=$SHOST port=5432 user=postgres.$SREF dbname=postgres sslmode=verify-full sslrootcert=$HOME/.config/rad-lab-backup/supabase-ca.crt" -X -v ON_ERROR_STOP=1
```

Expect `CREATE ROLE`. (`printf` is a shell builtin, so the password never appears in a process list.)

**S4 — probe pgpass and a positive control**

```bash
printf '%s:5432:postgres:rad_probe.%s:%s\n' "$SHOST" "$SREF" "$(cat ~/probe/p1)" > ~/probe/probe-pgpass && PGPASSFILE=~/probe/probe-pgpass psql "host=$SHOST port=5432 user=rad_probe.$SREF dbname=postgres sslmode=verify-full sslrootcert=$HOME/.config/rad-lab-backup/supabase-ca.crt" -X -At -c 'select 1'
```

Expect `1`. STOP if it fails: the probe is not valid yet.

**S5 — revoke variant 1 (NOLOGIN)**

```bash
echo 'alter role rad_probe nologin;' | PGPASSFILE=~/probe/admin-pgpass psql "host=$SHOST port=5432 user=postgres.$SREF dbname=postgres sslmode=verify-full sslrootcert=$HOME/.config/rad-lab-backup/supabase-ca.crt" -X -v ON_ERROR_STOP=1
```

**S6 — retry the old credential over time**

```bash
for t in 0 30 60 90 120; do sleep $t; PGPASSFILE=~/probe/probe-pgpass psql "host=$SHOST port=5432 user=rad_probe.$SREF dbname=postgres sslmode=verify-full sslrootcert=$HOME/.config/rad-lab-backup/supabase-ca.crt" -X -At -c 'select 1' >/dev/null 2>&1 && echo "t+${t}s ACCEPTED" || echo "t+${t}s rejected"; done
```

Pass: every line `rejected` (cumulative delays 0, 30, 90, 180, 300 s). Fail: any `ACCEPTED` after revocation, which means the pooler honored a stale credential: record the first accepted time, do not enable any production worker login, and take the owner decision below.

**S7 — revoke variant 2 (rotation)**: repeat S3 with `alter role rad_probe login password` set to a *new* value (write a new file `~/probe/p2` the same way as S1), run S6 with the **old** `probe-pgpass`, then run it with a pgpass built from `p2` as the positive control. Pass: old rejected throughout, new accepted (so the pooler was up and the rejection was credential-specific).

**S8 — cleanup**

```bash
rm -rf ~/probe
```

Then delete the scratch project in its dashboard. Record only: variant, seconds, accepted/rejected. No passwords, hosts or refs in the report.

**What S proves and does not.** It measures how the shared Supavisor treats a revoked or rotated role in a scratch tenant of the same region. It does not use or prove anything about the production tenant's configuration, the real worker role or the disabled secret. Existing sessions are unaffected by NOLOGIN or a password change in PostgreSQL; ending them needs `pg_terminate_backend` and is covered by the containment runbook, not this test.

**Options for the production-specific part (owner chooses; none executed):**

1. Accept S as sufficient evidence (recommended: no production change).
2. Run the same test in production with a temporary throwaway LOGIN role, created and dropped through a separately reviewed SQL packet. Gives tenant-specific evidence, but briefly changes production login posture.
3. Test at the first intentional real credential rotation, capturing the old value into a 0600 file *before* disabling it. Not possible for the current DISABLED version.
4. Ask Supabase for a written statement of Supavisor credential-cache lifetime and invalidation. Documentary only.
5. Remove the dependence: make every worker rotation use a **new** login name so no old credential can authenticate. A design change outside this task.

## I. Ceilings and what stays unproven (S-STD-3)

- **Availability:** runs only while the laptop is on and you are signed in; nothing alerts on a missed day. Lifting trigger: the first real exam or any missed week, then decide on alerting.
- **Credential:** the file holds the `postgres` password because a complete dump needs it. Lifting trigger: a dedicated read-only backup role reviewed for the auth and managed schemas.
- **Hard-coded:** PostgreSQL major in the config and `postgres:17.11` in the restore tool; a production upgrade makes the restore test STOP at `version` until a reviewed change.
- **Single site:** laptop plus weekly BitLocker USB; no cloud copy by decision.
- **Not exercised anywhere yet:** the live pooler, TLS `verify-full` against its certificate, Docker Desktop on this laptop, Task Scheduler. The first attended runs (B, C, D3) are those tests. DB day (`apply`) deliberately does not accept the pooler: see the [P9 runbook](RAD-062_P09_LAPTOP_RUNBOOK.md#1-preconditions--no-mutation).
