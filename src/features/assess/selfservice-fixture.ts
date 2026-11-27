/** Shared synthetic PostgreSQL fixture for the RAD-105 staged-SQL tests (never a provider connection). */
import { readFileSync } from 'node:fs';
import { rad062Fixture, syntheticDraft, id } from './rad062-test-fixture';
import { publicationFromDraftV2, type BridgeSnapshotV2 } from './server-authoring-bridge-v2';

export { id };
export const migrations = ['20261030000500_rad062_manual_foundation_freeze.sql', '20261030000600_rad062_lifecycle_v2.sql'];
export type Db = Awaited<ReturnType<typeof rad062Fixture>>;
export type Session = { attemptId: string; ack: { state: string; revision: number } };

export async function fixture(extra: string[] = []) {
 const db = await rad062Fixture(4);
 try {
  for (const f of [...migrations, ...extra]) await db.admin.query(readFileSync('supabase/migrations/' + f, 'utf8'));
  const d = syntheticDraft(); d.policy.durationSeconds = 3600;
  const q = d.items[0]!;
  d.items = [0, 1, 2].map(n => ({ ...structuredClone(q), id: 'q' + n }));
  d.randomPool = { version: 1, size: 2 };
  const saved = await db.save(d);
  const snap = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, d.id, saved.document.revision]);
  const publication = publicationFromDraftV2(snap, []);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), publication.assessment.ref.id]);
  await db.admin.query('insert into assess.publications values($1,$2,$3,now())', [id(50), publication, Object.fromEntries(publication.assessment.items.map(i => [i.ref.id, {}]))]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id,source_group_ids) values($1,$2,$3,$4)', [id(51), id(2), id(50), [db.group]]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(3)]);
  await db.admin.query(`insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at,assignment_id)
   select $1,$2,$3,1,1,draft_id,revision,$4,digest,clock_timestamp()+interval '5 minutes',clock_timestamp(),$5 from assess.authoring_revisions where draft_id=$6 order by revision desc limit 1`, [id(52), id(2), db.group, id(50), id(51), d.id]);
  await db.admin.query('insert into assess.assignment_scopes values($1,$2,$3,$4)', [id(51), db.group, id(2), id(52)]);
  await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  return db;
 } catch (e) { await db.close(); throw e; }
}

const { productionShapeSql } = await import('../../../scripts/assess/' + 'rad085-production-shape.mjs') as { productionShapeSql: () => string };
export async function selfServiceS3Fixture() {
 const db = await fixture(['20261030000700_rad062_manual_grading.sql', '20261030000800_rad062_erasure_operations.sql', '20261102000100_rad062_supervisor_grading_authorization.sql']);
 try {
  await db.admin.query('create role assess_job_a nologin;create role assess_job_b nologin');
  await db.admin.query(readFileSync('supabase/migrations/20261102000200_rad059_emergency_alternate.sql','utf8'));
  await db.admin.query(productionShapeSql());
  for (const f of ['20261102000300_rad085_rights_write_disclosures.sql','20261105000100_rad105_windows.sql','20261105000200_rad105_witness.sql','20261105000300_rad105_selfservice_s2.sql','20261105000400_rad105_eligibility_read.sql','20261105000500_rad105_ui_reads.sql']) await db.admin.query(readFileSync('supabase/migrations/' + f, 'utf8'));
  await db.admin.query("update public.profiles set consent_version='2026-10-15',consented_at=clock_timestamp()");
  for(const user of [1,2,3]) await db.rpc(user,'consent_v3',['assess-written-2026-11-02-v3']);
  await db.rpc(2,'assignment_schedule_v2',[id(51),1,new Date().toISOString(),null]);
  await db.admin.query('update assess.launch_gate set enabled=true');
  return db;
 } catch (e) { await db.close(); throw e; }
}
