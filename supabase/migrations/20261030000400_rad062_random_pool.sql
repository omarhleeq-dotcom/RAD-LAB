-- RAD-062 M04. Deferred after M01-M03. Private pool primitive for M06's atomic
-- start transaction, not an independently exposed lifecycle or runtime capability.
-- Before use rollback new objects/triggers, restore v2 validators/bridge from M02.
-- After use preserve stored choices and use reviewed forward-fix. Never drop v1.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if to_regprocedure('assess.authoring_limits_v1()') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then raise exception 'M03 and closed gate required' using errcode='55000'; end if;
end $$;
create function assess.random_pool_maximum_v1(p_pool jsonb,p_items jsonb,p_marks jsonb default null) returns numeric
language plpgsql immutable set search_path='' as $$
declare i jsonb; points numeric; first_points numeric; total numeric:=0; n integer:=0; k integer; id text; begin
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>200 then raise exception 'bounded pool items required' using errcode='22023'; end if;
 if p_pool is not null and (jsonb_typeof(p_pool)<>'object' or p_pool->'version' is distinct from '1'::jsonb
 or jsonb_typeof(p_pool->'size') is distinct from 'number' or p_pool->>'size' !~ '^[1-9][0-9]{0,2}$'
 or exists(select 1 from jsonb_object_keys(p_pool) key where key not in ('version','size'))) then raise exception 'invalid random pool' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(p_items) loop
  id:=coalesce(i->>'id',i->'ref'->>'id');
  if i ? 'shuffleOptions' and (i->>'type'<>'single-choice' or jsonb_typeof(i->'shuffleOptions')<>'boolean') then raise exception 'invalid option shuffle' using errcode='22023'; end if;
  if p_marks is null then points:=(case when i->>'type'='full-practical' then '1' else i->>'maximum' end)::numeric;
  else
   if (select count(*) from jsonb_array_elements(p_marks) m where m->'item'=i->'ref')<>1 then raise exception 'ambiguous pool marks' using errcode='22023'; end if;
   select (m->>'maximum')::numeric into points from jsonb_array_elements(p_marks) m where m->'item'=i->'ref';
  end if;
  if points is null or points<=0 then raise exception 'positive pool points required' using errcode='22023'; end if;
  if i->>'type'='single-choice' then
   n:=n+1;
   if first_points is null then first_points:=points;
   elsif p_pool is not null and first_points<>points then raise exception 'pool points must be equal' using errcode='22023'; end if;
  end if;
  total:=total+points;
 end loop;
 if p_pool is not null then
  k:=(p_pool->>'size')::integer;
  if k>n then raise exception 'K exceeds N single-choice questions; written questions are fixed' using errcode='22023'; end if;
  total:=total-(n-k)*first_points;
 end if;
 return total;
end $$;
create or replace function assess.validate_draft_v2(p_document jsonb,p_refs jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare i jsonb; projected jsonb:='[]'; begin
 perform assess.random_pool_maximum_v1(p_document->'randomPool',p_document->'items');
 if p_document ? 'randomPool' and p_document->>'track'<>'mixed' then raise exception 'pool requires mixed track' using errcode='22023'; end if;
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
   projected:=projected||jsonb_build_array((i-'provenance'-'shuffleOptions')||'{"authoring":{}}'::jsonb);
  end if;
 end loop;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_document->'items'))<>jsonb_array_length(p_document->'items')
 or (select count(*) from jsonb_array_elements(p_document->'items') where value->>'type'='written-answer')>10 then raise exception 'v2 item limit/identity' using errcode='22023'; end if;
 perform assess.validate_draft_v1(jsonb_set(jsonb_set(p_document-'randomPool','{schemaVersion}','1'),'{items}',projected),p_refs);
end $$;

