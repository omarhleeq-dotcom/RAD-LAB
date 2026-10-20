import type {SupabaseClient} from "@supabase/supabase-js";
import type {AssessHistoryRow} from "./contracts";
export const ASSESS_CONSENT_VERSION="assess-pilot-2026-10-20-v1";
export interface HistoryPage {rows:AssessHistoryRow[];next:string|null}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).sort().join()===keys.sort().join();
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const invalid=():never=>{throw new Error("Assess history unavailable");};
export function parseHistoryPage(raw:unknown):HistoryPage {
  if(!object(raw)||!exact(raw,["rows","next"])||!Array.isArray(raw.rows)||raw.rows.length>100||!(raw.next===null||uuid(raw.next)))return invalid();
  const rows=raw.rows.map((r):AssessHistoryRow=>{
    if(!object(r)||!exact(r,["name","track","submittedAt","grade"])||typeof r.name!=="string"||!r.name.trim()||r.name.length>200||!["mixed","full-practical"].includes(String(r.track))||typeof r.submittedAt!=="string"||!Number.isFinite(Date.parse(r.submittedAt))||new Date(r.submittedAt).toISOString()!==r.submittedAt||!object(r.grade))return invalid();
    const g=r.grade;
    if(g.visibility==="hidden"&&exact(g,["visibility"]))return {name:r.name,track:r.track as AssessHistoryRow["track"],submittedAt:r.submittedAt,grade:{visibility:"hidden"}};
    if(g.visibility!=="shown"||!exact(g,["visibility","earned","maximum"])||![g.earned,g.maximum].every(v=>typeof v==="string"&&/^\d{1,15}\.\d{2}$/.test(v))||Number(g.earned)>Number(g.maximum)||Number(g.maximum)<=0)return invalid();
    return {name:r.name,track:r.track as AssessHistoryRow["track"],submittedAt:r.submittedAt,grade:{visibility:"shown",earned:g.earned as string,maximum:g.maximum as string}};
  });
  return {rows,next:raw.next};
}
async function request(fn:(signal:AbortSignal)=>PromiseLike<{data:unknown;error:unknown}>):Promise<unknown>{
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
  try{const r=await fn(c.signal);if(r.error)return invalid();return r.data;}catch{return invalid();}finally{clearTimeout(timer);}
}
export async function historyPage(client:SupabaseClient,after:string|null=null):Promise<HistoryPage>{
  if(after!==null&&!uuid(after))return invalid();
  return parseHistoryPage(await request(signal=>client.schema("assess").rpc("history_page_v1",{p_after:after,p_limit:20}).abortSignal(signal)));
}
export async function assessConsent(client:SupabaseClient,accept=false):Promise<boolean>{
  const r=await request(signal=>client.schema("assess").rpc("consent_v1",{p_version:accept?ASSESS_CONSENT_VERSION:null}).abortSignal(signal));
  if(!object(r)||!exact(r,["accepted"])||typeof r.accepted!=="boolean")return invalid();return r.accepted;
}
