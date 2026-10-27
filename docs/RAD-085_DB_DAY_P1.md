# RAD-085 — combined DB day P1 / D3 · owner packet

**Preparation only; do not execute live now.** [O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27) govern. There is **one** DB day and **no second Supabase project**. The owner alone operates the intended existing project after separate live authorization, independent security/provider/content review and the local restore below. D3 must be reviewed before any real supervisor appointment. RAD-082 daily local backups and RAD-059's spending stop remain prerequisites of the first real exam, not claimed complete.

## 1. Pre-check and isolated local restore — before any live write

- [ ] Terms proposal EN/AR is approved by O1 with O5's correction; its publication and CONSENT_VERSION bump remain coordinated DB-day work. The initializer source is approved by O2; that is no live execution permission.
- [ ] Name the owner/operator, change window and daily deletion coverage; suspend account/group/assignment changes during installation. Keep launch_gate=false. No worker, bridge LOGIN, publication or P2 activation.
- [ ] The owner makes a **fresh local Docker backup** before changes: encrypted custom-format dump, reviewed globals without passwords, archive integrity check, timestamp/source/PG major/image digest/operator record. Inventory what it excludes: provider Auth/Storage settings, objects and secrets outside the dump. Keep backup, keys and reconciliation journal local; do not upload them. A prior backup or planned RAD-082 automation is insufficient.
- [ ] On the owner's laptop, decrypt into a mode0700 temporary directory, offline/local only. Inspect `pg_restore --list` with the matching-major tools; verify encrypted archive checksum before decrypting. Review globals for trusted local restore and explicit existing bootstrap-role handling; never ignore arbitrary SQL errors or use --no-owner/--no-acl to conceal a mismatch.

Exact local restore procedure (the owner supplies the private local archive paths and the reviewed matching-major pinned image; no credential values belong here):

```bash
umask 077
# LOCAL_RESTORE_DIR contains the freshly verified/decrypted pilot.dump and reviewed globals.sql.
# PG_IMAGE_FROM_BACKUP is the reviewed postgres:<matching-major>@sha256:<digest>.
docker run --detach --name rad085-dbday-restore --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount type=bind,src="$LOCAL_RESTORE_DIR",dst=/restore,readonly \
  "$PG_IMAGE_FROM_BACKUP"
docker exec rad085-dbday-restore pg_isready -U postgres
# If not ready, STOP and inspect local container startup; no provider fallback.
docker exec rad085-dbday-restore psql -X -U postgres -v ON_ERROR_STOP=1 -f /restore/globals.sql
docker exec rad085-dbday-restore createdb -U postgres --template=template0 rad085_restore
docker exec rad085-dbday-restore pg_restore -U postgres --dbname=rad085_restore \
  --exit-on-error --single-transaction /restore/pilot.dump
```

This container has no network and no published ports. Use Docker exec/Unix sockets only. Missing extensions/roles/ACLs, incompatible versions, restore errors, timeout or incomplete archive = STOP; resolve the local restoration faithfully before proceeding. The owner's real backup is not present in this PR; the automated witnesses use a fully synthetic isolated PostgreSQL.

- [ ] Compare the restored catalogue against the independently reviewed expected source/provider inventory using [application inventory](../scripts/assess/rad085-application-inventory.sql), including ownership, ACL, role membership, CREATE/TEMP, RLS, indexes, triggers and all FKs. D3 inventories every FK to profiles or Auth users across all schemas. Only the exact source edges and two explicitly reviewed optional Auth session/refresh-token CASCADE edges are accepted at installation. Any other provider-native Auth edge stops migration4 until an independently reviewed, explicitly authorized source/catalogue difference is prepared on the local restore; never drop or ignore the edge to pass. Source catalogue is not provider attestation.
- [ ] Inspect only the migration version column after confirming its actual schema. First installation requires all four sources absent; partial installation or unknown ACK requires read-only reconciliation, never blind replay of historical migrations.
- [ ] On the restored pre-RAD085 schema, run C1/C2 and assess-staging-ready plus the other current checks at their expected historical phase. Runtime/launch verification remains false. Match each source hash below without editor normalization.

