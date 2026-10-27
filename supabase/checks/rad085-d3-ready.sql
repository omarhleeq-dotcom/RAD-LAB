-- RAD-085 D3 source-derived complete catalogue (including C2 body); READ ONLY.
-- PG18 local source evidence, not provider attestation. Review restored PG major/ACL.
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with objects(kind,key,value) as (
 select 'relations',c.relname,jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','S','f')
 union all select 'columns',c.relname||'.'||a.attname,jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'acl',a.attacl::text)
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where n.nspname='assess' and a.attnum>0 and not a.attisdropped and c.relkind in ('r','p')
 union all select 'functions',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'source',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='assess' or (n.nspname='public' and p.proname='owner_account_deletion_v1')) and p.prokind in ('f','p')
 union all select 'constraints',c.relname||'.'||k.conname,jsonb_build_object('valid',k.convalidated,'definition',pg_get_constraintdef(k.oid)) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and k.contype<>'n'
 union all select 'triggers',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='assess' or (n.nspname='public' and c.relname='attempts' and t.tgname='assess_practice_recorded'))
 union all select 'indexes',tablename||'.'||indexname,to_jsonb(indexdef) from pg_indexes where schemaname='assess'
 union all select 'policies',tablename||'.'||policyname,to_jsonb(p)-'schemaname' from pg_policies p where schemaname='assess'
 union all select 'schema','assess',jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text) from pg_namespace n where n.nspname='assess'
), inventory as (select kind,count(*) n,encode(sha256(convert_to(jsonb_agg(jsonb_build_array(key,value) order by key)::text,'UTF8')),'hex') digest from objects group by kind), expected(kind,n,digest) as (values
 ('columns',186,'583afac6d0d92423b3abe1025fc663e4ba70782a64f90a8a448e1b4c1a3e0a5e'),
 ('constraints',154,'10f9293400d08f381a83ece877251e22d2c600a26c0c810570d2924d50b6a480'),
 ('functions',74,'d01b8b0f53221bf4bbc7d0f6da0446271e8b5b38c1cbdada2b7a3750e1fc7a91'),
 ('indexes',72,'e7e25afa23961dbf428bb6ace151463f9a9ab224697368b085106e252d9dbd69'),
 ('relations',39,'f9702f100fce917867b680cbbe31e1b6df8d8d91e4f9142b99fe5aa5882001c0'),
 ('schema',1,'1b0781c4ad8e2e9c1a2411746559468e4746ac95a359ac14741bcd98490cf91e'),
 ('triggers',5,'537996ee9103b66dff79625a809f3b0c164f0a77199c8bc017ad625afda47019')
)
select coalesce(e.kind,i.kind) kind,coalesce(i.n=e.n and i.digest=e.digest,false) ready
from expected e full join inventory i using(kind)
union all select 'fk_inventory', (select expected.inventory=assess.d3_fk_inventory_v1() from assess.erasure_fk_contract expected where singleton)
order by kind;
rollback;
