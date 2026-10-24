-- RAD-069 C2 Phase 1. DEFERRED: no live application or frontend requirement.
-- Existing objects, grants, policies, functions and foreign keys stay unchanged.
create table public.c2_account_deletions (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 requested_at timestamptz not null default clock_timestamp(),
 restore_status text not null check (restore_status in ('pending','approved','suspended')),
 previous_banned_until timestamptz not null,
 constraint c2_account_deletions_requested_at_check check (isfinite(requested_at))
);
create index c2_account_deletions_expiry_idx on public.c2_account_deletions(requested_at,user_id);
create table public.c2_survey_settings (
 singleton boolean primary key default true check (singleton),
 activated_at timestamptz not null default clock_timestamp(),
 gap_days integer not null default 7 check (gap_days between 7 and 3650)
);
insert into public.c2_survey_settings(singleton) values(true);
create table public.c2_survey_versions (
 id uuid primary key default gen_random_uuid(),
 survey_type text not null check (length(btrim(survey_type)) between 1 and 64),
 version integer not null check (version>0),
 definition jsonb not null check (jsonb_typeof(definition)='object' and octet_length(definition::text)<=20000),
 constraint c2_survey_versions_type_version_key unique(survey_type,version)
);
create table public.c2_survey_rounds (
 id uuid primary key default gen_random_uuid(),
 version_id uuid not null references public.c2_survey_versions(id),
 opened_at timestamptz not null default clock_timestamp(),
 closed_at timestamptz not null default 'infinity',
 constraint c2_survey_rounds_dates_check check (isfinite(opened_at) and closed_at>=opened_at)
);
create table public.c2_survey_responses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 round_id uuid not null references public.c2_survey_rounds(id),
 offered_at timestamptz not null default clock_timestamp(),
 answered_at timestamptz not null default 'infinity',
 state text not null default 'pending' check (state in ('pending','answered','cancelled')),
 answers jsonb not null default '{}' check (jsonb_typeof(answers)='object' and octet_length(answers::text)<=20000),
 score numeric not null default -1 check (score=-1 or score between 0 and 100),
 constraint c2_survey_responses_user_round_key unique(user_id,round_id),
 constraint c2_survey_responses_dates_check check (isfinite(offered_at) and answered_at>=offered_at)
);
create unique index c2_survey_responses_pending_idx on public.c2_survey_responses(user_id) where state='pending';
create index c2_survey_responses_user_offered_idx on public.c2_survey_responses(user_id,offered_at desc);
alter table public.c2_account_deletions enable row level security;
alter table public.c2_survey_settings enable row level security;
alter table public.c2_survey_versions enable row level security;
alter table public.c2_survey_rounds enable row level security;
alter table public.c2_survey_responses enable row level security;
revoke all on public.c2_account_deletions,public.c2_survey_settings,public.c2_survey_versions,public.c2_survey_rounds,public.c2_survey_responses from public,anon,authenticated;

-- Brooke (1996), SUS: A 'quick and dirty' usability scale, in Usability
-- Evaluation in Industry, Taylor & Francis, pp. 189-194. English original.
-- No Arabic wording: published, validated translation/citation remains open.
insert into public.c2_survey_versions(survey_type,version,definition) values
('SUS',1,'{"locale":"en","scoring":"sus","citation":"Brooke, J. (1996). SUS: A quick and dirty usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester & I. L. McClelland (Eds.), Usability Evaluation in Industry, pp. 189-194. Taylor & Francis.","questions":[
{"id":"q1","kind":"rating","optional":false,"label":"I think that I would like to use this system frequently."},
{"id":"q2","kind":"rating","optional":false,"label":"I found the system unnecessarily complex."},
{"id":"q3","kind":"rating","optional":false,"label":"I thought the system was easy to use."},
{"id":"q4","kind":"rating","optional":false,"label":"I think that I would need the support of a technical person to be able to use this system."},
{"id":"q5","kind":"rating","optional":false,"label":"I found the various functions in this system were well integrated."},
{"id":"q6","kind":"rating","optional":false,"label":"I thought there was too much inconsistency in this system."},
{"id":"q7","kind":"rating","optional":false,"label":"I would imagine that most people would learn to use this system very quickly."},
{"id":"q8","kind":"rating","optional":false,"label":"I found the system very cumbersome to use."},
{"id":"q9","kind":"rating","optional":false,"label":"I felt very confident using the system."},
{"id":"q10","kind":"rating","optional":false,"label":"I needed to learn a lot of things before I could get going with this system."}]}'),
('General',1,'{"locale":"en","scoring":"none","questions":[{"id":"rating","kind":"rating","optional":false,"label":"Overall rating"},{"id":"liked","kind":"text","optional":false,"label":"What you liked"},{"id":"improve","kind":"text","optional":false,"label":"What should improve"},{"id":"bug","kind":"text","optional":true,"label":"A bug you found"}]}');

