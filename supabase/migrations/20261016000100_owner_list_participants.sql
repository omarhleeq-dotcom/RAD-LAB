-- RAD-044a: the owner's participant list (DECISIONS S-PILOT-8). Needs 20261015000100_pilot_accounts.sql first.
--
-- The owner must see WHO is behind each participant_code (the e-mail) to decide whom to approve, but e-mails live in auth.users and
-- are deliberately not exposed to the API or copied into our tables. This SECURITY DEFINER function is the only door: it checks
-- public.is_owner() (an approved owner) on every call, otherwise it raises 42501. Nothing else changes.

create function public.owner_list_participants()
  returns table (
    user_id          uuid,
    participant_code text,
    role             text,
    status           text,
    email            text,
    email_confirmed  boolean,
    created_at       timestamptz,
    last_seen_at     timestamptz,
    last_event_at    timestamptz
  )
  language plpgsql stable security definer set search_path = ''
  as $$
begin
  if not public.is_owner() then
    raise exception 'owner only' using errcode = '42501';
  end if;
  return query
    select p.user_id, p.participant_code, p.role, p.status, u.email::text, (u.email_confirmed_at is not null),
           p.created_at, p.last_seen_at, (select max(e.at) from public.events e where e.user_id = p.user_id)
    from public.profiles p
    join auth.users u on u.id = p.user_id
    order by p.created_at desc;
end $$;

revoke execute on function public.owner_list_participants() from public, anon, authenticated;
grant execute on function public.owner_list_participants() to authenticated;
