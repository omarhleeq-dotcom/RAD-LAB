import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentVersion, AttemptAcknowledgement, AttemptCommand, ItemAnswer } from "./contracts";
import type { ItemView, ControlSpec } from "./presentation";
import { controlLabel,SCENE_PATHS } from "./presentation";
export interface Listing { rows:{id:string;name:string;version:string}[];next:string|null }
export interface MixedSession {
  attemptId:string;ack:AttemptAcknowledgement;
  assessment?:Extract<AssessmentVersion,{track:"mixed"}>;
  answers?:Record<string,ItemAnswer>;views?:Record<string,ItemView>;
}
export class RunnerError extends Error {
  constructor(readonly code:"conflict"|"denied"|"unavailable"|"invalid"|"network"|"limit") {super(code);}
}
import {isObject,isUuid} from "./data-guards";
export {isObject,isUuid} from "./data-guards";
const text=(v:unknown,max=10000):v is string=>typeof v==="string"&&v.length>0&&v.length<=max;
function invalid():never {throw new RunnerError("invalid");}
export function parseListing(raw:unknown):Listing {
  if(!isObject(raw)||!Array.isArray(raw.rows)||raw.rows.length>100||!(raw.next===null||isUuid(raw.next)))return invalid();
  const rows=raw.rows.map(r=>{if(!isObject(r)||!isUuid(r.id)||!text(r.name,200)||!text(r.version,100))return invalid();return {id:r.id,name:r.name,version:r.version};});
  if(new Set(rows.map(r=>r.id)).size!==rows.length||(raw.next!==null&&raw.next!==rows.at(-1)?.id))return invalid();
  return {rows,next:raw.next};
}
export function parseAck(raw:unknown):AttemptAcknowledgement {
  if(!isObject(raw)||!Number.isSafeInteger(raw.revision)||Number(raw.revision)<0||!text(raw.serverTime)||!Number.isFinite(Date.parse(raw.serverTime))||
    !(raw.deadline===null||(text(raw.deadline)&&Number.isFinite(Date.parse(raw.deadline))))||
    !["active","grading","graded","grading-failed","void"].includes(String(raw.state))||!Array.isArray(raw.lockedItemIds)||raw.lockedItemIds.length>200||raw.lockedItemIds.some(x=>!text(x,100)))return invalid();
  return {operationId:typeof raw.operationId==="string"?raw.operationId:"",revision:Number(raw.revision),serverTime:raw.serverTime,deadline:raw.deadline as string|null,state:raw.state as AttemptAcknowledgement["state"],lockedItemIds:raw.lockedItemIds as string[]};
}
export function parseSpec(raw:unknown):ControlSpec {
  if(!isObject(raw))return invalid();
  if(raw.kind==="number"&&typeof raw.min==="number"&&Number.isFinite(raw.min)&&typeof raw.max==="number"&&Number.isFinite(raw.max)&&raw.min<raw.max)return {kind:"number",min:raw.min,max:raw.max};
  if(raw.kind==="enum"&&Array.isArray(raw.values)&&raw.values.length>0&&raw.values.length<=50&&raw.values.every(v=>v===null||typeof v==="string"||(Array.isArray(v)&&v.every(x=>typeof x==="string"))))return {kind:"enum",values:raw.values};
  return invalid();
}
export function validValue(spec:ControlSpec,v:unknown) {
  return spec.kind==="number"?typeof v==="number"&&Number.isFinite(v)&&v>=spec.min&&v<=spec.max:spec.values.some(x=>JSON.stringify(x)===JSON.stringify(v));
}
export function parseSession(raw:unknown):MixedSession {
  if(!isObject(raw)||!isUuid(raw.attemptId))return invalid();
  const ack=parseAck(raw.ack),session:MixedSession={attemptId:raw.attemptId,ack};
  if(ack.state!=="active")return session; // discard all detailed fields after submission
  const a=raw.assessment;
  if(!isObject(a)||a.schemaVersion!==1||a.track!=="mixed"||!isObject(a.ref)||!text(a.ref.id,100)||!text(a.ref.version,100)||!text(a.name,200)||
    !isObject(a.policy)||!Number.isSafeInteger(a.policy.durationSeconds)||Number(a.policy.durationSeconds)<=0||!Number.isSafeInteger(a.policy.maxAttempts)||
    !["hidden","after-submission"].includes(String(a.policy.gradeVisibility))||!text(a.maximum,30)||!Array.isArray(a.items)||a.items.length<1||a.items.length>200||!isObject(raw.answers)||!isObject(raw.views))return invalid();
  const rawAnswers=raw.answers,rawViews=raw.views;
  const answers:Record<string,ItemAnswer>=Object.create(null),views:Record<string,ItemView>=Object.create(null),seen=new Set<string>();
  const items=a.items.map(item=>{
    if(!isObject(item)||item.schemaVersion!==1||item.contentLanguage!=="en"||!text(item.prompt)||!isObject(item.ref)||!text(item.ref.id,100)||!text(item.ref.version,100)||seen.has(item.ref.id)||["__proto__","constructor","prototype"].includes(item.ref.id))return invalid();
    seen.add(item.ref.id);const base={schemaVersion:1 as const,contentLanguage:"en" as const,prompt:item.prompt,ref:{id:item.ref.id,version:item.ref.version}};
    const answer=rawAnswers[item.ref.id];
    if(item.type==="single-choice") {
      if(!Array.isArray(item.options)||item.options.length<2||item.options.length>50)return invalid();
      const options=item.options.map(o=>{if(!isObject(o)||!text(o.id,100)||!text(o.text,5000))return invalid();return {id:o.id,text:o.text};});
      if(new Set(options.map(o=>o.id)).size!==options.length)return invalid();
      if(answer!==undefined){if(!isObject(answer)||answer.type!=="single-choice"||!(answer.optionId===null||options.some(o=>o.id===answer.optionId)))return invalid();answers[item.ref.id]={type:"single-choice",optionId:answer.optionId as string|null};}
      return {...base,type:"single-choice" as const,options};
    }
    if(item.type!=="simulator-part"||!isObject(item.presentation)||!Array.isArray(item.presentation.controls)||!Array.isArray(item.presentation.sceneElements))return invalid();
    const view=rawViews[item.ref.id];
    if(!isObject(view)||!isObject(view.controls)||!isObject(view.initial)||!isObject(view.sceneValues))return invalid();
    const controls:Record<string,ControlSpec>=Object.create(null),initial:Record<string,unknown>=Object.create(null),sceneValues:Record<string,unknown>=Object.create(null);
    for(const path of item.presentation.controls) {
      if(typeof path!=="string"||!controlLabel(path)||Object.hasOwn(controls,path))return invalid();
      const spec=parseSpec(view.controls[path]);controls[path]=spec;
      if(!validValue(spec,view.initial[path]))return invalid();initial[path]=view.initial[path];
    }
    if(!Object.keys(controls).length||Object.keys(view.controls).length!==Object.keys(controls).length)return invalid();
    for(const e of item.presentation.sceneElements) {
      if(typeof e!=="string"||!Object.hasOwn(SCENE_PATHS,e))return invalid();
      for(const path of SCENE_PATHS[e]!) {const v=view.sceneValues[path];if(!(v===null||typeof v==="string"||(typeof v==="number"&&Number.isFinite(v))))return invalid();sceneValues[path]=v;}
    }
    views[item.ref.id]={controls,initial,sceneValues};
    if(answer!==undefined){if(!isObject(answer)||answer.type!=="simulator-part"||!isObject(answer.values)||Object.keys(answer.values).length!==Object.keys(controls).length||Object.entries(controls).some(([p,s])=>!validValue(s,(answer.values as Record<string,unknown>)[p])))return invalid();answers[item.ref.id]={type:"simulator-part",values:answer.values};}
    return {...base,type:"simulator-part" as const,presentation:{controls:Object.keys(controls),sceneElements:item.presentation.sceneElements as string[]}};
  });
  if(ack.lockedItemIds.some(id=>!items.some(i=>i.ref.id===id&&i.type==="simulator-part")||!answers[id]))return invalid();
  session.assessment={schemaVersion:1,ref:{id:a.ref.id,version:a.ref.version},name:a.name,track:"mixed",maximum:a.maximum,policy:{durationSeconds:Number(a.policy.durationSeconds),maxAttempts:Number(a.policy.maxAttempts),gradeVisibility:a.policy.gradeVisibility as "hidden"|"after-submission"},items};
  session.answers=answers;session.views=views;return session;
}
export interface RunnerPort {start(assignment:string,operation:string):Promise<string>;read(attempt:string):Promise<MixedSession>;command(command:AttemptCommand):Promise<void>}
async function request<T>(fn:(signal:AbortSignal)=>PromiseLike<{data:T;error:{code?:string}|null}>):Promise<T> {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15_000);
  let result;try{result=await fn(controller.signal);}catch{throw new RunnerError("network");}finally{clearTimeout(timer);}
  if(result.error)throw new RunnerError(({"42501":"denied","40001":"conflict","22023":"invalid","54000":"limit"} as const)[result.error.code as "42501"]??"unavailable");
  return result.data;
}
export function runnerPort(client:SupabaseClient):RunnerPort {
  return {
    async start(assignment,operation){const raw=await request(signal=>client.schema("assess").rpc("start_v1",{p_assignment:assignment,p_operation:operation}).abortSignal(signal));if(!isObject(raw)||!isUuid(raw.attemptId))return invalid();return raw.attemptId;},
    async read(attempt){return parseSession(await request(signal=>client.schema("assess").rpc("read_mixed_session_v1",{p_session:attempt}).abortSignal(signal)));},
    async command(c){
      if(new TextEncoder().encode(JSON.stringify(c)).length>65536)return invalid();
      await request(signal=>client.schema("assess").rpc("command_v1",{p_session:c.attemptId,p_operation:c.operationId,p_revision:c.expectedRevision,p_action:c.action}).abortSignal(signal));
    },
  };
}
export async function assignedPage(client:SupabaseClient,after:string|null):Promise<Listing> {
  return parseListing(await request(signal=>client.schema("assess").rpc("assigned_page_v1",{p_after:after,p_limit:20}).abortSignal(signal)));
}
