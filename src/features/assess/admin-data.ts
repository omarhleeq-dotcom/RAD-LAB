import {isObject as object,isUuid as uuid} from "./data-guards";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminKind = "groups" | "people" | "members" | "versions" | "assignments" | "targets";
export interface AdminRow {
  id: string;
  name: string | null;
  email?: string | null;
  status?: "approved" | "pending" | "suspended";
  track?: "mixed" | "full-practical";
  version?: string;
  revision?: number;
}
export interface AdminPage { version: 1; rows: AdminRow[]; next: string | null }
export class AssessAdminError extends Error {
  constructor(readonly kind: "schema" | "denied" | "conflict" | "invalid" | "error") { super("Assess administration unavailable"); }
}
const text = (v:unknown) => typeof v==="string" && v.trim().length>0 && v.length<=200;
export function parseAdminPage(value:unknown,kind:AdminKind):AdminPage {
  const fail=()=>{throw new AssessAdminError("error");};
  if (!object(value)||value.version!==1||!Array.isArray(value.rows)||value.rows.length>100||!(value.next===null||uuid(value.next))) return fail();
  const seen=new Set<string>();
  for (const row of value.rows) {
    if (!object(row)||!uuid(row.id)||seen.has(row.id)) return fail();
    seen.add(row.id);
    if (["people","members","targets"].includes(kind)) {
      if (!(row.name===null||text(row.name))||!(row.email===null||text(row.email))||!["approved","pending","suspended"].includes(String(row.status))) return fail();
    } else {
      if (!text(row.name)) return fail();
      if (kind!=="groups" && (!text(row.version)||!["mixed","full-practical"].includes(String(row.track)))) return fail();
      if (kind==="assignments" && (!Number.isSafeInteger(row.revision)||Number(row.revision)<1)) return fail();
    }
  }
  if (value.next!==null && value.next!==value.rows.at(-1)?.id) return fail();
  return value as unknown as AdminPage;
}
function failure(error:{code?:string},status?:number):AssessAdminError {
  const code=error.code??"";
  return new AssessAdminError(["PGRST106","PGRST202","42883","42P01"].includes(code)?"schema":
    code==="42501"||status===401||status===403?"denied":code==="40001"||code==="23505"?"conflict":code==="22023"?"invalid":"error");
}
async function rpc(client:SupabaseClient,name:string,args:Record<string,unknown>):Promise<unknown> {
  try {
    const {data,error,status}=await client.schema("assess").rpc(name,args);
    if(error) throw failure(error,status);
    return data;
  } catch(error) { if(error instanceof AssessAdminError) throw error;throw new AssessAdminError("error"); }
}
export async function readAssessAdmin(client:SupabaseClient,kind:AdminKind,context:string|null=null,search="",after:string|null=null):Promise<AdminPage> {
  return parseAdminPage(await rpc(client,"owner_page_v1",{p_kind:kind,p_context:context,p_search:search,p_after:after,p_limit:20}),kind);
}
export type AdminCommand =
  | {type:"group";id:string|null;name:string|null;remove?:boolean}
  | {type:"members";group:string;users:string[];add:boolean}
  | {type:"assign";version:string;users:string[];groups:string[]}
  | {type:"targets";assignment:string;revision:number;users:string[];add:boolean};
export async function writeAssessAdmin(client:SupabaseClient,command:AdminCommand):Promise<string|number|null> {
  let name:string,args:Record<string,unknown>;
  switch(command.type) {
    case "group":name="group_write_v1";args={p_id:command.id,p_name:command.name,p_delete:command.remove??false};break;
    case "members":name="members_write_v1";args={p_group:command.group,p_users:command.users,p_add:command.add};break;
    case "assign":name="assign_v1";args={p_version:command.version,p_users:command.users,p_groups:command.groups};break;
    case "targets":name="targets_write_v1";args={p_assignment:command.assignment,p_revision:command.revision,p_users:command.users,p_add:command.add};break;
  }
  const result=await rpc(client,name,args);
  if ((command.type==="members"&&result===null)||((command.type==="group"||command.type==="assign")&&uuid(result))||
    (command.type==="targets"&&typeof result==="number"&&Number.isSafeInteger(result)&&result>0)) return result as string|number|null;
  throw new AssessAdminError("error");
}
