-- MANUAL INSTALL: C/D only, original RAD-LAB project vlacestfruxooznrcjqc. Verify project selector manually.
-- Owner instructed proceeding without a new backup on 2026-10-20; recovery readiness is NOT verified.
-- Run the whole file once, in one SQL Editor query, as the sole operator. B-only guard rejects replay.
-- Atomic rollback covers errors BEFORE COMMIT only; it is not a backup or post-COMMIT undo.
-- No old migration replay, seeds, runtime/scheduler, attestation update or gate opening.
-- SQL cannot establish the Supabase project URL from current_database().
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $precondition$
declare allowed boolean;
begin
 select q.ready_for_cd_review into allowed from (with b_tables(name) as (values ('assess.groups'),('assess.memberships'),('assess.versions'),('assess.assignments'),('assess.targets')),
b_functions(signature) as (values
 ('assess.group_write_v1(uuid,text,boolean)'),('assess.members_write_v1(uuid,uuid[],boolean)'),
 ('assess.assign_v1(uuid,uuid[],uuid[])'),('assess.targets_write_v1(uuid,integer,uuid[],boolean)'),
 ('assess.owner_page_v1(text,uuid,text,uuid,integer)'),('assess.assigned_version_v1(uuid)')),
cd_tables(name) as (values ('assess.launch_gate'),('assess.publications'),('assess.reservations'),('assess.sessions'),('assess.session_details'),('assess.receipts'),('assess.results'),('assess.content_submissions')),
facts as (select
 current_setting('transaction_read_only')='on' as read_only,
 to_regclass('public.profiles') is not null and to_regclass('public.attempts') is not null
  and to_regclass('public.events') is not null and to_regclass('public.feedback') is not null as pilot_present,
 (select bool_and(to_regclass(name) is not null) from b_tables) as assess_b_tables_present,
 (select bool_and(coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass(t.name)),false)) from b_tables t) as assess_b_rls,
 (select bool_and(to_regprocedure(signature) is not null) from b_functions) as assess_b_functions_present,
 (select count(*)::int from cd_tables where to_regclass(name) is not null) as cd_tables_present,
 (select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess') as assess_functions_total,
 (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','f')) as assess_relations_total,
 not exists(select 1 from pg_roles where rolname='assess_worker') as worker_role_absent
)
select facts.*,
 pilot_present and assess_b_tables_present and assess_b_rls and assess_b_functions_present
 and cd_tables_present=0 and assess_functions_total=6 and assess_relations_total=5 and worker_role_absent as ready_for_cd_review
from facts) q;
 if not coalesce(allowed,false) then raise exception 'C/D precondition failed. Stop; do not drop or replay existing objects';end if;
end $precondition$;

-- SOURCE 20261020000700_assess_lifecycle.sql SHA256 198a581275ade58ac7be47528768f4028dc566857fce8b57fa031c9845e96581
-- Assess C: no seeds, public/Practice changes, scheduler installation or production execution.
-- A dedicated worker capability must be bound to a trusted runtime separately before deployment.
create role assess_worker nologin noinherit;
grant usage on schema assess to assess_worker;
-- Closed by default until separate runtime/scheduler, consent and deployment review. No user/worker toggle RPC.
create table assess.launch_gate (singleton boolean primary key default true check(singleton),enabled boolean not null default false);
insert into assess.launch_gate default values;
alter table assess.launch_gate enable row level security;
revoke all on assess.launch_gate from public,anon,authenticated,assess_worker;
create table assess.publications (
  version_id uuid primary key references assess.versions(id),
  document jsonb not null,
  specs jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  check(pg_column_size(document)<=2000000)
);
create table assess.reservations (
  assignment_id uuid not null references assess.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  used integer not null default 0 check(used>=0),
  starts jsonb not null default '{}', -- bounded operation→session tombstones, no answers or scores
  primary key(assignment_id,user_id)
);
create table assess.sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assess.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  ordinal integer not null,
  state text not null default 'active' check(state in ('active','grading','grading-failed','graded','void')),
  revision integer not null default 0,
  started_at timestamptz not null,
  deadline timestamptz,
  submitted_at timestamptz,
  submission_op uuid,
  submission_revision integer,
  lease uuid,
  lease_until timestamptz,
  retry_at timestamptz,
  failed_at timestamptz,
  expires_at timestamptz,
  unique(assignment_id,user_id,ordinal)
);
create unique index assess_one_active on assess.sessions(assignment_id,user_id) where state='active';
create index assess_sessions_due on assess.sessions(state,deadline,id);
create index assess_sessions_retry on assess.sessions(state,retry_at,lease_until,id);
create index assess_sessions_expiry on assess.sessions(expires_at,id);
create table assess.session_details (
  session_id uuid primary key references assess.sessions(id) on delete cascade,
  publication jsonb not null,
  specs jsonb not null,
  answers jsonb not null default '{}',
  locked jsonb not null default '[]'
);
create table assess.receipts (
  session_id uuid not null references assess.sessions(id) on delete cascade,
  operation_id uuid not null,
  digest text not null, -- transient SHA-256; erased with details, never logged
  ack jsonb not null,
  primary key(session_id,operation_id)
);
create table assess.results (
  session_id uuid primary key references assess.sessions(id) on delete cascade,
  earned_n numeric not null check(earned_n>=0),
  earned_d numeric not null check(earned_d>0),
  maximum numeric not null check(maximum>0),
  name text not null,
  track text not null,
  visibility text not null check(visibility in ('hidden','after-submission'))
);
-- No policy grants direct access, even to authenticated owners or the worker.
alter table assess.publications enable row level security;
alter table assess.reservations enable row level security;
alter table assess.sessions enable row level security;
alter table assess.session_details enable row level security;
alter table assess.receipts enable row level security;
alter table assess.results enable row level security;
revoke all on assess.publications,assess.reservations,assess.sessions,assess.session_details,assess.receipts,assess.results from public,anon,authenticated,assess_worker;

