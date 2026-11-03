// Synthetic-only: a local server speaks the PostgreSQL SSLRequest reply, then TLS. No provider.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { TLSSocket } from 'node:tls';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { probeTls, pinnedCa } from './direct-tls-probe.mjs';

const dir = mkdtempSync(join(tmpdir(), 'rad085-tls-probe-'));
function certificate(name, san) {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=' + name,
    '-addext', 'subjectAltName=' + san, '-keyout', join(dir, name + '.key'), '-out', join(dir, name + '.crt')], { stdio: 'pipe' });
  return { key: readFileSync(join(dir, name + '.key')), cert: readFileSync(join(dir, name + '.crt'), 'utf8') };
}
const good = certificate('rad085-probe', 'DNS:localhost'), other = certificate('rad085-other', 'DNS:localhost');
const loopback = async () => ({ address: '127.0.0.1', family: 4 });

async function server(reply, { silent = false, startup } = {}) {
  const s = createServer(socket => {
    socket.once('data', bytes => {
      assert.deepEqual([...bytes], [0, 0, 0, 8, 4, 210, 22, 47], 'only an SSLRequest is ever sent in clear');
      if (silent) return;
      socket.write(reply);
      if (reply !== 'S') return socket.end();
      const secure = new TLSSocket(socket, { isServer: true, key: good.key, cert: good.cert });
      secure.on('error', () => {});
      secure.on('data', b => startup?.(b));
    });
    socket.on('error', () => {});
  });
  await new Promise(r => s.listen(0, '127.0.0.1', r));
  return s;
}
const run = (s, extra = {}) => probeTls({ host: 'localhost', port: s.address().port, ca: good.cert, family: 4, lookup: loopback, timeoutMs: 2000, ...extra });

test('PASS only for a verified TLS session to the expected hostname; nothing after the handshake', async () => {
  let afterTls = 0;
  const s = await server('S', { startup: () => afterTls++ });
  try {
    assert.deepEqual(await run(s), { contract: 'assess-direct-tls-probe/1', outcome: 'PASS', stage: 'complete', family: 4, runtimeOrLaunchVerified: false });
    await new Promise(r => setTimeout(r, 100));
    assert.equal(afterTls, 0, 'no startup message, user or password after TLS');
  } finally { s.close(); }
});

test('STOP stages: untrusted root, wrong hostname, SSL refused, silent server, closed port, DNS', async () => {
  const s = await server('S'), refused = await server('N'), silent = await server('S', { silent: true });
  try {
    assert.equal((await run(s, { ca: other.cert })).stage, 'tls');
    assert.equal((await run(s, { host: 'wrong.invalid' })).stage, 'tls');
    assert.deepEqual(await run(refused), { contract: 'assess-direct-tls-probe/1', outcome: 'STOP', stage: 'ssl-refused', family: 4, runtimeOrLaunchVerified: false });
    assert.equal((await run(silent)).outcome, 'STOP');
    const port = s.address().port; s.close(); await new Promise(r => setTimeout(r, 50));
    assert.equal((await probeTls({ host: 'localhost', port, ca: good.cert, family: 4, lookup: loopback, timeoutMs: 2000 })).stage, 'tcp');
    const noAaaa = async () => { throw Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' }); };
    assert.deepEqual(await probeTls({ ca: good.cert, lookup: noAaaa }), { contract: 'assess-direct-tls-probe/1', outcome: 'STOP', stage: 'dns', family: null, runtimeOrLaunchVerified: false });
  } finally { refused.close(); silent.close(); s.close(); }
});

test('default target is the direct host over IPv6 and the root must be the pinned Supabase CA', async () => {
  let asked;
  const capture = async (host, options) => { asked = [host, options]; throw new Error('stop'); };
  await probeTls({ ca: good.cert, lookup: capture });
  assert.deepEqual(asked, ['db.vlacestfruxooznrcjqc.supabase.co', { family: 6 }]);
  assert.throws(() => pinnedCa(good.cert), /ca_mismatch/);
  const real = execFileSync('python3', ['-B', '-c', "import importlib.util,sys;s=importlib.util.spec_from_file_location('t','scripts/assess/test_upload_worker_secret.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);sys.stdout.write(m.CA)"], { encoding: 'utf8' });
  assert.equal(pinnedCa(real), real);
});

test.after(() => rmSync(dir, { recursive: true, force: true }));
