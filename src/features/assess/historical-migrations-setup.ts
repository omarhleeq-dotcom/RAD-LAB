// Historical tests predate RAD-062 and discover SQL via readdirSync. Keep those
// witnesses through B, even after future promotion; new parts apply named SQL
// explicitly. This changes fixture INPUT only, never SQL/assertions/goldens.
// Only named historical DB witnesses opt into this ceiling. Deployment/discovery
// tests and gate/build subprocesses still inspect ALL real migration bytes.
import { afterAll, expect, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Retained B contracts assert their original classifications and marker values.
// P1-schema and C2 are explicitly historical B witnesses too; current P10
// requirements/marker are covered by the RAD-062 and current discovery tests.
// Use a REAL B tree, not altered assertions or a falsified manifest projection.
// New RAD-062 tests inspect the current tree and call the current gate separately.
const testPath = (expect.getState().testPath ?? '').replaceAll('\\', '/');
if (/\/features\/deployment\/(owner-dashboard-deferred-schema|assess-[def]-schema|c2-deferred-schema)\.test\.ts$/.test(testPath)
 || /\/features\/supervisor\/p1-schema\.test\.ts$/.test(testPath)) {
 const original = process.cwd(), fixture = mkdtempSync(join(tmpdir(), 'rad062-historical-b-'));
 try {
  const archive = execFileSync('git', ['archive', '05b548b41f4212d86c5b20813f204dd54b469f70', 'src', 'supabase', 'scripts/pages'], { cwd: original, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', fixture], { input: archive });
  symlinkSync(join(original, 'node_modules'), join(fixture, 'node_modules'));
  process.chdir(fixture);
 } catch (error) { rmSync(fixture, { recursive: true, force: true }); throw error; }
 afterAll(() => { process.chdir(original); rmSync(fixture, { recursive: true, force: true }); });
}

vi.mock('node:fs', async importOriginal => {
 const fs = await importOriginal<typeof import('node:fs')>();
 const { resolve } = await import('node:path');
 const directory = resolve('supabase/migrations');
 return {
  ...fs,
  readdirSync: ((...args: Parameters<typeof fs.readdirSync>) => {
   const entries = fs.readdirSync(...args);
   // Preserve the real overload result and all non-migration discovery.
   const witness = (expect.getState().testPath ?? '').replaceAll('\\', '/');
   const historical = /\/features\/pilot-db\//.test(witness)
    || /\/features\/pilot\/(owner-dashboard-db|saved-training)\.test\.ts$/.test(witness)
    || /\/features\/assess\/(lifecycle-db|mixed-db|server-runtime|server-trial-tools|rad062-name)\.test\.ts$/.test(witness);
   if (!historical || resolve(String(args[0])) !== directory) return entries;
   return entries.filter(entry => {
    const name = typeof entry === 'string' ? entry : Buffer.isBuffer(entry) ? entry.toString() : entry.name.toString();
    return !name.endsWith('.sql') || name < '20261030000100';
   });
  }) as typeof fs.readdirSync,
 };
});
