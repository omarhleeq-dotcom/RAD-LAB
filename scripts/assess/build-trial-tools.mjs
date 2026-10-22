// Curated trial-tools image context only; no Docker, cloud or DB operation here.
import { build } from 'esbuild';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (process.argv.length !== 2) throw new Error('No arguments accepted');
const output = await mkdtemp(join(tmpdir(), 'radlab-assess-trial-tools-'));
const result = await build({
  entryPoints: ['scripts/assess/trial-tools.ts'], outfile: join(output, 'tools.mjs'), bundle: true,
  platform: 'node', target: 'node24', format: 'esm', sourcemap: false, metafile: true, logLevel: 'silent',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  define: { 'process.env.NODE_PG_FORCE_NATIVE': 'false' },
});
const inputs = Object.keys(result.metafile.inputs).sort();
// Same trust boundary as the worker: no UI, job scheduler or trial worker code in this image.
if (inputs.some(p => /node_modules\/(react|react-dom|next|zustand)\//.test(p) || /job-main|trial-main/.test(p))) throw new Error('Invalid tools graph');
// Job args select one explicit operation; no default action, scheduler or gate change.
await writeFile(join(output, 'Dockerfile'), `FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
WORKDIR /app
COPY --chown=node:node tools.mjs ./
ENV NODE_ENV=production
USER node
ENTRYPOINT ["node", "/app/tools.mjs"]
`);
const hashes = {};
for (const name of ['tools.mjs', 'Dockerfile']) hashes[name] = createHash('sha256').update(await readFile(join(output, name))).digest('hex');
await writeFile(join(output, 'manifest.json'), JSON.stringify({ contract: 'assess-trial-tools-package/1', hashes, inputs,
  operations: ['--authorized-install-mixed', '--authorized-close-assignment'], runtimeOrLaunchVerified: false }, null, 2) + '\n');
console.log(JSON.stringify({ contract: 'assess-trial-tools-build/1', output, runtimeOrLaunchVerified: false }));
