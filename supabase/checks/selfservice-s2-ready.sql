-- S2 data/ACL witnesses; read only. Catalogue body/constraints pinned separately.
begin read only;
set local search_path='';
set local statement_timeout='5s';
select 's2_private_tables' check_name,not exists(
 select 1 from pg_roles r cross join (values('all_students_assignments'),('assignment_accommodations'),('stop_active_attempts'),('assessment_notices'),('assessment_notify_settings')) t(name)
 where r.rolname in ('anon','authenticated','service_role','assess_worker','assess_authoring_bridge')
 and has_table_privilege(r.oid,'assess.'||t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) ok
union all select 'notice_switch_singleton',(select count(*)=1 and bool_and(singleton) from assess.assessment_notify_settings)
union all select 'notice_default_off',exists(select 1 from pg_attrdef d join pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum where d.adrelid='assess.assessment_notify_settings'::regclass and a.attname='enabled' and pg_get_expr(d.adbin,d.adrelid)='false')
union all select 's2_gate_expected',coalesce((select count(*)=1 and bool_and(singleton and enabled=case current_setting('radlab.expected_gate',true) when 'open' then true when 'closed' then false else null end) from assess.launch_gate),false)
union all select 's2_identity_unchanged',(select inventory=assess.d3_fk_inventory_v1() from assess.erasure_fk_contract where singleton)
union all select 's2_active_proof',not exists(select 1 from assess.stop_active_attempts where granted_at is not null and not was_active)
union all select 's2_audience',not exists(select 1 from assess.assignments a where (a.audience='all-students') is distinct from exists(select 1 from assess.all_students_assignments q where q.assignment_id=a.id));
rollback;
