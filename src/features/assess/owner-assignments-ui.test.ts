// @vitest-environment jsdom
import { act } from "react";
import { jsx } from "react/jsx-runtime";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { OwnerAssignments } from "./OwnerAssignments";
const mock = vi.hoisted(() => ({ state: { kind: "signedIn", userId: "owner-a", profile: { role: "owner", status: "approved" } }, client: vi.fn() }));
vi.mock("@/features/pilot/SessionGate", () => ({ useSessionAccount: () => ({ state: mock.state }) }));
vi.mock("@/features/pilot/client", () => ({ getPilotClient: mock.client }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const raw = (n: number, revision = 1, closed_at: string | null = null) => ({ id: id(n), name: `Assessment ${n}`, revision, closed_at });
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
let host: HTMLDivElement, root: Root;
const tick = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); };
const button = (name: string) => [...host.querySelectorAll("button")].find(b => b.textContent === name)!;
async function click(name: string) { expect(button(name)).toBeDefined(); await act(async () => { button(name).click(); }); await tick(); }
async function mount(locale: "en" | "ar" = "en") {
  await act(async () => root.render(jsx(NextIntlClientProvider, { locale, messages: locale === "en" ? en : ar, children: jsx(OwnerAssignments, {}) })));
  await tick();
}
beforeEach(() => { mock.state = { kind: "signedIn", userId: "owner-a", profile: { role: "owner", status: "approved" } }; mock.client.mockReset(); host = document.createElement("div"); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
function api(fetcher: typeof fetch) {
  mock.client.mockResolvedValue(createClient("https://synthetic.supabase.co", "public-test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } }));
}
it("requires two steps, Keep open does not write, closes with revision and displays UTC without a reopen control", async () => {
  let writes = 0;
  api(async (input, init) => {
    if (String(input).endsWith("assignment_close_v2")) { writes++; expect(JSON.parse(String(init?.body))).toEqual({ p_assignment: id(1), p_revision: 1 }); return json(null); }
    return json({ rows: [raw(1, writes ? 2 : 1, writes ? "2026-10-29T19:00:00Z" : null)], next: null });
  });
  await mount(); const t = en.ownerAssignments;
  await click(t.close); expect(writes).toBe(0); expect(host.textContent).toContain("Closure is final");
  expect(host.textContent).toContain("does not end the group or delete results");
  await click(t.keep); expect(writes).toBe(0); expect(button(t.confirm)).toBeUndefined();
  await click(t.close); await click(t.confirm); expect(writes).toBe(1);
  expect(host.querySelector("time")?.dateTime).toBe("2026-10-29T19:00:00Z");
  expect(host.textContent).toContain("2026-10-29T19:00:00.000Z"); expect(button(t.close)).toBeUndefined();
});
it("keeps page20 cursor, re-reads stale revisions on the same page and requires a new explicit confirmation", async () => {
  const reads: unknown[] = [], revisions: number[] = [];
  api(async (input, init) => {
    const p = JSON.parse(String(init?.body));
    if (String(input).endsWith("assignment_close_v2")) { revisions.push(p.p_revision); return revisions.length === 1 ? json({ code: "40001" }, 400) : json(null); }
    reads.push(p); return json(p.p_after ? { rows: [raw(21, revisions.length ? 2 : 1)], next: null } : { rows: Array.from({ length: 20 }, (_, i) => raw(i + 1)), next: id(20) });
  });
  await mount(); const t = en.ownerAssignments;
  await click(t.next); expect(host.textContent).toContain("Assessment 21");
  await click(t.close); await click(t.confirm);
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(t.conflict);
  expect(revisions).toEqual([1]); expect(reads.at(-1)).toEqual({ p_group: null, p_after: id(20), p_limit: 20 });
  expect(button(t.confirm)).toBeUndefined();
  await click(t.close); await click(t.confirm); expect(revisions).toEqual([1, 2]);
  await click(t.first); expect(host.querySelectorAll("li")).toHaveLength(20);
});
it("locks duplicate confirms; ambiguous result hides actions until an explicit read, with no automatic read or write", async () => {
  let reads = 0, writes = 0, committed = false;
  let finish!: () => void;
  api(async input => {
    if (String(input).endsWith("assignment_close_v2")) { writes++; committed = true; await new Promise<void>(r => { finish = r; }); throw new TypeError("ACK lost"); }
    reads++; return json({ rows: [raw(1, committed ? 2 : 1, committed ? "2026-10-29T19:00:00Z" : null)], next: null });
  });
  await mount(); const t = en.ownerAssignments;
  await click(t.close);
  const confirm = button(t.confirm);
  await act(async () => { confirm.click(); confirm.click(); });
  expect(writes).toBe(1);
  await act(async () => finish()); await tick();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(t.ambiguous);
  expect(reads).toBe(1); expect(writes).toBe(1); expect(button(t.close)).toBeUndefined();
  await click(t.read); expect(reads).toBe(2); expect(writes).toBe(1); expect(host.querySelector("time")).not.toBeNull();
});
it("never mounts controls or reads for participants (including appointed supervisors), unapproved owners or signed-out users", async () => {
  for (const [kind, role, status] of [["signedIn", "participant", "approved"], ["signedIn", "owner", "suspended"], ["signedOut", "owner", "approved"]] as const) {
    mock.state = { kind, userId: "student", profile: { role, status } }; await mount(); expect(host.textContent).toBe("");
  }
  expect(mock.client).not.toHaveBeenCalled();
});
it("renders Arabic confirmation and discards in-flight responses on owner/session changes", async () => {
  let resolve!: (response: Response) => void;
  api(async () => json({ rows: [raw(1)], next: null }));
  await mount("ar"); await click(ar.ownerAssignments.close); expect(host.textContent).toContain("الإغلاق نهائي");
  api(async () => new Promise<Response>(r => { resolve = r; }));
  await click(ar.ownerAssignments.read);
  mock.state = { kind: "signedIn", userId: "student", profile: { role: "participant", status: "approved" } };
  await mount("ar"); await act(async () => resolve(json({ rows: [raw(1)], next: null }))); await tick();
  expect(host.textContent).toBe("");
});
