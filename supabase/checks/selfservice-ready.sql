-- C1 windows readiness; read only, exact definitions/ACLs also pinned by selfservice-rad085-review-ready.sql.
begin read only;
set local search_path=public;
select 'windows_private' check_name,exists(select 1 from pg_class where oid=to_regclass('assess.assignment_windows') and relrowsecurity)
 and not exists(select 1 from pg_roles r where r.rolname in ('anon','authenticated','assess_worker','service_role')
 and has_table_privilege(r.oid,'assess.assignment_windows','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) ok
union all select 'windows_rpc_acl',
 has_function_privilege('authenticated','assess.assignment_window_set_v1(uuid,integer,timestamptz,timestamptz)','EXECUTE')
 and has_function_privilege('authenticated','assess.my_windows_v1(uuid[])','EXECUTE')
 and has_function_privilege('authenticated','assess.assignment_status_v1(uuid,uuid,integer)','EXECUTE')
 and not has_function_privilege('authenticated','assess.window_guard_v1(uuid)','EXECUTE')
 and not has_function_privilege('authenticated','assess.window_deadline_v1(uuid,timestamptz,integer)','EXECUTE');
rollback;
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
