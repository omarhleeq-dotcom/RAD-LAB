-- S4 approved backup SELECT/policy successor. All earlier oracles remain independently exercised.
-- RAD105 successor; set radlab.expected_gate to 'closed' before activation or 'open' in normal operation.
-- Missing/invalid/mismatched expectation fails closed. No state is changed.
-- Post-0300 successor for R1/R2/S1/P2/P3; exact catalogue/ACL, read only.
begin read only;
set local search_path=public;
set local lock_timeout='2s';
set local statement_timeout='5s';
with functions as (
 select p.oid::regprocedure::text signature,replace(p.prosrc,E'\r','') body,
  l.lanname,p.prokind,p.prosecdef,p.provolatile,p.proisstrict,p.proparallel,p.proleakproof,
  format_type(p.prorettype,null) returns_type,p.proretset,p.proargnames,p.proargmodes,
  pg_get_expr(p.proargdefaults,0) argument_defaults,p.proconfig,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x where not (pg_get_userbyid(x.grantee)::text='assess_grading_worker' and x.privilege_type='EXECUTE' and not x.is_grantable and p.oid::regprocedure::text in ('assess.maintain_v1(integer)','assess.claim_v1()','assess.finish_v1(uuid,uuid,text,text)','assess.fail_v1(uuid,uuid)','assess.health_v1()','assess.maintain_v2(integer)','assess.claim_v2()','assess.finish_v2(uuid,uuid,text,text)','assess.fail_v2(uuid,uuid)','assess.worker_health_v2()'))) grants) acl,r.rolname owner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 join pg_language l on l.oid=p.prolang join pg_roles r on r.oid=p.proowner
 where n.nspname in ('assess','emergency') or (n.nspname='public' and l.lanname in ('sql','plpgsql') and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
  and not (p.oid is not distinct from to_regprocedure('public.rls_auto_enable()') and p.prorettype='event_trigger'::regtype))
), relations as (
 select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x) grants) acl,r.rolname owner,
  (select jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(a.attacl,acldefault('c',c.relowner))) x) grants),a.attidentity,a.attgenerated,
    pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
   from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
   where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) columns,
  (select jsonb_agg(jsonb_build_array(k.conname,replace(pg_get_constraintdef(k.oid),E'\r','')) order by k.conname)
   from pg_constraint k where k.conrelid=c.oid and k.contype<>'n') constraints,
  (select jsonb_agg(jsonb_build_array(replace(pg_get_triggerdef(t.oid),E'\r',''),t.tgenabled) order by t.tgname)
   from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal) triggers,
  (select jsonb_agg(jsonb_build_array(pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text collate "C")
   from pg_index i where i.indrelid=c.oid) indexes,
  (select jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,
    (select jsonb_agg(case when role_oid=0 then 'public' else pg_get_userbyid(role_oid) end order by role_oid) from unnest(p.polroles) role_oid),
    pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname)
   from pg_policy p where p.polrelid=c.oid) policies
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
 where (n.nspname in ('assess','emergency') or (n.nspname='public' and c.relname in ('profiles','events','attempts','feedback','c2_account_deletions'))) and c.relkind in ('r','p')
), fingerprints as (
 select 'functions' check_name,md5((select jsonb_agg(to_jsonb(f) order by signature collate "C")::text from functions f)) actual,'50f46f597788805b0e67bc40c04401d4' expected
 union all select 'relations',md5((select jsonb_agg(to_jsonb(r) order by nspname,relname)::text from relations r)),'9e9702304abbc3e87e50005468638737'
)
select check_name,actual,expected,actual=expected ok from fingerprints
union all select 'identity_inventory',null::text,null::text,(select inventory from assess.erasure_fk_contract where singleton)=assess.d3_fk_inventory_v1()
union all select 'not_null_constraints_plain',null::text,null::text,not exists(
 select 1 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where (n.nspname in ('assess','emergency') or (n.nspname='public' and c.relname in ('profiles','events','attempts','feedback','c2_account_deletions'))) and c.relkind in ('r','p')
 and k.contype='n' and (not k.convalidated or k.connoinherit))
union all select 'gate_state_expected',null::text,null::text,coalesce((select count(*)=1 and bool_and(singleton and enabled=case current_setting('radlab.expected_gate',true) when 'open' then true when 'closed' then false else null end) from assess.launch_gate),false)
union all select 'worker_nologin',null::text,null::text,exists(select 1 from pg_roles where rolname='assess_worker' and not rolcanlogin)
order by check_name;
select 'quota_values' check_name,(select jsonb_agg(to_jsonb(x) order by stream) from assess.pilot_write_limits x)='[{"stream":"attempts","per_hour":3300,"per_day":13200},{"stream":"events","per_hour":9955,"per_day":39820},{"stream":"feedback","per_hour":3300,"per_day":13200}]'::jsonb ok;
select 'quota_private' check_name,not exists(
 select 1 from pg_roles r cross join (values('assess.pilot_write_limits'),('assess.pilot_write_usage')) t(name)
 where r.rolname in ('anon','authenticated','service_role','assess_worker','assess_authoring_bridge')
 and has_table_privilege(r.oid,t.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) ok
union all select 'quota_helper_private',not exists(
 select 1 from pg_roles r where r.rolname in ('anon','authenticated','service_role','assess_worker','assess_authoring_bridge')
 and has_function_privilege(r.oid,'assess.pilot_write_quota_v1()','EXECUTE'))
union all select 'consent_v3_acl',has_function_privilege('authenticated','assess.consent_v3(text)','EXECUTE') and not exists(
 select 1 from pg_roles r where r.rolname in ('anon','service_role','assess_worker','assess_authoring_bridge')
 and has_function_privilege(r.oid,'assess.consent_v3(text)','EXECUTE'))
union all select 'emergency_schema_private',not has_schema_privilege('authenticated','emergency','USAGE') and not has_schema_privilege('anon','emergency','USAGE');
rollback;