## 2. Four migrations — local restore first, then the same live order on DB day

| Order | Entire SQL source | SHA-256 |
|---|---|---|
| 1 | [20261026000100_assess_supervisor_scope.sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) | c7b5966ce327e1e2e1f05b93ea20a0f7152cb1728884ded8e93fcc4b0d4e1a9b |
| 2 | [20261026000200_assess_authoring_drafts.sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) | eb9d81e7f3f3953b0355318c9d43624bfdb6f10ae9b3b136ce2d97fc86bcc719 |
| 3 | [20261026000300_assess_assignment_review.sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) | 3c1defa58e03443e6d61bb1610ad2a14d53e851338992e2ef30cc61c87602ce3 |
| 4 | [20261027000100_assess_management_erasure.sql](../supabase/migrations/20261027000100_assess_management_erasure.sql) | a5f704bc673ba89a0e801d2b24c9c1b415d3e8e587627de0742a39814d713146 |

For the isolated restored database, run these **separately, one numbered phase at a time**. After each command, inspect COMMIT and run the read-only application inventory below; review that phase before starting the next command. Do not paste the four phases as an unattended batch.

1. Scope:

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/migrations/20261026000100_assess_supervisor_scope.sql
```

2. Drafts:

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/migrations/20261026000200_assess_authoring_drafts.sql
```

3. Review/assignment bridge:

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/migrations/20261026000300_assess_assignment_review.sql
```

4. D3:

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/migrations/20261027000100_assess_management_erasure.sql
```

Run after each phase and review against its expected catalogue before continuing:

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < scripts/assess/rad085-application-inventory.sql
```

Verify COMMIT and the full catalogue after **each** file; never proceed after any error. On live DB day the owner pastes each byte-identical complete BEGIN…COMMIT file into a separate SQL Editor query after matching the project selector to NEXT_PUBLIC_SUPABASE_URL. Metadata alone cannot prove that origin. These are independent transactions: failure of4 leaves1–3 committed. Never wrap them in an outer transaction, run a down migration, replay history, or apply the historical local erasure manual on top of D3. D3 replaces C2's finalise deletion primitive while preserving its eligibility/recovery expectations. The third source replaces content_submit_v1; P2 structure does not authorize P2 use.

## 3. Live sharing initializer — same combined day, after all four sources

O2 / **RAD085-SQL-SHARING-POLICY-LIVE-P1-20261027** approves [rad085-sharing-policy-live-p1.sql](../supabase/manual/rad085-sharing-policy-live-p1.sql), extracted byte-identically from [the proposal](RAD-085_SHARING_LIVE_P1_PROPOSAL.patch). SHA-256 **2b00dfc8bcf1f79524ee18733d3da3f9ee92b7ad432b00d77ae9d8d93555386e**. Its historical PROPOSAL comments remain byte-identical; authority is O2. Test only locally in this PR.

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/manual/rad085-sharing-policy-live-p1.sql
```

It locks scope/policy, accepts null/null or the identical pair, rejects drift/missing or extra singleton, and creates no acceptance. Expected pair: supervisor-sharing-2026-10-27-v2 / cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb. No Terms, CONSENT_VERSION or grant change comes from this initializer.

## 4. Local restored readiness and authorization — required before live work

Run the complete new [rad085-d3-ready.sql](../supabase/checks/rad085-d3-ready.sql) on the restored DB after all four sources and initializer. Every `ready` must be true, including FK inventory; new categories fail closed. It includes the C2 function body, all assess metadata/ownership/ACL/RLS/triggers and the new private primitives. Its expected catalogue was derived from isolated PG18 source, with NOT NULL constraints represented through columns for cross-version inspection. Review the restored PG major and provider owner/ACL independently. Drift requires independent review and a separately authorized source/catalogue difference, not regenerated pins to make it pass.

