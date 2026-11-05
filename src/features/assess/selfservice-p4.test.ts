/** RAD-105 P4: the staged Scheduler script is dry-run by default, least-privilege and never applies without the owner's window permission. */
import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

const script = 'supabase/staged/self-service/p4-scheduler.sh';
const run = (env: Record<string, string>) => spawnSync('bash', [script], { encoding: 'utf8', env: { PATH: '/usr/bin:/bin', NODE_ENV: 'test', ...env } });
const base = { RAD_PROJECT: 'demo-project', RAD_REGION: 'europe-west3' };

it('dry run prints the reviewed commands in order and runs nothing', () => {
 const r = run(base);
 expect(r.status, r.stderr).toBe(0);
 const lines = r.stdout.trim().split('\n');
 expect(lines.map(l => l.split(' ').slice(0, 3).join(' '))).toEqual(['DRY: gcloud services', 'DRY ensure: gcloud', 'DRY: gcloud run', 'DRY ensure: gcloud', 'VERIFY (read-only): gcloud']);
 expect(r.stdout).toContain('--schedule=\'*/5 * * * *\'');
 expect(r.stdout).toContain('--uri=https://run.googleapis.com/v2/projects/demo-project/locations/europe-west3/jobs/assess-worker:run');
 expect(r.stdout).toContain('--oauth-service-account-email=assess-scheduler@demo-project.iam.gserviceaccount.com');
 expect(r.stdout).toContain('cloudscheduler.googleapis.com');
 expect(r.stdout).toContain('gcloud iam service-accounts create assess-scheduler');
 expect(r.stdout).toContain('gcloud scheduler jobs create http assess-worker-tick');
 expect(r.stdout).toContain('--max-retry-attempts=0');
});
it('least privilege: the only binding is roles/run.invoker on the single Job; no project-level role, secret or database access', () => {
 const out = run(base).stdout;
 expect(out.match(/add-iam-policy-binding/g)).toHaveLength(1);
 expect(out).toContain('gcloud run jobs add-iam-policy-binding assess-worker');
 expect(out).not.toMatch(/projects add-iam-policy-binding|secretmanager|secrets |roles\/(owner|editor|run\.admin|run\.developer)|psql|supabase/);
});
it('refuses to apply without the written window permission and requires explicit project and region', () => {
 const refused = run({ ...base, APPLY: '1' });
 expect(refused.status).toBe(2); expect(refused.stderr).toContain('permission missing'); expect(refused.stdout).toBe('');
 expect(run({ RAD_REGION: 'europe-west3' }).status).not.toBe(0);
 expect(run({ RAD_PROJECT: 'demo-project' }).status).not.toBe(0);
});
