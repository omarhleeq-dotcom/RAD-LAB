"use client";
import { useEffect,useReducer,useRef,useState,useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useSessionAccount } from "@/features/pilot/SessionGate";
import { getPilotClient } from "@/features/pilot/client";
import { assignedPage,isUuid,runnerPort,type Listing,type RunnerPort } from "./runner-data";
import { MixedRunner } from "./runner-state";
import { practicalAssignedPage,practicalPort } from "./practical-data";
import { FullPracticalRunner } from "./FullPracticalRunner";
import { PartControls } from "./PartControls";
import {HistoryPanel} from "./HistoryPanel";
import {AssessConsent} from "./AssessConsent";
const button="min-h-11 rounded border border-line px-4 py-2 text-sm disabled:opacity-50";
function Runner({port,attempt,leave}:{port:RunnerPort;attempt:string;leave:()=>void}) {
  const t=useTranslations("assess");const [,render]=useReducer(n=>n+1,0);
  const [c]=useState(()=>new MixedRunner(port,render));
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
  return <section className="mt-6 space-y-5" data-testid="assess-runner">
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
            {item.type==="single-choice"?<fieldset disabled={c.busy||!!issue||!!c.pending} className="space-y-3"><legend className="sr-only">Choose one answer</legend>
              {item.options.map(o=><label key={o.id} className="flex min-h-11 items-center gap-3"><input className="size-5 shrink-0" type="radio" name="assess-choice" checked={answer?.type==="single-choice"&&answer.optionId===o.id} onChange={()=>c.edit(item.ref.id,{type:"single-choice",optionId:o.id})}/>{o.text}</label>)}
              <button className={button} onClick={()=>c.edit(item.ref.id,{type:"single-choice",optionId:null})}>Clear answer</button>
            </fieldset>:<>
              <PartControls item={item} view={s.views![item.ref.id]!} values={answer?.type==="simulator-part"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending} onChange={values=>c.edit(item.ref.id,{type:"simulator-part",values})}/>
              <p>{locked?"Exposure recorded. This item is locked.":"One exposure only. Settings lock when the server records it."}</p>
              <button className={button} disabled={locked||c.busy||!!issue||!!c.pending} onClick={()=>void c.expose()}>Expose once</button>
            </>}
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
function Assigned({practical}:{practical:boolean}) {
  const listPage=practical?practicalAssignedPage:assignedPage;
  const t=useTranslations("assess");const [page,setPage]=useState<Listing|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
  const [attempt,setAttempt]=useState<string|null>(null),[port,setPort]=useState<RunnerPort|null>(null);
  const startOperation=useRef<{assignment:string;operation:string}|null>(null);
  const load=async(after:string|null=null)=>{setBusy(true);try{const client=await getPilotClient();if(!client)throw new Error();setPage(await listPage(client,after));setPort(runnerPort(client));setError(false);}catch{setError(true);}finally{setBusy(false);}};
  useEffect(()=>{let cancelled=false;void getPilotClient()?.then(async client=>{
    try{const p=runnerPort(client),list=await listPage(client,null);if(cancelled)return;setPort(p);setPage(list);const id=new URLSearchParams(location.search).get("attempt");if(isUuid(id))setAttempt(id);}catch{if(!cancelled)setError(true);}
  });return ()=>{cancelled=true;};},[listPage]);
  async function start(assignment:string){
    if(!port||busy)return;setBusy(true);setError(false);
    if(startOperation.current?.assignment!==assignment)startOperation.current={assignment,operation:crypto.randomUUID()};
    try{const id=await port.start(assignment,startOperation.current.operation);setAttempt(id);history.replaceState(null,"",`${location.pathname}?attempt=${id}${practical?"&track=full-practical":""}`);startOperation.current=null;}
    catch{setError(true);}finally{setBusy(false);}
  }
  if(attempt&&port&&practical)return <PracticalMount attempt={attempt} leave={()=>{setAttempt(null);history.replaceState(null,"",`${location.pathname}?track=full-practical`);void load();}}/>;
  if(attempt&&port)return <Runner key={attempt} port={port} attempt={attempt} leave={()=>{setAttempt(null);history.replaceState(null,"",location.pathname);void load();}}/>;
  return <section className="mt-6 space-y-4" data-testid="assess-assigned">
    <p>{t("intro")}</p>
    {error&&<p role="alert">{t("unavailable")}</p>}
    <button className={button} disabled={busy} onClick={()=>void load()}>{t("refresh")}</button>
    {!page&&!error&&<p role="status">{t("loading")}</p>}
    {page&&!page.rows.length&&<p>{t("empty")}</p>}
    <ul className="space-y-3">{page?.rows.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line p-3"><span lang="en" dir="ltr">{row.name} — {row.version}</span><button className={button} disabled={busy||!port} onClick={()=>void start(row.id)}>{t("start")}</button></li>)}</ul>
    {page?.next&&<button className={button} disabled={busy} onClick={()=>void load(page.next)}>{t("next")}</button>}
  </section>;
}
function PracticalMount({attempt,leave}:{attempt:string;leave:()=>void}){
  const [port,setPort]=useState<ReturnType<typeof practicalPort>|null>(null);
  useEffect(()=>{let cancelled=false;void getPilotClient()?.then(client=>{if(!cancelled)setPort(practicalPort(client));});return ()=>{cancelled=true;};},[]);
  return port?<FullPracticalRunner port={port} attempt={attempt} leave={leave}/>:null;
}
const subscribeTrack=(changed:()=>void)=>{window.addEventListener("popstate",changed);return ()=>window.removeEventListener("popstate",changed);};
function TrackSelection(){
  const t=useTranslations("assess"),practical=useSyncExternalStore(subscribeTrack,()=>new URLSearchParams(location.search).get("track")==="full-practical",()=>null);
  // Changing track remounts its isolated runner. Native navigation protects unacknowledged drafts.
  return <><nav className="mt-5 flex flex-wrap gap-3" aria-label={t("tracks")}><a className={button} aria-current={!practical?"page":undefined} href="?track=mixed">{t("mixed")}</a><a className={button} aria-current={practical?"page":undefined} href="?track=full-practical">{t("practical")}</a></nav>{practical!==null&&<Assigned key={String(practical)} practical={practical}/>}</>;
}
export function AssessPanel(){const {state}=useSessionAccount();const t=useTranslations("assess");return state.kind==="signedIn"&&state.profile.status==="approved"?<AssessConsent key={state.userId}><nav className="mt-5 flex flex-wrap gap-3" aria-label={t("sections")}><a className={button} href="?track=mixed">{t("tracks")}</a><a className={button} href="?history=1">{t("history")}</a></nav><AssessView/></AssessConsent>:<p className="mt-6">{t("approved")}</p>;}

function AssessView(){const history=useSyncExternalStore(subscribeTrack,()=>new URLSearchParams(location.search).get("history")==="1",()=>null);return history===null?null:history?<HistoryPanel/>:<TrackSelection/>;}
