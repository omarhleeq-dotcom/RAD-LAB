// RAD-086 restore proof on the owner's laptop: restore the chosen backup into a throwaway local pinned Supabase PostgreSQL 17.11 container
// (no network at all, no published ports), with the live provider/datlocale/datcollate/datctype recorded at backup time, then compare table counts
// taken from the same snapshot as the dump. Records the result in the encrypted reconciliation log. Never touches the provider.
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Stop, guard, loadConfig, resolveBackup, verifyBackup, appendEntry, quoteIdent, validateLocale, localeArgs } from './laptop-backup-lib.mjs';

import { rolesDiagnostic, formatRolesStop, safeRole, parseExtraSettings } from './roles-diagnostic.mjs';
import { restorePlan, restoreDiagnostic, formatRestoreDiagnostic, archiveEventMetadata, EVENT_QUERY, compareEventMetadata, formatEventMismatch } from './restore-event-triggers.mjs';

export const IMAGE_DIGEST = 'sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d';
export const IMAGE = `supabase/postgres:17.11.0.016@${IMAGE_DIGEST}`;

const ADMIN = 'supabase_admin', DB = 'rad_restore';

// Streams a file to `docker exec -i`. Using stdin avoids bind mounts and uid/permission differences with 0600 backup files.
function dockerRestore(args, file, toc, run = spawnSync) {
  const r = run('docker', args, { input: readFileSync(file), maxBuffer: 1024 * 1024, timeout: 3600000 });
  if (r.status !== 0) throwRestoreFailure(r, toc);
  return String(r.stdout ?? '');
}
function throwRestoreFailure(r, toc) {
  const e = new Stop('restore');
  e.restoreDiagnostic = restoreDiagnostic(r.stderr, r, toc);
  e.restoreSilent = e.restoreDiagnostic === null;
  throw e;
}
export function containerArgs(name, meta) {
  // No -p/-P, --network none, image must already be present (--pull never). Trust auth is safe only because there is no network.
  return ['run', '-d', '--name', name, '--label', 'rad-lab-restore-test=1', '--network', 'none', '--pull', 'never',
    '--mount', 'type=volume,destination=/var/lib/postgresql/data',
    '-e', `POSTGRES_USER=${ADMIN}`, '-e', 'PGHOST=/var/run/postgresql', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
    '-e', `POSTGRES_INITDB_ARGS=--encoding=UTF8 ${localeArgs(meta).join(' ')}`, IMAGE];
}
export function parseExtensions(toc) {
  return [...String(toc).matchAll(/^\d+; \d+ \d+ EXTENSION - ([A-Za-z0-9_-]+)\s*$/gm)].map(m => m[1]);
}
// pg_dumpall --roles-only --no-role-passwords emits adjacent CREATE/ALTER WITH pairs.
// Only those pairs are conditional. Every other byte (settings, memberships, comments,
// psql restrict guards) still executes under ON_ERROR_STOP, in one transaction.
export function prepareRolesSql(sql) {
  const literal = value => "'" + value.replaceAll("'", "''") + "'";
  const settings = new Map();
  const adminSettings = [];
  for (const m of String(sql).matchAll(/^ALTER ROLE ("(?:[^"\n]|"")*"|[a-z_][a-z0-9_$]*) SET ([^\r\n]+);\r?$/gm)) {
    if (m[1] === 'supabase_admin' || m[1] === '"supabase_admin"') adminSettings.push(m[2]);
    settings.set(m[1], [...(settings.get(m[1]) ?? []), m[2]]);
  }
  const body = String(sql).replace(/^CREATE ROLE ("(?:[^"\n]|"")*"|[a-z_][a-z0-9_$]*);\r?\nALTER ROLE \1 WITH ([^\r\n]+);\r?$/gm, (pair, ident, attrs) => {
    const name = ident.startsWith('"') ? ident.slice(1, -1).replaceAll('""', '"') : ident;
    // Compare all server-defined attributes and defaults; only the hard-coded
    // supabase_admin.rolconfig pair moves to the exact post-body check below.
    // Identity and passwords are excluded: the archive uses --no-role-passwords.
    const projection = "to_jsonb(r) - ARRAY['oid','rolname','rolpassword']" +
      (name === 'supabase_admin' ? " - 'rolconfig'" : '');
    const probe = 'rad086_role_attribute_probe_' + randomUUID().replaceAll('-', '');
    const code = `BEGIN
      IF EXISTS (SELECT FROM pg_authid WHERE rolname=${literal(name)}) THEN
        CREATE ROLE ${probe};
        EXECUTE ${literal(`ALTER ROLE ${probe} WITH ${attrs}`)};
        ${(settings.get(ident) ?? []).map(value => `EXECUTE ${literal(`ALTER ROLE ${probe} SET ${value}`)};`).join('\n')}
        IF (SELECT ${projection} FROM pg_roles r WHERE rolname=${literal(name)})
           IS DISTINCT FROM (SELECT ${projection} FROM pg_roles r WHERE rolname='${probe}') THEN
          INSERT INTO pg_temp.rad086_roles_mismatch
          SELECT ${literal(safeRole(name))}, array_agg(a.key ORDER BY a.key)
          FROM jsonb_each((SELECT ${projection} FROM pg_roles r WHERE rolname=${literal(name)})) a
          FULL JOIN jsonb_each((SELECT ${projection} FROM pg_roles r WHERE rolname='${probe}')) b USING (key)
          WHERE a.value IS DISTINCT FROM b.value;
        END IF;
        DROP ROLE ${probe};
      ELSE
        EXECUTE ${literal(`CREATE ROLE ${ident}`)};
        EXECUTE ${literal(`ALTER ROLE ${ident} WITH ${attrs}`)};
      END IF;
    END`;
    return `DO ${literal(code)};`;
  });
  // PostgreSQL itself canonicalises archive SET values on an isolated probe. Never
  // copy/reset settings on the image role. Only global SET lines enter this check.
  const configProbe = 'rad086_role_config_probe_' + randomUUID().replaceAll('-', '');
  const expected = adminSettings.length ? `DO ${literal(`BEGIN
    CREATE ROLE ${configProbe};
    ${adminSettings.map(value => `EXECUTE ${literal(`ALTER ROLE ${configProbe} SET ${value}`)};`).join('\n')}
    INSERT INTO pg_temp.rad086_admin_expected
      SELECT split_part(entry, '=', 1), entry FROM pg_roles r,
        unnest(r.rolconfig) entry WHERE r.rolname='${configProbe}';
    DROP ROLE ${configProbe};
  END`)};` : '';
  return `BEGIN;
CREATE TEMP TABLE rad086_admin_expected(name text, entry text) ON COMMIT DROP;
${expected}
CREATE TEMP TABLE rad086_roles_mismatch(role text, keys text[]) ON COMMIT DROP;
${body}
DO 'BEGIN
  IF EXISTS (SELECT FROM pg_temp.rad086_roles_mismatch) THEN
    RAISE EXCEPTION USING MESSAGE = ''RAD086_roles_mismatch '' ||
      (SELECT json_agg(row_to_json(m) ORDER BY role)::text FROM pg_temp.rad086_roles_mismatch m);
  END IF;
END';
CREATE TEMP TABLE rad086_admin_final ON COMMIT DROP AS
  SELECT split_part(entry, '=', 1) AS name, entry FROM pg_roles r,
    unnest(r.rolconfig) entry WHERE r.rolname='supabase_admin';
DO 'DECLARE bad text[]; BEGIN
  IF EXISTS (SELECT FROM pg_temp.rad086_admin_expected WHERE name !~ ''^[A-Za-z_][A-Za-z0-9_.]{0,62}$'')
     OR EXISTS (SELECT FROM pg_temp.rad086_admin_final WHERE name !~ ''^[A-Za-z_][A-Za-z0-9_.]{0,62}$'')
     OR (SELECT count(*) FROM pg_temp.rad086_admin_expected) > 64
     OR (SELECT count(*) FROM pg_temp.rad086_admin_final) > 64 THEN
    RAISE EXCEPTION ''RAD086_rolconfig_mismatch ["unparsed"]'';
  END IF;
  SELECT array_agg(e.name ORDER BY e.name) INTO bad
    FROM pg_temp.rad086_admin_expected e
    WHERE NOT EXISTS (SELECT FROM pg_temp.rad086_admin_final f
      WHERE convert_to(f.entry, ''UTF8'') = convert_to(e.entry, ''UTF8''));
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE = ''RAD086_rolconfig_mismatch '' || array_to_json(bad)::text;
  END IF;
END';
SELECT 'RAD086_supabase_admin_extra_settings ' || coalesce(json_agg(f.name ORDER BY f.name)::text, '[]')
  FROM pg_temp.rad086_admin_final f
  WHERE NOT EXISTS (SELECT FROM pg_temp.rad086_admin_expected e WHERE e.name=f.name);
COMMIT;
`;
}
export function readMeta(dir) {
  const m = JSON.parse(readFileSync(join(dir, 'db-meta.json'), 'utf8'));
  validateLocale(m);
  if (!Number.isInteger(m.server_version_num) || !Array.isArray(m.tables)) throw Error('meta');
  for (const [s, t, n] of m.tables) { quoteIdent(s); quoteIdent(t); if (n !== null && !Number.isSafeInteger(n)) throw Error('meta'); }
  return m;
}

