# RAD-086 — owner laptop: daily backup, restore proof, credential-cache test (WSL2)

Reviewed procedure for the owner's later execution on the verified laptop (Windows 11 Pro, BitLocker on C:, WSL2 Ubuntu 24.04, Node 22, psql/pg_dump 17.11 = production 17.11, Docker Desktop with WSL integration). **Nothing here has been run against the live project.** The agent ran no live SQL, set no Variables, opened no gate, enabled no LOGIN or secret and revealed no secret. Authority: [owner decisions 2026-10-31](DECISIONS.md#rad086-laptop-owner-2026-10-31) and [the follow-up decisions D-C, D-D, D-E](DECISIONS.md#rad086-followup-owner-2026-10-31), [D2](DECISIONS.md#rad085-owner-tidy-2026-10-27) (backup before the first real exam, no cloud, encrypted local reconciliation log, weekly USB copy), [RAD-059 dry run](RAD-059_OWNER_DRY_RUN_2026-10-29.md), [session-pooler rules](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي). Report: [RAD-086 report](RAD-086_REPORT_2026-10-31.md).

How it fits together: `scripts/ops/laptop-backup.mjs` (daily, read-only) builds a backup in `~/rad-lab-backups/.tmp/<stamp>` (`roles.sql`, `project.dump`, `checksums.json`, `db-meta.json`), re-verifies it from disk, moves it to `store/<stamp>` and then swaps three slot links (`daily`, `weekly`, `monthly`) atomically; every rotation is an age-encrypted entry in the reconciliation log (see F). `scripts/ops/laptop-restore-test.mjs` restores a chosen backup into a throwaway `supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d` container and compares table counts. Windows Task Scheduler starts the daily run through `wsl.exe`. The database connects over the **Supabase session pooler** (port 5432, IPv4) because this laptop has no global IPv6 and the direct host is IPv6-only. The pooler is an explicit setting in the config file, never detected, never a fallback.

Every step: one command, what you should see, when to STOP. At any STOP do nothing else: no retry loop, no weaker TLS, no workaround. Output is numbers or a fixed stage code, never data.

## A. One-time setup (WSL Ubuntu shell)

**A1 — tools**

```bash
node -v && psql --version && pg_dump --version && docker --version && (age --version || echo NO_AGE)
```

Expect `v22.x`, both PostgreSQL clients `17.11`, a Docker version. `NO_AGE` means do A2. STOP if the PostgreSQL client major is not 17.

**A2 — install age (Ubuntu 24.04 package)**

```bash
sudo apt-get update && sudo apt-get install -y age && age --version
```

Expect a version line (1.1.x). STOP on any error. Do this even if A1 already showed an age version: it is idempotent.

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

**A5 — pinned official Supabase Postgres image**

```bash
docker pull supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d && docker image inspect supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d --format '{{.Id}}'
```

