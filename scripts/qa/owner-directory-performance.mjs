// Synthetic browser measurement of the actual owner components. No provider IO.
// node scripts/qa/owner-directory-performance.mjs [--describe]
// Production React is measured separately from a development StrictMode probe.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const baseline='9bc04da478f5b9d70f4592e77c7c07b304cecde7';
export const measurementPlan={baseline,delayMs:120,repetitions:10,cpuRate:4,mode:'production React, local synthetic fetch, no Next hydration/network claim'};
export function summarize(samples){
 const values=samples.map(s=>s.usableMs).sort((a,b)=>a-b);
 return {requests:samples.map(s=>s.requests),bytes:samples.map(s=>s.bytes),medianMs:(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2,p95Ms:values[Math.ceil(values.length*.95)-1]};
}
async function run(){
 const require=createRequire(import.meta.url),{chromium}=require('playwright');
 const axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
 const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
 const bundles={};
 for(const variant of ['before','after','strict']){
  const mocks={
   session:`import {useSyncExternalStore} from 'react';const listeners=new Set();let state={kind:'signedIn',userId:'synthetic-owner',email:'owner@example.test',profile:{role:'owner',status:'approved',code:'SYN'}};window.account=(next)=>{state=next;listeners.forEach(f=>f());};export const useSessionAccount=()=>({state:useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>state)});export const useOptionalSessionAccount=useSessionAccount;`,
   client:`const send=(name,args,signal)=>{window.calls.push({name,args});return fetch('/rpc',{method:'POST',body:JSON.stringify({name,args,scenario:window.scenario}),signal}).then(async r=>{const text=await r.text();if(name==='owner_account_directory_v1')window.bytes+=new TextEncoder().encode(text).length;return JSON.parse(text)});};export const getPilotClient=async()=>({rpc:(name,args)=>{let signal;const read={abortSignal:s=>{signal=s;return read},then:(a,b)=>send(name,args,signal).then(a,b)};return read;},schema:()=>({rpc:(name,args)=>({abortSignal:signal=>send(name,args,signal)})})});`,
   navigation:`export const Link='a';export const usePathname=()=>'/owner';export const useRouter=()=>({replace:()=>{}});`,
  };
  const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React,{StrictMode} from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';import {OwnerPanel} from './src/features/pilot/OwnerPanel';window.mount=(locale,messages)=>{window.calls=[];window.bytes=0;window.started=performance.now();function App(){return <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC"><main className="mx-auto max-w-5xl px-4 py-10"><h1>{messages.owner.title}</h1><OwnerPanel/></main></NextIntlClientProvider>}createRoot(document.getElementById('root')).render(${variant==='strict'?'<StrictMode><App/></StrictMode>':'<App/>'});new MutationObserver(()=>{const directory=document.querySelector('[data-testid="owner-directory"]');const usable=directory&&!directory.querySelector(':scope > [role="status"],:scope > [role="alert"]')&&document.querySelector('[data-testid="owner-status"] button');if(usable&&!window.usableMs)window.usableMs=performance.now()-window.started;}).observe(document.getElementById('root'),{subtree:true,childList:true});};`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':JSON.stringify(variant==='strict'?'development':'production'),'process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://synthetic.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_only_123456"'},plugins:[{name:'synthetic-boundary',setup(b){
   b.onResolve({filter:/(SessionGate|^\.\/client$|i18n\/navigation)$/},args=>({path:/SessionGate$/.test(args.path)?'session':/client$/.test(args.path)?'client':'navigation',namespace:'synthetic'}));
   b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
   if(variant==='before')b.onLoad({filter:/\/pilot\/(OwnerPanel|OwnerDirectory|owner-dashboard-data)\.(tsx|ts)$/},args=>({contents:execFileSync('git',['show',`${baseline}:${relative(process.cwd(),args.path)}`],{encoding:'utf8'}),loader:args.path.endsWith('tsx')?'tsx':'ts'}));
  }}]});bundles[variant]=bundle.outputFiles[0].text;
 }
 const stamp='2026-11-06T00:00:00Z';
 const people=Array.from({length:60},(_,i)=>({user_id:`person-${i}`,participant_code:`SYN-${i}`,role:'participant',status:i<30?'pending':i<50?'approved':'suspended',name:`Synthetic ${i}`,email:`synthetic${i}@example.test`,created_at:stamp,last_seen_at:null}));
 const server=createServer(async(req,res)=>{
  if(req.method==='GET'){const variant=new URL(req.url,'http://local').pathname.slice(1);assert.ok(bundles[variant]);res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic owner</title><style>${css}</style></head><body><div id="root"></div><script>${bundles[variant]}</script></body></html>`);return;}
  let body='';for await(const chunk of req)body+=chunk;
  const {name,args,scenario}=JSON.parse(body);assert.equal(name,'owner_account_directory_v1','closed details must not start other reads');
  const rows=scenario==='empty'?[]:people.filter(p=>(!args.p_status||p.status===args.p_status)&&(!args.p_search||p.email.includes(args.p_search)));
  const offset=args.p_cursor?Number(args.p_cursor.id.split('-')[1])+1:0;
  const selected=rows.slice(offset,offset+20),next=rows.length>offset+20?{id:selected.at(-1).user_id,rank:0}:null;
  const data={version:1,rows:selected,counts:{pending:scenario==='empty'?0:30,approved:scenario==='empty'?0:20,suspended:scenario==='empty'?0:10},next,boundary:stamp};
  await new Promise(r=>setTimeout(r,measurementPlan.delayMs));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data,error:null}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[],audits=[],errors=[],outbound=[];
 async function setup(variant,scenario='large',locale='en',width=390){
  const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>{if(route.request().url().startsWith(base+'/'))return route.continue();outbound.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:measurementPlan.cpuRate});
  await page.goto(`${base}/${variant}`);await page.evaluate(({locale,messages,scenario})=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';window.scenario=scenario;window.mount(locale,messages);},{locale,messages:messages[locale],scenario});
  try{await page.waitForFunction(()=>window.usableMs>0);}catch(error){console.error({variant,scenario,errors,body:await page.locator('body').innerText(),calls:await page.evaluate(()=>window.calls)});throw error;}return {context,page};
 }
 try{
  // Paired AB/BA runs, each in a cold context. The repeated reads in a warm
  // mounted panel are measured separately: completed results must never be cached.
  for(const scenario of ['large','empty']){
   const samples={before:[],after:[]};
   for(let repeat=0;repeat<measurementPlan.repetitions;repeat++)for(const variant of repeat%2?['after','before']:['before','after']){
    const {context,page}=await setup(variant,scenario);
    const sample=await page.evaluate(()=>({usableMs:window.usableMs,requests:window.calls.length,bytes:window.bytes}));assert.equal(sample.requests,variant==='before'?2:1);samples[variant].push(sample);
    await context.close();
   }
   results.push({scenario,before:summarize(samples.before),after:summarize(samples.after),samples});console.error('Measured '+scenario);
  }
  for(const locale of ['en','ar'])for(const width of [390,1440]){
   const {context,page}=await setup('after','large',locale,width),m=messages[locale];
   async function audit(state){await page.evaluate(axe);const v=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(v,[],`${locale}/${width}/${state}`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));audits.push({locale,width,state});}
   await audit('cold');assert.equal(await page.getByTestId('owner-row').count(),20);
   await page.getByRole('button',{name:m.owner.refresh,exact:true}).click();await page.waitForFunction(()=>window.calls.length===2&&document.querySelectorAll('[data-testid="owner-row"]').length===20);await audit('warm-refresh');
   await page.getByRole('button',{name:`${m.ownerUx.filter.pending} (30)`,exact:true}).click();await page.waitForFunction(()=>window.calls.length===3&&document.querySelectorAll('[data-testid="owner-row"]').length===20);
   await page.getByRole('button',{name:m.owner.refresh,exact:true}).click();await page.waitForFunction(()=>window.calls.length===5&&document.querySelectorAll('[data-testid="owner-row"]').length===20);await audit('filtered-refresh');
   assert.ok((await page.getByTestId('owner-status').textContent()).includes('30'));
   await context.close();
  }
  const {context,page}=await setup('strict');const strict=await page.evaluate(()=>({requests:window.calls.length,bytes:window.bytes,usableMs:window.usableMs}));assert.equal(strict.requests,1);await context.close();
  assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);
  const output={plan:measurementPlan,results,audits,strict,errors,outbound,limits:'Synthetic component bundle, fixed local delay; no real-user speedup, Next hydration, provider latency, HTTP compression or phone claim.'};
  mkdirSync('/tmp/rad106-performance',{recursive:true});writeFileSync('/tmp/rad106-performance/results.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output,null,2));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--describe'))console.log(JSON.stringify(measurementPlan));else await run();
}
