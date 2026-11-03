// Manual synchronous renderer benchmark; no app server, deployment, text or marker glyphs.
// node scripts/qa/radiograph-performance.mjs /tmp/rad096-before.json
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const output = process.argv[2];
const { chromium } = createRequire(import.meta.url)('playwright');
if (!output) throw Error('Provide a result path outside the repository (never updates witnesses).');
const bundle = await build({
  stdin: { contents: `
    import { WITNESS_CASES, witnessProbes, witnessResolution } from './src/features/radiograph/cross-family-test-utils';
    import { renderRadiograph } from './src/features/radiograph/pipeline';
    globalThis.radiographAudit = { cases: WITNESS_CASES, probes: witnessProbes, resolution: witnessResolution, render: renderRadiograph };
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
});
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.route('http://rad096.local/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    return pathname === '/' ? route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' })
      : route.fulfill({ path: resolve('public', '.' + pathname) });
  });
  await page.goto('http://rad096.local/');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const ids = await page.evaluate(() => globalThis.radiographAudit.cases.map(c => c.id));
  const rows = [];
  for (const id of ids) {
    const result = await page.evaluate(async id => {
      const { cases, probes, resolution, render } = globalThis.radiographAudit;
      const c = cases.find(c => c.id === id);
      const image = new Image(); image.src = c.radiograph.src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
      const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const data = Float32Array.from({ length: canvas.width * canvas.height }, (_, i) => rgba[4 * i]);
      const src = { width: canvas.width, height: canvas.height, data };
      const ps = probes(c);
      const selected = [ps.find(p => p.id === 'baseline'), ps.find(p => p.id === 'rotation/max')];
      return selected.map(probe => {
        const plan = probe.solo, pxPerCm = resolution(plan, c);
        for (let i = 0; i < 3; i++) render(plan, c.radiograph, src, pxPerCm);
        const samples = [];
        for (let i = 0; i < 9; i++) {
          const start = performance.now(); render(plan, c.radiograph, src, pxPerCm); samples.push(performance.now() - start);
        }
        const out = render(plan, c.radiograph, src, pxPerCm);
        let binary = '';
        for (let i = 0; i < out.luma.length; i += 8192) binary += String.fromCharCode(...out.luma.subarray(i, i + 8192));
        return { exam: id, scenario: probe.id, patch: probe.patch, width: out.width, height: out.height, pxPerCm,
          medianMs: [...samples].sort((a, b) => a - b)[4], samplesMs: samples, luma: btoa(binary) };
      });
    }, id);
    for (const row of result) {
      const { luma, ...values } = row;
      rows.push({ ...values, lumaSHA256: createHash('sha256').update(Buffer.from(luma, 'base64')).digest('hex') });
    }
    console.log(id, result.map(r => r.medianMs.toFixed(1)).join(' / '));
  }
  writeFileSync(output, JSON.stringify({
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    browser: browser.version(), viewport: '390x844', dpr: 1, warmups: 3, measured: 9,
    timing: 'performance.now around synchronous renderRadiograph only; no decode/plan/annotations; unthrottled; sequential', rows,
  }, null, 2) + '\n');
} finally { await browser.close(); }