Historical [rad085-p1-ready.sql](../supabase/checks/rad085-p1-ready.sql) describes the first three sources only, and assess-staging-ready describes the earlier schema. Neither is a final four-source readiness claim; both remain unchanged. Their rejection after D3 is expected, not a successful attestation.

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/checks/rad085-d3-ready.sql
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < scripts/assess/rad085-restored-authorization.sql
```

The exact [authorization script](../scripts/assess/rad085-restored-authorization.sql) creates only namespace f0850000 synthetic accounts and rolls the entire fixture back. It refuses collisions. Run it **only on the local restore**, not SQL Editor/live. It tests owner/two supervisors/common student/pending/suspended/anon, zero-group appointment metadata, pending without membership, real role denials, no direct tables or surveys, separate groups, policy v1/unknown rejection, server recording time, filtered counts, withdrawal, leave/rejoin with a fresh window, old-code rejection and appointment revocation. Its synthetic setup is not acceptance for a real account.

Also run the existing [P1 SQL adapter witnesses](../src/features/supervisor-review/sql-adapter-db.test.ts), [scope witnesses](../src/features/assess/rad085-db.test.ts), and [D3 witnesses](../src/features/assess/rad085-d3-db.test.ts) on disposable source PostgreSQL: page boundaries, expiry/end, targets, owner/self/last-owner, shared/closed/confirmed content, required attribution, stale inventory, lock ordering/rollback, unknown ACK and explicit restore replay. Browser checks cannot substitute for SQL authorization. In the source checkout: `npx vitest run src/features/supervisor-review/sql-adapter-db.test.ts src/features/assess/rad085-db.test.ts src/features/assess/rad085-d3-db.test.ts`. These reconstruct synthetic source DBs; they do not consume the owner's backup or attest its restoration.

Supplementary read-only probe (all columns true; not a catalogue certificate):

```sql
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with tables(name) as (values
 ('scope_lock'),('supervisor_appointments'),('membership_periods'),
 ('group_join_codes'),('group_join_requests'),('join_request_throttles'),
 ('sharing_policy'),('sharing_consents'),('practice_recordings'),
 ('authoring_references'),('authoring_drafts'),('authoring_revisions'),
 ('authoring_publication_links'),('assignment_reviews'),('assignment_review_targets'),
 ('assignment_scopes'),('authoring_reviewed_packages')),
funcs(signature) as (values
 ('assess.appointment_v1(uuid,boolean)'),
 ('assess.sharing_consent_v1(text,text,boolean)'),
 ('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'),
 ('assess.join_request_v1(text)'),('assess.join_decide_v1(uuid,integer,text)'),
 ('assess.group_leave_v1(uuid)'),('assess.scope_page_v1(text,uuid,uuid,integer)'))
