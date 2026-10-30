"use client";
import {useEffect,useReducer,useState,type ReactNode} from "react";
import {useTranslations} from "next-intl";
import type {AttemptController,RunnerSession} from "./attempt-controller";
export const runnerButton="min-h-11 rounded border border-line px-4 py-2 text-sm disabled:opacity-50";
const button=runnerButton;
export function useRunnerController<C extends AttemptController<RunnerSession>>(create:(changed:()=>void)=>C,attempt:string):C {
  const [,render]=useReducer(n=>n+1,0);
  const [c]=useState(()=>create(render));
  useEffect(()=>{void c.open(attempt);return ()=>c.dispose();},[c,attempt]);
  return c;
}
/** Shared view lifecycle only. Controllers, ports, answers and track-specific presentation stay independent. */
export function RunnerView<S extends RunnerSession>({controller:c,attempt,leave,testId,children}:{controller:AttemptController<S>;attempt:string;leave:()=>void;testId:string;children:ReactNode}) {
  const t=useTranslations("assess"),s=c.session,issue=c.issue;
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(c&&(c.dirty||c.pending)){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",warn);return ()=>window.removeEventListener("beforeunload",warn);},[c]);
  useEffect(()=>{
    if(!s||s.ack.state!=="active"||!s.ack.deadline)return;
    // Server time anchors a one-shot refresh; device time never authorizes a save or exposure.
    const timer=setTimeout(()=>{void c?.recover();},Math.max(0,Date.parse(s.ack.deadline)-Date.parse(s.ack.serverTime))+100);
    return ()=>clearTimeout(timer);
  },[c,s]);
  const [confirm,setConfirm]=useState(false);

  return <section className="mt-6 space-y-5" data-testid={testId}>
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
        {children}
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
