/** Node-only port, unconnected to UI/runtime. SQL derives authority from auth.uid().
 * The caller supplies a verified user-bound RPC, never an automatic-worker key.
 * Uncertain ACK: read/replay the same operation; never retry with a new ID.
 */
import { AssessServiceError, type AssessRpc } from './server-service';
import type { ManualAck, ManualFinalReceipt, ManualQueue, ManualRead, ManualScoreCommand } from './server-manual-contracts';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const revision = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100;
const keys = (v: unknown, expected: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const ref = (v: unknown) => typeof v === 'string' && v.length > 0 && Array.from(v).length <= 100;
export function manualGradingService(user: AssessRpc) {
 const call = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
  try { return await user.call<T>(name, args); } catch (error) {
   const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
   throw new AssessServiceError(({ '42501': 'denied', '40001': 'conflict', '22023': 'invalid', '54000': 'limit' } as Record<string, string>)[code] ?? 'unavailable');
  }
 };
 const read = <T>(name: string, attempt: string) => {
  if (!uuid(attempt)) throw new AssessServiceError('invalid');
  return call<T>(name, { p_session: attempt });
 };
 return {
  queue(after: string | null = null, limit = 20) {
   if ((after !== null && !uuid(after)) || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AssessServiceError('invalid');
   return call<ManualQueue>('manual_queue_v1', { p_after: after, p_limit: limit });
  },
  read: (attempt: string) => read<ManualRead>('manual_read_v1', attempt),
  receipt: (attempt: string) => read<ManualFinalReceipt | null>('manual_receipt_v1', attempt),
  score(raw: string) {
   let c: ManualScoreCommand;
   try {
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > 65536) throw Error();
    const value: unknown = JSON.parse(raw);
    if (!keys(value, ['schemaVersion', 'attemptId', 'operationId', 'expectedGradingRevision', 'scores', 'reason']) ||
     value.schemaVersion !== 1 || !uuid(value.attemptId) || !uuid(value.operationId) || !revision(value.expectedGradingRevision) ||
     !['initial', 'correction', 'owner-takeover'].includes(String(value.reason)) || !Array.isArray(value.scores) || value.scores.length < 1 || value.scores.length > 10) throw Error();
    const seen = new Set<string>();
    for (const score of value.scores) {
     if (!keys(score, ['item', 'score']) || !keys(score.item, ['id', 'version']) || !ref(score.item.id) || !ref(score.item.version) ||
      typeof score.score !== 'string' || !/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(score.score)) throw Error();
     const identity = JSON.stringify([score.item.id, score.item.version]); if (seen.has(identity)) throw Error(); seen.add(identity);
    }
    c = value as unknown as ManualScoreCommand;
   } catch { throw new AssessServiceError('invalid'); }
   return call<ManualAck>('manual_score_v1', { p_session: c.attemptId, p_operation: c.operationId, p_revision: c.expectedGradingRevision, p_scores: c.scores, p_reason: c.reason });
  },
  finalize(attempt: string, operation: string, expectedGradingRevision: number) {
   if (!uuid(attempt) || !uuid(operation) || !revision(expectedGradingRevision)) throw new AssessServiceError('invalid');
   return call<ManualFinalReceipt>('manual_finalize_v1', { p_session: attempt, p_operation: operation, p_revision: expectedGradingRevision });
  },
 };
}
