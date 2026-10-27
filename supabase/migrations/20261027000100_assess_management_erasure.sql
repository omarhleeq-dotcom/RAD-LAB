-- RAD-085 D3 / O5. DEFERRED. No live application, consent, content or scoring changes.
begin;
-- Management is separate from nullable author provenance. A manager is never a supervisor.
create table assess.group_managers (
 group_id uuid primary key references assess.groups(id) on delete cascade,
 manager_id uuid not null references public.profiles(user_id)
);
create table assess.version_managers (
 version_id uuid primary key references assess.versions(id) on delete cascade,
 manager_id uuid not null references public.profiles(user_id)
);
create table assess.assignment_managers (
 assignment_id uuid primary key references assess.assignments(id) on delete cascade,
 manager_id uuid not null references public.profiles(user_id)
);
create index assess_group_managers_owner on assess.group_managers(manager_id,group_id);
create index assess_version_managers_owner on assess.version_managers(manager_id,version_id);
create index assess_assignment_managers_owner on assess.assignment_managers(manager_id,assignment_id);
-- Ephemeral while the account exists; the external encrypted reconciliation journal
-- remains authoritative after deletion/restore. No in-database identity tombstone.
create table assess.erasure_transfers (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 requested_at timestamptz not null, manager_id uuid not null references public.profiles(user_id),
 inventory_digest text not null check(inventory_digest ~ '^[a-f0-9]{64}$'),
 content_digest text not null check(content_digest ~ '^[a-f0-9]{64}$'),
 transferred_at timestamptz not null, erasing_xid bigint,
 check(transferred_at < requested_at+interval '30 days')
);
-- Independently reviewed retained free text/licensing, bound to exact content bytes.
-- No text, names, content copies or attribution are copied into this clearance.
create table assess.erasure_rights (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 content_digest text not null check(content_digest ~ '^[a-f0-9]{64}$'),
 disposition text not null check(disposition in ('no-personal-data','minimum-required-attribution')),
 reviewed_by uuid references public.profiles(user_id) on delete set null,
 reviewed_at timestamptz not null default clock_timestamp()
);
alter table assess.group_managers enable row level security;
alter table assess.version_managers enable row level security;
alter table assess.assignment_managers enable row level security;
alter table assess.erasure_transfers enable row level security;
alter table assess.erasure_rights enable row level security;
revoke all on assess.group_managers,assess.version_managers,assess.assignment_managers,
 assess.erasure_transfers,assess.erasure_rights from public,anon,authenticated,assess_worker,assess_authoring_bridge;
-- Existing cascades remain; the private primitive removes only reviewed identity
-- links before deleting Auth. No FK is disabled or dropped. Historical C2 remains valid.
alter table assess.groups alter column owner_id drop not null;
alter table assess.versions alter column owner_id drop not null;
alter table assess.assignments alter column owner_id drop not null;
alter table assess.authoring_drafts alter column writer_id drop not null;
alter table assess.assignment_reviews alter column writer_id drop not null;
alter table assess.assignment_scopes alter column supervisor_id drop not null;
alter table assess.supervisor_appointments alter column appointed_by drop not null;

-- Exact FK edges, definitions included in the fingerprint below. Unknown edges STOP.
create function assess.d3_fk_inventory_v1() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_array(n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid)) order by n.nspname,c.relname,k.conname),'[]')
 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where k.contype='f' and k.confrelid in ('public.profiles'::regclass,'auth.users'::regclass)