export async function restoreTest(c, { name = 'latest', dryRun = false, run = execFileSync, spawn = spawnSync, wait = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  let stage = 'select', container = null, dir, backup, imageId, extraSettings, secondPass, tocRestored = 0;
  const sh = (args, o = {}) => String(run('docker', args, { encoding: 'utf8', stdio: 'pipe', timeout: 600000, ...o }));
  const exec = (cmd, o) => sh(['exec', ...(o?.stdin ? ['-i'] : []), container, ...cmd]);
  try {
    dir = resolveBackup(c, name); backup = dir.split('/').at(-1);
    stage = 'verify'; await verifyBackup(dir);
    stage = 'meta'; const meta = readMeta(dir);
    stage = 'image'; imageId = sh(['image', 'inspect', IMAGE, '--format', '{{.Id}}']).trim();
    if (!/^sha256:[0-9a-f]{64}$/.test(imageId)) throw new Stop('image');
    if (dryRun) return { dry_run: 1, tables: meta.tables.length, docker_started: 0 };
    container = `rad-restore-${backup.toLowerCase()}`;
    stage = 'container'; sh(containerArgs(container, meta));
    stage = 'ready';
    for (let n = 0; ; n++) {
      if (n > 90) throw new Stop('ready');
      const logs = sh(['logs', container], { stdio: ['ignore', 'pipe', 'pipe'] });
      if (logs.includes('PostgreSQL init process complete; ready for start up.')) {
        const r = spawn('docker', ['exec', container, 'pg_isready', '-U', ADMIN, '-d', 'postgres'], { timeout: 15000 });
        if (r.status === 0) break;
      }
      await wait(2000);
    }
    const server = Number(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', 'postgres', '-c', 'show server_version_num']).trim());
    if (server !== meta.server_version_num) throw new Stop('version');
    stage = 'extensions';
    let toc;
    try {
      toc = String(run('pg_restore', ['--list', join(dir, 'project.dump')], { encoding: 'utf8', stdio: 'pipe', timeout: 600000, maxBuffer: 256 * 1024 * 1024 }));
    } catch (e) { throwRestoreFailure(e, ''); }
    const available = new Set(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', 'postgres', '-c', 'select name from pg_available_extensions']).split('\n'));
    const missing = parseExtensions(toc).filter(x => !available.has(x));
    if (missing.length) { const e = new Stop('extensions'); e.missing = missing; throw e; }
    stage = 'roles';
    const rolesSql = prepareRolesSql(readFileSync(join(dir, 'roles.sql'), 'utf8'));
    const roles = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-U', ADMIN, '-d', 'postgres', '-f', '-'],
      { input: rolesSql, maxBuffer: 64 * 1024 * 1024, timeout: 600000 });
    if (roles.status !== 0) { const e = new Stop('roles'); e.diagnostics = rolesDiagnostic(roles.stderr, rolesSql); throw e; }
    extraSettings = parseExtraSettings(roles.stdout);
    stage = 'collation';
    // Successful creation is also the capability probe: absent ICU or libc locale is a hard STOP.
    exec(['createdb', '-U', ADMIN, '-T', 'template0', '--encoding=UTF8', ...localeArgs(meta), DB]);
    const verifyLocale = () => {
      const loc = exec(['psql', '-X', '-At', '-F', '|', '-U', ADMIN, '-d', 'postgres', '-c', `select datlocprovider, coalesce(datlocale,''), datcollate, datctype from pg_database where datname='${DB}'`]).trim();
      const collation_match = loc === `${meta.datlocprovider}|${meta.datlocale ?? ''}|${meta.datcollate}|${meta.datctype}`;
      if (!collation_match) throw new Stop('collation');
    };
    verifyLocale();
    stage = 'restore';
    const rolesByName = new Map();
    // The decision uses the actual target catalog, after the unchanged roles guard.
    const roleRows = exec(['psql', '-X', '-At', '-F', '|', '-U', ADMIN, '-d', DB, '-c', 'select rolname, rolsuper from pg_roles']).trim();
    for (const row of roleRows ? roleRows.split('\n') : []) {
      const m = /^([A-Za-z_][A-Za-z0-9_$]{0,62})\|([tf])$/.exec(row);
      if (m) rolesByName.set(m[1], m[2] === 't');
    }
    const plan = restorePlan(toc, rolesByName);
    secondPass = plan.second.map(e => e.name);
    const putList = (path, input) => sh(['exec', '-i', container, 'tee', path], { input, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
    const dump = join(dir, 'project.dump');
    const restore = args => dockerRestore(['exec', '-i', container, 'pg_restore', '--exit-on-error', ...args], dump, toc, spawn);
    const firstPath = '/tmp/rad086-first.list', eventPath = '/tmp/rad086-events.list', singlePath = '/tmp/rad086-single.list';
    putList(firstPath, plan.first);
    let expected = [];
    if (plan.events.length) {
      putList(eventPath, plan.events.map(e => e.line).join(''));
      expected = archiveEventMetadata(restore(['-L', eventPath, '--schema-only', '--file=-']), plan.events);
    }
    restore(['-U', ADMIN, '--dbname', DB, '-L', firstPath]);
    tocRestored = plan.count - plan.second.length;
    for (const entry of plan.second) {
      putList(singlePath, entry.line);
      restore(['-U', ADMIN, '--dbname', DB, `--role=${entry.owner}`, '-L', singlePath]);
      tocRestored++;
    }
    const actual = exec(['psql', '-X', '-At', '-U', ADMIN, '-d', DB, '-c', EVENT_QUERY]);
    const mismatches = compareEventMetadata(expected, JSON.parse(actual));
    if (mismatches.length) { const e = new Stop('restore'); e.eventMismatches = mismatches; throw e; }
    stage = 'collation'; verifyLocale();
    stage = 'counts';
    const counted = meta.tables.filter(([, , n]) => n !== null);
    let mismatched = 0, rows = 0;
    for (const [s, t, n] of counted) {
      const got = Number(exec(['psql', '-X', '-At', '-U', ADMIN, '-d', DB, '-c', `select count(*) from ${quoteIdent(s)}.${quoteIdent(t)}`]).trim());
      rows += got; if (got !== n) mismatched++;
    }
    if (mismatched) { const e = new Stop('counts'); e.detail = { tables_compared: counted.length, tables_mismatched: mismatched }; throw e; }
    stage = 'log';
    const result = { tables_compared: counted.length, tables_mismatched: 0, rows_restored: rows, tables_uncounted: meta.tables.length - counted.length,
      container_server_version_num: server, collation_match: 1, supabase_admin_extra_settings_count: extraSettings.length,
      event_triggers_second_pass_count: secondPass.length, toc_entries_restored: tocRestored };
    appendEntry(c, { kind: 'restore_test', dir: backup, result: 'pass', event_triggers_second_pass: secondPass, supabase_admin_extra_settings: extraSettings, image_digest: IMAGE_DIGEST, image_id: imageId, datlocprovider: meta.datlocprovider, datlocale: meta.datlocale, datcollate: meta.datcollate, datctype: meta.datctype, ...result }, run);
    return { ...result, restore_test_pass: 1 };
  } catch (e) {
    const code = e instanceof Stop ? e.stage : stage;
    if (dir && !e.restoreSilent) try { appendEntry(c, { kind: 'restore_test', dir: backup, result: 'fail', stage: code,
      ...(secondPass ? { event_triggers_second_pass: secondPass, toc_entries_restored: tocRestored } : {}),
      ...(e.restoreDiagnostic ? { restore_diagnostic: e.restoreDiagnostic } : {}), ...(e.eventMismatches ? { event_trigger_mismatches: e.eventMismatches } : {}),
      ...(extraSettings ? { supabase_admin_extra_settings: extraSettings } : {}), image_digest: IMAGE_DIGEST, ...(imageId ? { image_id: imageId } : {}), ...(e.diagnostics ? { diagnostics: e.diagnostics } : {}), ...(e.detail ?? {}), ...(e.missing ? { missing_extensions: e.missing.length } : {}) }, run); } catch { /* exit code is the signal */ }
    const s = new Stop(code); s.missing = e.missing; s.diagnostics = e.diagnostics;
    s.restoreDiagnostic = e.restoreDiagnostic; s.restoreSilent = e.restoreSilent; s.eventMismatches = e.eventMismatches; throw s;
  } finally {
    if (container) try { sh(['rm', '-f', '-v', container], { stdio: ['ignore', 'pipe', 'pipe'] }); } catch { /* owner removes via the label shown in the runbook */ }
  }
}
export async function main(argv = process.argv.slice(2)) {
  process.umask(0o077);
  const dryRun = argv.includes('--dry-run'), rest = argv.filter(a => a !== '--dry-run');
  if (rest.length > 1) throw new Stop('argument');
  return restoreTest(guard('config', () => loadConfig()), { name: rest[0] ?? 'latest', dryRun });
}
export function reportRestoreStop(e, write = line => console.error(line)) {
  if (e.restoreSilent) return;
  if (e.restoreDiagnostic) write(formatRestoreDiagnostic(e.restoreDiagnostic));
  else if (e.eventMismatches) for (const d of e.eventMismatches) write(formatEventMismatch(d));
  else if (e.diagnostics) for (const d of e.diagnostics) write(formatRolesStop(d));
  else write('STOP laptop_restore_test:' + (e instanceof Stop ? e.stage : 'internal') + (e.missing ? ' missing_extensions=' + e.missing.join(',') : ''));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => {
    reportRestoreStop(e);
    process.exitCode = 1;
  });
}
