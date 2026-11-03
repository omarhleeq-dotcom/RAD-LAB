// Local static export only; synthetic appointed/ordinary accounts, no live provider.
// ASSESS_BROWSER_MANIFEST selects the preinstalled Playwright package (no dependency change).
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync} from 'node:fs';
import {startServer} from '../preview/serve-out.mjs';
import {startPractice} from './workspace.mjs';
const require=createRequire(process.env.ASSESS_BROWSER_MANIFEST??new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright');
const axe=readFileSync(process.env.AXE_CORE_PATH??require.resolve('axe-core/axe.min.js'),'utf8');
const copy=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const before=process.env.MODE==='before',shots=process.env.SCREENSHOTS;
const user={id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'alternate@example.test'};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const token=`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`;
const session={access_token:token,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
const {server,port}=await startServer(process.env.OUT_DIR??'out',0),base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM,args:['--no-sandbox']});
let checks=0,audits=0;
function check(value,label){assert.ok(value,label);checks++;}
async function capture(page,label){if(shots){mkdirSync(shots,{recursive:true});await page.screenshot({path:`${shots}/${before?'before':'after'}-${label}.jpg`,type:'jpeg',quality:80,fullPage:true});}}
async function audit(page,label){
 await page.evaluate(axe);
 const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
 assert.deepEqual(violations,[],label);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no overflow`);audits++;
}
async function scenario(locale,width,appointed=true,fault=''){
 const ctx=await browser.newContext({viewport:{width,height:900},locale,isMobile:width===390,hasTouch:width===390});
 await ctx.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(session));
 const state={appointed,fault,release:null,current:null},calls=[],errors=[];
 function receipt(operation,next){return {version:1,operation,nextPhase:next,status:next===7?(fault==='failed'?'FAILED':'STOPPED'):next>1?'PARTIAL':'PENDING',phases:Array.from({length:next-1},(_,i)=>({phase:i+1,ok:fault!=='failed'||i!==4})),verification:next===7?{gateClosed:true,loginDisabled:true,missingRoles:0,backendSessions:0,unheldSessions:0}:null,at:'2026-11-03T12:00:00.000Z',cloudStopVerified:false,poolerCacheVerified:false};}
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin===base)return route.continue();
  check(url.origin==='https://abcdefghijklmnop.supabase.co','only synthetic provider');
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  const send=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/auth/v1/user')return send(user);
  if(url.pathname==='/rest/v1/profiles')return send({role:'participant',status:'approved',participant_code:'P-SYN-0001',consent_version:'2026-11-02',display_name:'Synthetic Alternate Account'});
  const fn=url.pathname.split('/').at(-1),args=req.postDataJSON()??{};calls.push(fn);
  if(fn==='events'||fn==='touch_last_seen')return send(null,201);
  if(fn==='training_page_v1_with_comparison')return send({version:1,boundary:'2026-11-03T12:00:00Z',summary:null,rows:[],next:null});
  if(fn==='participant_survey_v1')return send({pending:null});
  if(fn==='emergency_access_v1')return send(state.appointed);
  if(fn==='scope_page_v1')return send({version:1,rows:[],next:null,serverNow:'2026-11-03T12:00:00Z',visibleUntil:null,appointed:false});
  if(fn==='emergency_stop_receipt_v1'){
   if(fault==='denied')return send({code:'42501'},403);
   return send(state.current);
  }
  if(fn==='emergency_stop_v1'){state.current=receipt(args.p_operation,1);return send(state.current);}
  if(fn==='emergency_stop_phase_v1'){
   if(args.p_phase===1){
    if(fault==='unknown'||fault==='rejected')return send({code:fault==='unknown'?'57014':'P0001'},400);
    await new Promise(resolve=>{state.release=resolve;});
   }
   state.current=receipt(args.p_operation,args.p_phase+1);return send(state.current);
  }
  assert.fail(`unexpected request ${req.method()} ${url.pathname}`);
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 return {ctx,page,state,calls,errors};
}
async function navigate(s,locale,path){await s.page.goto(`${base}/${locale}${path?`/${path}`:""}`,{waitUntil:'networkidle'});if(path.endsWith('/practice'))await startPractice(s.page,copy[locale]);}
async function menu(s,width,m){if(width===390)await s.page.getByRole('button',{name:m.shell.openMenu,exact:true}).click();return s.page.getByRole('navigation',{name:m.shell.navigation,exact:true}).filter({visible:true});}
test('alternate emergency page: EN/AR at 390/1440, synthetic API only',{timeout:240000},async()=>{
try{
 for(const locale of ['en','ar'])for(const width of [390,1440]){
  const m=copy[locale],t=m.emergency,label=`${locale}-${width}`,s=await scenario(locale,width);
  try{
   if(before){await navigate(s,locale,'');await s.page.getByTestId('emergency-stop').waitFor({timeout:10000}).catch(async e=>{console.error({calls:s.calls,errors:s.errors,body:await s.page.locator('body').innerText()});throw e;});await capture(s.page,`${label}-home`);continue;}
   for(const path of ['','xray','xray/chest-pa-erect/practice']){
    await navigate(s,locale,path);check(await s.page.getByTestId('emergency-stop').count()===0,`${label}/${path}: no panel`);
   }
   await navigate(s,locale,'');
   const nav=await menu(s,width,m);await nav.getByRole('link',{name:t.menuEntry,exact:true}).click();await s.page.getByRole('button',{name:t.startStop,exact:true}).waitFor();
   check(s.page.url().endsWith(`/${locale}/emergency`),'dedicated URL');
   check(await s.page.locator('meta[name="robots"]').getAttribute('content')==='noindex, nofollow','route noindex');
   await audit(s.page,`${label}-page`);await capture(s.page,`${label}-page`);
   const start=s.page.getByRole('button',{name:t.startStop,exact:true}),dialog=s.page.getByRole('dialog',{name:t.dialogTitle,exact:true});
   await start.click();await audit(s.page,`${label}-dialog`);await capture(s.page,`${label}-dialog`);
   const stop=dialog.getByRole('button',{name:t.stopNow,exact:true}),confirm=dialog.getByRole('checkbox'),cancel=dialog.getByRole('button',{name:t.dialogCancel,exact:true});
   check(await stop.isDisabled(),'confirmation mandatory');await s.page.keyboard.press('Escape');check(await dialog.count()===0,'Esc closes');check(await start.evaluate(e=>e===document.activeElement),'focus returns');
   await start.click();await confirm.check();await cancel.click();await start.click();check(!await confirm.isChecked(),'cancel resets checkbox');
   await confirm.check();await stop.focus();await s.page.keyboard.press('Tab');check(await confirm.evaluate(e=>e===document.activeElement),'forward focus trap');await s.page.keyboard.press('Shift+Tab');check(await stop.evaluate(e=>e===document.activeElement),'reverse focus trap');
   check(s.calls.filter(n=>/^emergency_stop/.test(n)).length===0,'no stop calls before submit');
   for(const control of [confirm.locator('..'),cancel,stop])check(await control.evaluate(e=>e.getBoundingClientRect().height>=44),'44px target');
   await stop.click();await s.page.getByText(t.working,{exact:true}).waitFor();await s.page.getByTestId('stop-result').waitFor();
   check(await s.page.getByRole('dialog').count()===0,'submission closes only dialog');await s.page.keyboard.press('Escape');check(await s.page.getByText(t.working,{exact:true}).isVisible(),'running cannot dismiss');
   const recheck=s.page.waitForResponse('**/emergency_access_v1');await s.page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await (await recheck).finished();await s.page.waitForTimeout(100);check(await s.page.getByText(t.working,{exact:true}).isVisible(),'access recheck retains running operation');
   await audit(s.page,`${label}-running`);await capture(s.page,`${label}-running`);
   const away=await menu(s,width,m);await away.getByRole('link',{name:m.common.home,exact:true}).click();
   await s.page.getByTestId('emergency-stop').waitFor({state:'detached'});check(await s.page.getByTestId('emergency-stop').count()===0,'running: no panel on home');
   const back=await menu(s,width,m);await back.getByRole('link',{name:t.menuEntry,exact:true}).click();await s.page.getByTestId('stop-result').waitFor();check(await s.page.getByText(t.working,{exact:true}).isVisible(),'running state survives route changes');
   check(typeof s.state.release==='function','first phase pending');s.state.release();
   await s.page.getByText(t.status.STOPPED,{exact:true}).waitFor();check(await s.page.getByTestId('emergency-stop').locator('li').count()===6,'six phases');
   check(s.calls.filter(n=>n==='emergency_stop_phase_v1').length===6,'unchanged six phase flow');
   await s.page.keyboard.press('Escape');check(await s.page.getByTestId('stop-result').isVisible(),'receipt persists');
   await audit(s.page,`${label}-receipt`);await capture(s.page,`${label}-receipt`);
   const awayAfter=await menu(s,width,m);await awayAfter.getByRole('link',{name:m.common.home,exact:true}).click();await s.page.getByTestId('emergency-stop').waitFor({state:'detached'});
   const backAfter=await menu(s,width,m);await backAfter.getByRole('link',{name:t.menuEntry,exact:true}).click();await s.page.getByText(t.status.STOPPED,{exact:true}).waitFor();check(s.calls.filter(n=>n==='emergency_stop_phase_v1').length===6,'receipt survives navigation without replay');
   assert.deepEqual(s.errors,[]);
  }finally{await s.ctx.close();}
  if(before)continue;
  const normal=await scenario(locale,width,false);
  try{
   for(const path of ['','xray','xray/chest-pa-erect/practice','emergency']){
    await navigate(normal,locale,path);check(await normal.page.getByTestId('emergency-stop').count()===0,'normal: no panel');
    const nav=await menu(normal,width,m);check(await nav.getByRole('link',{name:t.menuEntry,exact:true}).count()===0,'normal: no menu entry');
    if(width===390)await normal.page.keyboard.press('Escape');
    if(path==='emergency'){await normal.page.getByText(t.pageUnavailable,{exact:true}).waitFor();check(await normal.page.locator('main button,main input').count()===0,'normal URL: no controls');}
    await audit(normal.page,`${label}-normal-${path}`);
   }
   assert.deepEqual(normal.errors,[]);check(!normal.calls.some(n=>/^emergency_stop/.test(n)),'normal: no stop calls');
  }finally{await normal.ctx.close();}
  for(const fault of ['unknown','rejected','failed','denied']){
   const s=await scenario(locale,width,true,fault);
   try{
    await navigate(s,locale,'emergency');await s.page.getByRole('button',{name:t.startStop,exact:true}).click();const dialog=s.page.getByRole('dialog',{name:t.dialogTitle,exact:true});await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:t.stopNow,exact:true}).click();
    if(fault==='failed'){await s.page.getByText(t.working,{exact:true}).waitFor();while(!s.state.release)await s.page.waitForTimeout(10);s.state.release();await s.page.getByText(t.status.FAILED,{exact:true}).waitFor();await s.page.getByRole('button',{name:t.newStop,exact:true}).click();await s.page.getByRole('dialog').getByRole('button',{name:t.dialogCancel,exact:true}).click();check(await s.page.getByTestId('stop-result').isVisible(),'retry cancel retains receipt');}
    else{await s.page.locator('main').getByRole('alert').waitFor();assert.equal(await s.page.locator('main').getByRole('alert').innerText(),t[fault],`${label}-${fault}: existing issue/denied text`);await s.page.keyboard.press('Escape');check(await s.page.locator('main').getByRole('alert').isVisible(),'issue persists');}
    await audit(s.page,`${label}-${fault}`);assert.deepEqual(s.errors,[]);
   }finally{await s.ctx.close();}
  }
 }
 if(!before){const response=await fetch(`${base}/en/does-not-exist`);check(response.status===404,'unchanged 404');check((await fetch(`${base}/zz/emergency`)).status===404,'unknown locale 404');}
 console.log(JSON.stringify({mode:before?'before':'after',checks,audits,syntheticOnly:true}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
