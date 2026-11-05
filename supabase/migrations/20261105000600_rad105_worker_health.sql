-- Approved S4 additive five-operation worker successor. No role switch or LOGIN.
begin;
set local search_path='';
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$begin
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or to_regprocedure('assess.health_v2()') is null or to_regclass('assess.restore_epoch') is null
 then raise exception 'S4 requires closed gate and S3 schema' using errcode='55000'; end if;
end$$;
create function assess.worker_health_v2() returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare old jsonb;
begin
 old:=assess.health_v1();
 return jsonb_build_object('v1',old-'witness','v2',assess.health_v2(),'witness',old->'witness');
end$$;
revoke all on function assess.worker_health_v2() from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
commit;
