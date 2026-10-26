// Synthetic loopback acceptance only. No app route, live database, publisher or assignment RPC.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const serverBundle = await build({ stdin: { resolveDir: process.cwd(), contents: `export {openRad085Database,fixtureId} from './src/features/assess/rad085-local-db'; export {localPartCatalog,localPracticalCatalog} from './src/features/authoring-review/catalog'; export {copy,sqlCopy} from './src/features/authoring-review/copy';` }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external' });
const helperDir = mkdtempSync('/tmp/rad085-p2-helper-');
writeFileSync(helperDir + '/helper.mjs', serverBundle.outputFiles[0].text);
const { openRad085Database, fixtureId: id, localPartCatalog, localPracticalCatalog, copy, sqlCopy } = await import(pathToFileURL(helperDir + '/helper.mjs').href);
rmSync(helperDir, { recursive: true });
const parts = localPartCatalog(), practicals = localPracticalCatalog();
const references = [...parts.map(p => ({ key: p.id, revision: p.caseRef.version })), ...practicals.map(p => ({ key: p.caseRef.id, revision: p.caseRef.version }))];
const catalog = JSON.stringify({ parts, practicals, references }).replaceAll('<', '\\u003c');
const css = (await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g, (_, p) => `url("data:font/woff2;base64,${readFileSync('public' + p).toString('base64')}")`);
const browserBundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
 import React,{useMemo,useRef,useState} from 'react'; import {createRoot} from 'react-dom/client';
 import {AuthoringSession,GroupPicker} from './src/features/authoring-review/Session';
 import {createSqlAuthoring} from './src/features/authoring-review/sql-adapter'; import {copy,sqlCopy} from './src/features/authoring-review/copy';
 const catalog=${catalog}; const locale=new URL(location.href).searchParams.get('locale')==='ar'?'ar':'en';
 document.documentElement.lang=locale; document.documentElement.dir=locale==='ar'?'rtl':'ltr';
 const accounts=[{n:2,id:'${id(2)}',role:'supervisor',name:'Synthetic supervisor A'},{n:3,id:'${id(3)}',role:'supervisor',name:'Synthetic supervisor B'},{n:4,id:'${id(4)}',role:'student',name:'Synthetic student'}];
 function App(){const [n,setN]=useState(2),[groupId,setGroup]=useState(),[epoch,setEpoch]=useState(0),mode=useRef('normal'); const self=accounts.find(a=>a.n===n),t=useMemo(()=>({...copy[locale],...sqlCopy[locale]}),[]);
 const adapter=useMemo(()=>{let observed=0,ready=Promise.resolve(); return createSqlAuthoring(self,{
  async rpc(name,args,signal){await ready; signal.throwIfAborted(); const fault=mode.current; if(name==='draft_save_v1')mode.current='normal'; const response=await fetch('/rpc/'+n,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args,fault}),signal});const value=await response.json(); observed=Math.max(observed,value.epoch);if(!response.ok)throw value;return value.data;},
  subscribe(invalidate){let opened=false,resolveReady;ready=new Promise(r=>resolveReady=r);const events=new EventSource('/events');events.onmessage=e=>{const next=Number(e.data);if(!opened){opened=true;observed=Math.max(observed,next);resolveReady();return;}if(next>observed){observed=next;invalidate();}};events.onerror=()=>{invalidate();resolveReady();};return ()=>{events.close();resolveReady();};}
 },catalog);},[n]);
 async function control(action){await fetch('/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});}
 return <main className="platform-page mx-auto max-w-5xl space-y-5 px-4 py-8"><h1 className="text-3xl font-bold">{t.title}</h1><p>{t.notice}</p><label className="block">{t.account}<select className="min-h-11 w-full rounded border bg-panel p-2" value={n} onChange={e=>{setN(Number(e.target.value));setGroup(undefined);}}>{accounts.map(a=><option key={a.n} value={a.n}>{a.name}</option>)}</select></label>
 <label className="block">{t.scenario}<select className="min-h-11 w-full rounded border bg-panel p-2" onChange={e=>mode.current=e.target.value}><option value="normal">{t.normal}</option><option value="lost">ACK lost after commit</option><option value="before">Transport fails before send</option><option value="late">Delayed read</option></select></label>
 <div className="flex flex-wrap gap-2"><button className="min-h-11 rounded border p-2" onClick={()=>setEpoch(v=>v+1)}>{t.refresh}</button><button className="min-h-11 rounded border p-2" onClick={()=>control('revoke')}>{t.revoke}</button><button className="min-h-11 rounded border p-2" onClick={()=>control('end')}>{t.expire}</button></div>
 <GroupPicker key={n+':'+epoch} adapter={adapter} actorId={self.id} select={setGroup} t={t}/>{groupId&&<AuthoringSession key={n+':'+groupId+':'+epoch} adapter={adapter} scope={{actorId:self.id,groupId}} locale={locale}/>}</main>;
 }createRoot(document.getElementById('root')).render(<App/>);` }, bundle: true, write: false, format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, metafile: true });
const forbidden = Object.keys(browserBundle.metafile.inputs).filter(p => /supabase|data\/(exams|cases)|server-|rad085-local-db/.test(p));
assert.deepEqual(forbidden, [], 'no private registry, grader or live adapter in browser');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local P2 SQL acceptance</title><style>${css}</style></head><body><div id="root"></div><script>${browserBundle.outputFiles[0].text}</script></body></html>`;
let db, initialGroup, port, delayedRead;
const subscribers = new Set(); let epoch = 0, writes = 0;
const invalidate = () => { epoch++; for (const response of subscribers) response.write(`data: ${epoch}\n\n`); };
async function reset(configured = !process.argv.includes('--unconfigured')) {
 if (db) await db.close(); db = await openRad085Database(); writes = 0;
 for (let n = 1; n <= 4; n++) await db.admin.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"Synthetic P2\",\"consent_version\":\"2026-10-16\"}')", [id(n), `p2synthetic${n}@example.test`]);
 await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
 for (const n of [2, 3]) await db.rpc(1, 'appointment_v1', [id(n), true]);
 // Engineering-only pinned registry inside this test database. Never populated through HTTP.
 if (configured) {
  for (const p of parts) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)', [p.id, 'simulator-part', p.caseRef.version, p.caseRef.id, p.caseRef.version, 'synthetic-part-test']);
  for (const p of practicals) await db.admin.query('insert into assess.authoring_references values($1,$2,$3,$4,$5,$6,true)', [p.caseRef.id, 'full-practical', p.caseRef.version, p.caseRef.id, p.caseRef.version, p.evaluatorVersion]);
 }
 initialGroup = await db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'Synthetic SQL group', new Date(Date.now() + 3600000).toISOString()]);
 await db.rpc(3, 'supervisor_group_v1', ['create', null, null, 'Other supervisor scope', new Date(Date.now() + 3600000).toISOString()]);
 invalidate();
}
const rpcNames = new Set(['scope_page_v1', 'draft_save_v1', 'draft_page_v1']);
const server = createServer(async (req, res) => {
 try {
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== `http://127.0.0.1:${port}`)) { res.writeHead(403).end(); return; }
  const url = new URL(req.url, `http://127.0.0.1:${port}`); res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && url.pathname === '/events') {
   res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' }); res.write(`data: ${epoch}\n\n`); subscribers.add(res); req.on('close', () => subscribers.delete(res)); return;
  }
  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
   req.setEncoding('utf8'); // Preserve multibyte author text across HTTP chunk boundaries.
   let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 270000) { res.writeHead(413).end(); return; } }
   const input = JSON.parse(body);
   if (url.pathname === '/control') {
    if (input.action === 'revoke') await db.rpc(1, 'appointment_v1', [id(2), false]);
    else if (input.action === 'end') { const row = (await db.rpc(2, 'scope_page_v1', ['groups'])).rows.find(g => g.id === initialGroup.id); await db.rpc(2, 'supervisor_group_v1', ['end', row.id, row.revision]); }
    else { res.writeHead(403).end(); return; }
    invalidate(); res.writeHead(200).end('{}'); return;
   }
   if (/^\/rpc\/[234]$/.test(url.pathname)) {
    const { name, args, fault } = input, who = Number(url.pathname.at(-1));
    if (!rpcNames.has(name) || !Array.isArray(args) || args.length > 5 || name === 'scope_page_v1' && args[0] !== 'groups') { res.writeHead(403).end(); return; }
    const readEpoch = epoch;
    try {
     if (name === 'draft_save_v1' && fault === 'before') throw Error('synthetic transport unavailable before send');
     if (name === 'draft_save_v1') writes++;
     const value = await db.rpc(who, name, args);
     if (name === 'draft_save_v1' && fault === 'lost') throw Error('synthetic ACK lost after commit');
     if (name === 'draft_page_v1' && fault === 'late') { delayedRead?.(); await new Promise(r => setTimeout(r, 700)); }
     res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ data: value, epoch: readEpoch }));
    } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ code: typeof e.code === 'string' ? e.code : '', epoch })); }
    return;
   }
  }
  if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'" }).end(html); return; }
  res.writeHead(404).end();
 } catch { if (!res.headersSent) res.writeHead(400); res.end(); }
});
await reset(); await new Promise(r => server.listen(0, '127.0.0.1', r)); port = server.address().port;
const base = `http://127.0.0.1:${port}`;
async function close() { for (const res of subscribers) res.end(); server.closeAllConnections(); await new Promise(r => server.close(r)); await db?.close(); }
if (process.argv.includes('--transport-only')) {
 try {
  const notes = 'ح'.repeat(2000);
  const document = { schemaVersion: 1, id: id(900), revision: 0, track: 'mixed', name: 'Synthetic Unicode transport', policy: { durationSeconds: 1800, maxAttempts: 1, gradeVisibility: 'hidden' }, items: Array.from({ length: 10 }, (_, n) => ({ id: 'synthetic-' + n, type: 'single-choice', prompt: 'X'.repeat(3000), maximum: '1', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correctOptionId: '', authoring: { author: '', reference: '', licenceNotes: '', notes } })) };
  const body = Buffer.from(JSON.stringify({ name: 'draft_save_v1', args: [initialGroup.id, document.id, 0, JSON.stringify(document), '[]'] }));
  assert.ok(body.length > 65536 && body.length < 131072);
  const boundary = body.indexOf(Buffer.from('ح')) + 1;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(body.subarray(0, boundary)); setTimeout(() => { controller.enqueue(body.subarray(boundary)); controller.close(); }, 20); } });
  const saved = await fetch(base + '/rpc/2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: stream, duplex: 'half' });
  assert.equal(saved.status, 200); assert.equal((await saved.json()).data.document.items[0].authoring.notes, notes);
  const opened = await fetch(base + '/rpc/2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'draft_page_v1', args: [initialGroup.id, document.id] }) });
  assert.equal(opened.status, 200); const stored = (await opened.json()).data.document;
  assert.deepEqual(stored, { ...document, revision: 1 });
  console.log(JSON.stringify({ transport: 'real HTTP to isolated PostgreSQL', bytes: body.length, splitInsideUtf8: true, exactRoundTrip: true }));
 } finally { await close(); }
} else if (process.argv.includes('--serve')) {
 console.log(`Local synthetic SQL P2: ${base}/?locale=ar (or locale=en). Reload preserves drafts until Ctrl-C; stopping destroys this isolated database. P1 review uses its separate existing --serve harness.`);
 for (const event of ['SIGINT', 'SIGTERM']) process.once(event, async () => { await close(); process.exit(0); });
} else {
 const { chromium } = require('playwright'), axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 const output = '/tmp/rad085-p2-sql'; mkdirSync(output, { recursive: true }); mkdirSync('docs/review', { recursive: true });
 let audits = 0, interactions = 0; const errors = [], outbound = [], captures = [];
 try {
  for (const locale of ['en', 'ar']) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
   await reset(); console.log(`Matrix ${locale}/${width}/${theme}`);
   const context = await browser.newContext({ viewport: { width, height: 900 } });
   await context.route('**/*', route => { const u = route.request().url(); if (u.startsWith(base + '/')) return route.continue(); outbound.push(u); return route.abort(); });
   const t = { ...copy[locale], ...sqlCopy[locale] };
   const button = (p, name) => p.getByRole('button', { name, exact: true });
   async function openPage() { const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(`${base}/?locale=${locale}`); await p.evaluate(theme => document.documentElement.dataset.theme = theme, theme); await button(p, 'Synthetic SQL group').click(); await p.getByRole('heading', { name: t.draftList, exact: true }).waitFor(); return p; }
   async function audit(p, label) {
    await p.evaluate(axe); const r = await p.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    assert.deepEqual(r.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${locale}/${width}/${theme}/${label}`);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflow'); audits++;
   }
   const page = await openPage(); await audit(page, 'list');
   for (const track of ['mixed', 'full-practical']) {
    const title = 'Synthetic ' + track;
    await button(page, track === 'mixed' ? t.create : t.createPractical).click();
    await button(page, track === 'mixed' ? t.addMCQ : t.addPractical).click();
    if (track === 'mixed') await button(page, t.addPart).click();
    await button(page, t.save).click(); await page.getByText(t.saved, { exact: false }).waitFor(); // permitted incomplete draft
    await page.getByLabel(t.name, { exact: true }).fill(title);
    await button(page, t.save).click(); await page.getByText(t.saved, { exact: false }).waitFor(); interactions += 3;
    assert.equal(await button(page, t.prepare).count(), 0);
    // Engineering text only: no medical facts, licence or independent review asserted.
    for (const field of [t.prompt, t.author, t.reference, t.licenceNotes, t.notes]) {
     const nodes = page.getByLabel(field); for (let n = 0; n < await nodes.count(); n++) await nodes.nth(n).fill('Synthetic engineering only; unverified, no approval or licence claim.');
    }
    if (track === 'mixed') await page.getByLabel(t.correct).selectOption({ index: 1 });
    await button(page, t.save).click(); await page.getByText(t.saved, { exact: false }).waitFor();
    await audit(page, track + '-editor');
    await button(page, t.preview).click(); await page.getByRole('heading', { name: t.previewTitle, exact: true }).waitFor();
    const preview = page.getByRole('heading', { name: t.previewTitle, exact: true }).locator('..');
    assert.equal(await preview.getByText(t.correct, { exact: true }).count(), 0); assert.equal(await preview.getByText(t.notes, { exact: true }).count(), 0);
    await audit(page, track + '-preview'); await button(page, t.closePreview).click(); interactions += 3;
    const tab2 = await openPage(); await tab2.getByRole('button', { name: new RegExp('^' + title) }).click();
    await page.getByLabel(t.name, { exact: true }).fill(title + ' winner');
    await button(page, t.save).click(); await page.getByText(t.saved, { exact: false }).waitFor();
    await tab2.getByLabel(t.name, { exact: true }).fill(title + ' losing local'); await button(tab2, t.save).click();
    await tab2.getByText(t.conflict, { exact: true }).waitFor(); const before = writes;
    await button(tab2, t.verify).click(); await tab2.getByLabel(t.localCopy, { exact: true }).waitFor();
    assert.ok((await tab2.getByLabel(t.localCopy, { exact: true }).inputValue()).includes('losing local'));
    assert.ok((await tab2.getByLabel(t.serverCopy, { exact: true }).inputValue()).includes('winner')); assert.equal(writes, before);
    await audit(tab2, track + '-conflict');
    await button(tab2, t.editVerified).click(); await button(tab2, t.dismissRecovery).click(); assert.equal(await tab2.getByLabel(t.name, { exact: true }).inputValue(), title + ' winner');
    await tab2.close(); interactions += 4;
    // Actual lost ACK after COMMIT; only explicit verification reads, no duplicate mutation.
    await page.getByLabel(t.scenario).selectOption('lost'); await page.getByLabel(t.name, { exact: true }).fill(title + ' ACK');
    await button(page, t.save).click(); await page.getByText(t.error, { exact: true }).waitFor(); const ackWrites = writes;
    await button(page, t.verify).click(); await page.getByLabel(t.serverCopy, { exact: true }).waitFor();
    assert.ok((await page.getByLabel(t.serverCopy, { exact: true }).inputValue()).includes(title + ' ACK')); assert.equal(writes, ackWrites);
    await button(page, t.editVerified).click(); await button(page, t.dismissRecovery).click(); interactions += 4;
    // Transport failure before dispatch, then restore and compare; the retained edit remains private.
    await page.getByLabel(t.scenario).selectOption('before'); await page.getByLabel(t.name, { exact: true }).fill(title + ' unsent');
    await button(page, t.save).click(); await page.getByText(t.error, { exact: true }).waitFor(); const unsentWrites = writes;
    await button(page, t.verify).click(); await page.getByLabel(t.localCopy, { exact: true }).waitFor(); assert.equal(writes, unsentWrites);
    assert.ok((await page.getByLabel(t.localCopy, { exact: true }).inputValue()).includes('unsent')); await button(page, t.editVerified).click(); await button(page, t.dismissRecovery).click(); interactions += 4;
    if (width === 390 && theme === 'dark' && track === 'full-practical') { const path = `docs/review/rad085-p2-sql-${locale}.jpg`; await page.screenshot({ path, type: 'jpeg', quality: 78, fullPage: true }); captures.push(path); }
    await button(page, t.draftList).click();
    await page.reload(); await button(page, 'Synthetic SQL group').click(); await page.getByRole('button', { name: new RegExp('^' + title + ' ACK') }).waitFor(); interactions++;
   }
   // Hold a real SQL result; revoke via another local tab while the HTTP reply is delayed.
   await page.getByLabel(t.scenario).selectOption('late');
   const held = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('delayed read not reached')), 5000); delayedRead = () => { clearTimeout(timer); resolve(); }; });
   await page.getByRole('button', { name: /^Synthetic full-practical ACK/ }).click(); await held;
   const controller = await context.newPage(); await controller.goto(base); await button(controller, copy.en.revoke).click();
   await page.getByText(t.denied, { exact: true }).first().waitFor(); await new Promise(r => setTimeout(r, 800));
   assert.equal(await page.locator('input,textarea,svg').count(), 0); await audit(page, 'revoked'); interactions++;
   await controller.close(); await context.close();
  }
  // Server expiry without a user click; retained copy and preview are removed too.
  await reset();
  const context = await browser.newContext(), page = await context.newPage(); await page.goto(base);
  await page.getByRole('button', { name: 'Synthetic SQL group', exact: true }).waitFor();
  await db.rpc(2, 'supervisor_group_v1', ['create', null, null, 'Expiring synthetic group', new Date(Date.now()+2000).toISOString()]);
  await page.getByRole('button', { name: copy.en.refresh, exact: true }).click(); await page.getByRole('button', { name: 'Expiring synthetic group', exact: true }).click();
  await page.getByRole('heading', { name: 'Expiring synthetic group', exact: true }).waitFor();
  await page.getByText(copy.en.expired, { exact: true }).waitFor();
  assert.equal(await page.locator('input,textarea,svg').count(), 0); interactions++;
  await context.close();
  // Other supervisor and student stay outside the writer/group scope in the browser.
  await reset();
  const isolated = await browser.newContext(), other = await isolated.newPage(); await other.goto(base);
  await other.getByLabel(copy.en.account).selectOption('3'); await other.getByRole('button', { name: 'Other supervisor scope', exact: true }).waitFor();
  assert.equal(await other.getByRole('button', { name: 'Synthetic SQL group', exact: true }).count(), 0);
  await other.getByLabel(copy.en.account).selectOption('4'); await other.getByText(copy.en.denied, { exact: true }).waitFor();
  assert.equal(await other.locator('input,textarea,svg').count(), 0); await isolated.close(); interactions += 2;
  // Empty runtime reference registry fails closed; the browser cannot fill it.
  await reset(false);
  const unconfigured = await browser.newContext(), closed = await unconfigured.newPage(); await closed.goto(base);
  await closed.getByRole('button', { name: 'Synthetic SQL group', exact: true }).click(); await closed.getByRole('button', { name: sqlCopy.en.createPractical, exact: true }).click();
  await closed.getByRole('button', { name: copy.en.addPractical, exact: true }).click(); await closed.getByRole('button', { name: sqlCopy.en.save, exact: true }).click();
  await closed.getByText(copy.en.expired, { exact: true }).waitFor(); assert.equal((await db.admin.query('select count(*)::int n from assess.authoring_references')).rows[0].n, 0);
  assert.equal((await db.admin.query('select count(*)::int n from assess.authoring_drafts')).rows[0].n, 0); await unconfigured.close(); interactions++;
  assert.deepEqual(errors, []); assert.deepEqual(outbound, []);
  const summary = { matrix: 'EN/AR × 390/1440 × light/dark; both tracks; real PostgreSQL', audits, interactions, errors, outbound, captures, forbidden, browserBytes: browserBundle.outputFiles[0].contents.length };
  writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2)); console.log(JSON.stringify(summary));
 } finally { await browser.close(); await close(); }
}
