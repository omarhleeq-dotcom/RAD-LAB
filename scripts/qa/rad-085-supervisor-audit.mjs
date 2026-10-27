// Local-only review server and offline browser audit. Never starts Next or connects pilot auth.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {LocalSupervisorReview} from './src/features/supervisor-review/ReviewSession'; const locale=new URL(location.href).searchParams.get('locale')==='ar'?'ar':'en'; document.documentElement.lang=locale; document.documentElement.dir=locale==='ar'?'rtl':'ltr'; createRoot(document.getElementById('fixture')).render(<LocalSupervisorReview locale={locale}/>);` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true });
assert.ok(!Object.keys(bundle.metafile.inputs).some(p => /supabase|features\/pilot|features\/assess/.test(p)), 'review bundle contains no live adapters');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RAD-085 local synthetic review</title><style>${css}</style></head><body><div id="fixture"></div><script>${bundle.outputFiles[0].text}</script></body></html>`;
if (process.argv.includes('--serve')) {
 const server = createServer((req, res) => { if (req.url?.startsWith('/favicon')) { res.writeHead(204).end(); return; } res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" }); res.end(html); });
 server.listen(3185, '127.0.0.1', () => console.log('Local review: http://127.0.0.1:3185/?locale=ar (or locale=en). Synthetic memory resets on reload. Ctrl-C stops.'));
} else {
 const { chromium } = require('playwright'), axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 const { copy } = await import('../../src/features/supervisor-review/copy.ts');
 const output = '/tmp/rad085-supervisor'; mkdirSync(output, { recursive: true }); mkdirSync('docs/review', { recursive: true });
 let audits = 0, interactions = 0; const captures = [];
 try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
   const context = await browser.newContext({ viewport: { width, height: 900 } }), page = await context.newPage(), t = copy[locale], errors = [], network = [];
   await context.route('**/*', route => { network.push(route.request().url()); return route.abort(); });
   page.on('pageerror', e => errors.push(e.message));
   await page.goto('about:blank?locale=' + locale); await page.setContent(html);
   await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
   // setContent does not change location. The inline entry reads the query from about:blank.
   const account = page.getByLabel(t.account), scenario = page.getByLabel(t.scenario);
   async function audit(label) {
    await page.evaluate(axe); const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], label);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' no overflow'); audits++;
   }
   const groups = page.getByRole('button', { name: /Synthetic group/ }); await groups.first().click();
   await page.getByRole('heading', { name: t.results, exact: true }).waitFor();
   await audit('supervisor');
   await page.getByRole('heading', { name: t.members, exact: true }).locator('..').getByRole('button', { name: t.next, exact: true }).click();
   await page.getByRole('paragraph').filter({ hasText: /^Student 24 · طالب$/ }).waitFor(); interactions++;
   await page.getByRole('button', { name: t.rotate, exact: true }).click();
   const codePanel = page.getByRole('heading', { name: t.code, exact: true }).locator('..'); await codePanel.waitFor();
   const code = await codePanel.locator('p[dir=ltr]').textContent(); assert.match(code, /^DEMO-/); interactions++;
   if (width === 390 && theme === 'dark') { const path = `docs/review/rad085-${locale}.jpg`; await page.screenshot({ path, type: 'jpeg', quality: 78, fullPage: true }); captures.push(path); }
   // Switching accounts must synchronously clear results/code and cancel inflight reads.
   await scenario.selectOption('slow'); assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0); await page.getByText(t.loading, { exact: true }).waitFor();
   await account.selectOption({ index: 3 }); await scenario.selectOption('normal'); await page.getByRole('button', { name: t.join, exact: true }).waitFor();
   assert.equal(await page.getByRole('heading', { name: t.code, exact: true }).count(), 0); interactions++;
   await page.getByRole('button', { name: /Synthetic group 1/ }).click(); await page.getByRole('button', { name: t.leave, exact: true }).click(); await page.getByRole('button', { name: t.confirmLeave, exact: true }).click();
   await page.getByText(t.empty, { exact: true }).first().waitFor();
   await page.getByLabel(t.enter).fill(code); await page.getByRole('button', { name: t.join, exact: true }).click(); await page.getByText(new RegExp(t.pending)).waitFor(); await audit('student-pending');
   await page.getByRole('button', { name: t.cancel, exact: true }).click(); await page.getByText(new RegExp(t.cancelled)).waitFor();
   await page.getByLabel(t.enter).fill(code); await page.getByRole('button', { name: t.join, exact: true }).click(); await page.getByText(new RegExp(t.pending)).waitFor();
   await account.selectOption({ index: 1 }); await page.getByRole('button', { name: /Synthetic group 1/ }).click(); await page.getByRole('button', { name: t.reject, exact: true }).click(); await page.getByText(new RegExp(t.rejected)).waitFor();
   await account.selectOption({ index: 3 }); await page.getByLabel(t.enter).fill(code); await page.getByRole('button', { name: t.join, exact: true }).click(); await page.getByText(new RegExp(t.pending)).waitFor();
   await account.selectOption({ index: 1 }); await page.getByRole('button', { name: /Synthetic group 1/ }).click(); await page.getByRole('button', { name: t.approve, exact: true }).click(); await page.getByText(new RegExp(t.approved)).waitFor(); interactions += 6;
   // Empty groups with an end > 2^31 ms exercise long browser timer scheduling.
   await page.getByLabel(t.name, { exact: true }).fill('Extra synthetic group');
   const future = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 16);
   await page.getByLabel(t.ends, { exact: true }).fill(future); await page.getByRole('button', { name: t.create, exact: true }).click();
   await page.getByRole('heading', { name: t.code, exact: true }).waitFor();
   await page.getByRole('button', { name: 'Extra synthetic group', exact: true }).click(); await page.getByRole('heading', { name: 'Extra synthetic group', exact: true }).waitFor();
   assert.equal(await page.getByRole('heading', { name: t.code, exact: true }).count(), 0);
   await scenario.selectOption('conflict'); await page.getByRole('button', { name: t.rotate, exact: true }).click(); await page.getByRole('alert').filter({ hasText: t.conflict }).waitFor();
   await scenario.selectOption('normal'); await page.getByRole('button', { name: t.end, exact: true }).click(); await page.getByRole('button', { name: t.cancelAction, exact: true }).click();
   await page.getByRole('button', { name: t.end, exact: true }).click(); await page.getByRole('button', { name: t.confirmEnd, exact: true }).click(); await page.getByText(t.ended, { exact: true }).waitFor(); interactions += 5;
   await scenario.selectOption('offline'); await page.getByRole('alert').filter({ hasText: t.offline }).waitFor(); await audit('error'); await scenario.selectOption('normal');
   await page.getByRole('button', { name: /Synthetic group 1/ }).click(); await page.getByRole('button', { name: t.expire, exact: true }).click(); await page.getByText(t.ended, { exact: true }).waitFor(); assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0); await audit('expired');
   await account.selectOption({ index: 0 }); await page.getByRole('button', { name: t.revoke, exact: true }).first().click(); await page.getByRole('button', { name: t.confirmRevoke, exact: true }).click(); await page.getByRole('button', { name: t.appoint, exact: true }).waitFor(); await audit('owner');
   await account.selectOption({ index: 1 }); await page.getByText(t.revoked, { exact: true }).waitFor(); await audit('revoked');
   await page.getByRole('button', { name: t.retry, exact: true }).focus(); assert.ok(await page.getByRole('button', { name: t.retry, exact: true }).evaluate(n => n === document.activeElement)); await page.keyboard.press('Tab'); interactions += 4;
   assert.deepEqual(errors, []); assert.deepEqual(network, []); console.log(`${locale}-${width}-${theme}: passed, zero network`); await context.close();
  }
  const result = { audits, interactions, captures, networkRequests: 0, liveAdapterImports: 0 }; writeFileSync(output + '/results.json', JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
 } finally { await browser.close(); }
}
