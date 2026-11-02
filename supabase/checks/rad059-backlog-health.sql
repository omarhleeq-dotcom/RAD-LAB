-- Owner-only operational read, not an application RPC or a schema attestation.
-- Cumulative ages: >=120/144/167/168h. Holds do not extend the 168h deadline.
-- Run the entire file. Any error/timeout is UNKNOWN, never an empty healthy result.
begin read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
select
 count(*) filter (where state='awaiting-manual') as awaiting_manual,
 count(*) filter (where state='awaiting-manual' and submitted_at<=current_timestamp-interval '120 hours') as awaiting_manual_ge_120h,
 count(*) filter (where state='awaiting-manual' and submitted_at<=current_timestamp-interval '144 hours') as awaiting_manual_ge_144h,
 count(*) filter (where state='awaiting-manual' and submitted_at<=current_timestamp-interval '167 hours') as awaiting_manual_ge_167h,
 count(*) filter (where state='awaiting-manual' and submitted_at<=current_timestamp-interval '168 hours') as awaiting_manual_ge_168h,
 count(*) filter (where state='awaiting-manual' and submitted_at is null) as awaiting_manual_missing_submission,
 count(*) filter (where emergency_held_at is not null) as held,
 min(submitted_at) filter (where state='awaiting-manual') as oldest_submitted_at
from assess.sessions;
rollback;