create or replace function assess.content_submit_v2(p_group uuid,p_draft uuid,p_revision integer,p_document jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare checked jsonb; d jsonb; a jsonb; i jsonb; pub jsonb; k jsonb; n integer:=0; stripped jsonb:='[]'; vid uuid; begin
 checked:=assess.authoring_bridge_read_v2(p_group,p_draft,p_revision); d:=checked->'snapshot'->'document'; a:=p_document->'assessment';
 if d->>'schemaVersion'<>'2' then raise exception 'use unchanged v1 bridge for v1' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(p_document) field where field not in ('schemaVersion','assessment','itemMarks','privateItems'))
 or exists(select 1 from jsonb_object_keys(a) field where field not in ('schemaVersion','ref','name','policy','maximum','track','items','randomPool'))
 or jsonb_typeof(a->'maximum') is distinct from 'string' or a->>'maximum' !~ '^[0-9]+(\.[0-9]+)?$' or (a->>'maximum')::numeric<=0
 or p_document->>'schemaVersion' is distinct from '2' or a->>'schemaVersion' is distinct from '2' or octet_length(p_document::text)>2000000
 or a->'randomPool' is distinct from d->'randomPool'
 or a->'ref' is distinct from jsonb_build_object('id',p_draft,'version',p_revision::text) or a->'policy' is distinct from d->'policy' or a->'name' is distinct from d->'name' or a->'track' is distinct from d->'track'
 or jsonb_typeof(a->'items') is distinct from 'array' or jsonb_typeof(p_document->'privateItems') is distinct from 'array' or jsonb_typeof(p_document->'itemMarks') is distinct from 'array' then raise exception 'publication mismatch' using errcode='22023'; end if;
 if jsonb_array_length(a->'items')=0 or jsonb_array_length(a->'items')<>jsonb_array_length(d->'items') or jsonb_array_length(p_document->'privateItems')<>jsonb_array_length(d->'items') or jsonb_array_length(p_document->'itemMarks')<>jsonb_array_length(d->'items') then raise exception 'item count mismatch' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(d->'items') loop
  pub:=a->'items'->n; k:=p_document->'privateItems'->n;
  if exists(select 1 from jsonb_object_keys(pub) field where field not in ('schemaVersion','ref','prompt','contentLanguage','type','options','presentation','caseRef','shuffleOptions'))
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
   if pub->'shuffleOptions' is distinct from i->'shuffleOptions' or pub->'options' is distinct from i->'options' or k->'correctOptionId' is distinct from i->'correctOptionId' then raise exception 'key mismatch' using errcode='22023'; end if;
  elsif i->>'type'<>'written-answer' then
   if k is distinct from checked->'items'->(i->>'id')->'reviewedKey' then raise exception 'pinned simulator key mismatch' using errcode='22023'; end if;
  end if;
  if p_document->'itemMarks'->n->'item' is distinct from pub->'ref' or (i->>'type'<>'full-practical' and p_document->'itemMarks'->n->'maximum' is distinct from i->'maximum') then raise exception 'marks mismatch' using errcode='22023'; end if;
  stripped:=stripped||jsonb_build_array(k-'provenance'); n:=n+1;
 end loop;
 if (a->>'maximum')::numeric is distinct from assess.random_pool_maximum_v1(a->'randomPool',a->'items',p_document->'itemMarks') then raise exception 'pool maximum mismatch' using errcode='22023'; end if;
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
-- No identity or answer data in this durable fence. It outlives attempt retention.
create table assess.pool_fences_v2 (assessment_id uuid primary key,started boolean not null default false,version_id uuid);
-- Selection data contains ONLY selected item IDs/order and selected option IDs/order.
-- Deleting session_details at finalisation/void/erasure deletes both choices and reserve.
create table assess.pool_selections_v2 (
 session_id uuid primary key references assess.session_details(session_id) on delete cascade,
 selection jsonb not null check(jsonb_typeof(selection)='array' and jsonb_array_length(selection)<=200 and octet_length(selection::text)<=65536)
);
alter table assess.pool_fences_v2 enable row level security;
alter table assess.pool_selections_v2 enable row level security;
revoke all on assess.pool_fences_v2,assess.pool_selections_v2 from public,anon,authenticated,assess_worker,assess_authoring_bridge;
create function assess.pool_version_guard_v2() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 if tg_op='UPDATE' and to_jsonb(new)-'owner_id'-'available'=to_jsonb(old)-'owner_id'-'available' then return new; end if;
 if new.schema_version<>2 and not exists(select 1 from assess.pool_fences_v2 where assessment_id=new.assessment_id)
 and (tg_op<>'UPDATE' or old.schema_version<>2) then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 if tg_op='UPDATE' and exists(select 1 from assess.pool_fences_v2 where assessment_id=old.assessment_id and started) then raise exception 'no replacement after an attempt starts' using errcode='55000'; end if;
 insert into assess.pool_fences_v2(assessment_id) values(new.assessment_id) on conflict do nothing;
 perform 1 from assess.pool_fences_v2 where assessment_id=new.assessment_id for update;
 if exists(select 1 from assess.pool_fences_v2 where assessment_id=new.assessment_id and started)
 or exists(select 1 from assess.sessions s join assess.assignments a on a.id=s.assignment_id join assess.versions v on v.id=a.version_id where v.assessment_id=new.assessment_id) then
  raise exception 'no replacement after an attempt starts' using errcode='55000'; end if;
 return new;
