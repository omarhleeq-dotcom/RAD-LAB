-- Owner daily read only. Any error/timeout = UNKNOWN; never healthy zero.
-- Resolve rights BEFORE day 30; run C2 finalise daily through day 37.
begin read only;
set local search_path='';
set local row_security=off;
set local timezone='UTC';
set local lock_timeout='2s';
set local statement_timeout='5s';
with pending as materialized (
 select q.*,assess.d3_needs_transfer_v1(q.user_id) and not exists(
  select 1 from assess.erasure_transfers t where t.user_id=q.user_id and t.requested_at=q.requested_at
  and t.content_digest=assess.d3_inventory_v1(q.user_id)->>'contentDigest') unresolved
 from public.c2_account_deletions q
)
select count(*) pending,
 count(*) filter(where requested_at<=clock_timestamp()-interval '25 days') approaching_day30,
 count(*) filter(where requested_at<=clock_timestamp()-interval '30 days') finalise_due,
 count(*) filter(where requested_at<=clock_timestamp()-interval '35 days') approaching_day37,
 count(*) filter(where requested_at<=clock_timestamp()-interval '37 days') overdue,
 count(*) filter(where unresolved) unresolved_rights,
 count(*) filter(where requested_at<=clock_timestamp()-interval '25 days' and unresolved) transfer_alert,
 min(requested_at) oldest_requested_at
from pending;
rollback;
