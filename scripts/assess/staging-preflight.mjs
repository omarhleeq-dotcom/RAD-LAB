// Offline planning only: no credentials, network, SQL execution, environment writes or attestation changes.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { frontendRequirements } from '../pages/pilot-schema-gate.mjs';
const repository = fileURLToPath(new URL('../../', import.meta.url));
const sha256 = value => createHash('sha256').update(value).digest('hex');
function projectOrigin(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('A public Supabase project URL is required.'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !/^\/?$/.test(url.pathname)) {
    throw new Error('Use a public https://<project>.supabase.co origin without credentials or extra URL components.');
  }
  return url.origin;
}
export function prepareStaging({ productionUrl, stagingUrl }, root = repository) {
  if (!productionUrl || !stagingUrl) throw new Error('Both production and staging public URLs are required.');
  if (projectOrigin(productionUrl) === projectOrigin(stagingUrl)) throw new Error('Staging must be a different Supabase project from production.');
  const manifest = frontendRequirements(root);
  const workflow = readFileSync(resolve(root, '.github/workflows/deploy-pages.yml'), 'utf8');
  // A bounded source observation, not a YAML interpreter or proof of future environment isolation.
  const sharedReferences = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'PILOT_SCHEMA_VERIFIED']
    .filter(name => workflow.includes(`vars.${name}`));
  return {
    contract: 'assess-staging-plan/1', outcome: 'PREPARED_LOCAL_ONLY',
    separatePublicOrigins: true, liveChecksPerformed: false, deploymentReady: false,
    frontendContract: manifest.contract,
    migrations: manifest.requiredMigrations.map(file => ({ file, sha256: sha256(readFileSync(resolve(root, 'supabase/migrations', file))) })),
    checks: [...manifest.checks, 'supabase/checks/assess-staging-ready.sql'].map(file => ({ file, sha256: sha256(readFileSync(resolve(root, file))) })),
    workflow: { file: '.github/workflows/deploy-pages.yml', sha256: sha256(workflow), sharedVariableReferences: sharedReferences, isolationVerified: false },
    blockers: ['preview-production-isolation-unverified', 'staging-provisioning-and-migrations-not-performed',
      'live-catalogue-and-two-account-checks-not-performed', 'trusted-node-worker-binding-not-proven',
      'scheduler-monitoring-recovery-not-proven', 'consent-retention-backup-restore-O106-open', 'launch-gate-must-remain-closed'],
  };
}
export function parseArguments(args) {
  const values = {};
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    if (!['--production-url', '--staging-url'].includes(flag) || !args[i + 1] || Object.hasOwn(values, flag)) throw new Error('Expected --production-url URL --staging-url URL; no keys or other arguments.');
    values[flag] = args[i + 1];
  }
  return { productionUrl: values['--production-url'], stagingUrl: values['--staging-url'] };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(prepareStaging(parseArguments(process.argv.slice(2))), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : 'Offline planning failed.'); process.exitCode = 1; }
}
