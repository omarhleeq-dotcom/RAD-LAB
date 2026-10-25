"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPilotClient } from "./client";
import { createC2Adapter } from "./c2-contract";
import type { C2Adapter } from "./c2-ui";
import { useSessionAccount } from "./SessionGate";
import { needsConsent } from "./consent";
import { PILOT } from "./config";
import { ParticipantSurvey, SurveyReminder } from "./ParticipantSurvey";
/** Old adapters are hidden synchronously; pending client acquisition is cancelled on session change. */
export function useC2Adapter(userId:string|null) {
 const [bound,setBound]=useState<{userId:string;adapter:C2Adapter}|null>(null);
 useEffect(()=>{let active=true;
  if(userId)void (async()=>{const client=await getPilotClient();if(active&&client)setBound({userId,adapter:createC2Adapter(client)});})();
  return()=>{active=false;};
 },[userId]);
 return userId&&bound&&bound.userId===userId?bound.adapter:null;
}
export function C2Participant({reminder=false}:{reminder?:boolean}) {
 const {state}=useSessionAccount();
 const user=PILOT&&state.kind==="signedIn"&&state.profile.status==="approved"&&state.profile.role==="participant"&&!needsConsent(state.consentVersion)?state.userId:null;
 // Keying also clears submitted answers and pending state when consent or identity changes.
 return <ParticipantSession key={user??"none"} userId={user} reminder={reminder}/>;
}
function ParticipantSession({userId,reminder}:{userId:string|null;reminder:boolean}) {
 const adapter=useC2Adapter(userId),locale=useLocale(),t=useTranslations("c2");
 if(!userId)return null;
 if(!adapter)return reminder?null:<p role="status">{t("loading")}</p>;
 return reminder?<SurveyReminder adapter={adapter} participantId={userId} href={`/${locale}/feedback`}/>:<ParticipantSurvey adapter={adapter} participantId={userId}/>;
}