create function public.owner_account_deletion_v1(p_action text,p_user uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles%rowtype; d public.c2_account_deletions%rowtype; prior_ban timestamptz;
 ids uuid[]:='{}'; target uuid; rows jsonb; lim integer:=least(p_limit,100);
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_action is null or p_action not in ('deactivate','restore','finalise','list') or p_limit is null or p_limit<1 then
  raise exception 'invalid deletion request' using errcode='22023'; end if;
 -- Serialise owner deletion operations and role/status writes while checking last owner.
 lock table public.profiles in share row exclusive mode;
 if p_action='list' then
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select q.user_id id,jsonb_build_object('user_id',q.user_id,'participant_code',profile_info.participant_code,
    'name',profile_info.display_name,'email',u.email,'status','pending deletion','requested_at',q.requested_at,
    'expires_at',q.requested_at+interval '30 days','days_left',greatest(0,ceil(extract(epoch from(q.requested_at+interval '30 days'-clock_timestamp()))/86400))) v
   from public.c2_account_deletions q join public.profiles profile_info using(user_id) join auth.users u on u.id=q.user_id
   where p_after is null or q.user_id>p_after order by q.user_id limit lim+1
  ) x;
  return jsonb_build_object('rows',rows-lim,'next',case when jsonb_array_length(rows)>lim then rows->(lim-1)->'user_id' else null end);
 end if;
 if p_action='finalise' then
  select coalesce(array_agg(user_id order by requested_at,user_id),'{}') into ids from (
   select user_id,requested_at from public.c2_account_deletions where requested_at+interval '30 days'<=clock_timestamp()
   order by requested_at,user_id limit lim
  ) x;
 else
  if p_user is null then raise exception 'participant required' using errcode='22023'; end if;
  ids:=array[p_user];
 end if;
 foreach target in array ids loop
  select * into p from public.profiles where user_id=target for update;
  if not found then raise exception 'participant not found' using errcode='22023'; end if;
  if p_action<>'restore' and p.role='owner' and not exists(select 1 from public.profiles other_owner
    where other_owner.role='owner' and other_owner.status='approved' and other_owner.user_id<>target
    and not exists(select 1 from public.c2_account_deletions q where q.user_id=other_owner.user_id)) then
   raise exception 'last owner' using errcode='42501'; end if;
  if target=auth.uid() then raise exception 'cannot delete yourself' using errcode='42501'; end if;
  select * into d from public.c2_account_deletions where user_id=target for update;
  if p_action='deactivate' then
   if found then raise exception 'already pending deletion' using errcode='22023'; end if;
   select coalesce(banned_until,'-infinity') into prior_ban from auth.users where id=target for update;
   insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values(target,p.status,prior_ban);
   update public.profiles set status='suspended' where user_id=target;
   -- Auth ban persists past the grace window until explicit restore/finalise.
   update auth.users set banned_until=clock_timestamp()+interval '100 years' where id=target;
   -- Revoke refreshable sessions; already-issued JWTs expire normally, status blocks new writes.
   if to_regclass('auth.sessions') is not null then execute 'delete from auth.sessions where user_id=$1' using target; end if;
   if to_regclass('auth.refresh_tokens') is not null then execute 'delete from auth.refresh_tokens where user_id::text=$1' using target::text; end if;
  elsif p_action='restore' then
   if d.user_id is null or d.requested_at+interval '30 days'<=clock_timestamp() then raise exception 'restore window expired or absent' using errcode='22023'; end if;
   update auth.users set banned_until=nullif(d.previous_banned_until,'-infinity'::timestamptz) where id=target;
   update public.profiles set status=d.restore_status where user_id=target;
   delete from public.c2_account_deletions where user_id=target;
  else
   -- No tombstone, reparenting or retained copies; existing CASCADE is authoritative.
   delete from auth.users where id=target;
  end if;
 end loop;
 return jsonb_build_object('processed',cardinality(ids));
