import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { restorePlan, proveCompleteness, restoreDiagnostic, formatRestoreDiagnostic, archiveEventMetadata, compareEventMetadata } from '../ops/restore-event-triggers.mjs';
import { restoreTest, reportRestoreStop } from '../ops/laptop-restore-test.mjs';
import { sha256Bytes, readEntries } from '../ops/laptop-backup-lib.mjs';

const toc = '; original header\n1; 0 0 FUNCTION public witness() postgres\n2; 0 0 EVENT TRIGGER - owner_trigger postgres\n3; 0 0 EVENT TRIGGER - admin_trigger supabase_admin\n4; 0 0 EVENT TRIGGER - absent_trigger absent\n5; 0 0 TABLE DATA public witness postgres\n';
const roles = new Map([['postgres', false], ['supabase_admin', true]]);
const sql = `CREATE EVENT TRIGGER owner_trigger ON ddl_command_end
 WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE')
 EXECUTE FUNCTION public.witness();
ALTER EVENT TRIGGER owner_trigger ENABLE ALWAYS;
CREATE EVENT TRIGGER admin_trigger ON sql_drop EXECUTE FUNCTION public.admin();
ALTER EVENT TRIGGER admin_trigger DISABLE;
CREATE EVENT TRIGGER absent_trigger ON table_rewrite EXECUTE FUNCTION public.absent();
`;
const plan = restorePlan(toc, roles), expected = archiveEventMetadata(sql, plan.events);
const canary = 'PRIVATE_MESSAGE_DATA_CANARY_86';
const error = (id = 2, message = canary) => `pg_restore: while PROCESSING TOC:\npg_restore: from TOC entry ${id}; 0 0 EVENT TRIGGER - owner_trigger postgres\npg_restore: error: could not execute query: ERROR:  P0001: ${message}\nCONTEXT: ${canary}\nCommand was: ${canary}\n`;

test('selection is exactly existing non-superuser archive owners; all other bytes/order survive', () => {
  assert.deepEqual(plan.second.map(e => [e.name, e.owner]), [['owner_trigger', 'postgres']]);
  assert.equal(plan.count, 5);
  assert.equal(proveCompleteness(toc, plan.first, plan.second.map(e => e.line)), 5);
  const renamed = toc.replace('owner_trigger', 'arbitrary_new_name').replace(/postgres/g, 'another_owner');
  assert.equal(restorePlan(renamed, new Map([['another_owner', false]])).second[0].name, 'arbitrary_new_name');
});
test('completeness rejects missing, duplicated, modified and reordered entries', () => {
  const second = plan.second.map(e => e.line);
  for (const [first, deferred] of [[plan.first, []], [plan.first, [...second, ...second]], [plan.first.replace('witness()', 'changed()'), second],
    [plan.first.replace('1; 0 0 FUNCTION public witness() postgres\n', ''), second],
    [plan.first.split('\n').reverse().join('\n'), second]])
    assert.throws(() => proveCompleteness(toc, first, deferred));
  assert.throws(() => restorePlan(toc + '2; 0 0 TABLE public dup postgres\n', roles));
});
test('archive event metadata and comparison cover name set and every required property', () => {
  assert.deepEqual(expected[0], { name: 'owner_trigger', owner: 'postgres', function: 'public.witness', event: 'ddl_command_end', enabled: 'A', tags: ['ALTER TABLE', 'CREATE TABLE'] });
  assert.deepEqual(compareEventMetadata(expected, expected), []);
  assert.equal(archiveEventMetadata(sql.replace('ENABLE ALWAYS', 'ENABLE REPLICA'), plan.events)[0].enabled, 'R');
  const quotedToc = toc.replaceAll('owner_trigger', '"owner$trigger"');
  assert.equal(archiveEventMetadata(sql.replaceAll('owner_trigger', '"owner$trigger"'), restorePlan(quotedToc, roles).events)[0].enabled, 'A');
  const reordered = structuredClone(expected); reordered[0].tags.reverse();
  assert.deepEqual(compareEventMetadata(expected, reordered), []);
  for (const key of ['owner', 'function', 'event', 'enabled', 'tags']) {
    const changed = structuredClone(expected); changed[0][key] = key === 'tags' ? null : 'different';
    assert.deepEqual(compareEventMetadata(expected, changed), [{ name: 'owner_trigger', keys: key }]);
  }
  assert.deepEqual(compareEventMetadata(expected, expected.slice(1)), [{ name: 'owner_trigger', keys: 'presence' }]);
  assert.equal(compareEventMetadata([], expected).length, 3);
  assert.throws(() => archiveEventMetadata(sql.replace('EXECUTE FUNCTION public.witness()', 'EXECUTE FUNCTION public.unsupported(1)'), plan.events));
  assert.throws(() => archiveEventMetadata(sql + sql, plan.events));
  assert.throws(() => archiveEventMetadata('x'.repeat(4 * 1024 * 1024 + 1), []));
});
test('diagnostic has fixed types/strict identifiers/bounded input and suppresses TABLE DATA/COPY', () => {
  const d = restoreDiagnostic(error(), { status: 1 }, toc);
  assert.deepEqual(d, { toc_id: '2', type: 'EVENT TRIGGER', schema: '-', name: 'owner_trigger', owner: 'postgres', sqlstate: 'P0001', exit: 1, signal: 'none' });
  assert.doesNotMatch(formatRestoreDiagnostic(d), /PRIVATE_|CONTEXT|Command was/);
  for (const raw of [error(5), error() + '\nCOPY ' + canary, error() + 'copy_canary', 'x'.repeat(1024 * 1024 + 1)])
    assert.equal(restoreDiagnostic(raw, { status: 1 }, toc), null);
  assert.equal(restoreDiagnostic(error(), { status: null, error: { code: 'ENOBUFS' } }, toc), null);
  const unsafe = restoreDiagnostic(error().replace('EVENT TRIGGER - owner_trigger postgres', 'UNKNOWN - unsafe! unsafe!'), { status: null, signal: 'SIGTERM' });
  assert.equal(unsafe.type, 'unparsed'); assert.equal(unsafe.name, 'unparsed'); assert.equal(unsafe.signal, 'SIGTERM');
  assert.equal(restoreDiagnostic('arbitrary error ' + canary, { status: 1 }).sqlstate, 'unparsed');
  const forged = 'pg_restore: error: ' + canary + '\npg_restore: from TOC entry 2; 0 0 EVENT TRIGGER - owner_trigger postgres\n';
  assert.equal(restoreDiagnostic(forged, { status: 1 }, toc).name, 'unparsed');
});

