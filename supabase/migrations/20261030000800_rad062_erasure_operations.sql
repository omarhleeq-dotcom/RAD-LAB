-- RAD-062 M08. DEFERRED: install only after M01-M07 on the reviewed DB day.
-- Readiness: supabase/checks/rad062-ready.sql (not a frontend requirement until P10).
-- Before use: restore the saved patched function definitions/ACLs and remove only
-- M08 objects in one reviewed transaction. Never drop v1. After use: forward-fix
-- only; preserve answers, final results and receipts until their decided expiry.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
do $$ begin
 if to_regprocedure('assess.manual_finalize_v1(uuid,uuid,integer)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
 then raise exception 'M01-M07, exact identity inventory and closed gate required' using errcode='55000'; end if;
end $$;

-- D3 uses the same capacity -> scope -> profile -> assignment -> session order
-- as v2 writers. Patch attributes in place, retaining OID, owner, ACL and config.
-- Each reviewed anchor is mandatory: any mismatch aborts the ENTIRE transaction.
do $patch$ declare signature text; original text; patched text; anchor text; replacement text; begin
 foreach signature in array array['public.owner_account_deletion_v1(text,uuid,uuid,integer)',
  'assess.account_management_v1(text,uuid,text,uuid,integer)',
  'assess.transfer_management_d3_v1(uuid,text,timestamp with time zone)',
  'assess.erase_account_d3_v1(uuid)'] loop
  original:=pg_get_functiondef(signature::regprocedure);
  anchor:=E'begin\n';
  if position(anchor in original)=0 then raise exception 'missing M08 entry anchor: %',signature; end if;
  patched:=replace(original,anchor,E'begin\n perform pg_advisory_xact_lock(hashtextextended(''rad062-capacity'',0));\n');
  if signature='assess.erase_account_d3_v1(uuid)' then
   anchor:='or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null));';
   if position(anchor in patched)=0 then raise exception 'missing M08 protected draft anchor'; end if;
   patched:=replace(patched,anchor,'or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null)
    or exists(select 1 from assess.authoring_holds_v1 h where h.draft_id=d.id));');
   anchor:=' delete from auth.users where id=p_user;';
   replacement:=$body$
 -- Account deletion cascades profiles -> sessions -> details -> pool selections,
 -- capacity reservations, manual work/scores/events, command/final receipts and
 -- results. Shared draft/revision/candidate bytes remain ONLY under the existing
 -- digest-bound rights clearance/management transfer; no identity is reassigned.
 -- Remove author attribution even when a protected shared draft survives with
 -- writer_id NULL. Reviewer SET NULL also clears its erasable display/time.
 delete from assess.authoring_provenance_v2 where author_id=p_user;
 update assess.authoring_provenance_v2 set reviewer_id=null where reviewer_id=p_user;
 update assess.manual_item_scores_v1 set grader_id=null where grader_id=p_user;
 update assess.manual_events_v1 set grader_id=null where grader_id=p_user;
 update assess.manual_final_receipts_v1 set final_grader_id=null where final_grader_id=p_user;
 delete from auth.users where id=p_user;$body$;
   if position(anchor in patched)=0 then raise exception 'missing M08 erase anchor'; end if;
   patched:=replace(patched,anchor,replacement);
  end if;
  execute patched;
 end loop;
 original:=pg_get_functiondef('assess.d3_needs_transfer_v1(uuid)'::regprocedure);
 anchor:='select exists(select 1 from assess.groups g';
 if position(anchor in original)=0 then raise exception 'missing M08 transfer anchor'; end if;
 patched:=replace(original,anchor,'select exists(select 1 from assess.authoring_drafts d join assess.authoring_holds_v1 h on h.draft_id=d.id where d.writer_id=p_user)
  or exists(select 1 from assess.groups g');
 execute patched;
 -- A held private draft also protects its containing group from profile CASCADE.
 -- Transfer the group before nulling provenance; never strand its rights evidence.
 original:=pg_get_functiondef('assess.d3_shared_group_v1(uuid,uuid)'::regprocedure);
 anchor:='or exists(select 1 from assess.authoring_drafts d where d.group_id=g.id and d.writer_id is distinct from p_user)';
 if position(anchor in original)=0 then raise exception 'missing M08 held group anchor'; end if;
 patched:=replace(original,anchor,anchor||'
   or exists(select 1 from assess.authoring_drafts d join assess.authoring_holds_v1 h on h.draft_id=d.id where d.group_id=g.id)');
 execute patched;
 -- Rights clearance covers every v2 retained revision/package, including private
 -- drafts protected by an explicit rights/retention hold. Bounded, never truncate.
 original:=pg_get_functiondef('assess.d3_inventory_v1(uuid)'::regprocedure);
 anchor:=$a$  union all select 'group',g.id::text,to_jsonb(g.name)$a$;
 if position(anchor in original)=0 then raise exception 'missing M08 content inventory anchor'; end if;
 patched:=replace(original,anchor,$a$  union all select 'v2-revision',r.draft_id::text||':'||r.revision,to_jsonb(r)
   from assess.authoring_revisions r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_user and d.document->>'schemaVersion'='2'
  union all select 'v2-package',r.draft_id::text||':'||r.draft_revision,to_jsonb(r)
   from assess.authoring_reviewed_packages r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_user and d.document->>'schemaVersion'='2'
  union all select 'v2-hold',h.draft_id::text||':'||h.revision,to_jsonb(h)
   from assess.authoring_holds_v1 h join assess.authoring_drafts d on d.id=h.draft_id where d.writer_id=p_user
  union all select 'group',g.id::text,to_jsonb(g.name)$a$);
 execute patched;
 -- M03's writer guard must admit ONLY the existing private D3 capability's
 -- minimal writer-null update on a transferred/rights-cleared protected draft.
 -- All document bytes, revision metadata and ordinary writer checks stay exact.
 original:=pg_get_functiondef('assess.authoring_write_guard_v1()'::regprocedure);
 anchor:=$a$ if tg_table_name='authoring_drafts' then did:=new.id; else did:=new.draft_id; end if;$a$;
 if position(anchor in original)=0 then raise exception 'missing M08 authoring erasure anchor'; end if;
 patched:=replace(original,anchor,$a$ if tg_table_name='authoring_drafts' and tg_op='UPDATE' then
  if new.writer_id is null and assess.d3_erasing_v1(old.writer_id)
   and to_jsonb(new)-'writer_id'=to_jsonb(old)-'writer_id' then return new; end if;
 end if;
 if tg_table_name='authoring_drafts' then did:=new.id; else did:=new.draft_id; end if;$a$);
 execute patched;
 -- No new FK: independently recheck the M01-M07 contract in this transaction.
 if (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1()
 then raise exception 'M08 identity inventory drift' using errcode='55000'; end if;
end $patch$;

create function assess.maintain_v2(p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; expired integer:=0; voided integer:=0; failed integer:=0; purged integer:=0; metadata_gone integer:=0; ts timestamptz;
begin
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid batch' using errcode='22023'; end if;
 -- Each phase is bounded and skips busy rows. Recheck clock AFTER each row lock.
 for s in select * from assess.sessions where lifecycle_version=2 and state='active' and deadline<=clock_timestamp()
  and emergency_held_at is null order by deadline,id limit p_limit for update skip locked loop
  update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
  expired:=expired+1;
 end loop;
 for s in select * from assess.sessions where lifecycle_version=2 and state in ('grading','grading-failed','awaiting-manual')
  and submitted_at<=clock_timestamp()-interval '7 days' order by submitted_at,id limit p_limit for update skip locked loop
  ts:=clock_timestamp();
  if s.submitted_at<=ts-interval '7 days' then
   update assess.sessions set state='void',revision=revision+1,lease=null,lease_until=null,retry_at=null,expires_at=ts where id=s.id;
   delete from assess.receipts where session_id=s.id;
   delete from assess.session_details where session_id=s.id;
   voided:=voided+1;
  end if;
 end loop;
 for s in select * from assess.sessions where lifecycle_version=2 and state='grading' and emergency_held_at is null
  and submitted_at<=clock_timestamp()-interval '24 hours' and (lease_until is null or lease_until<=clock_timestamp())
  order by submitted_at,id limit p_limit for update skip locked loop
  ts:=clock_timestamp();
  update assess.sessions set state='grading-failed',failed_at=coalesce(failed_at,ts),retry_at=submitted_at+interval '7 days',lease=null,lease_until=null where id=s.id;
  failed:=failed+1;
 end loop;
 with due as (select id from assess.sessions where lifecycle_version=2 and expires_at<=clock_timestamp()
  order by expires_at,id limit p_limit for update skip locked)
 delete from assess.sessions target using due where target.id=due.id;
 get diagnostics purged=row_count;
 -- M06 scoped the legacy closed-assignment cleanup to v1. Complete its v2
 -- counterpart without deleting the permanent assignment closure tombstone.
 with closed as materialized (
  select a.id from assess.assignments a join assess.versions v on v.id=a.version_id
  where v.schema_version=2 and a.closed_at is not null
   and not exists(select 1 from assess.sessions existing where existing.assignment_id=a.id)
   and exists(select 1 from assess.reservations r where r.assignment_id=a.id)
  order by a.id limit p_limit for update of a skip locked
 ), due as (
  select r.assignment_id,r.user_id from assess.reservations r join closed a on a.id=r.assignment_id
  order by r.assignment_id,r.user_id limit p_limit for update of r skip locked
 ) delete from assess.reservations r using due where r.assignment_id=due.assignment_id and r.user_id=due.user_id;
 get diagnostics metadata_gone=row_count;
 return jsonb_build_object('expired',expired,'voided',voided,'failed',failed,'purged',purged,'reservationsPurged',metadata_gone);
end $$;

-- Selective owner recovery, including explicitly transferred management. Worker
-- cannot release holds. No gate, spending, deadline or submitted_at changes.
create function assess.recover_v2(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; assignment uuid; complete boolean; begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.owner_scope_enter_v1(false);
 perform assess.scope_enter_v1(false);
 select assignment_id into assignment from assess.sessions where id=p_session;
 perform 1 from assess.assignments where id=assignment for share;
 select * into s from assess.sessions where id=p_session for update;
 if not public.is_owner() or s.id is null or s.lifecycle_version<>2 or not exists(
  select 1 from assess.assignments a where a.id=s.assignment_id and (a.owner_id=auth.uid()
   or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())))
 then raise exception 'recovery denied' using errcode='42501'; end if;
 if s.state<>'grading-failed' or s.submitted_at is null or s.submitted_at<=clock_timestamp()-interval '7 days'
 or not exists(select 1 from assess.session_details where session_id=s.id)
 then raise exception 'recovery unavailable' using errcode='55000'; end if;
 select automatic_complete into complete from assess.manual_work_v1 where session_id=s.id;
 update assess.sessions set emergency_held_at=null,state=case when coalesce(complete,false) then 'awaiting-manual' else 'grading' end,
  revision=revision+1,lease=null,lease_until=null,retry_at=null,failed_at=null where id=s.id;
end $$;

-- Delivery adapter contract only: caller ACKs after the approved channel accepts
-- delivery. No channel, job or email is installed here. Failure leaves it due.
create function assess.day5_warnings_v2(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$ declare rows jsonb; begin
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select s.id,s.submitted_at+interval '7 days' finalize_before,
   (select count(*) from assess.session_details d,jsonb_array_elements(d.publication->'assessment'->'items') i
    where d.session_id=s.id and i->>'type'='written-answer') written_count
  from assess.sessions s join assess.manual_work_v1 w on w.session_id=s.id
  where s.lifecycle_version=2 and s.state in ('grading','grading-failed','awaiting-manual') and w.warning_sent_at is null
   and s.submitted_at<=clock_timestamp()-interval '5 days' and s.submitted_at>clock_timestamp()-interval '7 days'
   and (p_after is null or s.id>p_after) order by s.id limit p_limit
 ) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
create function assess.day5_ack_v2(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$ declare s assess.sessions; begin
 select * into s from assess.sessions where id=p_session for update;
 if s.id is null or s.lifecycle_version<>2 or s.state not in ('grading','grading-failed','awaiting-manual')
 or s.submitted_at is null or s.submitted_at>clock_timestamp()-interval '5 days' or s.submitted_at<=clock_timestamp()-interval '7 days'
 then raise exception 'warning unavailable' using errcode='55000'; end if;
 update assess.manual_work_v1 set warning_sent_at=coalesce(warning_sent_at,clock_timestamp()) where session_id=s.id;
 if not found then raise exception 'written work required' using errcode='55000'; end if;
end $$;

-- Aggregate operational counts only. No identity, answer, score or attempt IDs.
create function assess.health_v2() returns jsonb
language sql volatile security definer set search_path='' as $$
 select jsonb_build_object('failed',count(*) filter(where s.state='grading-failed'),
  'alert',count(*) filter(where s.state='grading-failed' and s.submitted_at<=clock_timestamp()-interval '24 hours'),
  'held',count(*) filter(where s.emergency_held_at is not null and s.state='grading-failed'),
  'awaitingManual',count(*) filter(where s.state='awaiting-manual'),
  'warningDue',count(*) filter(where s.state in ('grading','grading-failed','awaiting-manual') and w.warning_sent_at is null and w.session_id is not null
   and s.submitted_at<=clock_timestamp()-interval '5 days' and s.submitted_at>clock_timestamp()-interval '7 days'),
  'voidDue',count(*) filter(where s.state in ('grading','grading-failed','awaiting-manual') and s.submitted_at<=clock_timestamp()-interval '7 days'),
  'overdue',count(*) filter(where s.state='active' and s.deadline<=clock_timestamp()),
  'purgeDue',count(*) filter(where s.expires_at<=clock_timestamp()))
 from assess.sessions s left join assess.manual_work_v1 w on w.session_id=s.id where s.lifecycle_version=2
$$;

revoke all on function assess.maintain_v2(integer),assess.recover_v2(uuid),assess.health_v2(),
 assess.day5_warnings_v2(uuid,integer),assess.day5_ack_v2(uuid) from public,anon,authenticated,assess_worker,assess_authoring_bridge;
-- Final package grants: no table grants, helper grants, global supervisor role,
-- worker manual-grade/recovery grant or LOGIN change. These statements are inert
-- on deployed main because M08 itself remains deferred until the reviewed DB day.
grant execute on function assess.start_v2(uuid,uuid),assess.read_session_v2(uuid),assess.read_mixed_session_v2(uuid),
 assess.read_practical_session_v2(uuid),assess.command_v2(uuid,uuid,integer,jsonb),assess.result_v2(uuid),
 assess.draft_save_v2(uuid,uuid,integer,jsonb,jsonb),assess.draft_page_v2(uuid,uuid,uuid,integer),
 assess.manual_queue_v1(uuid,integer),assess.manual_read_v1(uuid),assess.manual_score_v1(uuid,uuid,integer,jsonb,text),
 assess.manual_finalize_v1(uuid,uuid,integer),assess.manual_receipt_v1(uuid),assess.recover_v2(uuid) to authenticated;
grant execute on function assess.authoring_bridge_read_v2(uuid,uuid,integer),assess.content_submit_v2(uuid,uuid,integer,jsonb) to assess_authoring_bridge;
grant execute on function assess.claim_v2(),assess.finish_v2(uuid,uuid,text,text),assess.fail_v2(uuid,uuid),assess.maintain_v2(integer),
 assess.health_v2(),assess.day5_warnings_v2(uuid,integer),assess.day5_ack_v2(uuid) to assess_worker;
commit;
