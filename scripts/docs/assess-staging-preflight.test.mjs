import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { prepareStaging, parseArguments } from '../assess/staging-preflight.mjs';
const productionUrl = 'https://production-fixture.supabase.co', stagingUrl = 'https://staging-fixture.supabase.co';
test('offline preparation pins the actual chain and reports all unverified release gates without writing sources', () => {
  const files = ['scripts/pages/frontend-schema.json', '.github/workflows/deploy-pages.yml'];
  const before = files.map(f => readFileSync(f, 'utf8'));
  const result = prepareStaging({ productionUrl, stagingUrl });
  assert.equal(result.outcome, 'PREPARED_LOCAL_ONLY'); assert.equal(result.liveChecksPerformed, false); assert.equal(result.deploymentReady, false);
  assert.equal(result.workflow.isolationVerified, false); assert.equal(result.workflow.sharedVariableReferences.length, 3);
  assert.ok(result.migrations.some(x => x.file === '20261020000700_assess_lifecycle.sql'));
  assert.ok(result.migrations.some(x => x.file === '20261020000800_assess_mixed_ui.sql'));
  assert.ok(result.checks.some(x => x.file === 'supabase/checks/assess-staging-ready.sql'));
  assert.ok(result.migrations.every(x => /^[a-f0-9]{64}$/.test(x.sha256)));
  assert.ok(result.blockers.includes('consent-retention-backup-restore-O106-open'));
  assert.doesNotMatch(JSON.stringify(result), /production-fixture|staging-fixture|pilot-v1:/);
  assert.deepEqual(files.map(f => readFileSync(f, 'utf8')), before);
});
test('same project, credentials, paths and non-Supabase targets fail without reflecting input', () => {
  for (const stagingUrl of [productionUrl, productionUrl + '/', 'https://user:PRIVATE@staging.supabase.co', 'http://staging.supabase.co', 'https://staging.supabase.co/rest/v1', 'https://staging.supabase.co?key=PRIVATE', 'https://staging.supabase.co:444', 'https://example.com']) {
    assert.throws(() => prepareStaging({ productionUrl, stagingUrl }), error => !error.message.includes('PRIVATE'));
  }
  assert.throws(() => prepareStaging({ productionUrl }), /Both/);
});
test('CLI accepts only public origins and fails on duplicate or unknown arguments without echoing keys', () => {
  assert.deepEqual(parseArguments(['--staging-url', stagingUrl, '--production-url', productionUrl]), { productionUrl, stagingUrl });
  for (const args of [['--staging-url'], ['--key', 'sb_secret_PRIVATE'], ['--staging-url', stagingUrl, '--staging-url', stagingUrl]]) assert.throws(() => parseArguments(args));
  const result = spawnSync(process.execPath, ['scripts/assess/staging-preflight.mjs', '--key', 'sb_secret_PRIVATE'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 1); assert.doesNotMatch(result.stdout + result.stderr, /sb_secret_PRIVATE/);
});
