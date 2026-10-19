-- Assess B only: identity reuse, isolated administration and immutable target expansion.
-- No Practice changes, exam content, keys, attempts, scoring or production execution.
create schema assess;
revoke all on schema assess from public,anon,authenticated;
grant usage on schema assess to authenticated;
alter default privileges in schema assess revoke execute on functions from public;

create table assess.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
create index assess_groups_owner_id on assess.groups(owner_id,id);
create table assess.memberships (
  group_id uuid not null references assess.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  primary key(group_id,user_id)
);
create index assess_memberships_user on assess.memberships(user_id,group_id);

-- Published metadata only. Future reviewed content publication writes this via C/D;
-- B has no content-authoring/publication RPC and seeds no exam content.
create table assess.versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  assessment_id uuid not null,
  version text not null check(length(version) between 1 and 100),
  name text not null check(length(btrim(name)) between 1 and 200),
  -- Open storage vocabulary. Unsupported track is rejected by RPCs, not coerced.
  track text not null check(length(track) between 1 and 100),
  schema_version integer not null default 1 check(schema_version>0),
  available boolean not null default false,
  unique(assessment_id,version)
);
create index assess_versions_owner_id on assess.versions(owner_id,id);
create table assess.assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  version_id uuid not null references assess.versions(id),
  revision integer not null default 1 check(revision>0),
  source_group_ids uuid[] not null default '{}',
  published_at timestamptz not null default now(),
  unique(owner_id,version_id)
);
create index assess_assignments_owner_id on assess.assignments(owner_id,id);
create table assess.targets (
  assignment_id uuid not null references assess.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  primary key(assignment_id,user_id)
);
create index assess_targets_user_assignment on assess.targets(user_id,assignment_id);

alter table assess.groups enable row level security;
alter table assess.memberships enable row level security;
alter table assess.versions enable row level security;
alter table assess.assignments enable row level security;
alter table assess.targets enable row level security;
-- Default-deny, including direct reads by owners. Only the guarded DTO RPCs below.
revoke all on all tables in schema assess from public,anon,authenticated;

