// RAD-041 live isolation tool: mocked transport only (no network). PASS / FAIL / UNKNOWN per check and the no-secret output rule.
import { describe, expect, it } from "vitest";
import { exitCode, formatReport, loadAccounts, main, runPhase, type Accounts, type CheckResult, type Phase } from "../../../scripts/ops/rad041-live-isolation.mjs";

const URL_ = "https://abcdefghijklmnop.supabase.co";
const KEY = "sb_publishable_synthetic_local_test_123456";
const ACCOUNTS: Accounts = {
  A: { email: "alice.secret@example.test", password: "PW-alice-very-secret" },
  B: { email: "bob.secret@example.test", password: "PW-bob-very-secret" },
};
const ID = { A: "11111111-aaaa-4aaa-8aaa-111111111111", B: "22222222-bbbb-4bbb-8bbb-222222222222" };
const TOKEN = { A: "tok-A-SECRET-jwt", B: "tok-B-SECRET-jwt" };
const PAYLOAD = "ROW-PAYLOAD-SECRET";
const SECRETS = [...Object.values(ACCOUNTS).flatMap((a) => [a.email, a.password]), ...Object.values(ID), ...Object.values(TOKEN), PAYLOAD, KEY];

type Who = "A" | "B";
type Req = { method: string; path: string; who: Who | null; body: Record<string, unknown> | null };
type Override = (req: Req) => Response | "net" | undefined;

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(status === 204 || status === 201 ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
const denied = (status = 403) => json(status, { code: "42501", message: `permission denied ${PAYLOAD}` });

/** A healthy pilot API emulating the §9 policies, with per-test overrides. */
function server(states: Record<Who, string>, override: Override = () => undefined) {
  type Row = { user_id: string; type?: string };
  const rows: Record<"events" | "attempts" | "feedback", Row[]> = { events: [{ user_id: ID.A, type: "signed_in" }], attempts: [], feedback: [] };
  const writes = { events: 0, attempts: 0, feedback: 0 };
  const fetch = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    expect(init.headers.apikey).toBe(KEY);
    const path = url.slice(URL_.length);
    const auth = init.headers.authorization;
    const who: Who | null = auth === `Bearer ${TOKEN.A}` ? "A" : auth === `Bearer ${TOKEN.B}` ? "B" : null;
    const body = init.body ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    const o = override({ method: init.method, path, who, body });
    if (o === "net") throw new TypeError("fetch failed");
    if (o) return o;
    if (path.startsWith("/auth/v1/token")) {
      const k = (Object.keys(ACCOUNTS) as Who[]).find((w) => ACCOUNTS[w].email === body?.email && ACCOUNTS[w].password === body?.password);
      return k ? json(200, { access_token: TOKEN[k], user: { id: ID[k], email: ACCOUNTS[k].email } }) : json(400, { error: "invalid_grant" });
    }
    if (path.startsWith("/auth/v1/logout")) return json(204, null);
    const m = /^\/rest\/v1\/(\w+)(?:\?(.*))?$/.exec(path)!;
    const table = m[1] as "events" | "attempts" | "feedback" | "profiles";
    const query = m[2] ?? "";
    const q = new URLSearchParams(query);
    if (!who) return denied(401);
    const self = ID[who];
    if (table !== "profiles" && init.method === "POST") {
      const target = (body?.user_id as string | undefined) ?? self;
      if (states[who] !== "approved" || target !== self) return denied();
      rows[table].push({ user_id: target, type: body?.type as string | undefined });
      writes[table]++;
      return json(201, null);
    }
    const owner = q.get("user_id")?.replace("eq.", "");
    if (table === "profiles") return json(200, owner === self ? [{ status: states[who], role: "participant", payload: PAYLOAD }] : []);
    const visible = rows[table].filter((r) => r.user_id === self && r.user_id === owner && (!q.get("type") || r.type === q.get("type")?.replace("eq.", "")));
    if (init.method === "HEAD") return new Response(null, { status: 200, headers: { "content-range": visible.length ? `0-${visible.length - 1}/${visible.length}` : "*/0" } });
    return json(200, visible.slice(0, 1).map((r) => ({ ...r, payload: PAYLOAD })));
  };
  return { fetch, writes };
}

