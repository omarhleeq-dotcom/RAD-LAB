"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { SelfServiceError, type Eligibility, type Metadata, type Page, type Permission, type Recommendation, type SelfServicePort, type Status } from './contracts';
import { StatusBoard, SupervisorSchedule } from './SelfServiceViews';
import { ammanLocalToUtc, formatAmman, utcToAmmanLocal } from './window-time';
import type { SelfServiceStrings } from './strings';
const button='min-h-11 rounded border border-line px-3 py-2 disabled:opacity-50';
type Props={port:SelfServicePort;owner:boolean;strings:SelfServiceStrings;locale:'en'|'ar'};
export function Management({port,owner,strings:s,locale}:Props) {
 const [assignments,setAssignments]=useState<Page<Metadata>>(),[versions,setVersions]=useState<Page<Metadata>>(),[permissions,setPermissions]=useState<Page<Permission>>();
 const [allowed,setAllowed]=useState(false),[busy,setBusy]=useState(true),[message,setMessage]=useState(''),[blocked,setBlocked]=useState(false);
 const [selected,setSelected]=useState<Metadata>(),[version,setVersion]=useState<Metadata>(),[pool,setPool]=useState<Recommendation>(),[versionPool,setVersionPool]=useState<Recommendation>();
 const [status,setStatus]=useState<Status>(),[eligibility,setEligibility]=useState<Page<Eligibility>>();
 const lock=useRef(false),operation=useRef<string|null>(null),live=useRef(true);
 const fail=useCallback((e:unknown)=>{if(live.current){setMessage(e instanceof SelfServiceError?s[e.kind]:s.unknown);setBlocked(true);setAllowed(false);}},[s]);
 const refresh=useCallback(async()=> {
  const [a,v,c,p]=await Promise.all([port.metadata('assignments'),port.metadata('versions'),port.capability(),owner?port.permissions():Promise.resolve(undefined)]);
  if(live.current){setAssignments(a);setVersions(v);setAllowed(owner||c);setPermissions(p);setSelected(undefined);setVersion(undefined);setPool(undefined);setVersionPool(undefined);setStatus(undefined);setEligibility(undefined);setBlocked(false);}
 },[port,owner]);
 useEffect(()=>{live.current=true;void refresh().catch(fail).finally(()=>{if(live.current)setBusy(false);});return()=>{live.current=false;};},[refresh,fail]); // account-bound port is discarded on identity/visibility changes
 async function run(action:()=>Promise<unknown>,reload=false) {
  if(lock.current)return;lock.current=true;setBusy(true);setMessage('');
  try{await action();if(reload)await refresh();if(live.current)setMessage(s.saved);}
  catch(e){fail(e);}finally{lock.current=false;if(live.current)setBusy(false);}
 }
 async function choose(a:Metadata) {
  setSelected(undefined);setPool(undefined);setStatus(undefined);setEligibility(undefined);
  await run(async()=>{const [st,el,p]=await Promise.all([port.status(a.id),port.eligibility(a.id),port.recommendation(a.versionId!)]);if(live.current){setSelected(a);setStatus(st);setEligibility(el);setPool(p);}});
 }
 const recommendation=(p:Recommendation)=>s.pool.replace('{x}',String(p.selected)).replace('{y}',String(p.available));
 const pager=(next:string|null|undefined,load:(after:string|null)=>Promise<unknown>)=><div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={()=>void run(()=>load(null))}>{s.first}</button>{next&&<button className={button} disabled={busy} onClick={()=>void run(()=>load(next))}>{s.next}</button>}</div>;
 const editable=!!selected&&!!status&&!status.closed&&(!status.closesAt||Date.parse(status.closesAt)>Date.parse(status.now));
 const schedule=selected&&status&&(editable?<SupervisorSchedule key={`${selected.id}:${selected.revision}`} adapter={{available:!blocked,schedule:async(o,c)=>{await port.schedule(selected.id,selected.revision!,selected.opensAt && o===ammanLocalToUtc(utcToAmmanLocal(selected.opensAt))?selected.opensAt:o,selected.closesAt && c===ammanLocalToUtc(utcToAmmanLocal(selected.closesAt))?selected.closesAt:c);await refresh();}}} strings={s} locale={locale} durationSeconds={selected.durationSeconds} nowMs={Date.parse(status.now)} clock={()=>Date.parse(status.now)} initial={selected.opensAt&&selected.closesAt?{opensLocal:utcToAmmanLocal(selected.opensAt),closesLocal:utcToAmmanLocal(selected.closesAt)}:undefined}/>:<p role="status">{s.window}</p>);
 return <section className="min-w-0 space-y-5 rounded border border-line p-4" aria-label={s.manage} aria-busy={busy} data-testid="selfservice-management">
  <h2 className="text-xl font-semibold">{s.manage}</h2><p>{s.auditHint}</p>
  {busy&&<p role="status">{s.loading}</p>}{message&&<p role={blocked?'alert':'status'}>{message}</p>}
  <button className={button} disabled={busy} onClick={()=>void run(refresh)}>{s.refresh}</button>
  {owner&&<section className="space-y-3" aria-label={s.permissions}><h3 className="font-semibold">{s.permissions}</h3><p>{s.permissionHint}</p>
   {permissions?.rows.length===0&&<p>{s.emptyManage}</p>}
   <ul className="space-y-2">{permissions?.rows.map(p=><li key={p.user_id} className="flex flex-wrap items-center gap-3"><bdi className="break-all">{p.user_id}</bdi><button className={button} disabled={busy||blocked} aria-pressed={p.all_students} onClick={()=>void run(()=>port.permission(p.user_id,!p.all_students),true)}>{p.all_students?s.revoke:s.allow}</button></li>)}</ul>
   {pager(permissions?.next,async after=>{setPermissions(await port.permissions(after));})}
  </section>}
  <section className="space-y-3" aria-label={s.quiz}><h3 className="font-semibold">{s.quiz}</h3>
   {!allowed&&<p role="status">{s.denied}</p>}
   {allowed&&<><h4>{s.versions}</h4>{versions?.rows.length===0&&<p>{s.emptyManage}</p>}
    <ul className="space-y-2">{versions?.rows.map(v=><li key={v.id}><button className={button} aria-pressed={version?.id===v.id} disabled={busy||blocked} onClick={()=>void run(async()=>{const p=await port.recommendation(v.id);if(live.current){setVersion(v);setVersionPool(p);operation.current=crypto.randomUUID();}})}><bdi>{v.name}</bdi></button></li>)}</ul>
    {pager(versions?.next,async after=>{setVersion(undefined);setVersions(await port.metadata('versions',after));})}
    {version&&versionPool&&<><p>{recommendation(versionPool)}</p><SupervisorSchedule key={version.id} strings={{...s,title:s.publish,schedule:s.publish}} locale={locale} durationSeconds={version.durationSeconds} nowMs={Date.parse(versions?.serverTime??'')} clock={()=>Date.now()} adapter={{available:allowed&&!blocked,schedule:async(o,c)=>{if(!operation.current)throw new SelfServiceError('invalid');await port.publish(version.id,operation.current,o,c);await refresh();operation.current=null;}}}/></>}
   </>}
  </section>
  <section className="space-y-3" aria-label={s.manage}><h3 className="font-semibold">{s.manage}</h3>
   {assignments?.rows.length===0&&<p>{s.emptyManage}</p>}
   <ul className="space-y-2">{assignments?.rows.map(a=><li key={a.id}><button className={button} aria-pressed={selected?.id===a.id} disabled={busy||blocked} onClick={()=>void choose(a)}><bdi>{a.name}</bdi> — {a.audience==='all-students'?s.quiz:s.group}</button>{a.closesAt&&<p><bdi>{formatAmman(a.closesAt,locale)}</bdi></p>}</li>)}</ul>
   {pager(assignments?.next,async after=>{setSelected(undefined);setAssignments(await port.metadata('assignments',after));})}
  </section>
  {selected&&status&&<div className="space-y-4" key={selected.id}>
   <h3 className="font-semibold"><bdi>{selected.name}</bdi></h3>{pool&&<p>{recommendation(pool)}</p>}
   <StatusBoard counts={status.counts} strings={s}/><p><bdi>{formatAmman(status.now,locale)}</bdi></p>{schedule}
   <button className={button} disabled={busy||blocked||!editable} onClick={()=>{if(window.confirm(s.confirmClose))void run(()=>port.close(selected.id,selected.revision!,selected.audience==='all-students'),true);}}>{s.close}</button>
   <ul className="space-y-3">{status.rows.map(row=><li key={row.userId} className="min-w-0 rounded border border-line p-3"><bdi className="break-all">{row.userId}</bdi>
    <form className="space-y-2" onSubmit={e=>{e.preventDefault();const seconds=Number(new FormData(e.currentTarget).get('seconds'));void run(()=>port.extra(selected.id,row.userId,seconds),true);}}><label className="block">{s.extra}<input name="seconds" className="block min-h-11 w-full rounded border border-line px-3" type="number" min={0} max={86400} step={1} required defaultValue={0} dir="ltr"/></label><button className={button} disabled={busy||blocked||!editable}>{s.saveExtra}</button></form>
   </li>)}</ul>
   {pager(status.rows.length===50?status.rows.at(-1)!.userId:null,async after=>{setStatus(await port.status(selected.id,after));})}
   <h4 className="font-semibold">{s.attempts}</h4><p>{s.holds}</p>
   <ul className="space-y-3">{eligibility?.rows.map(row=><li key={row.sessionId} className="min-w-0 rounded border border-line p-3"><bdi className="break-all">{row.studentId}</bdi><p>{s[row.reason as keyof SelfServiceStrings]}</p>{row.eligible&&<button className={button} disabled={busy||blocked} onClick={()=>void run(()=>port.grant(selected.id,row.sessionId),true)}>{s.grant}</button>}</li>)}</ul>
   {pager(eligibility?.next,async after=>{setEligibility(await port.eligibility(selected.id,after));})}
  </div>}
 </section>;
}
