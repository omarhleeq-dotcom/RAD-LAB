import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { options, verifyMigrations, checkRows, main } from '../assess/rad062-db-day.mjs';
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
const poolerHost = 'aws-0-eu-central-1.pooler.supabase.com';
const pooled = { PGHOST: poolerHost, PGPORT: '5432', PGUSER: `postgres.${ref}`, PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: '/home/u/ca.crt', RAD062_EXPECTED_PROJECT_REF: ref, RAD062_POOLER_HOST: poolerHost };
const pooledArgs = (action, ...more) => [action, '--live', '--project-ref', ref, '--session-pooler', ...more];
test('session pooler is an explicit opt-in that needs every exact selector', () => {
  for (const action of ['preflight', 'backup', 'counts', 'checks']) assert.equal(options(pooledArgs(action), pooled).pooler, true);
  // Never auto-detected and never a fallback: the pooler host without the flag, or the flag with the direct host, is refused.
  assert.throws(() => options(['preflight', '--live', '--project-ref', ref], pooled));
  assert.throws(() => options(pooledArgs('preflight'), remote));
  for (const bad of [{ PGPORT: '6543' }, { PGPORT: undefined }, { PGPORT: '5433' }, { PGUSER: 'postgres' }, { PGUSER: `postgres.${'b'.repeat(20)}` }, { PGUSER: `assess_job_a.${ref}` },
    { PGDATABASE: 'other' }, { PGSSLMODE: 'require' }, { PGSSLMODE: undefined }, { PGSSLROOTCERT: '' }, { PGSSLROOTCERT: undefined },
    { RAD062_POOLER_HOST: undefined }, { RAD062_POOLER_HOST: 'aws-0-us-east-1.pooler.supabase.com' }, { RAD062_EXPECTED_PROJECT_REF: 'b'.repeat(20) },
    { PGHOST: 'evil.example.com', RAD062_POOLER_HOST: 'evil.example.com' }, { PGHOST: `${poolerHost}.evil.io`, RAD062_POOLER_HOST: `${poolerHost}.evil.io` },
    { PGHOST: 'aws-0-eu-central-1.pooler.supabase.co', RAD062_POOLER_HOST: 'aws-0-eu-central-1.pooler.supabase.co' }, { PGHOST: `db.${ref}.supabase.co`, RAD062_POOLER_HOST: `db.${ref}.supabase.co` }]) {
    const env = { ...pooled, ...bad }; for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
    assert.throws(() => options(pooledArgs('preflight'), env), undefined, JSON.stringify(Object.keys(bad)));
  }
  assert.throws(() => options(['preflight', '--session-pooler'], pooled));                       // requires --live and --project-ref
  assert.throws(() => options(['preflight', '--live', '--session-pooler'], pooled));
  assert.throws(() => options(['verify', '--session-pooler'], pooled));
  assert.throws(() => options(pooledArgs('restore'), pooled));
  assert.throws(() => options(pooledArgs('apply', '--migration', 'M01'), pooled));              // DB-day apply is not widened to the pooler
  assert.throws(() => options(pooledArgs('preflight'), { ...pooled, PGHOST: '/tmp/local' }));
});
test('direct endpoint remains strict and unchanged when the pooler selector exists in the environment', () => {
  const env = { ...remote, RAD062_POOLER_HOST: poolerHost };
  assert.equal(options(['preflight', '--live', '--project-ref', ref], env).pooler, false);
  assert.throws(() => options(['preflight', '--live', '--project-ref', ref], { ...env, PGUSER: `postgres.${ref}` }));
  assert.throws(() => options(['preflight', '--live', '--project-ref', ref], { ...env, PGHOST: poolerHost }));
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
test('both emergency packets and all dormant product/schema boundaries remain byte identical to main', () => {
  for (const path of ['docs/RAD-059_PHONE_PACKET.md','docs/RAD-062_P05_PHONE_PACKET.md','scripts/pages/frontend-schema.json',
    'supabase/manual/assess-emergency-stop.sql','supabase/manual/assess-emergency-stop-v2.sql',
    'supabase/checks/assess-emergency-stopped.sql','supabase/checks/assess-emergency-stopped-v2.sql',
    ...JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).checks,
    ...JSON.parse(readFileSync('scripts/pages/frontend-schema.json','utf8')).requiredMigrations.map(f=>'supabase/migrations/'+f)]) {
    assert.deepEqual(readFileSync(path),execFileSync('git',['show',`origin/main:${path}`]));
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
  // Frozen B catalogue checker intentionally cannot attest an additive package.
  // Path (b) requires back-to-back P10; no required-check waiver.
  assert.equal(r.required_check_failures,1);
});
