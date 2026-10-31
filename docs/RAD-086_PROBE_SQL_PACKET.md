# RAD-086 — Supavisor old-credential / cache probe: owner-run SQL packet (production, session pooler)

Authority: [owner decision D-D, 2026-10-31](DECISIONS.md#rad086-followup-owner-2026-10-31) (option 2: a temporary throwaway LOGIN role in production) for the [RAD-059 item](RAD-059_OWNER_DRY_RUN_2026-10-29.md). Run from the laptop over the **session pooler** with the [RAD-086 runbook](RAD-086_LAPTOP_BACKUP_RUNBOOK.md) files. **Nothing here has been run.** The agent executes no SQL, reveals no secret and enables no existing login.

**Scope guard.** Every statement that changes anything names only the two probe roles (`rad086_probe_<8 hex>_a` and `_b`, or matches the exact regex `^rad086_probe_[0-9a-f]{8}_[ab]$`). It never touches `assess_job_a`, `assess_job_b`, `assess_worker`, `assess.launch_gate`, any Secret Manager version or any other role; those are only *read* (P0b, P8b) to prove they did not change. No `GRANT`, no `CASCADE`, no `DROP OWNED`. Each probe role is `LOGIN NOINHERIT`, no superuser/createdb/createrole/replication/bypassrls, `CONNECTION LIMIT 1`, no memberships, and `VALID UNTIL` 45 minutes ahead as a backstop. PostgreSQL defaults to PUBLIC `CONNECT` on the database; the probe only runs `select 1`.

**When.** Gate closed, no real attempt open, not during DB day, not within the 60-minute P10 window. Allow 25 minutes. Passwords are random hex in 0600 files; they are throwaway, but the server may log the `CREATE`/`ALTER` text, which is one more reason the roles are dropped at the end. Each fenced part is under 15,000 characters and is one statement or one SELECT per step.

**Record only:** variant, seconds, accepted/rejected. No role names, hosts, refs or passwords in any report.

## 0. Session setup (once per shell)

```bash
read -r REF POOLER CA < <(node -p 'const c=require(process.env.HOME+"/.config/rad-lab-backup/config.json");[c.projectRef,c.poolerHost,c.caFile].join(" ")'); echo "$POOLER" | grep -E '^aws-[0-9]+-[a-z]{2}(-[a-z]+)+-[0-9]+\.pooler\.supabase\.com$'
```

Expect your pooler host printed. **STOP** if empty or `undefined` (the config is not a session-pooler config).

```bash
adm() { PGPASSFILE="$HOME/.config/rad-lab-backup/pgpass" psql "host=$POOLER port=5432 user=postgres.$REF dbname=postgres sslmode=verify-full sslrootcert=$CA connect_timeout=15" -X -q -v ON_ERROR_STOP=1 "$@"; }
mkpass() { printf '%s:5432:postgres:%s.%s:%s\n' "$POOLER" "$1" "$REF" "$(cat "$3")" > "$2"; }
prb() { PGPASSFILE="$2" psql "host=$POOLER port=5432 user=$1.$REF dbname=postgres sslmode=verify-full sslrootcert=$CA connect_timeout=15" -X -At -c 'select 1' > /dev/null 2>&1 && echo ACCEPTED || echo rejected; }
```

`adm` uses the backup password file (the production `postgres` credential, never printed); `prb` connects as a probe role using a probe-only password file.

**S1 — names and throwaway passwords**

```bash
umask 077; mkdir -p ~/probe; S=$(openssl rand -hex 4); echo "rad086_probe_${S}_a" > ~/probe/name_a; echo "rad086_probe_${S}_b" > ~/probe/name_b; openssl rand -hex 24 > ~/probe/pa1; openssl rand -hex 24 > ~/probe/pb1; openssl rand -hex 24 > ~/probe/pb2; ls ~/probe | wc -l
```

Expect `5`.

## 1. Read-only baseline

**P0a — no leftover probe roles**

```bash
adm -At <<'SQL'
select count(*) as leftover_probe_roles from pg_roles where rolname ~ '^rad086_probe_[0-9a-f]{8}_[ab]$';
SQL
```

Expect `0`. **STOP** otherwise: go to section 5 (cleanup) first.

**P0b — protected roles, observation only**

```bash
adm -At <<'SQL'
select count(*) filter (where rolcanlogin) as protected_login, count(*) as protected_present from pg_roles where rolname in ('assess_job_a','assess_job_b','assess_worker');
SQL
```

Expect `0|3` (or your known present count; note it). The same query is repeated at the end and must print the same line. **STOP** if any protected role can login.

## 2. Create the two probe roles

**P1a — role A (NOLOGIN variant)**

```bash
adm <<'SQL'
\set rname `cat ~/probe/name_a`
\set rpw `cat ~/probe/pa1`
\set until `date -u -d '+45 minutes' '+%Y-%m-%d %H:%M:%S+00'`
create role :"rname" login password :'rpw' noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls connection limit 1 valid until :'until';
SQL
```

Expect no error output. **STOP** on any error: section 5.

**P1b — role B (rotation variant)**

```bash
adm <<'SQL'
\set rname `cat ~/probe/name_b`
\set rpw `cat ~/probe/pb1`
\set until `date -u -d '+45 minutes' '+%Y-%m-%d %H:%M:%S+00'`
create role :"rname" login password :'rpw' noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls connection limit 1 valid until :'until';
SQL
```

**P2 — attributes**

```bash
adm -At <<'SQL'
\set a `cat ~/probe/name_a`
\set b `cat ~/probe/name_b`
select count(*) filter (where rolcanlogin and not rolinherit and not rolsuper and not rolcreaterole and not rolcreatedb and not rolreplication and not rolbypassrls and rolconnlimit = 1 and rolvaliduntil is not null and rolvaliduntil < now() + interval '50 minutes') || '|' || (select count(*) from pg_auth_members m join pg_roles r on r.oid in (m.member, m.roleid) where r.rolname in (:'a', :'b')) from pg_roles where rolname in (:'a', :'b');
SQL
```

Expect `2|0`. **STOP** otherwise: section 5.

## 3. Variant 1 — NOLOGIN

**P3 — positive control (this also puts the credential into any pooler cache)**

```bash
A=$(cat ~/probe/name_a); mkpass "$A" ~/probe/pass_a1 ~/probe/pa1; prb "$A" ~/probe/pass_a1
```

Expect `ACCEPTED`. **STOP** on `rejected`: the probe is invalid; section 5.

**P4a — revoke**

```bash
adm <<'SQL'
\set a `cat ~/probe/name_a`
alter role :"a" nologin;
SQL
```

**P4b — timed retries with the old credential**

```bash
T=0; for d in 0 30 60 90 120; do sleep $d; T=$((T+d)); echo "nologin ${T}s $(prb "$(cat ~/probe/name_a)" ~/probe/pass_a1)"; done
```

Pass: five lines ending `rejected` (0, 30, 90, 180, 300 s). **Any `ACCEPTED` is a finding**: write down the seconds, go straight to section 5, enable nothing, and report it.

## 4. Variant 2 — rotation

**P5a — positive control with the original password**

```bash
B=$(cat ~/probe/name_b); mkpass "$B" ~/probe/pass_b1 ~/probe/pb1; prb "$B" ~/probe/pass_b1
```

Expect `ACCEPTED`.

**P5b — rotate the password**

```bash
adm <<'SQL'
\set b `cat ~/probe/name_b`
\set pw2 `cat ~/probe/pb2`
alter role :"b" password :'pw2';
SQL
```

**P5c — timed retries with the old password**

```bash
T=0; for d in 0 30 60 90 120; do sleep $d; T=$((T+d)); echo "rotation-old ${T}s $(prb "$(cat ~/probe/name_b)" ~/probe/pass_b1)"; done
```

Pass: all `rejected`. Any `ACCEPTED` is a finding (as above).

**P5d — the new password works (the rejection was credential-specific)**

```bash
B=$(cat ~/probe/name_b); mkpass "$B" ~/probe/pass_b2 ~/probe/pb2; echo "rotation-new $(prb "$B" ~/probe/pass_b2)"
```

Expect `ACCEPTED`. `rejected` means the pooler or role is broken and the variant proves nothing: section 5, then repeat with fresh roles.

**P5e — the expiry backstop had not yet fired (rejections were not caused by expiry)**

```bash
adm -At <<'SQL'
\set a `cat ~/probe/name_a`
\set b `cat ~/probe/name_b`
select count(*) from pg_roles where rolname in (:'a', :'b') and rolvaliduntil > now();
SQL
```

Expect `2`. If `0`, the 45 minutes elapsed: discard the results, run section 5 and start over.

## 5. Teardown (always run, also after any STOP or finding)

**C1 — end any probe sessions**

```bash
adm -At <<'SQL'
select count(pg_terminate_backend(pid)) from pg_stat_activity where usename ~ '^rad086_probe_[0-9a-f]{8}_[ab]$';
SQL
```

Expect a number (0 is normal). If it errors for permission reasons, continue: dropping the role still prevents new logins and the 45-minute expiry stands.

This step works even if the shell variables were lost or only one role was created.

**C2 — drop every probe role by exact pattern**

```bash
adm -At <<'SQL'
select format('drop role %I', rolname) from pg_roles where rolname ~ '^rad086_probe_[0-9a-f]{8}_[ab]$' \gexec
SQL
```

Plain `DROP ROLE`: no `IF EXISTS` masking, no `CASCADE`. **STOP** if it errors (for example a dependency): do not use `CASCADE` or `DROP OWNED`; report the error text without any value.

**C3 — prove they are gone and nothing else moved**

```bash
adm -At <<'SQL'
select count(*) as probe_roles_left from pg_roles where rolname ~ '^rad086_probe_[0-9a-f]{8}_[ab]$';
SQL
```

Expect `0`.

**P8b — protected roles unchanged**

```bash
adm -At <<'SQL'
select count(*) filter (where rolcanlogin) as protected_login, count(*) as protected_present from pg_roles where rolname in ('assess_job_a','assess_job_b','assess_worker');
SQL
```

Expect exactly the line printed by P0b.

**C4 — remove the local files**

```bash
rm -rf ~/probe; ls ~/probe 2>&1 | head -1
```

Expect `No such file or directory`.

## 6. Reading the result

Pass: P4b and P5c all `rejected`, P3/P5a/P5d `ACCEPTED`, P5e `2`, C3 `0`, P8b equal to P0b. Then report four lines, e.g. `nologin 0/30/90/180/300s rejected`, `rotation-old 0/30/90/180/300s rejected`, `rotation-new accepted`, `roles removed`. This is evidence about the production tenant's pooler for a role of this kind; it is not evidence about the DISABLED worker secret, which stays untouched, and it does not by itself set `pooler_cache_verified` anywhere. A finding (`ACCEPTED` after revocation) means the production pooler honored a stale credential: keep every worker login disabled and escalate; do not retry with weaker assumptions.

**If a step fails midway:** run section 5 immediately. If you cannot connect at all, nothing was created or the roles expire in 45 minutes (they cannot log in after that); repeat section 5 once the connection works.