-- Trusted publication port, not an owner/browser authoring endpoint. TS validation is mandatory.
create function assess.install_publication_v1(p_version uuid,p_document jsonb,p_specs jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v assess.versions;
begin
  select * into strict v from assess.versions where id=p_version for update;
  if p_document is null or p_specs is null or pg_column_size(p_document)>2000000
    or p_document->'assessment'->>'schemaVersion' is distinct from '1'
    or p_document->'assessment'->'ref'->>'id' is distinct from v.assessment_id::text
    or p_document->'assessment'->'ref'->>'version' is distinct from v.version
    or p_document->'assessment'->>'name' is distinct from v.name
    or p_document->'assessment'->>'track' is distinct from v.track then
    raise exception 'invalid publication' using errcode='22023'; end if;
  insert into assess.publications(version_id,document,specs) values(p_version,p_document,p_specs);
end $$;

-- Internal guard; every student operation rechecks the current account AND explicit target.
create function assess.session_authorize_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from assess.assignments where id=p_assignment for share;
  perform 1 from public.profiles where user_id=auth.uid() for share;
  if not public.is_approved() or not exists(
    select 1 from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id
    where t.assignment_id=p_assignment and t.user_id=auth.uid() and v.available
      and v.schema_version=1 and v.track in ('mixed','full-practical')) then
    raise exception 'access denied' using errcode='42501'; end if;
end $$;

create function assess.session_ack_v1(p_session uuid,p_operation uuid) returns jsonb
language sql volatile security definer set search_path='' as $$
  select jsonb_build_object('operationId',p_operation,'revision',s.revision,'serverTime',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'deadline',to_char(s.deadline at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'state',s.state,'lockedItemIds',coalesce(d.locked,'[]'::jsonb))
  from assess.sessions s left join assess.session_details d on d.session_id=s.id where s.id=p_session
$$;

create function assess.start_v1(p_assignment uuid,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc jsonb; sp jsonb; s assess.sessions; n integer; ts timestamptz; duration integer; prior uuid;
begin
  if not exists(select 1 from assess.launch_gate where enabled) then raise exception 'launch gate closed' using errcode='55000'; end if;
  if p_operation is null then raise exception 'invalid start operation' using errcode='22023'; end if;
  -- Per-user/assignment reservation serialises starts, including starts after finalisation/purge.
  perform assess.session_authorize_v1(p_assignment);
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
  -- Untimed storage is gated until its abandoned-attempt retention/consent is decided (O106).
  if duration is null then raise exception 'untimed retention not configured' using errcode='55000'; end if;
  insert into assess.sessions(assignment_id,user_id,ordinal,started_at,deadline)
    values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;
  update assess.reservations set used=n+1,starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
  insert into assess.session_details(session_id,publication,specs) values(s.id,doc,sp);
  return jsonb_build_object('attemptId',s.id);
end $$;

create function assess.read_session_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details;
begin
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(s.assignment_id);
  if s.expires_at is not null and clock_timestamp()>=s.expires_at then raise exception 'expired' using errcode='42501'; end if;
  if s.state='active' and clock_timestamp()>=s.deadline then
    update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
  end if;
  select * into d from assess.session_details where session_id=s.id;
  return jsonb_build_object('attemptId',s.id,'ack',assess.session_ack_v1(s.id,null)) ||
    case when (select state='active' from assess.sessions where id=s.id) then
      jsonb_build_object('assessment',d.publication->'assessment','answers',d.answers) else '{}'::jsonb end;
end $$;

-- The database enforces the worker-validated answer spec even if the client bypasses TS.
create function assess.validate_answer_v1(p_item jsonb,p_spec jsonb,p_answer jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare kv record; constraint_spec jsonb; candidate_value jsonb;
begin
  if p_item is null or p_spec is null or jsonb_typeof(p_answer) is distinct from 'object'
    or p_answer->>'type' is distinct from p_item->>'type' then raise exception 'invalid answer' using errcode='22023'; end if;
  if p_item->>'type'='single-choice' then
    if p_answer - array['type','optionId'] <> '{}' or not(p_answer ? 'optionId')
      or (p_answer->'optionId'<>'null'::jsonb and not exists(select 1 from jsonb_array_elements(p_item->'options') o where o->'id'=p_answer->'optionId'))
      then raise exception 'invalid choice' using errcode='22023'; end if;
  else
    if p_answer - array['type','values'] <> '{}' or jsonb_typeof(p_answer->'values') is distinct from 'object' then
      raise exception 'invalid simulation' using errcode='22023'; end if;
    for kv in select * from jsonb_each(p_answer->'values') loop
      constraint_spec:=p_spec->kv.key;candidate_value:=kv.value;
      if constraint_spec is null or (constraint_spec->>'kind'='number' and
        (jsonb_typeof(candidate_value)<>'number' or (candidate_value#>>'{}')::numeric<(constraint_spec->>'min')::numeric or (candidate_value#>>'{}')::numeric>(constraint_spec->>'max')::numeric))
        or (constraint_spec->>'kind'='enum' and not exists(select 1 from jsonb_array_elements(constraint_spec->'values') allowed where allowed=candidate_value)) then
        raise exception 'invalid setting' using errcode='22023'; end if;
    end loop;
    -- Complete allowlisted leaf values are required. Background is resolved privately, not supplied by client.
    if (select count(*) from jsonb_object_keys(p_answer->'values'))<>(select count(*) from jsonb_object_keys(p_spec)) then
      raise exception 'incomplete settings' using errcode='22023'; end if;
  end if;
end $$;

create function assess.command_v1(p_session uuid,p_operation uuid,p_revision integer,p_action jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details; r assess.receipts; b jsonb; a jsonb; item jsonb; iid text; ts timestamptz;
begin
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(s.assignment_id);
  if p_operation is null or p_revision is null or p_revision<0 or p_action is null or octet_length(p_action::text)>65536
    or jsonb_typeof(p_action)<>'object' then raise exception 'invalid command' using errcode='22023'; end if;
  b:=jsonb_build_object('revision',p_revision,'action',p_action);
  select * into r from assess.receipts where session_id=s.id and operation_id=p_operation;
  if r.operation_id is not null then
    if r.digest<>encode(sha256(convert_to(b::text,'UTF8')),'hex') then raise exception 'operation reused' using errcode='22023'; end if;
    return r.ack;
  end if;
  -- Only a structurally identical submit can replay after transient receipts are removed.
  if s.state='graded' and s.submission_op=p_operation and s.submission_revision=p_revision and p_action='{"type":"submit"}'::jsonb
    and clock_timestamp()<s.expires_at then return assess.session_ack_v1(s.id,p_operation); end if;
  ts:=clock_timestamp();
  if s.state<>'active' then raise exception 'attempt frozen' using errcode='55000'; end if;
  if ts>=s.deadline then
    -- Return an authoritative expiry ack; do not raise and roll back the freeze.
    update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
    return assess.session_ack_v1(s.id,p_operation) || '{"accepted":false,"reason":"deadline"}'::jsonb;
  end if;
  if p_revision<>s.revision then raise exception 'revision conflict' using errcode='40001'; end if;
  select * into strict d from assess.session_details where session_id=s.id;
  if p_action->>'type' in ('save','expose') then
    if p_action - array['type','item','answer'] <> '{}' or jsonb_typeof(p_action->'item') is distinct from 'object'
      or (p_action->'item') - array['id','version']<>'{}' then raise exception 'invalid action' using errcode='22023'; end if;
    iid:=p_action->'item'->>'id';
    select i into item from jsonb_array_elements(d.publication->'assessment'->'items') i where i->'ref'=p_action->'item';
    perform assess.validate_answer_v1(item,d.specs->iid,p_action->'answer');
    if d.locked ? iid then raise exception 'item locked' using errcode='55000'; end if;
    if p_action->>'type'='expose' and item->>'type'='single-choice' then raise exception 'invalid exposure' using errcode='22023'; end if;
    update assess.session_details set answers=jsonb_set(answers,array[iid],p_action->'answer'),
      locked=case when p_action->>'type'='expose' then locked||jsonb_build_array(iid) else locked end where session_id=s.id;
  elsif p_action='{"type":"submit"}'::jsonb then
    update assess.sessions set state='grading',submitted_at=ts,submission_op=p_operation,submission_revision=p_revision where id=s.id;
  else raise exception 'invalid action' using errcode='22023'; end if;
  update assess.sessions set revision=revision+1 where id=s.id;
  if p_action->>'type'<>'submit' and (select count(*) from assess.receipts where session_id=s.id)>=20000 then raise exception 'command limit' using errcode='54000'; end if;
  a:=assess.session_ack_v1(s.id,p_operation);
  insert into assess.receipts values(s.id,p_operation,encode(sha256(convert_to(b::text,'UTF8')),'hex'),a);
  return a;
end $$;

create function assess.result_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; assignment uuid;
begin
  select assignment_id into assignment from assess.sessions where id=p_session and user_id=auth.uid();
  if assignment is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(assignment);
  select jsonb_build_object('name',r.name,'track',r.track,'submittedAt',to_char(s.submitted_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'grade',case when r.visibility='hidden' then '{"visibility":"hidden"}'::jsonb else
      jsonb_build_object('visibility','shown','earned',round(div(2*r.earned_n*100+r.earned_d,2*r.earned_d)/100,2)::text,'maximum',round(r.maximum,2)::text) end)
  into result from assess.results r join assess.sessions s on s.id=r.session_id
  where s.id=p_session and s.user_id=auth.uid() and clock_timestamp()<s.expires_at;
  -- Current account/target permission is checked for results too; no exam body is returned.
  if result is null then raise exception 'result unavailable' using errcode='42501'; end if;
  return result;
end $$;

-- Bounded maintenance, callable by a trusted scheduler. Time comes only from DB.
create function assess.maintain_v1(p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer; gone integer; ts timestamptz:=clock_timestamp();
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
  return jsonb_build_object('expired',n,'purged',gone);
end $$;

create function assess.claim_v1() returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details; ts timestamptz:=clock_timestamp(); token uuid:=gen_random_uuid();
begin
  select * into s from assess.sessions where state in ('grading','grading-failed')
    and submitted_at>ts-interval '7 days' and (retry_at is null or retry_at<=ts) and (lease_until is null or lease_until<=ts)
    order by submitted_at,id limit 1 for update skip locked;
  if s.id is null then return null; end if;
  update assess.sessions set state='grading',lease=token,lease_until=ts+interval '5 minutes' where id=s.id;
  select * into strict d from assess.session_details where session_id=s.id;
  return jsonb_build_object('attemptId',s.id,'token',token,'publication',d.publication,'answers',d.answers,'locked',d.locked);
end $$;

create function assess.finish_v1(p_session uuid,p_token uuid,p_n text,p_d text) returns void
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; doc jsonb; maximum numeric;
begin
  select * into s from assess.sessions where id=p_session for update;
  if s.state='graded' and s.lease=p_token then return; end if;
  if s.state is distinct from 'grading' or s.lease is distinct from p_token or s.lease_until<=clock_timestamp()
    or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'stale grading claim' using errcode='40001'; end if;
  select publication into strict doc from assess.session_details where session_id=s.id;
  maximum:=(doc->'assessment'->>'maximum')::numeric;
  if p_n is null or p_d is null or length(p_n)>1000 or length(p_d)>1000 or p_n!~'^[0-9]+$' or p_d!~'^[1-9][0-9]*$'
    or p_d::numeric<=0 or p_n::numeric>maximum*p_d::numeric then raise exception 'invalid grade' using errcode='22023'; end if;
  insert into assess.results values(s.id,p_n::numeric,p_d::numeric,maximum,doc->'assessment'->>'name',doc->'assessment'->>'track',doc->'assessment'->'policy'->>'gradeVisibility');
  -- timestamptz + interval month must use UTC even on providers with a different session timezone.
  update assess.sessions set state='graded',expires_at=((submitted_at at time zone 'UTC')+interval '6 months') at time zone 'UTC',lease_until=null,retry_at=null,failed_at=null where id=s.id;
  delete from assess.receipts where session_id=s.id;
  delete from assess.session_details where session_id=s.id;
end $$;

create function assess.fail_v1(p_session uuid,p_token uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  update assess.sessions set state='grading-failed',failed_at=coalesce(failed_at,clock_timestamp()),
    retry_at=case when clock_timestamp()<submitted_at+interval '24 hours' then clock_timestamp()+interval '1 minute' else submitted_at+interval '7 days' end,
    lease=null,lease_until=null
  where id=p_session and state='grading' and lease=p_token and lease_until>clock_timestamp();
  if not found then raise exception 'stale grading claim' using errcode='40001'; end if;
end $$;

create function assess.recover_v1(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  update assess.sessions set retry_at=clock_timestamp() where id=p_session and state='grading-failed'
    and submitted_at>clock_timestamp()-interval '7 days';
  if not found then raise exception 'recovery unavailable' using errcode='55000'; end if;
end $$;

-- Operational counts only, no answers, identities or grades in monitoring/logs.
create function assess.health_v1() returns jsonb
language sql volatile security definer set search_path='' as $$
  select jsonb_build_object('failed',count(*) filter(where state='grading-failed'),
    'alert',count(*) filter(where state='grading-failed' and submitted_at<=clock_timestamp()-interval '24 hours'),
    'overdue',count(*) filter(where state='active' and deadline<=clock_timestamp()),
    'purgeDue',count(*) filter(where expires_at<=clock_timestamp())) from assess.sessions
$$;
revoke all on function assess.install_publication_v1(uuid,jsonb,jsonb),assess.session_authorize_v1(uuid),assess.session_ack_v1(uuid,uuid),
  assess.validate_answer_v1(jsonb,jsonb,jsonb),assess.start_v1(uuid,uuid),assess.read_session_v1(uuid),assess.command_v1(uuid,uuid,integer,jsonb),assess.result_v1(uuid),
  assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.recover_v1(uuid),assess.health_v1() from public,anon,authenticated;
grant execute on function assess.start_v1(uuid,uuid),assess.read_session_v1(uuid),assess.command_v1(uuid,uuid,integer,jsonb),assess.result_v1(uuid) to authenticated;
grant execute on function assess.install_publication_v1(uuid,jsonb,jsonb),assess.maintain_v1(integer),assess.claim_v1(),assess.finish_v1(uuid,uuid,text,text),assess.fail_v1(uuid,uuid),assess.recover_v1(uuid),assess.health_v1() to assess_worker;


-- SOURCE 20261020000800_assess_mixed_ui.sql SHA256 1f42463fa9af7f4d269e66f08669302ce2675b8c5ad2b6c7d984ade2df23bdef
-- D only. No seeds, Practice changes, gate opening or runtime deployment.
create table assess.content_submissions (
  version_id uuid primary key references assess.versions(id) on delete cascade,
  document jsonb,
  state text not null default 'pending' check(state in ('pending','installed')),
  check ((state='pending')=(document is not null))
);
alter table assess.content_submissions enable row level security;
revoke all on assess.content_submissions from public,anon,authenticated,assess_worker;

-- Immutable candidate. Private document is never returned through an owner list or student RPC.
-- A trusted Node worker must validate sources/shape/presentation before making it available.
create function assess.content_submit_v1(p_document jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare a jsonb; vid uuid; aid uuid;
begin
  perform 1 from public.profiles where user_id=auth.uid() for update;
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_document is null or pg_column_size(p_document)>2000000 or octet_length(p_document::text)>2000000 then
    raise exception 'document limit' using errcode='22023'; end if;
  a:=p_document->'assessment';
  if a->>'track' is distinct from 'mixed' or a->>'schemaVersion' is distinct from '1'
    or length(btrim(a->>'name')) not between 1 and 200
    or length(a->'ref'->>'version') not between 1 and 100 then raise exception 'invalid metadata' using errcode='22023'; end if;
  aid:=(a->'ref'->>'id')::uuid;
  -- Serialize all versions of one assessment and prevent another owner's version takeover.
  perform pg_advisory_xact_lock(hashtextextended(aid::text,0));
  if exists(select 1 from assess.versions where assessment_id=aid and owner_id<>auth.uid()) then raise exception 'denied' using errcode='42501'; end if;
  if (select count(*) from assess.content_submissions c join assess.versions v on v.id=c.version_id where v.owner_id=auth.uid() and c.state='pending')>=20 then
    raise exception 'pending limit' using errcode='54000'; end if;
  insert into assess.versions(owner_id,assessment_id,version,name,track)
    values(auth.uid(),aid,a->'ref'->>'version',a->>'name','mixed') returning id into vid;
  insert into assess.content_submissions(version_id,document) values(vid,p_document);
  return vid;
end $$;
create function assess.content_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select v.id,v.name,v.version,c.state from assess.content_submissions c join assess.versions v on v.id=c.version_id
    where v.owner_id=auth.uid() and (p_after is null or v.id>p_after) order by v.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
create function assess.content_read_v1(p_version uuid) returns jsonb
language sql security definer set search_path='' as $$
  select document from assess.content_submissions where version_id=p_version and state='pending'
$$;
create function assess.content_install_v1(p_version uuid,p_specs jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
  select document into strict doc from assess.content_submissions where version_id=p_version and state='pending' for update;
  perform assess.install_publication_v1(p_version,doc,p_specs);
  update assess.versions set available=true where id=p_version;
  update assess.content_submissions set state='installed',document=null where version_id=p_version;
end $$;

create function assess.assigned_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.publications p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='mixed' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

-- Add only safe selectors and reviewed scene inputs; no case, rubric or correct answers.
create function assess.read_mixed_session_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; d assess.session_details; item jsonb; key jsonb; spec jsonb; views jsonb:='{}'; initial jsonb; scene jsonb; path text; element text; paths text[];
begin
  result:=assess.read_session_v1(p_session); -- locks session and rechecks identity/target/expiry
  if result->'ack'->>'state'<>'active' then return result; end if;
  if result->'assessment'->>'track'<>'mixed' then raise exception 'mixed only' using errcode='55000'; end if;
  select * into strict d from assess.session_details where session_id=p_session;
  for item in select value from jsonb_array_elements(d.publication->'assessment'->'items') loop
    if item->>'type'='simulator-part' then
      select value into strict key from jsonb_array_elements(d.publication->'privateItems') where value->'ref'=item->'ref';
      spec:=d.specs->(item->'ref'->>'id'); initial:='{}';scene:='{}';
      for path in select jsonb_object_keys(spec) loop
        initial:=jsonb_set(initial,array[path],key->'fixedSettings'#>string_to_array(path,'.'));
      end loop;
      for element in select jsonb_array_elements_text(item->'presentation'->'sceneElements') loop
        paths:=case element when 'detector' then array[]::text[] when 'tube' then array['sidCm']
          when 'marker' then array['sideMarker','markerPosition.x','markerPosition.y']
          when 'beam' then array['centralRay.x','centralRay.y','collimation.width','collimation.height'] else null end;
        if paths is null then raise exception 'unsupported scene' using errcode='55000'; end if;
        foreach path in array paths loop
          scene:=jsonb_set(scene,array[path],key->'fixedSettings'#>string_to_array(path,'.'));
        end loop;
      end loop;
      views:=jsonb_set(views,array[item->'ref'->>'id'],jsonb_build_object('controls',spec,'initial',initial,'sceneValues',scene));
    end if;
  end loop;
  return result || jsonb_build_object('views',views);
end $$;
revoke all on function assess.content_submit_v1(jsonb),assess.content_page_v1(uuid,integer),assess.content_read_v1(uuid),assess.content_install_v1(uuid,jsonb),assess.assigned_page_v1(uuid,integer),assess.read_mixed_session_v1(uuid) from public,anon,authenticated,assess_worker;
grant execute on function assess.content_submit_v1(jsonb),assess.content_page_v1(uuid,integer),assess.assigned_page_v1(uuid,integer),assess.read_mixed_session_v1(uuid) to authenticated;
grant execute on function assess.content_read_v1(uuid),assess.content_install_v1(uuid,jsonb) to assess_worker;


do $postcondition$
begin
 if (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled) then raise exception 'Launch gate must remain closed';end if;
end $postcondition$;
commit;
