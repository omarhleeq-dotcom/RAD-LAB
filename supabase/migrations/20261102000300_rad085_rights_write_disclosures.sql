-- RAD-085 R1/R2/S1/P2/P3. DEFERRED / NOT APPLIED.
-- One owner laptop window: M09 -> 0200 -> 0300. No role/database/PostgREST setting changes.
begin;
set local search_path=public;
set local lock_timeout='2s';
set local statement_timeout='8s';
do $pre$ begin
 if current_user<>'postgres' or to_regnamespace('emergency') is null then
  raise exception 'RAD085 post-0200 catalogue required' using errcode='55000'; end if;
 if not coalesce((select bool_and(ok) from (
with functions as (
 select p.oid::regprocedure::text signature,replace(p.prosrc,E'\r','') body,
  l.lanname,p.prokind,p.prosecdef,p.provolatile,p.proisstrict,p.proparallel,p.proleakproof,
  format_type(p.prorettype,null) returns_type,p.proretset,p.proargnames,p.proargmodes,
  pg_get_expr(p.proargdefaults,0) argument_defaults,p.proconfig,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x) grants) acl,r.rolname owner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 join pg_language l on l.oid=p.prolang join pg_roles r on r.oid=p.proowner
 where n.nspname in ('assess','emergency') or (n.nspname='public' and l.lanname in ('sql','plpgsql') and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
  and not (p.oid is not distinct from to_regprocedure('public.rls_auto_enable()') and p.prorettype='event_trigger'::regtype))
), relations as (
 select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x) grants) acl,r.rolname owner,
  (select jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(a.attacl,acldefault('c',c.relowner))) x) grants),a.attidentity,a.attgenerated,
    pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
   from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
   where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) columns,
  (select jsonb_agg(jsonb_build_array(k.conname,replace(pg_get_constraintdef(k.oid),E'\r','')) order by k.conname)
   from pg_constraint k where k.conrelid=c.oid and k.contype<>'n') constraints,
  (select jsonb_agg(jsonb_build_array(replace(pg_get_triggerdef(t.oid),E'\r',''),t.tgenabled) order by t.tgname)
   from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal) triggers,
  (select jsonb_agg(jsonb_build_array(pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text collate "C")
   from pg_index i where i.indrelid=c.oid) indexes,
  (select jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,
    (select jsonb_agg(case when role_oid=0 then 'public' else pg_get_userbyid(role_oid) end order by role_oid) from unnest(p.polroles) role_oid),
    pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname)
   from pg_policy p where p.polrelid=c.oid) policies
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
 where (n.nspname in ('assess','emergency') or (n.nspname='public' and c.relname in ('profiles','events','attempts','feedback','c2_account_deletions'))) and c.relkind in ('r','p')
), fingerprints as (
 select 'functions' check_name,md5((select jsonb_agg(to_jsonb(f) order by signature collate "C")::text from functions f)) actual,'a4d32be025297130709df18923b2ef28' expected
 union all select 'relations',md5((select jsonb_agg(to_jsonb(r) order by nspname,relname)::text from relations r)),'763a497ea914fe20984a815a2d5cf43e'
)
select check_name,actual=expected ok from fingerprints
union all select 'identity_inventory',(select inventory from assess.erasure_fk_contract where singleton)=assess.d3_fk_inventory_v1()
union all select 'not_null_constraints_plain',not exists(
 select 1 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where (n.nspname in ('assess','emergency') or (n.nspname='public' and c.relname in ('profiles','events','attempts','feedback','c2_account_deletions'))) and c.relkind in ('r','p')
 and k.contype='n' and (not k.convalidated or k.connoinherit))
union all select 'closed_gate',(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
union all select 'worker_nologin',exists(select 1 from pg_roles where rolname='assess_worker' and not rolcanlogin)
order by check_name
 ) reviewed),false) then raise exception 'RAD085 reviewed post-0200 catalogue required' using errcode='55000'; end if;
end $pre$;
set local search_path='';

