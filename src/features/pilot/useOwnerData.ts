"use client";

import { useEffect, useState } from "react";
import { getPilotClient } from "./client";
import { type Cursor, type OwnerFilters, type OwnerPage, type OwnerStream, readOwnerPage } from "./owner-data";

export type OwnerData = { kind: "loading" } | { kind: "error" } | { kind: "ready"; page: OwnerPage };
/** Replaces the current page, never accumulates a table. Ignore late responses on filter/account changes. */
export function useOwnerData(enabled: boolean, version: number, stream: OwnerStream, filters: OwnerFilters, cursor: Cursor | null = null, boundary: string | null = null, limit = 20): OwnerData {
  const [result, setResult] = useState<{ key: string; data: OwnerData } | null>(null);
  const key = JSON.stringify([enabled, version, stream, filters, cursor, boundary, limit]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const client = await getPilotClient();
        if (!client) throw new Error("off");
        const page = await readOwnerPage(async (args) => {
          if (stream === "attempts") {
            const response = await client.rpc("owner_dashboard_v1", {p_view:"attempts",p_limit:args.p_limit,p_cursor:args.p_cursor,p_participant:args.p_participant,p_from:args.p_from,p_to:args.p_to,p_exam:args.p_exam,p_boundary:args.p_boundary});
            if (!response.error || !["PGRST202","42883"].includes(response.error.code)) return response;
          }
          return client.rpc("owner_page_v1", args);
        }, stream, filters, cursor, boundary, false, limit);
        if (!cancelled) setResult({ key, data: { kind: "ready", page } });
      } catch { if (!cancelled) setResult({ key, data: { kind: "error" } }); }
    })();
    return () => { cancelled = true; };
    // key captures every serializable request parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return enabled && result?.key === key ? result.data : { kind: "loading" };
}
