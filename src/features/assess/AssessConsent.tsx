"use client";
import {useEffect,useState} from "react";
import {useTranslations} from "next-intl";
import {getPilotClient} from "@/features/pilot/client";
import {assessConsent} from "./history-data";
export function AssessConsent({children}:{children:React.ReactNode}){
  const t=useTranslations("assessHistory"),[accepted,setAccepted]=useState(false),[checked,setChecked]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(false);
  useEffect(()=>{let live=true;void getPilotClient()?.then(async client=>{try{const ok=await assessConsent(client);if(live)setAccepted(ok);}catch{if(live)setError(true);}finally{if(live)setBusy(false);}});return ()=>{live=false;};},[]);
  async function accept(){setBusy(true);setError(false);try{const client=await getPilotClient();if(!client)throw new Error();setAccepted(await assessConsent(client,true));}catch{setError(true);}finally{setBusy(false);}}
  return <><section className="mt-6 space-y-3 rounded border border-line p-4" aria-labelledby="assess-privacy-title" data-testid="assess-consent">
    <h2 id="assess-privacy-title" className="text-xl font-semibold">{t("privacyTitle")}</h2>
    <p>{t("privacy")}</p><p>{t("temporary")}</p><p>{t("limits")}</p><p>{t("recovery")}</p>
    {error&&<p role="alert">{t("unavailable")}</p>}
    {accepted?<p role="status">{t("accepted")}</p>:<><label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5 shrink-0" checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/>{t("agree")}</label><button className="min-h-11 rounded border border-line px-4 py-2 disabled:opacity-50" disabled={busy||!checked} onClick={()=>void accept()}>{t("accept")}</button></>}
  </section>{accepted&&children}</>;
}
