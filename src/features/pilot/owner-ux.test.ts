// @vitest-environment jsdom
// UX phase 1: presentation-only guarantees for the owner page and the student Assess consent. Synthetic data only.
import {afterEach,expect,it,vi} from 'vitest';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {readFileSync} from 'node:fs';
import {Pager} from './OwnerUi';
import {OwnerDirectory} from './OwnerDirectory';
import {OwnerPanel} from './OwnerPanel';
import type {AccountState} from './useAccount';
import {AssessConsent} from '@/features/assess/AssessConsent';
import {EmergencyOwnerView} from '@/features/emergency/EmergencyView';
import type {EmergencyPort} from '@/features/emergency/contracts';
const syntheticOwner=():Extract<AccountState,{kind:"signedIn"}>=>({kind:'signedIn',userId:'synthetic-owner',email:'owner@example.test',consentVersion:null,profile:{role:'owner',status:'approved',code:'SYN'}});
const mocks=vi.hoisted(()=>({client:vi.fn(),state:{kind:'signedIn',userId:'synthetic-owner',profile:{role:'owner',status:'approved'}} as AccountState}));
vi.mock('./client',()=>({getPilotClient:mocks.client}));
vi.mock('@/features/pilot/client',()=>({getPilotClient:mocks.client}));
vi.mock('./SessionGate',()=>({useSessionAccount:()=>({state:mocks.state})}));
vi.mock('./config',()=>({PILOT:{url:'https://synthetic.supabase.co',key:'synthetic'}}));
vi.mock('./OwnerActivity',()=>({ParticipantActivity:()=>null}));
vi.mock('@/features/assess/OwnerAssessPanel',()=>({OwnerAssessPanel:()=>null}));
vi.mock('@/i18n/navigation',()=>({Link:'a'}));
vi.mock('@/features/assess/review-availability',()=>({RAD085_REVIEW_AVAILABLE:true,ASSESS_WRITTEN_CONSENT_VERSION:'assess-written-2026-11-02-v3'}));
const globals=globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean};globals.IS_REACT_ACT_ENVIRONMENT=true;
const roots:ReturnType<typeof createRoot>[]=[];
afterEach(async()=>{for(const r of roots.splice(0))await act(async()=>r.unmount());document.body.innerHTML='';vi.useRealTimers();vi.clearAllMocks();mocks.state=syntheticOwner();history.replaceState(null,'','/');});
const messages=(locale:string)=>JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
async function mount(element:React.ReactNode,locale='en'){
 const div=document.createElement('div');document.body.append(div);const root=createRoot(div);roots.push(root);
 await act(async()=>root.render(h(NextIntlClientProvider,{locale,messages:messages(locale),timeZone:'UTC',children:element})));
 return div;
}
const settle=()=>act(async()=>{for(let i=0;i<5;i++)await Promise.resolve();});
it('paging controls render only when there is more than one page',async()=>{
 const props={first:()=>{},next:()=>{},firstLabel:'First',nextLabel:'Next'};
 expect((await mount(h(Pager,{...props,atStart:true,hasNext:false}))).querySelectorAll('button')).toHaveLength(0);
 expect((await mount(h(Pager,{...props,atStart:true,hasNext:true}))).querySelectorAll('button')).toHaveLength(2);
 const last=await mount(h(Pager,{...props,atStart:false,hasNext:false}));
 expect([...last.querySelectorAll('button')].map(b=>b.disabled)).toEqual([false,true]);
});
it('a search-first picker sends nothing until a search is submitted, then uses the existing directory read',async()=>{
 const rpc=vi.fn(async()=>({data:{version:1,rows:[],counts:{pending:0,approved:0,suspended:0},next:null,boundary:'2026-01-01'},error:null}));
 mocks.client.mockResolvedValue({rpc});
 const div=await mount(h(OwnerDirectory,{picker:true,searchFirst:true,selected:[],onSelect:()=>{}}));
 await settle();expect(rpc).not.toHaveBeenCalled();
 expect(div.textContent).toContain(messages('en').ownerUx.searchToChoose);
 const input=div.querySelector('input')!;
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'Synthetic');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>div.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();
 expect(rpc).toHaveBeenCalledExactlyOnceWith('owner_account_directory_v1',{p_search:'Synthetic',p_status:'',p_cursor:null,p_boundary:null,p_limit:20});
 expect(div.querySelector('[data-testid="participants-next"]')).toBeNull();
});
for(const locale of ['en','ar'])it(`${locale}: consent text is fully visible before consent and collapsed but identical after consent`,async()=>{
 const m=messages(locale),texts=[...Object.values(m.assessConsentV2 as Record<string,string>).filter(v=>['summary','temporary','metadata','backups'].some(k=>m.assessConsentV2[k]===v)),m.rad085Disclosure.written];
 let accepted=false;const versions:unknown[]=[];
 const rpc=vi.fn((_n:string,args:{p_version:string|null})=>({abortSignal:async()=>{versions.push(args.p_version);if(args.p_version)accepted=true;return {data:{accepted},error:null};}}));
 mocks.client.mockResolvedValue({schema:()=>({rpc})});
 const div=await mount(h(AssessConsent,null,h('p',null,'CHILD')),locale);
 const section=div.querySelector('[data-testid="assess-consent"]')!;
 expect(section.querySelector('details')).toBeNull();
 for(const text of texts)expect(section.textContent).toContain(text);
 expect(section.querySelector('[data-testid="written-disclosure"]')).not.toBeNull();
 await vi.waitFor(async()=>{await act(async()=>{await Promise.resolve();});expect(div.querySelector<HTMLInputElement>('input')!.disabled).toBe(false);});
 await act(async()=>{div.querySelector<HTMLInputElement>('input')!.click();});
 await act(async()=>{div.querySelector<HTMLButtonElement>('button')!.click();});
 await vi.waitFor(async()=>{await act(async()=>{await Promise.resolve();});expect(div.textContent).toContain('CHILD');});expect(versions).toEqual([null,'assess-written-2026-11-02-v3']);
 const details=section.querySelector('details')!;
 expect(details.open).toBe(false);expect(details.querySelector('summary')!.textContent).toBe(m.assessConsentUi.showText);
 expect(section.querySelector('[role="status"]')!.textContent).toBe(m.assessHistory.accepted);
 expect(section.textContent).toContain('assess-written-2026-11-02-v3');
 for(const text of texts)expect(details.textContent).toContain(text);
 expect(details.querySelector('[data-testid="written-disclosure"]')!.textContent).toBe(m.rad085Disclosure.written);
 expect(section.querySelector('input,button')).toBeNull();
});
it('owner emergency view shows Amman-formatted times, keeps the audit collapsed and renders no account ids',async()=>{
 const uuid='00000000-0000-0000-0000-00000000abcd',at='2026-11-02T12:00:00.000Z';
 const port={owner:async()=>({appointment:{id:uuid,name:'SYNTHETIC Alternate',appointedAt:at,revision:1,active:true},audit:[{id:1,at,action:'appoint',result:'RECORDED'}],next:null})} as unknown as EmergencyPort;
 const div=await mount(h(EmergencyOwnerView,{port}));await settle();
 expect(div.textContent).not.toContain(uuid);expect(div.textContent).not.toContain(at);
 const audit=div.querySelector<HTMLDetailsElement>('[data-testid="emergency-audit"]')!;expect(audit.open).toBe(false);
 const expected=new Date(at).toLocaleString('en',{timeZone:'Asia/Amman'});
 expect(audit.querySelector('time')!.textContent).toBe(expected);expect(audit.querySelector('time')!.getAttribute('dateTime')).toBe(at);
});

