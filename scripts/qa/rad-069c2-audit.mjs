// Standalone fixture harness: real prepared components + real messages/CSS.
// It never mounts C2 in Next routes and never imports the deferred RPC adapter.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const qaRequire=createRequire(process.env.QA_MANIFEST??'/tmp/rad069-qa/package.json');
const {chromium}=qaRequire('playwright');
const AXE=readFileSync(qaRequire.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const sql=readFileSync('supabase/migrations/20261024000200_owner_deletion_surveys.sql','utf8');
const sus=JSON.parse(sql.match(/\('SUS',1,'(.*?)'\),/s)[1]);
const general=JSON.parse(sql.match(/\('General',1,'(.*?)'\);/s)[1]);
const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css;
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import {OwnerDeletion} from './src/features/pilot/OwnerDeletion';import {OwnerSurveys} from './src/features/pilot/OwnerSurveys';
import {SurveyReminder,ParticipantSurvey} from './src/features/pilot/ParticipantSurvey';
const root=createRoot(document.getElementById('fixture'));
window.mountFixture=(config)=>{
 window.__calls=[];let people=[{id:'self',code:'P-owner-fixture',role:'owner',status:'approved'},...Array.from({length:21},(_,i)=>({id:'person-'+i,code:'P-fixture-'+i,role:'participant',status:'approved'}))];
 let deleted=[{id:'restore',code:'P-restore-fixture',days:12,expires:'2026-11-05T00:00:00Z'},{id:'expired',code:'P-expired-fixture',days:0,expires:'2026-10-23T00:00:00Z'}];
 const definitions=window.__definitions;
 const versions=definitions.map((definition,i)=>({id:'version-'+i,survey_type:i?'General':'SUS',version:1,definition}));
 let rounds=versions.map((v,i)=>({id:'round-'+i,survey_type:v.survey_type,version:1,closed_at:i?'2026-10-23T00:00:00Z':'infinity',answered:101,pending:1}));
 const allAnswers=Array.from({length:101},(_,i)=>({id:'answer-'+i,participant_code:'P-answer-fixture-'+i,round_id:'round-0',survey_type:'General',version:1,answered_at:'2026-10-24T12:00:00Z',answers:{rating:4,liked:'=SUM(1)',improve:'عربي, "نص"\\nسطر',bug:'@SUM(1)'},score:null}));
 const ready=data=>({kind:'ready',data});
 const page=(rows,after,size=20)=>{const start=after?Number(after):0;return {rows:rows.slice(start,start+size),next:start+size<rows.length?String(start+size):null};};
 const call=async(name,args,run)=>{window.__calls.push({name,args});if(config.missing)return {kind:'unavailable'};if(config.error)throw new Error('fixture raw error must not appear');return ready(run());};
 const adapter={
 directory:(search,status,position)=>call('directory',{search,status,position},()=>{const rows=people.filter(p=>(!status||p.status===status)&&(!search||p.code.includes(search)));const part=page(rows,position.cursor?.id);return {rows:part.rows,counts:{pending:0,approved:rows.length,suspended:0},next:part.next?{cursor:{id:part.next,rank:1},boundary:'2026-10-24T00:00:00Z'}:null};}),
 deletions:after=>call('deletions',{after},()=>page(deleted,after)),
 deletion:(action,id)=>call('deletion',{action,id},()=>{if(action==='deactivate'){const p=people.find(p=>p.id===id);people=people.filter(p=>p.id!==id);deleted.push({id,code:p.code,days:30,expires:'2026-11-23T00:00:00Z'});}if(action==='restore'){const p=deleted.find(p=>p.id===id);deleted=deleted.filter(p=>p.id!==id);people.push({id,code:p.code,status:'approved',role:'participant'});}if(action==='finalise')deleted=deleted.filter(p=>p.days>0);return 1;}),
 versions:after=>call('versions',{after},()=>page(versions,after)),rounds:after=>call('rounds',{after},()=>page(rounds,after)),
 answers:(round,after,limit=20)=>call('answers',{round,after,limit},()=>page(allAnswers.map(a=>({...a,round_id:round})),after,limit)),
 open:version=>call('open',{version},()=>{const v=versions.find(v=>v.id===version);rounds.push({id:'round-new',survey_type:v.survey_type,version:v.version,closed_at:'infinity',answered:0,pending:0});return true;}),
 close:round=>call('close',{round},()=>{rounds=rounds.map(r=>r.id===round?{...r,closed_at:'2026-10-24T12:00:00Z'}:r);return true;}),setGap:days=>call('setGap',{days},()=>true),
 pending:()=>call('pending',{},()=>config.none?null:({id:'pending-response',round_id:'round-0',survey_type:config.general?'General':'SUS',version:1,definition:definitions[config.general?1:0]})),
 submit:async value=>{window.__calls.push({name:'submit',args:value});if(config.submitThrows)throw new Error('fixture raw error must not appear');return config.sentKind?{kind:config.sentKind}:ready(true);}
 };
 window.__adapter=adapter;
 const uid=config.denied?null:'self';
 root.render(<NextIntlClientProvider key={JSON.stringify(config)} locale={config.locale} messages={window.__messages} timeZone="UTC"><div className="mx-auto max-w-5xl space-y-6 p-4"><h1>RAD-069 C2 · fixture</h1>{config.screen==='owner'?<><OwnerDeletion adapter={adapter} ownerId={uid}/><OwnerSurveys adapter={adapter} ownerId={uid}/></>:config.screen==='reminder'?<><SurveyReminder adapter={adapter} participantId={uid} href="#survey"/><a href="#practice" id="practice-link">{window.__messages.home.mvpNote}</a></>:<ParticipantSurvey adapter={adapter} participantId={uid}/>}</div></NextIntlClientProvider>);
};
`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const dir='/tmp/rad069c2';mkdirSync(dir,{recursive:true});
const sheetOnly=process.argv.includes('--sheet-only');
const englishSUSOnly=process.argv.includes('--english-sus-only');
const prior=sheetOnly?JSON.parse(readFileSync(dir+'/results.json','utf8')):null;
let checks=prior?.checks??0,axes=prior?.axes??0;const snapshots=prior?.snapshots??[];
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
async function mount(locale,width,theme,screen,extra={}) {
 const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
 // Any external attempt fails this audit. Font assets are local repository files.
 let network=0;await context.route('**/*',async route=>{network++;await route.abort();});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<!doctype html><html lang="'+locale+'" dir="'+(locale==='ar'?'rtl':'ltr')+'" data-theme="'+theme+'"><head><title>C2 fixture audit</title></head><body><main class="platform-page" id="fixture"></main></body></html>');
 // Embed local fonts, avoiding even a fixture font HTTP request.
 const embedded=css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,path)=>`url("data:font/woff2;base64,${readFileSync('public'+path).toString('base64')}")`);
 await page.addStyleTag({content:embedded});
 await page.evaluate(({messages,definitions})=>{window.__messages=messages;window.__definitions=definitions;},{messages:messages[locale],definitions:[sus,general]});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(config=>window.mountFixture(config),{locale,screen,...extra});
 await page.locator('h1').waitFor();
 if(screen==='owner'&&!extra.denied)await page.getByTestId('c2-deletion').getByText(messages[locale].c2[extra.missing?'unavailable':extra.error?'error':'pendingDeletion'],{exact:true}).waitFor();
 else if(!extra.none&&!extra.denied)await page.getByTestId(screen==='reminder'?'c2-reminder':'c2-survey').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 return {context,page,errors,network:()=>network};
}
async function audit(page,tag){await page.evaluate(AXE);const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],tag);axes++;ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tag+' no overflow');}
async function capture(page,name){await page.screenshot({path:dir+'/'+name+'.jpg',fullPage:true,type:'jpeg',quality:75});snapshots.push(name);}
async function fillSurvey(page,generalMode=false){
 const form=page.getByTestId('c2-survey').locator('form');await form.waitFor();
 for(const select of await form.locator('select').all())await select.selectOption('4');
 if(generalMode){for(const textarea of await form.locator('textarea').all())await textarea.fill('Fixture feedback only');}
}
try {
 if(!sheetOnly){
 for(const locale of (englishSUSOnly?['en']:['en','ar']))for(const width of [390,1440])for(const theme of ['dark','light'])for(const missing of (englishSUSOnly?[false]:[false,true])){
  const label=[locale,width,theme,missing?'missing':'mock'].join('/'),t=messages[locale].c2;
  for(const screen of (englishSUSOnly?['survey']:['owner','reminder','survey'])){
   const f=await mount(locale,width,theme,screen,{missing});const {page}=f; console.log('auditing '+label+'/'+screen);
   if(missing){
    await page.getByText(t.unavailable,{exact:true}).first().waitFor();
    const initial=await page.evaluate(()=>window.__calls.length);
    await page.waitForTimeout(80);ok(await page.evaluate(()=>window.__calls.length)===initial,label+'/'+screen+' missing does not retry');
    ok(await page.getByRole('alert').count()===0,label+' missing is a waiting state');
   }else if(screen==='owner'){
    const deletion=page.getByTestId('c2-deletion');
    ok(await deletion.getByText('P-fixture-20',{exact:true}).count()===0,label+' directory first page bounded');
    ok(await deletion.getByText('P-expired-fixture',{exact:true}).count()===1,label+' pending separate');
    ok(await deletion.getByRole('button',{name:t.deactivate,exact:true}).first().isDisabled(),label+' self deletion disabled');
    await deletion.getByRole('button',{name:t.deactivate,exact:true}).nth(1).click();
    const confirm=page.getByTestId('c2-confirm');await confirm.waitFor();
    ok(await confirm.getByRole('button',{name:t.confirmDeactivate,exact:true}).isDisabled(),label+' two-step acknowledgement');
    await audit(page,label+'/confirmation');
    await confirm.getByRole('checkbox').check();await confirm.getByRole('button',{name:t.confirmDeactivate,exact:true}).click();
    await page.getByTestId('c2-confirm').waitFor({state:'detached'});
    const pending=deletion.locator('li').filter({hasText:'P-fixture-0'});await pending.getByRole('button',{name:t.restore,exact:true}).waitFor();
    ok((await pending.innerText()).includes('30'),label+' thirty days');
    await pending.getByRole('button',{name:t.restore,exact:true}).click();
    await deletion.locator('li').filter({hasText:'P-fixture-0'}).getByRole('button',{name:t.restore,exact:true}).waitFor({state:'detached'});
    await deletion.getByRole('button',{name:t.finalise,exact:true}).click();await deletion.getByText('P-expired-fixture',{exact:true}).waitFor({state:'detached'});
    await deletion.getByRole('button',{name:t.next,exact:true}).first().click();await deletion.getByText('P-fixture-20',{exact:true}).waitFor();
    const surveys=page.getByTestId('c2-surveys');
    await surveys.getByRole('combobox').selectOption('version-1');await surveys.getByRole('button',{name:t.openRound,exact:true}).click();await surveys.getByText('round-new',{exact:true}).waitFor();
    await surveys.locator('li').filter({hasText:'round-new'}).getByRole('button',{name:t.closeRound,exact:true}).click();await surveys.locator('li').filter({hasText:'round-new'}).getByRole('button',{name:t.closeRound,exact:true}).waitFor({state:'detached'});
    await surveys.getByRole('spinbutton').fill('8');await surveys.getByRole('button',{name:t.saveGap,exact:true}).click();
    await surveys.locator('li').filter({hasText:'round-0'}).getByRole('button',{name:t.viewAnswers,exact:true}).click();const answers=page.getByTestId('c2-answers');await answers.waitFor();
    ok(await answers.locator('li').count()===20,label+' answers bounded');
    await answers.getByRole('button',{name:t.nextAnswers,exact:true}).click();await answers.getByText('P-answer-fixture-20',{exact:true}).waitFor();
    const [part1]=await Promise.all([page.waitForEvent('download'),answers.getByRole('button',{name:t.export,exact:true}).click()]);
    const csv=readFileSync(await part1.path(),'utf8');ok(csv.includes("'=SUM(1)")&&csv.includes("'@SUM(1)")&&csv.includes('"عربي, ""نص""\nسطر"'),label+' escaped multilingual CSV');
    ok(!csv.includes('P-answer-fixture-100')&&!csv.includes('email'),label+' export only first 100, code only');
    const [part2]=await Promise.all([page.waitForEvent('download'),answers.getByRole('button',{name:t.exportNext.replace('{part}','2'),exact:true}).click()]);
    ok(readFileSync(await part2.path(),'utf8').includes('P-answer-fixture-100'),label+' explicit next part');
    ok(await page.evaluate(()=>window.__calls.filter(c=>c.name==='answers'&&c.args.limit===100).length)===2,label+' no export prefetch');
   }else if(screen==='reminder'){
    ok(await page.locator('#practice-link').isVisible(),label+' Practice remains accessible');
    ok(await page.getByRole('link',{name:t.feedback,exact:true}).getAttribute('href')==='#survey',label+' feedback opens pending page');
   }else {
    const labels=await page.getByTestId('c2-survey').locator('form label').allTextContents();
    ok(labels.length===10&&labels.every((label,i)=>label===sus.questions[i].label),label+' exact English SUS');
    if(locale==='ar'&&width===390&&theme==='dark')await capture(page,'survey-form');
    await fillSurvey(page);await page.getByRole('button',{name:t.submit,exact:true}).click();await page.getByText(t.sent,{exact:true}).waitFor();
    const value=await page.evaluate(()=>window.__calls.find(c=>c.name==='submit').args);
    ok(value.id==='pending-response'&&Object.keys(value).length===2&&Object.keys(value.answers).length===10,label+' response-id-bound submission');
   }
   await audit(page,label+'/'+screen);
   if(locale==='ar'&&width===390&&theme==='dark')await capture(page,screen+'-'+(missing?'missing':'mock'));
   ok(f.errors.length===0,label+'/'+screen+' no page errors: '+f.errors);ok(f.network()===0,label+'/'+screen+' no network');await f.context.close();
  }
  console.log(label+': passed');
 }
 if(!englishSUSOnly){
 for(const sentKind of ['already','closed','stale','unavailable','error']){
  const {context,page}=await mount('ar',390,'dark','survey',{general:true,sentKind});await fillSurvey(page,true);await page.getByRole('button',{name:messages.ar.c2.submit,exact:true}).click();const key={closed:'roundClosed',already:'already',stale:'stale',unavailable:'unavailable',error:'error'}[sentKind];await page.getByText(messages.ar.c2[key],{exact:true}).waitFor();await audit(page,'general/'+sentKind);if(sentKind==='error')await capture(page,'general-error');await context.close();
 }
 for(const screen of ['owner','reminder','survey']){
  const {context,page}=await mount('en',390,'light',screen,{error:true});await page.getByRole('alert').first().waitFor();ok(!(await page.locator('body').innerText()).includes('raw error'),'raw diagnostics hidden');await audit(page,'adapter throw/'+screen);await context.close();
 }
 {
  const {context,page}=await mount('ar',390,'dark','owner',{denied:true});await page.getByText(messages.ar.c2.ownerOnly,{exact:true}).first().waitFor();ok(await page.evaluate(()=>window.__calls.length)===0,'nonowner makes no calls');await audit(page,'owner denied');await context.close();
 }
 {
  const {context,page}=await mount('en',390,'light','reminder',{none:true});ok(await page.getByTestId('c2-reminder').count()===0,'no reminder if server not eligible');ok(await page.locator('#practice-link').isVisible(),'Practice accessible without survey eligibility');await context.close();
 }
 }
 }
 if(!englishSUSOnly){
 // Small contact sheet only; complete screenshots stay in /tmp.
 const sheet=await browser.newPage({viewport:{width:1170,height:900}});
 const selected=['owner-mock','owner-missing','reminder-mock','reminder-missing','survey-form','survey-missing'];
 await sheet.setContent('<html lang="ar"><head><title>C2 review fixtures</title></head><body style="margin:0;display:grid;grid-template-columns:repeat(3,390px);background:white">'+selected.map(name=>'<figure style="margin:0;width:390px;height:1200px;overflow:hidden"><figcaption style="font:16px sans-serif;padding:8px;color:black">'+name+' · AR390 dark · fixtures</figcaption><img style="width:390px" src="data:image/jpeg;base64,'+readFileSync(dir+'/'+name+'.jpg').toString('base64')+'"/></figure>').join('')+'</body></html>');
 await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));mkdirSync('docs/review',{recursive:true});await sheet.screenshot({path:'docs/review/rad069c2-ui.jpg',type:'jpeg',quality:75,fullPage:true});await sheet.close();
 ok(statSync('docs/review/rad069c2-ui.jpg').size<5*1024*1024,'review artifact below 5 MB');
 writeFileSync(dir+'/results.json',JSON.stringify({checks,axes,snapshots,bytes:statSync('docs/review/rad069c2-ui.jpg').size},null,2));console.log(JSON.stringify({checks,axes,bytes:statSync('docs/review/rad069c2-ui.jpg').size}));
 }else{writeFileSync(dir+'/en-sus-results.json',JSON.stringify({checks,axes},null,2));console.log(JSON.stringify({checks,axes}));}
}finally{await browser.close();}
