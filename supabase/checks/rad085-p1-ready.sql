-- PROPOSAL / local source-derived catalogue. No live attestation or SQL application.
-- Owner must review PG version, object ownership/ACL and the expected inventory independently.
-- PG16 source catalogue; any drift, including CRLF/body/owner/ACL differences, stops.
-- Metadata only; no participant rows, raw codes, answers, credentials or function bodies returned.
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
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess' and p.prokind in ('f','p')
 union all select 'constraints',c.relname||'.'||k.conname,jsonb_build_object('valid',k.convalidated,'definition',pg_get_constraintdef(k.oid)) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess'
 union all select 'triggers',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='assess' or (n.nspname='public' and c.relname='attempts' and t.tgname='assess_practice_recorded'))
 union all select 'indexes',tablename||'.'||indexname,to_jsonb(indexdef) from pg_indexes where schemaname='assess'
 union all select 'policies',tablename||'.'||policyname,to_jsonb(p)-'schemaname' from pg_policies p where schemaname='assess'
 union all select 'schema','assess',jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text) from pg_namespace n where n.nspname='assess'
), inventory as (select kind,count(*) n,encode(sha256(convert_to(jsonb_agg(jsonb_build_array(key,value) order by key)::text,'UTF8')),'hex') digest from objects group by kind), expected(kind,n,digest) as (values
 ('columns',166,'c5fda9b084efe67e87d25628d94d7e9f8bc70ca0847455946c054657a9ed3982'),
 ('constraints',274,'3915862367e889d0d7ec3b5bf1fd5457a20d36031386d461717a7ea69f75b3b6'),
 ('functions',65,'0e6d30b6235b030b06435d3675a7273bda8730c27eb8bc203efcf8893de8c318'),
 ('indexes',63,'66ca76ec65bbb197fcb79c5f0266a9aea2676d83439baaef48d4cbc84b40037c'),
 ('relations',33,'61ec296f1575d9f8de202c8cb81734dcf466a056a6eda910387aeb2dede34476'),
 ('schema',1,'1b0781c4ad8e2e9c1a2411746559468e4746ac95a359ac14741bcd98490cf91e'),
 ('triggers',5,'537996ee9103b66dff79625a809f3b0c164f0a77199c8bc017ad625afda47019')
)
select e.kind, coalesce(i.n=e.n and i.digest=e.digest,false) as ready
from expected e full join inventory i using(kind) order by e.kind;
rollback;
