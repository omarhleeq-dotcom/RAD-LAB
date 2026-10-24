'use client';
import {useEffect,useState} from 'react';
import {useTranslations} from 'next-intl';
import {C2_FIRST,c2Button as btn,c2Field,safely,type C2Adapter,type Directory,type DirectoryPosition,type Deletion,type Outcome,type Page,type Person} from './c2-ui';
/** Prepared UI only: the live OwnerPanel does not import this component. */
export function OwnerDeletion({adapter,ownerId,onChanged}:{adapter:C2Adapter;ownerId:string|null;onChanged?:()=>void}) {
 const t=useTranslations('c2');
 const [search,setSearch]=useState(''),[draft,setDraft]=useState(''),[status,setStatus]=useState('');
 const [position,setPosition]=useState<DirectoryPosition>(C2_FIRST),[after,setAfter]=useState<string|null>(null),[revision,setRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<{key:string;directory:Outcome<Directory>;pending:Outcome<Page<Deletion>>}|null>(null);
 const [confirm,setConfirm]=useState<Person|null>(null),[agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const key=JSON.stringify([search,status,position,after,revision,ownerId]);
 useEffect(()=>{if(!ownerId)return;let active=true;
  void Promise.all([safely(()=>adapter.directory(search,status,position)),safely(()=>adapter.deletions(after))]).then(([directory,pending])=>{if(active)setSnapshot({key,directory,pending});});
  return()=>{active=false;};
 },[adapter,ownerId,search,status,position,after,revision,key]);
 if(!ownerId)return <p role="alert">{t('ownerOnly')}</p>;
 const data=snapshot?.key===key?snapshot:null;
 const unavailable=data&&(data.directory.kind==='unavailable'||data.pending.kind==='unavailable');
 const error=data&&(data.directory.kind==='error'||data.pending.kind==='error');
 const directory=data?.directory.kind==='ready'?data.directory.data:null,pending=data?.pending.kind==='ready'?data.pending.data:null;
 async function act(action:'deactivate'|'restore'|'finalise',id?:string) {
  if(busy)return;setBusy(true);setNotice('');
  const result=await safely(()=>adapter.deletion(action,id));
  if(result.kind==='ready'){setNotice('changed');setConfirm(null);setAgreed(false);setPosition(C2_FIRST);setAfter(null);setRevision(v=>v+1);onChanged?.();}
  else setNotice(result.kind==='unavailable'?'unavailable':'error');
  setBusy(false);
 }
 return <section aria-labelledby="c2-deletion-title" className="min-w-0 space-y-4 rounded-lg border border-line bg-panel p-4" data-testid="c2-deletion">
  <h2 id="c2-deletion-title" className="text-xl font-semibold">{t('deletionTitle')}</h2>
  {(!data||unavailable||error)&&<p role={error?'alert':'status'}>{t(!data?'loading':unavailable?'unavailable':'error')}</p>}
  {notice&&<p role={notice==='error'?'alert':'status'}>{t(notice)}</p>}
  {!unavailable&&!error&&directory&&pending&&<>
   <form className="flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();setSearch(draft.trim());setPosition(C2_FIRST);setConfirm(null);setAgreed(false);}}>
    <label className="min-w-0 flex-1">{t('search')}<input maxLength={100} className={c2Field} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
    <label>{t('status')}<select className={c2Field} value={status} onChange={e=>{setStatus(e.target.value);setPosition(C2_FIRST);setConfirm(null);setAgreed(false);}}><option value="">{t('all')}</option>{(['pending','approved','suspended'] as const).map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>
    <button className={btn} disabled={busy}>{t('searchAction')}</button>
   </form>
   <p className="text-sm text-muted">{(['pending','approved','suspended'] as const).map(s=>`${t(s)}: ${directory.counts[s]}`).join(' · ')}</p>
   <ul className="divide-y divide-line">{directory.rows.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><bdi className="break-all font-mono">{p.code}</bdi><span>{t(p.status)}</span><button className={btn} disabled={busy||p.id===ownerId} onClick={()=>{setConfirm(p);setAgreed(false);setNotice('');}}>{t('deactivate')}</button></li>)}</ul>
   {directory.rows.length===0&&<p>{t('empty')}</p>}
   <div className="flex gap-2"><button className={btn} disabled={busy} onClick={()=>setPosition(C2_FIRST)}>{t('first')}</button><button className={btn} disabled={busy||!directory.next} onClick={()=>{setConfirm(null);setPosition(directory.next!);}}>{t('next')}</button></div>
   {confirm&&<section aria-labelledby="c2-confirm-title" className="space-y-3 rounded-md border border-signal p-3" data-testid="c2-confirm">
    <h3 id="c2-confirm-title" className="font-semibold">{t('confirmTitle',{code:confirm.code})}</h3>
    <p>{t('permanent')}</p><p>{t('backups')}</p>
    <label className="flex items-start gap-2"><input type="checkbox" checked={agreed} disabled={busy} onChange={e=>setAgreed(e.target.checked)} className="mt-1 size-5 shrink-0"/>{t('understand')}</label>
    <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy||!agreed} onClick={()=>void act('deactivate',confirm.id)}>{t('confirmDeactivate')}</button><button className={btn} disabled={busy} onClick={()=>setConfirm(null)}>{t('cancel')}</button></div>
   </section>}
   <h3 className="text-lg font-semibold">{t('pendingDeletion')}</h3>
   <p className="text-sm text-muted">{t('restoreHelp')}</p>
   <ul className="divide-y divide-line">{pending.rows.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><bdi className="break-all font-mono">{p.code}</bdi><span>{t('days',{count:p.days})}</span><button className={btn} disabled={busy||p.days===0||p.id===ownerId} onClick={()=>void act('restore',p.id)}>{t('restore')}</button></li>)}</ul>
   {pending.rows.length===0&&<p>{t('empty')}</p>}
   <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy} onClick={()=>setAfter(null)}>{t('first')}</button><button className={btn} disabled={busy||!pending.next} onClick={()=>setAfter(pending.next)}>{t('next')}</button><button className={btn} disabled={busy} onClick={()=>void act('finalise')}>{t('finalise')}</button></div>
   <p className="text-sm text-muted">{t('finaliseHelp')}</p>
  </>}
 </section>;
}
