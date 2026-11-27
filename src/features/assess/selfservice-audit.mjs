// Synthetic local browser/family audit of mounted S3 entrypoints and actual adapters.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { pageChecks } from '../../../scripts/qa/page-checks.mjs';
const require=createRequire(process.env.RAD105_BROWSER_MANIFEST??'/tmp/rad105-browser/package.json');
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const directory=mkdtempSync(join(tmpdir(),'rad105-s3-audit-'));let server,browser,checks=0,audits=0;
const ok=(label,value,detail='')=>{assert.ok(value,label+' '+detail);checks++;};
try {
 await build({stdin:{contents:`import {practicalSnapshot} from './scripts/assess/e-fixture';console.log(JSON.stringify(practicalSnapshot()));`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(directory,'practical.mjs')});
 const practical=JSON.parse(execFileSync(process.execPath,[join(directory,'practical.mjs')],{encoding:'utf8'}));
 const client=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
  import en from './messages/en.json';import ar from './messages/ar.json';import {SelfServiceSession} from './src/features/assess/selfservice/SelfServiceSession';
  import {selfServiceStrings} from './src/features/assess/selfservice/strings';
  const params=new URLSearchParams(location.search),locale=params.get('locale')==='ar'?'ar':'en';window.text=selfServiceStrings[locale];window.assessUi=(locale==='ar'?ar:en).assess;
  createRoot(document.getElementById('root')).render(<NextIntlClientProvider locale={locale} messages={locale==='ar'?ar:en} timeZone="UTC"><main className="mx-auto max-w-5xl space-y-4 p-4"><h1>Assess — synthetic local audit</h1><SelfServiceSession mode={params.get('mode')??'student'}/></main></NextIntlClientProvider>);
 `},bundle:true,format:'esm',target:'es2022',write:false,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://synthetic.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_test_key_123456"'},plugins:[{name:'synthetic-session',setup(b){
  b.onResolve({filter:/(?:pilot\/(?:SessionGate|client)|supervisor\/P1Session|emergency\/EmergencySession)$/},args=>({path:args.path.split('/').at(-1),namespace:'synthetic'}));
  b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({loader:'ts',contents:args.path==='SessionGate'?`
   export const useSessionAccount=()=>({state:{kind:'signedIn',userId:'00000000-0000-0000-0000-000000000001',displayName:'SYNTHETIC Account Name',consentVersion:'2026-11-02',profile:{status:'approved',role:new URLSearchParams(location.search).get('role')==='owner'?'owner':'participant'}}});export const useOptionalSessionAccount=useSessionAccount;
  `:args.path==='EmergencySession'?`export const useEmergencyAlternate=()=>new URLSearchParams(location.search).get('role')==='alternate';`:args.path==='P1Session'?`export const useSupervisorAppointment=()=>new URLSearchParams(location.search).get('role')==='supervisor';`:`
   const params=new URLSearchParams(location.search),clockCase=params.has('clock'),serverEpoch=Date.parse('2026-11-05T12:00:00Z'),received=performance.now(),iso=n=>new Date((clockCase?serverEpoch+performance.now()-received:Date.now())+n).toISOString(),fixed=n=>new Date(serverEpoch+n).toISOString(),id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');let enabled=false,submitted=false;window.calls=[];
   const names=['quiz_capability_v1','quiz_permissions_v1','quiz_permission_v1','quiz_publish_v1','assignment_schedule_v2','pool_recommendation_v1','extra_time_v1','new_attempt_v1','quiz_close_v1','assignment_close_v2','assignment_status_v1','attempt_eligibility_page_v1','student_exams_page_v1','history_page_v2','selfservice_metadata_page_v1','owner_resume_v1','witness_accept_v1','start_v2','command_v2','read_mixed_session_v2','read_practical_session_v2'];
   const originalFetch=fetch;globalThis.fetch=(input,init)=>String(input)==='https://synthetic.supabase.co/rest/v1/'?Promise.resolve(new Response(JSON.stringify({paths:params.has('unavailable')?{}:Object.fromEntries(names.map(n=>['/rpc/'+n,{}]))}),{status:200})):originalFetch(input,init);
   const envelope=rows=>({version:1,rows,next:null,serverTime:iso(0)});
   const rpc=async(name,args={})=>{
    window.calls.push({name,args});if(name==='consent_v3')return {accepted:true};if(params.has('error'))throw {code:'57014'};
    if(name==='quiz_capability_v1')return params.get('role')==='owner'||enabled;
    if(name==='quiz_permissions_v1')return [{user_id:id(2),all_students:enabled,all_students_key:id(4)}];
    if(name==='quiz_permission_v1'){enabled=args.p_enabled;return null;}
    if(name==='selfservice_metadata_page_v1')return envelope(params.has('empty')?[]:args.p_kind==='versions'?[{id:id(9),name:'SYNTHETIC questions',track:'mixed',durationSeconds:3600}]:[{id:id(5),name:'SYNTHETIC group',track:'mixed',durationSeconds:3600,versionId:id(9),revision:1,audience:'groups',opensAt:clockCase?fixed(-1000):iso(3600000),closesAt:clockCase?fixed(20000):iso(10800000),closedAt:params.has('closed')?iso(0):null}]);
    if(name==='pool_recommendation_v1')return {version:1,selected:2,available:3,recommended:true,defaultWindowSeconds:7200,maxWindowSeconds:604800};
    if(name==='assignment_status_v1')return {counts:{notStarted:1,inProgress:1,submitted:1,graded:1,missed:1},rows:[{userId:id(3),state:'not-started'}],now:iso(0),opensAt:clockCase?fixed(-1000):iso(3600000),closesAt:clockCase?fixed(20000):iso(10800000),closed:params.has('closed')};
    if(name==='attempt_eligibility_page_v1')return envelope([{sessionId:id(6),studentId:id(3),eligible:false,reason:'unknown-history',serverTime:iso(0)},{sessionId:id(7),studentId:id(3),eligible:true,reason:'eligible',serverTime:iso(0)}]);
    if(name==='student_exams_page_v1'){
     if(params.has('loading'))return new Promise(()=>{});if(params.has('empty'))return envelope([]);
     const base={name:'SYNTHETIC',track:params.get('family')==='full-practical'?'full-practical':'mixed',audience:'all-students',opensAt:iso(-3600000),closesAt:iso(3600000),closed:false,sessionId:null,state:null,deadline:null,expiresAt:null,held:false,resultReady:false,grading:false,replacementGranted:false};
     if(clockCase)return envelope([{...base,id:id(1),name:'Clock upcoming',opensAt:fixed(10000),closesAt:fixed(20000)},{...base,id:id(2),name:'Clock active',sessionId:id(30),state:'active',deadline:fixed(15000),closesAt:fixed(20000)}]);
     const rows=[{...base,id:id(1),name:'Upcoming',opensAt:iso(1800000)},{...base,id:id(2),name:'Open'},{...base,id:id(3),name:'Active',sessionId:id(30),state:'active',deadline:iso(1800000)},{...base,id:id(4),name:'Submitted',sessionId:id(31),state:'grading'},{...base,id:id(5),name:'Grading',sessionId:id(32),state:'grading',grading:true},{...base,id:id(6),name:'Graded',sessionId:id(33),state:'graded',resultReady:true,expiresAt:iso(86400000)},{...base,id:id(7),name:'Missed',closesAt:iso(-1)},{...base,id:id(8),name:'Expired',sessionId:id(34),state:'active',deadline:iso(-1)},{...base,id:id(9),name:'Cancelled',closed:true},{...base,id:id(10),name:'Held',sessionId:id(35),state:'grading-failed',held:true}];return envelope(params.has('family')?[rows[1]]:rows);
    }
    if(name==='history_page_v2')return {rows:[{name:'SYNTHETIC',track:'mixed',submittedAt:new Date().toISOString(),grade:{visibility:'hidden'}}],next:null};
    if(name==='owner_resume_v1')return {released:0,stillHeld:2,heldActive:1,gateOpen:true,loginEnabled:true};
    if(name==='witness_accept_v1')return {epoch:id(40),acceptedAt:iso(0)};
    if(name==='quiz_publish_v1')return args.p_operation;
    if(name==='assignment_schedule_v2')return args.p_revision+1;
    if(['extra_time_v1','new_attempt_v1','quiz_close_v1','assignment_close_v2'].includes(name))return null;
    if(name==='start_v2')return {attemptId:id(30)};
    if(name==='command_v2'){if(args.p_action.type==='submit')submitted=true;return null;}
    if(name.startsWith('read_')){
     const ack={revision:0,operationId:'',serverTime:iso(0),deadline:iso(1800000),state:submitted?'grading':'active',lockedItemIds:[]};
     if(submitted)return {attemptId:id(30),ack};
     if(name==='read_practical_session_v2'){const raw=${JSON.stringify(practical)};return {...raw,attemptId:id(30),ack,assessment:{...raw.assessment,schemaVersion:2,items:raw.assessment.items.map(i=>({...i,schemaVersion:2}))}};}
     const items=[{schemaVersion:2,ref:{id:'q',version:'1'},type:'single-choice',contentLanguage:'en',prompt:'SYNTHETIC question',options:[{id:'b',text:'B'},{id:'a',text:'A'}]}];
     if(params.get('family')==='mixed')items.push({schemaVersion:2,ref:{id:'p',version:'1'},type:'simulator-part',contentLanguage:'en',prompt:'SYNTHETIC distance',presentation:{controls:['sidCm'],sceneElements:[]}});
     return {attemptId:id(30),ack,assessment:{schemaVersion:2,ref:{id:id(9),version:'1'},name:'SYNTHETIC',track:'mixed',maximum:'2',policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:'hidden'},items},answers:{},views:params.get('family')==='mixed'?{p:{controls:{sidCm:{kind:'number',min:100,max:200}},initial:{sidCm:180},sceneValues:{}}}:{}};
    }throw Error('Unexpected synthetic RPC '+name);
   };
   const client={schema:()=>({rpc:(name,args)=>{const promise=Promise.resolve().then(()=>rpc(name,args)).then(data=>({data,error:null}),error=>({data:null,error}));promise.retry=()=>promise;promise.abortSignal=()=>promise;return promise;}}),auth:{getSession:async()=>({data:{session:{access_token:'synthetic'}}})}};
   export const getPilotClient=()=>Promise.resolve(client);
  `}));
 }}]});
 writeFileSync(join(directory,'app.js'),client.outputFiles[0].contents);
 const css=await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:resolve('src/app/globals.css')});writeFileSync(join(directory,'app.css'),css.css);
 server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(['/app.js','/app.css'].includes(path)){res.setHeader('content-type',path.endsWith('.js')?'text/javascript':'text/css');res.end(readFileSync(join(directory,path.slice(1))));return;}const ar=new URL(req.url,'http://localhost').searchParams.get('locale')==='ar';res.setHeader('content-type','text/html;charset=utf-8');res.end('<!doctype html><html lang="'+(ar?'ar':'en')+'" dir="'+(ar?'rtl':'ltr')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local S3 audit</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
 for(const locale of ['en','ar'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',route=>{assert.equal(new URL(route.request().url()).origin,base,'external request forbidden');return route.continue();});
  const go=async query=>{await page.goto(base+'/?locale='+locale+'&'+query);await page.waitForFunction(()=>!!window.text);return page.evaluate(()=>window.text);};
  const audit=async label=>{if(process.env.RAD105_AUDIT_LABELS&&!process.env.RAD105_AUDIT_LABELS.split(',').includes(label))return;const c=pageChecks(page,axe,ok,locale+'/'+width);await c.axe(label);await c.noOverflow(label);await page.screenshot({path:'/tmp/rad105-s3-'+locale+'-'+width+'-'+label+'.jpg',fullPage:true,type:'jpeg',quality:75});audits++;};
  if(process.env.RAD105_CLOCK_ONLY==='1'){
   await page.clock.install({time:new Date('2026-11-05T13:00:00Z')});
   let s=await go('mode=student&clock');await page.locator('[data-state=upcoming]').waitFor();await audit('clock-upcoming');
   const reads=await page.evaluate(()=>window.calls.length);
   await page.clock.runFor(10000);await page.locator('[data-state=open]').waitFor();await audit('clock-open');
   await page.clock.setSystemTime(new Date('2026-11-06T12:00:00Z'));await page.clock.runFor(5000);await page.locator('[data-state=expired]').waitFor();await audit('clock-expired');
   await page.clock.setSystemTime(new Date('2026-11-04T12:00:00Z'));await page.clock.runFor(5000);await page.locator('[data-state=missed]').waitFor();await audit('clock-missed');
   ok('list clock has no RPC refresh/write',await page.evaluate(n=>window.calls.length===n,reads));
   s=await go('mode=manage&role=owner&clock');await page.getByRole('button',{name:'SYNTHETIC questions',exact:true}).click();await page.locator('[data-testid=selfservice-schedule]').waitFor();await audit('clock-publish');
   await page.clock.setSystemTime(new Date('2026-11-06T12:00:00Z'));await page.getByRole('button',{name:s.publish,exact:true}).click();
   await page.waitForFunction(()=>window.calls.some(c=>c.name==='quiz_publish_v1'));ok('one deliberate publish under wall skew',await page.evaluate(()=>window.calls.filter(c=>c.name==='quiz_publish_v1').length===1));
   await page.getByRole('button',{name:'SYNTHETIC group — '+s.group,exact:true}).click();await page.locator('[data-testid=selfservice-schedule]').waitFor();await audit('clock-assignment');
   const before=await page.evaluate(()=>window.calls.length);await page.clock.runFor(20000);await page.locator('[data-testid=selfservice-schedule]').waitFor({state:'detached'});
   ok('window close disables extra time',await page.getByRole('button',{name:s.saveExtra,exact:true}).isDisabled());ok('window close disables close',await page.getByRole('button',{name:s.close,exact:true}).isDisabled());ok('window close disables grant',await page.getByRole('button',{name:s.grant,exact:true}).isDisabled());await audit('clock-readonly');
   ok('window clock issues no RPC',await page.evaluate(n=>window.calls.length===n,before));ok('no clock runtime errors',errors.length===0,errors.join(';'));await context.close();continue;
  }
  let s=await go('mode=manage&role=owner');await page.getByRole('heading',{name:s.permissions,exact:true}).waitFor();await audit('owner');
  await page.getByRole('button',{name:s.allow,exact:true}).click();await page.getByRole('button',{name:s.revoke,exact:true}).waitFor();await page.getByRole('button',{name:s.revoke,exact:true}).click();await page.getByRole('button',{name:s.allow,exact:true}).waitFor();
  await page.getByRole('button',{name:'SYNTHETIC questions',exact:true}).click();await page.locator('[data-testid=selfservice-schedule]').waitFor();await audit('publish');
  await page.getByRole('button',{name:'SYNTHETIC group — '+s.group,exact:true}).click();await page.getByRole('heading',{name:s.attempts,exact:true}).waitFor();ok('only proven hold gets grant',await page.getByRole('button',{name:s.grant,exact:true}).count()===1);await audit('assignment');
  s=await go('mode=manage&role=owner&closed');await page.getByRole('button',{name:'SYNTHETIC group — '+s.group,exact:true}).click();await page.getByRole('heading',{name:s.attempts,exact:true}).waitFor();ok('closed assignment cannot schedule',await page.getByRole('button',{name:s.schedule,exact:true}).count()===0);await audit('closed-assignment');
  s=await go('mode=manage&role=supervisor');await page.getByRole('heading',{name:s.manage,exact:true,level:2}).waitFor();ok('supervisor lacks permission',await page.getByRole('button',{name:'SYNTHETIC questions',exact:true}).count()===0);await audit('supervisor');
  s=await go('mode=student');await page.locator('[data-testid=selfservice-exams]').waitFor();for(const state of ['upcoming','open','in-progress','submitted','grading','graded','missed','expired','cancelled','unavailable'])ok('student '+state,await page.locator('[data-state="'+state+'"]').count()===1);await audit('student-states');
  for(const state of ['empty','loading','error','unavailable']){await go('mode=student&'+state);await page.getByRole(state==='error'?'alert':'status').last().waitFor();await audit('student-'+state);if(state==='unavailable')ok('no missing RPC call',await page.evaluate(()=>window.calls.every(c=>c.name==='consent_v3')));}
  await go('mode=recovery&role=participant');ok('ordinary participant has no recovery',await page.locator('[data-testid=selfservice-recovery]').count()===0);
  s=await go('mode=recovery&role=alternate');await page.getByRole('heading',{name:s.recovery,exact:true}).waitFor();ok('alternate no restore',await page.getByRole('button',{name:s.acceptAction,exact:true}).count()===0);await page.getByRole('textbox').fill('resume assess');ok('typed negative',await page.getByRole('button',{name:s.resumeAction,exact:true}).isDisabled());await page.getByRole('textbox').fill('RESUME ASSESS');await page.getByRole('button',{name:s.resumeAction,exact:true}).click();await audit('alternate');
  s=await go('mode=recovery&role=owner');await page.getByRole('button',{name:s.acceptAction,exact:true}).waitFor();await audit('owner-recovery');
  await go('mode=history');await page.locator('[data-testid=assess-history]').waitFor();await audit('history');
  for(const family of ['questions','mixed','full-practical']){s=await go('mode=student&family='+family);await page.getByRole('button',{name:s.start,exact:true}).click();await page.locator('[data-testid="'+(family==='full-practical'?'assess-practical-runner':'assess-runner')+'"]').waitFor();await page.locator('article').waitFor();await audit('family-'+family);if(family==='mixed'){await page.getByRole('button',{name:'2',exact:true}).click();await page.getByRole('heading',{name:'SYNTHETIC distance',exact:true}).waitFor();await audit('family-mixed-controls');}}
  ok('no runtime errors',errors.length===0,errors.join(';'));await context.close();
 }
 console.log(JSON.stringify({result:'PASS',checks,audits,localSynthetic:true,production:false}));
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));rmSync(directory,{recursive:true,force:true});}
