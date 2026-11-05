/** RAD-105 P5: restore witness decision, REST store, worker fail-closed behaviour, and the staged epoch/accept/resume SQL. Synthetic only. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { executeGradingWorker } from './server-worker';
import { gcsWitnessStore, judgeWitness, parseDbWitness, type StoredWitness, type WitnessStore } from './witness';
import { fixture, id } from './selfservice-fixture';

const E1 = '11111111-1111-4111-8111-111111111111', E2 = '22222222-2222-4222-8222-222222222222';
const at = (min: number) => new Date(Date.parse('2026-11-05T10:00:00.000Z') + min * 60000).toISOString();
const dbw = (over: Record<string, unknown> = {}) => parseDbWitness({ epoch: E1, seq: 10, now: at(5), acceptedAt: at(-1000), credentialValidUntil: at(60 * 24 * 100), ...over });
const stored = (over: Partial<StoredWitness> = {}): StoredWitness => ({ projectRef: 'abcdefghijklmnopqrst', epoch: E1, seq: 8, updatedAt: at(0), ...over });
const ref = 'abcdefghijklmnopqrst';

describe('judgeWitness', () => {
 it('initialises, advances, and uses only DB-clock times', () => {
  expect(judgeWitness(ref, dbw(), null)).toMatchObject({ ok: true, action: 'init', next: { seq: 10, updatedAt: at(5) } });
  expect(judgeWitness(ref, dbw(), stored())).toMatchObject({ ok: true, action: 'advance', next: { seq: 10, updatedAt: at(5) } });
  expect(judgeWitness(ref, dbw({ seq: 8 }), stored())).toMatchObject({ ok: true, action: 'advance' }); // equal is fine
 });
 it('fails closed on every anomaly', () => {
  expect(judgeWitness(ref, null, stored())).toEqual({ ok: false, code: 'db-witness-missing' });
  expect(judgeWitness(ref, dbw(), 'unreadable')).toEqual({ ok: false, code: 'witness-unreadable' });
  expect(judgeWitness(ref, dbw(), stored({ projectRef: 'zzzzzzzzzzzzzzzzzzzz' }))).toEqual({ ok: false, code: 'project-mismatch' });
  expect(judgeWitness(ref, dbw({ seq: 7 }), stored())).toEqual({ ok: false, code: 'restore-suspected' }); // database went backwards
  expect(judgeWitness(ref, dbw({ epoch: E2 }), stored())).toEqual({ ok: false, code: 'epoch-mismatch' }); // different epoch, no owner acceptance
  expect(judgeWitness(ref, dbw({ epoch: E2, acceptedAt: at(-5) }), stored())).toEqual({ ok: false, code: 'epoch-mismatch' }); // acceptance older than the witness
 });
 it('adopts a new epoch only after an owner acceptance stamped later by the DB clock', () => {
  expect(judgeWitness(ref, dbw({ epoch: E2, seq: 0, acceptedAt: at(3) }), stored())).toMatchObject({ ok: true, action: 'adopt', next: { epoch: E2, seq: 0, updatedAt: at(5) } });
 });
 it('rejects malformed database witnesses', () => {
  for (const bad of [{}, { epoch: 'x' }, { epoch: E1, seq: -1, now: at(0), acceptedAt: at(0) }, { epoch: E1, seq: 1.5, now: at(0), acceptedAt: at(0) }, { epoch: E1, seq: 1, now: 'x', acceptedAt: at(0) }]) expect(parseDbWitness(bad)).toBeNull();
 });
});

describe('gcsWitnessStore', () => {
 const fetchFor = (script: Array<{ status: number; headers?: Record<string, string>; body?: string }>, seen: Array<{ url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }> = []) => async (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => {
  seen.push({ url, init }); const r = script.shift()!;
  return { status: r.status, headers: { get: (n: string) => r.headers?.[n.toLowerCase()] ?? null }, text: async () => r.body ?? '' };
 };
 it('reads absent as generation 0, reads an object with its generation, and writes with a precondition', async () => {
  const seen: Array<{ url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }> = [];
  const s = gcsWitnessStore('bucket-x', 'witness.json', async () => 'TOKEN', fetchFor([{ status: 404 }, { status: 200, headers: { 'x-goog-generation': '42' }, body: JSON.stringify(stored()) }, { status: 200 }, { status: 412 }], seen));
  expect(await s.read()).toEqual({ value: null, generation: '0' });
  expect(await s.read()).toEqual({ value: stored(), generation: '42' });
  expect(await s.write(stored(), '42')).toBe(true);
  expect(await s.write(stored(), '41')).toBe(false); // precondition failed
  expect(seen[2]!.url).toContain('ifGenerationMatch=42'); expect(seen[2]!.init?.headers?.authorization).toBe('Bearer TOKEN');
 });
 it('anything unexpected is unreadable', async () => {
  for (const r of [{ status: 500 }, { status: 200, body: '{}' }, { status: 200, headers: { 'x-goog-generation': '1' }, body: 'not json' }, { status: 200, headers: { 'x-goog-generation': '1' }, body: JSON.stringify({ ...stored(), extra: 1 }) }])
   expect(await gcsWitnessStore('b', 'o', async () => 't', fetchFor([r])).read()).toBe('unreadable');
  expect(await gcsWitnessStore('b', 'o', async () => { throw Error('no token'); }, fetchFor([])).read()).toBe('unreadable');
 });
});

describe('worker with a witness', () => {
 const config = { host: 'synthetic.invalid', port: 5432, database: 'synthetic', user: 'synthetic_worker', password: 'SYNTHETIC_SECRET', ca: '-----BEGIN CERTIFICATE-----synthetic' };
 const memory = (initial: StoredWitness | null, failWrite = false): WitnessStore & { value: StoredWitness | null } => {
  const m = { value: initial, async read() { return { value: m.value, generation: m.value ? '1' : '0' }; }, async write(v: StoredWitness) { if (failWrite) return false; m.value = v; return true; } };
  return m;
 };
 const make = (calls: string[], witness: unknown) => () => ({ async close() {}, async call<T>(name: string): Promise<T> {
  calls.push(name);
  return ({ maintain_v1: { expired: 0, purged: 0 }, claim_v1: null, health_v1: { failed: 0, alert: 0, overdue: 0, purgeDue: 0, witness } } as Record<string, unknown>)[name] as T;
 } });
 const run = (store: WitnessStore, mode: 'shadow' | 'enforcing', witness: unknown, calls: string[]) =>
  executeGradingWorker(async () => config, new AbortController().signal, async () => {}, make(calls, witness), undefined, { witness: { mode, projectRef: ref, store } });
 const live = { epoch: E1, seq: 10, now: at(5), acceptedAt: at(-1000), credentialValidUntil: at(60 * 24 * 30) };

 it('enforcing: a good witness advances and the run proceeds; the report carries days left and no secret', async () => {
  const store = memory(stored()), calls: string[] = [];
  const r = await run(store, 'enforcing', live, calls);
  expect(r).toMatchObject({ outcome: 'COMPLETE', witness: { mode: 'enforcing', result: 'advance', credentialDaysLeft: 29 } });
  expect(store.value).toMatchObject({ seq: 10, updatedAt: at(5) }); expect(calls).toContain('maintain_v1');
  expect(JSON.stringify(r)).not.toContain('SYNTHETIC_SECRET');
 });
 it.each([
  ['restore', { ...live, seq: 3 }, 'restore-suspected'], ['missing', undefined, 'db-witness-missing'], ['epoch', { ...live, epoch: E2 }, 'epoch-mismatch'],
 ])('enforcing: %s stops before any maintenance or claim', async (_n, w, result) => {
  const store = memory(stored()), calls: string[] = [];
  const r = await run(store, 'enforcing', w, calls);
  expect(r).toMatchObject({ outcome: 'STOP', code: 'restore_suspected', witness: { result }, reconciliationRequired: true });
  expect(calls).toEqual(['health_v1']); expect(store.value).toEqual(stored());
 });
 it('enforcing: an unwritable witness fails closed; shadow records the same result but still grades', async () => {
  const calls: string[] = [];
  expect(await run(memory(stored(), true), 'enforcing', live, calls)).toMatchObject({ outcome: 'STOP', witness: { result: 'witness-write-failed' } });
  const c2: string[] = [], shadow = await run(memory(stored()), 'shadow', { ...live, seq: 3 }, c2);
  expect(shadow).toMatchObject({ outcome: 'COMPLETE', witness: { mode: 'shadow', result: 'restore-suspected' } }); expect(c2).toContain('maintain_v1');
 });
 it('without the option nothing changes', async () => {
  const calls: string[] = [];
  const r = await executeGradingWorker(async () => config, new AbortController().signal, async () => {}, make(calls, undefined));
  expect(r).toMatchObject({ outcome: 'COMPLETE' }); expect(r).not.toHaveProperty('witness'); expect(calls.filter(c => c === 'health_v1')).toHaveLength(1);
 });
});

describe('staged P5 SQL (synthetic PostgreSQL)', () => {
 const sql = () => readFileSync('supabase/staged/self-service/p5-witness.sql', 'utf8');
 it('epoch tick, owner-only accept and resume, ACLs, and hold release', async () => {
  const db = await fixture(['20261030000700_rad062_manual_grading.sql', '20261030000800_rad062_erasure_operations.sql']);
  try {
   await db.admin.query('update assess.launch_gate set enabled=true');
   await expect(db.admin.query(sql())).rejects.toMatchObject({ code: '55000' }); await db.admin.query('rollback; update assess.launch_gate set enabled=false');
   await db.admin.query(sql());
   const h1 = (await db.admin.query('select assess.health_v1() h')).rows[0].h, h2 = (await db.admin.query('select assess.health_v1() h')).rows[0].h;
   expect(Object.keys(h1).sort()).toEqual(['alert', 'failed', 'overdue', 'purgeDue', 'witness']);
   expect(h2.witness.seq).toBe(h1.witness.seq + 1); expect(h2.witness.epoch).toBe(h1.witness.epoch);
   expect(parseDbWitness(h2.witness)).not.toBeNull();
   expect((await db.admin.query("select has_function_privilege('authenticated','assess.health_v1()','EXECUTE') a,has_function_privilege('authenticated','assess.owner_resume_v1(text)','EXECUTE') b,has_table_privilege('authenticated','assess.restore_epoch','SELECT') c,has_function_privilege('assess_worker','assess.health_v1()','EXECUTE') d")).rows[0]).toEqual({ a: false, b: true, c: false, d: true });
   // Accept: owner (user 1) only, typed confirmation, gate closed.
   await expect(db.call('witness_accept_v1', ['ACCEPT RESTORED DATABASE'], 2)).rejects.toMatchObject({ code: '42501' });
   await expect(db.call('witness_accept_v1', ['yes'], 1)).rejects.toMatchObject({ code: '22023' });
   await db.admin.query('update assess.launch_gate set enabled=true');
   await expect(db.call('witness_accept_v1', ['ACCEPT RESTORED DATABASE'], 1)).rejects.toMatchObject({ code: '55000' });
   await db.admin.query('update assess.launch_gate set enabled=false');
   const acc = await db.call<{ epoch: string; acceptedAt: string }>('witness_accept_v1', ['ACCEPT RESTORED DATABASE'], 1);
   expect(acc.epoch).not.toBe(h1.witness.epoch);
   const h3 = (await db.admin.query('select assess.health_v1() h')).rows[0].h;
   expect(h3.witness).toMatchObject({ epoch: acc.epoch, seq: 1 });
   // Resume releases what the stop held, re-enables the slot and reopens the gate.
   await db.admin.query('create role assess_job_b nologin');
   await db.admin.query('update assess.launch_gate set enabled=true');
   const s = await db.call<{ attemptId: string }>('start_v2', [id(51), id(100)], 3);
   await db.admin.query('select assess.freeze_v2()'); await db.admin.query('update assess.launch_gate set enabled=false');
   expect((await db.admin.query('select state,emergency_held_at is not null held from assess.sessions where id=$1', [s.attemptId])).rows[0]).toEqual({ state: 'grading-failed', held: true });
   await expect(db.call('owner_resume_v1', ['RESUME ASSESS'], 2)).rejects.toMatchObject({ code: '42501' });
   await expect(db.call('owner_resume_v1', ['resume'], 1)).rejects.toMatchObject({ code: '22023' });
   const res = await db.call<{ released: number; stillHeld: number; gateOpen: boolean; loginEnabled: boolean }>('owner_resume_v1', ['RESUME ASSESS'], 1);
   expect(res).toEqual({ released: 1, stillHeld: 0, gateOpen: true, loginEnabled: true });
   expect((await db.admin.query('select state,emergency_held_at,retry_at from assess.sessions where id=$1', [s.attemptId])).rows[0]).toEqual({ state: 'grading', emergency_held_at: null, retry_at: null });
   expect((await db.admin.query("select rolcanlogin from pg_roles where rolname='assess_job_b'")).rows[0].rolcanlogin).toBe(true);
  } finally { await db.close(); }
 }, 300000);
});
