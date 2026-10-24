import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPTY_FILTERS, readOwnerPage, type OwnerFilters } from "./owner-data";
import { parseParticipants, type Participant } from "./owner-state";
import { readTraining, type Trainee } from "./training";
export type DirectoryPerson = Participant & { name: string | null };
export type Position = { cursor: Record<string,string> | null; boundary: string | null };
export const FIRST: Position = { cursor: null, boundary: null };
export type Counts = Record<"pending"|"approved"|"suspended",number>;
export type DirectoryPage = { rows: DirectoryPerson[]; next: Position | null; counts: Counts; legacy: boolean };
export type ExamSummary = { exam: string; attempts: number; passed: number; known: number; wrong: { id: string; count: number }[] };
const statuses = ["pending", "approved", "suspended"] as const;
export async function directoryPage(client: SupabaseClient, search: string, status: string, position: Position): Promise<DirectoryPage> {
  const response = await client.rpc("owner_dashboard_v1", { p_view: "participants", p_search: search, p_status: status, p_cursor: position.cursor, p_boundary: position.boundary, p_limit: 20 });
  if (!response.error) {
    const p = response.data;
    const rows = parseParticipants(p?.rows);
    if (p?.version !== 1 || !Array.isArray(p.rows) || p.rows.length>20 || rows.length!==p.rows.length || !p.counts
      || !statuses.every(s=>Number.isSafeInteger(p.counts[s])&&p.counts[s]>=0) || !Number.isFinite(Date.parse(p.boundary))
      || (p.next!==null&&(!p.next||typeof p.next.id!=="string"||!["0","1","2"].includes(p.next.rank)))) throw new Error("Invalid directory");
    return { rows: rows.map((r,i)=>({...r,name:typeof p.rows[i].name==="string"?p.rows[i].name:null})), counts:p.counts, legacy:false,
      next:p.next ? {cursor:p.next,boundary:p.boundary}:null };
  }
  if (!["PGRST202","42883"].includes(response.error.code)) throw new Error("Directory unavailable");
  // Current live schema: bounded search RPC plus at most 20 bounded detail reads.
  // Visit status partitions sequentially, preserving pending-first across pages.
  const index = status ? statuses.indexOf(status as typeof statuses[number]) : Number(position.cursor?.partition ?? 0);
  const active = status || statuses[index];
  const page = await readTraining(client,{view:"people",scope:"all",search,status:active,cursor:position.cursor?.id?{id:position.cursor.id}:null,boundary:position.boundary});
  const rows = await Promise.all((page.rows as Trainee[]).map(async person=> {
    const detail = await readOwnerPage(args=>client.rpc("owner_page_v1",args),"participants",{...EMPTY_FILTERS,participant:person.id},null,page.boundary,false,1);
    const parsed = parseParticipants(detail.rows)[0];
    if (!parsed) throw new Error("Missing participant");
    return {...parsed,name:person.name};
  }));
  const counts: Counts = {pending:0,approved:0,suspended:0};
  // HEAD only: no participant rows transferred. Counts are global on the fallback.
  await Promise.all(statuses.map(async s=>{
    const r=await client.from("profiles").select("user_id",{count:"exact",head:true}).eq("status",s);
    if(r.error||r.count===null) throw new Error("Counts unavailable"); counts[s]=r.count;
  }));
  const cursor = page.next ? {...page.next,partition:String(index)} : !status&&index<2 ? {partition:String(index+1)} : null;
  return {rows,counts,legacy:true,next:cursor?{cursor,boundary:page.boundary}:null};
}
export async function examSummaryPage(client:SupabaseClient, filters:OwnerFilters, position:Position) {
  const {data,error}=await client.rpc("owner_dashboard_v1",{p_view:"summary",p_participant:filters.participant||null,p_exam:filters.exam||null,p_from:filters.from||null,p_to:filters.to||null,p_cursor:position.cursor,p_boundary:position.boundary,p_limit:20});
  if(error) {if(["PGRST202","42883"].includes(error.code)) return null;throw new Error("Summary unavailable");}
  if(data?.version!==1||!Array.isArray(data.rows)||data.rows.length>20||!Number.isFinite(Date.parse(data.boundary))
    ||!data.rows.every((r:ExamSummary)=>typeof r.exam==="string"&&[r.attempts,r.passed,r.known].every(n=>Number.isSafeInteger(n)&&n>=0)&&r.passed<=r.known&&r.known<=r.attempts&&Array.isArray(r.wrong)&&r.wrong.length<=5&&r.wrong.every(w=>typeof w.id==="string"&&Number.isSafeInteger(w.count)&&w.count>=0))
    ||(data.next!==null&&typeof data.next?.exam!=="string")) throw new Error("Invalid summary");
  return {rows:data.rows as ExamSummary[],next:data.next?{cursor:data.next,boundary:data.boundary} as Position:null};
}
