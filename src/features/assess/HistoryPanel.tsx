"use client";
import {useEffect,useState} from "react";
import {useTranslations} from "next-intl";
import {getPilotClient} from "@/features/pilot/client";
import {historyPage,type HistoryPage} from "./history-data";
const button="min-h-11 rounded border border-line px-4 py-2 disabled:opacity-50";
export function HistoryPanel(){
  const t=useTranslations("assessHistory"),[page,setPage]=useState<HistoryPage|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
  async function load(after:string|null=null){setBusy(true);setError(false);setPage(null);try{const c=await getPilotClient();if(!c)throw new Error();setPage(await historyPage(c,after));}catch{setError(true);}finally{setBusy(false);}}
  useEffect(()=>{let live=true;void getPilotClient()?.then(async c=>{try{const p=await historyPage(c);if(live)setPage(p);}catch{if(live)setError(true);}});return ()=>{live=false;};},[]);
  return <section className="mt-6 space-y-4" aria-labelledby="assess-history-title" data-testid="assess-history">
    <h2 id="assess-history-title" className="text-xl font-semibold">{t("title")}</h2><p>{t("retention")}</p>
    <button className={button} disabled={busy} onClick={()=>void load()}>{t("refresh")}</button>
    {error?<p role="alert">{t("unavailable")}</p>:!page?<p role="status">{t("loading")}</p>:page.rows.length===0?<p role="status">{t("empty")}</p>:<ul className="space-y-4">{page.rows.map((row,i)=><li key={i} className="rounded border border-line p-4"><dl className="grid gap-3 sm:grid-cols-2">
      <div><dt className="font-semibold">{t("name")}</dt><dd lang="en" dir="ltr" className="break-words">{row.name}</dd></div>
      <div><dt className="font-semibold">{t("track")}</dt><dd>{t(row.track==="mixed"?"mixed":"practical")}</dd></div>
      <div><dt className="font-semibold">{t("submittedAt")}</dt><dd><time dir="ltr" dateTime={row.submittedAt}>{row.submittedAt.replace("T"," ").replace(".000Z"," UTC")}</time></dd></div>
      <div><dt className="font-semibold">{t("grade")}</dt><dd>{row.grade.visibility==="hidden"?t("hidden"):<bdi>{row.grade.earned} / {row.grade.maximum}</bdi>}</dd></div>
    </dl></li>)}</ul>}
    {page?.next&&<button className={button} disabled={busy} onClick={()=>void load(page.next)}>{t("next")}</button>}
  </section>;
}
