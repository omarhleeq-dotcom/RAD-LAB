-- RAD-LAB pilot slice: saved Practice attempts (RAD-042, DECISIONS S-PILOT-9). Applied by hand in the Supabase SQL editor.
-- One row per submitted exposure (not an official assessment). Append-only: participants can insert and read their OWN rows
-- (approved only); the owner can read all; nobody can update or delete through the API. No free text, no personal data.
-- The evaluation engine is untouched: the app stores what it already computed (settings the learner chose + a compact result).

create table public.attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  attempt_no         integer not null check (attempt_no between 1 and 1000),
  exam_id            text not null check (char_length(exam_id) between 1 and 80),
  case_id            text not null check (char_length(case_id) between 1 and 80),
  definition_version text not null check (char_length(definition_version) between 1 and 64),
  settings           jsonb not null check (jsonb_typeof(settings) = 'object' and octet_length(settings::text) <= 4096),
  result             jsonb not null check (jsonb_typeof(result) = 'object' and octet_length(result::text) <= 8192),
  locale             text not null check (locale in ('en', 'ar')),
  device             jsonb not null default '{}'::jsonb check (jsonb_typeof(device) = 'object' and octet_length(device::text) <= 512),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz not null default now()
);
create index attempts_user_finished_idx on public.attempts (user_id, finished_at desc);

alter table public.attempts enable row level security;

create policy attempts_insert_own on public.attempts for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved());
create policy attempts_select_own on public.attempts for select to authenticated using (user_id = auth.uid());
create policy attempts_select_owner on public.attempts for select to authenticated using (public.is_owner());

revoke all on table public.attempts from public, anon, authenticated;
grant select, insert on public.attempts to authenticated;
