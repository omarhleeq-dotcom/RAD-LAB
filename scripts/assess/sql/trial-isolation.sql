-- LOCAL REVIEW PACKAGE ONLY. Not a migration or an instruction to apply on a provider.
-- Installs dormant: no scope row, gate/LOGIN change, seed, worker or scheduler.
begin;
set local lock_timeout='2s';
set local statement_timeout='15s';
create table assess.trial_scope (
 singleton boolean primary key default true check(singleton),
 id uuid not null unique,
 active boolean not null default false,
 owner_id uuid not null,
 student_id uuid not null,
 outsider_id uuid not null,
 assessment_id uuid not null,
 version_labels text[] not null check(array_ndims(version_labels)=1 and array_lower(version_labels,1)=1 and array_upper(version_labels,1)=2
   and cardinality(version_labels)=2 and array_position(version_labels,null) is null
   and length(version_labels[1]) between 1 and 100 and length(version_labels[2]) between 1 and 100
   and version_labels[1]<>version_labels[2]),
 check(owner_id<>student_id and owner_id<>outsider_id and student_id<>outsider_id)
);
alter table assess.trial_scope enable row level security;
revoke all on assess.trial_scope from public,anon,authenticated,assess_worker;

-- Real relation locks cover ordinary SQL/RPC writers, not just cooperating clients.
-- Short-lived, Assess-only. NOWAIT rejects writers/row-locking readers before
-- any scope check or effect; plain AccessShare readers remain possible.
create function assess.trial_tables_lock_v1() returns void
language plpgsql security definer set search_path='' as $$
begin
 lock table assess.account_stops,assess.assignments,assess.consents,assess.content_submissions,
   assess.groups,assess.launch_gate,assess.memberships,assess.publications,assess.receipts,
   assess.reservations,assess.results,assess.session_details,assess.sessions,assess.targets,assess.versions
   in exclusive mode nowait;
end $$;

