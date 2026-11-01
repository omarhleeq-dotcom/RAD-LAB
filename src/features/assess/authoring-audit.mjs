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
 rows=[['Question','A','B','Answer','Points','Reference']]+[['XLSX cached question '+str(n)+'?','True','False','A','1','XLSX source'] for n in range(1,21)]
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
 import {AssessPanel} from './src/features/assess/AssessPanel'; import {P1SupervisorScope} from './src/features/supervisor/P1Session';
 import {copy,sqlCopy} from './src/features/authoring-review/copy';
 const locale=new URLSearchParams(location.search).get('locale')==='ar'?'ar':'en',messages=locale==='ar'?ar:en;
 window.text={...copy[locale],...sqlCopy[locale],...messages.assessImport.authoringCopy};window.strings=messages.assessImport;
 createRoot(document.getElementById('root')).render(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC"><main className="mx-auto max-w-5xl p-4"><h1>{messages.assessImport.title}</h1><P1SupervisorScope><AssessPanel/></P1SupervisorScope></main></NextIntlClientProvider>);
 `, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, format: 'esm', target: 'es2022', write: false, jsx: 'automatic', define: { 'process.env': '{}', 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_SUPABASE_URL': '"https://vlacestfruxooznrcjqc.supabase.co"', 'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': '"sb_publishable_synthetic_local_test_123456"' },
 plugins:[{name:'synthetic-account-and-transport',setup(b){
  b.onResolve({filter:/(?:pilot\/(?:SessionGate|client)|p1-live)$/},args=>({path:args.path.split('/').at(-1),namespace:'synthetic'}));
  b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path==='SessionGate'?`
   const state={kind:'signedIn',userId:'00000000-0000-4000-8000-000000000001',displayName:'Synthetic Supervisor Account',consentVersion:'2026-10-27',profile:{status:'approved',role:new URLSearchParams(location.search).has('owner')?'owner':'participant'}};
   export const useSessionAccount=()=>({state});export const useOptionalSessionAccount=useSessionAccount;
  `:args.path==='p1-live'?`export const bindP1=async()=>({read:async()=>({appointed:window.appointed!==false})});`:`
   const actor='00000000-0000-4000-8000-000000000001',group='00000000-0000-4000-8000-000000000002';let stored;window.saved=[];window.calls=[];
   const rpc=async(name,args={})=>{
    window.calls.push(name);
    if(name==='name_entry_v1')return {data:true};
    if(name==='scope_page_v1')return {data:{serverNow:new Date().toISOString(),next:null,rows:Array.from({length:new URLSearchParams(location.search).has('groups')?2:1},(_,n)=>({id:n?'00000000-0000-4000-8000-000000000003':group,name:'SYNTHETIC group '+(n+1),supervisor_id:actor,starts_at:new Date().toISOString(),ends_at:new Date(Date.now()+3600000).toISOString(),supervised_from:new Date().toISOString(),revision:1}))}};
    if(name==='draft_page_v2')return {data:{rows:stored?[{id:stored.id,revision:stored.revision,name:stored.name,track:'mixed'}]:[],next:null}};
    if(name==='draft_save_v2'){const d=args.p_document;d.revision++;stored=d;window.saved.push(d);return {data:{document:d,id:d.id,revision:d.revision,refs:[]}};}
    if(name==='assigned_page_v1')return {data:{rows:[],next:null}};
    throw Error('Unexpected synthetic RPC '+name);
   };
   const client={schema:()=>({rpc:(name,args)=>{const promise=rpc(name,args);promise.abortSignal=()=>promise;return promise;}}),auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
   export const getPilotClient=()=>Promise.resolve(client);
  `,loader:'ts'}));
 }}] });
 writeFileSync(join(directory, 'app.js'), compiled.outputFiles[0].contents);
 const css = await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: resolve('src/app/globals.css') }); writeFileSync(join(directory, 'app.css'), css.css);
 server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/app.js' || path === '/app.css') { response.setHeader('content-type', path.endsWith('.js') ? 'text/javascript' : 'text/css'); response.end(readFileSync(join(directory, path.slice(1)))); return; }
  const locale = new URL(request.url, 'http://localhost').searchParams.get('locale') === 'ar' ? 'ar' : 'en';
  response.setHeader('content-type', 'text/html; charset=utf-8'); response.end(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>RAD-062 local audit</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>`);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
 browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] });
 for (const locale of ['en', 'ar']) for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390, acceptDownloads:true });
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(8000);page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await context.route('**/*', route => { assert.equal(new URL(route.request().url()).origin, base, 'No external API or file upload'); return route.continue(); });
  const button=(name)=>{const found=page.getByRole('button',{name,exact:true});return name===t.next?found.first():found;};
  async function audit(label) {
   ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale}/${width}/${label}: no overflow`);
   await page.addScriptTag({ path: resolve('node_modules/axe-core/axe.min.js') });
   const result=await page.evaluate(()=>window.axe.run(document));
   ok(!result.violations.length,`${locale}/${width}/${label} axe: ${result.violations.map(v=>v.id+':'+v.nodes.map(n=>n.target).join()).join(',')}`);audits++;
   await page.screenshot({path:`/tmp/rad062-4c-after-${locale}-${width}-${label}.jpg`,fullPage:true,type:'jpeg',quality:75});
  }
  // A single click from the actual Assess entry opens the method step; one active group is automatic.
  await page.goto(`${base}/?locale=${locale}`);
  await page.waitForFunction(()=>!!window.strings);
  const t=await page.evaluate(()=>window.strings),c=await page.evaluate(()=>window.text);
  await page.getByRole('link',{name:t.entry,exact:true}).waitFor();await audit('1-entry');
  await page.getByRole('link',{name:t.entry,exact:true}).click();
  // The app normally obtains locale from its route; keep the synthetic route locale on navigation.
  if(locale==='ar')await page.goto(`${base}/?locale=ar&author=1`);
  await button(t.method.upload).waitFor();
  ok(await page.getByRole('heading',{name:c.group,exact:true}).count()===0,'Single group has no visible group step');await audit('2-method');
  ok(await button(c.draftList).isEnabled(),'A new empty draft does not block access to saved drafts');
  await button(c.draftList).click();await button(c.create).click();await button(t.method.upload).waitFor();
  const download=page.waitForEvent('download');await page.getByRole('link',{name:t.template,exact:true}).click();
  const file=await download;const stream=await file.createReadStream();let contents='';for await(const chunk of stream)contents+=chunk;
  ok(contents.split('\r\n')[0]==='Question,A,B,C,D,Answer,Points,Reference'&&contents.split('\r\n').filter(Boolean).length===2,'Exact CSV headers and one example row');
  // Source defaults are supplied only through the user-isolated existing memory contract.
  await page.evaluate(()=>localStorage.setItem('radlab:assess-import:v1:00000000-0000-4000-8000-000000000001',JSON.stringify({userId:'00000000-0000-4000-8000-000000000001',reference:'Own source',licenceNotes:'Own licence'})));
  await page.reload();await button(t.method.upload).click();
  const input=page.locator('input[type=file]');
  const target=await button(t.file).boundingBox();ok(target.height>=44,'Localized file button has a 44px target');
  ok(await page.locator('input[type=file]').getAttribute('hidden')!==null,'Native input is hidden');
  const chooser=page.waitForEvent('filechooser');await button(t.file).focus();await page.keyboard.press('Enter');await chooser;ok(true,'Keyboard Enter opens the localized file button');
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});
  if(width===390)await input.setInputFiles({name:'questions.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(xlsx,'base64')});
  else await page.locator('div.border-dashed').evaluate((element,encoded)=>{const transfer=new DataTransfer();transfer.items.add(new File([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))],'questions.xlsx'));element.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));},xlsx);
  await page.getByRole('heading',{name:t.summary.replace('{ready}','20').replace('{errors}','0'),exact:true}).waitFor();await audit('3-preview');
  const previewRegion=page.getByRole('region',{name:t.preview,exact:true});
  ok(await previewRegion.locator(width>=768?'tbody > tr':'ul.divide-y > li').count()===10,'Ten compact rows per page');
  ok(await previewRegion.getByRole('button',{name:t.fix,exact:true}).count()===0,'Ready rows have no Fix');
  ok(await previewRegion.getByText('✓ A · True',{exact:true}).count()===10,'Correct option is marked in every compact row');
  const nextBox=await button(t.next).boundingBox();ok(nextBox.y+nextBox.height<=900,'Next is reachable without scrolling');
  await page.getByRole('button',{name:t.detailsRow.replace('{n}','2'),exact:true}).click();
  const expanded=width>=768?previewRegion.locator('fieldset'):page.getByRole('dialog');
  ok(await expanded.getByText('✓ A · True',{exact:true}).isVisible()&&await expanded.getByText('B · False',{exact:true}).isVisible(),'Expanded view includes all options and correct marker');await audit('3-expanded');
  if(width<768)await button(t.close).click();else await page.getByRole('button',{name:t.detailsRow.replace('{n}','2'),exact:true}).click();
  await button(t.nextPage).click();
  await page.evaluate(()=>{for(const value of ['hidden','visible']){Object.defineProperty(document,'visibilityState',{configurable:true,value});document.dispatchEvent(new Event('visibilitychange'));}});
  ok(await page.getByText('XLSX cached question 20?',{exact:true}).count()===1,'Pending preview survives app switching');
  await button(t.next).click();
  await page.getByLabel(c.name,{exact:true}).fill('SYNTHETIC phone draft');
  ok(await page.getByLabel(t.poolSize,{exact:true}).inputValue()==='20','K defaults to N');
  await audit('4-save');
  await button(t.back).click();ok(await page.getByText('XLSX cached question 20?',{exact:true}).isVisible(),'Back retains all imported rows');await button(t.next).click();
  ok(await page.getByLabel(c.name,{exact:true}).inputValue()==='SYNTHETIC phone draft','Unsaved draft survives back/next');
  await page.getByLabel(t.poolSize,{exact:true}).fill('21');ok(await button(c.save).isDisabled(),'K>N blocks Save');
  ok(await page.getByText(t.draftErrors.pool_size_exceeds_questions,{exact:true}).isVisible(),'K>N block is explained only when violated');
  await page.getByLabel(t.poolSize,{exact:true}).fill('20');await button(c.save).click();await page.waitForFunction(()=>window.saved.length===1);
  ok(await page.evaluate(()=>window.saved[0].items.length===20&&window.saved[0].items.every(i=>i.maximum==='1'&&i.shuffleOptions===true)&&window.saved[0].schemaVersion===2),'Twenty XLSX rows save once through v2 with cached values and default shuffle');
  // Re-enter step 2 through Back; completed local rows remain available until an explicit discard.
  await button(t.back).click();await button(t.cancel).click();await button(t.back).click();await button(t.method.paste).click();
  const table='Question\tA\tB\tAnswer\tReference\nPasted 1?\tYes\tNo\tA\tRow source\nPasted 2?\tYes\tNo\tB\t\nPasted 3?\tYes\tNo\tC\t';
  await page.getByLabel(t.paste,{exact:true}).fill(table);await button(t.previewPaste).click();
  ok(await button(t.next).isDisabled(),'Bad row blocks the complete batch');
  ok(await page.getByRole('button',{name:c.save,exact:true,includeHidden:true}).last().isDisabled(),'Pending import blocks partial draft saving');
  const rows=page.getByRole('region',{name:t.preview,exact:true}).locator('fieldset');
  ok((await rows.first().locator('legend').textContent()).includes('4'),'Error row comes first with its source row number');
  await rows.first().getByRole('button',{name:t.fix,exact:true}).click();await rows.first().getByLabel('Answer',{exact:true}).fill('A');
  // Fixing a row can reorder it. Select by row number rather than visual position.
  await page.getByRole('button',{name:t.detailsRow.replace('{n}','3'),exact:true}).click();
  const readyDetail=width>=768?page.getByRole('region',{name:t.preview,exact:true}).locator('fieldset'):page.getByRole('dialog');
  await readyDetail.getByRole('button',{name:t.edit,exact:true}).click();await readyDetail.getByLabel(t.licence,{exact:true}).fill('Per-question licence');
  if(width<768)await button(t.close).click();
  await button(t.next).click();await button(c.save).click();await page.waitForFunction(()=>window.saved.length===2);
  ok(await page.evaluate(()=>window.saved[1].items.length===23&&window.saved[1].items[20].provenance.sources[0].reference==='Row source'&&window.saved[1].items[21].provenance.licenceNotes==='Per-question licence'),'Three pasted rows save atomically with row metadata');
  await button(t.back).click();await button(t.cancel).click();await button(t.back).click();await button(t.method.upload).click();
  await input.setInputFiles({name:'errors.csv',mimeType:'text/csv',buffer:Buffer.from('Question,A,B,Answer\nCSV error?,True,False,C')});
  await page.getByRole('alert').getByText(t.rowErrors.answer,{exact:false}).waitFor();ok(await button(t.next).isDisabled()&&await page.evaluate(()=>window.saved.length===2),'Errors CSV shows row errors and saves nothing');
  await page.getByLabel(t.exclude,{exact:true}).click();ok(await button(t.next).isDisabled(),'Excluding all rows cannot save an empty batch');await button(t.cancel).click();
  for(const name of ['a.xlsm','a.xls']){await input.setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from('bad')});await page.getByText(t.errors[name.endsWith('xlsm')?'macros':'fileType'],{exact:true}).waitFor();await button(t.cancel).click();}
  await button(t.back).click();await button(t.method.write).click();
  await page.getByLabel(c.prompt,{exact:true}).fill('Form question?');await page.getByLabel(c.option+' 1',{exact:true}).fill('True');await page.getByLabel(c.option+' 2',{exact:true}).fill('False');await page.getByLabel(c.correct,{exact:false}).selectOption({index:1});await page.getByLabel(t.shuffleOptions,{exact:true}).uncheck();
  await button(t.next).click();await button(c.save).click();await page.waitForFunction(()=>window.saved.length===3);
  ok(await page.evaluate(()=>window.saved[2].items[23].shuffleOptions===false),'Existing single-question form and shuffle exception save via v2');
  ok(await page.getByLabel(c.author,{exact:true}).count()===0,'Author has no manual field');
  await page.getByText(t.more,{exact:true}).click();await button(c.preview).click();await button(c.closePreview).click();
  ok(await page.getByLabel(c.name,{exact:true}).inputValue()==='SYNTHETIC phone draft','Student preview preserves the authoring flow');
  // Mixed points remain blocked by the same complete-draft validator.
  await button(t.back).click();await page.getByLabel(c.points,{exact:true}).fill('2');await button(t.next).click();await button(c.save).click();
  ok(await page.getByText(t.draftErrors.pool_points_must_be_equal,{exact:false}).isVisible()&&await page.evaluate(()=>window.saved.length===3),'Mixed points never reach save');
  await button(t.back).click();await page.getByLabel(c.points,{exact:true}).fill('1');await button(t.next).click();
  await page.getByLabel(t.poolSize,{exact:true}).fill('24');
  const more=page.locator('details').filter({has:page.locator('summary').filter({hasText:new RegExp('^'+t.more+'$')})});
  if(!await more.evaluate(e=>e.open))await page.getByText(t.more,{exact:true}).click();
  ok(await page.getByRole('button',{name:c.preview,exact:true}).isVisible(),'Student preview lives under More');
  await button(c.remove).last().click();
  ok(await page.getByText(t.draftErrors.pool_size_exceeds_questions,{exact:true}).isVisible(),'Removing a question recalculates N and preserves explicitly entered K');
  await page.getByLabel(t.poolSize,{exact:true}).fill('23');
  await page.goto(`${base}/?locale=${locale}&author=1&groups=2`);
  await button('SYNTHETIC group 1').waitFor();await audit('1-groups');
  ok(await button('SYNTHETIC group 2').isVisible(),'Multiple active groups use a simple list');
  await button('SYNTHETIC group 1').click();await button(t.method.upload).waitFor();
  ok(true,'Choosing a listed group opens the method step');
  await page.goto(`${base}/?locale=${locale}&author=1&owner=1`);await page.getByText(t.ownerOnly,{exact:true}).waitFor();await audit('owner');
  ok(await page.getByRole('heading',{name:c.group,exact:true}).count()===0,'Owner has the supervisors-only message and no picker');
  ok(await page.evaluate(()=>!window.calls.some(n=>n==='scope_page_v1'||n==='draft_save_v2')),'Owner message never enters authoring transport');
  ok(!errors.length,`No browser errors: ${errors.join(', ')}`);await context.close();
 }
 console.log(`Verified: ${checks} browser checks; ${audits} axe audits (EN/AR × 390/1440), actual Assess/entry/provider/form/session/adapter with synthetic local transport. Screenshots: /tmp/rad062-4c-after-*.jpg.`);
} finally { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); rmSync(directory, { recursive: true, force: true }); }
