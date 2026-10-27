-- RAD-085 DB day (B2) - auth.users, MINIMAL columns
-- READ ONLY: one SELECT, no change. Contains PERSONAL DATA once downloaded: keep the CSV on an encrypted
-- disk only, never upload/share it, and delete it when DB day is verified (see docs/RAD-085_DB_DAY_P1.md).
-- Save as auth.users.csv. Expected data rows = row_count of 'auth.users'. Never add password hashes, tokens or raw metadata.
select id, email, created_at, banned_until, raw_user_meta_data ->> 'consent_version' as consent_version
from auth.users order by id;
