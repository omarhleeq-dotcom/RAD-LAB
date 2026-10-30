-- RAD-062 M07: deferred after M01-M06. Owner-first, private manual grading.
-- Readiness: explicit M01-M07 synthetic PostgreSQL, ACL and v1 catalogue proof.
-- Before use: remove only these new functions in a reviewed transaction.
-- After use: preserve final results/receipts; reviewed forward-fix only.
-- No existing function bodies, tables, runtime grants or emergency packets change.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $$ begin
 if to_regprocedure('assess.finish_v2(uuid,uuid,text,text)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
 then raise exception 'M01-M06, exact inventory and closed gate required' using errcode='55000'; end if;
end $$;

-- Same capacity -> scope -> assignment -> session order as start/read/D3.
-- Owner-only first: no global supervisor/grading-worker capability. Management
-- transferred through D3 is explicit; owning another assignment gives no access.
create function assess.manual_authorize_v1(p_session uuid) returns assess.sessions
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; assignment uuid; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.owner_scope_enter_v1(false);
 perform assess.scope_enter_v1(false); -- also rejects Assess account stops
 select assignment_id into assignment from assess.sessions where id=p_session;
 perform 1 from assess.assignments where id=assignment for share;
 select * into s from assess.sessions where id=p_session for update;
 if not public.is_owner() or s.id is null or s.lifecycle_version<>2 or not exists(
  select 1 from assess.assignments a where a.id=s.assignment_id and
   (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())))
 or (s.expires_at is not null and s.expires_at<=clock_timestamp())
 then raise exception 'grading denied' using errcode='42501'; end if;
 if s.emergency_held_at is not null then raise exception 'attempt emergency held' using errcode='55000'; end if;
 return s;
end $$;

create function assess.manual_queue_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.owner_scope_enter_v1(false);
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select s.id,s.assignment_id,s.submitted_at,s.submitted_at+interval '7 days' finalize_before,w.grading_revision
  from assess.sessions s join assess.assignments a on a.id=s.assignment_id join assess.manual_work_v1 w on w.session_id=s.id
  where s.lifecycle_version=2 and s.state='awaiting-manual' and w.automatic_complete and s.emergency_held_at is null
   and s.submitted_at>clock_timestamp()-interval '7 days' and (p_after is null or s.id>p_after)
   and (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid()))
  order by s.id limit p_limit
 ) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create function assess.manual_read_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; items jsonb; w assess.manual_work_v1; begin
 s:=assess.manual_authorize_v1(p_session);
 if s.state<>'awaiting-manual' or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'grading unavailable' using errcode='55000'; end if;
 select * into strict w from assess.manual_work_v1 where session_id=s.id;
 select jsonb_agg(jsonb_build_object('item',i->'ref','prompt',i->>'prompt','maximum',m->>'maximum',
  'answer',coalesce(d.answers->(i->'ref'->>'id')->>'text',''),
  'score',case when x.item_id is null then null else x.score_n::text end) order by ord) into items
 from assess.session_details d cross join lateral jsonb_array_elements(d.publication->'assessment'->'items') with ordinality t(i,ord)
 join lateral jsonb_array_elements(d.publication->'itemMarks') m on m->'item'=i->'ref'
 left join assess.manual_item_scores_v1 x on x.session_id=s.id and x.item_id=i->'ref'->>'id' and x.item_version=i->'ref'->>'version'
 where d.session_id=s.id and i->>'type'='written-answer';
 return jsonb_build_object('attemptId',s.id,'gradingRevision',w.grading_revision,'operationCount',w.operation_count,
  'finalizeBefore',s.submitted_at+interval '7 days','items',items);
end $$;

