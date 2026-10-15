-- RAD-LAB pilot slice: accounts, approval, sign-in/usage events (RAD-041a, DECISIONS S-PILOT-4 / S-PILOT-5).
--
-- Model: every sign-up creates a `pending` profile (trigger below). Only the owner can approve (set_participant_status).
-- The browser uses the publishable key + the user's session JWT; everything is default-deny: `anon` receives NOTHING,
-- `authenticated` receives only the grants written here, and every table has RLS with explicit policies.
-- Emails stay in auth.users (not exposed by the API); result tables carry only the pseudonymous participant_code / user_id.
-- Practice attempts are NOT stored here (RAD-042). This file is applied by hand in the Supabase SQL editor (docs/PILOT_SUPABASE_SETUP.md).

-- ── profiles ────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  participant_code text not null unique default ('P-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  role            text not null default 'participant' check (role in ('participant', 'owner')),
  status          text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  consent_version text,
  consented_at    timestamptz,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz
);
comment on table public.profiles is 'One row per account. status gates every write; role is set only by the owner via SQL (service role / SQL editor).';

alter table public.profiles enable row level security;

-- ── events (usage + sign-in log; no free text, no personal data) ─────────────────────────────────────────────────────
create table public.events (
  id      bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  type    text not null check (type in (
            'signed_in', 'heartbeat', 'logout',
            'exam_opened', 'attempt_started', 'attempt_submitted', 'attempt_retry',
            'guides_toggled', 'language_changed', 'client_error', 'feedback_sent', 'survey_opened')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1024),
  at      timestamptz not null default now()
);
create index events_user_at_idx on public.events (user_id, at desc);

alter table public.events enable row level security;

-- ── helper predicates (SECURITY DEFINER so policies on profiles do not recurse; fixed search_path) ───────────────────
create function public.is_approved() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.profiles where user_id = auth.uid() and status = 'approved') $$;

create function public.is_owner() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'owner' and status = 'approved') $$;

-- ── policies: profiles ──────────────────────────────────────────────────────────────────────────────────────────────
create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_select_owner on public.profiles for select to authenticated using (public.is_owner());
-- A participant may update only the consent columns of their own row (column grant below); no insert, no delete.
create policy profiles_update_own_consent on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── policies: events (append-only) ──────────────────────────────────────────────────────────────────────────────────
create policy events_insert_own on public.events for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved());
create policy events_select_own on public.events for select to authenticated using (user_id = auth.uid());
create policy events_select_owner on public.events for select to authenticated using (public.is_owner());

-- ── owner-only approval / suspension ────────────────────────────────────────────────────────────────────────────────
create function public.set_participant_status(target uuid, new_status text) returns void
  language plpgsql security definer set search_path = ''
  as $$
begin
  if not public.is_owner() then
    raise exception 'owner only' using errcode = '42501';
  end if;
  if new_status not in ('pending', 'approved', 'suspended') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  if target = auth.uid() then
    raise exception 'the owner cannot change their own status' using errcode = '42501';
  end if;
  update public.profiles set status = new_status where user_id = target;
end $$;

-- A pending or suspended user may still record that they were seen (no events insert before approval).
create function public.touch_last_seen() returns void
  language sql security definer set search_path = ''
  as $$ update public.profiles set last_seen_at = now() where user_id = auth.uid() $$;

-- ── profile for every new account (status = pending) ────────────────────────────────────────────────────────────────
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── grants: default-deny, then the minimum ──────────────────────────────────────────────────────────────────────────
revoke all on table public.profiles, public.events from public, anon, authenticated;
revoke all on sequence public.events_id_seq from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (consent_version, consented_at) on public.profiles to authenticated;
grant select, insert on public.events to authenticated;
grant usage on sequence public.events_id_seq to authenticated;
-- is_approved / is_owner are referenced by RLS policies, which run as the caller, so the caller must be able to execute them.
grant execute on function public.is_approved(), public.is_owner(), public.set_participant_status(uuid, text), public.touch_last_seen() to authenticated;
-- handle_new_user() runs as the trigger owner; nobody else needs to call it.
