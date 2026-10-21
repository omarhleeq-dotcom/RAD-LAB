// Diagnostic only: one read-only transaction, no Assess RPC or worker imports.
import { createHash, X509Certificate } from 'node:crypto';
import { open } from 'node:fs/promises';

export async function loadProbeConfig() {
  const file = await open('/run/secrets/assess-worker.json', 'r');
  try {
    if (!(await file.stat()).isFile()) throw new Error();
    const buffer = Buffer.alloc(65537);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (!length || length > 65536) throw new Error();
    return JSON.parse(buffer.subarray(0, length).toString('utf8'));
  } finally { await file.close(); }
}

export function probeOptions(config) {
  const expected = ['ca', 'database', 'host', 'password', 'port', 'sessionPoolerProjectRef', 'user'];
  if (!config || JSON.stringify(Object.keys(config).sort()) !== JSON.stringify(expected) ||
      config.host !== 'aws-1-eu-central-1.pooler.supabase.com' || config.port !== 5432 ||
      config.database !== 'postgres' || config.user !== 'assess_job_a' ||
      config.sessionPoolerProjectRef !== 'vlacestfruxooznrcjqc' ||
      typeof config.password !== 'string' || !/^[\x21-\x7e]{32,128}$/.test(config.password) ||
      typeof config.ca !== 'string' ||
      !/^-----BEGIN CERTIFICATE-----\s+[A-Za-z0-9+/=\s]+-----END CERTIFICATE-----\s*$/.test(config.ca)) throw new Error();
  const root = new X509Certificate(config.ca);
  if (createHash('sha256').update(root.raw).digest('hex') !==
      '807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa') throw new Error();
  return {
    host: config.host, port: config.port, database: config.database,
    user: `${config.user}.${config.sessionPoolerProjectRef}`, password: config.password,
    ssl: { ca: config.ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 10000, query_timeout: 10000,
    statement_timeout: 5000, lock_timeout: 2000,
    application_name: 'radlab-assess-connection-probe-v1',
    options: '-c search_path= -c default_transaction_read_only=on',
  };
}

export async function runConnectionProbe({ load = loadProbeConfig, makeClient }) {
  let client, transaction = false, failed = false, passed = false;
  try {
    client = makeClient(probeOptions(await load()));
    client.on('error', () => { failed = true; });
    await client.connect();
    await client.query('BEGIN READ ONLY');
    transaction = true;
    const initial = await client.query(`SELECT (
      current_database()='postgres' AND session_user='assess_job_a' AND current_user=session_user
      AND r.rolcanlogin AND r.rolvaliduntil>now() AND NOT r.rolinherit
      AND NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole
      AND NOT r.rolbypassrls AND NOT r.rolreplication AND r.rolconnlimit=2
      AND (SELECT count(*)=1 AND bool_and(g.rolname='assess_worker'
        AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option)
        FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles g ON g.oid=m.roleid
        WHERE m.member=r.oid)
    ) AS allowed FROM pg_catalog.pg_roles r WHERE r.rolname=session_user`);
    if (initial.rows.length !== 1 || initial.rows[0].allowed !== true) throw new Error();
    await client.query('SET LOCAL ROLE assess_worker');
    const effective = await client.query(`SELECT (
      current_database()='postgres' AND session_user='assess_job_a'
      AND current_user='assess_worker' AND current_setting('transaction_read_only')='on'
    ) AS allowed`);
    if (effective.rows.length !== 1 || effective.rows[0].allowed !== true) throw new Error();
    await client.query('ROLLBACK');
    transaction = false;
    passed = true;
  } catch { failed = true; }
  finally {
    if (client) {
      if (transaction) { try { await client.query('ROLLBACK'); } catch { failed = true; } }
      try { await client.end(); } catch { failed = true; }
    }
  }
  return {
    contract: 'assess-connection-probe/1', outcome: passed && !failed ? 'PASS' : 'STOP',
    runtimeOrLaunchVerified: false,
  };
}
