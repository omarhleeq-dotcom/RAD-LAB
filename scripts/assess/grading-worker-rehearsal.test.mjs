// RAD-085 W1–W3 rehearsal. Destructive synthetic QA only: new disposable databases, no URL/DSN,
// no provider, a FAKE secret sink. Three modes: embedded PostgreSQL 18.4 and pinned 17.11 with
// the latest migrations plus productionShapeSql, and the pinned Supabase 17.11.0.016 image with
// the real 2026-11-01 production roles/catalogue (non-superuser postgres, real PUBLIC TEMP, SCRAM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, createHmac, pbkdf2Sync } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { openLocalDatabase } from './local-database.mjs';
import { containerArgs, prepareRolesSql } from '../ops/laptop-restore-test.mjs';

const read = path => readFileSync(path, 'utf8');
const PROVISION = read('supabase/manual/assess-grading-worker-provision.sql');
const READY = read('supabase/checks/assess-grading-worker-ready.sql');
const LOGIN = read('supabase/manual/assess-grading-worker-login.sql');
const TEMP = read('supabase/manual/assess-grading-worker-public-temp.sql');
const STOP_V2 = read('supabase/manual/assess-emergency-stop-v2.sql');
// The exact binding predicates, taken from the shipped source rather than copied.
const runtime = read('src/features/assess/server-runtime.ts');
const LOGIN_CHECK = runtime.match(/gradingOnly \? `(select \([\s\S]*?where r\.rolname=session_user)` :/)[1].replace('$1', "'assess_job_b'");
const ACL_CHECK = runtime.match(/const acl = await client\.query<\{ allowed: boolean \}>\(`(select[\s\S]*?as allowed)`\)/)[1];
const STRUCTURE = ['group_role_flags', 'group_no_memberships', 'group_members_slot_only', 'group_execute_exact',
  'group_schema_usage_assess', 'no_table_privileges', 'slot_flags', 'slot_membership_exact', 'slot_marker', 'slot_connect',
  'slot_a_not_login', 'gate_closed', 'backend_sessions_absent'];

