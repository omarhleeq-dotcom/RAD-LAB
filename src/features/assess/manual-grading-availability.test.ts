import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import schema from '../../../scripts/pages/frontend-schema.json';
import { MANUAL_GRADING_AVAILABLE } from './manual-grading-availability';
it('grading availability follows the promoted M09 and existing package, with protected manifest sections unchanged', () => {
 expect(MANUAL_GRADING_AVAILABLE).toBe(true);
 expect(schema.requiredMigrations).toContain('20261102000100_rad062_supervisor_grading_authorization.sql');
 expect(schema.deferredMigrations).toEqual({});
 const source = readFileSync('src/features/assess/ManualGradingEntry.tsx', 'utf8');
 expect(source).toContain('useSessionAccount'); expect(source).toContain('useSupervisorAppointment'); expect(source).toContain('MANUAL_GRADING_AVAILABLE');
});
