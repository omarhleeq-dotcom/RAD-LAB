// Local fixture-only owner matrix. No live project or hosted previews.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const qaRequire=createRequire(process.env.QA_MANIFEST??'/tmp/rad069-qa/package.json');
const {chromium}=qaRequire('playwright');
import {startServer} from '../preview/serve-out.mjs';
const SUPA='https://abcdefghijklmnop.supabase.co',OWNER='00000000-0000-0000-0000-000000000001';
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`))]));
const AXE=readFileSync(qaRequire.resolve('axe-core/axe.min.js'),'utf8');
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const user={id:OWNER,aud:'authenticated',role:'authenticated',email:'owner@example.test',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const session={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:OWNER,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'fixture',token_type:'bearer',expires_at:4102444800,expires_in:3600,user};
const fixtures=n=>Array.from({length:n},(_,i)=>({user_id:i===0?OWNER:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,name:`Fixture Trainee ${i+1}`,participant_code:`P-${String(i).padStart(32,'0')}`,email:i===0?user.email:`fixture${i+1}@example.test`,role:i===0?'owner':'participant',status:i===0?'approved':i%3===0?'suspended':i%3===1?'pending':'approved',email_confirmed:true,created_at:'2026-01-01T00:00:00Z',last_seen_at:'2026-10-23T10:00:00Z',last_event_at:null}));
const rank=s=>({pending:0,approved:1,suspended:2})[s];
const result={total:80,passed:true,thresholdMet:true,primaryVariant:'ideal',critical:[],categories:[],checks:[]};
const attempt={id:'10000000-0000-0000-0000-000000000001',user_id:OWNER,participant_code:fixtures(1)[0].participant_code,attempt_no:1,exam_id:'chest-pa-erect',case_id:'default',definition_version:'fixture',settings:{},result,locale:'en',started_at:'2026-10-16T21:10:00Z',finished_at:'2026-10-16T21:20:00Z'};
const notes=[{id:'1',user_id:OWNER,participant_code:attempt.participant_code,exam_id:attempt.exam_id,attempt_id:attempt.id,attempt_no:1,text:'ملاحظة تدريب اصطناعية 17 Oct',at:'2026-10-16T21:30:00Z'},{id:'2',user_id:OWNER,participant_code:attempt.participant_code,exam_id:attempt.exam_id,attempt_id:null,attempt_no:null,text:'Fixture note 24 Oct',at:'2026-10-24T20:59:00Z'}];
const {server,port}=await startServer('out',0),BASE=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
let checks=0,axes=0;const heights=[];const ok=(v,m)=>{assert.ok(v,m);checks++;};
mkdirSync('/tmp/rad069c1',{recursive:true});
async function setup(loc,w,theme,n=12,legacy=false,role='owner'){
 const context=await browser.newContext({viewport:{width:w,height:w===390?844:900},locale:loc,timezoneId:'Asia/Amman',acceptDownloads:true});
 await context.addInitScript(({session,theme})=>{localStorage.setItem('sb-abcdefghijklmnop-auth-token',JSON.stringify(session));localStorage.setItem('radlab-theme',theme);},{session,theme});
 const rows=fixtures(n),reads=[],writes=[];
 await context.route(`${SUPA}/**`,async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  const json=(status,body)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(path.startsWith('/auth/v1/user'))return json(200,user);
  if(path==='/rest/v1/profiles'){
   if(req.method()==='HEAD')return route.fulfill({status:200,headers:{...headers,'content-range':`*/${rows.filter(p=>new URL(req.url()).searchParams.get('status')===`eq.${p.status}`).length}`}});
   return json(200,{status:'approved',role,participant_code:rows[0].participant_code,consent_version:'2026-10-17',display_name:'Fixture Owner'});
  }
  if(path.endsWith('/rpc/owner_dashboard_v1')){
   const a=req.postDataJSON();reads.push(a);
   if(legacy)return json(404,{code:'PGRST202'});
   if(a.p_view==='summary')return json(200,{version:1,boundary:'2026-10-25T00:00:00Z',rows:[{exam:attempt.exam_id,attempts:1,passed:1,known:1,wrong:[]}],next:null,counts:null});
   let filtered=rows.filter(p=>(!a.p_search||`${p.name} ${p.email}`.toLowerCase().includes(a.p_search.toLowerCase()))&&(!a.p_status||a.p_status===p.status));
   const searched=rows.filter(p=>!a.p_search||`${p.name} ${p.email}`.toLowerCase().includes(a.p_search.toLowerCase()));
   filtered.sort((a,b)=>rank(a.status)-rank(b.status)||a.user_id.localeCompare(b.user_id));
   if(a.p_cursor)filtered=filtered.filter(p=>rank(p.status)>+a.p_cursor.rank||(rank(p.status)===+a.p_cursor.rank&&p.user_id>a.p_cursor.id));
   const more=filtered.length>a.p_limit;filtered=filtered.slice(0,a.p_limit);const last=filtered.at(-1);
   return json(200,{version:1,boundary:'2026-10-25T00:00:00Z',counts:Object.fromEntries(['pending','approved','suspended'].map(s=>[s,searched.filter(p=>p.status===s).length])),rows:filtered,next:more?{id:last.user_id,rank:String(rank(last.status))}:null});
  }
  if(path.endsWith('/rpc/training_page_v1_with_comparison')){
   const a=req.postDataJSON();reads.push(a);let found=rows.filter(p=>(!a.p_search||`${p.name} ${p.email}`.toLowerCase().includes(a.p_search.toLowerCase()))&&(!a.p_status||a.p_status===p.status)&&(!a.p_cursor?.id||p.user_id>a.p_cursor.id));
   const more=found.length>20;found=found.slice(0,20);
   return json(200,{version:1,boundary:'2026-10-25T00:00:00Z',summary:null,rows:found.map(p=>({id:p.user_id,name:p.name,email:p.email,status:p.status,attempts:0,exams:0,latest:null})),next:more?{id:found.at(-1).user_id}:null});
  }
  if(path.endsWith('/rpc/owner_page_v1')&&req.headers()['accept-profile']!=='assess'){
   const a=req.postDataJSON();reads.push(a);const stamp=a.p_stream==='notes'?'at':a.p_stream==='attempts'?'finished_at':'created_at';
   let found=(a.p_stream==='participants'?rows:a.p_stream==='notes'?notes:[attempt]).filter(r=>(!a.p_participant||r.user_id===a.p_participant)&&(!a.p_exam||r.exam_id===a.p_exam)&&(!a.p_from||Date.parse(r[stamp])>=Date.parse(a.p_from))&&(!a.p_to||Date.parse(r[stamp])<=Date.parse(a.p_to)));
   found.sort((a,b)=>Date.parse(b[stamp])-Date.parse(a[stamp])||String(a.id??a.user_id).localeCompare(String(b.id??b.user_id)));
   const total=found.length;found=found.slice(0,a.p_limit).map(r=>({...r}));if(a.p_export)found.forEach(r=>delete r.user_id);
   return json(200,{version:1,boundary:'2026-10-25T00:00:00Z',total,pending:0,rows:found,next:null});
  }
  if(path.endsWith('/rpc/owner_page_v1'))return json(200,{version:1,rows:[],next:null});
  if(path.endsWith('/rpc/content_page_v1'))return json(200,{version:1,rows:[],next:null});
  if(path.endsWith('/rpc/set_participant_status')){const a=req.postDataJSON();writes.push(a);const p=rows.find(r=>r.user_id===a.target);if(p)p.status=a.new_status;return route.fulfill({status:204,headers});}
  if(!['/rest/v1/events','/rest/v1/rpc/touch_last_seen'].includes(path))writes.push(path);
  return route.fulfill({status:204,headers});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${BASE}/${loc}/owner`,{waitUntil:'networkidle'});return {context,page,reads,writes,errors,rows};
}
async function axe(page,tag){await page.evaluate(AXE);const v=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(v.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[],tag);axes++;ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${tag} overflow`);}
// Render the original main OwnerPanel and OwnerActivity with fixture hooks, same CSS and shell.
// This measures the original React markup; API/auth are replaced, as in all fixture audits.
const baselineEntry=`import React from 'react';import {createRoot} from 'react-dom/client';import {OwnerPanel} from 'legacy:panel';window.renderLegacy=()=>{const target=document.querySelector('main');target.innerHTML='';createRoot(target).render(<div className="platform-page"><h1>{window.__msgs.owner.title}</h1><OwnerPanel/></div>);};`;
const legacy=await build({stdin:{contents:baselineEntry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){
 b.onResolve({filter:/^legacy:|next-intl|SessionGate|useOwnerData|\.\/config$|\.\/client$|i18n\/navigation|OwnerAssessPanel|\.\/OwnerActivity$/},a=>({path:a.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>{
  let contents;
  if(a.path==='legacy:panel'||a.path.endsWith('/OwnerActivity'))contents=execFileSync('git',['show',`origin/main:src/features/pilot/${a.path==='legacy:panel'?'OwnerPanel':'OwnerActivity'}.tsx`],{encoding:'utf8'});
  else if(a.path==='next-intl')contents=`export function useTranslations(ns){return (key,values={})=>{let s=key.split('.').reduce((v,k)=>v?.[k],window.__msgs[ns])??key;return Object.entries(values).reduce((v,[k,x])=>v.replaceAll('{'+k+'}',String(x)),s);};}`;
  else if(a.path.includes('SessionGate'))contents=`export const useSessionAccount=()=>({state:{kind:'signedIn',userId:${JSON.stringify(OWNER)},profile:{role:'owner',status:'approved'}}});`;
  else if(a.path.includes('useOwnerData'))contents=`export const useOwnerData=()=>({kind:'ready',page:{version:1,boundary:'2026-10-25',total:window.__people.length,pending:4,rows:window.__people.slice(0,100),next:null}});`;
  else if(a.path.endsWith('/config'))contents='export const PILOT=true;';
  else if(a.path.endsWith('/client'))contents='export const getPilotClient=async()=>null;';
  else if(a.path.includes('navigation'))contents=`import React from 'react';export const Link=({href,children,...rest})=><a href={href} {...rest}>{children}</a>;`;
  else contents=`import React from 'react';export const OwnerAssessPanel=()=> <details className="mt-8 rounded-lg border border-line bg-panel p-4"><summary className="cursor-pointer text-lg font-semibold">{window.__msgs.assessAdmin.title}</summary></details>;`;
  return {contents,loader:'tsx',resolveDir:`${process.cwd()}/src/features/pilot`};
 });
}}]});
try {
 for(const loc of ['en','ar'])for(const w of [390,1440])for(const theme of ['dark','light']){
  const tag=`${loc}/${w}/${theme}`,d=messages[loc].owner.dashboard;
  const {context,page,reads,writes,errors}=await setup(loc,w,theme);
  await page.getByTestId('owner-summary').waitFor();ok(await page.getByTestId('owner-row').count()===12,`${tag} 12 rows`);
  const first=await page.getByTestId('owner-row').first().innerText();ok(first.includes(d.pending),`${tag} pending first`);
  await axe(page,tag);if(loc==='ar'&&w===390&&theme==='dark')await page.screenshot({path:'/tmp/rad069c1/participants.png',fullPage:true});
  await page.getByTestId('owner-row').first().locator('details > summary').first().click();await axe(page,`${tag} details`);
  ok((await page.getByTestId('owner-row').first().innerText()).match(/P-\d{32}/g)?.length===1,`${tag} one code`);
  await page.getByRole('link',{name:d.training,exact:true}).click();await page.getByTestId('matching-counts').waitFor();
  await page.getByTestId('filter-from').fill('2026-10-17');await page.getByTestId('filter-to').fill('2026-10-24');
  await page.getByTestId('saved-owner-rows').getByText(notes[0].text,{exact:true}).waitFor();
  ok(reads.some(r=>r.p_from==='2026-10-16T21:00:00.000Z'&&r.p_to==='2026-10-24T20:59:59.999999Z'),`${tag} local inclusive bounds`);
  await page.getByTestId('csv-notes').click();await page.getByTestId('export-save').waitFor();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('export-save').click()]);const csv=readFileSync(await download.path(),'utf8');
  ok(notes.every(n=>csv.includes(n.text))&&!csv.includes(user.email),`${tag} notes CSV matches view`);await axe(page,`${tag} training`);
  await page.getByRole('link',{name:d.assess,exact:true}).click();await page.getByTestId('assess-admin').waitFor();
  ok(await page.getByTestId('assess-content').isVisible(),`${tag} Assess visible`);ok(await page.getByTestId('owner-directory').count()===1,`${tag} shared directory`);await axe(page,`${tag} assess`);if(loc==='ar'&&w===390&&theme==='dark')await page.screenshot({path:'/tmp/rad069c1/assess.png',fullPage:true});
  await page.goBack();await page.getByTestId('owner-training').waitFor();ok(new URL(page.url()).searchParams.get('tab')==='training',`${tag} Back`);
  ok(errors.length===0,`${tag} no page errors: ${errors}`);ok(writes.length===0,`${tag} fixture read-only audit: ${writes}`);
  if(loc==='ar'&&w===390&&theme==='dark')await page.screenshot({path:'/tmp/rad069c1/training.png',fullPage:true});
  await context.close();
 }
 for(const n of [12,200])for(const loc of ['ar','en'])for(const w of [390,1440]){
  const {context,page,rows}=await setup(loc,w,'dark',n);await page.getByTestId('owner-summary').waitFor();
  const after=await page.evaluate(()=>document.documentElement.scrollHeight/innerHeight);
  ok(await page.getByTestId('owner-row').count()===Math.min(20,n),`${n} bounded`);
  if(n===200){const prior=await page.getByTestId('owner-row').first().locator('strong').innerText();await page.getByTestId('participants-next').click();await page.getByText(prior,{exact:true}).waitFor({state:'detached'});ok(await page.getByTestId('owner-row').count()===20,'next page replaces rows');await page.getByRole('searchbox').fill('fixture200@');await page.getByRole('button',{name:messages[loc].owner.dashboard.searchAction,exact:true}).click();await page.getByText('fixture200@example.test',{exact:true}).waitFor();ok(await page.getByTestId('owner-row').count()===1,'search beyond first page');}
  await page.evaluate(({rows,msgs})=>{window.__people=rows;window.__msgs=msgs;},{rows,msgs:messages[loc]});
  await page.addScriptTag({content:legacy.outputFiles[0].text});await page.evaluate(()=>window.renderLegacy());await page.getByTestId('owner-summary').waitFor();
  const before=await page.evaluate(()=>document.documentElement.scrollHeight/innerHeight);heights.push({n,loc,width:w,before:+before.toFixed(2),after:+after.toFixed(2),baselineRows:Math.min(n,100),afterRows:Math.min(n,20)});
  await context.close();
 }
 {const {context,page,writes}=await setup('en',390,'dark');await page.getByTestId('owner-summary').waitFor();await page.getByTestId('owner-row').first().getByRole('button',{name:messages.en.owner.actions.approved,exact:true}).click();ok(writes.length===1&&writes[0].new_status==='approved','approve uses unchanged RPC');await context.close();}
 {const {context,page}=await setup('en',390,'dark',12,true);await page.getByTestId('owner-summary').waitFor();ok(await page.getByTestId('owner-row').count()>0,'current schema fallback');await axe(page,'fallback');await context.close();}
 {const {context,page,reads}=await setup('ar',390,'dark',12,false,'participant');await page.getByTestId('owner-denied').waitFor();ok(reads.length===0,'nonowner has no owner reads');await axe(page,'denied');await context.close();}
 mkdirSync('docs/review',{recursive:true});
 const sheet=await browser.newPage({viewport:{width:1170,height:900}});
 await sheet.setContent(`<html><body style="margin:0;display:flex;align-items:start;background:#fff">${['participants','training','assess'].map(name=>`<figure style="margin:0;width:390px"><figcaption style="font:20px sans-serif;text-align:center;padding:12px">${name} · AR · 390 · fixtures</figcaption><img style="width:390px" src="data:image/png;base64,${readFileSync('/tmp/rad069c1/'+name+'.png').toString('base64')}"/></figure>`).join('')}</body></html>`);
 await sheet.locator('img').last().waitFor();await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await sheet.screenshot({path:'docs/review/rad069c1-owner.jpg',type:'jpeg',quality:80,fullPage:true});await sheet.close();
 writeFileSync('/tmp/rad069c1/results.json',JSON.stringify({checks,axes,heights},null,2));console.log(JSON.stringify({checks,axes,heights},null,2));
}finally{await browser.close();server.close();}
