// Local fixture-only before/after evidence. All external requests are intercepted.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from '../preview/serve-out.mjs';
const stage = process.argv.includes('--before') ? 'before' : 'after';
const root = process.env.REVIEW_DIR ?? 'docs/review'; mkdirSync(root, {recursive:true});
const metricsPath = `${root}/rad-069b1-metrics.json`;
const metrics = existsSync(metricsPath) ? JSON.parse(readFileSync(metricsPath)) : {};
const messages = Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`))]));
const consent = readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
const user = {id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'fixture@example.test',app_metadata:{},user_metadata:{},created_at:'2026-10-15T00:00:00Z'};
const b64 = x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const session = {access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
const ids = ['wrist-pa','hand-pa','elbow-ap'];
const totals = [91.1,88.3,74,64,84,96];
const rows = totals.map((total,i)=>({id:`00000000-0000-0000-0000-${String(i+10).padStart(12,'0')}`,user_id:user.id,exam_id:ids[i%3],case_id:'default',definition_version:'fixture-definition',comparison_version:null,engine_version:'fixture-engine/1',producer_version:'fixture-writer/1',result_format_version:1,mode:'practice',record_kind:'attempt',finished_at:`2026-10-${String(24-i).padStart(2,'0')}T08:00:00Z`,result:{total,passed:i!==0&&i!==3,thresholdMet:total>=70,primaryVariant:'fixture',critical:i===0?['wrong-side-marker']:[],categories:[{c:'positioning',earned:20,weight:25}],checks:[{id:'marker',o:i===0?'fail':'pass',credit:i===0?0:1}]}}));
const history = row=>({id:row.id,exam:row.exam_id,case:row.case_id,definition:row.definition_version,comparison:row.comparison_version,engine:row.engine_version,producer:row.producer_version,format:1,time:row.finished_at,result:row.result});
const summary = {attempts:rows.length,exams:ids.length,latest:rows[0].finished_at,trainees:null};
const hosted=await startServer('out',0); const base=`http://127.0.0.1:${hosted.port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const axe=readFileSync('node_modules/axe-core/axe.min.js','utf8');
let audits=0,checks=0;
async function audit(page,label){
 await page.evaluate(axe);
 const failures=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))));
 assert.deepEqual(failures,[],label); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: overflow`); audits++;
}
try{
 for(const locale of ['en','ar']) for(const width of [390,1440]){
 const height=width===390?844:900;
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390});
 if(process.env.THEME)await ctx.addInitScript(t=>localStorage.setItem('radlab-theme',t),process.env.THEME); // RAD-069 B2a
 await ctx.addInitScript(v=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',v),JSON.stringify(session));
 let reads=0, fixtureMode="normal";const errors=[];
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();
  assert.equal(url.origin,'https://abcdefghijklmnop.supabase.co','external service forbidden');
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
  const json=data=>route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/rest/v1/profiles')return json({status:'approved',role:'participant',participant_code:'P-fixture',consent_version:consent,display_name:'Fixture Student Name'});
  if(url.pathname==='/auth/v1/user')return json(user);
  if(url.pathname==='/rest/v1/attempts'){reads++;assert.equal(url.searchParams.get('user_id'),`eq.${user.id}`);assert.ok(Number(url.searchParams.get('limit'))<=101);if(fixtureMode==='error')return route.fulfill({status:403,headers,contentType:'application/json',body:JSON.stringify({code:'42501'})});return json(fixtureMode==='empty'?[]:rows);}
  if(url.pathname==='/rest/v1/rpc/training_page_v1_with_comparison'){
   const p=req.postDataJSON();return json({version:1,boundary:'2026-10-24T12:00:00Z',summary:p.p_view==='summary'?(fixtureMode==='empty'?{attempts:0,exams:0,latest:null,trainees:null}:summary):null,rows:p.p_view==='summary'?[]:p.p_view==='exams'?ids.map(exam=>({exam,attempts:2,latest:rows.find(r=>r.exam_id===exam).finished_at})):rows.filter(r=>r.exam_id===p.p_exam).map(history),next:null});
  }
  if(url.pathname==='/rest/v1/events'||url.pathname==='/rest/v1/rpc/touch_last_seen')return json(null);
  throw Error(`Unexpected fixture request ${url.pathname}`);
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 const tag=`${locale}-${width}`;
 async function capture(name){
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({animations:"disabled",path:`${root}/rad-069b1-${stage}-${tag}-${name}.png`,fullPage:true});
  metrics[`${stage}-${tag}-${name}`]=await page.evaluate(()=>({height:document.documentElement.scrollHeight,viewport:innerHeight,screens:Number((document.documentElement.scrollHeight/innerHeight).toFixed(2))}));
  if(stage==='after'){
   await audit(page,`${tag}/${name}`);
   const target=locale==='en'?'ar':'en';
   if(width===390)await page.getByTestId('menu-toggle').click();
   const links=page.locator(`.language-switcher a[lang="${target}"]:visible`);assert.equal(await links.count(),1);
   const current=new URL(page.url());assert.equal(await links.getAttribute('href'),`/${target}${current.pathname.slice(locale.length+1)}${current.search}${current.hash}`);checks++;
   if(width===390)await page.keyboard.press('Escape');
  }
 }
 await page.goto(`${base}/${locale}`,{waitUntil:'networkidle'});await page.getByTestId('home-dashboard').waitFor();await capture('home');
 if(stage==='after'){assert.ok((await page.locator('main').innerText()).includes('Fixture Student Name'));checks++;}
 if(stage==='after'){const acts=await page.locator('.home-action').evaluateAll(n=>n.slice(0,2).map(x=>x.textContent));assert.equal(new Set(acts).size,acts.length,'Continue and Review must name different exams');checks++;}
 await page.goto(`${base}/${locale}/xray`,{waitUntil:'networkidle'});await page.getByTestId('library-categories').waitFor();await capture('library');
 const beforeReads=reads;
 for(const region of ['body','upper-limb','lower-limb']){await page.goto(`${base}/${locale}/xray#category=${region}`,{waitUntil:'networkidle'});await page.getByTestId(`library-region-${region}`).waitFor();await capture(region);}
 if(stage==='after'){assert.equal(reads,beforeReads,'category changes must not fetch once per card');checks++;}
 await page.goto(`${base}/${locale}/training`,{waitUntil:'networkidle'});await capture('training-collapsed');
 if(stage==='after'){assert.equal(await page.getByTestId('training-summary').count(),0,'practice page must not repeat the stats row');checks++;}
 if(stage==='after'){
  await page.getByRole('button',{name:messages[locale].training.showAll,exact:true}).click();
  await page.getByRole('button',{name:new RegExp(messages[locale].training.examDetails)}).first().click();
 }else{
  await page.getByTestId('training-exams').getByRole('button',{name:/Wrist|الرسغ/}).click();
 }
 if(stage==='after')await page.getByTestId('training-chart').getByRole('button',{name:/91\.1/}).focus();
 await capture('training-expanded');
 if(stage==='after'){
 const point=page.getByTestId('training-chart').getByRole('button', {name:/91\.1/});await point.focus();assert.ok(await page.getByRole('status').filter({hasText:/91.1/}).count());checks++;
 assert.match(await point.getAttribute('aria-label'),/Wrong-side marker|علامة جانب خاطئة/);checks++;
 const detailButtons=page.getByRole('button',{name:messages[locale].training.examDetails,exact:true});
 for(let i=1;i<await detailButtons.count();i++)await detailButtons.nth(i).click();
 const clipped=await page.locator('.attempt-reason').evaluateAll(n=>n.filter(x=>x.scrollWidth>x.clientWidth+1||getComputedStyle(x).textOverflow==='ellipsis').length);assert.equal(clipped,0,'critical reason must be fully readable');checks++;
 const passedPoint=page.getByTestId('training-chart').getByRole('button',{name:/88\.3/});await passedPoint.focus();
 const dark=process.env.THEME!=='light';assert.equal(await passedPoint.evaluate(n=>getComputedStyle(n).color),dark?'rgb(102, 217, 154)':'rgb(23, 97, 61)');assert.equal(await point.evaluate(n=>getComputedStyle(n).color),dark?'rgb(255, 143, 134)':'rgb(161, 33, 50)');checks++;
 assert.equal(await page.getByTestId('training-chart').count(),3);checks++;

 if(width===390){await page.getByTestId('menu-toggle').click();await audit(page,`${tag}/header-menu`);}
 const target=locale==='en'?'ar':'en';const language=page.locator(`.language-switcher a[lang="${target}"]:visible`);assert.equal(await language.count(),1);await language.click();await page.waitForURL(new RegExp(`/${target}/training`));checks++;
 fixtureMode='empty';await page.goto(`${base}/${locale}`,{waitUntil:'networkidle'});
 assert.equal(await page.locator('.home-action').count(),1);assert.equal(await page.getByTestId('training-summary').count(),0);await audit(page,`${tag}/empty-home`);checks++;
 fixtureMode='error';await page.goto(`${base}/${locale}/xray#category=upper-limb`,{waitUntil:'networkidle'});
 assert.equal(await page.locator('.saved-verdict').count(),0);assert.equal(await page.locator('main').getByRole('alert').count(),0,'library content must not show a service error');await audit(page,`${tag}/unavailable-library`);checks++;

 }
 assert.deepEqual(errors,[],`${tag}: page errors`);await ctx.close();
 }
 metrics[`${stage}-evidence`]={fixtureAttempts:rows.length,axeAudits:audits,checks};writeFileSync(metricsPath,JSON.stringify(metrics,null,2)+'\n');
 console.log(`B1 ${stage}: ${audits} axe audits, ${checks} behaviour checks; 28 screenshots`);
}finally{await browser.close();await new Promise(r=>hosted.server.close(r));}
