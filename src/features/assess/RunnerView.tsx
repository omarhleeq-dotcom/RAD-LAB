"use client";
import {createContext,useContext,useEffect,useId,useReducer,useRef,useState,type ReactNode} from "react";
import {useLocale,useTranslations} from "next-intl";
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
  const [setupProgress,setSetupProgress]=useState<Record<string,SetupProgress>>({});

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
        <SetupContext value={{progress:setupProgress,update:(id,value)=>setSetupProgress(previous=>({...previous,[id]:value}))}}>{children}</SetupContext>
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

// Group tools by their public setting roots, never by an exam/check id or a scoring rule.
// Unknown additive tools remain visible in positioning until their presentation group is declared here.
const SETUP_GROUPS=[
  {id:"positioning",roots:[]},
  {id:"centring",roots:["centralRay","collimation","sideMarker","markerPosition"]},
  {id:"patient",roots:["breathing","motionInstruction"]},
  {id:"technique",roots:["kvp","mas","exposureMode","aecChambers"]},
] as const;
export function setupSteps(paths:readonly string[]) {
  const group=(path:string)=>SETUP_GROUPS.find(g=>(g.roots as readonly string[]).includes(path.split(".")[0]!))?.id??"positioning";
  return SETUP_GROUPS.map(g=>({id:g.id,paths:paths.filter(path=>group(path)===g.id)})).filter(g=>g.paths.length>0);
}
interface SetupProgress {active:number;furthest:number}
const SetupContext=createContext<{progress:Record<string,SetupProgress>;update:(id:string,value:SetupProgress)=>void}|null>(null);
/** Ephemeral navigation only. Values, save eligibility, time and the exposure lock remain controller-owned. */
export function AssessSetup({question,paths,locked,disabled,children}:{question:string;paths:readonly string[];locked:boolean;disabled:boolean;children:(step:{paths:readonly string[];id:string;ready:boolean})=>ReactNode}) {
  const context=useContext(SetupContext),locale=useLocale(),t=useTranslations("workspace"),a=useTranslations("assess");
  const uid=useId(),tabs=useRef<(HTMLButtonElement|null)[]>([]),steps=setupSteps(paths);
  if(!context)throw new Error("Assess setup requires its runner view");
  const saved=Object.hasOwn(context.progress,question)?context.progress[question]!:{active:0,furthest:0};
  const active=Math.min(saved.active,steps.length-1),furthest=locked?steps.length-1:Math.min(saved.furthest,steps.length-1);
  function go(index:number,advance=false){
    if(disabled||index<0||index>=steps.length||index>(advance?active+1:furthest))return;
    context!.update(question,{active:index,furthest:Math.max(furthest,index)});
    requestAnimationFrame(()=>tabs.current[index]?.focus());
  }
  return <div className="space-y-4" lang={locale} dir={locale==="ar"?"rtl":"ltr"}>
    <div role="tablist" aria-label={t("tabsLabel")} className="flex flex-wrap gap-2">
      {steps.map((step,n)=><button key={step.id} ref={node=>{tabs.current[n]=node;}} id={`${uid}-tab-${n}`} role="tab" aria-controls={`${uid}-panel`} aria-selected={n===active} tabIndex={n===active?0:-1} className={n===active?`${button} font-bold ring-2 ring-current`:button} disabled={disabled||n>furthest} onClick={()=>go(n)} onKeyDown={e=>{
        const delta=e.key==="ArrowRight"?(locale==="ar"?-1:1):e.key==="ArrowLeft"?(locale==="ar"?1:-1):0;
        const target=e.key==="Home"?0:e.key==="End"?furthest:delta?Math.max(0,Math.min(furthest,active+delta)):null;
        if(target!==null){e.preventDefault();go(target);}
      }}>{t(`tabs.${step.id}`)}</button>)}
    </div>
    <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${active}`} tabIndex={0} className="space-y-4">
      {children({...steps[active]!,ready:active===steps.length-1})}
    </div>
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={disabled||active===0} onClick={()=>go(active-1)}>{a("back")}</button>
      <button className={button} disabled={disabled||active===steps.length-1} onClick={()=>go(active+1,true)}>{a("next")}</button>
    </div>
  </div>;
}
