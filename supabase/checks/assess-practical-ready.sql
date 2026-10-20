-- Read-only E catalogue. Run on a provider only under a separate, target-specific authorization.
begin read only;
select
 current_setting('transaction_read_only')='on' as read_only,
 exists(select 1 from pg_class where oid=to_regclass('assess.practical_presentations') and relrowsecurity) as presentation_rls,
 not exists(select 1 from information_schema.table_privileges where table_schema='assess' and table_name='practical_presentations' and grantee in ('PUBLIC','anon','authenticated','assess_worker')) as no_direct_grants,
 coalesce(has_function_privilege('authenticated',to_regprocedure('assess.assigned_practical_page_v1(uuid,integer)'),'execute'),false)
 and coalesce(has_function_privilege('authenticated',to_regprocedure('assess.read_practical_session_v1(uuid)'),'execute'),false) as participant_read_grants,
 coalesce(has_function_privilege('assess_worker',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),false)
 and not coalesce(has_function_privilege('authenticated',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),true)
 and not coalesce(has_function_privilege('anon',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),true) as private_installer,
 not coalesce((select enabled from assess.launch_gate where singleton),true) as launch_gate_closed,
 false as runtime_or_launch_verified;
rollback;
