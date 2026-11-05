// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Management } from './selfservice/Management';
import { SelfServiceSession } from './selfservice/SelfServiceSession';
import { StudentExamList, type StudentItem } from './selfservice/SelfServiceViews';
import { createSelfServicePort, SELF_SERVICE_RPCS } from './selfservice/adapter';
import { selfServiceStrings } from './selfservice/strings';
import { ammanLocalToUtc } from './selfservice/window-time';
import type { Transport } from './selfservice/contracts';
const session = vi.hoisted(() => ({ client: {} }));
vi.mock('../pilot/config',()=>({PILOT:{url:'https://synthetic.invalid',key:'public-synthetic'}}));
vi.mock('../pilot/client',()=>({getPilotClient:async()=>session.client}));
vi.mock('../pilot/SessionGate',()=>({useOptionalSessionAccount:()=>({state:{kind:'signedIn',userId:'00000000-0000-0000-0000-000000000001',consentVersion:'2026-11-02',profile:{status:'approved',role:'participant'}}})}));
vi.mock('../supervisor/P1Session',()=>({useSupervisorAppointment:()=>false}));
vi.mock('../emergency/EmergencySession',()=>({useEmergencyAlternate:()=>false}));
vi.mock('next-intl',()=>({useLocale:()=> 'en'}));
vi.mock('./AssessConsent',()=>({AssessConsent:({children}:{children:React.ReactNode})=>children}));
vi.mock('./AssessPanel',()=>({Runner:()=>null}));
vi.mock('./FullPracticalRunner',()=>({FullPracticalRunner:()=>null}));
vi.mock('./HistoryPanel',()=>({HistoryPanel:()=>null}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const epoch=Date.parse('2026-11-05T12:00:00Z'),iso=(ms:number)=>new Date(epoch+ms).toISOString();
const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let host:HTMLDivElement,root:Root,unmounted:boolean;
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(epoch+3600000);host=document.createElement('div');document.body.append(host);root=createRoot(host);unmounted=false;});
afterEach(async()=>{if(!unmounted)await act(async()=>root.unmount());host.remove();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const advance=async(ms:number)=>act(async()=>{vi.advanceTimersByTime(ms);});
const click=async(text:string)=>{const b=[...host.querySelectorAll('button')].find(b=>b.textContent===text)!;expect(b).toBeTruthy();await act(async()=>b.click());};
function items(now=0):StudentItem[]{return [
 {id:id(1),name:'Upcoming',window:{now:iso(now),opensAt:iso(1000),closesAt:iso(3000),closed:false},session:null},
 {id:id(2),name:'Active',window:{now:iso(now),opensAt:iso(-1000),closesAt:iso(3000),closed:false},session:{state:'active',deadline:iso(2000),resultReady:false}},
];}
it.each(['en','ar'] as const)('%s mounted list advances upcoming → open → missed and active → expired without refresh/writes',async locale=>{
 const rows=items(),onStart=vi.fn();
 await act(async()=>root.render(createElement(StudentExamList,{enabled:true,items:rows,serverTime:iso(0),strings:selfServiceStrings[locale],locale,historyHref:'?history=1',onStart})));
 const states=()=>[...host.querySelectorAll('[data-state]')].map(n=>n.getAttribute('data-state'));
 expect(states()).toEqual(['upcoming','in-progress']);await advance(1000);expect(states()).toEqual(['open','in-progress']);
 vi.setSystemTime(epoch-86400000);await advance(1000);expect(states()).toEqual(['open','expired']);
 vi.setSystemTime(epoch+86400000);await advance(1000);expect(states()).toEqual(['missed','expired']);
 expect(onStart).not.toHaveBeenCalled();expect(host.querySelectorAll('button')).toHaveLength(0);
 await act(async()=>root.unmount());unmounted=true;expect(vi.getTimerCount()).toBe(0);
});
function managementTransport(now:()=>number,close=3000):Transport{return async(name,args)=>{
 if(name==='quiz_capability_v1')return true;
 if(name==='quiz_permissions_v1')return [];
 if(name==='selfservice_metadata_page_v1')return {version:1,serverTime:iso(now()),next:null,rows:args.p_kind==='versions'?[{id:id(9),name:'Version',track:'mixed',durationSeconds:600}]:[{id:id(5),versionId:id(9),revision:3,name:'Assignment',durationSeconds:600,track:'mixed',audience:'groups',opensAt:iso(-1000),closesAt:iso(close),closedAt:null}]};
 if(name==='pool_recommendation_v1')return {version:1,selected:2,available:3,recommended:true,defaultWindowSeconds:7200,maxWindowSeconds:604800};
 if(name==='assignment_status_v1')return {counts:{notStarted:1,inProgress:0,submitted:0,graded:0,missed:0},rows:[{userId:id(3),state:'not-started'}],now:iso(now()),opensAt:iso(-1000),closesAt:iso(close),closed:false};
 if(name==='attempt_eligibility_page_v1')return {version:1,serverTime:iso(now()),rows:[{studentId:id(3),sessionId:id(7),eligible:true,reason:'eligible',serverTime:iso(now())}],next:null};
 if(name==='quiz_publish_v1')return id(5);
 if(name==='assignment_schedule_v2')return 4;
 throw Error('Unexpected RPC '+name);
};}
it('mounted management becomes read-only at closes_at without a response or automatic writes',async()=>{
 const transport=vi.fn(managementTransport(()=>0)),s=selfServiceStrings.en;
 await act(async()=>root.render(createElement(Management,{port:createSelfServicePort(transport),owner:true,strings:s,locale:'en'})));
 await click('Assignment — '+s.group);expect(host.querySelector('[data-testid=selfservice-schedule]')).not.toBeNull();
 const calls=transport.mock.calls.length;await advance(3000);
 expect(host.querySelector('[data-testid=selfservice-schedule]')).toBeNull();expect(host.querySelector<HTMLInputElement>('input[name=seconds]')!.disabled).toBe(true);
 for(const text of [s.close,s.saveExtra,s.grant])expect([...host.querySelectorAll('button')].find(b=>b.textContent===text)!.disabled).toBe(true);
 expect(transport).toHaveBeenCalledTimes(calls);
});
it.each([3600000,-3600000])('mounted publication uses server-future defaults under wall skew %i and a subsequent jump',async skew=>{
 vi.setSystemTime(epoch+skew);const transport=vi.fn(managementTransport(()=>0)),s=selfServiceStrings.en;
 await act(async()=>root.render(createElement(Management,{port:createSelfServicePort(transport),owner:true,strings:s,locale:'en'})));
 await advance(60000);await click('Version');
 const fields=[...host.querySelectorAll<HTMLInputElement>('input[type=datetime-local]')];
 expect(Date.parse(ammanLocalToUtc(fields[0]!.value)!)).toBeGreaterThan(epoch+60000);
 vi.setSystemTime(epoch+86400000);await click(s.publish);
 const published=transport.mock.calls.filter(([name])=>name==='quiz_publish_v1');expect(published).toHaveLength(1);
 expect(Date.parse(published[0]![1].p_opens as string)).toBeGreaterThan(epoch+60000);
});
it('publication validation advances while a form stays mounted and rejects an elapsed start without writing',async()=>{
 const transport=vi.fn(managementTransport(()=>0)),s=selfServiceStrings.en;
 await act(async()=>root.render(createElement(Management,{port:createSelfServicePort(transport),owner:true,strings:s,locale:'en'})));
 await click('Version');await advance(20*60000);vi.setSystemTime(epoch-86400000);await click(s.publish);
 expect(host.textContent).toContain(s.past);expect(transport.mock.calls.filter(([name])=>name==='quiz_publish_v1')).toHaveLength(0);
});
it('fresh identical timestamp resets mounted list anchor; a new timestamp also resynchronizes',async()=>{
 const render=async(rows:StudentItem[])=>act(async()=>root.render(createElement(StudentExamList,{enabled:true,items:rows,strings:selfServiceStrings.en,locale:'en',historyHref:'?history=1',onStart:()=>{}})));
 await render(items());await advance(3000);expect(host.querySelector('[data-state=missed]')).not.toBeNull();
 await render(items());expect(host.querySelector('[data-state=upcoming]')).not.toBeNull();
 await render(items(2500));expect(host.querySelector('[data-state=open]')).not.toBeNull();await advance(500);expect(host.querySelector('[data-state=missed]')).not.toBeNull();
});
it('actual session visibility rebinding and explicit refresh resynchronize from fresh adapter responses; unmount clears timers/listeners',async()=>{
 let serverNow=0;const rpc=vi.fn(async(name:string)=>{
  if(name!=='student_exams_page_v1')throw Error('Unexpected '+name);
  return {data:{version:1,serverTime:iso(serverNow),next:null,rows:[{id:id(5),name:'Upcoming',track:'mixed',audience:'all-students',opensAt:iso(1000),closesAt:iso(3000),closed:false,sessionId:null,state:null,deadline:null,expiresAt:null,held:false,resultReady:false,grading:false,replacementGranted:false}]},error:null};
 });
 session.client={auth:{getSession:async()=>({data:{session:{access_token:'synthetic'}}})},schema:()=>({rpc:(name:string)=>{const p=rpc(name);return Object.assign(p,{retry:()=>p,abortSignal:()=>p});}})};
 const paths=Object.fromEntries([...SELF_SERVICE_RPCS,'start_v2','command_v2','read_mixed_session_v2','read_practical_session_v2'].map(n=>['/rpc/'+n,{}]));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({paths})})));
 await act(async()=>root.render(createElement(SelfServiceSession,{mode:'student'})));expect(host.querySelector('[data-state=upcoming]')).not.toBeNull();
 await advance(3000);expect(host.querySelector('[data-state=missed]')).not.toBeNull();expect(rpc).toHaveBeenCalledTimes(1);
 serverNow=1500;Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 await act(async()=>document.dispatchEvent(new Event('visibilitychange')));expect(host.querySelector('[data-state=open]')).not.toBeNull();expect(rpc).toHaveBeenCalledTimes(2);
 serverNow=4000;await click(selfServiceStrings.en.refresh);expect(host.querySelector('[data-state=missed]')).not.toBeNull();expect(rpc).toHaveBeenCalledTimes(3);
 await act(async()=>root.unmount());unmounted=true;expect(vi.getTimerCount()).toBe(0);
 await act(async()=>document.dispatchEvent(new Event('visibilitychange')));expect(rpc).toHaveBeenCalledTimes(3);
});
