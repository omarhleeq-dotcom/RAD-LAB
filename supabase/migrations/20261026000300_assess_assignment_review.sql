-- RAD-085 LOCAL ONLY. No publication creator/installer or worker grant is added.
begin;
-- Later trusted publisher contract: only AFTER existing validators + required independent
-- reviews + immutable installation, bind the exact private author revision to that version.
-- No API role (including assess_worker) can write this table in this local batch.
create table assess.authoring_publication_links (
 version_id uuid primary key references assess.versions(id),
 draft_id uuid not null, draft_revision integer not null, source_digest text not null,
 foreign key(draft_id,draft_revision) references assess.authoring_revisions(draft_id,revision),
 unique(draft_id,draft_revision)
);
create table assess.assignment_reviews (
 id uuid primary key, writer_id uuid not null references public.profiles(user_id) on delete cascade,
 group_id uuid not null references assess.groups(id), group_revision integer not null,
 appointment_revision integer not null,
 draft_id uuid not null, draft_revision integer not null,
 version_id uuid not null references assess.versions(id), source_digest text not null,
 expires_at timestamptz not null, created_at timestamptz not null,
 assignment_id uuid unique references assess.assignments(id),
 foreign key(draft_id,draft_revision) references assess.authoring_revisions(draft_id,revision)
);
create index assess_assignment_reviews_writer on assess.assignment_reviews(writer_id,id);
create table assess.assignment_review_targets (
 review_id uuid not null references assess.assignment_reviews(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 period_id uuid not null references assess.membership_periods(id),
 visible_from timestamptz not null, primary key(review_id,user_id)
);
create table assess.assignment_scopes (
 assignment_id uuid primary key references assess.assignments(id) on delete cascade,
 group_id uuid not null references assess.groups(id),
 supervisor_id uuid not null references public.profiles(user_id),
 review_id uuid not null unique references assess.assignment_reviews(id)
);
create index assess_assignment_scopes_group on assess.assignment_scopes(group_id,assignment_id);

create function assess.linked_version_v1(p_draft uuid,p_revision integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
 select l.version_id into v from assess.authoring_publication_links l
 join assess.authoring_revisions r on r.draft_id=l.draft_id and r.revision=l.draft_revision and r.digest=l.source_digest
 join assess.authoring_drafts d on d.id=l.draft_id
 join assess.versions a on a.id=l.version_id and a.owner_id=d.writer_id and a.track=d.track and a.schema_version=1 and a.available
 join assess.content_submissions c on c.version_id=a.id and c.state='installed'
 join assess.publications pub on pub.version_id=a.id
 where l.draft_id=p_draft and l.draft_revision=p_revision
 and (a.track='mixed' or exists(select 1 from assess.practical_presentations p where p.version_id=a.id));
 if v is null then raise exception 'reviewed installed publication required' using errcode='55000'; end if;
 return v;
end $$;
-- Read/prepare retries must not leak a frozen count after a leave/re-consent/revocation.
create function assess.review_current_v1(p_review uuid) returns assess.assignment_reviews
language plpgsql security definer set search_path='' as $$
declare r assess.assignment_reviews; g assess.groups; d assess.authoring_drafts;
begin
 select * into r from assess.assignment_reviews where id=p_review and writer_id=auth.uid();
 if r.id is null then raise exception 'review denied' using errcode='42501'; end if;
 g:=assess.supervised_group_v1(r.group_id);
 if r.expires_at<=clock_timestamp() then raise exception 'review expired' using errcode='55000'; end if;
 if r.group_revision<>g.scope_revision or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revision=r.appointment_revision and revoked_at is null) then
  raise exception 'scope changed' using errcode='40001'; end if;
 select * into d from assess.authoring_drafts where id=r.draft_id and writer_id=auth.uid() and group_id=g.id;
 if d.revision is distinct from r.draft_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if assess.linked_version_v1(d.id,d.revision)<>r.version_id then raise exception 'version changed' using errcode='40001'; end if;
 if exists(
  (select user_id,period_id,visible_from from assess.visible_members_v1(g.id)
   except select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id)
  union all
  (select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id
   except select user_id,period_id,visible_from from assess.visible_members_v1(g.id))
 ) then raise exception 'targets changed' using errcode='40001'; end if;
 return r;
end $$;
create function assess.assignment_prepare_v1(p_group uuid,p_draft uuid,p_revision integer,p_operation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g assess.groups; d assess.authoring_drafts; r assess.assignment_reviews; v uuid; n integer; ts timestamptz; target_digest text;
begin
 perform assess.scope_enter_v1(true); g:=assess.supervised_group_v1(p_group); ts:=clock_timestamp();
 if p_operation is null then raise exception 'operation required' using errcode='22023'; end if;
 select * into d from assess.authoring_drafts where id=p_draft and writer_id=auth.uid() and group_id=g.id;
 if d.id is null then raise exception 'draft denied' using errcode='42501'; end if;
 if d.revision is distinct from p_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if jsonb_array_length(d.document->'items')=0 or length(btrim(d.document->>'name'))=0 then
  raise exception 'incomplete draft' using errcode='22023'; end if;
 v:=assess.linked_version_v1(d.id,d.revision);
 select * into r from assess.assignment_reviews where id=p_operation;
 if r.id is not null then
  if r.writer_id<>auth.uid() or r.group_id<>g.id or r.draft_id<>d.id or r.draft_revision<>d.revision or r.version_id<>v then
   raise exception 'operation conflict' using errcode='40001'; end if;
  r:=assess.review_current_v1(r.id);
 else
  delete from assess.assignment_reviews where writer_id=auth.uid() and assignment_id is null and expires_at<=ts;
  if (select count(*) from assess.assignment_reviews where writer_id=auth.uid() and assignment_id is null)>=20 then
   raise exception 'pending review limit' using errcode='54000'; end if;
  -- SHARE profile locks make membership approval/status changes serialize with this snapshot.
  perform p.user_id from public.profiles p join assess.memberships m on m.user_id=p.user_id where m.group_id=g.id order by p.user_id for share of p;
  select count(*) into n from assess.visible_members_v1(g.id);
  if n not between 1 and 1000 then raise exception 'target count outside limit' using errcode='22023'; end if;
  insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at)
   select p_operation,auth.uid(),g.id,g.scope_revision,a.revision,d.id,d.revision,v,s.digest,least(ts+interval '5 minutes',g.ends_at),ts
   from assess.supervisor_appointments a,assess.authoring_revisions s where a.user_id=auth.uid() and s.draft_id=d.id and s.revision=d.revision returning * into r;
  insert into assess.assignment_review_targets select r.id,user_id,period_id,visible_from from assess.visible_members_v1(g.id);
 end if;
 select count(*) into n from assess.assignment_review_targets where review_id=r.id;
 select encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(user_id,period_id,visible_from) order by user_id),'[]')::text,'UTF8')),'hex')
 into target_digest from assess.assignment_review_targets where review_id=r.id;
 return jsonb_build_object('token',r.id,'draftId',r.draft_id,'draftRevision',r.draft_revision,'groupId',r.group_id,'groupRevision',r.group_revision,
  'versionId',r.version_id,'sourceDigest',r.source_digest,'targetDigest',target_digest,'targetCount',n,'expiresAt',r.expires_at,'serverNow',ts);
