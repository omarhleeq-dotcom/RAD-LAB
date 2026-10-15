// Isolation tests for public.owner_list_participants() (RAD-044a): only an approved owner may read e-mails. Same method as rls.test.ts
// (real migrations in PGlite, imitated Supabase roles); the live project is checked by hand (docs/PILOT_SUPABASE_SETUP.md).
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
const U = { owner: "00000000-0000-0000-0000-0000000000f0", ownerPending: "00000000-0000-0000-0000-0000000000f1", approved: "00000000-0000-0000-0000-00000000000a", pending: "00000000-0000-0000-0000-00000000000c", unconfirmed: "00000000-0000-0000-0000-00000000000e" };
let db: PGlite;

async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(userId === null ? `set role anon; select set_config('request.jwt.claim.sub', '', false);` : `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SQL);
  await db.exec(read("20261015000100_pilot_accounts.sql"));
  await db.exec(read("20261016000100_owner_list_participants.sql"));
  for (const [name, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email, email_confirmed_at) values ($1, $2, $3)`, [id, `${name}@example.test`, name === "unconfirmed" ? null : new Date().toISOString()]);
  await db.exec(`
    update public.profiles set role = 'owner', status = 'approved' where user_id = '${U.owner}';
    update public.profiles set role = 'owner', status = 'pending' where user_id = '${U.ownerPending}';
    update public.profiles set status = 'approved' where user_id = '${U.approved}';
  `);
  await as(U.approved, () => db.query(`insert into public.events (type) values ('heartbeat')`));
});
afterAll(async () => { await db.close(); });

describe("owner_list_participants", () => {
  it("returns every participant with e-mail, confirmation, status and last activity to an approved owner", async () => {
    const rows = (await as(U.owner, () => db.query(`select * from public.owner_list_participants()`))).rows as Record<string, unknown>[];
    expect(rows).toHaveLength(Object.keys(U).length);
    const byEmail = new Map(rows.map((r) => [r.email, r]));
    expect(byEmail.get("approved@example.test")).toMatchObject({ status: "approved", role: "participant", email_confirmed: true });
    expect(byEmail.get("approved@example.test")?.last_event_at).not.toBeNull();
    expect(byEmail.get("unconfirmed@example.test")).toMatchObject({ status: "pending", email_confirmed: false, last_event_at: null });
    expect(String(byEmail.get("pending@example.test")?.participant_code)).toMatch(/^P-[0-9a-f]{8}$/);
  });

  it("lists newest first", async () => {
    const rows = (await as(U.owner, () => db.query(`select created_at from public.owner_list_participants()`))).rows as { created_at: Date }[];
    const times = rows.map((r) => new Date(r.created_at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("refuses everybody else: visitor, participant, pending user, and an owner who is not approved", async () => {
    await expect(as(null, () => db.query(`select * from public.owner_list_participants()`))).rejects.toThrow(/permission denied/);
    for (const id of [U.approved, U.pending, U.ownerPending]) {
      await expect(as(id, () => db.query(`select * from public.owner_list_participants()`))).rejects.toThrow(/owner only/);
    }
  });

  it("e-mails stay out of every table the API can read", async () => {
    for (const t of ["profiles", "events"]) {
      const cols = (await db.query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`, [t])).rows.map((r) => (r as { column_name: string }).column_name);
      expect(cols).not.toContain("email");
    }
  });
});
