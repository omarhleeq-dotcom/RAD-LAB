import manifest from '../../../scripts/pages/frontend-schema.json';

export const P1_MIGRATIONS = [
 '20261026000100_assess_supervisor_scope.sql',
 '20261026000200_assess_authoring_drafts.sql',
 '20261026000300_assess_assignment_review.sql',
 // RAD085-D3-DEFERRED-20261027 / W2: P1 cannot activate without D3.
 '20261027000100_assess_management_erasure.sql',
] as const;
/** The only availability switch. No environment override, role promotion or probe RPC. */
export function p1Available(schema: { requiredMigrations: readonly string[]; deferredMigrations: object }) {
 return P1_MIGRATIONS.every(file => schema.requiredMigrations.includes(file) && !(file in schema.deferredMigrations));
}
export const P1_AVAILABLE = p1Available(manifest);
