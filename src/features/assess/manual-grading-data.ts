import type { SupabaseClient } from '@supabase/supabase-js';
import { getPilotClient } from '../pilot/client';
import type { ManualAck, ManualFinalReceipt, ManualQueue, ManualRead, ManualScoreCommand } from './server-manual-contracts';

export type GradingIssue = 'denied' | 'conflict' | 'invalid' | 'limit' | 'closed' | 'unavailable';
export class GradingError extends Error {
 constructor(public readonly kind: GradingIssue, public readonly uncertain = kind === 'unavailable') { super(kind); }
}
export interface ManualTransport {
 call<T>(name: string, args: Record<string, unknown>): Promise<T>;
}
export interface ManualGradingPort {
 queue(after?: string | null, limit?: number): Promise<ManualQueue>;
 read(attempt: string): Promise<ManualRead>;
 score(command: ManualScoreCommand): Promise<ManualAck>;
 finalize(attempt: string, operation: string, revision: number): Promise<ManualFinalReceipt>;
 receipt(attempt: string): Promise<ManualFinalReceipt | null>;
}
const uuid = (s: string) => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
export function createManualGradingPort(transport: ManualTransport): ManualGradingPort {
 const call = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
  try { return await transport.call<T>(name, args); }
  catch (error) {
   const rawCode = error && typeof error === 'object' && 'code' in error ? error.code : null;
   const code = rawCode == null ? '' : String(rawCode);
   // A coded response is a definite rejection, including unknown SQLSTATEs.
   // Only a missing response/code can leave the write's acknowledgement uncertain.
   throw new GradingError(({ '42501': 'denied', '40001': 'conflict', '22023': 'invalid', '54000': 'limit', '55000': 'closed' } as Record<string, GradingIssue>)[code] ?? 'unavailable', !code);
  }
 };
 const read = <T>(name: string, attempt: string) => {
  if (!uuid(attempt)) throw new GradingError('invalid');
  return call<T>(name, { p_session: attempt });
 };
 return {
  queue(after = null, limit = 20) {
   if ((after !== null && !uuid(after)) || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new GradingError('invalid');
   return call('manual_queue_v1', { p_after: after, p_limit: limit });
  },
  read: attempt => read('manual_read_v1', attempt),
  receipt: attempt => read('manual_receipt_v1', attempt),
  score: c => call('manual_score_v1', { p_session: c.attemptId, p_operation: c.operationId, p_revision: c.expectedGradingRevision, p_scores: c.scores, p_reason: c.reason }),
  finalize: (attempt, operation, revision) => call('manual_finalize_v1', { p_session: attempt, p_operation: operation, p_revision: revision }),
 };
}
export async function connectManualGrading(actor: string, invalidate: () => void) {
 const client: SupabaseClient | null = await getPilotClient();
 if (!client) throw new GradingError('unavailable');
 const { data } = client.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session || session.user.id !== actor) invalidate();
 });
 return {
  port: createManualGradingPort({ async call<T>(name: string, args: Record<string, unknown>) {
   const { data, error } = await client.schema('assess').rpc(name, args);
   if (error) throw error;
   return data as T;
  } }),
  close: () => data.subscription.unsubscribe(),
 };
}
