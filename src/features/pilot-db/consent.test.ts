// Isolation tests for the consent migration (RAD-043a): same method as rls.test.ts (real migrations in PGlite, imitated Supabase roles).
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
const U = { withConsent: "00000000-0000-0000-0000-0000000000a1", without: "00000000-0000-0000-0000-0000000000a2", junk: "00000000-0000-0000-0000-0000000000a3" };
let db: PGlite;

async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(userId === null ? `set role anon; select set_config('request.jwt.claim.sub', '', false);` : `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
const INSERT = `insert into public.attempts (attempt_no, exam_id, case_id, definition_version, settings, result, locale) values (1, 'x', 'y', 'z', '{}', '{}', 'en')`;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SQL);
  for (const f of ["20261015000100_pilot_accounts.sql", "20261016000100_owner_list_participants.sql", "20261017000100_attempts.sql", "20261018000100_consent.sql"]) await db.exec(read(f));
  await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, $2::jsonb)`, [U.withConsent, JSON.stringify({ consent_version: "2026-10-16" })]);
  await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, null)`, [U.without]);
  await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, $2::jsonb)`, [U.junk, JSON.stringify({ consent_version: "x'; drop table public.profiles;--" })]);
  await db.exec(`update public.profiles set status = 'approved'`);
});
afterAll(async () => { await db.close(); });

describe("consent recorded at sign-up", () => {
  it("copies a well-formed accepted version onto the new profile, with a time", async () => {
    const row = (await db.query(`select consent_version, consented_at from public.profiles where user_id = $1`, [U.withConsent])).rows[0] as Record<string, unknown>;
    expect(row.consent_version).toBe("2026-10-16");
    expect(row.consented_at).not.toBeNull();
  });
  it("records nothing when no version is sent, and ignores a malformed one", async () => {
    for (const id of [U.without, U.junk]) {
      const row = (await db.query(`select consent_version, consented_at from public.profiles where user_id = $1`, [id])).rows[0] as Record<string, unknown>;
      expect(row).toEqual({ consent_version: null, consented_at: null });
    }
  });
  it("refuses a malformed version written later", async () => {
    await expect(as(U.without, () => db.query(`update public.profiles set consent_version = 'yes' where user_id = '${U.without}'`))).rejects.toThrow(/check constraint/);
  });
});

describe("saved attempts need a recorded consent", () => {
  it("lets an approved participant who consented save, and refuses one who did not", async () => {
    await as(U.withConsent, () => db.query(INSERT));
    await expect(as(U.without, () => db.query(INSERT))).rejects.toThrow(/row-level security/);
  });
  it("lets an existing participant accept from the account page and then save", async () => {
    await as(U.without, () => db.query(`update public.profiles set consent_version = '2026-10-16', consented_at = now() where user_id = '${U.without}'`));
    await as(U.without, () => db.query(INSERT));
  });
  it("cannot change anyone else's consent, nor any other profile column", async () => {
    await as(U.without, () => db.query(`update public.profiles set consent_version = '2020-01-01' where user_id = '${U.withConsent}'`));
    const row = (await db.query(`select consent_version from public.profiles where user_id = $1`, [U.withConsent])).rows[0] as Record<string, unknown>;
    expect(row.consent_version).toBe("2026-10-16");
    await expect(as(U.without, () => db.query(`update public.profiles set status = 'approved'`))).rejects.toThrow(/permission denied/);
  });
  it("keeps has_consented unreachable by anon", async () => {
    await expect(as(null, () => db.query(`select public.has_consented()`))).rejects.toThrow(/permission denied/);
  });
});
