-- RAD-105 S2. Offline promotion only; apply once in the separately authorised P7 window.
begin;
set local search_path='';
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$begin
 if to_regclass('assess.restore_epoch') is null or to_regprocedure('emergency.authorize_v1(boolean,uuid)') is null
 or not coalesce((select count(*)=1 and bool_and(singleton and not enabled) from assess.launch_gate),false)
 then raise exception 'S1 and closed gate required' using errcode='55000'; end if;
end$$;

-- Existing appointment erasure removes the permission and its opaque audit association.
alter table assess.supervisor_appointments add column all_students boolean not null default false,
 add column all_students_key uuid not null default gen_random_uuid();
alter table emergency.audit drop constraint audit_action_check;
alter table emergency.audit add constraint audit_action_check check(action in
 ('appoint','remove','stop','resume','quiz-permission','quiz-publish','window','extra-time','new-attempt','assessment-notify'));

-- Preserve the original one-group-assignment-per-owner/version rule in its own audience.
alter table assess.assignments add column audience text not null default 'groups' check(audience in ('groups','all-students'));
drop index assess.assess_one_open_assignment;
create unique index assess_one_open_assignment on assess.assignments(owner_id,version_id,audience) where closed_at is null;
create table assess.all_students_assignments (
 assignment_id uuid primary key references assess.assignments(id) on delete cascade
);
create table assess.assignment_accommodations (
 assignment_id uuid not null, user_id uuid not null,
 extra_seconds integer not null check(extra_seconds between 0 and 86400),
 changes smallint not null default 1 check(changes between 1 and 10),
 audit_key uuid not null default gen_random_uuid(),
 primary key(assignment_id,user_id),
 foreign key(assignment_id,user_id) references assess.targets(assignment_id,user_id) on delete cascade
);
-- Authoritative transition evidence, never backfilled from ambiguous historical failed/held rows.
create table assess.stop_active_attempts (
 session_id uuid primary key references assess.sessions(id) on delete cascade,
 held_at timestamptz not null, was_active boolean not null, granted_at timestamptz,
 check(granted_at is null or was_active)
);
create table assess.assessment_notify_settings (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false
);
insert into assess.assessment_notify_settings default values;
create table assess.assessment_notices (
 assignment_id uuid not null, user_id uuid not null, opens_at timestamptz not null,
 sent_at timestamptz, request_id bigint,
 primary key(assignment_id,user_id),
 foreign key(assignment_id,user_id) references assess.targets(assignment_id,user_id) on delete cascade
);

create function assess.s2_audit_v1(p_action text,p_facts jsonb,p_revision bigint default 0) returns void
language sql security definer set search_path='' as $$
 insert into emergency.audit(actor,action,authorization_revision,operation,phases)
 values(auth.uid(),p_action,p_revision,gen_random_uuid(),p_facts)
$$;
-- Preserve the original emergency UI's closed v1 action vocabulary and receipt parser.
-- S2 actions use a separate versioned, owner-only read over the same audited store.
do $compat$declare d text; needle text:='from emergency.audit e where p_after is null or e.id<p_after order by e.id desc limit p_limit'; begin
 d:=pg_get_functiondef('public.emergency_alternate_read_v1(bigint,integer)'::regprocedure);
 if (length(d)-length(replace(d,needle,'')))<>length(needle) then raise exception 'S2 emergency audit read anchor drift'; end if;
 execute replace(d,needle,'from emergency.audit e where e.action in (''appoint'',''remove'',''stop'') and (p_after is null or e.id<p_after) order by e.id desc limit p_limit');
end$compat$;
create function assess.selfservice_audit_v1(p_after bigint default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform emergency.authorize_v1(true,null);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 return coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (
  select id,actor,action,at,authorization_revision,phases from emergency.audit
  where action not in ('appoint','remove','stop') and (p_after is null or id<p_after) order by id desc limit p_limit) q),'[]'::jsonb);
end$$;
create function assess.quiz_permission_reset_v1() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if new.revoked_at is not null then
  new.all_students:=false;
  if old.all_students then perform assess.s2_audit_v1('quiz-permission',jsonb_build_object('appointmentKey',old.all_students_key,'enabled',false,'reason','appointment-revoked'),new.revision); end if;
 end if; return new;
end$$;
create trigger rad105_quiz_permission_reset before update on assess.supervisor_appointments
 for each row execute function assess.quiz_permission_reset_v1();
