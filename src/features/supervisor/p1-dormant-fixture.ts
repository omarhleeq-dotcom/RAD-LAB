// RAD085-DB-DAY-PROMOTION-20261027: test-only helper. The repository is now promoted, but the SEC-04 gate
// witnesses are about the DORMANT state (a client module that mutates the shared manifest). This restores
// the reviewed pre-promotion classification inside a disposable project copy only.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RAD085_BOUNDARY, RAD085_DEFER_REASON } from '../assess/server-rad085-contracts';

export function demoteP1(root: string) {
 // Restore a real immutable B tree before applying the original P1 demotion.
 // Remove future files in the disposable copy; never project the current manifest.
 const archive = execFileSync('git', ['archive', '05b548b41f4212d86c5b20813f204dd54b469f70', 'src', 'supabase', 'scripts/pages'],
  { cwd: resolve(import.meta.dirname, '../../..'), maxBuffer: 64 * 1024 * 1024 });
 for (const path of ['src', 'supabase', 'scripts/pages']) rmSync(join(root, path), { recursive: true, force: true });
 execFileSync('tar', ['-x', '-C', root], { input: archive });
 const guardPath = join(root, 'src/features/supervisor/p1-availability.ts');
 const guard = readFileSync(guardPath, 'utf8').replace('P1_AVAILABLE: boolean = true;', 'P1_AVAILABLE: boolean = false;');
 writeFileSync(guardPath, guard);
 const manifestPath = join(root, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(manifestPath, 'utf8'));
 // RAD-060 Phase 1 consumes live M3/M4 independently of P1. Restore the historical
 // owner input too: this disposable pre-promotion witness predates that consumer.
 // No live guard, assertion or stored hash changes; pins describe the fixture bytes.
 const ownerPath = 'src/features/assess/OwnerAssessPanel.tsx';
 const owner = readFileSync(join(root, ownerPath), 'utf8')
  .replace('import { OwnerAssignments } from "./OwnerAssignments";\n', '')
  .replace('<OwnerAssignments/>', '');
 writeFileSync(join(root, ownerPath), owner);
 m.browserBoundaries[ownerPath] = createHash('sha256').update(owner).digest('hex');
 for (const file of ['src/features/assess/OwnerAssignments.tsx', 'src/features/assess/owner-assignments.ts']) {
  rmSync(join(root, file), { force: true });
  delete m.browserBoundaries[file];
 }
 const files: string[] = m.guardedFeatures.supervisorP1.migrations;
 m.requiredMigrations = m.requiredMigrations.filter((f: string) => !files.includes(f));
 for (const file of files) m.deferredMigrations[file] = { sha256: createHash('sha256').update(readFileSync(join(root, 'supabase/migrations', file))).digest('hex'), reason: RAD085_DEFER_REASON, serverModules: [RAD085_BOUNDARY] };
 m.checks = m.checks.map((c: string) => c === 'supabase/checks/rad085-p1-b-ready.sql' ? 'supabase/checks/assess-staging-ready.sql' : c);
 m.guardedFeatures.supervisorP1.guard.sha256 = createHash('sha256').update(guard).digest('hex');
 writeFileSync(manifestPath, JSON.stringify(m));
}