Expect digest `sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d` and an image id `sha256:…`. This is the official multi-architecture index (linux/amd64 and linux/arm64), pinned with its tag; never substitute the tag alone. STOP if the pull fails or Docker Desktop is not running. The restore command never pulls. [Image decision](DECISIONS.md#rad086-supabase-image-owner-2026-10-31).

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

Expect one JSON line: `backup_archives` 2, `roles_bytes`, `dump_bytes`, `toc_entries`, `tables_counted`, `count_errors` 0, `rows_total`, `server_version_num` 170011, `slots_updated` 3 (the first backup fills all empty slots), `store_removed` 0, `log_entries` 4 (one backup entry and three rotation entries). STOP on `STOP laptop_backup:<stage>`: `connect` (network, password or TLS verification; never lower `verify-full`), `snapshot` (the pooler or role rejected the exported snapshot or idle transaction; report it, there is deliberately no fallback to an inconsistent dump), `locale`, `counts`, `dump_roles`, `dump_data`, `toc`, `verify` (the finished copy did not re-hash equal), `rotate` (a slot swap failed; slots already swapped are logged, the rest still hold their old copy), `log`, `collect`, `tools`. A failed run leaves every slot pointing at its previous verified backup, quarantines its partial work as `.tmp/<stamp>.failed` (removed by the next successful run) and writes a `stop` log entry; the scheduler never retries. `count_errors` above 0 means some tables could not be counted: STOP and report the number.

**B3 — verify checksums**

```bash
node scripts/ops/laptop-backup.mjs verify daily
```

Expect `{"verified_files":2,"verified_bytes":N}`. This proves integrity of what was written, not restorability (C does that).

**B4 — permissions**

```bash
stat -c '%a %n' ~/rad-lab-backups ~/rad-lab-backups/store ~/rad-lab-backups/daily/*
```

Expect `700` for the root and `store`, and `600` for every file in the daily backup (`checksums.json`, `db-meta.json`, `project.dump`, `roles.sql`). STOP if any differs. Then `ls -l ~/rad-lab-backups | grep -- '->'` shows `daily`, `weekly` and `monthly`, all three pointing at the same `store/<stamp>` after the first backup.

## C. Restore proof into a local container

The container runs `supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d` with `--network none` (no network at all, no published port), the recorded `datlocprovider`/`datlocale`/`datcollate`/`datctype` from `db-meta.json` (production: ICU `en-US`, both lc `en_US.UTF-8`), `--pull never`, and is removed with its explicitly allocated anonymous data volume at the end. It creates the target from `template0` and verifies all four locale fields before and after restore. Run A5 first: only the owner pulls the pinned digest. No password is passed in arguments; local image bootstrap uses `supabase_admin`. The encrypted result records both `image_digest` and the architecture-specific `image_id` (also on failure if inspect succeeded).

Both tools accept `daily` (default, also `latest`), `weekly`, `monthly` or an exact stamp present in `store/`.

**C1 — dry run**

```bash
node scripts/ops/laptop-restore-test.mjs --dry-run
```

Expect `{"dry_run":1,"tables":N,"docker_started":0}`. STOP: Docker Desktop not running, image missing (A5), checksum mismatch (`verify`).

**C2 — restore and compare**

```bash
node scripts/ops/laptop-restore-test.mjs
```

Expect `tables_mismatched` 0, `container_server_version_num` 170011, `collation_match` 1, `restore_test_pass` 1. Counts were taken in the same snapshot as the dump, so any mismatch is real. STOP codes: `counts`, `collation`, `version` (server must exactly match the backup, production `170011`), `roles`, `restore`, or `extensions`, printed as `missing_extensions=a,b`. Every EXTENSION entry in the archive TOC must be available; missing one is a hard STOP, including `supabase_vault`. Never use `--no-owner`, `--no-acl`, or drop TOC entries to force a pass.

Role rule: a pg_dumpall CREATE/ALTER-WITH pair for a new role executes normally. For an existing role, a temporary probe role receives the archive attributes, including PostgreSQL defaults for omitted options. All server-defined role attributes are compared, excluding OID/name, password (the backup uses `--no-role-passwords`); role settings (`rolconfig`) are included, using the archive ALTER ROLE SET statements on the probe as well. A match accepts only that duplicate pair; any difference STOP `roles`. The existing role is never altered to manufacture a match. Probe roles are dropped; the role archive runs in one transaction with `ON_ERROR_STOP=1`. Settings, memberships and every other statement must load without errors; unsupported dump syntax has no error suppression. A STOP rolls back the role transaction and cleans up the container/volume. Report a mismatch; do not edit the archive or weaken the rule.

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

Expect a JSON array: a `backup` entry (date, sizes, `dump_sha256`, `roles_sha256`, `server_version_num`, locale, slots, `restore_test: "not_run"`), one `rotation` entry per slot swap (`slot`, `from`, `to`), a `prune` entry when old copies were removed, `stop` entries for failures, and `restore_test` entries (`result`, counts, image id). Then `rm /dev/shm/rad-log-id`. `STOP laptop_backup:log` with a chain error means an entry was deleted or reordered: report it. The log shows tampering by omission; it is reconciliation evidence, not a tamper-proof ledger.

## D. Automatic daily run (Windows Task Scheduler → WSL)

**D1 — absolute node path (WSL)**

```bash
command -v node
```

Expect an absolute path. Your Node comes from nvm, so it looks like `/home/USER/.nvm/versions/node/v22.x.x/bin/node`. Copy exactly what is printed; D2 must use that path, **not** `/usr/bin/node`. Task Scheduler does not load your shell profile, so only an absolute path works. After an nvm upgrade or switch this path changes: repeat D1 and D2.

**D2 — register the task (PowerShell on Windows, not WSL)**

Replace `NODE_ABS` with the D1 path and `USER` with your WSL user name:

```powershell
$a = New-ScheduledTaskAction -Execute 'wsl.exe' -Argument '-d Ubuntu-24.04 --exec NODE_ABS /home/USER/RAD-LAB-backup/scripts/ops/laptop-backup.mjs run'
$t = New-ScheduledTaskTrigger -Daily -At 3:15am
$s = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName 'RAD-LAB daily backup' -Action $a -Trigger $t -Settings $s
```

Expect the task listed with State `Ready`. The task runs as you, only while you are signed in; a missed run starts when the laptop is next available. Slot promotion uses the **UTC** date of the run (03:15 in Baghdad is 00:15 UTC, the same calendar day).

**D3 — prove unattended run**

```powershell
Start-ScheduledTask -TaskName 'RAD-LAB daily backup'; Start-Sleep 90; (Get-ScheduledTaskInfo -TaskName 'RAD-LAB daily backup').LastTaskResult
```

Expect `0`. Then in WSL `node scripts/ops/laptop-backup.mjs status` shows a second backup. STOP on non-zero: run B2 by hand to read the stage code.

**D4 — health check, at least weekly**

```bash
node scripts/ops/laptop-backup.mjs status
```

Expect `{"slots_filled":3,"daily_age_days":0,"weekly_age_days":N,"monthly_age_days":N,"stored_backups":1..3,"newest_bytes":N}` (`daily_age_days` 0 or 1). `STOP laptop_backup:stale` (older than 2 days) or `no_backup`: investigate before relying on any backup. Nothing alerts you on its own: this check is the control.

## E. Weekly USB copy (D2 recommendation)

**E1 —** In Windows, turn on BitLocker To Go for the USB drive (right-click the drive, Turn on BitLocker). Backups hold participant data; never copy to an unencrypted drive. Expect a lock icon on the drive. STOP if BitLocker is unavailable.

**E2 — copy (drive letter `e` is an example)**

```bash
LATEST="$(readlink ~/rad-lab-backups/daily | sed 's#^store/##')"; mkdir -p /mnt/e/rad-lab-backups && cp -rn ~/rad-lab-backups/store/"$LATEST" ~/rad-lab-backups/reconciliation /mnt/e/rad-lab-backups/ && echo "$LATEST"
```

Expect the date-stamp printed. STOP if `/mnt/e` is not your encrypted USB.

**E3 — verify the copy**

```bash
DIR=/mnt/e/rad-lab-backups/"$LATEST" python3 -c "import hashlib,json,os,pathlib;p=pathlib.Path(os.environ['DIR']);h=json.loads((p/'checksums.json').read_text());assert sorted(h)==['project.dump','roles.sql'];[print(f,hashlib.sha256((p/f).read_bytes()).hexdigest()==d) for f,d in h.items()]"
```

Expect two lines ending `True`. Eject, store the USB away from the laptop. Recommended: do this every week; keep the last 4 weekly copies on the USB and overwrite the oldest (the USB is outside the automatic rotation and is never touched by it).

## F. Retention: three rotating slots (owner decision D-E), automatic

Exactly three copies at most, each in its own slot: **daily** (every run), **weekly** (the run on a Sunday) and **monthly** (the run on the 1st of the month), by the UTC calendar date of the run. An empty weekly or monthly slot is filled by the first backup because there is no older copy to keep. There is no hand deletion and nothing to schedule:

1. The new backup is written under `.tmp/`, then re-read and checked against its SHA-256 digests (`verify` stage).
2. Only then is it moved to `store/<stamp>` and each due slot link is replaced atomically (a new link renamed over the old one).
3. Any failure before step 2 leaves every slot on its old copy. A swap that fails midway leaves the remaining slots on their old copies; the slots that did swap are logged.
4. After the swaps, `store/` directories that no slot references, and leftovers in `.tmp/`, are removed. If no slot resolves, nothing is removed.
5. Every rotation (`slot`, `from`, `to`), every prune and every stop is an entry in the encrypted reconciliation log (C4 reads it).

Disk need is at most three backups plus one in progress. The USB copy (E) is the only extra history and stays manual. Tests prove success, failure-keeps-old and the Sunday and 1st promotions. Weakness to know: a dump that is complete and verified but wrong for some reason replaces the daily copy the next day, so a restore test (C) after the first backup and periodically afterwards matters. Retention of participant data in backups still belongs to the privacy gate.

## G. Password file: create, rotate, delete

- **Create:** A9. Never `cat` the file, never paste it anywhere, never run the tools under `set -x`.
- **Rotate (do this at a time the 3:15 job will not run):** first reset the database password in the Supabase dashboard; then `node scripts/ops/laptop-backup.mjs init-password --replace` (writes a new 0600 file and replaces atomically); then B2 once by hand. A run between the two steps fails with `connect` and logs a `stop` entry; that is harmless.
- **Delete:** in PowerShell `Unregister-ScheduledTask -TaskName 'RAD-LAB daily backup'`, then `rm ~/.config/rad-lab-backup/pgpass`, then reset the database password in the dashboard. Deleting a file does not erase disk blocks; the password reset is the real revocation. If the laptop is lost or stolen: reset the password first.

## H. Supavisor old-credential / cache rejection test (RAD-059 item): owner-run SQL packet

Owner decision D-D chose a temporary throwaway LOGIN role **in production** over the session pooler. The reviewed packet is [RAD-086 probe SQL packet](RAD-086_PROBE_SQL_PACKET.md): two uniquely named roles (`rad086_probe_<hex>_a`, `_b`), random passwords from 0600 files, `NOINHERIT`, no memberships, no grants, `CONNECTION LIMIT 1`, `VALID UNTIL` 45 minutes ahead; a positive control; a NOLOGIN variant and a rotation variant with timed retries (0/30/90/180/300 s); then session termination, `DROP ROLE` and a read-only proof that the roles are gone. It never touches `assess_job_a/b`, `assess_worker`, the launch gate, the secret or any existing role, and it never reveals or enables the DISABLED secret. Its SQL parts run in the repo tests against a synthetic local cluster; the timed retries and the production pooler have not been exercised. Every step has a STOP and the packet has a teardown section to run after any failure. Record only variant, seconds and accepted/rejected. The result is evidence about the production pooler for a role of this kind, not about the disabled worker secret, and it does not by itself set `pooler_cache_verified`.

## I. Ceilings and what stays unproven (S-STD-3)

- **Availability:** runs only while the laptop is on and you are signed in; nothing alerts on a missed day. Lifting trigger: the first real exam or any missed week, then decide on alerting.
- **Credential:** the file holds the `postgres` password because a complete dump needs it. Lifting trigger: a dedicated read-only backup role reviewed for the auth and managed schemas.
- **Hard-coded:** PostgreSQL major in the config and `supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d` in the restore tool; a production upgrade makes the restore test STOP at `version` until a reviewed change.
- **Single site:** laptop plus weekly BitLocker USB; no cloud copy by decision.
- **Not exercised anywhere yet:** the live pooler, TLS `verify-full` against its certificate, Docker Desktop on this laptop, Task Scheduler. The first attended runs (B, C, D3) are those tests. DB day (`apply`) may use the pooler under the same exact selectors (owner decision D-C); `restore` stays local-only and `verify` offline: see the [P9 runbook](RAD-062_P09_LAPTOP_RUNBOOK.md#1-preconditions--no-mutation).
- **Retention depth:** three copies only; no history beyond the weekly USB copies. Lifting trigger: the first real exam, when the owner may add slots.
- **Probe packet:** creates a LOGIN role in production for about 25 minutes by owner decision; the backstop is `VALID UNTIL` plus the teardown.
