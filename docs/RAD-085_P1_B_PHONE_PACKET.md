# RAD-085 — mini DB day B للهاتف (مولّد محليًا)

المصدر: scripts/assess/phone-sql-packet.mjs. لا تشغيل حي من الوكيل. اقرأ [دليل التنفيذ](RAD-085_P1_B_DB_DAY.md) أولًا. جميع الأجزاء أقل من15000 حرف بعد غلاف النقل. readiness يحتفظ بالدقة modulo CR فقط. النسخ الاحتياطية الخاصة تبقى عند المالك ولا تدخل Git.

## 1 الفحص المسبق — قراءة فقط

الجزء 1 — 721 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
begin read only;
set local statement_timeout='5s';
select version() postgres_version,
 (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed,
 not exists(select 1 from assess.sessions where state in ('active','grading','grading-failed')) no_active_sessions,
 to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)') is not null m1_present,
 to_regprocedure('assess.account_management_v1(text,uuid,text,uuid,integer)') is not null m4_present,
 (select required_version='supervisor-sharing-2026-10-27-v2' and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb' from assess.sharing_policy where singleton) initializer_matches;
rollback;

```

## 2 الجاهزية قبل B — يجب 13/13

الجزء 1 — 7898 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
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

```

## 3a أعداد الجداول — احفظ للمقارنة بعد التطبيق والتراجع

الجزء 1 — 431 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
begin read only;
set local statement_timeout='5s';
select format('%I.%I',n.nspname,c.relname) table_name,
 (xpath('/row/c/text()',query_to_xml(format('select count(*) c from %I.%I',n.nspname,c.relname),false,true,'')))[1]::text::bigint row_count
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r' and (n.nspname in ('public','assess') or (n.nspname='auth' and c.relname='users')) order by 1;
rollback;

```

## 3b النسخة الخفيفة — احفظ الناتج الخاص؛ export_complete_under_5000 يجب true

الجزء 1 — 1407 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
begin read only;
set local statement_timeout='5s';
with rows(table_name,row_data) as (
 select 'assess.groups',to_jsonb(g) from assess.groups g
 union all select 'assess.group_join_codes',to_jsonb(c) from assess.group_join_codes c
 union all select 'assess.group_join_requests',to_jsonb(r) from assess.group_join_requests r
 union all select 'assess.join_request_throttles',to_jsonb(t) from assess.join_request_throttles t
 union all select 'public.profiles',jsonb_build_object('user_id',p.user_id,'display_name',p.display_name) from public.profiles p
), counts as (select table_name,count(*) n from rows group by table_name), bounded as (select coalesce(sum(n),0)<=5000 ok from counts)
select (select ok from bounded) export_complete_under_5000,
 (select coalesce(jsonb_object_agg(table_name,n),'{}') from counts) counts,
 case when (select ok from bounded) then (select coalesce(jsonb_agg(jsonb_build_object('table',table_name,'row',row_data) order by table_name,row_data::text),'[]') from rows) end affected_rows;
select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,pg_get_userbyid(p.proowner) owner,p.proacl::text acl,p.proconfig
from pg_proc p where p.oid in (
 'assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)'::regprocedure,
 'assess.join_request_v1(text)'::regprocedure,
 'assess.scope_page_v1(text,uuid,uuid,integer)'::regprocedure) order by 1;
rollback;

```

## 4 التقدم — قراءة فقط

الجزء 1 — 992 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
begin read only;
set local statement_timeout='5s';
select (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed;
select sig, digest=old_digest m1_m4_exact, digest=new_digest b_exact from (values
('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)','950e3f8dc9f321f901b6376b6b9b10fb76200300d4ba1c42a0340ab7d6426905','dfea87440ee25de5042158632d0c322ab639c899b46bc5f82d45267e0f6e4a7e'),
('assess.join_request_v1(text)','c78384d61eb9df27f2802b2beff4734ac0c2ba1c5fe7feff3c6485a0b880e04e','62a1e07c5583567db944775b0ad24e0511159930cffdb2784343479889ef3caa'),
('assess.scope_page_v1(text,uuid,uuid,integer)','69a6391832e46dbffa4b065673bfe3f9d182f31ce5022fa580e0af8885a96b56','78b3f3aacaa4265bc6390f5690c6472e3d346b9b636f19531ca89e55795cc4d0')
) expected(sig,old_digest,new_digest) cross join lateral (
 select encode(sha256(convert_to(replace(pg_get_functiondef(to_regprocedure(sig)),chr(13),''),'UTF8')),'hex') digest
) actual;
rollback;

```

## 5 تطبيق B — معاملة واحدة

اجمع الخطوات الخمس بالترتيب في استعلام واحد. لا تنفّذ جزءًا منفردًا ولا commit مبكرًا. الدوال أسطر base64 واحدة؛ لا تضف سطرًا داخلها.

الخطوة 1 — 168 حرفًا.

```sql
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table assess.launch_gate in share mode;
select singleton from assess.scope_lock for update;

```

الخطوة 2 — 6124 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'); IF old.digest NOT IN ('950e3f8dc9f321f901b6376b6b9b10fb76200300d4ba1c42a0340ab7d6426905','dfea87440ee25de5042158632d0c322ab639c899b46bc5f82d45267e0f6e4a7e') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLnN1cGVydmlzb3JfZ3JvdXBfdjEocF9hY3Rpb24gdGV4dCwgcF9ncm91cCB1dWlkIERFRkFVTFQgTlVMTDo6dXVpZCwgcF9yZXZpc2lvbiBpbnRlZ2VyIERFRkFVTFQgTlVMTDo6aW50ZWdlciwgcF9uYW1lIHRleHQgREVGQVVMVCBOVUxMOjp0ZXh0LCBwX2VuZHMgdGltZXN0YW1wIHdpdGggdGltZSB6b25lIERFRkFVTFQgTlVMTDo6dGltZXN0YW1wIHdpdGggdGltZSB6b25lKQogUkVUVVJOUyBqc29uYgogTEFOR1VBR0UgcGxwZ3NxbAogU0VDVVJJVFkgREVGSU5FUgogU0VUIHNlYXJjaF9wYXRoIFRPICcnCkFTICRmdW5jdGlvbiQKZGVjbGFyZSBnIGFzc2Vzcy5ncm91cHM7IHJhdyB0ZXh0OyBiaXRzIGJpZ2ludDsgaSBpbnRlZ2VyOyBhdHRlbXB0IGludGVnZXI7IGNvbGxpc2lvbiB0ZXh0OwpiZWdpbgogcGVyZm9ybSBhc3Nlc3Muc2NvcGVfZW50ZXJfdjEodHJ1ZSk7CiBpZiBub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLnN1cGVydmlzb3JfYXBwb2ludG1lbnRzIHdoZXJlIHVzZXJfaWQ9YXV0aC51aWQoKSBhbmQgcmV2b2tlZF9hdCBpcyBudWxsKQogb3Igbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIHB1YmxpYy5wcm9maWxlcyB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCkgYW5kIHJvbGU9J3BhcnRpY2lwYW50JykgdGhlbiByYWlzZSBleGNlcHRpb24gJ3N1cGVydmlzb3Igb25seScgdXNpbmcgZXJyY29kZT0nNDI1MDEnOyBlbmQgaWY7CiBpZiBwX2FjdGlvbj0nY3JlYXRlJyB0aGVuCiAgaWYgcF9uYW1lIGlzIG51bGwgb3IgbGVuZ3RoKGJ0cmltKHBfbmFtZSkpIG5vdCBiZXR3ZWVuIDEgYW5kIDEwMCBvciBwX2VuZHMgaXMgbnVsbCBvciBwX2VuZHM8PWNsb2NrX3RpbWVzdGFtcCgpIHRoZW4KICAgcmFpc2UgZXhjZXB0aW9uICdpbnZhbGlkIGdyb3VwJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKICBpbnNlcnQgaW50byBhc3Nlc3MuZ3JvdXBzKG93bmVyX2lkLG5hbWUsc3VwZXJ2aXNvcl9pZCxzdGFydHNfYXQsZW5kc19hdCkKICAgdmFsdWVzKGF1dGgudWlkKCksYnRyaW0ocF9uYW1lKSxhdXRoLnVpZCgpLGNsb2NrX3RpbWVzdGFtcCgpLHBfZW5kcykgcmV0dXJuaW5nICogaW50byBnOwogZWxzZQogIGc6PWFzc2Vzcy5zdXBlcnZpc2VkX2dyb3VwX3YxKHBfZ3JvdXApOwogIGlmIGcuc2NvcGVfcmV2aXNpb24gaXMgZGlzdGluY3QgZnJvbSBwX3JldmlzaW9uIHRoZW4gcmFpc2UgZXhjZXB0aW9uICdncm91cCBjaGFuZ2VkJyB1c2luZyBlcnJjb2RlPSc0MDAwMSc7IGVuZCBpZjsKICBpZiBwX2FjdGlvbiBub3QgaW4gKCdyb3RhdGUnLCdyZXZva2UtY29kZScsJ2VuZCcpIG9yIHBfYWN0aW9uIGlzIG51bGwgdGhlbiByYWlzZSBleGNlcHRpb24gJ2ludmFsaWQgYWN0aW9uJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKICB1cGRhdGUgYXNzZXNzLmdyb3VwcyBzZXQgc2NvcGVfcmV2aXNpb249c2NvcGVfcmV2aXNpb24rMSxlbmRlZF9hdD1jYXNlIHdoZW4gcF9hY3Rpb249J2VuZCcgdGhlbiBjbG9ja190aW1lc3RhbXAoKSBlbHNlIGVuZGVkX2F0IGVuZCB3aGVyZSBpZD1nLmlkIHJldHVybmluZyAqIGludG8gZzsKIGVuZCBpZjsKIGlmIHBfYWN0aW9uIGluICgnY3JlYXRlJywncm90YXRlJykgdGhlbgogIC0tIEZpcnN0IDQwIFVVSUR2NCBiaXRzIHByZWNlZGUgdGhlIGZpeGVkIHZlcnNpb24vdmFyaWFudCBiaXRzOiB1bmlmb3JtIDQwLWJpdCBzcGFjZS4KICAtLSBSZXRyeSBvbmx5IHRoZSBkaWdlc3QgY29uc3RyYWludDsgYW4gZXhoYXVzdGVkIHJldHJ5IHJvbGxzIGJhY2sgdGhlIGVudGlyZSBSUEMuCiAgZm9yIGF0dGVtcHQgaW4gMS4uMTYgbG9vcAogICBiaXRzOj0oJ3gnfHxzdWJzdHIocmVwbGFjZShnZW5fcmFuZG9tX3V1aWQoKTo6dGV4dCwnLScsJycpLDEsMTApKTo6Yml0KDQwKTo6YmlnaW50OwogICByYXc6PScnOwogICBmb3IgaSBpbiByZXZlcnNlIDcuLjAgbG9vcAogICAgcmF3Oj1yYXd8fHN1YnN0cignMDEyMzQ1Njc4OUFCQ0RFRkdISktNTlBRUlNUVldYWVonLCgoYml0cz4+KGkqNSkpJjMxKTo6aW50ZWdlcisxLDEpOwogICBlbmQgbG9vcDsKICAgLS0gUm90YXRpbmcgdG8gdGhlIHNhbWUgZGlnZXN0IG11c3QgYWxzbyByZXRyeSwgcmF0aGVyIHRoYW4ga2VlcCB0aGUgb2xkIGNvZGUgdmFsaWQuCiAgIGlmIGV4aXN0cyhzZWxlY3QgMSBmcm9tIGFzc2Vzcy5ncm91cF9qb2luX2NvZGVzIHdoZXJlIGdyb3VwX2lkPWcuaWQgYW5kIGRpZ2VzdD1lbmNvZGUoc2hhMjU2KGNvbnZlcnRfdG8ocmF3LCdVVEY4JykpLCdoZXgnKSkgdGhlbgogICAgaWYgYXR0ZW1wdD0xNiB0aGVuIHJhaXNlIGV4Y2VwdGlvbiAnY29kZSBhbGxvY2F0aW9uIGV4aGF1c3RlZCcgdXNpbmcgZXJyY29kZT0nNTQwMDAnOyBlbmQgaWY7CiAgICBjb250aW51ZTsKICAgZW5kIGlmOwogICBiZWdpbgogICAgaW5zZXJ0IGludG8gYXNzZXNzLmdyb3VwX2pvaW5fY29kZXMgdmFsdWVzKGcuaWQsZW5jb2RlKHNoYTI1Nihjb252ZXJ0X3RvKHJhdywnVVRGOCcpKSwnaGV4JyksZy5lbmRzX2F0LG51bGwpCiAgICBvbiBjb25mbGljdChncm91cF9pZCkgZG8gdXBkYXRlIHNldCBkaWdlc3Q9ZXhjbHVkZWQuZGlnZXN0LGV4cGlyZXNfYXQ9ZXhjbHVkZWQuZXhwaXJlc19hdCxyZXZva2VkX2F0PW51bGw7CiAgICBleGl0OwogICBleGNlcHRpb24gd2hlbiB1bmlxdWVfdmlvbGF0aW9uIHRoZW4KICAgIGdldCBzdGFja2VkIGRpYWdub3N0aWNzIGNvbGxpc2lvbj1jb25zdHJhaW50X25hbWU7CiAgICBpZiBjb2xsaXNpb248Pidncm91cF9qb2luX2NvZGVzX2RpZ2VzdF9rZXknIHRoZW4gcmFpc2U7IGVuZCBpZjsKICAgIGlmIGF0dGVtcHQ9MTYgdGhlbiByYWlzZSBleGNlcHRpb24gJ2NvZGUgYWxsb2NhdGlvbiBleGhhdXN0ZWQnIHVzaW5nIGVycmNvZGU9JzU0MDAwJzsgZW5kIGlmOwogICBlbmQ7CiAgZW5kIGxvb3A7CiBlbHNlIHVwZGF0ZSBhc3Nlc3MuZ3JvdXBfam9pbl9jb2RlcyBzZXQgcmV2b2tlZF9hdD1jbG9ja190aW1lc3RhbXAoKSB3aGVyZSBncm91cF9pZD1nLmlkOyBlbmQgaWY7CiBpZiBwX2FjdGlvbj0nZW5kJyB0aGVuCiAgZGVsZXRlIGZyb20gYXNzZXNzLm1lbWJlcnNoaXBzIHdoZXJlIGdyb3VwX2lkPWcuaWQ7CiAgdXBkYXRlIGFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzIHNldCBzdGF0ZT0nY2FuY2VsbGVkJyxyZXZpc2lvbj1yZXZpc2lvbisxLGRlY2lkZWRfYXQ9Y2xvY2tfdGltZXN0YW1wKCksZGVjaWRlZF9ieT1hdXRoLnVpZCgpIHdoZXJlIGdyb3VwX2lkPWcuaWQgYW5kIHN0YXRlPSdwZW5kaW5nJzsKICBzZWxlY3QgKiBpbnRvIGcgZnJvbSBhc3Nlc3MuZ3JvdXBzIHdoZXJlIGlkPWcuaWQ7CiBlbmQgaWY7CiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdpZCcsZy5pZCwncmV2aXNpb24nLGcuc2NvcGVfcmV2aXNpb24sJ2NvZGUnLHJhdyk7CmVuZCAkZnVuY3Rpb24kCg==','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM 'dfea87440ee25de5042158632d0c322ab639c899b46bc5f82d45267e0f6e4a7e' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 3 — 4603 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.join_request_v1(text)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.join_request_v1(text)'); IF old.digest NOT IN ('c78384d61eb9df27f2802b2beff4734ac0c2ba1c5fe7feff3c6485a0b880e04e','62a1e07c5583567db944775b0ad24e0511159930cffdb2784343479889ef3caa') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLmpvaW5fcmVxdWVzdF92MShwX2NvZGUgdGV4dCkKIFJFVFVSTlMganNvbmIKIExBTkdVQUdFIHBscGdzcWwKIFNFQ1VSSVRZIERFRklORVIKIFNFVCBzZWFyY2hfcGF0aCBUTyAnJwpBUyAkZnVuY3Rpb24kCmRlY2xhcmUgZ2lkIHV1aWQ7IHIgYXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHM7IHVzZWRfY291bnQgaW50ZWdlcjsgdHMgdGltZXN0YW1wdHo7CmJlZ2luCiBwZXJmb3JtIGFzc2Vzcy5zY29wZV9lbnRlcl92MSh0cnVlKTsgdHM6PWNsb2NrX3RpbWVzdGFtcCgpOwogaWYgbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIHB1YmxpYy5wcm9maWxlcyB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCkgYW5kIHJvbGU9J3BhcnRpY2lwYW50Jykgb3Igbm90IGFzc2Vzcy5zaGFyaW5nX2FsbG93ZWRfdjEoYXV0aC51aWQoKSkgdGhlbgogIHJhaXNlIGV4Y2VwdGlvbiAnc2hhcmluZyBjb25zZW50IHJlcXVpcmVkJyB1c2luZyBlcnJjb2RlPSc0MjUwMSc7IGVuZCBpZjsKIGluc2VydCBpbnRvIGFzc2Vzcy5qb2luX3JlcXVlc3RfdGhyb3R0bGVzIHZhbHVlcyhhdXRoLnVpZCgpLHRzLDApIG9uIGNvbmZsaWN0IGRvIG5vdGhpbmc7CiB1cGRhdGUgYXNzZXNzLmpvaW5fcmVxdWVzdF90aHJvdHRsZXMgc2V0IHdpbmRvd19hdD10cyx1c2VkPTAgd2hlcmUgdXNlcl9pZD1hdXRoLnVpZCgpIGFuZCB3aW5kb3dfYXQ8PXRzLWludGVydmFsICcxIGhvdXInOwogc2VsZWN0IHVzZWQgaW50byB1c2VkX2NvdW50IGZyb20gYXNzZXNzLmpvaW5fcmVxdWVzdF90aHJvdHRsZXMgd2hlcmUgdXNlcl9pZD1hdXRoLnVpZCgpOwogaWYgdXNlZF9jb3VudD49MTAgdGhlbiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywndW5hdmFpbGFibGUnKTsgZW5kIGlmOwogdXBkYXRlIGFzc2Vzcy5qb2luX3JlcXVlc3RfdGhyb3R0bGVzIHNldCB1c2VkPXVzZWQrMSB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCk7CiBwX2NvZGU6PXVwcGVyKHJlZ2V4cF9yZXBsYWNlKHBfY29kZSwnW1s6c3BhY2U6XS1dJywnJywnZycpKTsKIGlmIHBfY29kZSBpcyBudWxsIG9yIGxlbmd0aChwX2NvZGUpPD44IG9yIHBfY29kZSAhfiAnXlswLTlBLUhKS01OUC1UVi1aXXs4fSQnIHRoZW4gcmV0dXJuIGpzb25iX2J1aWxkX29iamVjdCgnb3V0Y29tZScsJ3VuYXZhaWxhYmxlJyk7IGVuZCBpZjsKIHNlbGVjdCBnLmlkIGludG8gZ2lkIGZyb20gYXNzZXNzLmdyb3VwX2pvaW5fY29kZXMgYyBqb2luIGFzc2Vzcy5ncm91cHMgZyBvbiBnLmlkPWMuZ3JvdXBfaWQKIGpvaW4gYXNzZXNzLnN1cGVydmlzb3JfYXBwb2ludG1lbnRzIGEgb24gYS51c2VyX2lkPWcuc3VwZXJ2aXNvcl9pZCBqb2luIHB1YmxpYy5wcm9maWxlcyBwIG9uIHAudXNlcl9pZD1hLnVzZXJfaWQKIHdoZXJlIGMuZGlnZXN0PWVuY29kZShzaGEyNTYoY29udmVydF90byhwX2NvZGUsJ1VURjgnKSksJ2hleCcpIGFuZCBjLnJldm9rZWRfYXQgaXMgbnVsbCBhbmQgYy5leHBpcmVzX2F0PnRzCiBhbmQgZy5lbmRlZF9hdCBpcyBudWxsIGFuZCBnLmVuZHNfYXQ+dHMgYW5kIGEucmV2b2tlZF9hdCBpcyBudWxsIGFuZCBwLnN0YXR1cz0nYXBwcm92ZWQnCiBhbmQgbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIGFzc2Vzcy5hY2NvdW50X3N0b3BzIHdoZXJlIHVzZXJfaWQ9YS51c2VyX2lkKTsKIGlmIGdpZCBpcyBudWxsIHRoZW4gcmV0dXJuIGpzb25iX2J1aWxkX29iamVjdCgnb3V0Y29tZScsJ3VuYXZhaWxhYmxlJyk7IGVuZCBpZjsKIGlmIGV4aXN0cyhzZWxlY3QgMSBmcm9tIGFzc2Vzcy5tZW1iZXJzaGlwcyB3aGVyZSBncm91cF9pZD1naWQgYW5kIHVzZXJfaWQ9YXV0aC51aWQoKSkgdGhlbiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywnbWVtYmVyJyk7IGVuZCBpZjsKIGluc2VydCBpbnRvIGFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzKGdyb3VwX2lkLHVzZXJfaWQsc3RhdGUscmVxdWVzdGVkX2F0KSB2YWx1ZXMoZ2lkLGF1dGgudWlkKCksJ3BlbmRpbmcnLHRzKQogb24gY29uZmxpY3QoZ3JvdXBfaWQsdXNlcl9pZCkgZG8gdXBkYXRlIHNldCBzdGF0ZT0ncGVuZGluZycscmVxdWVzdGVkX2F0PXRzLHJldmlzaW9uPWFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzLnJldmlzaW9uKzEsZGVjaWRlZF9hdD1udWxsLGRlY2lkZWRfYnk9bnVsbAogd2hlcmUgYXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHMuc3RhdGU8PidwZW5kaW5nJzsKIHNlbGVjdCAqIGludG8gciBmcm9tIGFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzIHdoZXJlIGdyb3VwX2lkPWdpZCBhbmQgdXNlcl9pZD1hdXRoLnVpZCgpOwogcmV0dXJuIGpzb25iX2J1aWxkX29iamVjdCgnb3V0Y29tZScsJ3BlbmRpbmcnLCdpZCcsci5pZCwncmV2aXNpb24nLHIucmV2aXNpb24pOwplbmQgJGZ1bmN0aW9uJAo=','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.join_request_v1(text)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM '62a1e07c5583567db944775b0ad24e0511159930cffdb2784343479889ef3caa' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 4 — 7423 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)'); IF old.digest NOT IN ('69a6391832e46dbffa4b065673bfe3f9d182f31ce5022fa580e0af8885a96b56','78b3f3aacaa4265bc6390f5690c6472e3d346b9b636f19531ca89e55795cc4d0') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLnNjb3BlX3BhZ2VfdjEocF9raW5kIHRleHQsIHBfZ3JvdXAgdXVpZCBERUZBVUxUIE5VTEw6OnV1aWQsIHBfYWZ0ZXIgdXVpZCBERUZBVUxUIE5VTEw6OnV1aWQsIHBfbGltaXQgaW50ZWdlciBERUZBVUxUIDIwKQogUkVUVVJOUyBqc29uYgogTEFOR1VBR0UgcGxwZ3NxbAogU0VDVVJJVFkgREVGSU5FUgogU0VUIHNlYXJjaF9wYXRoIFRPICcnCkFTICRmdW5jdGlvbiQKZGVjbGFyZSByb3dzIGpzb25iOyB0b3RhbCBiaWdpbnQ7IHRzIHRpbWVzdGFtcHR6OyBnIGFzc2Vzcy5ncm91cHM7CmJlZ2luCiBwZXJmb3JtIGFzc2Vzcy5zY29wZV9lbnRlcl92MShmYWxzZSk7IHRzOj1jbG9ja190aW1lc3RhbXAoKTsKIGlmIHBfbGltaXQgaXMgbnVsbCBvciBwX2xpbWl0IG5vdCBiZXR3ZWVuIDEgYW5kIDEwMCB0aGVuIHJhaXNlIGV4Y2VwdGlvbiAnaW52YWxpZCBwYWdlJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKIGlmIHBfa2luZD0nZ3JvdXBzJyB0aGVuCiAgc2VsZWN0IGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHJvd3MgZnJvbSAoCiAgIHNlbGVjdCBncnAuaWQsZ3JwLm5hbWUsZ3JwLnN1cGVydmlzb3JfaWQsZ3JwLnN0YXJ0c19hdCxncnAuZW5kc19hdCxncnAuc2NvcGVfcmV2aXNpb24gcmV2aXNpb24sCiAgICBncmVhdGVzdChncnAuc3RhcnRzX2F0LGEuYXBwb2ludGVkX2F0KSBzdXBlcnZpc2VkX2Zyb20KICAgZnJvbSBhc3Nlc3MuZ3JvdXBzIGdycCBqb2luIGFzc2Vzcy5zdXBlcnZpc29yX2FwcG9pbnRtZW50cyBhIG9uIGEudXNlcl9pZD1ncnAuc3VwZXJ2aXNvcl9pZAogICB3aGVyZSBncnAuc3VwZXJ2aXNvcl9pZD1hdXRoLnVpZCgpIGFuZCBhLnJldm9rZWRfYXQgaXMgbnVsbCBhbmQgZ3JwLmVuZGVkX2F0IGlzIG51bGwgYW5kIGdycC5lbmRzX2F0PnRzCiAgICBhbmQgKHBfYWZ0ZXIgaXMgbnVsbCBvciBncnAuaWQ+cF9hZnRlcikgb3JkZXIgYnkgZ3JwLmlkIGxpbWl0IHBfbGltaXQpIHE7CiBlbHNpZiBwX2tpbmQ9J215LXJlcXVlc3RzJyB0aGVuCiAgc2VsZWN0IGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHJvd3MgZnJvbSAoCiAgIHNlbGVjdCByLmlkLHIuZ3JvdXBfaWQsci5zdGF0ZSxyLnJldmlzaW9uLGdycC5uYW1lIGdyb3VwX25hbWUKICAgZnJvbSBhc3Nlc3MuZ3JvdXBfam9pbl9yZXF1ZXN0cyByIGxlZnQgam9pbiBhc3Nlc3MuZ3JvdXBzIGdycCBvbiBncnAuaWQ9ci5ncm91cF9pZCB3aGVyZSByLnVzZXJfaWQ9YXV0aC51aWQoKQogICBhbmQgKHBfYWZ0ZXIgaXMgbnVsbCBvciByLmlkPnBfYWZ0ZXIpIG9yZGVyIGJ5IHIuaWQgbGltaXQgcF9saW1pdCkgcTsKIGVsc2lmIHBfa2luZD0nYXBwb2ludG1lbnRzJyB0aGVuCiAgaWYgbm90IHB1YmxpYy5pc19vd25lcigpIHRoZW4gcmFpc2UgZXhjZXB0aW9uICdvd25lciBvbmx5JyB1c2luZyBlcnJjb2RlPSc0MjUwMSc7IGVuZCBpZjsKICBzZWxlY3QgY29hbGVzY2UoanNvbmJfYWdnKHRvX2pzb25iKHEpIG9yZGVyIGJ5IHEuaWQpLCdbXScpIGludG8gcm93cyBmcm9tICgKICAgc2VsZWN0IGEudXNlcl9pZCBpZCxwLmRpc3BsYXlfbmFtZSxhLnJldm9rZWRfYXQsYS5yZXZpc2lvbiBmcm9tIGFzc2Vzcy5zdXBlcnZpc29yX2FwcG9pbnRtZW50cyBhIGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPWEudXNlcl9pZAogICB3aGVyZSBwX2FmdGVyIGlzIG51bGwgb3IgYS51c2VyX2lkPnBfYWZ0ZXIgb3JkZXIgYnkgYS51c2VyX2lkIGxpbWl0IHBfbGltaXQpIHE7CiBlbHNlCiAgZzo9YXNzZXNzLnN1cGVydmlzZWRfZ3JvdXBfdjEocF9ncm91cCk7CiAgaWYgcF9raW5kPSdtZW1iZXJzJyB0aGVuCiAgIHNlbGVjdCBjb3VudCgqKSBpbnRvIHRvdGFsIGZyb20gYXNzZXNzLnZpc2libGVfbWVtYmVyc192MShnLmlkKTsKICAgc2VsZWN0IGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHJvd3MgZnJvbSAoCiAgICBzZWxlY3Qgdi51c2VyX2lkIGlkLHAuZGlzcGxheV9uYW1lLHYucGVyaW9kX2lkLHYudmlzaWJsZV9mcm9tIGZyb20gYXNzZXNzLnZpc2libGVfbWVtYmVyc192MShnLmlkKSB2CiAgICBqb2luIHB1YmxpYy5wcm9maWxlcyBwIG9uIHAudXNlcl9pZD12LnVzZXJfaWQgd2hlcmUgcF9hZnRlciBpcyBudWxsIG9yIHYudXNlcl9pZD5wX2FmdGVyIG9yZGVyIGJ5IHYudXNlcl9pZCBsaW1pdCBwX2xpbWl0KSBxOwogIGVsc2lmIHBfa2luZD0ncmVxdWVzdHMnIHRoZW4KICAgLS0gUkFEMDg1LVNFQy1GSVhFUy0yMDI2MTAyNyBTRUMtMDI6IG9ubHkgcGVuZGluZyByZXF1ZXN0cyBvZiBhY2NvdW50cyBzdGlsbCBlbGlnaWJsZQogICAtLSB0byBqb2luLCBmaWx0ZXJlZCBiZWZvcmUgcGFnaW5nLiBEZWNpZGVkL2hpc3RvcmljYWwgcm93cyBuZXZlciByZXZlYWwgYSBzdHVkZW50CiAgIC0tIHdobyBsZWZ0LCB3aXRoZHJldyBzaGFyaW5nIG9yIGlzIG91dCBvZiBzY29wZTsgb3duZXIgYXVkaXQgZGF0YSBpcyBub3QgZXhwb3NlZCBoZXJlLgogICBzZWxlY3QgY29hbGVzY2UoanNvbmJfYWdnKHRvX2pzb25iKHEpIG9yZGVyIGJ5IHEuaWQpLCdbXScpIGludG8gcm93cyBmcm9tICgKICAgIHNlbGVjdCByLmlkLHIudXNlcl9pZCxyLnN0YXRlLHIucmV2aXNpb24scC5kaXNwbGF5X25hbWUgZnJvbSBhc3Nlc3MuZ3JvdXBfam9pbl9yZXF1ZXN0cyByIGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPXIudXNlcl9pZAogICAgd2hlcmUgci5ncm91cF9pZD1nLmlkIGFuZCByLnN0YXRlPSdwZW5kaW5nJyBhbmQgcC5zdGF0dXM9J2FwcHJvdmVkJyBhbmQgcC5yb2xlPSdwYXJ0aWNpcGFudCcKICAgIGFuZCBub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLmFjY291bnRfc3RvcHMgcyB3aGVyZSBzLnVzZXJfaWQ9ci51c2VyX2lkKSBhbmQgYXNzZXNzLnNoYXJpbmdfYWxsb3dlZF92MShyLnVzZXJfaWQpCiAgICBhbmQgbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIGFzc2Vzcy5tZW1iZXJzaGlwcyBtIHdoZXJlIG0uZ3JvdXBfaWQ9Zy5pZCBhbmQgbS51c2VyX2lkPXIudXNlcl9pZCkKICAgIGFuZCAocF9hZnRlciBpcyBudWxsIG9yIHIuaWQ+cF9hZnRlcikgb3JkZXIgYnkgci5pZCBsaW1pdCBwX2xpbWl0KSBxOwogIGVsc2lmIHBfa2luZD0ncHJhY3RpY2UnIHRoZW4KICAgd2l0aCB2aXNpYmxlIGFzIG1hdGVyaWFsaXplZCAoCiAgICBzZWxlY3Qgci5hdHRlbXB0X2lkIGlkLHIudXNlcl9pZCxyLnJlY29yZGVkX2F0LGEuZXhhbV9pZCxhLmNhc2VfaWQscC5kaXNwbGF5X25hbWUsCiAgICAgY2FzZSB3aGVuIGpzb25iX3R5cGVvZihhLnJlc3VsdC0+J3RvdGFsJyk9J251bWJlcicgdGhlbiBhLnJlc3VsdC0+J3RvdGFsJyBlbHNlIG51bGwgZW5kIHNjb3JlCiAgICBmcm9tIGFzc2Vzcy52aXNpYmxlX21lbWJlcnNfdjEoZy5pZCkgbSBqb2luIGFzc2Vzcy5wcmFjdGljZV9yZWNvcmRpbmdzIHIgb24gci51c2VyX2lkPW0udXNlcl9pZAogICAgam9pbiBwdWJsaWMuYXR0ZW1wdHMgYSBvbiBhLmlkPXIuYXR0ZW1wdF9pZCBsZWZ0IGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPXIudXNlcl9pZCB3aGVyZSByLnJlY29yZGVkX2F0Pj1tLnZpc2libGVfZnJvbSBhbmQgci5yZWNvcmRlZF9hdDxsZWFzdCh0cyxnLmVuZHNfYXQpIGFuZCBhLm1vZGU9J3ByYWN0aWNlJyBhbmQgYS5yZWNvcmRfa2luZD0nYXR0ZW1wdCcKICAgKSBzZWxlY3QgKHNlbGVjdCBjb3VudCgqKSBmcm9tIHZpc2libGUpLGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHRvdGFsLHJvd3MKICAgZnJvbSAoc2VsZWN0ICogZnJvbSB2aXNpYmxlIHdoZXJlIHBfYWZ0ZXIgaXMgbnVsbCBvciBpZD5wX2FmdGVyIG9yZGVyIGJ5IGlkIGxpbWl0IHBfbGltaXQpIHE7CiAgZWxzZSByYWlzZSBleGNlcHRpb24gJ2ludmFsaWQgcGFnZSBraW5kJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKIGVuZCBpZjsKIHJldHVybiBqc29uYl9idWlsZF9vYmplY3QoJ2FwcG9pbnRlZCcsZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLnN1cGVydmlzb3JfYXBwb2ludG1lbnRzIGFwIGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPWFwLnVzZXJfaWQgd2hlcmUgYXAudXNlcl9pZD1hdXRoLnVpZCgpIGFuZCBhcC5yZXZva2VkX2F0IGlzIG51bGwgYW5kIHAuc3RhdHVzPSdhcHByb3ZlZCcgYW5kIHAucm9sZT0ncGFydGljaXBhbnQnKSwndmVyc2lvbicsMSwncm93cycscm93cywndG90YWwnLHRvdGFsLCdzZXJ2ZXJOb3cnLHRzLCd2aXNpYmxlVW50aWwnLGcuZW5kc19hdCwKICAnbmV4dCcsY2FzZSB3aGVuIGpzb25iX2FycmF5X2xlbmd0aChyb3dzKT1wX2xpbWl0IHRoZW4gcm93cy0+LTEtPj4naWQnIGVsc2UgbnVsbCBlbmQpOwplbmQgJGZ1bmN0aW9uJAo=','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM '78b3f3aacaa4265bc6390f5690c6472e3d346b9b636f19531ca89e55795cc4d0' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 5 — 7 حرفًا.

```sql
commit;
```

## 6 الجاهزية بعد B — يجب 13/13

الجزء 1 — 7996 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
-- RAD085-P1-B-20261028: only three function bodies change; old M1-M4 readiness remains frozen.
-- RAD-085 P1 B source-derived complete catalogue (including C2 body); READ ONLY.
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
 ('functions',75,'3a616f311a8e90075177ba9e619943d4d235c363d7f013cd3fc72792e58d4eab'),
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

```

## 7 دخان الكتالوج — قراءة فقط

الجزء 1 — 665 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
begin read only;
set local statement_timeout='5s';
select (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) launch_gate_closed,
 not has_table_privilege('authenticated','assess.group_join_codes','SELECT') codes_private,
 not has_function_privilege('anon','assess.join_request_v1(text)','EXECUTE') anon_denied,
 has_function_privilege('authenticated','assess.join_request_v1(text)','EXECUTE') signed_in_rpc_only,
 not exists(select 1 from assess.group_join_codes where digest !~ '^[a-f0-9]{64}$') digests_only,
 (select count(*) from assess.group_join_codes where revoked_at is null and expires_at>now()) codes_to_rotate_in_phone_test;
rollback;

```

## 8 التراجع إلى تعريفات M1–M4 — معاملة واحدة

اجمع الخطوات الخمس بالترتيب في استعلام واحد. لا تنفّذ جزءًا منفردًا ولا commit مبكرًا. الدوال أسطر base64 واحدة؛ لا تضف سطرًا داخلها.

الخطوة 1 — 168 حرفًا.

```sql
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table assess.launch_gate in share mode;
select singleton from assess.scope_lock for update;

```

الخطوة 2 — 4724 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'); IF old.digest NOT IN ('dfea87440ee25de5042158632d0c322ab639c899b46bc5f82d45267e0f6e4a7e','950e3f8dc9f321f901b6376b6b9b10fb76200300d4ba1c42a0340ab7d6426905') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLnN1cGVydmlzb3JfZ3JvdXBfdjEocF9hY3Rpb24gdGV4dCwgcF9ncm91cCB1dWlkIERFRkFVTFQgTlVMTDo6dXVpZCwgcF9yZXZpc2lvbiBpbnRlZ2VyIERFRkFVTFQgTlVMTDo6aW50ZWdlciwgcF9uYW1lIHRleHQgREVGQVVMVCBOVUxMOjp0ZXh0LCBwX2VuZHMgdGltZXN0YW1wIHdpdGggdGltZSB6b25lIERFRkFVTFQgTlVMTDo6dGltZXN0YW1wIHdpdGggdGltZSB6b25lKQogUkVUVVJOUyBqc29uYgogTEFOR1VBR0UgcGxwZ3NxbAogU0VDVVJJVFkgREVGSU5FUgogU0VUIHNlYXJjaF9wYXRoIFRPICcnCkFTICRmdW5jdGlvbiQKZGVjbGFyZSBnIGFzc2Vzcy5ncm91cHM7IHJhdyB0ZXh0OwpiZWdpbgogcGVyZm9ybSBhc3Nlc3Muc2NvcGVfZW50ZXJfdjEodHJ1ZSk7CiBpZiBub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLnN1cGVydmlzb3JfYXBwb2ludG1lbnRzIHdoZXJlIHVzZXJfaWQ9YXV0aC51aWQoKSBhbmQgcmV2b2tlZF9hdCBpcyBudWxsKQogb3Igbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIHB1YmxpYy5wcm9maWxlcyB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCkgYW5kIHJvbGU9J3BhcnRpY2lwYW50JykgdGhlbiByYWlzZSBleGNlcHRpb24gJ3N1cGVydmlzb3Igb25seScgdXNpbmcgZXJyY29kZT0nNDI1MDEnOyBlbmQgaWY7CiBpZiBwX2FjdGlvbj0nY3JlYXRlJyB0aGVuCiAgaWYgcF9uYW1lIGlzIG51bGwgb3IgbGVuZ3RoKGJ0cmltKHBfbmFtZSkpIG5vdCBiZXR3ZWVuIDEgYW5kIDEwMCBvciBwX2VuZHMgaXMgbnVsbCBvciBwX2VuZHM8PWNsb2NrX3RpbWVzdGFtcCgpIHRoZW4KICAgcmFpc2UgZXhjZXB0aW9uICdpbnZhbGlkIGdyb3VwJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKICBpbnNlcnQgaW50byBhc3Nlc3MuZ3JvdXBzKG93bmVyX2lkLG5hbWUsc3VwZXJ2aXNvcl9pZCxzdGFydHNfYXQsZW5kc19hdCkKICAgdmFsdWVzKGF1dGgudWlkKCksYnRyaW0ocF9uYW1lKSxhdXRoLnVpZCgpLGNsb2NrX3RpbWVzdGFtcCgpLHBfZW5kcykgcmV0dXJuaW5nICogaW50byBnOwogZWxzZQogIGc6PWFzc2Vzcy5zdXBlcnZpc2VkX2dyb3VwX3YxKHBfZ3JvdXApOwogIGlmIGcuc2NvcGVfcmV2aXNpb24gaXMgZGlzdGluY3QgZnJvbSBwX3JldmlzaW9uIHRoZW4gcmFpc2UgZXhjZXB0aW9uICdncm91cCBjaGFuZ2VkJyB1c2luZyBlcnJjb2RlPSc0MDAwMSc7IGVuZCBpZjsKICBpZiBwX2FjdGlvbiBub3QgaW4gKCdyb3RhdGUnLCdyZXZva2UtY29kZScsJ2VuZCcpIG9yIHBfYWN0aW9uIGlzIG51bGwgdGhlbiByYWlzZSBleGNlcHRpb24gJ2ludmFsaWQgYWN0aW9uJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKICB1cGRhdGUgYXNzZXNzLmdyb3VwcyBzZXQgc2NvcGVfcmV2aXNpb249c2NvcGVfcmV2aXNpb24rMSxlbmRlZF9hdD1jYXNlIHdoZW4gcF9hY3Rpb249J2VuZCcgdGhlbiBjbG9ja190aW1lc3RhbXAoKSBlbHNlIGVuZGVkX2F0IGVuZCB3aGVyZSBpZD1nLmlkIHJldHVybmluZyAqIGludG8gZzsKIGVuZCBpZjsKIGlmIHBfYWN0aW9uIGluICgnY3JlYXRlJywncm90YXRlJykgdGhlbgogIHJhdzo9cmVwbGFjZShnZW5fcmFuZG9tX3V1aWQoKTo6dGV4dCwnLScsJycpfHxyZXBsYWNlKGdlbl9yYW5kb21fdXVpZCgpOjp0ZXh0LCctJywnJyk7CiAgaW5zZXJ0IGludG8gYXNzZXNzLmdyb3VwX2pvaW5fY29kZXMgdmFsdWVzKGcuaWQsZW5jb2RlKHNoYTI1Nihjb252ZXJ0X3RvKHJhdywnVVRGOCcpKSwnaGV4JyksZy5lbmRzX2F0LG51bGwpCiAgb24gY29uZmxpY3QoZ3JvdXBfaWQpIGRvIHVwZGF0ZSBzZXQgZGlnZXN0PWV4Y2x1ZGVkLmRpZ2VzdCxleHBpcmVzX2F0PWV4Y2x1ZGVkLmV4cGlyZXNfYXQscmV2b2tlZF9hdD1udWxsOwogZWxzZSB1cGRhdGUgYXNzZXNzLmdyb3VwX2pvaW5fY29kZXMgc2V0IHJldm9rZWRfYXQ9Y2xvY2tfdGltZXN0YW1wKCkgd2hlcmUgZ3JvdXBfaWQ9Zy5pZDsgZW5kIGlmOwogaWYgcF9hY3Rpb249J2VuZCcgdGhlbgogIGRlbGV0ZSBmcm9tIGFzc2Vzcy5tZW1iZXJzaGlwcyB3aGVyZSBncm91cF9pZD1nLmlkOwogIHVwZGF0ZSBhc3Nlc3MuZ3JvdXBfam9pbl9yZXF1ZXN0cyBzZXQgc3RhdGU9J2NhbmNlbGxlZCcscmV2aXNpb249cmV2aXNpb24rMSxkZWNpZGVkX2F0PWNsb2NrX3RpbWVzdGFtcCgpLGRlY2lkZWRfYnk9YXV0aC51aWQoKSB3aGVyZSBncm91cF9pZD1nLmlkIGFuZCBzdGF0ZT0ncGVuZGluZyc7CiAgc2VsZWN0ICogaW50byBnIGZyb20gYXNzZXNzLmdyb3VwcyB3aGVyZSBpZD1nLmlkOwogZW5kIGlmOwogcmV0dXJuIGpzb25iX2J1aWxkX29iamVjdCgnaWQnLGcuaWQsJ3JldmlzaW9uJyxnLnNjb3BlX3JldmlzaW9uLCdjb2RlJyxyYXcpOwplbmQgJGZ1bmN0aW9uJAo=','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM '950e3f8dc9f321f901b6376b6b9b10fb76200300d4ba1c42a0340ab7d6426905' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 3 — 4471 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.join_request_v1(text)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.join_request_v1(text)'); IF old.digest NOT IN ('62a1e07c5583567db944775b0ad24e0511159930cffdb2784343479889ef3caa','c78384d61eb9df27f2802b2beff4734ac0c2ba1c5fe7feff3c6485a0b880e04e') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLmpvaW5fcmVxdWVzdF92MShwX2NvZGUgdGV4dCkKIFJFVFVSTlMganNvbmIKIExBTkdVQUdFIHBscGdzcWwKIFNFQ1VSSVRZIERFRklORVIKIFNFVCBzZWFyY2hfcGF0aCBUTyAnJwpBUyAkZnVuY3Rpb24kCmRlY2xhcmUgZ2lkIHV1aWQ7IHIgYXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHM7IHVzZWRfY291bnQgaW50ZWdlcjsgdHMgdGltZXN0YW1wdHo7CmJlZ2luCiBwZXJmb3JtIGFzc2Vzcy5zY29wZV9lbnRlcl92MSh0cnVlKTsgdHM6PWNsb2NrX3RpbWVzdGFtcCgpOwogaWYgbm90IGV4aXN0cyhzZWxlY3QgMSBmcm9tIHB1YmxpYy5wcm9maWxlcyB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCkgYW5kIHJvbGU9J3BhcnRpY2lwYW50Jykgb3Igbm90IGFzc2Vzcy5zaGFyaW5nX2FsbG93ZWRfdjEoYXV0aC51aWQoKSkgdGhlbgogIHJhaXNlIGV4Y2VwdGlvbiAnc2hhcmluZyBjb25zZW50IHJlcXVpcmVkJyB1c2luZyBlcnJjb2RlPSc0MjUwMSc7IGVuZCBpZjsKIGluc2VydCBpbnRvIGFzc2Vzcy5qb2luX3JlcXVlc3RfdGhyb3R0bGVzIHZhbHVlcyhhdXRoLnVpZCgpLHRzLDApIG9uIGNvbmZsaWN0IGRvIG5vdGhpbmc7CiB1cGRhdGUgYXNzZXNzLmpvaW5fcmVxdWVzdF90aHJvdHRsZXMgc2V0IHdpbmRvd19hdD10cyx1c2VkPTAgd2hlcmUgdXNlcl9pZD1hdXRoLnVpZCgpIGFuZCB3aW5kb3dfYXQ8PXRzLWludGVydmFsICcxIGhvdXInOwogc2VsZWN0IHVzZWQgaW50byB1c2VkX2NvdW50IGZyb20gYXNzZXNzLmpvaW5fcmVxdWVzdF90aHJvdHRsZXMgd2hlcmUgdXNlcl9pZD1hdXRoLnVpZCgpOwogaWYgdXNlZF9jb3VudD49MTAgdGhlbiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywndW5hdmFpbGFibGUnKTsgZW5kIGlmOwogdXBkYXRlIGFzc2Vzcy5qb2luX3JlcXVlc3RfdGhyb3R0bGVzIHNldCB1c2VkPXVzZWQrMSB3aGVyZSB1c2VyX2lkPWF1dGgudWlkKCk7CiBpZiBwX2NvZGUgaXMgbnVsbCBvciBsZW5ndGgocF9jb2RlKTw+NjQgdGhlbiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywndW5hdmFpbGFibGUnKTsgZW5kIGlmOwogc2VsZWN0IGcuaWQgaW50byBnaWQgZnJvbSBhc3Nlc3MuZ3JvdXBfam9pbl9jb2RlcyBjIGpvaW4gYXNzZXNzLmdyb3VwcyBnIG9uIGcuaWQ9Yy5ncm91cF9pZAogam9pbiBhc3Nlc3Muc3VwZXJ2aXNvcl9hcHBvaW50bWVudHMgYSBvbiBhLnVzZXJfaWQ9Zy5zdXBlcnZpc29yX2lkIGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPWEudXNlcl9pZAogd2hlcmUgYy5kaWdlc3Q9ZW5jb2RlKHNoYTI1Nihjb252ZXJ0X3RvKHBfY29kZSwnVVRGOCcpKSwnaGV4JykgYW5kIGMucmV2b2tlZF9hdCBpcyBudWxsIGFuZCBjLmV4cGlyZXNfYXQ+dHMKIGFuZCBnLmVuZGVkX2F0IGlzIG51bGwgYW5kIGcuZW5kc19hdD50cyBhbmQgYS5yZXZva2VkX2F0IGlzIG51bGwgYW5kIHAuc3RhdHVzPSdhcHByb3ZlZCcKIGFuZCBub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLmFjY291bnRfc3RvcHMgd2hlcmUgdXNlcl9pZD1hLnVzZXJfaWQpOwogaWYgZ2lkIGlzIG51bGwgdGhlbiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywndW5hdmFpbGFibGUnKTsgZW5kIGlmOwogaWYgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLm1lbWJlcnNoaXBzIHdoZXJlIGdyb3VwX2lkPWdpZCBhbmQgdXNlcl9pZD1hdXRoLnVpZCgpKSB0aGVuIHJldHVybiBqc29uYl9idWlsZF9vYmplY3QoJ291dGNvbWUnLCdtZW1iZXInKTsgZW5kIGlmOwogaW5zZXJ0IGludG8gYXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHMoZ3JvdXBfaWQsdXNlcl9pZCxzdGF0ZSxyZXF1ZXN0ZWRfYXQpIHZhbHVlcyhnaWQsYXV0aC51aWQoKSwncGVuZGluZycsdHMpCiBvbiBjb25mbGljdChncm91cF9pZCx1c2VyX2lkKSBkbyB1cGRhdGUgc2V0IHN0YXRlPSdwZW5kaW5nJyxyZXF1ZXN0ZWRfYXQ9dHMscmV2aXNpb249YXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHMucmV2aXNpb24rMSxkZWNpZGVkX2F0PW51bGwsZGVjaWRlZF9ieT1udWxsCiB3aGVyZSBhc3Nlc3MuZ3JvdXBfam9pbl9yZXF1ZXN0cy5zdGF0ZTw+J3BlbmRpbmcnOwogc2VsZWN0ICogaW50byByIGZyb20gYXNzZXNzLmdyb3VwX2pvaW5fcmVxdWVzdHMgd2hlcmUgZ3JvdXBfaWQ9Z2lkIGFuZCB1c2VyX2lkPWF1dGgudWlkKCk7CiByZXR1cm4ganNvbmJfYnVpbGRfb2JqZWN0KCdvdXRjb21lJywncGVuZGluZycsJ2lkJyxyLmlkLCdyZXZpc2lvbicsci5yZXZpc2lvbik7CmVuZCAkZnVuY3Rpb24kCg==','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.join_request_v1(text)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM 'c78384d61eb9df27f2802b2beff4734ac0c2ba1c5fe7feff3c6485a0b880e04e' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 4 — 7199 حرفًا.

```sql
DO $phone$ DECLARE old record; fresh record; BEGIN PERFORM 1 FROM assess.launch_gate FOR SHARE; IF NOT (SELECT count(*)=1 AND bool_and(NOT enabled) FROM assess.launch_gate) THEN RAISE EXCEPTION 'launch_gate must be closed'; END IF; IF to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)') IS NULL THEN RAISE EXCEPTION 'replacement missing'; END IF; SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO old FROM pg_proc WHERE oid=to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)'); IF old.digest NOT IN ('78b3f3aacaa4265bc6390f5690c6472e3d346b9b636f19531ca89e55795cc4d0','69a6391832e46dbffa4b065673bfe3f9d182f31ce5022fa580e0af8885a96b56') THEN RAISE EXCEPTION 'source drift'; END IF; EXECUTE convert_from(decode('Q1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gYXNzZXNzLnNjb3BlX3BhZ2VfdjEocF9raW5kIHRleHQsIHBfZ3JvdXAgdXVpZCBERUZBVUxUIE5VTEw6OnV1aWQsIHBfYWZ0ZXIgdXVpZCBERUZBVUxUIE5VTEw6OnV1aWQsIHBfbGltaXQgaW50ZWdlciBERUZBVUxUIDIwKQogUkVUVVJOUyBqc29uYgogTEFOR1VBR0UgcGxwZ3NxbAogU0VDVVJJVFkgREVGSU5FUgogU0VUIHNlYXJjaF9wYXRoIFRPICcnCkFTICRmdW5jdGlvbiQKZGVjbGFyZSByb3dzIGpzb25iOyB0b3RhbCBiaWdpbnQ7IHRzIHRpbWVzdGFtcHR6OyBnIGFzc2Vzcy5ncm91cHM7CmJlZ2luCiBwZXJmb3JtIGFzc2Vzcy5zY29wZV9lbnRlcl92MShmYWxzZSk7IHRzOj1jbG9ja190aW1lc3RhbXAoKTsKIGlmIHBfbGltaXQgaXMgbnVsbCBvciBwX2xpbWl0IG5vdCBiZXR3ZWVuIDEgYW5kIDEwMCB0aGVuIHJhaXNlIGV4Y2VwdGlvbiAnaW52YWxpZCBwYWdlJyB1c2luZyBlcnJjb2RlPScyMjAyMyc7IGVuZCBpZjsKIGlmIHBfa2luZD0nZ3JvdXBzJyB0aGVuCiAgc2VsZWN0IGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHJvd3MgZnJvbSAoCiAgIHNlbGVjdCBncnAuaWQsZ3JwLm5hbWUsZ3JwLnN1cGVydmlzb3JfaWQsZ3JwLnN0YXJ0c19hdCxncnAuZW5kc19hdCxncnAuc2NvcGVfcmV2aXNpb24gcmV2aXNpb24sCiAgICBncmVhdGVzdChncnAuc3RhcnRzX2F0LGEuYXBwb2ludGVkX2F0KSBzdXBlcnZpc2VkX2Zyb20KICAgZnJvbSBhc3Nlc3MuZ3JvdXBzIGdycCBqb2luIGFzc2Vzcy5zdXBlcnZpc29yX2FwcG9pbnRtZW50cyBhIG9uIGEudXNlcl9pZD1ncnAuc3VwZXJ2aXNvcl9pZAogICB3aGVyZSBncnAuc3VwZXJ2aXNvcl9pZD1hdXRoLnVpZCgpIGFuZCBhLnJldm9rZWRfYXQgaXMgbnVsbCBhbmQgZ3JwLmVuZGVkX2F0IGlzIG51bGwgYW5kIGdycC5lbmRzX2F0PnRzCiAgICBhbmQgKHBfYWZ0ZXIgaXMgbnVsbCBvciBncnAuaWQ+cF9hZnRlcikgb3JkZXIgYnkgZ3JwLmlkIGxpbWl0IHBfbGltaXQpIHE7CiBlbHNpZiBwX2tpbmQ9J215LXJlcXVlc3RzJyB0aGVuCiAgc2VsZWN0IGNvYWxlc2NlKGpzb25iX2FnZyh0b19qc29uYihxKSBvcmRlciBieSBxLmlkKSwnW10nKSBpbnRvIHJvd3MgZnJvbSAoCiAgIHNlbGVjdCBpZCxncm91cF9pZCxzdGF0ZSxyZXZpc2lvbiBmcm9tIGFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzIHdoZXJlIHVzZXJfaWQ9YXV0aC51aWQoKQogICBhbmQgKHBfYWZ0ZXIgaXMgbnVsbCBvciBpZD5wX2FmdGVyKSBvcmRlciBieSBpZCBsaW1pdCBwX2xpbWl0KSBxOwogZWxzaWYgcF9raW5kPSdhcHBvaW50bWVudHMnIHRoZW4KICBpZiBub3QgcHVibGljLmlzX293bmVyKCkgdGhlbiByYWlzZSBleGNlcHRpb24gJ293bmVyIG9ubHknIHVzaW5nIGVycmNvZGU9JzQyNTAxJzsgZW5kIGlmOwogIHNlbGVjdCBjb2FsZXNjZShqc29uYl9hZ2codG9fanNvbmIocSkgb3JkZXIgYnkgcS5pZCksJ1tdJykgaW50byByb3dzIGZyb20gKAogICBzZWxlY3QgYS51c2VyX2lkIGlkLHAuZGlzcGxheV9uYW1lLGEucmV2b2tlZF9hdCxhLnJldmlzaW9uIGZyb20gYXNzZXNzLnN1cGVydmlzb3JfYXBwb2ludG1lbnRzIGEgam9pbiBwdWJsaWMucHJvZmlsZXMgcCBvbiBwLnVzZXJfaWQ9YS51c2VyX2lkCiAgIHdoZXJlIHBfYWZ0ZXIgaXMgbnVsbCBvciBhLnVzZXJfaWQ+cF9hZnRlciBvcmRlciBieSBhLnVzZXJfaWQgbGltaXQgcF9saW1pdCkgcTsKIGVsc2UKICBnOj1hc3Nlc3Muc3VwZXJ2aXNlZF9ncm91cF92MShwX2dyb3VwKTsKICBpZiBwX2tpbmQ9J21lbWJlcnMnIHRoZW4KICAgc2VsZWN0IGNvdW50KCopIGludG8gdG90YWwgZnJvbSBhc3Nlc3MudmlzaWJsZV9tZW1iZXJzX3YxKGcuaWQpOwogICBzZWxlY3QgY29hbGVzY2UoanNvbmJfYWdnKHRvX2pzb25iKHEpIG9yZGVyIGJ5IHEuaWQpLCdbXScpIGludG8gcm93cyBmcm9tICgKICAgIHNlbGVjdCB2LnVzZXJfaWQgaWQscC5kaXNwbGF5X25hbWUsdi5wZXJpb2RfaWQsdi52aXNpYmxlX2Zyb20gZnJvbSBhc3Nlc3MudmlzaWJsZV9tZW1iZXJzX3YxKGcuaWQpIHYKICAgIGpvaW4gcHVibGljLnByb2ZpbGVzIHAgb24gcC51c2VyX2lkPXYudXNlcl9pZCB3aGVyZSBwX2FmdGVyIGlzIG51bGwgb3Igdi51c2VyX2lkPnBfYWZ0ZXIgb3JkZXIgYnkgdi51c2VyX2lkIGxpbWl0IHBfbGltaXQpIHE7CiAgZWxzaWYgcF9raW5kPSdyZXF1ZXN0cycgdGhlbgogICAtLSBSQUQwODUtU0VDLUZJWEVTLTIwMjYxMDI3IFNFQy0wMjogb25seSBwZW5kaW5nIHJlcXVlc3RzIG9mIGFjY291bnRzIHN0aWxsIGVsaWdpYmxlCiAgIC0tIHRvIGpvaW4sIGZpbHRlcmVkIGJlZm9yZSBwYWdpbmcuIERlY2lkZWQvaGlzdG9yaWNhbCByb3dzIG5ldmVyIHJldmVhbCBhIHN0dWRlbnQKICAgLS0gd2hvIGxlZnQsIHdpdGhkcmV3IHNoYXJpbmcgb3IgaXMgb3V0IG9mIHNjb3BlOyBvd25lciBhdWRpdCBkYXRhIGlzIG5vdCBleHBvc2VkIGhlcmUuCiAgIHNlbGVjdCBjb2FsZXNjZShqc29uYl9hZ2codG9fanNvbmIocSkgb3JkZXIgYnkgcS5pZCksJ1tdJykgaW50byByb3dzIGZyb20gKAogICAgc2VsZWN0IHIuaWQsci51c2VyX2lkLHIuc3RhdGUsci5yZXZpc2lvbiBmcm9tIGFzc2Vzcy5ncm91cF9qb2luX3JlcXVlc3RzIHIgam9pbiBwdWJsaWMucHJvZmlsZXMgcCBvbiBwLnVzZXJfaWQ9ci51c2VyX2lkCiAgICB3aGVyZSByLmdyb3VwX2lkPWcuaWQgYW5kIHIuc3RhdGU9J3BlbmRpbmcnIGFuZCBwLnN0YXR1cz0nYXBwcm92ZWQnIGFuZCBwLnJvbGU9J3BhcnRpY2lwYW50JwogICAgYW5kIG5vdCBleGlzdHMoc2VsZWN0IDEgZnJvbSBhc3Nlc3MuYWNjb3VudF9zdG9wcyBzIHdoZXJlIHMudXNlcl9pZD1yLnVzZXJfaWQpIGFuZCBhc3Nlc3Muc2hhcmluZ19hbGxvd2VkX3YxKHIudXNlcl9pZCkKICAgIGFuZCBub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gYXNzZXNzLm1lbWJlcnNoaXBzIG0gd2hlcmUgbS5ncm91cF9pZD1nLmlkIGFuZCBtLnVzZXJfaWQ9ci51c2VyX2lkKQogICAgYW5kIChwX2FmdGVyIGlzIG51bGwgb3Igci5pZD5wX2FmdGVyKSBvcmRlciBieSByLmlkIGxpbWl0IHBfbGltaXQpIHE7CiAgZWxzaWYgcF9raW5kPSdwcmFjdGljZScgdGhlbgogICB3aXRoIHZpc2libGUgYXMgbWF0ZXJpYWxpemVkICgKICAgIHNlbGVjdCByLmF0dGVtcHRfaWQgaWQsci51c2VyX2lkLHIucmVjb3JkZWRfYXQsYS5leGFtX2lkLGEuY2FzZV9pZCwKICAgICBjYXNlIHdoZW4ganNvbmJfdHlwZW9mKGEucmVzdWx0LT4ndG90YWwnKT0nbnVtYmVyJyB0aGVuIGEucmVzdWx0LT4ndG90YWwnIGVsc2UgbnVsbCBlbmQgc2NvcmUKICAgIGZyb20gYXNzZXNzLnZpc2libGVfbWVtYmVyc192MShnLmlkKSBtIGpvaW4gYXNzZXNzLnByYWN0aWNlX3JlY29yZGluZ3MgciBvbiByLnVzZXJfaWQ9bS51c2VyX2lkCiAgICBqb2luIHB1YmxpYy5hdHRlbXB0cyBhIG9uIGEuaWQ9ci5hdHRlbXB0X2lkIHdoZXJlIHIucmVjb3JkZWRfYXQ+PW0udmlzaWJsZV9mcm9tIGFuZCByLnJlY29yZGVkX2F0PGxlYXN0KHRzLGcuZW5kc19hdCkgYW5kIGEubW9kZT0ncHJhY3RpY2UnIGFuZCBhLnJlY29yZF9raW5kPSdhdHRlbXB0JwogICApIHNlbGVjdCAoc2VsZWN0IGNvdW50KCopIGZyb20gdmlzaWJsZSksY29hbGVzY2UoanNvbmJfYWdnKHRvX2pzb25iKHEpIG9yZGVyIGJ5IHEuaWQpLCdbXScpIGludG8gdG90YWwscm93cwogICBmcm9tIChzZWxlY3QgKiBmcm9tIHZpc2libGUgd2hlcmUgcF9hZnRlciBpcyBudWxsIG9yIGlkPnBfYWZ0ZXIgb3JkZXIgYnkgaWQgbGltaXQgcF9saW1pdCkgcTsKICBlbHNlIHJhaXNlIGV4Y2VwdGlvbiAnaW52YWxpZCBwYWdlIGtpbmQnIHVzaW5nIGVycmNvZGU9JzIyMDIzJzsgZW5kIGlmOwogZW5kIGlmOwogcmV0dXJuIGpzb25iX2J1aWxkX29iamVjdCgnYXBwb2ludGVkJyxleGlzdHMoc2VsZWN0IDEgZnJvbSBhc3Nlc3Muc3VwZXJ2aXNvcl9hcHBvaW50bWVudHMgYXAgam9pbiBwdWJsaWMucHJvZmlsZXMgcCBvbiBwLnVzZXJfaWQ9YXAudXNlcl9pZCB3aGVyZSBhcC51c2VyX2lkPWF1dGgudWlkKCkgYW5kIGFwLnJldm9rZWRfYXQgaXMgbnVsbCBhbmQgcC5zdGF0dXM9J2FwcHJvdmVkJyBhbmQgcC5yb2xlPSdwYXJ0aWNpcGFudCcpLCd2ZXJzaW9uJywxLCdyb3dzJyxyb3dzLCd0b3RhbCcsdG90YWwsJ3NlcnZlck5vdycsdHMsJ3Zpc2libGVVbnRpbCcsZy5lbmRzX2F0LAogICduZXh0JyxjYXNlIHdoZW4ganNvbmJfYXJyYXlfbGVuZ3RoKHJvd3MpPXBfbGltaXQgdGhlbiByb3dzLT4tMS0+PidpZCcgZWxzZSBudWxsIGVuZCk7CmVuZCAkZnVuY3Rpb24kCg==','base64'),'UTF8'); SELECT oid,proowner,proacl,proconfig,encode(sha256(convert_to(replace(pg_get_functiondef(oid),chr(13),''),'UTF8')),'hex') digest INTO fresh FROM pg_proc WHERE oid=to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)'); IF fresh.oid IS DISTINCT FROM old.oid OR fresh.proowner IS DISTINCT FROM old.proowner OR fresh.proacl IS DISTINCT FROM old.proacl OR fresh.proconfig IS DISTINCT FROM old.proconfig OR fresh.digest IS DISTINCT FROM '69a6391832e46dbffa4b065673bfe3f9d182f31ce5022fa580e0af8885a96b56' THEN RAISE EXCEPTION 'replacement metadata or bytes changed'; END IF; END $phone$;
```

الخطوة 5 — 7 حرفًا.

```sql
commit;
```

## 9 الجاهزية بعد التراجع — يجب 13/13

الجزء 1 — 7898 حرفًا؛ اجمع الأجزاء كلها في المحرر ثم نفّذ مرة واحدة.

```sql
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

```
