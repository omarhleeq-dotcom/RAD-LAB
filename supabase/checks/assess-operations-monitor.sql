-- Owner postgres only. Bounded aggregate evidence, not a worker grant or collector.
-- Errors/timeouts mean UNKNOWN; do not replace failures/nulls with zeros.
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
with ts as materialized(select transaction_timestamp() at),
 sessions as materialized(select state,deadline,submitted_at,expires_at,lease_until from assess.sessions order by id limit 1001),
 signups as materialized(select 1 from auth.users,ts where created_at>=ts.at-interval '15 minutes' limit 1001),
 counts as (select (select count(*) from sessions) s,(select count(*) from signups) a),
 health as (select jsonb_build_object(
  'active',count(*) filter(where state='active'),
  'grading',count(*) filter(where state='grading'),
  'failed',count(*) filter(where state='grading-failed'),
  'alert24h',count(*) filter(where state='grading-failed' and submitted_at<=ts.at-interval '24 hours'),
  'overdue',count(*) filter(where state='active' and deadline<=ts.at),
  'expiredLeases',count(*) filter(where state in ('grading','grading-failed') and lease_until<=ts.at),
  'purgeDue',count(*) filter(where expires_at<=ts.at)) value from sessions cross join ts)
select 'assess-monitor/1' as contract,(select at from ts) observed_at,
 case when counts.s>1000 or counts.a>1000 then 'UNKNOWN_CEILING' else 'OBSERVED' end as status,
 case when counts.s<=1000 then health.value end health,
 case when counts.a<=1000 then counts.a end signups_15m,
 counts.a>1000 as signup_ceiling_exceeded,
 pg_catalog.pg_database_size(current_database()) database_bytes,
 500000000::bigint as database_quota_bytes,
 (select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate) gate_closed,
 not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin) login_disabled,
 (select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')) backend_sessions,
 false as client_receipt_lag_measurable,false as runtime_or_launch_verified
from counts cross join health;
rollback;
