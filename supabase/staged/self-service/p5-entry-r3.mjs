// STAGED (RAD-105 P3/P5) R3: witness ENFORCING, attestation retired (RAD-097 done). Batch <= 20 attempts or 240 s.
// Build with build-grading-worker.mjs --selfservice-r3. Original v1 production entry remains preserved.
// RAD-085 W4 production grading entrypoint. Reviewed destination only: the W2 direct host,
// port 5432, database postgres, slot assess_job_b; no pooler, URL, env or flag fallback.
// Recovery verifier: owner decision B (DECISIONS#rad085-w4-verifier-owner-2026-11-03), an
// unsigned no-restore attestation in its own Secret Manager secret, re-read on every call.
import { open, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { executeGradingWorker, workerVersions, WORKER_VERSION, gcsWitnessStore } from './worker.cjs';
const DIRECT_HOST = 'db.vlacestfruxooznrcjqc.supabase.co';
const CONFIG_PATH = '/run/secrets/assess-worker.json';
const CONFIG_KEYS = ['ca', 'database', 'host', 'password', 'port', 'user'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const exact = (o, keys) => !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join() === keys.join();
async function json(path) {
  // O_NOFOLLOW: a symbolic link at the final component is refused (ELOOP), never followed.
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
// RAD-105 P5: external restore witness. Bucket is derived from the W2 project ref; the token comes from the Cloud Run metadata server.
async function metadataToken() {
  const r = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: { 'Metadata-Flavor': 'Google' } });
  if (!r.ok) throw Error();
  return (await r.json()).access_token;
}
const gcs = ref => gcsWitnessStore(`${ref}-assess-witness`, 'witness.json', metadataToken, fetch);
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
  let projectRef;
  const result = await executeGradingWorker(async () => {
    if (process.argv.length !== 2 || Object.hasOwn(process.env, 'RAD085_SYNTHETIC_WORKER')) throw Error();
    const bytes = await readFile(new URL('./manifest.json', import.meta.url));
    const manifest = JSON.parse(bytes);
    if (manifest.selfservice !== 'selfservice-r3' || manifest.contract !== 'rad085-grading-worker-build/1' || manifest.localOnly !== false ||
        JSON.stringify(manifest.versions) !== JSON.stringify(workerVersions())) throw Error();
    for (const file of ['worker.cjs', 'grading-worker-main.mjs'])
      if (sha(await readFile(new URL('./' + file, import.meta.url))) !== manifest.files[file]) throw Error();
    const config = await json(CONFIG_PATH);
    // Exact W2 payload keys: a sessionPoolerProjectRef or any other extra key is refused here.
    if (!exact(config, CONFIG_KEYS) || config.host !== DIRECT_HOST || config.port !== 5432 ||
        config.database !== 'postgres' || config.user !== 'assess_job_b') throw Error();
    projectRef = /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(config.host)?.[1];
    if (!projectRef) throw Error();
    return config;
  }, stop.signal, async () => {}, undefined, undefined, { batch: 20, budgetMs: 240_000, witness: { mode: 'enforcing', get projectRef() { return projectRef; }, store: { read: () => gcs(projectRef).read(), write: (v, g) => gcs(projectRef).write(v, g) } } });
  report(result);
  process.exitCode = result.code === 'stopped' ? 130 : result.outcome === 'COMPLETE' ? 0 : 1;
} catch { report({ contract: WORKER_VERSION, outcome: 'STOP', code: 'unavailable', runtimeOrLaunchVerified: false }); process.exitCode = 1; }
finally { clearTimeout(deadline); process.off('SIGTERM', onStop); process.off('SIGINT', onStop); }
