import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import schema from '../../../scripts/pages/frontend-schema.json';
import { MANUAL_GRADING_AVAILABLE } from './manual-grading-availability';
it('grading availability follows the promoted M09 and existing package, with protected manifest sections unchanged', () => {
 expect(MANUAL_GRADING_AVAILABLE).toBe(true);
 expect(schema.requiredMigrations).toContain('20261102000100_rad062_supervisor_grading_authorization.sql');
 expect(schema.deferredMigrations).toEqual({"20261102000200_rad059_emergency_alternate.sql":{"sha256":"efd5a5e61e93beef66354c016f619f17ed0acb59ad52eada7b374ebba0068c1e","reason":"RAD-059 dormant until a later owner apply window and separate promotion; request phases use the existing authenticated timeout.","serverModules":["src/features/assess/rad059-alternate.test.ts"]}});
 const source = readFileSync('src/features/assess/ManualGradingEntry.tsx', 'utf8');
 expect(source).toContain('useSessionAccount'); expect(source).toContain('useSupervisorAppointment'); expect(source).toContain('MANUAL_GRADING_AVAILABLE');
});
