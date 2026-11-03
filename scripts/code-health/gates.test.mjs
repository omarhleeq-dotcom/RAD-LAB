import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { checkDuplication, checkKnip, checkPages, checkImages, cloneKey } from './check.mjs';
import { layerViolations } from './layers.mjs';
import { pageChecks } from '../qa/page-checks.mjs';

const json = p => JSON.parse(readFileSync(p, 'utf8'));
const baseline = json('docs/CODE_HEALTH_BASELINE_2026-11-03.json');
const budget = json('docs/budgets.json').code_health;
const policy = json('scripts/code-health/policy.json');
const scratch = fn => {
  const path = mkdtempSync(join(tmpdir(), 'rad094-proof-'));
  try { return fn(path); } finally { rmSync(path, { recursive: true, force: true }); }
};

test('jscpd 4.0.5 detects seeded clones; both percentage and new-long-clone gates reject', () => scratch(dir => {
  // Distinct statements prevent internal repeated-line matches from dominating the fixture.
  const body = Array.from({ length: 60 }, (_, i) => `  console.log("seeded-unique-${i}", ${i});`).join('\n');
  writeFileSync(join(dir, 'a.js'), `function a() {\n${body}\n}\na();\n`);
  writeFileSync(join(dir, 'b.js'), `function b() {\n${body}\n}\nb();\n`);
  const scan = spawnSync(resolve('node_modules/.bin/jscpd'), [dir, '--min-lines', '12', '--min-tokens', '50', '--mode', 'mild', '--format', baseline.duplication.format.join(','), '--reporters', 'json', '--output', join(dir, 'report'), '--silent'], { encoding: 'utf8' });
  assert.equal(scan.status, 0, scan.stderr);
  const report = json(join(dir, 'report/jscpd-report.json'));
  const rejected = checkDuplication(report, baseline, { longClones: [] });
  assert.ok(rejected.some(e => e.startsWith('duplication ')));
  assert.ok(rejected.some(e => e.startsWith('new clone >=30')));
  const boundary = { statistics: { total: { percentage: 3.49 } }, duplicates: [] };
  assert.deepEqual(checkDuplication(boundary, baseline, policy), []);
  boundary.statistics.total.percentage = 3.5;
  assert.match(checkDuplication(boundary, baseline, policy)[0], /duplication/);
  const clone = report.duplicates.find(c => c.lines >= 30);
  const permission = { longClones: [{ key: cloneKey(clone), count: 1, reason: 'synthetic fixture only' }] };
  const lowPercentage = { statistics: { total: { percentage: 0 } }, duplicates: [clone] };
  assert.deepEqual(checkDuplication(lowPercentage, baseline, permission), []);
  lowPercentage.duplicates.push(clone);
  assert.match(checkDuplication(lowPercentage, baseline, permission)[0], /new clone/);
  lowPercentage.duplicates = [{ ...clone, fragment: clone.fragment + '\nextra()' }];
  assert.match(checkDuplication(lowPercentage, baseline, permission)[0], /new clone/);
}));

test('Knip detects seeded unused file/export/dependency; exact owner exceptions do not cover another symbol or file', () => scratch(dir => {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'seed', private: true, dependencies: { 'unused-seeded-package': '1.0.0' } }));
  writeFileSync(join(dir, 'knip.json'), JSON.stringify({ entry: ['main.ts'], project: ['*.ts'] }));
  writeFileSync(join(dir, 'main.ts'), "import { used } from './library'; console.log(used);\n");
  writeFileSync(join(dir, 'library.ts'), 'export const used = 1; export const unusedSeed = 2;\n');
  writeFileSync(join(dir, 'orphan.ts'), 'export const orphan = 3;\n');
  const scan = spawnSync(resolve('node_modules/.bin/knip'), ['--directory', dir, '--config', 'knip.json', '--reporter', 'json'], { encoding: 'utf8' });
  assert.equal(scan.status, 1, scan.stderr);
  const rejected = checkKnip(JSON.parse(scan.stdout), policy.knipExceptions).errors;
  for (const pattern of [/files.*orphan/, /exports unusedSeed/, /dependencies unused-seeded-package/]) assert.ok(rejected.some(e => pattern.test(e)), rejected.join('\n'));
  const file = 'src/features/pilot/owner-data.ts';
  const pinned = { issues: [{ file, exports: [{ name: 'ATTEMPT_COLUMNS' }, { name: 'NOTE_COLUMNS' }] }] };
  assert.deepEqual(checkKnip(pinned, policy.knipExceptions).errors, []);
  pinned.issues[0].exports.push({ name: 'NEW_UNUSED' });
  assert.equal(checkKnip(pinned, policy.knipExceptions).errors.length, 1);
  pinned.issues[0].file = 'src/features/pilot/another-file.ts';
  assert.equal(checkKnip(pinned, policy.knipExceptions).errors.length, 3);
}));

