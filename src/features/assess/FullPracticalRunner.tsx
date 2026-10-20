"use client";
import {useEffect,useReducer,useState} from "react";
import {useTranslations,useLocale} from "next-intl";
import type {AttemptPort} from "./attempt-controller";
import type {PracticalSession} from "./practical-data";
import {PracticalRunner} from "./practical-state";
import {PracticalControls} from "./PracticalControls";
import {PracticalScene} from "./PracticalScene";
const button="min-h-11 rounded border border-line px-4 py-2 text-sm disabled:opacity-50";
export function FullPracticalRunner({port,attempt,leave}:{port:AttemptPort<PracticalSession>;attempt:string;leave:()=>void}) {
  const t=useTranslations("assess"),locale=useLocale();const [,render]=useReducer(n=>n+1,0);
  const [c]=useState(()=>new PracticalRunner(port,render));
  useEffect(()=>{void c.open(attempt);return ()=>c.dispose();},[c,attempt]);
  const s=c.session;
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(c&&(c.dirty||c.pending)){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",warn);return ()=>window.removeEventListener("beforeunload",warn);},[c]);
  useEffect(()=>{
    if(!s||s.ack.state!=="active"||!s.ack.deadline)return;
    // Server time anchors a one-shot refresh; device time never authorizes a save or exposure.
    const timer=setTimeout(()=>{void c?.recover();},Math.max(0,Date.parse(s.ack.deadline)-Date.parse(s.ack.serverTime))+100);
    return ()=>clearTimeout(timer);
  },[c,s]);
  const [confirm,setConfirm]=useState(false);

  const issue=c.issue;
  return <section className="mt-6 space-y-5" data-testid="assess-practical-runner">
    {issue&&<div role="alert"><p>{t(issue==="conflict"?"conflict":"interrupted")}</p><button className={button} disabled={c.busy} onClick={()=>void (s?c.recover():c.open(attempt))}>{t("reconcile")}</button></div>}
    {!s&&!issue&&<p role="status">{t("loading")}</p>}
    {s&&<>
      <p role="status">{c.busy?t("saving"):c.pending||issue?t("unconfirmed"):c.dirty?t("pending"):t("saved")}</p>
      {s.ack.state!=="active"?<p role="status">{t("closed")}</p>:<>
        <h2 className="text-xl font-semibold" dir="ltr" lang="en">{s.assessment!.name}</h2>
        <p>{t("deadline")} <time dir="ltr">{s.ack.deadline}</time></p>
        <p className="text-sm">{t("serverRule")}</p>
        <nav aria-label={t("questions")} className="flex flex-wrap gap-2">
          {s.assessment!.items.map((i,n)=><button key={i.ref.id} className={n===c.index?`${button} font-bold ring-2 ring-current`:button} aria-current={n===c.index?"step":undefined} disabled={c.busy||!!issue||!!c.pending} onClick={()=>{setConfirm(false);void c.navigate(n);}}>{n+1}</button>)}
        </nav>
        {(()=>{const item=s.assessment!.items[c.index]!,locked=s.ack.lockedItemIds.includes(item.ref.id),answer=c.drafts[item.ref.id];
          return <article className="space-y-4 rounded border border-line bg-panel p-4" dir="ltr" lang="en" aria-labelledby="assess-prompt">
            <h3 id="assess-prompt" className="font-semibold">{item.prompt}</h3>
            <PracticalScene view={s.views![item.ref.id]!} values={answer?.type==="full-practical"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending} onChange={values=>c.edit(item.ref.id,{type:"full-practical",values})}/>
            <PracticalControls view={s.views![item.ref.id]!} values={answer?.type==="full-practical"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending} onChange={values=>c.edit(item.ref.id,{type:"full-practical",values})}/>
            <p lang={locale} dir={locale==="ar"?"rtl":"ltr"}>{locked?t("locked"):t("oneExposure")}</p>
            <button lang={locale} dir={locale==="ar"?"rtl":"ltr"} className={button} disabled={locked||c.busy||!!issue||!!c.pending} onClick={()=>void c.expose()}>{t("expose")}</button>
          </article>;})()}
        <button className={button} disabled={c.busy||!!issue||!!c.pending} onClick={()=>{void c.flush().then(ok=>{if(ok)setConfirm(true);});}}>{t("submit")}</button>
        {confirm&&<section aria-label={t("confirmTitle")} className="space-y-3 rounded border border-line p-4">
          <h3 className="font-semibold">{t("confirmTitle")}</h3><p role="status">{t("unresolved",{count:c.unresolved})}</p>
          <button className={button} disabled={c.busy||!!issue||!!c.pending} onClick={()=>{setConfirm(false);void c.submit();}}>{t("confirmSubmit")}</button>
          <button className={button} onClick={()=>setConfirm(false)}>{t("back")}</button>
        </section>}
      </>}
    </>}
    <button className={button} disabled={c.busy||!!c.pending||c.dirty} onClick={leave}>{t("list")}</button>
  </section>;
}