-- R1: unchanged eligibility, self/last-owner, transfer and FK guards.
create or replace function public.owner_account_deletion_v1(p_action text,p_user uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles%rowtype; d public.c2_account_deletions%rowtype; prior_ban timestamptz;
 ids uuid[]:='{}'; target uuid; rows jsonb; processed integer:=0; blocked jsonb:='[]'; lim integer:=least(p_limit,100);
begin
 -- Retain M08: exclusive capacity precedes scope/profiles and emergency FK work.
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_action is null or p_action not in ('deactivate','restore','finalise','list') or p_limit is null or p_limit<1 then
  raise exception 'invalid deletion request' using errcode='22023'; end if;
 if p_action in ('deactivate','restore','finalise') then perform assess.owner_scope_enter_v1(true); end if;
 -- Serialise owner deletion operations and role/status writes while checking last owner.
 lock table public.profiles in share row exclusive mode;
 if not public.is_owner() then raise exception 'owner only after profile wait' using errcode='42501'; end if;
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
  select coalesce(array_agg(user_id order by user_id),'{}') into ids from (
   select user_id,requested_at from public.c2_account_deletions where requested_at+interval '30 days'<=clock_timestamp()
   and (p_after is null or user_id>p_after) order by user_id limit lim
  ) x;
 else
  if p_user is null then raise exception 'participant required' using errcode='22023'; end if;
  ids:=array[p_user];
 end if;
 foreach target in array ids loop
  begin -- Per-account savepoint: a failure cannot undo other accounts.
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
   -- Normal C2 eligibility above is unchanged. D3 transfers precede the deadline.
   perform assess.erase_account_d3_v1(target);
  end if;
  processed:=processed+1;
  exception when others then
   if p_action<>'finalise' then raise; end if;
   blocked:=blocked||jsonb_build_array(jsonb_build_object('user_id',target,'code',sqlstate));
  end;
 end loop;
 if jsonb_array_length(blocked)>0 then
  raise warning 'RAD085_ERASURE_BLOCKED: % account(s); owner action required',jsonb_array_length(blocked);
  perform pg_notify('rad085_erasure_blocked',jsonb_build_object('blocked',jsonb_array_length(blocked))::text);
 end if;
 return jsonb_build_object('processed',processed,'blocked',blocked,'alert',jsonb_array_length(blocked)>0,
  'next',case when cardinality(ids)=lim then ids[cardinality(ids)] else null end);
end $$;


-- R2: re-authorize after profile, membership and request writes/waits.
create or replace function assess.join_decide_v1(p_request uuid,p_revision integer,p_action text) returns void language plpgsql security definer set search_path='' as $$
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
  perform assess.supervised_group_v1(r.group_id);
  if not exists(select 1 from public.profiles where user_id=r.user_id and status='approved' and role='participant')
   or exists(select 1 from assess.account_stops where user_id=r.user_id) or not assess.sharing_allowed_v1(r.user_id) then
   raise exception 'student unavailable' using errcode='42501'; end if;
  if (select count(*) from assess.memberships where group_id=r.group_id)>=1000 then raise exception 'group limit' using errcode='54000'; end if;
  perform assess.supervised_group_v1(r.group_id);
  insert into assess.memberships(group_id,user_id) values(r.group_id,r.user_id);
 end if;
 if p_action<>'cancel' then perform assess.supervised_group_v1(r.group_id); end if;
 update assess.group_join_requests set state=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'cancelled' end,
  revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;
 if p_action<>'cancel' then perform assess.supervised_group_v1(r.group_id); end if;
end $$;

-- P3: opaque request id, display name and optimistic revision; S3 unchanged.
create or replace function assess.scope_page_v1(p_kind text,p_group uuid default null,p_after uuid default null,p_limit integer default 20)
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
   select r.id,r.group_id,r.state,r.revision,grp.name group_name
   from assess.group_join_requests r left join assess.groups grp on grp.id=r.group_id where r.user_id=auth.uid()
   and (p_after is null or r.id>p_after) order by r.id limit p_limit) q;
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
   -- RAD085-SEC-FIXES-20261027 SEC-02: only pending requests of accounts still eligible
   -- to join, filtered before paging. Decided/historical rows never reveal a student
   -- who left, withdrew sharing or is out of scope; owner audit data is not exposed here.
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select r.id,'pending'::text state,r.revision,p.display_name from assess.group_join_requests r join public.profiles p on p.user_id=r.user_id
    where r.group_id=g.id and r.state='pending' and p.status='approved' and p.role='participant'
    and not exists(select 1 from assess.account_stops s where s.user_id=r.user_id) and assess.sharing_allowed_v1(r.user_id)
    and not exists(select 1 from assess.memberships m where m.group_id=g.id and m.user_id=r.user_id)
    and (p_after is null or r.id>p_after) order by r.id limit p_limit) q;
  elsif p_kind='practice' then
   with visible as materialized (
    select r.attempt_id id,r.user_id,r.recorded_at,a.exam_id,a.case_id,p.display_name,
     case when jsonb_typeof(a.result->'total')='number' then a.result->'total' else null end score
    from assess.visible_members_v1(g.id) m join assess.practice_recordings r on r.user_id=m.user_id
    join public.attempts a on a.id=r.attempt_id left join public.profiles p on p.user_id=r.user_id where r.recorded_at>=m.visible_from and r.recorded_at<least(ts,g.ends_at) and a.mode='practice' and a.record_kind='attempt'
   ) select (select count(*) from visible),coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into total,rows
   from (select * from visible where p_after is null or id>p_after order by id limit p_limit) q;
  else raise exception 'invalid page kind' using errcode='22023'; end if;
 end if;
 return jsonb_build_object('appointed',exists(select 1 from assess.supervisor_appointments ap join public.profiles p on p.user_id=ap.user_id where ap.user_id=auth.uid() and ap.revoked_at is null and p.status='approved' and p.role='participant'),'version',1,'rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
-- S1: all proposed values in this one owner-reviewed table. Fixed UTC windows.
create table assess.pilot_write_limits (
 stream text primary key check(stream in ('events','attempts','feedback')),
 per_hour integer not null check(per_hour>0), per_day integer not null check(per_day>=per_hour)
);
-- DRAFT: owner values will be derived from the recorded 60-minute real UI run.
-- Per hour = 5 x measured writes; per day = 5 x four such hours.
insert into assess.pilot_write_limits values ('events',9955,39820),('attempts',3300,13200),('feedback',3300,13200);
create table assess.pilot_write_usage (
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 stream text not null references assess.pilot_write_limits(stream),
 hour_at timestamptz not null, day_at timestamptz not null,
 hour_count integer not null, day_count integer not null,
 primary key(user_id,stream)
);
alter table assess.pilot_write_limits enable row level security;
alter table assess.pilot_write_usage enable row level security;
revoke all on assess.pilot_write_limits,assess.pilot_write_usage from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
create function assess.pilot_write_quota_v1() returns trigger
language plpgsql security definer set search_path='' set timezone='UTC' as $$
declare used assess.pilot_write_usage; lim assess.pilot_write_limits; ts timestamptz;
begin
 if new.user_id is distinct from auth.uid() or not public.is_approved() then
  raise exception 'pilot writer denied' using errcode='42501'; end if;
 -- Account-only order: profile SHARE -> account/stream advisory -> usage.
 -- Erasure takes capacity -> profiles -> cascades. It must wait for this
 -- profile before touching usage; we never request its capacity/scope locks.
 -- Emergency phases share the profile lock and touch no quota/write rows.
 perform 1 from public.profiles where user_id=new.user_id for share;
 if not found or not public.is_approved() then raise exception 'pilot writer denied' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad085-write:'||new.user_id::text||':'||tg_table_name,0));
 ts:=clock_timestamp();
 if not public.is_approved() then raise exception 'pilot writer denied' using errcode='42501'; end if;
 select * into strict lim from assess.pilot_write_limits where stream=tg_table_name;
 insert into assess.pilot_write_usage as u values(new.user_id,tg_table_name,date_trunc('hour',ts),date_trunc('day',ts),1,1)
 on conflict(user_id,stream) do update set
  hour_count=case when u.hour_at=date_trunc('hour',ts) then u.hour_count+1 else 1 end,
  day_count=case when u.day_at=date_trunc('day',ts) then u.day_count+1 else 1 end,
  hour_at=date_trunc('hour',ts),day_at=date_trunc('day',ts)
 returning * into used;
 if used.hour_count>lim.per_hour then raise exception 'PILOT_WRITE_RATE_LIMIT' using errcode='P0851'; end if;
 if used.day_count>lim.per_day then raise exception 'PILOT_WRITE_DAILY_QUOTA' using errcode='P0852'; end if;
 return new;
end $$;
revoke all on function assess.pilot_write_quota_v1() from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
create trigger rad085_write_quota before insert on public.events for each row execute function assess.pilot_write_quota_v1();
create trigger rad085_write_quota before insert on public.attempts for each row execute function assess.pilot_write_quota_v1();
create trigger rad085_write_quota before insert on public.feedback for each row execute function assess.pilot_write_quota_v1();
-- No tombstone: usage is removed through the existing account erasure path.
update assess.erasure_fk_contract set inventory=assess.d3_fk_inventory_v1() where singleton;

-- P2: old versions remain immutable history. A fresh personal v3 acceptance is
-- required for new sessions and all manual reads/writes/replays (including owner).
alter table assess.consents drop constraint consents_version_check;
alter table assess.consents add constraint consents_version_check check(version in (
 'assess-pilot-2026-10-20-v1','assess-pilot-2026-10-20-v2','assess-written-2026-11-02-v3'));
create function assess.consent_v3(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
 if p_version is not null then
  if p_version<>'assess-written-2026-11-02-v3' then raise exception 'unsupported consent' using errcode='22023'; end if;
  if exists(select 1 from assess.account_stops where user_id=auth.uid()) then raise exception 'Assess disabled' using errcode='42501'; end if;
  insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id,version) do nothing;
  -- v3 displays the unchanged retention text as well; historical v2 is not v3.
  insert into assess.consents(user_id,version) values(auth.uid(),'assess-pilot-2026-10-20-v2') on conflict(user_id,version) do nothing;
 end if;
 return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-written-2026-11-02-v3'));
end $$;
revoke all on function assess.consent_v3(text) from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
grant execute on function assess.consent_v3(text) to authenticated;
create or replace function assess.require_consent_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from assess.consents where user_id=new.user_id and version='assess-written-2026-11-02-v3') then
  raise exception 'Assess written consent required' using errcode='42501'; end if;
 return new;
