-- RAD-085 DB day (B5) - quiet-hour and pre-state check. READ ONLY: one SELECT.
-- Every column named *_ok must be true and every recent_* column must be 0. Anything else: STOP, wait or investigate.
-- Activity excludes owner accounts. Time is the database clock (UTC).
select
 now() as db_time_utc,
 current_setting('server_version') as postgres_version,
 (select count(*) from public.attempts a where greatest(a.started_at, a.finished_at) > now() - interval '60 minutes'
   and a.user_id not in (select user_id from public.profiles where role = 'owner')) as recent_attempts_60m,
 (select count(*) from public.feedback f where f.at > now() - interval '60 minutes'
   and f.user_id not in (select user_id from public.profiles where role = 'owner')) as recent_feedback_60m,
 (select count(*) from public.events e where e.at > now() - interval '15 minutes'
   and e.user_id not in (select user_id from public.profiles where role = 'owner')) as recent_events_15m,
 (select count(*) from public.profiles p where p.last_seen_at > now() - interval '15 minutes' and p.role <> 'owner') as recent_seen_15m,
 (select max(greatest(started_at, finished_at)) from public.attempts) as latest_attempt_at,
 (to_regclass('assess.scope_lock') is null and to_regclass('assess.authoring_drafts') is null
   and to_regclass('assess.assignment_reviews') is null and to_regclass('assess.erasure_fk_contract') is null
   and to_regclass('assess.sharing_policy') is null
   and not exists (select 1 from pg_roles where rolname = 'assess_authoring_bridge')) as four_sources_absent_ok,
 (not exists (select 1 from pg_trigger where not tgisinternal and tgname in ('assess_practice_recorded', 'assess_managed_group', 'assess_membership_period'))) as new_triggers_absent_ok,
 (select count(*) = 1 and bool_and(not enabled) from assess.launch_gate) as launch_gate_closed_ok,
 -- The four functions the migrations redefine still have exactly the repository's pre-DB-day bodies (prosrc md5).
 (select md5(p.prosrc) = '7d99291a3041e5da8b44121c25b06459' from pg_proc p where p.oid = to_regprocedure('assess.assignment_terminal_v1()')) as terminal_body_ok,
 (select md5(p.prosrc) = '028601747323072a31d4487d88657d6d' from pg_proc p where p.oid = to_regprocedure('assess.close_assignment_v1(uuid)')) as close_assignment_body_ok,
 (select md5(p.prosrc) = '82b16937253437bca52354fd33edcb13' from pg_proc p where p.oid = to_regprocedure('assess.content_submit_v1(jsonb)')) as content_submit_body_ok,
 (select md5(p.prosrc) = '14ecf7d3cd6f2af9cf4a8c0d50bc3777' from pg_proc p where p.oid = to_regprocedure('public.owner_account_deletion_v1(text,uuid,uuid,integer)')) as owner_account_deletion_body_ok;