$$;
create table assess.erasure_fk_contract (
 singleton boolean primary key default true check(singleton), inventory jsonb not null
);
-- This source has already enumerated the known profile FKs above. Assert the exact
-- source inventory independently in readiness/tests; installation must reject extras.
do $contract$
begin
 -- The two optional synthetic/provider Auth session edges are reviewed exactly.
 -- Every other Auth/profile FK, in ANY schema, must match the source inventory.
 if (select coalesce(jsonb_agg(edge),'[]'::jsonb)
  from jsonb_array_elements(assess.d3_fk_inventory_v1()) e(edge)
  where edge<>jsonb_build_array('auth','sessions','sessions_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE')
   and edge<>jsonb_build_array('auth','refresh_tokens','refresh_tokens_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE')) is distinct from $inventory$[
 [
  "assess",
  "account_stops",
  "account_stops_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "assignment_managers",
  "assignment_managers_manager_id_fkey",
  "FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "assignment_review_targets",
  "assignment_review_targets_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "assignment_reviews",
  "assignment_reviews_writer_id_fkey",
  "FOREIGN KEY (writer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "assignment_scopes",
  "assignment_scopes_supervisor_id_fkey",
  "FOREIGN KEY (supervisor_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "assignments",
  "assignments_owner_id_fkey",
  "FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "authoring_drafts",
  "authoring_drafts_writer_id_fkey",
  "FOREIGN KEY (writer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "consents",
  "consents_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "erasure_rights",
  "erasure_rights_reviewed_by_fkey",
  "FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL"
 ],
 [
  "assess",
  "erasure_rights",
  "erasure_rights_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "erasure_transfers",
  "erasure_transfers_manager_id_fkey",
  "FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "erasure_transfers",
  "erasure_transfers_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "group_join_requests",
  "group_join_requests_decided_by_fkey",
  "FOREIGN KEY (decided_by) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "group_join_requests",
  "group_join_requests_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "group_managers",
  "group_managers_manager_id_fkey",
  "FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "groups",
  "groups_owner_id_fkey",
  "FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "groups",
  "groups_supervisor_id_fkey",
  "FOREIGN KEY (supervisor_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "join_request_throttles",
  "join_request_throttles_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "membership_periods",
  "membership_periods_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "memberships",
  "memberships_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "practice_recordings",
  "practice_recordings_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "reservations",
  "reservations_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "sessions",
  "sessions_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "sharing_consents",
  "sharing_consents_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "supervisor_appointments",
  "supervisor_appointments_appointed_by_fkey",
  "FOREIGN KEY (appointed_by) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "supervisor_appointments",
  "supervisor_appointments_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "targets",
  "targets_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "assess",
  "version_managers",
  "version_managers_manager_id_fkey",
  "FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id)"
 ],
 [
  "assess",
  "versions",
  "versions_owner_id_fkey",
  "FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "attempts",
  "attempts_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "c2_account_deletions",
  "c2_account_deletions_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "c2_survey_responses",
  "c2_survey_responses_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "events",
  "events_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "feedback",
  "feedback_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"
 ],
 [
  "public",
  "profiles",
  "profiles_user_id_fkey",
  "FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"
 ]
]$inventory$::jsonb then
  raise exception 'unreviewed D3 FK inventory' using errcode='55000';
 end if;
end $contract$;
insert into assess.erasure_fk_contract select true,assess.d3_fk_inventory_v1();
alter table assess.erasure_fk_contract enable row level security;
revoke all on assess.erasure_fk_contract from public,anon,authenticated,assess_worker,assess_authoring_bridge;

create function assess.d3_shared_group_v1(p_group uuid,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from assess.groups g where g.id=p_group and
  (g.owner_id is distinct from p_user
   or exists(select 1 from assess.memberships m where m.group_id=g.id and m.user_id<>p_user)
   or exists(select 1 from assess.membership_periods m where m.group_id=g.id and m.user_id<>p_user)
   or exists(select 1 from assess.group_join_requests r where r.group_id=g.id and r.user_id<>p_user)
   or exists(select 1 from assess.authoring_drafts d where d.group_id=g.id and d.writer_id is distinct from p_user)
   or exists(select 1 from assess.assignments a where g.id=any(a.source_group_ids))
   or exists(select 1 from assess.assignment_scopes a where a.group_id=g.id)))
