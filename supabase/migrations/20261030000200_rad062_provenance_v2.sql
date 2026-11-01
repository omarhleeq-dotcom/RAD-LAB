-- RAD-062 M02, deferred. M01 required. Private staging only, no runtime grants.
-- Readiness: validate_provenance_v2, draft/bridge/submit v2, RLS, FK inventory.
-- Rollback before use: drop new trigger/functions/tables; restore draft_page_v1 and
-- D3 inventory body/contract
-- from through-B; never drop v1 functions. After use prefer reviewed forward-fix.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if to_regprocedure('public.rad062_valid_full_name(text)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate)
 or (select inventory from assess.erasure_fk_contract where singleton) is distinct from assess.d3_fk_inventory_v1() then
  raise exception 'M01, closed gate and exact D3 inventory required' using errcode='55000'; end if;
end $$;

-- Names/reviewer identity are never embedded in immutable revision/candidate JSON.
-- A real simulator review/key is provisioned privately for this exact revision only.
create table assess.authoring_provenance_v2 (
 draft_id uuid not null, revision integer not null, item_id text not null,
 author_id uuid not null references public.profiles(user_id) on delete cascade,
 author_display_name text not null, reviewed_key jsonb,
 reviewer_id uuid references public.profiles(user_id) on delete set null,
 reviewed_by text, reviewed_at text,
 primary key(draft_id,revision,item_id),
 foreign key(draft_id,revision) references assess.authoring_revisions(draft_id,revision) on delete cascade,
 check(length(item_id) between 1 and 100),
 check(public.rad062_valid_full_name(author_display_name)),
 check(reviewed_key is null or (octet_length(reviewed_key::text)<=65536 and not ((reviewed_key->'provenance'->'review') ?| array['reviewedBy','reviewedAt'])))
);
create index rad062_provenance_author on assess.authoring_provenance_v2(author_id);
create table assess.content_candidates_v2 (
 id uuid primary key default gen_random_uuid(), draft_id uuid not null, revision integer not null,
 source_digest text not null, document jsonb not null,
 unique(draft_id,revision),
 foreign key(draft_id,revision) references assess.authoring_revisions(draft_id,revision) on delete cascade,
 check(octet_length(document::text)<=2000000)
);
alter table assess.authoring_provenance_v2 enable row level security;
alter table assess.content_candidates_v2 enable row level security;
revoke all on assess.authoring_provenance_v2,assess.content_candidates_v2 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
-- Independently enumerate both new identity edges. Do not bless unrelated drift.
-- d3_fk_inventory_v1 sorts name columns (always C); sort these text keys in C too.
do $$ declare expected jsonb; begin
 select jsonb_agg(e order by (e->>0) collate "C",(e->>1) collate "C",(e->>2) collate "C") into expected from jsonb_array_elements(
  (select inventory from assess.erasure_fk_contract where singleton)||
  '[["assess","authoring_provenance_v2","authoring_provenance_v2_author_id_fkey","FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["assess","authoring_provenance_v2","authoring_provenance_v2_reviewer_id_fkey","FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL"]]'::jsonb) e;
 if assess.d3_fk_inventory_v1() is distinct from expected then raise exception 'unreviewed M02 identity edge' using errcode='55000'; end if;
 update assess.erasure_fk_contract set inventory=expected where singleton;
end $$;

create function assess.validate_provenance_v2(p jsonb,t text,p_input boolean default true) returns void
language plpgsql set search_path='' as $$ declare s jsonb; r jsonb; begin
 if p is null or jsonb_typeof(p) is distinct from 'object' then raise exception 'provenance required' using errcode='22023'; end if;
 if t in ('single-choice','written-answer') then
  if p->>'kind' is distinct from 'uploader-authored' or p->>'reviewStatus' is distinct from 'no-medical-review'
  or exists(select 1 from jsonb_object_keys(p) k where k not in ('kind','reviewStatus','sources','licenceNotes') and (p_input or k<>'authorDisplayName'))
  or jsonb_typeof(p->'licenceNotes') is distinct from 'string' or length(btrim(p->>'licenceNotes',U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff')) not between 1 and 2000 then
   raise exception 'uploader authored: no review or client author' using errcode='22023'; end if;
  r:=p;
  if not p_input and (not p ? 'authorDisplayName' or (p->'authorDisplayName'<>'null'::jsonb and not public.rad062_valid_full_name(p->>'authorDisplayName'))) then raise exception 'invalid attribution' using errcode='22023'; end if;
 elsif t in ('simulator-part','full-practical') then
  if p->>'kind' is distinct from 'simulator-reviewed' or exists(select 1 from jsonb_object_keys(p) k where k<>'kind' and (p_input or k<>'review')) then
   raise exception 'simulator review required' using errcode='22023'; end if;
  if p_input then return; end if;
  r:=p->'review';
  if jsonb_typeof(r) is distinct from 'object' or exists(select 1 from jsonb_object_keys(r) k where k not in ('sources','reviewedBy','reviewedAt','scope'))
  or jsonb_typeof(r->'reviewedBy') is distinct from 'string' or length(btrim(r->>'reviewedBy',U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff')) not between 1 and 100
  or jsonb_typeof(r->'scope') is distinct from 'string' or length(btrim(r->>'scope',U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff')) not between 1 and 2000
  or jsonb_typeof(r->'reviewedAt') is distinct from 'string' or (r->>'reviewedAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' then raise exception 'real review required' using errcode='22023'; end if;
  perform (r->>'reviewedAt')::timestamptz;
 else raise exception 'unsupported item' using errcode='22023'; end if;
 if jsonb_typeof(r->'sources') is distinct from 'array' then raise exception 'sources required' using errcode='22023'; end if;
 if jsonb_array_length(r->'sources') not between 1 and 50 then raise exception 'sources required' using errcode='22023'; end if;
 for s in select value from jsonb_array_elements(r->'sources') loop
  if jsonb_typeof(s) is distinct from 'object' or exists(select 1 from jsonb_object_keys(s) k where k not in ('reference','licenceEvidence'))
  or jsonb_typeof(s->'reference') is distinct from 'string' or length(btrim(s->>'reference',U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff')) not between 1 and 2000
  or jsonb_typeof(s->'licenceEvidence') is distinct from 'string' or length(btrim(s->>'licenceEvidence',U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff')) not between 1 and 2000 then raise exception 'source and licence required' using errcode='22023'; end if;
 end loop;
end $$;

-- Private review provisioning only. A v1 review may be copied verbatim; no medical
-- approval is inferred by this function. Reviewer identity/time live in erasable columns.
create function assess.record_simulator_review_v2(p_draft uuid,p_revision integer,p_item text,p_reviewer uuid,p_key jsonb) returns void
language plpgsql security definer set search_path='' as $$ declare review jsonb; begin
 if p_key->>'schemaVersion' is distinct from '2' or p_key->>'type' not in ('simulator-part','full-practical')
 or p_key->'ref' is distinct from jsonb_build_object('id',p_item,'version',p_revision::text) then raise exception 'pinned simulator review required' using errcode='22023'; end if;
 perform assess.validate_provenance_v2(p_key->'provenance',p_key->>'type',false);
 review:=p_key->'provenance'->'review';
 update assess.authoring_provenance_v2 set reviewer_id=p_reviewer,reviewed_by=review->>'reviewedBy',reviewed_at=review->>'reviewedAt',
 reviewed_key=jsonb_set(p_key,'{provenance,review}',review-'reviewedBy'-'reviewedAt')
 where draft_id=p_draft and revision=p_revision and item_id=p_item;
 if not found then raise exception 'review revision missing' using errcode='22023'; end if;
end $$;
create function assess.erase_reviewer_provenance_v2() returns trigger
language plpgsql set search_path='' as $$ begin
 if old.reviewer_id is not null and new.reviewer_id is null then new.reviewed_by:=null; new.reviewed_at:=null; end if;
 return new;
end $$;
create trigger rad062_erase_reviewer before update of reviewer_id on assess.authoring_provenance_v2
for each row execute function assess.erase_reviewer_provenance_v2();

create function assess.validate_draft_v2(p_document jsonb,p_refs jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare i jsonb; projected jsonb:='[]'; begin
 if p_document->>'schemaVersion' is distinct from '2' or jsonb_typeof(p_document->'items') is distinct from 'array'
 or octet_length(p_document::text)>131072 or jsonb_array_length(p_document->'items')>200 then raise exception 'invalid v2 draft' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(p_document->'items') loop
  perform assess.validate_provenance_v2(i->'provenance',i->>'type',true);
  if i->>'type'='written-answer' then
   if p_document->>'track' is distinct from 'mixed' or exists(select 1 from jsonb_object_keys(i) k where k not in ('id','type','prompt','maximum','provenance'))
   or jsonb_typeof(i->'id') is distinct from 'string' or length(i->>'id') not between 1 and 100
   or jsonb_typeof(i->'prompt') is distinct from 'string' or length(i->>'prompt')>10000
   or jsonb_typeof(i->'maximum') is distinct from 'string' or i->>'maximum' !~ '^[0-9]+(\.[0-9]+)?$' or (i->>'maximum')::numeric<=0 then raise exception 'invalid written item' using errcode='22023'; end if;
  else
   -- Only adapt editable metadata for existing structural/registry validation.
   -- No review, source, licence or author identity is manufactured here.
   if i ? 'authoring' then raise exception 'legacy author input forbidden' using errcode='22023'; end if;
   projected:=projected||jsonb_build_array((i-'provenance')||'{"authoring":{}}'::jsonb);
  end if;
 end loop;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_document->'items'))<>jsonb_array_length(p_document->'items')
 or (select count(*) from jsonb_array_elements(p_document->'items') where value->>'type'='written-answer')>10 then raise exception 'v2 item limit/identity' using errcode='22023'; end if;
 perform assess.validate_draft_v1(jsonb_set(jsonb_set(p_document,'{schemaVersion}','1'),'{items}',projected),p_refs);
end $$;

-- Keep v1 readers on v1 documents and forbid revision-line version downgrades.
create function assess.rad062_draft_version_guard() returns trigger
language plpgsql set search_path='' as $$ begin
 if new.document->>'schemaVersion' is distinct from old.document->>'schemaVersion' then raise exception 'draft contract version immutable' using errcode='22023'; end if;
 return new;
end $$;
create trigger rad062_draft_version before update of document on assess.authoring_drafts
for each row execute function assess.rad062_draft_version_guard();
create or replace function assess.draft_page_v1(p_group uuid,p_id uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false); perform assess.supervised_group_v1(p_group);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_id is not null then
  select jsonb_build_object('id',id,'revision',revision,'document',document,'refs',refs) into rows
   from assess.authoring_drafts where document->>'schemaVersion'='1' and id=p_id and writer_id=auth.uid() and group_id=p_group;
  if rows is null then raise exception 'draft denied' using errcode='42501'; end if;
  return rows;
 end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select id,track,revision,document->>'name' name,updated_at from assess.authoring_drafts
  where document->>'schemaVersion'='1' and writer_id=auth.uid() and group_id=p_group and (p_after is null or id>p_after) order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
create function assess.draft_save_v2(p_group uuid,p_id uuid,p_revision integer,p_document jsonb,p_refs jsonb default '[]') returns jsonb
language plpgsql security definer set search_path='' as $$
declare d assess.authoring_drafts; doc jsonb; rev integer; n text; begin
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 select display_name into n from public.profiles where user_id=auth.uid() for share;
 if not public.rad062_valid_full_name(n) then raise exception 'three part account name required' using errcode='22023'; end if;
 if p_id is null or p_revision is null or p_revision<0 or p_document->>'id' is distinct from p_id::text or p_document->>'revision' is distinct from p_revision::text then raise exception 'invalid draft identity' using errcode='22023'; end if;
 perform assess.validate_draft_v2(p_document,p_refs);
 perform pg_advisory_xact_lock(hashtextextended('rad062-draft:'||p_id::text,0));
 select * into d from assess.authoring_drafts where id=p_id for update;
 if d.id is not null and (d.writer_id is distinct from auth.uid() or d.group_id<>p_group) then raise exception 'draft denied' using errcode='42501'; end if;
 if (d.id is null and p_revision<>0) or (d.id is not null and (d.revision<>p_revision or d.track<>p_document->>'track' or d.document->>'schemaVersion'<>'2')) then raise exception 'draft changed' using errcode='40001'; end if;
 if p_revision>=100 or (d.id is null and (select count(*) from assess.authoring_drafts where writer_id=auth.uid())>=5) then raise exception 'draft storage limit' using errcode='54000'; end if;
 rev:=p_revision+1; doc:=jsonb_set(p_document,'{revision}',to_jsonb(rev));
 insert into assess.authoring_drafts values(p_id,auth.uid(),p_group,doc->>'track',rev,doc,p_refs,clock_timestamp()) on conflict(id) do update set revision=excluded.revision,document=excluded.document,refs=excluded.refs,updated_at=excluded.updated_at;
 insert into assess.authoring_revisions values(p_id,rev,doc,p_refs,encode(sha256(convert_to(doc::text||p_refs::text,'UTF8')),'hex'),clock_timestamp());
 insert into assess.authoring_provenance_v2(draft_id,revision,item_id,author_id,author_display_name) select p_id,rev,i->>'id',auth.uid(),n from jsonb_array_elements(doc->'items') i;
 return jsonb_build_object('document',doc,'refs',p_refs,'id',p_id,'revision',rev);
end $$;

create function assess.draft_page_v2(p_group uuid,p_id uuid default null,p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$ declare rows jsonb; begin
 perform assess.scope_enter_v1(false); perform assess.supervised_group_v1(p_group);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_id is not null then
  select jsonb_build_object('document',document,'refs',refs,'id',id,'revision',revision) into rows from assess.authoring_drafts where id=p_id and writer_id=auth.uid() and group_id=p_group;
  if rows is null then raise exception 'draft denied' using errcode='42501'; end if; return rows;
 end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (select id,revision,track,document->>'name' name from assess.authoring_drafts where writer_id=auth.uid() and group_id=p_group and (p_after is null or id>p_after) order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create function assess.authoring_bridge_read_v2(p_group uuid,p_draft uuid,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d assess.authoring_drafts; r assess.authoring_revisions; i jsonb; p jsonb; info jsonb:='{}'; row assess.authoring_provenance_v2; begin
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 select * into d from assess.authoring_drafts where id=p_draft and group_id=p_group and writer_id=auth.uid() for update;
 if d.id is null then raise exception 'draft denied' using errcode='42501'; end if;
 if d.revision is distinct from p_revision then raise exception 'draft changed' using errcode='40001'; end if;
 if d.document->>'schemaVersion'='1' then return assess.authoring_bridge_read_v1(p_group,p_draft,p_revision); end if;
 perform ar.key from assess.authoring_references ar join jsonb_array_elements(d.refs) q on ar.key=q->>'key' order by ar.key for share of ar;
 perform assess.validate_draft_v2(d.document,d.refs);
 select * into strict r from assess.authoring_revisions where draft_id=d.id and revision=d.revision;
 if r.document is distinct from d.document or r.refs is distinct from d.refs then raise exception 'revision changed' using errcode='40001'; end if;
 for i in select value from jsonb_array_elements(r.document->'items') loop
  select * into row from assess.authoring_provenance_v2 where draft_id=d.id and revision=d.revision and item_id=i->>'id' for share;
  if i->>'type' in ('single-choice','written-answer') then
   p:=(i->'provenance')||jsonb_build_object('authorDisplayName',row.author_display_name);
  else
   if row.reviewed_key is null or row.reviewed_by is null or row.reviewed_at is null then raise exception 'real pinned simulator review required' using errcode='55000'; end if;
   row.reviewed_key:=jsonb_set(row.reviewed_key,'{provenance,review}',(row.reviewed_key->'provenance'->'review')||jsonb_build_object('reviewedBy',row.reviewed_by,'reviewedAt',row.reviewed_at));
   p:=row.reviewed_key->'provenance';
  end if;
  perform assess.validate_provenance_v2(p,i->>'type',false);
  info:=info||jsonb_build_object(i->>'id',jsonb_build_object('provenance',p,'reviewedKey',row.reviewed_key));
 end loop;
 perform assess.supervised_group_v1(p_group);
 return jsonb_build_object('snapshot',jsonb_build_object('document',r.document,'refs',r.refs,'digest',r.digest),'items',info);
end $$;

create function assess.content_submit_v2(p_group uuid,p_draft uuid,p_revision integer,p_document jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare checked jsonb; d jsonb; a jsonb; i jsonb; pub jsonb; k jsonb; n integer:=0; stripped jsonb:='[]'; vid uuid; begin
 checked:=assess.authoring_bridge_read_v2(p_group,p_draft,p_revision); d:=checked->'snapshot'->'document'; a:=p_document->'assessment';
 if d->>'schemaVersion'<>'2' then raise exception 'use unchanged v1 bridge for v1' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(p_document) field where field not in ('schemaVersion','assessment','itemMarks','privateItems'))
 or exists(select 1 from jsonb_object_keys(a) field where field not in ('schemaVersion','ref','name','policy','maximum','track','items'))
 or jsonb_typeof(a->'maximum') is distinct from 'string' or a->>'maximum' !~ '^[0-9]+(\.[0-9]+)?$' or (a->>'maximum')::numeric<=0
 or p_document->>'schemaVersion' is distinct from '2' or a->>'schemaVersion' is distinct from '2' or octet_length(p_document::text)>2000000
 or a->'ref' is distinct from jsonb_build_object('id',p_draft,'version',p_revision::text) or a->'policy' is distinct from d->'policy' or a->'name' is distinct from d->'name' or a->'track' is distinct from d->'track'
 or jsonb_typeof(a->'items') is distinct from 'array' or jsonb_typeof(p_document->'privateItems') is distinct from 'array' or jsonb_typeof(p_document->'itemMarks') is distinct from 'array' then raise exception 'publication mismatch' using errcode='22023'; end if;
 if jsonb_array_length(a->'items')=0 or jsonb_array_length(a->'items')<>jsonb_array_length(d->'items') or jsonb_array_length(p_document->'privateItems')<>jsonb_array_length(d->'items') or jsonb_array_length(p_document->'itemMarks')<>jsonb_array_length(d->'items') then raise exception 'item count mismatch' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(d->'items') loop
  pub:=a->'items'->n; k:=p_document->'privateItems'->n;
  if exists(select 1 from jsonb_object_keys(pub) field where field not in ('schemaVersion','ref','prompt','contentLanguage','type','options','presentation','caseRef'))
  or pub->>'contentLanguage' is distinct from 'en'
  or exists(select 1 from jsonb_object_keys(p_document->'itemMarks'->n) field where field not in ('item','maximum'))
  or pub->'ref' is distinct from jsonb_build_object('id',i->>'id','version',p_revision::text) or k->'ref' is distinct from pub->'ref'
  or pub->>'schemaVersion' is distinct from '2' or k->>'schemaVersion' is distinct from '2' or pub->'prompt' is distinct from i->'prompt' or pub->'type' is distinct from i->'type' or k->'type' is distinct from i->'type'
  or k->'provenance' is distinct from checked->'items'->(i->>'id')->'provenance' then raise exception 'item provenance mismatch' using errcode='22023'; end if;
  perform assess.validate_provenance_v2(k->'provenance',i->>'type',false);
  if i->>'type' in ('single-choice','written-answer') then
   if exists(select 1 from jsonb_object_keys(k) field where field not in ('schemaVersion','ref','type','provenance') and (i->>'type'<>'single-choice' or field<>'correctOptionId'))
   or pub ? 'presentation' or pub ? 'caseRef' or (i->>'type'='written-answer' and pub ? 'options') then raise exception 'invalid authored fields' using errcode='22023'; end if;
  end if;
  if i->>'type'='single-choice' then
   if pub->'options' is distinct from i->'options' or k->'correctOptionId' is distinct from i->'correctOptionId' then raise exception 'key mismatch' using errcode='22023'; end if;
  elsif i->>'type'<>'written-answer' then
   if k is distinct from checked->'items'->(i->>'id')->'reviewedKey' then raise exception 'pinned simulator key mismatch' using errcode='22023'; end if;
  end if;
  if p_document->'itemMarks'->n->'item' is distinct from pub->'ref' or (i->>'type'<>'full-practical' and p_document->'itemMarks'->n->'maximum' is distinct from i->'maximum') then raise exception 'marks mismatch' using errcode='22023'; end if;
  stripped:=stripped||jsonb_build_array(k-'provenance'); n:=n+1;
 end loop;
 -- Candidate JSON contains no attribution/review. Sources remain per-item in the
 -- erasable draft/provenance rows; reads always resolve that exact revision again.
 p_document:=jsonb_set(p_document,'{privateItems}',stripped);
 select id into vid from assess.content_candidates_v2 where draft_id=p_draft and revision=p_revision;
 if vid is not null then
  if not exists(select 1 from assess.content_candidates_v2 where id=vid and document=p_document and source_digest=checked->'snapshot'->>'digest') then raise exception 'candidate changed' using errcode='40001'; end if;
  return vid;
 end if;
 insert into assess.content_candidates_v2(draft_id,revision,source_digest,document) values(p_draft,p_revision,checked->'snapshot'->>'digest',p_document) returning id into vid;
 perform assess.supervised_group_v1(p_group); return vid;
end $$;
create or replace function assess.d3_inventory_v1(p_user uuid) returns jsonb
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
  union all select 'provenance-v2',p.draft_id::text||':'||p.revision||':'||p.item_id,to_jsonb(p)-'author_id'
   from assess.authoring_provenance_v2 p where p.author_id=p_user or p.reviewer_id=p_user
  union all select 'candidate-v2',c.id::text,to_jsonb(c) from assess.content_candidates_v2 c join assess.authoring_drafts d on d.id=c.draft_id where d.writer_id=p_user
  union all select 'group',g.id::text,to_jsonb(g.name) from assess.groups g where ((g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user)) or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
 ), bounded as (select * from documents limit 1001)
 select count(*),coalesce(jsonb_agg(jsonb_build_array(kind,key,value) order by kind,key),'[]') into n,content from bounded;
 if n>1000 then raise exception 'D3 content exceeds reviewed pilot ceiling' using errcode='54000'; end if;
 return jsonb_build_object('contract','rad085-management-inventory/1','inventoryDigest',encode(sha256(convert_to(inventory::text,'UTF8')),'hex'),
  'contentDigest',encode(sha256(convert_to(content::text,'UTF8')),'hex'),'contentReviewRequired',n>0,
  'requestedAt',(select requested_at from public.c2_account_deletions where user_id=p_user));
end $$;

-- Deliberately no grants, including to the existing NOLOGIN bridge role. M08/P10
-- must review all prerequisites before any operational principal can use v2.
revoke all on function assess.validate_provenance_v2(jsonb,text,boolean),assess.validate_draft_v2(jsonb,jsonb),assess.rad062_draft_version_guard(),assess.record_simulator_review_v2(uuid,integer,text,uuid,jsonb),assess.erase_reviewer_provenance_v2(),
 assess.draft_save_v2(uuid,uuid,integer,jsonb,jsonb),assess.draft_page_v2(uuid,uuid,uuid,integer),
 assess.authoring_bridge_read_v2(uuid,uuid,integer),assess.content_submit_v2(uuid,uuid,integer,jsonb)
 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
commit;