test('production passes exact lists/owner flags, encrypts names/counts and stops pass two without fallback; diagnostic canaries never escape', async () => {
  const root = mkdtempSync(join(tmpdir(), 'rad086-event-')), at = '20261031T123000Z', dir = join(root, 'store', at), identity = join(root, 'identity');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  mkdirSync(join(root, 'reconciliation'), { mode: 0o700 });
  writeFileSync(identity, execFileSync('age-keygen', [], { stdio: 'pipe' }), { mode: 0o600 });
  const c = { backupRoot: root, ageRecipient: String(execFileSync('age-keygen', ['-y', identity])).trim() };
  const dump = Buffer.from('synthetic'), roleSql = '';
  for (const [file, value] of [['project.dump', dump], ['roles.sql', roleSql], ['checksums.json', JSON.stringify({ 'project.dump': sha256Bytes(dump), 'roles.sql': sha256Bytes(roleSql) })],
    ['db-meta.json', JSON.stringify({ server_version_num: 170011, datlocprovider: 'i', datlocale: 'en-US', datcollate: 'en_US.UTF-8', datctype: 'en_US.UTF-8', tables: [] })]])
    writeFileSync(join(dir, file), value, { mode: 0o600 });
  try {
    for (const mode of ['pass', 'first', 'second', 'copy', 'data', 'mismatch', 'list', 'extract']) {
      const lists = new Map(), restores = [], output = []; let cleaned = false;
      const logsBefore = readEntries(c, identity).length;
      const run = (p, a, o) => {
        if (p === 'age') { assert.doesNotMatch(o.input, new RegExp(canary)); return execFileSync(p, a, o); }
        if (p === 'pg_restore') {
          if (mode === 'list') throw { status: 1, stderr: error() };
          return toc;
        }
        if (a[0] === 'image') return 'sha256:' + 'a'.repeat(64);
        if (a[0] === 'logs') return 'PostgreSQL init process complete; ready for start up.';
        if (a[0] === 'rm') cleaned = true;
        if (a.includes('tee')) { lists.set(a.at(-1), o.input); return ''; }
        const query = a.at(-1);
        if (query === 'show server_version_num') return '170011';
        if (query.includes('from pg_database')) return 'i|en-US|en_US.UTF-8|en_US.UTF-8';
        if (query.includes('select rolname, rolsuper')) return 'postgres|f\nsupabase_admin|t';
        if (query.includes('from pg_event_trigger')) return JSON.stringify(mode === 'mismatch' ? [] : expected);
        return '';
      };
      const spawn = (p, a) => {
        if (a.includes('pg_isready')) return { status: 0 };
        if (a.includes('psql')) return { status: 0, stdout: 'RAD086_supabase_admin_extra_settings []' };
        assert.ok(a.includes('--exit-on-error'));
        if (a.includes('--schema-only')) return mode === 'extract' ? { status: 1, stderr: error() } : { status: 0, stdout: sql };
        restores.push(a);
        const second = a.includes('--role=postgres');
        assert.ok(!a.some(s => /--no-owner|--no-acl|--use-set-session-authorization/.test(s)));
        assert.equal(lists.get(a.at(-1)), second ? plan.second[0].line : plan.first);
        const fails = second ? ['second', 'copy', 'data'].includes(mode) : mode === 'first';
        return { status: fails ? 1 : 0, stdout: canary, stderr: fails ? error(mode === 'data' ? 5 : 2, mode === 'copy' ? 'COPY ' + canary : canary) : '' };
      };
      if (mode === 'pass') {
        const r = await restoreTest(c, { name: at, run, spawn });
        assert.equal(r.event_triggers_second_pass_count, 1); assert.equal(r.toc_entries_restored, 5);
        assert.doesNotMatch(JSON.stringify(r), /owner_trigger|PRIVATE_/);
      } else await assert.rejects(restoreTest(c, { name: at, run, spawn }), e => { reportRestoreStop(e, s => output.push(s)); return e.stage === 'restore'; });
      assert.ok(cleaned);
      assert.ok(restores.length <= (mode === 'first' ? 1 : 2));
      const logs = readEntries(c, identity), entry = logs.at(-1);
      assert.doesNotMatch(JSON.stringify(entry) + output.join('\n'), /PRIVATE_|CONTEXT|Command was/);
      if (mode === 'pass') assert.deepEqual(entry.event_triggers_second_pass, ['owner_trigger']);
      if (['copy', 'data'].includes(mode)) { assert.deepEqual(output, []); assert.equal(logs.length, logsBefore); }
      if (['first', 'second', 'list', 'extract'].includes(mode)) assert.deepEqual(output, [formatRestoreDiagnostic(entry.restore_diagnostic)]);
      if (mode === 'mismatch') assert.ok(output.every(s => s.includes('kind=event_trigger_mismatch') && s.includes('keys=presence')));
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
