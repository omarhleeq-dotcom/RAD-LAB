-- Approved additive S3 metadata reads. Existing publication/result writes stay unchanged.
begin;
create function assess.student_exams_page_v1(p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; ts timestamptz;
begin
 perform assess.scope_enter_v1(false);
 if not assess.name_entry_v1() or not assess.quiz_recipient_v1(auth.uid()) then raise exception 'student consent required' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 ts:=clock_timestamp();
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]'::jsonb) into rows from (
  select a.id,v.name,v.track,a.audience,w.opens_at "opensAt",w.closes_at "closesAt",a.closed_at is not null closed,
   s.id "sessionId",s.state,s.deadline,s.expires_at "expiresAt",s.emergency_held_at is not null held,
   coalesce(s.lease is not null and s.lease_until>ts,false) grading,
   exists(select 1 from assess.stop_active_attempts proof where proof.session_id=s.id and proof.was_active and proof.held_at=s.emergency_held_at and proof.granted_at is not null) "replacementGranted",
   exists(select 1 from assess.results r where r.session_id=s.id) "resultReady"
  from assess.targets t join assess.assignments a on a.id=t.assignment_id join assess.versions v on v.id=a.version_id
  left join assess.assignment_windows w on w.assignment_id=a.id
  left join lateral(select ss.* from assess.sessions ss where ss.assignment_id=a.id and ss.user_id=auth.uid() and ss.lifecycle_version=2 order by ss.ordinal desc limit 1) s on true
  where t.user_id=auth.uid() and v.available and v.schema_version=2 and (p_after is null or a.id>p_after)
  order by a.id limit p_limit
 ) q;
 return jsonb_build_object('version',1,'rows',rows,'serverTime',ts,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create function assess.history_page_v2(p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; last_id uuid;
begin
 perform assess.scope_enter_v1(false);
 if not assess.name_entry_v1() or not assess.quiz_recipient_v1(auth.uid()) then raise exception 'student consent required' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 with page as (
  select s.id from assess.sessions s join assess.results r on r.session_id=s.id
  join assess.assignments a on a.id=s.assignment_id join assess.targets t on t.assignment_id=a.id and t.user_id=auth.uid()
  join assess.versions v on v.id=a.version_id
  where s.user_id=auth.uid() and s.lifecycle_version=2 and s.state='graded' and s.expires_at>clock_timestamp()
   and v.available and v.schema_version=2 and (p_after is null or s.id>p_after)
  order by s.id limit p_limit
 ), projected as(select id,assess.result_v2(id) dto from page)
 select coalesce(jsonb_agg(dto order by id),'[]'::jsonb),(array_agg(id order by id desc))[1] into rows,last_id from projected;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then last_id else null end);
end $$;

create function assess.selfservice_metadata_page_v1(p_kind text,p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; ts timestamptz;
begin
 perform assess.scope_enter_v1(false);
 if not exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-written-2026-11-02-v3') or not exists(select 1 from public.profiles where user_id=auth.uid() and consent_version is not null and consented_at is not null) then raise exception 'consent required' using errcode='42501'; end if;
 if not public.is_owner() and not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null) then raise exception 'supervisor required' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 or p_kind is null or p_kind not in ('versions','assignments') then raise exception 'invalid page' using errcode='22023'; end if;
 ts:=clock_timestamp();
 if p_kind='versions' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]'::jsonb) into rows from (
   select v.id,v.name,v.track,(pub.document->'assessment'->'policy'->>'durationSeconds')::integer "durationSeconds"
   from assess.versions v join assess.publications pub on pub.version_id=v.id
   join assess.content_submissions c on c.version_id=v.id and c.state='installed'
   join assess.authoring_publication_links l on l.version_id=v.id
   join assess.authoring_revisions r on r.draft_id=l.draft_id and r.revision=l.draft_revision and r.digest=l.source_digest
   where v.available and v.schema_version=2 and (public.is_owner() or v.owner_id=auth.uid()) and (p_after is null or v.id>p_after)
   order by v.id limit p_limit
  ) q;
 else
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]'::jsonb) into rows from (
   select a.id,a.version_id "versionId",v.name,v.track,(pub.document->'assessment'->'policy'->>'durationSeconds')::integer "durationSeconds",
    a.revision,a.audience,a.closed_at "closedAt",w.opens_at "opensAt",w.closes_at "closesAt"
   from assess.assignments a join assess.versions v on v.id=a.version_id join assess.publications pub on pub.version_id=v.id
   left join assess.assignment_windows w on w.assignment_id=a.id
   where a.owner_id=auth.uid() and v.schema_version=2 and v.available and (p_after is null or a.id>p_after)
   and (public.is_owner() or a.audience='all-students' or exists(
    select 1 from assess.assignment_scopes s join assess.groups g on g.id=s.group_id
    where s.assignment_id=a.id and s.supervisor_id=auth.uid() and g.supervisor_id=auth.uid() and g.ended_at is null and g.ends_at>ts))
   order by a.id limit p_limit
  ) q;
 end if;
 return jsonb_build_object('version',1,'rows',rows,'serverTime',ts,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
revoke all on function assess.student_exams_page_v1(uuid,integer),assess.history_page_v2(uuid,integer),assess.selfservice_metadata_page_v1(text,uuid,integer)
 from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
grant execute on function assess.student_exams_page_v1(uuid,integer),assess.history_page_v2(uuid,integer),assess.selfservice_metadata_page_v1(text,uuid,integer) to authenticated;
commit;
