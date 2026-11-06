import { getPilotClient } from "./client";
import { directoryPage, type DirectoryPage, type Position } from "./owner-dashboard-data";
import type { AccountState } from "./useAccount";

type Entry = { promise: Promise<DirectoryPage>; controller: AbortController; users: number };
// The shared SessionProvider state object is the authorization generation: a fresh
// profile/sign-in, even for the same user, cannot join an earlier generation.
// Only pending reads live here. No completed data or authorization is cached.
const pending = new WeakMap<AccountState, Map<string, Entry>>();
const stopped = () => new Error("Directory read cancelled or timed out");

/** One consumer's signal releases only its own interest. The last one cancels IO.
 * The deadline includes lazy client acquisition and works even if IO ignores abort. */
export function requestOwnerDirectory(account: AccountState, revision: number, search: string, status: string, position: Position, signal: AbortSignal): Promise<DirectoryPage> {
 if (signal.aborted || account.kind !== "signedIn" || account.profile.role !== "owner" || account.profile.status !== "approved") return Promise.reject(stopped());
 let reads = pending.get(account);
 if (!reads) { reads = new Map(); pending.set(account, reads); }
 // All wire arguments, including the fixed page size, are part of identity.
 const key = JSON.stringify([revision, search, status, position.cursor, position.boundary, 20]);
 let entry = reads.get(key);
 if (!entry) {
  const controller = new AbortController();
  const ownedReads = reads;
  const promise = new Promise<DirectoryPage>((resolve, reject) => {
   const fail = () => reject(stopped());
   controller.signal.addEventListener("abort", fail, { once: true });
   void (async () => {
    try {
     const client = await getPilotClient();
     if (!client || controller.signal.aborted) throw stopped();
     // directoryPage uses only rpc. Bind cancellation locally while keeping its
     // reviewed wire arguments and DTO parser byte-identical, and leave the
     // singleton client unchanged. Promise-only synthetic transports stay bounded.
     const reader = { rpc: (name: string, args: Record<string, unknown>) => {
      const call = client.rpc(name, args);
      return typeof call.abortSignal === "function" ? call.abortSignal(controller.signal) : call;
     } } as typeof client;
     const page = await directoryPage(reader, search, status, position);
     if (!controller.signal.aborted) resolve(page);
    } catch (error) { reject(error); }
   })();
  });
  entry = { promise, controller, users: 0 };
  const ownedEntry = entry;
  const timer = setTimeout(() => controller.abort(), 15_000);
  const clear = () => {
   clearTimeout(timer);
   if (ownedReads.get(key) === ownedEntry) ownedReads.delete(key);
  };
  void promise.then(clear, clear);
  reads.set(key, entry);
 }
 const shared = entry;
 shared.users++;
 return new Promise((resolve, reject) => {
  let released = false;
  const release = () => {
   if (released) return;
   released = true;
   signal.removeEventListener("abort", cancel);
   if (--shared.users === 0) {
    if (reads.get(key) === shared) reads.delete(key);
    shared.controller.abort();
   }
  };
  const cancel = () => { release(); reject(stopped()); };
  signal.addEventListener("abort", cancel, { once: true });
  void shared.promise.then(page => { if (!released) { release(); resolve(page); } }, error => { if (!released) { release(); reject(error); } });
 });
}
