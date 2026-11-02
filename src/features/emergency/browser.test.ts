// @vitest-environment jsdom
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import manifest from '../../../scripts/pages/frontend-schema.json';
import {EMERGENCY_AVAILABLE,EMERGENCY_MIGRATIONS,emergencyAvailable} from './availability';
import {EmergencySession} from './EmergencySession';
import {bindEmergency} from './browser-adapter';
const auth=vi.hoisted(()=>({state:{kind:'signedIn',userId:'synthetic',profile:{role:'owner',status:'approved'}}}));
vi.mock('../pilot/SessionGate',()=>({useOptionalSessionAccount:()=>({state:auth.state})}));
vi.mock('../pilot/config',()=>({PILOT:true}));
vi.mock('./browser-adapter',()=>({bindEmergency:vi.fn(()=>{throw Error('dormant adapter must never bind');})}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('dormant owner and alternate entries are hidden without loading any adapter',async()=>{
 expect(EMERGENCY_AVAILABLE).toBe(false);expect(emergencyAvailable(manifest)).toBe(false);
 const promoted={requiredMigrations:[...manifest.requiredMigrations,...EMERGENCY_MIGRATIONS],deferredMigrations:{}};expect(emergencyAvailable(promoted)).toBe(true);
 expect(emergencyAvailable({...promoted,deferredMigrations:{[EMERGENCY_MIGRATIONS[0]]:{}}})).toBe(false);
 const host=document.createElement('div'),root=createRoot(host);
 try{await act(async()=>root.render(createElement(EmergencySession,{owner:true})));expect(host.innerHTML).toBe('');auth.state.profile.role='participant';await act(async()=>root.render(createElement(EmergencySession)));expect(host.innerHTML).toBe('');expect(bindEmergency).not.toHaveBeenCalled();}finally{await act(async()=>root.unmount());}
});