end $$;
create trigger rad062_pool_version before insert or update on assess.versions for each row execute function assess.pool_version_guard_v2();
create function assess.pool_attempt_fence_v2() returns trigger
language plpgsql security definer set search_path='' as $$ declare aid uuid; sv integer; vid uuid; begin
 select v.assessment_id,v.schema_version,v.id into aid,sv,vid from assess.assignments a join assess.versions v on v.id=a.version_id where a.id=new.assignment_id;
 if sv<>2 and not exists(select 1 from assess.pool_fences_v2 where assessment_id=aid) then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 insert into assess.pool_fences_v2(assessment_id) values(aid) on conflict do nothing;
 perform 1 from assess.pool_fences_v2 where assessment_id=aid for update;
 if exists(select 1 from assess.pool_fences_v2 where assessment_id=aid and started and version_id is distinct from vid) then raise exception 'different version already started' using errcode='55000'; end if;
 update assess.pool_fences_v2 set started=true,version_id=vid where assessment_id=aid;
 return new;
end $$;
create trigger rad062_pool_attempt before insert on assess.sessions for each row execute function assess.pool_attempt_fence_v2();
create function assess.pool_assignment_guard_v2() returns trigger
language plpgsql security definer set search_path='' as $$ declare aid uuid; begin
 select assessment_id into aid from assess.versions where id=new.version_id;
 if not exists(select 1 from assess.pool_fences_v2 where assessment_id=aid) then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 if exists(select 1 from assess.pool_fences_v2 where assessment_id=aid and started and version_id is distinct from new.version_id) then raise exception 'no replacement assignment after start' using errcode='55000'; end if;
 return new;
end $$;
create trigger rad062_pool_assignment before insert or update of version_id on assess.assignments for each row execute function assess.pool_assignment_guard_v2();
create function assess.pool_publication_guard_v2() returns trigger
language plpgsql security definer set search_path='' as $$ declare maximum numeric; begin
 if tg_op<>'INSERT' then
  if old.document->>'schemaVersion'='2' then raise exception 'published v2 immutable; publish a new version before any start' using errcode='55000'; end if;
  if tg_op='DELETE' then return old; end if;
 end if;
 if new.document->>'schemaVersion'='2' then
  perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
  perform 1 from assess.versions where id=new.version_id and schema_version=2 for share;
  if not found then raise exception 'v2 version required' using errcode='22023'; end if;
  if exists(select 1 from assess.pool_fences_v2 f join assess.versions v on v.assessment_id=f.assessment_id where v.id=new.version_id and f.started and f.version_id is distinct from new.version_id) then raise exception 'no replacement publication after start' using errcode='55000'; end if;
  maximum:=assess.random_pool_maximum_v1(new.document->'assessment'->'randomPool',new.document->'assessment'->'items',new.document->'itemMarks');
  if (new.document->'assessment'->>'maximum')::numeric is distinct from maximum then raise exception 'pool maximum mismatch' using errcode='22023'; end if;
 end if;
 return new;
end $$;
create trigger rad062_pool_publication before insert or update or delete on assess.publications for each row execute function assess.pool_publication_guard_v2();
-- Internal DTO read. Caller has already locked/reauthorized the session.
create function assess.pool_dto_v2(p_session uuid) returns jsonb
language sql volatile security definer set search_path='' as $$
 select jsonb_build_object('attemptId',d.session_id,'assessment',d.publication->'assessment')
 from assess.session_details d join assess.pool_selections_v2 c on c.session_id=d.session_id where d.session_id=p_session
