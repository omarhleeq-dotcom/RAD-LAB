-- RAD-085 W1 read-only readiness for the grading worker role and slot assess_job_b.
-- Owner laptop via owner_sql. NOT a promoted manifest check. Ends with ROLLBACK.
-- Structure rows must always be t. Stage rows (credential_window, slot_login,
-- binding_login_ready) change with the owner step; see ASSESS_GATE_W_PACKAGES.md.
-- binding_* rows replay the exact createGradingWorkerBinding checks for the slot.
begin read only;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
with g as (select oid from pg_catalog.pg_roles where rolname='assess_grading_worker'),
s as (select * from pg_catalog.pg_roles where rolname='assess_job_b'),
allowed as (select unnest(array['assess.maintain_v1(integer)','assess.claim_v1()','assess.finish_v1(uuid,uuid,text,text)',
 'assess.fail_v1(uuid,uuid)','assess.health_v1()']) signature),
checks(check_name,ok) as (
 select 'group_role_flags',exists(select 1 from pg_catalog.pg_roles r where r.rolname='assess_grading_worker' and not r.rolcanlogin
  and not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication)
 union all select 'group_no_memberships',exists(select 1 from g) and not exists(select 1 from pg_catalog.pg_auth_members m,g where m.member=g.oid)
 union all select 'group_members_slot_only',exists(select 1 from g) and not exists(select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles r on r.oid=m.member,g
  where m.roleid=g.oid and r.rolname<>'assess_job_b' and (m.set_option or m.inherit_option))
 union all select 'group_execute_exact',exists(select 1 from g) and (select count(*) from pg_catalog.pg_proc p where p.pronamespace='assess'::regnamespace
  and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE'))=5
  and (select count(*) from allowed a where to_regprocedure(a.signature) is not null
   and pg_catalog.has_function_privilege('assess_grading_worker',to_regprocedure(a.signature),'EXECUTE'))=5
 union all select 'group_schema_usage_assess',exists(select 1 from g) and pg_catalog.has_schema_privilege('assess_grading_worker','assess','USAGE')
 union all select 'no_table_privileges',exists(select 1 from g) and exists(select 1 from s) and not exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('assess','public','auth','emergency') and c.relkind in ('r','p','v','m','f')
  and (pg_catalog.has_table_privilege('assess_grading_worker',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   or pg_catalog.has_table_privilege('assess_job_b',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')))
 union all select 'slot_flags',exists(select 1 from s where not rolinherit and not rolsuper and not rolbypassrls and not rolcreatedb
  and not rolcreaterole and not rolreplication and rolconnlimit=2)
 union all select 'slot_membership_exact',(select count(*) from pg_catalog.pg_auth_members m,s where m.member=s.oid)=1
  and exists(select 1 from pg_catalog.pg_auth_members m,s,g where m.member=s.oid and m.roleid=g.oid and m.set_option and not m.inherit_option and not m.admin_option)
 union all select 'slot_marker',exists(select 1 from s where pg_catalog.shobj_description(s.oid,'pg_authid')='radlab-assess-grading-slot/1 database='||pg_catalog.current_database())
 union all select 'slot_connect',exists(select 1 from s) and pg_catalog.has_database_privilege('assess_job_b',pg_catalog.current_database(),'CONNECT')
 union all select 'slot_a_not_login',not exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin)
 union all select 'gate_closed',(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 -- Same predicates as the binding ACL query, evaluated for the role it SETs.
 union all select 'binding_acl_ready',exists(select 1 from g)
  and not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
   where n.nspname='assess' and pg_catalog.has_function_privilege('assess_grading_worker',p.oid,'EXECUTE')
   and p.oid not in ('assess.maintain_v1(integer)'::regprocedure,'assess.claim_v1()'::regprocedure,
    'assess.finish_v1(uuid,uuid,text,text)'::regprocedure,'assess.fail_v1(uuid,uuid)'::regprocedure,'assess.health_v1()'::regprocedure))
  and not pg_catalog.has_database_privilege('assess_grading_worker',pg_catalog.current_database(),'CREATE,TEMP')
  and not exists(select 1 from pg_catalog.pg_namespace n where n.nspname not like 'pg_%'
   and n.nspname<>'information_schema' and pg_catalog.has_schema_privilege('assess_grading_worker',n.oid,'CREATE'))
 union all select 'credential_window',exists(select 1 from s where rolvaliduntil>now()+interval '1 hour' and rolvaliduntil<=now()+interval '90 days')
 union all select 'slot_login',exists(select 1 from s where rolcanlogin)
 -- Same predicates as the binding login query with session_user = assess_job_b.
 union all select 'binding_login_ready',exists(select 1 from s r where r.rolcanlogin and not r.rolinherit
  and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication
  and r.rolvaliduntil > clock_timestamp()
  and exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
   where m.member=r.oid and g.rolname='assess_grading_worker' and m.set_option and not m.inherit_option and not m.admin_option)
  and not exists (select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid
   where m.member=r.oid and (g.rolname<>'assess_grading_worker' or m.admin_option or m.inherit_option or not m.set_option))
  and not exists (select 1 from pg_catalog.pg_auth_members m where m.member='assess_grading_worker'::regrole)
  and exists (select 1 from pg_catalog.pg_roles g where g.rolname='assess_grading_worker'
   and not g.rolcanlogin and not g.rolsuper and not g.rolbypassrls and not g.rolinherit
   and not g.rolcreatedb and not g.rolcreaterole and not g.rolreplication))
 union all select 'backend_sessions_absent',not exists(select 1 from pg_catalog.pg_stat_activity where usename='assess_job_b')
)
select check_name,coalesce(ok,false) ok from checks;
rollback;
