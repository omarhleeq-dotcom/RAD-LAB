/** UI mirror only. PostgreSQL owns accounting, locking and admission. */
export const AUTHORING_LIMITS_V1 = Object.freeze({ version: 1, drafts: 3, revisions: 10, documentBytes: 65536, warnBytes: 4194304, stopBytes: 8388608, dbWarnBytes: 300000000, dbReviewBytes: 350000000, dbStopBytes: 400000000, cleanupDays: 30, cleanupBatch: 100 });
export function authoringCapacityHint(bytes: number) {
 if (!Number.isSafeInteger(bytes) || bytes < 0) throw Error('invalid_capacity');
 return bytes >= AUTHORING_LIMITS_V1.stopBytes ? 'stop-growth' : bytes >= AUTHORING_LIMITS_V1.warnBytes ? 'warn' : 'normal';
}
