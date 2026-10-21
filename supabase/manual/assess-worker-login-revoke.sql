-- REVIEW PACKAGE ONLY. Do not run on the original database without separate authorisation.
-- Stop runs and pooler frontends first. Select exact target/database as in provisioning,
-- and set assess.worker_login_action='revoke-reviewed'. Run the WHOLE file.
-- Revocation MUST COMMIT before the separate termination phase; failure to kill is not success.
-- No DROP ROLE, shared PUBLIC ACL changes, business writes or worker/recovery RPCs.
begin;
set local search_path='';
set local lock_timeout='5s';
set local statement_timeout='15s';
select pg_advisory_xact_lock(hashtextextended('radlab-assess-login/1',0));
do $revoke$
declare target text := current_setting('assess.worker_login_target',true);
begin
 if target is null or target not in ('assess_job_a','assess_job_b')
   or current_setting('assess.worker_login_database',true) is distinct from current_database()
   or current_setting('assess.worker_login_action',true) is distinct from 'revoke-reviewed'
   or not exists(select 1 from pg_roles r where r.rolname=target
     and shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database()
     and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication)
   or session_user=target then
   raise exception 'Worker login revoke precondition failed' using errcode='55000';
 end if;
 execute format('alter role %I nologin password null valid until %L',target,'1970-01-01 00:00:00+00');
 execute format('revoke assess_worker from %I',target);
 execute format('revoke connect on database %I from %I',current_database(),target);
end
$revoke$;
commit;
-- TERMINATION PHASE: an independent statement after COMMIT.
-- Role names are cluster-wide. Target this dedicated login across ALL databases,
-- including sessions whose current_user became assess_worker; do not target by app name.
begin;
set local search_path='';
set local statement_timeout='15s';
do $terminate$
declare target text := current_setting('assess.worker_login_target',true); backend record; n integer;
begin
 if target is null or target not in ('assess_job_a','assess_job_b')
   or current_setting('assess.worker_login_database',true) is distinct from current_database()
   or current_setting('assess.worker_login_action',true) is distinct from 'revoke-reviewed'
   or not exists(select 1 from pg_roles r where r.rolname=target and not r.rolcanlogin
     and r.rolvaliduntil<=now()
     and shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database())
   or exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member
     join pg_roles g on g.oid=m.roleid where r.rolname=target and g.rolname='assess_worker') then
   raise exception 'Worker login termination precondition failed' using errcode='55000';
 end if;
 select count(*) into n from pg_stat_activity where usename=target and pid<>pg_backend_pid();
 if n>8 then raise exception 'Worker login session ceiling exceeded; retain containment' using errcode='55000'; end if;
 for backend in select pid from pg_stat_activity where usename=target and pid<>pg_backend_pid() loop
   if not pg_terminate_backend(backend.pid,1000) then
     raise exception 'Worker login termination not acknowledged' using errcode='55000';
   end if;
 end loop;
end
$terminate$;
commit;
-- Recheck from a fresh snapshot AND again after the observation window; no query texts.
begin read only;
select 'assess-worker-login-revoke/1' as contract,
 coalesce((select not r.rolcanlogin and r.rolvaliduntil<=now() from pg_roles r
   where r.rolname=current_setting('assess.worker_login_target',true)),false) as login_disabled,
 not exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member
   join pg_roles g on g.oid=m.roleid where r.rolname=current_setting('assess.worker_login_target',true)
   and g.rolname='assess_worker') as worker_membership_absent,
 not exists(select 1 from pg_stat_activity where usename=current_setting('assess.worker_login_target',true)) as backend_sessions_absent,
 false as pooler_frontends_and_cache_verified,
 false as runtime_or_launch_verified;
rollback;
