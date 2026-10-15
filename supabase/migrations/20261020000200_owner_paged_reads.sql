-- RAD-047b.2. Additive; deploy before the new app. Legacy functions/grants remain.
-- Keyset order is time DESC, id ASC. Export boundary is a read boundary, NOT a snapshot.
create index profiles_created_user_idx on public.profiles(created_at desc,user_id asc);
create index attempts_user_finished_id_idx on public.attempts(user_id,finished_at desc,id asc);
create index feedback_user_at_id_idx on public.feedback(user_id,at desc,id asc);
create index attempts_exam_finished_id_idx on public.attempts(exam_id,finished_at desc,id asc);
create index feedback_exam_at_id_idx on public.feedback(exam_id,at desc,id asc);

create function public.owner_page_v1(
  p_stream text, p_limit integer default 100, p_cursor jsonb default null,
  p_participant uuid default null, p_from timestamptz default null,
  p_to timestamptz default null, p_exam text default null,
  p_boundary timestamptz default null, p_export boolean default false
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  boundary timestamptz := coalesce(p_boundary, statement_timestamp());
  lim integer := least(p_limit,1000);
  source text; stamp text; ident text; projection text; predicate text; base text;
  page jsonb; n bigint; pending bigint := 0; cursor_time timestamptz; cursor_id text;
begin
  -- Guard before parsing parameters or disclosing counts, including suspended owners.
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_stream is null or p_stream not in ('participants','attempts','notes') or p_limit is null or p_limit < 1
    or p_export is null or not isfinite(boundary)
    or (p_from is not null and not isfinite(p_from)) or (p_to is not null and not isfinite(p_to))
    or p_from > p_to or length(p_exam)>200
    or (p_stream='participants' and (p_export or p_exam is not null)) then
    raise exception 'invalid page request' using errcode='22023';
  end if;
  if p_cursor is not null then
    if jsonb_typeof(p_cursor)<>'object' or not (p_cursor ? 'time' and p_cursor ? 'id')
      or jsonb_typeof(p_cursor->'time')<>'string' or jsonb_typeof(p_cursor->'id')<>'string' then
      raise exception 'invalid cursor' using errcode='22023';
    end if;
    cursor_time := (p_cursor->>'time')::timestamptz;
    cursor_id := p_cursor->>'id';
    if not isfinite(cursor_time) or cursor_time > boundary then raise exception 'invalid cursor' using errcode='22023'; end if;
    if p_stream='notes' then
      if cursor_id !~ '^[0-9]+$' or cursor_id::bigint < 1 then raise exception 'invalid cursor' using errcode='22023'; end if;
    else perform cursor_id::uuid; end if;
  end if;
  if p_stream='participants' then
    source := 'public.profiles r join auth.users u on u.id=r.user_id';
    stamp := 'r.created_at'; ident := 'r.user_id';
    projection := 'jsonb_build_object(''user_id'',r.user_id,''participant_code'',r.participant_code,''role'',r.role,''status'',r.status,''email'',u.email,''email_confirmed'',u.email_confirmed_at is not null,''created_at'',r.created_at,''last_seen_at'',r.last_seen_at,''last_event_at'',(select max(e.at) from public.events e where e.user_id=r.user_id))';
  elsif p_stream='attempts' then
    source := 'public.attempts r join public.profiles p on p.user_id=r.user_id';
    stamp := 'r.finished_at'; ident := 'r.id';
    projection := 'jsonb_build_object(''id'',r.id,''user_id'',r.user_id,''attempt_no'',r.attempt_no,''exam_id'',r.exam_id,''case_id'',r.case_id,''definition_version'',r.definition_version,''settings'',r.settings,''result'',r.result,''locale'',r.locale,''started_at'',r.started_at,''finished_at'',r.finished_at,''participant_code'',p.participant_code)';
  else
    source := 'public.feedback r join public.profiles p on p.user_id=r.user_id left join public.attempts a on a.id=r.attempt_id and a.user_id=r.user_id';
    stamp := 'r.at'; ident := 'r.id';
    projection := 'jsonb_build_object(''id'',r.id::text,''user_id'',r.user_id,''exam_id'',r.exam_id,''attempt_id'',r.attempt_id,''attempt_no'',a.attempt_no,''text'',r.text,''at'',r.at,''participant_code'',p.participant_code)';
  end if;
  if p_export then projection := '(' || projection || ')-''user_id'''; end if;
  -- All SQL fragments come only from the fixed branches above. Values stay bound.
  predicate := format('%s <= $1 and ($2::uuid is null or r.user_id=$2) and ($3::timestamptz is null or %s >= $3) and ($4::timestamptz is null or %s <= $4)',stamp,stamp,stamp);
  if p_stream<>'participants' then predicate := predicate || ' and ($5::text is null or r.exam_id=$5)'; end if;
  base := ' from ' || source || ' where ' || predicate;
  execute 'select count(*)' || base into n using boundary,p_participant,p_from,p_to,p_exam;
  if p_stream='participants' then
    execute 'select count(*)' || base || ' and r.status=''pending''' into pending using boundary,p_participant,p_from,p_to,p_exam;
  end if;
  execute format('select coalesce(jsonb_agg(v order by t desc,i asc),''[]''::jsonb) from
    (select %s v,%s t,%s i %s and ($6::timestamptz is null or %s < $6 or (%s=$6 and %s > $7::%s))
    order by %s desc,%s asc limit $8) q',projection,stamp,ident,base,stamp,stamp,ident,
    case when p_stream='notes' then 'bigint' else 'uuid' end,stamp,ident)
    into page using boundary,p_participant,p_from,p_to,p_exam,cursor_time,cursor_id,lim;
  return jsonb_build_object('version',1,'boundary',boundary,'total',n,'pending',pending,'rows',page,
    -- Explicit continuation even for a short API page; an exact-full final page may need one empty request.
    'next',case when jsonb_array_length(page)=lim then jsonb_build_object('time',page->(lim-1)->(case p_stream when 'participants' then 'created_at' when 'attempts' then 'finished_at' else 'at' end),
      'id',page->(lim-1)->(case when p_stream='participants' then 'user_id' else 'id' end)) else null end);
end $$;
revoke all on function public.owner_page_v1(text,integer,jsonb,uuid,timestamptz,timestamptz,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.owner_page_v1(text,integer,jsonb,uuid,timestamptz,timestamptz,text,timestamptz,boolean) to authenticated;
