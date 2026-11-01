// Local, synthetic acceptance harness for the actual v2 form/session/adapter. No hosted app or provider calls.
// Run from the repository root: node src/features/assess/authoring-audit.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const directory = mkdtempSync(join(tmpdir(), 'rad062-authoring-audit-'));
let browser, server, checks = 0, audits = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks++; };
const xlsx = execFileSync('python', ['-c', `import io,zipfile
from xml.sax.saxutils import escape
b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('[Content_Types].xml','<Types><Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>')
 z.writestr('xl/workbook.xml','<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet r:id="r1"/></sheets></workbook>')
 z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
 rows=[['Question','A','B','Answer','Points','Reference'],['XLSX cached question?','True','False','A','1','XLSX source']]
 text='<worksheet><sheetData>'
 for r,row in enumerate(rows,1):
  text+='<row r="'+str(r)+'">'
  for c,value in enumerate(row):
   ref=chr(65+c)+str(r)
   text+=('<c r="'+ref+'"><f>1+0</f><v>1</v></c>') if r==2 and c==4 else ('<c r="'+ref+'" t="inlineStr"><is><t>'+escape(value)+'</t></is></c>')
  text+='</row>'
 z.writestr('xl/worksheets/sheet1.xml',text+'</sheetData></worksheet>')
print(__import__('base64').b64encode(b.getvalue()).decode())`], { encoding: 'utf8' }).trim();
try {
 const compiled = await build({ stdin: { contents: `
 import React from 'react'; import {createRoot} from 'react-dom/client'; import {NextIntlClientProvider} from 'next-intl';
 import en from './messages/en.json'; import ar from './messages/ar.json';
 import {AuthoringSession} from './src/features/authoring-review/Session'; import {copy,sqlCopy} from './src/features/authoring-review/copy'; import {createSqlAuthoringV2} from './src/features/authoring-review/sql-adapter';
 const locale=new URLSearchParams(location.search).get('locale')==='ar'?'ar':'en', messages=locale==='ar'?ar:en;
 const t={...copy[locale],...sqlCopy[locale],...messages.assessImport.authoringCopy}; window.text=t;window.strings=messages.assessImport;window.saved=[];
 const actor='00000000-0000-4000-8000-000000000001', group='00000000-0000-4000-8000-000000000002';let document;
 const adapter=createSqlAuthoringV2({id:actor,role:'supervisor',name:'SYNTHETIC Account Name'},{async rpc(name,args){
  if(name==='scope_page_v1')return {serverNow:new Date().toISOString(),next:null,rows:[{id:group,name:'SYNTHETIC acceptance',supervisor_id:actor,starts_at:new Date().toISOString(),ends_at:new Date(Date.now()+3600000).toISOString(),supervised_from:new Date().toISOString(),revision:1}]};
  if(name==='draft_page_v2')return {rows:document?[{id:document.id,revision:document.revision,name:document.name,track:'mixed'}]:[],next:null};
  if(name==='draft_save_v2'){const d=JSON.parse(args[3]);d.revision++;document=d;window.saved.push(d);return {document:d,id:d.id,revision:d.revision,refs:[]};}throw Error('Unexpected RPC '+name);
 }});
 await adapter.groups(actor,undefined,new AbortController().signal);
 createRoot(documentGet()).render(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC"><main className="mx-auto max-w-5xl p-4"><h1>Synthetic authoring acceptance</h1><AuthoringSession adapter={adapter} scope={{actorId:actor,groupId:group}} locale={locale} text={t}/></main></NextIntlClientProvider>);
 function documentGet(){return globalThis.document.getElementById('root');}
 `, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, format: 'esm', target: 'es2022', write: false, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
 writeFileSync(join(directory, 'app.js'), compiled.outputFiles[0].contents);
 const css = await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: resolve('src/app/globals.css') }); writeFileSync(join(directory, 'app.css'), css.css);
 server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/app.js' || path === '/app.css') { response.setHeader('content-type', path.endsWith('.js') ? 'text/javascript' : 'text/css'); response.end(readFileSync(join(directory, path.slice(1)))); return; }
  const locale = new URL(request.url, 'http://localhost').searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  response.setHeader('content-type', 'text/html; charset=utf-8'); response.end(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><title>RAD-062 local audit</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>`);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
 browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => { assert.equal(new URL(route.request().url()).origin, base, 'No external API or file upload'); return route.continue(); });
  await page.goto(`${base}/?locale=${locale}`);
  const c = await page.evaluate(() => window.text), t = await page.evaluate(() => window.strings);
  await page.getByRole('button', { name: c.create, exact: true }).click();
  await page.getByLabel(c.name, { exact: true }).fill('SYNTHETIC authoring');
  await page.getByLabel(t.batchReference, { exact: true }).fill('Own source'); await page.getByLabel(t.batchLicence, { exact: true }).fill('Own licence');
  await page.getByRole('button', { name: c.addMCQ, exact: true }).click();
  await page.getByLabel(c.prompt, { exact: true }).fill('Form question?');
  await page.getByLabel(c.option + ' 1', { exact: true }).fill('True'); await page.getByLabel(c.option + ' 2', { exact: true }).fill('False');
  await page.getByLabel(c.correct, { exact: false }).selectOption({ index: 1 }); await page.getByLabel(t.shuffleOptions, { exact: true }).uncheck();
  await page.getByRole('button', { name: c.preview, exact: true }).click(); await page.getByRole('button', { name: c.closePreview, exact: true }).click();
  await page.getByRole('button', { name: c.save, exact: true }).click(); await page.waitForFunction(() => window.saved.length === 1);
  ok(await page.evaluate(() => window.saved[0].items[0].shuffleOptions === false && window.saved[0].schemaVersion === 2), 'Form saves through v2 with the option exception');
  ok(await page.getByLabel(c.author, { exact: true }).count() === 0, 'Author has no manual field');
  const table = 'Question\tA\tB\tAnswer\tReference\nPasted 1?\tYes\tNo\tA\tRow source\nPasted 2?\tYes\tNo\tB\t\nPasted 3?\tYes\tNo\tC\t';
  await page.getByLabel(t.paste, { exact: true }).fill(table); await page.getByRole('button', { name: t.previewPaste, exact: true }).click();
  ok(await page.getByRole('button', { name: t.addValidated, exact: true }).isDisabled(), 'Bad row blocks the batch');
  ok(await page.getByRole('button', { name: c.save, exact: true }).isDisabled(), 'Pending import blocks partial draft saving');
  await page.getByLabel('Answer', { exact: true }).nth(2).fill('A'); await page.getByLabel(t.licence, { exact: true }).nth(1).fill('Per-question licence');
  await page.getByRole('button', { name: t.addValidated, exact: true }).click(); await page.getByRole('button', { name: c.save, exact: true }).click(); await page.waitForFunction(() => window.saved.length === 2);
  ok(await page.evaluate(() => window.saved[1].items.length === 4 && window.saved[1].items[1].provenance.sources[0].reference === 'Row source' && window.saved[1].items[2].provenance.licenceNotes === 'Per-question licence'), 'Three TSV rows save together with row metadata');
  const input = page.locator('input[type=file]');
  if (width === 390) await input.setInputFiles({ name: 'questions.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(xlsx, 'base64') });
  else await page.locator('div.border-dashed').evaluate((element, encoded) => { const transfer = new DataTransfer(); transfer.items.add(new File([Uint8Array.from(atob(encoded), c => c.charCodeAt(0))], 'questions.xlsx')); element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer })); }, xlsx);
  await page.getByLabel('Question', { exact: true }).waitFor(); await page.getByRole('button', { name: t.addValidated, exact: true }).click(); await page.getByRole('button', { name: c.save, exact: true }).click(); await page.waitForFunction(() => window.saved.length === 3);
  ok(await page.evaluate(() => window.saved[2].items[4].maximum === '1'), 'XLSX reads the cached formula value');
  await input.setInputFiles({ name: 'questions.csv', mimeType: 'text/csv', buffer: Buffer.from('Question,A,B,Answer\nCSV question?,True,False,B') });
  await page.getByLabel('Question', { exact: true }).waitFor(); await page.getByRole('button', { name: t.addValidated, exact: true }).click(); await page.getByRole('button', { name: c.save, exact: true }).click(); await page.waitForFunction(() => window.saved.length === 4);
  const k = page.locator('input[type=number]').last(); await k.fill('7'); await page.getByRole('button', { name: c.save, exact: true }).click();
  ok(await page.getByText(t.draftErrors.pool_size_exceeds_questions, { exact: false }).count() > 0, 'K>N gives a clear error'); ok(await page.evaluate(() => window.saved.length === 4), 'K>N never reaches the save RPC');
  await k.fill('6'); await page.getByLabel(c.points, { exact: true }).last().fill('2');
  ok(await page.getByText(t.draftErrors.pool_points_must_be_equal, { exact: false }).count() > 0, 'Mixed pool points are rejected'); await page.getByLabel(c.points, { exact: true }).last().fill('1');
  await page.getByRole('button', { name: c.remove, exact: true }).last().click();
  ok(await page.getByText(t.draftErrors.pool_size_exceeds_questions, { exact: false }).count() > 0, 'Exclusion recalculates N'); await k.fill('5');
  for (const name of ['a.xlsm', 'a.xls']) { await input.setInputFiles({ name, mimeType: 'application/octet-stream', buffer: Buffer.from('bad') }); await page.getByText(t.errors[name.endsWith('xlsm') ? 'macros' : 'fileType'], { exact: true }).waitFor(); }
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale}/${width} has no horizontal overflow`);
  await page.addScriptTag({ path: resolve('node_modules/axe-core/axe.min.js') }); const result = await page.evaluate(() => window.axe.run(document, { rules: { 'color-contrast': { enabled: true } } }));
  ok(result.violations.length === 0, `${locale}/${width} axe: ${result.violations.map(v => v.id + ':' + v.nodes.map(n => n.target).join()).join(',')}`); audits++;
  ok(errors.length === 0, `No browser errors: ${errors.join(', ')}`); await context.close();
 }
 console.log(`Verified: ${checks} browser checks; ${audits} axe audits (EN/AR × 390/1440), synthetic local harness.`);
} finally { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); rmSync(directory, { recursive: true, force: true }); }
