-- Read-only whole M01-M08 package readiness. NOT required by frontend until P10.
-- Expected digests are derived from a clean local current-schema + M01-M08 apply.
-- CR normalization is representation-only; no whitespace/body normalization.
-- ACLs use acldefault for NULL, with distinct grantee/privilege/grantable tuples
-- sorted by role name (never OID). Text sort keys use COLLATE "C": digests never
-- depend on the database default collation. Grantor identity/order is not an effective privilege.
-- Run with the trusted DB-day operator, never as a browser/API role.
with functions as (
 select p.oid::regprocedure::text signature,replace(p.prosrc,E'\r','') body,
  l.lanname,p.prokind,p.prosecdef,p.provolatile,p.proisstrict,p.proparallel,p.proleakproof,
  format_type(p.prorettype,null) returns_type,p.proretset,p.proargnames,p.proargmodes,
  pg_get_expr(p.proargdefaults,0) argument_defaults,p.proconfig,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x) grants) acl,r.rolname owner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 join pg_language l on l.oid=p.prolang join pg_roles r on r.oid=p.proowner
 where n.nspname='assess' or (n.nspname='public' and p.proname in ('rad062_valid_full_name','handle_new_user','owner_account_deletion_v1'))
), relations as (
 select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x) grants) acl,r.rolname owner,
  (select jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(a.attacl,acldefault('c',c.relowner))) x) grants),a.attidentity,a.attgenerated,
    pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
   from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
   where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) columns,
  (select jsonb_agg(jsonb_build_array(k.conname,replace(pg_get_constraintdef(k.oid),E'\r','')) order by k.conname)
   from pg_constraint k where k.conrelid=c.oid) constraints,
  (select jsonb_agg(jsonb_build_array(replace(pg_get_triggerdef(t.oid),E'\r',''),t.tgenabled) order by t.tgname)
   from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal) triggers,
  (select jsonb_agg(jsonb_build_array(pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text collate "C")
   from pg_index i where i.indrelid=c.oid) indexes,
  (select jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,
    (select jsonb_agg(case when role_oid=0 then 'public' else pg_get_userbyid(role_oid) end order by role_oid) from unnest(p.polroles) role_oid),
    pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname)
   from pg_policy p where p.polrelid=c.oid) policies
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p')
), fingerprints as (
 select 'functions' check_name,md5((select jsonb_agg(to_jsonb(f) order by signature collate "C")::text from functions f)) actual,'6295c0082b51063db3dc2eacf1b2ce21' expected
 union all select 'relations',md5((select jsonb_agg(to_jsonb(r) order by nspname,relname)::text from relations r)),'3826484082a441389c82d4631c99af87'
)
select check_name,actual=expected ok from fingerprints
union all select 'identity_inventory',(select inventory from assess.erasure_fk_contract where singleton)=assess.d3_fk_inventory_v1()
union all select 'closed_gate',(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
union all select 'worker_nologin',exists(select 1 from pg_roles where rolname='assess_worker' and not rolcanlogin)
order by check_name;
