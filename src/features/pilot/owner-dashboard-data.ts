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
/** DB day is deferred: use the installed bounded APIs directly, without probing future RPCs. */
export async function directoryPage(client: SupabaseClient, search: string, status: string, position: Position): Promise<DirectoryPage> {
  // Current live schema: bounded search RPC plus at most 20 bounded detail reads.
  // Visit status partitions sequentially, preserving pending-first across pages.
  let index = status ? statuses.indexOf(status as typeof statuses[number]) : Number(position.cursor?.partition ?? 0);
  const active = status || statuses[index];
  let page = await readTraining(client,{view:"people",scope:"all",search,status:active,cursor:position.cursor?.id?{id:position.cursor.id}:null,boundary:position.boundary});
  // Empty status partitions must not look like an empty search when another
  // status has a match. At most three bounded queries; never accumulate pages.
  while (!status && page.rows.length===0 && !page.next && index<statuses.length-1) {
    index++;
    page=await readTraining(client,{view:"people",scope:"all",search,status:statuses[index],cursor:null,boundary:page.boundary});
  }
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
/** Visible waiting state until the deferred SQL and frontend requirements are promoted together. */
export function examSummaryPage(_client:SupabaseClient, _filters:OwnerFilters, _position:Position): Promise<{rows:ExamSummary[];next:Position|null}|null> {
  return Promise.resolve(null);
}
