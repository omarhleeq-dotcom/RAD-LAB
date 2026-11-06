import { afterEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountState } from "./useAccount";
import { FIRST } from "./owner-dashboard-data";
import { requestOwnerDirectory } from "./owner-directory-request";
// @ts-expect-error The manual Node browser harness is JavaScript, outside the TS app.
import { summarize } from "../../../scripts/qa/owner-directory-performance.mjs";
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("./client", () => ({ getPilotClient: mocks.client }));
const owner = (userId = "owner"): AccountState => ({ kind: "signedIn", userId, email: "synthetic@example.test", profile: { role: "owner", status: "approved", code: "SYN" }, consentVersion: null });
const envelope = { version: 1, rows: [], counts: { pending: 31, approved: 40, suspended: 2 }, boundary: "2026-11-06T00:00:00Z", next: null };
function deferred<T>() { let resolve!: (v:T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function transport() {
 const calls: { args: unknown; signal?: AbortSignal; response: ReturnType<typeof deferred<{ data: unknown; error: unknown }>> }[] = [];
 const rpc = vi.fn((_name: string, args: unknown) => {
  const call = { args, signal: undefined as AbortSignal|undefined, response: deferred<{ data: unknown; error: unknown }>() }; calls.push(call);
  return { abortSignal: (signal: AbortSignal) => { call.signal = signal; return call.response.promise; } };
 });
 mocks.client.mockResolvedValue({ rpc } as unknown as SupabaseClient);
 return calls;
}
const flush = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
const read = (account: AccountState, revision=0, search="", status="", position=FIRST, signal=new AbortController().signal) => requestOwnerDirectory(account, revision, search, status, position, signal);
afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });

it("reports repeatable samples without discarding request/byte counts or rounding p95 down", () => {
 expect(summarize([40,10,30,20].map(usableMs=>({usableMs,requests:1,bytes:64})))).toEqual({requests:[1,1,1,1],bytes:[64,64,64,64],medianMs:25,p95Ms:40});
});

it("shares cold matching wire arguments, keeps global counts and never reuses completed data", async () => {
 const calls=transport(), account=owner();
 const a=read(account), b=read(account); await flush(); expect(calls).toHaveLength(1);
 expect(calls[0]!.args).toEqual({ p_search:"",p_status:"",p_cursor:null,p_boundary:null,p_limit:20 });
 calls[0]!.response.resolve({ data:envelope,error:null });
 expect(await a).toEqual(await b); expect((await b).counts).toEqual(envelope.counts);
 const c=read(account); await flush(); expect(calls).toHaveLength(2);
 calls[1]!.response.resolve({ data:envelope,error:null }); await c;
});
it("separates filters, revision, cursor/boundary, accounts and same-user authorization generations", async () => {
 const calls=transport(), account=owner();
 const reads=[read(account),read(account,0,"needle"),read(account,0,"","pending"),read(account,1),read(account,0,"","",{cursor:{id:"next",rank:"1"},boundary:envelope.boundary}),read(account,0,"","",{cursor:null,boundary:envelope.boundary}),read(owner("other")),read(owner())];
 await flush(); expect(calls).toHaveLength(8);
 calls.forEach(c=>c.response.resolve({data:envelope,error:null}));
 expect((await Promise.all(reads)).every(p=>p.counts.pending===31)).toBe(true);
});
it("does not read for signed-out, denied or already cancelled consumers", async () => {
 transport(); const signal=AbortSignal.abort();
 for(const account of [{kind:"signedOut"}, {...owner(),profile:{role:"participant",status:"approved",code:"SYN"}}, {...owner(),profile:{role:"owner",status:"suspended",code:"SYN"}}] as AccountState[]) await expect(read(account)).rejects.toThrow();
 await expect(read(owner(),0,"","",FIRST,signal)).rejects.toThrow(); expect(mocks.client).not.toHaveBeenCalled();
});
it("partial unmount leaves the other consumer active; the final release aborts IO and prevents reuse", async () => {
 const calls=transport(), account=owner(), a=new AbortController(), b=new AbortController();
 const first=read(account,0,"","",FIRST,a.signal), second=read(account,0,"","",FIRST,b.signal);
 const rejected=expect(first).rejects.toThrow(); await flush(); a.abort(); await rejected;
 expect(calls[0]!.signal?.aborted).toBe(false);
 calls[0]!.response.resolve({data:envelope,error:null}); expect((await second).counts.pending).toBe(31);
 const abandoned=new AbortController(), third=read(account,0,"","",FIRST,abandoned.signal), failed=expect(third).rejects.toThrow(); await flush(); abandoned.abort(); await failed;
 expect(calls[1]!.signal?.aborted).toBe(true);
 const fourth=read(account); await flush(); expect(calls).toHaveLength(3);
 calls[1]!.response.resolve({data:{...envelope,counts:{pending:999,approved:0,suspended:0}},error:null});
 calls[2]!.response.resolve({data:envelope,error:null}); expect((await fourth).counts.pending).toBe(31);
});
it("bounds slow reads at 15s, rejects all consumers, ignores late responses and allows explicit refresh", async () => {
 vi.useFakeTimers(); const calls=transport(), account=owner();
 const a=read(account), b=read(account); const failures=[expect(a).rejects.toThrow(),expect(b).rejects.toThrow()];
 await flush(); await vi.advanceTimersByTimeAsync(14_999); expect(calls[0]!.signal?.aborted).toBe(false);
 await vi.advanceTimersByTimeAsync(1); await Promise.all(failures); expect(calls[0]!.signal?.aborted).toBe(true); expect(calls).toHaveLength(1);
 const refresh=read(account); await flush(); calls[0]!.response.resolve({data:{...envelope,counts:{pending:999,approved:0,suspended:0}},error:null});
 calls[1]!.response.resolve({data:envelope,error:null}); expect((await refresh).counts.pending).toBe(31); expect(vi.getTimerCount()).toBe(0);
});
it("bounds client acquisition too and never starts IO after cancellation or timeout", async () => {
 vi.useFakeTimers(); const client=deferred<SupabaseClient>(); mocks.client.mockReturnValue(client.promise);
 const rpc=vi.fn(), a=read(owner()), failure=expect(a).rejects.toThrow();
 await vi.advanceTimersByTimeAsync(15_000); await failure; client.resolve({rpc} as unknown as SupabaseClient); await flush(); expect(rpc).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});
it("propagates service/DTO errors without retry and clears the failed entry", async () => {
 const calls=transport(), account=owner();
 for (const response of [{data:null,error:{code:"42501"}}, {data:{...envelope,version:2},error:null}]) {
  const promise=read(account), failure=expect(promise).rejects.toThrow(); await flush(); calls.at(-1)!.response.resolve(response); await failure;
 }
 expect(calls).toHaveLength(2);
});
