-- RAD-085 DB-day rollback (B3). Manual, owner-run, SQL Editor. NOT a migration; never replay history after it.
-- Returns the LIVE BEHAVIOUR to its pre-DB-day state WITHOUT deleting any data:
--   1. drops the 3 triggers the RAD-085 migrations added to PRE-EXISTING tables;
--   2. restores the exact previous bodies + ACL of the 4 PRE-EXISTING functions the migrations redefine
--      (bodies below are byte-for-byte pg_get_functiondef of the pre-DB-day catalogue, proven by
--      src/features/assess/rad085-db-day-rollback.test.ts);
--   3. revokes client EXECUTE on the new RAD-085 functions (the functions and every new table, including
--      rows, are LEFT IN PLACE; nothing is dropped, truncated or updated);
--   4. restores NOT NULL on the 3 pre-existing owner_id columns only where no NULL row exists.
-- Works from any partially applied state (M1 only ... M4 + initializer) and is safe to run twice.
-- Not undone: added columns/indexes on assess.groups/memberships (empty/nullable), the assess_authoring_bridge
-- role (NOLOGIN), launch_gate (already false). After a rollback do NOT re-run the four migrations (they would
-- fail on existing objects); a new attempt needs a reviewed forward repair. While rolled back, do not finalise
-- an account that owns a supervisor group: the old finalise has no D3 transfer and the FK blocks it (fail closed).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Fail closed if this is not the expected pre-DB-day catalogue.
do $guard$ begin
 if to_regprocedure('public.owner_account_deletion_v1(text,uuid,uuid,integer)') is null
  or to_regprocedure('assess.content_submit_v1(jsonb)') is null
  or to_regprocedure('assess.close_assignment_v1(uuid)') is null
  or to_regprocedure('assess.assignment_terminal_v1()') is null then
  raise exception 'rad085 rollback: pre-existing functions missing; STOP' using errcode='55000';
 end if;
end $guard$;

-- 1. Triggers added to pre-existing tables.
drop trigger if exists assess_practice_recorded on public.attempts;
drop trigger if exists assess_managed_group on assess.groups;
drop trigger if exists assess_membership_period on assess.memberships;

-- 2. Exact previous function bodies and ACL.
CREATE OR REPLACE FUNCTION assess.assignment_terminal_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if old.closed_at is not null and (tg_op='DELETE' or new.closed_at is distinct from old.closed_at
   or new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.version_id is distinct from old.version_id) then
   raise exception 'permanently closed' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $function$;
revoke all on function assess.assignment_terminal_v1() from public, anon, authenticated, assess_worker;

