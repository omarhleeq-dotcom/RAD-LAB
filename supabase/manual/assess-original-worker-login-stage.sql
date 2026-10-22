-- ORIGINAL PROJECT MANUAL STAGING ONLY: vlacestfruxooznrcjqc / database postgres.
-- Owner authorised this NOLOGIN creation on 2026-10-21 (Asia/Amman).
-- Verify the SQL Editor project selector. A database named postgres is NOT project identity.
-- Run this WHOLE file ONCE as the sole authorised administrator. On error STOP; do not replay.
-- Uses the reviewed provision script with explicit transaction-local settings,
-- the exact read-only catalogue query as a BEFORE-COMMIT guard, then a fresh read-only row.
-- PUBLIC TEMP remains unchanged and still requires review before separate activation.
-- No password, LOGIN activation, business data write, worker RPC, gate change or cloud resources.
begin;
set local assess.worker_login_target='assess_job_a';
set local assess.worker_login_database='postgres';
set local assess.worker_login_action='provision-reviewed';
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
do $catalogue_guard$
declare verified boolean;
begin
 select target_present and staged_catalogue_valid and not active_catalogue_valid
   and not direct_assess_table_access and backend_sessions=0 and launch_gate_closed
 into verified from (
with target as (
 select * from pg_roles where rolname=current_setting('assess.worker_login_target',true)
   and rolname in ('assess_job_a','assess_job_b')
), facts as (
 select r.oid,
  shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database() as managed_marker,
  not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb
    and not r.rolcreaterole and not r.rolreplication and r.rolconnlimit=2 as restricted_attributes,
  not r.rolcanlogin and r.rolvaliduntil<=now() as disabled_expired,
  r.rolcanlogin and r.rolvaliduntil>now() and r.rolvaliduntil<=now()+interval '90 days' as active_time_bounded,
  (select count(*)=1 and bool_and(g.rolname='assess_worker' and not m.admin_option and not m.inherit_option and m.set_option)
    from pg_auth_members m join pg_roles g on g.oid=m.roleid where m.member=r.oid) as only_worker_membership,
  has_database_privilege(r.oid,current_database(),'CONNECT') as can_connect,
  has_database_privilege(r.oid,current_database(),'TEMP') as can_create_temp,
  exists(select 1 from pg_namespace n where n.nspname !~ '^pg_(temp|toast)' and has_schema_privilege(r.oid,n.oid,'CREATE')) as can_create_schema_objects,
  exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='assess' and c.relkind in ('r','p','v','m','f')
    and (has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) as direct_assess_table_access,
  exists(select 1 from pg_shdepend d where d.refclassid='pg_authid'::regclass and d.refobjid=r.oid and d.deptype='o') as owns_objects,
  -- PostgreSQL16+ gives a non-superuser creator ADMIN-only management of its new role.
  -- Accept that only for the current inspecting operator, with no SET/INHERIT path.
  exists(select 1 from pg_auth_members m where m.roleid=r.oid and not (
    m.member=(select oid from pg_roles where rolname=current_user) and m.admin_option
    and not m.inherit_option and not m.set_option)) as has_unexpected_members,
  (select count(*)::integer from pg_stat_activity where usesysid=r.oid) as backend_sessions
 from target r
)
select 'assess-worker-login-catalogue/1' as contract,
 exists(select 1 from target) as target_present,
 coalesce((select managed_marker and restricted_attributes and disabled_expired and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as staged_catalogue_valid,
 coalesce((select managed_marker and restricted_attributes and active_time_bounded and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as active_catalogue_valid,
 coalesce((select can_create_temp or can_create_schema_objects from facts),true) as public_surface_review_required,
 coalesce((select direct_assess_table_access from facts),true) as direct_assess_table_access,
 coalesce((select backend_sessions from facts),0) as backend_sessions,
 exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as credential_verified,false as pooler_verified,false as runtime_or_launch_verified
 ) inspected;
 if verified is distinct from true then
   raise exception 'Worker login staged catalogue failed; entire creation rolls back' using errcode='55000';
 end if;
end
$catalogue_guard$;
commit;
-- A fresh read-only inspection is separate; a COMMIT acknowledgement is not a credential test.

-- Read-only catalogue inspection for the explicitly selected dedicated login.
-- Set assess.worker_login_target before running. No credentials, user rows, SQL text or worker RPCs.
begin read only;
set local assess.worker_login_target='assess_job_a';
with target as (
 select * from pg_roles where rolname=current_setting('assess.worker_login_target',true)
   and rolname in ('assess_job_a','assess_job_b')
), facts as (
 select r.oid,
  shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database() as managed_marker,
  not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb
    and not r.rolcreaterole and not r.rolreplication and r.rolconnlimit=2 as restricted_attributes,
  not r.rolcanlogin and r.rolvaliduntil<=now() as disabled_expired,
  r.rolcanlogin and r.rolvaliduntil>now() and r.rolvaliduntil<=now()+interval '90 days' as active_time_bounded,
  (select count(*)=1 and bool_and(g.rolname='assess_worker' and not m.admin_option and not m.inherit_option and m.set_option)
    from pg_auth_members m join pg_roles g on g.oid=m.roleid where m.member=r.oid) as only_worker_membership,
  has_database_privilege(r.oid,current_database(),'CONNECT') as can_connect,
  has_database_privilege(r.oid,current_database(),'TEMP') as can_create_temp,
  exists(select 1 from pg_namespace n where n.nspname !~ '^pg_(temp|toast)' and has_schema_privilege(r.oid,n.oid,'CREATE')) as can_create_schema_objects,
  exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='assess' and c.relkind in ('r','p','v','m','f')
    and (has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) as direct_assess_table_access,
  exists(select 1 from pg_shdepend d where d.refclassid='pg_authid'::regclass and d.refobjid=r.oid and d.deptype='o') as owns_objects,
  -- PostgreSQL16+ gives a non-superuser creator ADMIN-only management of its new role.
  -- Accept that only for the current inspecting operator, with no SET/INHERIT path.
  exists(select 1 from pg_auth_members m where m.roleid=r.oid and not (
    m.member=(select oid from pg_roles where rolname=current_user) and m.admin_option
    and not m.inherit_option and not m.set_option)) as has_unexpected_members,
  (select count(*)::integer from pg_stat_activity where usesysid=r.oid) as backend_sessions
 from target r
)
select 'assess-worker-login-catalogue/1' as contract,
 exists(select 1 from target) as target_present,
 coalesce((select managed_marker and restricted_attributes and disabled_expired and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as staged_catalogue_valid,
 coalesce((select managed_marker and restricted_attributes and active_time_bounded and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as active_catalogue_valid,
 coalesce((select can_create_temp or can_create_schema_objects from facts),true) as public_surface_review_required,
 coalesce((select direct_assess_table_access from facts),true) as direct_assess_table_access,
 coalesce((select backend_sessions from facts),0) as backend_sessions,
 exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as credential_verified,false as pooler_verified,false as runtime_or_launch_verified;
rollback;
