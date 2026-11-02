"use client";
import {useEffect,useId,useMemo,useState} from 'react';
import {useTranslations} from 'next-intl';
import {OwnerDirectory} from '../pilot/OwnerDirectory';
import {StopController} from './controller';
import {EmergencyError,type Candidate,type EmergencyPort,type OwnerSnapshot} from './contracts';
const button='min-h-11 rounded border border-line px-3 py-2 disabled:opacity-50';
const danger='min-h-11 rounded border border-red-700 bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50';

export function EmergencyStopView({port}:{port:EmergencyPort}) {
 const t=useTranslations('emergency'),[confirmed,setConfirmed]=useState(false),[,changed]=useState(0),confirmId=useId();
 const controller=useMemo(()=>new StopController(port,()=>changed(n=>n+1)),[port]);
 useEffect(()=>()=>controller.clear(false),[controller]);
 const {receipt,busy,issue,operation}=controller.state;
 if(issue==='denied')return <p role="alert">{t('denied')}</p>;
 return <section data-testid="emergency-stop" aria-label={t('stopTitle')} className="mx-auto my-4 w-full min-w-0 max-w-3xl space-y-3 rounded border border-red-700 bg-panel p-4" style={{overflowWrap:'anywhere'}}>
  <h2 className="text-xl font-semibold">{t('stopTitle')}</h2>
  <p>{t('warning')}</p><p>{t('cloud')}</p>
  {!operation&&<><label htmlFor={confirmId} className="flex min-h-11 items-start gap-2"><input id={confirmId} type="checkbox" className="mt-1 size-5 shrink-0" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>{t('confirmStop')}</span></label><button className={danger} disabled={!confirmed||busy} onClick={()=>void controller.start()}>{t('stop')}</button></>}
  {receipt&&<><p role="status" data-testid="stop-result">{t(`status.${receipt.status}`)}</p><ol className="space-y-2">{Array.from({length:6},(_,i)=>i+1).map(phase=>{
   const result=receipt.phases.find(p=>p.phase===phase);
   return <li key={phase} className="flex min-w-0 flex-wrap gap-x-2"><span>{t(`phases.${phase}`)}</span><strong>{t(result?result.ok?'completed':'failed':'pending')}</strong></li>;
  })}</ol><p className="text-sm">{t('receiptTime')} <bdi>{receipt.at}</bdi></p></>}
  {issue&&<p role="alert">{t(issue==='unknown'?'unknown':'rejected')}</p>}
  {busy&&<p role="status">{t('working')}</p>}
  {operation&&!busy&&receipt?.nextPhase!==7&&<button className={danger} onClick={()=>void controller.continue()}>{t('continue')}</button>}
  {receipt?.nextPhase===7&&receipt.status!=='STOPPED'&&<button className={danger} onClick={()=>{controller.clear();setConfirmed(false);}}>{t('newStop')}</button>}
  <p className="text-sm">{t('ack')}</p>
 </section>;
}

export function EmergencyOwnerView({port}:{port:EmergencyPort}) {
 const t=useTranslations('emergency'),[snapshot,setSnapshot]=useState<OwnerSnapshot|null>(null),[candidate,setCandidate]=useState<Candidate|null>(null);
 const [busy,setBusy]=useState(false),[issue,setIssue]=useState<'denied'|'error'|null>(null),[confirm,setConfirm]=useState(false),[choosing,setChoosing]=useState(false),confirmId=useId();
 useEffect(()=>{let active=true;void port.owner().then(value=>{if(active)setSnapshot(value);}).catch(error=>{if(active)setIssue(error instanceof EmergencyError&&error.kind==='denied'?'denied':'error');});return()=>{active=false;};},[port]);
 async function act(action:()=>Promise<void>) {
  if(busy)return;setBusy(true);setIssue(null);
  try{await action();setSnapshot(await port.owner());setCandidate(null);setConfirm(false);setChoosing(false);}
  catch(error){const denied=error instanceof EmergencyError&&error.kind==='denied';if(denied){setSnapshot(null);setCandidate(null);}setIssue(denied?'denied':'error');}
  finally{setBusy(false);}
 }
 async function more(){if(!snapshot?.next||busy)return;setBusy(true);try{const page=await port.owner(snapshot.next);setSnapshot({...page,audit:[...snapshot.audit,...page.audit]});}catch{setIssue('error');}finally{setBusy(false);}}
 if(issue==='denied')return <p role="alert">{t('denied')}</p>;
 return <section data-testid="emergency-owner" aria-label={t('ownerTitle')} className="my-6 min-w-0 space-y-3 rounded border border-line p-4" style={{overflowWrap:'anywhere'}}>
  <h2 className="text-xl font-semibold">{t('ownerTitle')}</h2><p>{t('ownerHelp')}</p>
  {issue&&<p role="alert">{t('error')}</p>}
  {!snapshot?<p role="status">{t('loading')}</p>:<>
   <p>{snapshot.appointment.active?snapshot.appointment.name||t('unnamed'):t('none')}</p>
   {snapshot.appointment.active&&<details><summary className="min-h-11 cursor-pointer">{t('details')}</summary><bdi className="block break-all">{snapshot.appointment.id}</bdi><bdi>{snapshot.appointment.appointedAt}</bdi></details>}
   <details open={choosing} onToggle={e=>setChoosing(e.currentTarget.open)}><summary className="min-h-11 cursor-pointer">{t('choose')}</summary>
    {choosing&&<OwnerDirectory approvedOnly>{p=><div className="min-w-0 space-y-1">
     <label className="flex min-h-11 items-start gap-2"><input type="radio" name={`alternate-${confirmId}`} className="mt-1 size-5 shrink-0" checked={candidate?.id===p.userId} onChange={()=>setCandidate({id:p.userId,name:p.name||t('unnamed'),email:p.email})}/><span>{p.name||t('unnamed')}</span></label>
     <details><summary className="min-h-11 cursor-pointer">{t('details')}</summary><bdi className="block break-all">{p.email}</bdi><bdi className="block break-all">{p.userId}</bdi></details>
    </div>}</OwnerDirectory>}
    <button className={button} disabled={!candidate||busy} onClick={()=>void act(()=>port.appoint(candidate!.id))}>{t('appoint')}</button>
   </details>
   {snapshot.appointment.active&&<details className="rounded border border-red-700 p-3"><summary className="min-h-11 cursor-pointer font-semibold">{t('danger')}</summary><p>{t('removeWarning')}</p>
    <label htmlFor={confirmId} className="flex min-h-11 items-start gap-2"><input id={confirmId} type="checkbox" className="mt-1 size-5 shrink-0" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/><span>{t('confirmRemove')}</span></label><button className={danger} disabled={!confirm||busy} onClick={()=>void act(()=>port.remove())}>{t('remove')}</button>
   </details>}
   <h3 className="font-semibold">{t('auditTitle')}</h3>
   {snapshot.audit.length===0?<p>{t('auditEmpty')}</p>:<ul className="divide-y divide-line">{snapshot.audit.map(row=><li key={row.id} className="flex min-w-0 flex-wrap gap-x-2 py-2"><bdi>{row.at}</bdi><span>{t(`actions.${row.action}`)}</span><strong>{t(`status.${row.result}`)}</strong></li>)}</ul>}
   {snapshot.next&&<button className={button} disabled={busy} onClick={()=>void more()}>{t('more')}</button>}
   <p className="text-sm">{t('retention')}</p>
  </>}
 </section>;
}
