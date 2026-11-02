import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

const script = resolve('scripts/pages/finalize-headers.mjs');
const baseline = readFileSync('public/_headers', 'utf8');
function run(url: string, key = '', headers = baseline) {
 const cwd = mkdtempSync(join(tmpdir(), 'finalize-headers-'));
 try {
  mkdirSync(join(cwd, 'out')); writeFileSync(join(cwd, 'out/_headers'), headers);
  const result = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', env: {
   ...process.env, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  } });
  if (result.error) throw result.error;
  return { status: result.status, stderr: result.stderr, headers: readFileSync(join(cwd, 'out/_headers'), 'utf8') };
 } finally { rmSync(cwd, { recursive: true, force: true }); }
}
it('keeps an unconfigured export byte-identical', () => {
 expect(run('')).toMatchObject({ status: 0, headers: baseline });
});
it('writes exactly one configured origin to the temporary export only', () => {
 const origin = 'https://synthetic.supabase.co';
 expect(run(origin, 'sb_publishable_synthetic0000000000')).toMatchObject({
  status: 0, headers: baseline.replace("connect-src 'self';", `connect-src 'self' ${origin};`),
 });
 expect(readFileSync('public/_headers', 'utf8')).toBe(baseline);
});
it('fails without writing on invalid origins, secret keys, or missing/duplicate directives', () => {
 for (const [url, key, headers] of [
  ['https://unreviewed.invalid', '', baseline],
  ['https://synthetic.supabase.co', 'sb_secret_synthetic', baseline],
  ['https://synthetic.supabase.co', '', '/*\n  X-Test: synthetic\n'],
  ['https://synthetic.supabase.co', '', baseline + baseline],
 ] as const) {
  const result = run(url, key, headers);
  expect(result.status).not.toBe(0); expect(result.stderr.length).toBeGreaterThan(0);
  expect(result.headers).toBe(headers);
 }
});
