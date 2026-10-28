// RAD085-OWNER-APPOINT-PICKER-20261028. Real owner route/shell, isolated PostgreSQL,
// synthetic auth/client boundary only. No provider network, credentials or hosted preview.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url), { chromium } = require('playwright');
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const messages = Object.fromEntries(['en', 'ar'].map(l => [l, JSON.parse(readFileSync(`messages/${l}.json`, 'utf8'))]));
const helperDir = mkdtempSync('/tmp/p1-picker-helper-');
const helper = await build({ stdin: { resolveDir: process.cwd(), contents: "export {openRad085Database,fixtureId} from './src/features/assess/rad085-local-db';" }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external' });
writeFileSync(helperDir + '/helper.mjs', helper.outputFiles[0].text);
const { openRad085Database, fixtureId: id } = await import(pathToFileURL(helperDir + '/helper.mjs').href);
rmSync(helperDir, { recursive: true });
const db = await openRad085Database();
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const mocks = {
 session: `export const useSessionAccount=()=>window.__account;export const useOptionalSessionAccount=useSessionAccount;`,
 client: `const send=(schema,name,args,signal)=>fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema,name,args}),signal}).then(r=>r.json());
 export const getPilotClient=async()=>({rpc:(name,args)=>send('public',name,args),schema:schema=>({rpc:(name,args)=>({abortSignal:signal=>send(schema,name,args,signal)})})});`,
 navigation: `import React from 'react';export const Link=({href,locale,children,...props})=><a {...props} href={href}>{children}</a>;export const usePathname=()=>'/owner';export const useRouter=()=>({replace:()=>{}});`,
 nextnav: `export const useSearchParams=()=>new URLSearchParams();export const useRouter=()=>({replace:()=>{}});export const usePathname=()=>'/owner';export const notFound=()=>{throw Error('not found')};`,
 server: `import {createTranslator} from 'next-intl';export const setRequestLocale=()=>{};export const getTranslations=async arg=>createTranslator({locale:window.__locale,messages:window.__messages,namespace:typeof arg==='string'?arg:arg.namespace});`,
};
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
 import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
 import Owner from './src/app/[locale]/owner/page';import {AppShell} from './src/components/shell/AppShell';import {CONSENT_VERSION} from './src/features/pilot/consent';
 window.mount=async(locale,messages)=>{window.__locale=locale;window.__messages=messages;
 window.__account={state:{kind:'signedIn',userId:'${id(1)}',email:'synthetic1@example.test',displayName:'Synthetic owner',consentVersion:CONSENT_VERSION,profile:{role:'owner',status:'approved',code:'SYN-1'}},signOut:async()=>{}};
 const content=await Owner({params:Promise.resolve({locale})});createRoot(document.getElementById('root')).render(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC"><AppShell>{content}</AppShell></NextIntlClientProvider>);};
 ` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': '"https://synthetic.supabase.co"', 'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': '"sb_publishable_synthetic_local_test_123456"' }, plugins: [{ name: 'local-auth-io', setup(b) {
 b.onResolve({ filter: /(SessionGate|\/client|^\.\/client$|i18n\/navigation|next\/navigation|next-intl\/server)$/ }, args => {
  if (args.path === 'react-dom/client') return;
  const key = /SessionGate$/.test(args.path) ? 'session' : /client$/.test(args.path) ? 'client' : /i18n\/navigation$/.test(args.path) ? 'navigation' : args.path === 'next/navigation' ? 'nextnav' : 'server';
  return { path: key, namespace: 'mock' };
 }); b.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: process.cwd() }));
 } }] });
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Owner synthetic acceptance</title><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`;
const publicCalls = new Set(['owner_account_directory_v1', 'owner_account_deletion_v1', 'owner_surveys_v1']);
const assessCalls = new Set(['scope_page_v1', 'appointment_v1']);
const calls = []; let refuse = null;
const server = createServer(async (req, res) => {
 try {
  if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html); return; }
  assert.equal(req.url, '/rpc'); let body = ''; for await (const chunk of req) { body += chunk; assert.ok(body.length < 8192); }
  const { schema, name, args } = JSON.parse(body); assert.ok((schema === 'public' ? publicCalls : assessCalls).has(name)); calls.push({ schema, name, args });
  if (name === 'appointment_v1' && args.p_appoint && refuse) { const code = refuse; refuse = null; res.end(JSON.stringify({ data: null, error: { code } })); return; }
  const keys = Object.keys(args); assert.ok(keys.every(k => /^p_[a-z_]+$/.test(k)));
  const data = await db.transaction(1, async c => (await c.query(`select ${schema}.${name}(${keys.map((k, i) => `${k}=>$${i + 1}`).join(',')}) v`, Object.values(args))).rows[0].v);
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ data, error: null }));
 } catch (error) { res.end(JSON.stringify({ data: null, error: { code: error.code ?? 'local_error' } })); }
});
let browser; const output = '/tmp/p1-owner-picker-audit'; mkdirSync(output, { recursive: true });
const results = [], errors = [], outbound = [];
try {
 for (let n = 1; n <= 29; n++) await db.admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n), `synthetic${n}@example.test`, JSON.stringify({ display_name: n === 27 ? 'SyntheticLongName'.repeat(9) : `Synthetic ${n}`, consent_version: '2026-10-27' })]);
 await db.admin.query("update profiles set status=case when user_id=$1 then 'pending' else 'approved' end, role=case when user_id=$2 then 'owner' else 'participant' end", [id(29), id(1)]);
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
 browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
  console.log(`Owner picker ${locale}/${width}`); calls.length = 0;
  await db.admin.query('delete from assess.supervisor_appointments'); await db.rpc(1, 'appointment_v1', [id(2), true]); await db.rpc(1, 'appointment_v1', [id(26), true]);
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.route('**/*', route => { if (route.request().url().startsWith(base + '/')) return route.continue(); outbound.push(route.request().url()); return route.abort(); });
  const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const m = messages[locale], t = m.supervisor, d = m.owner.dashboard;
  await page.goto(base); await page.evaluate(({ locale, messages }) => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = 'dark'; return window.mount(locale, messages); }, { locale, messages: m });
  const picker = page.getByRole('region', { name: t.appointmentSearch, exact: true });
  await picker.getByText('synthetic2@example.test', { exact: true }).waitFor();
  await picker.getByText(t.appointmentAlready, { exact: true }).waitFor();
  assert.equal(await picker.getByText(t.appointmentOwner).count(), 1); assert.equal(await picker.locator('input[name=person]').count(), 0);
  async function audit(label) {
   await page.evaluate(axe); const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
   assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${locale}/${width}/${label}`);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflow'); results.push({ locale, width, label, axe: 0, overflow: false });
  }
  await audit('list');
  await picker.getByRole('button', { name: d.next, exact: true }).click(); await picker.getByText('synthetic26@example.test', { exact: true }).waitFor(); await picker.getByText(t.appointmentAlready).waitFor();
  await audit('page-two-long-name');
  async function search(value) { await picker.getByRole('searchbox', { name: d.search }).fill(value); await picker.getByRole('button', { name: d.searchAction, exact: true }).click(); }
  await search('synthetic28@example.test'); await picker.getByText('synthetic28@example.test', { exact: true }).waitFor(); assert.equal(await picker.getByText('synthetic26@example.test', { exact: true }).count(), 0);
  const appoint = picker.getByRole('button', { name: `${t.appoint}: Synthetic 28, synthetic28@example.test`, exact: true }); await appoint.waitFor({ state: 'visible' }); await appoint.click({ trial: true }); await appoint.focus(); await page.keyboard.press('Enter');
  const dialog = picker.getByRole('alertdialog', { name: t.appointmentConfirm }); await dialog.waitFor(); assert.ok((await dialog.textContent()).includes('synthetic28@example.test')); await audit('confirm');
  const before = calls.filter(c => c.name === 'appointment_v1').length;
  await dialog.getByRole('button', { name: t.cancelAction, exact: true }).click(); assert.equal(calls.filter(c => c.name === 'appointment_v1').length, before); assert.equal(await appoint.evaluate(b => b === document.activeElement), true);
  await page.keyboard.press('Enter'); await dialog.getByRole('button', { name: t.confirmAction, exact: true }).click(); await picker.getByText(t.appointmentAlready).waitFor();
  const appointmentList = page.getByRole('heading', { name: t.owner, exact: true }).locator('..').filter({ has: page.getByRole('button', { name: t.revoke, exact: true }) });
  const revoke = appointmentList.getByRole('listitem').filter({ hasText: id(28) }).getByRole('button', { name: t.revoke, exact: true });
  await revoke.click(); await page.getByRole('button', { name: t.confirmRevoke, exact: true }).click(); await picker.getByText('synthetic2@example.test', { exact: true }).waitFor(); await search('Synthetic 28'); await appoint.waitFor();
  for (const code of ['42501', '40001']) {
   refuse = code; await appoint.click(); await dialog.getByRole('button', { name: t.confirmAction, exact: true }).click(); await page.getByRole('alert').filter({ hasText: code === '42501' ? t.denied : t.conflict }).waitFor();
   await picker.getByText('synthetic2@example.test', { exact: true }).waitFor(); await audit('refusal-' + code);
   // The refresh remounts the bounded directory at its first page.
   await search('Synthetic 28');
  }
  await search('missing-synthetic'); await picker.getByText(d.empty, { exact: true }).waitFor(); await audit('empty');
  assert.ok(calls.filter(c => c.name === 'owner_account_directory_v1').every(c => c.args.p_limit === 20));
  assert.ok(calls.filter(c => c.name === 'scope_page_v1').every(c => c.args.p_limit === 1 || c.args.p_limit === 20));
  if (width === 390) { await search('Synthetic 28'); await appoint.click(); await page.screenshot({ path: `${output}/${locale}-390-confirm.jpg`, type: 'jpeg', quality: 78, fullPage: true }); }
  await context.close();
 }
 assert.deepEqual(errors, []); assert.deepEqual(outbound, []);
 writeFileSync(`${output}/results.json`, JSON.stringify({ results, errors, outbound }, null, 2)); console.log(`PASS ${results.length} owner browser/axe states; ${output}`);
} finally { await browser?.close(); server.closeAllConnections(); if (server.listening) await new Promise(resolve => server.close(resolve)); await db.close(); }
