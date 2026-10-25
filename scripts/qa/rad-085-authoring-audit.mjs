// Loopback-only authoring review and offline browser QA; never runs Next or a worker.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const catalogBundle = await build({ entryPoints: ['src/features/authoring-review/catalog.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { localPartCatalog, localPracticalCatalog } = await import('data:text/javascript;base64,' + Buffer.from(catalogBundle.outputFiles[0].text).toString('base64'));
const practical = process.argv.includes('--practical');
const practicals = localPracticalCatalog();
const parts = localPartCatalog(); assert.ok(parts.length > 0);
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {LocalAuthoringReview} from './src/features/authoring-review/Session'; import {createAuthoringFixture} from './src/features/authoring-review/synthetic'; const locale=new URL(location.href).searchParams.get('locale')==='ar'?'ar':'en'; document.documentElement.lang=locale; document.documentElement.dir=locale==='ar'?'rtl':'ltr'; createRoot(document.getElementById('fixture')).render(<LocalAuthoringReview fixture={createAuthoringFixture(${JSON.stringify(parts)}, { practicals: ${JSON.stringify(practicals)} })} locale={locale}/>);` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true });
const inputs = Object.keys(bundle.metafile.inputs);
assert.deepEqual(inputs.filter(p => /supabase|features\/pilot|\/server-|\/catalog\.ts|data\/cases|data\/exams|\/evaluation\//.test(p)), [], 'no live clients, private validators, registry targets or evaluator in browser bundle');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RAD-085 synthetic authoring review</title><style>${css}</style></head><body><div id="fixture"></div><script>${bundle.outputFiles[0].text}</script></body></html>`;
if (process.argv.includes('--serve')) {
 const server = createServer((req, res) => { if (req.url?.startsWith('/favicon')) { res.writeHead(204).end(); return; } res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" }); res.end(html); });
 server.listen(3186, '127.0.0.1', () => console.log('Local review: http://127.0.0.1:3186/?locale=ar (or locale=en). Memory only. Ctrl-C stops.'));
} else {
 const require = createRequire(process.env.RAD085_QA_MANIFEST ?? '/tmp/rad085-p2-browser/package.json');
 const { chromium } = require('playwright'), axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
 const { copy } = await import('../../src/features/authoring-review/copy.ts');
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 const output = practical ? '/tmp/rad085-practical' : '/tmp/rad085-authoring'; mkdirSync(output, { recursive: true }); mkdirSync('docs/review', { recursive: true });
 let audits = 0, interactions = 0; const captures = [];
 try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
   const context = await browser.newContext({ viewport: { width, height: 900 } }), page = await context.newPage(), t = copy[locale], errors = [], network = [];
   await context.route('**/*', route => { if (route.request().isNavigationRequest() && route.request().url() === `http://127.0.0.1:3186/?locale=${locale}`) return route.fulfill({ contentType: 'text/html', body: html }); network.push(route.request().url()); return route.abort(); }); page.on('pageerror', e => errors.push(e.message));
   await page.goto(`http://127.0.0.1:3186/?locale=${locale}`); await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
   async function audit(label) {
    await page.evaluate(axe); const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], label); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' no overflow'); audits++; console.log(`${locale}-${width}-${theme}: ${label}`);
   }
   const button = label => page.getByRole('button', { name: label, exact: true });
   const account = page.getByLabel(t.account), scenario = page.getByLabel(t.scenario);
   const selectGroup = () => page.getByRole('button', { name: /Synthetic group/ }).first().click();
   await button(t.first).waitFor(); assert.equal(await button(t.first).isDisabled(), true);
   await selectGroup(); await button(practical ? t.createPractical : t.create).click(); await page.getByText(practical ? t.noPracticalItems : t.noItems, { exact: true }).waitFor(); await audit('empty draft');
   await button(t.preview).click(); await page.getByRole('alert').waitFor(); await audit('validation');
   await page.getByLabel(t.name, { exact: true }).fill('Synthetic token review'); await page.getByLabel(t.duration, { exact: true }).fill('120'); await page.getByLabel(t.attempts, { exact: true }).fill('2'); await page.getByLabel(t.visibility).selectOption('after-submission');
   async function authors(container) { await container.getByLabel(t.author, { exact: true }).fill('Synthetic local author'); await container.getByLabel(t.reference, { exact: true }).fill('PRIVATE SOURCE: locally generated engineering fixture'); await container.getByLabel(t.licenceNotes, { exact: true }).fill('PRIVATE LICENCE: unresolved; no publication approval'); await container.getByLabel(t.notes, { exact: true }).fill('PRIVATE AUTHOR NOTE'); }
   if (practical) {
    for (let n = 0; n < 2; n++) {
     await button(t.addPractical).click();
     const full = page.getByRole('group').filter({ has: page.getByLabel(t.prompt) }).last();
     await full.getByLabel(t.prompt, { exact: true }).fill('Engineering preview of existing controls only.'); await authors(full);
    }
    assert.equal(await button(t.addMCQ).count(), 0); assert.equal(await button(t.addPart).count(), 0);
    assert.equal(await page.getByLabel(t.points, { exact: true }).count(), 0);
    const first = page.getByLabel(t.practicalCatalog).first();
    for (const ref of practicals) {
     await first.selectOption(ref.id); await button(t.preview).click();
     const preview = page.getByRole('region', { name: t.previewTitle });
     await preview.locator('#practical-control-kvp').waitFor();
     assert.equal(await preview.locator('svg').count(), 0); await preview.getByText(t.sceneBoundary, { exact: true }).waitFor();
     assert.equal(await preview.getByText(/PRIVATE SOURCE|PRIVATE LICENCE|PRIVATE AUTHOR NOTE/).count(), 0);
     const ids = await preview.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id)); assert.equal(new Set(ids).size, ids.length);
     await preview.locator('#practical-control-kvp').focus(); await page.keyboard.press('ArrowRight');
     await audit('existing family ' + ref.examId); await button(t.closePreview).click(); interactions += 4;
    }
    await first.selectOption(practicals[0].id);
   } else {
   await button(t.addMCQ).click();
   const item = page.getByRole('group').filter({ has: page.getByLabel(t.prompt) }).last();
   await item.getByLabel(t.prompt, { exact: true }).fill('Which token matches ALPHA?'); await item.getByLabel(t.points, { exact: true }).fill('0.100001');
   await item.getByLabel(t.option + ' 1', { exact: true }).fill('ALPHA'); await item.getByLabel(t.option + ' 2', { exact: true }).fill('BETA');
   await button(t.addOption).click(); await item.getByLabel(t.option + ' 3', { exact: true }).fill('GAMMA'); await button(t.removeOption + ' 3').click(); await item.getByLabel(t.correct).selectOption({ index: 1 });
   await authors(item); await button(t.addPart).click();
   const sim = page.getByRole('group').filter({ has: page.getByLabel(t.prompt) }).last();
   await sim.getByLabel(t.prompt, { exact: true }).fill('Adjust the displayed control. Engineering preview only.'); await sim.getByLabel(t.points, { exact: true }).fill('0.2'); await authors(sim);
   await sim.getByRole('button', { name: t.up, exact: true }).click(); await page.getByRole('button', { name: t.down, exact: true }).first().click();
   }
   await button(t.save).click(); await page.getByText(new RegExp(t.saved)).waitFor(); await audit('authoring'); interactions += 22;
   if (practical && width === 390 && theme === 'dark') { const path = `docs/review/rad085-practical-${locale}.jpg`; await page.screenshot({ path, type: 'jpeg', quality: 78, fullPage: true }); captures.push(path); }
   await button(t.preview).focus(); await page.keyboard.press('Enter'); await page.getByRole('heading', { name: t.previewTitle, exact: true }).waitFor();
   assert.equal(await page.getByText(/PRIVATE SOURCE|PRIVATE LICENCE|PRIVATE AUTHOR NOTE/).count(), 0); assert.equal(await page.getByLabel(t.correct).count(), 0);
   if (practical) {
    const preview = page.getByRole('region', { name: t.previewTitle }), kvp = preview.locator('#practical-control-kvp');
    const initial = await kvp.inputValue(); await kvp.focus(); await page.keyboard.press('ArrowRight'); const changed = await kvp.inputValue(); assert.notEqual(changed, initial);
    await audit('practical preview'); await preview.getByRole('button', { name: `${t.item} 2`, exact: true }).click(); assert.equal(await kvp.inputValue(), initial);
    const ids = await preview.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id)); assert.equal(new Set(ids).size, ids.length);
    await preview.getByRole('button', { name: `${t.item} 1`, exact: true }).click(); assert.equal(await kvp.inputValue(), changed);
    await button(t.closePreview).click(); await button(t.preview).click(); assert.equal(await kvp.inputValue(), initial); await button(t.closePreview).click(); interactions += 8;
   } else {
   const preview = page.getByRole('region', { name: t.previewTitle }); assert.equal(await preview.locator(':checked').count(), 0); await preview.getByRole('radio', { name: 'BETA', exact: true }).check();
   await audit('student preview'); await preview.getByRole('button', { name: `${t.item} 2`, exact: true }).click();
   const slider = preview.getByRole('slider'); await slider.focus(); await page.keyboard.press('ArrowRight'); await audit('simulator preview');
   await button(t.closePreview).click(); await button(t.preview).click(); assert.equal(await preview.locator(':checked').count(), 0); await button(t.closePreview).click(); interactions += 8;
   }
   await button(t.prepare).click(); await page.getByRole('region', { name: t.assignment }).waitFor(); await audit('assignment review');
   const review = page.getByRole('region', { name: t.assignment }); assert.equal(await review.locator('li').count(), 20);
   await review.getByRole('button', { name: t.next, exact: true }).click(); await review.getByText(/^Student 24/).waitFor(); assert.equal(await review.locator('li').count(), 4);
   await button(t.cancelReview).click(); assert.equal(await button(t.confirm).count(), 0);
   await button(t.prepare).click(); await button(t.confirm).click(); await page.getByText(t.receipt, { exact: true }).waitFor(); interactions += 6;
   await button(t.discard).click(); await button(t.keep).click(); await button(t.discard).click(); await button(t.confirmDiscard).click(); interactions += 4;
   // Pending context, account switches and cancellation never restore old author/target data.
   await scenario.selectOption('slow'); await page.getByText(t.loading, { exact: true }).first().waitFor(); await button(t.cancel).click(); await page.getByText(t.cancelled, { exact: true }).waitFor();
   await account.selectOption({ index: 1 }); await scenario.selectOption('normal'); await selectGroup(); await button(t.create).waitFor(); assert.equal(await page.getByLabel(t.name, { exact: true }).count(), 0); interactions += 4;
   // Returning to a saved scope is an explicit fresh adapter read, not a stale response from the previous scope.
   await account.selectOption({ index: 0 }); await selectGroup(); await page.getByLabel(t.name, { exact: true }).waitFor();
   await scenario.selectOption('conflict'); await button(t.save).click(); await page.getByRole('alert').filter({ hasText: t.conflict }).waitFor(); assert.equal(await page.getByLabel(t.name, { exact: true }).count(), 0); await audit('conflict');
   await scenario.selectOption('offline'); await page.getByRole('alert').filter({ hasText: t.error }).first().waitFor(); await audit('error');
   await scenario.selectOption('normal'); await page.getByLabel(t.name, { exact: true }).waitFor(); await button(t.expire).click(); await page.getByRole('alert').filter({ hasText: t.expired }).waitFor(); assert.equal(await page.getByLabel(t.name, { exact: true }).count(), 0); await audit('expired');
   await button(t.revoke).click(); await page.getByRole('alert').filter({ hasText: t.denied }).first().waitFor(); await audit('revoked'); interactions += 6;
   assert.deepEqual(errors, []); assert.deepEqual(network, []); console.log(`${locale}-${width}-${theme}: passed, zero network`); await context.close();
  }
  const result = { audits, interactions, captures, catalogReferences: practical ? practicals.length : parts.length, networkRequests: 0, forbiddenImports: 0 }; writeFileSync(output + '/results.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
 } finally { await browser.close(); }
}
