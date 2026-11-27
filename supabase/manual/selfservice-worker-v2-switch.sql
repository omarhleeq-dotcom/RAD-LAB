-- Approved S4 owner-window packet. Never invoked by a build, test deployment or Scheduler.
-- Atomic v1 -> v2 replacement; no LOGIN, credential, gate or cloud activation.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='8s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-grading-worker/1',0));
lock table assess.launch_gate, assess.sessions in share row exclusive mode;
do $switch$
declare old_set oid[]; new_set oid[];
begin
 if current_setting('radlab.worker_switch_authorized',true) is distinct from 'apply-reviewed-v2' then
  raise notice 'DRY RUN: reviewed owner window required for atomic five-operation v2 switch';return;
 end if;
 if current_user<>'postgres' or session_user<>'postgres' then raise exception 'owner required' using errcode='55000'; end if;
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select count(*) from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and not rolcanlogin)<>2
 or exists(select 1 from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b'))
 or exists(select 1 from assess.sessions where lifecycle_version=1 and
   (state not in ('graded','void') or emergency_held_at is not null or lease_until is not null))
 then raise exception 'S4 switch requires CLOSED, NOLOGIN, zero connections and zero unfinished v1 work' using errcode='55000'; end if;
 old_set:=array['assess.maintain_v1(integer)'::regprocedure,'assess.claim_v1()'::regprocedure,
 'assess.finish_v1(uuid,uuid,text,text)'::regprocedure,'assess.fail_v1(uuid,uuid)'::regprocedure,'assess.health_v1()'::regprocedure];
 new_set:=array['assess.maintain_v2(integer)'::regprocedure,'assess.claim_v2()'::regprocedure,
 'assess.finish_v2(uuid,uuid,text,text)'::regprocedure,'assess.fail_v2(uuid,uuid)'::regprocedure,'assess.worker_health_v2()'::regprocedure];
 if (select array_agg(p.oid order by p.oid) from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace
   and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE'))
   is distinct from (select array_agg(x order by x) from unnest(old_set)x)
 then raise exception 'unexpected existing grant set; no replacement' using errcode='55000'; end if;
 revoke execute on function assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.health_v1() from assess_grading_worker;
 grant execute on function assess.maintain_v2(integer),assess.claim_v2(),assess.finish_v2(uuid,uuid,text,text),assess.fail_v2(uuid,uuid),assess.worker_health_v2() to assess_grading_worker;
 if (select array_agg(p.oid order by p.oid) from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace
   and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE'))
   is distinct from (select array_agg(x order by x) from unnest(new_set)x)
 then raise exception 'S4 exact grant postcondition' using errcode='55000'; end if;
end $switch$;
-- Validate role attributes, membership and effective privileges BEFORE commit.
-- Any error leaves the transaction aborted; caller must ROLLBACK, never continue.
do $$begin
 if current_setting('radlab.worker_switch_authorized',true) is distinct from 'apply-reviewed-v2' then return;end if;
 if exists(select 1 from pg_catalog.pg_roles where rolname='assess_grading_worker' and rolcanlogin)
 or exists(select 1 from pg_catalog.pg_proc p cross join lateral pg_catalog.aclexplode(p.proacl) a
   where p.pronamespace='assess'::regnamespace and a.grantee='assess_grading_worker'::regrole and a.is_grantable)
 or exists(select 1 from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace and pg_catalog.has_function_privilege('assess_job_b',p.oid,'EXECUTE'))
 or exists(select 1 from pg_catalog.pg_roles r where r.rolname in ('assess_job_b','assess_grading_worker') and
   (pg_catalog.has_database_privilege(r.oid,current_database(),'CREATE,TEMP') or exists(select 1 from pg_catalog.pg_namespace n where
     n.nspname not like 'pg_%' and n.nspname<>'information_schema' and pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE'))))
 or exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_grading_worker','assess_job_b') and
   (rolinherit or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls))
 or (select count(*) from pg_catalog.pg_auth_members where member='assess_job_b'::regrole)<>1
 or not exists(select 1 from pg_catalog.pg_auth_members where member='assess_job_b'::regrole and roleid='assess_grading_worker'::regrole
   and set_option and not inherit_option and not admin_option)
 or exists(select 1 from pg_catalog.pg_auth_members where member='assess_grading_worker'::regrole)
 or exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('assess','public','auth','emergency') and c.relkind in ('r','p','v','m','f') and
   (pg_catalog.has_table_privilege('assess_grading_worker',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or
    pg_catalog.has_table_privilege('assess_job_b',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')))
 then raise exception 'S4 identity/ACL postcondition' using errcode='55000'; end if;
end$$;
commit;
