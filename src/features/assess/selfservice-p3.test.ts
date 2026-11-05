/** RAD-105 P3: bounded batch for the scheduled worker; default behaviour unchanged. Synthetic, no database. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { executeGradingWorker } from './server-worker';
import { mixedFixture } from '../../../scripts/assess/d-fixture';

const config = { host: 'synthetic.invalid', port: 5432, database: 'synthetic', user: 'synthetic_worker', password: 'SYNTHETIC_SECRET', ca: '-----BEGIN CERTIFICATE-----synthetic' };
function fake(pending: number, delayMs = 0) {
 const calls: Array<{ name: string; args: unknown }> = []; let left = pending;
 return { calls, make: () => ({ async close() {}, async call<T>(name: string, args?: unknown): Promise<T> {
  calls.push({ name, args });
  if (name === 'claim_v1') { if (delayMs) await new Promise(r => setTimeout(r, delayMs)); if (left <= 0) return null as T; left--; return { attemptId: 'private', token: 'private', publication: mixedFixture(), answers: {}, locked: [] } as T; }
  return ({ maintain_v1: { expired: 0, purged: 0 }, finish_v1: null, health_v1: { failed: 0, alert: 0, overdue: 0, purgeDue: 0 } } as Record<string, unknown>)[name] as T;
 } }) };
}
const run = (f: ReturnType<typeof fake>, options?: { batch?: number; budgetMs?: number }, signal = new AbortController().signal) =>
 executeGradingWorker(async () => config, signal, async () => {}, f.make, undefined, options);
const claims = (f: ReturnType<typeof fake>) => f.calls.filter(c => c.name === 'claim_v1').length;

it('without options a run still grades at most one attempt (existing contract)', async () => {
 const f = fake(25); const r = await run(f);
 expect(r).toMatchObject({ outcome: 'COMPLETE', counts: { graded: 1 } }); expect(r).not.toHaveProperty('batch');
 expect(f.calls.find(c => c.name === 'maintain_v1')!.args).toEqual({ p_limit: 1 });
});
it('batch 20 grades up to 20, stops at the cap, and widens maintenance independently', async () => {
 const f = fake(25); const r = await run(f, { batch: 20, budgetMs: 60_000 });
 expect(r).toMatchObject({ outcome: 'COMPLETE', batch: 20, counts: { graded: 20 } }); expect(claims(f)).toBe(20);
 expect(f.calls.find(c => c.name === 'maintain_v1')!.args).toEqual({ p_limit: 100 });
});
it('an idle run claims once and exits', async () => {
 const f = fake(0); const r = await run(f, { batch: 20, budgetMs: 60_000 });
 expect(r).toMatchObject({ outcome: 'COMPLETE', counts: { graded: 0 } }); expect(claims(f)).toBe(1);
});
it('the time budget stops new claims; finished claims are still finalised', async () => {
 const f = fake(20, 40); const r = await run(f, { batch: 20, budgetMs: 100 });
 const graded = (r.counts as { graded: number }).graded;
 expect(graded).toBeGreaterThanOrEqual(1); expect(graded).toBeLessThan(20);
 expect(f.calls.filter(c => c.name === 'finish_v1').length).toBe(graded); expect(claims(f)).toBe(graded);
});
it('STOP still wins in batch mode', async () => {
 const stop = new AbortController(); stop.abort(); const f = fake(5);
 expect(await run(f, { batch: 20, budgetMs: 1000 }, stop.signal)).toMatchObject({ code: 'stopped' }); expect(claims(f)).toBe(0);
});
it('the staged scheduled entry differs from the reviewed W4 entry only by the options and its header', () => {
 const main = readFileSync('scripts/assess/grading-worker-main.mjs', 'utf8'), staged = readFileSync('supabase/staged/self-service/p3-grading-worker-main.mjs', 'utf8');
 const normal = staged.replace(/^\/\/ STAGED[^\n]*\n\/\/ Promotion[^\n]*\n/, '').replace('  }, undefined, undefined, { batch: 20, budgetMs: 240_000 });', '  });');
 expect(normal).toBe(main);
 expect(staged).toContain('{ batch: 20, budgetMs: 240_000 }');
});
