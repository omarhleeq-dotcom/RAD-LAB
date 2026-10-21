import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probeOptions, runConnectionProbe } from './connection-probe.mjs';

// Reuse the existing public certificate fixture; no private credentials.
const ca = readFileSync(new URL('./test_upload_worker_secret.py', import.meta.url), 'utf8')
  .match(/^CA = '([^']+)'$/m)[1].replaceAll('\\n', '\n');
const config = {
  host: 'aws-1-eu-central-1.pooler.supabase.com', port: 5432, database: 'postgres',
  user: 'assess_job_a', password: 'synthetic-only-credential-' + 'X'.repeat(40),
  ca, sessionPoolerProjectRef: 'vlacestfruxooznrcjqc',
};
function harness(failAt, wrongIdentity = false) {
  const calls = [];
  let options;
  const client = {
    on() {},
    async connect() { calls.push('connect'); if (failAt === 'connect') throw new Error(config.password); },
    async query(sql) {
      calls.push(sql);
      if (failAt && sql.startsWith(failAt)) throw new Error(config.password);
      return { rows: [{ allowed: !wrongIdentity }] };
    },
    async end() { calls.push('end'); if (failAt === 'end') throw new Error(config.password); },
  };
  return { calls, run: () => runConnectionProbe({ load: async () => config,
    makeClient: value => { options = value; return client; } }), getOptions: () => options };
}
test('strict destination, routing and CA verification; no connection-string or environment fallback', () => {
  const options = probeOptions(config);
  assert.equal(options.user, 'assess_job_a.vlacestfruxooznrcjqc');
  assert.deepEqual(options.ssl, { ca, rejectUnauthorized: true });
  assert.equal(options.connectionTimeoutMillis, 10000);
  for (const patch of [{ host: 'other.invalid' }, { user: 'postgres' }, { port: 6543 },
    { ca: 'not a certificate' }, { password: 'short' }, { connectionString: 'ignored?' },
    { ca: ca + ca }, { sessionPoolerProjectRef: 'other' }, { database: 'other' }]) {
    assert.throws(() => probeOptions({ ...config, ...patch }));
  }
});
test('one transaction, identity checks before role change, rollback and close, no RPCs', async () => {
  const h = harness();
  assert.deepEqual(await h.run(), { contract: 'assess-connection-probe/1', outcome: 'PASS', runtimeOrLaunchVerified: false });
  assert.equal(h.calls[1], 'BEGIN READ ONLY');
  assert.match(h.calls[2], /current_user=session_user/);
  assert.equal(h.calls[3], 'SET LOCAL ROLE assess_worker');
  assert.match(h.calls[4], /transaction_read_only/);
  assert.deepEqual(h.calls.slice(-2), ['ROLLBACK', 'end']);
  assert.equal(h.calls.filter(sql => /BEGIN/.test(sql)).length, 1);
  assert.equal(h.calls.some(sql => /\bassess\.|\b(?:COMMIT|INSERT|UPDATE|DELETE|ALTER|CREATE)\b/.test(sql)), false);
});
for (const phase of ['connect', 'BEGIN', 'SELECT', 'SET LOCAL', 'ROLLBACK', 'end']) {
  test(`fails closed and redacts provider errors at ${phase}`, async () => {
    const h = harness(phase);
    const report = await h.run();
    assert.equal(report.outcome, 'STOP');
    assert.equal(JSON.stringify(report).includes(config.password), false);
    assert.equal(h.calls.at(-1), 'end');
    if (phase === 'SELECT' || phase === 'SET LOCAL') assert.equal(h.calls.at(-2), 'ROLLBACK');
  });
}
test('identity mismatch rolls back before assuming worker role', async () => {
  const h = harness(undefined, true);
  assert.equal((await h.run()).outcome, 'STOP');
  assert.equal(h.calls.includes('SET LOCAL ROLE assess_worker'), false);
  assert.deepEqual(h.calls.slice(-2), ['ROLLBACK', 'end']);
});
test('bad secret never creates a client and never escapes in output', async () => {
  const report = await runConnectionProbe({ load: async () => { throw new Error(config.password); },
    makeClient: () => { assert.fail('must not connect'); } });
  assert.equal(report.outcome, 'STOP');
  assert.equal(JSON.stringify(report).includes(config.password), false);
});
