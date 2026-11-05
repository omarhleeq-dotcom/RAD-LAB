-- STAGED (RAD-105 P1). NOT in the applied manifest and NOT in supabase/migrations: nothing here runs until the
-- P7 promotion moves it (see MANIFEST.json and docs/ASSESS_P7_LAPTOP_RUNBOOK.md). Reviewed, digest-pinned.
-- Per-assignment exam windows: supervisor-scheduled opens_at/closes_at (UTC), enforced by the server clock in
-- start_v2; the deadline is truncated at closes_at. Gate semantics are unchanged (still a start-time kill switch).
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $pre$ begin
 if to_regprocedure('assess.start_v2(uuid,uuid)') is null or to_regprocedure('assess.scope_enter_v1(boolean)') is null
  or to_regprocedure('assess.supervised_group_v1(uuid)') is null or to_regclass('assess.assignment_managers') is null
  or to_regclass('assess.assignment_scopes') is null or to_regclass('assess.assignment_windows') is not null
 then raise exception 'RAD105 P1 preconditions not met' using errcode='55000'; end if;
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 then raise exception 'RAD105 P1 requires the closed gate' using errcode='55000'; end if;
end $pre$;

create table assess.assignment_windows (
 assignment_id uuid primary key references assess.assignments(id) on delete cascade,
 opens_at timestamptz not null,
 closes_at timestamptz not null,
 changes smallint not null default 0 check(changes between 0 and 10),
 updated_at timestamptz not null default clock_timestamp(),
 check(closes_at>opens_at and closes_at-opens_at<=interval '7 days')
);
alter table assess.assignment_windows enable row level security;
revoke all on assess.assignment_windows from public,anon,authenticated,assess_worker;

create function assess.window_guard_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from assess.assignment_windows w where w.assignment_id=p_assignment
  and w.opens_at<=clock_timestamp() and clock_timestamp()<w.closes_at)
 then raise exception 'exam window closed' using errcode='55000'; end if;
end $$;

create function assess.window_deadline_v1(p_assignment uuid,p_start timestamptz,p_duration integer) returns timestamptz
language sql stable security definer set search_path='' as $$
 select least(p_start+make_interval(secs=>p_duration),(select w.closes_at from assess.assignment_windows w where w.assignment_id=p_assignment))
$$;

-- Minimal, counted textual patch of the live start_v2 body; every anchor must match exactly once.
do $patch$ declare def text; patched text; begin
 def:=pg_get_functiondef('assess.start_v2(uuid,uuid)'::regprocedure);
 patched:=def;
 if (length(patched)-length(replace(patched,'insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;','')))
    <>length('insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;') then raise exception 'start_v2 anchor 1 not unique'; end if;
 patched:=replace(patched,'insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;',
  'perform assess.window_guard_v1(p_assignment); insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;');
 if (length(patched)-length(replace(patched,'values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;','')))
    <>length('values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;') then raise exception 'start_v2 anchor 2 not unique'; end if;
 patched:=replace(patched,'values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;',
  'values(p_assignment,auth.uid(),n+1,ts,assess.window_deadline_v1(p_assignment,ts,duration)) returning * into s;');
 if patched=def or position('window_guard_v1' in patched)=0 or position('window_deadline_v1' in patched)=0 then raise exception 'start_v2 patch failed'; end if;
 execute patched;
end $patch$;

