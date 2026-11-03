import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { layerViolations } from './layers.mjs';

const json = path => JSON.parse(readFileSync(path, 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
export const cloneKey = clone => JSON.stringify([
  [clone.firstFile.name, clone.secondFile.name].map(p => p.replaceAll('\\', '/').replace(process.cwd() + '/', '')).sort(),
  clone.format, sha(clone.fragment),
]);

export function checkDuplication(report, baseline, policy, longReport = report) {
  const errors = [];
  const cap = baseline.duplication.statistics.percentage + 0.5;
  if (report.statistics.total.percentage > cap) errors.push(`duplication ${report.statistics.total.percentage}% > ${cap}%`);
  const permitted = new Map(policy.longClones.map(c => [c.key, c]));
  const counts = new Map();
  for (const clone of longReport.duplicates.filter(c => c.lines >= 30)) {
    const key = cloneKey(clone), count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    const allowed = permitted.get(key);
    if (!allowed?.reason || count > allowed.count) errors.push(`new clone >=30 lines: ${key}`);
  }
  return errors;
}

export function checkKnip(report, exceptions) {
  const errors = [], reviewed = [];
  if (!Array.isArray(report.issues)) throw Error('invalid Knip JSON');
  for (const issue of report.issues) for (const [kind, values] of Object.entries(issue)) {
    if (!Array.isArray(values)) continue;
    for (const { name } of values) {
      const match = exceptions.find(e => e.file === issue.file && e.kind === kind && e.name === name && e.reason);
      if (match) reviewed.push(match);
      else errors.push(`Knip ${issue.file}: ${kind} ${name}`);
    }
  }
  return { errors, reviewed };
}

export function checkPages(rows, budget) {
  const errors = [], covered = new Set();
  for (const row of rows) {
    const path = row.page.replace(/\/index\.html$/, '.html');
    const family = /^(en|ar)\.html$/.test(path) ? 'home'
      : /\/(practice)\.html$/.test(path) ? 'practice' : path.match(/^\w+\/(training|supervisor|account|owner|assess)\.html$/)?.[1];
    if (!family) continue;
    covered.add(`${row.page.split(/[/.]/)[0]}/${family}`);
    const cap = budget.pages[family] * 1024;
    if (!Number.isFinite(row.gzip_bytes) || !row.assets || row.gzip_bytes > cap) errors.push(`page ${row.page}: ${row.gzip_bytes} bytes > ${cap}`);
  }
  for (const locale of ['en', 'ar']) for (const family of Object.keys(budget.pages)) {
    if (!covered.has(`${locale}/${family}`)) errors.push(`missing page family ${locale}/${family}`);
  }
  return errors;
}

export function checkImages(paths, budget) {
  return paths.filter(p => /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(p))
    .filter(p => statSync(p).size > budget.new_image * 1024)
    .map(p => `new image ${p}: ${statSync(p).size} bytes > ${budget.new_image * 1024}`);
}

export function run(args = process.argv.slice(2)) {
  const mode = args[0] ?? 'source';
  if (!['source', 'sizes'].includes(mode)) throw Error('expected source or sizes');
  const policy = json('scripts/code-health/policy.json');
  const budget = json('docs/budgets.json').code_health;
  const errors = [], results = {};
  if (mode === 'source') {
    for (const [tool, version] of Object.entries(policy.versions)) {
      if (json(`node_modules/${tool}/package.json`).version !== version || json('package.json').devDependencies[tool] !== version) throw Error(`unpinned ${tool}`);
    }
    const output = mkdtempSync(join(tmpdir(), 'rad094-cpd-'));
    try {
      const b = json('docs/CODE_HEALTH_BASELINE_2026-11-03.json').duplication;
      const scan = spawnSync(resolve('node_modules/.bin/jscpd'), [...b.paths, '--min-lines', String(b.minLines), '--min-tokens', String(b.minTokens), '--mode', b.mode,
        '--format', b.format.join(','), '--ignore', b.ignore.join(','), '--reporters', 'json', '--output', output, '--silent'], { encoding: 'utf8' });
      if (scan.error || scan.status !== 0) throw Error(`jscpd failed: ${scan.stderr}`);
      const report = json(join(output, 'jscpd-report.json'));
      // Keep the historical ratio comparable; also inspect large sources for NEW long clones.
      const full = spawnSync(resolve('node_modules/.bin/jscpd'), [...b.paths, '--min-lines', String(b.minLines), '--min-tokens', String(b.minTokens), '--mode', b.mode,
        '--format', b.format.join(','), '--ignore', b.ignore.join(','), '--max-lines', '1000000', '--max-size', '100mb', '--reporters', 'json', '--output', output, '--silent'], { encoding: 'utf8' });
      if (full.error || full.status !== 0) throw Error(`long-clone scan failed: ${full.stderr}`);
      const longReport = json(join(output, 'jscpd-report.json'));
      errors.push(...checkDuplication(report, json('docs/CODE_HEALTH_BASELINE_2026-11-03.json'), policy, longReport));
      results.duplication = report.statistics.total;
      results.longCloneScan = longReport.statistics.total;
    } finally { rmSync(output, { recursive: true, force: true }); }
    const scan = spawnSync(resolve('node_modules/.bin/knip'), ['--config', 'knip.json', '--reporter', 'json'], { encoding: 'utf8' });
    if (scan.error || ![0, 1].includes(scan.status)) throw Error(`Knip failed: ${scan.stderr}`);
    const knip = checkKnip(JSON.parse(scan.stdout), policy.knipExceptions);
    if (scan.status === 1 && !JSON.parse(scan.stdout).issues.length) throw Error(`Knip failed: ${scan.stderr}`);
    errors.push(...knip.errors);
    results.knip = knip;
    const violations = layerViolations();
    errors.push(...violations.filter(v => !policy.layerExceptions.some(e => e.violation === v && e.reason)).map(v => `layer ${v}`));
    results.layers = violations;
  } else {
    results.pages = JSON.parse(execFileSync('python3', ['scripts/code-health/pages.py'], { encoding: 'utf8' }));
    errors.push(...checkPages(results.pages, budget));
    const base = process.env.CODE_HEALTH_BASE ?? 'origin/main';
    const added = execFileSync('git', ['diff', '--no-renames', '--diff-filter=A', '--name-only', '-z', base], { encoding: 'utf8' });
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' });
    const paths = [...new Set((added + untracked).split('\0').filter(Boolean))];
    errors.push(...checkImages(paths, budget));
    results.newImages = paths.filter(p => /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(p));
  }
  console.log(JSON.stringify({ mode, results, errors }, null, 2));
  return errors.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = run();
