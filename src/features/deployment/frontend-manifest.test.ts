import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

// Owner-reviewed literal contract. Never construct this expectation from the live manifest.
it('pins all required/deferred migrations, checks and the promoted marker', () => {
 const manifest = JSON.parse(readFileSync('scripts/pages/frontend-schema.json', 'utf8'));
 expect(manifest.requiredMigrations).toEqual([
  '20261015000100_pilot_accounts.sql',
  '20261016000100_owner_list_participants.sql',
  '20261017000100_attempts.sql',
  '20261018000100_consent.sql',
  '20261019000100_feedback.sql',
  '20261020000100_scale_read_foundation.sql',
  '20261020000200_owner_paged_reads.sql',
  '20261020000300_pilot_record_contracts.sql',
  '20261020000400_training_dashboard.sql',
  '20261020000500_practice_comparison.sql',
  '20261020000600_assess_assignments.sql',
  '20261020000700_assess_lifecycle.sql',
  '20261020000800_assess_mixed_ui.sql',
  '20261020000900_assess_practical_ui.sql',
  '20261020001000_assess_history_consent.sql',
  '20261020001100_assess_retention.sql',
  '20261024000100_owner_dashboard.sql',
  '20261024000200_owner_deletion_surveys.sql',
  '20261026000100_assess_supervisor_scope.sql',
  '20261026000200_assess_authoring_drafts.sql',
  '20261026000300_assess_assignment_review.sql',
  '20261027000100_assess_management_erasure.sql',
  '20261028000100_p1_short_codes_names.sql',
  '20261030000100_rad062_full_name.sql',
  '20261030000200_rad062_provenance_v2.sql',
  '20261030000300_rad062_authoring_limits.sql',
  '20261030000400_rad062_random_pool.sql',
  '20261030000500_rad062_manual_foundation_freeze.sql',
  '20261030000600_rad062_lifecycle_v2.sql',
  '20261030000700_rad062_manual_grading.sql',
  '20261030000800_rad062_erasure_operations.sql',
  '20261102000100_rad062_supervisor_grading_authorization.sql',
 ]);
 expect(manifest.deferredMigrations).toEqual({"20261102000200_rad059_emergency_alternate.sql":{"sha256":"4246d046edc0913adbed66992263226cdcc11ef92bd60895155c245ad4f9f610","reason":"RAD-059 dormant until a later owner apply window and separate promotion; request phases use the existing authenticated timeout.","serverModules":["src/features/assess/rad059-alternate.test.ts"]},"20261102000300_rad085_rights_write_disclosures.sql":{"sha256":"707362db6890b027bcfee29c07f644fdb207d58e56d52803a4dab0a0dd1baee1","reason":"RAD-085 R1/R2/S1/P2/P3 deferred after 0200; owner must approve S1 values and EN/AR disclosure drafts before the laptop window.","serverModules":["src/features/assess/rad085-review-fixes.test.ts"]}});
 expect(manifest.checks).toEqual([
  'supabase/checks/training-ready.sql',
  'supabase/checks/comparison-ready.sql',
  'supabase/checks/assess-mixed-ready.sql',
  'supabase/checks/assess-practical-ready.sql',
  'supabase/checks/rad062-p1-b-m09-ready.sql',
  'supabase/checks/assess-history-ready.sql',
  'supabase/checks/assess-retention-ready.sql',
  'supabase/checks/owner-dashboard-ready.sql',
  'supabase/checks/owner-deletion-surveys-ready.sql',
  'supabase/checks/rad062-m09-ready.sql',
 ]);
 expect(execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], {
  encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' },
 }).trim()).toBe('pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3');
});
