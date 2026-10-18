-- Additive readiness for Practice comparison. Run AFTER training-ready.sql.
-- Read-only catalogue/ACL check, not a live service attestation.
begin read only;
do $$
declare comparison_rpc regprocedure := to_regprocedure('public.training_page_v1_with_comparison(text,text,uuid,text,text,text,integer,jsonb,timestamp with time zone,integer)');
begin
  if comparison_rpc is null or not exists(select 1 from pg_attribute
    where attrelid=to_regclass('public.attempts') and attname='comparison_version'
    and atttypid='text'::regtype and not attnotnull and not attisdropped)
    or not exists(select 1 from pg_constraint where conrelid=to_regclass('public.attempts')
      and conname='attempts_comparison_version_check' and convalidated)
    or not has_function_privilege('authenticated',comparison_rpc,'EXECUTE')
    or has_function_privilege('anon',comparison_rpc,'EXECUTE')
    or exists(select 1 from pg_proc where oid=comparison_rpc
      and (not prosecdef or not coalesce(proconfig @> array['search_path=""'],false))) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: comparison contract is missing or incompatible' using errcode='55000';
  end if;
end $$;
select 'PRACTICE_COMPARISON_CATALOGUE_READY' result;
rollback;
