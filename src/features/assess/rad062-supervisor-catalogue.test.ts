const { inspectM09 } = await import('../../../scripts/assess/' + 'rad062-m09-rehearsal.mjs') as {
 inspectM09: (db: import('pg').Client) => Promise<Record<string, number>>;
};
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { catalogueFixture, modes, sql, M09, image } from './rad062-m09-fixture';
import manifest from '../../../scripts/pages/frontend-schema.json';
const catalogue = `select oid,to_jsonb(p)-'prosrc' properties,prosrc from pg_proc p where pronamespace='assess'::regnamespace order by oid`;
const fk = 'select oid,conname,conrelid,confrelid,pg_get_constraintdef(oid) definition from pg_constraint where contype=\'f\' order by oid';
describe.each(modes)('M09 catalogue %s', mode => {
 it('old readiness before M09; counted patch preserves all OIDs, properties, ACLs and FKs; post readiness only', async () => {
  const db = await catalogueFixture(mode);
  try {
   if (mode === 'supabase17') {
    expect((await db.admin.query('show server_version_num')).rows[0].server_version_num).toBe('170011');
    expect((await db.admin.query('select datlocprovider,datlocale from pg_database where datname=current_database()')).rows[0]).toEqual({ datlocprovider: 'i', datlocale: 'en-US' });
    expect(image).toContain('@sha256:6ce438c');
   }
   expect((await db.admin.query(readFileSync('supabase/checks/rad062-ready.sql', 'utf8'))).rows.every(r => r.ok)).toBe(true);
   const before = (await db.admin.query(catalogue)).rows, keys = (await db.admin.query(fk)).rows;
   await db.admin.query(sql());
   const after = (await db.admin.query(catalogue)).rows;
   expect(after.map(({ properties, oid }) => ({ properties, oid }))).toEqual(before.map(({ properties, oid }) => ({ properties, oid })));
   expect(after.filter((r, i) => r.prosrc !== before[i].prosrc).map(r => r.properties.proname).sort()).toEqual(['manual_authorize_v1','manual_finalize_v1','manual_queue_v1','manual_read_v1','manual_receipt_v1','manual_score_v1']);
   expect((await db.admin.query(fk)).rows).toEqual(keys);
   const check = readFileSync('supabase/checks/rad062-m09-ready.sql', 'utf8');
   expect((await db.admin.query(check)).rows).toEqual(expect.arrayContaining([{ check_name: 'functions', ok: true }]));
   expect((await db.admin.query(check)).rows.every(r => r.ok)).toBe(true);
   for (const role of ['anon','assess_worker','assess_authoring_bridge']) expect((await db.admin.query("select bool_and(not has_function_privilege($1,oid,'execute')) ok from pg_proc where pronamespace='assess'::regnamespace and proname like 'manual_%_v1'", [role])).rows[0].ok).toBe(true);
   expect((await db.admin.query("select has_function_privilege('authenticated','assess.manual_authorize_v1(uuid)','execute') ok")).rows[0].ok).toBe(false);
  } finally { await db.close(); }
 }, 120000);
 it('owner restored-catalogue inspection proves both anchor rollbacks and post readiness', async () => {
  const db = await catalogueFixture(mode);
  try { expect(await inspectM09(db.admin)).toEqual({ m09_committed: 1, pre_m08_ready: 1, post_m09_ready: 1, anchor_rollbacks: 2, foreign_keys_unchanged: 1 }); }
  finally { await db.close(); }
 },120000);
 it.each(['missing', 'double', 'baseline', 'open-gate', 'inventory', 'crlf'])('%s fails atomically or accepts representation only', async kind => {
  const db = await catalogueFixture(mode);
  try {
   let migration = sql();
   if (kind === 'missing') migration = migration.replace('$anchor$\n return receipt;$anchor$', '$anchor$\n NO_SUCH_ANCHOR;$anchor$');
   if (kind === 'double') migration = migration.replace('$anchor$\n return receipt;$anchor$', '$anchor$\n$anchor$');
   if (kind === 'baseline') await db.admin.query("alter function assess.manual_read_v1(uuid) set work_mem='8MB'");
   if (kind === 'open-gate') await db.admin.query('update assess.launch_gate set enabled=true');
   if (kind === 'inventory') await db.admin.query("update assess.erasure_fk_contract set inventory='[]'");
   if (kind === 'crlf') {
    for (const row of (await db.admin.query("select pg_get_functiondef(oid) def from pg_proc where pronamespace='assess'::regnamespace and proname like 'manual_%_v1'")).rows) await db.admin.query(row.def.replaceAll('\n', '\r\n'));
   }
   const before = (await db.admin.query(catalogue)).rows, keys = (await db.admin.query(fk)).rows;
   if (kind === 'crlf') await db.admin.query(migration);
   else {
    await expect(db.admin.query(migration)).rejects.toMatchObject({ code: '55000', message: expect.stringContaining(kind === 'missing' || kind === 'double' ? 'anchor count' : 'catalogue') });
    await db.admin.query('rollback');
    expect((await db.admin.query(catalogue)).rows).toEqual(before);
   }
   expect((await db.admin.query(fk)).rows).toEqual(keys);
  } finally { await db.close(); }
 }, 120000);
});
it('pins the exact promoted migrations, checks, reviewed M09 bytes and marker', () => {
 const before = JSON.parse(execFileSync('git', ['show','3c887cb31f523f3a49128305da50dd433f8e6a0c:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
 expect(manifest.requiredMigrations).toEqual([...before.requiredMigrations, M09, '20261102000200_rad059_emergency_alternate.sql', '20261102000300_rad085_rights_write_disclosures.sql', '20261105000100_rad105_windows.sql', '20261105000200_rad105_witness.sql']); expect(manifest.checks).toEqual(before.checks.map((file: string) => file === 'supabase/checks/rad062-ready.sql' ? null : file === 'supabase/checks/rad062-p1-b-ready.sql' ? 'supabase/checks/selfservice-rad085-review-ready.sql' : file).filter(Boolean).map((file: string) => ['mixed','practical','history','retention'].some(x => file === 'supabase/checks/assess-'+x+'-ready.sql') ? file.replace('checks/', 'checks/selfservice-') : file).concat(['supabase/checks/selfservice-windows-ready.sql','supabase/checks/selfservice-witness-ready.sql']));
 expect(createHash('sha256').update(sql()).digest('hex')).toBe('9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a');
 expect(execFileSync(process.execPath, ['scripts/pages/pilot-schema-gate.mjs','--print-marker'], { encoding: 'utf8', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://vlacestfruxooznrcjqc.supabase.co' } }).trim()).toBe('pilot-v1:2bcdc4dd83982e06f57adb70be8cf7597d18f242ce62e5d09b734ddb3aec2629');
});
