-- RAD-062 M05, deferred after M01-M04. No runtime grants or lifecycle wiring.
-- Readiness: freeze_v2(), four states, RLS/ACL and exact D3 identity inventory.
-- Before use only: remove the new objects/column, restore the prior state check
-- and saved erasure_fk_contract in one reviewed transaction. Never drop v1.
-- After use: preserve answers, manual work and timers; reviewed forward-fix only.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $$ begin
 if to_regprocedure('assess.pool_start_v2(uuid)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1() then
  raise exception 'M04, closed gate and exact D3 inventory required' using errcode='55000'; end if;
end $$;
alter table assess.sessions drop constraint sessions_state_check;
alter table assess.sessions add constraint sessions_state_check check(state in ('active','grading','grading-failed','awaiting-manual','graded','void'));
alter table assess.sessions add column emergency_held_at timestamptz;
-- Transient stores cascade with the ONLY answer snapshot, not with a result.
-- Score fractions are exact; no answer text, answer digest or free-text audit.
create table assess.manual_work_v1 (
 session_id uuid primary key references assess.session_details(session_id) on delete cascade,
 automatic_complete boolean not null default false,
 automatic_n numeric not null default 0 check(automatic_n>=0),
 automatic_d numeric not null default 1 check(automatic_d>0),
 grading_revision integer not null default 0 check(grading_revision>=0),
 operation_count integer not null default 0 check(operation_count between 0 and 100),
 warning_sent_at timestamptz
);
create table assess.manual_item_scores_v1 (
 session_id uuid not null references assess.manual_work_v1(session_id) on delete cascade,
 item_id text not null check(length(item_id) between 1 and 100),
 item_version text not null check(length(item_version) between 1 and 100),
 answer_revision integer not null check(answer_revision>=0),
 grading_revision integer not null check(grading_revision>0),
 score_n numeric not null check(score_n>=0),score_d numeric not null check(score_d>0),
 grader_id uuid references public.profiles(user_id) on delete set null,
 primary key(session_id,item_id,item_version)
);
create table assess.manual_events_v1 (
 session_id uuid not null references assess.manual_work_v1(session_id) on delete cascade,
 operation_id uuid not null,
 item_id text not null check(length(item_id) between 1 and 100),
 item_version text not null check(length(item_version) between 1 and 100),
 grading_revision integer not null check(grading_revision between 1 and 100),
 grader_id uuid references public.profiles(user_id) on delete set null,
 appointment_revision integer check(appointment_revision>=0),
 group_id uuid references assess.groups(id) on delete set null,
 recorded_at timestamptz not null default clock_timestamp(),
 old_n numeric check(old_n>=0),old_d numeric check(old_d>0),
 new_n numeric not null check(new_n>=0),new_d numeric not null check(new_d>0),
 reason_code text not null check(reason_code in ('initial','correction','owner-takeover')),
 check((old_n is null)=(old_d is null)),
 primary key(session_id,operation_id,item_id,item_version)
);
-- Survives detail deletion for final ACK replay, expires/cascades with session.
-- No payload, answer hash, per-item scores or duplicate total in this receipt.
create table assess.manual_final_receipts_v1 (
 session_id uuid primary key references assess.sessions(id) on delete cascade,
 final_operation_id uuid not null,
 expected_grading_revision integer not null check(expected_grading_revision between 0 and 100),
 final_grading_revision integer not null check(final_grading_revision=expected_grading_revision+1),
 finalized_at timestamptz not null default clock_timestamp(),
 final_grader_id uuid references public.profiles(user_id) on delete set null,
 operation_count integer not null check(operation_count between 0 and 100),
 grader_count integer not null check(grader_count between 0 and 100),
 outcome text not null default 'finalized' check(outcome='finalized'),
 policy_version integer not null check(policy_version=1)
);
alter table assess.manual_work_v1 enable row level security;
alter table assess.manual_item_scores_v1 enable row level security;
alter table assess.manual_events_v1 enable row level security;
alter table assess.manual_final_receipts_v1 enable row level security;
revoke all on assess.manual_work_v1,assess.manual_item_scores_v1,assess.manual_events_v1,assess.manual_final_receipts_v1 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
do $$ declare expected jsonb; begin
 select jsonb_agg(e order by e->>0,e->>1,e->>2) into expected from jsonb_array_elements(
  (select inventory from assess.erasure_fk_contract where singleton)||
  '[["assess","manual_item_scores_v1","manual_item_scores_v1_grader_id_fkey","FOREIGN KEY (grader_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL"],["assess","manual_events_v1","manual_events_v1_grader_id_fkey","FOREIGN KEY (grader_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL"],["assess","manual_final_receipts_v1","manual_final_receipts_v1_final_grader_id_fkey","FOREIGN KEY (final_grader_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL"]]'::jsonb) e;
 if assess.d3_fk_inventory_v1() is distinct from expected then raise exception 'unreviewed M05 identity edge' using errcode='55000'; end if;
 update assess.erasure_fk_contract set inventory=expected where singleton;
end $$;
-- Defence against v1 recover/claim changing a held row before M06 isolation.
-- Void/erasure remain possible. Selective hold release is private future M06/M08
-- work; there is no callable recovery capability or new grant here.
create function assess.emergency_hold_guard_v2() returns trigger
language plpgsql set search_path='' as $$ begin
 if old.emergency_held_at is not null and new.emergency_held_at is not null and new.state<>'void'
 and (new.state<>'grading-failed' or new.submitted_at is distinct from old.submitted_at
  or new.deadline is distinct from old.deadline or new.started_at is distinct from old.started_at
  or new.retry_at is distinct from old.retry_at or new.lease is not null or new.lease_until is not null) then
  raise exception 'attempt emergency held' using errcode='55000'; end if;
 return new;
end $$;
create trigger rad062_emergency_hold before update on assess.sessions for each row execute function assess.emergency_hold_guard_v2();
-- Owner SQL Editor primitive. ACCESS EXCLUSIVE drains in-flight row writers;
-- snapshot follows lock acquisition. No SKIP LOCKED or silently omitted rows.
create function assess.freeze_v2() returns bigint
language plpgsql security definer set search_path='' set lock_timeout='2s' set statement_timeout='5s' as $$
declare changed bigint; begin
 lock table assess.sessions in access exclusive mode;
 with ts as materialized(select clock_timestamp() at), held as materialized(
  select s.id,coalesce(s.submitted_at,least(s.deadline,ts.at)) submitted_at,ts.at
  from assess.sessions s cross join ts where s.state in ('active','grading','grading-failed','awaiting-manual')
 )
 update assess.sessions s set state='grading-failed',submitted_at=h.submitted_at,
  lease=null,lease_until=null,retry_at=h.submitted_at+interval '7 days',
  failed_at=coalesce(s.failed_at,h.at),emergency_held_at=coalesce(s.emergency_held_at,h.at),revision=s.revision+1
 from held h where s.id=h.id and (s.state<>'grading-failed' or s.emergency_held_at is null
  or s.submitted_at is distinct from h.submitted_at or s.lease is not null or s.lease_until is not null
  or s.failed_at is null or s.retry_at is distinct from h.submitted_at+interval '7 days');
 get diagnostics changed=row_count; return changed;
end $$;
revoke all on function assess.emergency_hold_guard_v2(),assess.freeze_v2() from public,anon,authenticated,assess_worker,assess_authoring_bridge;
commit;
