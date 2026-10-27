import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { demoteP1 } from './p1-dormant-fixture';
const marker = 'pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10';
const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic_local_test_123456', PILOT_SCHEMA_VERIFIED: marker };
it('accepts dormant wiring with the current marker and requires a fresh marker when the test manifest promotes P1', () => {
 const root = mkdtempSync(join(tmpdir(), 'rad085-p1-schema-'));
 try {
  for (const file of ['src', 'supabase', 'scripts/pages']) cpSync(file, join(root, file), { recursive: true });
  demoteP1(root); // RAD085-DB-DAY-PROMOTION-20261027: start from the dormant classification, then promote in the copy.
  const gate = (print = false) => spawnSync(process.execPath, ['--input-type=module', '-e', `import {runSchemaGate} from ${JSON.stringify(join(process.cwd(), 'scripts/pages/pilot-schema-gate.mjs'))};try { console.log(runSchemaGate(${JSON.stringify(env)},${print},${JSON.stringify(root)})); } catch(e) { console.error(e.message); process.exitCode=1; }`], { encoding: 'utf8' });
  expect(gate(true).stdout.trim()).toBe(marker);
  expect(gate().status).toBe(0);
  const path = join(root, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(path, 'utf8'));
  for (const file of m.guardedFeatures.supervisorP1.migrations) { m.requiredMigrations.push(file); delete m.deferredMigrations[file]; }
  // RAD085-SEC-FIXES-20261027 SEC-04: promotion also updates the reviewed literal guard and its pin.
  const guardPath = join(root, 'src/features/supervisor/p1-availability.ts');
  writeFileSync(guardPath, readFileSync(guardPath, 'utf8').replace('P1_AVAILABLE: boolean = false;', 'P1_AVAILABLE: boolean = true;'));
  m.guardedFeatures.supervisorP1.guard.sha256 = createHash('sha256').update(readFileSync(guardPath)).digest('hex');
  writeFileSync(path, JSON.stringify(m));
  expect(gate().stderr).toContain('schema compatibility has not been attested');
  const printed = gate(true); expect(printed.status, printed.stderr).toBe(0); expect(printed.stdout.trim()).not.toBe(marker);
  env.PILOT_SCHEMA_VERIFIED = printed.stdout.trim(); expect(gate().status).toBe(0); env.PILOT_SCHEMA_VERIFIED = marker;
  const live = join(root, 'src/features/supervisor/p1-live.ts'); writeFileSync(live, readFileSync(live, 'utf8') + '\n// drift');
  expect(gate(true).stderr).toContain('Unreviewed guarded database boundary');
 } finally { rmSync(root, { recursive: true, force: true }); }
}, 20000);
it('rejects an unguarded deferred import and edits to the availability source without changing existing guards', () => {
 const root = mkdtempSync(join(tmpdir(), 'rad085-p1-unguarded-'));
 try {
  for (const file of ['src', 'supabase', 'scripts/pages']) cpSync(file, join(root, file), { recursive: true });
  demoteP1(root); // RAD085-DB-DAY-PROMOTION-20261027
  const run = () => spawnSync(process.execPath, ['--input-type=module', '-e', `import {frontendRequirements} from ${JSON.stringify(join(process.cwd(), 'scripts/pages/pilot-schema-gate.mjs'))};try { frontendRequirements(${JSON.stringify(root)}); } catch(e) { console.error(e.message); process.exitCode=1; }`], { encoding: 'utf8' });
  const session = join(root, 'src/features/supervisor/P1Session.tsx'), source = readFileSync(session, 'utf8');
  writeFileSync(session, source.replace('if (P1_AVAILABLE) {', 'if (true) {'));
  expect(run().stderr).toContain('Unreviewed schema feature consumer');
  // Deliberately review the changed consumer in this test copy: the unguarded
  // import must still fail the existing deferred-RPC rule.
  const manifestPath = join(root, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  m.guardedFeatures.supervisorP1.consumer.sha256 = createHash('sha256').update(readFileSync(session)).digest('hex');
  writeFileSync(manifestPath, JSON.stringify(m));
  expect(run().stderr).toContain('Deferred RPC used by frontend');
  m.guardedFeatures.supervisorP1.consumer.sha256 = createHash('sha256').update(source).digest('hex');
  writeFileSync(manifestPath, JSON.stringify(m));
  writeFileSync(session, source);
  const guard = join(root, 'src/features/supervisor/p1-availability.ts'); writeFileSync(guard, readFileSync(guard, 'utf8') + '\n// drift');
  expect(run().stderr).toContain('Unreviewed schema feature guard');
 } finally { rmSync(root, { recursive: true, force: true }); }
}, 20000);
// RAD085-DB-DAY-PROMOTION-20261027: the promoted repository itself (no demotion) carries the new marker.
it('the promoted repository prints the new marker, accepts it, and rejects the pre-DB-day marker', () => {
 const promoted = 'pilot-v1:42cc4a1a2cab288bfc814bc853cb760efaf151316a24ac1d47674ebe36ec73cf';
 const run = (attestation: string, print = false) => spawnSync(process.execPath, ['--input-type=module', '-e', `import {runSchemaGate} from ${JSON.stringify(join(process.cwd(), 'scripts/pages/pilot-schema-gate.mjs'))};try { console.log(runSchemaGate(${JSON.stringify({ ...env, PILOT_SCHEMA_VERIFIED: attestation })},${print})); } catch(e) { console.error(e.message); process.exitCode=1; }`], { encoding: 'utf8' });
 const printed = run(promoted, true); expect(printed.stdout.trim()).toBe(promoted);
 expect(run(promoted).status).toBe(0);
 const old = run(marker); expect(old.status).toBe(1); expect(old.stderr).toContain('schema compatibility has not been attested');
});
