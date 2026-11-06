"use client";
import { useState } from 'react';
import { SelfServiceError, type SelfServicePort } from './contracts';
import type { SelfServiceStrings } from './strings';
export function Recovery({ port, owner, strings:s }: { port: SelfServicePort; owner:boolean; strings:SelfServiceStrings }) {
 const [confirm,setConfirm]=useState(''),[accept,setAccept]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false);
 async function run(restore:boolean) {
  if(busy||uncertain)return;
  setBusy(true);setMessage('');
  try { if(restore){await port.accept(accept);setMessage(s.accepted);setAccept('');}
   else {const result=await port.resume(confirm);setMessage(s.recovered.replace('{n}',String(result.stillHeld)));setConfirm('');}
  }catch(e){setMessage(e instanceof SelfServiceError?s[e.kind]:s.unknown);if(!(e instanceof SelfServiceError)||e.kind==='unknown')setUncertain(true);}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded border border-line p-4" aria-label={s.recovery} data-testid="selfservice-recovery" aria-busy={busy}>
  <h2 className="text-xl font-semibold">{s.recovery}</h2><p>{s.holds}</p>
  <form onSubmit={e=>{e.preventDefault();void run(false);}} className="space-y-2"><label className="block">{s.typed}: <bdi>RESUME ASSESS</bdi><input className="block min-h-11 w-full rounded border border-line px-3" dir="ltr" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="off"/></label><button className="min-h-11 rounded border border-line px-3" disabled={busy||uncertain||confirm!=='RESUME ASSESS'}>{s.resumeAction}</button></form>
  {owner&&<form onSubmit={e=>{e.preventDefault();void run(true);}} className="space-y-2"><label className="block">{s.acceptAction} — {s.typed}: <bdi>ACCEPT RESTORED DATABASE</bdi><input className="block min-h-11 w-full rounded border border-line px-3" dir="ltr" value={accept} onChange={e=>setAccept(e.target.value)} autoComplete="off"/></label><button className="min-h-11 rounded border border-line px-3" disabled={busy||uncertain||accept!=='ACCEPT RESTORED DATABASE'}>{s.acceptAction}</button></form>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
