-- RAD105 successor; set radlab.expected_gate to 'closed' before activation or 'open' in normal operation.
-- Missing/invalid/mismatched expectation fails closed. No state is changed.
-- Read-only catalogue witness. Not source attestation, runtime, restore or live acceptance.
begin transaction read only;
select 'assess-retention-ready/1' as contract,
 exists(select 1 from information_schema.columns where table_schema='assess' and table_name='assignments' and column_name='closed_at') as terminal_column,
 to_regprocedure('assess.consent_v2(text)') is not null as consent_v2,
 to_regprocedure('assess.close_assignment_v1(uuid)') is not null as close_rpc,
 to_regprocedure('assess.disable_account_v1(uuid)') is not null as disable_rpc,
 not has_table_privilege('authenticated','assess.account_stops','SELECT') as stops_private,
 not has_function_privilege('assess_worker','assess.consent_v2(text)','EXECUTE') as worker_cannot_consent,
 coalesce((select count(*)=1 and bool_and(singleton and enabled=case current_setting('radlab.expected_gate',true) when 'open' then true when 'closed' then false else null end) from assess.launch_gate),false) as gate_state_expected,
 false as restore_verified,false as runtime_or_launch_verified;
rollback;
