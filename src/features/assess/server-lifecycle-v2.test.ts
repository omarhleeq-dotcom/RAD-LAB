import { beforeEach, expect, it, vi } from 'vitest';
import type { AssessmentPublication, PrivateItemVersion } from './server-contracts';
import type { AssessmentPublicationV2, GradingClaimV2 } from './server-contracts-v2';
import type { ItemAnswer } from './contracts';
import { gradePublicationV2 } from './server-grader-v2';
import { gradePublication } from './server-grader';
import { validatePracticalContent } from './server-practical';
import { attemptServiceV2, runAssessJobsV2 } from './server-service-v2';
import { executeGradingWorkerV2 } from './server-worker-v2';
import { mixedFixture } from '../../../scripts/assess/d-fixture';
import { practicalFixture } from '../../../scripts/assess/e-fixture';
import { CASES } from '@/data/cases';
import { leafValues, settingsSpec, validatePublicationV2 } from './server-validation';
const pg = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn(), release: vi.fn(), end: vi.fn(), on: vi.fn(), config: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
 constructor(config: unknown) { pg.config(config); }
 connect = pg.connect; end = pg.end; on = pg.on;
} }));
import { createGradingWorkerBindingV2 } from './server-runtime-v2';
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const config = { host: 'synthetic.invalid', port: 5432, database: 'synthetic', user: 'synthetic_worker', password: 'SYNTHETIC_SECRET', ca: '-----BEGIN CERTIFICATE-----synthetic' };
function publication(written = true): AssessmentPublicationV2 {
 return { schemaVersion: 2, assessment: { schemaVersion: 2, ref: { id: id(10), version: '1' }, name: 'SYNTHETIC', track: 'mixed', maximum: written ? '3.1' : '0.1', policy: { durationSeconds: 3600, maxAttempts: 2, gradeVisibility: 'hidden' }, items: [
  { schemaVersion: 2, ref: { id: 'q', version: '1' }, contentLanguage: 'en', type: 'single-choice', prompt: 'SYNTHETIC', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
  ...(written ? [{ schemaVersion: 2 as const, ref: { id: 'w', version: '1' }, contentLanguage: 'en' as const, type: 'written-answer' as const, prompt: 'SYNTHETIC' }] : [])],
 }, itemMarks: [{ item: { id: 'q', version: '1' }, maximum: '0.1' }, ...(written ? [{ item: { id: 'w', version: '1' }, maximum: '3' }] : [])],
 privateItems: ['q', ...(written ? ['w'] : [])].map(name => ({ schemaVersion: 2, ref: { id: name, version: '1' }, type: name === 'q' ? 'single-choice' : 'written-answer', ...(name === 'q' ? { correctOptionId: 'a' } : {}), provenance: { kind: 'uploader-authored', reviewStatus: 'no-medical-review', authorDisplayName: null, licenceNotes: 'Own synthetic test', sources: [{ reference: 'SYNTHETIC', licenceEvidence: 'Own test' }] } })) as AssessmentPublicationV2['privateItems'] };
}
const claim = (): GradingClaimV2 => ({ attemptId: id(20), token: id(21), publication: publication(), answers: { q: { type: 'single-choice', optionId: 'a' } }, locked: [] });
function asV2(p: AssessmentPublication): AssessmentPublicationV2 {
 return { ...p, schemaVersion: 2, assessment: { ...p.assessment, schemaVersion: 2, items: p.assessment.items.map(i => ({ ...i, schemaVersion: 2 })) } as AssessmentPublicationV2['assessment'],
  privateItems: p.privateItems.map((k: PrivateItemVersion) => { const { review, ...rest } = k; return { ...rest, schemaVersion: 2, provenance: k.type === 'single-choice' ? { kind: 'uploader-authored', reviewStatus: 'no-medical-review', sources: review.sources, licenceNotes: 'Synthetic test only', authorDisplayName: null } : { kind: 'simulator-reviewed', review } }; }) };
}
beforeEach(() => {
 vi.resetAllMocks();
 pg.query.mockImplementation(async (sql: string) => ({ rows: sql.includes('as allowed') ? [{ allowed: true }] : [{ value: null }] }));
 pg.connect.mockImplementation(async () => ({ query: pg.query, release: pg.release, on: vi.fn() }));
 pg.end.mockResolvedValue(undefined);
});
it('automatic subtotal is exact, excludes written items, handles all-written/blank and rejects v1 or unknown/invalid saved answers', () => {
 expect(gradePublicationV2(publication(), claim().answers, [])).toEqual({ numerator: '1', denominator: '10' });
 expect(gradePublicationV2(publication(), {}, [])).toEqual({ numerator: '0', denominator: '1' });
 const all = publication(); all.assessment.items = all.assessment.items.filter(i => i.type === 'written-answer') as typeof all.assessment.items;
 all.itemMarks = all.itemMarks.filter(m => m.item.id === 'w'); all.privateItems = all.privateItems.filter(k => k.type === 'written-answer'); all.assessment.maximum = '3';
 expect(gradePublicationV2(all, {}, [])).toEqual({ numerator: '0', denominator: '1' });
 expect(() => gradePublicationV2({ ...publication(), schemaVersion: 1 } as unknown as AssessmentPublicationV2, {}, [])).toThrow();
 expect(() => gradePublicationV2(publication(), { missing: { type: 'single-choice', optionId: null } }, [])).toThrow();
 expect(() => gradePublicationV2(publication(), { q: { type: 'single-choice', optionId: 'unknown' } }, [])).toThrow();
 expect(() => gradePublicationV2(publication(), {}, ['w'])).toThrow();
});
it('v2 reuses unchanged simulator rubric credit with item-point totals; legacy scaling stays isolated', () => {
 for (const source of [mixedFixture(), practicalFixture()]) {
  const p = asV2(source); const answers: Record<string, ItemAnswer> = {}; const locked: string[] = [];
  for (const k of source.privateItems) {
   if (k.type === 'single-choice') answers[k.ref.id] = { type: 'single-choice', optionId: k.correctOptionId };
   else {
    const c = CASES.find(c => c.id === k.caseRef.id)!;
    const spec = k.type === 'full-practical' ? settingsSpec(c) : Object.fromEntries(k.mutablePaths.map(p => [p, settingsSpec(c)[p]!]));
    answers[k.ref.id] = { type: k.type, values: leafValues(k.type === 'simulator-part' ? k.fixedSettings : c.initialSettings, spec) };
    locked.push(k.ref.id);
   }
  }
  const maximum = source.itemMarks.reduce((n, m) => n + Number(m.maximum), 0).toString();
  source.assessment.maximum = maximum; p.assessment.maximum = maximum;
  const expected = gradePublication(source, answers, locked);
  expect(gradePublicationV2(p, answers, locked)).toEqual(expected);
 }
});
it('v2 student service validates envelope/code-point ceiling, uses only v2 names and redacts SQL failures', async () => {
 const call = vi.fn().mockResolvedValue(null); const service = attemptServiceV2({ call });
 await service.start(id(1), id(2)); await service.read(id(1)); await service.readMixed(id(1)); await service.readPractical(id(1)); await service.result(id(1));
 const command = { schemaVersion: 2, attemptId: id(1), operationId: id(2), expectedRevision: 0, action: { type: 'save', item: { id: 'w', version: '1' }, answer: { type: 'written-answer', text: '😀'.repeat(4000) } } };
 await service.command(JSON.stringify(command));
 expect(call.mock.calls.map(c => c[0])).toEqual(['start_v2', 'read_session_v2', 'read_mixed_session_v2', 'read_practical_session_v2', 'result_v2', 'command_v2']);
 for (const change of [{ schemaVersion: 1 }, { unknown: true }, { expectedRevision: -1 }, { operationId: 'bad' }, { action: { ...command.action, answer: { type: 'written-answer', text: 'ع'.repeat(4001) } } }, { action: { ...command.action, type: 'expose' } }]) expect(() => service.command(JSON.stringify({ ...command, ...change }))).toThrow('invalid');
 call.mockRejectedValue({ code: '42501', message: 'SYNTHETIC_SECRET answer' });
 await expect(service.read(id(1))).rejects.toMatchObject({ code: 'denied', message: 'denied' });
});
it('worker finishes automatic subtotal, marks only local grading failure, and never falls through to v1', async () => {
 const call = vi.fn().mockResolvedValue(null).mockResolvedValueOnce(claim());
 expect(await runAssessJobsV2({ call }, 1)).toEqual({ graded: 1, failed: 0 });
 expect(call.mock.calls.map(c => c[0])).toEqual(['claim_v2', 'finish_v2']);
 expect(call.mock.calls[1]![1]).toEqual({ p_session: id(20), p_token: id(21), p_n: '1', p_d: '10' });
 const bad = claim(); bad.publication = {} as AssessmentPublicationV2;
 call.mockReset().mockResolvedValue(null).mockResolvedValueOnce(bad);
 expect(await runAssessJobsV2({ call })).toEqual({ graded: 0, failed: 1 });
 expect(call.mock.calls.map(c => c[0])).toEqual(['claim_v2', 'fail_v2']);
});
it('uncertain finish ACK stops without fail/recover/replay; an explicit precommit rollback may fail the lease', async () => {
 for (const rolledBack of [false, true]) {
  const call = vi.fn().mockResolvedValue(null).mockResolvedValueOnce(claim()).mockRejectedValueOnce(rolledBack ? { writeOutcome: 'rolled_back' } : Error('SYNTHETIC_SECRET'));
  const observe = vi.fn();
  expect(await runAssessJobsV2({ call }, 2, undefined, { observe })).toEqual({ graded: 0, failed: 1 });
  expect(call.mock.calls.map(c => c[0])).toEqual(rolledBack ? ['claim_v2', 'finish_v2', 'fail_v2', 'claim_v2'] : ['claim_v2', 'finish_v2']);
  if (!rolledBack) expect(observe).toHaveBeenCalledWith({ phase: 'uncertain', milliseconds: 0 });
 }
});
it('STOP or failed host verification after claim quarantines it; no write follows, and close always runs', async () => {
 for (const throws of [false, true]) {
  const stop = new AbortController(); const close = vi.fn();
  const call = vi.fn().mockImplementation(async () => { if (!throws) stop.abort(); return claim(); });
  let checks = 0;
  const verify = async () => { if (++checks === 3 && throws) throw Error('SYNTHETIC_SECRET'); };
  const report = await executeGradingWorkerV2(config, stop.signal, verify, () => ({ call, close }));
  expect(report.outcome).toBe('STOP'); expect(report.reconciliationRequired).toBe(true); expect(close).toHaveBeenCalledOnce();
  expect(call.mock.calls.map(c => c[0])).toEqual(['claim_v2']); expect(JSON.stringify(report)).not.toContain('SYNTHETIC_SECRET');
 }
});
it('v2 runtime requires verified TLS and one dedicated connection, rejects every other RPC before connecting', async () => {
 for (const patch of [{ ca: '' }, { user: 'postgres' }, { host: '/tmp/socket' }, { password: '' }, { connections: 2 }, { sessionPoolerProjectRef: 'abc' }]) expect(() => createGradingWorkerBindingV2({ ...config, ...patch })).toThrow('invalid');
 expect(pg.config).not.toHaveBeenCalled();
 const worker = createGradingWorkerBindingV2(config);
 expect(pg.config).toHaveBeenCalledWith(expect.objectContaining({ ssl: { ca: config.ca, rejectUnauthorized: true }, max: 1 }));
 for (const [name, args] of [['claim_v1', {}], ['maintain_v1', { p_limit: 1 }], ['manual_finalize_v1', {}], ['recover_v2', {}], ['claim_v2();select 1', {}], ['claim_v2', { identity: id(1) }], ['finish_v2', {}], ['fail_v2', { p_session: 'bad', p_token: id(1) }]] as const) await expect(worker.call(name, args)).rejects.toMatchObject({ code: 'invalid' });
 expect(pg.connect).not.toHaveBeenCalled(); await worker.close();
});
it('runtime checks role and exclusive v2 ACL, parameterizes and commits; ACK failure permanently faults the binding without replay', async () => {
 const worker = createGradingWorkerBindingV2(config);
 await worker.call('finish_v2', { p_session: id(1), p_token: id(2), p_n: '1', p_d: '10' });
 expect(pg.query).toHaveBeenCalledWith('set local role assess_grading_worker');
 const acl = pg.query.mock.calls.find(c => String(c[0]).includes('p.oid not in'))![0] as string;
 expect(acl).toContain('assess.finish_v2'); expect(acl).not.toContain('finish_v1'); expect(acl).toContain('has_table_privilege');
 expect(pg.query).toHaveBeenCalledWith('select assess.finish_v2($1::uuid,$2::uuid,$3::text,$4::text) as value', [id(1), id(2), '1', '10']);
 expect(pg.query.mock.calls.at(-1)![0]).toBe('commit');
 pg.query.mockImplementation(async (sql: string) => {
  if (sql === 'commit') throw Error('SYNTHETIC_SECRET');
  return { rows: sql.includes('as allowed') ? [{ allowed: true }] : [{ value: null }] };
 });
 await expect(worker.call('claim_v2', {})).rejects.toMatchObject({ code: 'unavailable' });
 const count = pg.query.mock.calls.length;
 await expect(worker.call('claim_v2', {})).rejects.toMatchObject({ code: 'unavailable' }); expect(pg.query.mock.calls).toHaveLength(count);
 await worker.close();
});
it('runtime refuses unexpected catalog grants or role membership before any claim', async () => {
 for (const stage of ['identity', 'acl']) {
  pg.query.mockImplementation(async (sql: string) => ({ rows: sql.includes('as allowed') ? [{ allowed: !(stage === 'identity' ? sql.includes('session_user = $1') : sql.includes('p.oid not in')) }] : [{ value: null }] }));
  const worker = createGradingWorkerBindingV2(config);
  await expect(worker.call('claim_v2', {})).rejects.toMatchObject({ code: 'denied' });
  expect(pg.query.mock.calls.some(c => c[0] === 'select assess.claim_v2() as value')).toBe(false);
  await worker.close(); pg.query.mockClear();
 }
});
it('actual PostgreSQL executes v2 adapter identity/ACL SQL under a restricted synthetic login; extra v1 grants fail closed', async () => {
 const { rad062Fixture } = await import('./rad062-test-fixture');
 const { readFileSync } = await import('node:fs');
 const db = await rad062Fixture(4);
 try {
  await db.admin.query(readFileSync('supabase/migrations/20261030000500_rad062_manual_foundation_freeze.sql', 'utf8'));
  await db.admin.query("create role assess_grading_worker nologin noinherit; create role synthetic_worker login noinherit valid until '2099-01-01'; grant assess_grading_worker to synthetic_worker with inherit false,set true");
  await db.admin.query(readFileSync('supabase/migrations/20261030000600_rad062_lifecycle_v2.sql', 'utf8'));
  expect((await db.admin.query("select has_function_privilege('assess_grading_worker','assess.claim_v2()','execute') ok")).rows[0].ok).toBe(false);
  // Test-only capabilities in this disposable database, never installed by M06.
  await db.admin.query('revoke create,temporary on database postgres from public; grant usage on schema assess to assess_grading_worker; grant execute on function assess.claim_v2(),assess.finish_v2(uuid,uuid,text,text),assess.fail_v2(uuid,uuid) to assess_grading_worker');
  const c = await db.connect('p06-adapter', 'synthetic_worker');
  pg.connect.mockResolvedValue({ query: c.query.bind(c), on: vi.fn(), release: vi.fn() });
  const worker = createGradingWorkerBindingV2(config);
  expect(await worker.call('claim_v2', {})).toBeNull();
  const source = practicalFixture(); source.assessment.maximum = '10';
  const pub = asV2(source), { specs } = validatePublicationV2(pub);
  await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$3,'1',$4,'full-practical',2,true)", [id(70), id(2), pub.assessment.ref.id, pub.assessment.name]);
  await db.admin.query('insert into assess.publications(version_id,document,specs) values($1,$2,$3)', [id(70), pub, specs]);
  await db.admin.query('insert into assess.practical_presentations values($1,$2)', [id(70), validatePracticalContent(source).views]);
  await db.admin.query('insert into assess.assignments(id,owner_id,version_id) values($1,$2,$3)', [id(71), id(2), id(70)]);
  await db.admin.query('insert into assess.targets values($1,$2)', [id(71), id(3)]);
  await db.rpc(3, 'consent_v2', ['assess-pilot-2026-10-20-v2']);
  await db.admin.query('update assess.launch_gate set enabled=true');
  const started = await db.call<{ attemptId: string }>('start_v2', [id(71), id(72)], 3);
  // RAD-060 closure still permits reading and settling an existing attempt.
  await db.admin.query('update assess.assignments set closed_at=clock_timestamp() where id=$1', [id(71)]);
  const dto = await db.call('read_practical_session_v2', [started.attemptId], 3);
  expect(JSON.stringify(dto)).not.toMatch(/privateItems|provenance|reviewedBy/);
  await expect(db.call('start_v2', [id(71), id(73)], 3)).rejects.toMatchObject({ code: '42501' });
  await db.call('command_v2', [started.attemptId, id(74), 0, { type: 'submit' }], 3);
  const automatic = (await worker.call<GradingClaimV2>('claim_v2', {}));
  expect(automatic.attemptId).toBe(started.attemptId);
  const grade = gradePublicationV2(automatic.publication, automatic.answers, automatic.locked);
  await worker.call('finish_v2', { p_session: automatic.attemptId, p_token: automatic.token, p_n: grade.numerator, p_d: grade.denominator });
  expect(await db.call('result_v2', [started.attemptId], 3)).toMatchObject({ grade: { visibility: 'hidden' } });
  expect((await db.admin.query('select count(*)::int n from assess.session_details')).rows[0].n).toBe(0);
  await worker.close();
  await db.admin.query('grant execute on function assess.finish_v1(uuid,uuid,text,text) to assess_grading_worker');
  const unsafe = createGradingWorkerBindingV2(config);
  await expect(unsafe.call('claim_v2', {})).rejects.toMatchObject({ code: 'denied' }); await unsafe.close();
 } finally { await db.close(); }
}, 30000);
