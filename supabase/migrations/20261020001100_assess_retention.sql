-- S-ASSESS-15: additive LOCAL review package. Never apply to an existing provider here.
-- No launch change, scheduler, Practice mutation, seeds or acceptance backfill.
begin;
alter table assess.assignments add column closed_at timestamptz;
alter table assess.assignments drop constraint assignments_owner_id_version_id_key;
create unique index assess_one_open_assignment on assess.assignments(owner_id,version_id) where closed_at is null;
create index assess_closed_assignments on assess.assignments(id) where closed_at is not null;
create index assess_sessions_user on assess.sessions(user_id);
create index assess_sessions_assignment on assess.sessions(assignment_id);

-- Absence means Assess enabled (the existing behaviour). An explicit stop is
-- permanent in this package; reactivation needs a separately reviewed contract.
create table assess.account_stops (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 disabled_at timestamptz not null default clock_timestamp()
);
alter table assess.account_stops enable row level security;
revoke all on assess.account_stops from public,anon,authenticated,assess_worker;

create function assess.assignment_terminal_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.closed_at is not null and (tg_op='DELETE' or new.closed_at is distinct from old.closed_at
   or new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.version_id is distinct from old.version_id) then
   raise exception 'permanently closed' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger assess_assignment_terminal before update or delete on assess.assignments
 for each row execute function assess.assignment_terminal_v1();

create function assess.close_assignment_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform 1 from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
 if not found then raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=p_assignment and closed_at is null;
end $$;

create function assess.disable_account_v1(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Self disable or current approved owner; never suspend the public profile.
 if not public.is_approved() or (p_user is distinct from auth.uid() and not public.is_owner()) then
   raise exception 'account denied' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user for update;
 if not found then raise exception 'account denied' using errcode='42501'; end if;
 insert into assess.account_stops(user_id) values(p_user) on conflict do nothing;
end $$;

-- Keep v1 text/acceptance independent; do not re-stamp any existing acceptance.
alter table assess.consents drop constraint consents_version_check;
alter table assess.consents drop constraint consents_pkey;
alter table assess.consents add primary key(user_id,version);
alter table assess.consents add constraint consents_version_check
 check(version in ('assess-pilot-2026-10-20-v1','assess-pilot-2026-10-20-v2'));
create or replace function assess.consent_v1(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  perform 1 from public.profiles where user_id=auth.uid() for share;
  if p_version is not null then
    if exists(select 1 from assess.account_stops where user_id=auth.uid()) then raise exception 'Assess disabled' using errcode='42501'; end if;
    if p_version<>'assess-pilot-2026-10-20-v1' then raise exception 'unsupported consent' using errcode='22023'; end if;
    insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id,version) do nothing;
  end if;
  return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-pilot-2026-10-20-v1'));
end $$;

create function assess.consent_v2(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
 if p_version is not null then
   if p_version<>'assess-pilot-2026-10-20-v2' then raise exception 'unsupported consent' using errcode='22023'; end if;
   if exists(select 1 from assess.account_stops where user_id=auth.uid()) then raise exception 'Assess disabled' using errcode='42501'; end if;
   insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id,version) do nothing;
 end if;
 return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-pilot-2026-10-20-v2'));
end $$;
create or replace function assess.require_consent_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from assess.consents where user_id=new.user_id and version='assess-pilot-2026-10-20-v2') then
   raise exception 'Assess v2 consent required' using errcode='42501'; end if;
 return new;
