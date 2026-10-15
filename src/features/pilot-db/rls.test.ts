// Isolation tests for the pilot accounts schema (RAD-041a, Plan §7). They run the REAL migration in PGlite (Postgres compiled to
// WASM, real RLS and roles). Only the Supabase-provided pieces are imitated by SHIM_SQL: the `anon` / `authenticated` roles,
// `auth.users` and `auth.uid()` (read from the `request.jwt.claim.sub` setting, as PostgREST does). A pass here does NOT prove the
// live project: docs/PILOT_SUPABASE_SETUP.md §9 repeats the checks against the real project.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION = readFileSync(join(process.cwd(), "supabase/migrations/20261015000100_pilot_accounts.sql"), "utf8");

const SHIM_SQL = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

const U = {
  approvedA: "00000000-0000-0000-0000-00000000000a",
  approvedB: "00000000-0000-0000-0000-00000000000b",
  pending: "00000000-0000-0000-0000-00000000000c",
  suspended: "00000000-0000-0000-0000-00000000000d",
  owner: "00000000-0000-0000-0000-0000000000f0",
};

let db: PGlite;

/** Run `fn` as the given Supabase-like caller (null = signed-out `anon`), always restoring the superuser afterwards. */
async function as<T>(userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(
    userId === null
      ? `set role anon; select set_config('request.jwt.claim.sub', '', false);`
      : `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

const q = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows as Record<string, unknown>[];
/** First row of a query that must return one. */
const one = async (sql: string, params: unknown[] = []) => {
  const row = (await q(sql, params))[0];
  if (!row) throw new Error(`expected a row: ${sql}`);
  return row;
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SQL);
  await db.exec(MIGRATION);
  for (const [name, id] of Object.entries(U)) await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${name}@example.test`]);
  await db.exec(`
    update public.profiles set status = 'approved' where user_id in ('${U.approvedA}', '${U.approvedB}');
    update public.profiles set status = 'suspended' where user_id = '${U.suspended}';
    update public.profiles set status = 'approved', role = 'owner' where user_id = '${U.owner}';
  `);
  // one existing event per approved participant, written by them
  for (const id of [U.approvedA, U.approvedB]) await as(id, () => db.query(`insert into public.events (type) values ('exam_opened')`));
});

afterAll(async () => { await db.close(); });

describe("every sign-up becomes a pending profile", () => {
  it("creates a pending participant with a pseudonymous code, no consent and no e-mail", async () => {
    const row = await one(`select * from public.profiles where user_id = $1`, [U.pending]);
    expect(row.status).toBe("pending");
    expect(row.role).toBe("participant");
    expect(String(row.participant_code)).toMatch(/^P-[0-9a-f]{8}$/);
    expect(row.consented_at).toBeNull();
    expect(Object.keys(row)).not.toContain("email");
  });
});

describe("visitor without an account (anon)", () => {
  it("cannot read or write profiles or events and cannot call any function", async () => {
    await expect(as(null, () => db.query(`select * from public.profiles`))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`select * from public.events`))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`insert into public.events (user_id, type) values ('${U.approvedA}', 'heartbeat')`))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`update public.profiles set status = 'approved'`))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`select public.set_participant_status('${U.pending}', 'approved')`))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query(`select public.touch_last_seen()`))).rejects.toThrow(/permission denied/);
  });
});

