-- RAD085-P1-B-20261028: additive usability only; no table, ACL or visibility changes.
-- Signup already copies raw_user_meta_data.display_name to profiles.display_name.
-- Legacy null names remain null; never derive a display name from email or UUID.
-- 8 Crockford symbols = 40 bits; unchanged 10 guesses/hour/user and group expiry.
-- Existing long codes require supervisor rotation after installation (digest-only storage).
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $guard$
begin
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then
  raise exception 'launch gate must be closed' using errcode='55000';
 end if;
 if to_regprocedure('assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)') is null
 or to_regprocedure('assess.join_request_v1(text)') is null
 or to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)') is null then
  raise exception 'M1-M4 required' using errcode='55000';
 end if;
end $guard$;
create or replace function assess.supervisor_group_v1(p_action text,p_group uuid default null,p_revision integer default null,p_name text default null,p_ends timestamptz default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g assess.groups; raw text; bits bigint; i integer; attempt integer; collision text;
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
  -- First 40 UUIDv4 bits precede the fixed version/variant bits: uniform 40-bit space.
  -- Retry only the digest constraint; an exhausted retry rolls back the entire RPC.
  for attempt in 1..16 loop
   bits:=('x'||substr(replace(gen_random_uuid()::text,'-',''),1,10))::bit(40)::bigint;
   raw:='';
   for i in reverse 7..0 loop
    raw:=raw||substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ',((bits>>(i*5))&31)::integer+1,1);
   end loop;
   -- Rotating to the same digest must also retry, rather than keep the old code valid.
   if exists(select 1 from assess.group_join_codes where group_id=g.id and digest=encode(sha256(convert_to(raw,'UTF8')),'hex')) then
    if attempt=16 then raise exception 'code allocation exhausted' using errcode='54000'; end if;
    continue;
   end if;
   begin
    insert into assess.group_join_codes values(g.id,encode(sha256(convert_to(raw,'UTF8')),'hex'),g.ends_at,null)
    on conflict(group_id) do update set digest=excluded.digest,expires_at=excluded.expires_at,revoked_at=null;
    exit;
   exception when unique_violation then
    get stacked diagnostics collision=constraint_name;
    if collision<>'group_join_codes_digest_key' then raise; end if;
    if attempt=16 then raise exception 'code allocation exhausted' using errcode='54000'; end if;
   end;
  end loop;
 else update assess.group_join_codes set revoked_at=clock_timestamp() where group_id=g.id; end if;
 if p_action='end' then
  delete from assess.memberships where group_id=g.id;
  update assess.group_join_requests set state='cancelled',revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where group_id=g.id and state='pending';
  select * into g from assess.groups where id=g.id;
 end if;
 return jsonb_build_object('id',g.id,'revision',g.scope_revision,'code',raw);
end $$;

create or replace function assess.join_request_v1(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
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
 p_code:=upper(regexp_replace(p_code,'[[:space:]-]','','g'));
 if p_code is null or length(p_code)<>8 or p_code !~ '^[0-9A-HJKMNP-TV-Z]{8}$' then return jsonb_build_object('outcome','unavailable'); end if;
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
    select r.id,r.user_id,r.state,r.revision,p.display_name from assess.group_join_requests r join public.profiles p on p.user_id=r.user_id
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
commit;
