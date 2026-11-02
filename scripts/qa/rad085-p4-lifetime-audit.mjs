// Offline P4 acceptance: the production ReviewSession, synthetic DTOs, no SQL/auth.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const messages = Object.fromEntries(['en', 'ar'].map(locale => [locale, JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))]));
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {ReviewSession, SUPERVISOR_DATA_TTL_MS} from './src/features/supervisor-review/ReviewSession';
import {ReviewError} from './src/features/supervisor-review/contracts';
import {appCopy} from './src/features/supervisor-review/copy';
const actor={id:'supervisor',role:'supervisor',name:'Supervisor'};
const group={id:'group',name:'Private group',supervisorId:actor.id,startsAt:0,supervisedFrom:0,endsAt:4102444800000,revision:1};
window.reads=0;window.deny=false;window.ttl=SUPERVISOR_DATA_TTL_MS;
const adapter={accounts:[actor],read:async()=>{window.reads++;if(window.deny)throw new ReviewError('denied');return {
now:Date.now(),visibilityUntil:Infinity,appointed:true,isMember:null,people:{rows:[],next:null},groups:{rows:[group],next:null},group,
requests:{rows:[{id:'request',groupId:'group',studentId:'student',studentName:'Private applicant',status:'pending',revision:1}],next:null},
members:{rows:[{id:'student',name:'Private student',joinedAt:0}],next:null},
results:{rows:[{id:'result',studentId:'student',studentName:'Private result name',kind:'practice',at:Date.now(),score:'7 / 10',visibleUntil:4102444800000}],next:null}};},execute:async()=>({code:'PRIVATE-CODE'})};
window.mount=(locale)=>createRoot(document.getElementById('fixture')).render(<main className="platform-page mx-auto max-w-5xl space-y-6 px-4 py-8"><h1 className="text-3xl font-bold">{appCopy[locale].title}</h1><ReviewSession adapter={adapter} actorId={actor.id} groupId="group" selectGroup={()=>{}} locale={locale} text={appCopy[locale]}/></main>);
` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true });
assert.ok(!Object.keys(bundle.metafile.inputs).some(p => /supabase|features\/pilot|features\/assess/.test(p)), 'no live adapter imports');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>P4 synthetic acceptance</title><style>${css}</style></head><body><div id="fixture"></div><script>${bundle.outputFiles[0].text}</script></body></html>`;
const output = '/tmp/rad085-p4'; mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
try {
 for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width, height: 900 } }), page = await context.newPage(), t = messages[locale].supervisor;
  const errors = [], network = []; page.setDefaultTimeout(10000);
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await context.route('**/*', route => { network.push(route.request().url()); return route.abort(); });
  await page.clock.install(); await page.setContent(html);
  await page.evaluate(({ locale, theme }) => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = theme; window.mount(locale); }, { locale, theme });
  await page.getByText('7 / 10', { exact: true }).waitFor();
  await page.getByRole('button', { name: t.rotate, exact: true }).click(); await page.getByText('PRIVATE-CODE', { exact: true }).waitFor();
  const before = await page.evaluate(() => window.reads), ttl = await page.evaluate(() => window.ttl);
  await page.clock.fastForward(ttl); await page.getByRole('alert').filter({ hasText: t.refreshToView }).waitFor();
  async function cleared() {
   const body = await page.locator('#fixture').textContent();
   for (const secret of ['Private group', 'Private applicant', 'Private student', 'Private result name', '7 / 10', 'PRIVATE-CODE', t.success]) assert.ok(!body.includes(secret), `cleared: ${secret}`);
   assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0);
  }
  async function audit(state) {
   await page.evaluate(axe);
   const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
   assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], state);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
   results.push({ locale, width, theme, state, axeViolations: 0 });
  }
  await cleared(); await audit('ttl-hidden');
  if (width === 390 && theme === 'dark') await page.screenshot({ path: `${output}/${locale}-hidden.jpg`, type: 'jpeg', quality: 78, fullPage: true });
  const refresh = page.getByRole('button', { name: t.retry, exact: true }); await refresh.focus(); assert.ok(await refresh.evaluate(b => b === document.activeElement));
  await page.clock.fastForward(ttl * 2); assert.equal(await page.evaluate(() => window.reads), before);
  await refresh.click(); await page.getByText('7 / 10', { exact: true }).waitFor();
  await page.evaluate(() => { window.deny = true; }); await refresh.click(); await page.getByRole('alert').filter({ hasText: t.denied }).waitFor();
  await cleared(); await audit('denied-hidden');
  assert.deepEqual(errors, []); assert.deepEqual(network, []);
  console.log(`${locale}/${width}/${theme}: TTL + denial, axe 0, network 0`); await context.close();
 }
 writeFileSync(`${output}/results.json`, JSON.stringify({ results, networkRequests: 0, liveAdapterImports: 0 }, null, 2));
} finally { await browser.close(); }
