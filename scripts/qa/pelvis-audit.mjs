// Pelvis AP UI/renderer integration audit. No changes to prior exams or hashes.
// BASE=http://127.0.0.1:3100 CHROMIUM=/usr/bin/chromium node scripts/qa/pelvis-audit.mjs
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
const BASE=process.env.BASE??"http://127.0.0.1:3100";
const OUT=process.env.OUT??"/tmp/rad-lab-qa-pelvis";
mkdirSync(OUT,{recursive:true});
const axe=readFileSync("node_modules/axe-core/axe.min.js","utf8");
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??"/usr/bin/chromium",args:["--no-sandbox"]});
let checks=0,failures=0;
const ok=(name,value,detail="")=>{checks++;if(!value){failures++;console.error("FAIL",name,detail);}};
for(const locale of ["en","ar"])for(const width of [1440,390]){
 const tag=`${locale}-${width}`;
 const m=JSON.parse(readFileSync(`messages/${locale}.json`,"utf8"));
 const page=await browser.newPage({viewport:{width,height:900},locale:locale==="ar"?"ar":"en-US"});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 const set=(label,value)=>page.getByRole("slider",{name:label,exact:true}).evaluate((n,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(n,String(v));n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}));},value);
 const choice=async(name,id)=>{const map={legPosition:{internal:locale==="en"?"Internally rotated 15°–20°":"دوران داخلي 15°–20°",neutral:locale==="en"?"Neutral":"محايد",external:locale==="en"?"Externally rotated":"دوران خارجي"},respiration:{suspend:locale==="en"?"Suspend respiration during exposure":"احبس نَفَسك أثناء التعريض",normal:locale==="en"?"Breathe normally":"تنفّس بشكل طبيعي",none:locale==="en"?"No breathing instruction":"دون تعليمات تنفس"}};await page.locator("label").filter({hasText:map[name][id]}).click();};
 const checkAxe=async(stage)=>{await page.evaluate(axe);const r=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa"]}}));ok(`${tag} axe ${stage}`,r.violations.length===0,JSON.stringify(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));};
 await page.goto(`${BASE}/${locale}/xray/pelvis-ap-supine`,{waitUntil:"networkidle"});
 ok(`${tag} hub`,await page.getByRole("heading",{level:1}).count()===1);
 await checkAxe("hub");
 const attempt=async(name,{rotation=0,marker=true,legs="internal",respiration="suspend"}={})=>{
  await page.goto(`${BASE}/${locale}/xray/pelvis-ap-supine/practice`,{waitUntil:"networkidle"});
  await set(m.positioningPelvis.rotation,rotation);
  await set(m.console.tubeAngulation,0);await set(m.positioning.centerX,0);await set(m.positioning.centerY,17.5);
  await set(m.positioning.collWidth,42);await set(m.positioning.collHeight,33.5);
  await set(m.console.sid,102);await set(m.console.kvp,85);await set(m.console.mas,7);
  await choice("legPosition",legs);await choice("respiration",respiration);
  await page.locator('label:has(input[name="side-marker"])').nth(marker?2:0).click();
  // The patient is cooperative; keep-still instruction drives motion independently.
  const still=m.patient.motionOptions["remain-still"].replace(/^\{sex, select, female \{.*?\} other \{(.*)\}\}$/s,"$1");
  await page.locator('label:has(input[type="radio"])').filter({hasText:still}).last().click();
  ok(`${tag} ${name}: result hidden before expose`,await page.locator('[data-testid="radiograph"]').count()===0);
  if(name==="correct"){
   await checkAxe("setup");await page.screenshot({path:`${OUT}/${tag}-setup.png`,fullPage:true});
  }
  await page.getByRole("button",{name:m.console.expose,exact:true}).click();
  await page.waitForSelector('[data-testid="radiograph"][data-status="ready"]',{timeout:30000});
  const score=Number((await page.locator('[aria-labelledby="result-heading"] [role="status"] div').first().innerText()).trim());
  const critical=await page.locator('[data-critical]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-critical')));
  const alt=await page.locator('[data-testid="radiograph"] canvas').getAttribute('aria-label');
  ok(`${tag} ${name}: pelvis image alternative`,alt.startsWith(m.radiograph['pelvis-ap'].alt),alt);
  ok(`${tag} ${name}: no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`${OUT}/${tag}-${name}.png`,fullPage:true});
  const pixels=await page.locator('[data-testid="radiograph"] canvas').evaluate(c=>c.toDataURL());
  return {score,critical,pixels};
 };
 const good=await attempt("correct");ok(`${tag} score100`,good.score===100,String(good.score));ok(`${tag} no critical`,good.critical.length===0,good.critical.join());await checkAxe("correct result");
 const rotated=await attempt("rotation",{rotation:10});ok(`${tag} rotation changes pixels`,rotated.pixels!==good.pixels);ok(`${tag} rotation reduces score`,rotated.score<100,String(rotated.score));
 const bad=await attempt("incorrect",{marker:false,legs:"neutral",respiration:"normal"});ok(`${tag} critical missing marker`,bad.critical.includes('missing-marker'));ok(`${tag} incorrect lower score`,bad.score<100);await checkAxe("incorrect result");
 ok(`${tag} no runtime/console error`,errors.length===0,JSON.stringify(errors));
 await page.close();
}
await browser.close();console.log(`${checks} checks, ${failures} failures`);process.exit(failures?1:0);
