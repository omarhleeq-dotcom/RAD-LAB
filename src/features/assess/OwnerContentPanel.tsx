"use client";
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { useEffect,useState } from "react";
import { useTranslations } from "next-intl";
import { getPilotClient } from "@/features/pilot/client";
import { contentPage,submitContent,type ContentPage } from "./content-data";
const button="min-h-11 rounded border border-line px-4 py-2 disabled:opacity-50";
/** Mounted only under the approved-owner boundary; SQL enforces ownership independently. */
export function OwnerContentPanel(){
  const t=useTranslations("assessContent"),[raw,setRaw]=useState(""),[page,setPage]=useState<ContentPage|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
  const load=async(after:string|null=null)=>{setBusy(true);try{const client=await getPilotClient();if(!client)throw new Error();setPage(await contentPage(client,after));setError(false);}catch{setError(true);}finally{setBusy(false);}};
  useEffect(()=>{let cancelled=false;void getPilotClient()?.then(async c=>{try{const p=await contentPage(c,null);if(!cancelled)setPage(p);}catch{if(!cancelled)setError(true);}});return ()=>{cancelled=true;};},[]);
  async function submit(){setBusy(true);setSaved(false);setError(false);try{const client=await getPilotClient();if(!client)throw new Error();await submitContent(client,raw);setRaw("");setSaved(true);setPage(await contentPage(client,null));}catch{setError(true);}finally{setBusy(false);}}
  return <section className="mt-8 space-y-4 border-t border-line pt-5" data-testid="assess-content">
    <h3 className="text-lg font-semibold">{t("title")}</h3><ResultDisclosure title="ⓘ" label={t("title")}><p>{t("help")}</p><p>{t("review")}</p><p>{t("tracks")}</p></ResultDisclosure>
    {error&&<p role="alert">{t("error")}</p>}{saved&&<p role="status">{t("saved")}</p>}
    <form onSubmit={e=>{e.preventDefault();void submit();}} className="space-y-3">
      <label className="block">{t("document")}<textarea dir="ltr" lang="en" className="mt-2 block min-h-64 w-full rounded border border-line bg-panel p-3 font-mono text-sm" value={raw} maxLength={2000000} required disabled={busy} onChange={e=>setRaw(e.target.value)}/></label>
      <button type="submit" className={button} disabled={busy||!raw.trim()}>{t("submit")}</button>
    </form>
    <button className={button} disabled={busy} onClick={()=>void load()}>{t("refresh")}</button>
    <ul className="space-y-2">{page?.rows.map(r=><li key={r.id} className="break-words"><span lang="en" dir="ltr">{r.name} — {r.version}</span> · {t(r.state)}</li>)}</ul>
    {page?.next&&<button className={button} disabled={busy} onClick={()=>void load(page.next)}>{t("next")}</button>}
  </section>;
}
