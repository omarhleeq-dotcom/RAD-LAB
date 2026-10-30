"use client";
import { useEffect,useRef,useState,useSyncExternalStore } from "react";
import { useLocale,useTranslations } from "next-intl";
import { useSessionAccount } from "@/features/pilot/SessionGate";
import { getPilotClient } from "@/features/pilot/client";
import { dirFor } from "@/i18n/routing";
import { assignedPage,isUuid,runnerPort,type Listing,type RunnerPort } from "./runner-data";
import { MixedRunner } from "./runner-state";
import { practicalAssignedPage,practicalPort } from "./practical-data";
import { FullPracticalRunner } from "./FullPracticalRunner";
import { PartControls } from "./PartControls";
import {Rad062Entry} from "./Rad062Entry";
import {HistoryPanel} from "./HistoryPanel";
import {AssessConsent} from "./AssessConsent";
import {AssessSetup,RunnerView,useRunnerController,runnerButton as button} from "./RunnerView";
function Runner({port,attempt,leave}:{port:RunnerPort;attempt:string;leave:()=>void}) {
  const t=useTranslations("assess"),locale=useLocale();
  const c=useRunnerController(changed=>new MixedRunner(port,changed),attempt),s=c.session,issue=c.issue;
  const dir=dirFor(locale);
  return <RunnerView controller={c} attempt={attempt} leave={leave} testId="assess-runner">
    {s?.ack.state==="active"&&<>
        {(()=>{const item=s.assessment!.items[c.index]!,locked=s.ack.lockedItemIds.includes(item.ref.id),answer=c.drafts[item.ref.id];
          return <article className="space-y-4 rounded border border-line bg-panel p-4" dir="ltr" lang="en" aria-labelledby="assess-prompt">
            <h3 id="assess-prompt" className="font-semibold">{item.prompt}</h3>
            {item.type==="single-choice"?<fieldset disabled={c.busy||!!issue||!!c.pending} className="space-y-3"><legend className="sr-only" lang={locale} dir={dir}>{t("chooseOne")}</legend>
              {item.options.map(o=><label key={o.id} className="flex min-h-11 items-center gap-3"><input className="size-5 shrink-0" type="radio" name="assess-choice" checked={answer?.type==="single-choice"&&answer.optionId===o.id} onChange={()=>c.edit(item.ref.id,{type:"single-choice",optionId:o.id})}/>{o.text}</label>)}
              <button lang={locale} dir={dir} className={button} onClick={()=>c.edit(item.ref.id,{type:"single-choice",optionId:null})}>{t("clearAnswer")}</button>
            </fieldset>:<AssessSetup question={item.ref.id} paths={item.presentation.controls} locked={locked} disabled={c.busy||!!issue||!!c.pending}>{step=><>
              <PartControls item={{...item,presentation:{...item.presentation,controls:[...step.paths]}}} view={s.views![item.ref.id]!} values={answer?.type==="simulator-part"?answer.values:s.views![item.ref.id]!.initial} disabled={locked||c.busy||!!issue||!!c.pending} onChange={values=>c.edit(item.ref.id,{type:"simulator-part",values})}/>
              <p lang={locale} dir={dir}>{locked?t("locked"):t("oneExposure")}</p>
              <button className={button} disabled={!step.ready||locked||c.busy||!!issue||!!c.pending} lang={locale} dir={dir} onClick={()=>void c.expose()}>{t("expose")}</button>
            </>}</AssessSetup>}
          </article>;})()}
    </>}
  </RunnerView>;
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
  return <AssessConsent><section className="mt-6 space-y-4" data-testid="assess-assigned">
    <p>{t("intro")}</p>
    {error&&<p role="alert">{t("unavailable")}</p>}
    <button className={button} disabled={busy} onClick={()=>void load()}>{t("refresh")}</button>
    {!page&&!error&&<p role="status">{t("loading")}</p>}
    {page&&!page.rows.length&&<p>{t("empty")}</p>}
    <ul className="space-y-3">{page?.rows.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line p-3"><span lang="en" dir="ltr">{row.name} — {row.version}</span><button className={button} disabled={busy||!port} onClick={()=>void start(row.id)}>{t("start")}</button></li>)}</ul>
    {page?.next&&<button className={button} disabled={busy} onClick={()=>void load(page.next)}>{t("next")}</button>}
  </section></AssessConsent>;
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
export function AssessPanel(){const {state}=useSessionAccount();const t=useTranslations("assess");return state.kind==="signedIn"&&state.profile.status==="approved"?<div key={state.userId}><nav className="mt-5 flex flex-wrap gap-3" aria-label={t("sections")}><a className={button} href="?track=mixed">{t("tracks")}</a><a className={button} href="?history=1">{t("history")}</a></nav><Rad062Entry><AssessView/></Rad062Entry></div>:<p className="mt-6">{t("approved")}</p>;}

function AssessView(){const history=useSyncExternalStore(subscribeTrack,()=>new URLSearchParams(location.search).get("history")==="1",()=>null);return history===null?null:history?<HistoryPanel/>:<TrackSelection/>;}
