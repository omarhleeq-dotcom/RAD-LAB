-- Additive Practice identity. Historical/old-client rows remain NULL, never backfilled.
-- No production application is authorised by committing this migration.
alter table public.attempts add column comparison_version text
  constraint attempts_comparison_version_check check (comparison_version is null
    or (length(comparison_version) <= 100 and comparison_version ~ '^radlab-comparison/[1-9][0-9]*:[0-9a-f]{64}$'));

-- Preserve the v1 function byte-for-byte. Reuse its authorization, validation,
-- paging and snapshot; enrich at most 20 already-authorized rows in this statement.
create function public.training_page_v1_with_comparison(
 p_view text, p_scope text default 'own', p_user uuid default null,
 p_exam text default null, p_search text default '', p_status text default '',
 p_days integer default null, p_cursor jsonb default null, p_boundary timestamptz default null,
 p_limit integer default 20
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare page jsonb; enriched jsonb;
begin
 page := public.training_page_v1(p_view,p_scope,p_user,p_exam,p_search,p_status,p_days,p_cursor,p_boundary,p_limit);
 if p_view='history' then
   select coalesce(jsonb_agg(r.value || jsonb_build_object('comparison',a.comparison_version) order by r.ordinality),'[]'::jsonb)
   into enriched from jsonb_array_elements(page->'rows') with ordinality r(value,ordinality)
   join public.attempts a on a.id=(r.value->>'id')::uuid;
   page := jsonb_set(page,'{rows}',enriched);
 end if;
 return page;
end $$;
revoke all on function public.training_page_v1_with_comparison(text,text,uuid,text,text,text,integer,jsonb,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.training_page_v1_with_comparison(text,text,uuid,text,text,text,integer,jsonb,timestamptz,integer) to authenticated;