end $$;

-- Phase 2 must use this directory in place of old lists; legacy RPCs remain unchanged.
create function public.owner_account_directory_v1(p_search text default '',p_status text default '',p_cursor jsonb default null,p_boundary timestamptz default null,p_limit integer default 20)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b timestamptz:=coalesce(p_boundary,statement_timestamp()); rows jsonb; counts jsonb; lim integer:=least(p_limit,20); after_id uuid; after_rank integer;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_search is null or length(p_search)>100 or p_status is null or p_status not in ('','pending','approved','suspended')
 or p_limit is null or p_limit<1 or not isfinite(b) or b>statement_timestamp() then raise exception 'invalid directory request' using errcode='22023'; end if;
 if p_cursor is not null then
  after_id:=(p_cursor->>'id')::uuid; after_rank:=(p_cursor->>'rank')::integer;
  if jsonb_typeof(p_cursor)<>'object' or after_id is null or after_rank is null or after_rank not between 0 and 2 then raise exception 'invalid cursor' using errcode='22023'; end if;
 end if;
 select jsonb_build_object('pending',count(*) filter(where p.status='pending'),'approved',count(*) filter(where p.status='approved'),'suspended',count(*) filter(where p.status='suspended')) into counts
 from public.profiles p join auth.users u on u.id=p.user_id where p.created_at<=b
 and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
 and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0);
 select coalesce(jsonb_agg(v order by rank,id),'[]') into rows from (
  select p.user_id id,case p.status when 'pending' then 0 when 'approved' then 1 else 2 end rank,
  jsonb_build_object('user_id',p.user_id,'name',p.display_name,'email',u.email,'participant_code',p.participant_code,'role',p.role,'status',p.status,'created_at',p.created_at,'last_seen_at',p.last_seen_at) v
  from public.profiles p join auth.users u on u.id=p.user_id where p.created_at<=b and (p_status='' or p.status=p_status)
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
  and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0)
  and (after_id is null or (case p.status when 'pending' then 0 when 'approved' then 1 else 2 end,p.user_id)>(after_rank,after_id))
  order by rank,id limit lim+1
 ) x;
 return jsonb_build_object('version',1,'boundary',b,'rows',rows-lim,'counts',counts,'next',case when jsonb_array_length(rows)>lim then jsonb_build_object('id',rows->(lim-1)->'user_id','rank',case rows->(lim-1)->>'status' when 'pending' then 0 when 'approved' then 1 else 2 end) else null end);
end $$;

