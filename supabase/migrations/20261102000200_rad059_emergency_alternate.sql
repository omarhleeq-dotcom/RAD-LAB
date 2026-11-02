-- RAD-059 option C. Deferred: owner applies once in a later reviewed window.
-- No role/database/PostgREST settings change; request timer is armed by PostgREST.
-- All existing Assess functions/checks/packets stay byte-identical.
begin;
set local search_path=public;
set local lock_timeout='2s';
set local statement_timeout='8s';
do $pre$ begin
 if current_user<>'postgres' or not coalesce((select bool_and(ok) from (
with functions as (
 select p.oid::regprocedure::text signature,replace(p.prosrc,E'\r','') body,
  l.lanname,p.prokind,p.prosecdef,p.provolatile,p.proisstrict,p.proparallel,p.proleakproof,
  format_type(p.prorettype,null) returns_type,p.proretset,p.proargnames,p.proargmodes,
  pg_get_expr(p.proargdefaults,0) argument_defaults,p.proconfig,(select coalesce(jsonb_agg(jsonb_build_array(grantee,privilege_type,is_grantable) order by grantee collate "C",privilege_type collate "C",is_grantable),'[]'::jsonb) from (select distinct case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee)::text end grantee,x.privilege_type,x.is_grantable from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x) grants) acl,r.rolname owner
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 join pg_language l on l.oid=p.prolang join pg_roles r on r.oid=p.proowner
 where n.nspname='assess' or (n.nspname='public' and p.proname in ('rad062_valid_full_name','handle_new_user','owner_account_deletion_v1'))
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
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p')
), fingerprints as (
 select 'functions' check_name,md5((select jsonb_agg(to_jsonb(f) order by signature collate "C")::text from functions f)) actual,'cd7145a6e2fcf8e2ab9c0363db7fe309' expected
 union all select 'relations',md5((select jsonb_agg(to_jsonb(r) order by nspname,relname)::text from relations r)),'7b07bc6f0dcf72d6175518f97bb0f044'
)
select check_name,actual=expected ok from fingerprints
union all select 'identity_inventory',(select inventory from assess.erasure_fk_contract where singleton)=assess.d3_fk_inventory_v1()
union all select 'not_null_constraints_plain',not exists(
 select 1 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where (n.nspname='assess' or (n.nspname='public' and c.relname='profiles')) and c.relkind in ('r','p')
 and k.contype='n' and (not k.convalidated or k.connoinherit))
union all select 'closed_gate',(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
union all select 'worker_nologin',exists(select 1 from pg_roles where rolname='assess_worker' and not rolcanlogin)
order by check_name
 ) reviewed),false) then raise exception 'RAD059 reviewed M09 catalogue and postgres required' using errcode='55000'; end if;
 if to_regnamespace('emergency') is not null then raise exception 'RAD059 already installed or schema collision' using errcode='55000'; end if;
 if not exists(select 1 from pg_roles where rolname='assess_job_a' and not rolcanlogin and not rolsuper)
  or exists(select 1 from pg_roles where rolname='assess_job_b' and (rolcanlogin or rolsuper)) then
  raise exception 'RAD059 existing closed worker slots required' using errcode='55000'; end if;
 if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or
  (rolcreaterole and pg_has_role(current_user,'pg_signal_backend','USAGE') and not exists(
   select 1 from pg_roles s where s.rolname in ('assess_job_a','assess_job_b') and not exists(
    select 1 from pg_auth_members m where m.roleid=s.oid and m.member=(select oid from pg_roles where rolname=current_user) and m.admin_option))))) then
  raise exception 'RAD059 reviewed stop owner privileges required' using errcode='55000'; end if;
