-- RAD-085 W1. Owner laptop only, via owner_sql, after a separate written permission.
-- Creates the grading-only group role and ONE closed LOGIN slot. No password, no LOGIN,
-- no shared PUBLIC ACL change, no worker RPC. Re-applying refuses before any change.
-- Slot name is fixed to assess_job_b: the byte-identical v2 stop packet and the in-app
-- emergency stop already cover assess_job_a/assess_job_b only. assess_job_a keeps its
-- historical assess_worker membership and its revoked credential; it is never reused.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='8s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-grading-worker/1',0));
do $provision$
declare
 db text := pg_catalog.current_database();
 allowed regprocedure[];
begin
 if current_user<>'postgres' or session_user<>'postgres'
   or pg_catalog.current_setting('server_version_num')::integer < 160000 then
  raise exception 'W1 operator or server version precondition failed' using errcode='55000';
 end if;
 if exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_grading_worker','assess_job_b')) then
  raise exception 'W1 already provisioned or slot occupied: STOP, no change' using errcode='55000';
 end if;
 if (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled)
   or exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin) then
  raise exception 'W1 requires a closed gate and no LOGIN slot' using errcode='55000';
 end if;
 if to_regprocedure('assess.maintain_v1(integer)') is null or to_regprocedure('assess.claim_v1()') is null
   or to_regprocedure('assess.finish_v1(uuid,uuid,text,text)') is null
   or to_regprocedure('assess.fail_v1(uuid,uuid)') is null or to_regprocedure('assess.health_v1()') is null then
  raise exception 'W1 grading functions missing' using errcode='55000';
 end if;
 allowed := array['assess.maintain_v1(integer)'::regprocedure,'assess.claim_v1()'::regprocedure,
  'assess.finish_v1(uuid,uuid,text,text)'::regprocedure,'assess.fail_v1(uuid,uuid)'::regprocedure,
  'assess.health_v1()'::regprocedure];
 create role assess_grading_worker nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication;
 comment on role assess_grading_worker is 'radlab-assess-grading-worker/1';
 grant usage on schema assess to assess_grading_worker;
 -- Exactly the grading binding allowlist (server-runtime.ts gradingOnly), nothing else.
 grant execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),
  assess.fail_v1(uuid,uuid),assess.health_v1() to assess_grading_worker;
 create role assess_job_b nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls noreplication
  connection limit 2 password null valid until '1970-01-01 00:00:00+00';
 execute pg_catalog.format('comment on role assess_job_b is %L','radlab-assess-grading-slot/1 database='||db);
 grant assess_grading_worker to assess_job_b with admin false, inherit false, set true;
 execute pg_catalog.format('grant connect on database %I to assess_job_b',db);
 -- Postconditions: any drift (extra PUBLIC EXECUTE, table grant, membership) rolls back everything.
 if not exists(select 1 from pg_catalog.pg_roles g where g.rolname='assess_grading_worker' and not g.rolcanlogin
     and not g.rolinherit and not g.rolsuper and not g.rolbypassrls and not g.rolcreatedb and not g.rolcreaterole and not g.rolreplication)
   or exists(select 1 from pg_catalog.pg_auth_members m where m.member='assess_grading_worker'::regrole)
   or exists(select 1 from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace
     and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE') and p.oid<>all(allowed::oid[]))
   or (select count(*) from unnest(allowed) f where pg_catalog.has_function_privilege('assess_grading_worker',f,'EXECUTE'))<>5
   or exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
     where n.nspname in ('assess','public','auth','emergency') and c.relkind in ('r','p','v','m','f')
     and (pg_catalog.has_table_privilege('assess_grading_worker',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or pg_catalog.has_table_privilege('assess_job_b',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')))
   or not exists(select 1 from pg_catalog.pg_roles r where r.rolname='assess_job_b' and not r.rolcanlogin and not r.rolinherit
     and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication
     and r.rolconnlimit=2 and r.rolvaliduntil<=now())
   or (select count(*) from pg_catalog.pg_auth_members m where m.member='assess_job_b'::regrole)<>1
   or not exists(select 1 from pg_catalog.pg_auth_members m where m.member='assess_job_b'::regrole
     and m.roleid='assess_grading_worker'::regrole and m.set_option and not m.inherit_option and not m.admin_option) then
  raise exception 'W1 postcondition failed: rolled back' using errcode='55000';
 end if;
end
$provision$;
select 'assess-grading-worker-provision/1' as contract, true as provisioned_closed;
commit;
-- Next: a fresh read-only supabase/checks/assess-grading-worker-ready.sql. COMMIT alone proves nothing.
