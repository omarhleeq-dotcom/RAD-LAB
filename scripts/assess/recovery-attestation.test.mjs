// Drift guard: the helper's output must pass the exact attestation check text of the
// unchanged production entrypoint (grading-worker-main.mjs), extracted from its source.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildAttestation, parseArgs, manifestHash, PROJECT_REF, CONTRACT, MAX_HOURS } from './recovery-attestation.mjs';

const source = readFileSync(new URL('./grading-worker-main.mjs', import.meta.url), 'utf8');
const line = pattern => { const m = source.match(pattern); assert.ok(m, `worker source drifted: ${pattern}`); return m[0]; };
const definitions = [/^const ATTESTATION_KEYS = .*;$/m, /^const MAX_SPAN = .*;$/m, /^const exact = .*;$/m, /^const instant = .*;$/m].map(line);
const predicate = line(/const baseline = instant\(a\?\.baselineAt\)[\s\S]*?!\(expires - issued <= MAX_SPAN\)\) throw Error\(\);/);
// Evaluates the worker's own reviewed check text, offline.
const workerAccepts = new Function('a', 'now', 'projectRef', 'manifestHash', `${definitions.join('\n')}\ntry { ${predicate} } catch { return false; }\nreturn true;`);
const workerRef = /DIRECT_HOST = 'db\.([a-z0-9]{20})\.supabase\.co'/.exec(source)?.[1];
const HASH = 'a'.repeat(64), NOW = Date.parse('2026-11-10T09:00:00.000Z'), BASE = '2026-11-09T20:15:00.000Z';
const good = (over = {}) => buildAttestation({ manifestSha256: HASH, baselineAt: BASE, validHours: MAX_HOURS, noRestore: true, now: NOW, ...over });
const cli = (...args) => spawnSync(process.execPath, [new URL('./recovery-attestation.mjs', import.meta.url).pathname, ...args], { encoding: 'utf8' });

test('constants match the worker source', () => {
  assert.equal(workerRef, PROJECT_REF);
  assert.ok(source.includes(`a.contract !== '${CONTRACT}'`));
  assert.ok(source.includes('const MAX_SPAN = 48 * 3600 * 1000;'));
  const keys = JSON.parse(/^const ATTESTATION_KEYS = (\[.*\]);$/m.exec(source)[1].replaceAll("'", '"'));
  assert.deepEqual(Object.keys(good()).sort(), keys);
});

test('output passes the worker check across its window and fails outside it', () => {
  for (const hours of [1, 24, 47, 48]) {
    const a = good({ validHours: hours }), expires = Date.parse(a.expiresAt);
    assert.equal(expires - Date.parse(a.issuedAt), hours * 3600 * 1000);
    assert.equal(workerAccepts(a, NOW, PROJECT_REF, HASH), true);
    assert.equal(workerAccepts(a, expires - 1, PROJECT_REF, HASH), true);
    assert.equal(workerAccepts(a, expires, PROJECT_REF, HASH), false);
    assert.equal(workerAccepts(a, NOW - 1, PROJECT_REF, HASH), false, 'issuedAt after worker clock');
  }
  assert.equal(workerAccepts(good({ baselineAt: new Date(NOW).toISOString() }), NOW, PROJECT_REF, HASH), true);
  assert.equal(workerAccepts(good(), NOW, PROJECT_REF, 'b'.repeat(64)), false, 'other image');
  assert.equal(workerAccepts(good(), NOW, 'abcdefghijabcdefghij', HASH), false, 'other project');
  assert.equal(workerAccepts({ ...good(), restoresSinceBaseline: 1 }, NOW, PROJECT_REF, HASH), false);
  assert.equal(workerAccepts({ ...good(), extra: 1 }, NOW, PROJECT_REF, HASH), false);
  const span = good(); span.expiresAt = new Date(NOW + 48 * 3600 * 1000 + 1).toISOString();
  assert.equal(workerAccepts(span, NOW, PROJECT_REF, HASH), false, 'mutation: span above 48 h');
});

test('helper refuses what the worker would refuse', () => {
  const refuse = (over, reason) => assert.throws(() => good(over), { message: `STOP ${reason}` });
  refuse({ noRestore: false }, 'no_restore_not_confirmed');
  refuse({ manifestSha256: 'A'.repeat(64) }, 'manifest_sha256');
  refuse({ manifestSha256: 'a'.repeat(63) }, 'manifest_sha256');
  for (const baselineAt of ['2026-11-09T20:15:00Z', '2026-11-09', '2026-11-09T22:15:00.000+02:00', 7]) refuse({ baselineAt }, 'baseline_not_canonical');
  for (const validHours of [0, 49, 1.5, NaN]) refuse({ validHours }, 'valid_hours');
  refuse({ baselineAt: new Date(NOW + 1).toISOString() }, 'baseline_after_issue');
  refuse({ now: NaN }, 'clock');
});

test('argument parsing is strict', () => {
  const base = ['--manifest-sha256', HASH, '--baseline-at', BASE, '--valid-hours', '48', '--no-restore-since-baseline'];
  assert.deepEqual(parseArgs(base), { manifest: undefined, manifestSha256: HASH, baselineAt: BASE, validHours: 48, noRestore: true });
  for (const argv of [[...base, '--x'], [...base, '--valid-hours', '1'], [...base, '--no-restore-since-baseline'],
    [...base, '--manifest', 'm.json'], base.slice(2), ['--manifest-sha256', HASH, '--baseline-at', BASE, '--valid-hours', '-1'],
    ['--manifest-sha256', HASH, '--baseline-at', BASE, '--valid-hours']])
    assert.throws(() => parseArgs(argv), { message: 'STOP arguments' });
});

test('manifest file: hash of its exact bytes; wrong contract refused', () => {
  const dir = mkdtempSync(join(tmpdir(), 'attestation-test-'));
  const ok = join(dir, 'manifest.json'), bad = join(dir, 'bad.json');
  const bytes = JSON.stringify({ contract: 'rad085-grading-worker-build/1', localOnly: false }, null, 2) + '\n';
  writeFileSync(ok, bytes); writeFileSync(bad, JSON.stringify({ contract: 'rad085-worker-build/1', localOnly: true }));
  assert.equal(manifestHash(ok), createHash('sha256').update(bytes).digest('hex'));
  assert.throws(() => manifestHash(bad), { message: 'STOP manifest_contract' });
  assert.throws(() => manifestHash(join(dir, 'missing.json')), { message: 'STOP manifest_unreadable' });
});

test('CLI prints one JSON line on stdout that the worker accepts now', () => {
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  const r = cli('--manifest-sha256', HASH, '--baseline-at', past, '--valid-hours', '48', '--no-restore-since-baseline');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.split('\n').length, 2);
  const a = JSON.parse(r.stdout);
  assert.match(r.stderr, /^PASS: issuedAt \S+ expiresAt \S+\n$/);
  assert.equal(workerAccepts(a, Date.parse(a.issuedAt) + 1000, PROJECT_REF, HASH), true);
  const refused = cli('--manifest-sha256', HASH, '--baseline-at', '2999-01-01T00:00:00.000Z', '--valid-hours', '48', '--no-restore-since-baseline');
  assert.equal(refused.status, 1);
  assert.equal(refused.stdout, '');
  assert.equal(refused.stderr, 'STOP baseline_after_issue\n');
});
