-- RAD-085 W1 DECISION-NEEDED proposal (D-W1). Do NOT run without a recorded owner decision.
-- Why: createGradingWorkerBinding refuses any role with TEMP or CREATE on the database, and
-- PostgreSQL grants TEMP to PUBLIC by default (owner-observed on production: PUBLIC TEMP=true).
-- There is no per-role DENY, so the only way is: revoke TEMP from PUBLIC after granting it
-- explicitly to every existing role except the new grading role and its slot. Every existing
-- role keeps its current TEMP ability; only assess_grading_worker/assess_job_b lose it.
-- Rollback (owner, same channel): grant temporary on database postgres to public;
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='8s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-grading-worker/1',0));
do $temp$
declare
 db text := pg_catalog.current_database();
 r record;
begin
 if current_user<>'postgres'
   or (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled)
   or not exists(select 1 from pg_catalog.pg_roles where rolname='assess_grading_worker')
   or not exists(select 1 from pg_catalog.pg_database d, aclexplode(coalesce(d.datacl,acldefault('d',d.datdba))) x
     where d.datname=db and x.grantee=0 and x.privilege_type='TEMPORARY') then
  raise exception 'D-W1 precondition failed or already applied: STOP, no change' using errcode='55000';
 end if;
 for r in select rolname from pg_catalog.pg_roles where rolname !~ '^pg_'
   and rolname not in ('assess_grading_worker','assess_job_b')
   and pg_catalog.has_database_privilege(oid,db,'TEMP') order by rolname loop
  execute pg_catalog.format('grant temporary on database %I to %I',db,r.rolname);
 end loop;
 execute pg_catalog.format('revoke temporary on database %I from public',db);
 if pg_catalog.has_database_privilege('assess_grading_worker',db,'CREATE,TEMP')
   or exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_b')
     and pg_catalog.has_database_privilege('assess_job_b',db,'TEMP')
   or not pg_catalog.has_database_privilege('postgres',db,'TEMP') then
  raise exception 'D-W1 postcondition failed: rolled back' using errcode='55000';
 end if;
end
$temp$;
select 'assess-grading-worker-public-temp/1' as contract,
 not pg_catalog.has_database_privilege('assess_grading_worker',pg_catalog.current_database(),'TEMP') as grading_temp_absent,
 pg_catalog.has_database_privilege('postgres',pg_catalog.current_database(),'TEMP') as owner_temp_kept;
commit;