end $pre$;
set local search_path='';
create schema emergency;
revoke all on schema emergency from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
create table emergency.appointment (
 singleton boolean primary key default true check(singleton),
 user_id uuid references public.profiles(user_id) on delete set null,
 appointed_by uuid references public.profiles(user_id) on delete set null,
 appointed_at timestamptz, revoked_at timestamptz,
 revision bigint not null default 0 check(revision>=0)
);
insert into emergency.appointment(singleton) values(true);
create table emergency.operations (
 operation uuid primary key,
 actor uuid references public.profiles(user_id) on delete set null,
 authorization_revision bigint not null,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 next_phase smallint not null default 1 check(next_phase between 1 and 7)
);
create unique index emergency_one_unfinished on emergency.operations(actor,authorization_revision) where next_phase<=6;
create table emergency.phases (
 operation uuid not null references emergency.operations(operation) on delete cascade,
 phase smallint not null check(phase between 1 and 6),
 ok boolean not null, at timestamptz not null default clock_timestamp(),
 verification jsonb, primary key(operation,phase),
 check(verification is null or (phase=6 and jsonb_typeof(verification)='object'))
);
create table emergency.audit (
 id bigint generated always as identity primary key,
 actor uuid references public.profiles(user_id) on delete set null,
 action text not null check(action in ('appoint','remove','stop')),
 at timestamptz not null default clock_timestamp(), authorization_revision bigint not null,
 operation uuid not null unique, phases jsonb not null default '{}'
);
-- Account erasure removes attribution via SET NULL; event/receipt remains until
-- pilot-end cleanup. No retained alternate UUID or identity tombstone elsewhere.
alter table emergency.appointment enable row level security;
alter table emergency.operations enable row level security;
alter table emergency.phases enable row level security;
alter table emergency.audit enable row level security;
revoke all on all tables in schema emergency from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
revoke all on all sequences in schema emergency from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge;
-- Incoming identity FKs are an additive, reviewed part of the erasure contract.
update assess.erasure_fk_contract set inventory=assess.d3_fk_inventory_v1() where singleton;

-- Unlocked eligibility is also the read-only capability probe. Never expose an
-- identity or let a rejected account enter the lock queue.
create function emergency.eligible_v1(p_owner boolean default false) returns boolean
language sql stable security definer set search_path='' set timezone='UTC' as $$
 select exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.status='approved'
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
  and (p.role='owner' or (not p_owner and exists(select 1 from emergency.appointment a
   where a.singleton and a.user_id=p.user_id and a.revoked_at is null))))
$$;
-- One order: unlocked rejection -> capacity(shared) -> profiles(UUID order,
-- SHARE: caller and, only for set, target) -> appointment -> operation -> phase.
-- C2/D3 take capacity(exclusive) BEFORE scope/profiles and FK SET NULL, so even
-- multi-account erasure cannot hold a profile/appointment while we enter this
-- order. SHARE blocks status UPDATE/DELETE until COMMIT, unlike KEY SHARE.
create function emergency.authorize_v1(p_owner boolean default false,p_target uuid default null) returns bigint
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare a emergency.appointment; begin
 if not emergency.eligible_v1(p_owner) then raise exception 'not authorized' using errcode='42501'; end if;
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read committed required' using errcode='55000'; end if;
 if p_target is not null and not exists(select 1 from public.profiles p where p.user_id=p_target and p.status='approved'
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)) then raise exception 'approved account required' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(hashtextextended('rad062-capacity',0));
 -- Recheck after each wait before acquiring any subsequent lock.
 if not emergency.eligible_v1(p_owner) then raise exception 'not authorized' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id in (auth.uid(),p_target) order by user_id for share;
 if not emergency.eligible_v1(p_owner) then raise exception 'not authorized' using errcode='42501'; end if;
 if p_target is not null and not exists(select 1 from public.profiles p where p.user_id=p_target and p.status='approved'
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)) then raise exception 'approved account required' using errcode='22023'; end if;
 select * into strict a from emergency.appointment where singleton for update;
 -- Re-read after the appointment lock wait; never trust a browser identity/role.
 if not emergency.eligible_v1(p_owner) then raise exception 'not authorized' using errcode='42501'; end if;
 return a.revision;
end $$;
create function emergency.facts_v1() returns jsonb
language sql security definer set search_path='' set timezone='UTC' as $$
 select jsonb_build_object(
 'gateClosed',(select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate),
 'loginDisabled',not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin),
 'missingRoles',2-(select count(*) from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b')),
 'backendSessions',(select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')),
 'unheldSessions',(select count(*) from assess.sessions where state in ('active','grading','awaiting-manual') or
  (state='grading-failed' and (emergency_held_at is null or submitted_at is null or lease is not null or lease_until is not null
   or failed_at is null or retry_at is distinct from submitted_at+interval '7 days'))))
$$;
create function emergency.receipt_v1(p_operation uuid) returns jsonb
language sql security definer set search_path='' set timezone='UTC' as $$
 select jsonb_build_object('version',1,'operation',o.operation,'nextPhase',o.next_phase,
  'status',case when o.next_phase=7 and (select count(*)=6 and bool_and(p.ok) from emergency.phases p where p.operation=o.operation) then 'STOPPED'
   when exists(select 1 from emergency.phases p where p.operation=o.operation and p.ok) then 'PARTIAL'
   when o.next_phase=7 then 'FAILED' else 'PENDING' end,
  'phases',coalesce((select jsonb_agg(jsonb_build_object('phase',p.phase,'ok',p.ok) order by p.phase) from emergency.phases p where p.operation=o.operation),'[]'::jsonb),
  'verification',(select p.verification from emergency.phases p where p.operation=o.operation and p.phase=6),
  'at',o.updated_at,'cloudStopVerified',false,'poolerCacheVerified',false)
 from emergency.operations o where o.operation=p_operation
$$;
create function public.emergency_alternate_set_v1(p_target uuid) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rev bigint; begin
 perform emergency.authorize_v1(true,p_target);
 if p_target is null or not exists(select 1 from public.profiles p where p.user_id=p_target and p.status='approved'
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)) then raise exception 'approved account required' using errcode='22023'; end if;
 update emergency.appointment set user_id=p_target,appointed_by=auth.uid(),appointed_at=clock_timestamp(),revoked_at=null,revision=revision+1 where singleton returning revision into rev;
 insert into emergency.audit(actor,action,authorization_revision,operation) values(auth.uid(),'appoint',rev,gen_random_uuid());
 return jsonb_build_object('appointed',true,'revision',rev);
