-- RAD-105 S3 approved read extension. No changes to S2 or locked grant semantics.
begin;
create function assess.attempt_eligibility_page_v1(p_assignment uuid,p_after uuid default null,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a assess.assignments; gid uuid; ts timestamptz; rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if not exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-written-2026-11-02-v3') or not exists(select 1 from public.profiles where user_id=auth.uid() and consent_version is not null and consented_at is not null) then raise exception 'consent required' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then
  raise exception 'invalid page' using errcode='22023';
 end if;
 select * into a from assess.assignments where id=p_assignment and owner_id=auth.uid();
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 if not public.is_owner() then
  if not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
  then raise exception 'supervisor revoked' using errcode='42501'; end if;
  if not exists(select 1 from assess.all_students_assignments where assignment_id=a.id) then
   select group_id into gid from assess.assignment_scopes where assignment_id=a.id and supervisor_id=auth.uid();
   perform assess.supervised_group_v1(gid);
  end if;
 end if;
 ts:=clock_timestamp();
 with candidates as (
  select s.id,s.user_id,case
   when a.closed_at is not null or not v.available or w.assignment_id is null or w.closes_at<=ts then 'assignment-unavailable'
   when p.session_id is null then 'unknown-history'
   when not p.was_active then 'not-active-at-stop'
   when s.emergency_held_at is distinct from p.held_at or s.state<>'grading-failed' then 'not-held'
   when s.expires_at<=ts then 'expired'
   when p.granted_at is not null then 'already-granted'
   when (select count(*) from assess.stop_active_attempts proof join assess.sessions old on old.id=proof.session_id
     where old.assignment_id=a.id and old.user_id=s.user_id and proof.granted_at is not null)>=3 then 'grant-limit'
   else 'eligible' end reason
  from assess.sessions s join assess.targets t on t.assignment_id=s.assignment_id and t.user_id=s.user_id
  join assess.versions v on v.id=a.version_id
  left join assess.assignment_windows w on w.assignment_id=a.id
  left join assess.stop_active_attempts p on p.session_id=s.id
  where s.assignment_id=a.id and s.lifecycle_version=2 and (p_after is null or s.id>p_after)
  order by s.id limit p_limit
 ) select coalesce(jsonb_agg(jsonb_build_object('studentId',user_id,'sessionId',id,
   'eligible',reason='eligible','reason',reason,'serverTime',ts) order by id),'[]'::jsonb) into rows from candidates;
 return jsonb_build_object('version',1,'rows',rows,'serverTime',ts,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'sessionId' else null end);
end $$;
revoke all on function assess.attempt_eligibility_page_v1(uuid,uuid,integer)
 from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
grant execute on function assess.attempt_eligibility_page_v1(uuid,uuid,integer) to authenticated;
commit;
