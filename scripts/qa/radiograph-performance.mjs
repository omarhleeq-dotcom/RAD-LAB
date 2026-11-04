// Manual synchronous renderer benchmark. Defaults preserve the Session 1 method.
// node scripts/qa/radiograph-performance.mjs /tmp/performance.json --exam hand-lateral --compare-main --warmups 25 --samples 51 --rounds 5
// --allow-differ foot-ap/rotation/max (repeatable): an INTENDED main/branch pixel change; it is recorded, not a STOP. Any undeclared difference still stops.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { relative, resolve } from 'node:path';

const args = process.argv.slice(2), output = args.shift();
if (!output) throw Error('Provide a result path outside the repository (never updates witnesses).');
const options = { warmups: 3, samples: 9, rounds: 1, exam: null, compareMain: false, allowDiffer: [] };
while (args.length) {
  const flag = args.shift();
  if (flag === '--compare-main') options.compareMain = true;
  else if (flag === '--exam') options.exam = args.shift();
  else if (flag === '--allow-differ') options.allowDiffer.push(args.shift());
  else if (['--warmups', '--samples', '--rounds'].includes(flag)) {
    const key = flag.slice(2), value = Number(args.shift());
    if (!Number.isInteger(value) || value < 1) throw Error('Benchmark counts must be positive integers');
    options[key] = value;
  } else throw Error('Unknown benchmark option');
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const { chromium } = createRequire(import.meta.url)('playwright');
const variants = options.compareMain ? ['main', 'branch'] : ['branch'];
const bundles = [];
for (const variant of variants) {
  const bundle = await build({
    stdin: { contents: `
      import { WITNESS_CASES, witnessProbes, witnessResolution } from './src/features/radiograph/cross-family-test-utils';
      import { renderRadiograph } from './src/features/radiograph/pipeline';
      globalThis.radiographAudits ??= {};
      globalThis.radiographAudits[${JSON.stringify(variant)}] = { cases: WITNESS_CASES, probes: witnessProbes, resolution: witnessResolution, render: renderRadiograph };
    `, resolveDir: process.cwd(), loader: 'ts' },
    plugins: variant === 'main' ? [{ name: 'untouched-main-products', setup(builder) {
      builder.onLoad({ filter: /\/src\/.*\.tsx?$/ }, ({ path }) => {
        if (/test-utils|\.test\./.test(path)) return; // Current test harness, untouched origin/main product modules.
        return { contents: git('show', `origin/main:${relative(process.cwd(), path)}`), loader: path.endsWith('.tsx') ? 'tsx' : 'ts' };
      });
    } }] : [],
    bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
  });
  bundles.push(bundle.outputFiles[0].text);
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.route('http://rad097.local/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    return pathname === '/' ? route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' })
      : route.fulfill({ path: resolve('public', '.' + pathname) });
  });
  await page.goto('http://rad097.local/');
  for (const content of bundles) await page.addScriptTag({ content });
  const ids = await page.evaluate(() => globalThis.radiographAudits.branch.cases.map(c => c.id));
  if (options.exam && !ids.includes(options.exam)) throw Error('Unknown exam');
  const rows = [];
  for (const id of ids.filter(id => !options.exam || options.exam === id)) {
    const result = await page.evaluate(async ({ id, variants, options }) => {
      const audits = globalThis.radiographAudits;
      const c = audits.branch.cases.find(c => c.id === id);
      const image = new Image(); image.src = c.radiograph.src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const src = { width: canvas.width, height: canvas.height, data: Float32Array.from({ length: canvas.width * canvas.height }, (_, i) => rgba[4 * i]) };
      const probes = Object.fromEntries(variants.map(v => [v, audits[v].probes(c)]));
      const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
      const results = [];
      for (const scenario of ['baseline', 'rotation/max']) {
        const selected = Object.fromEntries(variants.map(v => [v, probes[v].find(p => p.id === scenario)]));
        if (variants.some(v => JSON.stringify(selected[v].solo) !== JSON.stringify(selected.branch.solo))) throw Error('Main/branch raw benchmark plans differ');
        const render = v => audits[v].render(selected[v].solo, c.radiograph, src, audits[v].resolution(selected[v].solo, c));
        for (let i = 0; i < options.warmups; i++) for (const v of variants) render(v);
        const samples = Object.fromEntries(variants.map(v => [v, []]));
        const rounds = Object.fromEntries(variants.map(v => [v, []]));
        for (let round = 0; round < options.rounds; round++) {
          const current = Object.fromEntries(variants.map(v => [v, []]));
          for (let i = 0; i < options.samples; i++) for (const v of (round + i) % 2 ? [...variants].reverse() : variants) {
            const start = performance.now(); render(v); current[v].push(performance.now() - start);
          }
          for (const v of variants) { samples[v].push(...current[v]); rounds[v].push(median(current[v])); }
        }
        for (const v of variants) {
          const out = render(v), sorted = [...samples[v]].sort((a, b) => a - b);
          let binary = '';
          for (let i = 0; i < out.luma.length; i += 8192) binary += String.fromCharCode(...out.luma.subarray(i, i + 8192));
          results.push({ exam: id, scenario, variant: v, patch: selected[v].patch, width: out.width, height: out.height,
            pxPerCm: audits[v].resolution(selected[v].solo, c), medianMs: median(sorted),
            iqrMs: [sorted[Math.floor(sorted.length / 4)], sorted[Math.floor(3 * sorted.length / 4)]],
            roundMediansMs: rounds[v], samplesMs: samples[v], luma: btoa(binary) });
        }
      }
      return results;
    }, { id, variants, options });
    for (const { luma, ...values } of result) rows.push({ ...values, lumaSHA256: createHash('sha256').update(Buffer.from(luma, 'base64')).digest('hex') });
    if (options.compareMain) for (const scenario of ['baseline', 'rotation/max']) {
      const pair = rows.filter(r => r.exam === id && r.scenario === scenario);
      const same = pair[0].lumaSHA256 === pair[1].lumaSHA256;
      for (const r of pair) r.mainBranchPixelsEqual = same;
      if (!same && !options.allowDiffer.includes(`${id}/${scenario}`)) throw Error(`STOP: ${id}/${scenario} main/branch pixels differ (not declared with --allow-differ)`);
    }
    console.log(id, result.map(r => `${r.variant}/${r.scenario}=${r.medianMs.toFixed(2)}`).join(' '));
  }
  writeFileSync(output, JSON.stringify({ head: git('rev-parse', 'HEAD'), baseline: git('rev-parse', 'origin/main'), browser: browser.version(),
    viewport: '390x844', dpr: 1, ...options, measuredPerVariant: options.samples * options.rounds,
    timing: `performance.now around renderRadiograph only; same decoded source; ${options.compareMain ? 'alternate AB/BA per sample' : 'sequential'}; no decode/plan/annotations; unthrottled`, rows }, null, 2) + '\n');
} finally { await browser.close(); }
