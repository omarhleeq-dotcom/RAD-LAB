import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import schema from '../../../scripts/pages/frontend-schema.json';
import { MANUAL_GRADING_AVAILABLE } from './manual-grading-availability';
it('grading availability follows the promoted M09 and existing package, with protected manifest sections unchanged', () => {
 expect(MANUAL_GRADING_AVAILABLE).toBe(true);
 expect(schema.requiredMigrations).toContain('20261102000100_rad062_supervisor_grading_authorization.sql');
 expect(schema.deferredMigrations).toEqual({"20261102000200_rad059_emergency_alternate.sql":{"sha256":"4246d046edc0913adbed66992263226cdcc11ef92bd60895155c245ad4f9f610","reason":"RAD-059 dormant until a later owner apply window and separate promotion; request phases use the existing authenticated timeout.","serverModules":["src/features/assess/rad059-alternate.test.ts"]},"20261102000300_rad085_rights_write_disclosures.sql":{"sha256":"5ddaf223e783e5dd3f92e0b428d7d1718f41f0fc19df9fac024a718d61330f44","reason":"RAD-085 R1/R2/S1/P2/P3 deferred after 0200; owner must approve S1 values and EN/AR disclosure drafts before the laptop window.","serverModules":["src/features/assess/rad085-review-fixes.test.ts"]}});
 const source = readFileSync('src/features/assess/ManualGradingEntry.tsx', 'utf8');
 expect(source).toContain('useSessionAccount'); expect(source).toContain('useSupervisorAppointment'); expect(source).toContain('MANUAL_GRADING_AVAILABLE');
});
