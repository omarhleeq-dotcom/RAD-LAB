-- RAD-062 M09. DORMANT: authorization only; apply once in a separate owner window.
-- M01-M08 and their checks remain byte-identical. No signature, grants, tables,
-- JSON, scoring, audit inserts, lifecycle, D3 or emergency functions change.
-- Pre-COMMIT failure rolls back everything. After use: reviewed forward-fix only.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
-- The frozen readiness signatures are rendered in the original public context.
set local search_path=public;
select pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
-- Exact reviewed M08 catalogue (including ACL/owner/config), closed gate and D3.
do $pre$ begin
 if not coalesce((select bool_and(ok) from (
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
 select 'functions' check_name,md5((select jsonb_agg(to_jsonb(f) order by signature collate "C")::text from functions f)) actual,'7db617b89096c40877cac3fc4f60db03' expected
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
 ) baseline),false) then raise exception 'M09 reviewed M01-M08 catalogue, closed gate and D3 required' using errcode='55000'; end if;
end $pre$;
set local search_path='';
create temporary table rad062_m09_before on commit drop as
 select p.oid,to_jsonb(p)-'prosrc' properties,p.prosrc from pg_proc p
 where p.pronamespace='assess'::regnamespace;
-- Only CRLF/LF representation may vary. Every exact anchor occurs ONCE.
create function pg_temp.rad062_m09_patch(body text, anchor text, replacement text) returns text
language plpgsql as $patcher$
declare normalized text:=replace(body,E'\r\n',E'\n'); expected text:=replace(anchor,E'\r\n',E'\n'); hits integer; begin
 hits:=(length(normalized)-length(replace(normalized,expected,'')))/length(expected);
 if hits<>1 then raise exception 'M09 anchor count %, expected 1',hits using errcode='55000'; end if;
 if position(anchor in body)>0 then return replace(body,anchor,replacement); end if;
 if position(replace(anchor,E'\n',E'\r\n') in body)>0 then
  return replace(body,replace(anchor,E'\n',E'\r\n'),replace(replacement,E'\n',E'\r\n'));
 end if;
 raise exception 'M09 mixed newline anchor drift' using errcode='55000';
end $patcher$;
do $patch$ declare original text; patched text; begin
 original:=pg_get_functiondef('assess.manual_authorize_v1(uuid)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
declare s assess.sessions; assignment uuid; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.owner_scope_enter_v1(false);
 perform assess.scope_enter_v1(false); -- also rejects Assess account stops
 select assignment_id into assignment from assess.sessions where id=p_session;
 perform 1 from assess.assignments where id=assignment for share;
 select * into s from assess.sessions where id=p_session for update;
 if not public.is_owner() or s.id is null or s.lifecycle_version<>2 or not exists(
  select 1 from assess.assignments a where a.id=s.assignment_id and
   (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())))
 or (s.expires_at is not null and s.expires_at<=clock_timestamp())
 then raise exception 'grading denied' using errcode='42501'; end if;
 if s.emergency_held_at is not null then raise exception 'attempt emergency held' using errcode='55000'; end if;
 return s;