-- Metadata projections only. No key, answer, grade, JWT or user data in errors.
create function assess.trial_row_allowed_v1(t text,j jsonb,c assess.trial_scope,removing boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
declare v uuid; a uuid; u uuid;
begin
 if t='versions' then
   return (j->>'owner_id')::uuid=c.owner_id and (j->>'assessment_id')::uuid=c.assessment_id
     and j->>'version'=any(c.version_labels) and j->>'track'='mixed' and (j->>'schema_version')::integer=1;
 elsif t='assignments' then
   if (j->>'owner_id')::uuid<>c.owner_id or j->'source_group_ids'<>'[]'::jsonb then return false; end if;
   v:=(j->>'version_id')::uuid;
 elsif t in ('content_submissions','publications') then v:=(j->>'version_id')::uuid;
 elsif t in ('sessions','reservations','targets') then
   a:=(j->>'assignment_id')::uuid;u:=(j->>'user_id')::uuid;
   if u<>c.student_id then return false; end if;
 elsif t in ('session_details','receipts','results') then
   select s.assignment_id,s.user_id into a,u from assess.sessions s where s.id=(j->>'session_id')::uuid;
   -- FK cascade: parent was checked BEFORE deletion; child now has no parent.
   if not found then return removing; end if;
   if u<>c.student_id then return false; end if;
 elsif t='account_stops' then return (j->>'user_id')::uuid in (c.owner_id,c.student_id,c.outsider_id);
 elsif t='consents' then return (j->>'user_id')::uuid in (c.owner_id,c.student_id,c.outsider_id);
 else return false;
 end if;
 if a is not null then
   select x.version_id into v from assess.assignments x where x.id=a and x.owner_id=c.owner_id
     and cardinality(x.source_group_ids)=0;
 end if;
 return exists(select 1 from assess.versions x where x.id=v and x.owner_id=c.owner_id
   and x.assessment_id=c.assessment_id and x.version=any(c.version_labels) and x.track='mixed');
end $$;

create function assess.trial_assert_v1(c assess.trial_scope) returns void
language plpgsql security definer set search_path='' as $$
declare t text; fields text; n integer; j jsonb;
begin
 -- Every source of maintain/claim eligibility is locked by the caller first.
 -- A fresh READ COMMITTED snapshot after lock acquisition is required.
 if current_setting('transaction_isolation')<>'read committed' then
   raise exception 'trial isolation unavailable' using errcode='55000'; end if;
 foreach t in array array['versions','assignments','targets','sessions','reservations','session_details',
   'receipts','results','content_submissions','publications','account_stops','consents','groups','memberships'] loop
   execute format('select count(*) from (select 1 from assess.%I limit 101) b',t) into n;
   if n>100 then raise exception 'trial ceiling exceeded' using errcode='54000'; end if;
   if (t in ('versions','assignments','sessions','targets') and n>2) or (t in ('groups','memberships') and n<>0) then
     raise exception 'trial scope conflict' using errcode='42501'; end if;
   -- All existing consents are retained, regardless of their identities/versions.
   if t='consents' then continue; end if;
   fields:=case t when 'versions' then 'id,owner_id,assessment_id,version,track,schema_version'
     when 'assignments' then 'id,owner_id,version_id,source_group_ids'
     when 'targets' then 'assignment_id,user_id' when 'sessions' then 'id,assignment_id,user_id'
     when 'reservations' then 'assignment_id,user_id' when 'account_stops' then 'user_id'
     when 'content_submissions' then 'version_id' when 'publications' then 'version_id'
     when 'groups' then 'id' when 'memberships' then 'group_id'
     else 'session_id' end;
   for j in execute format('select to_jsonb(b) from (select %s from assess.%I limit 101) b',fields,t) loop
     if assess.trial_row_allowed_v1(t,j,c) is not true then
       raise exception 'trial scope conflict' using errcode='42501'; end if;
   end loop;
 end loop;
 -- Global maintenance must never reach consent cleanup during this trial.
 if exists(select 1 from assess.consents co join assess.account_stops st using(user_id)
   where not exists(select 1 from assess.sessions s where s.user_id=co.user_id)) then
   raise exception 'trial consent preservation conflict' using errcode='42501'; end if;
end $$;

-- Only the existing DB administrator can configure this private table.
-- Configuration is serialized with ALL Assess writers; it never opens the gate.
create function assess.trial_config_guard_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if current_setting('transaction_isolation')<>'read committed' then
   raise exception 'trial isolation unavailable' using errcode='55000'; end if;
 perform assess.trial_tables_lock_v1();
 if not exists(select 1 from assess.launch_gate where not enabled) then
   raise exception 'trial requires closed gate' using errcode='55000'; end if;
 if tg_op='DELETE' then
   if old.active then raise exception 'trial configuration active' using errcode='42501'; end if;
   return old;
 end if;
 if tg_op='UPDATE' and (to_jsonb(new)-'active') is distinct from (to_jsonb(old)-'active') then
   raise exception 'trial configuration immutable' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where user_id=new.owner_id and role='owner' and status='approved')
   or (select count(*) from public.profiles where user_id in (new.student_id,new.outsider_id) and role='participant' and status='approved')<>2 then
   raise exception 'trial identities unavailable' using errcode='42501'; end if;
 perform assess.trial_assert_v1(new);
 if tg_op='UPDATE' and old.active and not new.active and exists(select 1 from assess.sessions where state in ('active','grading','grading-failed')) then
   raise exception 'trial settlement pending' using errcode='55000'; end if;
 return new;
end $$;
create trigger assess_trial_config_guard before insert or update or delete on assess.trial_scope
 for each row execute function assess.trial_config_guard_v1();

create function assess.trial_truncate_guard_v1() returns trigger
language plpgsql security definer set search_path='' as $$
declare c assess.trial_scope;
begin
 if current_setting('transaction_isolation')<>'read committed' then
   raise exception 'trial isolation unavailable' using errcode='55000'; end if;
 select * into c from assess.trial_scope where singleton for update;
 if tg_table_name='trial_scope' or (found and c.active) then
   raise exception 'trial truncate denied' using errcode='42501'; end if;
 return null;
end $$;
create trigger assess_trial_no_truncate before truncate on assess.trial_scope
 execute function assess.trial_truncate_guard_v1();

