import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {EMERGENCY_AVAILABLE} from '../emergency/availability';
import {RAD085_REVIEW_AVAILABLE,ASSESS_WRITTEN_CONSENT_VERSION} from '../assess/review-availability';
import {CONSENT_VERSION} from '../pilot/consent';

// Owner-reviewed literal contract. Never construct this expectation from the live manifest.
it('pins all required/deferred migrations, checks and the promoted marker', () => {
 expect(EMERGENCY_AVAILABLE).toBe(true);
 expect(RAD085_REVIEW_AVAILABLE).toBe(true);
 expect(ASSESS_WRITTEN_CONSENT_VERSION).toBe('assess-written-2026-11-02-v3');
 expect(CONSENT_VERSION).toBe('2026-11-02');
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
  '20261102000200_rad059_emergency_alternate.sql',
  '20261102000300_rad085_rights_write_disclosures.sql',
 ]);
 expect(manifest.deferredMigrations).toEqual({}); // Owner-approved window promotion: restore the exact empty deferred pin.
 expect(manifest.checks).toEqual([
  'supabase/checks/training-ready.sql',
  'supabase/checks/comparison-ready.sql',
  'supabase/checks/assess-mixed-ready.sql',
  'supabase/checks/assess-practical-ready.sql',
  'supabase/checks/rad085-review-ready.sql',
  'supabase/checks/assess-history-ready.sql',
  'supabase/checks/assess-retention-ready.sql',
  'supabase/checks/owner-dashboard-ready.sql',
  'supabase/checks/owner-deletion-surveys-ready.sql',
 ]);
 expect(execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs', '--print-marker'], {
  encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' },
 }).trim()).toBe('pilot-v1:466390675b4ac3c32c56c242ec02eeebfe5a745f7bfcc37f57b955576fb23d19');
});
