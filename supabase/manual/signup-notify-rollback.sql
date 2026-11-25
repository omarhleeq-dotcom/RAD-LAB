-- RAD-104 exact undo of supabase/manual/signup-notify-install.sql. Owner SQL Editor only.
-- Removes the trigger, the pg_cron job and the whole signup_notify schema. Safe to re-run.
-- Vault secrets are owner-created and are NOT touched here: delete them by hand (runbook §rollback).
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='15s';
drop trigger if exists radlab_signup_notify_enqueue on auth.users;
do $cron$
begin
 if to_regclass('cron.job') is not null
    and exists(select 1 from cron.job where jobname='radlab-signup-notify') then
  perform cron.unschedule('radlab-signup-notify');
 end if;
end $cron$;
drop schema if exists signup_notify cascade;
commit;
-- Proof: every value must be false.
select to_regnamespace('signup_notify') is not null as schema_left,
 exists(select 1 from pg_catalog.pg_trigger where tgname='radlab_signup_notify_enqueue') as trigger_left,
 (to_regclass('cron.job') is not null and exists(select 1 from cron.job where jobname='radlab-signup-notify')) as cron_job_left;
