// Local production component lab; never connects to a provider or real account.
// PLAYWRIGHT_MODULE may point at an existing external installation. No dependency change.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

export const measurementPlan={baseline:'98f579c2781698b5dd4f97de700ac69ba73f75d4',delayMs:120,repetitions:10,cpuRate:4,sizes:[0,7,500,503],mode:'production React component lab; UTF-8 response bodies, no compression/headers/Next hydration/provider claim'};
export function summarize(samples){
 const sorted=key=>samples.map(s=>s[key]).sort((a,b)=>a-b);
 const timing=key=>{const v=sorted(key);return {median:(v[4]+v[5])/2,p95:v[9]};};
 return {requests:[...new Set(samples.map(s=>s.requests))],bytes:[...new Set(samples.map(s=>s.bytes))],first:timing('firstMs'),complete:timing('completeMs')};
}
async function run(){
 const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE??'playwright');
 const axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
 const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
 const variants=process.argv.includes('--before-only')?['before']:['before','after'],bundles={};
 for(const variant of variants){
  const mocks={
   session:`export const useSessionAccount=()=>({state:window.account});export const useOptionalSessionAccount=useSessionAccount;`,
   client:`import {createClient} from '@supabase/supabase-js';const client=createClient('https://fixture.supabase.co','synthetic',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{const u=new URL(String(input));window.calls.push(u.pathname+u.search);const r=await fetch('/read'+u.pathname+u.search,{...init,headers:{'Content-Type':'application/json','x-size':String(window.size)}});const text=await r.text();window.bytes+=new TextEncoder().encode(text).length;const response=new Response(text,{status:r.status,headers:r.headers});if(u.pathname.includes('/attempts'))window.pages++;return response;}}});export const getPilotClient=async()=>client;`,
   navigation:`export const Link='a';`,
  };
  const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';import {TrainingSummary} from './src/features/pilot/TrainingSummary';import {ExamCatalogue} from './src/features/platform/ExamCatalogue';import {librarySections} from './src/features/platform/library';import {EXAMS} from './src/data/exams';window.mount=(locale,messages,component,size)=>{window.size=size;window.account={kind:'signedIn',userId:'00000000-0000-0000-0000-000000000001',displayName:'Synthetic',consentVersion:'2026-11-02',profile:{role:'participant',status:'approved'}};window.calls=[];window.bytes=0;window.pages=0;window.started=performance.now();const root=createRoot(document.getElementById('root'));window.remount=()=>{root.unmount();};root.render(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC"><main className="mx-auto max-w-5xl px-4 py-10">{component==='home'?<TrainingSummary/>:<><h1>{messages.shell.library}</h1><ExamCatalogue sections={librarySections(EXAMS.map(exam=>({id:exam.id,title:exam.title,bodyPart:exam.bodyPart,projection:exam.requiredProjection,href:'/xray/'+exam.id,caseCount:1,provisional:exam.provisional})))}/></>}</main></NextIntlClientProvider>);const watch=setInterval(()=>{const ready=component==='home'?(size===0?window.pages>0:!!document.querySelector('[data-testid="training-summary"]')):!!document.querySelector('.saved-verdict');if(ready&&!window.firstMs)window.firstMs=performance.now()-window.started;const expected=1+Math.max(1,Math.min(5,Math.ceil(size/100)));if(window.pages===expected-1&&ready&&(component!=='home'||size===0||document.querySelectorAll('.home-next a').length>1)&&!window.completeMs){window.completeMs=performance.now()-window.started;clearInterval(watch);}},16);};`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://fixture.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_only_123456"'},plugins:[{name:'local-only',setup(b){
   b.onResolve({filter:/(SessionGate|^\.\/client$|i18n\/navigation)$/},a=>({path:/SessionGate$/.test(a.path)?'session':/client$/.test(a.path)?'client':'navigation',namespace:'synthetic'}));
   b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:process.cwd()}));
   if(variant==='before')b.onLoad({filter:/\/(TrainingSummary|ExamCatalogue)\.tsx$/},a=>({contents:execFileSync('git',['show',`${measurementPlan.baseline}:${relative(process.cwd(),a.path)}`],{encoding:'utf8'}),loader:'tsx'}));
  }}]});bundles[variant]=bundle.outputFiles[0].text;
 }
 const stamp='2026-11-05T10:00:00Z',boundary='2026-11-06T00:00:00Z';
 const rows=Array.from({length:503},(_,i)=>({id:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,exam_id:['wrist-pa','hand-pa','elbow-ap','archived-exam'][i%4],case_id:'default',definition_version:'fixture',comparison_version:null,engine_version:'unknown',producer_version:'fixture/1',result_format_version:1,finished_at:stamp,result:{total:i%3?91:99,passed:i%3!==0,thresholdMet:true,primaryVariant:'fixture',critical:i%3?[]:['wrong-side-marker'],categories:[{c:'position',earned:91,weight:100}],checks:Array.from({length:24},(_,j)=>({id:`synthetic-rule-${j}`,o:'pass',credit:1}))}}));
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://local');
  if(req.method==='GET'&&!url.pathname.startsWith('/read')){const v=url.pathname.slice(1);assert.ok(bundles[v]);res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Summary lab</title><style>${css}</style></head><body><div id="root"></div><script>${bundles[v]}</script></body></html>`);return;}
  const size=Number(req.headers['x-size']);let data;
  if(url.pathname.endsWith('/rpc/training_page_v1_with_comparison'))data={version:1,boundary,summary:{attempts:size,exams:Math.min(size,4),latest:size?stamp:null,trainees:null},rows:[],next:null};
  else{
   assert.equal(url.pathname,'/read/rest/v1/attempts');assert.equal(url.searchParams.get('limit'),'101');assert.equal(url.searchParams.get('order'),'finished_at.desc,id.asc');
   const offset=Number(url.searchParams.get('or')?.match(/id.gt.00000000-0000-0000-0000-(\d+)/)?.[1]??0);
   data=rows.slice(offset,Math.min(size,offset+101));
   if(url.searchParams.get('select').includes('result->'))data=data.map(({result,...r})=>({...r,total:result.total,passed:result.passed,critical:result.critical,categories:result.categories}));
  }
  await new Promise(r=>setTimeout(r,measurementPlan.delayMs));res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[],audits=[],errors=[],outbound=[];
 async function setup(variant,component,size,locale='en',width=390){
  const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',r=>{if(r.request().url().startsWith(base+'/'))return r.continue();outbound.push(r.request().url());return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:measurementPlan.cpuRate});
  await page.goto(`${base}/${variant}${component==='catalogue'?'#category=upper-limb':''}`);
  await page.evaluate(({locale,messages,component,size})=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';window.mount(locale,messages,component,size);},{locale,messages:messages[locale],component,size});
  try{await page.waitForFunction(()=>window.completeMs>0);}catch(e){console.error({variant,component,size,errors,body:await page.locator('body').innerText(),calls:await page.evaluate(()=>window.calls)});throw e;}
  return {context,page};
 }
 try{
  for(const component of ['home','catalogue'])for(const size of measurementPlan.sizes){
   const samples=Object.fromEntries(variants.map(v=>[v,[]])),snapshots={};
   for(let repeat=0;repeat<measurementPlan.repetitions;repeat++)for(const variant of repeat%2?[...variants].reverse():variants){
    const {context,page}=await setup(variant,component,size);
    const sample=await page.evaluate(()=>({firstMs:window.firstMs,completeMs:window.completeMs,requests:window.calls.length,bytes:window.bytes}));assert.equal(sample.requests,1+Math.max(1,Math.min(5,Math.ceil(size/100))));samples[variant].push(sample);
    snapshots[variant]=await page.locator('main').evaluate(el=>({text:el.textContent,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href')),verdicts:[...el.querySelectorAll('.saved-verdict')].map(e=>e.className)}));await context.close();
   }
   if(variants.length===2)assert.deepEqual(snapshots.after,snapshots.before,`${component}/${size}: visible parity`);
   results.push({component,size,...Object.fromEntries(variants.map(v=>[v,summarize(samples[v])])),samples});console.error(`Measured ${component}/${size}`);
  }
  if(variants.includes('after'))for(const component of ['home','catalogue'])for(const locale of ['en','ar'])for(const width of [390,1440])for(const size of [0,503]){
   const {context,page}=await setup('after',component,size,locale,width);await page.evaluate(axe);
   const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));audits.push({component,locale,width,size});await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);mkdirSync('/tmp/rad106-summary',{recursive:true});
  const output={plan:measurementPlan,browser:browser.version(),results,audits,errors,outbound};writeFileSync(`/tmp/rad106-summary/${variants.length===1?'baseline':'results'}.json`,JSON.stringify(output,null,2));console.log(JSON.stringify(output));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.includes('--describe'))console.log(JSON.stringify(measurementPlan));else await run();}
