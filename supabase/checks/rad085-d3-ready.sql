-- RAD-085 D3 source-derived complete catalogue (including C2 body); READ ONLY.
-- PG18 local source evidence, not provider attestation. Review restored PG major/ACL.
-- RAD085-SEC-FIXES-20261027 SEC-05: also effective (inherited) privileges, role
-- attributes/memberships and the sharing policy state. Default phase: after the O2
-- initializer. Before it, run with PGOPTIONS='-c rad085.sharing_phase=pre-initializer'.
-- B7 / RAD085-CRLF-READINESS-20261028: CR is representation only. LF digests stay unchanged.
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with objects(kind,key,value) as (
 -- text, not name: a name-typed UNION key truncates to 63 bytes and makes tie order plan-dependent.
 select 'relations',c.relname::text,jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','S','f')
 union all select 'columns',c.relname||'.'||a.attname,jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'default',replace(pg_get_expr(d.adbin,d.adrelid),E'\r',''),'acl',a.attacl::text)
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where n.nspname='assess' and a.attnum>0 and not a.attisdropped and c.relkind in ('r','p')
 union all select 'functions',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'source',encode(sha256(convert_to(replace(pg_get_functiondef(p.oid),E'\r',''),'UTF8')),'hex'))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='assess' or (n.nspname='public' and p.proname='owner_account_deletion_v1')) and p.prokind in ('f','p')
 union all select 'constraints',c.relname||'.'||k.conname,jsonb_build_object('valid',k.convalidated,'definition',replace(pg_get_constraintdef(k.oid),E'\r','')) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and k.contype<>'n'
 union all select 'triggers',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',replace(pg_get_triggerdef(t.oid),E'\r','')) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='assess' or (n.nspname='public' and c.relname='attempts' and t.tgname='assess_practice_recorded'))
 union all select 'indexes',tablename||'.'||indexname,to_jsonb(replace(indexdef,E'\r','')) from pg_indexes where schemaname='assess'
 union all select 'policies',tablename||'.'||policyname,(to_jsonb(p)-'schemaname'-'qual'-'with_check')||jsonb_build_object('qual',replace(p.qual,E'\r',''),'with_check',replace(p.with_check,E'\r','')) from pg_policies p where schemaname='assess'
 union all select 'schema','assess',jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text) from pg_namespace n where n.nspname='assess'
), api_roles(name) as (values ('public'),('anon'),('authenticated'),('assess_worker'),('assess_authoring_bridge')
), effective(key) as (
 select r.name||' EXECUTE '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
 from api_roles r cross join pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='assess' or (n.nspname='public' and p.proname='owner_account_deletion_v1')) and p.prokind in ('f','p') and has_function_privilege(r.name,p.oid,'EXECUTE')
 union all select r.name||' '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) x(priv)
 where n.nspname='assess' and c.relkind in ('r','p','v','m','f') and has_table_privilege(r.name,c.oid,x.priv)
 union all select r.name||' column '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','REFERENCES']) x(priv)
 where n.nspname='assess' and c.relkind in ('r','p','v','m','f') and has_any_column_privilege(r.name,c.oid,x.priv)
 union all select r.name||' schema '||x.priv from api_roles r cross join unnest(array['USAGE','CREATE']) x(priv) where has_schema_privilege(r.name,'assess',x.priv)
), objects_all(kind,key,value) as (
 select * from objects union all select 'effective_privileges',key,'true'::jsonb from effective
), inventory as (select kind,count(*) n,encode(sha256(convert_to(jsonb_agg(jsonb_build_array(key,value) order by key)::text,'UTF8')),'hex') digest from objects_all group by kind), expected(kind,n,digest) as (values
 ('columns',186,'583afac6d0d92423b3abe1025fc663e4ba70782a64f90a8a448e1b4c1a3e0a5e'),
 ('constraints',154,'28bd9fc7dcd1d8cabf96f4240e380c03444d94f6b044b505e78ea383fd3a76a8'),
 ('effective_privileges',56,'f23ba4458a4e45da2183774959efb60f8a7560f460ea7513a60304ac25ae7f2c'),
 ('functions',75,'394aed469deeb5c0c3012b5428d3545e660cd2fb8fa123f088fd8a36fd36770f'),
 ('indexes',72,'dc8d78fb46dca786d9bf818c310023145fc92c3f7ad45e4fcef480b741e50ef4'),
 ('relations',39,'f9702f100fce917867b680cbbe31e1b6df8d8d91e4f9142b99fe5aa5882001c0'),
 ('schema',1,'1b0781c4ad8e2e9c1a2411746559468e4746ac95a359ac14741bcd98490cf91e'),
 ('triggers',5,'537996ee9103b66dff79625a809f3b0c164f0a77199c8bc017ad625afda47019')
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
