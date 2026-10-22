import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { expect, it } from "vitest";

const source = readFileSync("scripts/pilot/assess-close-assignment.js", "utf8");
const owner = "00000000-0000-0000-0000-000000000001", assignment = "00000000-0000-0000-0000-0000000000aa";
const token = "synthetic-session-token-never-log", publicKey = "sb_publishable_synthetic_test_public_key";
type Failure = "expired" | "wrong-auth" | "not-owner" | "denied" | "body" | "network";
async function run(options: { failure?: Failure; key?: string; target?: string | null; noSession?: boolean; declined?: boolean } = {}) {
  const calls: { url: URL; method: string; body: Record<string, unknown> | null; headers: Record<string, string> }[] = [], output: string[] = [];
  const answers = [options.key ?? publicKey, options.target === undefined ? assignment : options.target];
  await runInNewContext(source, {
    location: { protocol: "https:", hostname: "owner-existing-application.test" },
    localStorage: { getItem: (key: string) => { expect(key).toBe("sb-vlacestfruxooznrcjqc-auth-token"); return options.noSession ? null : JSON.stringify({ access_token: token, user: { id: owner } }); } },
    prompt: () => answers.shift(), confirm: () => !options.declined,
    URL, AbortSignal, TextEncoder, Uint8Array, crypto: webcrypto,
    console: { log: (message: string) => output.push(message) },
    fetch: async (input: string, init: RequestInit) => {
      const url = new URL(input), method = init.method ?? "GET", body = init.body ? JSON.parse(String(init.body)) : null;
      expect(url.origin).toBe("https://vlacestfruxooznrcjqc.supabase.co");
      expect(init).toMatchObject({ credentials: "omit", redirect: "error", cache: "no-store" });
      expect(init.headers).toMatchObject({ Authorization: `Bearer ${token}`, apikey: publicKey });
      calls.push({ url, method, body, headers: init.headers as Record<string, string> });
      if (options.failure === "network") throw new Error("synthetic private network message " + token);
      if (options.failure === "expired") return Response.json({ code: "expired", message: token }, { status: 401 });
      if (url.pathname === "/auth/v1/user") return Response.json({ id: options.failure === "wrong-auth" ? assignment : owner, email: "never-log@example.test" });
      if (url.pathname === "/rest/v1/profiles") return Response.json([{ status: "approved", role: options.failure === "not-owner" ? "participant" : "owner" }]);
      if (options.failure === "denied") return Response.json({ code: "42501", message: "never echo " + token }, { status: 403 });
      return options.failure === "body" ? Response.json({ unexpected: true }, { status: 200 }) : new Response(null, { status: 204 });
    },
  });
  expect(output).toHaveLength(1);
  for (const privateValue of [token, publicKey, owner, assignment, "never-log@example.test"]) expect(output[0]).not.toContain(privateValue);
  return { result: JSON.parse(output[0]!.replace("RADLAB_ASSIGNMENT_CLOSE ", "")), calls };
}

it("verifies the signed-in owner then closes exactly one assignment with one write and no identifier output", async () => {
  const { result, calls } = await run();
  expect(result).toMatchObject({ outcome: "PASS", version: 1 });
  expect(result.assignment).toMatch(/^[a-f0-9]{16}$/);
  expect(calls.map(c => `${c.method} ${c.url.pathname}`)).toEqual(["GET /auth/v1/user", "GET /rest/v1/profiles", "POST /rest/v1/rpc/close_assignment_v1"]);
  expect(calls[2]!.body).toEqual({ p_assignment: assignment });
  expect(calls[2]!.headers).toMatchObject({ "Content-Profile": "assess" });
  expect(calls.filter(c => c.method === "POST")).toHaveLength(1);
});
it.each(["expired", "wrong-auth", "not-owner", "denied", "body", "network"] as const)("stops without private output on %s", async (failure) => {
  const { result, calls } = await run({ failure });
  expect(result.outcome).toBe("STOP");
  expect(calls.filter(c => c.method === "POST").length).toBe(failure === "denied" || failure === "body" ? 1 : 0);
});
it.each([{ key: "sb_secret_do_not_send" }, { noSession: true }, { target: "not-a-uuid" }, { target: null }, { declined: true }])("rejects unsafe setup before any request or write: %j", async (options) => {
  const { result, calls } = await run(options);
  expect(result.outcome).toBe("STOP"); expect(calls).toHaveLength(0);
});
it("never reads a password, service key or accepts a user id", () => {
  expect(source).not.toMatch(/\.password|service_role|p_user|p_users/);
});
