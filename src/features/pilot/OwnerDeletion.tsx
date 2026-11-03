'use client';
import {useEffect,useState} from 'react';
import {useTranslations} from 'next-intl';
import {c2Button as btn,safely,type C2Adapter,type Deletion,type Outcome,type Page} from './c2-ui';
import {Pager} from './OwnerUi';
/** One account's disable-and-delete confirmation; hosted by the owner details panel. Same adapter call as before. */
export function DeactivateAccount({adapter,ownerId,person,onChanged}:{adapter:C2Adapter;ownerId:string|null;person:{id:string;code:string};onChanged?:()=>void}) {
 const t=useTranslations('c2');
 const [confirm,setConfirm]=useState(false),[agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 if(!ownerId)return <p role="alert">{t('ownerOnly')}</p>;
 async function act() {
  if(busy)return;setBusy(true);setNotice('');
  const result=await safely(()=>adapter.deletion('deactivate',person.id));
  if(result.kind==='ready'){setNotice('changed');setConfirm(false);setAgreed(false);onChanged?.();}
  else setNotice(result.kind==='unavailable'?'unavailable':'error');
  setBusy(false);
 }
 return <div className="min-w-0 space-y-2" data-testid="c2-deactivate">
  {notice&&<p role={notice==='error'?'alert':'status'}>{t(notice)}</p>}
  {!confirm?<button className={btn} disabled={busy||person.id===ownerId} onClick={()=>{setConfirm(true);setAgreed(false);setNotice('');}}>{t('deactivate')}</button>:
  <section aria-labelledby={`c2-confirm-${person.id}`} className="space-y-3 rounded-md border border-signal p-3" data-testid="c2-confirm">
   <h3 id={`c2-confirm-${person.id}`} className="font-semibold">{t('confirmTitle',{code:person.code})}</h3>
   <p>{t('permanent')}</p><p>{t('backups')}</p>
   <label className="flex items-start gap-2"><input type="checkbox" checked={agreed} disabled={busy} onChange={e=>setAgreed(e.target.checked)} className="mt-1 size-5 shrink-0"/>{t('understand')}</label>
   <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy||!agreed} onClick={()=>void act()}>{t('confirmDeactivate')}</button><button className={btn} disabled={busy} onClick={()=>setConfirm(false)}>{t('cancel')}</button></div>
  </section>}
 </div>;
}
/** Owner-only pending-deletion list with restore and explicit partial-finalise reporting. */
export function OwnerDeletion({adapter,ownerId,onChanged}:{adapter:C2Adapter;ownerId:string|null;onChanged?:()=>void}) {
 const t=useTranslations('c2'),disclosure=useTranslations('rad085Disclosure');
 const [blocked,setBlocked]=useState<string[]>([]),[more,setMore]=useState(false);
 const [after,setAfter]=useState<string|null>(null),[revision,setRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<{key:string;pending:Outcome<Page<Deletion>>}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const key=JSON.stringify([after,revision,ownerId]);
 useEffect(()=>{if(!ownerId)return;let active=true;
  void safely(()=>adapter.deletions(after)).then(pending=>{if(active)setSnapshot({key,pending});});
  return()=>{active=false;};
 },[adapter,ownerId,after,revision,key]);
 if(!ownerId)return <p role="alert">{t('ownerOnly')}</p>;
 const data=snapshot?.key===key?snapshot:null;
 const unavailable=data&&data.pending.kind==='unavailable';
 const error=data&&data.pending.kind==='error';
 const pending=data?.pending.kind==='ready'?data.pending.data:null;
 async function act(action:'restore'|'finalise',id?:string) {
  if(busy)return;setBusy(true);setNotice('');
  const result=await safely(()=>adapter.deletion(action,id));
  if(result.kind==='ready'){
   if(typeof result.data==='object'){
    // A successful continuation must not hide the previous blocked batch.
    if(result.data.newPass||result.data.blocked.length)setBlocked(result.data.blocked);
    setMore(result.data.more);
   }else setMore(false);
   setNotice('changed');setAfter(null);setRevision(v=>v+1);onChanged?.();
  }
  else setNotice(result.kind==='unavailable'?'unavailable':'error');
  setBusy(false);
 }
 return <section aria-labelledby="c2-deletion-title" className="min-w-0 space-y-4" data-testid="c2-deletion">
  <h3 id="c2-deletion-title" className="text-lg font-semibold">{t('pendingDeletion')}</h3>
  {(!data||unavailable||error)&&<p role={error?'alert':'status'}>{t(!data?'loading':unavailable?'unavailable':'error')}</p>}
  {blocked.length>0&&<div role="alert"><p>{disclosure('blocked')}</p><ul>{blocked.map(id=><li key={id}><bdi className="break-all">{pending?.rows.find(p=>p.id===id)?.code??id}</bdi></li>)}</ul></div>}
  {more&&<p role="status">{disclosure('more')}</p>}
  {notice&&<p role={notice==='error'?'alert':'status'}>{t(notice)}</p>}
  {!unavailable&&!error&&pending&&<>
   <p className="text-sm text-muted">{t('restoreHelp')}</p>
   <ul className="divide-y divide-line">{pending.rows.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><bdi className="break-all font-mono">{p.code}</bdi><span>{t('days',{count:p.days})}</span><button className={btn} disabled={busy||p.days===0||p.id===ownerId} onClick={()=>void act('restore',p.id)}>{t('restore')}</button></li>)}</ul>
   {pending.rows.length===0&&<p>{t('empty')}</p>}
   <Pager atStart={after===null} hasNext={!!pending.next} disabled={busy} first={()=>setAfter(null)} next={()=>setAfter(pending.next)} firstLabel={t('first')} nextLabel={t('next')} className={btn}/>
   <button className={btn} disabled={busy} onClick={()=>void act('finalise')}>{t('finalise')}</button>
   <p className="text-sm text-muted">{t('finaliseHelp')}</p>
  </>}
 </section>;
}
