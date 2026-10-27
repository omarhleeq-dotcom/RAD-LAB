// RAD085-DB-DAY-PROMOTION-20261027: test-only helper. The repository is now promoted, but the SEC-04 gate
// witnesses are about the DORMANT state (a client module that mutates the shared manifest). This restores
// the reviewed pre-promotion classification inside a disposable project copy only.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAD085_BOUNDARY, RAD085_DEFER_REASON } from '../assess/server-rad085-contracts';

export function demoteP1(root: string) {
 const guardPath = join(root, 'src/features/supervisor/p1-availability.ts');
 const guard = readFileSync(guardPath, 'utf8').replace('P1_AVAILABLE: boolean = true;', 'P1_AVAILABLE: boolean = false;');
 writeFileSync(guardPath, guard);
 const manifestPath = join(root, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(manifestPath, 'utf8'));
 const files: string[] = m.guardedFeatures.supervisorP1.migrations;
 m.requiredMigrations = m.requiredMigrations.filter((f: string) => !files.includes(f));
 for (const file of files) m.deferredMigrations[file] = { sha256: createHash('sha256').update(readFileSync(join(root, 'supabase/migrations', file))).digest('hex'), reason: RAD085_DEFER_REASON, serverModules: [RAD085_BOUNDARY] };
 m.checks = m.checks.map((c: string) => c === 'supabase/checks/rad085-d3-ready.sql' ? 'supabase/checks/assess-staging-ready.sql' : c);
 m.guardedFeatures.supervisorP1.guard.sha256 = createHash('sha256').update(guard).digest('hex');
 writeFileSync(manifestPath, JSON.stringify(m));
}
