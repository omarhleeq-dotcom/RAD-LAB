// Required synthetic ICU restore witness; missing Docker/image/ICU/locale/tools is a failure, never a skip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { containerArgs, restoreTest, IMAGE, IMAGE_DIGEST, parseExtensions } from '../ops/laptop-restore-test.mjs';
import { sha256Bytes, readEntries, validateLocale } from '../ops/laptop-backup-lib.mjs';
import { eventEntries, tocEntries } from '../ops/restore-event-triggers.mjs';

const locale = { datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8' };
const sqlLocale = "select datlocprovider,datlocale,datcollate,datctype from pg_database where datname=current_database()";
const docker = args => execFileSync('docker', args, { stdio: 'pipe', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });

test('pinned Supabase 17.11: single pass fails supautils; two passes restore exact event triggers, vault, ICU, roles and counts', { timeout: 300000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'rad086-icu-')), name = `rad086-icu-source-${process.pid}`;
  const at = '20261031T123000Z', dir = join(root, 'store', at);
  const c = { backupRoot: root }, identity = join(root, 'identity');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const key = execFileSync('age-keygen', [], { encoding: 'utf8', stdio: 'pipe' });
  writeFileSync(identity, key, { mode: 0o600 });
  c.ageRecipient = execFileSync('age-keygen', ['-y', identity], { encoding: 'utf8' }).trim();
  try {
    docker(containerArgs(name, locale));
    for (let n = 0; ; n++) {
      if (n > 90) throw Error('STOP ICU source readiness');
      if (String(docker(['logs', name])).includes('PostgreSQL init process complete; ready for start up.')) {
        try { docker(['exec', name, 'pg_isready', '-U', 'supabase_admin', '-d', 'postgres']); break; } catch { /* bounded readiness retry */ }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    const q = sql => String(docker(['exec', name, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'postgres', '-c', sql])).trim();
    docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-T', 'template0', '--encoding=UTF8',
      '--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8', 'synthetic']);
    const qs = sql => String(docker(['exec', name, 'psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'synthetic', '-c', sql])).trim();
    const actual = JSON.parse(qs(`select row_to_json(d) from (${sqlLocale}) d`));
    assert.deepEqual(actual, locale); // Proves the image really provides ICU and en_US.UTF-8.
    const version = Number(q('show server_version_num'));
    assert.equal(version, 170011);
    qs('CREATE EXTENSION supabase_vault; create table public.icu_witness(id integer primary key); insert into public.icu_witness values(1),(2),(3)');
    // Production's creation identity matters: postgres is not rolsuper in this image.
    assert.equal(q("select rolsuper from pg_roles where rolname='postgres'"), 'f');
    docker(['exec', name, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'synthetic', '-c',
      `CREATE FUNCTION public.rad086_event_fn() RETURNS event_trigger LANGUAGE plpgsql AS $$BEGIN END$$;
       CREATE EVENT TRIGGER rad086_owner_trigger ON ddl_command_end WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE') EXECUTE FUNCTION public.rad086_event_fn();
       ALTER EVENT TRIGGER rad086_owner_trigger ENABLE ALWAYS;`]);
    qs(`CREATE FUNCTION public.rad086_admin_fn() RETURNS event_trigger LANGUAGE plpgsql AS $$BEGIN END$$;
        CREATE EVENT TRIGGER rad086_admin_trigger ON sql_drop EXECUTE FUNCTION public.rad086_admin_fn();
        ALTER EVENT TRIGGER rad086_admin_trigger DISABLE;`);
    const dump = docker(['exec', name, 'pg_dump', '-U', 'supabase_admin', '-d', 'synthetic', '-Fc']);
    // A real role archive includes all image-managed roles, their settings and memberships.
    const roles = docker(['exec', name, 'pg_dumpall', '-U', 'supabase_admin', '--roles-only', '--no-role-passwords']);
    assert.match(String(roles), /CREATE ROLE supabase_admin;/);
    const toc = String(execFileSync('docker', ['exec', '-i', name, 'pg_restore', '--list'], { input: dump }));
    assert.ok(parseExtensions(toc).includes('supabase_vault'));
    assert.equal(eventEntries(toc).find(e => e.name === 'rad086_owner_trigger').owner, 'postgres');
    docker(['exec', name, 'createdb', '-U', 'supabase_admin', '-T', 'template0', '--locale-provider=icu', '--icu-locale=en-US', '--lc-collate=en_US.UTF-8', '--lc-ctype=en_US.UTF-8', 'single_pass']);
    const single = spawnSync('docker', ['exec', '-i', name, 'pg_restore', '--exit-on-error', '-U', 'supabase_admin', '--dbname', 'single_pass'], { input: dump, maxBuffer: 1024 * 1024 });
    assert.equal(single.status, 1);
    assert.ok(String(single.stderr).includes('Superuser owned event trigger must execute a superuser owned function'), 'single-pass must fail at the supautils ownership guard');
    for (const [f, b] of [['project.dump', dump], ['roles.sql', roles]]) writeFileSync(join(dir, f), b, { mode: 0o600 });
    writeFileSync(join(dir, 'checksums.json'), JSON.stringify({ 'project.dump': sha256Bytes(dump), 'roles.sql': sha256Bytes(roles) }), { mode: 0o600 });
    writeFileSync(join(dir, 'db-meta.json'), JSON.stringify({ ...locale, server_version_num: version, encoding: 'UTF8', tables: [['public', 'icu_witness', 3]] }), { mode: 0o600 });
    // The image supplies the exact pg_restore client for TOC inspection. Restore itself is the production function.
    const runner = (p, args, opts) => p === 'pg_restore'
      ? execFileSync('docker', ['exec', '-i', name, 'pg_restore', '--list'], { input: readFileSync(args.at(-1)), timeout: 120000 })
      : execFileSync(p, args, opts);
    const extraCanary = 'PRIVATE_IMAGE_SETTING_CANARY_86';
    // Inject one image-only setting on the target before its roles transaction.
    const withImageExtra = (p, args, opts) => {
      if (p === 'docker' && args.includes('show server_version_num'))
        docker(['exec', `rad-restore-${at.toLowerCase()}`, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'postgres',
          '-c', `ALTER ROLE supabase_admin SET rad086.image_only TO '${extraCanary}'`]);
      return runner(p, args, opts);
    };
    const result = await restoreTest(c, { name: at, run: withImageExtra });
    assert.equal(result.supabase_admin_extra_settings_count, 1);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_IMAGE_SETTING|rad086.image_only/);
    assert.equal(result.restore_test_pass, 1);
    assert.equal(result.rows_restored, 3);
    assert.equal(result.collation_match, 1);
    assert.equal(result.event_triggers_second_pass_count, 1);
    assert.equal(result.toc_entries_restored, tocEntries(toc).length);
    assert.doesNotMatch(JSON.stringify(result), /rad086_owner_trigger|rad086_admin_trigger/);
    const log = readEntries(c, identity);
    assert.equal(log[0].result, 'pass');
    assert.deepEqual(log[0].supabase_admin_extra_settings, ['rad086.image_only']);
    assert.deepEqual(log[0].event_triggers_second_pass, ['rad086_owner_trigger']);
    assert.equal(log[0].toc_entries_restored, tocEntries(toc).length);
    assert.doesNotMatch(JSON.stringify(log), /PRIVATE_IMAGE_SETTING/);
    assert.equal(log[0].image_digest, IMAGE_DIGEST);
    assert.equal(log[0].image_id, String(docker(['image', 'inspect', IMAGE, '--format', '{{.Id}}'])).trim());
    assert.equal(String(docker(['ps', '-a', '--filter', `name=rad-restore-${at.toLowerCase()}`, '--format', '{{.Names}}'])).trim(), '');
    for (const [k, v] of Object.entries(locale)) assert.equal(log[0][k], v);
    // Unknown or missing metadata must be rejected before starting a restore container.
    for (const bad of [{ datlocprovider: 'b' }, { datlocale: '' }]) assert.throws(() => validateLocale({ ...actual, ...bad }));
  } finally {
    try { docker(['rm', '-f', '-v', name]); } finally { rmSync(root, { recursive: true, force: true }); }
  }
});
