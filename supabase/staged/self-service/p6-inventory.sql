-- RAD-105 P6: READ-ONLY inventory of installed Assess content. Counts item types and review markers only: it never reads answer keys
-- (publications.specs), learner rows, sessions or results. Run by the owner (SQL Editor or owner_sql) before choosing the 20 items.
begin read only;
set local search_path=public;
set local lock_timeout='2s';
set local statement_timeout='10s';
select v.name,v.track,v.schema_version,v.available,
 jsonb_array_length(coalesce(p.document->'assessment'->'items','[]'::jsonb)) as items,
 (select count(*) from jsonb_array_elements(coalesce(p.document->'assessment'->'items','[]'::jsonb)) i where i->>'type'='single-choice') as single_choice,
 (select coalesce(jsonb_object_agg(k,n),'{}'::jsonb) from (select coalesce(i->'provenance'->>'reviewStatus','none') k,count(*) n
   from jsonb_array_elements(coalesce(p.document->'assessment'->'items','[]'::jsonb)) i group by 1) t) as review_status
from assess.versions v join assess.publications p on p.version_id=v.id order by v.name,v.version;
select count(*) as available_single_choice_items,count(distinct i->>'prompt') as distinct_prompts
from assess.versions v join assess.publications p on p.version_id=v.id
cross join lateral jsonb_array_elements(coalesce(p.document->'assessment'->'items','[]'::jsonb)) i
where v.available and i->>'type'='single-choice';
rollback;
