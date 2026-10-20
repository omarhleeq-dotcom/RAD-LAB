-- E only: reviewed full-practical presentation. No public/Practice changes, seeds, gate or runtime deployment.
create table assess.practical_presentations (
  version_id uuid primary key references assess.versions(id) on delete cascade,
  views jsonb not null check(jsonb_typeof(views)='object' and pg_column_size(views)<=2000000)
);
alter table assess.practical_presentations enable row level security;
revoke all on assess.practical_presentations from public,anon,authenticated,assess_worker;

-- Extend immutable owner submission to the second independent track; D's signature and semantics remain.
create or replace function assess.content_submit_v1(p_document jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare a jsonb; vid uuid; aid uuid;
begin
  perform 1 from public.profiles where user_id=auth.uid() for update;
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_document is null or pg_column_size(p_document)>2000000 or octet_length(p_document::text)>2000000 then
    raise exception 'document limit' using errcode='22023'; end if;
  a:=p_document->'assessment';
  if coalesce(a->>'track','') not in ('mixed','full-practical') or a->>'schemaVersion' is distinct from '1'
    or length(btrim(a->>'name')) not between 1 and 200
    or length(a->'ref'->>'version') not between 1 and 100 then raise exception 'invalid metadata' using errcode='22023'; end if;
  aid:=(a->'ref'->>'id')::uuid;
  -- Serialize all versions of one assessment and prevent another owner's version takeover.
  perform pg_advisory_xact_lock(hashtextextended(aid::text,0));
  if exists(select 1 from assess.versions where assessment_id=aid and owner_id<>auth.uid()) then raise exception 'denied' using errcode='42501'; end if;
  if (select count(*) from assess.content_submissions c join assess.versions v on v.id=c.version_id where v.owner_id=auth.uid() and c.state='pending')>=20 then
    raise exception 'pending limit' using errcode='54000'; end if;
  insert into assess.versions(owner_id,assessment_id,version,name,track)
    values(auth.uid(),aid,a->'ref'->>'version',a->>'name',a->>'track') returning id into vid;
  insert into assess.content_submissions(version_id,document) values(vid,p_document);
  return vid;
end $$;

create function assess.content_install_practical_v1(p_version uuid,p_specs jsonb,p_views jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
  select document into strict doc from assess.content_submissions where version_id=p_version and state='pending' for update;
  if doc->'assessment'->>'track' is distinct from 'full-practical' or p_views is null
    or jsonb_typeof(p_views) is distinct from 'object' or pg_column_size(p_views)>2000000
    or (select count(*) from jsonb_object_keys(p_views))<>jsonb_array_length(doc->'assessment'->'items') then
    raise exception 'invalid practical presentation' using errcode='22023'; end if;
  -- Trusted Node validator supplies only render geometry, neutral selectors and initial values.
  perform assess.install_publication_v1(p_version,doc,p_specs);
  insert into assess.practical_presentations(version_id,views) values(p_version,p_views);
  update assess.versions set available=true where id=p_version;
  update assess.content_submissions set state='installed',document=null where version_id=p_version;
end $$;

create function assess.assigned_practical_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.practical_presentations p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='full-practical' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create function assess.read_practical_session_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; views jsonb; pinned jsonb;
begin
  result:=assess.read_session_v1(p_session); -- C owns identity/target, row lock, time and terminal-detail deletion.
  if result->'ack'->>'state'<>'active' then return result; end if;
  if result->'assessment'->>'track'<>'full-practical' then raise exception 'practical only' using errcode='55000'; end if;
  pinned:=result->'assessment'->'ref';
  -- Resolve the immutable snapshot's version, never a newest-version or mutable assignment lookup.
  select p.views into strict views from assess.practical_presentations p join assess.versions v on v.id=p.version_id
    where v.assessment_id=(pinned->>'id')::uuid and v.version=pinned->>'version';
  return result || jsonb_build_object('views',views);
end $$;
revoke all on function assess.content_install_practical_v1(uuid,jsonb,jsonb),assess.assigned_practical_page_v1(uuid,integer),assess.read_practical_session_v1(uuid) from public,anon,authenticated,assess_worker;
grant execute on function assess.assigned_practical_page_v1(uuid,integer),assess.read_practical_session_v1(uuid) to authenticated;
grant execute on function assess.content_install_practical_v1(uuid,jsonb,jsonb) to assess_worker;
