// Isolation tests for public.feedback (RAD-043b): same method as rls.test.ts (real migrations in PGlite, imitated Supabase roles).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(join(process.cwd(), "supabase/migrations", f), "utf8");
const SHIM_SQL = `
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;
const U = {
  a: "00000000-0000-0000-0000-00000000000a",
  b: "00000000-0000-0000-0000-00000000000b",
  noConsent: "00000000-0000-0000-0000-00000000000c",
  pending: "00000000-0000-0000-0000-00000000000d",
  suspended: "00000000-0000-0000-0000-00000000000e",
  owner: "00000000-0000-0000-0000-0000000000f0",
};
const ATT = { a: "10000000-0000-0000-0000-00000000000a", b: "10000000-0000-0000-0000-00000000000b" };
const CONSENT = JSON.stringify({ consent_version: "2026-10-16" });
let db: PGlite;

async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(userId === null ? `set role anon; select set_config('request.jwt.claim.sub', '', false);` : `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
const ATTEMPT = (id: string) => `insert into public.attempts (id, attempt_no, exam_id, case_id, definition_version, settings, result, locale) values ('${id}', 1, 'chest-pa-erect', 'default', 'v', '{}', '{}', 'en')`;
const NOTE = (text: string, attemptId: string | null) =>
  db.query(`insert into public.feedback (exam_id, attempt_id, text) values ('chest-pa-erect', $1, $2)`, [attemptId, text]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SQL);
  for (const f of ["20261015000100_pilot_accounts.sql", "20261016000100_owner_list_participants.sql", "20261017000100_attempts.sql", "20261018000100_consent.sql", "20261019000100_feedback.sql"]) await db.exec(read(f));
  for (const [name, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`, [id, `${name}@example.test`, name === "noConsent" ? null : CONSENT]);
  await db.exec(`
    update public.profiles set status = 'approved' where user_id in ('${U.a}', '${U.b}', '${U.noConsent}');
    update public.profiles set status = 'suspended' where user_id = '${U.suspended}';
    update public.profiles set status = 'approved', role = 'owner' where user_id = '${U.owner}';
  `);
  await as(U.a, () => db.exec(ATTEMPT(ATT.a)));
  await as(U.b, () => db.exec(ATTEMPT(ATT.b)));
});
afterAll(async () => { await db.close(); });

describe("feedback notes", () => {
  it("lets an approved, consenting participant add a note on their own attempt, stamped with their own id", async () => {
    await as(U.a, () => NOTE("The marker was hard to find.", ATT.a));
    const rows = (await as(U.a, () => db.query(`select user_id, attempt_id, text from public.feedback`))).rows as Record<string, unknown>[];
    expect(rows).toEqual([{ user_id: U.a, attempt_id: ATT.a, text: "The marker was hard to find." }]);
  });

  it("accepts a note with no attempt, and exactly 1000 characters", async () => {
    await as(U.a, () => NOTE("x".repeat(1000), null));
  });

  it("refuses an empty, blank or over-long note", async () => {
    await expect(as(U.a, () => NOTE("", ATT.a))).rejects.toThrow(/check constraint/);
    await expect(as(U.a, () => NOTE("   ", ATT.a))).rejects.toThrow(/check constraint/);
    await expect(as(U.a, () => NOTE("x".repeat(1001), ATT.a))).rejects.toThrow(/check constraint/);
  });

  it("refuses a note linked to someone else's attempt, or to an attempt that does not exist", async () => {
    await expect(as(U.a, () => NOTE("hi", ATT.b))).rejects.toThrow(/row-level security/);
    await expect(as(U.a, () => NOTE("hi", "10000000-0000-0000-0000-0000000000ff"))).rejects.toThrow(/row-level security/);
  });

  it("refuses a note written on behalf of someone else", async () => {
    await expect(as(U.a, () => db.query(`insert into public.feedback (user_id, exam_id, text) values ('${U.b}', 'x', 'hi')`))).rejects.toThrow(/row-level security/);
  });

  it("refuses visitors, pending, suspended and not-yet-consented accounts", async () => {
    await expect(as(null, () => NOTE("hi", null))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`select * from public.feedback`))).rejects.toThrow(/permission denied/);
    for (const id of [U.pending, U.suspended, U.noConsent]) await expect(as(id, () => NOTE("hi", null))).rejects.toThrow(/row-level security/);
  });

  it("hides one participant's notes from another and shows everything to the approved owner only", async () => {
    await as(U.b, () => NOTE("Fine.", ATT.b));
    const own = (await as(U.b, () => db.query(`select user_id from public.feedback`))).rows as Record<string, unknown>[];
    expect(own.every((r) => r.user_id === U.b)).toBe(true);
    const all = (await as(U.owner, () => db.query(`select user_id from public.feedback`))).rows as Record<string, unknown>[];
    expect(new Set(all.map((r) => r.user_id))).toEqual(new Set([U.a, U.b]));
  });

  it("is append-only through the API: no update, no delete (owner included)", async () => {
    for (const id of [U.a, U.owner]) {
      await expect(as(id, () => db.query(`update public.feedback set text = 'edited'`))).rejects.toThrow(/permission denied/);
      await expect(as(id, () => db.query(`delete from public.feedback`))).rejects.toThrow(/permission denied/);
    }
  });

  it("is removed with the profile (deletion cascade) and leaves nothing reachable by anon", async () => {
    await db.exec(`delete from auth.users where id = '${U.b}'`);
    expect((await as(U.owner, () => db.query(`select 1 from public.feedback where user_id = '${U.b}'`))).rows).toHaveLength(0);
    expect((await db.query(`select 1 from information_schema.role_table_grants where grantee = 'anon' and table_name = 'feedback'`)).rows).toHaveLength(0);
  });
});
