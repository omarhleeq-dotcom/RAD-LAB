// @vitest-environment jsdom
import {act,createElement,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {expect,it,vi} from 'vitest';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import {EmergencyStopView,EmergencyOwnerView} from './EmergencyView';
import {EmergencyError,parseReceipt,type EmergencyPort,type Receipt,type OwnerSnapshot} from './contracts';
import {bindEmergency,createEmergencyPort} from './browser-adapter';
import {EmergencyAlternateScope,EmergencyPage,EmergencySession} from './EmergencySession';
import {CONSENT_VERSION} from '../pilot/consent';
import {StopController} from './controller';
const auth=vi.hoisted(()=>({state:{kind:'signedIn',userId:'synthetic',profile:{role:'participant',status:'approved'},consentVersion:''}}));
vi.mock('../pilot/SessionGate',()=>({useOptionalSessionAccount:()=>({state:auth.state})}));
vi.mock('../pilot/config',()=>({PILOT:true}));
vi.mock('./browser-adapter',async original=>({...await original<typeof import('./browser-adapter')>(),bindEmergency:vi.fn()}));
const who='11111111-1111-1111-1111-111111111111',operation='22222222-2222-2222-2222-222222222222';
vi.mock('../pilot/OwnerDirectory',()=>({OwnerDirectory:({children}:{children:(p:unknown)=>ReactNode})=>createElement('div',null,children({userId:who,name:'SYNTHETIC Approved Account',email:'private@example.invalid'}))}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
// jsdom lacks native dialog lifecycle; browser audit covers modal focus/Esc.
Object.assign(HTMLDialogElement.prototype,{
 showModal(this:HTMLDialogElement){this.open=true;},
 close(this:HTMLDialogElement){this.open=false;this.dispatchEvent(new Event('close'));},
});
function snapshot(next=1):Receipt{return {version:1,operation,nextPhase:next,status:next===7?'STOPPED':next>1?'PARTIAL':'PENDING',phases:Array.from({length:next-1},(_,i)=>({phase:i+1 as 1,ok:true})),verification:next===7?{gateClosed:true,loginDisabled:true,missingRoles:0,backendSessions:0,unheldSessions:0}:null,at:'2026-11-02T12:00:00.000Z',cloudStopVerified:false,poolerCacheVerified:false};}
function fixture(){
 let current:Receipt|null=null,fail=false,denied=false,owner:OwnerSnapshot={appointment:{id:null,name:null,appointedAt:null,revision:0,active:false},audit:[],next:null};const phases:number[]=[],appointments:string[]=[];
 const port:EmergencyPort={access:async()=>true,owner:async()=>structuredClone(owner),appoint:async id=>{appointments.push(id);owner={...owner,appointment:{id,name:'SYNTHETIC Approved Account',appointedAt:snapshot().at,revision:1,active:true}};},remove:async()=>{owner={...owner,appointment:{...owner.appointment,id:null,active:false}};},start:async()=>{current??=snapshot();return structuredClone(current);},receipt:async()=>{if(denied)throw new EmergencyError('denied');return structuredClone(current);},phase:async(_,phase)=>{phases.push(phase);current=snapshot(phase+1);if(fail){fail=false;throw new EmergencyError('unknown');}return structuredClone(current);}};
 return {port,phases,appointments,drop:()=>{fail=true;},deny:()=>{denied=true;}};
}
function localized(locale:'en'|'ar',child:ReactNode){const props={locale,messages:locale==='ar'?ar:en,timeZone:'UTC',children:child};return createElement(NextIntlClientProvider,props);}
it('validates STOPPED facts and never exposes raw transport errors',async()=>{
 expect(parseReceipt(snapshot(7)).status).toBe('STOPPED');expect(()=>parseReceipt({...snapshot(7),verification:null})).toThrow('unknown');
 const denied=createEmergencyPort(async()=>{throw {code:'42501',message:'secret private identity'};});await expect(denied.start(operation)).rejects.toMatchObject({kind:'denied',message:'denied'});
 const timeout=createEmergencyPort(async()=>{throw {code:'57014',message:'raw error'};});await expect(timeout.phase(operation,5)).rejects.toMatchObject({kind:'unknown',message:'unknown'});
 const calls:{name:string;args:Record<string,unknown>}[]=[];const port=createEmergencyPort(async(name,args)=>{calls.push({name,args});return snapshot();});await port.start(operation);await port.phase(operation,1);
 expect(calls).toEqual([{name:'emergency_stop_v1',args:{p_operation:operation}},{name:'emergency_stop_phase_v1',args:{p_operation:operation,p_phase:1}}]);expect(JSON.stringify(calls)).not.toContain('actor');
});
it('lost response shows uncertainty and continues only unfinished phases; replay never repeats phase 1',async()=>{
 const f=fixture(),controller=new StopController(f.port,()=>{},()=>operation);f.drop();await controller.start();expect(controller.state.issue).toBe('unknown');expect(f.phases).toEqual([1]);
 await controller.continue();expect(controller.state.receipt?.status).toBe('STOPPED');expect(f.phases).toEqual([1,2,3,4,5,6]);await controller.continue();expect(f.phases).toHaveLength(6);
});
it('denied and cleared sessions discard operation and receipt, including in-flight replies',async()=>{
 const f=fixture(),controller=new StopController(f.port,()=>{},()=>operation);f.drop();await controller.start();f.deny();await controller.continue();expect(controller.state).toMatchObject({operation:null,receipt:null,issue:'denied'});
 let reply!:(r:Receipt)=>void;const port={...fixture().port,receipt:async()=>null,start:()=>new Promise<Receipt>(resolve=>{reply=resolve;})};const pendingController=new StopController(port,()=>{},()=>operation);const task=pendingController.start();await Promise.resolve();pendingController.clear();reply(snapshot());await task;expect(pendingController.state.operation).toBeNull();
});
it.each(['en','ar'] as const)('%s confirms stop, presents each phase and offers continue without service undo',async locale=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);const copy=locale==='ar'?ar.emergency:en.emergency;document.body.append(host);
 try{
  await act(async()=>root.render(localized(locale,createElement(EmergencyStopView,{port:f.port}))));
  const dialog=host.querySelector('dialog')!;expect(dialog.open).toBe(false);
  await act(async()=>host.querySelector('button')!.click());expect(dialog.open).toBe(true);
  const stop=[...dialog.querySelectorAll('button')].find(b=>b.textContent===copy.stopNow)!;expect(stop.disabled).toBe(true);
  await act(async()=>{host.querySelector('input')!.click();});f.drop();await act(async()=>stop.click());expect(dialog.open).toBe(false);expect(host.textContent).toContain(copy.unknown);
  const next=[...host.querySelectorAll('button')].find(b=>b.textContent===copy.continue)!;await act(async()=>next.click());expect(host.textContent).toContain(copy.status.STOPPED);expect(host.querySelectorAll('li')).toHaveLength(6);
  expect(host.textContent).toContain(copy.cloud);expect(host.textContent).not.toContain(operation);expect(host.textContent).not.toMatch(/\b(undo|resume service)\b/i);
 }finally{await act(async()=>root.unmount());host.remove();}
});
it('owner appoints ONE account and confirms danger-zone removal; email/UUID are only collapsed details',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);document.body.append(host);
 try{
  await act(async()=>root.render(localized('en',createElement(EmergencyOwnerView,{port:f.port}))));
  const choose=host.querySelector('details')!;await act(async()=>{choose.open=true;choose.dispatchEvent(new Event('toggle'));});
  const radio=host.querySelector<HTMLInputElement>('input[type=radio]')!;await act(async()=>radio.click());
  const email=[...host.querySelectorAll('bdi')].find(e=>e.textContent==='private@example.invalid')!;expect(email.closest('details')!.open).toBe(false);
  const appoint=[...host.querySelectorAll('button')].find(b=>b.textContent===en.emergency.appoint)!;await act(async()=>appoint.click());expect(f.appointments).toEqual([who]);
  const remove=[...host.querySelectorAll('button')].find(b=>b.textContent===en.emergency.remove)!;expect(remove.disabled).toBe(true);
  const confirm=host.querySelector<HTMLInputElement>('input[type=checkbox]')!;await act(async()=>confirm.click());await act(async()=>remove.click());expect(host.textContent).toContain(en.emergency.none);
 }finally{await act(async()=>root.unmount());host.remove();}
});