-- Intercepts actual DML, including normal start/authoring RPCs and SQL writers.
-- Config remains locked until COMMIT. Both old and new identities are checked.
create function assess.trial_write_guard_v1() returns trigger
language plpgsql security definer set search_path='' as $$
declare c assess.trial_scope; j jsonb; prior jsonb; identity_keys text[];
begin
 -- Even dormant writes require fresh snapshots: an old REPEATABLE READ snapshot
 -- could otherwise miss a scope activated while it was waiting for a table lock.
 if current_setting('transaction_isolation')<>'read committed' then
   raise exception 'trial isolation unavailable' using errcode='55000'; end if;
 select * into c from assess.trial_scope where singleton and active for update;
 if found then
   if tg_table_name='consents' and tg_op<>'INSERT' then
     raise exception 'trial consents retained' using errcode='42501'; end if;
   if tg_table_name in ('versions','assignments') and tg_op='DELETE' then
     raise exception 'trial metadata retained' using errcode='42501'; end if;
   if tg_op<>'INSERT' and assess.trial_row_allowed_v1(tg_table_name,to_jsonb(old),c,tg_op='DELETE') is not true then
     raise exception 'trial write denied' using errcode='42501'; end if;
   if tg_op<>'DELETE' then
     j:=to_jsonb(new);
     if tg_op='UPDATE' then
       prior:=to_jsonb(old);
       identity_keys:=case tg_table_name
         when 'versions' then array['id','owner_id','assessment_id','version','track','schema_version']
         when 'assignments' then array['id','owner_id','version_id','source_group_ids']
         when 'sessions' then array['id','assignment_id','user_id','ordinal']
         when 'reservations' then array['assignment_id','user_id']
         when 'targets' then array['assignment_id','user_id']
         when 'account_stops' then array['user_id']
         when 'publications' then array['version_id']
         when 'content_submissions' then array['version_id']
         when 'receipts' then array['session_id','operation_id']
         else array['session_id'] end;
       if exists(select 1 from unnest(identity_keys) k where prior->k is distinct from j->k) then
         raise exception 'trial identity immutable' using errcode='42501'; end if;
     end if;
     if assess.trial_row_allowed_v1(tg_table_name,j,c) is not true then
       raise exception 'trial write denied' using errcode='42501'; end if;
     if tg_op='INSERT' and tg_table_name='assignments' and (select count(*) from assess.assignments)>=2 then
       raise exception 'trial assignment limit' using errcode='54000'; end if;
     if tg_table_name='sessions' and (j->>'ordinal')::integer<>1 then
       raise exception 'trial attempt limit' using errcode='54000'; end if;
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
do $$declare t text;begin
 foreach t in array array['versions','assignments','targets','sessions','reservations','session_details',
   'receipts','results','content_submissions','publications','account_stops','consents','groups','memberships'] loop
   execute format('create trigger assess_trial_write_guard before insert or update or delete on assess.%I for each row execute function assess.trial_write_guard_v1()',t);
   execute format('create trigger assess_trial_no_truncate before truncate on assess.%I execute function assess.trial_truncate_guard_v1()',t);
 end loop;
end $$;

create function assess.trial_enter_v1(p_trial uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c assess.trial_scope;
begin
 perform assess.trial_tables_lock_v1();
 select * into c from assess.trial_scope where singleton for update;
 if not found or not c.active or c.id is distinct from p_trial then
   raise exception 'trial inactive' using errcode='55000'; end if;
 perform assess.trial_assert_v1(c);
end $$;
create function assess.trial_maintain_v1(p_trial uuid,p_limit integer) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform assess.trial_enter_v1(p_trial);
 if p_limit is distinct from 1 then raise exception 'trial batch limit' using errcode='22023'; end if;
 return assess.maintain_v1(1);
end $$;
create function assess.trial_claim_v1(p_trial uuid) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform assess.trial_enter_v1(p_trial);return assess.claim_v1();
end $$;
create function assess.trial_health_v1(p_trial uuid) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform assess.trial_enter_v1(p_trial);return assess.health_v1();
end $$;
create function assess.trial_finish_v1(p_trial uuid,p_session uuid,p_token uuid,p_n text,p_d text) returns void
language plpgsql security definer set search_path='' as $$begin
 perform assess.trial_enter_v1(p_trial);perform assess.finish_v1(p_session,p_token,p_n,p_d);
end $$;
create function assess.trial_fail_v1(p_trial uuid,p_session uuid,p_token uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 perform assess.trial_enter_v1(p_trial);perform assess.fail_v1(p_session,p_token);
end $$;
revoke all on function assess.trial_tables_lock_v1(),assess.trial_row_allowed_v1(text,jsonb,assess.trial_scope,boolean),
 assess.trial_assert_v1(assess.trial_scope),assess.trial_config_guard_v1(),assess.trial_write_guard_v1(),assess.trial_truncate_guard_v1(),assess.trial_enter_v1(uuid),
 assess.trial_maintain_v1(uuid,integer),assess.trial_claim_v1(uuid),assess.trial_health_v1(uuid),
 assess.trial_finish_v1(uuid,uuid,uuid,text,text),assess.trial_fail_v1(uuid,uuid,uuid) from public,anon,authenticated,assess_worker;
grant execute on function assess.trial_maintain_v1(uuid,integer),assess.trial_claim_v1(uuid),assess.trial_health_v1(uuid),
 assess.trial_finish_v1(uuid,uuid,uuid,text,text),assess.trial_fail_v1(uuid,uuid,uuid) to assess_worker;
commit;
