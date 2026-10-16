-- RAD-047b.3 (S-PILOT-26). Apply transactionally AFTER the seven existing files, before the new client.
-- v1 JSON/text values and definition_version are untouched. Old clients get honest defaults.
create table public.pilot_locales (
  tag text primary key,
  constraint pilot_locales_tag_check check (length(tag) between 2 and 63 and tag ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$')
);
insert into public.pilot_locales(tag) values ('en'),('ar');
alter table public.pilot_locales enable row level security;
revoke all on table public.pilot_locales from public, anon, authenticated;
-- Curated configuration, not a public language-registration API. No third-language UI is added.
alter table public.attempts drop constraint attempts_locale_check;
alter table public.attempts add constraint attempts_locale_fkey foreign key (locale) references public.pilot_locales(tag);
alter table public.attempts add column settings_format_version integer not null default 1 constraint attempts_settings_format_version_check check (settings_format_version>0);
alter table public.attempts add column result_format_version integer not null default 1 constraint attempts_result_format_version_check check (result_format_version>0);
alter table public.attempts
  add column mode text not null default 'practice' constraint attempts_mode_check check (mode='practice'),
  add column record_kind text not null default 'attempt' constraint attempts_record_kind_check check (record_kind='attempt'),
  add column producer_version text not null default 'unknown' constraint attempts_producer_version_check check (length(producer_version) between 1 and 100),
  add column engine_version text not null default 'unknown' constraint attempts_engine_version_check check (length(engine_version) between 1 and 100);
alter table public.events add column payload_format_version integer not null default 1 constraint events_payload_format_version_check check (payload_format_version>0);
alter table public.events
  add column mode text not null default 'practice' constraint events_mode_check check (mode='practice'),
  add column record_kind text not null default 'event' constraint events_record_kind_check check (record_kind='event'),
  add column producer_version text not null default 'unknown' constraint events_producer_version_check check (length(producer_version) between 1 and 100),
  add column engine_version text not null default 'unknown' constraint events_engine_version_check check (length(engine_version) between 1 and 100);
alter table public.feedback add column note_format_version integer not null default 1 constraint feedback_note_format_version_check check (note_format_version>0);
alter table public.feedback
  add column mode text not null default 'practice' constraint feedback_mode_check check (mode='practice'),
  add column record_kind text not null default 'feedback' constraint feedback_record_kind_check check (record_kind='feedback'),
  add column producer_version text not null default 'unknown' constraint feedback_producer_version_check check (length(producer_version) between 1 and 100),
  add column engine_version text not null default 'unknown' constraint feedback_engine_version_check check (length(engine_version) between 1 and 100);

-- Additive row metadata; the existing page envelope and legacy functions remain compatible.
create or replace function public.owner_page_v1(
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
  if p_stream='attempts' then
    -- Validated FK guarantees registration; no client grant on pilot_locales is needed.
    projection := '(' || projection || ') || jsonb_build_object(''settings_format_version'',r.settings_format_version,''result_format_version'',r.result_format_version,''mode'',r.mode,''record_kind'',r.record_kind,''producer_version'',r.producer_version,''engine_version'',r.engine_version,''locale_registered'',true)';
  elsif p_stream='notes' then
    projection := '(' || projection || ') || jsonb_build_object(''note_format_version'',r.note_format_version,''mode'',r.mode,''record_kind'',r.record_kind,''producer_version'',r.producer_version,''engine_version'',r.engine_version)';
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
  -- v1 RPC must fail visibly for unknown payloads even for the previous static client,
  -- which cannot inspect new metadata. Never filter them away or silently alter totals.
  if (p_stream='attempts' and exists (select 1 from jsonb_array_elements(page) r
      where (r->>'settings_format_version')::integer<>1 or (r->>'result_format_version')::integer<>1))
    or (p_stream='notes' and exists (select 1 from jsonb_array_elements(page) r
      where (r->>'note_format_version')::integer<>1)) then
    raise exception 'unsupported record format for owner_page_v1' using errcode='22023';
  end if;
  return jsonb_build_object('version' ,1,'boundary',boundary,'total',n,'pending',pending,'rows',page,
    -- Explicit continuation even for a short API page; an exact-full final page may need one empty request.
    'next',case when jsonb_array_length(page)=lim then jsonb_build_object('time',page->(lim-1)->(case p_stream when 'participants' then 'created_at' when 'attempts' then 'finished_at' else 'at' end),
      'id',page->(lim-1)->(case when p_stream='participants' then 'user_id' else 'id' end)) else null end) || case when p_stream='participants' then '{}'::jsonb else jsonb_build_object('record_contract_version',1) end;
end $$;

-- CREATE OR REPLACE retains the exact existing EXECUTE ACL (verified by tests).
