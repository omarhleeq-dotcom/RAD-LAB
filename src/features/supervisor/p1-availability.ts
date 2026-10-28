export const P1_MIGRATIONS = [
 '20261026000100_assess_supervisor_scope.sql',
 '20261026000200_assess_authoring_drafts.sql',
 '20261026000300_assess_assignment_review.sql',
 // RAD085-D3-DEFERRED-20261027 / W2: P1 cannot activate without D3.
 '20261027000100_assess_management_erasure.sql',
 // RAD085-P1-B-20261028: names and short codes require the mini DB day.
 '20261028000100_p1_short_codes_names.sql',
] as const;
/** The promotion rule. No environment override, role promotion or probe RPC. */
export function p1Available(schema: { requiredMigrations: readonly string[]; deferredMigrations: object }) {
 return P1_MIGRATIONS.every(file => schema.requiredMigrations.includes(file) && !(file in schema.deferredMigrations));
}
// RAD085-SEC-FIXES-20261027 SEC-04: the only availability switch is this literal, never a
// value read at runtime from the shared, mutable manifest object. The schema gate requires
// it to equal p1Available(frontend-schema.json); the reviewed DB-day promotion updates both.
export const P1_AVAILABLE: boolean = true;