$$;

create function assess.d3_needs_transfer_v1(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from assess.groups g where (g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user))
  or exists(select 1 from assess.versions v where v.owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=v.id))
  or exists(select 1 from assess.assignments where owner_id=p_user)
  or exists(select 1 from assess.authoring_drafts d where d.writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null)))
  or exists(select 1 from assess.assignment_reviews where writer_id=p_user and assignment_id is not null)
  or exists(select 1 from assess.group_managers where manager_id=p_user)
  or exists(select 1 from assess.version_managers where manager_id=p_user)
  or exists(select 1 from assess.assignment_managers where manager_id=p_user)
  or exists(select 1 from assess.erasure_transfers where manager_id=p_user and user_id<>p_user)
$$;

create function assess.d3_inventory_v1(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare inventory jsonb; content jsonb; n integer;
begin
 if (select expected.inventory from assess.erasure_fk_contract expected where singleton) is distinct from assess.d3_fk_inventory_v1() then
  raise exception 'D3 FK inventory changed' using errcode='55000'; end if;
 -- Finite pilot ceiling: STOP for explicit paged operational review, never truncate.
 with affected(kind,row) as (
  select 'groups',to_jsonb(g) from assess.groups g where g.owner_id=p_user or g.supervisor_id=p_user or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
  union all select 'versions',to_jsonb(v) from assess.versions v where v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)
  union all select 'assignments',to_jsonb(a) from assess.assignments a where a.owner_id=p_user or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=p_user)
  union all select 'drafts',to_jsonb(d) from assess.authoring_drafts d where d.writer_id=p_user
  union all select 'reviews',to_jsonb(r) from assess.assignment_reviews r where r.writer_id=p_user
  union all select 'scopes',to_jsonb(s) from assess.assignment_scopes s where s.supervisor_id=p_user
  union all select 'appointments',to_jsonb(a) from assess.supervisor_appointments a where a.appointed_by=p_user or a.user_id=p_user
  union all select 'decisions',to_jsonb(r) from assess.group_join_requests r where r.decided_by=p_user
  union all select 'groupManagers',to_jsonb(m) from assess.group_managers m where m.manager_id=p_user or exists(select 1 from assess.groups g where g.id=m.group_id and (g.owner_id=p_user or g.supervisor_id=p_user))
  union all select 'versionManagers',to_jsonb(m) from assess.version_managers m where m.manager_id=p_user or exists(select 1 from assess.versions v where v.id=m.version_id and v.owner_id=p_user)
  union all select 'assignmentManagers',to_jsonb(m) from assess.assignment_managers m where m.manager_id=p_user or exists(select 1 from assess.assignments a where a.id=m.assignment_id and a.owner_id=p_user)
  union all select 'queue',to_jsonb(q) from public.c2_account_deletions q where q.user_id=p_user
 ), bounded as (select * from affected limit 1001)
 select count(*),coalesce(jsonb_agg(jsonb_build_array(kind,row) order by kind,row::text),'[]') into n,inventory from bounded;
 if n>1000 then raise exception 'D3 inventory exceeds reviewed pilot ceiling' using errcode='54000'; end if;
 -- Include every retained free-text document and its immutable review provenance.
 -- No PII scrub of a pinned publication; clearance proves only the minimum lawful
 -- attribution remains. Unresolved content escalates before the transfer deadline.
 with documents(kind,key,value) as (
  select 'version',v.id::text,to_jsonb(v)-'owner_id'-'available' from assess.versions v
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'publication',p.version_id::text,to_jsonb(p) from assess.publications p join assess.versions v on v.id=p.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'submission',c.version_id::text,to_jsonb(c) from assess.content_submissions c join assess.versions v on v.id=c.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'presentation',c.version_id::text,to_jsonb(c) from assess.practical_presentations c join assess.versions v on v.id=c.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'revision',r.draft_id::text||':'||r.revision,to_jsonb(r) from assess.authoring_revisions r join assess.authoring_drafts d on d.id=r.draft_id
   where d.writer_id=p_user and (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'package',r.draft_id::text||':'||r.draft_revision,to_jsonb(r) from assess.authoring_reviewed_packages r join assess.authoring_drafts d on d.id=r.draft_id
   where d.writer_id=p_user and (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'draft',d.id::text,to_jsonb(d)-'writer_id' from assess.authoring_drafts d where d.writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'group',g.id::text,to_jsonb(g.name) from assess.groups g where ((g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user)) or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
 ), bounded as (select * from documents limit 1001)
 select count(*),coalesce(jsonb_agg(jsonb_build_array(kind,key,value) order by kind,key),'[]') into n,content from bounded;
 if n>1000 then raise exception 'D3 content exceeds reviewed pilot ceiling' using errcode='54000'; end if;
 return jsonb_build_object('contract','rad085-management-inventory/1','inventoryDigest',encode(sha256(convert_to(inventory::text,'UTF8')),'hex'),
  'contentDigest',encode(sha256(convert_to(content::text,'UTF8')),'hex'),'contentReviewRequired',n>0,
  'requestedAt',(select requested_at from public.c2_account_deletions where user_id=p_user));
end $$;

-- This transaction-scoped capability lives in a private table; no caller-controlled
-- GUC, trigger disabling or widened is_owner() can authorize identity minimisation.
create function assess.d3_erasing_v1(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.is_owner() and exists(select 1 from assess.erasure_transfers t
 where t.user_id=p_user and t.erasing_xid=txid_current() and t.manager_id=auth.uid())
$$;
create or replace function assess.guard_managed_group_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and (assess.d3_erasing_v1(old.owner_id) or assess.d3_erasing_v1(old.supervisor_id))
  and new.owner_id is not distinct from (case when assess.d3_erasing_v1(old.owner_id) then null else old.owner_id end)
  and new.supervisor_id is not distinct from (case when assess.d3_erasing_v1(old.supervisor_id) then null else old.supervisor_id end)
  and to_jsonb(new)-'owner_id'-'supervisor_id' = to_jsonb(old)-'owner_id'-'supervisor_id'
  and exists(select 1 from assess.group_managers m where m.group_id=old.id and m.manager_id=auth.uid()) then return new; end if;
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
create or replace function assess.assignment_terminal_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and assess.d3_erasing_v1(old.owner_id) and new.owner_id is null
  and to_jsonb(new)-'owner_id'=to_jsonb(old)-'owner_id'
  and exists(select 1 from assess.assignment_managers m where m.assignment_id=old.id and m.manager_id=auth.uid()) then return new; end if;
 if old.closed_at is not null and (tg_op='DELETE' or new.closed_at is distinct from old.closed_at
   or new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.version_id is distinct from old.version_id) then
  raise exception 'permanently closed' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;

-- RAD085-SEC-FIXES-20261027 SEC-03: platform account-deletion management requires an
-- approved site owner, never Assess eligibility (account_stops). Same scope -> profile
-- lock order as scope_enter_v1; callers still re-check is_owner after every wait.
create function assess.owner_scope_enter_v1(p_write boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read committed required' using errcode='55000'; end if;
 if p_write then perform 1 from assess.scope_lock for update; else perform 1 from assess.scope_lock for share; end if;
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_owner() then raise exception 'approved owner required' using errcode='42501'; end if;
end $$;

create function assess.transfer_management_d3_v1(p_user uuid,p_digest text,p_replay_at timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q public.c2_account_deletions; inv jsonb; ts timestamptz;
begin
 if not public.is_owner() or p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 lock table public.profiles in share row exclusive mode;
 perform 1 from public.profiles where user_id in (p_user,auth.uid()) order by user_id for update;
 if exists(select 1 from public.c2_account_deletions where user_id=auth.uid()) then raise exception 'active owner required' using errcode='42501'; end if;
 select * into q from public.c2_account_deletions where user_id=p_user for update;
 if q.user_id is null then raise exception 'pending deletion required' using errcode='55000'; end if;
 perform 1 from assess.versions where owner_id=p_user or id in(select version_id from assess.version_managers where manager_id=p_user) order by id for update;
 perform 1 from assess.assignments where owner_id=p_user or id in(select assignment_id from assess.assignment_managers where manager_id=p_user) order by id for update;
 inv:=assess.d3_inventory_v1(p_user); ts:=coalesce(p_replay_at,clock_timestamp());
 if ts<q.requested_at or ts>clock_timestamp() then raise exception 'invalid verified replay time' using errcode='22023'; end if;
 -- An already confirmed transfer is a read receipt, never an uncertain automatic retry.
 if exists(select 1 from assess.erasure_transfers where user_id=p_user and requested_at=q.requested_at and inventory_digest=p_digest and manager_id=auth.uid()) then
  return jsonb_build_object('transferred',true,'replayed',true); end if;
 if q.requested_at+interval '30 days'<=ts then raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 if p_digest is distinct from inv->>'inventoryDigest' then raise exception 'inventory changed' using errcode='40001'; end if;
 if (inv->>'contentReviewRequired')::boolean and not exists(select 1 from assess.erasure_rights r where r.user_id=p_user and r.content_digest=inv->>'contentDigest' and r.reviewed_by=auth.uid()) then
  raise exception 'retained content rights review required' using errcode='55000'; end if;
 insert into assess.group_managers select id,auth.uid() from assess.groups g where ((g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user))
  or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
 on conflict(group_id) do update set manager_id=excluded.manager_id;
 insert into assess.version_managers select id,auth.uid() from assess.versions v where (v.owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=v.id)) or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)
 on conflict(version_id) do update set manager_id=excluded.manager_id;
 insert into assess.assignment_managers select id,auth.uid() from assess.assignments a where a.owner_id=p_user or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=p_user)
 on conflict(assignment_id) do update set manager_id=excluded.manager_id;
 -- Revoke scope and codes; do NOT modify any student's period, target or result.
 update assess.supervisor_appointments set revoked_at=coalesce(revoked_at,ts),revision=revision+1 where user_id=p_user and revoked_at is null;
 update assess.groups set ended_at=coalesce(ended_at,ts),scope_revision=scope_revision+1 where (owner_id=p_user or supervisor_id=p_user) and ended_at is null;
 update assess.group_join_codes set revoked_at=coalesce(revoked_at,ts) where group_id in(select id from assess.groups where supervisor_id=p_user);
 update assess.erasure_transfers set manager_id=auth.uid() where manager_id=p_user;
 -- Bind clearance to post-transfer content (the archived group name is unchanged).
 inv:=assess.d3_inventory_v1(p_user);
 -- Completion, rather than lock acquisition, must be before the deadline.
 ts:=coalesce(p_replay_at,clock_timestamp());
 if q.requested_at+interval '30 days'<=ts then raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 insert into assess.erasure_transfers(user_id,requested_at,manager_id,inventory_digest,content_digest,transferred_at)
 values(p_user,q.requested_at,auth.uid(),p_digest,inv->>'contentDigest',ts)
 on conflict(user_id) do update set requested_at=excluded.requested_at,manager_id=excluded.manager_id,inventory_digest=excluded.inventory_digest,content_digest=excluded.content_digest,transferred_at=excluded.transferred_at,erasing_xid=null;
 if p_replay_at is null and q.requested_at+interval '30 days'<=clock_timestamp() then
  raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 return jsonb_build_object('transferred',true,'replayed',false);
end $$;

create function assess.erase_account_d3_v1(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare inv jsonb; q public.c2_account_deletions; needs_transfer boolean;
begin
 if not public.is_owner() or p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 lock table public.profiles in share row exclusive mode;
 perform 1 from public.profiles where user_id=p_user for update;
 if not found then return; end if;
 if exists(select 1 from public.profiles where user_id=p_user and role='owner') and not exists(select 1 from public.profiles p where p.user_id<>p_user and p.role='owner' and p.status='approved' and not exists(select 1 from public.c2_account_deletions pending where pending.user_id=p.user_id)) then
  raise exception 'last owner' using errcode='42501'; end if;
 select * into q from public.c2_account_deletions where user_id=p_user for update;
 -- This primitive also serves the quarantined restore operator with an externally
 -- verified completed journal event. API callers have NO EXECUTE permission.
 perform 1 from assess.versions where owner_id=p_user order by id for update;
 perform 1 from assess.assignments where owner_id=p_user order by id for update;
 inv:=assess.d3_inventory_v1(p_user);
 needs_transfer:=assess.d3_needs_transfer_v1(p_user);
 if needs_transfer and not exists(select 1 from assess.erasure_transfers t where t.user_id=p_user and t.manager_id=auth.uid()
  and (q.user_id is null or t.requested_at=q.requested_at) and t.content_digest=inv->>'contentDigest') then
  raise exception 'management transfer unresolved: escalate to owner' using errcode='55000'; end if;
 if needs_transfer then
  update assess.erasure_transfers set erasing_xid=txid_current() where user_id=p_user;
  -- Minimal null provenance, never recipient identity. Preserve confirmed review/link
  -- UUIDs and all immutable publication/revision bytes, digests and closed_at.
  update assess.groups set owner_id=case when owner_id=p_user then null else owner_id end,supervisor_id=case when supervisor_id=p_user then null else supervisor_id end where (owner_id=p_user or supervisor_id=p_user)
   and exists(select 1 from assess.group_managers m where m.group_id=id and m.manager_id=auth.uid());
  update assess.versions set owner_id=null where owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=assess.versions.id);
  update assess.assignments set owner_id=null where owner_id=p_user;
  update assess.assignment_reviews set writer_id=null where writer_id=p_user and assignment_id is not null;
  update assess.authoring_drafts d set writer_id=null where writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null));
 end if;
 update assess.assignment_scopes set supervisor_id=null where supervisor_id=p_user;
 update assess.supervisor_appointments set appointed_by=null where appointed_by=p_user;
 update assess.group_join_requests set decided_by=null where decided_by=p_user;
 delete from assess.assignment_reviews where writer_id=p_user and assignment_id is null;
 delete from assess.authoring_publication_links l using assess.authoring_drafts d where l.draft_id=d.id and d.writer_id=p_user;
 delete from assess.authoring_drafts where writer_id=p_user;
 -- Unassigned private versions have no other student's result/target dependency.
 delete from assess.publications p using assess.versions v where p.version_id=v.id and v.owner_id=p_user
  and not exists(select 1 from assess.assignments a where a.version_id=p.version_id) and not exists(select 1 from assess.authoring_publication_links l where l.version_id=p.version_id);
 delete from auth.users where id=p_user;
