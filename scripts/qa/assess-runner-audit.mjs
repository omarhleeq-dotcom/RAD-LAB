// Local static build, synthetic identities and API only. No hosted preview or provider access.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {startServer} from '../preview/serve-out.mjs';
const require=createRequire(process.env.ASSESS_BROWSER_MANIFEST??new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const consent=readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const supa='https://abcdefghijklmnop.supabase.co',b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const {server,port}=await startServer('out',0),base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
mkdirSync('/tmp/radlab-d-artifacts',{recursive:true});
let checks=0,audits=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
async function audit(page,label){await page.evaluate(axe);const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');audits++;await page.screenshot({path:`/tmp/radlab-d-artifacts/${label}.png`,fullPage:true});}
function snapshot(){return {attemptId:id(99),ack:{operationId:null,revision:0,serverTime:new Date().toISOString(),deadline:new Date(Date.now()+3600000).toISOString(),state:'active',lockedItemIds:[]},assessment:{schemaVersion:1,ref:{id:id(10),version:'1'},name:'Synthetic local test',track:'mixed',maximum:'7.5',policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:'hidden'},items:[
{schemaVersion:1,ref:{id:'letter',version:'1'},contentLanguage:'en',type:'single-choice',prompt:'Select a synthetic label.',options:[{id:'a',text:'Label A'},{id:'b',text:'Label B'}]},
{schemaVersion:1,ref:{id:'distance',version:'1'},contentLanguage:'en',type:'simulator-part',prompt:'Set a synthetic distance.',presentation:{controls:['sidCm'],sceneElements:[]}},
{schemaVersion:1,ref:{id:'marker',version:'1'},contentLanguage:'en',type:'simulator-part',prompt:'Synthetic combined settings.',presentation:{controls:['kvp','sideMarker','markerPosition.x','markerPosition.y'],sceneElements:['detector','marker']}}
]},answers:{},views:{distance:{controls:{sidCm:{kind:'number',min:100,max:200}},initial:{sidCm:120},sceneValues:{}},marker:{controls:{kvp:{kind:'number',min:50,max:150},sideMarker:{kind:'enum',values:[null,'L','R']},'markerPosition.x':{kind:'number',min:-1,max:1},'markerPosition.y':{kind:'number',min:-1,max:1}},initial:{kvp:100,sideMarker:null,'markerPosition.x':0,'markerPosition.y':0},sceneValues:{sideMarker:null,'markerPosition.x':0,'markerPosition.y':0}}}};}
async function setup(locale,width,owner=false){
 const context=await browser.newContext({viewport:{width,height:900}}),user={id:id(owner?1:3),aud:'authenticated',role:'authenticated',email:'synthetic@example.test'};
 const session={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
 await context.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(session));
 let state=snapshot(),lost=false,conflict=false,offline=false,content=false,started=false;const commands=[],receipts=new Map(),errors=[];
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();ok(url.origin===supa,'only configured synthetic origin');
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  const json=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/auth/v1/user')return json(user);
  if(url.pathname==='/rest/v1/profiles')return json({role:owner?'owner':'participant',status:'approved',participant_code:'P-synthetic',consent_version:consent,display_name:'Synthetic'});
  if(['/rest/v1/events','/rest/v1/rpc/touch_last_seen'].includes(url.pathname))return route.fulfill({status:201,headers});
  if(url.pathname==='/rest/v1/rpc/owner_page_v1'&&req.headers()['content-profile']!=='assess')return json({version:1,boundary:new Date().toISOString(),total:0,pending:0,rows:[],next:null});
  ok(req.headers()['content-profile']==='assess','explicit Assess schema');const p=req.postDataJSON(),fn=url.pathname.split('/').at(-1);
  if(fn==='owner_page_v1')return json({version:1,rows:[],next:null});
  if(fn==='content_page_v1')return json({rows:content?[{id:id(77),name:'Synthetic queued',version:'1',state:'pending'}]:[],next:null});
  if(fn==='content_submit_v1'){ok(owner,'owner-only UI');content=true;return json(id(77));}
  if(fn==='assigned_page_v1'){ok(p.p_limit===20,'bounded assigned page');return json({rows:[{id:id(30),name:'Synthetic local test',version:'1'}],next:null});}
  if(fn==='consent_v1')return json({accepted:true});
  if(fn==='start_v1'){started=true;return json({attemptId:id(99)});}
  if(fn==='read_mixed_session_v1')return json(state.ack.state==='active'?state:{attemptId:state.attemptId,ack:state.ack});
  if(fn==='command_v1'){
   commands.push(p);if(offline)return route.abort('internetdisconnected');
   if(conflict){conflict=false;state.ack.revision++;state.answers.letter={type:'single-choice',optionId:'b'};return json({code:'40001',message:'private server text'},400);}
   const prior=receipts.get(p.p_operation);if(prior){assert.deepEqual(p,prior);return json(state.ack);}
   ok(p.p_revision===state.ack.revision,'uses server revision');const a=p.p_action;state.ack.revision++;
   if(a.type==='submit')state.ack.state='grading';else {state.answers[a.item.id]=a.answer;if(a.type==='expose'){ok(!state.ack.lockedItemIds.includes(a.item.id),'no second exposure');state.ack.lockedItemIds.push(a.item.id);}}
   receipts.set(p.p_operation,structuredClone(p));if(lost){lost=false;return route.abort('connectionreset');}return json(state.ack);
  }
  assert.fail('unexpected RPC '+fn);
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/${locale}/${owner?'owner':'assess'}`,{waitUntil:'networkidle'});
 return {context,page,commands,errors,state:()=>state,lose:()=>{lost=true;},conflict:()=>{conflict=true;},offline:v=>{offline=v;},started:()=>started};
}
try{
 for(const locale of ['en','ar'])for(const width of [390,1440]){
  const s=await setup(locale,width),{page}=s,t=messages[locale].assess,label=`${locale}-${width}`;
  await page.getByTestId('assess-assigned').getByRole('button',{name:t.start,exact:true}).click();const runner=page.getByTestId('assess-runner');await runner.getByRole('radio').first().waitFor();await audit(page,label+'-mcq');
  await runner.getByRole('radio').first().check();await page.getByText(t.saved,{exact:true}).waitFor();
  await runner.getByRole('button',{name:'2',exact:true}).click();await runner.getByLabel('SID (cm)').waitFor();ok(await runner.locator('svg').count()===0,'SID has no scene');ok(!(await runner.textContent()).includes('kVp'),'SID has no unrelated kVp');
  await audit(page,label+'-sid');s.lose();await runner.getByRole('button',{name:'Expose once',exact:true}).click();await runner.getByRole('alert').waitFor();await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await runner.getByText('Exposure recorded. This item is locked.').waitFor();
  const exposures=s.commands.filter(p=>p.p_action.type==='expose');ok(exposures.length===2,'lost exposure retried');assert.deepEqual(exposures[0],exposures[1]);
  await page.reload({waitUntil:'networkidle'});await runner.getByRole('button',{name:'2',exact:true}).click();await runner.getByText('Exposure recorded. This item is locked.').waitFor();ok(await runner.getByRole('slider').isDisabled(),'refresh keeps lock');
  await runner.getByRole('button',{name:'3',exact:true}).click();await runner.getByLabel('Marker letter',{exact:true}).selectOption('2');await page.getByText(t.saved,{exact:true}).waitFor();ok(s.state().answers.marker.values['markerPosition.x']===0,'letter never moves marker');await audit(page,label+'-marker');
  await runner.getByRole('button',{name:'1',exact:true}).click();s.conflict();await runner.getByRole('radio').nth(1).check();await runner.getByRole('alert').waitFor();ok(!(await page.textContent('body')).includes('private server text'),'sanitized error');await runner.getByRole('button',{name:t.reconcile,exact:true}).click();await page.getByText(t.saved,{exact:true}).waitFor();
  await runner.getByRole('button',{name:t.submit,exact:true}).click();await runner.getByRole('region',{name:t.confirmTitle}).waitFor();ok((await runner.textContent()).includes(t.unresolved.replace('{count}','1')),'warns unexposed simulator is unresolved');await audit(page,label+'-confirmation');await runner.getByRole('button',{name:t.confirmSubmit,exact:true}).click();await runner.getByText(t.closed,{exact:true}).waitFor();ok(await runner.getByRole('radio').count()===0,'submission removes details');ok(await runner.getByRole('slider').count()===0,'submission removes controls');assert.deepEqual(s.errors,[]);await s.context.close();
  const o=await setup(locale,width,true),m=messages[locale].assessContent;await o.page.locator('summary',{hasText:messages[locale].assessAdmin.title}).click();const editor=o.page.getByTestId('assess-content');await editor.getByLabel(m.document,{exact:true}).fill(JSON.stringify({synthetic:'local UI fixture only'}));await editor.getByRole('button',{name:m.submit,exact:true}).click();await editor.getByText(m.saved,{exact:true}).waitFor();await editor.getByText(m.pending,{exact:false}).waitFor();await audit(o.page,label+'-owner-candidate');assert.deepEqual(o.errors,[]);await o.context.close();
 }
 console.log(`Assess D audit: ${checks} checks, ${audits} EN/AR390/1440 axe/overflow audits passed. Local synthetic API only; no live backend proof.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
