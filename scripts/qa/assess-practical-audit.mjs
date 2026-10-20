// Local static build and intercepted synthetic API only. No hosted preview, provider or medical approval.
// Node24: ASSESS_BROWSER_MANIFEST=/tmp/.../package.json node --import ./scripts/assess/node-loader.mjs scripts/qa/assess-practical-audit.mjs
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {startServer} from '../preview/serve-out.mjs';
import {practicalFixture,fixtureId as id} from '../assess/e-fixture.ts';
import {CASES} from '../../src/data/cases/index.ts';
import {validatePracticalContent} from '../../src/features/assess/server-practical.ts';
const require=createRequire(process.env.ASSESS_BROWSER_MANIFEST??new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const consent=readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
const supa='https://abcdefghijklmnop.supabase.co',b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const {server,port}=await startServer('out',0),base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
mkdirSync('/tmp/radlab-e-artifacts',{recursive:true});
const interactionsOnly=process.env.ASSESS_INTERACTIONS_ONLY==='1';
let checks=0,audits=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
async function audit(page,label){await page.evaluate(axe);const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');audits++;await page.screenshot({path:`/tmp/radlab-e-artifacts/${label}.png`,fullPage:true});}
function snapshot(short=false){const {publication,views}=validatePracticalContent(practicalFixture('1',CASES));return {attemptId:id(99),ack:{operationId:null,revision:0,serverTime:new Date().toISOString(),deadline:new Date(Date.now()+(short?3000:3600000)).toISOString(),state:'active',lockedItemIds:[]},assessment:publication.assessment,answers:{},views};}
async function setup(locale,width,short=false){
 const context=await browser.newContext({viewport:{width,height:900}}),user={id:id(3),aud:'authenticated',role:'authenticated',email:'synthetic@example.test'};
 const session={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
 await context.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(session));
 const state=snapshot(short),commands=[],receipts=new Map(),errors=[];let lost=false,conflict=false,offline=false;
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();ok(url.origin===supa,'only configured synthetic origin');
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},json=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/auth/v1/user')return json(user);
  if(url.pathname==='/rest/v1/profiles')return json({role:'participant',status:'approved',participant_code:'P-synthetic',consent_version:consent,display_name:'Synthetic'});
  if(['/rest/v1/events','/rest/v1/rpc/touch_last_seen'].includes(url.pathname))return route.fulfill({status:201,headers});
  ok(req.headers()['content-profile']==='assess','explicit Assess schema');const p=req.postDataJSON(),fn=url.pathname.split('/').at(-1);
  if(fn==='assigned_practical_page_v1'){ok(p.p_limit===20,'bounded practical list');return json({rows:[{id:id(30),name:'Synthetic local practical',version:'1'}],next:null});}
  if(fn==='consent_v2')return json({accepted:true});
  if(fn==='start_v1'){
   // Start the synthetic server clock at the start RPC, matching C; consent/page setup is not attempt time.
   state.ack.serverTime=new Date().toISOString();state.ack.deadline=new Date(Date.now()+(short?3000:3600000)).toISOString();
   return json({attemptId:id(99)});
  }
  if(fn==='read_practical_session_v1'){
   if(Date.now()>=Date.parse(state.ack.deadline)&&state.ack.state==='active'){state.ack.state='grading';state.ack.revision++;}
   return json(state.ack.state==='active'?state:{attemptId:state.attemptId,ack:state.ack});
  }
  if(fn==='command_v1'){
   commands.push(p);if(offline)return route.abort('internetdisconnected');
   if(conflict){conflict=false;state.ack.revision++;return json({code:'40001',message:'PRIVATE grading text'},400);}
   const prior=receipts.get(p.p_operation);if(prior){assert.deepEqual(p,prior);return json(state.ack);}
   ok(p.p_revision===state.ack.revision,'uses server revision');const a=p.p_action;state.ack.revision++;
   if(a.type==='submit')state.ack.state='grading';else{ok(a.answer.type==='full-practical','independent answer kind');state.answers[a.item.id]=a.answer;if(a.type==='expose'){ok(!state.ack.lockedItemIds.includes(a.item.id),'one exposure');state.ack.lockedItemIds.push(a.item.id);}}
   receipts.set(p.p_operation,structuredClone(p));if(lost){lost=false;return route.abort('connectionreset');}return json(state.ack);
  }
  assert.fail('unexpected practical RPC '+fn);
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/${locale}/assess?track=full-practical`,{waitUntil:'networkidle'});
 await page.getByTestId('assess-assigned').getByRole('button',{name:messages[locale].assess.start,exact:true}).click();
 await page.getByTestId('assess-practical-runner').getByLabel('kVp',{exact:true}).waitFor();
 return {page,context,state,commands,errors,lose:()=>{lost=true;},conflict:()=>{conflict=true;},offline:v=>{offline=v;}};
}
try{
 for(const locale of ['en','ar'])for(const width of [390,1440]){
  const s=await setup(locale,width),{page}=s,t=messages[locale].assess,label=`${locale}-${width}`,runner=page.getByTestId('assess-practical-runner');
  for(let n=0;n<(interactionsOnly?0:CASES.length);n++){
   await runner.getByRole('button',{name:String(n+1),exact:true}).click();await runner.getByRole('heading',{name:s.state.assessment.items[n].prompt,exact:true}).waitFor();await runner.locator('article').getByRole('group',{name:'Detector and patient',exact:true}).waitFor();
   const article=runner.locator('article');ok(await article.getByLabel('SID (cm)',{exact:true}).count()===1,'SID shown');const breathingCount=await article.locator('[id="practical-control-breathing"]').count();ok(breathingCount===Number(!!CASES[n].availableBreathing),`optional breathing preserved: ${CASES[n].id}; count=${breathingCount}; expected=${Number(!!CASES[n].availableBreathing)}`);
   ok(!/readiness|rubric|correct|ideal|critical|target zone|retry|reset/i.test(await article.innerHTML()),'no hints in markup/ARIA');
   await audit(page,`${label}-${CASES[n].id}`);
  }
  await runner.getByRole('button',{name:'1',exact:true}).click();
  const beam=runner.getByRole('button',{name:'Move beam with arrow keys or drag',exact:true});await beam.focus();await beam.press('ArrowRight');await page.getByText(t.saved,{exact:true}).waitFor();ok(s.state.answers['full-0'].values['centralRay.x']!==s.state.views['full-0'].initial['centralRay.x'],'keyboard changes beam');
  await runner.getByLabel('Marker letter',{exact:true}).selectOption('2');await page.getByText(t.saved,{exact:true}).waitFor();const marker=s.state.answers['full-0'].values;ok(marker['markerPosition.x']===s.state.views['full-0'].initial['markerPosition.x'],'letter does not move marker');
  const markerButton=runner.getByRole('button',{name:'Move marker R with arrow keys or drag',exact:true});await markerButton.focus();await markerButton.press('ArrowLeft');await page.getByText(t.saved,{exact:true}).waitFor();ok(s.state.answers['full-0'].values['markerPosition.x']!==marker['markerPosition.x'],'keyboard changes marker');
  await beam.scrollIntoViewIfNeeded();const beamBox=await beam.boundingBox(),beforeBeam=s.state.answers['full-0'].values['centralRay.x'];await page.mouse.move(beamBox.x+beamBox.width/2,beamBox.y+beamBox.height/2);await page.mouse.down();await page.mouse.move(beamBox.x+beamBox.width/2+12,beamBox.y+beamBox.height/2,{steps:4});await page.mouse.up();await page.getByText(t.saved,{exact:true}).waitFor();ok(s.state.answers['full-0'].values['centralRay.x']!==beforeBeam,'pointer moves beam');
  const edge=runner.locator('svg[aria-label="Detector and patient"] > g[aria-hidden] rect[width="12"]').first();await edge.scrollIntoViewIfNeeded();const edgeBox=await edge.boundingBox(),beforeWidth=s.state.answers['full-0'].values['collimation.width'];await page.mouse.move(edgeBox.x+edgeBox.width/2,edgeBox.y+edgeBox.height/2);await page.mouse.down();await page.mouse.move(edgeBox.x+edgeBox.width/2+12,edgeBox.y+edgeBox.height/2,{steps:4});await page.mouse.up();await page.getByText(t.saved,{exact:true}).waitFor();ok(s.state.answers['full-0'].values['collimation.width']!==beforeWidth,'pointer resizes field');
  s.lose();await runner.getByRole('button',{name:t.expose,exact:true}).click();await runner.getByRole('alert').waitFor();await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await runner.getByText(t.locked,{exact:true}).waitFor();
  const exposures=s.commands.filter(p=>p.p_action.type==='expose');ok(exposures.length===2,'lost exposure retried');assert.deepEqual(exposures[0],exposures[1]);
  await page.reload({waitUntil:'networkidle'});await runner.getByText(t.locked,{exact:true}).waitFor();ok(await runner.getByLabel('kVp',{exact:true}).isDisabled(),'refresh retains lock');await audit(page,label+'-locked');
  await runner.getByRole('button',{name:'2',exact:true}).click();s.offline(true);await runner.getByLabel('kVp',{exact:true}).fill('100');await runner.getByRole('alert').waitFor();ok(s.state.ack.lockedItemIds.length===1,'offline save does not expose');s.offline(false);await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await page.getByText(t.saved,{exact:true}).waitFor();
  s.conflict();await runner.getByLabel('kVp',{exact:true}).fill('110');await runner.getByRole('alert').waitFor();ok(!(await runner.textContent()).includes('PRIVATE'),'sanitized conflict');await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await page.getByText(t.saved,{exact:true}).waitFor();
  await runner.getByRole('button',{name:t.submit,exact:true}).click();await runner.getByRole('region',{name:t.confirmTitle}).waitFor();ok((await runner.textContent()).includes(t.unresolved.replace('{count}',String(CASES.length-1))),'warns unexposed examinations');await audit(page,label+'-confirmation');await runner.getByRole('button',{name:t.confirmSubmit,exact:true}).click();await runner.getByText(t.closed,{exact:true}).waitFor();ok(await runner.locator('article').count()===0,'submission removes details');assert.deepEqual(s.errors,[]);await s.context.close();
  const x=await setup(locale,width,true),r=x.page.getByTestId('assess-practical-runner');x.offline(true);await r.getByLabel('kVp',{exact:true}).fill('100');await r.getByRole('alert').waitFor();await r.getByText(t.closed,{exact:true}).waitFor();ok(x.state.ack.state==='grading','deadline uses server state');ok(Object.keys(x.state.answers).length===0,'unacknowledged offline answer not saved');assert.deepEqual(x.errors,[]);await audit(x.page,label+'-expired');await x.context.close();
 }
 console.log(`Assess E audit: ${checks} checks, ${audits} EN/AR390/1440 axe/overflow audits passed. ${interactionsOnly?"Interaction-only follow-up":"All existing anatomy families"}; synthetic local API, no provider proof.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
