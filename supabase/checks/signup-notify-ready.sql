-- RAD-104 read-only check after supabase/manual/signup-notify-install.sql. Owner SQL Editor.
-- One row per check; every "ok" must be true. Prints no secret, address, key or response body.
-- "relation signup_notify... does not exist" means the packet is not installed.
begin read only;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
with roles(name) as (values ('anon'),('authenticated'),('service_role')),
fns(sig) as (values ('signup_notify.enqueue()'),('signup_notify.post_brevo(text,text)'),
 ('signup_notify.send_digest()'),('signup_notify.send_test()')),
tbls(name) as (values ('signup_notify.queue'),('signup_notify.settings')),
s as (select enabled,last_outcome,last_run_at,last_sent_at,last_request_id from signup_notify.settings where singleton)
select 'objects_present' check_name,
 (select count(*) from tbls where to_regclass(name) is not null)=2
 and (select count(*) from fns where to_regprocedure(sig) is not null)=4 ok, null::text detail
union all select 'functions_definer_empty_path',
 not exists(select 1 from fns f join pg_catalog.pg_proc p on p.oid=to_regprocedure(f.sig)
  where not p.prosecdef or not coalesce(p.proconfig @> array['search_path=""'],false)), null
union all select 'trigger_on_auth_users',
 exists(select 1 from pg_catalog.pg_trigger t where t.tgrelid='auth.users'::regclass and t.tgname='radlab_signup_notify_enqueue'
  and t.tgenabled='O' and t.tgfoid=to_regprocedure('signup_notify.enqueue()')), null
union all select 'cron_job_every_10_min',
 (select count(*)=1 and bool_and(j.schedule='*/10 * * * *' and j.command='select signup_notify.send_digest()' and j.active)
  from cron.job j where j.jobname='radlab-signup-notify'), null
union all select 'rls_on',
 (select count(*)=2 and bool_and(c.relrowsecurity) from tbls join pg_catalog.pg_class c on c.oid=to_regclass(tbls.name)), null
union all select 'grants_private',
 not exists(select 1 from roles r where has_schema_privilege(r.name,'signup_notify','USAGE')
  or exists(select 1 from tbls where has_table_privilege(r.name,tbls.name,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
  or exists(select 1 from fns where has_function_privilege(r.name,fns.sig,'EXECUTE')))
 and not exists(select 1 from fns where has_function_privilege('public',fns.sig,'EXECUTE')), null
union all select 'switch_state', true, case when (select enabled from s) then 'ON' else 'OFF' end
union all select 'unsent_count', true, (select count(*) from signup_notify.queue where sent_at is null)::text
union all select 'last_outcome', true, coalesce((select last_outcome from s),'none')
union all select 'last_run_at', true, coalesce((select last_run_at from s)::text,'none')
union all select 'last_sent_at', true, coalesce((select last_sent_at from s)::text,'none')
union all select 'last_http_status', true, coalesce((select r.status_code::text||case when r.timed_out then ' timed_out' else '' end
  from net._http_response r where r.id=(select last_request_id from s)),'none');
rollback;
