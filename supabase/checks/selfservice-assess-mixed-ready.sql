-- RAD105 successor; set radlab.expected_gate to 'closed' before activation or 'open' in normal operation.
-- Missing/invalid/mismatched expectation fails closed. No state is changed.
-- Read-only readiness catalogue. Execute only on an independently authorized test environment.
-- Does not open launch_gate, run a candidate/attempt or prove runtime/worker readiness.
begin read only;
select
  to_regclass('assess.content_submissions') is not null as content_table_present,
  (select relrowsecurity from pg_class where oid=to_regclass('assess.content_submissions')) as content_rls,
  not has_table_privilege('authenticated','assess.content_submissions','select,insert,update,delete') as no_direct_content,
  has_function_privilege('authenticated','assess.read_mixed_session_v1(uuid)','execute') as participant_read_rpc,
  has_function_privilege('authenticated','assess.content_submit_v1(jsonb)','execute') as owner_checked_submission_rpc,
  not has_function_privilege('authenticated','assess.content_read_v1(uuid)','execute') as private_document_denied,
  not has_function_privilege('authenticated','assess.content_install_v1(uuid,jsonb)','execute') as private_install_denied,
  not has_function_privilege('anon','assess.read_mixed_session_v1(uuid)','execute') as anonymous_denied,
  coalesce((select count(*)=1 and bool_and(singleton and enabled=case current_setting('radlab.expected_gate',true) when 'open' then true when 'closed' then false else null end) from assess.launch_gate),false) as gate_state_expected;
rollback;
