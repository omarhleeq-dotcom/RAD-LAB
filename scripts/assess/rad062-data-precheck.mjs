// Pre-M01: read-only, counts only, no validators/objects installed on the target.
import { readFileSync } from 'node:fs';
import { readOnly } from './rad062-db-day.mjs';
const migration = n => `supabase/migrations/${[
  '20261030000100_rad062_full_name.sql', '20261030000200_rad062_provenance_v2.sql',
  '20261030000300_rad062_authoring_limits.sql', '20261030000400_rad062_random_pool.sql',
  '20261030000500_rad062_manual_foundation_freeze.sql', '20261030000600_rad062_lifecycle_v2.sql',
][n - 1]}`;
const source = (n, anchor) => {
  const file = migration(n), lines = readFileSync(file, 'utf8').split('\n');
  const line = lines.findIndex(s => s.includes(anchor)) + 1;
  if (!line) throw Error('precheck_source');
  return `${file}:${line}`;
};
// Reuse the reviewed validator's exact SELECT as a scalar expression, without CREATE.
const nameSQL = () => {
  const sql = readFileSync(migration(1), 'utf8');
  return sql.slice(sql.indexOf(' select coalesce(char_length(n)'), sql.indexOf('$fn$;', sql.indexOf(' select coalesce(char_length(n)')))
    .replace(/;\s*$/, '').replaceAll('p_name', 'p.display_name');
};
export const conditions = () => [
  ['invalid_name_profiles', source(1, 'select coalesce(char_length(n)'), 'profiles failing the exact full-name validator'],
  ['drafts_above_64kib', source(3, 'draft exceeds 64 KiB'), 'draft document plus refs >65536 bytes'],
  ['revisions_above_64kib', source(3, 'revision exceeds 64 KiB'), 'revision document plus refs >65536 bytes'],
  ['authors_above_three_drafts', source(3, 'three drafts per author'), 'authors with >3 drafts across groups'],
  ['drafts_above_ten_revisions', source(3, 'ten retained revisions'), 'drafts with >10 retained revisions'],
  ['packages_above_64kib', source(3, 'revision package exceeds'), 'serialized retained review packages per draft/revision >65536 bytes; new v2 tables are empty'],
  ['authors_at_four_mib', source(3, 'authorWarning'), 'authors at the 4194304-byte warning threshold (STOP for review)'],
  ['authors_above_eight_mib', source(3, 'p_after>8388608'), 'authors above the 8388608-byte growth limit'],
  ['draft_revision_identity_ceiling', source(3, 'p_revision>=100'), 'draft revision identities at or above 100'],
  ['database_at_300mb', source(3, 'dbWarnBytes'), 'database at 300000000-byte warning threshold (STOP for review)'],
  ['database_at_350mb', source(3, 'dbReviewBytes'), 'database at 350000000-byte review threshold'],
  ['database_at_400mb', source(3, 'dbStopBytes'), 'database at 400000000-byte growth/start limit; reservations do not exist before M03'],
  ['sessions_invalid_state', source(5, 'add constraint sessions_state_check'), 'existing sessions outside the added state CHECK (NULL follows CHECK semantics)'],
  ['sessions_invalid_lifecycle', source(6, 'update assess.sessions s'), 'M06 backfill would set lifecycle_version NULL or outside (1,2)'],
];
export async function dataPrecheck(db, report = value => {
  console.log('accepted_invalid_name_profiles=' + value.find(row => row.condition === 'accepted_invalid_name_profiles').count);
  console.log(JSON.stringify({ data_precheck: value }));
}) {
  const result = await readOnly(db, `with usage as (
    select d.writer_id, sum(n) bytes from (
      select id draft_id, octet_length(to_jsonb(d)::text)::bigint n from assess.authoring_drafts d
      union all select draft_id,octet_length(to_jsonb(r)::text) from assess.authoring_revisions r
      union all select draft_id,octet_length(to_jsonb(r)::text) from assess.authoring_reviewed_packages r
    ) q join assess.authoring_drafts d on d.id=q.draft_id where d.writer_id is not null group by d.writer_id
  ) select
    (select count(*) from public.profiles p where not (${nameSQL()})) invalid_name_profiles,
    (select count(*) from assess.authoring_drafts where octet_length(document::text)+octet_length(refs::text)>65536) drafts_above_64kib,
    (select count(*) from assess.authoring_revisions where octet_length(document::text)+octet_length(refs::text)>65536) revisions_above_64kib,
    (select count(*) from (select writer_id from assess.authoring_drafts where writer_id is not null group by writer_id having count(*)>3) q) authors_above_three_drafts,
    (select count(*) from (select draft_id from assess.authoring_revisions group by draft_id having count(*)>10) q) drafts_above_ten_revisions,
    (select count(*) from (select draft_id,draft_revision from assess.authoring_reviewed_packages r group by draft_id,draft_revision having sum(octet_length(to_jsonb(r)::text))>65536) q) packages_above_64kib,
    (select count(*) from usage where bytes>=4194304) authors_at_four_mib,
    (select count(*) from usage where bytes>8388608) authors_above_eight_mib,
    (select count(*) from assess.authoring_drafts where revision>=100) draft_revision_identity_ceiling,
    (pg_database_size(current_database())>=300000000)::int database_at_300mb,
    (pg_database_size(current_database())>=350000000)::int database_at_350mb,
    (pg_database_size(current_database())>=400000000)::int database_at_400mb,
    (select count(*) from assess.sessions where state not in ('active','grading','grading-failed','awaiting-manual','graded','void')) sessions_invalid_state,
    (select count(*) from assess.sessions s join assess.assignments a on a.id=s.assignment_id join assess.versions v on v.id=a.version_id where v.schema_version is null or v.schema_version not in (1,2)) sessions_invalid_lifecycle`);
  const counts = result.rows[0];
  // Validate and emit the complete batch before any STOP; no row values/identities.
  const rows = conditions().map(([condition, source, description]) => ({ condition: condition === 'invalid_name_profiles' ? 'accepted_invalid_name_profiles' : condition, source, description, count: counts[condition] }));
  report(rows);
  if (rows.some(r => !/^\d+$/.test(String(r.count)) || (r.condition !== 'accepted_invalid_name_profiles' && Number(r.count) !== 0))) throw Error('data_precheck');
  return { data_precheck_conditions: rows.length, data_precheck_failures: 0, accepted_invalid_name_profiles: counts.invalid_name_profiles };
}
