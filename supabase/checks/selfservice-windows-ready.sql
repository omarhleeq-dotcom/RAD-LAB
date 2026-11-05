-- C1 windows readiness; read only, exact definitions/ACLs also pinned by selfservice/rad085-review-ready.sql.
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
