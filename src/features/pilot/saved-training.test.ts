// Real evaluator -> real logger -> Supabase JS request -> PostgreSQL/RLS -> real
// training RPC/parser -> chart selector. HTTP/Auth are local adapters, NOT live Supabase.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { createClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { getCase } from "@/data/cases";
import { evaluate } from "@/features/evaluation/engine";
import { evaluationVersion, PRACTICE_EVALUATION_VERSION } from "@/features/evaluation/version";
import { createAttemptLogger, type Snapshot } from "./attempt-logger";
import { compactResult } from "./attempt-record";
import { comparableAttempts, comparisonMessage, readTraining, type TrainingAttempt } from "./training";

it("persists two genuine logger attempts and reads chart-eligible scores through bounded, isolated SQL", async () => {
  const db = new PGlite();
  const a = "00000000-0000-0000-0000-000000000001", b = "00000000-0000-0000-0000-000000000002";
  const requests: Record<string, unknown>[] = [], saved: string[] = [], failures: unknown[] = [];
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const dir = join(process.cwd(), "supabase/migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, file), "utf8"));
    for (const uid of [a, b]) await db.query("insert into auth.users values($1,'synthetic@example.test',now(),$2)", [uid, JSON.stringify({ consent_version: "2026-10-19" })]);
    await db.exec("update profiles set status='approved'");
    const login = async (uid: string) => {
      await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]); await db.exec("set role authenticated");
    };
    await login(a);
    const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, global: { fetch: async (input, init) => {
      const path = new URL(String(input)).pathname, body = JSON.parse(String(init?.body));
      try {
        if (path === "/rest/v1/rpc/training_page_v1") {
          requests.push(body);
          const result = await db.query<{ page: unknown }>("select training_page_v1($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) page",
            [body.p_view, body.p_scope, body.p_user, body.p_exam, body.p_search, body.p_status, body.p_days, body.p_cursor === null ? null : JSON.stringify(body.p_cursor), body.p_boundary, body.p_limit]);
          return new Response(JSON.stringify(result.rows[0]!.page), { status: 200 });
        }
        const table = path.split("/").at(-1);
        expect(["events", "attempts"]).toContain(table);
        const keys = Object.keys(body);
        // Only test-owned schema identifiers enter SQL. Every value is parameterised.
        const columns = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='public' and table_name=$1", [table])).rows.map((r) => r.column_name);
        for (const key of keys) expect(columns).toContain(key);
        await db.query(`insert into public.${table} (${keys.map((k) => `"${k}"`).join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
          keys.map((k) => typeof body[k] === "object" ? JSON.stringify(body[k]) : body[k]));
        return new Response(null, { status: 201 });
      } catch (error) {
        failures.push(error);
        return new Response(JSON.stringify({ code: (error as { code?: string }).code ?? "XX000", message: "local adapter rejected request" }), { status: 403 });
      }
    } } });
    let sequence = 0;
    const logger = createAttemptLogger({ getClient: async () => client,
      getStatus: async () => (await db.query<{ status: "approved" }>("select status from profiles where user_id=$1", [a])).rows[0]?.status ?? null,
      locale: () => "ar", device: () => ({ w: 390, h: 844, touch: true }),
      uuid: () => `10000000-0000-0000-0000-${String(++sequence).padStart(12, "0")}`,
      now: () => new Date("2026-01-01T00:00:00Z"), report: (r) => { if (r?.status === "saved") saved.push(r.id); } });
    const c = getCase("chest-pa-erect")!;
    const base: Snapshot = { activeCase: c, settings: c.initialSettings, phase: "setup", result: null, attempt: 1 };
    const settings = [c.initialSettings, { ...c.initialSettings, kvp: c.initialSettings.kvp + 10 }];
    const results = settings.map((s) => evaluate(c, s));
    // Provenance belongs to the actual result; no property or changed JSON/score.
    expect(evaluationVersion(results[0]!)).toBe(PRACTICE_EVALUATION_VERSION);
    expect(evaluationVersion(structuredClone(results[0]!))).toBe("unknown");
    expect(JSON.stringify(results[0])).not.toContain(PRACTICE_EVALUATION_VERSION);
    logger.onState(base);
    for (let i = 0; i < 2; i++) {
      if (i) logger.onState({ ...base, attempt: 2 });
      logger.onState({ ...base, attempt: i + 1, settings: settings[i]!, phase: "result", result: results[i]! });
      await vi.waitFor(() => expect(saved).toHaveLength(i + 1), { timeout: 5000 });
    }
    expect(failures).toEqual([]);
    const raw = (await db.query<{ result: unknown; engine_version: string; user_id: string }>("select result,engine_version,user_id from attempts order by attempt_no")).rows;
    expect(raw.map((r) => r.result)).toEqual(results.map(compactResult));
    expect(raw.every((r) => r.engine_version === PRACTICE_EVALUATION_VERSION && r.user_id === a)).toBe(true);
    const request = { view: "history" as const, scope: "own" as const, user: a, exam: "chest-pa-erect" };
    const page = await readTraining(client, request), rows = page.rows as TrainingAttempt[];
    expect(rows).toHaveLength(2); expect(page.next).toBeNull();
    const points = comparableAttempts(rows);
    expect(points).toHaveLength(2); expect(comparisonMessage(rows)).toBeNull();
    expect(points.map((r) => r.result.total).sort()).toEqual(results.map((r) => r.score.total).sort());
    expect(requests[0]).toMatchObject({ p_limit: 20, p_scope: "own", p_user: a, p_exam: request.exam });

    // Simulate stored history from a later evaluator/case and missing old stamps.
    // Change metadata only; saved totals never get recomputed or rewritten.
    const second = saved[1]!;
    for (const [column, value] of [["engine_version", "radlab-practice-evaluation/2"], ["case_id", "other"], ["definition_version", "other-definition"], ["producer_version", "other-writer"], ["engine_version", "unknown"], ["producer_version", "unknown"], ["definition_version", "unknown"]]) {
      await db.exec("reset role");
      await db.query(`update attempts set ${column}=$1 where id=$2`, [value, second]);
      await login(a);
      const history = (await readTraining(client, request)).rows as TrainingAttempt[];
      expect(history).toHaveLength(2); expect(comparableAttempts(history).length).toBeLessThan(2);
      expect(history.map((r) => r.result.total).sort()).toEqual(results.map((r) => r.score.total).sort());
      await db.exec("reset role");
      await db.query("update attempts set engine_version=$1,case_id='default',definition_version=$2,producer_version=$3 where id=$4", [rows[0]!.engine, rows[0]!.definition, rows[0]!.producer, second]);
      await login(a);
    }
    logger.onState({ ...base, attempt: 3 });
    logger.onState({ ...base, attempt: 3, phase: "result", result: structuredClone(results[0]!) });
    await vi.waitFor(() => expect(saved).toHaveLength(3), { timeout: 5000 });
    expect((await db.query<{ engine_version: string }>("select engine_version from attempts where id=$1", [saved[2]!])).rows[0]!.engine_version).toBe("unknown");
    expect((await readTraining(client, request)).rows).toHaveLength(3);
    await login(b);
    expect((await readTraining(client, { ...request, user: b })).rows).toEqual([]);
    await expect(readTraining(client, request)).rejects.toMatchObject({ kind: "denied" });
    expect((await db.query("select id from attempts")).rows).toEqual([]);
    expect(failures).toHaveLength(1); // The deliberate cross-user RPC denial only.
  } finally { await db.close(); }
}, 30000);
