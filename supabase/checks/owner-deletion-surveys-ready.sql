-- RAD-069 C2. READ ONLY catalogue checks; no participant rows or writes.
begin read only;
with functions(signature) as (values
 ('public.owner_account_deletion_v1(text,uuid,uuid,integer)'),
 ('public.owner_account_directory_v1(text,text,jsonb,timestamp with time zone,integer)'),
 ('public.owner_surveys_v1(text,jsonb,uuid,integer)'),
 ('public.participant_survey_v1(jsonb)')
), tables(name) as (values ('c2_account_deletions'),('c2_survey_settings'),('c2_survey_versions'),('c2_survey_rounds'),('c2_survey_responses')),
indexes(name) as (values ('c2_account_deletions_pkey'),('c2_survey_settings_pkey'),('c2_survey_versions_pkey'),('c2_survey_rounds_pkey'),('c2_survey_responses_pkey'),('c2_survey_versions_type_version_key'),('c2_survey_responses_user_round_key'),('c2_account_deletions_expiry_idx'),('c2_survey_responses_pending_idx'),('c2_survey_responses_user_offered_idx'))
select 'owner-deletion-surveys-ready/1' contract,
 not exists(select 1 from functions where to_regprocedure(signature) is null) as functions_present,
 not exists(select 1 from functions f left join pg_proc p on p.oid=to_regprocedure(f.signature)
  where p.oid is null or not p.prosecdef or p.proconfig is distinct from array['search_path=""']::text[]) as function_contract,
 not exists(select 1 from functions where not coalesce(has_function_privilege('authenticated',to_regprocedure(signature),'execute'),false)
  or coalesce(has_function_privilege('anon',to_regprocedure(signature),'execute'),true)
  or exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid=to_regprocedure(signature) and a.grantee=0 and a.privilege_type='EXECUTE')) as execute_grants,
 not exists(select 1 from tables t left join pg_class c on c.oid=to_regclass('public.'||t.name)
  where c.oid is null or not c.relrowsecurity) as rls_enabled,
 not exists(select 1 from information_schema.table_privileges g join tables t on t.name=g.table_name
  where g.table_schema='public' and g.grantee in ('anon','authenticated','PUBLIC')) as direct_access_denied,
 not exists(select 1 from indexes x left join pg_index i on i.indexrelid=to_regclass('public.'||x.name) where i.indexrelid is null or not i.indisvalid) as indexes_ready,
 (select count(*)=2 and bool_and(confdeltype='c' and confrelid='public.profiles'::regclass)
  from pg_constraint where connamespace='public'::regnamespace and conname in ('c2_account_deletions_user_id_fkey','c2_survey_responses_user_id_fkey')) as participant_cascades,
 exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users' and column_name='banned_until' and data_type='timestamp with time zone') as auth_ban_supported,
 to_regclass('auth.sessions') is not null and to_regclass('auth.refresh_tokens') is not null as session_revocation_supported;
rollback;
