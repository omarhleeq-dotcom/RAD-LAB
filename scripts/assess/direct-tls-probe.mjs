// RAD-085 W5 network probe. Credential-free: DNS (IPv6 by default) -> TCP -> PostgreSQL
// SSLRequest -> TLS with the pinned Supabase root and hostname check -> close. It never sends a
// startup message, user, password or query, and mounts no secret. Outcome codes only.
//   Probe (image entrypoint, no arguments): node /app/direct-tls-probe.mjs
//   Build context (Cloud Shell): node scripts/assess/direct-tls-probe.mjs --build-context ~/assess-ca/prod-ca-2021.crt
import { createHash, X509Certificate } from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import { connect as netConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { copyFile, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIRECT_HOST = 'db.vlacestfruxooznrcjqc.supabase.co';
export const ROOT_SHA256 = '807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa';
const BASE = 'node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df';
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f]);

export function pinnedCa(pem) {
  const certificate = new X509Certificate(pem);
  if (createHash('sha256').update(certificate.raw).digest('hex') !== ROOT_SHA256) throw new Error('ca_mismatch');
  return pem;
}

export async function probeTls({ host = DIRECT_HOST, port = 5432, ca, family = 6, timeoutMs = 10000,
  lookup = dnsLookup, connect = netConnect, secure = tlsConnect } = {}) {
  const report = (outcome, stage, resolved) => ({ contract: 'assess-direct-tls-probe/1', outcome, stage,
    family: resolved ?? null, runtimeOrLaunchVerified: false });
  let stage = 'dns', resolved, socket, tlsSocket, timer;
  try {
    const { address, family: got } = await lookup(host, { family });
    resolved = got;
    stage = 'tcp';
    const result = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      socket = connect({ host: address, port, family });
      socket.once('error', reject);
      socket.once('connect', () => { stage = 'ssl-request'; socket.write(SSL_REQUEST); });
      socket.once('data', byte => {
        if (byte.length !== 1 || byte[0] !== 0x53) { stage = 'ssl-refused'; return reject(new Error('refused')); }
        stage = 'tls';
        tlsSocket = secure({ socket, servername: host, ca, rejectUnauthorized: true, minVersion: 'TLSv1.2' });
        tlsSocket.once('error', reject);
        tlsSocket.once('secureConnect', () => tlsSocket.authorized ? resolve('complete') : reject(new Error('unauthorized')));
      });
    });
    return report('PASS', result, resolved);
  } catch { return report('STOP', stage, resolved); }
  finally {
    clearTimeout(timer);
    tlsSocket?.destroy(); socket?.destroy();
  }
}

async function buildContext(caPath) {
  const ca = pinnedCa(await readFile(caPath, 'ascii'));
  const output = await mkdtemp(join(tmpdir(), 'radlab-direct-tls-probe-'));
  await copyFile(fileURLToPath(import.meta.url), join(output, 'direct-tls-probe.mjs'));
  await writeFile(join(output, 'ca.crt'), ca);
  await writeFile(join(output, 'Dockerfile'), `FROM ${BASE}
WORKDIR /app
COPY --chown=root:root --chmod=0444 direct-tls-probe.mjs ca.crt ./
ENV NODE_ENV=production
USER node
ENTRYPOINT ["node", "/app/direct-tls-probe.mjs"]
`);
  const files = {};
  for (const file of ['direct-tls-probe.mjs', 'ca.crt', 'Dockerfile'])
    files[file] = createHash('sha256').update(await readFile(join(output, file))).digest('hex');
  return { contract: 'assess-direct-tls-probe-build/1', output, files, runtimeOrLaunchVerified: false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--build-context') {
    console.log(JSON.stringify(await buildContext(args[1])));
  } else if (args.length === 0) {
    let result;
    try { result = await probeTls({ ca: pinnedCa(await readFile(new URL('./ca.crt', import.meta.url), 'ascii')) }); }
    catch { result = { contract: 'assess-direct-tls-probe/1', outcome: 'STOP', stage: 'configuration', family: null, runtimeOrLaunchVerified: false }; }
    console.log(JSON.stringify(result));
    process.exitCode = result.outcome === 'PASS' ? 0 : 1;
  } else { console.log(JSON.stringify({ contract: 'assess-direct-tls-probe/1', outcome: 'STOP', stage: 'usage' })); process.exitCode = 1; }
}
