import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { expect, it } from "vitest";

const source = readFileSync("scripts/pilot/comparison-service-check.js", "utf8");
const owner = "00000000-0000-0000-0000-000000000001", participant = "00000000-0000-0000-0000-000000000002";
const token = "private-synthetic-session-never-log", key = "sb_publishable_synthetic_test_public_key";
type Fault = "expired" | "network" | "wrong-auth" | "pending" | "missing-target" | "scope-allowed" | "false-denial"
  | "history-scope-allowed" | "history-false-denial" | "own-denied" | "missing-comparison" | "bad-identity" | "bad-format" | "bad-result" | "excess-rows" | "no-exams" | "no-history";
async function run(role: "owner" | "participant", options: { fault?: Fault; witness?: "null" | "v1" | "future"; publicKey?: string; target?: string | null; noSession?: boolean } = {}) {
  const id = role === "owner" ? owner : participant, other = role === "owner" ? participant : owner;
  const calls: { path: string; method: string; body: Record<string, unknown> | null }[] = [], output: string[] = [];
  const prompts = [options.publicKey ?? key, options.target === undefined ? other : options.target];
  await runInNewContext(source, {
    location: {protocol:"https:",hostname:"existing-owner-application.test"}, URL,AbortSignal,TextEncoder,Uint8Array,crypto:webcrypto,
    prompt: () => prompts.shift(),console:{log:(line: string) => output.push(line)},
    localStorage: {getItem:(name: string) => {
      expect(name).toBe("sb-vlacestfruxooznrcjqc-auth-token");
      return options.noSession ? null : JSON.stringify({access_token:token,user:{id}});
    }},
    fetch: async (input: string, init: RequestInit) => {
      const url = new URL(input), method = init.method!, body = init.body ? JSON.parse(String(init.body)) : null;
      expect(url.origin).toBe("https://vlacestfruxooznrcjqc.supabase.co");
      expect(init).toMatchObject({credentials:"omit",redirect:"error",cache:"no-store"});
      expect(init.headers).toMatchObject({Authorization:`Bearer ${token}`,apikey:key});
      expect(["GET","POST"]).toContain(method);
      if (method === "POST") {
        expect(url.pathname).toBe("/rest/v1/rpc/training_page_v1_with_comparison");
        expect(body).toMatchObject({p_limit:1,p_cursor:null,p_boundary:null});
        expect(["summary","exams","history"]).toContain(body.p_view);
      } else {
        expect(["/auth/v1/user","/rest/v1/profiles"]).toContain(url.pathname);
        if (url.pathname === "/rest/v1/profiles") expect(url.searchParams.get("limit")).toBe("1");
      }
      calls.push({path:url.pathname,method,body});
      if (options.fault === "network") throw new Error("private service exception " + token);
      if (options.fault === "expired") return Response.json({message:token},{status:401});
      if (url.pathname === "/auth/v1/user") return Response.json({id:options.fault === "wrong-auth" ? other : id,email:"private-synthetic@example.test"});
      if (url.pathname === "/rest/v1/profiles") {
        if (url.searchParams.get("user_id") === `eq.${id}`) return Response.json([{role,status:options.fault === "pending" ? "pending" : "approved"}]);
        return Response.json(options.fault === "missing-target" ? [] : [{user_id:other,role:"participant",status:"approved"}]);
      }
      if (options.fault === "own-denied" && body.p_scope === "own" && body.p_user === id) return Response.json({code:"42501"},{status:403});
      if (role === "participant" && (body.p_scope === "all" || body.p_user !== id) && options.fault !== "scope-allowed"
        && !(options.fault === "history-scope-allowed" && body.p_view === "history")) {
        return Response.json({code:options.fault === "false-denial" || (options.fault === "history-false-denial" && body.p_view === "history") ? "XX000" : "42501",message:token},{status:403});
      }
      const page = {version:1,boundary:"2026-10-18T00:00:00Z",rows:[] as unknown[],next:null,summary:null as unknown};
      if (body.p_view === "summary") page.summary = {attempts:2,exams:1,trainees:body.p_scope === "all" && body.p_user === null ? 2 : null};
      if (body.p_view === "exams" && options.fault !== "no-exams") page.rows = [{exam:"synthetic-exam",attempts:2,latest:page.boundary}];
      if (body.p_view === "history" && options.fault !== "no-history") {
        const row: Record<string,unknown> = {id:"10000000-0000-0000-0000-000000000001",exam:"synthetic-exam",case:"default",definition:"original-synthetic-hash",
          engine:"radlab-practice-evaluation/1",producer:"radlab-pilot-writer/1",format:1,time:page.boundary,
          comparison:options.witness === "v1" ? `radlab-comparison/1:${"a".repeat(64)}` : options.witness === "future" ? `radlab-comparison/2:${"b".repeat(64)}` : null,
          result:{total:73,passed:true,critical:[],categories:[{c:"synthetic",earned:7,weight:10}]}};
        if (options.fault === "missing-comparison") delete row.comparison;
        if (options.fault === "bad-identity") row.comparison = "invented-unversioned-value";
        if (options.fault === "bad-format") row.format = 2;
        if (options.fault === "bad-result") row.result = {total:"private invalid score"};
        page.rows = options.fault === "excess-rows" ? [row,row] : [row];
      }
      return Response.json(page);
    },
  });
  expect(output).toHaveLength(1);
  for (const value of [token,key,owner,participant,"private-synthetic@example.test","10000000-0000-0000-0000-000000000001","original-synthetic-hash","private invalid score","a".repeat(64)]) expect(output[0]).not.toContain(value);
  return {result:JSON.parse(output[0]!.replace("RADLAB_COMPARISON_SERVICE_CHECK ","")),calls};
}

