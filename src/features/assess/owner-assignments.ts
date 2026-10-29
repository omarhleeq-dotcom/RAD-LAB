/** Owner-only UI binding to the already-applied M3/M4 RPCs. No authoring runtime. */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface OwnerAssignment { id: string; name: string; revision: number; closedAt: string | null }
export interface OwnerAssignmentPage { rows: OwnerAssignment[]; next: string | null }
export type AssignmentFailure = "conflict" | "denied" | "schema" | "invalid" | "unavailable" | "ambiguous";
export class OwnerAssignmentError extends Error {
  constructor(readonly kind: AssignmentFailure) { super("Owner assignments unavailable"); }
}
const uuid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const revision = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 1;
const invalid = (): never => { throw new OwnerAssignmentError("invalid"); };
export function parseOwnerAssignments(raw: unknown, after: string | null = null): OwnerAssignmentPage {
  if (!object(raw) || !Array.isArray(raw.rows) || raw.rows.length > 20) return invalid();
  let previous = after?.toLowerCase() ?? "";
  const rows = raw.rows.map(r => {
    if (!object(r) || !uuid(r.id) || r.id.toLowerCase() <= previous || typeof r.name !== "string" || !r.name.trim() || r.name.length > 200 || !revision(r.revision) ||
      !(r.closed_at === null || (typeof r.closed_at === "string" && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(r.closed_at) && Number.isFinite(Date.parse(r.closed_at))))) return invalid();
    previous = r.id.toLowerCase();
    return { id: r.id, name: r.name, revision: r.revision, closedAt: r.closed_at as string | null };
  });
  if (raw.next !== null && (!uuid(raw.next) || rows.length !== 20 || raw.next !== rows.at(-1)?.id)) return invalid();
  return { rows, next: raw.next as string | null };
}
function failure(code: string | undefined, status: number, write: boolean): OwnerAssignmentError {
  return new OwnerAssignmentError(code === "40001" ? "conflict" : code === "42501" || status === 401 || status === 403 ? "denied" :
    ["PGRST106", "PGRST202", "42883", "42P01"].includes(code ?? "") ? "schema" : code === "22023" ? "invalid" : write ? "ambiguous" : "unavailable");
}
export async function readOwnerAssignments(client: SupabaseClient, after: string | null, signal: AbortSignal): Promise<OwnerAssignmentPage> {
  if (after !== null && !uuid(after)) return invalid();
  try {
    const { data, error, status } = await client.schema("assess").rpc("assignment_page_v2", { p_group: null, p_after: after, p_limit: 20 }).retry(false).abortSignal(signal);
    if (error) throw failure(error.code, status, false);
    return parseOwnerAssignments(data, after);
  } catch (error) { throw error instanceof OwnerAssignmentError ? error : new OwnerAssignmentError("unavailable"); }
}
export async function closeOwnerAssignment(client: SupabaseClient, assignment: Pick<OwnerAssignment, "id" | "revision">, signal: AbortSignal): Promise<void> {
  if (!uuid(assignment.id) || !revision(assignment.revision)) return invalid();
  try {
    // Disable the SDK's default retry too: an ACK lost after COMMIT needs an explicit read.
    const { data, error, status } = await client.schema("assess").rpc("assignment_close_v2", { p_assignment: assignment.id, p_revision: assignment.revision }).retry(false).abortSignal(signal);
    if (error) throw failure(error.code, status, true);
    if (data !== null) throw new OwnerAssignmentError("ambiguous");
  } catch (error) { throw error instanceof OwnerAssignmentError ? error : new OwnerAssignmentError("ambiguous"); }
}
