// Isolation tests for public.attempts (RAD-042): same method as rls.test.ts (real migrations in PGlite, imitated Supabase roles).
// Proves who may write / read saved Practice attempts; the live project is checked by hand (docs/PILOT_SUPABASE_SETUP.md).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(join(process.cwd(), "supabase/migrations", f), "utf8");
const SHIM_SQL = `
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;
const U = {
  a: "00000000-0000-0000-0000-00000000000a",
  b: "00000000-0000-0000-0000-00000000000b",
  pending: "00000000-0000-0000-0000-00000000000c",
  suspended: "00000000-0000-0000-0000-00000000000d",
  owner: "00000000-0000-0000-0000-0000000000f0",
};
let db: PGlite;

async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(userId === null ? `set role anon; select set_config('request.jwt.claim.sub', '', false);` : `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}

const INSERT = `insert into public.attempts (attempt_no, exam_id, case_id, definition_version, settings, result, locale, device)
  values ($1, 'chest-pa-erect', 'chest-pa-case-1', 'abc123', $2::jsonb, $3::jsonb, 'ar', '{"w":390}'::jsonb)`;
const ok = (n = 1) => [n, JSON.stringify({ kvp: 110 }), JSON.stringify({ total: 80 })];

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SQL);
  for (const f of ["20261015000100_pilot_accounts.sql", "20261016000100_owner_list_participants.sql", "20261017000100_attempts.sql"]) await db.exec(read(f));
  for (const [name, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${name}@example.test`]);
  await db.exec(`
    update public.profiles set status = 'approved' where user_id in ('${U.a}', '${U.b}');
    update public.profiles set status = 'suspended' where user_id = '${U.suspended}';
    update public.profiles set status = 'approved', role = 'owner' where user_id = '${U.owner}';
  `);
  await as(U.a, () => db.query(INSERT, ok(1)));
  await as(U.b, () => db.query(INSERT, ok(1)));
});
afterAll(async () => { await db.close(); });

describe("saved attempts", () => {
  it("lets an approved participant save and read their own attempt, stamped with their own id", async () => {
    await as(U.a, () => db.query(INSERT, ok(2)));
    const rows = (await as(U.a, () => db.query(`select user_id, attempt_no from public.attempts order by attempt_no`))).rows as Record<string, unknown>[];
    expect(rows.map((r) => r.attempt_no)).toEqual([1, 2]);
    expect(new Set(rows.map((r) => r.user_id))).toEqual(new Set([U.a]));
  });

  it("hides another participant's attempts", async () => {
    const rows = (await as(U.b, () => db.query(`select user_id from public.attempts`))).rows as Record<string, unknown>[];
    expect(rows.every((r) => r.user_id === U.b)).toBe(true);
  });

  it("refuses to save an attempt on behalf of someone else", async () => {
    await expect(as(U.a, () => db.query(`insert into public.attempts (user_id, attempt_no, exam_id, case_id, definition_version, settings, result, locale) values ('${U.b}', 1, 'x', 'y', 'z', '{}', '{}', 'en')`))).rejects.toThrow(/row-level security/);
  });

  it("refuses visitors, pending and suspended accounts", async () => {
    await expect(as(null, () => db.query(INSERT, ok()))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`select * from public.attempts`))).rejects.toThrow(/permission denied/);
    await expect(as(U.pending, () => db.query(INSERT, ok()))).rejects.toThrow(/row-level security/);
    await expect(as(U.suspended, () => db.query(INSERT, ok()))).rejects.toThrow(/row-level security/);
  });

  it("is append-only through the API: no update, no delete", async () => {
    await expect(as(U.a, () => db.query(`update public.attempts set result = '{}'::jsonb`))).rejects.toThrow(/permission denied/);
    await expect(as(U.a, () => db.query(`delete from public.attempts`))).rejects.toThrow(/permission denied/);
  });

  it("lets only the approved owner read every attempt", async () => {
    const rows = (await as(U.owner, () => db.query(`select user_id from public.attempts`))).rows as Record<string, unknown>[];
    expect(new Set(rows.map((r) => r.user_id))).toEqual(new Set([U.a, U.b]));
    await expect(as(U.owner, () => db.query(`delete from public.attempts`))).rejects.toThrow(/permission denied/);
  });

  it("rejects oversized or malformed payloads and unknown locales", async () => {
    const big = JSON.stringify({ pad: "x".repeat(9000) });
    await expect(as(U.a, () => db.query(INSERT, [3, JSON.stringify({ kvp: 1 }), big]))).rejects.toThrow(/check constraint/);
    await expect(as(U.a, () => db.query(INSERT, [3, JSON.stringify([1]), JSON.stringify({})]))).rejects.toThrow(/check constraint/);
    await expect(as(U.a, () => db.query(`insert into public.attempts (attempt_no, exam_id, case_id, definition_version, settings, result, locale) values (1, 'x', 'y', 'z', '{}', '{}', 'fr')`))).rejects.toThrow(/check constraint/);
  });

  it("is removed with the profile (deletion cascade)", async () => {
    await db.exec(`delete from auth.users where id = '${U.b}'`);
    const rows = (await as(U.owner, () => db.query(`select user_id from public.attempts where user_id = '${U.b}'`))).rows;
    expect(rows).toHaveLength(0);
  });

  it("leaves nothing on attempts reachable by anon", async () => {
    const rows = (await db.query(`select 1 from information_schema.role_table_grants where grantee = 'anon' and table_name = 'attempts'`)).rows;
    expect(rows).toHaveLength(0);
  });
});
