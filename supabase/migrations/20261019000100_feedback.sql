-- RAD-LAB pilot slice: short feedback notes linked to a saved attempt (RAD-043b, DECISIONS S-PILOT-11). Applied by hand in the Supabase SQL editor.
-- One row per note, append-only: an approved participant who consented may insert a note about THEIR OWN attempt and read their own notes;
-- the owner reads all; nobody can update or delete through the API. Free text is limited to 1000 characters; the screen warns against personal data.

create table public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  exam_id    text not null check (char_length(exam_id) between 1 and 80),
  attempt_id uuid references public.attempts (id) on delete cascade,
  text       text not null check (char_length(btrim(text)) between 1 and 1000),
  at         timestamptz not null default now()
);
create index feedback_user_at_idx on public.feedback (user_id, at desc);

alter table public.feedback enable row level security;

-- The attempt (if given) must be the writer's own: the sub-select runs under attempts_select_own, so another user's id finds nothing.
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_approved() and public.has_consented()
    and (attempt_id is null or exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  );
create policy feedback_select_own on public.feedback for select to authenticated using (user_id = auth.uid());
create policy feedback_select_owner on public.feedback for select to authenticated using (public.is_owner());

revoke all on table public.feedback from public, anon, authenticated;
revoke all on sequence public.feedback_id_seq from public, anon, authenticated;
grant select, insert on public.feedback to authenticated;
grant usage on sequence public.feedback_id_seq to authenticated;
