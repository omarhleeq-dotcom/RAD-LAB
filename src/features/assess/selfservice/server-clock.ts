"use client";
import { useMemo, useSyncExternalStore } from 'react';

function createClock(sample: { serverTime: string | undefined; response: unknown }) {
 const epoch = Date.parse(sample.serverTime ?? '');
 let received: number | undefined, snapshot = epoch;
 const read = () => epoch + (received === undefined ? 0 : Math.max(0, performance.now() - received));
 return {
  read,
  snapshot: () => snapshot,
  serverSnapshot: () => epoch,
  subscribe: (notify: () => void) => {
   if (!Number.isFinite(epoch)) return () => {};
   received ??= performance.now();
   const advance = () => { snapshot = read(); notify(); };
   const visible = () => { if (document.visibilityState === 'visible') advance(); };
   const timer = setInterval(advance, 250);
   document.addEventListener('visibilitychange', visible);
   return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  },
 };
}

/** Display/validation only; DB checks remain authoritative. A fresh response,
 * including an identical timestamp, replaces the anchor. Existing session
 * visibility rebinding obtains fresh responses. Ticks never issue RPCs.
 */
export function useServerClock(serverTime: string | undefined, response: unknown) {
 const store = useMemo(() => createClock({ serverTime, response }), [serverTime, response]);
 const nowMs = useSyncExternalStore(store.subscribe, store.snapshot, store.serverSnapshot);
 return { nowMs, clock: store.read };
}
