// Primary proof: byte-exact owner schema only, never provider rows or credentials.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { containerArgs, prepareRolesSql } from '../ops/laptop-restore-test.mjs';
import { archiveEventMetadata, EVENT_QUERY, compareEventMetadata } from '../ops/restore-event-triggers.mjs';
import { sha256Bytes } from '../ops/laptop-backup-lib.mjs';
import { rehearse } from './rad062-laptop-rehearsal.mjs';
const fixture = 'supabase/fixtures/production-schema-2026-11-01/';
const locale = { datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' };
const docker = (args, input) => execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args],
  { input, stdio: 'pipe', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });

test('real CRLF catalogue -> RAD-086 empty backup -> unchanged rehearse path, every P10 check and teardown', { timeout: 300000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'rad062-catalogue-')), name = `rad062-catalogue-${process.pid}`;
  const stamp = '20261101T070000Z', dir = join(root, 'store', stamp), target = `rad-restore-${stamp.toLowerCase()}`;
  const roles = readFileSync(fixture + 'roles.sql'), schema = readFileSync(fixture + 'schema.sql');
  assert.equal(sha256Bytes(roles), '3afbece3bafc53406f259e9da16b8a11ba9160567c587a2ce5f326ce2da666c9');
  assert.equal(sha256Bytes(schema), '4fc018a257d80b18916bae6ade40c625449a11cbf5fe52e2f47110db6f1e58b1');
  const q = (sql, database = 'catalogue') => String(docker(['exec', '-i', name, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', database, '-f', '-'], sql)).trim();
  const volumes = () => String(docker(['volume', 'ls', '--format', '{{.Name}}'])).trim().split('\n').sort();
  let sourceVolumes;
  try {
    docker(containerArgs(name, locale));
    for (let n = 0; ; n++) {
      if (n > 90) throw Error('catalogue_ready');
      if (String(docker(['logs', name])).includes('PostgreSQL init process complete; ready for start up.')) {
        try { docker(['exec', name, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']); break; } catch { /* bounded */ }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    const serverVersion = Number(q('show server_version_num', 'postgres'));
    assert.equal(serverVersion, 170011);
    q(prepareRolesSql(roles.toString()), 'postgres');
    docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-O', 'postgres', '-T', 'template0', '--encoding=UTF8', '--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8', 'catalogue']);
    // Same owner execution rule as the accepted RAD-086 event-trigger restore.
    // The session remains supabase_admin; original statements/metadata stay exact.
    const events = [...schema.toString().matchAll(/^ALTER EVENT TRIGGER ([a-z_][a-z0-9_]*) OWNER TO ([a-z_][a-z0-9_]*);$/gm)]
      .map(([, name, owner]) => ({ name, owner }));
    assert.ok(events.length > 0);
    const expectedEvents = archiveEventMetadata(schema.toString(), events);
    let load = schema.toString();
    const roleSnapshot = q("select jsonb_agg(to_jsonb(r) order by rolname) from pg_roles r");
    for (const { name, owner } of events) {
      if (q(`select rolsuper from pg_roles where rolname='${owner}'`, 'postgres') !== 'f') continue;
      const pattern = new RegExp(`^CREATE EVENT TRIGGER ${name} ON [\\s\\S]*?^ALTER EVENT TRIGGER ${name} OWNER TO ${owner};$`, 'gm');
      const blocks = [...load.matchAll(pattern)];
      assert.equal(blocks.length, 1);
      load = load.replace(pattern, block => `SET ROLE ${owner};\n${block}\nRESET ROLE;`);
    }
    q(load);
    assert.deepEqual(compareEventMetadata(expectedEvents, JSON.parse(q(EVENT_QUERY))), []);
    assert.equal(q("select jsonb_agg(to_jsonb(r) order by rolname) from pg_roles r"), roleSnapshot);
    assert.equal(q("select count(*) from pg_proc where position(chr(13)||chr(10) in prosrc)>0"), '44');
    assert.equal(q("select count(*) from pg_namespace where nspname='supabase_migrations'"), '0');
    const tables = JSON.parse(q(`select json_agg(json_build_array(n.nspname,c.relname,0) order by n.nspname collate "C",c.relname collate "C") from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast'`));
    for (const [s, t] of tables) assert.equal(q(`select count(*) from "${s.replaceAll('"','""')}"."${t.replaceAll('"','""')}"`), '0');
    if (process.env.CI === 'true') console.log(JSON.stringify({ source_frozen_b_measurement: q(readFileSync('supabase/checks/rad085-p1-b-ready.sql', 'utf8')), snapshot_tables: tables.length, snapshot_rows: 0 }));
    const dump = docker(['exec', name, 'pg_dump', '-U', 'supabase_admin', '-d', 'catalogue', '-Fc']);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    for (const [file, bytes] of [['roles.sql', roles], ['project.dump', dump]]) writeFileSync(join(dir, file), bytes, { mode: 0o600 });
    writeFileSync(join(dir, 'checksums.json'), JSON.stringify({ 'roles.sql': sha256Bytes(roles), 'project.dump': sha256Bytes(dump) }), { mode: 0o600 });
    writeFileSync(join(dir, 'db-meta.json'), JSON.stringify({ ...locale, encoding: 'UTF8', server_version_num: serverVersion, tables }), { mode: 0o600 });
    symlinkSync('store/' + stamp, join(root, 'daily'));
    const identity = join(root, 'identity');
    writeFileSync(identity, execFileSync('age-keygen', [], { stdio: 'pipe' }), { mode: 0o600 });
    const c = { backupRoot: root, ageRecipient: String(execFileSync('age-keygen', ['-y', identity])).trim() };
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (key.startsWith('PG') || ['DATABASE_URL','SUPABASE_DB_URL','RAD062_EXPECTED_PROJECT_REF','RAD062_POOLER_HOST'].includes(key)) delete env[key];
    sourceVolumes = volumes();
    const measured = [];
    const result = await rehearse(c, { env, observeFrozenB: kinds => { measured.push(kinds); console.log(JSON.stringify({ restored_frozen_b_measurement: kinds })); },
      syntheticDiagnostics: process.env.CI === 'true' ? error => console.log(JSON.stringify(error)) : undefined });
    assert.deepEqual(measured, [['relations']]);
    assert.equal(result.migrations_committed, 8);
    assert.equal(result.checks_passed, 10);
    assert.equal(result.data_precheck_failures, 0);
    assert.equal(result.transition_inspections_passed, 2);
    assert.equal(result.rows_restored, 0);
    assert.equal(result.teardown_pass, 1);
    console.log(JSON.stringify({ real_catalogue: result }));
  } finally {
    try {
      assert.equal(String(docker(['ps','-a','--filter',`name=^/${target}$`,'--format','{{.Names}}'])).trim(), '');
      if (sourceVolumes) assert.deepEqual(volumes(), sourceVolumes);
    } finally { try { docker(['rm','-f','-v',name]); } finally { rmSync(root, { recursive: true, force: true }); } }
  }
});
