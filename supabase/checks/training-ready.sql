-- Read-only deployment preflight. Run on the SAME Supabase project as the build.
-- This checks catalogue/ACL compatibility, not live Auth, PostgREST cache, RLS behaviour or phone QA.
begin read only;
do $$
declare
  rpc regprocedure := to_regprocedure('public.training_page_v1(text,text,uuid,text,text,text,integer,jsonb,timestamp with time zone,integer)');
  guard regprocedure := to_regprocedure('public.can_read_training(text,uuid)');
begin
  if not exists(select 1 from pg_attribute where attrelid=to_regclass('public.profiles')
    and attname='display_name' and atttypid='text'::regtype and not attisdropped) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: profiles.display_name is missing or incompatible' using errcode='55000';
  end if;
  if rpc is null or guard is null then
    raise exception 'TRAINING_SCHEMA_NOT_READY: training functions are missing' using errcode='55000';
  end if;
  if not exists(select 1 from pg_index where indexrelid=to_regclass('public.attempts_training_user_exam_idx') and indisvalid and indisready) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: training index is missing or invalid' using errcode='55000';
  end if;
  if not has_column_privilege('authenticated','public.profiles','display_name','SELECT')
    or not has_column_privilege('authenticated','public.profiles','display_name','UPDATE')
    or has_column_privilege('anon','public.profiles','display_name','SELECT')
    or has_column_privilege('anon','public.profiles','display_name','UPDATE')
    or has_column_privilege('authenticated','public.profiles','role','UPDATE')
    or has_column_privilege('authenticated','public.profiles','status','UPDATE')
    or has_table_privilege('authenticated','public.attempts','UPDATE')
    or has_table_privilege('authenticated','public.attempts','DELETE') then
    raise exception 'TRAINING_SCHEMA_NOT_READY: unexpected profile or attempt grants' using errcode='55000';
  end if;
  if not has_function_privilege('authenticated',rpc,'EXECUTE') or has_function_privilege('anon',rpc,'EXECUTE')
    or has_function_privilege('authenticated',guard,'EXECUTE') or has_function_privilege('anon',guard,'EXECUTE') then
    raise exception 'TRAINING_SCHEMA_NOT_READY: unexpected function grants' using errcode='55000';
  end if;
  if exists(select 1 from pg_proc where oid in (rpc,guard) and (not prosecdef or not coalesce(proconfig @> array['search_path=""'],false)))
    or exists(select 1 from pg_class where oid in ('public.profiles'::regclass,'public.attempts'::regclass) and not relrowsecurity) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: function or RLS protection is missing' using errcode='55000';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal
    and tgenabled<>'D' and tgfoid=to_regprocedure('public.handle_new_user()'))
    or position('display_name' in pg_get_functiondef('public.handle_new_user()'::regprocedure))=0 then
    raise exception 'TRAINING_SCHEMA_NOT_READY: signup trigger does not save the name' using errcode='55000';
  end if;
end $$;
select 'TRAINING_SCHEMA_CATALOGUE_READY' as result;
rollback;
