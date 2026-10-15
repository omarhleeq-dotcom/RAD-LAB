"use client";

import { useEffect, useState } from "react";
import { getPilotClient } from "./client";
import { type Cursor, type OwnerFilters, type OwnerPage, type OwnerStream, readOwnerPage } from "./owner-data";

export type OwnerData = { kind: "loading" } | { kind: "error" } | { kind: "ready"; page: OwnerPage };
/** Replaces the current page, never accumulates a table. Ignore late responses on filter/account changes. */
export function useOwnerData(enabled: boolean, version: number, stream: OwnerStream, filters: OwnerFilters, cursor: Cursor | null = null, boundary: string | null = null): OwnerData {
  const [result, setResult] = useState<{ key: string; data: OwnerData } | null>(null);
  const key = JSON.stringify([enabled, version, stream, filters, cursor, boundary]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = await getPilotClient();
        if (!client) throw new Error("off");
        const page = await readOwnerPage((args) => client.rpc("owner_page_v1", args), stream, filters, cursor, boundary);
        if (!cancelled) setResult({ key, data: { kind: "ready", page } });
      } catch { if (!cancelled) setResult({ key, data: { kind: "error" } }); }
    })();
    return () => { cancelled = true; };
    // key captures every serializable request parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return enabled && result?.key === key ? result.data : { kind: "loading" };
}
