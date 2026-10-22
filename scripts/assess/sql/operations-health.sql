-- Future operational window only. No repeat of the established inventory/probe.
-- Owner: whole file in Supabase SQL Editor, existing postgres reader; counts only.
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local statement_timeout='5s';
set local lock_timeout='2s';
set local timezone='UTC';
do $$begin
 if session_user<>'postgres' or current_user<>'postgres' then raise exception 'operations_reader_required' using errcode='42501'; end if;
 if (select count(*) from (select 1 from assess.sessions limit 101) b)>100
 or (select count(*) from (select 1 from pg_catalog.pg_stat_activity where usename='assess_job_a' limit 101) b)>100 then
  raise exception 'operations_ceiling_exceeded' using errcode='54000'; end if;
 if (select count(*) from assess.launch_gate)<>1 or (select count(*) from pg_catalog.pg_roles where rolname='assess_job_a')<>1 then
  raise exception 'operations_control_missing' using errcode='55000'; end if;
end $$;
with ts as materialized(select transaction_timestamp() now),
s as materialized(select state,deadline,submitted_at,expires_at,lease_until,retry_at from assess.sessions limit 101)
select jsonb_build_object(
 'contract','assess-operations-health/1',
 'observedAt',to_char((select now from ts) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'health',jsonb_build_object(
  'activeAttempts',(select count(*) from s where state='active'),
  'gradingAttempts',(select count(*) from s where state='grading'),
  'failed',(select count(*) from s where state='grading-failed'),
  'alert',(select count(*) from s,ts where state='grading-failed' and submitted_at<=ts.now-interval '24 hours'),
  'overdue',(select count(*) from s,ts where state='active' and deadline<=ts.now),
  'purgeDue',(select count(*) from s,ts where expires_at<=ts.now),
  'claimableNow',(select count(*) from s,ts where state in ('grading','grading-failed') and submitted_at>ts.now-interval '7 days' and (retry_at is null or retry_at<=ts.now) and (lease_until is null or lease_until<=ts.now)),
  'liveLeases',(select count(*) from s,ts where state in ('grading','grading-failed') and lease_until>ts.now),
  'expiredLeases',(select count(*) from s,ts where state in ('grading','grading-failed') and lease_until<=ts.now),
  'retryWaiting',(select count(*) from s,ts where state='grading-failed' and retry_at>ts.now)),
 'controls',jsonb_build_object(
  'gateClosed',not (select enabled from assess.launch_gate),
  'loginDisabled',(select not rolcanlogin from pg_catalog.pg_roles where rolname='assess_job_a'),
  'loginExpired',(select coalesce(rolvaliduntil<(select now from ts),false) from pg_catalog.pg_roles where rolname='assess_job_a'),
  'backendSessions',(select count(*) from (select 1 from pg_catalog.pg_stat_activity where usename='assess_job_a' limit 101) b))
) as observation;
rollback;