describe("pending and suspended accounts", () => {
  it("a pending user sees only their own profile, can record consent, cannot write events", async () => {
    const rows = await as(U.pending, () => q(`select user_id, status from public.profiles`));
    expect(rows).toEqual([{ user_id: U.pending, status: "pending" }]);
    await as(U.pending, () => db.query(`update public.profiles set consent_version = 'v1', consented_at = now()`));
    expect((await one(`select consent_version from public.profiles where user_id = $1`, [U.pending])).consent_version).toBe("v1");
    await expect(as(U.pending, () => db.query(`insert into public.events (type) values ('heartbeat')`))).rejects.toThrow(/row-level security/);
  });

  it("a pending user can mark last-seen (so the owner sees them waiting) but no more", async () => {
    await as(U.pending, () => db.query(`select public.touch_last_seen()`));
    expect((await one(`select last_seen_at from public.profiles where user_id = $1`, [U.pending])).last_seen_at).not.toBeNull();
  });

  it("a suspended user still reads their own profile but cannot write events", async () => {
    const rows = await as(U.suspended, () => q(`select status from public.profiles`));
    expect(rows).toEqual([{ status: "suspended" }]);
    await expect(as(U.suspended, () => db.query(`insert into public.events (type) values ('heartbeat')`))).rejects.toThrow(/row-level security/);
  });

  it("neither can read other people's events", async () => {
    expect(await as(U.pending, () => q(`select * from public.events`))).toEqual([]);
    expect(await as(U.suspended, () => q(`select * from public.events`))).toEqual([]);
  });
});

describe("participant versus participant", () => {
  it("an approved participant sees only their own profile and events", async () => {
    expect((await as(U.approvedA, () => q(`select user_id from public.profiles`))).map((r) => r.user_id)).toEqual([U.approvedA]);
    const events = await as(U.approvedA, () => q(`select user_id from public.events`));
    expect(events).toHaveLength(1);
    expect(events[0]?.user_id).toBe(U.approvedA);
  });

  it("asking for another participant's row by id returns nothing (no leak, no error)", async () => {
    expect(await as(U.approvedA, () => q(`select * from public.profiles where user_id = '${U.approvedB}'`))).toEqual([]);
    expect(await as(U.approvedA, () => q(`select * from public.events where user_id = '${U.approvedB}'`))).toEqual([]);
  });

  it("cannot write an event as somebody else", async () => {
    await expect(as(U.approvedA, () => db.query(`insert into public.events (user_id, type) values ('${U.approvedB}', 'heartbeat')`))).rejects.toThrow(/row-level security/);
  });

  it("cannot change another participant's profile (0 rows) or their own status / role / code", async () => {
    const res = await as(U.approvedA, () => db.query(`update public.profiles set consent_version = 'x' where user_id = '${U.approvedB}'`));
    expect(res.affectedRows).toBe(0);
    for (const col of ["status = 'approved'", "role = 'owner'", "participant_code = 'P-00000000'", "user_id = gen_random_uuid()"]) {
      await expect(as(U.approvedA, () => db.query(`update public.profiles set ${col} where user_id = '${U.approvedA}'`))).rejects.toThrow(/permission denied/);
    }
  });

  it("cannot insert or delete profiles, and cannot edit or delete events (append-only)", async () => {
    await expect(as(U.approvedA, () => db.query(`insert into public.profiles (user_id, role, status) values (gen_random_uuid(), 'owner', 'approved')`))).rejects.toThrow(/permission denied/);
    await expect(as(U.approvedA, () => db.query(`delete from public.profiles where user_id = '${U.approvedA}'`))).rejects.toThrow(/permission denied/);
    await expect(as(U.approvedA, () => db.query(`update public.events set type = 'logout'`))).rejects.toThrow(/permission denied/);
    await expect(as(U.approvedA, () => db.query(`delete from public.events`))).rejects.toThrow(/permission denied/);
  });

  it("cannot approve anyone", async () => {
    await expect(as(U.approvedA, () => db.query(`select public.set_participant_status('${U.pending}', 'approved')`))).rejects.toThrow(/owner only/);
    await expect(as(U.pending, () => db.query(`select public.set_participant_status('${U.pending}', 'approved')`))).rejects.toThrow(/owner only/);
  });
});