end $$;
create function assess.assignment_targets_v1(p_review uuid,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r assess.assignment_reviews; rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 r:=assess.review_current_v1(p_review);
 -- Frozen targets may not expose students who have since left/withdrawn consent.
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select t.user_id id,p.display_name from assess.assignment_review_targets t
  join assess.visible_members_v1(r.group_id) m on m.user_id=t.user_id and m.period_id=t.period_id and m.visible_from=t.visible_from
  join public.profiles p on p.user_id=t.user_id
  where t.review_id=r.id and (p_after is null or t.user_id>p_after) order by t.user_id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
create function assess.assignment_confirm_v1(p_review uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare r assess.assignment_reviews; g assess.groups; d assess.authoring_drafts; aid uuid; ts timestamptz;
begin
 perform assess.scope_enter_v1(true);
 select * into r from assess.assignment_reviews where id=p_review and writer_id=auth.uid();
 if r.id is null then raise exception 'review denied' using errcode='42501'; end if;
 -- Authorized replay returns the original receipt even after expiry; never recreates targets.
 if r.assignment_id is not null then
  if not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null) then
   raise exception 'supervisor revoked' using errcode='42501'; end if;
  return r.assignment_id;
 end if;
 g:=assess.supervised_group_v1(r.group_id); ts:=clock_timestamp();
 if r.expires_at<=ts then raise exception 'review expired' using errcode='55000'; end if;
 if r.group_revision<>g.scope_revision or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revision=r.appointment_revision and revoked_at is null) then
  raise exception 'scope changed' using errcode='40001'; end if;
 select * into d from assess.authoring_drafts where id=r.draft_id and writer_id=auth.uid() and group_id=g.id;
 if d.revision is distinct from r.draft_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if assess.linked_version_v1(d.id,d.revision)<>r.version_id then raise exception 'version changed' using errcode='40001'; end if;
 perform 1 from assess.versions where id=r.version_id for share;
 perform p.user_id from public.profiles p join assess.memberships m on m.user_id=p.user_id where m.group_id=g.id order by p.user_id for share of p;
 if exists(
  (select user_id,period_id,visible_from from assess.visible_members_v1(g.id)
   except select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id)
  union all
  (select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id
   except select user_id,period_id,visible_from from assess.visible_members_v1(g.id))
 ) then raise exception 'targets changed' using errcode='40001'; end if;
 -- Recheck server time after all possibly blocking locks, not transaction start time.
 if clock_timestamp()>=least(r.expires_at,g.ends_at) then raise exception 'review expired' using errcode='55000'; end if;
 insert into assess.assignments(owner_id,version_id,source_group_ids) values(auth.uid(),r.version_id,array[g.id]) returning id into aid;
 insert into assess.targets select aid,user_id from assess.assignment_review_targets where review_id=r.id;
 insert into assess.assignment_scopes values(aid,g.id,auth.uid(),r.id);
 update assess.assignment_reviews set assignment_id=aid where id=r.id;
 return aid;
