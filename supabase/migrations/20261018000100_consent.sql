-- RAD-LAB pilot slice: consent to the Terms and Privacy page (RAD-043a, DECISIONS S-PILOT-10). Applied by hand in the Supabase SQL editor.
-- The sign-up form sends the accepted version in the user metadata; the trigger copies it onto the new profile. Accounts that existed
-- before accept from the account page (the participant may update only the two consent columns of their own row, migration 1).
-- Saved attempts now require a recorded consent (database-enforced, not only in the app). Self-declared: it is a record, not a signature.

alter table public.profiles
  add constraint profiles_consent_version_format check (consent_version is null or consent_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  v text := new.raw_user_meta_data ->> 'consent_version';
begin
  if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    insert into public.profiles (user_id) values (new.id);
  else
    insert into public.profiles (user_id, consent_version, consented_at) values (new.id, v, now());
  end if;
  return new;
end $$;

create function public.has_consented() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.profiles where user_id = auth.uid() and consent_version is not null and consented_at is not null) $$;

revoke execute on function public.has_consented() from public, anon, authenticated;
grant execute on function public.has_consented() to authenticated;

drop policy attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved() and public.has_consented());
