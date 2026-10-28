-- B8 manual only: engineering trial is over. Run BEFORE RAD-085 migration 1.
-- Save the first result (trial_scope configuration) with the backup. No trial data rows are deleted.
-- Any error: the whole transaction must roll back; STOP. Do not continue to migration 1.
begin isolation level read committed;
set local lock_timeout='5s';
set local search_path='';
-- Lock all pre-existing application tables in deterministic order. This also serializes gate/session
-- writers and prevents count changes or trigger DDL races until COMMIT. No persistent helper objects.
do $$declare r record;begin
 for r in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('assess','public') and c.relkind in ('r','p') order by n.nspname,c.relname loop
  execute format('lock table %I.%I in access exclusive mode',r.nspname,r.relname);
 end loop;
end $$;
-- FIRST result: owner saves this row before discarding the configuration table.
select singleton, id, active, owner_id, student_id, outsider_id, assessment_id, version_labels
from assess.trial_scope order by singleton;

do $$declare t text; r record; before_counts jsonb:='{}'; after_counts jsonb:='{}'; n bigint;begin
 if (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) is not true then
  raise exception 'B8 requires closed launch gate' using errcode='55000';
 end if;
 if exists(select 1 from assess.sessions where state in ('active','grading','grading-failed')) then
  raise exception 'B8 requires settled sessions' using errcode='55000';
 end if;
 for r in select ns.nspname,c.relname from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
  where ns.nspname in ('assess','public') and c.relkind in ('r','p')
   and not (ns.nspname='assess' and c.relname='trial_scope') order by 1,2 loop
  execute format('select count(*) from %I.%I',r.nspname,r.relname) into n;
  before_counts:=before_counts||jsonb_build_object(r.nspname||'.'||r.relname,n);
 end loop;
 -- Exactly the triggers installed by scripts/assess/sql/trial-isolation.sql; no wildcard drops.
 foreach t in array array['versions','assignments','targets','sessions','reservations','session_details',
  'receipts','results','content_submissions','publications','account_stops','consents','groups','memberships'] loop
  execute format('drop trigger assess_trial_write_guard on assess.%I',t);
  execute format('drop trigger assess_trial_no_truncate on assess.%I',t);
 end loop;
 drop trigger assess_trial_config_guard on assess.trial_scope;
 drop trigger assess_trial_no_truncate on assess.trial_scope;
 -- Dependants first. RESTRICT is the default; any unreviewed dependency aborts everything.
 drop function assess.trial_maintain_v1(uuid,integer), assess.trial_claim_v1(uuid),
  assess.trial_health_v1(uuid), assess.trial_finish_v1(uuid,uuid,uuid,text,text), assess.trial_fail_v1(uuid,uuid,uuid);
 drop function assess.trial_enter_v1(uuid), assess.trial_config_guard_v1(),
  assess.trial_write_guard_v1(), assess.trial_truncate_guard_v1();
 drop function assess.trial_assert_v1(assess.trial_scope), assess.trial_row_allowed_v1(text,jsonb,assess.trial_scope,boolean);
 drop function assess.trial_tables_lock_v1();
 drop table assess.trial_scope;
 if exists(select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='assess' and left(p.proname,6)='trial_')
  or exists(select 1 from pg_trigger tg join pg_class c on c.oid=tg.tgrelid join pg_namespace ns on ns.oid=c.relnamespace
   where ns.nspname='assess' and not tg.tgisinternal and left(tg.tgname,13)='assess_trial_') then
  raise exception 'B8 unexpected trial object remains' using errcode='55000';
 end if;
 for t in select jsonb_object_keys(before_counts) loop
  execute format('select count(*) from %s',t::regclass) into n;
  after_counts:=after_counts||jsonb_build_object(t,n);
 end loop;
 if before_counts is distinct from after_counts then
  raise exception 'B8 application row count changed' using errcode='55000';
 end if;
 perform set_config('rad085.trial_remove_counts_before',before_counts::text,true);
 perform set_config('rad085.trial_remove_counts_after',after_counts::text,true);
end $$;
-- Last result: read-only verification under the same locks; COMMIT must also succeed.
select
 (to_regclass('assess.trial_scope') is null
  and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='assess' and left(p.proname,6)='trial_')
  and not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='assess' and not t.tgisinternal and left(t.tgname,13)='assess_trial_')) as trial_objects_absent_ok,
 (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) as launch_gate_closed_ok,
 current_setting('rad085.trial_remove_counts_before')::jsonb as row_counts_before,
 current_setting('rad085.trial_remove_counts_after')::jsonb as row_counts_after,
 current_setting('rad085.trial_remove_counts_before')::jsonb = current_setting('rad085.trial_remove_counts_after')::jsonb as row_counts_unchanged_ok;
commit;
