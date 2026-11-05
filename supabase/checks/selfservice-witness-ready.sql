-- C1 witness readiness; no health_v1 call (it ticks), no epoch or learner identifiers returned.
begin read only;
set local search_path=public;
select 'witness_singleton' check_name,(select count(*)=1 and bool_and(singleton and seq>=0 and epoch is not null and accepted_at is not null) from assess.restore_epoch) ok
union all select 'witness_private',exists(select 1 from pg_class where oid=to_regclass('assess.restore_epoch') and relrowsecurity)
 and not exists(select 1 from pg_roles r where r.rolname in ('anon','authenticated','assess_worker','service_role')
 and has_table_privilege(r.oid,'assess.restore_epoch','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
union all select 'witness_rpc_acl',has_function_privilege('authenticated','assess.witness_accept_v1(text)','EXECUTE')
 and has_function_privilege('authenticated','assess.owner_resume_v1(text)','EXECUTE')
 and not has_function_privilege('anon','assess.witness_accept_v1(text)','EXECUTE')
 and not has_function_privilege('anon','assess.owner_resume_v1(text)','EXECUTE');
rollback;
