-- RAD-047b.1: additive query foundation; no change to who may read/write or consent semantics.
-- Apply once, in timestamp order, in one transaction (setup guide §4و). Do not replay old migrations.
-- Ordinary CREATE INDEX is transactional and takes write-blocking locks: rehearse/choose a maintenance window.

-- The owner's real queries order globally by time DESC, id ASC; user-leading indexes cannot supply that order.
create index attempts_finished_id_idx on public.attempts (finished_at desc, id asc);
create index feedback_at_id_idx on public.feedback (at desc, id asc);
-- Reverse FK lookups during attempt deletion; retain feedback_user_at_idx for profile deletion.
create index feedback_attempt_id_idx on public.feedback (attempt_id) where attempt_id is not null;

-- Full v4 UUID: 122 random bits. The first 16 hex characters alone include a fixed version nibble (<64 random bits).
-- Only the default changes: existing short codes and the UNIQUE constraint remain intact; no identity is rewritten.
alter table public.profiles alter column participant_code
  set default ('P-' || replace(gen_random_uuid()::text, '-', ''));

-- Only row-independent helpers become scalar subqueries (statement InitPlans).
-- ALTER POLICY retains names, command, roles, permissiveness and all grants; helper functions are unchanged.
alter policy profiles_select_own on public.profiles
  using (user_id = (select auth.uid()));
alter policy profiles_select_owner on public.profiles
  using ((select public.is_owner()));
alter policy profiles_update_own_consent on public.profiles
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy events_insert_own on public.events
  with check (user_id = (select auth.uid()) and (select public.is_approved()));
alter policy events_select_own on public.events
  using (user_id = (select auth.uid()));
alter policy events_select_owner on public.events
  using ((select public.is_owner()));

alter policy attempts_insert_own on public.attempts
  with check (user_id = (select auth.uid()) and (select public.is_approved()) and (select public.has_consented()));
alter policy attempts_select_own on public.attempts
  using (user_id = (select auth.uid()));
alter policy attempts_select_owner on public.attempts
  using ((select public.is_owner()));

alter policy feedback_insert_own on public.feedback
  with check (
    user_id = (select auth.uid()) and (select public.is_approved()) and (select public.has_consented())
    and (attempt_id is null or exists (
      select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid())
    ))
  );
alter policy feedback_select_own on public.feedback
  using (user_id = (select auth.uid()));
alter policy feedback_select_owner on public.feedback
  using ((select public.is_owner()));
