// Real SQL chain, auth/roles shim only. No Supabase project or credentials.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "supabase/migrations");
function ordered(names: string[]): string[] {
  const files = names.filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) throw new Error("empty migration chain");
  const versions = new Set<string>();
  for (const file of files) {
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(file)) throw new Error(`invalid migration filename: ${file}`);
    const version = file.slice(0, 14);
    if (versions.has(version)) throw new Error(`duplicate migration version: ${version}`);
    versions.add(version);
  }
  return files;
}
const files = ordered(readdirSync(dir));
const sql = (f: string) => readFileSync(join(dir, f), "utf8");
const foundation = "20261020000100_scale_read_foundation.sql";
// Frozen, existing five-file fixture, not the discovery list for the current/full chain.
const legacy = [
  ["20261015000100_pilot_accounts.sql", "ce16d0419be531606d7beb991eb48332637d93983c27cc92c40553aaf671e152"],
  ["20261016000100_owner_list_participants.sql", "5027538f2d38850e7149a2c670a0fd8423a63018bbce803a98a1c44aed8cce82"],
  ["20261017000100_attempts.sql", "f58bb4e1a378d2084f4ca67e065d095280716edb4027919b93a67fe8da75b860"],
  ["20261018000100_consent.sql", "0b05d8a9635d4ac9d4b414ffeb0e532c72b670ef62e806c86e27af66b70a3236"],
  ["20261019000100_feedback.sql", "173b37998200499d0aa9cf4e4773db8390c8305c6b1c525569614455b135cd53"],
] as const;
const shim = `
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
`;
async function apply(db: PGlite, names: string[]) {
  for (const file of names) await db.transaction(async (tx) => { await tx.exec(sql(file)); });
}
async function catalogue(db: PGlite) {
  return (await db.query(`select c.relname, c.relrowsecurity, c.relacl::text from pg_class c
    join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','S') order by c.relname`)).rows;
}

