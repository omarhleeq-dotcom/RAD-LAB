import { describe, expect, it } from 'vitest';
import { ManualGradingController, validManualScore } from './manual-grading';
import { createManualGradingPort, GradingError, type ManualGradingPort } from './manual-grading-data';
import type { ManualFinalReceipt, ManualRead, ManualScoreCommand } from './server-manual-contracts';
export const attempt = '11111111-1111-1111-1111-111111111111';
export function syntheticPort() {
 const read: ManualRead = { attemptId: attempt, gradingRevision: 0, operationCount: 0, finalizeBefore: new Date(Date.now() + 3600000).toISOString(), items: [{ item: { id: 'w0', version: '1' }, prompt: '  Question <b> حرفي\n\t', answer: '  Original e\u0301 😀 <script>alert(1)</script>\n\t RTL العربية and LTR  ', maximum: '3.000001', score: null }] };
 let receipt: ManualFinalReceipt | null = null, drop = false, deny = false;
 const commands: ManualScoreCommand[] = [], replay = new Map<string, number>();
 const port: ManualGradingPort = {
  async queue(after = null, limit = 20) { if (deny) throw new GradingError('denied'); return { rows: after ? [] : [{ id: attempt, assignment_id: '22222222-2222-2222-2222-222222222222', submitted_at: new Date().toISOString(), finalize_before: read.finalizeBefore, grading_revision: read.gradingRevision }].slice(0, limit), next: after ? null : attempt }; },
  async read() { if (deny) throw new GradingError('denied'); if (receipt) throw new GradingError('unavailable'); return structuredClone(read); },
  async receipt() { if (deny) throw new GradingError('denied'); return receipt; },
  async score(command) {
   commands.push(structuredClone(command));
   if (deny) throw new GradingError('denied');
   if (receipt) throw new GradingError('unavailable');
   if (replay.has(command.operationId)) return { operationId: command.operationId, gradingRevision: replay.get(command.operationId)! };
   if (command.expectedGradingRevision !== read.gradingRevision) throw new GradingError('conflict');
   if (read.operationCount >= 100) throw new GradingError('limit');
   read.items[0]!.score = command.scores[0]!.score; read.gradingRevision++; read.operationCount++; replay.set(command.operationId, read.gradingRevision);
   if (drop) { drop = false; throw new GradingError('unavailable'); }
   return { operationId: command.operationId, gradingRevision: read.gradingRevision };
  },
  async finalize(_, operation, revision) {
   if (deny) throw new GradingError('denied');
   receipt ??= { session_id: attempt, final_operation_id: operation, expected_grading_revision: revision, final_grading_revision: revision + 1, finalized_at: new Date().toISOString(), final_grader_id: '33333333-3333-3333-3333-333333333333', operation_count: read.operationCount, grader_count: 1, outcome: 'finalized', policy_version: 1 };
   if (drop) { drop = false; throw new GradingError('unavailable'); } return receipt;
  },
 };
 return { port, read, commands, drop: () => { drop = true; }, deny: () => { deny = true; } };
}
describe('manual grading controller', () => {
 it('compares exact decimal micro-points without rounding', () => {
  expect(validManualScore('3.000001', '3.000001')).toBe(true);
  for (const value of ['3.000002', '-1', '1e0', ' 1', '0.0000001', 'NaN', '١']) expect(validManualScore(value, '3.000001')).toBe(false);
 });
 it('pages without hiding server rows and preserves verbatim text', async () => {
  const f = syntheticPort(), c = new ManualGradingController(f.port, false, () => {});
  await c.queue(); await c.queue(true); expect(c.state.queue?.rows).toHaveLength(1); expect(c.state.queue?.next).toBeNull();
  await c.open(attempt); expect(c.state.read?.items[0]?.answer).toBe(f.read.items[0]?.answer);
 });
 it('replays the identical operation and payload after a committed score loses its ACK', async () => {
  const f = syntheticPort(), c = new ManualGradingController(f.port, false, () => {});
  await c.open(attempt); c.edit(0, '1.000001'); f.drop(); await c.save();
  const pending = structuredClone(c.state.pending); expect(pending?.kind).toBe('score');
  c.edit(0, '2'); await c.save(); expect(f.commands).toHaveLength(1);
  c.suspend(); expect(c.state.read).toBeNull(); expect(c.state.drafts).toEqual([]); expect(c.state.pending).toEqual(pending);
  await c.refresh(); await c.retry(); expect(f.commands).toHaveLength(2); expect(f.commands[0]).toEqual(f.commands[1]); expect(f.read.operationCount).toBe(1); expect(c.state.pending).toBeNull();
 });
 it('refreshes the current revision on conflict and clears answers on denied', async () => {
  const f = syntheticPort(), c = new ManualGradingController(f.port, false, () => {});
  await c.open(attempt); c.edit(0, '1'); f.read.gradingRevision = 3; f.read.items[0]!.score = '2';
  await c.save(); expect(c.state.issue).toBe('conflict'); expect(c.state.read?.gradingRevision).toBe(3); expect(c.state.drafts).toEqual(['2']);
  f.deny(); await c.refresh(); expect(c.state.issue).toBe('denied'); expect(c.state.read).toBeNull(); expect(c.state.drafts).toEqual([]); expect(c.state.queue).toBeNull();
 });
 it('requires explicit owner takeover and finalizes at the cap, including a lost finalize ACK', async () => {
  const f = syntheticPort(), c = new ManualGradingController(f.port, true, () => {});
  await c.open(attempt); c.edit(0, '0'); await c.save(); expect(f.commands).toEqual([]);
  c.confirmTakeover(true); await c.save(); expect(f.commands[0]?.reason).toBe('owner-takeover');
  f.read.operationCount = 100; f.read.gradingRevision = 100; await c.refresh(); c.edit(0, '1'); await c.save(); expect(f.commands).toHaveLength(1);
  await c.refresh(); f.drop(); await c.finalize(); expect(c.state.receipt?.operation_count).toBe(100); expect(c.state.read).toBeNull();
  c.edit(0, '2'); await c.save(); expect(f.commands).toHaveLength(1);
 });
 it('racing final result is shown as final after a rejected score', async () => {
  const f = syntheticPort(), c = new ManualGradingController(f.port, false, () => {});
  await c.open(attempt); c.edit(0, '1'); await f.port.finalize(attempt, crypto.randomUUID(), 0); await c.save(); expect(c.state.receipt?.outcome).toBe('finalized'); expect(c.state.read).toBeNull();
 });
 it('ignores an in-flight read after invalidation', async () => {
  const f = syntheticPort(); let release!: () => void;
  const delayed = { ...f.port, read: async () => { await new Promise<void>(r => { release = r; }); return f.read; } };
  const c = new ManualGradingController(delayed, false, () => {}); const pending = c.open(attempt);
  await Promise.resolve(); c.clear(); release(); await pending; expect(c.state.read).toBeNull();
 });
});
it('browser adapter calls only the five public RPCs and maps errors without exposing their text', async () => {
 const calls: { name: string; args: Record<string, unknown> }[] = [];
 const p = createManualGradingPort({ async call<T>(name: string, args: Record<string, unknown>) { calls.push({ name, args }); return null as T; } });
 await p.queue(null, 100); await p.read(attempt); await p.receipt(attempt); await p.finalize(attempt, attempt, 0);
 expect(calls.map(c => c.name)).toEqual(['manual_queue_v1', 'manual_read_v1', 'manual_receipt_v1', 'manual_finalize_v1']);
 expect(() => p.queue(null, 101)).toThrow('invalid');
 for (const [code, kind] of Object.entries({ '42501': 'denied', '40001': 'conflict', '22023': 'invalid', '54000': 'limit', '55000': 'closed', 'XX000': 'unavailable', '': 'unavailable' })) {
  const broken = createManualGradingPort({ async call() { throw { code, message: 'private identity' }; } });
  await expect(broken.read(attempt)).rejects.toMatchObject({ kind, message: kind, uncertain: !code });
 }
});