end $$;
create function public.emergency_alternate_remove_v1() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rev bigint; begin
 perform emergency.authorize_v1(true);
 update emergency.appointment set user_id=null,revoked_at=clock_timestamp(),revision=revision+1 where singleton returning revision into rev;
 insert into emergency.audit(actor,action,authorization_revision,operation) values(auth.uid(),'remove',rev,gen_random_uuid());
 return jsonb_build_object('appointed',false,'revision',rev);
end $$;
create function public.emergency_alternate_read_v1(p_after bigint default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rows jsonb; a jsonb; begin
 perform emergency.authorize_v1(true);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 select jsonb_build_object('id',a.user_id,'name',p.display_name,'appointedAt',a.appointed_at,'revision',a.revision,'active',a.user_id is not null and a.revoked_at is null)
 into a from emergency.appointment a left join public.profiles p on p.user_id=a.user_id where singleton;
 select coalesce(jsonb_agg(q order by q.id desc),'[]'::jsonb) into rows from (
  select e.id,e.at,e.action,case when e.action<>'stop' then 'RECORDED' else emergency.receipt_v1(e.operation)->>'status' end result
  from emergency.audit e where p_after is null or e.id<p_after order by e.id desc limit p_limit) q;
 return jsonb_build_object('appointment',a,'audit',rows,'next',case when jsonb_array_length(rows)=p_limit then (rows->(p_limit-1)->>'id')::bigint end);
end $$;
-- Safe capability probe, no privileged data and no account existence leakage.
create function public.emergency_access_v1() returns boolean
language sql stable security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
 select emergency.eligible_v1()
$$;
create function public.emergency_stop_v1(p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rev bigint; prior emergency.operations; facts jsonb; begin
 rev:=emergency.authorize_v1();
 if p_operation is null then raise exception 'operation required' using errcode='22023'; end if;
 select * into prior from emergency.operations where operation=p_operation;
 if found then
  if prior.actor is distinct from auth.uid() or prior.authorization_revision<>rev then raise exception 'operation not authorized' using errcode='42501'; end if;
  return emergency.receipt_v1(prior.operation);
 end if;
 -- Reuse one unfinished operation per actor/revision; never rate-limit containment.
 select * into prior from emergency.operations where actor=auth.uid() and authorization_revision=rev and next_phase<=6;
 if found then return emergency.receipt_v1(prior.operation); end if;
 -- Bound redundant receipt creation while already stopped. An unsafe current fact
 -- always permits a fresh stop, even inside the 30-second metadata-abuse window.
 select * into prior from emergency.operations where actor=auth.uid() and authorization_revision=rev order by created_at desc limit 1;
 if found and prior.updated_at>clock_timestamp()-interval '30 seconds' and emergency.receipt_v1(prior.operation)->>'status'='STOPPED' then
  perform pg_catalog.pg_stat_clear_snapshot(); facts:=emergency.facts_v1();
  if (facts->>'gateClosed')::boolean and (facts->>'loginDisabled')::boolean and (facts->>'backendSessions')::bigint=0 and (facts->>'unheldSessions')::bigint=0 then return emergency.receipt_v1(prior.operation); end if;
 end if;
 insert into emergency.operations(operation,actor,authorization_revision) values(p_operation,auth.uid(),rev);
 insert into emergency.audit(actor,action,authorization_revision,operation) values(auth.uid(),'stop',rev,p_operation);
 return emergency.receipt_v1(p_operation);
end $$;
create function public.emergency_stop_receipt_v1(p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rev bigint; o emergency.operations; begin
 rev:=emergency.authorize_v1();
 select * into o from emergency.operations where operation=p_operation;
 if not found then return null; end if;
 if not public.is_owner() and (o.actor is distinct from auth.uid() or o.authorization_revision<>rev) then raise exception 'operation not authorized' using errcode='42501'; end if;
 return emergency.receipt_v1(p_operation);
end $$;
create function public.emergency_stop_phase_v1(p_operation uuid,p_phase smallint) returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
declare rev bigint; o emergency.operations; ok boolean:=false; facts jsonb; b record; begin
 rev:=emergency.authorize_v1();
 if p_phase is null or p_phase not between 1 and 6 then raise exception 'invalid phase' using errcode='22023'; end if;
 select * into o from emergency.operations where operation=p_operation for update;
 -- No other RPC can change revision while this transaction holds the common lock.
 if not found or o.actor is distinct from auth.uid() or o.authorization_revision<>rev then raise exception 'operation not authorized' using errcode='42501'; end if;
 perform emergency.authorize_v1();
 if p_phase<o.next_phase then return emergency.receipt_v1(p_operation); end if;
 if p_phase<>o.next_phase then raise exception 'ordered phases required' using errcode='22023'; end if;
 -- QUERY_CANCELED is deliberately NOT caught. The outer request timer rolls back
 -- only this phase; earlier committed phase receipts remain. Client shows UNKNOWN
 -- until a separate authorized receipt read, then continues unfinished phases only.
 begin
  case p_phase
  when 1 then
   lock table assess.launch_gate in access exclusive mode;
   perform emergency.authorize_v1();
   insert into assess.launch_gate(singleton,enabled) values(true,false) on conflict(singleton) do nothing;
   update assess.launch_gate set enabled=false where enabled; ok:=true;
  when 2 then
   if exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_a' and rolcanlogin) then alter role assess_job_a nologin; end if; ok:=true;
  when 3 then
   if exists(select 1 from pg_catalog.pg_roles where rolname='assess_job_b' and rolcanlogin) then alter role assess_job_b nologin; end if; ok:=true;
  when 4 then
   ok:=true;
   for b in select pid from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b') and pid<>pg_catalog.pg_backend_pid() loop
    if not pg_catalog.pg_terminate_backend(b.pid,1000) then ok:=false; end if;
   end loop;
  when 5 then perform assess.freeze_v2(); ok:=true;
  when 6 then
   perform pg_catalog.pg_stat_clear_snapshot(); facts:=emergency.facts_v1();
   ok:=(facts->>'gateClosed')::boolean and (facts->>'loginDisabled')::boolean and (facts->>'backendSessions')::bigint=0 and (facts->>'unheldSessions')::bigint=0;
  end case;
 exception when others then ok:=false; facts:=null;
 end;
 insert into emergency.phases(operation,phase,ok,verification) values(p_operation,p_phase,ok,facts);
 update emergency.operations set next_phase=p_phase+1,updated_at=clock_timestamp() where operation=p_operation;
 update emergency.audit set phases=phases||jsonb_build_object(p_phase::text,ok) where operation=p_operation;
 return emergency.receipt_v1(p_operation);
end $$;
-- SQL-operator only. Invoke by the Terms deadline after the announced pilot end;
-- no API EXECUTE grant and no privileged action for the emergency alternate.
create function emergency.purge_after_pilot_v1(p_ended_at timestamptz) returns void
language plpgsql security definer set search_path='' set lock_timeout='2s' set timezone='UTC' as $$
begin
 if p_ended_at is null or clock_timestamp()<p_ended_at then raise exception 'pilot has not ended' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock_shared(hashtextextended('rad062-capacity',0));
 perform 1 from emergency.appointment where singleton for update;
 delete from emergency.operations; delete from emergency.audit;
 update emergency.appointment set user_id=null,appointed_by=null,appointed_at=null,revoked_at=clock_timestamp(),revision=revision+1 where singleton;
end $$;
-- Make provider default privileges irrelevant, including service_role.
do $acl$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='emergency' or (n.nspname='public' and p.proname in ('emergency_alternate_set_v1','emergency_alternate_remove_v1','emergency_alternate_read_v1','emergency_access_v1','emergency_stop_v1','emergency_stop_receipt_v1','emergency_stop_phase_v1'))
 loop execute format('revoke all on function %s from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge',f.signature); end loop;
end $acl$;
grant execute on function public.emergency_alternate_set_v1(uuid),public.emergency_alternate_remove_v1(),public.emergency_alternate_read_v1(bigint,integer),public.emergency_access_v1(),public.emergency_stop_v1(uuid),public.emergency_stop_receipt_v1(uuid),public.emergency_stop_phase_v1(uuid,smallint) to authenticated;
do $post$ begin
 if (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
  or (select count(*) from emergency.appointment)<>1 then raise exception 'RAD059 atomic postcondition failed' using errcode='55000'; end if;
end $post$;
commit;
