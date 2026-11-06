// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, createElement as h, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { useSavedSummary } from "./useSavedSummary";
import { CONSENT_VERSION } from "./consent";
import type { AccountState } from "./useAccount";

const mocks = vi.hoisted(() => ({ client: vi.fn(), account: undefined as AccountState | undefined }));
vi.mock("./client", () => ({ getPilotClient: mocks.client }));
vi.mock("./SessionGate", () => ({ useOptionalSessionAccount: () => mocks.account ? { state: mocks.account } : null }));
const user = "00000000-0000-0000-0000-000000000001", other = "00000000-0000-0000-0000-000000000002";
const signedIn = (id = user): AccountState => ({ kind: "signedIn", userId: id, email: "synthetic@example.test", consentVersion: CONSENT_VERSION, profile: { role: "participant", status: "approved", code: "SYN" } });
const summary = { attempts: 7, exams: 2, latest: "2026-11-05T00:00:00Z", trainees: null };
const payload = { version: 1, boundary: "2026-11-06T00:00:00Z", summary, rows: [], next: null };
const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }; globals.IS_REACT_ACT_ENVIRONMENT = true;
let latest: ReturnType<typeof useSavedSummary>, root: ReturnType<typeof createRoot> | undefined;
function Probe({ id = user }: { id?: string | null }) {
  const value = useSavedSummary(id);
  useEffect(() => { latest = value; });
  return h("p", null, JSON.stringify({ summary: value.summary, data: value.data, error: value.error }));
}
const settle = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
async function render(id: string | null = user) {
  if (!root) { const div = document.createElement("div"); document.body.append(div); root = createRoot(div); }
  await act(async () => root!.render(h(Probe, { id }))); await settle();
}
function transport() {
  const pending: { url: URL; signal?: AbortSignal | null; resolve: (r: Response) => void }[] = [];
  const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, global: { fetch: (input, init) => new Promise<Response>(resolve => pending.push({ url: new URL(String(input)), signal: init?.signal, resolve })) } });
  mocks.client.mockResolvedValue(client); mocks.account = signedIn();
  return pending;
}
async function reply(p: ReturnType<typeof transport>[number], data: unknown, status = 200) {
  await act(async () => p.resolve(new Response(JSON.stringify(data), { status }))); await settle();
}
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; document.body.innerHTML = ""; vi.useRealTimers(); vi.resetAllMocks(); });

it("shows successful counts before details, then refresh reads again and exposes new attempts", async () => {
  const pending = transport(); await render(); expect(latest.summary).toBeUndefined();
  await reply(pending[0]!, payload); expect(latest.summary).toEqual(summary); expect(latest.data).toBeUndefined();
  await reply(pending[1]!, []); expect(latest.data?.rows).toEqual([]);
  await act(async () => latest.refresh()); await settle(); expect(latest.data).toBeUndefined(); expect(latest.summary).toBeUndefined(); expect(pending).toHaveLength(3);
  await reply(pending[2]!, { ...payload, summary: { ...summary, attempts: 8 } }); expect(latest.summary?.attempts).toBe(8);
  const saved = { id: user, exam_id: "wrist-pa", case_id: "default", definition_version: "fixture", comparison_version: null,
    engine_version: "fixture/1", producer_version: "fixture/1", result_format_version: 1, finished_at: "2026-11-05T00:00:00Z",
    total: 99, passed: false, critical: ["marker"], categories: [] };
  await reply(pending[3]!, [saved]); expect(latest.data?.summary.attempts).toBe(8);
  expect(latest.data?.rows[0]).toMatchObject({ exam: "wrist-pa", result: { total: 99, passed: false } });
});
it("isolates identity and rejects old account responses even when transport ignores cancellation", async () => {
  const pending = transport(); await render(); const old = pending[0]!;
  mocks.account = signedIn(other); await render(other); expect(old.signal?.aborted).toBe(true); expect(latest.summary).toBeUndefined();
  expect(pending[1]!.url.pathname).toContain("rpc/");
  await reply(old, payload); expect(latest.summary).toBeUndefined(); expect(pending).toHaveLength(2);
  await reply(pending[1]!, payload); expect(latest.summary).toEqual(summary);
  await reply(pending[2]!, []); expect(latest.data).toBeDefined();
});
it("invalidates a same-user authorization generation and never reuses completed results", async () => {
  const pending = transport(); await render(); await reply(pending[0]!, payload); await reply(pending[1]!, []);
  mocks.account = signedIn(); await render(); expect(latest.data).toBeUndefined(); expect(latest.summary).toBeUndefined(); expect(pending).toHaveLength(3);
});
it.each(["signedOut", "suspended", "consent", "missingProvider"])("clears counts and cancels pending detail reads on %s revocation", async kind => {
  const pending = transport(); await render(); await reply(pending[0]!, payload); const detail = pending[1]!;
  const state = signedIn();
  mocks.account = kind === "missingProvider" ? undefined : kind === "signedOut" ? { kind: "signedOut" } : state.kind === "signedIn" ? { ...state, consentVersion: kind === "consent" ? null : CONSENT_VERSION, profile: { ...state.profile, status: kind === "consent" ? "approved" : "suspended" } } : state;
  await render(); expect(detail.signal?.aborted).toBe(true); expect(latest.summary).toBeUndefined(); expect(latest.data).toBeUndefined();
  await reply(detail, []); expect(latest.data).toBeUndefined(); expect(pending).toHaveLength(2);
});
it("bounds lazy client acquisition and rejects its late response", async () => {
  vi.useFakeTimers(); mocks.account = signedIn(); let resolve!: (v: null) => void;
  mocks.client.mockReturnValue(new Promise(r => { resolve = r; })); await render();
  await act(async () => vi.advanceTimersByTime(15_000)); await settle(); expect(latest.error).toBe("error");
  await act(async () => resolve(null)); await settle(); expect(latest.error).toBe("error"); expect(latest.data).toBeUndefined();
});
it("bounds the whole read, aborts transport and rejects late details after successful counts", async () => {
  vi.useFakeTimers(); const pending = transport(); await render(); await reply(pending[0]!, payload); expect(latest.summary).toEqual(summary);
  await act(async () => vi.advanceTimersByTime(15_000)); await settle(); expect(pending[1]!.signal?.aborted).toBe(true); expect(latest.summary).toBeUndefined(); expect(latest.error).toBe("error");
  await reply(pending[1]!, []); expect(latest.data).toBeUndefined();
});
it("clears counts on a backend access rejection and never retries a read automatically", async () => {
  const pending = transport(); await render(); await reply(pending[0]!, payload); await reply(pending[1]!, { code: "42501" }, 403);
  expect(latest.summary).toBeUndefined(); expect(latest.data).toBeUndefined(); expect(latest.error).toBe("denied"); expect(pending).toHaveLength(2);
});
it("cancels on unmount and reads fresh data on a later mount", async () => {
  const pending = transport(); await render(); const old = pending[0]!;
  await act(async () => root!.unmount()); root = undefined; expect(old.signal?.aborted).toBe(true);
  await reply(old, payload); await render(); expect(pending).toHaveLength(2); expect(latest.summary).toBeUndefined();
});
