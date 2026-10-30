-- RAD-062 P10 required successor: complete reviewed B + M01-M08 catalogue.
-- Derived from the unchanged migration bytes on isolated PostgreSQL, never live.
-- ACLs normalize NULL/default, order and grantor only; all effective grants,
-- bodies, owners, attributes, policies and unexpected additions remain checked.
-- The frozen rad085-p1-b-ready.sql and restored-copy diagnostic stay unchanged.
-- Default sharing phase is initialized; pre-initializer is synthetic QA only.
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with objects(kind,key,value) as (
 -- text, not name: a name-typed UNION key truncates to 63 bytes and makes tie order plan-dependent.
 select 'relations',c.relname::text,jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee,privilege_type,is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::"char" else 'r'::"char" end,c.relowner))) x) grants))
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p','v','m','S','f')
 union all select 'columns',c.relname||'.'||a.attname,jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'default',replace(pg_get_expr(d.adbin,d.adrelid),E'\r',''),'acl',(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee,privilege_type,is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(a.attacl,acldefault('c',c.relowner))) x) grants))
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and a.attnum>0 and not a.attisdropped and c.relkind in ('r','p')
 union all select 'functions',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee,privilege_type,is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x) grants),'source',encode(sha256(convert_to(replace(pg_get_functiondef(p.oid),E'\r',''),'UTF8')),'hex'))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='assess' or (n.nspname='public' and p.proname in ('owner_account_deletion_v1','rad062_valid_full_name','handle_new_user'))) and p.prokind in ('f','p')
 union all select 'constraints',c.relname||'.'||k.conname,jsonb_build_object('valid',k.convalidated,'definition',replace(pg_get_constraintdef(k.oid),E'\r','')) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and k.contype<>'n'
 union all select 'triggers',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',replace(pg_get_triggerdef(t.oid),E'\r','')) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='assess' or (n.nspname='public' and (c.relname='profiles' or (c.relname='attempts' and t.tgname='assess_practice_recorded'))))
 union all select 'indexes',tablename||'.'||indexname,to_jsonb(replace(indexdef,E'\r','')) from pg_indexes where (schemaname='assess' or (schemaname='public' and tablename='profiles'))
 union all select 'policies',tablename||'.'||policyname,(to_jsonb(p)-'schemaname'-'qual'-'with_check')||jsonb_build_object('qual',replace(p.qual,E'\r',''),'with_check',replace(p.with_check,E'\r','')) from pg_policies p where (schemaname='assess' or (schemaname='public' and tablename='profiles'))
 union all select 'schema','assess',jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee,privilege_type,is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) x) grants)) from pg_namespace n where n.nspname='assess'
), api_roles(name) as (values ('public'),('anon'),('authenticated'),('assess_worker'),('assess_authoring_bridge')
), effective(key) as (
 select r.name||' EXECUTE '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
 from api_roles r cross join pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='assess' or (n.nspname='public' and p.proname in ('owner_account_deletion_v1','rad062_valid_full_name','handle_new_user'))) and p.prokind in ('f','p') and has_function_privilege(r.name,p.oid,'EXECUTE')
 union all select r.name||' '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) x(priv)
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p','v','m','f') and has_table_privilege(r.name,c.oid,x.priv)
 union all select r.name||' column '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','REFERENCES']) x(priv)
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p','v','m','f') and has_any_column_privilege(r.name,c.oid,x.priv)
 union all select r.name||' schema '||x.priv from api_roles r cross join unnest(array['USAGE','CREATE']) x(priv) where has_schema_privilege(r.name,'assess',x.priv)
), objects_all(kind,key,value) as (
 select * from objects union all select 'effective_privileges',key,'true'::jsonb from effective
), inventory as (select kind,count(*) n,encode(sha256(convert_to(jsonb_agg(jsonb_build_array(key,value) order by key)::text,'UTF8')),'hex') digest from objects_all group by kind), expected(kind,n,digest) as (values
 ('columns',260,'2a4f62c65b0ef5f74e3b59ddb5f29ff4ca6dc9d2d5f7779d075c688573aeadeb'),
 ('constraints',221,'a7c1a48b2d68ec92fdbf2719940332283a76158c0fd2541f9b0606dd5c614261'),
 ('effective_privileges',84,'e7f712f682fc23bbba49a72220cbf1c45d8f4d1a5a1f0d57e79a4d998f2394be'),
 ('functions',130,'d48363baf8a4d35ed815b0fda282be325b8e3ed9bc920f2d48a0ed764bb469fd'),
 ('indexes',88,'4d7c2c8842e8c02f1e16556f4ba6748e5e7a971104452d363e0803c10a9a4509'),
 ('policies',3,'4c0eeccc70b84b81aa2070ede181507ad8c31f81b79e20f49fb7b49efa00fc78'),
 ('relations',50,'c74ea4a32105af8cd1c911bfff00fd4f32daa4665c64b60bfc345943a3c60c13'),
 ('schema',1,'c31c3ffd677871fb53adb8f0a9ffbe53e6c629872be0ca265875f562d6f1a29a'),
 ('triggers',26,'40e51a542391a62272eac8d84348639e0588e1108238f6c6f99cfac25e634bfc')
)
select coalesce(e.kind,i.kind) kind,coalesce(i.n=e.n and i.digest=e.digest,false) ready
from expected e full join inventory i using(kind)
union all select 'fk_inventory', (select expected.inventory=assess.d3_fk_inventory_v1() from assess.erasure_fk_contract expected where singleton)
-- No API/assess role may be privileged, log in, or (worker/bridge) inherit.
union all select 'role_attributes', (select count(*)=4 and bool_and(not rolsuper and not rolbypassrls and not rolcreaterole and not rolcreatedb
  and not rolreplication and not rolcanlogin and (rolname in ('anon','authenticated') or not rolinherit))
 from pg_roles where rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge'))
-- These roles are members of nothing. Worker/bridge members: only the reviewed worker
-- logins (SET only), or a PG16+ creator's ADMIN-only grant without INHERIT/SET.
union all select 'role_memberships', not exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member
  where r.rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge'))
 and not exists(select 1 from pg_auth_members m join pg_roles g on g.oid=m.roleid join pg_roles r on r.oid=m.member
  where g.rolname in ('assess_worker','assess_authoring_bridge')
  and not (m.admin_option and not coalesce((to_jsonb(m)->>'inherit_option')::boolean,r.rolinherit) and not coalesce((to_jsonb(m)->>'set_option')::boolean,true))
  and not (g.rolname='assess_worker' and r.rolname in ('assess_job_a','assess_job_b') and not m.admin_option and not coalesce((to_jsonb(m)->>'inherit_option')::boolean,r.rolinherit)))
union all select 'scope_lock', (select count(*)=1 and bool_and(singleton) from assess.scope_lock)
union all select 'sharing_policy:'||phase, case phase
  when 'initialized' then (select count(*)=1 and bool_and(required_version='supervisor-sharing-2026-10-27-v2' and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb') from assess.sharing_policy)
  when 'pre-initializer' then (select count(*)=1 and bool_and(required_version is null and text_digest is null) from assess.sharing_policy)
  else false end
 from (select coalesce(nullif(current_setting('rad085.sharing_phase',true),''),'initialized') phase) setting
order by kind;
rollback;