$$;
-- M06 MUST call this in its same INSERT session/reservation/start-op transaction.
-- It accepts a bound server session, never IDs/options/K from the browser. Replay
-- and resume use the identical primitive. No grant or launch path is installed here.
create function assess.pool_start_v2(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s assess.sessions; doc jsonb; a jsonb; item jsonb; selected jsonb:='[]'; chosen jsonb:='[]'; opts jsonb; ids jsonb; mark jsonb; keys jsonb:='[]'; marks jsonb:='[]'; sp jsonb:='{}'; k integer; reserve bigint; peak bigint; result jsonb; begin
 -- The same scope boundary as revocation/membership/erasure; no v1 schema downgrade.
 perform pg_advisory_xact_lock(hashtextextended('rad062-capacity',0));
 perform assess.scope_enter_v1(false);
 select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
 if not found then raise exception 'attempt denied' using errcode='42501'; end if;
 perform 1 from assess.assignments where id=s.assignment_id for share;
 perform 1 from assess.targets where assignment_id=s.assignment_id and user_id=auth.uid() for share;
 if not found or not assess.name_entry_v1() then raise exception 'attempt target/name denied' using errcode='42501'; end if;
 select p.document into doc from assess.publications p join assess.versions v on v.id=p.version_id join assess.assignments ass on ass.version_id=v.id
 where ass.id=s.assignment_id and v.available and v.schema_version=2 for share of v,p;
 if doc is null or doc->>'schemaVersion'<>'2' then raise exception 'v2 publication denied' using errcode='42501'; end if;
 result:=assess.pool_dto_v2(p_session);
 if result is not null then return result; end if;
 if s.state<>'active' or exists(select 1 from assess.session_details where session_id=p_session) then raise exception 'uninitialized or incompatible attempt' using errcode='55000'; end if;
 a:=doc->'assessment';
 perform assess.random_pool_maximum_v1(a->'randomPool',a->'items',doc->'itemMarks');
 k:=coalesce((a->'randomPool'->>'size')::integer,(select count(*) from jsonb_array_elements(a->'items') i where i->>'type'='single-choice'));
 -- Uniform K of N without replacement; order of this draw is the question order.
 for item in select i from jsonb_array_elements(a->'items') i where i->>'type'='single-choice' order by random() limit k loop
  if coalesce((item->>'shuffleOptions')::boolean,true) then
   select jsonb_agg(o order by r) into opts from (select o,random() r from jsonb_array_elements(item->'options') o) q;
  else opts:=item->'options'; end if;
  select jsonb_agg(o->'id' order by n) into ids from jsonb_array_elements(opts) with ordinality q(o,n);
  chosen:=chosen||jsonb_build_array(jsonb_build_object('id',item->'ref'->>'id','options',ids));
  selected:=selected||jsonb_build_array(jsonb_set(item-'shuffleOptions','{options}',opts));
 end loop;
 -- Fixed written/simulator items are never candidates for sampling; same relative
 -- order and complete membership for every student. No pool metadata in student DTO.
 for item in select i from jsonb_array_elements(a->'items') with ordinality q(i,n) where i->>'type'<>'single-choice' order by n loop
  chosen:=chosen||jsonb_build_array(jsonb_build_object('id',item->'ref'->>'id'));
  selected:=selected||jsonb_build_array(item-'shuffleOptions');
 end loop;
 for item in select value from jsonb_array_elements(selected) loop
  select m into strict mark from jsonb_array_elements(doc->'itemMarks') m where m->'item'=item->'ref'; marks:=marks||jsonb_build_array(mark);
  select i into strict mark from jsonb_array_elements(doc->'privateItems') i where i->'ref'=item->'ref'; keys:=keys||jsonb_build_array(mark);
  if (select p.specs ? (item->'ref'->>'id') from assess.publications p join assess.assignments ass on ass.version_id=p.version_id where ass.id=s.assignment_id) then
   select sp||jsonb_build_object(item->'ref'->>'id',p.specs->(item->'ref'->>'id')) into sp from assess.publications p join assess.assignments ass on ass.version_id=p.version_id where ass.id=s.assignment_id;
  end if;
 end loop;
 doc:=jsonb_set(jsonb_set(jsonb_set(doc,'{assessment}',jsonb_set(a-'randomPool','{items}',selected)),'{itemMarks}',marks),'{privateItems}',keys);
 -- Raw text at the 10 x 4000 x 4-byte ceiling, 3x planning multiplier plus
 -- selected snapshot and bounded command/receipt headroom. Never trust client size.
 reserve:=3*(octet_length(doc::text)+(select count(*) from jsonb_array_elements(selected) i where i->>'type'='written-answer')*4000*4)+65536;
 select pg_database_size(current_database())+coalesce(sum(bytes),0)+reserve into peak from assess.capacity_reservations_v1;
 if peak>=400000000 or reserve>100000000 then raise exception 'new attempt exceeds reserved database capacity' using errcode='54000'; end if;
 insert into assess.session_details(session_id,publication,specs) values(p_session,doc,sp);
 insert into assess.pool_selections_v2 values(p_session,chosen);
 insert into assess.capacity_reservations_v1 values(p_session,reserve);
 return assess.pool_dto_v2(p_session);
end $$;
create function assess.pool_resume_v2(p_session uuid) returns jsonb
language sql volatile security definer set search_path='' as $$ select assess.pool_start_v2(p_session) $$;
revoke all on function assess.random_pool_maximum_v1(jsonb,jsonb,jsonb),assess.pool_version_guard_v2(),assess.pool_attempt_fence_v2(),assess.pool_assignment_guard_v2(),assess.pool_publication_guard_v2(),assess.pool_dto_v2(uuid),assess.pool_start_v2(uuid),assess.pool_resume_v2(uuid) from public,anon,authenticated,assess_worker,assess_authoring_bridge;
commit;