create function public.owner_surveys_v1(p_action text,p_data jsonb default '{}',p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb; obj uuid; def jsonb; q jsonb; ids text[]:='{}'; typ text; ver integer; lim integer:=least(p_limit,100);
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_action is null or p_action not in ('create_version','open_round','close_round','set_gap','versions','rounds','answers') or p_data is null or jsonb_typeof(p_data)<>'object' or p_limit is null or p_limit<1 then
  raise exception 'invalid survey request' using errcode='22023'; end if;
 if p_action in ('create_version','open_round','close_round','set_gap') then
  perform 1 from public.c2_survey_settings where singleton for update;
 end if;
 if p_action='create_version' then
  def:=p_data->'definition'; typ:=p_data->>'survey_type'; ver:=(p_data->>'version')::integer;
  if def is null or jsonb_typeof(def)<>'object' or not exists(select 1 from public.pilot_locales where tag=def->>'locale') or def->>'scoring' is distinct from 'none'
   or jsonb_typeof(def->'questions') is distinct from 'array' then
   -- SUS remains the attributed original: no altered SUS wording, scoring or unverified translation.
   if typ is distinct from 'SUS' or def is distinct from (select definition from public.c2_survey_versions where survey_type='SUS' and version=1) then
    raise exception 'invalid version definition or unverified SUS' using errcode='22023'; end if;
  end if;
  if typ='SUS' and def is distinct from (select definition from public.c2_survey_versions where survey_type='SUS' and version=1) then raise exception 'standard SUS required' using errcode='22023'; end if;
  if jsonb_array_length(def->'questions') not between 1 and 10 then raise exception 'one to ten questions required' using errcode='22023'; end if;
  for q in select value from jsonb_array_elements(def->'questions') loop
   if jsonb_typeof(q)<>'object' or coalesce(q->>'id','') !~ '^[a-z][a-z0-9_]{0,39}$' or (q->>'id')=any(ids)
    or coalesce(q->>'kind','') not in ('rating','text') or jsonb_typeof(q->'optional') is distinct from 'boolean'
    or jsonb_typeof(q->'label') is distinct from 'string' or length(btrim(q->>'label')) not between 1 and 1000 then raise exception 'invalid question' using errcode='22023'; end if;
   ids:=array_append(ids,q->>'id');
  end loop;
  insert into public.c2_survey_versions(survey_type,version,definition) values(typ,ver,def) returning id into obj;
  return jsonb_build_object('id',obj);
 elsif p_action='open_round' then
  insert into public.c2_survey_rounds(version_id) values((p_data->>'version_id')::uuid) returning id into obj;
  return jsonb_build_object('id',obj);
 elsif p_action='close_round' then
  update public.c2_survey_rounds set closed_at=clock_timestamp() where id=(p_data->>'id')::uuid and closed_at='infinity' returning id into obj;
  if obj is null then raise exception 'open round required' using errcode='22023'; end if;
  update public.c2_survey_responses set state='cancelled' where round_id=obj and state='pending';
  return jsonb_build_object('id',obj);
 elsif p_action='set_gap' then
  update public.c2_survey_settings set gap_days=(p_data->>'days')::integer where singleton;
  return jsonb_build_object('gap_days',(select gap_days from public.c2_survey_settings where singleton));
 elsif p_action='versions' then
  select coalesce(jsonb_agg(to_jsonb(v) order by id),'[]') into rows from (select * from public.c2_survey_versions where p_after is null or id>p_after order by id limit lim+1) v;
 elsif p_action='rounds' then
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select r.id,to_jsonb(r)||jsonb_build_object('survey_type',v.survey_type,'version',v.version,
    'answered',(select count(*) from public.c2_survey_responses s where s.round_id=r.id and s.state='answered'),
    'pending',(select count(*) from public.c2_survey_responses s where s.round_id=r.id and s.state='pending')) v
   from public.c2_survey_rounds r join public.c2_survey_versions v on v.id=r.version_id where p_after is null or r.id>p_after order by r.id limit lim+1
  ) x;
 else
  -- CSV-ready projection: code only, never auth id/name/email. Text still needs CSV formula escaping in Phase 2.
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select s.id,jsonb_build_object('id',s.id,'participant_code',p.participant_code,'round_id',s.round_id,
    'survey_type',v.survey_type,'version',v.version,'answered_at',s.answered_at,'answers',s.answers,'score',nullif(s.score,-1)) v
   from public.c2_survey_responses s join public.profiles p using(user_id) join public.c2_survey_rounds r on r.id=s.round_id
   join public.c2_survey_versions v on v.id=r.version_id
   where s.state='answered' and (p_after is null or s.id>p_after) and (not(p_data?'round_id') or s.round_id=(p_data->>'round_id')::uuid)
   order by s.id limit lim+1
  ) x;
 end if;
 return jsonb_build_object('rows',rows-lim,'next',case when jsonb_array_length(rows)>lim then rows->(lim-1)->'id' else null end);
end $$;