select
 (select count(*)=17 and bool_and(c.oid is not null and c.relrowsecurity)
  from tables t left join pg_namespace n on n.nspname='assess'
  left join pg_class c on c.relnamespace=n.oid and c.relname=t.name) tables_and_rls,
 (select count(*)=7 and bool_and(p.oid is not null and p.prosecdef
   and p.proconfig @> array['search_path=""']
   and has_function_privilege('authenticated',p.oid,'execute')
   and not has_function_privilege('anon',p.oid,'execute')
   and not has_function_privilege('assess_worker',p.oid,'execute'))
  from funcs f left join pg_proc p on p.oid=to_regprocedure(f.signature)) p1_rpc_acl,
 not exists(select 1 from tables t cross join (values('anon'),('authenticated'),('assess_worker')) r(role)
  where has_table_privilege(r.role,'assess.'||t.name,'select,insert,update,delete,truncate,references,trigger')) no_direct_tables,
 (select count(*)=1 from assess.scope_lock where singleton) scope_singleton,
 (select count(*)=1 from assess.sharing_policy where singleton
  and required_version='supervisor-sharing-2026-10-27-v2'
  and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb') sharing_policy_ready,
 (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_still_closed,
 exists(select 1 from pg_roles where rolname='assess_authoring_bridge'
  and not rolcanlogin and not rolinherit and not rolsuper and not rolbypassrls
  and not rolcreaterole and not rolcreatedb) bridge_still_private;
rollback;

```

- [ ] Review exposed assess schema, definer/search_path, actual provider Auth/TLS/session revocation and the limited live service evidence before attestation. No worker/real exam/launch_gate from this packet.
- [ ] Review rights/attribution for every retained free-text publication, candidate, presentation, draft/revision/package and group name before real content. D3 rejects missing or stale exact-byte clearance. This is technical enforcement, not a legal verdict or permission to retain all identity.

## 5. Coordinated manifest, Terms and marker — only on that DB day

1. Promote **all four** sources from deferredMigrations to requiredMigrations in order; remove only their deferred entries. P1 availability depends on all four, without a second flag. Keep server-only boundaries.
2. Replace the historical assess-staging-ready entry in manifest checks with rad085-d3-ready.sql after independent review, keeping C1/C2/retention and other checks. Historical expectations/hashes require their own reviewed exception before editing; this PR does not promote files or change checks/marker.
3. Publish the [approved EN/AR Terms proposal](RAD-085_TERMS_P1_PROPOSAL.md), including the O5 correction and prepared current-message replacements there, and raise CONSENT_VERSION **in the same DB-day release**. Users accept for themselves. No backfill or acceptance by an owner/supervisor.
4. Compute the new marker with the existing tool: `NEXT_PUBLIC_SUPABASE_URL=https://<intended-project>.supabase.co node scripts/pages/pilot-schema-gate.mjs --print-marker`. Use the actual approved public origin privately, not a placeholder attestation. Prove rejection of the previous marker and acceptance of the reviewed new one; then the owner sets PILOT_SCHEMA_VERIFIED after confirming SQL/service evidence. Source hashes alone are insufficient.
5. Until that coordinated change, the marker remains **pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10**, all four sources are deferred, P1 is hidden, Terms and CONSENT_VERSION are unchanged. Review final-head CI and owner EN/AR/phone acceptance. Draft only; no ready/merge/auto-merge authorization here.

## 6. O5 operations, STOP and restore reconciliation

The owner checks the [operations reminder](RAD-085_REMAINING_OPERATIONS_2026-10-26.md#o5-daily-deletion-reminder) daily. Transfer completes before day30; missing transfer alerts from day25 and escalates before day30. After the existing 30-day cancellation window, the owner uses **Account owner panel → pending deletions → Finalise expired** daily, drains batches of100, and verifies all due accounts erased before day37. Failure/absence needs same-day owner escalation and coverage, not a new requested_at, early finalise, or an open-ended hold. Backups/exports/provider dependencies remain inventoried separately.

Any error/false/timeout/drift/missing backup/unknown ACK = STOP at that phase. No blind retry, DROP CASCADE, trigger disabling, down migration or rehash to conceal drift. Before COMMIT only that file rolls back; afterward the owner chooses an independently reviewed forward repair or isolated restore/reconciliation, never automatic overwrite.

Keep restored access quarantined until the latest authenticated external encrypted local journal is verified and deletion, withdrawal, revocation and closure events replayed idempotently with original times. A completed transfer receipt and its exact content clearance must be authenticated/encrypted outside the snapshot and bound to the completed deletion journal event; restore the authenticated original request time if the backup predates the request, never renew it. D3's private replay timestamp is available only to the privileged restore operator after verifying the completed external transfer receipt; no API role can supply it or create an early deletion. Lost ACK requires explicit inspection. Resolve writes newer than the backup before any switch. No cloud journal/backup, invented RPO/RTO, live SQL or provider certificate is produced by this PR. Remove the local restore container and decrypted temporary directory after recording encrypted evidence according to the owner's backup procedure.
