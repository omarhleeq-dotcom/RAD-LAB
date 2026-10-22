-- REVIEW PACKAGE ONLY. No authorisation to apply to the original database.
-- Set session assess.worker_login_target (assess_job_a or assess_job_b),
-- assess.worker_login_database, and assess.worker_login_action='provision-reviewed'.
-- These acknowledgements are operator checks, NOT proof of project identity.
-- No password, LOGIN activation, shared PUBLIC ACL changes, or worker RPC calls.
begin;
set local search_path='';
set local lock_timeout='5s';
set local statement_timeout='15s';
select pg_advisory_xact_lock(hashtextextended('radlab-assess-login/1',0));
do $provision$
declare
 target text := current_setting('assess.worker_login_target',true);
 db text := current_setting('assess.worker_login_database',true);
 marker text;
begin
 if target is null or target not in ('assess_job_a','assess_job_b')
   or db is distinct from current_database()
   or current_setting('assess.worker_login_action',true) is distinct from 'provision-reviewed'
   or current_setting('server_version_num')::integer < 160000 then
   raise exception 'Worker login provision precondition failed' using errcode='55000';
 end if;
 if exists(select 1 from pg_roles where rolname=target)
   or not exists(select 1 from pg_roles where rolname='assess_worker' and not rolcanlogin
     and not rolsuper and not rolbypassrls and not rolcreatedb and not rolcreaterole and not rolreplication)
   or to_regprocedure('assess.health_v1()') is null
   or to_regprocedure('assess.consent_v2(text)') is null
   or not exists(select 1 from assess.launch_gate)
   or exists(select 1 from assess.launch_gate where enabled) then
   raise exception 'Worker login baseline or absence failed' using errcode='55000';
 end if;
 marker := 'radlab-assess-login/1 database=' || db;
 execute format('create role %I nologin noinherit nosuperuser nobypassrls nocreatedb nocreaterole noreplication connection limit 2 password null valid until %L',target,'1970-01-01 00:00:00+00');
 execute format('comment on role %I is %L',target,marker);
 execute format('grant assess_worker to %I with admin false, inherit false, set true',target);
 execute format('grant connect on database %I to %I',db,target);
 if not exists(select 1 from pg_roles r join pg_auth_members m on m.member=r.oid
   join pg_roles g on g.oid=m.roleid where r.rolname=target and not r.rolcanlogin
   and not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb
   and not r.rolcreaterole and not r.rolreplication and r.rolconnlimit=2
   and r.rolvaliduntil <= now() and g.rolname='assess_worker'
   and not m.admin_option and not m.inherit_option and m.set_option)
   or (select count(*) from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname=target)<>1 then
   raise exception 'Worker login postcondition failed' using errcode='55000';
 end if;
end
$provision$;
commit;
-- A fresh read-only inspection is separate; a COMMIT acknowledgement is not a credential test.