it('plain psql proof makes one attempt and classifies mixed/network errors UNKNOWN without raw output',()=>{
 const runbook=readFileSync('docs/RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md','utf8');
 const script=runbook.match(/```bash\n(set \+x[\s\S]*?)\n```/)?.[1];expect(script).toBeTruthy();
 const root=mkdtempSync(join(tmpdir(),'rad059-psql-classifier-'));
 try{
  const bin=join(root,'bin');mkdirSync(bin);writeFileSync(join(root,'old.pass'),'synthetic only',{mode:0o600});
  writeFileSync(join(bin,'psql'),'#!/bin/sh\nprintf "1\\n" >> "$RAD059_SYNTHETIC_COUNT"\nprintf "%s\\n" "$RAD059_SYNTHETIC_ERROR" >&2\nexit "$RAD059_SYNTHETIC_STATUS"\n',{mode:0o700});
  const rejected='psql: error: connection to server at "synthetic.invalid", port 5432 failed: FATAL:  role "synthetic_worker" is not permitted to log in';
  for(const [index,[exit,error,result]] of [[0,'','ACCEPTED'],[2,rejected,'AUTH_REJECTED'],[2,rejected+'\npsql: error: TLS failure','UNKNOWN'],[2,'psql: error: connection timed out','UNKNOWN']].entries()){
   const count=join(root,'attempts-'+index);const child=spawnSync('/bin/bash',['-c',script!],{env:{NODE_ENV:'test',PATH:bin+':/usr/bin:/bin',RAD059_SYNTHETIC_COUNT:count,RAD059_SYNTHETIC_ERROR:String(error),RAD059_SYNTHETIC_STATUS:String(exit)},input:root+'\n'+join(root,'old.pass')+'\nsynthetic_worker\n',encoding:'utf8'});
   expect(child.status,child.stderr).toBe(0);expect(child.stdout.trim()).toBe(result);expect(readFileSync(count,'utf8').trim()).toBe('1');expect(child.stdout).not.toContain('synthetic.invalid');
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});


it('dedicated page keeps its receipt and issue across navigation and visibility without phase replay',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);document.body.append(host);
 auth.state.profile.role='participant';auth.state.consentVersion=CONSENT_VERSION;
 vi.mocked(bindEmergency).mockImplementation(async()=>({...f.port}));
 const render=(page:boolean)=>root.render(localized('en',createElement(EmergencyAlternateScope,null,page?createElement(EmergencyPage):createElement('p',null,'Home'))));
 try{
  await act(async()=>render(true));await act(async()=>host.querySelector('button')!.click());await act(async()=>host.querySelector('input')!.click());
  f.drop();await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent===en.emergency.stopNow)!.click());
  expect(host.textContent).toContain(en.emergency.unknown);expect(f.phases).toEqual([1]);
  await act(async()=>render(false));expect(host.querySelector('[data-testid="emergency-stop"]')).toBeNull();
  await act(async()=>render(true));expect(host.textContent).toContain(en.emergency.unknown);expect(host.querySelector('[data-testid="stop-result"]')).not.toBeNull();
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent===en.emergency.continue)!.click());
  await act(async()=>document.dispatchEvent(new Event('visibilitychange')));
  await act(async()=>render(false));await act(async()=>render(true));
  expect(host.textContent).toContain(en.emergency.status.STOPPED);expect(f.phases).toEqual([1,2,3,4,5,6]);
 }finally{await act(async()=>root.unmount());host.remove();vi.mocked(bindEmergency).mockReset();}
});