end $$;

-- Owner-only bounded operations list, preview, and explicit transfer confirmation.
-- The private primitives above remain uncallable by API roles (including owner).
create function assess.account_management_v1(p_action text,p_user uuid default null,p_digest text default null,p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_action='list' then
  perform assess.owner_scope_enter_v1(false);
  if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.user_id),'[]') into rows from (
   select q.user_id,q.requested_at,q.requested_at+interval '30 days' transfer_before,q.requested_at+interval '37 days' erase_by,
    t.transferred_at,assess.d3_needs_transfer_v1(q.user_id) requires_transfer,
    (t.user_id is null and assess.d3_needs_transfer_v1(q.user_id) and q.requested_at+interval '25 days'<=clock_timestamp()) transfer_alert,
    q.requested_at+interval '30 days'<=clock_timestamp() finalise_due,
    q.requested_at+interval '37 days'<=clock_timestamp() overdue
   from public.c2_account_deletions q left join assess.erasure_transfers t on t.user_id=q.user_id and t.requested_at=q.requested_at
   where p_after is null or q.user_id>p_after order by q.user_id limit p_limit) x;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'user_id' else null end);
 end if;
 if p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 if p_action='preview' then
  perform assess.owner_scope_enter_v1(false);
  if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
  return assess.d3_inventory_v1(p_user);
 end if;
 if p_action='transfer' then return assess.transfer_management_d3_v1(p_user,p_digest); end if;
 raise exception 'invalid action' using errcode='22023';
