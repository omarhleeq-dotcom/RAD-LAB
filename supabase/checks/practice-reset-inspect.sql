-- Owner/admin READ ONLY, same project as the intended cleanup. Not deletion approval.
-- Keep detailed catalogue output locally. Share only reviewed schema facts and aggregate counts.
begin transaction isolation level repeatable read read only;
set local statement_timeout = '10s';
set local lock_timeout = '2s';
select current_database() database_name, current_user database_role, transaction_timestamp() inspected_at;
select n.nspname schema_name,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('attempts','feedback','events','profiles') order by c.relname;
-- All incoming/outgoing FKs, not just the known feedback cascade.
select conrelid::regclass source_table,confrelid::regclass target_table,conname,pg_get_constraintdef(oid) definition
from pg_constraint where contype='f' and
 (conrelid in ('public.attempts'::regclass,'public.feedback'::regclass,'public.events'::regclass)
 or confrelid in ('public.attempts'::regclass,'public.feedback'::regclass,'public.events'::regclass)) order by 1,3;
select conrelid::regclass table_name,conname,pg_get_constraintdef(oid) definition from pg_constraint
where conrelid in ('public.attempts'::regclass,'public.feedback'::regclass,'public.events'::regclass) order by 1,2;
select tgrelid::regclass table_name,tgname,tgenabled,pg_get_triggerdef(oid) definition,
 pg_get_functiondef(tgfoid) function_definition from pg_trigger
where not tgisinternal and tgrelid in ('public.attempts'::regclass,'public.feedback'::regclass,'public.events'::regclass) order by 1,2;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('attempts','feedback','events') order by tablename,policyname;
select table_name,grantee,privilege_type from information_schema.table_privileges
where table_schema='public' and table_name in ('attempts','feedback','events') order by 1,2,3;
-- Views and other SQL dependencies require review, even without an FK.
select distinct pg_describe_object(d.classid,d.objid,d.objsubid) dependent
from pg_depend d where d.refobjid in ('public.attempts'::regclass,'public.feedback'::regclass,'public.events'::regclass)
order by 1;
-- Set scope to 'all-practice' OR 'selected'; enter UUIDs privately only for selected.
-- Unset scope deliberately returns zero candidates. This is NOT a live approved count.
with config as (select 'unset'::text scope,array[]::uuid[] users),
target as (select a.id,a.user_id,a.engine_version,a.finished_at from public.attempts a cross join config c
 where a.mode='practice' and a.record_kind='attempt'
 and (c.scope='all-practice' or (c.scope='selected' and a.user_id=any(c.users)))),
linked_events as (select e.user_id,e.payload from public.events e where exists
 (select 1 from target a where e.payload->>'attempt_id'=a.id::text))
select (select scope from config) scope,
 (select count(*) from target) attempts,
 (select count(*) from public.feedback f where exists(select 1 from target a where a.id=f.attempt_id)) cascading_feedback,
 (select count(*) from public.feedback f where exists(select 1 from target a where a.id=f.attempt_id)
   and (f.mode<>'practice' or f.record_kind<>'feedback')) feedback_outside_practice_must_be_zero,
 (select count(*) from linked_events) linked_events_retained_by_default,
 (select count(*) from linked_events e where not exists(select 1 from target a where a.id::text=e.payload->>'attempt_id' and a.user_id=e.user_id)) event_owner_mismatches,
 (select count(*) from target where engine_version='unknown') unknown_evaluator,
 (select min(finished_at) from target) earliest,(select max(finished_at) from target) latest;
-- Bounded non-personal preview; IDs, settings, results and feedback text are not emitted.
with config as (select 'unset'::text scope,array[]::uuid[] users)
select a.exam_id,a.case_id,a.engine_version,count(*) attempts from public.attempts a cross join config c
where a.mode='practice' and a.record_kind='attempt'
and (c.scope='all-practice' or (c.scope='selected' and a.user_id=any(c.users)))
group by a.exam_id,a.case_id,a.engine_version order by a.exam_id,a.case_id,a.engine_version limit 20;
rollback;