// RAD-106: exercise the real counts/list effects together; no production IO.
const stamp='2026-11-06T00:00:00Z';
const person=(name='Synthetic current',status='approved')=>({user_id:'synthetic-person',participant_code:'SYN-P',role:'participant',status,name,email:'person@example.test',created_at:stamp,last_seen_at:null});
const directory=(rows:unknown[]=[person()],next:unknown=null)=>({version:1,rows,counts:{pending:31,approved:40,suspended:2},boundary:stamp,next});
function slowDirectory(){
 const calls:{args:Record<string,unknown>;signal?:AbortSignal;resolve:(r:{data:unknown;error:null|{code:string}})=>void}[]=[];
 const rpc=vi.fn((name:string,args:Record<string,unknown>)=>{
  if(name!=='owner_account_directory_v1')return Promise.resolve({data:true,error:null});
  let resolve!:(r:{data:unknown;error:null|{code:string}})=>void;
  const promise=new Promise<{data:unknown;error:null|{code:string}}>(r=>{resolve=r;});
  const call={args,signal:undefined as AbortSignal|undefined,resolve};calls.push(call);
  return {abortSignal:(signal:AbortSignal)=>{call.signal=signal;return promise;}};
 });
 mocks.client.mockResolvedValue({rpc});return {calls,rpc};
}
const click=async(div:HTMLElement,text:string)=>act(async()=>{const button=[...div.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===text);expect(button).toBeDefined();button!.click();});
const respond=async(call:ReturnType<typeof slowDirectory>['calls'][number],data=directory())=>act(async()=>{call.resolve({data,error:null});});
async function redraw(element:React.ReactNode){await act(async()=>roots.at(-1)!.render(h(NextIntlClientProvider,{locale:'en',messages:messages('en'),timeZone:'UTC',children:element})));}
it('RAD-106: cold counts/list share one read, filtered refresh stays global, mutation refreshes both',async()=>{
 const {calls,rpc}=slowDirectory(),m=messages('en'),div=await mount(h(OwnerPanel));await settle();
 expect(calls).toHaveLength(1);await respond(calls[0]!);expect(div.querySelectorAll('[data-testid="owner-row"]')).toHaveLength(1);
 expect(div.querySelector('[data-testid="owner-status"]')!.textContent).toContain('31');
 await click(div,`${m.ownerUx.filter.pending} (31)`);expect(calls).toHaveLength(2);expect(calls[1]!.args.p_status).toBe('pending');
 await click(div,m.owner.refresh);expect(calls).toHaveLength(4);expect(calls[1]!.signal!.aborted).toBe(true);
 expect(calls.slice(2).map(c=>c.args.p_status).sort()).toEqual(['','pending']);
 await respond(calls[2]!);await respond(calls[3]!,directory([person('Filtered','pending')]));
 expect(div.querySelector('[data-testid="owner-status"]')!.textContent).toContain('31');
 await click(div,m.ownerUx.filter.all);await respond(calls[4]!);
 await click(div,m.owner.actions.suspended);await settle();
 expect(rpc.mock.calls.filter(([name])=>name==='set_participant_status')).toHaveLength(1);
 expect(calls).toHaveLength(6);await respond(calls[5]!,directory([person('Mutated','suspended')]));expect(div.textContent).toContain('Mutated');
});
it('RAD-106: partial list unmount retains counts; sign-out and account/auth switches discard late data',async()=>{
 const {calls}=slowDirectory(),div=await mount(h(OwnerPanel));await settle();
 await act(async()=>div.querySelector<HTMLAnchorElement>('a[href="?tab=groups"]')!.click());
 expect(calls[0]!.signal!.aborted).toBe(false);await respond(calls[0]!);expect(div.querySelector('[data-testid="owner-status"]')!.textContent).toContain('31');
 await act(async()=>div.querySelector<HTMLAnchorElement>('a[href="?tab=students"]')!.click());expect(calls).toHaveLength(2);
 mocks.state={kind:'signedOut'};await redraw(h(OwnerPanel));expect(calls[1]!.signal!.aborted).toBe(true);expect(div.querySelector('[data-testid="owner-signed-out"]')).not.toBeNull();
 await respond(calls[1]!,directory([person('OLD ACCOUNT')]));expect(div.textContent).not.toContain('OLD ACCOUNT');
 mocks.state={...syntheticOwner(),userId:'other-owner'} as AccountState;await redraw(h(OwnerPanel));expect(calls).toHaveLength(3);
 mocks.state={...mocks.state};await redraw(h(OwnerPanel));expect(calls[2]!.signal!.aborted).toBe(true);expect(calls).toHaveLength(4);
 await respond(calls[2]!,directory([person('OLD GENERATION')]));await respond(calls[3]!,directory([person('New generation')]));expect(div.textContent).not.toContain('OLD GENERATION');expect(div.textContent).toContain('New generation');
 mocks.state={...syntheticOwner(),profile:{role:'owner',status:'suspended',code:'SYN'}};await redraw(h(OwnerPanel));expect(div.querySelector('[data-testid="owner-denied"]')).not.toBeNull();expect(calls).toHaveLength(4);
});
it('RAD-106: page-20 cursor/boundary and first-page reset preserve wire arguments and DTO order',async()=>{
 const {calls}=slowDirectory(),div=await mount(h(OwnerDirectory,{picker:true}));await settle();
 const rows=Array.from({length:20},(_,i)=>({...person(`Row ${i}`),user_id:`person-${i}`}));
 await respond(calls[0]!,directory(rows,{id:'person-19',rank:1}));expect(div.querySelectorAll('[data-testid="owner-row"]')).toHaveLength(20);
 await click(div,messages('en').owner.dashboard.next);expect(calls[1]!.args).toEqual({p_search:'',p_status:'',p_cursor:{id:'person-19',rank:'1'},p_boundary:stamp,p_limit:20});
 await respond(calls[1]!,directory([person('Last row')]));expect(div.textContent).not.toContain('Row 0');
 await click(div,messages('en').owner.dashboard.first);expect(calls[2]!.args.p_cursor).toBeNull();expect(calls[2]!.args.p_boundary).toBeNull();await respond(calls[2]!);
});
it('RAD-106: timeout and service errors end loading, late replies stay hidden, explicit refresh retries',async()=>{
 vi.useFakeTimers();const {calls}=slowDirectory(),div=await mount(h(OwnerPanel));await settle();
 await act(async()=>{await vi.advanceTimersByTimeAsync(15000);});expect(calls[0]!.signal!.aborted).toBe(true);
 expect(div.querySelector('[data-testid="owner-directory"] [role="alert"]')).not.toBeNull();expect(div.querySelector('[data-testid="owner-status"]')!.textContent).toContain(messages('en').owner.dashboard.error);
 await respond(calls[0]!,directory([person('LATE')]));expect(div.textContent).not.toContain('LATE');expect(calls).toHaveLength(1);
 await click(div,messages('en').owner.refresh);expect(calls).toHaveLength(2);
 await act(async()=>calls[1]!.resolve({data:null,error:{code:'42501'}}));expect(div.querySelector('[role="alert"]')).not.toBeNull();
 await click(div,messages('en').owner.refresh);await respond(calls[2]!);expect(div.querySelector('[data-testid="owner-directory"] [role="alert"]')).toBeNull();expect(div.textContent).toContain('Synthetic current');
});