end $$;

-- Management of preserved assignments is administrative closure only. Targets,
-- immutable version/provenance and student results are never reattributed or edited.
create or replace function assess.close_assignment_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 perform 1 from assess.assignments a where a.id=p_assignment and (a.owner_id=auth.uid()
  or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())) for update;
 if not found then raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=p_assignment and closed_at is null;
end $$;

create or replace function public.owner_account_deletion_v1(p_action text,p_user uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles%rowtype; d public.c2_account_deletions%rowtype; prior_ban timestamptz;
 ids uuid[]:='{}'; target uuid; rows jsonb; lim integer:=least(p_limit,100);
begin
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
   -- Normal C2 eligibility above is unchanged. D3 transfers precede the deadline.
   perform assess.erase_account_d3_v1(target);
  end if;
 end loop;
 return jsonb_build_object('processed',cardinality(ids));
end $$;


-- W2: appointment metadata piggybacks on the existing scoped read, even with zero groups.
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
   -- RAD085-SEC-FIXES-20261027 SEC-02: only pending requests of accounts still eligible
   -- to join, filtered before paging. Decided/historical rows never reveal a student
   -- who left, withdrew sharing or is out of scope; owner audit data is not exposed here.
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select r.id,r.user_id,r.state,r.revision from assess.group_join_requests r join public.profiles p on p.user_id=r.user_id
    where r.group_id=g.id and r.state='pending' and p.status='approved' and p.role='participant'
    and not exists(select 1 from assess.account_stops s where s.user_id=r.user_id) and assess.sharing_allowed_v1(r.user_id)
    and not exists(select 1 from assess.memberships m where m.group_id=g.id and m.user_id=r.user_id)
    and (p_after is null or r.id>p_after) order by r.id limit p_limit) q;
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
 return jsonb_build_object('appointed',exists(select 1 from assess.supervisor_appointments ap join public.profiles p on p.user_id=ap.user_id where ap.user_id=auth.uid() and ap.revoked_at is null and p.status='approved' and p.role='participant'),'version',1,'rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


create or replace function assess.assignment_close_v2(p_assignment uuid,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare a assess.assignments; gid uuid;
begin
 perform assess.scope_enter_v1(true);
 select * into a from assess.assignments where id=p_assignment and (owner_id=auth.uid() or (public.is_owner() and exists(select 1 from assess.assignment_managers m where m.assignment_id=p_assignment and m.manager_id=auth.uid()))) for update;
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 -- The owner/D3-manager path is separate and unchanged.
 if public.is_owner() then
  if a.closed_at is not null then return; end if;
  if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
  perform assess.close_assignment_v1(a.id); return;
 end if;
 -- RAD085-SEC-FIXES-20261027 SEC-01: after the locks and before any receipt or change,
 -- the issuing group must belong to the caller, be unended and keep an active appointment.
 select s.group_id into gid from assess.assignment_scopes s where s.assignment_id=a.id and s.supervisor_id=auth.uid();
 if gid is null then raise exception 'assignment denied' using errcode='42501'; end if;
 perform assess.supervised_group_v1(gid);
 if a.closed_at is not null then return; end if;
 if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=a.id;
 -- The deadline may pass while writing; a failure here rolls the closure back.
 perform assess.supervised_group_v1(gid);
end $$;
-- RAD085-SEC-FIXES-20261027 SEC-01: the M3 body is unchanged except the replay branch,
-- which now re-checks the same group scope as a new confirmation before returning a receipt.
create or replace function assess.assignment_confirm_v1(p_review uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare r assess.assignment_reviews; g assess.groups; d assess.authoring_drafts; aid uuid; ts timestamptz;
begin
 perform assess.scope_enter_v1(true);
 select * into r from assess.assignment_reviews where id=p_review and writer_id=auth.uid();
 if r.id is null then raise exception 'review denied' using errcode='42501'; end if;
 -- Authorized replay returns the original receipt after review expiry, never after
 -- group end/expiry, revocation or loss of the group; never recreates targets.
 if r.assignment_id is not null then
  perform assess.supervised_group_v1(r.group_id);
  return r.assignment_id;
 end if;
 g:=assess.supervised_group_v1(r.group_id); ts:=clock_timestamp();
 if r.expires_at<=ts then raise exception 'review expired' using errcode='55000'; end if;
 if r.group_revision<>g.scope_revision or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revision=r.appointment_revision and revoked_at is null) then
  raise exception 'scope changed' using errcode='40001'; end if;
 select * into d from assess.authoring_drafts where id=r.draft_id and writer_id=auth.uid() and group_id=g.id;
 if d.revision is distinct from r.draft_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if assess.linked_version_v1(d.id,d.revision)<>r.version_id then raise exception 'version changed' using errcode='40001'; end if;
 perform 1 from assess.versions where id=r.version_id for share;
 perform p.user_id from public.profiles p join assess.memberships m on m.user_id=p.user_id where m.group_id=g.id order by p.user_id for share of p;
 if exists(
  (select user_id,period_id,visible_from from assess.visible_members_v1(g.id)
   except select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id)
  union all
  (select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id
   except select user_id,period_id,visible_from from assess.visible_members_v1(g.id))
 ) then raise exception 'targets changed' using errcode='40001'; end if;
 -- Recheck server time after all possibly blocking locks, not transaction start time.
 if clock_timestamp()>=least(r.expires_at,g.ends_at) then raise exception 'review expired' using errcode='55000'; end if;
 insert into assess.assignments(owner_id,version_id,source_group_ids) values(auth.uid(),r.version_id,array[g.id]) returning id into aid;
 insert into assess.targets select aid,user_id from assess.assignment_review_targets where review_id=r.id;
 insert into assess.assignment_scopes values(aid,g.id,auth.uid(),r.id);
 update assess.assignment_reviews set assignment_id=aid where id=r.id;
 return aid;
end $$;
create or replace function assess.assignment_page_v2(p_group uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if not public.is_owner() then perform assess.supervised_group_v1(p_group); end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select a.id,v.name,v.track,v.version,a.revision,a.closed_at from assess.assignments a join assess.versions v on v.id=a.version_id
  where (a.owner_id=auth.uid() or (public.is_owner() and exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid()))) and (public.is_owner() or exists(select 1 from assess.assignment_scopes s where s.assignment_id=a.id and s.group_id=p_group and s.supervisor_id=auth.uid()))
  and (p_after is null or a.id>p_after) order by a.id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

revoke all on function assess.d3_fk_inventory_v1(),assess.d3_needs_transfer_v1(uuid),assess.d3_inventory_v1(uuid),assess.d3_erasing_v1(uuid),assess.d3_shared_group_v1(uuid,uuid),
 assess.transfer_management_d3_v1(uuid,text,timestamptz),assess.erase_account_d3_v1(uuid),
 assess.account_management_v1(text,uuid,text,uuid,integer),assess.owner_scope_enter_v1(boolean)
 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
grant execute on function assess.account_management_v1(text,uuid,text,uuid,integer) to authenticated;
commit;
