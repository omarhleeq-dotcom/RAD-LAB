"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getPilotClient } from "./client";
import { directoryPage, FIRST, type DirectoryPage, type DirectoryPerson, type Position } from "./owner-dashboard-data";
import { useSessionAccount } from "./SessionGate";
export const ownerButton = "min-h-11 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:opacity-60";
/** Shared bounded directory for approvals, export selection and Assess selection. */
export function OwnerDirectory({ revision=0, picker=false, selected=[], onSelect, children, approvedOnly=false }: {
 approvedOnly?:boolean; revision?:number; picker?:boolean; selected?:string[]; onSelect?:(person:DirectoryPerson)=>void; children?:(person:DirectoryPerson)=>React.ReactNode;
}) {
 const {state}=useSessionAccount();
 const owner=state.kind==="signedIn"&&state.profile.status==="approved"&&state.profile.role==="owner"?state.userId:null;
 const t=useTranslations("owner.dashboard");
 const [draft,setDraft]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState("");
 const [position,setPosition]=useState<Position>(FIRST),[result,setResult]=useState<{key:string;page?:DirectoryPage;error?:boolean}>({key:""});
 const key=JSON.stringify([owner,search,status,position,revision,approvedOnly]);
 useEffect(()=>{if(!owner)return;let cancelled=false;void (async()=>{
   try {const c=await getPilotClient();if(!c)throw new Error();const page=await directoryPage(c,search,approvedOnly?"approved":status,position);if(!cancelled)setResult({key,page});}
   catch {if(!cancelled)setResult({key,error:true});}
 })();return ()=>{cancelled=true;};
 // key contains the entire request.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 const page=owner&&result.key===key?result.page:undefined;
 return <section className="min-w-0 space-y-3" aria-label={t("search")} data-testid="owner-directory">
   <form className="flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();setSearch(draft.trim());setPosition(FIRST);}}>
    <label className="min-w-0 flex-1 text-sm">{t("search")}<input type="search" maxLength={100} className="mt-1 block w-full rounded border border-line bg-panel p-2" value={draft} onChange={e=>setDraft(e.target.value)}/></label>
    {!approvedOnly&&<label className="text-sm">{t("status")}<select className="mt-1 block rounded border border-line bg-panel p-2" value={status} onChange={e=>{setStatus(e.target.value);setPosition(FIRST);}}><option value="">{t("all")}</option>{["pending","approved","suspended"].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>}
    <button className={ownerButton}>{t("searchAction")}</button>
   </form>
   {page&&<p data-testid="owner-summary" className="text-sm text-muted">{["pending","approved","suspended"].map(s=>`${t(s)}: ${page.counts[s as keyof typeof page.counts]}`).join(" · ")}{page.legacy?` · ${t("globalCounts")}`:""}</p>}
   {!page&&<p role={result.key===key&&result.error?"alert":"status"}>{t(result.key===key&&result.error?"error":"loading")}</p>}
   {page?.rows.length===0&&<p>{t("empty")}</p>}
   <ul className="divide-y divide-line">{page?.rows.map(p=><li key={p.userId} data-testid="owner-row" className="min-w-0 py-2">
    {picker?<label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-2 size-5 shrink-0" checked={selected.includes(p.userId)} disabled={!selected.includes(p.userId)&&selected.length>=100} onChange={()=>onSelect?.(p)}/><span className="min-w-0"><strong className="block break-words">{p.name||t("unnamed")}</strong><bdi className="block break-all text-sm">{p.email}</bdi><span className="text-sm">{t(p.status)}</span></span></label>:children?.(p)}
   </li>)}</ul>
   <div className="flex gap-2"><button className={ownerButton} onClick={()=>setPosition(FIRST)}>{t("first")}</button><button data-testid="participants-next" className={ownerButton} disabled={!page?.next} onClick={()=>setPosition(page!.next!)}>{t("next")}</button></div>
 </section>;
}
