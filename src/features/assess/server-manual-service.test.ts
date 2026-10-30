import { expect, it, vi } from 'vitest';
import { manualGradingService } from './server-manual-service';
import { id } from './rad062-test-fixture';
const command = () => ({ schemaVersion: 1, attemptId: id(1), operationId: id(2), expectedGradingRevision: 0,
 scores: [{ item: { id: 'w', version: '1' }, score: '0.000001' }], reason: 'initial' });
it('private service preserves decimal strings and bounded arguments with no actor or retry', async () => {
 const call = vi.fn().mockResolvedValue({}); const service = manualGradingService({ call });
 await service.queue(); expect(call).toHaveBeenLastCalledWith('manual_queue_v1', { p_after: null, p_limit: 20 });
 await service.read(id(1)); expect(call).toHaveBeenLastCalledWith('manual_read_v1', { p_session: id(1) });
 await service.score(JSON.stringify(command()));
 expect(call).toHaveBeenLastCalledWith('manual_score_v1', { p_session: id(1), p_operation: id(2), p_revision: 0, p_scores: command().scores, p_reason: 'initial' });
 await service.finalize(id(1), id(2), 100); expect(call).toHaveBeenLastCalledWith('manual_finalize_v1', { p_session: id(1), p_operation: id(2), p_revision: 100 });
 await service.receipt(id(1)); expect(call).toHaveBeenLastCalledWith('manual_receipt_v1', { p_session: id(1) });
 call.mockRejectedValueOnce({ code: '42501', message: 'private email answer' });
 await expect(service.read(id(1))).rejects.toMatchObject({ code: 'denied', message: 'denied' });
 expect(call).toHaveBeenCalledTimes(6);
});
it('unknown fields, actor injection, malformed decimals, duplicate items, oversized batches/payloads fail before any RPC', () => {
 const call = vi.fn(); const service = manualGradingService({ call });
 const c = command();
 for (const value of [{ ...c, actor: id(3) }, { ...c, schemaVersion: 2 }, { ...c, expectedGradingRevision: 101 },
  { ...c, scores: [] }, { ...c, scores: [c.scores[0], c.scores[0]] }, { ...c, scores: Array.from({ length: 11 }, () => c.scores[0]) },
  ...['01', '1e0', '1.0000001', '-1', 'NaN', '1,5'].map(score => ({ ...c, scores: [{ ...c.scores[0], score }] })),
  { ...c, scores: [{ ...c.scores[0], comment: 'private answer' }] }, { ...c, reason: 'free text' },
  { ...c, scores: [{ item: { id: 'x'.repeat(101), version: '1' }, score: '0' }] }])
  expect(() => service.score(JSON.stringify(value))).toThrow('invalid');
 expect(() => service.score(' '.repeat(65537))).toThrow('invalid');
 expect(() => service.queue(null, 101)).toThrow('invalid');
 expect(() => service.read('invalid')).toThrow('invalid');
 expect(() => service.finalize(id(1), id(2), -1)).toThrow('invalid');
 expect(call).not.toHaveBeenCalled();
});
it.each([['40001', 'conflict'], ['22023', 'invalid'], ['54000', 'limit'], ['55000', 'unavailable'], ['', 'unavailable']])('redacts %s failure without a second call', async (code, expected) => {
 const call = vi.fn().mockRejectedValue({ code, message: 'raw private data' });
 await expect(manualGradingService({ call }).finalize(id(1), id(2), 0)).rejects.toMatchObject({ code: expected, message: expected });
 expect(call).toHaveBeenCalledTimes(1);
});
