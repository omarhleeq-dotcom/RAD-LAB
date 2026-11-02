"use client";
import {useEffect,useState} from 'react';
import {useOptionalSessionAccount} from '../pilot/SessionGate';
import {PILOT} from '../pilot/config';
import {needsConsent} from '../pilot/consent';
import {EMERGENCY_AVAILABLE} from './availability';
import type {EmergencyPort} from './contracts';
import {EmergencyOwnerView,EmergencyStopView} from './EmergencyView';
/** Both entrypoints use the existing account provider and literal dormant guard. */
export function EmergencySession({owner=false}:{owner?:boolean}) {
 const account=useOptionalSessionAccount(),state=account?.state;
 const identity=PILOT&&state?.kind==='signedIn'&&state.profile.status==='approved'&&!needsConsent(state.consentVersion)
  &&(owner?state.profile.role==='owner':state.profile.role==='participant')?state.userId:null;
 if(!EMERGENCY_AVAILABLE||!identity)return null;
 return <BoundEmergency key={`${identity}:${owner}`} owner={owner}/>;
}
function BoundEmergency({owner}:{owner:boolean}) {
 const [port,setPort]=useState<EmergencyPort|null>(null),[allowed,setAllowed]=useState(owner);
 useEffect(()=>{let active=true;
  async function bind(){
   if(EMERGENCY_AVAILABLE){
    try{const binding=await import('./browser-adapter');const next=await binding.bindEmergency();const ok=owner||await next.access();if(active){setAllowed(ok);setPort(ok?next:null);}}
    catch{if(active){setAllowed(false);setPort(null);}}
   }
  }
  void bind();
  const visible=()=>{if(document.visibilityState==='visible')void bind();};
  document.addEventListener('visibilitychange',visible);
  return()=>{active=false;document.removeEventListener('visibilitychange',visible);};
 },[owner]);
 if(!allowed||!port)return null;
 return owner?<EmergencyOwnerView port={port}/>:<EmergencyStopView port={port}/>;
}