const STATES: Record<Phase, Record<Who, string>> = { pending: { A: "pending", B: "pending" }, approved: { A: "approved", B: "pending" }, suspended: { A: "suspended", B: "approved" } };
async function run(phase: Phase, override?: Override, states = STATES[phase]) {
  const s = server(states, override);
  const results = await runPhase({ phase, url: URL_, key: KEY, accounts: ACCOUNTS, fetch: s.fetch, timeoutMs: 1000 });
  const text = formatReport(phase, results).join("\n");
  for (const secret of SECRETS) expect(text).not.toContain(secret);
  return { results, text, writes: s.writes };
}
const of = (results: CheckResult[], n: number) => results.find((r) => r.n === n)!;
const insertTo = (table: string, extra: (r: Req) => boolean = () => true) => (r: Req) => r.method === "POST" && r.path.startsWith(`/rest/v1/${table}`) && extra(r);

describe("RAD-041 live isolation — healthy project", () => {
  it.each(["pending", "approved", "suspended"] as Phase[])("phase %s: all PASS, check 7 not run", async (phase) => {
    const { results, text, writes } = await run(phase);
    expect(results.every((r) => r.result === "PASS")).toBe(true);
    expect(text).toContain("7 restore: NOT RUN - see RAD-086 evidence");
    expect(text).toMatch(/TOTAL \d checks: PASS \d FAIL 0 UNKNOWN 0/);
    expect(exitCode(results)).toBe(0);
    expect(writes.events).toBe(phase === "approved" ? 1 : 0); // at most one synthetic heartbeat per run
    expect(writes.attempts + writes.feedback).toBe(0);
  });
});

type Case = { n: number; phase: Phase; fail: Override; unknown: Override };
const CASES: Case[] = [
  { n: 1, phase: "pending", fail: (r) => (!r.who && r.path.startsWith("/rest/v1/profiles") ? json(200, []) : undefined), unknown: (r) => (!r.who && r.path.startsWith("/rest/v1/") ? "net" : undefined) },
  { n: 2, phase: "pending", fail: (r) => (insertTo("events")(r) ? json(201, null) : undefined), unknown: (r) => (insertTo("events")(r) ? "net" : undefined) },
  { n: 3, phase: "approved", fail: (r) => (insertTo("events", (x) => !x.body?.user_id)(r) ? denied() : undefined), unknown: (r) => (insertTo("events", (x) => !x.body?.user_id)(r) ? "net" : undefined) },
  { n: 4, phase: "approved", fail: (r) => (insertTo("events", (x) => x.body?.user_id === ID.B)(r) ? json(201, null) : undefined), unknown: (r) => (insertTo("events", (x) => x.body?.user_id === ID.B)(r) ? json(500, { message: PAYLOAD }) : undefined) },
  { n: 5, phase: "approved", fail: (r) => (r.method === "GET" && r.path.startsWith(`/rest/v1/events?select=user_id&user_id=eq.${ID.B}`) ? json(200, [{ user_id: ID.B, payload: PAYLOAD }]) : undefined), unknown: (r) => (r.method === "GET" && r.path.includes(`user_id=eq.${ID.B}&limit=1`) ? "net" : undefined) },
  { n: 6, phase: "suspended", fail: (r) => (insertTo("feedback")(r) ? json(201, null) : undefined), unknown: (r) => (insertTo("attempts")(r) ? "net" : undefined) },
];

describe("RAD-041 live isolation — per-check FAIL and UNKNOWN", () => {
  it.each(CASES)("check $n: FAIL when the policy leaks, UNKNOWN on network error", async ({ n, phase, fail, unknown }) => {
    const f = await run(phase, fail);
    expect(of(f.results, n).result).toBe("FAIL");
    expect(f.text).toMatch(new RegExp(`^${n} .*: FAIL`, "m"));
    expect(exitCode(f.results)).toBe(1);
    const u = await run(phase, unknown);
    expect(of(u.results, n).result).toBe("UNKNOWN");
    expect(u.results.some((r) => r.result === "PASS" && r.n === n)).toBe(false);
  });

  it("check 3 FAILs when the heartbeat count does not rise by exactly one", async () => {
    let heads = 0;
    const { results } = await run("approved", (r) => (r.method === "HEAD" ? new Response(null, { status: 200, headers: { "content-range": `*/${heads++ === 0 ? 3 : 5}` } }) : undefined));
    expect(of(results, 3)).toMatchObject({ result: "FAIL" });
  });
  it("check 5 in the suspended phase reads A's rows as B", async () => {
    const { results } = await run("suspended", (r) => (r.who === "B" && r.method === "GET" && r.path.startsWith(`/rest/v1/profiles?select=user_id&user_id=eq.${ID.A}`) ? json(200, [{ user_id: ID.A }]) : undefined));
    expect(of(results, 5).result).toBe("FAIL");
    expect(of(results, 6).result).toBe("PASS");
  });
  it("check 6 FAILs when a suspended account cannot read its own profile, UNKNOWN when it has no rows yet", async () => {
    const f = await run("suspended", (r) => (r.who === "A" && r.method === "GET" && r.path.startsWith("/rest/v1/profiles?select=status&") ? json(200, []) : undefined));
    expect(of(f.results, 6).result).toBe("FAIL");
    const u = await run("suspended", (r) => (r.who === "A" && r.method === "HEAD" ? new Response(null, { status: 200, headers: { "content-range": "*/0" } }) : undefined));
    expect(of(u.results, 6).result).toBe("UNKNOWN");
  });
  it("a non-RLS error (constraint, quota, 5xx) is UNKNOWN, never PASS", async () => {
    const { results } = await run("pending", (r) => (insertTo("events")(r) ? json(400, { code: "23514", message: PAYLOAD }) : undefined));
    expect(of(results, 2)).toMatchObject({ result: "UNKNOWN", why: "HTTP 400 23514" });
  });
});

