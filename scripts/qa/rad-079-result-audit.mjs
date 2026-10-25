// RAD-079: real workspace, ConsentGate and AttemptSaveNote with synthetic account transport.
// Run --before on the base, then without it after edits. No external service or hosted preview.
import assert from 'node:assert/strict';
import {startPractice} from './workspace.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const before=process.argv.includes('--before');
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require=createRequire(process.env.QA_MANIFEST??'/tmp/rad079-qa/package.json');
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
import {scenarioSettings,SCENARIOS} from './src/features/qa/scenario-matrix';
import {CASES} from './src/data/cases';
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
 window.__case=kind=>{const store=useSimulationStore.getState(),c=CASES.find(c=>c.id==='chest-pa-erect');const settings=kind==='below'?{...c.initialSettings}:scenarioSettings(SCENARIOS.find(s=>s.id==='correct'),c);if(kind==='critical')settings.sideMarker=null;useSimulationStore.setState({settings});useSimulationStore.getState().expose();return useSimulationStore.getState().result.score;};
 window.__ready=()=>!!useSimulationStore.getState().settings;window.__result=()=>{useSimulationStore.getState().expose();};window.__save=status=>savedAttempt.set(status?{id:'synthetic-attempt',status}:null);
};
`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://vlacestfruxooznrcjqc.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_test_123456"'},plugins:[{name:'synthetic-transport',setup(b){
 b.onResolve({filter:/(^\.\/client$|i18n\/navigation|next\/navigation)$/},args=>({path:args.path==='./client'?'client':args.path==='next/navigation'?'nextnav':'navigation',namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
}}]});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const dir='/tmp/rad079-audit';mkdirSync(dir,{recursive:true});let checks=0,axes=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};
async function audit(page,label){await page.evaluate(axe);const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);axes++;ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');}
async function mount(locale,width,theme,extra={}){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];let external=0;
 await context.route('**/*',async route=>{if(route.request().url().startsWith('http://rad079.test/'))await route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}" data-theme="${theme}"><head><title>RAD-079 synthetic audit</title></head><body><div id="fixture"></div></body></html>`});else {external++;await route.abort();}});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(extra.feedback?`http://rad079.test/${locale}/feedback`:extra.recovery?`http://rad079.test/${locale}/account#access_token=synthetic&type=recovery`:`http://rad079.test/${locale}/xray/chest-pa-erect/practice?case=one#result`);
 await page.addStyleTag({content:css});await page.evaluate(m=>{window.__messages=m;},messages[locale]);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(c=>window.mount(c),{locale,...extra});
 return {context,page,errors,network:()=>external};
}
try {
 for(const locale of ['en','ar'])for(const width of [390,1440])for(const theme of ['dark','light']) {
  const tag=locale+'-'+width+'-'+theme,m=messages[locale];console.log(tag);
  for(const kind of ['critical','below','pass']) {
   const r=await mount(locale,width,theme,{current:true,result:true}),p=r.page;
   await p.waitForFunction(()=>window.__ready());await startPractice(p,m);
   const score=await p.evaluate(k=>window.__case(k),kind);
   await p.locator('#result-heading').waitFor();await p.evaluate(()=>document.fonts.ready);
   ok(kind==='critical'?score.total===100&&!score.passed&&score.thresholdMet:kind==='below'?!score.passed&&!score.thresholdMet:score.passed,tag+' '+kind+' actual score');
   const expected=kind==='pass'?m.result.passed:kind==='critical'&&!before?m.result.criticalFailed:m.result.failed;
   ok(await p.locator('#result-heading').textContent()===expected,tag+' '+kind+' header');
   const status=p.locator('section[aria-labelledby="result-heading"] > [role="status"]');
   if(!before) {
    const explanation=m.result.criticalFailSummary.replace('{total}',String(score.total));
    ok(kind==='critical'?await status.getByText(explanation,{exact:true}).count()===1:await status.getByText(explanation,{exact:true}).count()===0,tag+' conditional explanation');
    const label=locale==='en'?'Side marker (not part of the score, but a critical error)':'علامة الجانب (لا تدخل في الدرجة، لكنها خطأ حرج)';
    const marker=p.locator('button').filter({hasText:label});
    ok(await marker.count()===1,tag+' marker label');ok(!(await marker.textContent()).includes(m.result.notScored),tag+' no duplicate not-scored suffix');
   }
   await p.getByTestId('attempt-not-saved').waitFor();ok(true,'unsaved note retained');
   await audit(p,tag+' '+kind);
   await status.screenshot({path:dir+'/'+(before?'before':'after')+'-'+tag+'-'+kind+'.jpg',type:'jpeg',quality:80});
   await p.evaluate(()=>window.__save('saved'));await p.getByTestId('attempt-not-saved').waitFor({state:'hidden'});ok(true,'saved note clears');
   ok(r.errors.length===0,'no page errors');ok(r.network()===0,'no external network');await r.context.close();
  }
  // Outdated consent still hides the result until the existing acceptance action succeeds.
  const gate=await mount(locale,width,theme,{current:false,result:true}),p=gate.page;
  await p.getByTestId('consent-gate').waitFor();ok(await p.locator('#result-heading').count()===0,'consent hides result');
  await p.getByRole('checkbox').check();await p.getByRole('button',{name:m.account.consent.accept,exact:true}).click();
  await p.getByTestId('consent-gate').waitFor({state:'hidden'});await p.waitForFunction(()=>window.__ready());await startPractice(p,m);
  await p.evaluate(()=>window.__case('critical'));await p.locator('#result-heading').waitFor();ok(true,'result returns after consent');
  ok(gate.errors.length===0&&gate.network()===0,'gate without errors or external network');await gate.context.close();
 }
 writeFileSync(dir+'/'+(before?'before':'after')+'-results.json',JSON.stringify({checks,axes,locales:['en','ar'],widths:[390,1440],themes:['dark','light'],cases:['critical','below','pass'],externalRequests:0},null,2));
 console.log(JSON.stringify({before,checks,axes,artifacts:dir}));
}finally{await browser.close();}
