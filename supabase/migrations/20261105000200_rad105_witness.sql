-- STAGED (RAD-105 P5). NOT in the applied manifest and NOT in supabase/migrations until the P7 promotion.
-- Restore epoch for the external witness (RAD-097), owner-only "Accept restored database" and in-app "Resume".
-- All timestamps the witness uses come from THIS database clock (health_v1 -> witness.now / acceptedAt), never the worker or GCS clock.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $pre$ begin
 if to_regprocedure('assess.health_v1()') is null or to_regprocedure('assess.owner_scope_enter_v1(boolean)') is null
  or to_regprocedure('assess.freeze_v2()') is null or to_regclass('assess.manual_work_v1') is null
  or to_regclass('assess.restore_epoch') is not null then raise exception 'RAD105 P5 preconditions not met' using errcode='55000'; end if;
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 then raise exception 'RAD105 P5 requires the closed gate' using errcode='55000'; end if;
end $pre$;

create table assess.restore_epoch (
 singleton boolean primary key default true check(singleton),
 epoch uuid not null default gen_random_uuid(),
 seq bigint not null default 0 check(seq>=0),
 accepted_at timestamptz not null default clock_timestamp()
);
insert into assess.restore_epoch default values;
alter table assess.restore_epoch enable row level security;
revoke all on assess.restore_epoch from public,anon,authenticated,assess_worker;

-- Same lifecycle-v1 counters as before plus the witness tick. CREATE OR REPLACE keeps the owner and every existing grant.
create or replace function assess.health_v1() returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare h jsonb; r assess.restore_epoch;
begin
 select jsonb_build_object('failed',count(*) filter(where state='grading-failed'),
   'alert',count(*) filter(where state='grading-failed' and submitted_at<=clock_timestamp()-interval '24 hours'),
   'overdue',count(*) filter(where state='active' and deadline<=clock_timestamp()),
   'purgeDue',count(*) filter(where expires_at<=clock_timestamp())) into h from assess.sessions where lifecycle_version=1;
 update assess.restore_epoch set seq=seq+1 where singleton returning * into r;
 return h||jsonb_build_object('witness',jsonb_build_object('epoch',r.epoch,'seq',r.seq,'now',clock_timestamp(),'acceptedAt',r.accepted_at,
   'credentialValidUntil',(select u.rolvaliduntil from pg_catalog.pg_roles u where u.rolname=session_user)));
end $$;

create function assess.witness_accept_v1(p_confirm text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r assess.restore_epoch;
begin
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_confirm is distinct from 'ACCEPT RESTORED DATABASE' then raise exception 'confirmation required' using errcode='22023'; end if;
 if exists(select 1 from assess.launch_gate where enabled) then raise exception 'close the gate first' using errcode='55000'; end if;
 update assess.restore_epoch set epoch=gen_random_uuid(),seq=0,accepted_at=clock_timestamp() where singleton returning * into r;
 return jsonb_build_object('epoch',r.epoch,'acceptedAt',r.accepted_at);
end $$;

-- Reverses exactly what the in-app stop did and nothing else: releases held lifecycle-2 sessions back to grading
-- (the same transition as recover_v2, in bounded batches), re-enables LOGIN on the single grading slot, reopens the gate.
-- It cannot enable a Google secret: if the secret was disabled by hand, the owner re-enables it separately.
create function assess.owner_resume_v1(p_confirm text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare released bigint:=0; still bigint; active_held bigint; login boolean:=false;
begin
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_confirm is distinct from 'RESUME ASSESS' then raise exception 'confirmation required' using errcode='22023'; end if;
 with due as (select s.id from assess.sessions s where s.lifecycle_version=2 and s.emergency_held_at is not null and s.state='grading-failed'
   and s.submitted_at>clock_timestamp()-interval '7 days' and exists(select 1 from assess.session_details d where d.session_id=s.id)
   order by s.submitted_at,s.id limit 500 for update)
 update assess.sessions s set emergency_held_at=null,
   state=case when coalesce((select w.automatic_complete from assess.manual_work_v1 w where w.session_id=s.id),false) then 'awaiting-manual' else 'grading' end,
   revision=s.revision+1,lease=null,lease_until=null,retry_at=null,failed_at=null from due where s.id=due.id;
 get diagnostics released=row_count;
 select count(*) into still from assess.sessions where emergency_held_at is not null;
 select count(*) into active_held from assess.sessions where emergency_held_at is not null and state='active';
 if exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_b') then alter role assess_job_b login; end if;
 select coalesce(rolcanlogin,false) into login from pg_catalog.pg_roles where rolname='assess_job_b';
 update assess.launch_gate set enabled=true;
 return jsonb_build_object('released',released,'stillHeld',still,'heldActive',active_held,'gateOpen',true,'loginEnabled',coalesce(login,false));
end $$;

revoke all on function assess.witness_accept_v1(text),assess.owner_resume_v1(text) from public,anon,authenticated,assess_worker;
grant execute on function assess.witness_accept_v1(text),assess.owner_resume_v1(text) to authenticated;
commit;