// Fake secret sink: a gcloud stand-in that keeps the payload in a 0600 file inside a temp dir.
function transport() {
  const root = mkdtempSync(join(tmpdir(), 'rad085-grading-transport-'));
  try {
    mkdirSync(join(root, 'home', 'assess-ca'), { recursive: true });
    mkdirSync(join(root, 'bin'));
    const ca = execFileSync('python3', ['-B', '-c', "import importlib.util,sys;s=importlib.util.spec_from_file_location('t','scripts/assess/test_upload_worker_secret.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);sys.stdout.write(m.CA)"], { encoding: 'utf8' });
    writeFileSync(join(root, 'home', 'assess-ca', 'prod-ca-2021.crt'), ca);
    const sink = join(root, 'sink.json');
    writeFileSync(join(root, 'bin', 'gcloud'), `#!/usr/bin/env python3
import os, sys
args = sys.argv[1:]
verb = args[args.index("versions") + 1]
name = "projects/124842667755/secrets/assess-worker-config/versions/"
if verb == "list": print('[{"name": "%s1", "state": "DISABLED"}]' % name)
elif verb == "add":
    data = sys.stdin.buffer.read()
    fd = os.open(${JSON.stringify(sink)}, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.write(fd, data); os.close(fd); print(name + "2")
elif verb == "disable": pass
elif verb == "describe": print("DISABLED")
else: sys.exit(3)
`);
    chmodSync(join(root, 'bin', 'gcloud'), 0o700);
    const run = spawnSync('python3', ['-I', '-B', 'scripts/assess/rotate-grading-credential.py', '--valid-days', '30'],
      { env: { PATH: join(root, 'bin') + ':' + process.env.PATH, HOME: join(root, 'home') }, encoding: 'utf8', timeout: 60000 });
    assert.equal(run.status, 0, 'transport STOP');
    assert.match(run.stderr, /^PASS: secret version 2 added and DISABLED/);
    const { password, user, host } = JSON.parse(readFileSync(sink, 'utf8'));
    assert.equal(user, 'assess_job_b');
    assert.equal(host, 'db.vlacestfruxooznrcjqc.supabase.co');
    assert.ok(!run.stdout.includes(password) && !run.stderr.includes(password), 'plaintext reached stdout/stderr');
    return { sql: run.stdout, password, verifier: run.stdout.match(/password '([^']+)'/)[1] };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
function verifierFor(password, verifier) {
  const [, rest] = verifier.split('$4096:');
  const salt = Buffer.from(rest.split('$')[0], 'base64');
  const salted = pbkdf2Sync(password, salt, 4096, 32, 'sha256');
  const clientKey = createHmac('sha256', salted).update('Client Key').digest();
  return `SCRAM-SHA-256$4096:${salt.toString('base64')}$${createHash('sha256').update(clientKey).digest('base64')}:${createHmac('sha256', salted).update('Server Key').digest('base64')}`;
}
const lines = results => (Array.isArray(results) ? results : [results]).flatMap(r => (r.rows ?? []).map(row =>
  Object.values(row).map(v => v === true ? 't' : v === false ? 'f' : v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)).join('|'))).filter(l => l !== '');

async function localContext(productionVersion) {
  const db = await openLocalDatabase('postgres', { through: 'latest', productionVersion });
  const host = (await db.query('show unix_socket_directories'))[0].unix_socket_directories;
  const database = (await db.query('select current_database() d'))[0].d;
  const clients = new Set();
  async function client(user) {
    const c = new pg.Client({ host, port: 55432, user, database, password: '', ssl: false, connectionTimeoutMillis: 10000, query_timeout: 20000 });
    clients.add(c); c.on('error', () => {}); await c.connect(); return c;
  }
  const admin = await client('postgres');
  // Production fact (2026-11-01 roles snapshot): assess_job_b is absent; the fixture adds it NOLOGIN for 0200.
  await admin.query('drop role assess_job_b');
  async function run(c, sql) {
    try { return lines(await c.query(sql)); }
    catch (e) { try { await c.query('rollback'); } catch { /* closed */ } throw e; }
  }
  let slotClient;
  return {
    name: productionVersion ? 'pinned-17.11' : 'embedded-18.4', superuser: true,
    admin: sql => run(admin, sql), super: sql => run(admin, sql),
    async slot(sql) { slotClient ??= await client('assess_job_b'); return run(slotClient, sql); },
    async slotFresh() { const c = await client('assess_job_b'); await c.end(); clients.delete(c); },
    async close() { await Promise.allSettled([...clients].map(c => c.end())); await db.close(); },
  };
}

function supabaseContext() {
  const name = `rad085-grading-${process.pid}`, fixture = 'supabase/fixtures/production-schema-2026-11-01/';
  const docker = (args, input) => execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args],
    { input, stdio: 'pipe', timeout: 180000, maxBuffer: 64 * 1024 * 1024 }).toString();
  const psql = (user, sql, password) => {
    const env = password ? ['-e', 'PGPASSFILE=/tmp/rad085-pgpass'] : [];
    if (password) docker(['exec', '-i', name, 'sh', '-c', 'umask 077; cat > /tmp/rad085-pgpass'], `127.0.0.1:5432:catalogue:assess_job_b:${password}\n`);
    try {
      return docker(['exec', '-i', ...env, name, 'psql', '-X', '-q', '-At', '-F', '|', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-U', user, '-d', 'catalogue', '-f', '-'], sql)
        .split('\n').filter(Boolean);
    } catch (e) { throw Object.assign(new Error('psql_failed'), { stderr: String(e.stderr ?? '') }); }
    finally { if (password) docker(['exec', name, 'rm', '-f', '/tmp/rad085-pgpass']); }
  };
  let password;
  return {
    name: 'supabase-17.11.0.016', superuser: false,
    async open() {
      docker(containerArgs(name, { datlocprovider: 'c', datlocale: null, datcollate: 'C', datctype: 'C' }));
      for (let n = 0; ; n++) {
        if (n > 90) throw Error('supabase_ready');
        if (docker(['logs', name]).includes('PostgreSQL init process complete; ready for start up.')) {
          try { docker(['exec', name, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']); break; } catch { /* bounded */ }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      const q = (sql, db = 'postgres') => docker(['exec', '-i', name, 'psql', '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', db, '-f', '-'], sql).trim();
      assert.equal(q('show server_version_num'), '170011');
      q(prepareRolesSql(read(fixture + 'roles.sql')));
      docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-O', 'postgres', '-T', 'template0', '--encoding=UTF8', '--locale=C', 'catalogue']);
      let load = read(fixture + 'schema.sql');
      for (const [, trigger, owner] of load.matchAll(/^ALTER EVENT TRIGGER ([a-z_][a-z0-9_]*) OWNER TO ([a-z_][a-z0-9_]*);$/gm)) {
        if (q(`select rolsuper from pg_roles where rolname='${owner}'`) !== 'f') continue;
        load = load.replace(new RegExp(`^CREATE EVENT TRIGGER ${trigger} ON [\\s\\S]*?^ALTER EVENT TRIGGER ${trigger} OWNER TO ${owner};$`, 'gm'),
          block => `SET ROLE ${owner};\n${block}\nRESET ROLE;`);
      }
      q(load, 'catalogue');
      // Schema-only snapshot: seed the reviewed closed gate row exactly as the migration does.
      q('set role postgres;' + read('supabase/migrations/20261020000700_assess_lifecycle.sql').match(/^insert into assess\.launch_gate [^;]+;/m)[0], 'catalogue');
      // Real SCRAM for the slot only on loopback; every other line of the image hba is unchanged.
      docker(['exec', name, 'sed', '-i', '1i host catalogue assess_job_b 127.0.0.1/32 scram-sha-256', '/etc/postgresql/pg_hba.conf']);
      q('select pg_reload_conf()');
      assert.deepEqual(psql('postgres', 'select current_user, rolsuper from pg_roles where rolname=current_user;'), ['postgres|f']);
    },
    admin: async sql => psql('postgres', sql),
    super: async sql => (docker(['exec', '-i', name, 'psql', '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'catalogue', '-f', '-'], sql).split('\n').filter(Boolean)),
    setPassword(p) { password = p; },
    slot: async sql => psql('assess_job_b', sql, password),
    async slotFresh() { psql('assess_job_b', 'select 1;', password); },
    async close() { docker(['rm', '-f', '-v', name]); },
  };
}

async function refuses(promise) { await assert.rejects(promise); }
async function denied(promise) {
  await assert.rejects(promise, e => e.code === '42501' || /permission denied/.test(e.stderr ?? ''), 'expected a privilege denial');
}
async function ready(ctx) { return Object.fromEntries((await ctx.admin(READY)).map(l => l.split('|')).map(([k, v]) => [k, v === 't'])); }
async function tempRoles(ctx) {
  return (await ctx.super("select rolname from pg_roles where rolname !~ '^pg_' and has_database_privilege(oid,current_database(),'TEMP') order by 1;"));
}

async function exercise(ctx) {
  const evidence = [];
  // 1. Refusal guards before any change.
  await ctx.super('update assess.launch_gate set enabled=true;');
  await refuses(ctx.admin(PROVISION));
  await ctx.super('update assess.launch_gate set enabled=false;');
  assert.deepEqual(await ctx.super("select count(*) from pg_roles where rolname in ('assess_grading_worker','assess_job_b');"), ['0']);
  evidence.push('open-gate-refused-no-role');
  // 2. Apply; structure ready, binding still refuses because PUBLIC TEMP exists.
  assert.deepEqual(await ctx.admin(PROVISION), ['assess-grading-worker-provision/1|t']);
  let r = await ready(ctx);
  for (const key of STRUCTURE) assert.equal(r[key], true, `${ctx.name} ${key}`);
  assert.equal(r.binding_acl_ready, false, 'PUBLIC TEMP must make the binding refuse');
  for (const key of ['credential_window', 'slot_login', 'binding_login_ready']) assert.equal(r[key], false);
  evidence.push('provision-structure-ready', 'public-temp-blocks-binding');
  // 3. Re-apply refuses safely and changes nothing.
  const before = await ctx.super("select rolname||rolcanlogin||coalesce(rolvaliduntil::text,'') from pg_roles where rolname in ('assess_grading_worker','assess_job_b') order by 1;");
  await refuses(ctx.admin(PROVISION));
  assert.deepEqual(await ctx.super("select rolname||rolcanlogin||coalesce(rolvaliduntil::text,'') from pg_roles where rolname in ('assess_grading_worker','assess_job_b') order by 1;"), before);
  await refuses(ctx.admin(LOGIN));
  evidence.push('reapply-and-premature-login-refused');
  // 4. W2/W3 transport through the fake sink; only a verifier reaches the database.
  const { sql, password, verifier } = transport();
  assert.equal(verifierFor(password, verifier), verifier);
  assert.deepEqual(await ctx.admin(sql), ['assess-grading-credential/1|t|f']);
  assert.deepEqual(await ctx.super("select rolpassword from pg_authid where rolname='assess_job_b';"), [verifier]);
  ctx.setPassword?.(password);
  r = await ready(ctx);
  assert.equal(r.credential_window, true); assert.equal(r.slot_login, false);
  evidence.push('scram-verifier-stored-verbatim-nologin-kept');
  // 5. LOGIN is refused while the binding would refuse (TEMP); then the D-W1 proposal.
  await refuses(ctx.admin(LOGIN));
  const tempBefore = await tempRoles(ctx);
  assert.ok(tempBefore.includes('assess_grading_worker') && tempBefore.includes('assess_job_b'));
  assert.deepEqual(await ctx.admin(TEMP), ['assess-grading-worker-public-temp/1|t|t']);
  assert.deepEqual(await tempRoles(ctx), tempBefore.filter(n => n !== 'assess_grading_worker' && n !== 'assess_job_b'));
  await refuses(ctx.admin(TEMP));
  assert.deepEqual(await ctx.admin('begin; create temporary table rad085_owner_temp(x int) on commit drop; select 1; commit;'), ['1']);
  evidence.push('d-w1-temp-kept-for-every-existing-role-and-owner');
  // 6. Activation step 4.3 and the exact binding checks as the slot.
  assert.deepEqual(await ctx.admin(LOGIN), ['assess-grading-worker-login/1|t|t']);
  r = await ready(ctx);
  for (const [key, value] of Object.entries(r)) assert.equal(value, true, `${ctx.name} ${key}`);
  assert.deepEqual(await ctx.slot(`begin; ${LOGIN_CHECK}; set local role assess_grading_worker; ${ACL_CHECK}; select (assess.health_v1() is not null)::text; rollback;`), ['t', 't', 'true']);
  for (const statement of ['set role assess_worker;', 'select count(*) from assess.sessions;', 'select count(*) from public.profiles;',
    'begin; set local role assess_grading_worker; create temp table stolen(x int); rollback;',
    "begin; set local role assess_grading_worker; select assess.recover_v1('00000000-0000-0000-0000-000000000001'); rollback;"])
    await denied(ctx.slot(statement));
  if (ctx.setPassword) {
    // Real SCRAM: the hba line is not trust, a wrong password is rejected for the same slot.
    ctx.setPassword('A'.repeat(48)); await refuses(ctx.slot('select 1;')); ctx.setPassword(password);
    evidence.push('wrong-password-rejected-scram');
  }
  evidence.push('binding-login-and-acl-allowed-least-privilege-denials');
  // 7. Rollback: v2 stop packet (latest schema) or plain NOLOGIN (2026-11-01 catalogue lacks freeze_v2).
  if (ctx.superuser) {
    const stop = (await ctx.admin(STOP_V2)).at(-1).split('|');
    assert.equal(stop[1], 'STOPPED');
  } else {
    await ctx.admin("begin; set local lock_timeout='2s'; alter role assess_job_b nologin; commit;");
  }
  r = await ready(ctx);
  assert.equal(r.slot_login, false); assert.equal(r.binding_login_ready, false);
  await refuses(ctx.slotFresh());
  evidence.push(ctx.superuser ? 'v2-stop-packet-covers-slot' : 'nologin-rejects-new-scram-login');
  return evidence;
}

for (const mode of ['embedded', 'pinned-17.11', 'supabase-17.11']) {
  test(`grading worker W1-W3 rehearsal: ${mode}`, { timeout: 600000 }, async () => {
    let ctx;
    try {
      if (mode === 'supabase-17.11') { ctx = supabaseContext(); await ctx.open(); }
      else ctx = await localContext(mode === 'pinned-17.11');
      const evidence = await exercise(ctx);
      console.log(JSON.stringify({ contract: 'rad085-grading-worker-rehearsal/1', mode: ctx.name, outcome: 'PASS', evidence,
        providerVerified: false, runtimeOrLaunchVerified: false }));
    } finally { if (ctx) await ctx.close(); }
  });
}
