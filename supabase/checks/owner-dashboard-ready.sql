-- RAD-069 C1: READ ONLY, no participant rows, no schema changes.
begin read only;
select 'owner-dashboard-ready/1' as contract,
 to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)') is not null as rpc_present,
 coalesce((select prosecdef and provolatile='s' and proconfig=array['search_path=""']::text[]
   from pg_proc where oid=to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)')),false) as function_contract,
 coalesce(has_function_privilege('authenticated',to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)'),'execute'),false) as authenticated_execute,
 not coalesce(has_function_privilege('anon',to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)'),'execute'),true) as anon_denied,
 exists(select 1 from pg_index i where i.indexrelid=to_regclass('public.profiles_owner_status_user_idx') and i.indisvalid) as index_ready;
rollback;
