/** Dormant Node ports only. No browser consumer or provider/scheduler wiring. */
import type { AttemptCommandV2 } from './contracts-v2';
import type { GradingClaimV2 } from './server-contracts-v2';
import { AssessServiceError, type AssessRpc, type JobControls } from './server-service';
import { gradePublicationV2 } from './server-grader-v2';
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
async function safe<T>(run: () => Promise<T>): Promise<T> {
 try { return await run(); } catch (e) {
  const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
  throw new AssessServiceError(({ '42501': 'denied', '40001': 'conflict', '22023': 'invalid', '54000': 'limit' } as Record<string, string>)[code] ?? 'unavailable');
 }
}
export function attemptServiceV2(user: AssessRpc) {
 const read = (name: string, attempt: string) => {
  if (!uuid(attempt)) throw new AssessServiceError('invalid');
  return safe(() => user.call(name, { p_session: attempt }));
 };
 return {
  start(assignment: string, operation: string) {
   if (!uuid(assignment) || !uuid(operation)) throw new AssessServiceError('invalid');
   return safe(() => user.call('start_v2', { p_assignment: assignment, p_operation: operation }));
  },
  read: (attempt: string) => read('read_session_v2', attempt),
  readMixed: (attempt: string) => read('read_mixed_session_v2', attempt),
  readPractical: (attempt: string) => read('read_practical_session_v2', attempt),
  result: (attempt: string) => read('result_v2', attempt),
  command(raw: string) {
   if (Buffer.byteLength(raw) > 65536) throw new AssessServiceError('invalid');
   let c: AttemptCommandV2;
   try {
    c = JSON.parse(raw);
    if (!c || Object.keys(c).some(k => !['schemaVersion', 'attemptId', 'operationId', 'expectedRevision', 'action'].includes(k)) ||
     c.schemaVersion !== 2 || !uuid(c.attemptId) || !uuid(c.operationId) || !Number.isSafeInteger(c.expectedRevision) || c.expectedRevision < 0 ||
     !c.action || typeof c.action !== 'object') throw Error();
    const a = c.action;
    if (a.type === 'submit') { if (Object.keys(a).length !== 1) throw Error(); }
    else {
     if (!['save', 'expose'].includes(a.type) || Object.keys(a).some(k => !['type', 'item', 'answer'].includes(k)) ||
      !a.item || typeof a.item.id !== 'string' || typeof a.item.version !== 'string' || Object.keys(a.item).length !== 2 || !a.answer) throw Error();
     if (a.answer.type === 'written-answer' && (a.type === 'expose' || Object.keys(a.answer).length !== 2 || typeof a.answer.text !== 'string' || Array.from(a.answer.text).length > 4000)) throw Error();
    }
   } catch { throw new AssessServiceError('invalid'); }
   return safe(() => user.call('command_v2', { p_session: c.attemptId, p_operation: c.operationId, p_revision: c.expectedRevision, p_action: c.action }));
  },
 };
}
/** Bounded automatic worker. P8 supplies maintenance/health/recovery separately.
 * Uncertain finish ACK halts the tick: never fail/recover/retry after that ACK. */
export async function runAssessJobsV2(worker: AssessRpc, limit = 1, signal?: AbortSignal, controls?: JobControls) {
 if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AssessServiceError('invalid');
 let graded = 0, failed = 0;
 const emit = (phase: 'grade' | 'uncertain' | 'stop', milliseconds = 0) => { try { controls?.observe?.({ phase, milliseconds }); } catch { /* Metadata-only observation cannot change writes. */ } };
 for (let i = 0; i < limit; i++) {
  await controls?.verify?.();
  if (signal?.aborted) { emit('stop'); break; }
  const claim = await safe(() => worker.call<GradingClaimV2 | null>('claim_v2', {})); if (!claim) break;
  await controls?.verify?.();
  if (signal?.aborted) { emit('stop'); break; }
  let grade: ReturnType<typeof gradePublicationV2>;
  const began = performance.now();
  try { grade = gradePublicationV2(claim.publication, claim.answers, claim.locked); }
  catch {
   await controls?.verify?.(); if (signal?.aborted) { emit('stop'); break; }
   try { await worker.call('fail_v2', { p_session: claim.attemptId, p_token: claim.token }); } catch { /* Lease governs reconciliation. */ }
   failed++; continue;
  }
  emit('grade', performance.now() - began);
  await controls?.verify?.();
  if (signal?.aborted) { emit('stop'); break; }
  try {
   await worker.call('finish_v2', { p_session: claim.attemptId, p_token: claim.token, p_n: grade.numerator, p_d: grade.denominator }); graded++;
  } catch (e) {
   failed++;
   if (e && typeof e === 'object' && 'writeOutcome' in e && e.writeOutcome === 'rolled_back') {
    await controls?.verify?.(); if (signal?.aborted) { emit('stop'); break; }
    try { await worker.call('fail_v2', { p_session: claim.attemptId, p_token: claim.token }); } catch { /* No raw errors. */ }
   } else { emit('uncertain'); break; }
  }
 }
 return { graded, failed };
}
