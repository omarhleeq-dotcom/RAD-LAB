// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {createElement as h,act,Fragment} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import type {SupabaseClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';
import {createAttemptLogger,type Snapshot} from './attempt-logger';
import {buildFeedbackRow,buildEventRow} from './attempt-record';
import {recordActivity} from './activity';
import {getCase} from '@/data/cases';
import {evaluate} from '@/features/evaluation/engine';
import {reportWriteLimit,clearWriteLimit,WriteLimitNotice} from './WriteLimitNotice';
import {TermsContent} from './TermsContent';
import {FeedbackBox} from './FeedbackBox';
import {savedAttempt} from './saved-attempt';
import {AssessConsent} from '@/features/assess/AssessConsent';
import {OwnerDeletion} from './OwnerDeletion';
import {createC2Adapter} from './c2-contract';
import type {C2Adapter} from './c2-ui';
const mocks=vi.hoisted(()=>({client:vi.fn()}));
vi.mock('./client',()=>({getPilotClient:mocks.client}));
vi.mock('@/features/assess/review-availability',()=>({RAD085_REVIEW_AVAILABLE:true,ASSESS_WRITTEN_CONSENT_VERSION:'assess-written-2026-11-02-v3'}));
const globals=globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean};globals.IS_REACT_ACT_ENVIRONMENT=true;
const roots:ReturnType<typeof createRoot>[]=[];
afterEach(async()=>{for(const r of roots.splice(0))await act(async()=>r.unmount());document.body.innerHTML='';clearWriteLimit();vi.restoreAllMocks();});
async function mount(element:React.ReactNode,locale='en'){
 const div=document.createElement('div');document.body.append(div);const root=createRoot(div);roots.push(root);
 const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
 await act(async()=>root.render(h(NextIntlClientProvider,{locale,messages,timeZone:'UTC',children:element})));
 return div;
}
describe('RAD085 observer multiplicity (not the intensive workload measurement)',()=>{
 for(const [cycles,otherEvents] of [[12,4],[240,120]] as const)it(`counts actual observer and feedback/account writes over ${cycles} complete cycles`,async()=>{
  const writes:{table:string;row:Record<string,unknown>}[]=[];
  const client={from:(table:string)=>({insert:async(row:Record<string,unknown>)=>{writes.push({table,row});return {error:null};}}),rpc:vi.fn()} as unknown as SupabaseClient;
  const c=getCase('chest-pa-erect')!,result=evaluate(c,c.initialSettings);
  for(let n=0;n<cycles;n++){
   const logger=createAttemptLogger({getClient:async()=>client,getStatus:async()=> 'approved',locale:()=> 'en',device:()=>({w:390,h:844,touch:true}),uuid:()=>crypto.randomUUID(),now:()=>new Date(n*5000)});
   const start:Snapshot={activeCase:c,settings:c.initialSettings,phase:'setup',result:null,attempt:1};
   logger.onState(start);logger.onState({...start,settings:{...c.initialSettings,kvp:c.initialSettings.kvp+2}});
   logger.onState({...start,phase:'result',result});logger.onState({...start,attempt:2});
   await vi.waitFor(()=>expect(writes.filter(w=>w.table==='attempts')).toHaveLength(n+1));
   await client.from('feedback').insert(buildFeedbackRow('synthetic','00000000-0000-0000-0000-000000000001','SYNTHETIC'));
   await client.from('events').insert(buildEventRow('feedback_sent'));
  }
  for(let n=0;n<otherEvents;n++)await recordActivity(client,'approved',n%2?'heartbeat':'signed_in');
  await vi.waitFor(()=>expect(writes.filter(w=>w.table==='events')).toHaveLength(cycles*5+otherEvents));
  expect(writes.filter(w=>w.table==='attempts')).toHaveLength(cycles);
  expect(writes.filter(w=>w.table==='feedback')).toHaveLength(cycles);
 },30000);
});
for(const locale of ['en','ar'])describe(`RAD085 ${locale} disclosure and calm failure`,()=>{
 it('coded quota errors show a localized message and other failures do not reveal raw details',async()=>{
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  const div=await mount(h(WriteLimitNotice,{identity:'synthetic'}),locale);
  for(const code of ['P0851','P0852']){
   await act(async()=>{expect(reportWriteLimit({code,message:'RAW PRIVATE'})).toBe(true);});
   expect(div.textContent).toContain(messages.rad085Disclosure.writeLimit);expect(div.textContent).not.toContain('RAW PRIVATE');
   await act(async()=>clearWriteLimit());
  }
  await act(async()=>{expect(reportWriteLimit({code:'42501'})).toBe(false);});expect(div.textContent).toBe('');
 });
 it('a rejected feedback save preserves the current draft for both coded limits',async()=>{
  savedAttempt.set({id:'00000000-0000-0000-0000-000000000003',status:'saved'});
  let code='P0851';
  mocks.client.mockResolvedValue({from:()=>({insert:async()=>({error:{code}})})});
  const div=await mount(h(Fragment,null,h(WriteLimitNotice,{identity:'synthetic'}),h(FeedbackBox,{examId:'synthetic'})),locale);
  const note=div.querySelector('textarea')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(note,'SYNTHETIC current work');note.dispatchEvent(new Event('input',{bubbles:true}));});
  for(const nextCode of ['P0851','P0852']){
   code=nextCode;
   await act(async()=>{div.querySelector<HTMLButtonElement>('button')!.click();});
   expect(div.querySelector('[role="alert"]')).not.toBeNull();
   expect(note.value).toBe('SYNTHETIC current work');
   expect(div.querySelector('[role="status"]')?.textContent).toBe(JSON.parse(readFileSync(`messages/${locale}.json`,'utf8')).rad085Disclosure.writeLimit);
  }
 });
 it('new EN/AR text is shown and only a fresh personal v3 acceptance opens children',async()=>{
  const versions:unknown[]=[];
  const rpc=vi.fn((_name:string,args:{p_version:string|null})=>({abortSignal:async()=>{versions.push(args.p_version);return {data:{accepted:args.p_version==='assess-written-2026-11-02-v3'},error:null};}}));
  mocks.client.mockResolvedValue({schema:()=>({rpc})});
  const div=await mount(h(AssessConsent,null,h('p',null,'CHILD')),locale);
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  expect(div.textContent).toContain(messages.rad085Disclosure.written);expect(div.textContent).not.toContain('CHILD');
  await vi.waitFor(async()=>{await act(async()=>{await Promise.resolve();});expect(div.querySelector<HTMLInputElement>('input')!.disabled).toBe(false);});
  await act(async()=>{div.querySelector<HTMLInputElement>('input')!.click();});
  await act(async()=>{div.querySelector<HTMLButtonElement>('button')!.click();});
  await vi.waitFor(async()=>{await act(async()=>{await Promise.resolve();});expect(div.textContent).toContain('CHILD');});expect(versions).toEqual([null,'assess-written-2026-11-02-v3']);
  const terms=await mount(h(TermsContent),locale);expect(terms.textContent).toContain(messages.rad085Disclosure.pending);
 });
 it('blocked accounts remain listed and raise an explicit alert while continuation is offered',async()=>{
  const user='00000000-0000-0000-0000-000000000003';
  const adapter={directory:async()=>({kind:'ready',data:{rows:[],counts:{pending:0,approved:0,suspended:1},next:null}}),deletions:async()=>({kind:'ready',data:{rows:[{id:user,code:'SYNTHETIC-BLOCKED',days:0,expires:'2026-11-02T00:00:00Z'}],next:null}}),deletion:vi.fn().mockResolvedValueOnce({kind:'ready',data:{processed:2,blocked:[user],more:true,newPass:true}}).mockResolvedValueOnce({kind:'ready',data:{processed:1,blocked:[],more:false,newPass:false}}).mockResolvedValueOnce({kind:'ready',data:{processed:0,blocked:[],more:false,newPass:true}})} as unknown as C2Adapter;
  const div=await mount(h(OwnerDeletion,{adapter,ownerId:'synthetic-owner'}),locale);
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  await act(async()=>{[...div.querySelectorAll('button')].find(b=>b.textContent===messages.c2.finalise)!.click();});
  expect(div.querySelector('[role="alert"]')?.textContent).toContain('SYNTHETIC-BLOCKED');
  expect(div.textContent).toContain(messages.rad085Disclosure.blocked);expect(div.textContent).toContain(messages.rad085Disclosure.more);
  await act(async()=>{[...div.querySelectorAll('button')].find(b=>b.textContent===messages.c2.finalise)!.click();});
  expect(div.querySelector('[role="alert"]')?.textContent).toContain('SYNTHETIC-BLOCKED');
  await act(async()=>{[...div.querySelectorAll('button')].find(b=>b.textContent===messages.c2.finalise)!.click();});
  expect(div.querySelector('[role="alert"]')).toBeNull();
 });
});
it('adapter preserves partial report and sends the exact next cursor on the next explicit finalise',async()=>{
 const user='00000000-0000-0000-0000-000000000003';
 const rpc=vi.fn().mockResolvedValueOnce({data:{processed:0,blocked:[{user_id:user,code:'55000'}],next:user},error:null}).mockResolvedValueOnce({data:{processed:1,blocked:[],next:null},error:null});
 const adapter=createC2Adapter({rpc} as unknown as Pick<SupabaseClient,'rpc'>);
 expect(await adapter.deletion('finalise')).toEqual({kind:'ready',data:{processed:0,blocked:[user],more:true,newPass:true}});
 expect(await adapter.deletion('finalise')).toEqual({kind:'ready',data:{processed:1,blocked:[],more:false,newPass:false}});
 expect(rpc).toHaveBeenLastCalledWith('owner_account_deletion_v1',{p_action:'finalise',p_user:null,p_limit:100,p_after:user});
});

it('malformed blocked-account reports never advance the continuation cursor',async()=>{
 const user='00000000-0000-0000-0000-000000000003';
 const rpc=vi.fn().mockResolvedValueOnce({data:{processed:0,blocked:[{user_id:'invalid'}],next:user},error:null}).mockResolvedValueOnce({data:{processed:0,blocked:[],next:null},error:null});
 const adapter=createC2Adapter({rpc} as unknown as Pick<SupabaseClient,'rpc'>);
 expect(await adapter.deletion('finalise')).toEqual({kind:'error'});
 await adapter.deletion('finalise');
 expect(rpc).toHaveBeenLastCalledWith('owner_account_deletion_v1',{p_action:'finalise',p_user:null,p_limit:100});
});

it('owner report quotes the complete EN/AR draft disclosures and retained consent paragraphs exactly',()=>{
 const report=readFileSync('docs/RAD-085_FIXES_REPORT_2026-11-02.md','utf8');
 for(const locale of ['en','ar']){
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8')) as {assessConsentV2:Record<string,string>;rad085Disclosure:{written:string;pending:string}};
  for(const text of [...Object.values(messages.assessConsentV2),messages.rad085Disclosure.written,messages.rad085Disclosure.pending])expect(report).toContain(text);
 }
});
