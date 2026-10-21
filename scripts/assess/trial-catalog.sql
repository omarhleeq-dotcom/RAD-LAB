-- Catalog metadata only. No domain records or provider credentials.
select jsonb_build_object(
 'functions',coalesce((select jsonb_agg(jsonb_build_object(
  'id',n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')',
  'body',md5(p.prosrc),'definition',md5(pg_catalog.pg_get_functiondef(p.oid)),'return',pg_catalog.pg_get_function_result(p.oid),
  'owner',pg_catalog.pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,
  'language',l.lanname,'volatility',p.provolatile,'kind',p.prokind,
  'acl',coalesce((select jsonb_agg(jsonb_build_array(case when a.grantee=0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantee::regrole::text,a.privilege_type) from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),'[]'::jsonb)
 ) order by n.nspname,p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid))
 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace join pg_catalog.pg_language l on l.oid=p.prolang
 where n.nspname in ('assess','public') and p.prokind='f'),'[]'::jsonb),
 'tables',coalesce((select jsonb_agg(jsonb_build_object('id',n.nspname||'.'||c.relname,
  'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity,
  'acl',coalesce((select jsonb_agg(jsonb_build_array(case when a.grantee=0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantee::regrole::text,a.privilege_type) from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a),'[]'::jsonb),
  'effectiveAcl',(select jsonb_agg(jsonb_build_array(r,pg_catalog.has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) order by r) from unnest(array['anon','authenticated','assess_worker']) r),
  'columns',(select jsonb_agg(jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,coalesce(a.attacl::text,'')) order by a.attnum) from pg_catalog.pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
  'triggers',coalesce((select jsonb_agg(jsonb_build_array(t.tgname,t.tgenabled,pg_catalog.pg_get_triggerdef(t.oid),pg_catalog.pg_get_userbyid(p.proowner)) order by t.tgname) from pg_catalog.pg_trigger t join pg_catalog.pg_proc p on p.oid=t.tgfoid where t.tgrelid=c.oid and not t.tgisinternal),'[]'::jsonb),
  'constraints',coalesce((select jsonb_agg(pg_catalog.pg_get_constraintdef(k.oid) order by k.conname) from pg_catalog.pg_constraint k where k.conrelid=c.oid),'[]'::jsonb),
  'policies',coalesce((select jsonb_agg(jsonb_build_array(pol.polname,pol.polcmd,pol.polpermissive,(select jsonb_agg(case when r=0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(r) end order by case when r=0 then 'PUBLIC' else pg_catalog.pg_get_userbyid(r) end) from unnest(pol.polroles) r),pg_catalog.pg_get_expr(pol.polqual,pol.polrelid),pg_catalog.pg_get_expr(pol.polwithcheck,pol.polrelid)) order by pol.polname) from pg_catalog.pg_policy pol where pol.polrelid=c.oid),'[]'::jsonb)
 ) order by c.relname) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind='r'),'[]'::jsonb),
 'schemaAcl',(select nspacl::text from pg_catalog.pg_namespace where nspname='assess')
) as catalog;
