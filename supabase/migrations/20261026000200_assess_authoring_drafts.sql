-- RAD-085 LOCAL ONLY. Editable private authoring is NOT content publication.
begin;
-- Populated only from a separately reviewed, pinned existing registry during later integration.
-- No content, licence, review, evaluator identity or medical approval is seeded here.
create table assess.authoring_references (
 key text primary key check(length(key) between 1 and 200),
 kind text not null check(kind in ('simulator-part','full-practical')),
 revision text not null check(length(revision) between 1 and 100),
 case_id text not null, case_version text not null, evaluator_version text not null,
 active boolean not null default false
);
create table assess.authoring_drafts (
 id uuid primary key, writer_id uuid not null references public.profiles(user_id) on delete cascade,
 group_id uuid not null references assess.groups(id) on delete cascade,
 track text not null check(track in ('mixed','full-practical')),
 revision integer not null check(revision between 1 and 100),
 document jsonb not null, refs jsonb not null,
 updated_at timestamptz not null, check(octet_length(document::text)<=131072),
 check(jsonb_array_length(document->'items')<=200)
);
create index assess_authoring_writer on assess.authoring_drafts(writer_id,group_id,id);
create table assess.authoring_revisions (
 draft_id uuid not null references assess.authoring_drafts(id) on delete cascade,
 revision integer not null, document jsonb not null, refs jsonb not null,
 digest text not null, created_at timestamptz not null,
 primary key(draft_id,revision), check(octet_length(document::text)<=131072)
);
-- Structural/registry validation only. Existing trusted TS validators and independent reviews
-- remain mandatory before any content installation. Author notes do NOT create ContentReview.
create function assess.validate_draft_v1(p_document jsonb,p_refs jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare item jsonb; ref jsonb; found_ref assess.authoring_references; n integer; k text;
begin
 if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>131072
 or p_document->>'schemaVersion' is distinct from '1' or p_document->>'track' not in ('mixed','full-practical')
 or p_document->>'track' is null or jsonb_typeof(p_document->'items') is distinct from 'array'
 or jsonb_array_length(p_document->'items')>200 or jsonb_typeof(p_document->'name') is distinct from 'string'
 or length(p_document->>'name')>200 or jsonb_typeof(p_refs) is distinct from 'array' or jsonb_array_length(p_refs)>200
 or exists(select 1 from jsonb_object_keys(p_document) key where key not in ('schemaVersion','id','track','revision','name','policy','items')) then
  raise exception 'invalid draft' using errcode='22023'; end if;
 if jsonb_typeof(p_document->'policy') is distinct from 'object' then raise exception 'invalid policy' using errcode='22023'; end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_document->'items'))<>jsonb_array_length(p_document->'items') then
  raise exception 'duplicate item identity' using errcode='22023'; end if;
 if (select count(distinct value->>'key') from jsonb_array_elements(p_refs))<>jsonb_array_length(p_refs) then
  raise exception 'duplicate reference' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(p_refs) loop
  if jsonb_typeof(ref)<>'object' or exists(select 1 from jsonb_object_keys(ref) key where key not in ('key','revision')) then
   raise exception 'invalid reference' using errcode='22023'; end if;
  select * into found_ref from assess.authoring_references where key=ref->>'key' and revision=ref->>'revision' and active;
  if found_ref.key is null then raise exception 'stale reference' using errcode='55000'; end if;
 end loop;
 for item in select value from jsonb_array_elements(p_document->'items') loop
  if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 100
   or jsonb_typeof(item->'prompt') is distinct from 'string' or length(item->>'prompt')>10000
   or jsonb_typeof(item->'authoring') is distinct from 'object'
   or exists(select 1 from jsonb_object_keys(item->'authoring') key where key not in ('author','reference','licenceNotes','notes'))
   or exists(select 1 from jsonb_each(item->'authoring') e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000)
  then raise exception 'invalid draft item' using errcode='22023'; end if;
  if p_document->>'track'='full-practical' then
   if item->>'type' is distinct from 'full-practical' or item ? 'maximum'
    or exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','caseRef','evaluatorVersion','authoring'))
   then raise exception 'separate practical track required' using errcode='22023'; end if;
   k:=item->'caseRef'->>'id';
   select * into found_ref from assess.authoring_references where key=k and kind='full-practical' and active
    and case_id=k and case_version=item->'caseRef'->>'version' and evaluator_version=item->>'evaluatorVersion';
  elsif item->>'type'='simulator-part' then
   if exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','maximum','partId','authoring')) then
    raise exception 'invalid part fields' using errcode='22023'; end if;
   k:=item->>'partId';
   select * into found_ref from assess.authoring_references where key=k and kind='simulator-part' and active;
  elsif item->>'type'='single-choice' then
   k:=null;
   if exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','maximum','options','correctOptionId','authoring'))
    or jsonb_typeof(item->'options') is distinct from 'array' or jsonb_array_length(item->'options')>50 then
    raise exception 'invalid choice fields' using errcode='22023'; end if;
  else raise exception 'unsupported item' using errcode='22023'; end if;
  if k is not null then
   if found_ref.key is null or not exists(select 1 from jsonb_array_elements(p_refs) r where r->>'key'=k and r->>'revision'=found_ref.revision) then
    raise exception 'stale reference' using errcode='55000'; end if;
  elsif item->>'type'<>'single-choice' then raise exception 'missing reference' using errcode='22023'; end if;
 end loop;
 -- Extra references cannot silently bind unrelated catalogue entries.
 for ref in select value from jsonb_array_elements(p_refs) loop
  select count(*) into n from jsonb_array_elements(p_document->'items') i
   where (i->>'type'='simulator-part' and i->>'partId'=ref->>'key')
   or (i->>'type'='full-practical' and i->'caseRef'->>'id'=ref->>'key');
  if n=0 then raise exception 'unused reference' using errcode='22023'; end if;
 end loop;
