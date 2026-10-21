-- Read-only catalogue inspection for the explicitly selected dedicated login.
-- Set assess.worker_login_target before running. No credentials, user rows, SQL text or worker RPCs.
begin read only;
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
  exists(select 1 from pg_auth_members m where m.roleid=r.oid) as has_member_roles,
  (select count(*)::integer from pg_stat_activity where usesysid=r.oid) as backend_sessions
 from target r
)
select 'assess-worker-login-catalogue/1' as contract,
 exists(select 1 from target) as target_present,
 coalesce((select managed_marker and restricted_attributes and disabled_expired and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_member_roles from facts),false) as staged_catalogue_valid,
 coalesce((select managed_marker and restricted_attributes and active_time_bounded and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_member_roles from facts),false) as active_catalogue_valid,
 coalesce((select can_create_temp or can_create_schema_objects from facts),true) as public_surface_review_required,
 coalesce((select direct_assess_table_access from facts),true) as direct_assess_table_access,
 coalesce((select backend_sessions from facts),0) as backend_sessions,
 exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as credential_verified,false as pooler_verified,false as runtime_or_launch_verified;
rollback;
