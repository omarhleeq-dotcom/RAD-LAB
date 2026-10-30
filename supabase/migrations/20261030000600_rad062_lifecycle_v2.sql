-- RAD-062 M06: private, deferred lifecycle after M01-M05. No runtime grants.
-- Readiness: explicit M01-M06 local rehearsal; v1 identity/ACL/config preserved.
-- Before use: restore saved v1 definitions and remove M06 objects/column in a
-- reviewed transaction. After use: retain snapshots and forward-fix; never drop v1.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $$ begin
 if to_regprocedure('assess.freeze_v2()') is null or to_regprocedure('assess.pool_start_v2(uuid)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
 then raise exception 'M01-M05, exact inventory and closed gate required' using errcode='55000'; end if;
end $$;
-- Persisted discriminator survives detail deletion. Caller cannot choose/change it.
alter table assess.sessions add column lifecycle_version integer not null default 1 check(lifecycle_version in (1,2));
update assess.sessions s set lifecycle_version=v.schema_version from assess.assignments a join assess.versions v on v.id=a.version_id where a.id=s.assignment_id;
create function assess.lifecycle_version_guard_v2() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if tg_op='INSERT' then
  select v.schema_version into new.lifecycle_version from assess.assignments a join assess.versions v on v.id=a.version_id where a.id=new.assignment_id;
 elsif new.lifecycle_version is distinct from old.lifecycle_version or new.assignment_id is distinct from old.assignment_id then
  raise exception 'immutable attempt version' using errcode='55000';
 end if;
 return new;
end $$;
create trigger rad062_lifecycle_version before insert or update on assess.sessions for each row execute function assess.lifecycle_version_guard_v2();
create function assess.require_lifecycle_v2(p_session uuid,p_version integer) returns void
language plpgsql security definer set search_path='' as $$ declare actual integer; begin
 select lifecycle_version into actual from assess.sessions where id=p_session for update;
 if actual is distinct from p_version then raise exception 'attempt version denied' using errcode='42501'; end if;
end $$;
create function assess.not_held_v2(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 perform assess.require_lifecycle_v2(p_session,2);
 if exists(select 1 from assess.sessions where id=p_session and emergency_held_at is not null) then
  raise exception 'attempt emergency held' using errcode='55000'; end if;
end $$;
create function assess.session_authorize_v2(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 -- Same ordering as the P4 pool and revocation/erasure boundary.
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.scope_enter_v1(false);
 perform 1 from assess.assignments where id=p_assignment for share;
 perform 1 from assess.targets where assignment_id=p_assignment and user_id=auth.uid() for share;
 if not found or not assess.name_entry_v1() or not exists(
  select 1 from assess.assignments a join assess.versions v on v.id=a.version_id
  where a.id=p_assignment and v.available and v.schema_version=2 and v.track in ('mixed','full-practical'))
 then raise exception 'assignment version/target denied' using errcode='42501'; end if;
end $$;
-- A final result/receipt never contains answer text or an answer digest. Transient
-- command receipts retain only the existing replay digest and metadata ACK.
create function assess.written_snapshot_guard_v2() returns trigger
language plpgsql security definer set search_path='' as $$ declare entry record; begin
 if (select lifecycle_version from assess.sessions where id=new.session_id)<>2 then return new; end if;
 if new.publication->>'schemaVersion' is distinct from '2'
 or (select count(*) from jsonb_array_elements(new.publication->'assessment'->'items') i where i->>'type'='written-answer')>10
 then raise exception 'invalid written snapshot' using errcode='22023'; end if;
 for entry in select * from jsonb_each(new.answers) loop
  if entry.value->>'type'='written-answer' and (
   entry.value-array['type','text']<>'{}' or jsonb_typeof(entry.value->'text') is distinct from 'string'
   or char_length(entry.value->>'text')>4000)
  then raise exception 'invalid written answer' using errcode='22023'; end if;
 end loop;
 return new;
end $$;
create trigger rad062_written_snapshot before insert or update on assess.session_details for each row execute function assess.written_snapshot_guard_v2();
-- Work exists even if the automatic worker fails or freeze captures active text.
create function assess.submitted_work_v2() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if new.lifecycle_version=2 and new.submitted_at is not null and exists(
  select 1 from assess.session_details d,jsonb_array_elements(d.publication->'assessment'->'items') i
  where d.session_id=new.id and i->>'type'='written-answer') then
  insert into assess.manual_work_v1(session_id) values(new.id) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger rad062_submitted_work after update on assess.sessions for each row execute function assess.submitted_work_v2();
create function assess.validate_answer_v2(p_item jsonb,p_spec jsonb,p_answer jsonb) returns void
language plpgsql security definer set search_path='' as $$ begin
 if p_item->>'type'='written-answer' then
  if jsonb_typeof(p_answer) is distinct from 'object' or p_answer->>'type' is distinct from 'written-answer'
   or p_answer-array['type','text']<>'{}' or jsonb_typeof(p_answer->'text') is distinct from 'string'
   or char_length(p_answer->>'text')>4000 then raise exception 'invalid written answer' using errcode='22023'; end if;
 else perform assess.validate_answer_v1(p_item,p_spec,p_answer); end if;
end $$;


create function assess.read_session_v2(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details;
begin
  perform assess.session_authorize_v2((select assignment_id from assess.sessions where id=p_session and user_id=auth.uid()));
  perform assess.require_lifecycle_v2(p_session,2);
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v2(s.assignment_id);
  if s.expires_at is not null and clock_timestamp()>=s.expires_at then raise exception 'expired' using errcode='42501'; end if;
  if s.emergency_held_at is null and s.state='active' and clock_timestamp()>=s.deadline then
    update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
  end if;
  select * into d from assess.session_details where session_id=s.id;
  return jsonb_build_object('attemptId',s.id,'ack',assess.session_ack_v1(s.id,null)) ||
    case when (select state='active' from assess.sessions where id=s.id) then
      jsonb_build_object('assessment',d.publication->'assessment','answers',d.answers) else '{}'::jsonb end;
end $$;

create function assess.start_v2(p_assignment uuid,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc jsonb; sp jsonb; s assess.sessions; n integer; ts timestamptz; duration integer; prior uuid;
begin
  if not exists(select 1 from assess.launch_gate where enabled) then raise exception 'launch gate closed' using errcode='55000'; end if;
  if p_operation is null then raise exception 'invalid start operation' using errcode='22023'; end if;
  -- Per-user/assignment reservation serialises starts, including starts after finalisation/purge.
  perform assess.session_authorize_v2(p_assignment);
  -- Assignment SHARE and profile SHARE locks already held by session_authorize.
  -- Close/disable take UPDATE on those same rows until COMMIT.
  if exists(select 1 from assess.assignments where id=p_assignment and closed_at is not null)
    or exists(select 1 from assess.account_stops where user_id=auth.uid()) then
    raise exception 'new starts disabled' using errcode='42501'; end if;
  perform 1 from assess.assignments where id=p_assignment for share;
  insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;
  select used into n from assess.reservations where assignment_id=p_assignment and user_id=auth.uid() for update;
  perform assess.session_authorize_v2(p_assignment);
  select (starts->>p_operation::text)::uuid into prior from assess.reservations where assignment_id=p_assignment and user_id=auth.uid();
  if prior is not null then
    if not exists(select 1 from assess.sessions where id=prior and (expires_at is null or clock_timestamp()<expires_at)) then
      raise exception 'start no longer available' using errcode='55000'; end if;
    perform assess.not_held_v2(prior);
    return assess.read_session_v2(prior);
  end if;
  if (select count(*) from assess.reservations r, jsonb_object_keys(r.starts) k where r.assignment_id=p_assignment and r.user_id=auth.uid())>=20000 then
    raise exception 'start operation limit' using errcode='54000'; end if;
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid() and state='active' for update;
  ts:=clock_timestamp();
  if s.id is not null then
    perform assess.not_held_v2(s.id);
    if s.deadline is not null and ts>=s.deadline then
      update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
    end if;
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    perform assess.not_held_v2(s.id);
    return assess.read_session_v2(s.id);
  end if;
  -- A pending/failing grade cannot accidentally reserve another attempt on a lost start response.
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid()
    and state in ('grading','grading-failed','awaiting-manual') order by ordinal desc limit 1;
  if s.id is not null then
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    perform assess.not_held_v2(s.id);
    return assess.read_session_v2(s.id); end if;
  select p.document,p.specs into doc,sp from assess.publications p join assess.assignments a on a.version_id=p.version_id where a.id=p_assignment;
  if doc is null then raise exception 'publication unavailable' using errcode='55000'; end if;
  if n >= (doc->'assessment'->'policy'->>'maxAttempts')::integer then raise exception 'attempt limit' using errcode='54000'; end if;
  duration:=(doc->'assessment'->'policy'->>'durationSeconds')::integer;
  -- S-ASSESS-15: first pilot is timed-only; future untimed retention needs its own policy.
  if duration is null or duration not between 1 and 604800 or (doc->'assessment'->'policy'->>'maxAttempts') is null or (doc->'assessment'->'policy'->>'maxAttempts')::integer not between 1 and 1000 then raise exception 'untimed retention not configured' using errcode='55000'; end if;
  insert into assess.sessions(assignment_id,user_id,ordinal,started_at,deadline)
    values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;
  update assess.reservations set used=n+1,starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
  -- Selection, reserved capacity, session and start operation commit together.
  perform assess.pool_start_v2(s.id);
  perform assess.not_held_v2(s.id);
  return assess.read_session_v2(s.id);
end $$;

create function assess.command_v2(p_session uuid,p_operation uuid,p_revision integer,p_action jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details; r assess.receipts; b jsonb; a jsonb; item jsonb; iid text; ts timestamptz;
begin
  perform assess.session_authorize_v2((select assignment_id from assess.sessions where id=p_session and user_id=auth.uid()));
  perform assess.not_held_v2(p_session);
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v2(s.assignment_id);
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
    perform assess.validate_answer_v2(item,d.specs->iid,p_action->'answer');
    if d.locked ? iid then raise exception 'item locked' using errcode='55000'; end if;
    if p_action->>'type'='expose' and item->>'type' in ('single-choice','written-answer') then raise exception 'invalid exposure' using errcode='22023'; end if;
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

create function assess.read_mixed_session_v2(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; d assess.session_details; item jsonb; key jsonb; spec jsonb; views jsonb:='{}'; initial jsonb; scene jsonb; path text; element text; paths text[];
begin
  result:=assess.read_session_v2(p_session); -- locks session and rechecks identity/target/expiry
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

create function assess.read_practical_session_v2(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; views jsonb; pinned jsonb;
begin
  result:=assess.read_session_v2(p_session); -- C owns identity/target, row lock, time and terminal-detail deletion.
  if result->'ack'->>'state'<>'active' then return result; end if;
  if result->'assessment'->>'track'<>'full-practical' then raise exception 'practical only' using errcode='55000'; end if;
  pinned:=result->'assessment'->'ref';
  -- Resolve the immutable snapshot's version, never a newest-version or mutable assignment lookup.
  select p.views into strict views from assess.practical_presentations p join assess.versions v on v.id=p.version_id
    where v.assessment_id=(pinned->>'id')::uuid and v.version=pinned->>'version';
  return result || jsonb_build_object('views',views);
end $$;

-- P8 owns maintenance/recovery/health. This bounded claim tick settles one
-- deadline and one expired lease, then claims an eligible automatic job only.
create function assess.claim_v2() returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; d assess.session_details; ts timestamptz:=clock_timestamp(); token uuid:=gen_random_uuid(); begin
 with due as (select id from assess.sessions where lifecycle_version=2 and emergency_held_at is null
  and state='active' and deadline<=ts order by deadline,id limit 1 for update skip locked)
 update assess.sessions target set state='grading',submitted_at=deadline,revision=revision+1 from due where target.id=due.id;
 with due as (select id from assess.sessions where lifecycle_version=2 and emergency_held_at is null and state='grading'
  and (lease_until<=ts or (lease_until is null and submitted_at<=ts-interval '24 hours')) order by submitted_at,id limit 1 for update skip locked)
 update assess.sessions target set state='grading-failed',failed_at=coalesce(failed_at,ts),lease=null,lease_until=null,
  retry_at=case when ts<submitted_at+interval '24 hours' then ts+interval '1 minute' else submitted_at+interval '7 days' end
 from due where target.id=due.id;
 select * into s from assess.sessions where lifecycle_version=2 and emergency_held_at is null
  and state in ('grading','grading-failed') and submitted_at>ts-interval '7 days'
  and (retry_at is null or retry_at<=ts) and (lease_until is null or lease_until<=ts)
  and not exists(select 1 from assess.manual_work_v1 w where w.session_id=sessions.id and w.automatic_complete)
  order by submitted_at,id limit 1 for update skip locked;
 if s.id is null then return null; end if;
 update assess.sessions set state='grading',lease=token,lease_until=ts+interval '5 minutes' where id=s.id;
 select * into strict d from assess.session_details where session_id=s.id;
 return jsonb_build_object('attemptId',s.id,'token',token,'publication',d.publication,
  -- The worker never needs written text. Retain it only in session_details.
  'answers',(select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(d.answers) where value->>'type'<>'written-answer'),'locked',d.locked);
end $$;


create function assess.finish_v2(p_session uuid,p_token uuid,p_n text,p_d text) returns void
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; doc jsonb; maximum numeric;
begin
  perform assess.not_held_v2(p_session);
  select * into s from assess.sessions where id=p_session for update;
  if s.state in ('graded','awaiting-manual') and s.lease=p_token and p_token is not null then return; end if;
  if p_token is null or s.state is distinct from 'grading' or s.lease is distinct from p_token or s.lease_until is null or s.lease_until<=clock_timestamp()
    or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'stale grading claim' using errcode='40001'; end if;
  select publication into strict doc from assess.session_details where session_id=s.id;
  select coalesce(sum((m->>'maximum')::numeric),0) into maximum from jsonb_array_elements(doc->'itemMarks') m
  join jsonb_array_elements(doc->'assessment'->'items') i on i->'ref'=m->'item' where i->>'type'<>'written-answer';
  if p_n is null or p_d is null or length(p_n)>1000 or length(p_d)>1000 or p_n!~'^[0-9]+$' or p_d!~'^[1-9][0-9]*$'
    or p_d::numeric<=0 or p_n::numeric>maximum*p_d::numeric then raise exception 'invalid grade' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(doc->'assessment'->'items') i where i->>'type'='written-answer') then
    insert into assess.manual_work_v1(session_id,automatic_complete,automatic_n,automatic_d)
      values(s.id,true,p_n::numeric,p_d::numeric)
      on conflict(session_id) do update set automatic_complete=true,automatic_n=excluded.automatic_n,automatic_d=excluded.automatic_d;
    update assess.sessions set state='awaiting-manual',revision=revision+1,lease_until=null,retry_at=null,failed_at=null where id=s.id;
    return;
  end if;
  maximum:=(doc->'assessment'->>'maximum')::numeric;
  insert into assess.results values(s.id,p_n::numeric,p_d::numeric,maximum,doc->'assessment'->>'name',doc->'assessment'->>'track',doc->'assessment'->'policy'->>'gradeVisibility');
  -- timestamptz + interval month must use UTC even on providers with a different session timezone.
  update assess.sessions set state='graded',revision=revision+1,expires_at=((submitted_at at time zone 'UTC')+interval '6 months') at time zone 'UTC',lease_until=null,retry_at=null,failed_at=null where id=s.id;
  delete from assess.receipts where session_id=s.id;
  delete from assess.session_details where session_id=s.id;
end $$;

create function assess.fail_v2(p_session uuid,p_token uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform assess.not_held_v2(p_session);
  update assess.sessions set state='grading-failed',failed_at=coalesce(failed_at,clock_timestamp()),
    retry_at=case when clock_timestamp()<submitted_at+interval '24 hours' then clock_timestamp()+interval '1 minute' else submitted_at+interval '7 days' end,
    lease=null,lease_until=null
  where id=p_session and submitted_at>clock_timestamp()-interval '7 days' and state='grading' and lease=p_token and lease_until>clock_timestamp();
  if not found then raise exception 'stale grading claim' using errcode='40001'; end if;
end $$;

create function assess.result_v2(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; assignment uuid;
begin
  select assignment_id into assignment from assess.sessions where id=p_session and user_id=auth.uid();
  if assignment is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v2(assignment);
  perform assess.require_lifecycle_v2(p_session,2);
  select jsonb_build_object('name',r.name,'track',r.track,'submittedAt',to_char(s.submitted_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'grade',case when r.visibility='hidden' then '{"visibility":"hidden"}'::jsonb else
      jsonb_build_object('visibility','shown','earned',round(div(2*r.earned_n*100+r.earned_d,2*r.earned_d)/100,2)::text,'maximum',round(r.maximum,2)::text) end)
  into result from assess.results r join assess.sessions s on s.id=r.session_id
  where s.state='graded' and s.id=p_session and s.user_id=auth.uid() and clock_timestamp()<s.expires_at;
  -- Current account/target permission is checked for results too; no exam body is returned.
  if result is null then raise exception 'result unavailable' using errcode='42501'; end if;
  return result;
end $$;

-- Forward-only version guards preserve v1 signatures, OIDs, ownership, ACL and
-- configuration. pg_get_functiondef keeps all attributes; only reviewed body
-- anchors are changed. A missing anchor aborts the complete M06 transaction.
do $isolate$ declare name text; def text; patched text; begin
 foreach name in array array['read_session_v1(uuid)','command_v1(uuid,uuid,integer,jsonb)',
  'result_v1(uuid)','finish_v1(uuid,uuid,text,text)','fail_v1(uuid,uuid)','recover_v1(uuid)'] loop
  def:=pg_get_functiondef(('assess.'||name)::regprocedure);
  patched:=replace(def,E'begin\n',E'begin\n  perform assess.require_lifecycle_v2(p_session,1);\n');
  if patched=def then raise exception 'missing v1 entry anchor: %',name; end if;
  execute patched;
 end loop;
 foreach name in array array['claim_v1()','maintain_v1(integer)'] loop
  def:=pg_get_functiondef(('assess.'||name)::regprocedure);
  patched:=replace(def,'from assess.sessions where','from assess.sessions where lifecycle_version=1 and');
  if patched=def then raise exception 'missing v1 scan anchor: %',name; end if;
  if name='maintain_v1(integer)' then
   patched:=replace(patched,'where a.closed_at is not null', 'where exists(select 1 from assess.versions v where v.id=a.version_id and v.schema_version=1) and a.closed_at is not null');
  end if;
  execute patched;
 end loop;
 def:=pg_get_functiondef('assess.health_v1()'::regprocedure);
 patched:=replace(def,'from assess.sessions','from assess.sessions where lifecycle_version=1');
 if patched=def then raise exception 'missing v1 health anchor'; end if;
 execute patched;
 -- start already authorizes schema=1, but explicit protection also covers replay.
 def:=pg_get_functiondef('assess.start_v1(uuid,uuid)'::regprocedure);
 patched:=replace(def,E'begin\n',E'begin\n  if not exists(select 1 from assess.assignments a join assess.versions v on v.id=a.version_id where a.id=p_assignment and v.schema_version=1) then raise exception ''assignment version denied'' using errcode=''42501''; end if;\n');
 if patched=def then raise exception 'missing v1 start anchor'; end if;
 execute patched;
end $isolate$;

do $acl$ declare f record; role_name text; begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='assess'::regnamespace and proname=any(array[
 'lifecycle_version_guard_v2','require_lifecycle_v2','not_held_v2','session_authorize_v2','written_snapshot_guard_v2','submitted_work_v2','validate_answer_v2',
 'start_v2','read_session_v2','read_mixed_session_v2','read_practical_session_v2','command_v2','claim_v2','finish_v2','fail_v2','result_v2']) loop
  execute format('revoke all on function %s from public',f.signature);
  for role_name in select rolname from pg_roles where rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge','assess_grading_worker') loop
   execute format('revoke all on function %s from %I',f.signature,role_name);
  end loop;
 end loop;
end $acl$;
commit;