end $$;
-- Existing owner closure semantics are reused. Supervisor path is restricted to its issued scope.
-- No targets/attempts/results are deleted or silently withdrawn by closure.
create function assess.assignment_close_v2(p_assignment uuid,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare a assess.assignments;
begin
 perform assess.scope_enter_v1(true);
 select * into a from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 if a.closed_at is not null then return; end if;
 if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
 if public.is_owner() then perform assess.close_assignment_v1(a.id); return; end if;
 if not exists(select 1 from assess.assignment_scopes s join assess.groups g on g.id=s.group_id
  join assess.supervisor_appointments ap on ap.user_id=s.supervisor_id
  where s.assignment_id=a.id and s.supervisor_id=auth.uid() and g.supervisor_id=auth.uid() and ap.revoked_at is null) then
  raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=a.id;
end $$;
create function assess.assignment_page_v2(p_group uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if not public.is_owner() then perform assess.supervised_group_v1(p_group); end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select a.id,v.name,v.track,v.version,a.revision,a.closed_at from assess.assignments a join assess.versions v on v.id=a.version_id
  where a.owner_id=auth.uid() and (public.is_owner() or exists(select 1 from assess.assignment_scopes s where s.assignment_id=a.id and s.group_id=p_group and s.supervisor_id=auth.uid()))
  and (p_after is null or a.id>p_after) order by a.id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
create function assess.supervisor_results_v1(p_group uuid,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g assess.groups; ts timestamptz; rows jsonb; total bigint;
begin
 perform assess.scope_enter_v1(false); g:=assess.supervised_group_v1(p_group); ts:=clock_timestamp();
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 with visible as materialized (
  select s.id,s.user_id,s.submitted_at,r.name,r.track,
   case when r.visibility='hidden' then jsonb_build_object('visibility','hidden')
   else jsonb_build_object('visibility','shown','earnedNumerator',r.earned_n::text,'earnedDenominator',r.earned_d::text,'maximum',r.maximum::text) end grade
  from assess.visible_members_v1(g.id) m join assess.sessions s on s.user_id=m.user_id
  join assess.results r on r.session_id=s.id join assess.assignment_scopes a on a.assignment_id=s.assignment_id and a.group_id=g.id and a.supervisor_id=auth.uid()
  join assess.assignment_review_targets t on t.review_id=a.review_id and t.user_id=m.user_id and t.period_id=m.period_id
  where s.state='graded' and s.started_at>=m.visible_from and s.started_at<g.ends_at and s.expires_at>ts
 ) select (select count(*) from visible),coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into total,rows
 from (select * from visible where p_after is null or id>p_after order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
alter table assess.authoring_publication_links enable row level security;
alter table assess.assignment_reviews enable row level security;
alter table assess.assignment_review_targets enable row level security;
alter table assess.assignment_scopes enable row level security;
revoke all on assess.authoring_publication_links,assess.assignment_reviews,assess.assignment_review_targets,assess.assignment_scopes from public,anon,authenticated,assess_worker;
revoke all on function assess.linked_version_v1(uuid,integer),assess.review_current_v1(uuid),assess.assignment_prepare_v1(uuid,uuid,integer,uuid),
 assess.assignment_targets_v1(uuid,uuid,integer),assess.assignment_confirm_v1(uuid),assess.assignment_close_v2(uuid,integer),
 assess.assignment_page_v2(uuid,uuid,integer),assess.supervisor_results_v1(uuid,uuid,integer) from public,anon,authenticated,assess_worker;
grant execute on function assess.assignment_prepare_v1(uuid,uuid,integer,uuid),assess.assignment_targets_v1(uuid,uuid,integer),
 assess.assignment_confirm_v1(uuid),assess.assignment_close_v2(uuid,integer),assess.assignment_page_v2(uuid,uuid,integer),
 assess.supervisor_results_v1(uuid,uuid,integer) to authenticated;
commit;