create function assess.group_write_v1(p_id uuid default null,p_name text default null,p_delete boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare gid uuid;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_delete is null or (not p_delete and (p_name is null or length(btrim(p_name)) not between 1 and 100)) then
    raise exception 'invalid group' using errcode='22023'; end if;
  if p_id is null then
    if p_delete then raise exception 'invalid group' using errcode='22023'; end if;
    insert into assess.groups(owner_id,name) values(auth.uid(),btrim(p_name)) returning id into gid;
  else
    select id into gid from assess.groups where id=p_id and owner_id=auth.uid() for update;
    if gid is null then raise exception 'group denied' using errcode='42501'; end if;
    if p_delete then delete from assess.groups where id=gid;
    else update assess.groups set name=btrim(p_name) where id=gid; end if;
  end if;
  return gid;
end $$;

create function assess.members_write_v1(p_group uuid,p_users uuid[],p_add boolean)
returns void language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  perform 1 from assess.groups where id=p_group and owner_id=auth.uid() for update;
  if not found then raise exception 'group denied' using errcode='42501'; end if;
  if p_add is null or p_users is null or cardinality(p_users) not between 1 and 100
    or array_position(p_users,null) is not null then raise exception 'invalid members' using errcode='22023'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  if p_add then insert into assess.memberships(group_id,user_id) select p_group,u from unnest(p_users) u on conflict do nothing;
  else delete from assess.memberships where group_id=p_group and user_id=any(p_users); end if;
  select count(*) into n from assess.memberships where group_id=p_group;
  if n>10000 then raise exception 'too many members' using errcode='22023'; end if;
end $$;

create function assess.assign_v1(p_version uuid,p_users uuid[] default '{}',p_groups uuid[] default '{}')
returns uuid language plpgsql security definer set search_path='' as $$
declare aid uuid; sources uuid[]; n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  perform 1 from assess.versions where id=p_version and owner_id=auth.uid() and available
    and schema_version=1 and track in ('mixed','full-practical') for share;
  if not found then raise exception 'version denied' using errcode='42501'; end if;
  if p_users is null or p_groups is null or cardinality(p_users)>100 or cardinality(p_groups)>100
    or cardinality(p_users)+cardinality(p_groups)=0 or array_position(p_users,null) is not null
    or array_position(p_groups,null) is not null then raise exception 'invalid targets' using errcode='22023'; end if;
  -- Group locks match membership edits/deletion; sorted lock order prevents reversed-group deadlocks.
  perform id from assess.groups where id=any(p_groups) and owner_id=auth.uid() order by id for update;
  if exists(select 1 from unnest(p_groups) g where not exists(select 1 from assess.groups where id=g and owner_id=auth.uid())) then
    raise exception 'group denied' using errcode='42501'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  select coalesce(array_agg(distinct g order by g),'{}') into sources from unnest(p_groups) g;
  insert into assess.assignments(owner_id,version_id,source_group_ids) values(auth.uid(),p_version,sources) returning id into aid;
  insert into assess.targets(assignment_id,user_id)
    select aid,u from (select unnest(p_users) u union select m.user_id from assess.memberships m where m.group_id=any(p_groups)) q limit 10001;
  get diagnostics n=row_count;
  if n not between 1 and 10000 then raise exception 'target count outside operational limit' using errcode='22023'; end if;
  return aid;
end $$;

create function assess.targets_write_v1(p_assignment uuid,p_revision integer,p_users uuid[],p_add boolean)
returns integer language plpgsql security definer set search_path='' as $$
declare rev integer; n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  select revision into rev from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
  if rev is null then raise exception 'assignment denied' using errcode='42501'; end if;
  if p_revision is distinct from rev then raise exception 'assignment changed' using errcode='40001'; end if;
  if p_add is null or p_users is null or cardinality(p_users) not between 1 and 100
    or array_position(p_users,null) is not null then raise exception 'invalid targets' using errcode='22023'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  if p_add then insert into assess.targets(assignment_id,user_id) select p_assignment,u from unnest(p_users) u on conflict do nothing;
  else delete from assess.targets where assignment_id=p_assignment and user_id=any(p_users); end if;
  select count(*) into n from assess.targets where assignment_id=p_assignment;
  if n>10000 then raise exception 'too many targets' using errcode='22023'; end if;
  update assess.assignments set revision=revision+1 where id=p_assignment returning revision into rev;
  return rev;
end $$;

create function assess.owner_page_v1(p_kind text,p_context uuid default null,p_search text default '',p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare page jsonb; lim integer:=least(p_limit,100);
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_kind is null or p_kind not in ('groups','people','members','versions','assignments','targets')
    or p_limit is null or p_limit<1 or p_search is null or length(p_search)>100 then
    raise exception 'invalid page' using errcode='22023'; end if;
  if p_kind='members' and not exists(select 1 from assess.groups where id=p_context and owner_id=auth.uid()) then
    raise exception 'group denied' using errcode='42501'; end if;
  if p_kind='targets' and not exists(select 1 from assess.assignments where id=p_context and owner_id=auth.uid()) then
    raise exception 'assignment denied' using errcode='42501'; end if;
  if p_kind in ('people','members','targets') then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (
      select p.user_id id,jsonb_build_object('id',p.user_id,'name',p.display_name,'email',u.email,'status',p.status) v
      from public.profiles p join auth.users u on u.id=p.user_id
      where p.role='participant' and (p_after is null or p.user_id>p_after)
        and (p_kind='people' or (p_kind='members' and exists(select 1 from assess.memberships m where m.group_id=p_context and m.user_id=p.user_id))
          or (p_kind='targets' and exists(select 1 from assess.targets t where t.assignment_id=p_context and t.user_id=p.user_id)))
        and (p_search='' or strpos(lower(coalesce(p.display_name,'')||' '||coalesce(u.email,'')),lower(p_search))>0)
      order by p.user_id limit lim) q;
  elsif p_kind='groups' then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select g.id,jsonb_build_object('id',g.id,'name',g.name) v
      from assess.groups g where g.owner_id=auth.uid() and (p_after is null or g.id>p_after) order by g.id limit lim) q;
  elsif p_kind='versions' then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select a.id,jsonb_build_object('id',a.id,'name',a.name,'track',a.track,'version',a.version) v
      from assess.versions a where a.owner_id=auth.uid() and a.available and a.schema_version=1 and a.track in ('mixed','full-practical')
        and (p_after is null or a.id>p_after) order by a.id limit lim) q;
  else
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select a.id,jsonb_build_object('id',a.id,'name',v.name,'track',v.track,'version',v.version,'revision',a.revision) v
      from assess.assignments a join assess.versions v on v.id=a.version_id
      where a.owner_id=auth.uid() and (p_after is null or a.id>p_after) order by a.id limit lim) q;
  end if;
  return jsonb_build_object('version',1,'rows',page,'next',case when jsonb_array_length(page)=lim then page->(lim-1)->>'id' else null end);
end $$;

-- This access primitive returns metadata only. No exam body, key, result or start operation in B.
create function assess.assigned_version_v1(p_assignment uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.is_approved() then raise exception 'approved account required' using errcode='42501'; end if;
  select jsonb_build_object('schemaVersion',1,'assignmentId',a.id,'assignmentRevision',a.revision,
    'assessmentId',v.assessment_id,'version',v.version,'name',v.name,'track',v.track) into result
  from assess.assignments a join assess.targets t on t.assignment_id=a.id join assess.versions v on v.id=a.version_id
  where a.id=p_assignment and t.user_id=auth.uid() and v.available and v.schema_version=1 and v.track in ('mixed','full-practical');
  if result is null then raise exception 'assignment denied' using errcode='42501'; end if;
  return result;
end $$;

revoke all on all functions in schema assess from public,anon,authenticated;
grant execute on function assess.group_write_v1(uuid,text,boolean),assess.members_write_v1(uuid,uuid[],boolean),
  assess.assign_v1(uuid,uuid[],uuid[]),assess.targets_write_v1(uuid,integer,uuid[],boolean),
  assess.owner_page_v1(text,uuid,text,uuid,integer),assess.assigned_version_v1(uuid) to authenticated;