create function assess.assignment_window_set_v1(p_assignment uuid,p_revision integer,p_opens timestamptz,p_closes timestamptz) returns integer
language plpgsql security definer set search_path='' as $$
declare a assess.assignments; gid uuid; w assess.assignment_windows; ts timestamptz:=clock_timestamp();
begin
 perform assess.scope_enter_v1(true);
 select * into a from assess.assignments where id=p_assignment
  and (owner_id=auth.uid() or (public.is_owner() and exists(select 1 from assess.assignment_managers m where m.assignment_id=p_assignment and m.manager_id=auth.uid()))) for update;
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 if not public.is_owner() then
  select s.group_id into gid from assess.assignment_scopes s where s.assignment_id=a.id and s.supervisor_id=auth.uid();
  if gid is null then raise exception 'assignment denied' using errcode='42501'; end if;
  perform assess.supervised_group_v1(gid);
 end if;
 if a.closed_at is not null then raise exception 'assignment closed' using errcode='55000'; end if;
 if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
 if p_opens is null or p_closes is null or p_closes<=p_opens or p_closes-p_opens>interval '7 days' then
  raise exception 'invalid window' using errcode='22023'; end if;
 select * into w from assess.assignment_windows where assignment_id=a.id for update;
 if w.assignment_id is null then
  if p_opens<ts-interval '1 minute' or p_closes<=ts then raise exception 'window in the past' using errcode='22023'; end if;
  insert into assess.assignment_windows(assignment_id,opens_at,closes_at,updated_at) values(a.id,p_opens,p_closes,ts);
 else
  if w.changes>=10 then raise exception 'window change limit' using errcode='54000'; end if;
  if ts>=w.closes_at then raise exception 'window ended' using errcode='55000'; end if;
  if ts>=w.opens_at then
   if p_opens is distinct from w.opens_at then raise exception 'opened window start is fixed' using errcode='55000'; end if;
   if p_closes<ts+interval '1 minute' then raise exception 'invalid window' using errcode='22023'; end if;
   if p_closes<w.closes_at and exists(select 1 from assess.sessions s where s.assignment_id=a.id)
   then raise exception 'attempts exist: extend or close only' using errcode='55000'; end if;
  elsif p_opens<ts-interval '1 minute' or p_closes<=ts then raise exception 'window in the past' using errcode='22023'; end if;
  update assess.assignment_windows set opens_at=p_opens,closes_at=p_closes,changes=changes+1,updated_at=ts where assignment_id=a.id;
 end if;
 update assess.assignments set revision=revision+1 where id=a.id;
 return a.revision+1;
end $$;

create function assess.my_windows_v1(p_assignments uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform assess.scope_enter_v1(false);
 if p_assignments is null or cardinality(p_assignments)>100 then raise exception 'invalid request' using errcode='22023'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('assignmentId',w.assignment_id,'opensAt',w.opens_at,'closesAt',w.closes_at,
   'closed',a.closed_at is not null,'now',clock_timestamp()) order by w.opens_at,w.assignment_id)
  from assess.assignment_windows w join assess.assignments a on a.id=w.assignment_id
  join assess.targets t on t.assignment_id=w.assignment_id and t.user_id=auth.uid()
  where w.assignment_id=any(p_assignments)),'[]'::jsonb);
end $$;

create function assess.assignment_status_v1(p_assignment uuid,p_after uuid default null,p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a assess.assignments; w assess.assignment_windows; over boolean;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 200 then raise exception 'invalid request' using errcode='22023'; end if;
 select * into a from assess.assignments x where x.id=p_assignment and (x.owner_id=auth.uid()
  or exists(select 1 from assess.assignment_scopes s where s.assignment_id=x.id and s.supervisor_id=auth.uid()));
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 select * into w from assess.assignment_windows where assignment_id=a.id;
 over:=a.closed_at is not null or (w.assignment_id is not null and clock_timestamp()>=w.closes_at);
 return (with st as (
   select t.user_id,case
     when l.id is null then case when over then 'missed' else 'not-started' end
     when r.session_id is not null then 'graded'
     when l.state='active' then 'in-progress'
     else 'submitted' end state
   from assess.targets t
   left join lateral (select s.id,s.state from assess.sessions s where s.assignment_id=t.assignment_id and s.user_id=t.user_id order by s.ordinal desc limit 1) l on true
   left join assess.results r on r.session_id=l.id
   where t.assignment_id=a.id)
  select jsonb_build_object(
   'counts',(select jsonb_build_object('notStarted',count(*) filter(where state='not-started'),'inProgress',count(*) filter(where state='in-progress'),
     'submitted',count(*) filter(where state='submitted'),'graded',count(*) filter(where state='graded'),'missed',count(*) filter(where state='missed')) from st),
   'rows',coalesce((select jsonb_agg(jsonb_build_object('userId',q.user_id,'state',q.state) order by q.user_id)
     from (select * from st where p_after is null or user_id>p_after order by user_id limit p_limit) q),'[]'::jsonb),
   'now',clock_timestamp(),'opensAt',w.opens_at,'closesAt',w.closes_at,'closed',a.closed_at is not null));
end $$;

revoke all on function assess.window_guard_v1(uuid),assess.window_deadline_v1(uuid,timestamptz,integer),
 assess.assignment_window_set_v1(uuid,integer,timestamptz,timestamptz),assess.my_windows_v1(uuid[]),
 assess.assignment_status_v1(uuid,uuid,integer) from public,anon,authenticated,assess_worker;
grant execute on function assess.assignment_window_set_v1(uuid,integer,timestamptz,timestamptz),assess.my_windows_v1(uuid[]),
 assess.assignment_status_v1(uuid,uuid,integer) to authenticated;
commit;
