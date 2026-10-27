// @vitest-environment jsdom
// RAD085-SEC-FIXES-20261027 SEC-04: a client module mutates the shared manifest object before
// P1 is imported. The real P1 consumer, bundled, must still make zero deferred RPC calls, and
// the gate must keep P1 dormant or reject the guard. Disposable copy; synthetic stub client.
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

const guardPath = 'src/features/supervisor/p1-availability.ts';
const tamper = `import manifest from '../../../scripts/pages/frontend-schema.json';
const m = manifest as unknown as { requiredMigrations: string[]; deferredMigrations: Record<string, unknown> };
for (const file of Object.keys(m.deferredMigrations)) { m.requiredMigrations.push(file); delete m.deferredMigrations[file]; }
export const TAMPERED = true;
`;
function project() {
 const root = mkdtempSync(join(tmpdir(), 'rad085-p1-guard-'));
 for (const dir of ['src', 'supabase', 'scripts/pages', 'messages']) cpSync(dir, join(root, dir), { recursive: true });
 symlinkSync(resolve('node_modules'), join(root, 'node_modules'));
 writeFileSync(join(root, 'src/features/supervisor/manifest-tamper.ts'), tamper);
 // An unpinned client root imports the tampering module before anything imports P1.
 const shell = join(root, 'src/components/shell/AppShell.tsx'), source = readFileSync(shell, 'utf8');
 writeFileSync(shell, source.replace('"use client";\n', '"use client";\nimport "@/features/supervisor/manifest-tamper";\n'));
 return root;
}
function repinGuard(root: string, text: string) {
 writeFileSync(join(root, guardPath), text);
 const path = join(root, 'scripts/pages/frontend-schema.json'), m = JSON.parse(readFileSync(path, 'utf8'));
 m.guardedFeatures.supervisorP1.guard.sha256 = createHash('sha256').update(text).digest('hex');
 writeFileSync(path, JSON.stringify(m));
}
// The pre-fix guard derived availability from the imported, shared manifest object.
const derivedGuard = (text: string) => "import manifest from '../../../scripts/pages/frontend-schema.json';\n"
 + text.replace('export const P1_AVAILABLE: boolean = false;', 'export const P1_AVAILABLE = p1Available(manifest);');
