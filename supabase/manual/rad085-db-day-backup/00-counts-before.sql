-- RAD-085 DB day (B2) - row counts BEFORE any change
-- READ ONLY: one SELECT, no change. Contains PERSONAL DATA once downloaded: keep the CSV on an encrypted
-- disk only, never upload/share it, and delete it when DB day is verified (see docs/RAD-085_DB_DAY_P1.md).
-- Download as CSV (counts-before.csv). Every later backup file must export exactly this many rows for its table.
select t as "table", (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %s', t), false, true, '')))[1]::text::bigint as row_count
from (values
 ('public.profiles'),
 ('public.attempts'),
 ('public.events'),
 ('public.feedback'),
 ('public.pilot_locales'),
 ('public.c2_account_deletions'),
 ('public.c2_survey_responses'),
 ('public.c2_survey_rounds'),
 ('public.c2_survey_settings'),
 ('public.c2_survey_versions'),
 ('assess.account_stops'),
 ('assess.assignments'),
 ('assess.consents'),
 ('assess.content_submissions'),
 ('assess.groups'),
 ('assess.launch_gate'),
 ('assess.memberships'),
 ('assess.practical_presentations'),
 ('assess.publications'),
 ('assess.receipts'),
 ('assess.reservations'),
 ('assess.results'),
 ('assess.session_details'),
 ('assess.sessions'),
 ('assess.targets'),
 ('assess.versions'),
 ('auth.users')
) v(t)
where to_regclass(t) is not null
order by 1;
