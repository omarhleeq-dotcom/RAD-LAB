-- Owner SQL Editor only, reviewed emergency window. Assemble ALL parts; run once.
-- No schema/function/score/result/answer/receipt/ACL/password/expiry changes.
-- Each phase has its own 5s statement budget; caught errors survive in the report.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
create temporary table rad059_stop_report (
 gate_ok boolean not null default false,
 login_a_ok boolean not null default false,
 login_b_ok boolean not null default false,
 termination_ok boolean not null default false,
 freeze_ok boolean not null default false,
 errors text[] not null default '{}',
 verification jsonb
) on commit drop;
insert into pg_temp.rad059_stop_report default values;
-- Exclusive gate lock drains start_v1 transactions that already read the gate.
-- New starts wait until COMMIT, then observe false. No closed-gate prerequisite.
do $gate$
begin
 lock table assess.launch_gate in access exclusive mode;
 insert into assess.launch_gate(singleton,enabled) values(true,false) on conflict(singleton) do nothing;
 update assess.launch_gate set enabled=false where enabled;
 update pg_temp.rad059_stop_report set gate_ok=true;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'gate:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'gate:'||sqlstate);
end $gate$;
-- Missing rotation slot is harmless; do not provision a role in an emergency.
do $login_a$
begin
 if exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin) then
  alter role assess_job_a nologin;
 end if;
 update pg_temp.rad059_stop_report set login_a_ok=true;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'login_a:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'login_a:'||sqlstate);
end $login_a$;
do $login_b$
begin
 if exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_b' and rolcanlogin) then
  alter role assess_job_b nologin;
 end if;
 update pg_temp.rad059_stop_report set login_b_ok=true;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'login_b:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'login_b:'||sqlstate);
end $login_b$;
-- usename is session_user even after SET ROLE. Across databases, no PID/query output.
-- Whole loop bounded by statement_timeout, not a count cap. Kill precedes session locks.
do $terminate$
declare b record; acknowledged boolean:=true;
begin
 for b in select pid from pg_catalog.pg_stat_activity
  where usename in ('assess_job_a','assess_job_b') and pid<>pg_catalog.pg_backend_pid()
 loop
  if not pg_catalog.pg_terminate_backend(b.pid,1000) then acknowledged:=false; end if;
 end loop;
 update pg_temp.rad059_stop_report set termination_ok=acknowledged,
  errors=case when acknowledged then errors else array_append(errors,'termination:not_acknowledged') end;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'termination:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'termination:'||sqlstate);
end $terminate$;
-- Keep the original submitted_at whenever present; active freezes no later than deadline.
-- At retry_at=original submission+7d, claim_v1's strict <7d condition is already false.
do $freeze$
begin
 -- Drain existing commands/finish before taking the update snapshot. New readers
 -- cannot acquire a session row lock and then wait on this phase's table lock.
 lock table assess.sessions in access exclusive mode;
 with ts as materialized(select clock_timestamp() at), held as materialized(
  select s.id,coalesce(s.submitted_at,least(s.deadline,ts.at)) submitted_at,ts.at
  from assess.sessions s cross join ts where s.state in ('active','grading','grading-failed')
 )
 update assess.sessions s set state='grading-failed',submitted_at=h.submitted_at,
  lease=null,lease_until=null,retry_at=h.submitted_at+interval '7 days',
  failed_at=coalesce(s.failed_at,h.at),revision=s.revision+1
 from held h where s.id=h.id and (
  s.state<>'grading-failed' or s.submitted_at is distinct from h.submitted_at
  or s.lease is not null or s.lease_until is not null or s.failed_at is null
  or s.retry_at is distinct from h.submitted_at+interval '7 days');
 update pg_temp.rad059_stop_report set freeze_ok=true;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'freeze:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'freeze:'||sqlstate);
end $freeze$;
-- Verification is itself bounded/caught. Final SELECT reads only the private one-row report.
do $verify$
declare facts jsonb;
begin
 perform pg_catalog.pg_stat_clear_snapshot();
 select jsonb_build_object(
  'gateClosed',(select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate),
  'loginDisabled',not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin),
  'missingRoles',2-(select count(*) from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b')),
  'backendSessions',(select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')),
  'unheldSessions',(select count(*) from assess.sessions where state in ('active','grading') or
   (state='grading-failed' and (submitted_at is null or lease is not null or lease_until is not null
    or failed_at is null or retry_at is distinct from submitted_at+interval '7 days')))
 ) into facts;
 update pg_temp.rad059_stop_report set verification=facts;
exception when query_canceled then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'verification:57014');
when others then
 update pg_temp.rad059_stop_report set errors=array_append(errors,'verification:'||sqlstate);
end $verify$;
select 'assess-emergency-stop/1' as contract,
 case when gate_ok and login_a_ok and login_b_ok and termination_ok and freeze_ok
  and cardinality(errors)=0 and coalesce((verification->>'gateClosed')::boolean,false)
  and coalesce((verification->>'loginDisabled')::boolean,false)
  and (verification->>'backendSessions')::bigint=0 and (verification->>'unheldSessions')::bigint=0 then 'STOPPED'
 when gate_ok or login_a_ok or login_b_ok or termination_ok or freeze_ok then 'PARTIAL' else 'FAILED' end as status,
 gate_ok,login_a_ok,login_b_ok,termination_ok,freeze_ok,errors,verification,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from pg_temp.rad059_stop_report;
commit;
