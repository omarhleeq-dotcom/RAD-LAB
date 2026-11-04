-- RAD-104 option C (DECISIONS#brevo-signup-notify-owner-2026-11-04). Owner SQL Editor only; run once.
-- Runbook: docs/BREVO_SIGNUP_NOTIFY_RUNBOOK.md. Exact undo: supabase/manual/signup-notify-rollback.sql.
-- Installs a private sign-up counter queue, a 10-minute pg_cron digest and a kill switch (OFF).
-- No secret, address or key is in this file: the three values live only in Supabase Vault.
-- Not a migration; the pilot marker and scripts/pages/frontend-schema.json are unchanged.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='15s';
do $pre$
begin
 if to_regnamespace('signup_notify') is not null then
  raise exception 'STOP: signup_notify already exists; run the check or the rollback first' using errcode='55000';
 end if;
 if to_regclass('auth.users') is null or to_regclass('public.profiles') is null then
  raise exception 'STOP: auth.users or public.profiles is missing' using errcode='55000';
 end if;
 if to_regprocedure('cron.schedule(text,text,text)') is null or to_regclass('cron.job') is null then
  raise exception 'STOP: pg_cron is not enabled' using errcode='55000';
 end if;
 if not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
   where n.nspname='net' and p.proname='http_post') then
  raise exception 'STOP: pg_net is not enabled' using errcode='55000';
 end if;
 if to_regclass('vault.decrypted_secrets') is null then
  raise exception 'STOP: Supabase Vault is missing' using errcode='55000';
 end if;
end $pre$;

create schema signup_notify;
revoke all on schema signup_notify from public;
comment on schema signup_notify is 'RAD-104 private sign-up digest. No personal data. Owner-only.';

-- One row per new account: id and time only; sent_at marks the digest that counted it.
create table signup_notify.queue (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
create index queue_unsent on signup_notify.queue (id) where sent_at is null;
create index queue_sent_at on signup_notify.queue (sent_at) where sent_at is not null;

-- Kill switch (default OFF) and last outcome code. No error text, address or response body.
create table signup_notify.settings (
 singleton boolean primary key default true check (singleton),
 enabled boolean not null default false,
 last_run_at timestamptz,
 last_outcome text check (last_outcome ~ '^(off|empty|no_secret|sent|test_sent|error:[0-9A-Z]{5})$'),
 last_sent_at timestamptz,
 last_request_id bigint
);
insert into signup_notify.settings default values;

alter table signup_notify.queue enable row level security;
alter table signup_notify.settings enable row level security;

-- Trigger: never raises. Any failure (missing/broken queue) is swallowed so sign-up is never blocked.
create function signup_notify.enqueue() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 begin
  insert into signup_notify.queue default values;
 exception when others then
  null;
 end;
 return null;
end $$;

-- Reads the three Vault values and queues ONE Brevo call (htmlContent is required without a template; same fixed text, no links). Returns null (sends nothing) if any is missing.
create function signup_notify.post_brevo(p_subject text, p_text text) returns bigint
language plpgsql security definer set search_path='' as $$
declare
 v_key text; v_sender text; v_recipient text;
begin
 if to_regclass('vault.decrypted_secrets') is null then return null; end if;
 select max(case when s.name='radlab_signup_notify_brevo_key' then s.decrypted_secret end),
        max(case when s.name='radlab_signup_notify_sender' then s.decrypted_secret end),
        max(case when s.name='radlab_signup_notify_recipient' then s.decrypted_secret end)
   into v_key, v_sender, v_recipient
   from vault.decrypted_secrets s
  where s.name in ('radlab_signup_notify_brevo_key','radlab_signup_notify_sender','radlab_signup_notify_recipient');
 if coalesce(btrim(v_key),'')='' or coalesce(btrim(v_sender),'')='' or coalesce(btrim(v_recipient),'')='' then
  return null;
 end if;
 return net.http_post(
  url := 'https://api.brevo.com/v3/smtp/email',
  body := jsonb_build_object(
   'sender', jsonb_build_object('name','RAD-LAB','email',btrim(v_sender)),
   'to', jsonb_build_array(jsonb_build_object('email',btrim(v_recipient))),
   'subject', p_subject,
   'htmlContent', '<p>' || p_text || '</p>',
   'textContent', p_text),
  headers := jsonb_build_object('api-key',btrim(v_key),'content-type','application/json','accept','application/json'),
  timeout_milliseconds := 5000);
end $$;

-- pg_cron body. One transaction, advisory lock, idempotent: a second run finds no unsent rows.
create function signup_notify.send_digest() returns text
language plpgsql security definer set search_path='' as $$
declare
 v_code text; v_max bigint; v_n bigint; v_total bigint; v_req bigint;
begin
 if not pg_catalog.pg_try_advisory_xact_lock(104, 1) then return 'busy'; end if;
 begin
  delete from signup_notify.queue where sent_at is not null and sent_at < now() - interval '7 days';
  if not coalesce((select enabled from signup_notify.settings where singleton), false) then
   v_code := 'off';
  else
   select max(id), count(*) into v_max, v_n from signup_notify.queue where sent_at is null;
   if v_n = 0 then
    v_code := 'empty';
   else
    select count(*) into v_total from public.profiles;
    v_req := signup_notify.post_brevo('RAD-LAB: new sign-ups',
     format('%s new sign-up(s) since last notice; total accounts: %s', v_n, v_total));
    if v_req is null then
     v_code := 'no_secret';
    else
     update signup_notify.queue set sent_at = now() where sent_at is null and id <= v_max;
     v_code := 'sent';
    end if;
   end if;
  end if;
 exception when others then
  v_code := 'error:' || sqlstate;
 end;
 update signup_notify.settings
    set last_run_at = now(), last_outcome = v_code,
        last_sent_at = case when v_code = 'sent' then now() else last_sent_at end,
        last_request_id = case when v_code = 'sent' then v_req else last_request_id end
  where singleton;
 return v_code;
end $$;

-- Owner test: one email regardless of the switch; queue untouched. Same content rules.
create function signup_notify.send_test() returns text
language plpgsql security definer set search_path='' as $$
declare
 v_req bigint; v_total bigint;
begin
 select count(*) into v_total from public.profiles;
 v_req := signup_notify.post_brevo('RAD-LAB: sign-up notice test', format('Test notice; total accounts: %s', v_total));
 update signup_notify.settings
    set last_run_at = now(), last_outcome = case when v_req is null then 'no_secret' else 'test_sent' end,
        last_request_id = coalesce(v_req, last_request_id)
  where singleton;
 return case when v_req is null then 'no_secret' else 'test_sent' end;
end $$;

revoke all on all tables in schema signup_notify from public, anon, authenticated, service_role;
revoke all on all sequences in schema signup_notify from public, anon, authenticated, service_role;
revoke all on all functions in schema signup_notify from public, anon, authenticated, service_role;
revoke all on schema signup_notify from anon, authenticated, service_role;

create trigger radlab_signup_notify_enqueue after insert on auth.users
 for each row execute function signup_notify.enqueue();

select cron.schedule('radlab-signup-notify', '*/10 * * * *', 'select signup_notify.send_digest()');
commit;
-- Next: run supabase/checks/signup-notify-ready.sql. The switch stays OFF until the runbook says otherwise.
