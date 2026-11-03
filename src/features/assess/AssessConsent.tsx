"use client";
import {useEffect,useState} from "react";
import {useTranslations} from "next-intl";
import {getPilotClient} from "@/features/pilot/client";
import {ASSESS_RETENTION_CONSENT_VERSION} from "./retention-consent";
import {RAD085_REVIEW_AVAILABLE,ASSESS_WRITTEN_CONSENT_VERSION} from './review-availability';
import {assessConsent} from "./history-data";
async function currentConsent(client:Parameters<typeof assessConsent>[0],accept=false){
 if(RAD085_REVIEW_AVAILABLE){const {writtenConsent}=await import('./written-consent');return writtenConsent(client,accept);}
 return assessConsent(client,accept);
}
export function AssessConsent({children}:{children:React.ReactNode}){
  const written=useTranslations("rad085Disclosure"),ui=useTranslations("assessConsentUi");
  const policy=useTranslations("assessConsentV2"),t=useTranslations("assessHistory"),[accepted,setAccepted]=useState(false),[checked,setChecked]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(false);
  useEffect(()=>{let live=true;void getPilotClient()?.then(async client=>{try{const ok=await currentConsent(client);if(live)setAccepted(ok);}catch{if(live)setError(true);}finally{if(live)setBusy(false);}});return ()=>{live=false;};},[]);
  async function accept(){setBusy(true);setError(false);try{const client=await getPilotClient();if(!client)throw new Error();setAccepted(await currentConsent(client,true));}catch{setError(true);}finally{setBusy(false);}}
  const title=<h2 id="assess-privacy-title" className="text-xl font-semibold">{t("privacyTitle")}</h2>;
  const version=<p dir="ltr" className="text-sm">{RAD085_REVIEW_AVAILABLE?ASSESS_WRITTEN_CONSENT_VERSION:ASSESS_RETENTION_CONSENT_VERSION}</p>;
  const text=<><p>{policy("summary")}</p><p>{policy("temporary")}</p><p>{policy("metadata")}</p><p>{policy("backups")}</p>
    {RAD085_REVIEW_AVAILABLE&&<p data-testid="written-disclosure">{written("written")}</p>}</>;
  // Before consent the full notice stays visible; after consent the identical text stays in a collapsed native disclosure.
  return <><section className={accepted?"mt-6 space-y-2 rounded border border-line p-3":"mt-6 space-y-3 rounded border border-line p-4"} aria-labelledby="assess-privacy-title" data-testid="assess-consent">
    {accepted?<>
      <div className="flex flex-wrap items-baseline gap-x-3"><p role="status">{t("accepted")}</p>{version}</div>
      {error&&<p role="alert">{t("unavailable")}</p>}
      <details><summary className="min-h-11 cursor-pointer py-2">{ui("showText")}</summary><div className="space-y-3">{title}{text}</div></details>
    </>:<>
    {title}
    {version}
    {text}
    {error&&<p role="alert">{t("unavailable")}</p>}
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5 shrink-0" checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/>{t("agree")}</label><button className="min-h-11 rounded border border-line px-4 py-2 disabled:opacity-50" disabled={busy||!checked} onClick={()=>void accept()}>{t("accept")}</button></>}
  </section>{accepted&&children}</>;
}