test('pure-layer graph catches React, TSX, DOM and indirect imports with the real resolver', () => scratch(dir => {
  for (const path of ['src/domain', 'src/features/evaluation', 'src/features/scoring', 'src/shared']) mkdirSync(join(dir, path), { recursive: true });
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { moduleResolution: 'bundler', module: 'esnext', jsx: 'react-jsx', paths: { '@/*': ['./src/*'] } } }));
  writeFileSync(join(dir, 'src/features/evaluation/engine.ts'), "import { value } from '@/shared/helper'; export const result = value;\n");
  writeFileSync(join(dir, 'src/shared/helper.ts'), 'export const value = 1;\n');
  assert.deepEqual(layerViolations(dir), []);
  for (const source of ["export { useState } from 'react';", 'export const value = document.body;', "export { value } from './View';"]) {
    writeFileSync(join(dir, 'src/shared/helper.ts'), source);
    writeFileSync(join(dir, 'src/shared/View.tsx'), 'export const value = <span />;');
    assert.ok(layerViolations(dir).some(v => v.startsWith('src/features/evaluation/engine.ts -> ')));
  }
  writeFileSync(join(dir, 'src/shared/helper.ts'), 'export const value = 1;');
  writeFileSync(join(dir, 'src/features/scoring/accidental-view.tsx'), 'export const score = <span />;');
  assert.ok(layerViolations(dir).some(v => v.includes('accidental-view.tsx')));
  writeFileSync(join(dir, 'src/domain/wrong.ts'), "export { result } from '../features/evaluation/engine';");
  assert.ok(layerViolations(dir).some(v => v.includes('domain imports higher layer')));
}));

test('every EN/AR page cap accepts exactly KiB limit, rejects +1 byte and missing export', () => {
  const rows = ['en', 'ar'].flatMap(locale => Object.entries(budget.pages).map(([family, cap]) => ({
    page: family === 'home' ? `${locale}.html` : family === 'practice' ? `${locale}/xray/seed/practice.html` : `${locale}/${family}.html`,
    gzip_bytes: cap * 1024, assets: 1,
  })));
  assert.deepEqual(checkPages(rows, budget), []);
  for (const row of rows) {
    row.gzip_bytes++;
    assert.equal(checkPages(rows, budget).length, 1, row.page);
    row.gzip_bytes--;
  }
  assert.match(checkPages(rows.slice(1), budget)[0], /missing page/);
});

test('HTML asset measurement deduplicates links/preloads, uses exact gzip baseline method and rejects missing chunks', () => scratch(dir => {
  mkdirSync(join(dir, 'out/en'), { recursive: true });
  const chunk = Buffer.from('synthetic JS and CSS payload');
  writeFileSync(join(dir, 'out/shared.js'), chunk);
  writeFileSync(join(dir, 'out/en.html'), '<script src="/shared.js"></script><link rel="preload" href="/shared.js"><link href="https://external.test/other.css">');
  writeFileSync(join(dir, 'out/en/training.html'), '<script src="../shared.js"></script>');
  const measure = () => spawnSync('python3', [resolve('scripts/code-health/pages.py')], { cwd: dir, encoding: 'utf8' });
  const scan = measure();
  assert.equal(scan.status, 0, scan.stderr);
  const rows = JSON.parse(scan.stdout);
  const bytes = Number(execFileSync('python3', ['-c', 'import gzip;print(len(gzip.compress(b"synthetic JS and CSS payload",compresslevel=9,mtime=0)))'], { encoding: 'utf8' }).trim());
  assert.equal(rows.length, 2);
  assert.ok(rows.every(r => r.assets === 1 && r.gzip_bytes === bytes));
  rmSync(join(dir, 'out/shared.js'));
  assert.notEqual(measure().status, 0);
}));

test('new image cap rejects 512001 bytes, accepts 512000; existing images are not retroactively gated', () => scratch(dir => {
  const file = join(dir, 'new.png');
  writeFileSync(file, Buffer.alloc(512000));
  assert.deepEqual(checkImages([file], budget), []);
  writeFileSync(file, Buffer.alloc(512001));
  assert.match(checkImages([file], budget)[0], /new image/);
  assert.deepEqual(checkImages([], budget), []);
}));