end $$;
create or replace function assess.start_v1(p_assignment uuid,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc jsonb; sp jsonb; s assess.sessions; n integer; ts timestamptz; duration integer; prior uuid;
begin
  if not exists(select 1 from assess.launch_gate where enabled) then raise exception 'launch gate closed' using errcode='55000'; end if;
  if p_operation is null then raise exception 'invalid start operation' using errcode='22023'; end if;
  -- Per-user/assignment reservation serialises starts, including starts after finalisation/purge.
  perform assess.session_authorize_v1(p_assignment);
  -- Assignment SHARE and profile SHARE locks already held by session_authorize.
  -- Close/disable take UPDATE on those same rows until COMMIT.
  if exists(select 1 from assess.assignments where id=p_assignment and closed_at is not null)
    or exists(select 1 from assess.account_stops where user_id=auth.uid()) then
    raise exception 'new starts disabled' using errcode='42501'; end if;
  perform 1 from assess.assignments where id=p_assignment for share;
  insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;
  select used into n from assess.reservations where assignment_id=p_assignment and user_id=auth.uid() for update;
  perform assess.session_authorize_v1(p_assignment);
  select (starts->>p_operation::text)::uuid into prior from assess.reservations where assignment_id=p_assignment and user_id=auth.uid();
  if prior is not null then
    if not exists(select 1 from assess.sessions where id=prior and (expires_at is null or clock_timestamp()<expires_at)) then
      raise exception 'start no longer available' using errcode='55000'; end if;
    return jsonb_build_object('attemptId',prior);
  end if;
  if (select count(*) from assess.reservations r, jsonb_object_keys(r.starts) k where r.assignment_id=p_assignment and r.user_id=auth.uid())>=20000 then
    raise exception 'start operation limit' using errcode='54000'; end if;
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid() and state='active' for update;
  ts:=clock_timestamp();
  if s.id is not null then
    if s.deadline is not null and ts>=s.deadline then
      update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
    end if;
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    return jsonb_build_object('attemptId',s.id);
  end if;
  -- A pending/failing grade cannot accidentally reserve another attempt on a lost start response.
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid()
    and state in ('grading','grading-failed') order by ordinal desc limit 1;
  if s.id is not null then
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    return jsonb_build_object('attemptId',s.id); end if;
  select p.document,p.specs into doc,sp from assess.publications p join assess.assignments a on a.version_id=p.version_id where a.id=p_assignment;
  if doc is null then raise exception 'publication unavailable' using errcode='55000'; end if;
  if n >= (doc->'assessment'->'policy'->>'maxAttempts')::integer then raise exception 'attempt limit' using errcode='54000'; end if;
  duration:=(doc->'assessment'->'policy'->>'durationSeconds')::integer;
  -- S-ASSESS-15: first pilot is timed-only; future untimed retention needs its own policy.
  if duration is null then raise exception 'untimed retention not configured' using errcode='55000'; end if;
  insert into assess.sessions(assignment_id,user_id,ordinal,started_at,deadline)
    values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;
  update assess.reservations set used=n+1,starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
  insert into assess.session_details(session_id,publication,specs) values(s.id,doc,sp);
  return jsonb_build_object('attemptId',s.id);
end $$;

create or replace function assess.maintain_v1(p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer; gone integer; metadata_gone integer; consent_gone integer; ts timestamptz:=clock_timestamp();
begin
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid batch' using errcode='22023'; end if;
  with due as (select id from assess.sessions where state='active' and deadline<=ts order by deadline,id limit p_limit for update skip locked)
  update assess.sessions s set state='grading',submitted_at=deadline,revision=revision+1 from due where s.id=due.id;
  get diagnostics n=row_count;
  with due as (select id from assess.sessions where state in ('grading','grading-failed') and submitted_at<=ts-interval '7 days'
    order by submitted_at,id limit p_limit for update skip locked)
  update assess.sessions s set state='void',lease=null,lease_until=null,expires_at=ts from due where s.id=due.id;
  -- Crashed leases stop automatic retries after 24h too; explicit recover remains possible until day seven.
  with due as (select id from assess.sessions where state='grading' and submitted_at<=ts-interval '24 hours'
    and (lease_until is null or lease_until<=ts) order by submitted_at,id limit p_limit for update skip locked)
  update assess.sessions s set state='grading-failed',failed_at=coalesce(failed_at,ts),retry_at=submitted_at+interval '7 days',lease=null,lease_until=null from due where s.id=due.id;
  -- Removing session cascades details/receipts/results; reservation counter deliberately survives.
  with due as (select id from assess.sessions where expires_at<=ts order by expires_at,id limit p_limit for update skip locked)
  delete from assess.sessions s using due where s.id=due.id;
  get diagnostics gone=row_count;
  -- SKIP LOCKED avoids inverting C's session/assignment/profile lock order.
  -- Retain the permanent assignment tombstone; no sessions means no results,
  -- details, receipts or remaining recovery window (C cascades them atomically).
  with closed as materialized (
    select a.id from assess.assignments a where a.closed_at is not null
      and not exists(select 1 from assess.sessions s where s.assignment_id=a.id)
      and exists(select 1 from assess.reservations r where r.assignment_id=a.id)
    order by a.id limit p_limit for update skip locked
  ), due as (
    select r.assignment_id,r.user_id from assess.reservations r join closed a on a.id=r.assignment_id
    order by r.assignment_id,r.user_id limit p_limit for update of r skip locked
  ) delete from assess.reservations r using due where r.assignment_id=due.assignment_id and r.user_id=due.user_id;
  get diagnostics metadata_gone=row_count;
  with stopped as materialized (
    select p.user_id from public.profiles p join assess.account_stops a on a.user_id=p.user_id
    where not exists(select 1 from assess.sessions s where s.user_id=p.user_id)
      and exists(select 1 from assess.consents c where c.user_id=p.user_id)
    order by p.user_id limit p_limit for update of p skip locked
  ), due as (
    select c.user_id,c.version from assess.consents c join stopped a on a.user_id=c.user_id
    order by c.user_id,c.version limit p_limit for update of c skip locked
  ) delete from assess.consents c using due where c.user_id=due.user_id and c.version=due.version;
  get diagnostics consent_gone=row_count;
  return jsonb_build_object('expired',n,'purged',gone,'reservationsPurged',metadata_gone,'consentsPurged',consent_gone);
end $$;

revoke all on function assess.assignment_terminal_v1(),assess.close_assignment_v1(uuid),assess.disable_account_v1(uuid),assess.consent_v2(text) from public,anon,authenticated,assess_worker;
grant execute on function assess.close_assignment_v1(uuid),assess.disable_account_v1(uuid),assess.consent_v2(text) to authenticated;
commit;
