// Actual provider/account actions/gate and result workspace; synthetic transport only, no hosted preview.
import assert from 'node:assert/strict';
import {startPractice} from './workspace.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require=createRequire(process.env.QA_MANIFEST??'/tmp/rad078-qa/package.json');
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`))]));
const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
const mocks={
 client:`export const getPilotClient=()=>Promise.resolve(window.__client);`,
 navigation:`import React from 'react';export const Link=({href,locale,children,...props})=><a {...props} href={'/'+window.__locale+href}>{children}</a>;export const usePathname=()=>window.location.pathname.replace(/^\\/(en|ar)/,'')||'/';export const useRouter=()=>({replace:()=>{}});`,
 nextnav:`export const useSearchParams=()=>new URLSearchParams(location.search);export const usePathname=()=>location.pathname;export const useRouter=()=>({replace:p=>{window.__redirect=p;}});`,
};
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import {SessionProvider,SessionGate} from './src/features/pilot/SessionGate';import {ConsentGate} from './src/features/pilot/ConsentGate';
import {FeedbackContent} from './src/features/pilot/FeedbackContent';import {AppShell} from './src/components/shell/AppShell';import {AccountPanel} from './src/features/pilot/AccountPanel';import {SimulationWorkspace} from './src/features/simulation/SimulationWorkspace';
import {useSimulationStore} from './src/stores/simulation-store';import {savedAttempt} from './src/features/pilot/saved-attempt';import {CONSENT_VERSION} from './src/features/pilot/consent';
const root=createRoot(document.getElementById('fixture'));
window.mount=config=>{
 window.__locale=config.locale;window.__calls=[];window.__redirect=null;window.__seenApp=false;
 let row={status:config.status??'approved',role:config.role??'participant',participant_code:'P-synthetic',display_name:'Synthetic',consent_version:config.current?CONSENT_VERSION:'2020-01-01'};
 let session=config.out?null:{user:{id:'synthetic-user',email:'synthetic@example.test'}};let notify;
 window.__client={auth:{getSession:async()=>{if(config.recovery)history.replaceState(null,'',location.pathname+location.search);return {data:{session}};},onAuthStateChange:cb=>{notify=cb;return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{window.__calls.push({action:'signOut'});session=null;notify?.('SIGNED_OUT',null);return {error:null};}},rpc:async(name,args)=>{window.__calls.push({rpc:name,args});return name==='participant_survey_v1'?{data:{pending:null},error:null}:{error:null};},from:table=>{
  const query={select:()=>query,limit:()=>query,eq:asyncEq,maybeSingle:async()=>{if(config.delay)await new Promise(r=>window.__release=r);return {data:row,error:null};},insert:async data=>{window.__calls.push({table,insert:true});return {error:table==='attempts'?{code:'synthetic-save-failed'}:null};},update:data=>{window.__calls.push({table,data});query.updateData=data;return query;}};
  function asyncEq(){if(query.updateData){if(config.failAccept)return Promise.resolve({error:{code:'synthetic-failure'}});row={...row,...query.updateData};return Promise.resolve({error:null});}return query;}
  return query;
 }};
 const observer=new MutationObserver(()=>{if(document.querySelector('[data-testid="app-content"]'))window.__seenApp=true;});observer.observe(document.getElementById('fixture'),{childList:true,subtree:true});
 root.render(<NextIntlClientProvider locale={config.locale} messages={window.__messages} timeZone="UTC"><SessionProvider><ConsentGate><AppShell><main id="main-content"><SessionGate>{config.feedback?<div className="platform-page space-y-4 p-4"><h1>{window.__messages.c2.feedback}</h1><FeedbackContent/></div>:config.account?<AccountPanel/>:config.result?<SimulationWorkspace caseId="chest-pa-erect"/>:<div data-testid="app-content"><h1>Synthetic original page</h1></div>}</SessionGate></main></AppShell></ConsentGate></SessionProvider></NextIntlClientProvider>);
 window.__ready=()=>!!useSimulationStore.getState().settings;window.__result=()=>{useSimulationStore.getState().expose();};window.__save=status=>savedAttempt.set(status?{id:'synthetic-attempt',status}:null);
};
`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://vlacestfruxooznrcjqc.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_test_123456"'},plugins:[{name:'synthetic-transport',setup(b){
 b.onResolve({filter:/(^\.\/client$|i18n\/navigation|next\/navigation)$/},args=>({path:args.path==='./client'?'client':args.path==='next/navigation'?'nextnav':'navigation',namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
}}]});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const dir='/tmp/rad078-audit';mkdirSync(dir,{recursive:true});let checks=0,axes=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};
async function audit(page,label){await page.evaluate(axe);const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);axes++;ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');}
async function mount(locale,width,theme,extra={}){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];let external=0;
 await context.route('**/*',async route=>{if(route.request().url().startsWith('http://rad078.test/'))await route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}" data-theme="${theme}"><head><title>RAD-078 synthetic audit</title></head><body><div id="fixture"></div></body></html>`});else {external++;await route.abort();}});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(extra.feedback?`http://rad078.test/${locale}/feedback`:extra.recovery?`http://rad078.test/${locale}/account#access_token=synthetic&type=recovery`:`http://rad078.test/${locale}/xray/chest-pa-erect/practice?case=one#result`);
 await page.addStyleTag({content:css});await page.evaluate(m=>{window.__messages=m;},messages[locale]);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(c=>window.mount(c),{locale,...extra});
 return {context,page,errors,network:()=>external};
}
try{
 if(!process.argv.includes('--flow-only')) for(const locale of ['en','ar'])for(const width of [390,1440])for(const theme of ['dark','light']){
  const tag=locale+'-'+width+'-'+theme,m=messages[locale];console.log(tag);
  const s=await mount(locale,width,theme,{delay:true}),p=s.page,url=p.url();
  await p.getByRole('status').waitFor();ok(!await p.getByTestId('app-content').count(),'loading hides app');await p.evaluate(()=>window.__release());
  await p.getByTestId('consent-gate').waitFor();await p.evaluate(()=>document.fonts.ready);ok(!await p.evaluate(()=>window.__seenApp),'no app flash before consent');
  await audit(p,tag+' gate');await p.screenshot({path:dir+'/'+tag+'-gate.jpg',type:'jpeg',quality:78,fullPage:false});
  ok(await p.getByRole('link',{name:m.account.termsLink,exact:true}).getAttribute('href')===`/${locale}/terms`,'localized Terms link');
  for(const [section,count] of [['keep',4],['why',3],['who',2],['protect',1],['howLong',4],['rights',3],['patients',6]])for(let i=1;i<=count;i++)ok(await p.getByText(m.terms[section]['p'+i],{exact:true}).count()===1,'Terms paragraph preserved');
  const accept=p.getByRole('button',{name:m.account.consent.accept,exact:true});ok(await accept.isDisabled(),'explicit agreement required');await p.getByRole('checkbox').check();await accept.click();await p.getByTestId('app-content').waitFor();ok(p.url()===url,'same destination');
  ok(await p.evaluate(()=>window.__calls.some(c=>c.table==='profiles'&&c.data.consent_version==='2026-10-24'&&typeof c.data.consented_at==='string')),'actual existing accept action');ok(s.errors.length===0,'no page errors');ok(s.network()===0,'no external network');await s.context.close();
  const r=await mount(locale,width,theme,{current:true,result:true}),q=r.page;
  await q.waitForFunction(()=>window.__ready());await startPractice(q,m);
  await q.evaluate(()=>window.__result());await q.getByTestId('attempt-not-saved').waitFor();await q.evaluate(()=>window.__save('unavailable'));await q.evaluate(()=>document.fonts.ready);
  await audit(q,tag+' result note');await q.getByTestId('attempt-not-saved').screenshot({path:dir+'/'+tag+'-note.jpg',type:'jpeg',quality:78});
  ok(await q.getByTestId('attempt-not-saved').textContent()===m.result.attemptNotSaved,'localized not-saved note');await q.evaluate(()=>window.__save('saved'));await q.waitForFunction(()=>!document.querySelector('[data-testid="attempt-not-saved"]'));ok(true,'confirmed save removes note');ok(r.errors.length===0,'result no page errors');ok(r.network()===0,'result no external requests');await r.context.close();
 }
 if(!process.argv.includes('--flow-only'))for(const locale of ['en','ar'])for(const width of [390,1440])for(const theme of ['dark','light'])for(const role of ['participant','owner']){
  const s=await mount(locale,width,theme,{feedback:true,current:true,role}),p=s.page,m=messages[locale];
  await p.getByText(role==='owner'?m.c2.ownerFeedback:m.c2.noPending,{exact:true}).waitFor();await p.evaluate(()=>document.fonts.ready);
  await audit(p,`${locale}-${width}-${theme} feedback ${role}`);
  if(role==='owner'){ok(await p.getByRole('link',{name:m.c2.ownerPanel,exact:true}).getAttribute('href')===`/${locale}/owner`,'localized owner panel link');ok(await p.evaluate(()=>window.__calls.every(c=>c.rpc!=='participant_survey_v1')),'owner does not read participant surveys');}
  else {ok(await p.evaluate(()=>window.__calls.filter(c=>c.rpc==='participant_survey_v1').length)===1,'existing participant reader only');ok(await p.locator('form').count()===0,'no empty survey form');}
  await p.getByTestId(role==='owner'?'owner-feedback':'c2-survey').screenshot({path:dir+`/${locale}-${width}-${theme}-feedback-${role}.jpg`,type:'jpeg',quality:78});ok(s.errors.length===0,'feedback no page errors');ok(s.network()===0,'feedback no external requests');await s.context.close();
 }
 // Role/status parity, retry and real sign-out, including public Terms.
 for(const role of ['participant','owner'])for(const status of ['pending','approved','suspended']){
  const s=await mount('en',390,'dark',{role,status,failAccept:true}),p=s.page;
  await p.getByTestId('consent-gate').waitFor();ok(!await p.getByTestId('app-content').count(),role+' '+status+' blocked');
  await p.getByRole('checkbox').check();await p.getByRole('button',{name:messages.en.account.consent.accept,exact:true}).click();await p.getByRole('alert').waitFor();ok(await p.getByTestId('consent-gate').count()===1,'failure remains gated');
  await p.getByRole('button',{name:messages.en.account.signOut,exact:true}).click();await p.waitForFunction(()=>!document.querySelector('[data-testid="consent-gate"]'));ok(await p.evaluate(()=>window.__calls.some(c=>c.action==='signOut')),'real sign-out action');await p.waitForFunction(()=>window.__redirect?.includes('/account?returnTo='));ok(true,'existing signed-out account flow');ok(s.errors.length===0,'sign-out no errors');await s.context.close();
 }
 for(const locale of ['en','ar']){const s=await mount(locale,390,'dark',{account:true,recovery:true}),p=s.page;await p.getByTestId('consent-gate').waitFor();ok(!p.url().includes('access_token'),'synthetic Auth consumed recovery hash');await p.getByRole('checkbox').check();await p.getByRole('button',{name:messages[locale].account.consent.accept,exact:true}).click();await p.getByTestId('reset-form').waitFor();ok(true,'recovery form survives consent and consumed hash');ok(s.errors.length===0,'recovery no errors');await s.context.close();}
 writeFileSync(dir+(process.argv.includes('--flow-only')?'/flow-results.json':'/results.json'),JSON.stringify({checks,axes,locales:['en','ar'],widths:[390,1440],themes:['dark','light'],externalRequests:0},null,2));console.log(JSON.stringify({checks,axes,artifacts:dir}));
}finally{await browser.close();}
