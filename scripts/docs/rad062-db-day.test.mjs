import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { options, verifyMigrations, checkRows, main } from '../assess/rad062-db-day.mjs';
import { openLocalDatabase } from '../assess/local-database.mjs';
import { rehearse } from '../assess/rad062-restore-rehearsal.mjs';
const ref = 'a'.repeat(20);
const remote = { PGHOST: `db.${ref}.supabase.co`, PGUSER: 'postgres', PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', RAD062_EXPECTED_PROJECT_REF: ref };
test('every remote operation requires explicit flag and matching independent project ref, including dry run', () => {
  for (const action of ['preflight','backup','apply','checks','counts','restore']) {
    for (const flags of [[], ['--live'], ['--project-ref',ref], ['--live','--project-ref','b'.repeat(20)]]) {
      assert.throws(() => options([action, ...flags], remote));
    }
  }
  assert.throws(() => options(['apply','--migration','M01','--execute','--live','--project-ref',ref], remote));
  assert.equal(options(['checks','--live','--project-ref',ref], remote).execute, false);
  assert.throws(() => options(['checks','--live','--project-ref',ref], { ...remote, PGHOST: 'unreviewed.invalid' }));
  assert.throws(() => options(['restore','--execute','--live','--project-ref',ref], remote));
});
test('dry run makes no connection, selectors cannot become connection strings, and errors redact inputs', async () => {
  assert.equal((await main(['checks','--live','--project-ref',ref], remote)).database_connections, 0);
  assert.throws(() => options(['restore'], { PGHOST:'/tmp/local', PGDATABASE:'service=remote', PGUSER:'postgres' }));
  const r = spawnSync(process.execPath, ['scripts/assess/rad062-db-day.mjs','checks','--execute'], { env: { ...process.env, ...remote, PGPASSWORD:'PRIVATE_CANARY' }, encoding:'utf8' });
  assert.equal(r.status,1); assert.equal(r.stderr.trim(),'STOP rad062_db_day'); assert.equal(r.stdout,'');
});
test('all eight SHA-256 pins pass and a tampered migration is refused before SQL', () => {
  assert.equal(verifyMigrations().length,8);
  for (const tampered of verifyMigrations()) assert.throws(() => verifyMigrations(file => Buffer.concat([readFileSync('supabase/migrations/'+file), Buffer.from(file===tampered?'--tampered':'')])));
});
test('boolean readiness failures stop; explicitly disclaimed operational claims remain false', () => {
  assert.throws(() => checkRows({ rows:[{ ready:false }] }));
  assert.throws(() => checkRows({ rows:[] }));
  assert.equal(checkRows([{rows:[]},{rows:[{ready:true,runtime_or_launch_verified:false,restore_verified:false}]}]),1);
});
test('promotion preserves both emergency packets and every original SQL/check byte', () => {
  const base = JSON.parse(execFileSync('git', ['show', '023ec84c15bfd744f317ec079e2587d90e099414:scripts/pages/frontend-schema.json'], { encoding: 'utf8' }));
  const current = JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8'));
  assert.deepEqual(current.requiredMigrations, [...base.requiredMigrations, ...base.guardedFeatures.rad062.migrations]);
  assert.deepEqual(current.deferredMigrations, {});
  assert.deepEqual(current.checks, [...base.checks.map(f => f === 'supabase/checks/rad085-p1-b-ready.sql' ? 'supabase/checks/rad062-p1-b-ready.sql' : f), 'supabase/checks/rad062-ready.sql']);
  for (const path of ['docs/RAD-059_PHONE_PACKET.md','docs/RAD-062_P05_PHONE_PACKET.md',
    'supabase/manual/assess-emergency-stop.sql','supabase/manual/assess-emergency-stop-v2.sql',
    'supabase/checks/assess-emergency-stopped.sql','supabase/checks/assess-emergency-stopped-v2.sql',
    ...base.checks,
    ...current.requiredMigrations.map(f=>'supabase/migrations/'+f)]) {
    assert.deepEqual(readFileSync(path),execFileSync('git',['show',`023ec84c15bfd744f317ec079e2587d90e099414:${path}`]));
  }
});
test('actual local logical restore applies eight transactions, rolls failures back, finds anchors and emits only counts', {timeout:120000}, async () => {
  const r = await rehearse();
  assert.equal(r.migrations_committed,8); assert.equal(r.rollback_witnesses,8);
  assert.equal(r.v1_anchors_found,18); assert.equal(r.readiness_failures,0); assert.equal(r.baseline_check_failures,1);
  assert.equal(r.restored_acl_effective_differences,0); assert.equal(r.tampered_grant_failures,4);
  assert.equal(r.original_b_ready,1); assert.equal(r.restored_b_diagnostic_ready,1);
  assert.equal(r.tampered_b_diagnostic_failed,1); assert.equal(r.post_package_b_diagnostic_failures,7);
  assert.ok(Object.values(r).every(n=>typeof n==='number'||/^\d+$/.test(n)));
  assert.doesNotMatch(JSON.stringify(r),/SYNTHETIC_PRIVATE_CANARY|@|[0-9a-f]{8}-[0-9a-f]{4}-/);
  // Frozen B still rejects additions; both complete-catalogue required checks now pass.
  // Path (b) remains back-to-back P10 with no required-check waiver.
  assert.equal(r.required_check_failures,0);
});

test('explicit latest applies the entire promoted required set', {timeout:30000}, async () => {
  const db = await openLocalDatabase('postgres', { through:'latest' });
  try {
    assert.notEqual((await db.query("select to_regprocedure('assess.name_entry_v1()') v"))[0].v, null);
    assert.notEqual((await db.query("select to_regprocedure('assess.freeze_v2()') v"))[0].v, null);
    assert.notEqual((await db.query("select to_regclass('assess.manual_final_receipts_v1') v"))[0].v, null);
  } finally { await db.close(); }
});
