-- Read-only S4 grant successor: the original W1 readiness/assertions remain unchanged.
begin read only;
set local search_path='';
set local statement_timeout='5s';
with allowed as (select unnest(array['assess.maintain_v2(integer)'::regprocedure,'assess.claim_v2()'::regprocedure,
 'assess.finish_v2(uuid,uuid,text,text)'::regprocedure,'assess.fail_v2(uuid,uuid)'::regprocedure,'assess.worker_health_v2()'::regprocedure])::oid id)
select 's4_worker_exact_five' check_name,
 (select count(*)=5 from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE'))
 and not exists(select 1 from allowed where not pg_catalog.has_function_privilege('assess_grading_worker',id,'EXECUTE'))
 and not exists(select 1 from pg_catalog.pg_proc p cross join lateral pg_catalog.aclexplode(p.proacl) a where p.pronamespace='assess'::regnamespace and a.grantee='assess_grading_worker'::regrole and a.is_grantable)
 and not exists(select 1 from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace and pg_catalog.has_function_privilege('assess_job_b',p.oid,'EXECUTE')) ok
union all
select 's4_roles',
 (select count(*)=2 and bool_and(not rolinherit and not rolsuper and not rolcreatedb and not rolcreaterole and not rolreplication and not rolbypassrls)
 from pg_catalog.pg_roles where rolname in ('assess_job_b','assess_grading_worker'))
 and exists(select 1 from pg_catalog.pg_roles where rolname='assess_grading_worker' and not rolcanlogin)
 and (select count(*)=1 from pg_catalog.pg_auth_members where member='assess_job_b'::regrole)
 and exists(select 1 from pg_catalog.pg_auth_members where member='assess_job_b'::regrole and roleid='assess_grading_worker'::regrole and set_option and not inherit_option and not admin_option)
 and not exists(select 1 from pg_catalog.pg_auth_members where member='assess_grading_worker'::regrole)
union all
select 's4_no_tables',not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('assess','public','auth','emergency') and c.relkind in ('r','p','v','m','f') and
 (pg_catalog.has_table_privilege('assess_grading_worker',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or
  pg_catalog.has_table_privilege('assess_job_b',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')))
union all
select 's4_no_ddl',not exists(select 1 from pg_catalog.pg_roles r where r.rolname in ('assess_job_b','assess_grading_worker') and
 (pg_catalog.has_database_privilege(r.oid,current_database(),'CREATE,TEMP') or exists(select 1 from pg_catalog.pg_namespace n
 where n.nspname not like 'pg_%' and n.nspname<>'information_schema' and pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE'))));
rollback;