it("reads the new RPC under reciprocal scopes and explicitly denies participant access to others in summary AND history", async () => {
  const a = await run("owner"), b = await run("participant");
  expect(a.result).toMatchObject({contract:"practice-comparison/1",outcome:"PASS",role:"owner",witness:"historical-null"});
  expect(b.result).toMatchObject({outcome:"PASS",role:"participant",pair:a.result.pair});
  expect(a.result.pair).toMatch(/^[a-f0-9]{64}$/);
  expect(b.result.checks).toEqual(expect.arrayContaining(["own_comparison_summary","comparison_history","participant_other_summary_denied","participant_all_summary_denied","participant_other_history_denied","participant_all_history_denied"]));
  expect(a.calls.some((c) => c.body?.p_view === "history" && c.body?.p_scope === "all" && c.body?.p_user === participant)).toBe(true);
  expect(b.calls.every((c) => c.method === "GET" || c.path === "/rest/v1/rpc/training_page_v1_with_comparison")).toBe(true);
  expect(source).not.toContain("PILOT_SCHEMA_VERIFIED");
});
it.each([["v1","identity-v1"],["future","future-identity"]] as const)("reports identity shape %s without claiming that it has validated fresh writing or comparison semantics", async (witness, label) => {
  expect((await run("participant",{witness})).result).toMatchObject({outcome:"PASS",witness:label});
});
it.each(["expired","network","wrong-auth","pending","scope-allowed","false-denial","history-scope-allowed","history-false-denial","own-denied","missing-comparison","bad-identity","bad-format","bad-result","excess-rows","no-exams","no-history"] as const)("stops safely on %s without printing evidence or private values", async (fault) => {
  const {result} = await run("participant",{fault});
  expect(result.outcome).toBe("STOP");expect(result).not.toHaveProperty("pair");
});
it("requires an existing approved target before owner-selected history", async () => {
  const {result,calls} = await run("owner",{fault:"missing-target"});
  expect(result).toMatchObject({outcome:"STOP",code:"EXISTING_APPROVED_PARTICIPANT_REQUIRED"});
  expect(calls.some((c) => c.body?.p_view === "history")).toBe(false);
});
it.each([{publicKey:"sb_secret_never_send"},{target:participant},{target:"not-a-uuid"},{target:null},{noSession:true}])("rejects unsafe/incomplete setup before any request: %s",async (options) => {
  const {result,calls} = await run("participant",options);
  expect(result.outcome).toBe("STOP");expect(calls).toHaveLength(0);
});