test('production source CLI exits 1 for seeded percentage, long clone, unused file and React-layer violations', () => {
  const file = 'scripts/rad094-seeded-source.mjs';
  const twin = 'scripts/rad094-seeded-twin.mjs';
  const view = 'src/features/scoring/rad094-seeded-view.tsx';
  const body = Array.from({ length: 600 }, (_, i) => `console.log("unique-rad094-seed-${i}", ${i});`).join('\n');
  try {
    writeFileSync(file, `function first() {\n${body}\n}\nfirst();\n`, { flag: 'wx' });
    writeFileSync(twin, `function second() {\n${body}\n}\nsecond();\n`, { flag: 'wx' });
    writeFileSync(view, 'export const seededScore = <span />;\n', { flag: 'wx' });
    const result = spawnSync(process.execPath, ['scripts/code-health/check.mjs', 'source'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    assert.equal(result.status, 1, result.stderr);
    const { errors } = JSON.parse(result.stdout);
    for (const pattern of [/^duplication /, /^new clone >=30/, /^Knip .*files/, /^layer .*rad094-seeded-view/]) assert.ok(errors.some(e => pattern.test(e)), errors.join('\n'));
  } finally { rmSync(file, { force: true }); rmSync(twin, { force: true }); rmSync(view, { force: true }); }
});

test('production sizes CLI exits 1 for a seeded page payload and newly added oversized image', () => scratch(dir => {
  // Isolated export + real repository policy; no dependency on a pre-existing build in the unit CI job.
  const out = join(dir, 'out');
  mkdirSync(out);
  writeFileSync(join(out, 'seed.js'), `/*${randomBytes(600000).toString('base64')}*/`);
  writeFileSync(join(out, 'en.html'), '<script src="/seed.js"></script>');
  mkdirSync(join(dir, 'scripts/code-health'), { recursive: true });
  mkdirSync(join(dir, 'docs'));
  mkdirSync(join(dir, 'public'));
  for (const path of ['scripts/code-health/policy.json', 'scripts/code-health/pages.py', 'docs/budgets.json']) writeFileSync(join(dir, path), readFileSync(path));
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, '-c', 'user.name=Seed', '-c', 'user.email=seed@example.test', 'commit', '--allow-empty', '-qm', 'seed base']);
  writeFileSync(join(dir, 'public/new.png'), Buffer.alloc(512001));
  const result = spawnSync(process.execPath, [resolve('scripts/code-health/check.mjs'), 'sizes'], { cwd: dir, env: { ...process.env, CODE_HEALTH_BASE: 'HEAD' }, encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const { errors } = JSON.parse(result.stdout);
  assert.ok(errors.some(e => e.startsWith('page en.html:')));
  assert.ok(errors.some(e => e.startsWith('new image public/new.png:')));
}));

test('three QA audit scripts re-expand byte-identically to merged main; browser call trace and failure output are unchanged', async () => {
  const shared = readFileSync('scripts/qa/page-checks.mjs', 'utf8');
  const body = shared.slice(shared.indexOf('  const axe ='), shared.indexOf('\n  return { axe, noOverflow };'));
  for (const name of ['hand', 'wrist', 'elbow']) {
    const path = `scripts/qa/${name}-audit.mjs`;
    const old = execFileSync('git', ['show', `5fc5a9d4bf39ff1520b531396fa285de1a74294a:${path}`], { encoding: 'utf8' });
    const expanded = readFileSync(path, 'utf8').replace('import { pageChecks } from "./page-checks.mjs";\n', '')
      .replace('  const { axe, noOverflow } = pageChecks(page, axeSrc, ok, tag);', body);
    assert.equal(expanded, old, path);
    const originalBody = old.slice(old.indexOf('  const axe ='), old.indexOf('\n\n  await page.goto', old.indexOf('  const axe =')));
    const original = new Function('page', 'axeSrc', 'ok', 'tag', originalBody + '\nreturn { axe, noOverflow };');
    for (const failure of [false, true]) {
      const exercise = async make => {
        const trace = [];
        const page = { evaluate: async fn => {
          trace.push(typeof fn === 'string' ? fn : fn.toString());
          return typeof fn === 'string' ? undefined : fn.toString().includes('axe.run') ? { violations: failure ? [{ id: 'seed', nodes: [{ target: ['#seed'] }] }] : [] } : !failure;
        } };
        const checks = make(page, 'synthetic axe bytes', (...args) => trace.push(args), 'ar/mobile');
        await checks.axe('setup');
        await checks.noOverflow('setup');
        return trace;
      };
      assert.deepEqual(await exercise(pageChecks), await exercise(original), `${name}/${failure}`);
    }
  }
});
