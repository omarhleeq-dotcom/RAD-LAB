# RAD-085 — combined DB day P1 / D3 · owner packet (no-laptop variant)

**Preparation only; do not execute live now.** [B7 CRLF exception](DECISIONS.md#rad085-crlf-readiness-owner-2026-10-28) applies to readiness and rollback representation; [witness/report](RAD-085_CRLF_READINESS_REPORT_2026-10-28.md). [O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27), [B1–B5](DECISIONS.md#rad085-db-day-nolaptop-owner-2026-10-27), [B7](DECISIONS.md#rad085-crlf-readiness-owner-2026-10-28) and [B8](DECISIONS.md#rad085-trial-removal-owner-2026-10-28) govern. There is **one** DB day and **no second Supabase project**. The owner alone operates the intended existing project, in the Supabase **SQL Editor in the browser**, after separate live authorization and independent review of the S1–S8 fixes. B1: DB day happens **without the laptop and without a Docker backup**; the Docker backup, the restored-database rehearsal and RAD-082 are deferred to [When the laptop returns](#when-the-laptop-returns). The plan's rule stands: **RAD-082 completes before the first real exam**, and so does RAD-059's spending stop. Replacement safeguards are the browser backup (B2), the tested rollback (B3), the smoke checks (B4) and the quiet-hour gate (B5). D3 must be reviewed before any real supervisor appointment.

## 0. The order in one table

Paste the **contents** of each file into its **own** SQL Editor query (a new tab per step), after matching the project selector to `NEXT_PUBLIC_SUPABASE_URL`. Never paste two steps together. Files are in the repository on `main`; copy the raw file text without editing.

| # | Step | File to paste | Pass condition |
|---|---|---|---|
| 1 | B5 gate: choose a quiet hour | [rad085-db-day-precheck.sql](../supabase/manual/rad085-db-day-precheck.sql) | all `recent_*` = 0, every `*_ok` true |
| 2 | Current readiness (nine checks, one query each) | the nine files in §3 | each as before: only the `*_verified` columns may be false |
| 3 | **B2 browser backup** (CSV per table) | [rad085-db-day-backup/](../supabase/manual/rad085-db-day-backup/) `00` … `28` **and** [trial config](../supabase/manual/rad085-db-day-trial-scope-backup.sql) | CSV row counts = `00` counts |
| 4 | Gate again, right before trial removal | the pre-check, then `00-counts-before.sql` | quiet; counts identical to step 3 |
| 5 | **B8 remove trial isolation** | [rad085-db-day-trial-remove.sql](../supabase/manual/rad085-db-day-trial-remove.sql) | save first config result; COMMIT; final `*_ok` true and counts identical |
| 6 | Migration 1 then [progress](../supabase/manual/rad085-db-day-progress.sql) | [20261026000100…sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) | `m1_scope` true, later migrations false; `trial_objects_absent_ok` true |
| 7 | Migration 2 then progress | [20261026000200…sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) | `m2_drafts` true |
| 8 | Migration 3 then progress | [20261026000300…sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) | `m3_review` true |
| 9 | Migration 4 then progress | [20261027000100…sql](../supabase/migrations/20261027000100_assess_management_erasure.sql) | `m4_d3` true |
| 10 | Readiness **before** the initializer | [rad085-d3-ready.sql](../supabase/checks/rad085-d3-ready.sql) with one extra first line | 13 rows, all `ready` true incl. `sharing_policy:pre-initializer` |
| 11 | Live initializer | [rad085-sharing-policy-live-p1.sql](../supabase/manual/rad085-sharing-policy-live-p1.sql) | COMMIT, no error |
| 12 | Readiness **after** the initializer | `rad085-d3-ready.sql` with a `reset` first line | 13 rows, all true incl. `sharing_policy:initialized` |
| 13 | The other eight current checks + the probe | §3 files except assess-staging-ready, then the probe in §5 | as step 2 (assess-staging-ready is expected false after D3) |
| 14 | **B4 smoke**: site steps, then SQL | [rad085-db-day-smoke.sql](../supabase/manual/rad085-db-day-smoke.sql), [counts-after](../supabase/manual/rad085-db-day-counts-after.sql) | every `*_ok` true; counts ≥ before |
| 15 | Any failure at 6–14 | [rad085-db-day-rollback.sql](../supabase/manual/rad085-db-day-rollback.sql) | final row `true / 0 / true` |
| 16 | Verified: delete the CSVs; only then the promotion PR | — | §8 |

Never run the migrations as one batch, wrap them in an outer transaction, run a down migration, replay history, or apply the historical local erasure manual on top of D3. Migrations 1–4 are independent transactions: a failure of 4 leaves 1–3 committed (the rollback handles that state).

## 1. Conditions before you start (B5)

- [ ] Name the operator and the window. Keep `launch_gate=false`. No worker, bridge LOGIN, publication or P2 activation. Suspend account, group and assignment changes during installation.
- [ ] **One quiet hour.** Pick a time with no participants on the site. Step 1 reads, excluding owner accounts: attempts and feedback in the last 60 minutes, and events and `last_seen_at` in the last 15 minutes. All must be 0. If not, wait 15 minutes and re-run; do not start. Step 4 repeats the gate immediately before trial removal because the backup takes time.
- [ ] The precheck also proves the four pre-existing functions the migrations redefine still have the repository's pre-DB-day bodies after CR removal (`md5(replace(prosrc,E'\r',''))`), that none of the four sources, the three new triggers or the bridge role exist, and that `launch_gate` is closed. Any `*_ok` false: STOP. The `*_has_cr` columns are informational and may be true or false.
- [ ] Terms proposal EN/AR is approved (O1/O5); its publication and CONSENT_VERSION bump are the **promotion PR**, after this day. The initializer is approved by O2; that is no live execution permission.
- [ ] Keep the rollback file open in a separate tab, unrun.

## 2. B2 — browser backup (no Docker)

The backup is **read-only SQL whose results you download as CSV** before any change. [Each file](../supabase/manual/rad085-db-day-backup/) is one `SELECT`: public and assess tables (profiles, attempts, events, feedback, c2_* and survey tables, assess tables with rows, consents/Terms columns inside `profiles`), minimal `auth.users` columns (`id`, `email`, `created_at`, `banned_until`, `consent_version`; never password hashes, tokens or raw metadata), and a catalogue file with the exact live function bodies, ACLs and triggers (insurance for the rollback).

1. Run `00-counts-before.sql` and download `counts-before.csv`. It lists **every** table with its row count (27 rows without the trial: 26 application tables + `auth.users`; 28 when `assess.trial_scope` is present). The one-query backup coverage includes `assess.trial_scope` conditionally; it is configuration, intentionally removed in step 5. The existing plain-baseline test and the [B8 trial witness](../src/features/assess/rad085-trial-removal.test.ts) verify both baselines.
2. Run `01-…` to `28-…` one at a time and download each CSV. In the results grid set the row limit to the maximum/no limit before running; the editor may otherwise cap the rows shown. **Compare the CSV data-row count with the `row_count` in counts-before.csv.** Fewer rows, a timeout or a download error: STOP. For a large table, page it by adding `limit 1000 offset N` to that single `SELECT`, in several downloads, until the total matches. Never edit the column list of `auth.users`. When precheck reports `trial_scope_present`, also run [rad085-db-day-trial-scope-backup.sql](../supabase/manual/rad085-db-day-trial-scope-backup.sql) and save `trial-scope.csv`; its count must match `assess.trial_scope` in `00`. It returns the exact configuration (UUID identities, flags and version labels), with no profiles, emails, candidate content, answers or grades. Keep this row with the catalogue backup until verification.
3. Put the CSVs in one encrypted folder on the device you use. **These files contain personal data (emails, attempt results, survey answers). Never upload, share or email them. Delete them once DB day is verified (step 16) and empty the trash.**

This backup is data-only. It does not restore Auth settings, objects, grants or the provider project; it is a safeguard for the rows and a record of the live function definitions, not a replacement for the full backup in [When the laptop returns](#when-the-laptop-returns).

### B8 — remove the finished engineering trial (step 5)

Owner read-only evidence (2026-10-28; nothing applied): backup 28 has 65 functions and 33 triggers. After removing CR it matches pre-RAD-085 plus [trial-isolation.sql](../scripts/assess/sql/trial-isolation.sql), except two public objects outside D3's scope: Supabase `public.rls_auto_enable()` and the known `owner_list_participants` representation difference. `trial_scope` is singleton/active. Reviewer reproduction with the trial objects leaves seven D3 rows false; without them all 13 pass. The active trial also requires groups/memberships to stay empty, preventing P1.

[B8](DECISIONS.md#rad085-trial-removal-owner-2026-10-28) replaces only the active-scope rule of the [2026-10-22 close-out](DECISIONS.md#assess-trial-closeout-owner-2026-10-22): the engineering trial is over. After the second precheck, paste the entire [removal file](../supabase/manual/rad085-db-day-trial-remove.sql) alone. It is one READ COMMITTED transaction with `lock_timeout='5s'`. It locks pre-existing public/assess tables, returns the scope configuration as its **first result**, and refuses unless the singleton launch gate is closed and no session is active/grading/grading-failed. Save that first result too. Only the exact 30 trial triggers, 12 functions and configuration table are dropped, using dependency-restricting drops. No CASCADE, data cleanup or permanent helper object is used.

The final read-only result must show `trial_objects_absent_ok`, `launch_gate_closed_ok`, `row_counts_unchanged_ok` true, with identical `row_counts_before`/`row_counts_after` JSON for **every pre-existing assess/public table except the intentionally removed configuration table**. Require COMMIT as well. Any error: STOP; the entire removal must roll back. If removal committed but a later step fails, use B3 once a RAD-085 source committed; B3 does **not** reinstall isolation. A failure before migration 1 needs review before continuing; do not run B3 against the untouched baseline. Trial versions, assignments, sessions, details, receipts, results and consents remain intact. `launch_gate` stays closed.

**Reinstall path — documentation only, separate reviewed recovery, never part of B3:** before RAD-085 migration 1, paste the unchanged `trial-isolation.sql` to recreate the dormant catalogue, then in a separate READ COMMITTED transaction insert the exact saved row into `assess.trial_scope` with its saved `singleton`, `id`, `active`, `owner_id`, `student_id`, `outsider_id`, `assessment_id` and `version_labels`. The private configuration trigger rechecks identities, closed gate and trial-compatible data. A formerly active saved row is re-armed with `active=true`; do not substitute IDs or labels. Confirm the row and backup-28 catalogue modulo CR. The [B8 witness](../src/features/assess/rad085-trial-removal.test.ts) proves remove → reinstall → exact re-arm restores the original catalogue and row while every trial row survives. After migrations/P1 have changed the schema or created groups, this old trial cannot simply be re-armed: stop for a separately reviewed recovery rather than deleting data or bypassing guards.

## 3. Current readiness checks (steps 2 and 13)

The nine manifest checks, each pasted alone, are: [training-ready](../supabase/checks/training-ready.sql), [comparison-ready](../supabase/checks/comparison-ready.sql), [assess-mixed-ready](../supabase/checks/assess-mixed-ready.sql), [assess-practical-ready](../supabase/checks/assess-practical-ready.sql), [assess-staging-ready](../supabase/checks/assess-staging-ready.sql), [assess-history-ready](../supabase/checks/assess-history-ready.sql), [assess-retention-ready](../supabase/checks/assess-retention-ready.sql), [owner-dashboard-ready](../supabase/checks/owner-dashboard-ready.sql), [owner-deletion-surveys-ready](../supabase/checks/owner-deletion-surveys-ready.sql). Every column must be `true` **except** `runtime_or_launch_verified` and `restore_verified`, which stay `false` by design (runtime/launch verification is not claimed). Measured on the synthetic fixture: both before and after B8 removal they read that way (staging accepts either trial catalogue or its absence); after the four sources and the initializer, eight read exactly the same, and only `assess-staging-ready` turns false (`no_unreviewed_relations`, `no_unreviewed_functions`, `catalogue_ready`): its catalogue is the earlier schema, and `rad085-d3-ready.sql` replaces it. Its rejection after D3 is expected, not an attestation. The historical [rad085-p1-ready.sql](../supabase/checks/rad085-p1-ready.sql) describes the first three sources only and is not run.

## 4. Four migrations (steps 6–9)

| Order | Entire SQL source | SHA-256 |
|---|---|---|
| 1 | [20261026000100_assess_supervisor_scope.sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) | c7b5966ce327e1e2e1f05b93ea20a0f7152cb1728884ded8e93fcc4b0d4e1a9b |
| 2 | [20261026000200_assess_authoring_drafts.sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) | eb9d81e7f3f3953b0355318c9d43624bfdb6f10ae9b3b136ce2d97fc86bcc719 |
| 3 | [20261026000300_assess_assignment_review.sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) | 3c1defa58e03443e6d61bb1610ad2a14d53e851338992e2ef30cc61c87602ce3 |
| 4 | [20261027000100_assess_management_erasure.sql](../supabase/migrations/20261027000100_assess_management_erasure.sql) | 7e77817c1cf5ffa2ad344f509fa31b418f0724443b68c4a354314dba1424826e |

The hashes are pinned in `scripts/pages/frontend-schema.json` and checked by CI against the files on `main`, so the file you copy from `main` is the file in this table. Paste each complete `BEGIN … COMMIT` file into its own query, confirm COMMIT, then run [rad085-db-day-progress.sql](../supabase/manual/rad085-db-day-progress.sql). Expected after migration *N*: `m1…mN` true, later ones false; `new_triggers_expected_3_after_m1` = 3; `launch_gate_closed` and `trial_objects_absent_ok` true after every migration, including migration 1. Any error or unexpected value: STOP, and run the rollback if any source committed. The third source replaces `content_submit_v1`; P2 structure does not authorize P2 use. D3 replaces C2's finalise deletion primitive while preserving its eligibility/recovery expectations.

## 5. Initializer and readiness (steps 10–13)

O2 / **RAD085-SQL-SHARING-POLICY-LIVE-P1-20261027** approves [rad085-sharing-policy-live-p1.sql](../supabase/manual/rad085-sharing-policy-live-p1.sql), SHA-256 **2b00dfc8bcf1f79524ee18733d3da3f9ee92b7ad432b00d77ae9d8d93555386e**, byte-identical to the added-file payload in [the proposal](RAD-085_SHARING_LIVE_P1_PROPOSAL.patch). It locks scope/policy, accepts null/null or the identical pair, rejects drift/missing or extra singleton, and creates no acceptance. Expected pair: supervisor-sharing-2026-10-27-v2 / cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb. No Terms, CONSENT_VERSION or grant change comes from it.

The complete [rad085-d3-ready.sql](../supabase/checks/rad085-d3-ready.sql) has two phases ([S6](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27)). In the SQL Editor:

- **Before the initializer (step 10):** put exactly this line first, above the pasted file: `set rad085.sharing_phase = 'pre-initializer';`. Row `sharing_policy:pre-initializer` must be true (policy null/null).
- **After the initializer (step 12):** put exactly this line first: `reset rad085.sharing_phase;` so a leftover session setting cannot leak. Row `sharing_policy:initialized` must be true.

Every other row (13 in all) must be true in both runs: constraints, columns, relations, functions, triggers, indexes, policies, schema, FK inventory, effective privileges, role attributes and memberships, scope lock. Provider role plumbing that differs from the local fixture fails closed: treat it as a failure (rollback and review), never regenerate a digest. An `statement_timeout` error is a failure too; re-run once only if nothing else is wrong.

Supplementary read-only probe (all columns true; not a catalogue certificate). It is the first SQL block of this document and the route audits read it:

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

## 6. B4 — smoke checks (step 14)

Do these straight after step 13, in this order, on the **live site as the owner**:

1. **Practice saving still works:** sign in, complete and save **one** practice attempt, and confirm it appears in your saved results.
2. **Owner dashboard loads:** open the owner dashboard; it shows the lists without an error.
3. **C2 list works:** open **Account → owner panel → pending deletions**; the list loads (it may be empty). Do not deactivate or finalise anyone.
4. Run [rad085-db-day-smoke.sql](../supabase/manual/rad085-db-day-smoke.sql): every `*_ok` column true; `newest_attempt_id` is the attempt you just saved and `newest_has_receipt_ok` is true (the practice trigger is live and recorded it); `attempts_total_expect_before_plus_1` equals the `attempts` count in counts-before plus 1 (quiet hour).
5. Run [rad085-db-day-counts-after.sql](../supabase/manual/rad085-db-day-counts-after.sql): every pre-existing data table has at least its earlier count (`assess.trial_scope` was intentionally removed by B8) (only `attempts` +1 expected); `assess.scope_lock` = 1, `assess.sharing_policy` = 1.

The readiness runs of steps 10, 12 and 13 count as B4 too. **If any of these fails, run the rollback immediately (step 15), do not diagnose first.**

## 7. B3 — rollback (step 15)

[rad085-db-day-rollback.sql](../supabase/manual/rad085-db-day-rollback.sql) returns the live behaviour to pre-DB-day **without deleting any data**:

- restores the previous bodies modulo CR (B7) and exact ACL of the four pre-existing functions the migrations redefine (`public.owner_account_deletion_v1`, `assess.content_submit_v1`, `assess.close_assignment_v1`, `assess.assignment_terminal_v1`);
- drops the three triggers the migrations add to pre-existing tables (`assess_practice_recorded` on `public.attempts`, `assess_managed_group` on `assess.groups`, `assess_membership_period` on `assess.memberships`);
- revokes client EXECUTE on the 38 new RAD-085 functions and restores `NOT NULL` on the three `owner_id` columns when no NULL row exists;
- leaves every new table, its rows, and the new functions in place;
- **does not reinstall trial isolation** (B8); the trial remains removed and its data stays untouched.

Paste it as one query. It is one transaction with `lock_timeout` 5 s; a lock timeout means a request is in flight, so re-run it once after a minute. The final row must read `triggers_removed` true, `owner_id_not_null_not_restored` 0, `new_rpc_closed_to_clients` true. Then save one practice attempt again, confirm it saves, and run the progress query. It works from M1 only, M1–M3 and M1–M4 + initializer, and is safe to run twice.

**Proof** ([rad085-db-day-rollback.test.ts](../src/features/assess/rad085-db-day-rollback.test.ts), disposable local PostgreSQL 18, synthetic rows): main's schema up to C2 with synthetic data, then the sources (M1 / M1–M3 / M1–M4 + live initializer) with ordinary activity, then the rollback. Every pre-existing function body (after CR removal), owner and ACL and the full trigger set equal the pre-DB-day catalogue; every table is byte-identical before and after the rollback and every seeded row is still present; the practice trigger stops recording; the C2 list works; the new RPCs are denied (`42501`).

**B8 trial proof:** the [trial witness](../src/features/assess/rad085-trial-removal.test.ts) adds the active isolation catalogue and synthetic trial rows over all-CRLF history. All nine checks pass before and after removal, the full application catalogue returns to the plain baseline modulo CR, and remove/reinstall/re-arm restores the trial catalogue. LF/CRLF RAD-085 runs pass both 13-row phases, smoke, real authenticated P1 create/request/approve join and rollback while preserving all original rows. No existing expected digest changes.

**B7 CRLF proof:** the additional [CRLF witness](../src/features/assess/rad085-crlf-readiness.test.ts) loads every pre-RAD-085 migration as CRLF, then independently pastes the four sources and initializer as LF and as CRLF. Both runs require 13/13 readiness before/after initialization, smoke, preserved original and new rows, and rollback true/0/true twice. The four restored bodies are LF even if they were CRLF before installation; behaviour, owner and ACL are preserved. No digest is regenerated.

Not undone: nullable columns and indexes added to `assess.groups`/`assess.memberships` (empty), the `NOLOGIN` role `assess_authoring_bridge`. After a rollback do **not** re-run the migrations (they would fail on existing objects); a second attempt needs a reviewed forward repair. While rolled back, do not finalise an account that owns a supervisor group: the old finalise has no D3 transfer and the foreign key blocks it (fail closed).

## 8. After DB day is verified (step 16) and the promotion

1. Delete the CSV backups and empty the trash.
2. The **promotion Draft PR** (branched from the preparation PR) is only then reviewed: it moves the four sources to `requiredMigrations`, flips the literal `P1_AVAILABLE` and re-pins its guard ([S5](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27)), swaps `assess-staging-ready.sql` for `rad085-d3-ready.sql` in the manifest checks, publishes the approved Terms EN/AR (O1/O5, including the 7-day completion and the `c2.*` messages) and raises `CONSENT_VERSION`. Users accept for themselves; no backfill or acceptance by an owner/supervisor. Its report prints the expected new marker.
3. **Only after the SQL succeeded** the owner sets the repository Actions variable `PILOT_SCHEMA_VERIFIED` to that marker (`pilot-v1:…`); source hashes alone are insufficient. Until then the marker remains **pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10**, P1 is hidden and Terms and CONSENT_VERSION are unchanged.
4. Review final-head CI and owner EN/AR/phone acceptance. Draft only; no ready/merge/auto-merge is authorized by this packet.

## 9. O5 operations and STOP

The owner checks the [operations reminder](RAD-085_REMAINING_OPERATIONS_2026-10-26.md#o5-daily-deletion-reminder) daily. Transfer completes before day 30; missing transfer alerts from day 25 and escalates before day 30. After the existing 30-day cancellation window, the owner uses **Account owner panel → pending deletions → Finalise expired** daily, drains batches of 100, and verifies all due accounts erased before day 37. Failure/absence needs same-day owner escalation and coverage, not a new requested_at, early finalise, or an open-ended hold. Backups/exports/provider dependencies remain inventoried separately.

Review rights/attribution for every retained free-text publication, candidate, presentation, draft/revision/package and group name before real content. D3 rejects missing or stale exact-byte clearance; this is technical enforcement, not a legal verdict. Review the exposed assess schema, definer/search_path and provider Auth/TLS/session revocation before attestation.

Any error/false/timeout/drift/unknown ACK = STOP at that step. No blind retry, DROP CASCADE, trigger disabling, down migration or rehash to conceal drift. Before COMMIT only that file rolls back; afterward use the rollback above or an independently reviewed forward repair, never automatic overwrite.

<a id="when-the-laptop-returns"></a>
## When the laptop returns

B1 defers these to the owner's laptop; none is claimed done by DB day. RAD-082 (daily local backups) **completes before the first real exam** and the full backup below is made before any later schema change.

### Fresh Docker backup and isolated local restore

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


On a restore containing the old trial, also rehearse the B8 backup and removal above **before source 1**, preserving its data and closed gate. B3 alone never restores that isolation.

### Rehearsal of the four sources and the initializer on the restore

| Order | Entire SQL source | SHA-256 |
|---|---|---|
| 1 | [20261026000100_assess_supervisor_scope.sql](../supabase/migrations/20261026000100_assess_supervisor_scope.sql) | c7b5966ce327e1e2e1f05b93ea20a0f7152cb1728884ded8e93fcc4b0d4e1a9b |
| 2 | [20261026000200_assess_authoring_drafts.sql](../supabase/migrations/20261026000200_assess_authoring_drafts.sql) | eb9d81e7f3f3953b0355318c9d43624bfdb6f10ae9b3b136ce2d97fc86bcc719 |
| 3 | [20261026000300_assess_assignment_review.sql](../supabase/migrations/20261026000300_assess_assignment_review.sql) | 3c1defa58e03443e6d61bb1610ad2a14d53e851338992e2ef30cc61c87602ce3 |
| 4 | [20261027000100_assess_management_erasure.sql](../supabase/migrations/20261027000100_assess_management_erasure.sql) | 7e77817c1cf5ffa2ad344f509fa31b418f0724443b68c4a354314dba1424826e |

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


### Restored readiness and authorization

Run the complete new [rad085-d3-ready.sql](../supabase/checks/rad085-d3-ready.sql) on the restored DB after all four sources and initializer. Every `ready` must be true, including FK inventory; new categories fail closed. [S6](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27) adds effective EXECUTE/table/column/schema privileges of PUBLIC/anon/authenticated/assess_worker/assess_authoring_bridge (inherited grants included), their role attributes and memberships (worker logins may hold assess_worker with SET only), the scope-lock singleton and `sharing_policy:initialized`. Before the initializer, the same check with `PGOPTIONS='-c rad085.sharing_phase=pre-initializer'` must show `sharing_policy:pre-initializer` true (null/null); it is not the final attestation. Provider role plumbing that differs from the local fixture fails closed and needs review, never a regenerated digest. It includes the C2 function body, all assess metadata/ownership/ACL/RLS/triggers and the new private primitives. Its expected catalogue was derived from isolated PG18 source, with NOT NULL constraints represented through columns for cross-version inspection. Review the restored PG major and provider owner/ACL independently. Drift requires independent review and a separately authorized source/catalogue difference, not regenerated pins to make it pass.

Historical [rad085-p1-ready.sql](../supabase/checks/rad085-p1-ready.sql) describes the first three sources only, and assess-staging-ready describes the earlier schema. Neither is a final four-source readiness claim; both remain unchanged. Their rejection after D3 is expected, not a successful attestation.

```bash
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < supabase/checks/rad085-d3-ready.sql
docker exec -i rad085-dbday-restore psql -X -U postgres -d rad085_restore -v ON_ERROR_STOP=1 < scripts/assess/rad085-restored-authorization.sql
```

The exact [authorization script](../scripts/assess/rad085-restored-authorization.sql) creates only namespace f0850000 synthetic accounts and rolls the entire fixture back. It refuses collisions. Run it **only on the local restore**, not SQL Editor/live. It tests owner/two supervisors/common student/pending/suspended/anon, zero-group appointment metadata, pending without membership, real role denials, no direct tables or surveys, separate groups, policy v1/unknown rejection, server recording time, filtered counts, withdrawal, leave/rejoin with a fresh window, old-code rejection and appointment revocation. Its synthetic setup is not acceptance for a real account.

Also run the existing [P1 SQL adapter witnesses](../src/features/supervisor-review/sql-adapter-db.test.ts), [scope witnesses](../src/features/assess/rad085-db.test.ts), and [D3 witnesses](../src/features/assess/rad085-d3-db.test.ts) on disposable source PostgreSQL: page boundaries, expiry/end, targets, owner/self/last-owner, shared/closed/confirmed content, required attribution, stale inventory, lock ordering/rollback, unknown ACK and explicit restore replay. Browser checks cannot substitute for SQL authorization. In the source checkout: `npx vitest run src/features/supervisor-review/sql-adapter-db.test.ts src/features/assess/rad085-db.test.ts src/features/assess/rad085-d3-db.test.ts`. These reconstruct synthetic source DBs; they do not consume the owner's backup or attest its restoration.

The supplementary read-only probe is in §5 above; run it on the restore as well.

- [ ] Review exposed assess schema, definer/search_path, actual provider Auth/TLS/session revocation and the limited live service evidence before attestation. No worker/real exam/launch_gate from this packet.
- [ ] Review rights/attribution for every retained free-text publication, candidate, presentation, draft/revision/package and group name before real content. D3 rejects missing or stale exact-byte clearance. This is technical enforcement, not a legal verdict or permission to retain all identity.


### Restore reconciliation

Keep restored access quarantined until the latest authenticated external encrypted local journal is verified and deletion, withdrawal, revocation and closure events replayed idempotently with original times. A completed transfer receipt and its exact content clearance must be authenticated/encrypted outside the snapshot and bound to the completed deletion journal event; restore the authenticated original request time if the backup predates the request, never renew it. D3's private replay timestamp is available only to the privileged restore operator after verifying the completed external transfer receipt; no API role can supply it or create an early deletion. Lost ACK requires explicit inspection. Resolve writes newer than the backup before any switch. No cloud journal/backup, invented RPO/RTO, live SQL or provider certificate is produced by this PR. Remove the local restore container and decrypted temporary directory after recording encrypted evidence according to the owner's backup procedure.
