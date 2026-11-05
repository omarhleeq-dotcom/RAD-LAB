"use client";
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useOptionalSessionAccount } from '@/features/pilot/SessionGate';
import { needsConsent } from '@/features/pilot/consent';
import { getPilotClient } from '@/features/pilot/client';
import { useEmergencyAlternate } from '@/features/emergency/EmergencySession';
import { useSupervisorAppointment } from '@/features/supervisor/P1Session';
import { AssessConsent } from '../AssessConsent';
import { HistoryPanel } from '../HistoryPanel';
import { Runner } from '../AssessPanel';
import { FullPracticalRunner } from '../FullPracticalRunner';
import { bindSelfService } from './adapter';
import { bindSelfServiceRunners } from './runner';
import { Management } from './Management';
import { Recovery } from './Recovery';
import { StudentExamList, type StudentItem } from './SelfServiceViews';
import { selfServiceStrings } from './strings';
import { SelfServiceError, type SelfServicePort, type Page } from './contracts';
type Mode='student'|'manage'|'history'|'recovery';
type Binding={port:SelfServicePort;runners:ReturnType<typeof bindSelfServiceRunners>};
export function SelfServiceSession({mode}:{mode:Mode}) {
 const state=useOptionalSessionAccount()?.state,supervisor=useSupervisorAppointment(),alternate=useEmergencyAlternate();
 const identity=state?.kind==='signedIn'&&state.profile.status==='approved'&&!needsConsent(state.consentVersion)?state.userId:null;
 if(!identity||state?.kind!=='signedIn')return null;
 const owner=state.profile.role==='owner';
 if(mode==='manage'&&!owner&&!supervisor||mode==='student'&&owner||mode==='recovery'&&!owner&&!alternate)return null;
 return <AssessConsent key={`${identity}:${mode}`}><Bound key={`${identity}:${mode}:${owner}`} mode={mode} owner={owner}/></AssessConsent>;
}
function Bound({mode,owner}:{mode:Mode;owner:boolean}) {
 const locale=useLocale()==='ar'?'ar':'en',s=selfServiceStrings[locale];
 const [binding,setBinding]=useState<Binding|null>(),[revision,setRevision]=useState(0),[fault,setFault]=useState(false);
 useEffect(()=>{
  const c=new AbortController(),timer=setTimeout(()=>{c.abort();setBinding(null);setFault(true);},15000);
  void (async()=>{const client=await getPilotClient();if(!client)return null;const port=await bindSelfService(client,c.signal);return port?{port,runners:bindSelfServiceRunners(client,c.signal)}:null;})()
   .then(b=>{if(!c.signal.aborted)setBinding(b);}).catch(()=>{if(!c.signal.aborted){setBinding(null);setFault(true);}}).finally(()=>clearTimeout(timer));
  const visible=()=>{if(document.visibilityState==='visible'){setBinding(undefined);setFault(false);setRevision(n=>n+1);}};
  document.addEventListener('visibilitychange',visible);
  return()=>{clearTimeout(timer);c.abort();document.removeEventListener('visibilitychange',visible);};
 },[revision]);
 return <div lang={locale} dir={locale==='ar'?'rtl':'ltr'} className="mt-5 min-w-0 space-y-3" data-testid={`selfservice-${mode}`}>
  {binding===undefined?<p role="status">{s.loading}</p>:!binding?<><p role={fault?'alert':'status'}>{s.unavailable}</p><button className="min-h-11 rounded border border-line px-3" onClick={()=>{setBinding(undefined);setFault(false);setRevision(n=>n+1);}}>{s.refresh}</button></>:mode==='manage'?<Management port={binding.port} owner={owner} locale={locale} strings={s}/>:mode==='recovery'?<Recovery port={binding.port} owner={owner} strings={s}/>:mode==='history'?<HistoryPanel reader={binding.port.history}/>:<Student binding={binding} locale={locale}/>}
 </div>;
}
function Student({binding,locale}:{binding:Binding;locale:'en'|'ar'}) {
 const {port,runners}=binding,s=selfServiceStrings[locale];
 const [page,setPage]=useState<Page<StudentItem>>(),[error,setError]=useState(''),[busy,setBusy]=useState(true),[attempt,setAttempt]=useState<{id:string;track:string}>();
 const operation=useRef<{assignment:string;id:string}|null>(null),lock=useRef(false),live=useRef(true);
 async function load(after:string|null=null) {setBusy(true);setError('');try{const next=await port.students(after);if(live.current)setPage(next);}catch(e){if(live.current){setPage(undefined);setError(e instanceof SelfServiceError?s[e.kind]:s.unavailable);}}finally{if(live.current)setBusy(false);}}
 useEffect(()=>{live.current=true;void port.students().then(next=>{if(live.current)setPage(next);}).catch(e=>{if(live.current)setError(e instanceof SelfServiceError?s[e.kind]:s.unavailable);}).finally(()=>{if(live.current)setBusy(false);});return()=>{live.current=false;};},[port,s]);
 async function start(id:string) {
  if(lock.current)return;const item=page?.rows.find(r=>r.id===id);if(!item)return;
  lock.current=true;setBusy(true);setError('');
  try {
   let sid=item.sessionId;
   if(!sid){if(operation.current?.assignment!==id)operation.current={assignment:id,id:crypto.randomUUID()};sid=await runners.mixed.start(id,operation.current.id);operation.current=null;}
   if(live.current)setAttempt({id:sid,track:item.track??'mixed'});
  }catch{if(live.current)setError(s.unknown);}finally{lock.current=false;if(live.current)setBusy(false);}
 }
 const leave=()=>{setAttempt(undefined);void load();};
 if(attempt)return attempt.track==='full-practical'?<FullPracticalRunner port={runners.practical} attempt={attempt.id} leave={leave}/>:<Runner port={runners.mixed} attempt={attempt.id} leave={leave}/>;
 return <section className="space-y-3" aria-label={s.manage} aria-busy={busy}>
  <button className="min-h-11 rounded border border-line px-3" disabled={busy} onClick={()=>void load()}>{s.refresh}</button>
  {busy&&<p role="status">{s.loading}</p>}{error&&<p role="alert">{error}</p>}
  {page&&<StudentExamList enabled busy={busy} items={page.rows} strings={s} locale={locale} historyHref="?history=1" onStart={id=>{if(!busy)void start(id);}}/>}
  {page?.next&&<button className="min-h-11 rounded border border-line px-3" disabled={busy} onClick={()=>void load(page.next)}>{s.next}</button>}
 </section>;
}
