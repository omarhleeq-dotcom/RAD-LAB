// RAD-085 W4 laptop helper: prints one recovery attestation JSON line (decision B,
// DECISIONS#rad085-w4-verifier-owner-2026-11-03) for `gcloud secrets versions add
// assess-worker-recovery --data-file=-`. No secrets, no network, no files written.
// Mirrors the checks in grading-worker-main.mjs (unchanged); the test drift-guards them.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const PROJECT_REF = 'vlacestfruxooznrcjqc';
export const CONTRACT = 'assess-recovery-attestation/1';
export const MAX_HOURS = 48;
const canonical = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const stop = reason => { throw Error(`STOP ${reason}`); };

export function manifestHash(path) {
  let bytes, manifest;
  try { bytes = readFileSync(path); manifest = JSON.parse(bytes); } catch { stop('manifest_unreadable'); }
  if (manifest?.contract !== 'rad085-grading-worker-build/1' || manifest.localOnly !== false) stop('manifest_contract');
  return createHash('sha256').update(bytes).digest('hex');
}

export function buildAttestation({ manifestSha256, baselineAt, validHours, noRestore, now }) {
  if (noRestore !== true) stop('no_restore_not_confirmed');
  if (typeof manifestSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(manifestSha256)) stop('manifest_sha256');
  if (!canonical(baselineAt)) stop('baseline_not_canonical');
  if (!Number.isInteger(validHours) || validHours < 1 || validHours > MAX_HOURS) stop('valid_hours');
  if (!Number.isFinite(now)) stop('clock');
  const issued = now, expires = issued + validHours * 3600 * 1000;
  if (!(Date.parse(baselineAt) <= issued)) stop('baseline_after_issue');
  // Key order matches the W4 step 6 template; the worker compares sorted keys.
  return { contract: CONTRACT, projectRef: PROJECT_REF, manifestSha256, baselineAt, restoresSinceBaseline: 0,
    issuedAt: new Date(issued).toISOString(), expiresAt: new Date(expires).toISOString() };
}

export function parseArgs(argv) {
  const known = new Set(['--manifest', '--manifest-sha256', '--baseline-at', '--valid-hours']);
  const options = {}; let noRestore = false;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--no-restore-since-baseline') { if (noRestore) stop('arguments'); noRestore = true; continue; }
    if (!known.has(flag) || Object.hasOwn(options, flag) || i + 1 >= argv.length) stop('arguments');
    options[flag] = argv[++i];
  }
  if (Object.hasOwn(options, '--manifest') === Object.hasOwn(options, '--manifest-sha256')) stop('arguments');
  if (!Object.hasOwn(options, '--baseline-at') || !/^[0-9]+$/.test(options['--valid-hours'] ?? '')) stop('arguments');
  return { manifest: options['--manifest'], manifestSha256: options['--manifest-sha256'], baselineAt: options['--baseline-at'],
    validHours: Number(options['--valid-hours']), noRestore };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const manifestSha256 = args.manifest === undefined ? args.manifestSha256 : manifestHash(args.manifest);
    const attestation = buildAttestation({ ...args, manifestSha256, now: Date.now() });
    process.stdout.write(JSON.stringify(attestation) + '\n');
    process.stderr.write(`PASS: issuedAt ${attestation.issuedAt} expiresAt ${attestation.expiresAt}\n`);
  } catch (error) {
    process.stderr.write((/^STOP [a-z0-9_]+$/.test(error?.message) ? error.message : 'STOP unexpected') + '\n');
    process.exitCode = 1;
  }
}