CREATE OR REPLACE FUNCTION assess.close_assignment_v1(p_assignment uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform 1 from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
 if not found then raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=p_assignment and closed_at is null;
end $function$;
revoke all on function assess.close_assignment_v1(uuid) from public, anon, authenticated, assess_worker;
grant execute on function assess.close_assignment_v1(uuid) to authenticated;

CREATE OR REPLACE FUNCTION assess.content_submit_v1(p_document jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a jsonb; vid uuid; aid uuid;
begin
  perform 1 from public.profiles where user_id=auth.uid() for update;
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_document is null or pg_column_size(p_document)>2000000 or octet_length(p_document::text)>2000000 then
    raise exception 'document limit' using errcode='22023'; end if;
  a:=p_document->'assessment';
  if coalesce(a->>'track','') not in ('mixed','full-practical') or a->>'schemaVersion' is distinct from '1'
    or length(btrim(a->>'name')) not between 1 and 200
    or length(a->'ref'->>'version') not between 1 and 100 then raise exception 'invalid metadata' using errcode='22023'; end if;
  aid:=(a->'ref'->>'id')::uuid;
  -- Serialize all versions of one assessment and prevent another owner's version takeover.
  perform pg_advisory_xact_lock(hashtextextended(aid::text,0));
  if exists(select 1 from assess.versions where assessment_id=aid and owner_id<>auth.uid()) then raise exception 'denied' using errcode='42501'; end if;
  if (select count(*) from assess.content_submissions c join assess.versions v on v.id=c.version_id where v.owner_id=auth.uid() and c.state='pending')>=20 then
    raise exception 'pending limit' using errcode='54000'; end if;
  insert into assess.versions(owner_id,assessment_id,version,name,track)
    values(auth.uid(),aid,a->'ref'->>'version',a->>'name',a->>'track') returning id into vid;
  insert into assess.content_submissions(version_id,document) values(vid,p_document);
  return vid;
end $function$;
revoke all on function assess.content_submit_v1(jsonb) from public, anon, authenticated, assess_worker;
grant execute on function assess.content_submit_v1(jsonb) to authenticated;

CREATE OR REPLACE FUNCTION public.owner_account_deletion_v1(p_action text, p_user uuid DEFAULT NULL::uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$;
revoke all on function public.owner_account_deletion_v1(text,uuid,uuid,integer) from public, anon, authenticated, assess_worker;
grant execute on function public.owner_account_deletion_v1(text,uuid,uuid,integer) to authenticated;

-- The bridge role (created by the third source) also held EXECUTE on content_submit_v1; remove it.
do $bridge$ begin
 if exists (select 1 from pg_roles where rolname='assess_authoring_bridge') then
  revoke all on function assess.assignment_terminal_v1() from assess_authoring_bridge;
  revoke all on function assess.close_assignment_v1(uuid) from assess_authoring_bridge;
  revoke all on function assess.content_submit_v1(jsonb) from assess_authoring_bridge;
  revoke all on function public.owner_account_deletion_v1(text,uuid,uuid,integer) from assess_authoring_bridge;
 end if;
end $bridge$;

-- 3. New RAD-085 functions: remove client access, keep the objects.
do $revoke$
declare s text; r text;
begin
 foreach s in array array[
  'assess.account_management_v1(text,uuid,text,uuid,integer)',
  'assess.appointment_v1(uuid,boolean)',
  'assess.assignment_close_v2(uuid,integer)',
  'assess.assignment_confirm_v1(uuid)',
  'assess.assignment_page_v2(uuid,uuid,integer)',
  'assess.assignment_prepare_v1(uuid,uuid,integer,uuid)',
  'assess.assignment_targets_v1(uuid,uuid,integer)',
  'assess.authoring_bridge_bind_v1(uuid,uuid,integer,uuid)',
  'assess.authoring_bridge_candidate_v1(uuid,uuid,integer,uuid)',
  'assess.authoring_bridge_install_v1(uuid,uuid,integer,uuid,jsonb,jsonb)',
  'assess.authoring_bridge_read_v1(uuid,uuid,integer)',
  'assess.d3_erasing_v1(uuid)',
  'assess.d3_fk_inventory_v1()',
  'assess.d3_inventory_v1(uuid)',
  'assess.d3_needs_transfer_v1(uuid)',
  'assess.d3_shared_group_v1(uuid,uuid)',
  'assess.draft_page_v1(uuid,uuid,uuid,integer)',
  'assess.draft_save_v1(uuid,uuid,integer,jsonb,jsonb)',
  'assess.erase_account_d3_v1(uuid)',
  'assess.group_leave_v1(uuid)',
  'assess.guard_managed_group_v1()',
  'assess.join_decide_v1(uuid,integer,text)',
  'assess.join_request_v1(text)',
  'assess.linked_version_v1(uuid,integer)',
  'assess.membership_period_v1()',
  'assess.owner_scope_enter_v1(boolean)',
  'assess.record_practice_v1()',
  'assess.review_current_v1(uuid)',
  'assess.scope_enter_v1(boolean)',
  'assess.scope_page_v1(text,uuid,uuid,integer)',
  'assess.sharing_allowed_v1(uuid)',
  'assess.sharing_consent_v1(text,text,boolean)',
  'assess.supervised_group_v1(uuid)',
  'assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)',
  'assess.supervisor_results_v1(uuid,uuid,integer)',
  'assess.transfer_management_d3_v1(uuid,text,timestamp with time zone)',
  'assess.validate_draft_v1(jsonb,jsonb)',
  'assess.visible_members_v1(uuid)'
 ] loop
  if to_regprocedure(s) is not null then
   execute format('revoke all on function %s from public, anon, authenticated, assess_worker', s);
   if exists (select 1 from pg_roles where rolname='assess_authoring_bridge') then
    execute format('revoke all on function %s from assess_authoring_bridge', s);
   end if;
  end if;
 end loop;
end $revoke$;

-- 4. Restore NOT NULL only where it is safe (no row is changed).
do $notnull$
declare t record; n bigint;
begin
 for t in select * from (values ('assess.groups','owner_id'),('assess.versions','owner_id'),('assess.assignments','owner_id')) v(tbl,col) loop
  if exists (select 1 from pg_attribute a where a.attrelid=t.tbl::regclass and a.attname=t.col and not a.attnotnull) then
   execute format('select count(*) from %s where %I is null', t.tbl, t.col) into n;
   if n = 0 then execute format('alter table %s alter column %I set not null', t.tbl, t.col); end if;
  end if;
 end loop;
end $notnull$;
commit;

-- Read-only result after a full rollback: triggers_removed true, owner_id_not_null_not_restored 0, new_rpc_closed_to_clients true.
select
 (select count(*)=0 from pg_trigger t where not t.tgisinternal and t.tgname in ('assess_practice_recorded','assess_managed_group','assess_membership_period')) triggers_removed,
 (select count(*) from pg_attribute a where a.attrelid in ('assess.groups'::regclass,'assess.versions'::regclass,'assess.assignments'::regclass)
   and a.attname='owner_id' and not a.attnotnull) owner_id_not_null_not_restored,
 (select count(*)=0 from unnest(array[
  'assess.account_management_v1(text,uuid,text,uuid,integer)',
  'assess.appointment_v1(uuid,boolean)',
  'assess.assignment_close_v2(uuid,integer)',
  'assess.assignment_confirm_v1(uuid)',
  'assess.assignment_page_v2(uuid,uuid,integer)',
  'assess.assignment_prepare_v1(uuid,uuid,integer,uuid)',
  'assess.assignment_targets_v1(uuid,uuid,integer)',
  'assess.authoring_bridge_bind_v1(uuid,uuid,integer,uuid)',
  'assess.authoring_bridge_candidate_v1(uuid,uuid,integer,uuid)',
  'assess.authoring_bridge_install_v1(uuid,uuid,integer,uuid,jsonb,jsonb)',
  'assess.authoring_bridge_read_v1(uuid,uuid,integer)',
  'assess.d3_erasing_v1(uuid)',
  'assess.d3_fk_inventory_v1()',
  'assess.d3_inventory_v1(uuid)',
  'assess.d3_needs_transfer_v1(uuid)',
  'assess.d3_shared_group_v1(uuid,uuid)',
  'assess.draft_page_v1(uuid,uuid,uuid,integer)',
  'assess.draft_save_v1(uuid,uuid,integer,jsonb,jsonb)',
  'assess.erase_account_d3_v1(uuid)',
  'assess.group_leave_v1(uuid)',
  'assess.guard_managed_group_v1()',
  'assess.join_decide_v1(uuid,integer,text)',
  'assess.join_request_v1(text)',
  'assess.linked_version_v1(uuid,integer)',
  'assess.membership_period_v1()',
  'assess.owner_scope_enter_v1(boolean)',
  'assess.record_practice_v1()',
  'assess.review_current_v1(uuid)',
  'assess.scope_enter_v1(boolean)',
  'assess.scope_page_v1(text,uuid,uuid,integer)',
  'assess.sharing_allowed_v1(uuid)',
  'assess.sharing_consent_v1(text,text,boolean)',
  'assess.supervised_group_v1(uuid)',
  'assess.supervisor_group_v1(text,uuid,integer,text,timestamp with time zone)',
  'assess.supervisor_results_v1(uuid,uuid,integer)',
  'assess.transfer_management_d3_v1(uuid,text,timestamp with time zone)',
  'assess.validate_draft_v1(jsonb,jsonb)',
  'assess.visible_members_v1(uuid)'
 ]) f(sig) where to_regprocedure(f.sig) is not null
   and (has_function_privilege('authenticated',to_regprocedure(f.sig),'execute') or has_function_privilege('anon',to_regprocedure(f.sig),'execute'))) new_rpc_closed_to_clients;
