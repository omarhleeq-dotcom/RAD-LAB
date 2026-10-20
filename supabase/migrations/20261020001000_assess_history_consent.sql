-- F only. No seeds, gate opening, schedule, public/Practice changes or provider execution.
create table assess.consents (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  version text not null check(version='assess-pilot-2026-10-20-v1'),
  accepted_at timestamptz not null default clock_timestamp()
);
alter table assess.consents enable row level security;
revoke all on assess.consents from public,anon,authenticated,assess_worker;

-- Null reads status. A versioned affirmative action is required to write; retry preserves the first acceptance.
create function assess.consent_v1(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_version is not null then
    if p_version<>'assess-pilot-2026-10-20-v1' then raise exception 'unsupported consent' using errcode='22023'; end if;
    insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id) do nothing;
  end if;
  return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-pilot-2026-10-20-v1'));
end $$;

-- Covers direct start RPCs too, without replacing the reviewed C lifecycle or its gate.
create function assess.require_consent_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from assess.consents where user_id=new.user_id and version='assess-pilot-2026-10-20-v1') then
    raise exception 'Assess consent required' using errcode='42501';
  end if;
  return new;
end $$;
create trigger assess_session_consent before insert on assess.sessions for each row execute function assess.require_consent_v1();
create index assess_sessions_history on assess.sessions(user_id,id) where state='graded';

-- Opaque UUID keyset; no row identity is displayed. C result_v1 remains the single grade/expiry whitelist.
create function assess.history_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb; cursor_id uuid; ts timestamptz:=clock_timestamp();
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  with page as (
    select s.id from assess.sessions s
    join assess.results r on r.session_id=s.id
    join assess.assignments a on a.id=s.assignment_id
    join assess.targets t on t.assignment_id=a.id and t.user_id=s.user_id
    join assess.versions v on v.id=a.version_id
    where s.user_id=auth.uid() and s.state='graded' and s.expires_at>ts and v.available and v.schema_version=1 and v.track in ('mixed','full-practical')
      and (p_after is null or s.id>p_after)
    order by s.id limit p_limit
  ), projected as (select id,assess.result_v1(id) dto from page)
  select coalesce(jsonb_agg(dto order by id),'[]'::jsonb),(array_agg(id order by id desc))[1] into rows,cursor_id from projected;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then cursor_id else null end);
end $$;
revoke all on function assess.consent_v1(text),assess.require_consent_v1(),assess.history_page_v1(uuid,integer) from public,anon,authenticated,assess_worker;
grant execute on function assess.consent_v1(text),assess.history_page_v1(uuid,integer) to authenticated;