create function assess.quiz_permission_v1(p_supervisor uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$declare a assess.supervisor_appointments; begin
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_enabled is null then raise exception 'permission required' using errcode='22023'; end if;
 select * into a from assess.supervisor_appointments where user_id=p_supervisor and revoked_at is null for update;
 if a.user_id is null then raise exception 'appointed supervisor required' using errcode='42501'; end if;
 update assess.supervisor_appointments set all_students=p_enabled where user_id=p_supervisor;
 perform assess.s2_audit_v1('quiz-permission',jsonb_build_object('appointmentKey',a.all_students_key,'enabled',p_enabled),a.revision);
end$$;
create function assess.quiz_permissions_v1(p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform assess.scope_enter_v1(false);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 return coalesce((select jsonb_agg(to_jsonb(q) order by q.user_id) from (
  select user_id,all_students,all_students_key from assess.supervisor_appointments where revoked_at is null and (p_after is null or user_id>p_after)
  order by user_id limit p_limit) q),'[]'::jsonb);
end$$;
create function assess.quiz_capability_v1() returns boolean
language plpgsql security definer set search_path='' as $$begin
 perform assess.scope_enter_v1(false);
 return public.is_owner() or exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null and all_students);
end$$;

-- Eligibility uses the existing privacy and current Assess consent, never sharing/group opt-in.
create function assess.quiz_recipient_v1(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.user_id=p_user and p.status='approved' and p.role='participant'
  and p.consent_version is not null and p.consented_at is not null
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
  and not exists(select 1 from assess.account_stops s where s.user_id=p.user_id)
  and exists(select 1 from assess.consents c where c.user_id=p.user_id and c.version='assess-written-2026-11-02-v3'))
$$;
create function assess.quiz_publish_v1(p_version uuid,p_operation uuid,p_opens timestamptz,p_closes timestamptz default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare aid uuid; finish timestamptz:=coalesce(p_closes,p_opens+interval '2 hours'); n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.scope_enter_v1(true);
 if not public.is_owner() and not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null and all_students)
 then raise exception 'all-students permission required' using errcode='42501'; end if;
 if p_operation is null then raise exception 'operation required' using errcode='22023'; end if;
 -- Same installed immutable publication and exact author-revision link; no authoring/review bypass.
 perform 1 from assess.versions v join assess.publications pub on pub.version_id=v.id
 join assess.content_submissions c on c.version_id=v.id and c.state='installed'
 join assess.authoring_publication_links l on l.version_id=v.id
 join assess.authoring_revisions r on r.draft_id=l.draft_id and r.revision=l.draft_revision and r.digest=l.source_digest
 where v.id=p_version and v.available and v.schema_version=2 and (public.is_owner() or v.owner_id=auth.uid()) for share of v;
 if not found then raise exception 'reviewed installed publication required' using errcode='42501'; end if;
 select a.id into aid from assess.assignments a join assess.all_students_assignments q on q.assignment_id=a.id
 where a.id=p_operation and a.owner_id=auth.uid() and a.version_id=p_version;
 if aid is not null then return aid; end if;
 if p_opens is null or not isfinite(p_opens) or not isfinite(finish) or p_opens<clock_timestamp()-interval '1 minute'
 or finish<=clock_timestamp() or finish<=p_opens or finish-p_opens>interval '7 days'
 then raise exception 'invalid window' using errcode='22023'; end if;
 -- Consent acceptance/revocation is serialized even for previously absent consent rows.
 lock table assess.consents in share mode;
 if finish<=clock_timestamp() then raise exception 'window ended while publishing' using errcode='55000'; end if;
 insert into assess.assignments(id,owner_id,version_id,audience) values(p_operation,auth.uid(),p_version,'all-students') returning id into aid;
 insert into assess.all_students_assignments values(aid);
 with recipients as materialized(select user_id from public.profiles where assess.quiz_recipient_v1(user_id) order by user_id limit 1001 for share)
 insert into assess.targets select aid,user_id from recipients;
 get diagnostics n=row_count;
 if n not between 1 and 1000 then raise exception 'target count outside limit' using errcode='54000'; end if;
 insert into assess.assignment_windows(assignment_id,opens_at,closes_at) values(aid,p_opens,finish);
 perform assess.s2_audit_v1('quiz-publish',jsonb_build_object('assignmentId',aid,'targetCount',n));
 return aid;
end$$;

-- Shared own-assignment boundary for accommodations and emergency replacement grants.
create function assess.own_assignment_v1(p_assignment uuid) returns assess.assignments
language plpgsql security definer set search_path='' as $$declare a assess.assignments; gid uuid; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.scope_enter_v1(true);
 select * into a from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 if not public.is_owner() then
  if not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
  then raise exception 'supervisor revoked' using errcode='42501'; end if;
  if not exists(select 1 from assess.all_students_assignments where assignment_id=a.id) then
   select group_id into gid from assess.assignment_scopes where assignment_id=a.id and supervisor_id=auth.uid();
   perform assess.supervised_group_v1(gid);
  end if;
 end if;
 if a.closed_at is not null or exists(select 1 from assess.assignment_windows where assignment_id=a.id and closes_at<=clock_timestamp())
 then raise exception 'assignment window ended' using errcode='55000'; end if;
 return a;
end$$;
create function assess.quiz_page_v1(p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if not public.is_owner() and not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
 then raise exception 'supervisor required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from (
  select a.id,a.version_id,a.revision,a.closed_at,w.opens_at,w.closes_at from assess.assignments a
  join assess.all_students_assignments b on b.assignment_id=a.id join assess.assignment_windows w on w.assignment_id=a.id
  where a.owner_id=auth.uid() and (p_after is null or a.id>p_after) order by a.id limit p_limit) q),'[]'::jsonb);
