import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { createClient } from "@supabase/supabase-js";
import { expect, it } from "vitest";
import { backendFailure, readAccountProfile } from "./profile-read";
import { readTraining } from "./training";

const a = "00000000-0000-0000-0000-000000000001", owner = "00000000-0000-0000-0000-000000000002";
const migration = "20261020000400_training_dashboard.sql";
const readiness = readFileSync("supabase/checks/training-ready.sql", "utf8");
const shim = `create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`;

it("reproduces the owner's missing-column failure with real PostgreSQL for both accounts, then recovers after migration", async () => {
  const db = new PGlite();
  try {
    await db.exec(shim);
    for (const f of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql") && f < migration).sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
    for (const id of [a, owner]) await db.query("insert into auth.users values($1,'synthetic@example.test',now(),'{}')", [id]);
    await db.exec(`update profiles set status='approved'; update profiles set role='owner' where user_id='${owner}'`);
    let failures = 0;
    const client = (actor: string) => createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, db: { retry: false }, global: { fetch: async (input) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/rest/v1/profiles"); expect(url.searchParams.get("limit")).toBe("1");
      const target = url.searchParams.get("user_id")?.slice(3);
      const columns = url.searchParams.get("select")!.split(",");
      expect(columns.every((c) => ["status", "role", "participant_code", "consent_version", "display_name"].includes(c))).toBe(true);
      try {
        const result = await db.transaction(async (tx) => {
          await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [actor]); await tx.exec("set local role authenticated");
          return tx.query(`select ${columns.join(",")} from public.profiles where user_id=$1 limit 1`, [target]);
        });
        return new Response(JSON.stringify(result.rows), { status: 200, headers: { "content-type": "application/json" } });
      } catch (error) {
        expect(error).toMatchObject({ code: "42703" }); failures++;
        return new Response(JSON.stringify({ code: "42703", message: "column display_name does not exist" }), { status: 400 });
      }
    } } });
    for (const id of [a, owner]) await expect(readAccountProfile(client(id), id)).rejects.toMatchObject({ kind: "schema" });
    expect(failures).toBe(2);
    await expect(db.exec(readiness)).rejects.toMatchObject({ code: "55000" }); await db.exec("rollback");
    // A manually added column alone is insufficient: the RPCs/index/trigger still need the full migration.
    await db.exec("begin; alter table profiles add column display_name text");
    await expect(db.exec(readiness.replace("begin read only;", ""))).rejects.toMatchObject({ code: "55000" }); await db.exec("rollback");
    await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
    await db.exec(readiness);
    expect(await readAccountProfile(client(a), a)).toMatchObject({ profile: { status: "approved", role: "participant" }, displayName: null });
    expect(await readAccountProfile(client(owner), owner)).toMatchObject({ profile: { role: "owner" } });
    await expect(readAccountProfile(client(a), owner)).rejects.toMatchObject({ kind: "missing" });
    await db.exec("revoke execute on function public.training_page_v1(text,text,uuid,text,text,text,integer,jsonb,timestamptz,integer) from authenticated");
    await expect(db.exec(readiness)).rejects.toMatchObject({ code: "55000" }); await db.exec("rollback");
  } finally { await db.close(); }
}, 30000);

it("classifies database/cache, session, permission, network and service errors without reflecting server text", async () => {
  const cases = [
    [400,"42703","schema"], [400,"42P01","schema"], [404,"PGRST202","schema"], [400,"PGRST204","schema"], [404,"PGRST205","schema"],
    [401,"PGRST301","expired"], [403,"42501","denied"], [503,"XX000","service"],
  ] as const;
  for (const [status, code, kind] of cases) {
    const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, db: { retry: false }, global: { fetch: async () => new Response(JSON.stringify({ code, message: "private server detail" }), { status }) } });
    await expect(readAccountProfile(client, a)).rejects.toMatchObject({ kind, message: "Account profile unavailable" });
  }
  expect(backendFailure({},0)).toBe("network"); expect(backendFailure(new TypeError("fetch failed"))).toBe("network");
  expect(backendFailure({code:"unknown"},500)).toBe("service");
});

it("never turns absent/malformed profiles into approved accounts", async () => {
  for (const [row, kind] of [[[],"missing"], [[{status:"approved",role:"unrecognised",participant_code:"P-x",display_name:null}],"invalid"]] as const) {
    const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, db: { retry: false }, global: { fetch: async () => new Response(JSON.stringify(row), { status: 200 }) } });
    await expect(readAccountProfile(client,a)).rejects.toMatchObject({kind});
  }
});

it("reports an incomplete training backend as schema incompatibility rather than a connection error", async () => {
  for (const code of ["PGRST202","42883","42703"]) {
    const client = createClient("https://synthetic.supabase.co", "synthetic", { auth: { persistSession: false }, db: { retry: false }, global: { fetch: async () => new Response(JSON.stringify({code,message:"synthetic"}),{status:400}) } });
    await expect(readTraining(client,{view:"summary",scope:"own",user:a})).rejects.toMatchObject({kind:"schema"});
  }
});
