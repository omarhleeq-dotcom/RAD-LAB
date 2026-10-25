/** Deferred SQL contract only; no transport, browser adapter, publication bridge or worker.
 * The owner approved the named deferredMigrations expectation exception on 2026-10-26.
 * Migration source digests are pinned in frontend-schema.json; required SQL/checks stay unchanged.
 */
export const RAD085_MIGRATIONS = [
  '20261026000100_assess_supervisor_scope.sql',
  '20261026000200_assess_authoring_drafts.sql',
  '20261026000300_assess_assignment_review.sql',
] as const;
export const RAD085_BOUNDARY = 'src/features/assess/server-rad085-contracts.ts';
export const RAD085_DEFER_REASON = 'RAD-085 local SQL only; browser integration, approved sharing policy, reviewed publisher bridge and live installation remain deferred.';
export const RAD085_PUBLIC_RPCS = [
  'appointment_v1', 'sharing_consent_v1', 'supervisor_group_v1', 'join_request_v1',
  'join_decide_v1', 'group_leave_v1', 'scope_page_v1', 'draft_save_v1', 'draft_page_v1',
  'assignment_prepare_v1', 'assignment_targets_v1', 'assignment_confirm_v1',
  'assignment_close_v2', 'assignment_page_v2', 'supervisor_results_v1',
] as const;
export type PinnedReference = { key: string; revision: string };
/** RPC envelopes are independent of the fixture DTO. Actor always comes from auth.uid(). */
export type DraftReceipt = { id: string; revision: number; document: unknown; refs: PinnedReference[] };
export type AssignmentReviewReceipt = {
  token: string; draftId: string; draftRevision: number; groupId: string; groupRevision: number;
  versionId: string; sourceDigest: string; targetDigest: string; targetCount: number;
  expiresAt: string; serverNow: string;
};
