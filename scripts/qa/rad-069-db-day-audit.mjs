// Actual route/panel components, synthetic signed-in transport, all network blocked.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require=createRequire(process.env.QA_MANIFEST??'/tmp/rad069-qa/package.json');
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`))]));
const sql=readFileSync('supabase/migrations/20261024000200_owner_deletion_surveys.sql','utf8');
const definition=JSON.parse(sql.match(/\('SUS',1,'(.*?)'\),/s)[1]);
const css=(await postcss([tailwind()]).process(readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'})).css.replace(/url\("(\/fonts\/[^"?]+)"\)/g,(_,p)=>`url("data:font/woff2;base64,${readFileSync('public'+p).toString('base64')}")`);
const mocks={
 session:`export const useSessionAccount=()=>window.__account;export const useOptionalSessionAccount=useSessionAccount;`,
 client:`export const getPilotClient=()=>Promise.resolve(window.__client);`,
 navigation:`import React from 'react';export const Link=({href,locale,children,onClick,...props})=><a {...props} href={href} onClick={e=>{e.preventDefault();window.__nav=href;onClick?.(e);}}>{children}</a>;export const usePathname=()=>window.__path;export const useRouter=()=>({replace:()=>{}});`,
 nextnav:`export const useSearchParams=()=>new URLSearchParams();export const useRouter=()=>({replace:()=>{}});export const usePathname=()=>window.__path;export const notFound=()=>{throw Error('not found')};`,
 server:`import {createTranslator} from 'next-intl';export const setRequestLocale=()=>{};export const getTranslations=async arg=>createTranslator({locale:window.__locale,messages:window.__messages,namespace:typeof arg==='string'?arg:arg.namespace});`,
 saved:`export const useSavedResults=()=>({data:{rows:[],next:null,summary:{attempts:5,exams:1,trainees:null,latest:null}}});`,
};
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';import {NextIntlClientProvider} from 'next-intl';
import Home from './src/app/[locale]/page';import Feedback from './src/app/[locale]/feedback/page';import Terms from './src/app/[locale]/terms/page';
import {OwnerPanel} from './src/features/pilot/OwnerPanel';import {AccountPanel} from './src/features/pilot/AccountPanel';import {AppShell} from './src/components/shell/AppShell';
import {CONSENT_VERSION} from './src/features/pilot/consent';
const root=createRoot(document.getElementById('fixture'));
window.mount=async config=>{
 window.__locale=config.locale;window.__path=config.screen==='home'?'/':'/'+config.screen;
 window.__calls??=[];window.__config=config;
 const state=config.out?{kind:'signedOut'}:{kind:'signedIn',userId:config.user??'owner-fixture',email:'synthetic@example.test',displayName:'Synthetic',consentVersion:config.oldConsent?'2026-10-19':CONSENT_VERSION,profile:{role:config.role??(config.screen==='owner'?'owner':'participant'),status:config.status??'approved',code:'P-fixture'}};
 window.__account={state,signOut:async()=>{},saveName:async()=>true,acceptTerms:async()=>{window.__accepted=true;await window.mount({...config,oldConsent:false});return true;}};
 const person={user_id:'person-fixture',participant_code:'P-fixture',role:'participant',status:window.__approved?'approved':'pending',email:'synthetic-person@example.test',name:'Synthetic participant',created_at:'2026-10-20T00:00:00Z',last_seen_at:null};
 const page=(rows)=>({version:1,rows,next:null,boundary:'2026-10-24T00:00:00Z',total:rows.length,pending:0});
 window.__client={rpc:async(name,args)=>{
  window.__calls.push({name,args,user:state.userId});
  if(config.missing&&['owner_account_directory_v1','owner_account_deletion_v1','owner_surveys_v1','participant_survey_v1','owner_dashboard_v1'].includes(name))return {error:{code:'PGRST202'}};
  let data;
  if(name==='owner_account_directory_v1')data={...page(window.__deleted?[]:[person]),counts:{pending:window.__deleted?0:1,approved:0,suspended:0}};
  else if(name==='owner_account_deletion_v1'){
   if(args.p_action==='list')data={rows:window.__deleted?[{user_id:person.user_id,participant_code:person.participant_code,days_left:30,expires_at:'2026-11-23T00:00:00Z'}]:[],next:null};
   else {window.__deleted=args.p_action==='deactivate';data={processed:1};}
  }
  else if(name==='owner_surveys_v1')data={rows:[],next:null};
  else if(name==='participant_survey_v1')data=args.p_answers?{answered:true}:{pending:{id:'pending-'+state.userId,round_id:'round-fixture',survey_type:'SUS',version:1,definition:window.__definition}};
  else if(name==='owner_page_v1')data=page(args.p_stream==='participants'?[{...person,email_confirmed:config.confirmed??false,last_event_at:null}]:[]);
  else if(name==='set_participant_status'){window.__approved=true;data=null;}
  else if(name==='owner_dashboard_v1')data=page([{exam:'chest-pa-erect',attempts:5,known:5,passed:3,wrong:[]}]);
  else throw Error('Unmocked RPC '+name);
  return {data,error:null};
 }};
 const params=Promise.resolve({locale:config.locale});
 const content=config.screen==='home'?await Home({params}):config.screen==='feedback'?await Feedback({params}):config.screen==='terms'?await Terms({params}):config.screen==='owner'?<><h1>Owner · synthetic</h1><OwnerPanel/></>:<><h1>{window.__messages.account.title}</h1><AccountPanel/></>;
 root.render(<NextIntlClientProvider locale={config.locale} messages={window.__messages} timeZone="UTC"><AppShell>{content}</AppShell></NextIntlClientProvider>);
};
`},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_SUPABASE_URL':'"https://vlacestfruxooznrcjqc.supabase.co"','process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_synthetic_local_test_123456"'},plugins:[{name:'synthetic-only',setup(b){
 b.onResolve({filter:/(SessionGate|\/client|^\.\/client$|i18n\/navigation|next\/navigation|next-intl\/server|useSavedResults)$/},args=>{
  if(args.path==='react-dom/client')return;
  const key=/SessionGate$/.test(args.path)?'session':/client$/.test(args.path)?'client':/i18n\/navigation$/.test(args.path)?'navigation':args.path==='next/navigation'?'nextnav':args.path==='next-intl/server'?'server':'saved';return {path:key,namespace:'mock'};
 });b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:process.cwd()}));
}}]});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
const termsOnly=process.argv.includes('--terms-only');
const dir=termsOnly?'/tmp/rad069-terms-review':'/tmp/rad069-db-day';mkdirSync(dir,{recursive:true});let checks=0,axes=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
async function audit(page,label){await page.evaluate(axe);const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);axes++;ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');}
try {
 for(const locale of ['en','ar'])for(const width of (termsOnly?[390]:[390,1440]))for(const screen of (termsOnly?['terms']:['owner','home','feedback','account','terms'])) {
  console.log(JSON.stringify({locale,width,screen}));
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(10000);let network=0;const errors=[];
  await context.route('**/*',async r=>{network++;await r.abort();});page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(`<!doctype html><html lang="${locale}" dir="${locale==='ar'?'rtl':'ltr'}" data-theme="dark"><head><title>DB day synthetic audit</title></head><body><main id="fixture"></main></body></html>`);
  await page.addStyleTag({content:css});await page.evaluate(({messages,definition})=>{window.__messages=messages;window.__definition=definition;history.pushState=()=>{};},{messages:messages[locale],definition});
  await page.addScriptTag({content:bundle.outputFiles[0].text});const config={locale,screen,oldConsent:screen==='account'};
  await page.evaluate(c=>window.mount(c),config);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  const m=messages[locale];
  if(screen==='terms') {for(const key of ['p1','p2','p3','p4'])ok(await page.locator('section[aria-labelledby="terms-howLong"]').getByText(m.terms.howLong[key],{exact:true}).count()===1,'retention paragraph '+key);}
  if(screen==='owner') {
   await page.getByTestId('owner-row').waitFor();await page.getByTestId('c2-deletion').waitFor();await page.getByTestId('c2-surveys').waitFor();
   await page.getByTestId('owner-row').getByRole('button',{name:m.owner.actions.approved,exact:true}).click();
   await page.getByText(m.owner.warnUnconfirmed,{exact:true}).waitFor();
   ok(await page.evaluate(()=>!window.__calls.some(c=>c.name==='set_participant_status')),'unconfirmed approval warns');
   await page.getByTestId('owner-row').getByRole('button',{name:m.owner.confirmApprove,exact:true}).click();
   await page.waitForFunction(()=>window.__calls.some(c=>c.name==='set_participant_status'));
   ok(await page.evaluate(()=>window.__calls.filter(c=>c.name==='owner_page_v1'&&c.args.p_stream==='participants').every(c=>c.args.p_limit===1&&c.args.p_participant==='person-fixture')),'approval details bounded');
   await page.getByTestId('c2-deletion').getByRole('button',{name:m.c2.deactivate,exact:true}).click();
   await page.getByTestId('c2-confirm').getByRole('checkbox').check();await page.getByRole('button',{name:m.c2.confirmDeactivate,exact:true}).click();
   await page.waitForFunction(()=>window.__deleted);await page.waitForFunction(()=>!document.querySelector('[data-testid="owner-row"]'));
   ok(true,'deletion refreshes normal directory');await page.getByRole('button',{name:m.c2.restore,exact:true}).click();await page.getByTestId('owner-row').waitFor();
   await page.getByRole('link',{name:m.owner.dashboard.training,exact:true}).click();await page.getByText(m.owner.dashboard.byExam,{exact:true}).waitFor();
   await page.waitForFunction(()=>window.__calls.some(c=>c.name==='owner_dashboard_v1'&&c.args.p_view==='summary'));
   await audit(page,`${locale}${width} owner training`);
  }
  if(screen==='home') {
   await page.getByTestId('c2-reminder').waitFor();ok(await page.getByTestId('training-summary').count()===1,'training stays accessible');
   ok(await page.getByTestId('c2-reminder').locator('a').getAttribute('href')===`/${locale}/feedback`,'localized feedback link');
  }
  if(screen==='feedback') {
   await page.locator('fieldset').first().waitFor();ok(await page.locator('fieldset legend[lang="en"]').count()===10,'original English SUS');
   await page.locator('fieldset').first().locator('input[value="4"]').check();
   await page.evaluate(c=>window.mount({...c,user:'second-fixture'}),config);await page.waitForFunction(()=>window.__calls.some(c=>c.name==='participant_survey_v1'&&c.user==='second-fixture'));
   ok(await page.locator('input:checked').count()===0,'answers cleared on user change');
  }
  if(screen==='account') {
   await page.getByTestId('consent-card').waitFor();await page.getByTestId('consent-card').getByRole('checkbox').check();
   await audit(page,`${locale}${width} consent`);await page.screenshot({path:`${dir}/${locale}-${width}-consent.jpg`,type:'jpeg',quality:75,fullPage:true});await page.getByRole('button',{name:m.account.consent.accept,exact:true}).click();await page.getByTestId('consent-done').waitFor();ok(await page.evaluate(()=>window.__accepted),'existing reconsent action');
  }
  await audit(page,`${locale}${width} ${screen}`);await page.screenshot({path:`${dir}/${locale}-${width}-${screen}.jpg`,type:'jpeg',quality:75,fullPage:true});
  if(['owner','home','feedback'].includes(screen)) {
   await page.evaluate(c=>window.mount({...c,missing:true,user:'missing-fixture'}),config);
   if(screen==='owner')await page.getByTestId('c2-deletion').getByText(m.c2.unavailable,{exact:true}).waitFor();
   else await page.getByTestId(screen==='home'?'c2-reminder':'c2-survey').getByText(m.c2.unavailable,{exact:true}).waitFor();
   await audit(page,`${locale}${width} ${screen} missing`);
   await page.evaluate(c=>window.mount({...c,out:true}),config);await page.waitForFunction(()=>!document.querySelector('[data-testid="c2-survey"], [data-testid="c2-reminder"], [data-testid="c2-deletion"]'));
   ok(!await page.getByTestId('owner-row').count(),'logout removes owner rows');
   const before=await page.evaluate(()=>window.__calls.length);
   await page.evaluate(c=>window.mount({...c,role:'participant',oldConsent:true}),config);
   if(screen==='home'||screen==='feedback')ok(await page.evaluate(before=>window.__calls.slice(before).every(c=>c.name!=='participant_survey_v1'),before),'no survey RPC without consent');
   if(screen==='owner')await page.getByTestId('owner-denied').waitFor();
   ok(await page.locator('[data-testid="c2-survey"], [data-testid="c2-reminder"], [data-testid="c2-deletion"]').count()===0,'denied or unconsented has no C2');
  }
  if(width===390){await page.getByTestId('menu-toggle').click();await page.locator('dialog[open] .site-nav a[href="/feedback"]').waitFor();await audit(page,`${locale} ${screen} menu`);ok(await page.locator('dialog[open] .site-nav a[href="/feedback"]').count()===1,'feedback menu link');}
  ok(network===0,'zero network');assert.deepEqual(errors,[]);await context.close();
 }
 writeFileSync(`${dir}/results.json`,JSON.stringify({checks,axes,network:0,screens:termsOnly?['terms']:['owner','home','feedback','account','terms'],locales:['en','ar'],widths:termsOnly?[390]:[390,1440]},null,2));console.log(JSON.stringify({checks,axes,network:0,artifacts:dir}));
}finally{await browser.close();}
