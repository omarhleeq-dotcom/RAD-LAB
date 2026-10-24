// Deferred until the owner DB day. This module must remain unreachable from client roots.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OwnerFilters } from "./owner-data";
import { parseParticipants } from "./owner-state";
import { directoryPage as currentDirectoryPage, type Position, type DirectoryPage, type ExamSummary } from "./owner-dashboard-data";
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
  return currentDirectoryPage(client,search,status,position);
}
export async function examSummaryPage(client:SupabaseClient, filters:OwnerFilters, position:Position) {
  const {data,error}=await client.rpc("owner_dashboard_v1",{p_view:"summary",p_participant:filters.participant||null,p_exam:filters.exam||null,p_from:filters.from||null,p_to:filters.to||null,p_cursor:position.cursor,p_boundary:position.boundary,p_limit:20});
  if(error) {if(["PGRST202","42883"].includes(error.code)) return null;throw new Error("Summary unavailable");}
  if(data?.version!==1||!Array.isArray(data.rows)||data.rows.length>20||!Number.isFinite(Date.parse(data.boundary))
    ||!data.rows.every((r:ExamSummary)=>typeof r.exam==="string"&&[r.attempts,r.passed,r.known].every(n=>Number.isSafeInteger(n)&&n>=0)&&r.passed<=r.known&&r.known<=r.attempts&&Array.isArray(r.wrong)&&r.wrong.length<=5&&r.wrong.every(w=>typeof w.id==="string"&&Number.isSafeInteger(w.count)&&w.count>=0))
    ||(data.next!==null&&typeof data.next?.exam!=="string")) throw new Error("Invalid summary");
  return {rows:data.rows as ExamSummary[],next:data.next?{cursor:data.next,boundary:data.boundary} as Position:null};
}
