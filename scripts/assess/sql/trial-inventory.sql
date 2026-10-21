-- Preparatory inventory only. Run the WHOLE file in Supabase SQL Editor as its
-- existing administrative reader (postgres); never grant tables to the worker.
-- No RPCs, auth impersonation, LOGIN/gate changes or persisted objects.
begin isolation level repeatable read read only;
set local search_path = '';
set local row_security = off;
set local statement_timeout = '5s';
set local lock_timeout = '2s';
set local timezone = 'UTC';

do $$
declare t text; n integer;
begin
  -- RLS must not turn the global inventory into a misleading empty user view.
  if current_user <> 'postgres' or not current_setting('transaction_read_only')::boolean then
    raise exception 'inventory_reader_required' using errcode='42501';
  end if;
  foreach t in array array['sessions','assignments','targets','versions','content_submissions',
    'publications','reservations','consents','account_stops','session_details','receipts','results',
    'groups','memberships','launch_gate'] loop
    execute format('select count(*) from (select 1 from assess.%I limit 101) bounded',t) into n;
    if n>100 then
      raise exception 'inventory_ceiling_exceeded: % (maximum 100)',t using errcode='54000';
    end if;
  end loop;
  if (select count(*) from assess.launch_gate)<>1 then
    raise exception 'inventory_gate_shape_invalid' using errcode='55000';
  end if;
end $$;

-- Explicit scalar columns only: never load JSON documents, answers or grades.
-- Same snapshot as the ceiling checks. One timestamp for every due predicate.
with ts as materialized (select transaction_timestamp() as now),
s as materialized (select id,assignment_id,user_id,state,deadline,submitted_at,lease_until,retry_at,expires_at from assess.sessions limit 101),
a as materialized (select id,closed_at from assess.assignments limit 101),
t as materialized (select assignment_id,user_id from assess.targets limit 101),
v as materialized (select available,track from assess.versions limit 101),
c as materialized (select state from assess.content_submissions limit 101),
r as materialized (select assignment_id from assess.reservations limit 101),
co as materialized (select user_id from assess.consents limit 101),
st as materialized (select user_id from assess.account_stops limit 101)
select jsonb_build_object(
 'attempts',jsonb_build_object(
   'total',(select count(*) from s),
   'active',(select count(*) from s where state='active'),
   'grading',(select count(*) from s where state='grading'),
   'grading_failed',(select count(*) from s where state='grading-failed'),
   'graded',(select count(*) from s where state='graded'),
   'void',(select count(*) from s where state='void')),
 'queue',jsonb_build_object(
   'claimable_now',(select count(*) from s,ts where state in ('grading','grading-failed') and submitted_at>ts.now-interval '7 days' and (retry_at is null or retry_at<=ts.now) and (lease_until is null or lease_until<=ts.now)),
   'live_leases',(select count(*) from s,ts where state in ('grading','grading-failed') and lease_until>ts.now),
   'retry_waiting',(select count(*) from s,ts where state in ('grading','grading-failed') and retry_at>ts.now),
   'recoverable_failed',(select count(*) from s,ts where state='grading-failed' and submitted_at>ts.now-interval '7 days')),
 'maintenance',jsonb_build_object(
   'active_due',(select count(*) from s,ts where state='active' and deadline<=ts.now),
   'void_due',(select count(*) from s,ts where state in ('grading','grading-failed') and submitted_at<=ts.now-interval '7 days'),
   'fail_due',(select count(*) from s,ts where state='grading' and submitted_at<=ts.now-interval '24 hours' and (lease_until is null or lease_until<=ts.now)),
   'session_purge_due',(select count(*) from s,ts where expires_at<=ts.now),
   'reservations_due_now',(select count(*) from r join a on a.id=r.assignment_id where a.closed_at is not null and not exists(select 1 from s where s.assignment_id=a.id)),
   'consents_due_now',(select count(*) from co join st using(user_id) where not exists(select 1 from s where s.user_id=co.user_id))),
 'assignments',jsonb_build_object(
   'total',(select count(*) from a),'open',(select count(*) from a where closed_at is null),
   'open_target_rows',(select count(*) from t join a on a.id=t.assignment_id where a.closed_at is null),
   'open_distinct_targets',(select count(distinct user_id) from t join a on a.id=t.assignment_id where a.closed_at is null)),
 'content',jsonb_build_object(
   'versions',(select count(*) from v),'available',(select count(*) from v where available),
   'mixed',(select count(*) from v where track='mixed'),
   'pending',(select count(*) from c where state='pending'),'installed',(select count(*) from c where state='installed'),
   'publications',(select count(*) from (select 1 from assess.publications limit 101) b)),
 'metadata',jsonb_build_object(
   'reservations',(select count(*) from r),'consents',(select count(*) from co),'account_stops',(select count(*) from st),
   'details',(select count(*) from (select 1 from assess.session_details limit 101) b),
   'receipts',(select count(*) from (select 1 from assess.receipts limit 101) b),
   'results',(select count(*) from (select 1 from assess.results limit 101) b),
   'groups',(select count(*) from (select 1 from assess.groups limit 101) b),
   'memberships',(select count(*) from (select 1 from assess.memberships limit 101) b)),
 'controls',jsonb_build_object('gate_open_rows',(select count(*) from assess.launch_gate where enabled))
) as counts;
rollback;
