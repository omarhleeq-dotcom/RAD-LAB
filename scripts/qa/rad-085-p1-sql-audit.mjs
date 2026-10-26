// Local-only P1 SQL acceptance. No provider client, credentials, live DB, or hosted assets.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const serverBundle = await build({ stdin: { resolveDir: process.cwd(), contents: `export {sharingPolicy} from './src/features/supervisor-review/sharing-policy'; export {openRad085Database,fixtureId} from './src/features/assess/rad085-local-db';` }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external' });
const helperDir = mkdtempSync('/tmp/rad085-p1-helper-');
writeFileSync(helperDir + '/helper.mjs', serverBundle.outputFiles[0].text);
const { openRad085Database, fixtureId: id, sharingPolicy } = await import(pathToFileURL(helperDir + '/helper.mjs').href);
rmSync(helperDir, { recursive: true });
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const accounts = [{ n: 1, role: 'owner', name: 'Synthetic owner' }, { n: 2, role: 'supervisor', name: 'Synthetic supervisor A' }, { n: 3, role: 'supervisor', name: 'Synthetic supervisor B' }, { n: 4, role: 'student', name: 'Synthetic student' }].map(a => ({ ...a, id: id(a.n) }));
const browserBundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
 import React,{useMemo,useState} from 'react'; import {createRoot} from 'react-dom/client';
 import {ReviewSession} from './src/features/supervisor-review/ReviewSession';
 import {createSqlReview} from './src/features/supervisor-review/sql-adapter'; import {copy} from './src/features/supervisor-review/copy';
 const accounts=${JSON.stringify(accounts)}; const locale=new URL(location.href).searchParams.get('locale')==='ar'?'ar':'en';
 document.documentElement.lang=locale; document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 function App(){ const [n,setN]=useState(2),[groupId,setGroup]=useState(); const self=accounts.find(a=>a.n===n),t=copy[locale];
 const adapter=useMemo(()=>{let observed=0,ready=Promise.resolve(); const mark=()=>{document.documentElement.dataset.scopeEpoch=String(observed)}; return createSqlReview(self,{
  async rpc(name,args,signal){ await ready; signal.throwIfAborted(); const response=await fetch('/rpc/'+n,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args}),signal}); const value=await response.json(); observed=Math.max(observed,value.epoch); mark(); if(!response.ok)throw value; return value.data; },
  subscribe(invalidate){let opened=false,resolveReady; ready=new Promise(resolve=>resolveReady=resolve); const events=new EventSource('/events'); events.onmessage=e=>{const epoch=Number(e.data); if(!opened){opened=true;observed=Math.max(observed,epoch);mark();resolveReady();return;} if(epoch>observed){observed=epoch; mark(); invalidate();}}; events.onerror=()=>{invalidate();resolveReady();}; return ()=>{events.close();resolveReady();};}
 });},[n]);
 return <main className="platform-page mx-auto max-w-5xl space-y-4 px-4 py-8"><h1 className="text-3xl font-bold">{t.title}</h1><p>{locale==='ar'?'PostgreSQL محلي معزول وبيانات اصطناعية. القبول في الإعداد التجريبي فقط؛ لا موافقة فعلية أو اتصال حي.':'Isolated local PostgreSQL and synthetic data. Test setup consent only; no real acceptance or live connection.'}</p><label className="block">{t.account}<select className="min-h-11 w-full border rounded p-2" value={n} onChange={e=>{setN(Number(e.target.value));setGroup(undefined)}}>{accounts.map(a=><option key={a.n} value={a.n}>{a.name}</option>)}</select></label><ReviewSession key={n} adapter={adapter} actorId={self.id} groupId={groupId} selectGroup={setGroup} locale={locale}/></main>;
 } createRoot(document.getElementById('root')).render(<App/>);` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true });
assert.ok(!Object.keys(browserBundle.metafile.inputs).some(p => /supabase|features\/(pilot|assess)|rad085-local-db/.test(p)), 'browser contains no private DB or live adapter');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local P1 SQL acceptance</title><style>${css}</style></head><body><div id="root"></div><script>${browserBundle.outputFiles[0].text}</script></body></html>`;
let db, initialGroup, slow = false, heldPractice;
const subscribers = new Set(); let epoch = 0;
const invalidate = () => { epoch++; for (const response of subscribers) response.write(`data: ${epoch}\n\n`); };
async function reset(configured = true) {
 if (db) await db.close(); db = await openRad085Database(); slow = false;
 for (let n = 1; n <= 28; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic P1\",\"consent_version\":\"2026-10-16\"}')", [id(n), `p1synthetic${n}@example.test`]);
 await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
 for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
 if (configured) {
  await db.admin.query("update assess.sharing_policy set required_version=$1,text_digest=$2", [sharingPolicy.version, sharingPolicy.digest]);
  for (let n = 4; n <= 28; n++) await db.rpc(n, 'sharing_consent_v1', [sharingPolicy.version, sharingPolicy.digest, true]);
 }
 initialGroup = await db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'Synthetic SQL group', new Date(Date.now() + 3600000).toISOString()]);
 if (configured) for (let n = 4; n <= 28; n++) {
  const r = await db.rpc(n, 'join_request_v1', [initialGroup.code]); await db.rpc(2, 'join_decide_v1', [r.id, r.revision, 'approve']);
  await db.transaction(n, c => c.query(`insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{"total":37}','en')`, [id(100 + n), id(n)]));
 }
 await db.rpc(3, 'supervisor_group_v1', ['create', null, null, 'Other supervisor scope', new Date(Date.now() + 3600000).toISOString()]);
 invalidate();
}
const rpcNames = new Set(['scope_page_v1', 'sharing_consent_v1', 'appointment_v1', 'supervisor_group_v1', 'join_request_v1', 'join_decide_v1', 'group_leave_v1']);
let port;
const server = createServer(async (req, res) => {
 try {
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== `http://127.0.0.1:${port}`)) { res.writeHead(403).end(); return; }
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && url.pathname === '/events') {
   res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' }); res.write(`data: ${epoch}\n\n`); subscribers.add(res); req.on('close', () => subscribers.delete(res)); return;
  }
  if (req.method === 'POST' && /^\/rpc\/[1-4]$/.test(url.pathname) && req.headers['content-type'] === 'application/json') {
   let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 8192) { res.writeHead(413).end(); return; } }
   const { name, args } = JSON.parse(body), who = Number(url.pathname.at(-1));
   if (!rpcNames.has(name) || !Array.isArray(args) || args.length > 5 || (name === 'sharing_consent_v1' && args.length !== 0 && (args.length !== 3 || typeof args[2] !== 'boolean'))) { res.writeHead(403).end(); return; }
   const write = name !== 'scope_page_v1' && (name !== 'sharing_consent_v1' || args.length === 3);
   if (write) invalidate();
   const readEpoch = epoch;
   try {
    const value = await db.rpc(who, name, args);
    if (slow && name === 'scope_page_v1' && args[0] === 'practice') { heldPractice?.(); await new Promise(resolve => setTimeout(resolve, 700)); }
    if (write) invalidate();
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ data: value, epoch: write ? epoch : readEpoch }));
   } catch (error) { if (write) invalidate(); res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ code: typeof error.code === 'string' ? error.code : '', epoch })); }
   return;
  }
  if (req.method === 'GET' && url.pathname === '/') {
   res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'" }).end(html); return;
  }
  res.writeHead(404).end();
 } catch { if (!res.headersSent) res.writeHead(400); res.end(); }
});
await reset(!process.argv.includes('--unconfigured'));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); port = server.address().port;
const base = `http://127.0.0.1:${port}`;
async function close() { for (const res of subscribers) res.end(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await db?.close(); }
if (process.argv.includes('--serve')) {
 console.log(`Local synthetic SQL P1: ${base}/?locale=ar (or locale=en). No live services. Ctrl-C stops and destroys the database.`);
 for (const event of ['SIGINT', 'SIGTERM']) process.once(event, async () => { await close(); process.exit(0); });
} else {
 const { chromium } = require('playwright'), axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
 const { copy } = await import('../../src/features/supervisor-review/copy.ts');
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 const output = '/tmp/rad085-p1-sql'; mkdirSync(output, { recursive: true }); mkdirSync('docs/review', { recursive: true });
 let audits = 0, interactions = 0; const errors = [], outbound = [], captures = [];
 try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
   await reset(); console.log(`Matrix ${locale}/${width}/${theme}`);
   const context = await browser.newContext({ viewport: { width, height: 900 } });
   await context.route('**/*', route => { const url = route.request().url(); if (url.startsWith(base + '/')) return route.continue(); outbound.push(url); return route.abort(); });
   const page = await context.newPage(), t = copy[locale]; page.on('pageerror', e => errors.push(e.message));
   await page.goto(`${base}/?locale=${locale}`); await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
   const choose = async (p, n) => { await p.getByLabel(t.account).selectOption(String(n)); };
   const refresh = async p => { await p.waitForFunction(expected => Number(document.documentElement.dataset.scopeEpoch ?? -1) >= expected, epoch); await p.getByRole('button', { name: t.retry, exact: true }).click(); };
   const selectGroup = p => p.getByRole('button', { name: 'Synthetic SQL group', exact: true }).click();
   async function audit(p, label) {
    await p.evaluate(axe); const r = await p.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    assert.deepEqual(r.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${locale}/${width}/${theme}/${label}`);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflow'); audits++;
   }
   await selectGroup(page); await page.getByRole('heading', { name: t.results, exact: true }).waitFor();
   const resultPanel = () => page.getByRole('heading', { name: t.results, exact: true }).locator('..');
   await resultPanel().getByText(`${t.total}: 25`, { exact: true }).waitFor(); await audit(page, 'supervisor');
   await resultPanel().getByRole('button', { name: t.next, exact: true }).click(); await resultPanel().getByText(id(28), { exact: false }).waitFor(); interactions++;
   await page.getByRole('button', { name: t.rotate, exact: true }).click();
   const codePanel = page.getByRole('heading', { name: t.code, exact: true }).locator('..'); await codePanel.waitFor();
   const code = await codePanel.locator('p[dir=ltr]').textContent(); assert.match(code, /^[a-f0-9]{64}$/); interactions++;
   if (width === 390 && theme === 'dark') { const path = `${output}/rad085-p1-sql-${locale}.jpg`; await page.screenshot({ path, type: 'jpeg', quality: 78, fullPage: true }); captures.push(path); }
   const student = await context.newPage(); student.on('pageerror', e => errors.push(e.message)); await student.goto(`${base}/?locale=${locale}`); await student.evaluate(theme => document.documentElement.dataset.theme = theme, theme); await choose(student, 4);
   const withdraw = locale === 'ar' ? 'سحب موافقتي' : 'Withdraw my consent';
   const accept = locale === 'ar' ? 'تأكيد موافقتي' : 'Confirm my consent';
   await student.getByText(sharingPolicy[locale], { exact: true }).waitFor();
   await student.getByRole('button', { name: withdraw, exact: true }).click();
   const checkbox = student.getByRole('checkbox'); await checkbox.waitFor(); assert.equal(await checkbox.isChecked(), false);
   if (width === 390 && theme === 'dark') { const path = `docs/review/rad085-sharing-${locale}.jpg`; await student.screenshot({ path, type: 'jpeg', quality: 78, fullPage: true }); captures.push(path); }
   await student.getByRole('button', { name: accept, exact: true }).click();
   assert.equal(await student.getByRole('button', { name: withdraw, exact: true }).count(), 0);
   assert.equal(await student.getByRole('button', { name: t.join, exact: true }).count(), 0);
   await audit(student, 'sharing-unchecked');
   await checkbox.check(); await student.getByRole('button', { name: accept, exact: true }).click();
   await student.getByRole('button', { name: withdraw, exact: true }).waitFor(); await audit(student, 'sharing-active'); interactions += 3;
   await student.getByRole('button', { name: t.leave, exact: true }).click(); await Promise.all([student.waitForResponse(r => r.url().endsWith('/rpc/4') && r.request().postDataJSON().name === 'group_leave_v1' && r.ok()), student.getByRole('button', { name: t.confirmLeave, exact: true }).click()]);
   await page.getByText(t.denied, { exact: true }).waitFor(); assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0); interactions++;
   await refresh(page); await resultPanel().getByText(`${t.total}: 24`, { exact: true }).waitFor();
   for (const decision of ['cancel', 'reject', 'approve']) {
    await student.getByLabel(t.enter).fill(code); await student.getByRole('button', { name: t.join, exact: true }).click();
    await student.getByRole('button', { name: t.cancel, exact: true }).waitFor();
    if (decision === 'cancel') await student.getByRole('button', { name: t.cancel, exact: true }).click();
    else {
     await refresh(page); const requests = page.getByRole('heading', { name: t.requests, exact: true }).locator('..'); await requests.waitFor();
     for (let n = 0; n < 2 && !await requests.getByRole('button', { name: t[decision], exact: true }).count(); n++) {
      await requests.getByRole('button', { name: t.next, exact: true }).click(); await requests.waitFor();
     }
     await Promise.all([page.waitForResponse(r => r.url().endsWith('/rpc/2') && r.request().postDataJSON().name === 'join_decide_v1' && r.ok()), requests.getByRole('button', { name: t[decision], exact: true }).click()]);
    }
    await refresh(student); await student.getByText(new RegExp(t[decision === 'cancel' ? 'cancelled' : decision === 'reject' ? 'rejected' : 'approved'])).first().waitFor(); interactions++;
   }
   await audit(student, 'student'); await choose(student, 1); await student.getByRole('heading', { name: t.owner, exact: true }).waitFor(); await audit(student, 'owner');
   // Hold a real Practice reply after SQL has read it; another tab revokes the appointment.
   slow = true; const held = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Practice reply not reached')), 5000); heldPractice = () => { clearTimeout(timer); resolve(); }; }); const practiceResponse = page.waitForResponse(r => r.url().endsWith('/rpc/2') && r.request().postDataJSON().args?.[0] === 'practice').catch(() => null);
   await refresh(page);
   await held;
   const ownerPanel = student.getByRole('heading', { name: t.owner, exact: true }).locator('..');
   await ownerPanel.getByRole('listitem').filter({ hasText: id(2) }).getByRole('button', { name: t.revoke, exact: true }).click(); await Promise.all([student.waitForResponse(r => r.url().endsWith('/rpc/1') && r.request().postDataJSON().name === 'appointment_v1' && r.ok()), student.getByRole('button', { name: t.confirmRevoke, exact: true }).click()]);
   await page.getByText(t.denied, { exact: true }).waitFor(); await new Promise(resolve => setTimeout(resolve, 800));
   assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0); interactions++;
   slow = false; await refresh(page); await page.getByText(t.denied, { exact: true }).waitFor();
   await student.getByLabel(t.personId).fill(id(2)); await student.getByRole('button', { name: t.appoint, exact: true }).first().click();
   await student.getByRole('heading', { name: t.owner, exact: true }).waitFor(); await refresh(page);
   await resultPanel().getByText(`${t.total}: 0`, { exact: true }).waitFor(); interactions++;
   await page.getByRole('button', { name: t.revokeCode, exact: true }).click(); await page.getByRole('button', { name: t.revokeCode, exact: true }).first().click();
   await page.getByRole('heading', { name: t.results, exact: true }).waitFor();
   await page.getByRole('button', { name: t.end, exact: true }).click(); await page.getByRole('button', { name: t.confirmEnd, exact: true }).click();
   await page.getByText(t.denied, { exact: true }).waitFor(); assert.equal(await page.getByRole('heading', { name: t.results, exact: true }).count(), 0); interactions++;
   await choose(page, 2); // A fresh session can create another group after the previous scope ended.
   await page.reload(); await page.getByLabel(t.name, { exact: true }).fill('Browser-created synthetic group');
   await page.getByLabel(t.ends, { exact: true }).fill(new Date(Date.now()+3600000).toISOString().slice(0,16));
   await page.getByRole('button', { name: t.create, exact: true }).click(); await page.getByRole('heading', { name: t.code, exact: true }).waitFor(); interactions++;

   await choose(page, 3); await page.getByRole('button', { name: 'Other supervisor scope', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Synthetic SQL group', exact: true }).count(), 0); await audit(page, 'isolation');
   await context.close(); await practiceResponse;
  }
  await reset(false);
  const context = await browser.newContext(), page = await context.newPage(); await page.goto(base); await page.getByLabel(copy.en.account).selectOption('4');
  await page.getByText(copy.en.sharingClosed, { exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: copy.en.join, exact: true }).count(), 0);
  await context.close();
  // Real group deadline clears the rendered view without a click.
  await reset();
  const expiryContext = await browser.newContext(), expiryPage = await expiryContext.newPage(); await expiryPage.goto(base);
  await expiryPage.getByLabel(copy.en.name, { exact: true }).waitFor();
  await db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'Synthetic expiring group', new Date(Date.now()+1500).toISOString()]);
  await expiryPage.getByRole('button', { name: copy.en.retry, exact: true }).click();
  await expiryPage.getByRole('button', { name: 'Synthetic expiring group', exact: true }).click();
  await expiryPage.getByRole('heading', { name: copy.en.results, exact: true }).waitFor();
  await expiryPage.getByText(copy.en.expired, { exact: true }).waitFor();
  assert.equal(await expiryPage.getByRole('heading', { name: copy.en.results, exact: true }).count(), 0); interactions++;
  await expiryContext.close();
  assert.deepEqual(errors, []); assert.deepEqual(outbound, []);
  const summary = { matrix: 'EN/AR × 390/1440 × light/dark; real isolated PostgreSQL', audits, interactions, errors, outbound, captures, browserBytes: browserBundle.outputFiles[0].contents.length };
  writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2)); console.log(JSON.stringify(summary));
 } finally { await browser.close(); await close(); }
}
