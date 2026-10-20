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
