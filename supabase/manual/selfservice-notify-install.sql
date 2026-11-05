-- Offline S2 packet only. Separate P7 permission required; no provider call or secret read here.
-- Reuses the RAD-104 extensions/Vault key+sender; does not enable or change RAD-104.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='15s';
do $$begin
 if to_regprocedure('assess.notice_dispatch_v1()') is null
 or to_regprocedure('cron.schedule(text,text,text)') is null or to_regclass('cron.job') is null
 or to_regclass('vault.decrypted_secrets') is null
 or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='net' and p.proname='http_post')
 then raise exception 'S2 and existing RAD-104 extensions required' using errcode='55000'; end if;
 if exists(select 1 from cron.job where jobname='radlab-assessment-notify') then
  raise exception 'assessment notifier already installed' using errcode='55000'; end if;
 if not coalesce((select count(*)=1 and bool_and(singleton and not enabled) from assess.assessment_notify_settings),false)
 then raise exception 'independent assessment switch must be OFF' using errcode='55000'; end if;
end$$;
select cron.schedule('radlab-assessment-notify','* * * * *','select assess.notice_dispatch_v1()');
commit;
-- Kill switch: assess.notice_switch_v1(false), owner only. pg_net enqueue is asynchronous;
-- request_id proves enqueue only, never delivery. Existing queued HTTP cannot be recalled.
-- Undo cron only: select cron.unschedule(jobid) from cron.job where jobname='radlab-assessment-notify';
