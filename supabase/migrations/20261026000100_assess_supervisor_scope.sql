-- RAD-085 LOCAL ONLY. Deferred from the current browser contract. No live installation.
-- Existing tables are extended, never recreated. Existing function bodies/ACLs stay intact.
begin;
create table assess.scope_lock (singleton boolean primary key default true check(singleton));
insert into assess.scope_lock default values;
create table assess.supervisor_appointments (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 appointed_by uuid not null references public.profiles(user_id),
 appointed_at timestamptz not null, revoked_at timestamptz,
 revision integer not null default 1 check(revision>0)
);
alter table assess.groups add column supervisor_id uuid references public.profiles(user_id),
 add column starts_at timestamptz, add column ends_at timestamptz, add column ended_at timestamptz,
 add column scope_revision integer not null default 1 check(scope_revision>0),
 add constraint groups_supervisor_window check(supervisor_id is null or (starts_at is not null and ends_at is not null and starts_at<ends_at));
create index assess_supervisor_groups on assess.groups(supervisor_id,id) where supervisor_id is not null;
create table assess.membership_periods (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references assess.groups(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 joined_at timestamptz not null, left_at timestamptz,
 check(left_at is null or left_at>=joined_at), unique(id,group_id,user_id)
);
create unique index assess_one_membership_period on assess.membership_periods(group_id,user_id) where left_at is null;
alter table assess.memberships add column period_id uuid,
 add constraint memberships_current_period foreign key(period_id,group_id,user_id) references assess.membership_periods(id,group_id,user_id);
create table assess.group_join_codes (
 group_id uuid primary key references assess.groups(id) on delete cascade,
 digest text not null unique check(digest ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz not null, revoked_at timestamptz
);
create table assess.group_join_requests (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references assess.groups(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 state text not null check(state in ('pending','approved','rejected','cancelled')),
 revision integer not null default 1 check(revision>0), requested_at timestamptz not null,
 decided_at timestamptz, decided_by uuid references public.profiles(user_id), unique(group_id,user_id)
);
create index assess_join_requests_user on assess.group_join_requests(user_id,id);
create index assess_join_requests_group on assess.group_join_requests(group_id,id);
create table assess.join_request_throttles (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 window_at timestamptz not null, used integer not null check(used between 0 and 10)
);
-- Unconfigured until the owner approves the actual sharing text/version. No invented acceptance.
create table assess.sharing_policy (
 singleton boolean primary key default true check(singleton), required_version text,
 text_digest text, check((required_version is null and text_digest is null) or
 (required_version is not null and text_digest is not null and length(required_version) between 1 and 100 and text_digest ~ '^[a-f0-9]{64}$'))
);
insert into assess.sharing_policy default values;
create table assess.sharing_consents (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 version text not null, text_digest text not null, accepted_at timestamptz not null
);
-- Server receipt only; legacy attempts have NO receipt and are excluded. No public column/grant changes.
create table assess.practice_recordings (
 attempt_id uuid primary key references public.attempts(id) on delete cascade,
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 recorded_at timestamptz not null
);
create index assess_practice_recorded on assess.practice_recordings(user_id,recorded_at,attempt_id);
create function assess.record_practice_v1() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into assess.practice_recordings(attempt_id,user_id,recorded_at) values(new.id,new.user_id,clock_timestamp());
 return new;
end $$;
create trigger assess_practice_recorded after insert on public.attempts for each row execute function assess.record_practice_v1();

-- Pilot serialization boundary: SHARE readers, UPDATE writers, held through transaction end.
-- All public v2 entrypoints below take this BEFORE profile/group/draft locks.
create function assess.scope_enter_v1(p_write boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read committed required' using errcode='55000'; end if;
 if p_write then perform 1 from assess.scope_lock for update; else perform 1 from assess.scope_lock for share; end if;
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() or exists(select 1 from assess.account_stops where user_id=auth.uid()) then
  raise exception 'approved active account required' using errcode='42501'; end if;
end $$;
create function assess.sharing_allowed_v1(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from assess.sharing_consents c join assess.sharing_policy p
 on c.version=p.required_version and c.text_digest=p.text_digest where c.user_id=p_user)
$$;
create function assess.supervised_group_v1(p_group uuid) returns assess.groups language plpgsql security definer set search_path='' as $$
declare g assess.groups;
begin
 select * into g from assess.groups where id=p_group and supervisor_id=auth.uid();
 if g.id is null or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
 then raise exception 'group denied' using errcode='42501'; end if;
 if g.ended_at is not null or clock_timestamp()>=g.ends_at then raise exception 'group expired' using errcode='55000'; end if;
 return g;
end $$;
create function assess.appointment_v1(p_user uuid,p_appoint boolean) returns integer language plpgsql security definer set search_path='' as $$
declare r integer;
begin
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user for share;
 if p_appoint is null or not exists(select 1 from public.profiles where user_id=p_user)
 or (p_appoint and not exists(select 1 from public.profiles where user_id=p_user and role='participant' and status='approved'))
 then raise exception 'invalid appointment' using errcode='22023'; end if;
 if p_appoint then
  insert into assess.supervisor_appointments(user_id,appointed_by,appointed_at) values(p_user,auth.uid(),clock_timestamp())
  on conflict(user_id) do update set appointed_by=excluded.appointed_by,appointed_at=excluded.appointed_at,
   revoked_at=null,revision=assess.supervisor_appointments.revision+1 where assess.supervisor_appointments.revoked_at is not null;
 else
  update assess.supervisor_appointments set revoked_at=clock_timestamp(),revision=revision+1 where user_id=p_user and revoked_at is null;
  update assess.group_join_codes c set revoked_at=clock_timestamp() from assess.groups g where c.group_id=g.id and g.supervisor_id=p_user;
 end if;
 select revision into r from assess.supervisor_appointments where user_id=p_user;
 return r;
end $$;
create function assess.sharing_consent_v1(p_version text default null,p_digest text default null,p_accept boolean default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p assess.sharing_policy;
begin
 perform assess.scope_enter_v1(p_accept is not null);
 select * into p from assess.sharing_policy;
 if p_accept is true then
  if p.required_version is null or p_version is distinct from p.required_version or p_digest is distinct from p.text_digest then
   raise exception 'sharing policy unavailable or changed' using errcode='55000'; end if;
  insert into assess.sharing_consents values(auth.uid(),p_version,p_digest,clock_timestamp())
  on conflict(user_id) do update set version=excluded.version,text_digest=excluded.text_digest,accepted_at=excluded.accepted_at
   where assess.sharing_consents.version<>excluded.version or assess.sharing_consents.text_digest<>excluded.text_digest;
 elsif p_accept is false then delete from assess.sharing_consents where user_id=auth.uid(); end if;
 return jsonb_build_object('version',p.required_version,'textDigest',p.text_digest,'accepted',assess.sharing_allowed_v1(auth.uid()));
end $$;
-- Protect managed groups from legacy owner deletion; no replacement of legacy RPC bodies.
create function assess.guard_managed_group_v1() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.supervisor_id is not null then
  if tg_op='DELETE' then
   if exists(select 1 from public.profiles where user_id=old.owner_id) then
    raise exception 'managed group must be ended' using errcode='42501'; end if;
   return old;
  end if;
  if new.owner_id is distinct from old.owner_id or new.supervisor_id is distinct from old.supervisor_id or new.starts_at is distinct from old.starts_at
   or new.name is distinct from old.name or new.ends_at is distinct from old.ends_at then
   raise exception 'managed group provenance immutable' using errcode='42501'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger assess_managed_group before update or delete on assess.groups for each row execute function assess.guard_managed_group_v1();
create function assess.membership_period_v1() returns trigger language plpgsql security definer set search_path='' as $$
declare g assess.groups; ts timestamptz:=clock_timestamp();
begin
 if tg_op='UPDATE' then
  if old.period_id is not null then raise exception 'membership period immutable' using errcode='42501'; end if;
  return new;
 end if;
 select * into g from assess.groups where id=case when tg_op='DELETE' then old.group_id else new.group_id end;
 if g.supervisor_id is null then if tg_op='DELETE' then return old; else return new; end if; end if;
 -- Legacy owner membership writes must not bypass approval/periods on managed groups.
 if public.is_owner() then raise exception 'managed membership requires join decision' using errcode='42501'; end if;
 if tg_op='DELETE' then
  update assess.membership_periods set left_at=ts where id=old.period_id and left_at is null;
  update assess.groups set scope_revision=scope_revision+1 where id=old.group_id;
  return old;
 end if;
 if g.supervisor_id is distinct from auth.uid() or not assess.sharing_allowed_v1(new.user_id) then
  raise exception 'managed membership denied' using errcode='42501'; end if;
 insert into assess.membership_periods(group_id,user_id,joined_at) values(new.group_id,new.user_id,ts) returning id into new.period_id;
 update assess.groups set scope_revision=scope_revision+1 where id=new.group_id;
 return new;
end $$;
create trigger assess_membership_period before insert or update or delete on assess.memberships for each row execute function assess.membership_period_v1();

create function assess.supervisor_group_v1(p_action text,p_group uuid default null,p_revision integer default null,p_name text default null,p_ends timestamptz default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g assess.groups; raw text;
begin
 perform assess.scope_enter_v1(true);
 if not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
 or not exists(select 1 from public.profiles where user_id=auth.uid() and role='participant') then raise exception 'supervisor only' using errcode='42501'; end if;
 if p_action='create' then
  if p_name is null or length(btrim(p_name)) not between 1 and 100 or p_ends is null or p_ends<=clock_timestamp() then
   raise exception 'invalid group' using errcode='22023'; end if;
  insert into assess.groups(owner_id,name,supervisor_id,starts_at,ends_at)
   values(auth.uid(),btrim(p_name),auth.uid(),clock_timestamp(),p_ends) returning * into g;
 else
  g:=assess.supervised_group_v1(p_group);
  if g.scope_revision is distinct from p_revision then raise exception 'group changed' using errcode='40001'; end if;
  if p_action not in ('rotate','revoke-code','end') or p_action is null then raise exception 'invalid action' using errcode='22023'; end if;
  update assess.groups set scope_revision=scope_revision+1,ended_at=case when p_action='end' then clock_timestamp() else ended_at end where id=g.id returning * into g;
 end if;
 if p_action in ('create','rotate') then
  raw:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into assess.group_join_codes values(g.id,encode(sha256(convert_to(raw,'UTF8')),'hex'),g.ends_at,null)
  on conflict(group_id) do update set digest=excluded.digest,expires_at=excluded.expires_at,revoked_at=null;
 else update assess.group_join_codes set revoked_at=clock_timestamp() where group_id=g.id; end if;
 if p_action='end' then
  delete from assess.memberships where group_id=g.id;
  update assess.group_join_requests set state='cancelled',revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where group_id=g.id and state='pending';
  select * into g from assess.groups where id=g.id;
 end if;
 return jsonb_build_object('id',g.id,'revision',g.scope_revision,'code',raw);
end $$;
create function assess.join_request_v1(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare gid uuid; r assess.group_join_requests; used_count integer; ts timestamptz;
begin
 perform assess.scope_enter_v1(true); ts:=clock_timestamp();
 if not exists(select 1 from public.profiles where user_id=auth.uid() and role='participant') or not assess.sharing_allowed_v1(auth.uid()) then
  raise exception 'sharing consent required' using errcode='42501'; end if;
 insert into assess.join_request_throttles values(auth.uid(),ts,0) on conflict do nothing;
 update assess.join_request_throttles set window_at=ts,used=0 where user_id=auth.uid() and window_at<=ts-interval '1 hour';
 select used into used_count from assess.join_request_throttles where user_id=auth.uid();
 if used_count>=10 then return jsonb_build_object('outcome','unavailable'); end if;
 update assess.join_request_throttles set used=used+1 where user_id=auth.uid();
 if p_code is null or length(p_code)<>64 then return jsonb_build_object('outcome','unavailable'); end if;
 select g.id into gid from assess.group_join_codes c join assess.groups g on g.id=c.group_id
 join assess.supervisor_appointments a on a.user_id=g.supervisor_id join public.profiles p on p.user_id=a.user_id
 where c.digest=encode(sha256(convert_to(p_code,'UTF8')),'hex') and c.revoked_at is null and c.expires_at>ts
 and g.ended_at is null and g.ends_at>ts and a.revoked_at is null and p.status='approved'
 and not exists(select 1 from assess.account_stops where user_id=a.user_id);
 if gid is null then return jsonb_build_object('outcome','unavailable'); end if;
 if exists(select 1 from assess.memberships where group_id=gid and user_id=auth.uid()) then return jsonb_build_object('outcome','member'); end if;
 insert into assess.group_join_requests(group_id,user_id,state,requested_at) values(gid,auth.uid(),'pending',ts)
 on conflict(group_id,user_id) do update set state='pending',requested_at=ts,revision=assess.group_join_requests.revision+1,decided_at=null,decided_by=null
 where assess.group_join_requests.state<>'pending';
 select * into r from assess.group_join_requests where group_id=gid and user_id=auth.uid();
 return jsonb_build_object('outcome','pending','id',r.id,'revision',r.revision);
end $$;
create function assess.join_decide_v1(p_request uuid,p_revision integer,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare r assess.group_join_requests;
begin
 perform assess.scope_enter_v1(true);
 select * into r from assess.group_join_requests where id=p_request;
 if r.id is null then raise exception 'request denied' using errcode='42501'; end if;
 if p_action='cancel' then
  if r.user_id<>auth.uid() then raise exception 'request denied' using errcode='42501'; end if;
 else
  perform assess.supervised_group_v1(r.group_id);
  if p_action is null or p_action not in ('approve','reject') then raise exception 'invalid action' using errcode='22023'; end if;
 end if;
 if r.revision is distinct from p_revision or r.state<>'pending' then raise exception 'request changed' using errcode='40001'; end if;
 if p_action='approve' then
  perform 1 from public.profiles where user_id=r.user_id for share;
  if not exists(select 1 from public.profiles where user_id=r.user_id and status='approved' and role='participant')
   or exists(select 1 from assess.account_stops where user_id=r.user_id) or not assess.sharing_allowed_v1(r.user_id) then
   raise exception 'student unavailable' using errcode='42501'; end if;
  if (select count(*) from assess.memberships where group_id=r.group_id)>=1000 then raise exception 'group limit' using errcode='54000'; end if;
  insert into assess.memberships(group_id,user_id) values(r.group_id,r.user_id);
 end if;
 update assess.group_join_requests set state=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'cancelled' end,
  revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;
end $$;
create function assess.group_leave_v1(p_group uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform assess.scope_enter_v1(true);
 delete from assess.memberships where group_id=p_group and user_id=auth.uid()
  and exists(select 1 from assess.groups where id=p_group and supervisor_id is not null);
end $$;

-- Filter this relation BEFORE any counts/aggregates/keyset paging. No legacy/no-consent periods.
create function assess.visible_members_v1(p_group uuid) returns table(user_id uuid,period_id uuid,visible_from timestamptz)
language sql stable security definer set search_path='' as $$
 select m.user_id,m.period_id,greatest(mp.joined_at,g.starts_at,a.appointed_at,c.accepted_at)
 from assess.memberships m join assess.membership_periods mp on mp.id=m.period_id and mp.left_at is null
 join assess.groups g on g.id=m.group_id join assess.supervisor_appointments a on a.user_id=g.supervisor_id
 join public.profiles p on p.user_id=m.user_id join assess.sharing_consents c on c.user_id=m.user_id
 where m.group_id=p_group and g.supervisor_id=auth.uid() and g.ended_at is null and g.ends_at>clock_timestamp()
 and a.revoked_at is null and p.status='approved' and assess.sharing_allowed_v1(m.user_id)
 and not exists(select 1 from assess.account_stops where user_id=m.user_id)
$$;
create function assess.scope_page_v1(p_kind text,p_group uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb; total bigint; ts timestamptz; g assess.groups;
begin
 perform assess.scope_enter_v1(false); ts:=clock_timestamp();
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_kind='groups' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select grp.id,grp.name,grp.supervisor_id,grp.starts_at,grp.ends_at,grp.scope_revision revision,
    greatest(grp.starts_at,a.appointed_at) supervised_from
   from assess.groups grp join assess.supervisor_appointments a on a.user_id=grp.supervisor_id
   where grp.supervisor_id=auth.uid() and a.revoked_at is null and grp.ended_at is null and grp.ends_at>ts
    and (p_after is null or grp.id>p_after) order by grp.id limit p_limit) q;
 elsif p_kind='my-requests' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select id,group_id,state,revision from assess.group_join_requests where user_id=auth.uid()
   and (p_after is null or id>p_after) order by id limit p_limit) q;
 elsif p_kind='appointments' then
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select a.user_id id,p.display_name,a.revoked_at,a.revision from assess.supervisor_appointments a join public.profiles p on p.user_id=a.user_id
   where p_after is null or a.user_id>p_after order by a.user_id limit p_limit) q;
 else
  g:=assess.supervised_group_v1(p_group);
  if p_kind='members' then
   select count(*) into total from assess.visible_members_v1(g.id);
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select v.user_id id,p.display_name,v.period_id,v.visible_from from assess.visible_members_v1(g.id) v
    join public.profiles p on p.user_id=v.user_id where p_after is null or v.user_id>p_after order by v.user_id limit p_limit) q;
  elsif p_kind='requests' then
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select id,user_id,state,revision from assess.group_join_requests where group_id=g.id
    and (p_after is null or id>p_after) order by id limit p_limit) q;
  elsif p_kind='practice' then
   with visible as materialized (
    select r.attempt_id id,r.user_id,r.recorded_at,a.exam_id,a.case_id,
     case when jsonb_typeof(a.result->'total')='number' then a.result->'total' else null end score
    from assess.visible_members_v1(g.id) m join assess.practice_recordings r on r.user_id=m.user_id
    join public.attempts a on a.id=r.attempt_id where r.recorded_at>=m.visible_from and r.recorded_at<least(ts,g.ends_at) and a.mode='practice' and a.record_kind='attempt'
   ) select (select count(*) from visible),coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into total,rows
   from (select * from visible where p_after is null or id>p_after order by id limit p_limit) q;
  else raise exception 'invalid page kind' using errcode='22023'; end if;
 end if;
 return jsonb_build_object('version',1,'rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

alter table assess.scope_lock enable row level security;
alter table assess.supervisor_appointments enable row level security;
alter table assess.membership_periods enable row level security;
alter table assess.group_join_codes enable row level security;
alter table assess.group_join_requests enable row level security;
alter table assess.join_request_throttles enable row level security;
alter table assess.sharing_policy enable row level security;
alter table assess.sharing_consents enable row level security;
alter table assess.practice_recordings enable row level security;
revoke all on assess.scope_lock,assess.supervisor_appointments,assess.membership_periods,assess.group_join_codes,
 assess.group_join_requests,assess.join_request_throttles,assess.sharing_policy,assess.sharing_consents,assess.practice_recordings from public,anon,authenticated,assess_worker;
revoke all on function assess.record_practice_v1(),assess.scope_enter_v1(boolean),assess.sharing_allowed_v1(uuid),
 assess.supervised_group_v1(uuid),assess.guard_managed_group_v1(),assess.membership_period_v1(),assess.visible_members_v1(uuid),
 assess.appointment_v1(uuid,boolean),assess.sharing_consent_v1(text,text,boolean),assess.supervisor_group_v1(text,uuid,integer,text,timestamptz),
 assess.join_request_v1(text),assess.join_decide_v1(uuid,integer,text),assess.group_leave_v1(uuid),assess.scope_page_v1(text,uuid,uuid,integer)
 from public,anon,authenticated,assess_worker;
grant execute on function assess.appointment_v1(uuid,boolean),assess.sharing_consent_v1(text,text,boolean),
 assess.supervisor_group_v1(text,uuid,integer,text,timestamptz),assess.join_request_v1(text),assess.join_decide_v1(uuid,integer,text),
 assess.group_leave_v1(uuid),assess.scope_page_v1(text,uuid,uuid,integer) to authenticated;
commit;