end $$;
create function assess.draft_save_v1(p_group uuid,p_id uuid,p_revision integer,p_document jsonb,p_refs jsonb default '[]')
returns jsonb language plpgsql security definer set search_path='' as $$
declare d assess.authoring_drafts; rev integer; doc jsonb;
begin
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 if p_id is null or p_revision is null or p_revision<0 or p_document->>'id' is distinct from p_id::text
  or p_document->>'revision' is distinct from p_revision::text then raise exception 'invalid draft identity' using errcode='22023'; end if;
 perform assess.validate_draft_v1(p_document,p_refs);
 select * into d from assess.authoring_drafts where id=p_id;
 if d.id is not null and (d.writer_id<>auth.uid() or d.group_id<>p_group) then raise exception 'draft denied' using errcode='42501'; end if;
 if (d.id is null and p_revision<>0) or (d.id is not null and (d.revision<>p_revision or d.track<>p_document->>'track')) then
  raise exception 'draft changed' using errcode='40001'; end if;
 if p_revision>=100 or (d.id is null and (select count(*) from assess.authoring_drafts where writer_id=auth.uid())>=5) then
  raise exception 'draft storage limit' using errcode='54000'; end if;
 rev:=p_revision+1; doc:=jsonb_set(p_document,'{revision}',to_jsonb(rev));
 insert into assess.authoring_drafts values(p_id,auth.uid(),p_group,doc->>'track',rev,doc,p_refs,clock_timestamp())
 on conflict(id) do update set revision=excluded.revision,document=excluded.document,refs=excluded.refs,updated_at=excluded.updated_at;
 insert into assess.authoring_revisions values(p_id,rev,doc,p_refs,encode(sha256(convert_to(doc::text||p_refs::text,'UTF8')),'hex'),clock_timestamp());
 return jsonb_build_object('id',p_id,'revision',rev,'document',doc,'refs',p_refs);
end $$;
create function assess.draft_page_v1(p_group uuid,p_id uuid default null,p_after uuid default null,p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false); perform assess.supervised_group_v1(p_group);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_id is not null then
  select jsonb_build_object('id',id,'revision',revision,'document',document,'refs',refs) into rows
   from assess.authoring_drafts where id=p_id and writer_id=auth.uid() and group_id=p_group;
  if rows is null then raise exception 'draft denied' using errcode='42501'; end if;
  return rows;
 end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select id,track,revision,document->>'name' name,updated_at from assess.authoring_drafts
  where writer_id=auth.uid() and group_id=p_group and (p_after is null or id>p_after) order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;
alter table assess.authoring_references enable row level security;
alter table assess.authoring_drafts enable row level security;
alter table assess.authoring_revisions enable row level security;
revoke all on assess.authoring_references,assess.authoring_drafts,assess.authoring_revisions from public,anon,authenticated,assess_worker;
revoke all on function assess.validate_draft_v1(jsonb,jsonb),assess.draft_save_v1(uuid,uuid,integer,jsonb,jsonb),assess.draft_page_v1(uuid,uuid,uuid,integer)
 from public,anon,authenticated,assess_worker;
grant execute on function assess.draft_save_v1(uuid,uuid,integer,jsonb,jsonb),assess.draft_page_v1(uuid,uuid,uuid,integer) to authenticated;
commit;
