// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { bindSelfService, createSelfServicePort, hasSelfServiceSchema, SELF_SERVICE_RPCS } from './selfservice/adapter';
import { selfServiceStrings } from './selfservice/strings';
import { Management } from './selfservice/Management';
import { Recovery } from './selfservice/Recovery';
import { StudentExamList } from './selfservice/SelfServiceViews';
import { defaultWindow, ammanLocalToUtc } from './selfservice/window-time';
import { studentExamKind } from './selfservice/student-state';
import type { SupabaseClient } from '@supabase/supabase-js';
vi.mock('../pilot/config',()=>({PILOT:{url:'https://synthetic.invalid',key:'public-synthetic'}}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
const id=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`,now='2026-11-05T12:00:00Z';
let root:Root,host:HTMLDivElement;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('schema absence/unreadability issues no missing RPC probes; complete schema is required',async()=>{
 const rpc=vi.fn(),client={auth:{getSession:async()=>({data:{session:{access_token:'synthetic'}}})},schema:()=>({rpc})} as unknown as SupabaseClient;
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({paths:{}})})));
 expect(await bindSelfService(client,new AbortController().signal)).toBeNull();expect(rpc).not.toHaveBeenCalled();
 const paths=Object.fromEntries([...SELF_SERVICE_RPCS,'start_v2','command_v2','read_mixed_session_v2','read_practical_session_v2'].map(n=>['/rpc/'+n,{}]));
 expect(hasSelfServiceSchema({paths})).toBe(true);delete paths['/rpc/new_attempt_v1'];expect(hasSelfServiceSchema({paths})).toBe(false);
});
it('rejects eligibility invented from failed state and reports definite stale/window/scope errors without retries',async()=>{
 const bad=createSelfServicePort(async()=>({version:1,serverTime:now,rows:[{sessionId:id(6),studentId:id(3),eligible:true,reason:'unknown-history',serverTime:now}],next:null}));
 await expect(bad.eligibility(id(5))).rejects.toMatchObject({kind:'invalid'});
 for(const [code,kind] of [['40001','conflict'],['55000','window'],['42501','denied']]){
  const call=vi.fn(async()=>{throw {code};}),port=createSelfServicePort(call);
  await expect(port.schedule(id(5),1,now,'2026-11-05T14:00:00Z')).rejects.toMatchObject({kind});expect(call).toHaveBeenCalledTimes(1);
 }
});
it('owner permissions are revocable; management offers a grant only for authoritative eligible rows',async()=>{
 let permission=false;const calls:{name:string;args:Record<string,unknown>}[]=[];
 const port=createSelfServicePort(async(name,args)=>{
  calls.push({name,args});
  if(name==='quiz_capability_v1')return true;
  if(name==='quiz_permissions_v1')return [{user_id:id(2),all_students:permission,all_students_key:id(4)}];
  if(name==='quiz_permission_v1'){permission=args.p_enabled as boolean;return null;}
  if(name==='selfservice_metadata_page_v1')return {version:1,serverTime:now,rows:args.p_kind==='assignments'?[{id:id(5),versionId:id(9),revision:2,name:'SYNTHETIC',durationSeconds:3600,track:'mixed',audience:'groups',opensAt:now,closesAt:'2026-11-05T14:00:00Z',closedAt:null}]:[],next:null};
  if(name==='pool_recommendation_v1')return {version:1,selected:2,available:3,recommended:true,defaultWindowSeconds:7200,maxWindowSeconds:604800};
  if(name==='assignment_status_v1')return {counts:{notStarted:1,inProgress:0,submitted:0,graded:0,missed:0},rows:[{userId:id(3),state:'not-started'}],now,opensAt:now,closesAt:'2026-11-05T14:00:00Z',closed:false};
  if(name==='attempt_eligibility_page_v1')return {version:1,serverTime:now,rows:[{sessionId:id(6),studentId:id(3),eligible:false,reason:'unknown-history',serverTime:now},{sessionId:id(7),studentId:id(3),eligible:true,reason:'eligible',serverTime:now}],next:null};
  if(name==='new_attempt_v1')return null;
  throw Error('unexpected');
 });
 const click=async(text:string)=>{const b=[...host.querySelectorAll('button')].find(b=>b.textContent===text)!;expect(b).toBeTruthy();await act(async()=>b.click());};
 await act(async()=>root.render(createElement(Management,{port,owner:true,locale:'en',strings:selfServiceStrings.en})));
 await click(selfServiceStrings.en.allow);expect(permission).toBe(true);await click(selfServiceStrings.en.revoke);expect(permission).toBe(false);
 await click('SYNTHETIC — Group exam');
 expect(host.textContent).toContain('2 of 3 questions');expect([...host.querySelectorAll('button')].filter(b=>b.textContent===selfServiceStrings.en.grant)).toHaveLength(1);
 await click(selfServiceStrings.en.grant);expect(calls.find(c=>c.name==='new_attempt_v1')?.args).toEqual({p_assignment:id(5),p_session:id(7)});
});
it.each(['en','ar'] as const)('%s recovery requires exact typing; alternate never sees restore acceptance',async locale=>{
 const call=vi.fn(async()=>({released:0,stillHeld:2,heldActive:1,gateOpen:true,loginEnabled:true})),port=createSelfServicePort(call),s=selfServiceStrings[locale];
 await act(async()=>root.render(createElement(Recovery,{port,owner:false,strings:s})));
 expect(host.textContent).not.toContain(s.acceptAction);expect(host.querySelector('button')!.disabled).toBe(true);
 const input=host.querySelector('input')!;
 const fill=async(value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
 await fill('resume assess');expect(host.querySelector('button')!.disabled).toBe(true);expect(call).not.toHaveBeenCalled();
 await fill('RESUME ASSESS');await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(call).toHaveBeenCalledWith('owner_resume_v1',{p_confirm:'RESUME ASSESS'});expect(host.textContent).toContain(s.recovered.replace('{n}','2'));
});
it('two-hour default, server-anchored states and existing history route work in both languages',()=>{
 const d=defaultWindow(Date.parse(now));expect(Date.parse(ammanLocalToUtc(d.closesLocal)!)-Date.parse(ammanLocalToUtc(d.opensLocal)!)).toBe(7200000);
 const window={opensAt:'2026-11-05T11:00:00Z',closesAt:'2026-11-05T14:00:00Z',closed:false,now};
 expect(studentExamKind(window,{state:'active',deadline:'2026-11-05T11:59:00Z',resultReady:false})).toBe('expired');
 expect(studentExamKind(window,{state:'grading',deadline:null,resultReady:false,grading:true})).toBe('grading');
 for(const locale of ['en','ar'] as const){const html=renderToStaticMarkup(createElement(StudentExamList,{enabled:true,locale,strings:selfServiceStrings[locale],historyHref:'?history=1',onStart:()=>{},items:[{id:id(5),name:'SYNTHETIC',window,session:{state:'graded',deadline:null,resultReady:true}}]}));expect(html).toContain('href="?history=1"');expect(html).toContain(selfServiceStrings[locale].gradedBody);}
});
it('Amman rejects missing and ambiguous historical wall times using IANA transitions',()=>{
 expect(ammanLocalToUtc('2021-03-26T00:30')).toBeNull();
 expect(ammanLocalToUtc('2021-10-29T00:30')).toBeNull();
 expect(ammanLocalToUtc('2026-11-05T09:00')).toBe('2026-11-05T06:00:00.000Z');
});
