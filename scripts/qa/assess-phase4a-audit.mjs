// Phase 4a: offline differential proof and local synthetic browser checks. No provider operations.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {build,transform} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {startServer} from '../preview/serve-out.mjs';
import {startPractice,openTab} from './workspace.mjs';
const require=createRequire(import.meta.url);
const CLEANUP_REF='2a584ef10b5820756fb1134dfa06eefcac30f53b';
const BASE_REF='d138bf7d637f4caed0714852982a0bcab6e3f961';
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const before=path=>execFileSync('git',['show',`${BASE_REF}:${path}`],{encoding:'utf8'});
const run=code=>{const sandboxModule={exports:{}};vm.runInNewContext(code,{module:sandboxModule,exports:sandboxModule.exports,require,globalThis,console,setTimeout,clearTimeout,structuredClone,TextEncoder,Buffer});return sandboxModule.exports;};
async function guardProof(){
 const current=run((await transform(readFileSync('src/features/assess/data-guards.ts','utf8'),{loader:'ts',format:'cjs'})).code);
 const corpus=[null,undefined,true,false,0,1,'',[],{},Object.create(null),new Date(),()=>{},'00000000-0000-0000-0000-000000000000'];
 for(let position=0;position<36;position++)for(let code=0;code<128;code++){
  const uuid='ABCDEF01-2345-6789-abcd-0123456789ab';corpus.push(uuid.slice(0,position)+String.fromCharCode(code)+uuid.slice(position+1));
 }
 let checks=0;
 for(const file of ['runner-data.ts','history-data.ts','admin-data.ts','owner-assignments.ts']){
  const source=before(`src/features/assess/${file}`);
  for(const [oldName,newName] of [[file==='runner-data.ts'?'isObject':'object','isObject'],[file==='runner-data.ts'?'isUuid':'uuid','isUuid']]){
   const line=source.split('\n').find(l=>new RegExp(`^(export )?const ${oldName}\\s*=`).test(l));assert.ok(line);
   const old=run((await transform(line.replace(/^export /,'')+`\nmodule.exports=${oldName};`,{loader:'ts',format:'cjs'})).code);
   for(const value of corpus){assert.equal(current[newName](value),old(value),`${file}:${oldName}`);checks++;}
  }
 }
 console.log(`Guards: ${checks} old/new identical booleans (all ASCII substitutions at every UUID position, nonstrings and object shapes).`);
}
async function renderProof(){
 const compiled=[];
 for(const file of ['AssessPanel.tsx','FullPracticalRunner.tsx'])for(const historical of [true,false]){
  const path=`src/features/assess/${file}`,name=file==='AssessPanel.tsx'?'Runner':'FullPracticalRunner';
  const source=(historical?before(path):execFileSync('git',['show',`${CLEANUP_REF}:${path}`],{encoding:'utf8'}))+`\nexport const ProofRunner=${name};`;
  const result=await build({stdin:{contents:source,sourcefile:resolve(path),resolveDir:resolve('src/features/assess'),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/*','react-dom/*'],logLevel:'silent',plugins:[{name:'synthetic-view-state',setup(b){
   b.onLoad({filter:/RunnerView\.tsx$/},()=>({loader:'tsx',contents:execFileSync('git',['show',`${CLEANUP_REF}:src/features/assess/RunnerView.tsx`],{encoding:'utf8'})}));
   b.onLoad({filter:/FullPracticalRunner\.tsx$/},()=>({loader:'tsx',contents:execFileSync('git',['show',`${CLEANUP_REF}:src/features/assess/FullPracticalRunner.tsx`],{encoding:'utf8'})}));
   b.onResolve({filter:/^(next-intl|.*\/runner-state|.*\/practical-state|@\/features\/pilot\/(SessionGate|client))$/},args=>({path:args.path,namespace:'proof'}));
   b.onLoad({filter:/.*/,namespace:'proof'},args=>({loader:'js',contents:args.path==='next-intl'?`export const useLocale=()=>globalThis.__phase4aLocale;export const useTranslations=(ns)=>((key,args={})=>{let value=globalThis.__phase4aMessages;for(const k of (ns+'.'+key).split('.'))value=value[k];return value.replace(/\\{(\\w+)\\}/g,(_,k)=>String(args[k]));});export const NextIntlClientProvider=({children})=>children;`:
    args.path.endsWith('runner-state')||args.path.endsWith('practical-state')?`export class MixedRunner{constructor(){return globalThis.__phase4aController}}export const PracticalRunner=MixedRunner;`:
    `export const useSessionAccount=()=>({state:{kind:'signedOut'}});export const getPilotClient=()=>null;` }));
  }}]});compiled.push(run(result.outputFiles[0].text).ProofRunner);
 }
 let checks=0;
 const control={kind:'number',min:40,max:150};
 for(const locale of ['en','ar'])for(const track of ['mixed','full-practical'])for(const state of ['loading','error','conflict','saved','dirty','pending','busy','locked','closed']){
  globalThis.__phase4aLocale=locale;globalThis.__phase4aMessages=messages[locale];
  const item={schemaVersion:1,ref:{id:'synthetic',version:'1'},contentLanguage:'en',prompt:'Synthetic question',type:track==='mixed'?'simulator-part':'full-practical',presentation:{controls:['kvp'],sceneElements:[]}};
  const initial={kvp:80,projection:'pa',sidCm:180,rotationDeg:0,'centralRay.x':0,'centralRay.y':0,'collimation.width':1,'collimation.height':1,sideMarker:null,'markerPosition.x':0,'markerPosition.y':0};
  const view={controls:{kvp:control},initial,sceneValues:{},schemaVersion:1,labels:{kvp:'kVp'},increments:{},scene:{id:'chest-pa-frontal',detector:{widthCm:35,heightCm:43},anatomyFrame:{xCm:0,yCm:0,widthCm:35,heightCm:43},markerSizeCm:2}};
  const session={attemptId:'synthetic',ack:{state:state==='closed'?'grading':'active',serverTime:'2026-10-30T00:00:00Z',deadline:'2026-10-30T01:00:00Z',lockedItemIds:state==='locked'?['synthetic']:[]},assessment:{name:'Synthetic test',items:[item]},answers:{},views:{synthetic:view}};
  globalThis.__phase4aController={session:['loading','error'].includes(state)?null:session,index:0,drafts:{},busy:state==='busy',dirty:state==='dirty',pending:state==='pending'?{}:null,issue:['error','conflict'].includes(state)?state:null,unresolved:1};
  const pair=track==='mixed'?compiled.slice(0,2):compiled.slice(2),props={port:{},attempt:'synthetic',leave:()=>{}};
  // Only React-generated useId tokens vary with the extracted component hierarchy; all references stay paired.
  const html=pair.map(Component=>renderToStaticMarkup(React.createElement(Component,props)).replace(/_R_[a-zA-Z0-9]+_/g,'REACT_ID'));
  assert.equal(html[1],html[0],`${locale}/${track}/${state}`);checks++;
 }
 delete globalThis.__phase4aController;delete globalThis.__phase4aLocale;delete globalThis.__phase4aMessages;
 console.log(`Runner refactor: ${checks} EN/AR old/new markup byte comparisons passed (React useId tokens normalized).`);
}
async function setupProof(){
 const result=await build({entryPoints:['src/features/assess/RunnerView.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/*','next-intl'],logLevel:'silent'});
 const {setupSteps,RunnerView,AssessSetup}=run(result.outputFiles[0].text),{NextIntlClientProvider}=require('next-intl');
 const paths=['choices.future-option','sidCm','rotationDeg','centralRay.x','sideMarker','breathing','motionInstruction','kvp','aecChambers','futureTool'];
 assert.deepEqual(JSON.parse(JSON.stringify(setupSteps([]))),[],'No tools introduces no steps');
 assert.deepEqual(JSON.parse(JSON.stringify(setupSteps(['kvp']))),[{id:'technique',paths:['kvp']}],'No empty positioning/patient steps');
 const grouped=setupSteps(paths);assert.equal(grouped.length,4);assert.deepEqual([...grouped.flatMap(g=>g.paths)].sort(),[...paths].sort(),'Each declared tool is preserved');
 assert.equal(grouped.find(g=>g.paths.includes('futureTool')).id,'positioning','Additive tools remain visible');
 const controller={session:{ack:{state:'active',deadline:null,lockedItemIds:[]},assessment:{name:'Synthetic',items:[]}},index:0,drafts:{},busy:false,dirty:false,pending:null,issue:null};
 for(const question of ['synthetic-random-item','toString','hasOwnProperty']){
  let step;
  const setup=React.createElement(AssessSetup,{question,paths,disabled:false,locked:false},value=>{step=value;return React.createElement('span',null,'Synthetic settings');});
  const node=React.createElement(RunnerView,{controller,attempt:'synthetic',leave:()=>{},testId:'synthetic'},setup);
  renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'en',messages:messages.en,timeZone:'UTC'},node));
  assert.equal(step.id,'positioning',question);assert.deepEqual([...step.paths],['choices.future-option','sidCm','rotationDeg','futureTool']);assert.equal(step.ready,false);
 }
 console.log('Setup proof: sparse/empty/additive tool configuration, exact partition and three arbitrary question IDs passed.');
}
async function browserProof(){
 const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const {server,port}=await startServer('out',0),base=`http://127.0.0.1:${port}`,supa='https://abcdefghijklmnop.supabase.co';
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
 const artifacts='/tmp/rad062-phase4a';mkdirSync(artifacts,{recursive:true});
 const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const consent=readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
 // Reuse existing engineering fixtures and validators; never install or call a backend.
 const fixture=await build({stdin:{contents:`import {practicalFixture} from './scripts/assess/e-fixture';import {validatePracticalContent} from './src/features/assess/server-practical';import {CASES} from './src/data/cases';export const practical=()=>validatePracticalContent(practicalFixture('1',CASES));`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent'});
 const practical=run(fixture.outputFiles[0].text).practical;
 const d=readFileSync('scripts/qa/assess-runner-audit.mjs','utf8');
 const mixed=run(`const id=${id.toString()};${d.slice(d.indexOf('function snapshot()'),d.indexOf('async function setup('))}\nmodule.exports=snapshot;`);
 let checks=0,audits=0;const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
 async function audit(page,label,shot=false){
  await page.evaluate(axe);const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[],label);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label} overflow`);audits++;
  if(shot)await page.screenshot({path:`${artifacts}/${label}.jpg`,type:'jpeg',quality:80,fullPage:true});
 }
 async function setup(locale,width,track,short=false){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390});
  const user={id:id(3),aud:'authenticated',role:'authenticated',email:'synthetic@example.test'};
  const token={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
  await context.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(token));
  const publication=track==='full-practical'?practical():null;
  const state=publication?{attemptId:id(99),ack:{operationId:'',revision:0,serverTime:new Date().toISOString(),deadline:new Date(Date.now()+3600000).toISOString(),state:'active',lockedItemIds:[]},assessment:publication.publication.assessment,answers:{},views:publication.views}:mixed();
  const commands=[],receipts=new Map(),errors=[];let lost=false,offline=false,conflict=false,reads=0;
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(url.origin===base)return route.continue();assert.equal(url.origin,supa,'Only intercepted synthetic origin permitted');
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},json=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/user')return json(user);
   if(url.pathname==='/rest/v1/profiles')return json({role:'participant',status:'approved',participant_code:'P-synthetic',consent_version:consent,display_name:'Synthetic'});
   if(['/rest/v1/events','/rest/v1/rpc/touch_last_seen'].includes(url.pathname))return route.fulfill({status:201,headers});
   assert.equal(request.headers()['content-profile'],'assess');const p=request.postDataJSON(),fn=url.pathname.split('/').at(-1);
   if(['assigned_page_v1','assigned_practical_page_v1'].includes(fn)){assert.equal(p.p_limit,20);return json({rows:[{id:id(30),name:'Synthetic local test',version:'1'}],next:null});}
   if(fn==='scope_page_v1')return json({version:1,rows:[],next:null,serverNow:new Date().toISOString(),visibleUntil:null,appointed:false});
   if(fn==='consent_v2')return json({accepted:true});
   if(fn==='start_v1'){state.ack.serverTime=new Date().toISOString();state.ack.deadline=new Date(Date.now()+(short?5000:3600000)).toISOString();return json({attemptId:id(99)});}
   if(['read_mixed_session_v1','read_practical_session_v1'].includes(fn)){
    reads++;if(Date.now()>=Date.parse(state.ack.deadline)&&state.ack.state==='active'){state.ack.state='grading';state.ack.revision++;}
    return json(state.ack.state==='active'?state:{attemptId:state.attemptId,ack:state.ack});
   }
   if(fn==='command_v1'){
    commands.push(p);if(offline)return route.abort('internetdisconnected');
    if(conflict){conflict=false;state.ack.revision++;return json({code:'40001',message:'PRIVATE fixture error'},400);}
    const prior=receipts.get(p.p_operation);if(prior){assert.deepEqual(p,prior);return json(state.ack);}
    assert.equal(p.p_revision,state.ack.revision);const a=p.p_action;state.ack.revision++;
    if(a.type==='submit')state.ack.state='grading';else{state.answers[a.item.id]=a.answer;if(a.type==='expose'){ok(!state.ack.lockedItemIds.includes(a.item.id),'single exposure effect');state.ack.lockedItemIds.push(a.item.id);}}
    receipts.set(p.p_operation,structuredClone(p));if(lost){lost=false;return route.abort('connectionreset');}return json(state.ack);
   }
   assert.fail(`Unexpected RPC ${fn}`);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/${locale}/assess?track=${track}`,{waitUntil:'networkidle'});
  await page.getByTestId('assess-assigned').getByRole('button',{name:messages[locale].assess.start,exact:true}).click();
  const runner=page.getByTestId(track==='mixed'?'assess-runner':'assess-practical-runner');await runner.locator('article').waitFor();
  return {page,context,state,commands,errors,runner,lose:()=>{lost=true;},offline:v=>{offline=v;},conflict:()=>{conflict=true;},reads:()=>reads};
 }
 async function question(s,n,t){await s.runner.getByRole('navigation',{name:t.questions,exact:true}).getByRole('button',{name:String(n+1),exact:true}).click();await s.runner.getByRole('heading',{name:s.state.assessment.items[n].prompt,exact:true}).waitFor();}
 async function walk(s,locale,label){
  const {runner,page}=s,t=messages[locale].assess,tabs=runner.getByRole('tab'),count=await tabs.count(),seen=[];
  for(let n=0;n<count;n++){
   const selected=tabs.nth(n);ok(await selected.getAttribute('aria-selected')==='true',`${label} selected ${n}`);
   for(let future=n+1;future<count;future++)ok(await tabs.nth(future).isDisabled(),`${label} no skip ${future}`);
   await selected.focus();await selected.press('End');ok(await selected.getAttribute('aria-selected')==='true',`${label} keyboard cannot skip`);
   if(n<count-1)ok(await runner.getByRole('button',{name:t.expose,exact:true}).isDisabled(),`${label} exposure waits`);
   seen.push(...await runner.locator('fieldset input,fieldset select').evaluateAll(nodes=>nodes.map(node=>node.id.replace(/^(assess|practical)-control-/,''))));
   await audit(page,`${label}-step${n}`,n===0||n===count-1);
   if(n<count-1)await runner.getByRole('button',{name:t.next,exact:true}).click();
  }
  return [...new Set(seen)].sort();
 }
 try{
  for(const locale of ['en','ar'])for(const width of [390,1440]){
   const t=messages[locale].assess,label=`${locale}-${width}`;
   // Practice: jump straight to Technique, preserve the missing-step dot and free navigation.
   const practice=await setup(locale,width,'mixed'),ctx=practice.context,page=practice.page;
   await page.goto(`${base}/${locale}/xray/chest-pa-erect/practice`,{waitUntil:'networkidle'});await startPractice(page,messages[locale]);
   if(width===390){
    const tabs=page.getByRole('tab');ok(await tabs.count()===4,'Practice four tabs');for(const tab of await tabs.all())ok(await tab.isEnabled(),'Practice free tabs');
    ok(await page.getByRole('tab',{name:new RegExp(messages[locale].workspace.needsAttention)}).count()>0,'Practice missing-step dot text');
    for(const group of ['technique','centring','patient','positioning']){await openTab(page,messages[locale],group);await audit(page,`practice-${label}-${group}`,true);}
   }else{ok(await page.getByRole('tablist').count()===0,'Practice desktop has no wizard');await audit(page,`practice-${label}`,true);}
   await ctx.close();console.log(`Practice ${label} passed`);
   for(const track of ['mixed','full-practical']){
    const s=await setup(locale,width,track),{runner,page}=s;
    if(track==='mixed'){
     ok(await runner.getByRole('tablist').count()===0,'MCQ has no setup wizard');await runner.getByRole('radio').first().check();await runner.getByText(t.saved,{exact:true}).waitFor();await audit(page,`mixed-${label}-mcq`);
     await question(s,2,t);ok(await runner.getByRole('tab').count()===2,'Part derives two groups, no empty steps');
     await runner.getByLabel('Marker letter',{exact:true}).selectOption('2');await runner.getByText(t.saved,{exact:true}).waitFor();
     await question(s,0,t);await question(s,2,t);ok(await runner.getByLabel('Marker letter',{exact:true}).inputValue()==='2','Part edit survives question navigation');
     const paths=await walk(s,locale,`mixed-${label}-part`);assert.deepEqual(paths,[...s.state.assessment.items[2].presentation.controls].sort());
     await runner.getByRole('button',{name:t.back,exact:true}).click();ok(await runner.getByRole('button',{name:t.expose,exact:true}).isDisabled(),'Back disables exposure outside final setup step');
     await question(s,1,t);ok(await runner.getByRole('tab').count()===1,'SID question only one step');ok(await runner.locator('svg').count()===0,'SID has no scene');await question(s,2,t);
     ok(await runner.getByRole('tab').first().getAttribute('aria-selected')==='true','Part progress survives MCQ/other question');
     await runner.getByRole('button',{name:t.next,exact:true}).click();
    }else{
     // Every existing family uses the same setup. No copied family controller or fixed exam-ID list.
     for(let n=s.state.assessment.items.length-1;n>=0;n--){
      await question(s,n,t);const paths=await walk(s,locale,`full-${label}-q${n+1}`),view=s.state.views[s.state.assessment.items[n].ref.id];
      const expected=Object.keys(view.controls).filter(p=>p!=='aecChambers'||view.controls.exposureMode?.values.includes('aec')).sort();assert.deepEqual(paths,expected,'Every declared tool appears exactly in its group');
     }
     await runner.getByRole('button',{name:t.back,exact:true}).click();await runner.getByRole('button',{name:t.back,exact:true}).click();
     // Centrिंग is the only scene-editing step; keyboard edits keep all other tool values.
     const beam=runner.getByRole('button',{name:messages[locale].assess.scene.moveBeam,exact:true});await beam.focus();await beam.press('ArrowRight');await runner.getByText(t.saved,{exact:true}).waitFor();
     ok(s.state.answers['full-0'].values['centralRay.x']!==s.state.views['full-0'].initial['centralRay.x'],'Beam edits still save');
     await question(s,1,t);await question(s,0,t);ok(await runner.getByRole('tab',{name:messages[locale].workspace.tabs.centring,exact:true}).getAttribute('aria-selected')==='true','Full step preserved across question navigation');
     while(await runner.getByRole('button',{name:t.next,exact:true}).isEnabled())await runner.getByRole('button',{name:t.next,exact:true}).click();
    }
    // Loss of ACK retries the exact same operation/payload; only one exposure effect.
    s.lose();await runner.getByRole('button',{name:t.expose,exact:true}).click();await runner.getByRole('alert').waitFor();await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await runner.getByText(t.locked,{exact:true}).waitFor();
    const exposures=s.commands.filter(p=>p.p_action.type==='expose');assert.equal(exposures.length,2);assert.deepEqual(exposures[0],exposures[1]);ok(s.state.ack.lockedItemIds.length===1,'Exposure effect exactly once');ok(await runner.getByRole('button',{name:t.expose,exact:true}).isDisabled(),'Exposure locked');
    await page.reload({waitUntil:'networkidle'});if(track==='mixed')await question(s,2,t);await runner.getByText(t.locked,{exact:true}).waitFor();ok(await runner.getByRole('button',{name:t.expose,exact:true}).isDisabled(),'Reload retains server lock');await audit(page,`${track}-${label}-locked`,true);
    await question(s,1,t);if(track==='full-practical')while(await runner.getByRole('button',{name:t.next,exact:true}).isEnabled())await runner.getByRole('button',{name:t.next,exact:true}).click();
    const input=track==='mixed'?runner.getByLabel('SID (cm)',{exact:true}):runner.getByLabel('kVp',{exact:true});
    s.offline(true);await input.fill(track==='mixed'?'150':'100');await runner.getByRole('alert').waitFor();ok(await runner.getByRole('tab').first().isDisabled(),'Unconfirmed save blocks setup interaction');ok(await runner.getByRole('navigation',{name:t.questions,exact:true}).getByRole('button').first().isDisabled(),'Unconfirmed save blocks question switch');
    let dialog=false;const leaveGuard=async d=>{dialog=true;await d.dismiss();};page.on('dialog',leaveGuard);await page.reload({timeout:5000}).catch(()=>{});page.off('dialog',leaveGuard);ok(dialog,'beforeunload protects unconfirmed draft');
    s.offline(false);await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await runner.getByText(t.saved,{exact:true}).waitFor();
    s.conflict();await input.fill(track==='mixed'?'160':'110');await runner.getByRole('alert').waitFor();ok(!(await runner.textContent()).includes('PRIVATE'),'Conflict stays sanitized');await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await runner.getByText(t.saved,{exact:true}).waitFor();
    await runner.getByRole('button',{name:t.submit,exact:true}).click();await runner.getByRole('region',{name:t.confirmTitle,exact:true}).waitFor();const unresolved=s.state.assessment.items.filter(i=>i.type==='single-choice'?!s.state.answers[i.ref.id]?.optionId:!s.state.ack.lockedItemIds.includes(i.ref.id)).length;
    ok((await runner.textContent()).includes(t.unresolved.replace('{count}',String(unresolved))),'Unresolved warning unchanged');await audit(page,`${track}-${label}-confirm`,true);
    await runner.getByRole('region',{name:t.confirmTitle,exact:true}).getByRole('button',{name:t.back,exact:true}).click();ok(await runner.getByRole('region',{name:t.confirmTitle,exact:true}).count()===0,'Confirmation cancellation');
    await runner.getByRole('button',{name:t.submit,exact:true}).click();await runner.getByRole('button',{name:t.confirmSubmit,exact:true}).click();await runner.getByText(t.closed,{exact:true}).waitFor();ok(await runner.locator('article').count()===0,'Submission discards displayed details');assert.deepEqual(s.errors,[]);await s.context.close();
    const exp=await setup(locale,width,track,true);const reads=exp.reads();await exp.runner.getByText(t.closed,{exact:true}).waitFor({timeout:10000});ok(exp.reads()>reads,'One-shot deadline recovery reads server state');ok(exp.state.ack.state==='grading','Deadline remains server-owned');assert.deepEqual(exp.errors,[]);await audit(exp.page,`${track}-${label}-expiry`);await exp.context.close();console.log(`${track} ${label} passed`);
   }
  }
  console.log(`Phase4a browser: ${checks} checks, ${audits} EN/AR390/1440 axe/overflow audits passed. All existing full-practical families plus mixed and unchanged Practice. Synthetic local API only.`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
// Preload for the existing qa:exam-audit command when this local build has accounts enabled.
// Only the synthetic account transport is intercepted; the original audit thresholds/flows stay intact.
async function examAccountFixture(){
 const {chromium}=require('playwright'),launch=chromium.launch.bind(chromium),base=new URL(process.env.BASE??'http://localhost:3100').origin;
 const supa='https://abcdefghijklmnop.supabase.co',consent=readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
 chromium.launch=async options=>{
  const browser=await launch(options),create=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await create(options),user={id:'00000000-0000-0000-0000-000000000003',aud:'authenticated',role:'authenticated',email:'synthetic@example.test'},b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
   const token={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
   await context.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(token));
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());if(url.origin===base)return route.continue();assert.equal(url.origin,supa,'Only intercepted synthetic origin');
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},json=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(url.pathname==='/auth/v1/user')return json(user);
    if(url.pathname==='/rest/v1/profiles')return json({role:'participant',status:'approved',participant_code:'P-synthetic',consent_version:consent,display_name:'Synthetic'});
    if(['/rest/v1/events','/rest/v1/attempts','/rest/v1/rpc/touch_last_seen'].includes(url.pathname))return route.fulfill({status:201,headers});
    if(url.pathname==='/rest/v1/rpc/scope_page_v1')return json({version:1,rows:[],next:null,serverNow:new Date().toISOString(),visibleUntil:null,appointed:false});
    assert.fail(`Unexpected exam-audit synthetic request ${url.pathname}`);
   });return context;
  };return browser;
 };
}
if(process.env.PHASE4A_EXAM_ACCOUNT==='1'){
 if(process.argv[1]?.endsWith('/exam-audit.mjs'))await examAccountFixture();
}
else if(process.argv.includes('--refactor-proof')){await guardProof();await renderProof();}
else if(process.argv.includes('--guards-proof'))await guardProof();
else if(process.argv.includes('--browser'))await browserProof();
else if(process.argv.includes('--setup-proof'))await setupProof();
else throw new Error('Specify --refactor-proof, --guards-proof, --setup-proof or --browser.');
