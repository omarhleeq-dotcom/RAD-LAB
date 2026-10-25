// Offline synthetic data only; real participant components, messages, CSS and local fonts.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const qaRequire=createRequire(process.env.QA_MANIFEST??'/tmp/rad083-qa/package.json');
const {chromium}=qaRequire('playwright');
const axe=readFileSync(qaRequire.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const sql=readFileSync('supabase/migrations/20261024000200_owner_deletion_surveys.sql','utf8');
const definitions={SUS:JSON.parse(sql.match(/\('SUS',1,'(.*?)'\),/s)[1]),General:JSON.parse(sql.match(/\('General',1,'(.*?)'\);/s)[1])};
const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import {ParticipantSurvey,SurveyReminder} from './src/features/pilot/ParticipantSurvey';
const root=createRoot(document.getElementById('fixture'));
window.mount=(config)=>{
 const pending={id:'synthetic-response',round_id:'synthetic-round',survey_type:config.type,version:config.version??1,definition:window.definition};
 window.submissions=[];
 const adapter={pending:async()=>({kind:'ready',data:pending}),submit:async(value)=>{window.submissions.push(JSON.stringify(value));return {kind:'ready',data:true};}};
 root.render(<NextIntlClientProvider locale={config.locale} messages={window.messages} timeZone="UTC"><div className="mx-auto max-w-5xl space-y-6 p-4"><h1>RAD-083 · synthetic survey</h1>{config.screen==='reminder'?<><SurveyReminder adapter={adapter} participantId="synthetic-participant" href="#survey"/><a href="#practice" id="practice-link">Practice</a></>:<ParticipantSurvey adapter={adapter} participantId="synthetic-participant"/>}</div></NextIntlClientProvider>);
};`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const dir='/tmp/rad083-survey';mkdirSync(dir,{recursive:true});
let checks=0,axes=0;const captures=[],payloads={};
const ok=(value,label)=>{assert.ok(value,label);checks++;};
async function mount(locale,width,theme,screen,type='SUS',extra={}){
 const context=await browser.newContext({viewport:{width,height:900}});let network=0;
 await context.route('**/*',route=>{network++;return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}" data-theme="${theme}"><head><title>Survey fixture audit</title></head><body><main class="platform-page" id="fixture"></main></body></html>`);
 await page.addStyleTag({content:css});
 const catalog=structuredClone(messages[locale]);
 if(extra.missingKey)delete catalog.c2.surveyDisplay[type].v1[extra.missingKey];
 await page.evaluate(({catalog,definition})=>{window.messages=catalog;window.definition=definition;},{catalog,definition:definitions[type]});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(config=>window.mount(config),{locale,screen,type,...extra});
 await page.getByTestId(screen==='reminder'?'c2-reminder':'c2-survey').waitFor();
 if(screen==='survey')await page.locator('form').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 return {page,context,errors,network:()=>network};
}
async function audit(page,tag){
 await page.evaluate(axe);const result=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
 assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],tag);axes++;
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tag+' no horizontal overflow');
}
try{
 for(const locale of ['en','ar'])for(const width of [390,1440])for(const theme of ['dark','light'])for(const screen of ['survey','reminder'])for(const type of (screen==='survey'?['SUS','General']:['SUS'])){
  const tag=[locale,width,theme,screen,type].join('-'),{page,context,errors,network}=await mount(locale,width,theme,screen,type),t=messages[locale].c2;
  if(screen==='survey'){
   const questions=definitions[type].questions;
   const labels=await page.locator('form legend,form div > label.block').allTextContents();
   assert.deepEqual(labels,questions.map(q=>(locale==='ar'?t.surveyDisplay[type].v1[q.id]:q.label)+(q.optional?` (${t.optional})`:'')));checks++;
   ok((await page.locator('form').innerText()).includes(t.instructions),tag+' translated instructions');
   for(const group of await page.locator('fieldset').all()){
    const radios=group.getByRole('radio');ok(await radios.count()===5,tag+' five radios');
    const attrs=await radios.evaluateAll(nodes=>nodes.map(n=>({name:n.name,value:n.value,required:n.required})));
    ok(attrs.every((a,i)=>a.name===attrs[0].name&&a.value===String(i+1)&&a.required),tag+' stable radio ids and values');
    const boxes=await radios.evaluateAll(nodes=>nodes.map(n=>{const b=n.closest('label').getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));
    ok(boxes.every((b,i)=>b.w>=44&&b.h>=44&&Math.abs(b.y-boxes[0].y)<1&&(!i||(locale==='ar'?b.x<boxes[i-1].x:b.x>boxes[i-1].x))),tag+' RTL/LTR target order');
    const endpoints=group.getByTestId('c2-scale-endpoints');assert.deepEqual(await endpoints.locator('span').allTextContents(),[t.scaleStart,t.scaleEnd]);checks++;
    const ends=await endpoints.locator('span').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().x));ok(locale==='ar'?ends[0]>ends[1]:ends[0]<ends[1],tag+' endpoint direction');
    await radios.nth(0).focus();await page.keyboard.press('ArrowDown');ok(await radios.nth(1).isChecked(),tag+' down selects next');await page.keyboard.press('ArrowUp');ok(await radios.nth(0).isChecked(),tag+' up selects previous');
    await radios.nth(3).check();
   }
   for(const textarea of await page.locator('textarea').all())await textarea.fill('Synthetic feedback نص');
  }else{
   ok(await page.getByText(t.reminder,{exact:true}).isVisible(),tag+' translated reminder');
   ok(await page.locator('#practice-link').isVisible(),tag+' Practice accessible');
   ok(await page.getByRole('link',{name:t.feedback,exact:true}).getAttribute('href')==='#survey',tag+' survey link');
  }
  await audit(page,tag);
  await page.screenshot({path:`${dir}/${tag}.jpg`,type:'jpeg',quality:75,fullPage:true});captures.push(tag);
  if(screen==='survey'){
   await page.getByRole('button',{name:t.submit,exact:true}).click();await page.getByText(t.sent,{exact:true}).waitFor();
   const bytes=await page.evaluate(()=>window.submissions[0]);
   const expected={id:'synthetic-response',answers:Object.fromEntries(definitions[type].questions.map(q=>[q.id,q.kind==='rating'?4:'Synthetic feedback نص']))};
   ok(bytes===JSON.stringify(expected),tag+' exact expected payload');
   if(payloads[type])ok(bytes===payloads[type],tag+' EN/AR byte identity');payloads[type]=bytes;
  }
  ok(errors.length===0,tag+' no page errors: '+errors);ok(network()===0,tag+' zero network');
  await context.close();console.log(tag+' passed');
 }
 for(const type of ['SUS','General'])for(const extra of [{version:2},{missingKey:type==='SUS'?'q1':'rating'}]){
  const {page,context,errors}=await mount('ar',390,'dark','survey',type,extra);
  const legends=page.locator('legend');
  ok(await legends.first().textContent()===definitions[type].questions[0].label,type+' English fallback');
  ok(await legends.first().getAttribute('lang')==='en'&&await legends.first().getAttribute('dir')==='ltr',type+' fallback language/direction');
  if(extra.version)assert.deepEqual(await page.locator('form legend,form div > label.block').allTextContents(),definitions[type].questions.map(q=>q.label+(q.optional?' (اختياري)':'')));
  await audit(page,type+' fallback');ok(errors.length===0,type+' no intl fallback errors');await context.close();
 }
 // Only the changed screens are committed; the complete matrix stays local.
 for(const [name,selected] of Object.entries({survey:['ar-390-dark-survey-SUS','ar-390-light-survey-General','en-390-light-survey-SUS'],reminder:['ar-390-dark-reminder-SUS','ar-1440-light-reminder-SUS','en-390-light-reminder-SUS']})){
  const page=await browser.newPage({viewport:{width:1170,height:900}});
  await page.setContent('<html lang="en"><head><title>Synthetic survey review</title></head><body style="margin:0;display:grid;grid-template-columns:repeat(3,390px);background:#fff">'+selected.map(tag=>`<figure style="margin:0"><figcaption style="font:14px sans-serif;padding:8px;color:#000">${tag} · synthetic data</figcaption><img style="width:390px" src="data:image/jpeg;base64,${readFileSync(dir+'/'+tag+'.jpg').toString('base64')}"/></figure>`).join('')+'</body></html>');
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:`docs/review/rad083-${name}.jpg`,type:'jpeg',quality:78,fullPage:true});await page.close();
 }
 const bytes=['survey','reminder'].reduce((total,name)=>total+statSync(`docs/review/rad083-${name}.jpg`).size,0);ok(bytes<5*1024*1024,'committed screenshots total <=5 MB');
 const result={checks,axes,captures:captures.length,screenshotBytes:bytes,payloads};writeFileSync(dir+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
