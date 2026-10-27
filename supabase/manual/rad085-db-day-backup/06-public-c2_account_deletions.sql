-- RAD-085 DB day (B2) - public.c2_account_deletions
-- READ ONLY: one SELECT, no change. Contains PERSONAL DATA once downloaded: keep the CSV on an encrypted
-- disk only, never upload/share it, and delete it when DB day is verified (see docs/RAD-085_DB_DAY_P1.md).
-- Save as public.c2_account_deletions.csv. Expected data rows = row_count of 'public.c2_account_deletions' in 00-counts-before.csv. Fewer rows: STOP (see packet).
select * from public.c2_account_deletions order by user_id;
