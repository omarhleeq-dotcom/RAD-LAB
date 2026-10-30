-- RAD-062 M03. Deferred, private, M01/M02 required; no runtime grants or scheduler.
-- Forward-only after use. Before use rollback removes these new objects/triggers and
-- restores draft_save_v2 from M02; v1 functions and historical SQL are untouched.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if to_regprocedure('assess.content_submit_v2(uuid,uuid,integer,jsonb)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then
  raise exception 'M02 and closed launch gate required' using errcode='55000'; end if;
end $$;
-- Immutable policy version. Lifting any ceiling requires a reviewed migration.
create function assess.authoring_limits_v1() returns jsonb language sql immutable set search_path='' as $$
 select '{"version":1,"drafts":3,"revisions":10,"documentBytes":65536,"warnBytes":4194304,"stopBytes":8388608,"dbWarnBytes":300000000,"dbReviewBytes":350000000,"dbStopBytes":400000000,"cleanupDays":30,"cleanupBatch":100}'::jsonb
$$;
-- Separate from student saves/finalisation. Reservations are released with details.
create table assess.capacity_reservations_v1 (
 session_id uuid primary key references assess.session_details(session_id) on delete cascade,
 bytes bigint not null check(bytes between 0 and 100000000)
);
-- Conservative explicit preservation, including sole rights evidence/unknown dependencies.
create table assess.authoring_holds_v1 (
 draft_id uuid not null, revision integer not null,
 kind text not null check(kind in ('rights','retention','emergency','unknown')),
 primary key(draft_id,revision,kind),
 foreign key(draft_id,revision) references assess.authoring_revisions(draft_id,revision)
);
alter table assess.capacity_reservations_v1 enable row level security;
alter table assess.authoring_holds_v1 enable row level security;
revoke all on assess.capacity_reservations_v1,assess.authoring_holds_v1 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
-- Logical serialized bytes include refs, current draft, retained revisions, review
-- packages, per-item provenance and candidates. TOAST compression never discounts quota.
create function assess.authoring_usage_v1(p_author uuid) returns bigint
language sql volatile security definer set search_path='' as $$
 select coalesce(sum(n),0)::bigint from (
 select octet_length(to_jsonb(d)::text)::bigint n from assess.authoring_drafts d where writer_id=p_author
 union all select octet_length(to_jsonb(r)::text) from assess.authoring_revisions r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_author
 union all select octet_length(to_jsonb(r)::text) from assess.authoring_reviewed_packages r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_author
 union all select octet_length(to_jsonb(r)::text) from assess.authoring_provenance_v2 r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_author
 union all select octet_length(to_jsonb(r)::text) from assess.content_candidates_v2 r join assess.authoring_drafts d on d.id=r.draft_id where d.writer_id=p_author
 ) q
$$;
create function assess.authoring_admission_v1(p_before bigint,p_after bigint,p_db_peak bigint) returns jsonb
language plpgsql immutable set search_path='' as $$ begin
 if p_before is null or p_after is null or p_db_peak is null or least(p_before,p_after,p_db_peak)<0 then raise exception 'invalid capacity measurement' using errcode='22023'; end if;
 if p_after>p_before and (p_after>8388608 or p_db_peak>=400000000) then raise exception 'authoring growth stopped: capacity' using errcode='54000'; end if;
 return jsonb_build_object('authorWarning',p_after>=4194304,'databaseAction',case when p_db_peak>=400000000 then 'stop-growth-and-start' when p_db_peak>=350000000 then 'review-and-reduce-batches' when p_db_peak>=300000000 then 'warn-owner' else 'normal' end);
end $$;
-- Same lock as M04 start admission. No check-then-insert window, even across authors.
create function assess.authoring_lock_v1(p_author uuid) returns void
language plpgsql volatile set search_path='' as $$ begin
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform pg_advisory_xact_lock(hashtextextended('rad062-author:'||p_author::text,0));
end $$;
create function assess.authoring_write_guard_v1() returns trigger
language plpgsql security definer set search_path='' as $$
declare d assess.authoring_drafts; did uuid; rev integer; before_bytes bigint; after_bytes bigint; peak bigint; bundle bigint; oldrow jsonb; begin
 if tg_table_name='authoring_drafts' then did:=new.id; else did:=new.draft_id; end if;
 if tg_table_name='authoring_drafts' then d:=new; else select * into strict d from assess.authoring_drafts where id=did; end if;
 -- Both save APIs obey admission; legacy stored rows are never backfilled/truncated.
 -- Keep every v1 function definition/signature/ACL, adding the same database guard.
 if tg_table_name='authoring_drafts' and auth.uid() is not null and auth.uid() is distinct from d.writer_id then raise exception 'authoring writer denied' using errcode='42501'; end if;
 perform assess.authoring_lock_v1(d.writer_id);
 if tg_when='BEFORE' then return new; end if;
 -- AFTER sees the full row including server-generated attribution; failure rolls back all writes.
 if tg_op='UPDATE' then oldrow:=to_jsonb(old); end if;
 after_bytes:=assess.authoring_usage_v1(d.writer_id);
 before_bytes:=after_bytes-octet_length(to_jsonb(new)::text)+coalesce(octet_length(oldrow::text),0);
 select pg_database_size(current_database())+coalesce(sum(bytes),0)+greatest(0,after_bytes-before_bytes) into peak from assess.capacity_reservations_v1;
 perform assess.authoring_admission_v1(before_bytes,after_bytes,peak);
 if tg_table_name='authoring_drafts' then
  if octet_length(new.document::text)+octet_length(new.refs::text)>65536 then raise exception 'draft exceeds 64 KiB including refs' using errcode='54000'; end if;
  if tg_op='INSERT' and (select count(*) from assess.authoring_drafts where writer_id=d.writer_id)>3 then raise exception 'three drafts per author across groups' using errcode='54000'; end if;
 elsif tg_table_name='authoring_revisions' then
  if octet_length(new.document::text)+octet_length(new.refs::text)>65536 then raise exception 'revision exceeds 64 KiB including refs' using errcode='54000'; end if;
  if tg_op='INSERT' and (select count(*) from assess.authoring_revisions where draft_id=did)>10 then raise exception 'ten retained revisions; no early deletion' using errcode='54000'; end if;
 else
  rev:=case when tg_table_name='authoring_reviewed_packages' then (to_jsonb(new)->>'draft_revision')::integer else new.revision end;
  select coalesce(sum(n),0) into bundle from (
   select octet_length(to_jsonb(p)::text) n from assess.authoring_provenance_v2 p where draft_id=did and revision=rev
   union all select octet_length(to_jsonb(p)::text) from assess.content_candidates_v2 p where draft_id=did and revision=rev
   union all select octet_length(to_jsonb(p)::text) from assess.authoring_reviewed_packages p where draft_id=did and draft_revision=rev
  ) q;
  if bundle>65536 then raise exception 'revision package exceeds 64 KiB' using errcode='54000'; end if;
 end if;
 return new;
end $$;
do $$ declare tab text; begin
 foreach tab in array array['authoring_drafts','authoring_revisions','authoring_provenance_v2','content_candidates_v2','authoring_reviewed_packages'] loop
  execute format('create trigger rad062_quota_lock before insert or update on assess.%I for each row execute function assess.authoring_write_guard_v1()',tab);
  execute format('create trigger rad062_quota_check after insert or update on assess.%I for each row execute function assess.authoring_write_guard_v1()',tab);
 end loop;
end $$;
create or replace function assess.draft_save_v2(p_group uuid,p_id uuid,p_revision integer,p_document jsonb,p_refs jsonb default '[]') returns jsonb
language plpgsql security definer set search_path='' as $$
declare d assess.authoring_drafts; doc jsonb; rev integer; n text; begin
 perform assess.authoring_lock_v1(auth.uid());
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 select display_name into n from public.profiles where user_id=auth.uid() for share;
 if not public.rad062_valid_full_name(n) then raise exception 'three part account name required' using errcode='22023'; end if;
 if p_id is null or p_revision is null or p_revision<0 or p_document->>'id' is distinct from p_id::text or p_document->>'revision' is distinct from p_revision::text then raise exception 'invalid draft identity' using errcode='22023'; end if;
 perform assess.validate_draft_v2(p_document,p_refs);
 perform pg_advisory_xact_lock(hashtextextended('rad062-draft:'||p_id::text,0));
 select * into d from assess.authoring_drafts where id=p_id for update;
 if d.id is not null and (d.writer_id is distinct from auth.uid() or d.group_id<>p_group) then raise exception 'draft denied' using errcode='42501'; end if;
 if (d.id is null and p_revision<>0) or (d.id is not null and (d.revision<>p_revision or d.track<>p_document->>'track' or d.document->>'schemaVersion'<>'2')) then raise exception 'draft changed' using errcode='40001'; end if;
 if p_revision>=100 then raise exception 'revision identity ceiling; review policy before lifting' using errcode='54000'; end if;
 rev:=p_revision+1; doc:=jsonb_set(p_document,'{revision}',to_jsonb(rev));
 insert into assess.authoring_drafts values(p_id,auth.uid(),p_group,doc->>'track',rev,doc,p_refs,clock_timestamp()) on conflict(id) do update set revision=excluded.revision,document=excluded.document,refs=excluded.refs,updated_at=excluded.updated_at;
 insert into assess.authoring_revisions values(p_id,rev,doc,p_refs,encode(sha256(convert_to(doc::text||p_refs::text,'UTF8')),'hex'),clock_timestamp());
 insert into assess.authoring_provenance_v2(draft_id,revision,item_id,author_id,author_display_name) select p_id,rev,i->>'id',auth.uid(),n from jsonb_array_elements(doc->'items') i;
 return jsonb_build_object('document',doc,'refs',p_refs,'id',p_id,'revision',rev,'capacity',assess.authoring_admission_v1(assess.authoring_usage_v1(auth.uid()),assess.authoring_usage_v1(auth.uid()),pg_database_size(current_database())));
end $$;

-- Fail closed for any newly introduced revision FK until cleanup understands it.
create function assess.authoring_cleanup_v1(p_limit integer default 100,p_dry_run boolean default true) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r record; n integer:=0; scanned integer:=0; bytes bigint:=0; begin
 if p_limit is null or p_limit not between 1 and 100 or p_dry_run is null then raise exception 'bounded explicit cleanup required' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 if exists(select 1 from pg_constraint where contype='f' and confrelid='assess.authoring_revisions'::regclass
  and conrelid not in ('assess.authoring_publication_links'::regclass,'assess.assignment_reviews'::regclass,'assess.authoring_reviewed_packages'::regclass,'assess.authoring_provenance_v2'::regclass,'assess.content_candidates_v2'::regclass,'assess.authoring_holds_v1'::regclass)) then
  raise exception 'unknown cleanup dependency; review required' using errcode='55000'; end if;
 -- Bound candidates examined too; protected rows can require an explicit later batch.
 for r in select ar.draft_id,ar.revision,octet_length(to_jsonb(ar)::text) size from assess.authoring_revisions ar
  where ar.created_at<clock_timestamp()-interval '30 days' order by ar.created_at,ar.draft_id,ar.revision limit p_limit loop
  scanned:=scanned+1;
  -- Matches bridge/confirm draft lock. Recheck ALL links after acquiring it.
  perform 1 from assess.authoring_drafts where id=r.draft_id for update;
  perform 1 from assess.authoring_revisions where draft_id=r.draft_id and revision=r.revision for update;
  if not found then continue; end if;
  if exists(select 1 from assess.authoring_drafts where id=r.draft_id and revision=r.revision)
   or r.revision in (select revision from assess.authoring_revisions where draft_id=r.draft_id order by revision desc limit 3)
   or exists(select 1 from assess.authoring_publication_links where draft_id=r.draft_id)
   or exists(select 1 from assess.versions where assessment_id=r.draft_id)
   or exists(select 1 from assess.assignment_reviews where draft_id=r.draft_id)
   or exists(select 1 from assess.authoring_holds_v1 where draft_id=r.draft_id and revision=r.revision)
   or exists(select 1 from assess.authoring_reviewed_packages where draft_id=r.draft_id and draft_revision=r.revision)
   or exists(select 1 from assess.content_candidates_v2 where draft_id=r.draft_id and revision=r.revision)
   -- Preserve provenance/rights evidence unless separately reviewed for disposal.
   or exists(select 1 from assess.authoring_provenance_v2 where draft_id=r.draft_id and revision=r.revision) then continue; end if;
  n:=n+1; bytes:=bytes+r.size;
  if not p_dry_run then delete from assess.authoring_revisions where draft_id=r.draft_id and revision=r.revision; end if;
 end loop;
 return jsonb_build_object('dryRun',p_dry_run,'examined',scanned,'revisions',n,'logicalBytes',bytes);
end $$;
revoke all on function assess.authoring_limits_v1(),assess.authoring_usage_v1(uuid),assess.authoring_admission_v1(bigint,bigint,bigint),assess.authoring_lock_v1(uuid),assess.authoring_write_guard_v1(),assess.authoring_cleanup_v1(integer,boolean) from public,anon,authenticated,assess_worker,assess_authoring_bridge;
commit;