describe("RAD-041 live isolation — state is observed, never changed", () => {
  it("state mismatch makes every account check UNKNOWN and writes nothing", async () => {
    const { results, writes, text } = await run("pending", undefined, { A: "approved", B: "pending" });
    expect(results.slice(1).every((r) => r.result === "UNKNOWN")).toBe(true);
    expect(text).toContain("state: A is approved, phase needs pending");
    expect(writes.events).toBe(0);
  });
  it("an owner account, a shared account or a suspended B stops the phase", async () => {
    const owner = await run("approved", (r) => (r.path.startsWith("/rest/v1/profiles?select=status,role") && r.who === "A" ? json(200, [{ status: "approved", role: "owner" }]) : undefined));
    expect(owner.text).toContain("A is not a synthetic participant; STOP");
    expect(owner.writes.events).toBe(0);
    const b = await run("approved", undefined, { A: "approved", B: "suspended" });
    expect(b.results.slice(1).every((r) => r.result === "UNKNOWN")).toBe(true);
  });
  it("never calls a status-changing RPC or a non-public endpoint", async () => {
    const paths: string[] = [];
    for (const phase of ["pending", "approved", "suspended"] as Phase[]) await run(phase, (r) => { paths.push(`${r.method} ${r.path}`); return undefined; });
    expect(paths.some((p) => /rpc|set_participant_status|PATCH|DELETE|admin/.test(p))).toBe(false);
  });
  it("sign-in failure or timeout is UNKNOWN", async () => {
    const { results } = await run("approved", (r) => (r.path.startsWith("/auth/v1/token") ? "net" : undefined));
    expect(results.slice(1).every((r) => r.result === "UNKNOWN")).toBe(true);
    expect(exitCode(results)).toBe(2);
  });
});

describe("RAD-041 live isolation — inputs and output", () => {
  const file = JSON.stringify(ACCOUNTS);
  const opts = (mode: number, uid = 1000) => ({ stat: () => ({ isFile: () => true, mode: 0o100000 | mode, uid }), read: () => file, uid: 1000 });
  it("requires mode 600, an owner match and two distinct accounts", () => {
    expect(loadAccounts("/x", opts(0o600))).toEqual(ACCOUNTS);
    expect(() => loadAccounts("/x", opts(0o644))).toThrow("mode 600");
    expect(() => loadAccounts("/x", opts(0o600, 0))).toThrow("owned by you");
    expect(() => loadAccounts(undefined)).toThrow("RAD041_ACCOUNTS_FILE");
    expect(() => loadAccounts("/x", { ...opts(0o600), read: () => JSON.stringify({ A: ACCOUNTS.A, B: ACCOUNTS.A }) })).toThrow("different");
  });
  it("refuses a secret key and prints no secret anywhere in a full interactive run", async () => {
    const lines: string[] = [];
    const env = { NEXT_PUBLIC_SUPABASE_URL: URL_, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: KEY, RAD041_ACCOUNTS_FILE: "/x" };
    for (const phase of ["pending", "approved", "suspended"]) {
      const s = server(STATES[phase as Phase]);
      expect(await main({ env, fetch: s.fetch, ask: async () => phase, print: (l) => lines.push(l), loadOptions: opts(0o600) })).toBe(0);
    }
    expect(await main({ env: { ...env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abcdefghijklmnopqrstuvwxyz" }, ask: async () => "pending", print: (l) => lines.push(l), loadOptions: opts(0o600) })).toBe(3);
    expect(await main({ env, ask: async () => "drop", print: (l) => lines.push(l), loadOptions: opts(0o600), fetch: async () => { throw new Error("must not be called"); } })).toBe(3);
    const all = lines.join("\n");
    for (const secret of [...SECRETS, "sb_secret_"]) expect(all).not.toContain(secret);
    expect(all).toContain("STOP: unknown phase; nothing was sent");
  });
});
