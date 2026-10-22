// Curated diagnostic image context only; no Docker, cloud or DB operation here.
import { build } from 'esbuild';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv.length !== 2) throw new Error('No arguments accepted');
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = await mkdtemp(join(tmpdir(), 'radlab-assess-probe-'));
await build({
  stdin: { contents: `import { Client } from 'pg';
import { runConnectionProbe } from './scripts/assess/connection-probe.mjs';
const timer = setTimeout(() => {
  console.log(JSON.stringify({contract:'assess-connection-probe/1',outcome:'STOP',runtimeOrLaunchVerified:false}));
  process.exit(1);
}, 45000);
const report = await runConnectionProbe({makeClient: options => new Client(options)});
clearTimeout(timer);
console.log(JSON.stringify(report));
process.exitCode = report.outcome === 'PASS' ? 0 : 1;
`, resolveDir: root, sourcefile: 'connection-probe-entry.mjs' },
  outfile: join(output, 'probe.mjs'), bundle: true, platform: 'node', target: 'node24', format: 'esm',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  define: { 'process.env.NODE_PG_FORCE_NATIVE': 'false' }, sourcemap: false, logLevel: 'silent',
});
await writeFile(join(output, 'Dockerfile'), `FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
WORKDIR /app
COPY --chown=node:node probe.mjs ./
ENV NODE_ENV=production
USER node
ENTRYPOINT ["node", "/app/probe.mjs"]
`);
console.log(JSON.stringify({ contract: 'assess-probe-build/1', output, runtimeOrLaunchVerified: false }));