end $$;
do $patch$
declare original text; anchor text:='or s.id is null or s.lifecycle_version<>2';
begin
 original:=pg_get_functiondef('assess.manual_authorize_v1(uuid)'::regprocedure);
 if (length(original)-length(replace(original,anchor,'')))/length(anchor)<>1 then
  raise exception 'RAD085 manual consent anchor drift' using errcode='55000'; end if;
 execute replace(original,anchor,$replacement$or not exists(select 1 from assess.consents c where c.user_id=s.user_id and c.version='assess-written-2026-11-02-v3')
 or s.id is null or s.lifecycle_version<>2$replacement$);
end $patch$;
-- Preserve the disclosed elapsed 168 hours under any request timezone, including
-- final write barriers and the deadline shown by reads/queue. No role setting.
do $elapsed$
declare signatures text[]:=array['assess.manual_authorize_v1(uuid)','assess.manual_queue_v1(uuid,integer)',
 'assess.manual_read_v1(uuid)','assess.manual_score_v1(uuid,uuid,integer,jsonb,text)','assess.manual_finalize_v1(uuid,uuid,integer)'];
 expected integer[]:=array[1,2,2,1,2]; original text; needle text:='interval ''7 days'''; i integer;
begin
 for i in 1..array_length(signatures,1) loop
  original:=pg_get_functiondef(signatures[i]::regprocedure);
  if (length(original)-length(replace(original,needle,'')))/length(needle)<>expected[i] then
   raise exception 'RAD085 elapsed-time anchor drift' using errcode='55000'; end if;
  execute replace(original,needle,'interval ''168 hours''');
 end loop;
 original:=pg_get_functiondef('assess.manual_queue_v1(uuid,integer)'::regprocedure);
 needle:='where s.lifecycle_version=2 and s.state=''awaiting-manual'' and w.automatic_complete and s.emergency_held_at is null';
 if (length(original)-length(replace(original,needle,'')))/length(needle)<>1 then
  raise exception 'RAD085 queue consent anchor drift' using errcode='55000'; end if;
 execute replace(original,needle,needle||' and exists(select 1 from assess.consents c where c.user_id=s.user_id and c.version=''assess-written-2026-11-02-v3'')');
end $elapsed$;
-- An unreviewed default ACL must not silently grant a newly created private
-- table/helper to a role absent from the installation fixture. Abort atomically.
do $acl$ begin
 if exists(select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) x
  where c.oid in ('assess.pilot_write_limits'::regclass,'assess.pilot_write_usage'::regclass) and x.grantee<>c.relowner)
 or exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x
  where p.oid in ('assess.pilot_write_quota_v1()'::regprocedure,'assess.consent_v3(text)'::regprocedure)
  and x.grantee<>p.proowner and not(p.proname='consent_v3' and x.grantee='authenticated'::regrole and x.privilege_type='EXECUTE' and not x.is_grantable)) then
  raise exception 'RAD085 unreviewed new-object ACL' using errcode='55000'; end if;
end $acl$;
commit;