it('owner appointment section still refreshes its existing snapshot when visibility returns',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);document.body.append(host);
 auth.state.profile.role='owner';auth.state.consentVersion=CONSENT_VERSION;
 const read=vi.spyOn(f.port,'owner');vi.mocked(bindEmergency).mockImplementation(async()=>({...f.port}));
 try{
  await act(async()=>root.render(localized('en',createElement(EmergencySession,{owner:true}))));expect(read).toHaveBeenCalledTimes(1);
  await act(async()=>document.dispatchEvent(new Event('visibilitychange')));expect(read).toHaveBeenCalledTimes(2);
 }finally{await act(async()=>root.unmount());host.remove();vi.mocked(bindEmergency).mockReset();}
});

it('RAD-095: owner opens and confirms the same stop flow; a visibility rebind keeps the running receipt',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);document.body.append(host);
 auth.state.profile.role='owner';auth.state.consentVersion=CONSENT_VERSION;
 const access=vi.spyOn(f.port,'access');vi.mocked(bindEmergency).mockImplementation(async()=>({...f.port}));
 const click=(text:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!.click();
 try{
  await act(async()=>root.render(localized('en',createElement(EmergencySession,{owner:true}))));
  const stop=host.querySelector('[data-testid="emergency-stop"]')!;
  expect(stop.textContent).toContain(en.emergency.ownerIntro);expect(stop.textContent).not.toContain(en.emergency.pageIntro);
  expect(host.querySelector('[data-testid="emergency-owner"]')).not.toBeNull();expect(host.querySelector('dialog')!.open).toBe(false);
  await act(async()=>click(en.emergency.startStop));expect(host.querySelector('dialog')!.open).toBe(true);
  expect(([...host.querySelectorAll('button')].find(b=>b.textContent===en.emergency.stopNow) as HTMLButtonElement).disabled).toBe(true);
  await act(async()=>host.querySelector<HTMLInputElement>('dialog input')!.click());
  f.drop();await act(async()=>click(en.emergency.stopNow));
  expect(host.textContent).toContain(en.emergency.unknown);expect(f.phases).toEqual([1]);
  await act(async()=>document.dispatchEvent(new Event('visibilitychange')));
  expect(host.textContent).toContain(en.emergency.unknown);expect(host.querySelector('[data-testid="stop-result"]')).not.toBeNull();
  await act(async()=>click(en.emergency.continue));
  expect(host.querySelector('[data-testid="stop-result"]')!.textContent).toBe(en.emergency.status.STOPPED);expect(f.phases).toEqual([1,2,3,4,5,6]);
  expect(access).not.toHaveBeenCalled();
 }finally{await act(async()=>root.unmount());host.remove();vi.mocked(bindEmergency).mockReset();}
});

