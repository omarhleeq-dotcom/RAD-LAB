-- RAD-085 DB day (B2) - assess.account_stops
-- READ ONLY: one SELECT, no change. Contains PERSONAL DATA once downloaded: keep the CSV on an encrypted
-- disk only, never upload/share it, and delete it when DB day is verified (see docs/RAD-085_DB_DAY_P1.md).
-- Save as assess.account_stops.csv. Expected data rows = row_count of 'assess.account_stops' in 00-counts-before.csv. Fewer rows: STOP (see packet).
select * from assess.account_stops order by user_id;
