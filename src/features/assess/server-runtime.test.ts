import { beforeEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const pg = vi.hoisted(() => ({
  query: vi.fn(), release: vi.fn(), connect: vi.fn(), end: vi.fn(), on: vi.fn(), config: vi.fn(),
}));
vi.mock("pg", () => ({ Pool: class {
  constructor(config: unknown) { pg.config(config); }
  connect = pg.connect; end = pg.end; on = pg.on;
} }));
import { createWorkerBinding, runAssessJobs } from "./server-runtime";

const config = { host: "synthetic.invalid", port: 5432, database: "synthetic", user: "assess_runtime_test", password: "SYNTHETIC_SECRET", ca: "-----BEGIN CERTIFICATE-----synthetic" };
const id = "00000000-0000-0000-0000-000000000001";
beforeEach(() => {
  vi.resetAllMocks();
  pg.query.mockImplementation(async (sql: string) => ({ rows: sql.includes("as allowed") ? [{ allowed: true }] : [{ value: null }] }));
  pg.connect.mockImplementation(async () => ({ query: pg.query, release: pg.release }));
  pg.end.mockResolvedValue(undefined);
});

it("requires explicit TLS trust, a distinct login and bounded connections before opening a pool", () => {
  for (const patch of [{ ca: "" }, { user: "service_role" }, { host: "/tmp/socket" }, { connections: 0 }, { connections: 5 }, { password: "" }]) {
    expect(() => createWorkerBinding({ ...config, ...patch })).toThrow("invalid");
  }
  expect(pg.config).not.toHaveBeenCalled();
  createWorkerBinding(config);
  expect(pg.config).toHaveBeenCalledWith(expect.objectContaining({ ssl: { ca: config.ca, rejectUnauthorized: true }, max: 2 }));
  expect(pg.connect).not.toHaveBeenCalled();
});

it("rejects user RPCs, injected names, missing/extra keys and unsafe values before connection", async () => {
  const worker = createWorkerBinding(config);
  for (const [name, args] of [["consent_v2", { p_version: null }], ["claim_v1();select 1", {}], ["finish_v1", {}], ["claim_v1", { user: id }], ["maintain_v1", { p_limit: 101 }], ["fail_v1", { p_session: "injected", p_token: id }]] as const) {
    await expect(worker.call(name, args)).rejects.toMatchObject({ message: "invalid" });
  }
  expect(pg.connect).not.toHaveBeenCalled();
  await worker.close();
});

it("pins the role locally, parameterizes values and commits before returning", async () => {
  const worker = createWorkerBinding(config);
  await worker.call("finish_v1", { p_session: id, p_token: id, p_n: "10", p_d: "1" });
  expect(pg.query.mock.calls.map(call => call[0])).toEqual([
    "begin", expect.stringContaining("session_user = $1"), "set local role assess_worker", "set local search_path = ''",
    "set local statement_timeout = '60s'", "set local lock_timeout = '5s'",
    "select assess.finish_v1($1::uuid,$2::uuid,$3::text,$4::text) as value", "commit",
  ]);
  expect(pg.query).toHaveBeenCalledWith(expect.stringContaining("session_user = $1"), [config.user]);
  expect(pg.query).toHaveBeenCalledWith(expect.stringContaining("assess.finish_v1"), [id, id, "10", "1"]);
  expect(pg.release).toHaveBeenCalledWith(false);
  await worker.close();
});

it.each(["connect", "acl", "rpc", "commit", "rollback"])("redacts and discards on %s failure without replay", async stage => {
  const worker = createWorkerBinding(config);
  if (stage === "connect") pg.connect.mockRejectedValue(new Error("SYNTHETIC_SECRET claims answer"));
  pg.query.mockImplementation(async (sql: string) => {
    if (sql.includes("as allowed")) return { rows: [{ allowed: stage !== "acl" }] };
    if ((stage === "commit" && sql === "commit") || (["rpc", "rollback"].includes(stage) && sql.includes("assess.health_v1")) || (stage === "rollback" && sql === "rollback")) {
      throw { code: "XX000", message: "SYNTHETIC_SECRET claims answer", detail: id };
    }
    return { rows: [{ value: null }] };
  });
  await expect(worker.call("health_v1", {})).rejects.toMatchObject({ message: stage === "acl" ? "denied" : "unavailable" });
  expect(pg.query.mock.calls.filter(call => String(call[0]).includes("select assess.health_v1"))).toHaveLength(["connect", "acl"].includes(stage) ? 0 : 1);
  if (stage !== "connect") expect(pg.release).toHaveBeenCalledWith(true);
  await worker.close();
});

it("bounds pending work and closes once after checked-out work settles", async () => {
  let resolve!: () => void;
  const pending = new Promise<void>(done => { resolve = done; });
  pg.connect.mockImplementation(async () => { await pending; return { query: pg.query, release: pg.release }; });
  const worker = createWorkerBinding({ ...config, connections: 1 });
  const inFlight = worker.call("health_v1", {});
  await expect(worker.call("health_v1", {})).rejects.toMatchObject({ code: "limit" });
  // Model pg.end waiting for its checked-out connection.
  pg.end.mockImplementation(async () => { await inFlight; });
  const closed = worker.close();
  await expect(worker.call("health_v1", {})).rejects.toMatchObject({ code: "unavailable" });
  resolve(); await inFlight; await closed; await worker.close();
  expect(pg.end).toHaveBeenCalledTimes(1);
});

it("fails closed on idle pool error, without leaking the error or retrying", async () => {
  const worker = createWorkerBinding(config);
  pg.on.mock.calls[0]![1](new Error("SYNTHETIC_SECRET"));
  await expect(worker.call("health_v1", {})).rejects.toMatchObject({ message: "unavailable" });
  expect(pg.connect).not.toHaveBeenCalled(); await worker.close();
});

it("executes the binding's actual SQL and current maintenance on a new disposable DB under a restricted login", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    for (const file of readdirSync("supabase/migrations").filter(f => f.endsWith(".sql")).sort()) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    await db.exec(`create role assess_runtime_test login noinherit; grant assess_worker to assess_runtime_test; set session authorization assess_runtime_test;`);
    pg.query.mockImplementation((sql: string, values?: unknown[]) => db.query(sql, values));
    const worker = createWorkerBinding(config);
    expect(await runAssessJobs(worker, 1)).toMatchObject({ graded: 0, failed: 0, maintenance: { expired: 0, purged: 0 } });
    await expect(db.query("select * from assess.sessions")).rejects.toMatchObject({ code: "42501" });
    // No user identity was fabricated. SET LOCAL ROLE ended with the transaction.
    expect((await db.query<{ role: string }>("select current_user as role")).rows[0]!.role).toBe(config.user);
    await worker.close();
  } finally { await db.close(); }
});

it("builds and imports an inert Node artifact without the reference TS loader or credentials", () => {
  const build = spawnSync(process.execPath, ["scripts/assess/build-runtime.mjs"], { encoding: "utf8", timeout: 15000 });
  expect(build.status, build.stderr).toBe(0);
  const result = JSON.parse(build.stdout);
  expect(result).toMatchObject({ contract: "assess-runtime-build/1", runtimeOrLaunchVerified: false });
  const child = spawnSync(process.execPath, ["-e", "const r=require(process.argv[1]); if(typeof r.createWorkerBinding!=='function'||typeof r.runAssessJobs!=='function'||typeof r.installMixedContent!=='function')process.exit(1)", `${result.output}/assess-runtime.cjs`], { encoding: "utf8", timeout: 10000 });
  expect(child.status, child.stderr).toBe(0); expect(child.stdout).toBe("");
});