end $anchor$,$replacement$
declare s assess.sessions; assignment uuid; lock_stage integer; begin
 select assignment_id into assignment from assess.sessions where id=p_session;
 for lock_stage in 0..7 loop
  case lock_stage
   when 0 then perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
   when 1 then perform assess.scope_enter_v1(false);
   when 2 then
    perform 1 from public.profiles p where p.user_id in (
     select user_id from assess.sessions where id=p_session
     union select sc.supervisor_id from assess.assignment_scopes sc where sc.assignment_id=assignment)
    order by p.user_id for share;
   when 3 then perform 1 from assess.supervisor_appointments ap where ap.user_id in
    (select supervisor_id from assess.assignment_scopes where assignment_id=assignment) for share;
   when 4 then perform 1 from assess.groups g where g.id in
    (select group_id from assess.assignment_scopes where assignment_id=assignment) for share;
   when 5 then perform 1 from assess.assignment_scopes where assignment_id=assignment for share;
   when 6 then perform 1 from assess.assignments where id=assignment for share;
   when 7 then perform 1 from assess.sessions where id=p_session for update;
  end case;
  -- Fresh READ COMMITTED snapshot after every wait; clocks never use now().
  select * into s from assess.sessions where id=p_session;
 if not public.is_approved() or exists(select 1 from assess.account_stops where user_id=auth.uid())
 or s.id is null or s.lifecycle_version<>2 or not ((public.is_owner() and (exists(select 1 from assess.assignments a where a.id=s.assignment_id and
   (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())))
 or (exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]) and not exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]
 and exists(select 1 from public.profiles p join assess.supervisor_appointments ap on ap.user_id=p.user_id
  where p.user_id=sc.supervisor_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=p.user_id)
  and ap.revoked_at is null and ap.revision=r.appointment_revision)
 and g.ended_at is null and g.starts_at<=clock_timestamp() and clock_timestamp()<g.ends_at
 and exists(select 1 from assess.targets t join assess.assignment_review_targets rt on rt.user_id=t.user_id and rt.review_id=r.id
  join assess.memberships m on m.user_id=t.user_id and m.group_id=g.id and m.period_id=rt.period_id
  join assess.membership_periods mp on mp.id=m.period_id and mp.group_id=g.id and mp.user_id=t.user_id and mp.left_at is null
  join public.profiles p on p.user_id=t.user_id
  join assess.sharing_consents c on c.user_id=t.user_id
  join assess.sharing_policy sp on sp.required_version=c.version and sp.text_digest=c.text_digest
  join assess.supervisor_appointments ap on ap.user_id=sc.supervisor_id
  where t.assignment_id=s.assignment_id and t.user_id=s.user_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=t.user_id)
  and s.started_at>=greatest(rt.visible_from,mp.joined_at,g.starts_at,ap.appointed_at,c.accepted_at))))))
 or (not public.is_owner() and exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]
 and exists(select 1 from public.profiles p join assess.supervisor_appointments ap on ap.user_id=p.user_id
  where p.user_id=sc.supervisor_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=p.user_id)
  and ap.revoked_at is null and ap.revision=r.appointment_revision)
 and g.ended_at is null and g.starts_at<=clock_timestamp() and clock_timestamp()<g.ends_at
 and exists(select 1 from assess.targets t join assess.assignment_review_targets rt on rt.user_id=t.user_id and rt.review_id=r.id
  join assess.memberships m on m.user_id=t.user_id and m.group_id=g.id and m.period_id=rt.period_id
  join assess.membership_periods mp on mp.id=m.period_id and mp.group_id=g.id and mp.user_id=t.user_id and mp.left_at is null
  join public.profiles p on p.user_id=t.user_id
  join assess.sharing_consents c on c.user_id=t.user_id
  join assess.sharing_policy sp on sp.required_version=c.version and sp.text_digest=c.text_digest
  join assess.supervisor_appointments ap on ap.user_id=sc.supervisor_id
  where t.assignment_id=s.assignment_id and t.user_id=s.user_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=t.user_id)
  and s.started_at>=greatest(rt.visible_from,mp.joined_at,g.starts_at,ap.appointed_at,c.accepted_at)) and sc.supervisor_id=auth.uid())))
 or (s.expires_at is not null and s.expires_at<=clock_timestamp())
 then raise exception 'grading denied' using errcode='42501'; end if;
 if s.emergency_held_at is not null then raise exception 'attempt emergency held' using errcode='55000'; end if;
 if s.state='awaiting-manual' and s.submitted_at<=clock_timestamp()-interval '7 days'
 then raise exception 'grading unavailable' using errcode='55000'; end if;
 if not public.is_owner() and exists(select 1 from assess.manual_final_receipts_v1 r
  where r.session_id=s.id and r.final_grader_id is distinct from auth.uid())
 then raise exception 'grading denied' using errcode='42501'; end if;
 end loop;
 return s;
end $replacement$);
 execute patched;
 original:=pg_get_functiondef('assess.manual_queue_v1(uuid,integer)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
declare rows jsonb; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.owner_scope_enter_v1(false);
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select s.id,s.assignment_id,s.submitted_at,s.submitted_at+interval '7 days' finalize_before,w.grading_revision
  from assess.sessions s join assess.assignments a on a.id=s.assignment_id join assess.manual_work_v1 w on w.session_id=s.id
  where s.lifecycle_version=2 and s.state='awaiting-manual' and w.automatic_complete and s.emergency_held_at is null
   and s.submitted_at>clock_timestamp()-interval '7 days' and (p_after is null or s.id>p_after)
   and (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid()))
  order by s.id limit p_limit
 ) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $anchor$,$replacement$
