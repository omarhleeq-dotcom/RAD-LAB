// One authoritative local build: locked dependency graph, runtime/case/evaluator
// versions, source/migration digests and every shipped byte. Never reads env secrets.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
if (process.argv.length !== 2) throw Error('configuration');
const output = await mkdtemp(join(tmpdir(), 'rad085-worker-build-'));
const result = await build({ entryPoints: ['src/features/assess/server-worker.ts'], outfile: join(output, 'worker.cjs'),
  bundle: true, platform: 'node', target: 'node24', format: 'cjs', metafile: true, sourcemap: false, logLevel: 'silent',
  define: { 'process.env.NODE_PG_FORCE_NATIVE': 'false' } });
const inputs = Object.keys(result.metafile.inputs).sort();
if (inputs.some(p => /node_modules\/(react|react-dom|next|zustand)\//.test(p) || /trial-fixture|d-fixture|e-fixture/.test(p))) throw Error('impure_graph');
for (const [source, target] of [['worker-main.mjs', 'worker-main.mjs'], ['worker.Dockerfile', 'Dockerfile']])
  await copyFile(`scripts/assess/${source}`, join(output, target));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = {};
for (const file of ['worker.cjs', 'worker-main.mjs', 'Dockerfile']) files[file] = sha(await readFile(join(output, file)));
const sources = {};
for (const path of [...inputs.filter(p => !p.startsWith('node_modules/')), 'package-lock.json', 'scripts/assess/build-worker.mjs']) sources[path] = sha(await readFile(path));
const migrations = {};
for (const file of (await readdir('supabase/migrations')).filter(p => p.endsWith('.sql')).sort()) migrations[file] = sha(await readFile(`supabase/migrations/${file}`));
const { workerVersions } = createRequire(import.meta.url)(join(output, 'worker.cjs'));
const manifest = { contract: 'rad085-worker-build/1', versions: workerVersions(), files, sources, migrations,
  limits: { tick: 1, pool: 1, taskCount: 1, parallelism: 1, platformRetries: 0, shutdownMilliseconds: 8000 },
  localOnly: true, runtimeOrLaunchVerified: false };
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ contract: manifest.contract, output, manifestSha256: sha(await readFile(join(output, 'manifest.json'))) }));
