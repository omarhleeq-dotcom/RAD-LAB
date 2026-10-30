/** Private, dormant owner-first grading. No student identity or email contract. */
export interface ManualScore {
 item: { id: string; version: string };
 score: string;
}
export interface ManualScoreCommand {
 schemaVersion: 1;
 attemptId: string;
 operationId: string;
 expectedGradingRevision: number;
 scores: ManualScore[];
 reason: 'initial' | 'correction' | 'owner-takeover';
}
export interface ManualAck { operationId: string; gradingRevision: number }
export interface ManualQueue {
 rows: { id: string; assignment_id: string; submitted_at: string; finalize_before: string; grading_revision: number }[];
 next: string | null;
}
export interface ManualRead {
 attemptId: string; gradingRevision: number; operationCount: number; finalizeBefore: string;
 items: { item: ManualScore['item']; prompt: string; maximum: string; answer: string; score: string | null }[];
}
/** Same expiry as FinalResult via the session FK; no scores, text or digests. */
export interface ManualFinalReceipt {
 session_id: string; final_operation_id: string;
 expected_grading_revision: number; final_grading_revision: number;
 finalized_at: string; final_grader_id: string | null;
 operation_count: number; grader_count: number; outcome: 'finalized'; policy_version: 1;
}
