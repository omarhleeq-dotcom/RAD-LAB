-- Restored copy only, inside the helper's READ ONLY transaction. Counts only.
-- Revisions are limited per draft; count distinct affected authors, not rows.
with authors as (
 select distinct writer_id from assess.authoring_drafts where writer_id is not null
), usage as (
 select writer_id,assess.authoring_usage_v1(writer_id) bytes from authors
), size as (select pg_database_size(current_database()) bytes)
select
 (select count(*) from public.profiles where not public.rad062_valid_full_name(display_name)) invalid_name_profiles,
 (select count(*) from (select writer_id from assess.authoring_drafts where writer_id is not null group by writer_id having count(*)>3) q) authors_above_three_drafts,
 (select count(distinct d.writer_id) from assess.authoring_drafts d join
  (select draft_id from assess.authoring_revisions group by draft_id having count(*)>10) r on r.draft_id=d.id) authors_above_ten_revisions,
 (select count(*) from usage where bytes>4194304) authors_above_four_mib,
 (select count(*) from usage where bytes>8388608) authors_above_eight_mib,
 bytes database_bytes,
 (bytes>=300000000)::int database_at_300mb,
 (bytes>=350000000)::int database_at_350mb,
 (bytes>=400000000)::int database_at_400mb,
 (select coalesce(sum(bytes),0) from assess.capacity_reservations_v1) reserved_peak_bytes
from size;
