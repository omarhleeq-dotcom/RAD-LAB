-- Read-only catalogue evidence only. Never proves runtime, scheduler, recovery or launch acceptance.
begin transaction read only;
select
  true as read_only,
  coalesce((select relrowsecurity from pg_class where oid=to_regclass('assess.consents')),false) as consent_rls,
  not has_table_privilege('authenticated','assess.consents','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('anon','assess.consents','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('assess_worker','assess.consents','SELECT,INSERT,UPDATE,DELETE') as no_direct_consent_grants,
  has_function_privilege('authenticated','assess.history_page_v1(uuid,integer)','EXECUTE')
    and has_function_privilege('authenticated','assess.consent_v1(text)','EXECUTE')
    and not has_function_privilege('anon','assess.history_page_v1(uuid,integer)','EXECUTE')
    and not has_function_privilege('anon','assess.consent_v1(text)','EXECUTE') as participant_rpc_grants,
  exists(select 1 from pg_trigger where tgrelid='assess.sessions'::regclass and tgname='assess_session_consent' and tgenabled='O') as start_consent_guard,
  not has_function_privilege('authenticated','assess.require_consent_v1()','EXECUTE') as private_trigger,
  exists(select 1 from assess.launch_gate where singleton and not enabled) as launch_gate_closed,
  false as runtime_or_launch_verified;
rollback;
