// Local component fixtures, never Next hydration or provider performance evidence.
// Node22 + installed optional Playwright/axe; no dependency installation required.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {pageChecks} from './page-checks.mjs';
import {startPractice} from './workspace.mjs';

const baseline='5a0ae2b2c3b311a9674185b0100a50e46a389a0f';
const plan={baseline,node:process.version,repetitions:10,cpu:4,latencyMs:120,downloadBytesPerSecond:200000,uploadBytesPerSecond:93750,
 mode:'esbuild split ESM / production React component fixtures; installed Next App Router dynamic implementation; synthetic session and local RPC',
 limits:'No full Next hydration, RSC, routing/prefetch, deployed compression/cache, provider, real phone or general speedup claim. Fonts/images unchanged; HTML gzip budget excludes unlinked lazy JS, RSC, fonts and images.'};
const root='/tmp/rad106-loading',require=createRequire(import.meta.url);
const args=new Set(process.argv.slice(2));
const variants=args.has('--before-only')?['before']:['before','after'];
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const mocks={
 session:`import {useSyncExternalStore} from 'react';let state=window.fixture.route==='owner'?{kind:'signedIn',userId:'synthetic-owner',consentVersion:null,profile:{role:'owner',status:'approved',code:'SYN'}}:{kind:'signedOut'};const listeners=new Set();window.account=next=>{state=next;listeners.forEach(f=>f())};export const useSessionAccount=()=>({state:useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>state)});export const useOptionalSessionAccount=useSessionAccount;`,
 client:`const send=async(schema,name,args,signal)=>{window.calls.push({schema,name,args});window.pending++;try{const r=await fetch('/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema,name,args}),signal});return await r.json()}finally{window.pending--}};const read=(schema,name,args)=>{let signal;const r={abortSignal:s=>{signal=s;return r},retry:value=>{if(value!==false)throw Error('Unexpected retry');return r},then:(a,b)=>send(schema,name,args,signal).then(a,b)};return r};const client={auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:(name,args)=>read('public',name,args),schema:schema=>({rpc:(name,args)=>read(schema,name,args)})};export const getPilotClient=async()=>client;`,
 navigation:`export const Link='a';export const usePathname=()=>'/owner';export const useRouter=()=>({replace:()=>{}});`,
 nextNavigation:`export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({replace:()=>{}});export const usePathname=()=>location.pathname;`,
};
async function bundle(variant,route){
 const {build}=await import('esbuild');
 const outdir=`${root}/${variant}/${route}`;mkdirSync(outdir,{recursive:true});
 const result=await build({stdin:{resolveDir:process.cwd(),sourcefile:'fixture.tsx',loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';import {${route==='owner'?'OwnerPanel':'PracticeEntry'}} from './src/features/${route==='owner'?'pilot/OwnerPanel':'platform/PracticeEntry'}';window.calls=[];window.pending=0;createRoot(document.getElementById('root')).render(<NextIntlClientProvider locale={window.fixture.locale} messages={window.fixture.messages} timeZone="UTC"><main className={${JSON.stringify(route==='owner'?'mx-auto max-w-5xl px-4 py-10':'')}}><h1>${route==='owner'?'Owner':'Practice'} fixture</h1>${route==='owner'?'<OwnerPanel/>':'<PracticeEntry modality="xray" examId="hand-pa"/>'}</main></NextIntlClientProvider>);`},
  bundle:true,write:true,format:'esm',splitting:true,minify:true,metafile:true,entryNames:'entry',chunkNames:'chunks/[name]-[hash]',outdir,jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"','process.env.__NEXT_EXPERIMENTAL_REACT_BROWSER_BAILOUT':'false','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://synthetic.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_only_123456"'},
  plugins:[{name:'local-fixtures',setup(b){
   b.onResolve({filter:/(SessionGate|(?:^\.\/|pilot\/)client$|i18n\/navigation|^next\/navigation)$/},a=>({path:/SessionGate$/.test(a.path)?'session':/client$/.test(a.path)?'client':a.path==='next/navigation'?'nextNavigation':'navigation',namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:process.cwd()}));
   // Next's compiler aliases next/dynamic to this implementation for App Router.
   b.onResolve({filter:/^next\/dynamic$/},()=>({path:require.resolve('next/dist/shared/lib/app-dynamic.js')}));
   if(variant==='before')b.onLoad({filter:/\/pilot\/OwnerPanel\.tsx$/},a=>({contents:execFileSync('git',['show',`${baseline}:${relative(process.cwd(),a.path)}`],{encoding:'utf8'}),loader:'tsx'}));
  }}]});
 const outputs=result.metafile.outputs,entry=Object.keys(outputs).find(p=>outputs[p].entryPoint==='fixture.tsx');assert.ok(entry);
 const initial=new Set();function visit(p){if(initial.has(p))return;initial.add(p);for(const i of outputs[p].imports)if(i.kind==='import-statement')visit(i.path);}visit(entry);
 const rows=Object.entries(outputs).map(([path,value])=>({path:relative(root,resolve(path)),initial:initial.has(path),raw:value.bytes,gzip:gzipSync(readFileSync(path),{level:9}).length,inputs:Object.entries(value.inputs).sort((a,b)=>b[1].bytesInOutput-a[1].bytesInOutput).slice(0,12)}));
 const graph={variant,route,initialRaw:rows.filter(r=>r.initial).reduce((s,r)=>s+r.raw,0),initialGzip:rows.filter(r=>r.initial).reduce((s,r)=>s+r.gzip,0),allGzip:rows.reduce((s,r)=>s+r.gzip,0),rows,metafile:result.metafile};
 writeFileSync(`${outdir}/graph.json`,JSON.stringify(graph,null,2));return graph;
}
const stamp='2026-11-06T00:00:00Z';
function rpc({schema,name,args}){
 if(name==='owner_account_directory_v1')return {version:1,rows:Array.from({length:20},(_,i)=>({user_id:`person-${i}`,participant_code:`SYN-${i}`,role:'participant',status:'approved',name:`Synthetic ${i}`,email:`synthetic${i}@example.test`,created_at:stamp,last_seen_at:null})),counts:{pending:0,approved:20,suspended:0},next:null,boundary:stamp};
 if(schema==='assess'&&['content_page_v1','assignment_page_v2','manual_queue_v1'].includes(name))return {rows:[],next:null};
 if(schema==='assess'&&name==='owner_page_v1')return {version:1,rows:[],next:null};
 if(name==='owner_page_v1')return {version:1,record_contract_version:1,boundary:stamp,total:0,pending:0,rows:[],next:null};
 if(name==='owner_dashboard_v1')return {version:1,rows:[],next:null,boundary:stamp};
 throw new Error(`Unmodelled local RPC ${schema}.${name} ${JSON.stringify(args)}`);
}
const summary=values=>{const a=[...values].sort((a,b)=>a-b);return {median:(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2,p95:a[Math.ceil(a.length*.95)-1]};};
function staticInventory(){
 if(!existsSync('out/en/owner.html'))return {available:false};
 const linked=path=>[...new Set([...readFileSync(path,'utf8').matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]).filter(p=>p.endsWith('.js')||p.endsWith('.css')))];
 const owner=linked('out/en/owner.html'),practice=linked('out/en/xray/hand-pa/practice.html'),shared=owner.filter(p=>practice.includes(p));
 const chunks=readdirSync('out/_next/static/chunks',{recursive:true}).filter(p=>p.endsWith('.js'));
 return {provenance:'Pre-existing out; build/head unverified. Inventory only, never P3 baseline or after evidence.',owner,practice,shared,
  totalJsChunks:chunks.length,notLinkedFromEither:chunks.filter(p=>![...owner,...practice].includes('/_next/static/chunks/'+p)),
  limits:'HTML links/preloads are not proof of runtime fetches. Unlinked chunks may belong to other routes or lazy features; RSC/fonts/images are outside this HTML JS/CSS budget.'};
}
async function main(){
 assert.equal(process.versions.node.split('.')[0],'22','Use supported Node22');mkdirSync(root,{recursive:true});
 const graphs=[];for(const variant of variants)for(const route of ['owner','practice'])graphs.push(await bundle(variant,route));
 if(args.has('--graphs-only')){console.log(JSON.stringify(graphs.map(g=>({variant:g.variant,route:g.route,initialRaw:g.initialRaw,initialGzip:g.initialGzip,allGzip:g.allGzip}))));return;}
 const [{default:postcss},{default:tailwind}]=await Promise.all([import('postcss'),import('@tailwindcss/postcss')]);
 const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css;
 const rpcFailures=[];
 const server=createServer(async(req,res)=>{
  const u=new URL(req.url,'http://local');
  if(u.pathname==='/rpc'){let body='';for await(const c of req)body+=c;try{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:rpc(JSON.parse(body)),error:null}));}catch(e){rpcFailures.push(e.message);res.statusCode=500;res.end(JSON.stringify({error:e.message}));}return;}
  let data,type,cache='public, max-age=3600';
  if(u.pathname==='/fixture.css'){data=css;type='text/css';}
  else if(u.pathname.startsWith('/fonts/')){data=readFileSync('public'+u.pathname);type='font/woff2';}
  else if(u.pathname.endsWith('.js')){const path=resolve(root,'.'+u.pathname);assert.ok(path.startsWith(root+'/'));data=readFileSync(path);type='text/javascript';}
  else if(u.pathname==='/favicon.ico'){res.statusCode=204;res.end();return;}
  else {const [,variant,route,locale]=u.pathname.split('/');assert.ok(variants.includes(variant)&&['owner','practice'].includes(route)&&messages[locale]);type='text/html';cache='no-store';data=`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local loading fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script>window.fixture=${JSON.stringify({route,locale,messages:messages[locale]})}</script><script type="module" src="/${variant}/${route}/entry.js"></script></body></html>`;}
  res.setHeader('Content-Type',type);res.setHeader('Cache-Control',cache);res.setHeader('Content-Encoding','gzip');res.end(gzipSync(data,{level:9}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE??'playwright'),browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
 const samples=[],audits=[],errors=[],outbound=[],snapshots={};
 async function setup(){const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.error('Fixture browser:',m.text());});page.on('request',r=>{if(!r.url().startsWith(base+'/'))outbound.push(r.url());});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urls:['https://*']});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:plan.cpu});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:plan.latencyMs,downloadThroughput:plan.downloadBytesPerSecond,uploadThroughput:plan.uploadBytesPerSecond});return {context,page,cdp};}
 async function settled(page){await page.waitForFunction(()=>window.pending===0);await page.waitForTimeout(50);}
 async function ownerReady(page){await page.waitForFunction(()=>document.querySelectorAll('[data-testid="owner-row"]').length===20&&document.querySelector('[data-testid="owner-status"] button'));await settled(page);}
 async function resources(page){return page.evaluate(()=>{const rows=performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,encoded:r.encodedBodySize,transfer:r.transferSize,decoded:r.decodedBodySize}));const selected=rows.filter(r=>/\.(js|css)$/.test(r.path));return {jsCssRequests:selected.length,jsCssNetworkRequests:selected.filter(r=>r.transfer>0).length,jsCssTransferred:selected.reduce((s,r)=>s+r.transfer,0),jsCssEncoded:selected.reduce((s,r)=>s+(r.transfer>0?r.encoded:0),0),rpcRequests:window.calls.length,allRequests:rows.length,rows};});}
 async function tab(page,id){const t=performance.now();await page.getByRole('link',{name:messages.en.ownerUx.tabs[id],exact:true}).click();
  if(id==='groups')await page.getByRole('heading',{name:messages.en.ownerUx.tabs.groups,exact:true,level:2}).waitFor();else await page.getByTestId('owner-training').waitFor();
  await settled(page);assert.equal(await page.getByRole('alert').count(),0);return performance.now()-t;}
 try{
  if(!args.has('--audits-only'))for(const route of args.has('--practice-first-only')?['owner']:['owner','practice'])for(let repeat=0;repeat<plan.repetitions;repeat++)for(const variant of repeat%2?[...variants].reverse():variants){
   const {context,page}=await setup();
   for(const cache of ['cold','warm']){
    await page.goto(`${base}/${variant}/${route}/en`);
    if(route==='owner')await ownerReady(page);else await page.locator('section[aria-labelledby="pos-heading"], [data-phone-app]').first().waitFor();
    const usableMs=await page.evaluate(()=>performance.now()),startup=await resources(page),t=performance.now();
    if(route==='owner'){await page.getByRole('button',{name:messages.en.owner.refresh,exact:true}).click();await ownerReady(page);}else await startPractice(page,messages.en);
    const interactionMs=performance.now()-t;const sample={variant,route,repeat,cache,usableMs,interactionMs,startup};
    if(route==='owner'){
     if(args.has('--practice-first-only')){sample.practiceMs=await tab(page,'practice');sample.practice=await resources(page);snapshots[`${variant}-practice`]=await page.locator('main').textContent();}
     sample.groupsMs=await tab(page,'groups');sample.groups=await resources(page);
     const groupText=await page.locator('main').textContent();snapshots[`${variant}-groups`]=groupText;
     if(args.has('--practice-first-only'))sample.practiceReturnMs=await tab(page,'practice');
     else{sample.practiceMs=await tab(page,'practice');sample.practice=await resources(page);snapshots[`${variant}-practice`]=await page.locator('main').textContent();}
     sample.groupsReturnMs=await tab(page,'groups');sample.total=await resources(page);
    }
    samples.push(sample);
   }
   await context.close();console.error(`Measured ${route}/${variant}/${repeat+1}`);
  }
  if(samples.length)writeFileSync(`${root}/measurements.json`,JSON.stringify({plan,browser:browser.version(),samples,snapshots},null,2));
  if(variants.includes('after')){
   if(samples.length)for(const name of ['groups','practice'])assert.equal(snapshots[`before-${name}`],snapshots[`after-${name}`],`${name} visible parity`);
   for(const after of samples.filter(s=>s.variant==='after')){
    const before=samples.find(s=>s.variant==='before'&&s.route===after.route&&s.repeat===after.repeat&&s.cache===after.cache);
    for(const stage of ['startup','groups','practice','total'])if(before[stage])assert.equal(after[stage].rpcRequests,before[stage].rpcRequests,`${after.route}/${after.cache}/${stage}: no duplicate reads`);
   }
   const axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
   if(!args.has('--practice-first-only'))for(const locale of ['en','ar'])for(const width of [390,1440]){
    const {context,page}=await setup();await page.setViewportSize({width,height:900});await page.goto(`${base}/after/owner/${locale}`);await ownerReady(page);
    const checks=pageChecks(page,axe,(label,ok,detail)=>assert.ok(ok,`${label}: ${detail??''}`),`${locale}/${width}`);
    for(const id of ['students','groups','assess','practice']){
     if(id!=='students'){const link=page.getByRole('link',{name:messages[locale].ownerUx.tabs[id],exact:true});await link.focus();await link.press('Enter');try{await page.getByRole('heading',{name:messages[locale].ownerUx.tabs[id],exact:true,level:2}).waitFor();}catch(e){console.error({locale,width,id,body:await page.locator('body').innerText(),errors,calls:await page.evaluate(()=>window.calls)});throw e;}await settled(page);assert.ok(await link.evaluate(el=>el===document.activeElement),'Loading preserves keyboard focus');}
     await checks.axe(id);await checks.noOverflow(id);audits.push({locale,width,id});console.error(`Audited ${locale}/${width}/${id}`);
    }
    // Literal direct navigation and browser back retain tab selection.
    await page.goto(`${base}/after/owner/${locale}?tab=training`);await page.getByTestId('owner-training').waitFor();await settled(page);
    await page.getByRole('link',{name:messages[locale].ownerUx.tabs.groups,exact:true}).click();await page.goBack();await page.getByTestId('owner-training').waitFor();
    await context.close();
   }
   // A genuine module-network failure is isolated from navigation and the eager stop control.
   if(!args.has('--practice-first-only')){const {context,page,cdp}=await setup();const graph=graphs.find(g=>g.variant==='after'&&g.route==='owner');
   const chunk=Object.entries(graph.metafile.outputs).find(([,v])=>v.entryPoint==='src/features/assess/OwnerAssessPanel.tsx')[0];
   await cdp.send('Network.setBlockedURLs',{urls:['https://*',base+'/'+relative(root,resolve(chunk))]});
   await page.goto(`${base}/after/owner/en?tab=groups`);await page.getByRole('alert').waitFor();
   assert.ok(await page.getByTestId('owner-emergency-button').isVisible());
   await cdp.send('Network.setBlockedURLs',{urls:['https://*']});await page.getByRole('alert').getByRole('link',{name:messages.en.owner.refresh,exact:true}).click();
   await page.getByRole('heading',{name:messages.en.ownerUx.tabs.groups,exact:true,level:2}).waitFor();await settled(page);assert.equal(await page.getByRole('alert').count(),0);
   audits.push({id:'real chunk failure / stop available / native reload recovery'});await context.close();}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outbound,[]);assert.deepEqual(rpcFailures,[]);
  const summaries=[];for(const route of ['owner','practice'])for(const variant of variants)for(const cache of ['cold','warm']){const rows=samples.filter(s=>s.route===route&&s.variant===variant&&s.cache===cache);if(!rows.length)continue;summaries.push({route,variant,cache,usable:summary(rows.map(s=>s.usableMs)),interaction:summary(rows.map(s=>s.interactionMs)),groups:route==='owner'?summary(rows.map(s=>s.groupsMs)):null,practice:route==='owner'?summary(rows.map(s=>s.practiceMs)):null,groupsReturn:route==='owner'?summary(rows.map(s=>s.groupsReturnMs)):null,resources:rows[0]});}
  const output={plan,order:args.has('--practice-first-only')?'Practice first, then Groups, then cached returns':'Groups first, then Practice, then Groups return',browser:browser.version(),staticInventory:staticInventory(),graphs:graphs.map(g=>({variant:g.variant,route:g.route,initialRaw:g.initialRaw,initialGzip:g.initialGzip,allGzip:g.allGzip,rows:g.rows})),summaries,samples,audits,errors,outbound,rpcFailures};
  writeFileSync(`${root}/${args.has('--audits-only')?'audits':args.has('--practice-first-only')?'practice-first':variants.length===1?'baseline':'results'}.json`,JSON.stringify(output,null,2));console.log(JSON.stringify({summaries,audits}));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
export {plan as measurementPlan,summary as summarizeLoading};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(args.has('--describe'))console.log(JSON.stringify(plan));else await main();
}