create function assess.manual_score_v1(p_session uuid,p_operation uuid,p_revision integer,p_scores jsonb,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; w assess.manual_work_v1; e jsonb; doc jsonb; maximum numeric; prior assess.manual_item_scores_v1;
 old_events integer; replay_revision integer; begin
 s:=assess.manual_authorize_v1(p_session);
 if s.state<>'awaiting-manual' or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'grading unavailable' using errcode='55000'; end if;
 if p_operation is null or p_revision is null or p_revision not between 0 and 100 or p_reason is null
 or p_reason not in ('initial','correction','owner-takeover') or p_scores is null
 or jsonb_typeof(p_scores)<>'array' or pg_column_size(p_scores)>65536 then raise exception 'invalid grading operation' using errcode='22023'; end if;
 if jsonb_array_length(p_scores) not between 1 and 10 then raise exception 'invalid batch' using errcode='22023'; end if;
 select * into strict w from assess.manual_work_v1 where session_id=s.id for update;
 if not w.automatic_complete then raise exception 'automatic grading required' using errcode='55000'; end if;
 select publication into strict doc from assess.session_details where session_id=s.id;
 for e in select value from jsonb_array_elements(p_scores) loop
  if jsonb_typeof(e)<>'object' or (select count(*) from jsonb_object_keys(e))<>2 or not(e ?& array['item','score'])
   or jsonb_typeof(e->'item')<>'object' or (select count(*) from jsonb_object_keys(e->'item'))<>2
   or not(e->'item' ?& array['id','version']) or jsonb_typeof(e->'score')<>'string'
   or (e->>'score')!~'^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$'
   or jsonb_typeof(e->'item'->'id')<>'string' or jsonb_typeof(e->'item'->'version')<>'string'
  then raise exception 'invalid score' using errcode='22023'; end if;
  select (m->>'maximum')::numeric into maximum from jsonb_array_elements(doc->'itemMarks') m
   join jsonb_array_elements(doc->'assessment'->'items') i on i->'ref'=m->'item'
   where i->>'type'='written-answer' and i->'ref'=e->'item';
  if maximum is null or (e->>'score')::numeric>maximum then raise exception 'item maximum exceeded' using errcode='22023'; end if;
 end loop;
 if (select count(distinct value->'item') from jsonb_array_elements(p_scores))<>jsonb_array_length(p_scores)
 then raise exception 'duplicate item' using errcode='22023'; end if;
 select count(*),min(grading_revision) into old_events,replay_revision from assess.manual_events_v1 where session_id=s.id and operation_id=p_operation;
 if old_events>0 then
  if old_events<>jsonb_array_length(p_scores) or replay_revision<>p_revision+1 or exists(
   select 1 from assess.manual_events_v1 v where v.session_id=s.id and v.operation_id=p_operation
   and (v.grader_id is distinct from auth.uid() or v.reason_code<>p_reason or not exists(
    select 1 from jsonb_array_elements(p_scores) x where x->'item'=jsonb_build_object('id',v.item_id,'version',v.item_version)
     and (x->>'score')::numeric*v.new_d=v.new_n)))
  then raise exception 'operation reused' using errcode='22023'; end if;
  return jsonb_build_object('operationId',p_operation,'gradingRevision',replay_revision);
 end if;
 if w.grading_revision<>p_revision then raise exception 'stale grading revision' using errcode='40001'; end if;
 if w.operation_count>=100 then raise exception 'grading operation limit' using errcode='54000'; end if;
 for e in select value from jsonb_array_elements(p_scores) loop
  select * into prior from assess.manual_item_scores_v1 where session_id=s.id and item_id=e->'item'->>'id' and item_version=e->'item'->>'version';
  insert into assess.manual_events_v1(session_id,operation_id,item_id,item_version,grading_revision,grader_id,old_n,old_d,new_n,new_d,reason_code)
   values(s.id,p_operation,e->'item'->>'id',e->'item'->>'version',p_revision+1,auth.uid(),prior.score_n,prior.score_d,(e->>'score')::numeric,1,p_reason);
  insert into assess.manual_item_scores_v1 values(s.id,e->'item'->>'id',e->'item'->>'version',s.revision,p_revision+1,(e->>'score')::numeric,1,auth.uid())
   on conflict(session_id,item_id,item_version) do update set grading_revision=excluded.grading_revision,score_n=excluded.score_n,score_d=1,grader_id=excluded.grader_id;
 end loop;
 update assess.manual_work_v1 set grading_revision=grading_revision+1,operation_count=operation_count+1 where session_id=s.id;
 return jsonb_build_object('operationId',p_operation,'gradingRevision',p_revision+1);
end $$;

create function assess.manual_receipt_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; receipt jsonb; begin
 s:=assess.manual_authorize_v1(p_session);
 select to_jsonb(r) into receipt from assess.manual_final_receipts_v1 r where r.session_id=s.id;
 return receipt;
end $$;

create function assess.manual_finalize_v1(p_session uuid,p_operation uuid,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; w assess.manual_work_v1; r assess.manual_final_receipts_v1; doc jsonb;
 manual_micro numeric; n numeric; d numeric; factor numeric; graders integer; begin
 s:=assess.manual_authorize_v1(p_session);
 if p_operation is null or p_revision is null or p_revision not between 0 and 100 then raise exception 'invalid finalize' using errcode='22023'; end if;
 select * into r from assess.manual_final_receipts_v1 where session_id=s.id;
 if r.session_id is not null then
  if r.final_operation_id<>p_operation or r.expected_grading_revision<>p_revision or r.final_grader_id is distinct from auth.uid()
  then raise exception 'final already committed' using errcode='55000'; end if;
  return to_jsonb(r);
 end if;
 if s.state<>'awaiting-manual' or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'grading unavailable' using errcode='55000'; end if;
 select * into strict w from assess.manual_work_v1 where session_id=s.id for update;
 if not w.automatic_complete or w.grading_revision<>p_revision then raise exception 'stale grading revision' using errcode='40001'; end if;
 select publication into strict doc from assess.session_details where session_id=s.id;
 if exists(select 1 from jsonb_array_elements(doc->'assessment'->'items') i where i->>'type'='written-answer'
  and not exists(select 1 from assess.manual_item_scores_v1 x where x.session_id=s.id and i->'ref'=jsonb_build_object('id',x.item_id,'version',x.item_version)))
 then raise exception 'explicit score required for every written item' using errcode='55000'; end if;
 -- Decimal scores have <=6 places. Integer micro-points avoid rounding an
 -- automatic rational such as 1/3 before combining; reduce only at the end.
 select coalesce(sum(score_n*div(1000000,score_d)),0) into manual_micro from assess.manual_item_scores_v1 where session_id=s.id;
 n:=w.automatic_n*1000000+manual_micro*w.automatic_d; d:=w.automatic_d*1000000;
 factor:=gcd(n,d); n:=div(n,factor); d:=div(d,factor);
 if n>(doc->'assessment'->>'maximum')::numeric*d then raise exception 'invalid final total' using errcode='22023'; end if;
 select count(distinct grader_id) into graders from assess.manual_events_v1 where session_id=s.id;
 insert into assess.results values(s.id,n,d,(doc->'assessment'->>'maximum')::numeric,doc->'assessment'->>'name',doc->'assessment'->>'track',doc->'assessment'->'policy'->>'gradeVisibility');
 insert into assess.manual_final_receipts_v1(session_id,final_operation_id,expected_grading_revision,final_grading_revision,final_grader_id,operation_count,grader_count,policy_version)
  values(s.id,p_operation,p_revision,p_revision+1,auth.uid(),w.operation_count,graders,1) returning * into r;
 update assess.sessions set state='graded',revision=revision+1,expires_at=((submitted_at at time zone 'UTC')+interval '6 months') at time zone 'UTC',lease=null,lease_until=null,retry_at=null,failed_at=null where id=s.id;
 delete from assess.receipts where session_id=s.id;
 delete from assess.session_details where session_id=s.id; -- cascades every transient manual store
 return to_jsonb(r);
end $$;

do $acl$ declare f record; role_name text; begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='assess'::regnamespace and proname=any(array[
 'manual_authorize_v1','manual_queue_v1','manual_read_v1','manual_score_v1','manual_finalize_v1','manual_receipt_v1']) loop
  execute format('revoke all on function %s from public',f.signature);
  for role_name in select rolname from pg_roles where rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge','assess_grading_worker') loop
   execute format('revoke all on function %s from %I',f.signature,role_name);
  end loop;
 end loop;
end $acl$;
commit;
