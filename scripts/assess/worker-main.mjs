// Local synthetic image only. No provider host, legacy secret, URL fallback or flags.
import { open, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { executeGradingWorker, workerVersions, WORKER_VERSION } from './worker.cjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function json(path) {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > 65536) throw Error();
    const buffer = Buffer.alloc(65537); let n = 0;
    while (n < buffer.length) { const r = await file.read(buffer, n, buffer.length - n, n); if (!r.bytesRead) break; n += r.bytesRead; }
    if (!n || n > 65536) throw Error();
    return JSON.parse(buffer.subarray(0, n).toString('utf8'));
  } finally { await file.close(); }
}
const stop = new AbortController(); let deadline, finished = false;
const report = value => { if (!finished) { finished = true; process.stdout.write(JSON.stringify(value) + '\n'); } };
function onStop() {
  stop.abort();
  const stoppedAt = performance.now();
  deadline ??= setTimeout(() => {
    report({ contract: WORKER_VERSION, outcome: 'STOP', code: 'shutdown_uncertain',
      shutdownMilliseconds: Math.ceil(performance.now() - stoppedAt), reconciliationRequired: true, runtimeOrLaunchVerified: false });
    // OS closes sockets. Never infer COMMIT outcome; operator reconciles in a new session.
    process.exit(1);
  }, 8000);
}
process.on('SIGTERM', onStop); process.on('SIGINT', onStop);
try {
  let manifestHash, config;
  const result = await executeGradingWorker(async () => {
    if (process.argv.length !== 2 || process.env.RAD085_SYNTHETIC_WORKER !== '1') throw Error();
    const bytes = await readFile(new URL('./manifest.json', import.meta.url));
    const manifest = JSON.parse(bytes); manifestHash = sha(bytes);
    if (manifest.contract !== 'rad085-worker-build/1' || manifest.localOnly !== true ||
        JSON.stringify(manifest.versions) !== JSON.stringify(workerVersions())) throw Error();
    for (const file of ['worker.cjs', 'worker-main.mjs'])
      if (sha(await readFile(new URL('./' + file, import.meta.url))) !== manifest.files[file]) throw Error();
    config = await json('/run/secrets/rad085-synthetic-worker.json');
    // A deliberate local-only destination, not a general provider allowlist.
    if (config.host !== 'rad085-postgres' || config.database !== 'rad085_synthetic' || config.port !== 5432 ||
        config.user !== 'rad085_synthetic_worker') throw Error();
    return config;
  }, stop.signal, async () => {
    // Mounted by the isolated host after reconcileSynthetic completes, with its
    // external head frozen for this execution. No operational verifier exists.
    const permit = await json('/run/recovery/permit.json');
    const current = await json('/run/recovery/current.json');
    if (permit.contract !== 'rad085-synthetic-reconciliation/1' || permit.status !== 'synthetic-verified' ||
        permit.manifestSha256 !== manifestHash || permit.sequence !== current.sequence || permit.mac !== current.mac ||
        !/^[0-9a-f]{64}$/.test(permit.mac) || !Number.isSafeInteger(permit.sequence) || permit.sequence < 0 ||
        permit.revoked !== true || permit.maintenance !== true || current.frozen !== true) throw Error();
  });
  report(result);
  process.exitCode = result.code === 'stopped' ? 130 : result.outcome === 'COMPLETE' ? 0 : 1;
} catch { report({ contract: WORKER_VERSION, outcome: 'STOP', code: 'unavailable', runtimeOrLaunchVerified: false }); process.exitCode = 1; }
finally { clearTimeout(deadline); process.off('SIGTERM', onStop); process.off('SIGINT', onStop); }