end$$;
create function assess.quiz_close_v1(p_assignment uuid,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$declare a assess.assignments; begin
 a:=assess.own_assignment_v1(p_assignment);
 if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
 if a.audience<>'all-students' then raise exception 'quiz required' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=a.id;
 perform assess.s2_audit_v1('window',jsonb_build_object('assignmentId',a.id,'closed',true),a.revision+1);
end$$;
create function assess.assignment_schedule_v2(p_assignment uuid,p_revision integer,p_opens timestamptz,p_closes timestamptz default null) returns integer
language plpgsql security definer set search_path='' as $$begin
 perform assess.own_assignment_v1(p_assignment);
 return assess.assignment_window_set_v1(p_assignment,p_revision,p_opens,coalesce(p_closes,p_opens+interval '2 hours'));
end$$;
create function assess.pool_recommendation_v1(p_version uuid) returns jsonb
language plpgsql security definer set search_path='' as $$declare doc jsonb; x integer; y integer; begin
 perform assess.scope_enter_v1(false);
 select p.document->'assessment' into doc from assess.publications p join assess.versions v on v.id=p.version_id
 where v.id=p_version and v.available and (public.is_owner() or v.owner_id=auth.uid());
 if doc is null then raise exception 'version denied' using errcode='42501'; end if;
 select count(*) into y from jsonb_array_elements(doc->'items') i where i->>'type'='single-choice';
 x:=coalesce((doc->'randomPool'->>'size')::integer,y);
 return jsonb_build_object('version',1,'selected',x,'available',y,'recommended',y>x,'defaultWindowSeconds',7200,'maxWindowSeconds',604800);
end$$;

create or replace function assess.window_deadline_v1(p_assignment uuid,p_start timestamptz,p_duration integer) returns timestamptz
language sql stable security definer set search_path='' as $$
 select least(p_start+make_interval(secs=>p_duration+coalesce((select extra_seconds from assess.assignment_accommodations where assignment_id=p_assignment and user_id=auth.uid()),0)),
  (select closes_at from assess.assignment_windows where assignment_id=p_assignment))
$$;
create function assess.extra_time_v1(p_assignment uuid,p_student uuid,p_seconds integer) returns void
language plpgsql security definer set search_path='' as $$declare a assess.assignments; w assess.assignment_windows; c assess.assignment_accommodations; begin
 a:=assess.own_assignment_v1(p_assignment);
 if p_seconds is null or p_seconds not between 0 and 86400 then raise exception 'extra time outside limit' using errcode='22023'; end if;
 perform 1 from assess.targets where assignment_id=a.id and user_id=p_student for update;
 if not found then raise exception 'target denied' using errcode='42501'; end if;
 select * into w from assess.assignment_windows where assignment_id=a.id for update;
 select * into c from assess.assignment_accommodations where assignment_id=a.id and user_id=p_student for update;
 if c.changes>=10 then raise exception 'accommodation change limit' using errcode='54000'; end if;
 -- Never shorten an in-flight deadline, or revive an expired/held attempt.
 if exists(select 1 from assess.sessions where assignment_id=a.id and user_id=p_student and state='active'
  and (emergency_held_at is not null or deadline<=clock_timestamp() or p_seconds<coalesce(c.extra_seconds,0)))
 then raise exception 'active deadline cannot be reduced or revived' using errcode='55000'; end if;
 insert into assess.assignment_accommodations(assignment_id,user_id,extra_seconds,changes) values(a.id,p_student,p_seconds,1)
 on conflict(assignment_id,user_id) do update set extra_seconds=excluded.extra_seconds,changes=assess.assignment_accommodations.changes+1;
 update assess.sessions s set deadline=least(s.started_at+make_interval(secs=>(pub.document->'assessment'->'policy'->>'durationSeconds')::integer+p_seconds),w.closes_at)
 from assess.publications pub where pub.version_id=a.version_id and s.assignment_id=a.id and s.user_id=p_student and s.state='active' and s.emergency_held_at is null;
 -- No student identity in durable audit JSON; accommodation association is erasable through targets.
 perform assess.s2_audit_v1('extra-time',jsonb_build_object('assignmentId',a.id,'accommodationKey',(select audit_key from assess.assignment_accommodations where assignment_id=a.id and user_id=p_student),'seconds',p_seconds,'change',coalesce(c.changes,0)+1));
end$$;

create function assess.stop_active_capture_v1() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if old.lifecycle_version=2 and old.state in ('active','grading','grading-failed','awaiting-manual') and old.emergency_held_at is null
 and new.emergency_held_at is not null and new.state='grading-failed' then
  insert into assess.stop_active_attempts(session_id,held_at,was_active) values(old.id,new.emergency_held_at,old.state='active') on conflict do nothing;
 end if; return new;
end$$;
create trigger rad105_stop_active_capture after update on assess.sessions
 for each row execute function assess.stop_active_capture_v1();
create function assess.new_attempt_v1(p_assignment uuid,p_session uuid) returns void
language plpgsql security definer set search_path='' as $$declare a assess.assignments; s assess.sessions; proof assess.stop_active_attempts; begin
 a:=assess.own_assignment_v1(p_assignment);
 select * into s from assess.sessions where id=p_session and assignment_id=a.id for update;
 select * into proof from assess.stop_active_attempts where session_id=s.id for update;
 if proof.session_id is null or not proof.was_active or s.emergency_held_at is distinct from proof.held_at or s.state<>'grading-failed'
 or s.expires_at<=clock_timestamp() then raise exception 'not an emergency-held ACTIVE attempt' using errcode='55000'; end if;
 if proof.granted_at is not null then return; end if;
 if (select count(*) from assess.stop_active_attempts p join assess.sessions t on t.id=p.session_id
  where t.assignment_id=a.id and t.user_id=s.user_id and p.granted_at is not null)>=3
 then raise exception 'replacement attempt limit' using errcode='54000'; end if;
 update assess.stop_active_attempts set granted_at=clock_timestamp() where session_id=s.id;
 perform assess.s2_audit_v1('new-attempt',jsonb_build_object('assignmentId',a.id,'sessionId',s.id));
end$$;

-- Counted patches retain all original guards, pool selection and immutable snapshots.
do $patch$declare d text; needle text; replacement text; pair text[]; begin
 d:=pg_get_functiondef('assess.start_v2(uuid,uuid)'::regprocedure);
 foreach pair slice 1 in array array[
  array['and state in (''grading'',''grading-failed'',''awaiting-manual'') order by ordinal desc limit 1;',
   'and state in (''grading'',''grading-failed'',''awaiting-manual'') and not exists(select 1 from assess.stop_active_attempts p where p.session_id=assess.sessions.id and p.granted_at is not null) order by ordinal desc limit 1;'],
  array['if n >= (doc->''assessment''->''policy''->>''maxAttempts'')::integer then',
   'if n >= (doc->''assessment''->''policy''->>''maxAttempts'')::integer + (select count(*) from assess.stop_active_attempts p join assess.sessions t on t.id=p.session_id where t.assignment_id=p_assignment and t.user_id=auth.uid() and p.granted_at is not null) then']
 ] loop
  needle:=pair[1]; replacement:=pair[2];
  if (length(d)-length(replace(d,needle,'')))<>length(needle) then raise exception 'S2 start anchor drift'; end if;
  d:=replace(d,needle,replacement);
 end loop; execute d;
 d:=pg_get_functiondef('assess.assignment_window_set_v1(uuid,integer,timestamptz,timestamptz)'::regprocedure);
 needle:='if gid is null then raise exception ''assignment denied'' using errcode=''42501''; end if;';
 replacement:='if gid is null and (not exists(select 1 from assess.all_students_assignments where assignment_id=a.id) or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)) then raise exception ''assignment denied'' using errcode=''42501''; end if;';
 if (length(d)-length(replace(d,needle,'')))<>length(needle) then raise exception 'S2 scope anchor drift'; end if;
 d:=replace(d,needle,replacement);
 d:=replace(d,'perform assess.supervised_group_v1(gid);','if gid is not null then perform assess.supervised_group_v1(gid); end if;');
 d:=replace(d,'secs=>dur.d','secs=>dur.d+coalesce((select extra_seconds from assess.assignment_accommodations c where c.assignment_id=a.id and c.user_id=s.user_id),0)');
 d:=replace(d,'return a.revision+1;','perform assess.s2_audit_v1(''window'',jsonb_build_object(''assignmentId'',a.id,''opensAt'',p_opens,''closesAt'',p_closes),a.revision+1); return a.revision+1;');
 execute d;
 -- Resume uses the established appointment/erasure authorization, including rechecks after waits.
 d:=pg_get_functiondef('assess.owner_resume_v1(text)'::regprocedure);
 needle:='perform assess.owner_scope_enter_v1(true);';
 if (length(d)-length(replace(d,needle,'')))<>length(needle) then raise exception 'S2 resume anchor drift'; end if;
 d:=replace(d,needle,'perform emergency.authorize_v1(false,null);');
 d:=replace(d,'if not public.is_owner() then raise exception ''owner only'' using errcode=''42501''; end if;','');
 d:=replace(d,'and s.submitted_at>clock_timestamp()', 'and exists(select 1 from assess.stop_active_attempts p where p.session_id=s.id and not p.was_active and p.held_at=s.emergency_held_at) and s.submitted_at>clock_timestamp()');
 d:=replace(d,'and state=''active'';', 'and (state=''active'' or exists(select 1 from assess.stop_active_attempts p where p.session_id=assess.sessions.id and p.was_active));');
 d:=replace(d,'update assess.launch_gate set enabled=true;', 'perform assess.s2_audit_v1(''resume'',jsonb_build_object(''released'',released,''heldActive'',active_held)); update assess.launch_gate set enabled=true;');
 execute d;
end$patch$;

-- Queue contains associations and opening time only. Re-scheduling updates unsent rows;
-- a sent notice remains deduplicated for that assignment/target, even after window edits.
create function assess.notice_refresh_v1() returns trigger
language plpgsql security definer set search_path='' as $$declare aid uuid:=new.assignment_id; begin
 insert into assess.assessment_notices(assignment_id,user_id,opens_at)
 select t.assignment_id,t.user_id,w.opens_at from assess.targets t join assess.assignment_windows w on w.assignment_id=t.assignment_id
 where t.assignment_id=aid
 on conflict(assignment_id,user_id) do update set opens_at=excluded.opens_at where assess.assessment_notices.sent_at is null;
 return new;
end$$;
create trigger rad105_notice_target after insert on assess.targets for each row execute function assess.notice_refresh_v1();
create trigger rad105_notice_window after insert or update on assess.assignment_windows for each row execute function assess.notice_refresh_v1();

-- Same Brevo/Vault/pg_net pattern as RAD-104; secrets resolved ONLY when dispatch is enabled.
create function assess.notice_post_v1(p_email text,p_opens timestamptz) returns bigint
language plpgsql security definer set search_path='' set timezone='UTC' as $$declare k text; sender text; msg text; begin
 if to_regclass('vault.decrypted_secrets') is null then return null; end if;
 select max(decrypted_secret) filter(where name='radlab_signup_notify_brevo_key'),
 max(decrypted_secret) filter(where name='radlab_signup_notify_sender') into k,sender from vault.decrypted_secrets
 where name in ('radlab_signup_notify_brevo_key','radlab_signup_notify_sender');
 if coalesce(btrim(k),'')='' or coalesce(btrim(sender),'')='' or coalesce(btrim(p_email),'')='' then return null; end if;
 msg:='You have a new assessment, opens at '||to_char(p_opens,'YYYY-MM-DD"T"HH24:MI:SS"Z"');
 return net.http_post(url:='https://api.brevo.com/v3/smtp/email',body:=jsonb_build_object(
  'sender',jsonb_build_object('name','RAD-LAB','email',btrim(sender)),'to',jsonb_build_array(jsonb_build_object('email',p_email)),
  'subject','RAD-LAB: new assessment','textContent',msg,'htmlContent','<p>'||msg||'</p>'),
  headers:=jsonb_build_object('api-key',btrim(k),'content-type','application/json','accept','application/json'),timeout_milliseconds:=5000);
end$$;
create function assess.notice_dispatch_v1() returns integer
language plpgsql security definer set search_path='' as $$declare q record; req bigint; sent integer:=0; begin
 if not pg_try_advisory_xact_lock(105,3) then return 0; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform 1 from assess.scope_lock for share;
 perform 1 from assess.assessment_notify_settings where singleton and enabled for share;
 if not found then return 0; end if;
 for q in select n.*,u.email from assess.assessment_notices n join assess.assignments a on a.id=n.assignment_id
  join assess.assignment_windows w on w.assignment_id=a.id join auth.users u on u.id=n.user_id
  join public.profiles p on p.user_id=n.user_id join assess.consents c on c.user_id=p.user_id and c.version='assess-written-2026-11-02-v3'
  where n.sent_at is null and u.email is not null and btrim(u.email)<>'' and a.closed_at is null and w.closes_at>clock_timestamp() and assess.quiz_recipient_v1(n.user_id)
  order by n.assignment_id,n.user_id limit 100 for share of a,w,p,c,u for update of n
 loop
  -- Eligibility and schedule re-read under locks immediately before the pg_net enqueue.
  if not assess.quiz_recipient_v1(q.user_id) then continue; end if;
  req:=assess.notice_post_v1(q.email,q.opens_at);
  if req is not null then
   update assess.assessment_notices set sent_at=clock_timestamp(),request_id=req where assignment_id=q.assignment_id and user_id=q.user_id;
   sent:=sent+1;
  end if;
 end loop; return sent;
end$$;
create function assess.notice_switch_v1(p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$begin
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_enabled is null then raise exception 'switch required' using errcode='22023'; end if;
 update assess.assessment_notify_settings set enabled=p_enabled where singleton;
 perform assess.s2_audit_v1('assessment-notify',jsonb_build_object('enabled',p_enabled));
end$$;

do $acl$declare t text; f regprocedure; begin
 foreach t in array array['all_students_assignments','assignment_accommodations','stop_active_attempts','assessment_notify_settings','assessment_notices'] loop
  execute format('alter table assess.%I enable row level security',t);
  execute format('revoke all on assess.%I from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge',t);
 end loop;
 for f in select p.oid::regprocedure from pg_proc p where p.pronamespace='assess'::regnamespace and p.proname in
 ('s2_audit_v1','selfservice_audit_v1','quiz_permission_reset_v1','quiz_permission_v1','quiz_permissions_v1','quiz_capability_v1','quiz_recipient_v1','quiz_publish_v1','own_assignment_v1','assignment_schedule_v2',
  'quiz_page_v1','quiz_close_v1','pool_recommendation_v1','extra_time_v1','stop_active_capture_v1','new_attempt_v1','notice_refresh_v1','notice_post_v1','notice_dispatch_v1','notice_switch_v1') loop
  execute format('revoke all on function %s from public,anon,authenticated,service_role,assess_worker,assess_authoring_bridge',f);
 end loop;
end$acl$;
grant execute on function assess.quiz_permission_v1(uuid,boolean),assess.quiz_publish_v1(uuid,uuid,timestamptz,timestamptz),
 assess.assignment_schedule_v2(uuid,integer,timestamptz,timestamptz),assess.pool_recommendation_v1(uuid),assess.extra_time_v1(uuid,uuid,integer),
 assess.new_attempt_v1(uuid,uuid),assess.notice_switch_v1(boolean),assess.quiz_page_v1(uuid,integer),assess.quiz_close_v1(uuid,integer) to authenticated;
grant execute on function assess.quiz_permissions_v1(uuid,integer),assess.quiz_capability_v1(),assess.selfservice_audit_v1(bigint,integer) to authenticated;
commit;
