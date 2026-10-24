"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ProfileStatus } from "./account-state";
import { getPilotClient } from "./client";
import { PILOT } from "./config";
import { ParticipantActivity } from "./OwnerActivity";
import { EMPTY_FILTERS } from "./owner-data";
import { actionsFor, formatStamp, lastActivity, needsConfirmedEmail, type Participant } from "./owner-state";
import { useSessionAccount } from "./SessionGate";
import { OwnerAssessPanel } from "@/features/assess/OwnerAssessPanel";
import { OwnerDirectory, ownerButton as btn } from "./OwnerDirectory";
import { OwnerTraining } from "./OwnerTraining";
const tabs=["participants","training","assess"] as const;
type Tab=typeof tabs[number];
function tabFromUrl():Tab {const v=new URL(location.href).searchParams.get("tab");return tabs.includes(v as Tab)?v as Tab:"participants";}
export function OwnerPanel() {
 const t=useTranslations("owner"),d=useTranslations("owner.dashboard");
 const {state}=useSessionAccount();
 const [tab,setTab]=useState<Tab>("participants"),[version,setVersion]=useState(0);
 const [busy,setBusy]=useState<string|null>(null),[warn,setWarn]=useState<string|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const sync=()=>setTab(tabFromUrl());sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);},[]);
 const ownerId=state.kind==="signedIn"?state.userId:"";
 const isOwner=state.kind==="signedIn"&&state.profile.role==="owner"&&state.profile.status==="approved";
 async function setStatus(p:Participant,target:ProfileStatus) {
  if(needsConfirmedEmail(p,target)&&warn!==p.userId){setWarn(p.userId);return;}
  setBusy(p.userId);setWarn(null);
  try {const c=await getPilotClient();if(!c)throw new Error();const r=await c.rpc("set_participant_status",{target:p.userId,new_status:target});if(r.error)throw new Error();setError(false);setVersion(v=>v+1);}catch{setError(true);}finally{setBusy(null);}
 }
 if(!PILOT)return <p data-testid="owner-off">{t("notEnabled")}</p>;
 if(state.kind==="loading")return <p role="status">{t("loading")}</p>;
 if(state.kind==="signedOut")return <p data-testid="owner-signed-out">{t("signInFirst")} <Link href="/account">{t("goAccount")}</Link></p>;
 if(!isOwner)return <p role="alert" data-testid="owner-denied">{t("denied")}</p>;
 const when=(s:string|null)=>s?formatStamp(new Date(s)):t("never");
 return <section data-testid="owner-list" className="min-w-0 space-y-4">
  <nav aria-label={d("tabs")} className="flex flex-wrap gap-2">{tabs.map(s=><a key={s} href={`?tab=${s}`} aria-current={tab===s?"page":undefined} className={`${btn} ${tab===s?"bg-paper ring-2 ring-brand":""}`} onClick={e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.pushState(null,"",`?tab=${s}`);setTab(s);}}>{d(s)}</a>)}</nav>
  {tab==="participants"&&<>
   <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-semibold">{t("participants")}</h2><button className={btn} onClick={()=>setVersion(v=>v+1)}>{t("refresh")}</button></div>
   {error&&<p role="alert">{t("errors.action")}</p>}
   <OwnerDirectory revision={version}>{p=>{
    const actions=actionsFor(p,ownerId);
    return <>
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1"><strong className="block break-words">{p.name||d("unnamed")}</strong><bdi className="block break-all text-sm text-muted">{p.email}</bdi></div>
      <span className="rounded-full border border-line bg-paper px-2 py-1 text-xs">{t(`status.${p.status}`)}</span>
      <span className="text-xs text-muted"><span className="sr-only">{t("lastActivity")}: </span><bdi>{when(lastActivity(p))}</bdi></span>
      {actions[0]&&<button className={btn} disabled={busy===p.userId} onClick={()=>void setStatus(p,actions[0]!)}>{warn===p.userId&&actions[0]==="approved"?t("confirmApprove"):t(`actions.${actions[0]}`)}</button>}
     </div>
     {warn===p.userId&&<p role="alert">{t("warnUnconfirmed")}</p>}
     <details className="mt-1"><summary className="min-h-11 cursor-pointer text-sm">{d("details")}</summary>
      <dl className="space-y-1 text-sm"><div><dt className="inline">{d("code")}: </dt><dd className="inline break-all font-mono" dir="ltr">{p.code}</dd></div><div><dt className="inline">{t("registered")}: </dt><dd className="inline"><bdi>{when(p.createdAt)}</bdi></dd></div><div><dt className="inline">{t("emailLabel")}: </dt><dd className="inline">{t(p.emailConfirmed?"confirmed":"unconfirmed")}</dd></div></dl>
      {actions.slice(1).map(a=><button key={a} className={btn} disabled={busy===p.userId} onClick={()=>void setStatus(p,a)}>{t(`actions.${a}`)}</button>)}
      <ParticipantActivity code={p.code} userId={p.userId} filters={EMPTY_FILTERS} version={version}/>
     </details>
    </>;
   }}</OwnerDirectory>
  </>}
  {tab==="training"&&<OwnerTraining/>}
  {tab==="assess"&&<OwnerAssessPanel key={ownerId}/>}
 </section>;
}