create function public.participant_survey_v1(p_answers jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles%rowtype; cfg public.c2_survey_settings%rowtype; s public.c2_survey_responses%rowtype;
 r public.c2_survey_rounds%rowtype; v public.c2_survey_versions%rowtype; q jsonb; a jsonb; keys text[]:='{}'; total numeric:=0; pos integer:=0;
begin
 if not public.is_approved() or not public.has_consented() then raise exception 'approved consenting participant only' using errcode='42501'; end if;
 select * into p from public.profiles where user_id=auth.uid() for update;
 if exists(select 1 from public.c2_account_deletions where user_id=p.user_id) then raise exception 'pending deletion' using errcode='42501'; end if;
 select * into cfg from public.c2_survey_settings where singleton for share;
 select * into s from public.c2_survey_responses where user_id=p.user_id and state='pending' for update;
 if s.id is null then
  if p_answers is not null then raise exception 'pending survey required' using errcode='22023'; end if;
  if p.created_at>=cfg.activated_at and (select count(*) from (select 1 from public.attempts where user_id=p.user_id and mode='practice' limit 5) x)<5 then return jsonb_build_object('pending',null); end if;
  if exists(select 1 from public.c2_survey_responses where user_id=p.user_id
   and greatest(offered_at,case when isfinite(answered_at) then answered_at else offered_at end)>clock_timestamp()-make_interval(days=>cfg.gap_days)) then return jsonb_build_object('pending',null); end if;
  select * into r from public.c2_survey_rounds where closed_at='infinity'
   and not exists(select 1 from public.c2_survey_responses s2 where s2.round_id=c2_survey_rounds.id and s2.user_id=p.user_id)
   order by opened_at,id limit 1 for share;
  if r.id is null then return jsonb_build_object('pending',null); end if;
  insert into public.c2_survey_responses(user_id,round_id) values(p.user_id,r.id) returning * into s;
 else
  select * into r from public.c2_survey_rounds where id=s.round_id for share;
  if r.closed_at<>'infinity' then raise exception 'round closed' using errcode='22023'; end if;
 end if;
 select * into v from public.c2_survey_versions where id=r.version_id;
 if p_answers is null then return jsonb_build_object('pending',jsonb_build_object('id',s.id,'round_id',r.id,'survey_type',v.survey_type,'version',v.version,'definition',v.definition)); end if;
 -- Bind submissions to the offered response, so a stale form cannot answer another round.
 if jsonb_typeof(p_answers)<>'object' or p_answers->>'id' is distinct from s.id::text then raise exception 'survey response mismatch' using errcode='22023'; end if;
 p_answers:=p_answers->'answers';
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>20000 then raise exception 'invalid answers' using errcode='22023'; end if;
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  pos:=pos+1; keys:=array_append(keys,q->>'id'); a:=p_answers->(q->>'id');
  if a is null and (q->>'optional')::boolean then continue; end if;
  if q->>'kind'='rating' then
   if a is null or jsonb_typeof(a)<>'number' or (a::text)::numeric not between 1 and 5 or (a::text)::numeric<>trunc((a::text)::numeric) then raise exception 'rating must be integer 1-5' using errcode='22023'; end if;
   if v.definition->>'scoring'='sus' then total:=total+case when pos%2=1 then (a::text)::numeric-1 else 5-(a::text)::numeric end; end if;
  else
   if a is null or jsonb_typeof(a)<>'string' or length(a#>>'{}')>1000 or (not(q->>'optional')::boolean and length(btrim(a#>>'{}'))=0) then raise exception 'invalid text answer' using errcode='22023'; end if;
  end if;
 end loop;
 if exists(select 1 from jsonb_object_keys(p_answers) k where not(k=any(keys))) then raise exception 'unknown answer key' using errcode='22023'; end if;
 update public.c2_survey_responses set answers=p_answers,answered_at=clock_timestamp(),state='answered',score=case when v.definition->>'scoring'='sus' then total*2.5 else -1 end where id=s.id;
 return jsonb_build_object('answered',true);
end $$;
revoke all on function public.owner_account_deletion_v1(text,uuid,uuid,integer),public.owner_account_directory_v1(text,text,jsonb,timestamptz,integer),public.owner_surveys_v1(text,jsonb,uuid,integer),public.participant_survey_v1(jsonb) from public,anon,authenticated;
grant execute on function public.owner_account_deletion_v1(text,uuid,uuid,integer),public.owner_account_directory_v1(text,text,jsonb,timestamptz,integer),public.owner_surveys_v1(text,jsonb,uuid,integer),public.participant_survey_v1(jsonb) to authenticated;