describe("event content limits", () => {
  it("accepts a listed type with a small object payload; the user id defaults to the caller", async () => {
    await as(U.approvedA, () => db.query(`insert into public.events (type, payload) values ('language_changed', '{"to":"ar"}')`));
    const rows = await as(U.approvedA, () => q(`select user_id, payload from public.events where type = 'language_changed'`));
    expect(rows).toEqual([{ user_id: U.approvedA, payload: { to: "ar" } }]);
  });

  it("rejects an unknown type, a non-object payload and a payload over 1 KiB", async () => {
    await expect(as(U.approvedA, () => db.query(`insert into public.events (type) values ('free_text')`))).rejects.toThrow(/check constraint/);
    await expect(as(U.approvedA, () => db.query(`insert into public.events (type, payload) values ('heartbeat', '[1]')`))).rejects.toThrow(/check constraint/);
    await expect(as(U.approvedA, () => db.query(`insert into public.events (type, payload) values ('client_error', jsonb_build_object('m', repeat('x', 1100)))`))).rejects.toThrow(/check constraint/);
  });
});

describe("owner", () => {
  it("reads every profile and event", async () => {
    expect(await as(U.owner, () => q(`select user_id from public.profiles`))).toHaveLength(Object.keys(U).length);
    expect((await as(U.owner, () => q(`select user_id from public.events`))).length).toBeGreaterThanOrEqual(2);
  });

  it("approves and suspends through set_participant_status, with validation", async () => {
    await as(U.owner, () => db.query(`select public.set_participant_status('${U.pending}', 'approved')`));
    expect((await one(`select status from public.profiles where user_id = $1`, [U.pending])).status).toBe("approved");
    // the newly approved user can now write an event
    await as(U.pending, () => db.query(`insert into public.events (type) values ('heartbeat')`));
    await as(U.owner, () => db.query(`select public.set_participant_status('${U.pending}', 'suspended')`));
    await expect(as(U.pending, () => db.query(`insert into public.events (type) values ('heartbeat')`))).rejects.toThrow(/row-level security/);
    await expect(as(U.owner, () => db.query(`select public.set_participant_status('${U.pending}', 'admin')`))).rejects.toThrow(/invalid status/);
    await expect(as(U.owner, () => db.query(`select public.set_participant_status('${U.owner}', 'suspended')`))).rejects.toThrow(/cannot change their own/);
  });

  it("an owner who is not approved has no owner powers", async () => {
    await db.exec(`update public.profiles set status = 'suspended' where user_id = '${U.owner}'`);
    expect(await as(U.owner, () => q(`select user_id from public.profiles`))).toHaveLength(1);
    await expect(as(U.owner, () => db.query(`select public.set_participant_status('${U.approvedA}', 'suspended')`))).rejects.toThrow(/owner only/);
    await db.exec(`update public.profiles set status = 'approved' where user_id = '${U.owner}'`);
  });
});

describe("deleting a participant (Plan Q7)", () => {
  it("removing the auth user removes the profile and every event of that user, and nobody else's", async () => {
    const before = (await one(`select count(*)::int as n from public.events where user_id = $1`, [U.approvedB])).n as number;
    expect(before).toBeGreaterThan(0);
    await db.query(`delete from auth.users where id = $1`, [U.approvedB]);
    expect(await q(`select 1 from public.profiles where user_id = $1`, [U.approvedB])).toEqual([]);
    expect(await q(`select 1 from public.events where user_id = $1`, [U.approvedB])).toEqual([]);
    expect((await one(`select count(*)::int as n from public.events where user_id = $1`, [U.approvedA])).n as number).toBeGreaterThan(0);
  });
});

describe("migration hygiene", () => {
  it("leaves no table or function in schema public reachable by anon", async () => {
    const rows = await q(`
      select 'table' as kind, table_name as name from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'
      union all
      select 'routine', routine_name from information_schema.routine_privileges where grantee = 'anon' and routine_schema = 'public'`);
    expect(rows).toEqual([]);
  });

  it("has RLS enabled on both tables", async () => {
    const rows = await q(`select relname, relrowsecurity from pg_class where relname in ('profiles', 'events') and relnamespace = 'public'::regnamespace order by relname`);
    expect(rows).toEqual([{ relname: "events", relrowsecurity: true }, { relname: "profiles", relrowsecurity: true }]);
  });
});
