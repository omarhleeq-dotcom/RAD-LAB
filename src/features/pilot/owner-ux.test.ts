// @vitest-environment jsdom
// UX phase 1: presentation-only guarantees for the owner page and the student Assess consent. Synthetic data only.
import {afterEach,expect,it,vi} from 'vitest';
import {createElement as h,act} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {readFileSync} from 'node:fs';
import {Pager} from './OwnerUi';
import {OwnerDirectory} from './OwnerDirectory';
import {AssessConsent} from '@/features/assess/AssessConsent';
import {EmergencyOwnerView} from '@/features/emergency/EmergencyView';
import type {EmergencyPort} from '@/features/emergency/contracts';
const mocks=vi.hoisted(()=>({client:vi.fn()}));
vi.mock('./client',()=>({getPilotClient:mocks.client}));
vi.mock('@/features/pilot/client',()=>({getPilotClient:mocks.client}));
vi.mock('./SessionGate',()=>({useSessionAccount:()=>({state:{kind:'signedIn',userId:'synthetic-owner',profile:{role:'owner',status:'approved'}}})}));
vi.mock('@/features/assess/review-availability',()=>({RAD085_REVIEW_AVAILABLE:true,ASSESS_WRITTEN_CONSENT_VERSION:'assess-written-2026-11-02-v3'}));
const globals=globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean};globals.IS_REACT_ACT_ENVIRONMENT=true;
const roots:ReturnType<typeof createRoot>[]=[];
afterEach(async()=>{for(const r of roots.splice(0))await act(async()=>r.unmount());document.body.innerHTML='';vi.clearAllMocks();});
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
