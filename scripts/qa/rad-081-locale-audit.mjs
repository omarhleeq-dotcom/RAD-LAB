// RAD-081 B: real locale links and workspace controls; no store access or pilot requests.
// BASE=http://localhost:3100 CHROMIUM=/usr/bin/chromium node scripts/qa/rad-081-locale-audit.mjs
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {driver,startPractice} from './workspace.mjs';
const BASE=process.env.BASE??'http://localhost:3100',OUT=process.env.OUT??'/tmp/rad081-locale';
mkdirSync(OUT,{recursive:true});
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`))]));
const axe=readFileSync('node_modules/axe-core/axe.min.js','utf8');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
let audits=0;const rows=[];
const inputs=p=>p.locator('main input').evaluateAll(nodes=>nodes.map(n=>({type:n.type,value:n.value,checked:n.checked})));
const score=async p=>parseFloat(await p.locator('[aria-labelledby="result-heading"] [role="status"] .font-mono').innerText());
async function audit(p,label){
 await p.evaluate(axe);
 const r=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
 assert.deepEqual(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');audits++;
}
async function switchTo(p,locale){
 const label=locale==='ar'?'العربية':'English';
 if(!await p.getByRole('link',{name:label,exact:true}).filter({visible:true}).count()){
  const current=await p.locator('html').getAttribute('lang');
  await p.getByRole('button',{name:messages[current].shell.openMenu,exact:true}).click();
 }
 await p.getByRole('link',{name:label,exact:true}).filter({visible:true}).first().click();
 await p.waitForURL(u=>u.pathname.startsWith('/'+locale+'/'));
 await p.waitForFunction(l=>document.documentElement.lang===l,locale);
}
try{
 for(const exam of ['wrist-pa','wrist-lateral'])for(const locale of ['en','ar'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),p=await context.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const tag=`${exam}-${locale}-${width}`,other=locale==='en'?'ar':'en';console.log(tag);
  await p.goto(`${BASE}/${locale}/xray/${exam}/practice?case=adult-demo`,{waitUntil:'networkidle'});
  await startPractice(p,messages[locale]);
  const m=messages[locale],dr=driver(p,m);
  const radio=text=>p.locator('label',{hasText:text}).filter({has:p.locator('input[type="radio"]')}).first();
  await dr.click(radio(m.console.projections[exam]));
  await dr.slider(m.positioningWrist.rotation,0);
  await dr.click(p.locator('label:has(input[name="side-marker"])').nth(1));
  for(const [label,value] of [[m.positioning.centerX,0],[m.positioning.centerY,exam==='wrist-pa'?10:11],[m.positioning.collWidth,14],[m.positioning.collHeight,exam==='wrist-pa'?16:14],[m.console.sid,105],[m.console.kvp,exam==='wrist-pa'?60:65],[m.console.mas,7]])await dr.slider(label,value);
  const motion=m.patient.motionOptions['remain-still'].replace(/^\{sex, select, female \{.*?\} other \{(.*)\}\}$/s,'$1');
  await dr.click(radio(motion));
  const before=await inputs(p);
  await audit(p,tag+' setup');
  await switchTo(p,other);await startPractice(p,messages[other]);
  assert.equal(new URL(p.url()).search,'?case=adult-demo');assert.deepEqual(await inputs(p),before,tag+' setup settings');
  await audit(p,tag+' switched setup');
  await p.screenshot({path:`${OUT}/${tag}-setup-switched.jpg`,type:'jpeg',quality:80,fullPage:true});
  await driver(p,messages[other]).click(p.getByRole('button',{name:messages[other].console.expose,exact:true}));
  await p.locator('[data-testid="radiograph"][data-status="ready"]').waitFor();
  assert.equal(await score(p),100,tag+' score');await audit(p,tag+' result');
  await switchTo(p,locale);
  await p.locator('[data-testid="radiograph"][data-status="ready"]').waitFor();
  assert.equal(await score(p),100,tag+' kept result');
  assert.equal(await p.getByRole('button',{name:messages[locale].console.expose,exact:true}).count(),0,tag+' result phase');
  await audit(p,tag+' switched result');
  await p.screenshot({path:`${OUT}/${tag}-result-switched.jpg`,type:'jpeg',quality:80,fullPage:true});
  assert.deepEqual(errors,[],tag+' browser errors');rows.push({tag,score:100,setupKept:true,resultKept:true});await context.close();
 }
 writeFileSync(`${OUT}/results.json`,JSON.stringify({audits,rows},null,2));console.log(JSON.stringify({audits,flows:rows.length,OUT}));
}finally{await browser.close();}
