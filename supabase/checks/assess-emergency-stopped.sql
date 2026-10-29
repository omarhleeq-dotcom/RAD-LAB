-- Fresh independent snapshot after COMMIT; counts only, never provider/cache proof.
begin read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
with facts as (
 select (select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate) gate_closed,
 not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin) login_disabled,
 2-(select count(*) from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b')) missing_roles,
 (select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')) backend_sessions,
 (select count(*) from assess.sessions where state in ('active','grading') or
  (state='grading-failed' and (submitted_at is null or lease is not null or lease_until is not null
   or failed_at is null or retry_at is distinct from submitted_at+interval '7 days'))) unheld_sessions
)
select 'assess-emergency-verification/1' as contract,
 case when gate_closed and login_disabled and backend_sessions=0 and unheld_sessions=0 then 'STOPPED' else 'PARTIAL' end as status,
 gate_closed,login_disabled,missing_roles,backend_sessions,unheld_sessions,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from facts;
rollback;
