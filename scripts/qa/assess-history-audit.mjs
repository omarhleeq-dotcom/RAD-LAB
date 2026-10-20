// Local static build and synthetic intercepted API only; no provider, phone or clinical evidence.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {startServer} from '../preview/serve-out.mjs';
const require=createRequire(process.env.ASSESS_BROWSER_MANIFEST??new URL('../../package.json',import.meta.url));
const {chromium}=require('playwright'),axe=readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const messages=Object.fromEntries(['en','ar'].map(l=>[l,JSON.parse(readFileSync(`messages/${l}.json`,'utf8'))]));
const pilotConsent=readFileSync('src/features/pilot/consent.ts','utf8').match(/CONSENT_VERSION = "([^"]+)"/)[1];
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`,supa='https://abcdefghijklmnop.supabase.co',b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const {server,port}=await startServer('out',0),base=`http://127.0.0.1:${port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/usr/bin/chromium',args:['--no-sandbox']});
mkdirSync('/tmp/radlab-f-artifacts',{recursive:true});
let checks=0,audits=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
async function audit(page,label){await page.evaluate(axe);const r=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));assert.deepEqual(r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow');audits++;await page.screenshot({path:`/tmp/radlab-f-artifacts/${label}.png`,fullPage:true});}
try{for(const locale of ['en','ar'])for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900}}),user={id:id(3),aud:'authenticated',role:'authenticated',email:'synthetic@example.test'};
 const session={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:user.id,role:'authenticated',aud:'authenticated',exp:4102444800})}.sig`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
 await context.addInitScript(s=>localStorage.setItem('sb-abcdefghijklmnop-auth-token',s),JSON.stringify(session));
 let accepted=false,loseAck=true,unavailable=false,empty=false,leak=false;const errors=[],calls=[];
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();ok(url.origin===supa,'only synthetic origin');
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},json=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(url.pathname==='/auth/v1/user')return json(user);
  if(url.pathname==='/rest/v1/profiles')return json({role:'participant',status:'approved',participant_code:'P-synthetic',consent_version:pilotConsent,display_name:'Synthetic'});
  if(['/rest/v1/events','/rest/v1/rpc/touch_last_seen'].includes(url.pathname)){ok(!/Synthetic hidden|Synthetic shown|earned|submittedAt|answers|criteria/.test(req.postData()??''),'no history details in telemetry');return route.fulfill({status:201,headers});}
  ok(req.headers()['content-profile']==='assess','explicit Assess schema');const p=req.postDataJSON(),fn=url.pathname.split('/').at(-1);calls.push({fn,p});
  if(fn==='consent_v1'){if(p.p_version!==null){ok(p.p_version==='assess-pilot-2026-10-20-v1','versioned consent');accepted=true;if(loseAck){loseAck=false;return route.abort('connectionreset');}}return json({accepted});}
  if(fn==='history_page_v1'){
   ok(accepted,'no history before consent');ok(p.p_limit===20,'bounded history');if(unavailable)return json({message:'PRIVATE server detail'},503);
   if(empty)return json({rows:[],next:null});
   const rows=p.p_after===null?[{name:'Synthetic hidden',track:'mixed',submittedAt:'2026-10-20T00:00:00.000Z',grade:leak?{visibility:'hidden',earned:'SECRET'}:{visibility:'hidden'}},{name:'Synthetic shown',track:'full-practical',submittedAt:'2026-10-19T00:00:00.000Z',grade:{visibility:'shown',earned:'1.25',maximum:'10.00'}}]:[{name:'Synthetic next',track:'mixed',submittedAt:'2026-10-18T00:00:00.000Z',grade:{visibility:'hidden'}}];return json({rows,next:p.p_after===null?id(999):null});
  }
  if(fn==='assigned_page_v1')return json({rows:[],next:null});
  assert.fail('unexpected RPC '+fn);
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/${locale}/assess?history=1`,{waitUntil:'networkidle'});const t=messages[locale].assessHistory,label=`${locale}-${width}`;
 const consent=page.getByTestId('assess-consent');await consent.getByRole('checkbox').waitFor();ok(await consent.getByRole('button',{name:t.accept,exact:true}).isDisabled(),'explicit unchecked consent');ok(!calls.some(c=>c.fn==='history_page_v1'),'no premature history');await audit(page,label+'-privacy');
 await consent.getByRole('checkbox').check();await consent.getByRole('button',{name:t.accept,exact:true}).click();await consent.getByRole('alert').waitFor();ok(await page.getByTestId('assess-history').count()===0,'lost ack not treated as consent success');await audit(page,label+'-consent-retry');await consent.getByRole('button',{name:t.accept,exact:true}).click();
 const history=page.getByTestId('assess-history');await history.getByText('Synthetic shown',{exact:true}).waitFor();ok(await history.locator('dt').count()===8,'four fields per record');ok((await history.textContent()).includes('1.25 / 10.00'),'allowed grade');ok((await history.textContent()).includes(t.hidden),'withheld grade');ok(await history.getByRole('link').count()===0,'no review or attempt links');ok(!(await history.textContent()).includes(id(999)),'cursor not displayed');await audit(page,label+'-history');
 await history.getByRole('button',{name:t.next,exact:true}).click();await history.getByText('Synthetic next',{exact:true}).waitFor();ok(!(await history.textContent()).includes('Synthetic shown'),'next replaces page');await audit(page,label+'-next');
 unavailable=true;await history.getByRole('button',{name:t.refresh,exact:true}).click();await history.getByRole('alert').waitFor();ok(!(await page.textContent('body')).includes('PRIVATE'),'sanitized failure');ok(!(await history.textContent()).includes('Synthetic next'),'failure clears prior data');await audit(page,label+'-unavailable');
 unavailable=false;leak=true;await history.getByRole('button',{name:t.refresh,exact:true}).click();await history.getByRole('alert').waitFor();ok(!(await page.textContent('body')).includes('SECRET'),'malformed hidden grade fails closed');
 leak=false;empty=true;await history.getByRole('button',{name:t.refresh,exact:true}).click();await history.getByText(t.empty,{exact:true}).waitFor();await audit(page,label+'-empty');
 await page.reload({waitUntil:'networkidle'});await page.getByText(t.accepted,{exact:true}).waitFor();await page.getByText(t.empty,{exact:true}).waitFor();ok(await page.getByRole('checkbox').count()===0,'persisted server acceptance');
 assert.deepEqual(errors,[]);await context.close();
}console.log(`Assess F audit: ${checks} checks, ${audits} EN/AR390/1440 axe/overflow audits passed; local synthetic API only.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
