import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareRolesSql, restoreTest, reportRestoreStop } from '../ops/laptop-restore-test.mjs';
import { rolesDiagnostic, formatRolesStop, safeRole } from '../ops/roles-diagnostic.mjs';
import { sha256Bytes, readEntries } from '../ops/laptop-backup-lib.mjs';

const root = mkdtempSync(join(tmpdir(), 'rad086-diagnostic-'));
const bin = readdirSync('/usr/lib/postgresql').sort().map(v => `/usr/lib/postgresql/${v}/bin`).find(b => existsSync(b + '/initdb'));
assert.ok(bin, 'PostgreSQL server is required; never skip');
const as = process.getuid() === 0 ? ['runuser', '-u', 'postgres', '--'] : [];
if (as.length) execFileSync('chown', ['postgres', root]);
chmodSync(root, 0o700);
const sh = (p, a) => execFileSync(as[0] ?? p, [...as.slice(1), ...(as.length ? [p] : []), ...a], { stdio: 'pipe' });
sh(`${bin}/initdb`, ['-D', root + '/data', '-A', 'trust', '-U', 'postgres', '--locale=C']);
sh(`${bin}/pg_ctl`, ['-D', root + '/data', '-o', `-c listen_addresses='' -k ${root} -p 55437`, '-w', '-l', root + '/server.log', 'start']);
after(() => { try { sh(`${bin}/pg_ctl`, ['-D', root + '/data', '-m', 'immediate', 'stop']); } finally { rmSync(root, { recursive: true, force: true }); } });
const args = ['-X', '-q', '-h', root, '-p', '55437', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-f', '-'];
const q = input => spawnSync('psql', args, { input, encoding: 'utf8' });
assert.equal(q('CREATE ROLE rad086_boolean; CREATE ROLE rad086_config; ALTER ROLE rad086_config SET search_path TO public;').status, 0);
const canary = 'PRIVATE_VALUE_CANARY_86';
const mismatch = `CREATE ROLE rad086_boolean;\nALTER ROLE rad086_boolean WITH CREATEROLE;\nCREATE ROLE rad086_config;\nALTER ROLE rad086_config WITH NOLOGIN;\nALTER ROLE rad086_config SET search_path TO '${canary}';\n`;

test('one RAISE collects boolean and rolconfig keys, never values; transaction still rolls back', () => {
  const sql = prepareRolesSql('CREATE ROLE rad086_before;\n' + mismatch), r = q(sql);
  assert.notEqual(r.status, 0);
  const d = rolesDiagnostic(r.stderr, sql);
  assert.deepEqual(d, [
    { kind: 'attribute_mismatch', role: 'rad086_boolean', keys: 'rolcreaterole', sqlstate: 'P0001' },
    { kind: 'attribute_mismatch', role: 'rad086_config', keys: 'rolconfig', sqlstate: 'P0001' },
  ]);
  assert.doesNotMatch(d.map(formatRolesStop).join('\n'), /PRIVATE_VALUE|CREATEROLE|public|true|false/);
  const check = q("SELECT 1 / CASE WHEN EXISTS(SELECT FROM pg_roles WHERE rolname='rad086_before' OR rolname LIKE 'rad086_role_attribute_probe_%') THEN 0 ELSE 1 END; SELECT 1 / CASE WHEN (SELECT rolconfig::text FROM pg_roles WHERE rolname='rad086_config') LIKE '%public%' THEN 1 ELSE 0 END;");
  assert.equal(check.status, 0);
});

test('statement failures expose SQLSTATE, kind, safe roles and setting name only', () => {
  for (const [source, statement, role, setting, state] of [
    ['CREATE ROLE rad086_boolean;', 'CREATE_ROLE', 'rad086_boolean', 'unparsed', '42710'],
    ['ALTER ROLE rad086_absent WITH LOGIN;', 'ALTER_ROLE_WITH', 'rad086_absent', 'unparsed', '42704'],
    [`ALTER ROLE rad086_absent SET search_path TO '${canary}';`, 'ALTER_ROLE_SET', 'rad086_absent', 'search_path', '42704'],
    ['GRANT rad086_absent TO rad086_boolean;', 'GRANT', 'rad086_absent,rad086_boolean', 'unparsed', '42704'],
    [`SELECT '${canary}'::integer;`, 'other', 'unparsed', 'unparsed', '22P02'],
    // Dynamic probe failure: identify the original role, never the random probe.
    [`CREATE ROLE rad086_boolean;\nALTER ROLE rad086_boolean WITH NOLOGIN;\nALTER ROLE rad086_boolean SET work_mem TO '${canary}';\n`, 'ALTER_ROLE_SET', 'rad086_boolean', 'work_mem', '22023'],
  ]) {
    const sql = prepareRolesSql(source), r = q(sql);
    assert.notEqual(r.status, 0);
    assert.deepEqual(rolesDiagnostic(r.stderr, sql), [{ kind: 'statement_error', role, keys: 'unparsed', sqlstate: state, statement, setting }]);
    assert.doesNotMatch(formatRolesStop(rolesDiagnostic(r.stderr, sql)[0]), new RegExp(canary));
  }
});

test('unrecognised, oversized and unsafe fields fail closed, with bounded output', () => {
  for (const raw of [canary, 'ERROR: ' + canary, 'x'.repeat(1024 * 1024 + 1)]) {
    assert.deepEqual(rolesDiagnostic(raw, ''), [{ kind: 'statement_error', role: 'unparsed', keys: 'unparsed', sqlstate: 'unparsed', statement: 'other', setting: 'unparsed' }]);
  }
  assert.equal(safeRole('valid\n'), 'unparsed');
  const err = message => `psql:<stdin>:3: ERROR:  P0001: RAD086_roles_mismatch ${JSON.stringify(message)}\n`;
  const unsafe = rolesDiagnostic(err([{ role: 'bad role\n' + canary, keys: ['rolconfig'] }]), '');
  assert.equal(unsafe[0].role, 'unparsed');
  assert.equal(rolesDiagnostic(err([{ role: 'valid', keys: [canary] }]), '')[0].keys, 'unparsed');
  const many = rolesDiagnostic(err(Array.from({ length: 100 }, () => ({ role: 'valid', keys: ['rolconfig'] }))), '');
  assert.equal(many.length, 65); assert.equal(many.at(-1).role, 'unparsed');
  for (const d of many) assert.ok(formatRolesStop(d).length < 1500);
  for (const source of [`ALTER ROLE "bad role" SET search_path TO '${canary}';`, 'GRANT "bad role" TO rad086_boolean;']) {
    const sql = prepareRolesSql(source), r = q(sql);
    assert.equal(rolesDiagnostic(r.stderr, sql)[0].role, source.startsWith('GRANT') ? 'unparsed,rad086_boolean' : 'unparsed');
  }
});

test('production failure path logs the same diagnostics in age encryption; raw stdout/stderr and values never escape', async () => {
  const store = join(root, 'backups'), at = '20261031T123000Z', dir = join(store, 'store', at), identity = join(root, 'identity');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(identity, execFileSync('age-keygen', [], { stdio: 'pipe' }), { mode: 0o600 });
  const c = { backupRoot: store, ageRecipient: String(execFileSync('age-keygen', ['-y', identity])).trim() };
  for (const source of [mismatch, `ALTER ROLE rad086_absent SET search_path TO '${canary}';`]) {
    const dump = Buffer.from('synthetic');
    writeFileSync(join(dir, 'project.dump'), dump, { mode: 0o600 });
    writeFileSync(join(dir, 'roles.sql'), source, { mode: 0o600 });
    writeFileSync(join(dir, 'checksums.json'), JSON.stringify({ 'project.dump': sha256Bytes(dump), 'roles.sql': sha256Bytes(source) }), { mode: 0o600 });
    writeFileSync(join(dir, 'db-meta.json'), JSON.stringify({ server_version_num: 170011, datlocprovider: 'c', datlocale: null, datcollate: 'C', datctype: 'C', tables: [] }), { mode: 0o600 });
    let expected, cleanup = false;
    const run = (p, a, o) => {
      if (p === 'age') {
        assert.doesNotMatch(o.input, new RegExp(canary));
        return execFileSync(p, a, o);
      }
      if (p === 'pg_restore') return '';
      if (a[0] === 'image') return 'sha256:' + 'a'.repeat(64);
      if (a[0] === 'logs') return 'PostgreSQL init process complete; ready for start up.';
      if (a[0] === 'rm') cleanup = true;
      if (a.at(-1) === 'show server_version_num') return '170011';
      return '';
    };
    const spawn = (p, a, o) => {
      if (a.includes('pg_isready')) return { status: 0 };
      assert.ok(a.includes('ON_ERROR_STOP=1') && a.includes('VERBOSITY=verbose') && a.includes('-f'));
      const r = q(o.input);
      expected = rolesDiagnostic(r.stderr, o.input);
      // Simulate arbitrary additional sensitive data from psql/docker.
      return { ...r, stdout: canary, stderr: r.stderr + '\n' + canary };
    };
    await assert.rejects(restoreTest(c, { name: at, run, spawn, wait: async () => {} }), e => {
      assert.equal(e.stage, 'roles'); assert.deepEqual(e.diagnostics, expected);
      const emitted = [];
      reportRestoreStop(e, line => emitted.push(line));
      assert.deepEqual(emitted, expected.map(formatRolesStop));
      const output = emitted.join('\n');
      assert.doesNotMatch(output + JSON.stringify(e), new RegExp(canary));
      return true;
    });
    assert.ok(cleanup);
    const entry = readEntries(c, identity).at(-1);
    assert.deepEqual(entry.diagnostics, expected);
    assert.doesNotMatch(JSON.stringify(entry), new RegExp(canary));
    assert.equal(entry.kind, 'restore_test'); assert.equal(entry.stage, 'roles');
    for (const f of readdirSync(join(store, 'reconciliation'))) assert.doesNotMatch(readFileSync(join(store, 'reconciliation', f)).toString(), /rolconfig|statement_error/);
  }
});
