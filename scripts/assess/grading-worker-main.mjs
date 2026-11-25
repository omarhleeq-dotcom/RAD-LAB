// RAD-085 W4 production grading entrypoint. Reviewed destination only: the W2 direct host,
// port 5432, database postgres, slot assess_job_b; no pooler, URL, env or flag fallback.
// Recovery verifier: owner decision B (DECISIONS#rad085-w4-verifier-owner-2026-11-03), an
// unsigned no-restore attestation in its own Secret Manager secret, re-read on every call.
import { open, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { executeGradingWorker, workerVersions, WORKER_VERSION } from './worker.cjs';
const DIRECT_HOST = 'db.vlacestfruxooznrcjqc.supabase.co';
const CONFIG_PATH = '/run/secrets/assess-worker.json', RECOVERY_PATH = '/run/recovery/assess-recovery.json';
const CONFIG_KEYS = ['ca', 'database', 'host', 'password', 'port', 'user'];
const ATTESTATION_KEYS = ['baselineAt', 'contract', 'expiresAt', 'issuedAt', 'manifestSha256', 'projectRef', 'restoresSinceBaseline'];
const MAX_SPAN = 48 * 3600 * 1000;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const exact = (o, keys) => !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join() === keys.join();
const instant = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v ? Date.parse(v) : NaN;
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
  let manifestHash, projectRef;
  const result = await executeGradingWorker(async () => {
    if (process.argv.length !== 2 || Object.hasOwn(process.env, 'RAD085_SYNTHETIC_WORKER')) throw Error();
    const bytes = await readFile(new URL('./manifest.json', import.meta.url));
    const manifest = JSON.parse(bytes); manifestHash = sha(bytes);
    if (manifest.contract !== 'rad085-grading-worker-build/1' || manifest.localOnly !== false ||
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
  }, stop.signal, async () => {
    // Re-read on every call: a disabled secret version or a changed file stops the run.
    const a = await json(RECOVERY_PATH), now = Date.now();
    const baseline = instant(a?.baselineAt), issued = instant(a?.issuedAt), expires = instant(a?.expiresAt);
    if (!exact(a, ATTESTATION_KEYS) || a.contract !== 'assess-recovery-attestation/1' || a.projectRef !== projectRef ||
        typeof a.manifestSha256 !== 'string' || a.manifestSha256 !== manifestHash || a.restoresSinceBaseline !== 0 ||
        !(baseline <= issued) || !(issued <= now) || !(now < expires) || !(expires - issued <= MAX_SPAN)) throw Error();
  });
  report(result);
  process.exitCode = result.code === 'stopped' ? 130 : result.outcome === 'COMPLETE' ? 0 : 1;
} catch { report({ contract: WORKER_VERSION, outcome: 'STOP', code: 'unavailable', runtimeOrLaunchVerified: false }); process.exitCode = 1; }
finally { clearTimeout(deadline); process.off('SIGTERM', onStop); process.off('SIGINT', onStop); }
