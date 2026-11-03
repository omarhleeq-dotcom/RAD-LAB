"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { ProfileStatus } from "./account-state";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { ParticipantActivity } from "./OwnerActivity";
import { EMPTY_FILTERS, readOwnerPage } from "./owner-data";
import { actionsFor, formatStamp, lastActivity, needsConfirmedEmail, parseParticipants } from "./owner-state";
import { useSessionAccount } from "./SessionGate";
import { OwnerAssessPanel } from "@/features/assess/OwnerAssessPanel";
import { OwnerDirectory, OwnerSearchSeed, ownerButton as btn } from "./OwnerDirectory";
import { OwnerTraining } from "./OwnerTraining";
import { directoryPage, FIRST, type DirectoryPerson } from "./owner-dashboard-data";
import { useC2Adapter } from "./C2Session";
import { DeactivateAccount, OwnerDeletion } from "./OwnerDeletion";
import { OwnerSurveys } from "./OwnerSurveys";
import { Chip, Fold } from "./OwnerUi";
import {EmergencySession} from '@/features/emergency/EmergencySession';
const tabs=["students","groups","assess","practice","surveys","safety"] as const;
type Tab=typeof tabs[number];
// Links saved before the restructure keep working.
const legacy:Record<string,Tab>={participants:"students",training:"practice"};
function tabFromUrl():Tab {const v=new URL(location.href).searchParams.get("tab")??"";const t=legacy[v]??v;return tabs.includes(t as Tab)?t as Tab:"students";}
const filters=["all","pending","approved","suspended","deletion","supervisors"] as const;
type Filter=typeof filters[number];
type Counts={pending:number;approved:number;suspended:number};
const danger="inline-flex min-h-11 items-center rounded-md border border-red-700 bg-red-700 px-3 py-2 text-sm font-semibold text-white";
export function OwnerPanel({supervisors}:{supervisors?:ReactNode}={}) {
 const {state}=useSessionAccount();
 const identity=state.kind==="signedIn"?`${state.userId}:${state.profile.role}:${state.profile.status}`:state.kind;
 return <OwnerPanelSession key={identity} supervisors={supervisors}/>;
}
function OwnerPanelSession({supervisors}:{supervisors?:ReactNode}) {
 const t=useTranslations("owner"),d=useTranslations("owner.dashboard"),ux=useTranslations("ownerUx"),e=useTranslations("emergency"),c2=useTranslations("c2");
 const {state}=useSessionAccount();
 const [tab,setTab]=useState<Tab>("students"),[version,setVersion]=useState(0);
 const [busy,setBusy]=useState<string|null>(null),[warn,setWarn]=useState<string|null>(null),[error,setError]=useState(false);
 const [filter,setFilter]=useState<Filter>("all"),[seed,setSeed]=useState(""),[emergencyOpen,setEmergencyOpen]=useState(false);
 const [counts,setCounts]=useState<{version:number;value:Counts|null}|null>(null),[queue,setQueue]=useState<{count:number;more:boolean}|null>(null);
 useEffect(()=>{const sync=()=>setTab(tabFromUrl());sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);},[]);
 const ownerId=state.kind==="signedIn"?state.userId:"";
 const isOwner=state.kind==="signedIn"&&state.profile.role==="owner"&&state.profile.status==="approved";
 // Status bar: the same bounded directory read the Students list already uses (global counts, first page).
 useEffect(()=>{if(!isOwner)return;let active=true;void (async()=>{
  try{const c=await getPilotClient();if(!c)throw new Error();const page=await directoryPage(c,"","",FIRST);if(active)setCounts({version,value:page.counts});}
  catch{if(active)setCounts({version,value:null});}
 })();return()=>{active=false;};},[isOwner,version]);
 async function setStatus(p:DirectoryPerson,target:ProfileStatus) {
  setBusy(p.userId);
  try {const c=await getPilotClient();if(!c)throw new Error();if(target==="approved") {
   const detail=await readOwnerPage(args=>c.rpc("owner_page_v1",args),"participants",{...EMPTY_FILTERS,participant:p.userId},null,null,false,1);
   const confirmed=parseParticipants(detail.rows).find(row=>row.userId===p.userId);
   if(!confirmed)throw new Error();
   if(needsConfirmedEmail(confirmed,target)&&warn!==p.userId){setWarn(p.userId);return;}
  }
  const r=await c.rpc("set_participant_status",{target:p.userId,new_status:target});if(r.error)throw new Error();setWarn(null);setError(false);setVersion(v=>v+1);}catch{setError(true);}finally{setBusy(null);}
 }
 const adapter=useC2Adapter(isOwner?ownerId:null);
 if(!PILOT)return <p data-testid="owner-off">{t("notEnabled")}</p>;
 if(state.kind==="loading")return <p role="status">{t("loading")}</p>;
 if(state.kind==="signedOut")return <p data-testid="owner-signed-out">{t("signInFirst")} <Link href="/account">{t("goAccount")}</Link></p>;
 if(!isOwner)return <p role="alert" data-testid="owner-denied">{t("denied")}</p>;
 const when=(s:string|null)=>s?formatStamp(new Date(s)):t("never");
 function go(next:Tab) {history.pushState(null,"",`?tab=${next}`);setTab(next);}
 const known=counts?.value??null;
 const filterLabel=(f:Filter)=>f==="pending"||f==="approved"||f==="suspended"?`${ux(`filter.${f}`)}${known?` (${known[f]})`:""}`:ux(`filter.${f}`);
 const waiting=c2("loading");
 return <section data-testid="owner-list" className="min-w-0 space-y-4">
  <div role="region" aria-label={ux("statusBar")} data-testid="owner-status" className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-line bg-paper px-4 py-2">
   {known?<button type="button" className={btn} onClick={()=>{setFilter("pending");go("students");}}>{ux("pendingCount",{count:known.pending})}</button>:<span className="text-sm text-muted" role="status">{counts?d("error"):d("loading")}</span>}
   {queue&&<button type="button" className={btn} onClick={()=>go("assess")}>{ux(queue.more?"gradingMore":"gradingCount",{count:queue.count})}</button>}
   <a href="?tab=safety#owner-emergency" data-testid="owner-emergency-button" className={`${danger} ms-auto`} onClick={ev=>{if(ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;ev.preventDefault();history.pushState(null,"","?tab=safety#owner-emergency");setTab("safety");setEmergencyOpen(true);requestAnimationFrame(()=>document.getElementById("owner-emergency")?.scrollIntoView());}}>{e("stopTitle")}</a>
  </div>
  <nav aria-label={d("tabs")} className="flex flex-wrap gap-2">{tabs.map(s=><a key={s} href={`?tab=${s}`} aria-current={tab===s?"page":undefined} className={`${btn} inline-flex items-center ${tab===s?"bg-paper ring-2 ring-brand":""}`} onClick={ev=>{if(ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;ev.preventDefault();go(s);}}>{ux(`tabs.${s}`)}</a>)}</nav>
  {tab==="students"&&<section aria-labelledby="owner-students-title" className="min-w-0 space-y-3">
   <div className="flex items-center justify-between gap-2"><h2 id="owner-students-title" className="text-xl font-semibold">{ux("tabs.students")}</h2><button className={btn} onClick={()=>setVersion(v=>v+1)}>{t("refresh")}</button></div>
   <div role="group" aria-label={ux("filterLabel")} className="flex flex-wrap gap-2">{filters.map(f=><button key={f} type="button" aria-pressed={filter===f} className={`${btn} ${filter===f?"bg-paper ring-2 ring-brand":""}`} onClick={()=>{setFilter(f);if(f!=="supervisors")setSeed("");}}>{filterLabel(f)}</button>)}</div>
   {error&&<p role="alert">{t("errors.action")}</p>}
   {filter==="deletion"?(adapter?<OwnerDeletion adapter={adapter} ownerId={ownerId} onChanged={()=>setVersion(v=>v+1)}/>:<p role="status">{waiting}</p>)
   :filter==="supervisors"?<OwnerSearchSeed.Provider value={seed}>{supervisors??<p role="status">{c2("unavailable")}</p>}</OwnerSearchSeed.Provider>
   :<OwnerDirectory revision={version} status={filter==="all"?"":filter}>{p=>{
    const actions=actionsFor(p,ownerId);
    return <details data-testid="owner-student">
     <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 py-1">
      <span className="min-w-0"><strong className="block break-words">{p.name||d("unnamed")}</strong>{!p.name&&<bdi className="block break-all text-sm text-muted">{p.email}</bdi>}</span>
      <Chip tone={p.status==="pending"?"warn":"plain"}>{t(`status.${p.status}`)}</Chip>
     </summary>
     <div className="mb-2 min-w-0 space-y-3 rounded-lg border border-line bg-panel p-3" data-testid="owner-student-details">
      <dl className="space-y-1 text-sm">
       <div><dt className="inline">{t("emailLabel")}: </dt><dd className="inline"><bdi className="break-all">{p.email}</bdi>{p.emailConfirmed!==null&&<> · {t(p.emailConfirmed?"confirmed":"unconfirmed")}</>}</dd></div>
       <div><dt className="inline">{d("code")}: </dt><dd className="inline break-all font-mono" dir="ltr">{p.code}</dd></div>
       <div><dt className="inline">{t("registered")}: </dt><dd className="inline"><bdi>{when(p.createdAt)}</bdi></dd></div>
       <div><dt className="inline">{t("lastActivity")}: </dt><dd className="inline"><bdi>{when(lastActivity(p))}</bdi></dd></div>
      </dl>
      <p className="text-xs text-muted">{ux("codeHelp")}</p>
      {actions.length>0&&<div className="flex flex-wrap gap-2">{actions.map(a=><button key={a} className={btn} disabled={busy===p.userId} onClick={()=>void setStatus(p,a)}>{warn===p.userId&&a==="approved"?t("confirmApprove"):t(`actions.${a}`)}</button>)}</div>}
      {warn===p.userId&&<p role="alert">{t("warnUnconfirmed")}</p>}
      {supervisors&&p.role!=="owner"&&<div className="space-y-1"><h3 className="text-sm font-semibold">{ux("supervisorRole")}</h3><button type="button" className={btn} onClick={()=>{setSeed(p.email);setFilter("supervisors");}}>{ux("supervisorManage")}</button></div>}
      {adapter&&p.userId!==ownerId&&<div className="space-y-1"><h3 className="text-sm font-semibold">{c2("deletionTitle")}</h3><DeactivateAccount adapter={adapter} ownerId={ownerId} person={{id:p.userId,code:p.code}} onChanged={()=>setVersion(v=>v+1)}/></div>}
      <ParticipantActivity code={p.code} userId={p.userId} filters={EMPTY_FILTERS} version={version}/>
     </div>
    </details>;
   }}</OwnerDirectory>}
  </section>}
  {tab==="groups"&&<OwnerAssessPanel key={`groups:${ownerId}`} section="groups"/>}
  {tab==="assess"&&<OwnerAssessPanel key={`assess:${ownerId}`} section="assess" onQueue={(count,more)=>setQueue({count,more})}/>}
  {tab==="practice"&&<OwnerTraining key={version}/>}
  {tab==="surveys"&&(adapter?<OwnerSurveys adapter={adapter} ownerId={ownerId}/>:<p role="status">{waiting}</p>)}
  {tab==="safety"&&<section aria-labelledby="owner-safety-title" className="min-w-0 space-y-3">
   <h2 id="owner-safety-title" className="text-xl font-semibold">{ux("tabs.safety")}</h2>
   <div id="owner-emergency"><Fold title={e("ownerTitle")} open={emergencyOpen} onToggle={setEmergencyOpen} testId="owner-emergency"><EmergencySession owner/></Fold></div>
  </section>}
 </section>;
}
