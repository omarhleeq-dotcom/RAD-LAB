import type { SupabaseClient } from "@supabase/supabase-js";
import { isObject,isUuid,RunnerError } from "./runner-data";
export interface ContentPage {rows:{id:string;name:string;version:string;state:"pending"|"installed"}[];next:string|null}
export async function submitContent(client:SupabaseClient,raw:string){
  if(new TextEncoder().encode(raw).length>2_000_000)throw new RunnerError("invalid");
  let document:unknown;try{document=JSON.parse(raw);}catch{throw new RunnerError("invalid");}
  // Owner input only. The trusted Node boundary validates private criteria and keys before installation.
  const {data,error}=await client.schema("assess").rpc("content_submit_v1",{p_document:document});
  if(error||!isUuid(data))throw new RunnerError("unavailable");return data;
}
export async function contentPage(client:SupabaseClient,after:string|null):Promise<ContentPage>{
  const {data,error}=await client.schema("assess").rpc("content_page_v1",{p_after:after,p_limit:20});
  if(error||!isObject(data)||!Array.isArray(data.rows)||data.rows.length>20||!(data.next===null||isUuid(data.next)))throw new RunnerError("unavailable");
  const rows=data.rows.map(r=>{if(!isObject(r)||!isUuid(r.id)||typeof r.name!=="string"||r.name.length>200||typeof r.version!=="string"||r.version.length>100||!["pending","installed"].includes(String(r.state)))throw new RunnerError("invalid");return {id:r.id,name:r.name,version:r.version,state:r.state as "pending"|"installed"};});
  if(data.next!==null&&data.next!==rows.at(-1)?.id)throw new RunnerError("invalid");return {rows,next:data.next};
}
