// @vitest-environment jsdom
import {act,createElement as h,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {readFileSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
import type {AccountState} from './useAccount';
import {OwnerPanel} from './OwnerPanel';
// @ts-expect-error The manual Node browser harness is JavaScript, outside the TS app.
import {measurementPlan,summarizeLoading} from '../../../scripts/qa/application-loading-performance.mjs';

const f=vi.hoisted(()=>({state:{kind:'signedIn',userId:'owner-a',profile:{role:'owner',status:'approved'}} as AccountState,
 loads:0,mounts:0,unmounts:0,safetyMounts:0,safetyUnmounts:0,fail:false,release:()=>{},rpc:vi.fn()}));
vi.mock('next/dynamic',async()=>({default:(await import('next/dist/shared/lib/app-dynamic')).default}));
vi.mock('./SessionGate',()=>({useSessionAccount:()=>({state:f.state})}));
vi.mock('./client',()=>({getPilotClient:async()=>({rpc:f.rpc})}));
vi.mock('./config',()=>({PILOT:{url:'https://synthetic.supabase.co',key:'synthetic'}}));
vi.mock('./C2Session',()=>({useC2Adapter:()=>null}));
vi.mock('@/i18n/navigation',()=>({Link:'a'}));
vi.mock('./OwnerActivity',()=>({ParticipantActivity:()=>null}));
vi.mock('./OwnerTraining',()=>({OwnerTraining:()=>h('p',null,'Training fixture')}));
vi.mock('@/features/assess/OwnerAssessPanel',async()=>{
 f.loads++;await new Promise<void>(resolve=>{f.release=resolve;});
 const {useEffect}=await import('react');
 return {OwnerAssessPanel:({section}:{section:string})=>{
  useEffect(()=>{f.mounts++;return()=>{f.unmounts++;};},[]);
  const [value,setValue]=useState('');
  if(f.fail)throw new Error('synthetic chunk/render failure');
  return h('label',null,section,h('input',{value,onChange:(e:React.ChangeEvent<HTMLInputElement>)=>setValue(e.target.value)}));
 }};
});
vi.mock('@/features/emergency/EmergencySession',async()=>{
 const {useEffect}=await import('react');
 return {EmergencySession:()=>{useEffect(()=>{f.safetyMounts++;return()=>{f.safetyUnmounts++;};},[]);return h('button',null,'Synthetic stop controller');}};
});
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:ReturnType<typeof createRoot>|undefined;
const messages=JSON.parse(readFileSync('messages/en.json','utf8'));
async function draw(){await act(async()=>root!.render(h(NextIntlClientProvider,{locale:'en',messages,timeZone:'UTC',children:h(OwnerPanel)})));}
async function mount(){document.body.innerHTML='<div id="root"></div>';root=createRoot(document.getElementById('root')!);await draw();}
async function go(tab:string){await act(async()=>{history.pushState(null,'',`?tab=${tab}`);window.dispatchEvent(new PopStateEvent('popstate'));});}
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';history.replaceState(null,'','/');vi.restoreAllMocks();f.state={kind:'signedIn',userId:'owner-a',profile:{role:'owner',status:'approved'}} as AccountState;f.fail=false;});
f.rpc.mockImplementation(async()=>({data:{version:1,rows:[],counts:{pending:0,approved:0,suspended:0},next:null,boundary:'2026-11-06T00:00:00Z'},error:null}));

it('retains slow samples in median and nearest-rank p95 with a pinned, fixed measurement plan',()=>{
 expect(summarizeLoading([10,2,8,4,6,5,7,3,9,1])).toEqual({median:5.5,p95:10});
 expect(summarizeLoading(Array.from({length:20},(_,i)=>i+1))).toEqual({median:10.5,p95:19});
 expect(measurementPlan).toMatchObject({baseline:'5a0ae2b2c3b311a9674185b0100a50e46a389a0f',repetitions:10,cpu:4,latencyMs:120});
});

it('loads an inactive tab only on use, keeps emergency available while pending, and rejects a late mount after sign-out',async()=>{
 await mount();expect(f.loads).toBe(0);expect(document.querySelector('[data-testid="owner-emergency-button"]')).not.toBeNull();
 await go('groups');expect(f.loads).toBe(1);expect(document.querySelector('[role="status"]')?.textContent).toBe(messages.owner.dashboard.loading);
 expect(document.querySelector('[data-testid="owner-emergency-button"]')).not.toBeNull();
 f.state={kind:'signedOut'};await draw();await act(async()=>f.release());
 expect(f.mounts).toBe(0);expect(document.querySelector('[data-testid="owner-signed-out"]')).not.toBeNull();
});
it('preserves direct and legacy tabs, remounts the existing groups/assess instances and does not remount hidden Safety',async()=>{
 history.replaceState(null,'','/?tab=groups');await mount();
 expect(document.querySelector('label')?.textContent).toBe('groups');const mounted=f.mounts;
 await go('assess');expect(document.querySelector('label')?.textContent).toBe('assess');expect(f.mounts).toBe(mounted+1);
 await go('safety');expect(f.safetyMounts).toBe(1);await go('groups');expect(f.safetyMounts).toBe(1);expect(f.safetyUnmounts).toBe(0);
 expect(document.querySelector('[aria-labelledby="owner-safety-title"]')?.hasAttribute('hidden')).toBe(true);
 await go('training');expect(document.body.textContent).toContain('Training fixture');
 await go('participants');expect(document.querySelector('[data-testid="owner-directory"]')).not.toBeNull();
});
it('isolates a deferred failure with a native reload link, retains stop access, and can navigate to a healthy tab',async()=>{
 const errors=vi.spyOn(console,'error').mockImplementation(()=>{});await mount();f.fail=true;await go('groups');
 expect(document.querySelector('[role="alert"]')?.textContent).toContain(messages.owner.errors.action);
 const retry=document.querySelector('[role="alert"] a');expect(retry?.getAttribute('href')).toBe('?tab=groups');expect(retry?.textContent).toBe(messages.owner.refresh);
 expect(document.querySelector('[data-testid="owner-emergency-button"]')).not.toBeNull();
 await go('training');expect(document.body.textContent).toContain('Training fixture');expect(document.querySelector('[role="alert"]')).toBeNull();errors.mockRestore();
});
it('removes a loaded deferred view synchronously when owner identity or approval changes',async()=>{
 history.replaceState(null,'','/?tab=groups');await mount();expect(document.querySelector('label')).not.toBeNull();
 f.state={kind:'signedIn',userId:'owner-b',profile:{role:'participant',status:'approved'}} as AccountState;await draw();
 expect(document.querySelector('label')).toBeNull();expect(document.querySelector('[data-testid="owner-denied"]')).not.toBeNull();
});
