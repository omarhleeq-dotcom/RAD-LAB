import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { expect, it } from "vitest";

const source = readFileSync("scripts/pilot/live-service-check.js", "utf8");
const owner = "00000000-0000-0000-0000-000000000001", participant = "00000000-0000-0000-0000-000000000002";
const token = "synthetic-session-token-never-log", publicKey = "sb_publishable_synthetic_test_public_key";
type Failure = "expired" | "leaked-profile" | "leaked-attempt" | "scope-allowed" | "false-denial" | "missing-name" | "wrong-auth" | "missing-target" | "network";
async function run(role: "owner" | "participant", options: { failure?: Failure; key?: string; target?: string; noSession?: boolean } = {}) {
  const id = role === "owner" ? owner : participant, other = options.target ?? (role === "owner" ? participant : owner);
  const calls: { url: URL; method: string; body: Record<string, unknown> | null }[] = [], output: string[] = [];
  const answers = [options.key ?? publicKey, other];
  await runInNewContext(source, {
    location: { protocol: "https:", hostname: "owner-existing-application.test" },
    localStorage: { getItem: (key: string) => { expect(key).toBe("sb-vlacestfruxooznrcjqc-auth-token"); return options.noSession ? null : JSON.stringify({ access_token: token, user: { id } }); } },
    prompt: () => answers.shift(), URL, AbortSignal, TextEncoder, Uint8Array, crypto: webcrypto,
    console: { log: (message: string) => output.push(message) },
    fetch: async (input: string, init: RequestInit) => {
      const url = new URL(input), method = init.method ?? "GET", body = init.body ? JSON.parse(String(init.body)) : null;
      expect(url.origin).toBe("https://vlacestfruxooznrcjqc.supabase.co");
      expect(init).toMatchObject({ credentials: "omit", redirect: "error", cache: "no-store" });
      expect(init.headers).toMatchObject({ Authorization: `Bearer ${token}`, apikey: publicKey });
      expect(["GET", "POST"]).toContain(method);
      if (method === "POST") {
        expect(url.pathname).toBe("/rest/v1/rpc/training_page_v1");
        expect(body).toMatchObject({ p_view: "summary", p_limit: 1, p_cursor: null, p_boundary: null });
      } else if (url.pathname !== "/auth/v1/user") {
        expect(["/rest/v1/profiles", "/rest/v1/attempts"]).toContain(url.pathname);
        expect(url.searchParams.get("limit")).toBe("1");
      }
      calls.push({ url, method, body });
      if (options.failure === "network") throw new Error("synthetic private network message " + token);
      if (options.failure === "expired") return Response.json({ code: "expired", message: token }, { status: 401 });
      if (url.pathname === "/auth/v1/user") return Response.json({ id: options.failure === "wrong-auth" ? other : id, email: "never-log@example.test" });
      if (url.pathname === "/rest/v1/profiles") {
        const self = url.searchParams.get("user_id") === `eq.${id}`;
        if (self) return Response.json([{ status: "approved", role, participant_code: "private-code", consent_version: "2026-10-19", ...(options.failure === "missing-name" ? {} : { display_name: "Private name" }) }]);
        if (role === "owner") return Response.json(options.failure === "missing-target" ? [] : [{ user_id: other, role: "participant", status: "approved" }]);
        return Response.json(options.failure === "leaked-profile" ? [{ user_id: other }] : []);
      }
      if (url.pathname === "/rest/v1/attempts") return Response.json(options.failure === "leaked-attempt" ? [{ id: "private-attempt" }] : []);
      if (role === "participant" && (body.p_scope === "all" || body.p_user !== id) && options.failure !== "scope-allowed") {
        return Response.json({ code: options.failure === "false-denial" ? "XX000" : "42501", message: "never echo " + token }, { status: 403 });
      }
      return Response.json({ version: 1, boundary: "2026-10-18T00:00:00Z", rows: [], next: null,
        summary: { attempts: 2, exams: 1, trainees: body.p_scope === "all" && body.p_user === null ? 2 : null } });
    },
  });
  expect(output).toHaveLength(1);
  for (const privateValue of [token, publicKey, id, other, "never-log@example.test", "Private name", "private-code", "private-attempt"]) expect(output[0]).not.toContain(privateValue);
  return { result: JSON.parse(output[0]!.replace("RADLAB_SERVICE_CHECK ", "")), calls };
}

it("checks both reciprocal real-session paths without unbounded reads, data writes or credential output", async () => {
  const a = await run("owner"), b = await run("participant");
  expect(a.result).toMatchObject({ outcome: "PASS", role: "owner" });
  expect(b.result).toMatchObject({ outcome: "PASS", role: "participant", pair: a.result.pair });
  expect(a.result.pair).toMatch(/^[a-f0-9]{64}$/);
  expect(a.result.checks).toEqual(["auth_user", "own_profile", "own_training", "existing_approved_participant", "owner_all_training", "owner_selected_training"]);
  expect(b.result.checks).toEqual(["auth_user", "own_profile", "own_training", "participant_other_training_denied", "participant_all_training_denied", "other_profile_hidden", "other_attempts_hidden"]);
  expect(source).not.toContain("PILOT_SCHEMA_VERIFIED");
});
it.each(["expired", "leaked-profile", "leaked-attempt", "scope-allowed", "false-denial", "missing-name", "wrong-auth", "network"] as const)("stops without evidence or private output on %s", async (failure) => {
  const { result } = await run("participant", { failure });
  expect(result.outcome).toBe("STOP"); expect(result).not.toHaveProperty("pair");
});
it("requires the owner to verify that the paired participant really exists and is approved", async () => {
  expect((await run("owner", { failure: "missing-target" })).result.outcome).toBe("STOP");
});
it.each([{ key: "sb_secret_do_not_send" }, { target: participant }, { noSession: true }])("rejects unsafe setup before any request", async (options) => {
  const { result, calls } = await run("participant", options);
  expect(result.outcome).toBe("STOP"); expect(calls).toHaveLength(0);
});