describe("ordered migration chain", () => {
  it("discovers every SQL migration, rejects duplicate/invalid versions and freezes the pre-047b fixture", () => {
    expect(files).toContain(foundation);
    expect(files.slice(0, 5)).toEqual(legacy.map(([f]) => f));
    for (const [f, hash] of legacy) expect(createHash("sha256").update(sql(f)).digest("hex"), f).toBe(hash);
    expect(ordered(["20261022000100_b.sql", "README.md", foundation])).toEqual([foundation, "20261022000100_b.sql"]);
    expect(() => ordered([foundation, "20261020000100_other.sql"])).toThrow(/duplicate/);
    expect(() => ordered(["bad.sql"])).toThrow(/invalid/);
    expect(() => ordered([])).toThrow(/empty/);
  });

  it("builds the entire dynamically discovered chain on a fresh database with RLS and minimum grants", async () => {
    const db = new PGlite();
    try {
      await db.exec(shim);
      await apply(db, files);
      const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(`select relname,relrowsecurity from pg_class
        where oid in ('public.profiles'::regclass,'public.events'::regclass,'public.attempts'::regclass,'public.feedback'::regclass) order by relname`);
      expect(tables.rows.map((t) => t.relname)).toEqual(["attempts", "events", "feedback", "profiles"]);
      expect(tables.rows.every((t) => t.relrowsecurity)).toBe(true);
      const grants = await db.query<{ table_name: string; privilege_type: string }>(`select table_name,privilege_type from information_schema.table_privileges
        where table_schema='public' and grantee='authenticated' order by table_name,privilege_type`);
      expect(grants.rows).toEqual([
        { table_name: "attempts", privilege_type: "INSERT" }, { table_name: "attempts", privilege_type: "SELECT" },
        { table_name: "events", privilege_type: "INSERT" }, { table_name: "events", privilege_type: "SELECT" },
        { table_name: "feedback", privilege_type: "INSERT" }, { table_name: "feedback", privilege_type: "SELECT" },
        { table_name: "profiles", privilege_type: "SELECT" },
      ]);
      expect((await db.query(`select 1 from information_schema.table_privileges where table_schema='public' and grantee='anon'`)).rows).toEqual([]);
      await db.exec("set role anon");
      await expect(db.query("select * from public.owner_list_participants()")).rejects.toThrow(/permission denied/);
    } finally { await db.close(); }
  }, 30000);

  it("upgrades existing five-file data without changing grants, constraints, helper functions or policy targets", async () => {
    const db = new PGlite();
    try {
      await db.exec(shim);
      await apply(db, legacy.map(([f]) => f));
      await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values ('00000000-0000-0000-0000-000000000001','old@example.test','{"consent_version":"2026-10-16"}');
        update public.profiles set participant_code='P-1234abcd',status='approved';
        insert into public.attempts (id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
        values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',1,'x','default','v','{}','{}','ar');
        insert into public.events(user_id,type) values ('00000000-0000-0000-0000-000000000001','heartbeat');
        insert into public.feedback(user_id,exam_id,attempt_id,text) values ('00000000-0000-0000-0000-000000000001','x','10000000-0000-0000-0000-000000000001','Synthetic legacy note');`);
      const data = async () => (await db.query(`select 'profiles' t,to_jsonb(p) v from public.profiles p union all select 'attempts',to_jsonb(a) from public.attempts a
        union all select 'events',to_jsonb(e) from public.events e union all select 'feedback',to_jsonb(f) from public.feedback f order by t`)).rows;
      const targets = async () => (await db.query(`select schemaname,tablename,policyname,permissive,roles,cmd from pg_policies where schemaname='public' order by tablename,policyname`)).rows;
      const functions = async () => (await db.query<{ identity: string; definition: string; proacl: string | null }>(`select p.oid::regprocedure::text identity,pg_get_functiondef(p.oid) definition,p.proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.oid::regprocedure::text`)).rows;
      const constraints = async () => (await db.query(`select conrelid::regclass::text tab,conname,pg_get_constraintdef(oid) definition from pg_constraint where connamespace='public'::regnamespace order by tab,conname`)).rows;
      const columns = async () => (await db.query(`select table_name,column_name,grantee,privilege_type from information_schema.column_privileges where table_schema='public' order by table_name,column_name,grantee,privilege_type`)).rows;
      const before = { data: await data(), targets: await targets(), functions: await functions(), constraints: await constraints(), columns: await columns(), catalogue: await catalogue(db) };
      // New files are not enumerated: a future migration must be exercised here too.
      await apply(db, files.filter((f) => f > legacy[4][0]));
      expect(await data()).toEqual(before.data);
      expect(await targets()).toEqual(before.targets);
      // Owner-approved S-STD-1 exception: additive RPCs are allowed; every legacy
      // overload must retain its identity, exact definition and ACL. Apply ALL files above.
      const afterFunctions = await functions();
      for (const old of before.functions) {
        expect(afterFunctions.find((f) => f.identity === old.identity), String(old.identity)).toEqual(old);
      }
      expect(await constraints()).toEqual(before.constraints);
      expect(await columns()).toEqual(before.columns);
      expect(await catalogue(db)).toEqual(before.catalogue);
      await db.exec(`insert into auth.users(email) values ('new@example.test')`);
      expect((await db.query<{ participant_code: string }>(`select participant_code from public.profiles where participant_code <> 'P-1234abcd'`)).rows[0]!.participant_code).toMatch(/^P-[0-9a-f]{32}$/);
    } finally { await db.close(); }
  }, 30000);

  it("aborts an invalid migration transaction, leaving no partial indexes or changed default, and can then apply successfully", async () => {
    const db = new PGlite();
    try {
      await db.exec(shim);
      await apply(db, legacy.map(([f]) => f));
      const defaults = async () => (await db.query(`select column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='participant_code'`)).rows;
      const before = await defaults();
      await expect(db.transaction(async (tx) => {
        await tx.exec(sql(foundation));
        await tx.exec("select * from public.deliberately_missing_migration_dependency");
      })).rejects.toThrow(/does not exist/);
      expect(await defaults()).toEqual(before);
      expect((await db.query(`select to_regclass('public.attempts_finished_id_idx') idx`)).rows[0]).toEqual({ idx: null });
      await apply(db, [foundation]);
      expect((await db.query(`select to_regclass('public.attempts_finished_id_idx') idx`)).rows[0]).toEqual({ idx: "attempts_finished_id_idx" });
      // SQL files are intentionally not idempotent: replay must fail, not hide drift.
      await expect(apply(db, [foundation])).rejects.toThrow(/already exists/);
    } finally { await db.close(); }
  }, 30000);
});
