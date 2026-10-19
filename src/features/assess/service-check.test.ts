import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { expect, it } from "vitest";

const source = readFileSync("scripts/pilot/assess-service-check.js", "utf8");
const owner = "00000000-0000-0000-0000-000000000001", participant = "00000000-0000-0000-0000-000000000002";
const token = "private-session-never-print", key = "sb_publishable_synthetic_public_key";
type Fault = "expired" | "network" | "wrong-auth" | "pending" | "missing-target" | "schema" | "missing-rpc" | "admin-leak" | "table-leak" | "anon-leak" | "false-denial" | "unassigned-leak" | "excess-page" | "bad-page";
async function run(role: "owner" | "participant", options: { fault?: Fault; target?: string | null; key?: string; noSession?: boolean; populated?: boolean; hidden?: boolean } = {}) {
  const id = role === "owner" ? owner : participant, other = role === "owner" ? participant : owner;
  const calls: { path: string; body: Record<string, unknown> | null; signed: boolean }[] = [], output: string[] = [];
  const prompts = [options.key ?? key, options.target === undefined ? other : options.target];
  await runInNewContext(source, {
    location: { protocol: "https:", hostname: "signed-in-application.test" }, URL, AbortSignal, TextEncoder, Uint8Array, crypto: webcrypto,
    prompt: () => prompts.shift(), console: { log: (line: string) => output.push(line) },
    localStorage: { getItem: (name: string) => {
      expect(name).toBe("sb-vlacestfruxooznrcjqc-auth-token");
      return options.noSession ? null : JSON.stringify({ access_token: token, user: { id } });
    } },
    fetch: async (input: string, init: RequestInit) => {
      const url = new URL(input), headers = init.headers as Record<string,string>, body = init.body ? JSON.parse(String(init.body)) : null;
      const signed = headers.Authorization === `Bearer ${token}`;
      expect(url.origin).toBe("https://vlacestfruxooznrcjqc.supabase.co");
      expect(init).toMatchObject({ credentials: "omit", redirect: "error", cache: "no-store" });
      expect(headers.apikey).toBe(key);
      if (body) {
        expect(init.method).toBe("POST");expect(headers["Content-Profile"]).toBe("assess");
        expect(["/rest/v1/rpc/owner_page_v1", "/rest/v1/rpc/assigned_version_v1"]).toContain(url.pathname);
        if (url.pathname.endsWith("owner_page_v1")) expect(body).toMatchObject({ p_limit: 1, p_after: null, p_context: null, p_search: "" });
      } else {
        expect(init.method).toBe("GET");
        if (url.pathname.startsWith("/rest/v1/")) expect(url.searchParams.get("limit")).toBe("1");
      }
      calls.push({ path: url.pathname, body, signed });
      if (options.fault === "network") throw new Error(token);
      if (options.fault === "expired") return Response.json({ message: token }, { status: 401 });
      if (url.pathname === "/auth/v1/user") return Response.json({ id: options.fault === "wrong-auth" ? other : id });
      if (url.pathname === "/rest/v1/profiles") {
        if (url.searchParams.get("user_id") === `eq.${id}`) return Response.json([{ role, status: options.fault === "pending" ? "pending" : "approved" }]);
        return Response.json(options.fault === "missing-target" ? [] : [{ user_id: other, role: "participant", status: "approved" }]);
      }
      if (options.fault === "schema") return Response.json({ code: "PGRST106", message: token }, { status: 406 });
      if (options.fault === "missing-rpc") return Response.json({ code: "PGRST202", message: token }, { status: 404 });
      const deny = () => Response.json({ code: options.fault === "false-denial" ? "XX000" : "42501", message: token }, { status: 403 });
      if (!signed) return options.fault === "anon-leak" ? Response.json({ version: 1, rows: [], next: null }) : deny();
      if (url.pathname.endsWith("assigned_version_v1")) return options.fault === "unassigned-leak" ? Response.json({ private: token }) : deny();
      if (url.pathname.endsWith("owner_page_v1")) {
        if (role === "participant" && options.fault !== "admin-leak") return deny();
        if (options.fault === "bad-page") return Response.json({ version: 2, rows: [], next: null });
        const kind = body.p_kind;
        const row = kind === "people" ? { id: participant, name: "private-name", email: "private@example.test", status: "approved" } :
          { id: "10000000-0000-0000-0000-000000000001", name: "private-group", track: "mixed", version: "1", revision: 1 };
        const rows = options.fault === "excess-page" ? [row,row] : options.populated ? [row] : [];
        return Response.json({ version: 1, rows, next: null });
      }
      expect(headers["Accept-Profile"]).toBe("assess");
      expect(["groups", "memberships", "versions", "assignments", "targets"]).toContain(url.pathname.split("/").at(-1));
      if (options.fault === "table-leak") return Response.json([]); // Even empty SELECT success is a failure.
      return options.hidden ? Response.json({ code: "PGRST205", message: token }, { status: 404 }) : deny();
    },
  });
  expect(output).toHaveLength(1);
  for (const value of [token,key,owner,participant,"private-name","private@example.test","private-group","10000000-0000-0000-0000-000000000001"]) expect(output[0]).not.toContain(value);
  return { result: JSON.parse(output[0]!.replace("RADLAB_ASSESS_SERVICE_CHECK ", "")), calls };
}
it("checks both approved roles, bounded pages, anonymous denial and all direct-table denials without writes or private output", async () => {
  const a = await run("owner", { populated: true }), b = await run("participant", { hidden: true });
  expect(a.result).toMatchObject({ outcome: "PASS", contract: "assess-b-service/1", role: "owner" });
  expect(b.result).toMatchObject({ outcome: "PASS", role: "participant", pair: a.result.pair });
  expect(a.result.pair).toMatch(/^[a-f0-9]{64}$/);
  expect(b.result.checks).toEqual(expect.arrayContaining(["participant_people", "anonymous_admin_denied", "unassigned_metadata_denied", "direct_targets_denied"]));
  expect(a.calls.filter(c => c.path.endsWith("owner_page_v1"))).toHaveLength(5);
  expect(source).not.toContain("PILOT_SCHEMA_VERIFIED");
});
it("accepts empty Assess without creating an exam or assignment", async () => {
  expect((await run("owner")).result.outcome).toBe("PASS");
});
it.each(["expired", "network", "wrong-auth", "pending", "schema", "missing-rpc", "anon-leak", "unassigned-leak", "table-leak", "excess-page", "bad-page"] as const)("stops safely for owner fault %s", async fault => {
  expect((await run("owner", { fault })).result).toMatchObject({ outcome: "STOP" });
});
it.each(["admin-leak", "false-denial"] as const)("rejects participant access fault %s", async fault => {
  const { result } = await run("participant", { fault });expect(result.outcome).toBe("STOP");expect(result).not.toHaveProperty("pair");
});
it("requires an existing approved counterpart in the owner run", async () => {
  expect((await run("owner", { fault: "missing-target" })).result).toMatchObject({ outcome: "STOP", code: "EXISTING_APPROVED_PARTICIPANT_REQUIRED" });
});
it.each([{ key: "sb_secret_never_send" }, { target: participant }, { target: "bad-id" }, { target: null }, { noSession: true }])("rejects invalid setup before network %s", async options => {
  const { result, calls } = await run("participant", options);expect(result.outcome).toBe("STOP");expect(calls).toHaveLength(0);
});
