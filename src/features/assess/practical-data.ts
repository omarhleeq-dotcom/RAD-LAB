import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentVersion,ItemAnswer } from "./contracts";
import { isObject,isUuid,parseListing,parseAck,parseSpec,RunnerError,runnerPort,validValue } from "./runner-data";
import type { MixedSession,Listing } from "./runner-data";
import { PRACTICAL_SCENES,practicalLabel,type PracticalView } from "./practical-presentation";
export interface PracticalSession extends Omit<MixedSession,"assessment"|"views"> {
  assessment?:Extract<AssessmentVersion,{track:"full-practical"}>;views?:Record<string,PracticalView>;
}
const invalid=():never=>{throw new RunnerError("invalid");};
const text=(v:unknown,max=10000):v is string=>typeof v==="string"&&v.length>0&&v.length<=max;
const positive=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>0&&v<=1000;
export function parsePracticalSession(raw:unknown):PracticalSession {
  if(!isObject(raw)||!isUuid(raw.attemptId))return invalid();
  const ack=parseAck(raw.ack);
  if(ack.state!=="active")return {attemptId:raw.attemptId,ack};
  const a=raw.assessment;
  if(!isObject(a)||a.schemaVersion!==1||a.track!=="full-practical"||!isObject(a.ref)||!text(a.ref.id,100)||!text(a.ref.version,100)||!text(a.name,200)||
    !text(a.maximum,30)||!/^\d{1,9}(\.\d{1,6})?$/.test(a.maximum)||Number(a.maximum)<=0||!isObject(a.policy)||
    !Number.isSafeInteger(a.policy.durationSeconds)||Number(a.policy.durationSeconds)<=0||Number(a.policy.durationSeconds)>604800||
    !Number.isSafeInteger(a.policy.maxAttempts)||Number(a.policy.maxAttempts)<1||Number(a.policy.maxAttempts)>1000||
    !["hidden","after-submission"].includes(String(a.policy.gradeVisibility))||!Array.isArray(a.items)||!a.items.length||a.items.length>200||!isObject(raw.views)||!isObject(raw.answers))return invalid();
  const rawViews=raw.views,rawAnswers=raw.answers,seen=new Set<string>();
  const views:Record<string,PracticalView>=Object.create(null),answers:Record<string,ItemAnswer>=Object.create(null);
  const items=a.items.map(item=>{
    if(!isObject(item)||item.schemaVersion!==1||item.contentLanguage!=="en"||!text(item.prompt)||item.type!=="full-practical"||!isObject(item.ref)||
      !text(item.ref.id,100)||!text(item.ref.version,100)||![item.ref.id].every(id=>/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(id))||["constructor","prototype"].includes(item.ref.id)||seen.has(item.ref.id)||
      !isObject(item.caseRef)||!text(item.caseRef.id,100)||!text(item.caseRef.version,100))return invalid();
    seen.add(item.ref.id);const v=rawViews[item.ref.id];
    if(!isObject(v)||v.schemaVersion!==1||!isObject(v.controls)||!isObject(v.initial)||!isObject(v.labels)||!isObject(v.increments)||!isObject(v.scene))return invalid();
    const scene=v.scene;
    if(!PRACTICAL_SCENES.includes(scene.id as PracticalView["scene"]["id"])||!isObject(scene.detector)||!positive(scene.detector.widthCm)||!positive(scene.detector.heightCm)||!positive(scene.markerSizeCm)||!isObject(scene.anatomyFrame))return invalid();
    const f=scene.anatomyFrame;
    if(![f.xCm,f.yCm].every(n=>typeof n==="number"&&Number.isFinite(n)&&Math.abs(n)<=1000)||!positive(f.widthCm)||!positive(f.heightCm))return invalid();
    const controls:PracticalView["controls"]=Object.create(null),initial:Record<string,unknown>=Object.create(null),labels:Record<string,string>=Object.create(null);
    const paths=Object.keys(v.controls);
    if(paths.length>100||["rotationDeg","kvp","mas","sidCm","projection","exposureMode","aecChambers","sideMarker","markerPosition.x","markerPosition.y","centralRay.x","centralRay.y","collimation.width","collimation.height","motionInstruction"].some(p=>!paths.includes(p)))return invalid();
    for(const p of paths){if(!practicalLabel(p)||!text(v.labels[p],200))return invalid();const spec=parseSpec(v.controls[p]);if(!validValue(spec,v.initial[p]))return invalid();controls[p]=spec;initial[p]=v.initial[p];labels[p]=v.labels[p];}
    const increments:PracticalView["increments"]={};
    for(const [p,i] of Object.entries(v.increments)){
      if(!isObject(i)||!controls[p]||!positive(i.step)||(i.stations!==undefined&&(!Array.isArray(i.stations)||!i.stations.length||i.stations.length>500||i.stations.some((x,n,list)=>typeof x!=="number"||!validValue(controls[p]!,x)||(n>0&&x<=Number(list[n-1]))))))return invalid();
      increments[p]={step:i.step,...(Array.isArray(i.stations)?{stations:[...i.stations] as number[]}:{})};
    }
    const answer=rawAnswers[item.ref.id];
    if(answer!==undefined){if(!isObject(answer)||answer.type!=="full-practical"||!isObject(answer.values)||Object.keys(answer.values).length!==paths.length||Object.entries(controls).some(([p,s])=>!validValue(s,(answer.values as Record<string,unknown>)[p])))return invalid();answers[item.ref.id]={type:"full-practical",values:Object.fromEntries(paths.map(p=>[p,(answer.values as Record<string,unknown>)[p]]))};}
    views[item.ref.id]={schemaVersion:1,controls,initial,sceneValues:{},labels,increments,
      scene:{id:scene.id as PracticalView["scene"]["id"],detector:{widthCm:scene.detector.widthCm,heightCm:scene.detector.heightCm},anatomyFrame:{xCm:Number(f.xCm),yCm:Number(f.yCm),widthCm:f.widthCm,heightCm:f.heightCm},markerSizeCm:scene.markerSizeCm}};
    return {schemaVersion:1 as const,ref:{id:item.ref.id,version:item.ref.version},prompt:item.prompt,contentLanguage:"en" as const,type:"full-practical" as const,caseRef:{id:item.caseRef.id,version:item.caseRef.version}};
  });
  if(Object.keys(rawAnswers).some(id=>!seen.has(id))||ack.lockedItemIds.some(id=>!seen.has(id)||!answers[id])||new Set(ack.lockedItemIds).size!==ack.lockedItemIds.length)return invalid();
  return {attemptId:raw.attemptId,ack,assessment:{schemaVersion:1,ref:{id:a.ref.id,version:a.ref.version},name:a.name,track:"full-practical",maximum:a.maximum,policy:{durationSeconds:Number(a.policy.durationSeconds),maxAttempts:Number(a.policy.maxAttempts),gradeVisibility:a.policy.gradeVisibility as "hidden"|"after-submission"},items},views,answers};
}
export async function practicalRequest<T>(fn: (signal:AbortSignal)=>PromiseLike<{data:T;error:{code?:string}|null}>):Promise<T> {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const {data,error}=await fn(controller.signal);if(error)throw new RunnerError(({"42501":"denied","40001":"conflict","22023":"invalid","54000":"limit"} as const)[error.code as "42501"]??"unavailable");return data;}
  catch(e){throw e instanceof RunnerError?e:new RunnerError("network");}finally{clearTimeout(timer);}
}
export function practicalPort(client:SupabaseClient){return {...runnerPort(client),read:async(attempt:string)=>parsePracticalSession(await practicalRequest(signal=>client.schema("assess").rpc("read_practical_session_v1",{p_session:attempt}).abortSignal(signal)))};}
export async function practicalAssignedPage(client:SupabaseClient,after:string|null):Promise<Listing>{return parseListing(await practicalRequest(signal=>client.schema("assess").rpc("assigned_practical_page_v1",{p_after:after,p_limit:20}).abortSignal(signal)));}
