import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant } from "./owner-state";
import { parseDirectory } from "./c2-ui";
export { examSummaryPage } from "./owner-dashboard-deferred";
export type DirectoryPerson = Omit<Participant,"emailConfirmed"> & { name: string | null; emailConfirmed: boolean | null };
export type Position = { cursor: Record<string,string> | null; boundary: string | null };
export const FIRST: Position = { cursor: null, boundary: null };
export type Counts = Record<"pending"|"approved"|"suspended",number>;
export type DirectoryPage = { rows: DirectoryPerson[]; next: Position | null; counts: Counts; legacy: boolean };
export type ExamSummary = { exam: string; attempts: number; passed: number; known: number; wrong: { id: string; count: number }[] };

/** All normal owner lists exclude pending deletion, using the installed C2 directory. */
export async function directoryPage(client: SupabaseClient, search: string, status: string, position: Position): Promise<DirectoryPage> {
 const {data,error}=await client.rpc("owner_account_directory_v1",{p_search:search,p_status:status,p_cursor:position.cursor,p_boundary:position.boundary,p_limit:20});
 if(error)throw new Error("Directory unavailable");
 const page=parseDirectory(data);
 const rows=page.rows.map((person,i)=>{
  const r=data.rows[i];
  if(typeof r.email!=="string"||typeof r.created_at!=="string"||!Number.isFinite(Date.parse(r.created_at))
    ||(r.name!==null&&typeof r.name!=="string")||(r.last_seen_at!==null&&typeof r.last_seen_at!=="string"))throw new Error("Invalid directory");
  return {userId:person.id,code:person.code,role:person.role,status:person.status,name:r.name,email:r.email,
    createdAt:r.created_at,lastSeenAt:r.last_seen_at,lastEventAt:null,emailConfirmed:null};
 });
 return {rows,counts:page.counts,legacy:false,next:page.next?{cursor:{id:page.next.cursor!.id,rank:String(page.next.cursor!.rank)},boundary:page.next.boundary}:null};
}