it('RAD-095: the owner status-bar request opens the confirmation dialog in Arabic; non-owners never see the owner stop',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);document.body.append(host);
 auth.state.profile.role='owner';auth.state.consentVersion=CONSENT_VERSION;
 vi.mocked(bindEmergency).mockImplementation(async()=>({...f.port}));
 try{
  await act(async()=>root.render(localized('ar',createElement(EmergencySession,{owner:true,openRequest:1}))));
  expect(host.querySelector('dialog')!.open).toBe(true);expect(host.textContent).toContain(ar.emergency.ownerIntro);expect(host.textContent).toContain(ar.emergency.confirmStop);
  expect(f.phases).toEqual([]);
  await act(async()=>root.unmount());
  for(const role of ['participant','supervisor']){
   auth.state.profile.role=role;vi.mocked(bindEmergency).mockClear();
   const other=createRoot(host);
   await act(async()=>other.render(localized('en',createElement(EmergencySession,{owner:true,openRequest:1}))));
   expect(host.innerHTML).toBe('');expect(bindEmergency).not.toHaveBeenCalled();
   await act(async()=>other.unmount());
  }
 }finally{host.remove();vi.mocked(bindEmergency).mockReset();}
});

it('RAD-095: the alternate page keeps its own intro and no owner wording',async()=>{
 const f=fixture(),host=document.createElement('div'),root=createRoot(host);
 auth.state.profile.role='participant';auth.state.consentVersion=CONSENT_VERSION;
 vi.mocked(bindEmergency).mockImplementation(async()=>({...f.port}));
 try{
  await act(async()=>root.render(localized('en',createElement(EmergencyAlternateScope,null,createElement(EmergencyPage)))));
  expect(host.textContent).toContain(en.emergency.pageIntro);expect(host.textContent).not.toContain(en.emergency.ownerIntro);
  expect(host.querySelector('[data-testid="emergency-owner"]')).toBeNull();expect(host.querySelector('dialog')!.open).toBe(false);
 }finally{await act(async()=>root.unmount());vi.mocked(bindEmergency).mockReset();}
});
