-- RAD-085 W2 step 4.3. Owner laptop via owner_sql, ONLY after the W2/W3 transport set a
-- fresh credential and the matching numeric secret version is ENABLED (step 4.2).
-- Enables LOGIN for assess_job_b only. No password text here. Rollback = v2 stop packet.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-grading-worker/1',0));
do $login$
begin
 if current_user<>'postgres'
   or (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled)
   or exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin)
   or not exists(select 1 from pg_catalog.pg_roles r where r.rolname='assess_job_b' and not r.rolcanlogin
     and not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole
     and not r.rolreplication and r.rolconnlimit=2
     -- Provision sets 1970; only the transport sets a future expiry of at most 90 days.
     and r.rolvaliduntil>now()+interval '1 hour' and r.rolvaliduntil<=now()+interval '90 days'
     and pg_catalog.shobj_description(r.oid,'pg_authid')='radlab-assess-grading-slot/1 database='||pg_catalog.current_database())
   or (select count(*) from pg_catalog.pg_auth_members m where m.member='assess_job_b'::regrole)<>1
   or not exists(select 1 from pg_catalog.pg_auth_members m where m.member='assess_job_b'::regrole
     and m.roleid='assess_grading_worker'::regrole and m.set_option and not m.inherit_option and not m.admin_option)
   or exists(select 1 from pg_catalog.pg_auth_members m where m.member='assess_grading_worker'::regrole)
   -- The binding refuses a role with TEMP/CREATE; never enable a slot it would refuse.
   or pg_catalog.has_database_privilege('assess_grading_worker',pg_catalog.current_database(),'CREATE,TEMP')
   or exists(select 1 from pg_catalog.pg_stat_activity where usename='assess_job_b') then
  raise exception 'W2 LOGIN precondition failed: STOP, no change' using errcode='55000';
 end if;
 alter role assess_job_b login;
end
$login$;
select 'assess-grading-worker-login/1' as contract,
 exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_b' and rolcanlogin) as slot_login,
 not exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin) as slot_a_not_login;
commit;
