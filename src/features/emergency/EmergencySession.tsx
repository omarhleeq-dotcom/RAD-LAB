"use client";
import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {useOptionalSessionAccount} from '../pilot/SessionGate';
import {PILOT} from '../pilot/config';
import {needsConsent} from '../pilot/consent';
import {EMERGENCY_AVAILABLE} from './availability';
import {StopController} from './controller';
import type {EmergencyPort} from './contracts';
import {EmergencyOwnerView,EmergencyStopView} from './EmergencyView';
const AlternateContext=createContext<{port:EmergencyPort|null;loading:boolean;controller:StopController|null}>({port:null,loading:false,controller:null});
/** Share the existing access read between navigation and the dedicated page. */
export function EmergencyAlternateScope({children}:{children:ReactNode}) {
 const account=useOptionalSessionAccount(),state=account?.state;
 const identity=EMERGENCY_AVAILABLE&&PILOT&&state?.kind==='signedIn'&&state.profile.status==='approved'
  &&state.profile.role==='participant'&&!needsConsent(state.consentVersion)?state.userId:null;
 return identity?<BoundEmergency key={identity} owner={false} scope={children}/>:<AlternateContext.Provider value={{port:null,loading:EMERGENCY_AVAILABLE&&!!PILOT&&state?.kind==='loading',controller:null}}>{children}</AlternateContext.Provider>;
}
export function useEmergencyAlternate(){return useContext(AlternateContext).port!==null;}
export function EmergencyPage() {
 const {port,loading}=useContext(AlternateContext),t=useTranslations('emergency');
 return port?<EmergencySession/>:<p role="status">{t(loading?'loading':'pageUnavailable')}</p>;
}
/** Both entrypoints use the existing account provider and literal dormant guard. */
export function EmergencySession({owner=false,openRequest=0}:{owner?:boolean;openRequest?:number}) {
 const account=useOptionalSessionAccount(),state=account?.state,alternate=useContext(AlternateContext);
 const identity=PILOT&&state?.kind==='signedIn'&&state.profile.status==='approved'&&!needsConsent(state.consentVersion)
  &&(owner?state.profile.role==='owner':state.profile.role==='participant')?state.userId:null;
 if(!EMERGENCY_AVAILABLE||!identity)return null;
 return owner?<BoundEmergency key={`${identity}:${owner}`} owner={owner} openRequest={openRequest}/>:alternate.port?<EmergencyStopView key={identity} port={alternate.port} controller={alternate.controller??undefined}/>:null;
}
function BoundEmergency({owner,scope,openRequest=0}:{owner:boolean;scope?:ReactNode;openRequest?:number}) {
 const [port,setPort]=useState<EmergencyPort|null>(null),[allowed,setAllowed]=useState(owner),[loading,setLoading]=useState(true),[,changed]=useState(0);
 const [stopPort,setStopPort]=useState<EmergencyPort|null>(null),scoped=scope!==undefined;
 // Keep the same session lifetime as the former provider panel: route changes cannot clear a stop.
 // The owner's stop keeps its first port; visibility rebinds refresh only the appointment view.
 const stable=scoped?port:owner?stopPort:null;
 const controller=useMemo(()=>stable?new StopController(stable,()=>changed(n=>n+1)):null,[stable]);
 useEffect(()=>()=>controller?.clear(false),[controller]);
 useEffect(()=>{let active=true;
  async function bind(){
   if(EMERGENCY_AVAILABLE){
    try{const binding=await import('./browser-adapter');const next=await binding.bindEmergency();const ok=owner||await next.access();if(active){setAllowed(ok);setPort(current=>ok?(scoped?current??next:next):null);if(owner&&ok)setStopPort(current=>current??next);}}
    catch{if(active){setAllowed(false);setPort(null);}}
    finally{if(active)setLoading(false);}
   }
  }
  void bind();
  const visible=()=>{if(document.visibilityState==='visible')void bind();};
  document.addEventListener('visibilitychange',visible);
  return()=>{active=false;document.removeEventListener('visibilitychange',visible);};
 },[owner,scoped]);
 if(scope!==undefined)return <AlternateContext.Provider value={{port:allowed?port:null,loading,controller}}>{scope}</AlternateContext.Provider>;
 if(!allowed||!port)return null;
 return owner?<>{stopPort&&controller&&<EmergencyStopView port={stopPort} controller={controller} intro="ownerIntro" openRequest={openRequest}/>}<EmergencyOwnerView port={port}/></>:<EmergencyStopView port={port}/>;
}