declare rows jsonb; candidate record; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.scope_enter_v1(false);
 if not public.is_owner() and not exists(select 1 from assess.supervisor_appointments ap
  join public.profiles p on p.user_id=ap.user_id where ap.user_id=auth.uid() and ap.revoked_at is null and p.role='participant')
 then raise exception 'grading denied' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 -- Protect eligibility before computing the page. No rejected count/projection.
 perform 1 from public.profiles p where p.user_id in (
  select user_id from assess.sessions where lifecycle_version=2 and state='awaiting-manual'
  union select supervisor_id from assess.assignment_scopes) order by p.user_id for share;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select s.id,s.assignment_id,s.submitted_at,s.submitted_at+interval '7 days' finalize_before,w.grading_revision
  from assess.sessions s join assess.assignments a on a.id=s.assignment_id join assess.manual_work_v1 w on w.session_id=s.id
  where s.lifecycle_version=2 and s.state='awaiting-manual' and w.automatic_complete and s.emergency_held_at is null
   and (s.expires_at is null or s.expires_at>clock_timestamp())
   and s.submitted_at>clock_timestamp()-interval '7 days'
   and ((public.is_owner() and (exists(select 1 from assess.assignments a where a.id=s.assignment_id and
   (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())))
 or (exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]) and not exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]
 and exists(select 1 from public.profiles p join assess.supervisor_appointments ap on ap.user_id=p.user_id
  where p.user_id=sc.supervisor_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=p.user_id)
  and ap.revoked_at is null and ap.revision=r.appointment_revision)
 and g.ended_at is null and g.starts_at<=clock_timestamp() and clock_timestamp()<g.ends_at
 and exists(select 1 from assess.targets t join assess.assignment_review_targets rt on rt.user_id=t.user_id and rt.review_id=r.id
  join assess.memberships m on m.user_id=t.user_id and m.group_id=g.id and m.period_id=rt.period_id
  join assess.membership_periods mp on mp.id=m.period_id and mp.group_id=g.id and mp.user_id=t.user_id and mp.left_at is null
  join public.profiles p on p.user_id=t.user_id
  join assess.sharing_consents c on c.user_id=t.user_id
  join assess.sharing_policy sp on sp.required_version=c.version and sp.text_digest=c.text_digest
  join assess.supervisor_appointments ap on ap.user_id=sc.supervisor_id
  where t.assignment_id=s.assignment_id and t.user_id=s.user_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=t.user_id)
  and s.started_at>=greatest(rt.visible_from,mp.joined_at,g.starts_at,ap.appointed_at,c.accepted_at))))))
 or (not public.is_owner() and exists(select 1 from assess.assignment_scopes sc
 join assess.groups g on g.id=sc.group_id
 join assess.assignment_reviews r on r.id=sc.review_id and r.assignment_id=sc.assignment_id
 join assess.assignments a on a.id=sc.assignment_id
 where sc.assignment_id=s.assignment_id and r.group_id=g.id and r.writer_id=sc.supervisor_id
 and g.supervisor_id=sc.supervisor_id and r.version_id=a.version_id
 and a.source_group_ids=array[g.id]
 and exists(select 1 from public.profiles p join assess.supervisor_appointments ap on ap.user_id=p.user_id
  where p.user_id=sc.supervisor_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=p.user_id)
  and ap.revoked_at is null and ap.revision=r.appointment_revision)
 and g.ended_at is null and g.starts_at<=clock_timestamp() and clock_timestamp()<g.ends_at
 and exists(select 1 from assess.targets t join assess.assignment_review_targets rt on rt.user_id=t.user_id and rt.review_id=r.id
  join assess.memberships m on m.user_id=t.user_id and m.group_id=g.id and m.period_id=rt.period_id
  join assess.membership_periods mp on mp.id=m.period_id and mp.group_id=g.id and mp.user_id=t.user_id and mp.left_at is null
  join public.profiles p on p.user_id=t.user_id
  join assess.sharing_consents c on c.user_id=t.user_id
  join assess.sharing_policy sp on sp.required_version=c.version and sp.text_digest=c.text_digest
  join assess.supervisor_appointments ap on ap.user_id=sc.supervisor_id
  where t.assignment_id=s.assignment_id and t.user_id=s.user_id and p.status='approved' and p.role='participant'
  and not exists(select 1 from assess.account_stops z where z.user_id=t.user_id)
  and s.started_at>=greatest(rt.visible_from,mp.joined_at,g.starts_at,ap.appointed_at,c.accepted_at)) and sc.supervisor_id=auth.uid())))
   and (p_after is null or s.id>p_after) order by s.id limit p_limit
 ) q;
 for candidate in select value from jsonb_array_elements(rows) loop
  perform assess.manual_authorize_v1((candidate.value->>'id')::uuid);
 end loop;
 -- Time may have crossed while locking later page rows: validate every row again.
 for candidate in select value from jsonb_array_elements(rows) loop
  perform assess.manual_authorize_v1((candidate.value->>'id')::uuid);
 end loop;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $replacement$);
 execute patched;
 original:=pg_get_functiondef('assess.manual_read_v1(uuid)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
 return jsonb_build_object('attemptId'$anchor$,$replacement$
 perform assess.manual_authorize_v1(p_session);
 return jsonb_build_object('attemptId'$replacement$);
 execute patched;
 original:=pg_get_functiondef('assess.manual_score_v1(uuid,uuid,integer,jsonb,text)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
 if p_operation is null or p_revision is null$anchor$,$replacement$
 -- Supervisors cannot request takeover; rescue scores require explicit reason.
 if (p_reason='owner-takeover' and not public.is_owner()) or
  (public.is_owner() and not exists(select 1 from assess.assignments a where a.id=s.assignment_id and
   (a.owner_id=auth.uid() or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid()))) and p_reason is distinct from 'owner-takeover')
 then raise exception 'grading denied' using errcode='42501'; end if;
 if p_operation is null or p_revision is null$replacement$);
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
  return jsonb_build_object('operationId'$anchor$,$replacement$
  perform assess.manual_authorize_v1(p_session);
  return jsonb_build_object('operationId'$replacement$);
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
 return jsonb_build_object('operationId',p_operation,'gradingRevision',p_revision+1);$anchor$,$replacement$
 perform assess.manual_authorize_v1(p_session);
 return jsonb_build_object('operationId',p_operation,'gradingRevision',p_revision+1);$replacement$);
 execute patched;
 original:=pg_get_functiondef('assess.manual_finalize_v1(uuid,uuid,integer)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
  return to_jsonb(r);$anchor$,$replacement$
  perform assess.manual_authorize_v1(p_session);
  return to_jsonb(r);$replacement$);
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
 return to_jsonb(r);$anchor$,$replacement$
 perform assess.manual_authorize_v1(p_session);
 if s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'grading unavailable' using errcode='55000'; end if;
 return to_jsonb(r);$replacement$);
 execute patched;
 original:=pg_get_functiondef('assess.manual_receipt_v1(uuid)'::regprocedure);
 if position(E'\r' in replace(original,E'\r\n',''))>0 then raise exception 'M09 newline representation drift' using errcode='55000'; end if;
 patched:=original;
 patched:=pg_temp.rad062_m09_patch(patched,$anchor$
 return receipt;$anchor$,$replacement$
 perform assess.manual_authorize_v1(p_session);
 return receipt;$replacement$);
 execute patched;
end $patch$;
do $proof$ begin
 if exists(select 1 from rad062_m09_before b full join pg_proc p on p.oid=b.oid
  and p.pronamespace='assess'::regnamespace
  where (b.oid is not null or p.pronamespace='assess'::regnamespace) and
   (b.properties is distinct from to_jsonb(p)-'prosrc' or
    (p.proname<>all(array['manual_authorize_v1','manual_queue_v1','manual_read_v1','manual_score_v1','manual_finalize_v1','manual_receipt_v1'])
     and b.prosrc is distinct from p.prosrc)))
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
 then raise exception 'M09 catalogue property/OID/ACL/config/FK drift' using errcode='55000'; end if;
end $proof$;
drop function pg_temp.rad062_m09_patch(text,text,text);
commit;