function gate(root: string) {
 const run = spawnSync(process.execPath, ['--input-type=module', '-e', `import {frontendRequirements,inspectBrowserBoundaries} from ${JSON.stringify(resolve('scripts/pages/pilot-schema-gate.mjs'))};
  try { frontendRequirements(${JSON.stringify(root)}); const g = inspectBrowserBoundaries(${JSON.stringify(root)}); console.log(JSON.stringify({ reachable: g.reachable, boundaries: Object.keys(g.boundaries), calls: g.calls.map(c => c.name) })); }
  catch (e) { console.error(e.message); process.exitCode = 1; }`], { encoding: 'utf8' });
 return { status: run.status, error: run.stderr.trim(), graph: run.status === 0 ? JSON.parse(run.stdout) as { reachable: string[]; boundaries: string[]; calls: string[] } : null };
}
type Probe = { calls: string[] };
async function render(root: string) {
 const stubs = join(root, 'stubs'); mkdirSync(stubs);
 writeFileSync(join(stubs, 'client.ts'), `const probe = (globalThis as unknown as { __p1probe: { calls: string[] } }).__p1probe;
export async function getPilotClient() { probe.calls.push('getPilotClient'); return { schema: () => ({ rpc: (name: string) => { probe.calls.push(name);
 return { abortSignal: async () => ({ data: { version: 1, appointed: true, rows: [], next: null, total: 0, serverNow: new Date().toISOString(), visibleUntil: null }, error: null }) }; } }) }; }\n`);
 writeFileSync(join(stubs, 'config.ts'), 'export const PILOT = true;\n');
 writeFileSync(join(stubs, 'next-intl.ts'), "export const useLocale = () => 'en'; export const useTranslations = () => (key: string) => key;\n");
 writeFileSync(join(stubs, 'SessionGate.ts'), `import { CONSENT_VERSION } from '../src/features/pilot/consent';
const state = { kind: 'signedIn', userId: '00000000-0000-0000-0000-000000000003', profile: { status: 'approved', role: 'participant' }, consentVersion: CONSENT_VERSION };
export const useOptionalSessionAccount = () => ({ state }); export const useSessionAccount = () => ({ state });\n`);
 // The tampering import runs first; then the REAL consumer binds through the real guard.
 writeFileSync(join(root, 'entry.ts'), `import './src/features/supervisor/manifest-tamper';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { P1SupervisorScope } from './src/features/supervisor/P1Session';
import { P1_AVAILABLE } from './src/features/supervisor/p1-availability';
import manifest from './scripts/pages/frontend-schema.json';
export async function run() {
 const host = document.createElement('div'), view = createRoot(host);
 await act(async () => view.render(createElement(P1SupervisorScope, null)));
 await act(async () => { for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 5)); });
 await act(async () => view.unmount());
 return { available: P1_AVAILABLE, tampered: manifest.requiredMigrations.includes('20261027000100_assess_management_erasure.sql') };
}\n`);
 // Bundled in Node (esbuild cannot run inside jsdom); only pilot I/O and next-intl are stubbed.
 writeFileSync(join(root, 'build.mjs'), `import { build } from 'esbuild';
import { join, resolve } from 'node:path';
const root = ${JSON.stringify(root)}, stubs = join(root, 'stubs'), pilot = resolve(root, 'src/features/pilot');
await build({ entryPoints: [join(root, 'entry.ts')], bundle: true, format: 'iife', globalName: '__p1bundle', platform: 'browser', outfile: join(root, 'bundle.js'),
 jsx: 'automatic', logLevel: 'error', define: { 'process.env.NODE_ENV': '"development"' }, alias: { '@': join(root, 'src'), 'next-intl': join(stubs, 'next-intl.ts') },
 plugins: [{ name: 'stub-pilot-io', setup(b) {
  b.onResolve({ filter: /(SessionGate|config|client)$/ }, args => {
   const target = resolve(args.resolveDir, args.path);
   for (const name of ['SessionGate', 'config', 'client']) if (target === join(pilot, name)) return { path: join(stubs, name + '.ts') };
   return undefined;
  });
 } }] });\n`);
 const built = spawnSync(process.execPath, [join(root, 'build.mjs')], { encoding: 'utf8', cwd: root });
 if (built.status !== 0) throw Error('bundle failed: ' + built.stderr);
 const probe: Probe = { calls: [] };
 Object.assign(globalThis, { __p1probe: probe, IS_REACT_ACT_ENVIRONMENT: true });
 (0, eval)(readFileSync(join(root, 'bundle.js'), 'utf8'));
 const bundle = (globalThis as unknown as { __p1bundle: { run: () => Promise<{ available: boolean; tampered: boolean }> } }).__p1bundle;
 return { ...(await bundle.run()), calls: probe.calls };
}

it('a manifest-mutating client module cannot activate P1: zero deferred RPCs and the gate keeps P1 dormant', async () => {
 const root = project();
 try {
  const checked = gate(root);
  expect(checked.error).toBe(''); expect(checked.status).toBe(0);
  expect(checked.graph!.reachable).toContain('src/features/supervisor/manifest-tamper.ts');
  expect(checked.graph!.boundaries).not.toContain('src/features/supervisor/p1-live.ts');
  expect(checked.graph!.boundaries).not.toContain('src/features/supervisor-review/sql-adapter.ts');
  expect(checked.graph!.calls).not.toContain('scope_page_v1');
  expect(await render(root)).toEqual({ available: false, tampered: true, calls: [] });
 } finally { if (!process.env.KEEP_P1_ROOT) rmSync(root, { recursive: true, force: true }); }
}, 60000);

it('baseline: the previous derived guard is activated by the same mutation, and the gate now rejects that guard shape', async () => {
 const root = project();
 try {
  const literal = readFileSync(join(root, guardPath), 'utf8');
  repinGuard(root, derivedGuard(literal));
  const attacked = await render(root);
  expect(attacked.available).toBe(true); expect(attacked.calls).toContain('scope_page_v1');
  expect(gate(root).error).toContain('Schema feature guard must be a literal constant');
  repinGuard(root, literal.replace('P1_AVAILABLE: boolean = false;', 'P1_AVAILABLE: boolean = true;'));
  expect(gate(root).error).toContain('Schema feature guard does not match the manifest');
  repinGuard(root, literal.replace('export const P1_AVAILABLE: boolean = false;', 'const ON: boolean = false;\nexport { ON as P1_AVAILABLE };'));
  expect(gate(root).error).toContain('Schema feature guard must be a literal constant');
 } finally { if (!process.env.KEEP_P1_ROOT) rmSync(root, { recursive: true, force: true }); }
}, 60000);
