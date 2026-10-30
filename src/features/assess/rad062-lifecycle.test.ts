/** Synthetic PostgreSQL only: current schema first, then explicit M01–M06. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { rad062Fixture, syntheticDraft, id } from './rad062-test-fixture';
import { publicationFromDraftV2, type BridgeSnapshotV2 } from './server-authoring-bridge-v2';
import type { AssessmentPublicationV2, GradingClaimV2 } from './server-contracts-v2';
import type { AuthoringDraftV2 } from './contracts-v2';
import { gradePublicationV2 } from './server-grader-v2';
import manifest from '../../../scripts/pages/frontend-schema.json';
const file = '20261030000600_rad062_lifecycle_v2.sql';
const sql = () => readFileSync('supabase/migrations/' + file, 'utf8');
type Db = Awaited<ReturnType<typeof rad062Fixture>>;
type Session = { attemptId: string; assessment?: AssessmentPublicationV2['assessment']; answers?: Record<string, unknown>; ack: { state: string; revision: number } };
async function fixture(written = 1) {
 const db = await rad062Fixture(4);
 try {
  await db.admin.query(readFileSync('supabase/migrations/20261030000500_rad062_manual_foundation_freeze.sql', 'utf8'));
  await db.admin.query(sql());
  await install(db, written);
  await db.admin.query('update assess.launch_gate set enabled=true'); // Synthetic starts only; never provider configuration.
  return db;
 } catch (e) { await db.close(); throw e; }
}
async function install(db: Db, written: number) {
 const d = syntheticDraft(); d.policy.durationSeconds = 3600;
 const q = d.items[0]!;
 d.items = [0, 1, 2].map(n => ({ ...structuredClone(q), id: 'q' + n }));
 d.randomPool = { version: 1, size: 2 };
 for (let n = 0; n < written; n++) d.items.push({ id: 'w' + n, type: 'written-answer', prompt: 'SYNTHETIC', maximum: '3', provenance: structuredClone(q.provenance) });
 const saved = await db.save(d);
 const snap = await db.call<BridgeSnapshotV2>('authoring_bridge_read_v2', [db.group, d.id, saved.document.revision]);
 const publication = publicationFromDraftV2(snap, []);
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1','SYNTHETIC','mixed',2,true)", [id(50), id(2), publication.assessment.ref.id]);
 await db.admin.query("insert into assess.publications values($1,$2,$3,now())", [id(50), publication, Object.fromEntries(publication.assessment.items.map(i => [i.ref.id, {}]))]);
 await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(51), id(2), id(50)]);
 await db.admin.query('insert into assess.targets values($1,$2)', [id(51), id(3)]);
 await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
}
const start = (db: Db, op = 100) => db.call<Session>('start_v2', [id(51), id(op)], 3);
const read = (db: Db, s: Session) => db.call<Session>('read_session_v2', [s.attemptId], 3);
const command = (db: Db, s: Session, action: unknown, op = 200, rev = s.ack.revision) => db.call<{ state: string; revision: number; accepted?: boolean; reason?: string }>('command_v2', [s.attemptId, id(op), rev, action], 3);
const save = (text: string, n = 0) => ({ type: 'save', item: { id: 'w' + n, version: '1' }, answer: { type: 'written-answer', text } });
const claim = (db: Db) => db.call<GradingClaimV2 | null>('claim_v2');
async function finish(db: Db, c: GradingClaimV2) {
 const g = gradePublicationV2(c.publication, c.answers, c.locked);
 return db.call('finish_v2', [c.attemptId, c.token, g.numerator, g.denominator]);
}
async function state(db: Db, s: Session) { return (await db.admin.query('select * from assess.sessions where id=$1', [s.attemptId])).rows[0]!; }

it('current schema works before explicit M01–M06; M06 fails closed without M05 and preserves all v1 OIDs/ACL/owner/config', async () => {
 const db = await rad062Fixture(0);
 try {
  expect((await db.admin.query("select to_regprocedure('assess.start_v2(uuid,uuid)') v")).rows[0].v).toBeNull();
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
  await expect(db.admin.query(sql())).rejects.toMatchObject({ code: '55000' }); await db.admin.query('rollback');
  const names = ['full_name', 'provenance_v2', 'authoring_limits', 'random_pool', 'manual_foundation_freeze'];
  for (const [i, name] of names.entries()) await db.admin.query(readFileSync(`supabase/migrations/20261030000${i + 1}00_rad062_${name}.sql`, 'utf8'));
  const before = (await db.admin.query("select oid,proname,proacl,proowner,proconfig from pg_proc where pronamespace='assess'::regnamespace and proname like '%_v1' order by oid")).rows;
  await db.admin.query(sql());
  expect((await db.admin.query('select oid,proname,proacl,proowner,proconfig from pg_proc where oid=any($1::oid[]) order by oid', [before.map(r => r.oid)])).rows).toEqual(before);
  expect((await db.admin.query('select inventory=assess.d3_fk_inventory_v1() ok from assess.erasure_fk_contract')).rows[0].ok).toBe(true);
  for (const role of ['anon', 'authenticated', 'assess_worker', 'assess_authoring_bridge']) {
   const denied = await db.admin.query("select bool_and(not has_function_privilege($1,p.oid,'execute')) ok from pg_proc p where p.pronamespace='assess'::regnamespace and p.proname=any($2)", [role, ['start_v2', 'read_session_v2', 'read_mixed_session_v2', 'read_practical_session_v2', 'command_v2', 'claim_v2', 'finish_v2', 'fail_v2', 'result_v2']]);
   expect(denied.rows[0].ok).toBe(true);
  }
  expect(await db.rpc('worker', 'claim_v1')).toBeNull();
 } finally { await db.close(); }
}, 30000);
it('atomic concurrent start/replay/resume return identical selection; reservation and pool capacity commit once', async () => {
 const db = await fixture();
 try {
  const [first, ...competing] = await Promise.all([start(db), start(db), start(db, 101)]);
  const results = [...competing, ...await Promise.all([start(db), db.call<Session>('read_mixed_session_v2', [first!.attemptId], 3), read(db, first!)])];
  if (!first) throw Error('missing start');
  for (const s of results) { expect(s.attemptId).toBe(first.attemptId); expect(s.assessment).toEqual(first.assessment); }
  expect(first.assessment!.items.filter(i => i.type === 'single-choice')).toHaveLength(2);
  const snapshot = (await db.admin.query('select publication,specs,selection from assess.session_details d join assess.pool_selections_v2 p using(session_id)')).rows[0];
  const selected = first.assessment!.items.map(i => i.ref.id);
  for (const omitted of ['q0', 'q1', 'q2'].filter(i => !selected.includes(i))) expect(JSON.stringify(snapshot)).not.toContain('"' + omitted + '"');
  expect((await db.admin.query('select used,starts from assess.reservations')).rows[0]).toMatchObject({ used: 1, starts: { [id(100)]: first.attemptId, [id(101)]: first.attemptId } });
  expect((await db.admin.query('select count(*)::int n from assess.capacity_reservations_v1')).rows[0].n).toBe(1);
  await db.admin.query('delete from assess.targets where user_id=$1', [id(3)]);
  await expect(read(db, first)).rejects.toMatchObject({ code: '42501' });
 } finally { await db.close(); }
});
it('a failed pool reservation rolls back session, start-operation tombstone and attempt count together', async () => {
 const db = await fixture();
 try {
  // A test-only failure at the P4 call witnesses the complete outer transaction.
  await db.admin.query("create function assess.test_p06_abort() returns trigger language plpgsql as $$ begin raise exception 'synthetic capacity' using errcode='54000'; end $$; create trigger p06_abort before insert on assess.pool_selections_v2 for each row execute function assess.test_p06_abort()");
  await expect(start(db)).rejects.toMatchObject({ code: '54000' });
  expect((await db.admin.query('select count(*)::int n from assess.sessions')).rows[0].n).toBe(0);
  expect((await db.admin.query('select count(*)::int n from assess.reservations')).rows[0].n).toBe(0);
  await db.admin.query('drop trigger p06_abort on assess.pool_selections_v2');
  expect((await start(db)).assessment).toBeDefined();
 } finally { await db.close(); }
});
it('written literals count Unicode code points server-side: 3999/4000 accepted, 4001 rejected, escaping/astral/multibyte retained once; replay/conflict', async () => {
 const db = await fixture(10);
 try {
  let s = await start(db); let op = 200;
  for (const unit of ['ع', '😀', '\\', '\n']) {
   for (const n of [3999, 4000]) {
    const text = unit.repeat(n);
    const ack = await command(db, s, save(text), ++op); expect(ack.state).toBe('active');
    expect(await command(db, s, save(text), op)).toEqual(ack);
    await expect(command(db, s, save(text + 'x'), op)).rejects.toMatchObject({ code: '22023' });
    s = await read(db, s);
    expect(s.answers!.w0).toEqual({ type: 'written-answer', text });
   }
   await expect(command(db, s, save(unit.repeat(4001)), ++op)).rejects.toMatchObject({ code: '22023' });
  }
  await expect(db.admin.query("update assess.session_details set publication=jsonb_set(publication,'{assessment,items}',(publication->'assessment'->'items')||jsonb_build_array(jsonb_build_object('type','written-answer','ref',jsonb_build_object('id','w10','version','1'))))")).rejects.toMatchObject({ code: '22023' });
  const literal = '  جواب 😀 <>&\n\t  ';
  for (let i = 0; i < 10; i++) { await command(db, s, save(literal, i), ++op); s = await read(db, s); }
  await expect(command(db, s, save(literal, 10), ++op)).rejects.toMatchObject({ code: '22023' });
  await expect(command(db, s, { ...save(literal), type: 'expose' }, ++op)).rejects.toMatchObject({ code: '22023' });
  await expect(command(db, s, save(literal), ++op, 0)).rejects.toMatchObject({ code: '40001' });
  const receipts = (await db.admin.query('select to_jsonb(r) row from assess.receipts r')).rows;
  expect(JSON.stringify(receipts)).not.toContain(literal);
  expect((await db.admin.query("select count(*)::int n from assess.session_details d,jsonb_each(d.answers) a where a.value->>'type'='written-answer'")).rows[0].n).toBe(10);
  const d: AuthoringDraftV2 = syntheticDraft(11); const q = d.items[0]!;
  for (let n = 0; n < 11; n++) d.items.push({ id: 'w' + n, type: 'written-answer', prompt: 'SYNTHETIC', maximum: '1', provenance: structuredClone(q.provenance) });
  await expect(db.save(d)).rejects.toMatchObject({ code: '22023' });
 } finally { await db.close(); }
});
it.each([0, 1, 10])('submit with %i written items: automatic final deletes details; written retains empty and filled answers without partial result', async written => {
 const db = await fixture(written);
 try {
  let s = await start(db);
  if (written) { await command(db, s, save('SYNTHETIC جواب 😀')); s = await read(db, s); }
  const submitted = await command(db, s, { type: 'submit' }, 300);
  expect(submitted.state).toBe('grading');
  const when = (await state(db, s)).submitted_at;
  expect(await command(db, s, { type: 'submit' }, 300)).toEqual(submitted);
  // The snapshot, not presence of transient work, determines manual routing.
  if (written === 10) await db.admin.query('delete from assess.manual_work_v1 where session_id=$1', [s.attemptId]);
  const c = (await claim(db))!; expect(c.attemptId).toBe(s.attemptId); expect(c.answers).not.toHaveProperty('w0');
  await finish(db, c); await finish(db, c);
  expect((await state(db, s)).submitted_at).toEqual(when);
  if (written) {
   expect((await state(db, s)).state).toBe('awaiting-manual');
   expect((await db.admin.query('select automatic_complete,automatic_n,automatic_d from assess.manual_work_v1')).rows[0]).toMatchObject({ automatic_complete: true, automatic_n: '0', automatic_d: '1' });
   expect((await db.admin.query('select answers from assess.session_details')).rows[0].answers.w0.text).toBe('SYNTHETIC جواب 😀');
   expect(await claim(db)).toBeNull();
   expect((await start(db, 301)).attemptId).toBe(s.attemptId);
   await expect(db.call('result_v2', [s.attemptId], 3)).rejects.toMatchObject({ code: '42501' });
  } else {
   expect((await state(db, s)).state).toBe('graded');
   for (const table of ['session_details', 'receipts', 'pool_selections_v2', 'capacity_reservations_v1', 'manual_work_v1']) expect((await db.admin.query(`select count(*)::int n from assess.${table}`)).rows[0].n).toBe(0);
   expect(await db.call('result_v2', [s.attemptId], 3)).toMatchObject({ grade: { visibility: 'hidden' } });
   const row = await state(db, s); expect(row.expires_at.getTime()).toBeGreaterThan(row.submitted_at.getTime() + 170 * 86400000);
   expect((await command(db, s, { type: 'submit' }, 300)).state).toBe('graded');
   await expect(command(db, s, save('appeal'), 305)).rejects.toMatchObject({ code: '55000' });
   const second = await start(db, 302); await command(db, second, { type: 'submit' }, 303); await finish(db, (await claim(db))!);
   await expect(start(db, 304)).rejects.toMatchObject({ code: '54000' });
  }
 } finally { await db.close(); }
});
it.each(['read', 'command', 'start', 'claim'])('server deadline via %s fixes submittedAt once and creates manual work', async mode => {
 const db = await fixture();
 try {
  const s = await start(db);
  await db.admin.query("update assess.sessions set deadline=clock_timestamp()-interval '1 second' where id=$1", [s.attemptId]);
  const deadline = (await state(db, s)).deadline;
  if (mode === 'read') expect((await read(db, s)).ack.state).toBe('grading');
  if (mode === 'command') expect(await command(db, s, save('late'))).toMatchObject({ state: 'grading', accepted: false, reason: 'deadline' });
  if (mode === 'start') expect((await start(db, 101)).ack.state).toBe('grading');
  if (mode === 'claim') expect((await claim(db))!.attemptId).toBe(s.attemptId);
  expect((await state(db, s)).submitted_at).toEqual(deadline);
  expect((await db.admin.query('select automatic_complete from assess.manual_work_v1')).rows[0].automatic_complete).toBe(false);
  expect((await read(db, s)).ack.state).toBe('grading');
  expect((await state(db, s)).submitted_at).toEqual(deadline);
 } finally { await db.close(); }
});
it('leases expire into failed/retry, reclaim rotates token; 24h stops auto retry and day7 rejects late completion', async () => {
 const db = await fixture();
 try {
  const s = await start(db); await command(db, s, { type: 'submit' }); const first = (await claim(db))!;
  expect(await claim(db)).toBeNull();
  await db.admin.query('update assess.sessions set lease_until=null where id=$1', [s.attemptId]);
  await expect(finish(db, first)).rejects.toMatchObject({ code: '40001' });
  await db.admin.query("update assess.sessions set lease_until=clock_timestamp()-interval '1 second' where id=$1", [s.attemptId]);
  await expect(finish(db, first)).rejects.toMatchObject({ code: '40001' });
  expect(await claim(db)).toBeNull(); expect((await state(db, s)).state).toBe('grading-failed');
  await db.admin.query("update assess.sessions set retry_at=clock_timestamp()-interval '1 second' where id=$1", [s.attemptId]);
  const second = (await claim(db))!; expect(second.token).not.toBe(first.token);
  await expect(db.call('fail_v2', [s.attemptId, first.token])).rejects.toMatchObject({ code: '40001' });
  await db.call('fail_v2', [s.attemptId, second.token]); expect(await claim(db)).toBeNull();
  await db.admin.query("update assess.sessions set retry_at=null where id=$1", [s.attemptId]);
  const third = (await claim(db))!;
  await db.admin.query("update assess.sessions set submitted_at=clock_timestamp()-interval '25 hours' where id=$1", [s.attemptId]);
  await db.call('fail_v2', [s.attemptId, third.token]);
  const row = await state(db, s); expect(row.retry_at.getTime()).toBe(row.submitted_at.getTime() + 7 * 86400000);
  expect(await claim(db)).toBeNull();
  await db.admin.query("update assess.sessions set state='grading',lease=$2,lease_until=clock_timestamp()+interval '1 minute',submitted_at=clock_timestamp()-interval '7 days' where id=$1", [s.attemptId, third.token]);
  await expect(finish(db, third)).rejects.toMatchObject({ code: '40001' });
  await expect(db.call('fail_v2', [s.attemptId, third.token])).rejects.toMatchObject({ code: '40001' });
  expect(await claim(db)).toBeNull();
 } finally { await db.close(); }
});
it('v1 cannot start/read/command/claim/finish/fail/recover/maintain v2; v2 cannot process v1, while legacy worker still settles v1', async () => {
 const db = await fixture(0);
 try {
  const s = await start(db); await command(db, s, { type: 'submit' });
  for (const [name, args] of [['start_v1', [id(51), id(101)]], ['read_session_v1', [s.attemptId]], ['read_mixed_session_v1', [s.attemptId]], ['read_practical_session_v1', [s.attemptId]], ['command_v1', [s.attemptId, id(201), 0, { type: 'submit' }]], ['result_v1', [s.attemptId]], ['finish_v1', [s.attemptId, id(1), '0', '1']], ['fail_v1', [s.attemptId, id(1)]], ['recover_v1', [s.attemptId]]] as [string, unknown[]][]) await expect(db.call(name, args, 3)).rejects.toMatchObject({ code: '42501' });
  expect(await db.call('claim_v1')).toBeNull();
  for (const pending of [true, false]) {
   await db.admin.query("update assess.sessions set state=$2,deadline=clock_timestamp()-interval '1 day',submitted_at=case when $2='active' then null else clock_timestamp()-interval '8 days' end,expires_at=case when $2='active' then null else clock_timestamp()-interval '1 second' end where id=$1", [s.attemptId, pending ? 'active' : 'grading-failed']);
   const before = await state(db, s); await db.call('maintain_v1', [100]); expect(await state(db, s)).toEqual(before);
  }
  await db.admin.query("update assess.sessions set state='grading',submitted_at=clock_timestamp(),expires_at=null,deadline=clock_timestamp()+interval '1 hour' where id=$1", [s.attemptId]);
  expect(await db.call('health_v1')).toEqual({ failed: 0, alert: 0, overdue: 0, purgeDue: 0 });
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'1','LEGACY','mixed',true)", [id(60), id(1)]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(61), id(1), id(60)]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(61), id(3)]);
  const doc = { schemaVersion: 1, assessment: { schemaVersion: 1, maximum: '1', name: 'LEGACY', track: 'mixed', policy: { gradeVisibility: 'hidden' }, items: [] } };
  await db.admin.query("insert into assess.sessions(id,assignment_id,user_id,ordinal,state,started_at,submitted_at) values($1,$2,$3,1,'grading',now(),now())", [id(62), id(61), id(3)]);
  await db.admin.query("insert into assess.session_details(session_id,publication,specs) values($1,$2,'{}')", [id(62), doc]);
  for (const [name, args] of [['start_v2', [id(61), id(102)]], ['read_session_v2', [id(62)]], ['command_v2', [id(62), id(203), 0, { type: 'submit' }]], ['finish_v2', [id(62), id(1), '0', '1']], ['fail_v2', [id(62), id(1)]], ['result_v2', [id(62)]]] as [string, unknown[]][]) await expect(db.call(name, args, 3)).rejects.toMatchObject({ code: '42501' });
  const legacy = (await db.call<GradingClaimV2>('claim_v1')); expect(legacy.attemptId).toBe(id(62));
  await db.call('finish_v1', [id(62), legacy.token, '1', '1']);
  expect((await db.admin.query('select state from assess.sessions where id=$1', [id(62)])).rows[0].state).toBe('graded');
  expect((await claim(db))!.attemptId).toBe(s.attemptId);
 } finally { await db.close(); }
});
it.each(['active', 'grading', 'grading-failed', 'awaiting-manual'])('freeze holds %s: saved text/timers survive and every new transition is blocked', async target => {
 const db = await fixture();
 try {
  let s = await start(db); await command(db, s, save('SYNTHETIC held جواب')); s = await read(db, s);
  let c: GradingClaimV2 | null = null;
  if (target !== 'active') { await command(db, s, { type: 'submit' }, 300); c = await claim(db); }
  if (target === 'grading-failed') await db.call('fail_v2', [s.attemptId, c!.token]);
  if (target === 'awaiting-manual') await finish(db, c!);
  const before = await state(db, s);
  await db.call('freeze_v2'); const frozen = await state(db, s);
  expect(frozen).toMatchObject({ state: 'grading-failed', deadline: before.deadline, started_at: before.started_at, lease: null, lease_until: null });
  expect(frozen.emergency_held_at).toBeInstanceOf(Date);
  expect(await db.call('freeze_v2')).toBe('0');
  expect(await claim(db)).toBeNull();
  await expect(start(db, 101)).rejects.toMatchObject({ code: '55000' });
  await expect(command(db, s, { type: 'submit' }, 301)).rejects.toMatchObject({ code: '55000' });
  await expect(db.call('finish_v2', [s.attemptId, c?.token ?? id(1), '0', '1'])).rejects.toMatchObject({ code: '55000' });
  await expect(db.call('fail_v2', [s.attemptId, c?.token ?? id(1)])).rejects.toMatchObject({ code: '55000' });
  expect((await read(db, s)).ack.state).toBe('grading-failed');
  expect(await state(db, s)).toEqual(frozen);
  expect((await db.admin.query('select answers from assess.session_details')).rows[0].answers.w0.text).toBe('SYNTHETIC held جواب');
  expect((await db.admin.query('select count(*)::int n from assess.manual_work_v1')).rows[0].n).toBe(1);
 } finally { await db.close(); }
});
it('M06 is required, promoted guard and derived marker are exact; required SQL/checks and v1 emergency-stop artifacts are byte-identical to main', () => {
 const base = JSON.parse(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
 expect(manifest.requiredMigrations).toEqual([...base.requiredMigrations, ...base.guardedFeatures.rad062.migrations]); expect(manifest.checks).toEqual([...base.checks.map((p: string) => p === 'supabase/checks/rad085-p1-b-ready.sql' ? 'supabase/checks/rad062-p1-b-ready.sql' : p), 'supabase/checks/rad062-ready.sql']);
 expect(manifest.guardedFeatures.rad062.migrationSha256[file]).toBe(createHash('sha256').update(sql()).digest('hex'));
 expect(manifest.guardedFeatures.rad062.migrations).toContain(file);
 for (const p of [...base.requiredMigrations.map((f: string) => 'supabase/migrations/' + f), ...base.checks,
  'src/features/assess/rad062-availability.ts', 'src/features/supervisor/p1-availability.ts',
  'supabase/manual/assess-emergency-stop.sql', 'supabase/checks/assess-emergency-stopped.sql', 'scripts/assess/emergency-stop-packet.mjs',
  'scripts/assess/emergency-stop-rehearsal.test.mjs', 'docs/RAD-059_PHONE_PACKET.md']) expect(readFileSync(p)).toEqual(p === 'src/features/assess/rad062-availability.ts' ? Buffer.from(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:' + p], { encoding: 'utf8' }).replace('RAD062_AVAILABLE: boolean = false', 'RAD062_AVAILABLE: boolean = true')) : execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:' + p]));
 const expectedMarker = createHash('sha256').update('https://vlacestfruxooznrcjqc.supabase.co\n');
 for (const migration of [...manifest.requiredMigrations].sort()) expectedMarker.update(migration + '\0').update(readFileSync('supabase/migrations/' + migration)).update('\0');
 for (const check of manifest.checks) expectedMarker.update(readFileSync(check));
 const marker = execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' } }).trim();
 expect(marker).toBe('pilot-v1:' + expectedMarker.digest('hex'));
});
