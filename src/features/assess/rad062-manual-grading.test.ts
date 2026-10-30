/** Real isolated PostgreSQL: current schema, then M01–M07 explicitly. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { rad062Fixture, syntheticDraft, id } from './rad062-test-fixture';
import { publicationFromDraftV2, type BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import type { GradingClaimV2 } from './server-contracts-v2';
import type { ManualFinalReceipt, ManualRead, ManualQueue } from './server-manual-contracts';
import manifest from '../../../scripts/pages/frontend-schema.json';
const file = '20261030000700_rad062_manual_grading.sql';
const migration = (name: string) => readFileSync('supabase/migrations/' + name, 'utf8');
const later = ['20261030000500_rad062_manual_foundation_freeze.sql', '20261030000600_rad062_lifecycle_v2.sql', file];
type Db = Awaited<ReturnType<typeof rad062Fixture>>;
const score = (value = '1.000001', item = 'w0') => ({ item: { id: item, version: '1' }, score: value });
const scores = (db: Db, s: string, rev = 0, op = 200, values = [score()], user = 1) => db.call('manual_score_v1', [s, id(op), rev, JSON.stringify(values), 'initial'], user);
const finalize = (db: Db, s: string, rev = 1, op = 300, user = 1) => db.call<ManualFinalReceipt>('manual_finalize_v1', [s, id(op), rev], user);
async function fixture() {
 const db = await rad062Fixture(4);
 try {
  for (const f of later) await db.admin.query(migration(f));
  const draft = syntheticDraft(); draft.policy.durationSeconds = 3600;
  const p = structuredClone(draft.items[0]!.provenance);
  for (const item of ['w0', 'w1']) draft.items.push({ id: item, type: 'written-answer', prompt: 'SYNTHETIC written', maximum: '3.000001', provenance: p });
  const saved = await db.save(draft);
  const snap = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, draft.id, saved.document.revision]);
  const publication = publicationFromDraftV2(snap, []);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(1), publication.assessment.ref.id]);
  await db.admin.query('insert into assess.publications values($1,$2,$3,now())', [id(50), publication, { q: {}, w0: {}, w1: {} }]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(1), id(50)]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(3)]);
  await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const started = await db.call<{ attemptId: string }>('start_v2', [id(51), id(100)], 3);
  const s = started.attemptId;
  await db.call('command_v2', [s, id(101), 0, { type: 'save', item: { id: 'w0', version: '1' }, answer: { type: 'written-answer', text: ' literal جواب 😀\n ' } }], 3);
  await db.call('command_v2', [s, id(102), 1, { type: 'submit' }], 3);
  const claim = (await db.call<GradingClaimV2>('claim_v2'));
  await db.call('finish_v2', [s, claim.token, '1', '3']);
  return { db, s };
 } catch (e) { await db.close(); throw e; }
}
const catalogue = "select oid,proname,prosrc,proacl,proowner,proconfig from pg_proc where pronamespace='assess'::regnamespace order by oid";
async function blocked(db: Db, pid: number) {
 for (let n = 0; n < 300; n++) {
  if ((await db.admin.query('select exists(select 1 from pg_stat_activity where $1=any(pg_blocking_pids(pid))) ok', [pid])).rows[0].ok) return;
  await new Promise(resolve => setTimeout(resolve, 10));
 }
 throw Error('missing PostgreSQL lock witness');
}
it('current schema works, M07 requires M06; explicit M01–M07 leaves every existing function untouched and grants no runtime access', async () => {
 const db = await rad062Fixture(0);
 try {
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
  expect((await db.admin.query("select to_regprocedure('assess.manual_queue_v1(uuid,integer)') v")).rows[0].v).toBeNull();
  await expect(db.admin.query(migration(file))).rejects.toMatchObject({ code: '55000' }); await db.admin.query('rollback');
  const parts = ['full_name', 'provenance_v2', 'authoring_limits', 'random_pool', 'manual_foundation_freeze', 'lifecycle_v2'];
  for (const [i, part] of parts.entries()) await db.admin.query(migration(`20261030000${i + 1}00_rad062_${part}.sql`));
  const before = (await db.admin.query(catalogue)).rows;
  await db.admin.query(migration(file));
  expect((await db.admin.query('select oid,proname,prosrc,proacl,proowner,proconfig from pg_proc where oid=any($1::oid[]) order by oid', [before.map(r => r.oid)])).rows).toEqual(before);
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   expect((await db.admin.query("select bool_and(not has_function_privilege($1,oid,'execute')) ok from pg_proc where pronamespace='assess'::regnamespace and proname like 'manual_%_v1'", [role])).rows[0].ok).toBe(true);
  }
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
 } finally { await db.close(); }
}, 30000);
it('owner-first authorization filters before paging; student, supervisor, foreign owner and stopped owner are denied without email', async () => {
 const { db, s } = await fixture();
 try {
  const q = await db.call<ManualQueue>('manual_queue_v1', [null, 1], 1);
  expect(q.rows.map(r => r.id)).toEqual([s]); expect(q.next).toBe(s);
  expect((await db.call<ManualQueue>('manual_queue_v1', [s, 1], 1)).rows).toEqual([]);
  const r = await db.call<ManualRead>('manual_read_v1', [s], 1);
  expect(r.items.map(i => i.answer)).toEqual([' literal جواب 😀\n ', '']);
  expect(Object.keys(r).sort()).toEqual(['attemptId', 'finalizeBefore', 'gradingRevision', 'items', 'operationCount']);
  expect(JSON.stringify([q, r])).not.toMatch(/email|example.invalid|synthetic3|user_id|privateItems|automatic_n/);
  for (const user of [2, 3]) {
   await expect(db.call('manual_queue_v1', [], user)).rejects.toMatchObject({ code: '42501' });
   await expect(db.call('manual_read_v1', [s], user)).rejects.toMatchObject({ code: '42501' });
   await expect(scores(db, s, 0, 200, [score()], user)).rejects.toMatchObject({ code: '42501' });
   await expect(finalize(db, s, 0, 300, user)).rejects.toMatchObject({ code: '42501' });
   await expect(db.call('manual_receipt_v1', [s], user)).rejects.toMatchObject({ code: '42501' });
  }
  await db.admin.query("update public.profiles set role='owner' where user_id=$1", [id(2)]);
  expect((await db.call<ManualQueue>('manual_queue_v1', [], 2)).rows).toEqual([]);
  await expect(db.call('manual_read_v1', [s], 2)).rejects.toMatchObject({ code: '42501' });
  await db.admin.query('insert into assess.assignment_managers(assignment_id,manager_id) values($1,$2)', [id(51), id(2)]);
  expect((await db.call<ManualRead>('manual_read_v1', [s], 2)).attemptId).toBe(s);
  await db.admin.query('insert into assess.account_stops(user_id) values($1)', [id(2)]);
  await expect(scores(db, s, 0, 200, [score()], 2)).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
});
it('concurrent score writes conflict, normalized replay stays stable after later changes, reused IDs and invalid batches roll back', async () => {
 const { db, s } = await fixture();
 try {
  const result = await Promise.allSettled([scores(db, s), scores(db, s, 0, 201)]);
  expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(result.find(r => r.status === 'rejected')).toMatchObject({ reason: { code: '40001' } });
  const op = result[0]!.status === 'fulfilled' ? 200 : 201;
  await scores(db, s, 1, 202, [score('2')]);
  expect(await scores(db, s, 0, op, [score('1.000001')])).toEqual({ operationId: id(op), gradingRevision: 1 });
  await expect(scores(db, s, 0, op, [score('1')])).rejects.toMatchObject({ code: '22023' });
  for (const values of [[], [score(), score()], [score('1', 'q')], [score('1'), score('4', 'w1')], Array.from({ length: 11 }, () => score())])
   await expect(scores(db, s, 2, 203, values)).rejects.toMatchObject({ code: '22023' });
  expect((await db.call<ManualRead>('manual_read_v1', [s], 1)).operationCount).toBe(2);
  expect((await db.admin.query('select count(*)::int n from assess.manual_events_v1')).rows[0].n).toBe(2);
 } finally { await db.close(); }
});
it('decimal validation is exact, bounded by each item maximum; 100 successful operations exclude replays and finalize', async () => {
 const { db, s } = await fixture();
 try {
  for (const invalid of ['3.000002', '1.0000001', '-1', '01', '1e0', 'NaN', '1,5', '1000000000', ''])
   await expect(scores(db, s, 0, 200, [score(invalid)])).rejects.toMatchObject({ code: '22023' });
  await scores(db, s, 0, 200, [score('3.000001'), score('0.000001', 'w1')]);
  for (let rev = 1; rev < 100; rev++) await scores(db, s, rev, 200 + rev, [score('3.000001')]);
  expect(await scores(db, s, 0, 200, [score('0.000001', 'w1'), score('3.000001')])).toMatchObject({ gradingRevision: 1 });
  await expect(scores(db, s, 100, 400)).rejects.toMatchObject({ code: '54000' });
  const r = await finalize(db, s, 100); expect(r.operation_count).toBe(100);
  expect((await db.admin.query('select earned_n,earned_d from assess.results')).rows[0]).toEqual({ earned_n: '5000003', earned_d: '1500000' });
 } finally { await db.close(); }
});
it('finalize requires explicit empty-answer score; result, minimal receipt and deletion are atomic, concurrency and final ACK replay are stable', async () => {
 const { db, s } = await fixture();
 try {
  await scores(db, s);
  await expect(finalize(db, s)).rejects.toMatchObject({ code: '55000' });
  await scores(db, s, 1, 201, [score('0', 'w1')]);
  await db.admin.query("create function assess.test_p7_abort() returns trigger language plpgsql as $$ begin raise exception 'synthetic abort'; end $$; create trigger test_p7_abort before delete on assess.session_details for each row execute function assess.test_p7_abort()");
  await expect(finalize(db, s, 2)).rejects.toMatchObject({ code: 'P0001' });
  for (const table of ['results', 'manual_final_receipts_v1']) expect((await db.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
  expect((await db.call<ManualRead>('manual_read_v1', [s], 1)).gradingRevision).toBe(2);
  await db.admin.query('drop trigger test_p7_abort on assess.session_details');
  const receipts = await Promise.all([finalize(db, s, 2), finalize(db, s, 2)]);
  expect(receipts[0]).toEqual(receipts[1]);
  const r = receipts[0]!;
  expect(Object.keys(r).sort()).toEqual(['session_id', 'final_operation_id', 'expected_grading_revision', 'final_grading_revision', 'finalized_at', 'final_grader_id', 'operation_count', 'grader_count', 'outcome', 'policy_version'].sort());
  expect(r).toMatchObject({ final_grader_id: id(1), operation_count: 2, grader_count: 1, outcome: 'finalized', policy_version: 1 });
  expect(await db.call('manual_receipt_v1', [s], 1)).toEqual(r);
  expect(JSON.stringify(r)).not.toMatch(/answer|score|digest|email|literal/);
  for (const table of ['session_details', 'receipts', 'manual_work_v1', 'manual_item_scores_v1', 'manual_events_v1', 'pool_selections_v2', 'capacity_reservations_v1'])
   expect((await db.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
  const result = (await db.admin.query('select * from assess.results')).rows;
  expect(result[0]).toMatchObject({ earned_n: '4000003', earned_d: '3000000', visibility: 'hidden' });
  await expect(finalize(db, s, 2, 301)).rejects.toMatchObject({ code: '55000' });
  await expect(finalize(db, s, 1)).rejects.toMatchObject({ code: '55000' });
  await expect(scores(db, s, 2, 202)).rejects.toMatchObject({ code: '55000' });
  expect((await db.admin.query('select * from assess.results')).rows).toEqual(result);
  const row = (await db.admin.query('select submitted_at,expires_at from assess.sessions')).rows[0];
  expect(row.expires_at.getTime()).toBeGreaterThan(row.submitted_at.getTime() + 170 * 86400000);
  await db.admin.query("update assess.sessions set expires_at=clock_timestamp()-interval '1 second' where id=$1", [s]);
  await expect(db.call('manual_receipt_v1', [s], 1)).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
});
it('different concurrent final operations commit once; freeze and day7 block grading/replays without deleting pending work', async () => {
 const { db, s } = await fixture();
 try {
  await scores(db, s, 0, 200, [score(), score('0', 'w1')]);
  const final = await Promise.allSettled([finalize(db, s), finalize(db, s, 1, 301)]);
  expect(final.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(final.find(r => r.status === 'rejected')).toMatchObject({ reason: { code: '55000' } });
 } finally { await db.close(); }
 const pending = await fixture();
 try {
  await scores(pending.db, pending.s);
  await pending.db.call('freeze_v2');
  expect((await pending.db.call<ManualQueue>('manual_queue_v1', [], 1)).rows).toEqual([]);
  for (const run of [() => scores(pending.db, pending.s), () => finalize(pending.db, pending.s), () => pending.db.call('manual_read_v1', [pending.s], 1)])
   await expect(run()).rejects.toMatchObject({ code: '55000' });
  expect((await pending.db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
  // Synthetic owner recovery only, not a P7 runtime recovery API.
  await pending.db.admin.query("update assess.sessions set emergency_held_at=null,state='awaiting-manual',submitted_at=clock_timestamp()-interval '7 days' where id=$1", [pending.s]);
  await expect(scores(pending.db, pending.s)).rejects.toMatchObject({ code: '55000' });
  await expect(finalize(pending.db, pending.s)).rejects.toMatchObject({ code: '55000' });
 } finally { await pending.db.close(); }
});
it.each(['revocation', 'deadline', 'freeze'])('grading rechecks %s after waiting for its locks', async mode => {
 const { db, s } = await fixture(); const blocker = await db.connect();
 try {
  await scores(db, s, 0, 200, [score(), score('0', 'w1')]);
  await blocker.query('begin');
  const pid = (await blocker.query('select pg_backend_pid() pid')).rows[0].pid;
  if (mode === 'deadline') await blocker.query('select 1 from assess.sessions where id=$1 for update', [s]);
  else await blocker.query('select 1 from assess.scope_lock for update');
  const waiting = Promise.allSettled([mode === 'revocation' ? scores(db, s, 1, 201) : finalize(db, s)]);
  await blocked(db, pid);
  if (mode === 'revocation') await blocker.query("update public.profiles set status='suspended' where user_id=$1", [id(1)]);
  if (mode === 'deadline') await blocker.query("update assess.sessions set submitted_at=clock_timestamp()-interval '7 days' where id=$1", [s]);
  if (mode === 'freeze') await db.call('freeze_v2');
  await blocker.query('commit');
  expect((await waiting)[0]).toMatchObject({ status: 'rejected', reason: { code: mode === 'revocation' ? '42501' : '55000' } });
  expect((await db.admin.query('select count(*)::int n from assess.results')).rows[0].n).toBe(0);
  expect((await db.admin.query('select operation_count from assess.manual_work_v1')).rows[0].operation_count).toBe(1);
 } finally { await blocker.query('rollback'); await blocker.end(); await db.close(); }
});
it('closed assignments still settle; manual functions reject legacy attempts and v1 still grades them', async () => {
 const { db, s } = await fixture();
 try {
  await db.admin.query('update assess.assignments set closed_at=clock_timestamp() where id=$1', [id(51)]);
  await scores(db, s, 0, 200, [score(), score('0', 'w1')]); await finalize(db, s);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','LEGACY','mixed',true)", [id(60), id(1)]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(61), id(1), id(60)]);
  await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at) values($1,$2,$3,1,'grading',now(),now())", [id(62), id(61), id(3)]);
  const doc = { schemaVersion: 1, assessment: { schemaVersion: 1, maximum: '1', name: 'LEGACY', track: 'mixed', policy: { gradeVisibility: 'hidden' }, items: [] } };
  await db.admin.query("insert into assess.session_details(session_id,publication,specs) values($1,$2,'{}')", [id(62), doc]);
  for (const run of [() => db.call('manual_read_v1', [id(62)], 1), () => scores(db, id(62)), () => finalize(db, id(62)), () => db.call('manual_receipt_v1', [id(62)], 1)])
   await expect(run()).rejects.toMatchObject({ code: '42501' });
  const c = await db.call<GradingClaimV2>('claim_v1'); expect(c.attemptId).toBe(id(62));
  await db.call('finish_v1', [id(62), c.token, '1', '1']);
  expect((await db.admin.query('select earned_n,earned_d from assess.results where session_id=$1', [id(62)])).rows[0]).toEqual({ earned_n: '1', earned_d: '1' });
 } finally { await db.close(); }
});
it('M07 is deferred, required SQL/checks, flags, marker and both emergency-stop packets remain byte-identical', () => {
 const base = JSON.parse(execFileSync('git', ['show', 'origin/main:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
 expect(manifest.requiredMigrations).toEqual(base.requiredMigrations); expect(manifest.checks).toEqual(base.checks);
 expect(manifest.deferredMigrations[file].sha256).toBe(createHash('sha256').update(migration(file)).digest('hex'));
 expect(manifest.guardedFeatures.rad062.migrations).toContain(file);
 for (const path of [...base.requiredMigrations.map((f: string) => 'supabase/migrations/' + f), ...base.checks,
  'src/features/assess/rad062-availability.ts', 'src/features/supervisor/p1-availability.ts',
  'supabase/manual/assess-emergency-stop.sql', 'supabase/checks/assess-emergency-stopped.sql', 'scripts/assess/emergency-stop-packet.mjs', 'docs/RAD-059_PHONE_PACKET.md',
  'supabase/manual/assess-emergency-stop-v2.sql', 'supabase/checks/assess-emergency-stopped-v2.sql', 'scripts/assess/emergency-stop-v2-packet.mjs', 'docs/RAD-062_P05_PHONE_PACKET.md'])
  expect(readFileSync(path)).toEqual(execFileSync('git', ['show', 'origin/main:' + path]));
 expect(execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' } }).trim())
  .toBe('pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be');
});
