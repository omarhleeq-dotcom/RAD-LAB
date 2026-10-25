// Synthetic local browser review of the real UI. No credentials, external service, store access for control finding, or hosted preview.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import postcss from 'postcss';import tailwind from '@tailwindcss/postcss';
import {chromium} from 'playwright';
import {startPractice,driver} from './workspace.mjs';
const BEFORE=process.argv.includes('--before'),BASE='e85d7ef311c3f5272dee3faabee91cb5eaca16df',OUT=process.env.OUT??'/tmp/rad081-owner-audit';mkdirSync(OUT,{recursive:true});
const stage=BEFORE?'before':'after',root=process.cwd();
const read=p=>BEFORE?execFileSync('git',['show',`${BASE}:${p}`],{encoding:'utf8',maxBuffer:16*1024*1024}):readFileSync(p,'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(read(`messages/${l}.json`))]));
const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
const mocks={
 navigation:`import React from 'react';export const Link=({href,locale,prefetch,children,...p})=><a {...p} href={href}>{children}</a>;export const usePathname=()=>location.pathname.replace(/^\\/(en|ar)/,'');export const useRouter=()=>({replace(){},push(){}});`,
 nextnav:`export const useSearchParams=()=>new URLSearchParams(location.search);export const usePathname=()=>location.pathname;export const useRouter=()=>({replace(){}});`,
 session:`export const useOptionalSessionAccount=()=>null;export const useSessionAccount=()=>window.__account;`,
 client:`export const getPilotClient=async()=>null;`,
};
const bundle=await build({stdin:{resolveDir:root,loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import {AppShell} from './src/components/shell/AppShell';import {AccountPanel} from './src/features/pilot/AccountPanel';import {SimulationWorkspace} from './src/features/simulation/SimulationWorkspace';import {useSimulationStore} from './src/stores/simulation-store';import {CASES} from './src/data/cases';import {evaluate} from './src/features/evaluation/engine';import {CONSENT_VERSION} from './src/features/pilot/consent';
const root=createRoot(document.getElementById('fixture'));
window.mount=c=>{
 window.__calls=[];window.__account={state:{kind:'signedIn',userId:'synthetic',email:'synthetic@example.test',displayName:'Saved Name',consentVersion:CONSENT_VERSION,profile:{status:'approved',role:'participant',code:'P-test'}},recovery:null,consumeRecovery(){},saveName:async v=>{window.__calls.push(v);return true;}};
 const rad=CASES.find(x=>x.id===(c.exam??'wrist-pa'));useSimulationStore.getState().loadCase(rad.id);
 let settings={...rad.initialSettings};
 if(c.kind==='marker')settings={...settings,projection:'wrist-pa',rotationDeg:0,centralRay:{x:0,y:-1/6},collimation:{width:14/18,height:16/24},sideMarker:'L',markerPosition:{x:-.42,y:-.16},sidCm:105,kvp:60,mas:2.5,motionInstruction:'remain-still'};
 if(c.kind==='mixed'){let found;for(const width of [.3,.5,.75,1])for(const height of [.3,.5,.75,1]){const s={...settings,projection:rad.requiredProjection,centralRay:rad.positioning.centering.target,collimation:{width,height},sideMarker:null},r=evaluate(rad,s);if(r.checks.some(x=>x.ruleId==='collimation-clipping'&&x.outcome==='fail')&&r.checks.some(x=>x.ruleId==='collimation-excess'&&x.outcome==='partial'))found=s;}if(!found)throw Error('no mixed witness');settings=found;}
 useSimulationStore.setState({settings});if(c.result)useSimulationStore.getState().expose();
 root.render(<NextIntlClientProvider key={JSON.stringify(c)} locale={c.locale} messages={window.__messages} timeZone="UTC"><AppShell><main id="main-content">{c.account?<div className="mx-auto max-w-3xl p-4"><h1>{window.__messages.account.title}</h1><AccountPanel/></div>:<SimulationWorkspace caseId={rad.id}/>}</main></AppShell></NextIntlClientProvider>);
};
`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://vlacestfruxooznrcjqc.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_test_123456"'},plugins:[{name:'local-evidence',setup(b){
 b.onResolve({filter:/(i18n\/navigation|next\/navigation|^\.\/SessionGate$|^\.\/client$)$/},a=>({path:a.path==='./SessionGate'?'session':a.path==='./client'?'client':a.path==='next/navigation'?'nextnav':'navigation',namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));
 if(BEFORE)b.onLoad({filter:/\/(src|messages)\/.*\.(tsx?|json)$/},a=>({contents:read(a.path.slice(root.length+1)),loader:a.path.endsWith('.json')?'json':a.path.endsWith('.tsx')?'tsx':'ts'}));
}}]});
const axe=readFileSync('node_modules/axe-core/axe.min.js','utf8'),browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});let axes=0;const frames=[];
async function audit(p,label){await p.evaluate(axe);const a=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(a.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[],label);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');axes++;}
async function mount(locale,width,theme,c){
 const context=await browser.newContext({viewport:{width,height:900}}),p=await context.newPage();const errors=[];let external=0;p.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='rad081.test'){external++;return route.abort();}const asset='public'+decodeURIComponent(u.pathname);if(existsSync(asset)&&!u.pathname.endsWith('/'))return route.fulfill({path:asset});return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}" data-theme="${theme}"><head><title>RAD-081 local review</title></head><body><div id="fixture"></div></body></html>`});});
 await p.goto(`http://rad081.test/${locale}/${c.account?'account':'xray/'+(c.exam??'wrist-pa')+'/practice'}`);await p.addStyleTag({content:css});await p.evaluate(m=>window.__messages=m,messages[locale]);await p.addScriptTag({content:bundle.outputFiles[0].text});await p.evaluate(c=>window.mount(c),{locale,...c});
 if(!c.account&&!c.result)await startPractice(p,messages[locale]).catch(e=>{console.error({config:c,errors});throw e;});if(c.result)await p.locator('[data-testid="radiograph"][data-status="ready"]').waitFor();await p.evaluate(()=>document.fonts.ready);
 return {p,context,errors,external:()=>external};
}
try{
 for(const locale of ['en','ar'])for(const width of [390,1440])for(const theme of ['dark','light']){
  const tag=`${locale}-${width}-${theme}`,m=messages[locale];console.log(stage,tag);
  const scene=await mount(locale,width,theme,{kind:'marker'}),p=scene.p,dr=driver(p,m);
  await audit(p,tag+' guides on');await p.screenshot({path:`${OUT}/${stage}-${tag}-marker.jpg`,type:'jpeg',quality:75,fullPage:true});
  const guides=p.getByRole('checkbox',{name:m.positioning.guides,exact:true});await dr.reveal(guides);if(await guides.isChecked())await dr.click(guides.locator("xpath=ancestor::label"));assert.equal(await guides.isChecked(),false);
  assert.equal(await p.locator('svg [aria-label]').filter({hasText:'Measured marker square'}).count(),0);await audit(p,tag+' guides off');
  await p.screenshot({path:`${OUT}/${stage}-${tag}-off.jpg`,type:'jpeg',quality:75,fullPage:true});assert.deepEqual(scene.errors,[]);assert.equal(scene.external(),0);await scene.context.close();
  for(const exam of ['hand-pa','chest-pa-erect']){
   const r=await mount(locale,width,theme,{exam,kind:'mixed',result:true});await audit(r.p,tag+' mixed '+exam);await r.p.screenshot({path:`${OUT}/${stage}-${tag}-${exam}-mixed.jpg`,type:'jpeg',quality:75,fullPage:true});assert.deepEqual(r.errors,[]);assert.equal(r.external(),0);await r.context.close();
  }
  const a=await mount(locale,width,theme,{account:true}),q=a.p,t=m.training;
  await q.getByTestId('profile-name').waitFor();await audit(q,tag+' account');await q.screenshot({path:`${OUT}/${stage}-${tag}-account.jpg`,type:'jpeg',quality:75,fullPage:true});
  if(!BEFORE){
   assert.equal(await q.getByRole('textbox',{name:t.name,exact:true}).count(),0);
   await q.getByRole('button',{name:t.editName,exact:true}).click();await q.getByRole('textbox',{name:t.name,exact:true}).fill('Discarded Name');await q.getByRole('button',{name:t.cancelName,exact:true}).click();assert.deepEqual(await q.evaluate(()=>window.__calls),[]);
   await q.getByRole('button',{name:t.editName,exact:true}).click();assert.equal(await q.getByRole('textbox',{name:t.name,exact:true}).inputValue(),'Saved Name');
   await q.getByRole('textbox',{name:t.name,exact:true}).fill('New Saved Name');await audit(q,tag+' edit');await q.getByRole('button',{name:t.save,exact:true}).click();await q.getByRole('status').filter({hasText:t.saved}).waitFor();assert.deepEqual(await q.evaluate(()=>window.__calls),['New Saved Name']);assert.equal(await q.getByRole('textbox',{name:t.name,exact:true}).count(),0);await audit(q,tag+' saved');
  }
  assert.deepEqual(a.errors,[]);assert.equal(a.external(),0);await a.context.close();
 }
 // Current main drawing only: all existing frame labels at both sizes, independent of other recorded views' collisions.
 for(const locale of ['en','ar'])for(const width of [390,1440]){
  const ids=[...readFileSync('src/data/exams/index.ts','utf8').matchAll(/from "\.\/xray\/([a-z0-9-]+)"/g)].map(m=>m[1]);
  for(const exam of ids){const r=await mount(locale,width,'dark',{exam});const values=await r.p.locator('section[aria-labelledby="pos-heading"] > div figure').first().locator('svg').evaluateAll(nodes=>nodes.map(svg=>{const v=svg.viewBox.baseVal;return {viewBox:svg.getAttribute('viewBox'),labels:[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:t.getAttribute('x'),y:t.getAttribute('y'),box:[b.x,b.y,b.width,b.height],outside:b.x-5<v.x||b.x+b.width+5>v.x+v.width||b.y-1<v.y||b.y+b.height+1>v.y+v.height};})};}));assert.ok(values.length,locale+width+exam+" drawing");assert.deepEqual(r.errors,[]);assert.equal(r.external(),0);frames.push({locale,width,exam,values});await r.context.close();}
 }
 if(!BEFORE&&existsSync(`${OUT}/before-frames.json`)){
  const old=JSON.parse(readFileSync(`${OUT}/before-frames.json`)),moved=[];let phone=0;
  assert.equal(old.length,frames.length);
  for(let i=0;i<old.length;i++){
   const a=old[i],b=frames[i];assert.deepEqual([a.locale,a.width,a.exam],[b.locale,b.width,b.exam]);
   assert.deepEqual(a.values.map(v=>v.viewBox),b.values.map(v=>v.viewBox));
   if(a.width===390){assert.deepEqual(a.values.map(v=>v.labels.map(t=>[t.text,t.x,t.y])),b.values.map(v=>v.labels.map(t=>[t.text,t.x,t.y])));phone++;continue;}
   const vb=a.values[0].viewBox.split(' ').map(Number),H=vb[1]+vb[3]-(vb[1]===-148?38:30);let changed=false;
   for(const label of a.values[0].labels.filter(t=>Number(t.y)>H)){
    const t=b.values[0].labels.filter(t=>t.text===label.text).sort((x,y)=>Number(y.y)-Number(x.y))[0];assert.ok(t);
    const [x,y,w,h]=t.box;assert.ok(x-5>=vb[0]&&x+w+5<=vb[0]+vb[2]&&y-1>=vb[1]&&y+h+1<=vb[1]+vb[3],a.exam+label.text);
    if(t.x!==label.x||t.y!==label.y)changed=true;
   }
   if(changed)moved.push([a.exam,a.locale]);
  }
  writeFileSync(`${OUT}/frame-proof.json`,JSON.stringify({moved,phoneCoordinateCasesIdentical:phone,footerOutside:0}));
 }
 writeFileSync(`${OUT}/${stage}-frames.json`,JSON.stringify(frames));writeFileSync(`${OUT}/${stage}-results.json`,JSON.stringify({axes,frames:frames.length,externalRequests:0}));console.log({axes,frames:frames.length,OUT});
}finally{await browser.close();}
