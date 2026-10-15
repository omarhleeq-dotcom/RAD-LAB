// Before/after authorisation equivalence against real SQL, not a reimplementation of RLS.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = join(process.cwd(), "supabase/migrations");
const foundation = "20261020000100_scale_read_foundation.sql";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = (f: string) => readFileSync(join(dir, f), "utf8");
const names = ["a", "b", "pending", "suspended", "noConsent", "owner", "ownerPending", "ownerSuspended", "oldConsent"] as const;
type Name = typeof names[number];
const uid = (n: Name) => `00000000-0000-0000-0000-${(names.indexOf(n) + 1).toString(16).padStart(12, "0")}`;
const aid = (n: Name) => `10000000-0000-0000-0000-${(names.indexOf(n) + 1).toString(16).padStart(12, "0")}`;
const shim = `create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(),email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`;
let db: PGlite;
type Probe = { allowed: true; rows: Record<string, unknown>[] } | { allowed: false; code: string | undefined };
// Roll back every probe, including successful writes, so baseline/upgrade see exactly the same data.
async function probe(user: Name | null, statement: string, params: unknown[] = []): Promise<Probe> {
  const rollback = new Error("successful probe rollback");
  let rows: Record<string, unknown>[] = [];
  try {
    await db.transaction(async (tx) => {
      await tx.exec(`set local role ${user === null ? "anon" : "authenticated"}`);
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user === null ? "" : uid(user)]);
      rows = (await tx.query(statement, params)).rows as Record<string, unknown>[];
      throw rollback;
    });
  } catch (error) {
    if (error === rollback) return { allowed: true, rows };
    return { allowed: false, code: (error as { code?: string }).code };
  }
  throw new Error("probe unexpectedly committed");
}
const attemptInsert = `insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
  values ($1,1,'synthetic','default','v','{}','{}','en')`;
const tables = ["profiles", "events", "attempts", "feedback"] as const;
async function matrix() {
  const out: Record<string, Probe> = {};
  for (const user of [null, ...names]) {
    const label = user ?? "anon", own = user === null ? uid("a") : uid(user);
    for (const table of tables) {
      out[`${label}:read:${table}`] = await probe(user, `select user_id from public.${table} order by user_id`);
      out[`${label}:delete:${table}`] = await probe(user, `delete from public.${table}`);
    }
    for (const table of ["events", "attempts", "feedback"]) out[`${label}:update:${table}`] = await probe(user, `update public.${table} set user_id=user_id`);
    out[`${label}:attempt:own`] = await probe(user, attemptInsert, [own]);
    out[`${label}:attempt:other`] = await probe(user, attemptInsert, [uid(user === "b" ? "a" : "b")]);
    out[`${label}:event:own`] = await probe(user, `insert into public.events(user_id,type) values ($1,'heartbeat')`, [own]);
    out[`${label}:event:other`] = await probe(user, `insert into public.events(user_id,type) values ($1,'heartbeat')`, [uid(user === "b" ? "a" : "b")]);
    out[`${label}:note:own`] = await probe(user, `insert into public.feedback(user_id,exam_id,attempt_id,text) values ($1,'synthetic',$2,'Synthetic')`, [own, aid(user ?? "a")]);
    out[`${label}:note:other`] = await probe(user, `insert into public.feedback(user_id,exam_id,attempt_id,text) values ($1,'synthetic',$2,'Synthetic')`, [own, aid(user === "b" ? "a" : "b")]);
    out[`${label}:note:null`] = await probe(user, `insert into public.feedback(user_id,exam_id,text) values ($1,'synthetic','Synthetic')`, [own]);
    out[`${label}:note:missing`] = await probe(user, `insert into public.feedback(user_id,exam_id,attempt_id,text) values ($1,'synthetic','ffffffff-ffff-ffff-ffff-ffffffffffff','Synthetic')`, [own]);
    out[`${label}:rpc:list`] = await probe(user, "select user_id from public.owner_list_participants() order by user_id");
    out[`${label}:rpc:status`] = await probe(user, "select public.set_participant_status($1,'approved')", [uid("pending")]);
    out[`${label}:rpc:touch`] = await probe(user, "select public.touch_last_seen()");
    out[`${label}:rpc:trigger`] = await probe(user, "select public.handle_new_user()");
    out[`${label}:consent:own`] = await probe(user, `update public.profiles set consent_version='2026-10-16',consented_at=now() where user_id=$1 returning user_id`, [own]);
    out[`${label}:consent:other`] = await probe(user, `update public.profiles set consent_version='2026-10-16',consented_at=now() where user_id=$1 returning user_id`, [uid(user === "b" ? "a" : "b")]);
    out[`${label}:role:escalate`] = await probe(user, `update public.profiles set role='owner' where user_id=$1`, [own]);
  }
  return out;
}
let baseline: Awaited<ReturnType<typeof matrix>>;
let upgraded: Awaited<ReturnType<typeof matrix>>;
function result(key: string): Probe {
  const value = upgraded[key];
  if (!value) throw new Error(`missing access probe: ${key}`);
  return value;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(shim);
  for (const f of files.filter((f) => f < foundation)) await db.exec(sql(f));
  for (const n of names) {
    const consent = n === "noConsent" ? null : JSON.stringify({ consent_version: n === "oldConsent" ? "2020-01-01" : "2026-10-17" });
    await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3::jsonb)", [uid(n), `${n}@example.test`, consent]);
    await db.query(`update public.profiles set role=$2,status=$3 where user_id=$1`, [uid(n), n.startsWith("owner") ? "owner" : "participant", n === "pending" || n === "ownerPending" ? "pending" : n === "suspended" || n === "ownerSuspended" ? "suspended" : "approved"]);
    // Synthetic historical rows also exercise reads after approval has been withdrawn.
    await db.query(attemptInsert, [uid(n)]);
    // Give the fixture attempt a stable UUID; API cannot perform this update.
    await db.query("update public.attempts set id=$2 where user_id=$1", [uid(n), aid(n)]);
    await db.query("insert into public.events(user_id,type) values ($1,'heartbeat')", [uid(n)]);
    await db.query("insert into public.feedback(user_id,exam_id,attempt_id,text) values ($1,'synthetic',$2,'Historical synthetic note')", [uid(n), aid(n)]);
  }
  baseline = await matrix();
  for (const f of files.filter((f) => f >= foundation)) await db.transaction(async (tx) => { await tx.exec(sql(f)); });
  upgraded = await matrix();
}, 30000);
afterAll(async () => { await db.close(); });

describe("scale foundation isolation and upgrade", () => {
  it("preserves the complete before/after access matrix including error codes and returned rows", () => {
    expect(upgraded).toEqual(baseline);
  });
  it("enforces the existing read/write/RPC contract rather than merely matching two potentially broken policies", () => {
    for (const user of [null, ...names]) {
      const label = user ?? "anon";
      const approved = user !== null && !["pending", "suspended", "ownerPending", "ownerSuspended"].includes(user);
      const consenting = approved && user !== "noConsent";
      for (const table of tables) {
        const read = result(`${label}:read:${table}`);
        if (user === null) expect(read).toEqual({ allowed: false, code: "42501" });
        else {
          expect(read.allowed).toBe(true);
          if (read.allowed) expect(read.rows).toEqual((user === "owner" ? names.map(uid).sort() : [uid(user)]).map((user_id) => ({ user_id })));
        }
        expect(result(`${label}:delete:${table}`)).toEqual({ allowed: false, code: "42501" });
      }
      for (const table of ["events", "attempts", "feedback"]) expect(result(`${label}:update:${table}`)).toEqual({ allowed: false, code: "42501" });
      expect(result(`${label}:attempt:own`).allowed).toBe(consenting);
      expect(result(`${label}:event:own`).allowed).toBe(approved);
      expect(result(`${label}:note:own`).allowed).toBe(consenting);
      expect(result(`${label}:note:null`).allowed).toBe(consenting);
      for (const kind of ["attempt:other", "event:other", "note:other", "note:missing", "role:escalate", "rpc:trigger"]) expect(result(`${label}:${kind}`)).toEqual({ allowed: false, code: "42501" });
      expect(result(`${label}:rpc:list`).allowed).toBe(user === "owner");
      expect(result(`${label}:rpc:status`).allowed).toBe(user === "owner");
      expect(result(`${label}:rpc:touch`).allowed).toBe(user !== null);
      expect(result(`${label}:consent:own`).allowed).toBe(user !== null);
      if (user !== null) expect(result(`${label}:consent:other`)).toEqual({ allowed: true, rows: [] });
    }
    // Explicitly pin the unresolved policies, not stronger UI-only promises.
    expect(result("oldConsent:attempt:own").allowed).toBe(true);
    expect(result("noConsent:event:own").allowed).toBe(true);
  });
  it("rechecks approval between statements and preserves owner RPC guards/self-protection", async () => {
    await db.query("update public.profiles set status='suspended' where user_id=$1", [uid("a")]);
    try {
      expect((await probe("a", attemptInsert, [uid("a")])).allowed).toBe(false);
      expect((await probe("a", "select user_id from public.attempts")).allowed).toBe(true);
    } finally { await db.query("update public.profiles set status='approved' where user_id=$1", [uid("a")]); }
    expect(await probe("owner", "select public.set_participant_status($1,'suspended')", [uid("owner")])).toEqual({ allowed: false, code: "42501" });
    expect(await probe("owner", "select public.set_participant_status($1,'unexpected')", [uid("a")])).toEqual({ allowed: false, code: "22023" });
  });
  it("keeps legacy codes, creates full UUID codes and rejects a forced collision atomically without broadening grants", async () => {
    await db.query("update public.profiles set participant_code='P-1234abcd' where user_id=$1", [uid("a")]);
    await db.exec("insert into auth.users(email) values ('new-code@example.test')");
    const code = (await db.query<{ participant_code: string }>(`select p.participant_code from public.profiles p join auth.users u on u.id=p.user_id where u.email='new-code@example.test'`)).rows[0]!.participant_code;
    expect(code).toMatch(/^P-[0-9a-f]{32}$/);
    expect((await db.query("select participant_code from public.profiles where user_id=$1", [uid("a")])).rows).toEqual([{ participant_code: "P-1234abcd" }]);
    // Force the otherwise extremely unlikely collision; the transaction rolls back its temporary default too.
    await expect(db.transaction(async (tx) => {
      await tx.exec("alter table public.profiles alter column participant_code set default 'P-1234abcd'");
      await tx.exec("insert into auth.users(email) values ('collision@example.test')");
    })).rejects.toMatchObject({ code: "23505" });
    expect((await db.query("select 1 from auth.users where email='collision@example.test'")).rows).toEqual([]);
    await db.exec("insert into auth.users(email) values ('after-collision@example.test')");
    expect((await db.query("select 1 from public.profiles where length(participant_code)=34")).rows.length).toBe(2);
  });
  it("cascades attempt notes and all account data on privileged erasure, keeping unrelated rows", async () => {
    await db.transaction(async (tx) => {
      await tx.query("delete from public.attempts where id=$1", [aid("b")]);
      expect((await tx.query("select 1 from public.feedback where attempt_id=$1", [aid("b")])).rows).toEqual([]);
    });
    await db.query("delete from auth.users where id=$1", [uid("a")]);
    for (const table of tables) expect((await db.query(`select 1 from public.${table} where user_id=$1`, [uid("a")])).rows).toEqual([]);
    expect((await db.query("select 1 from public.attempts where id=$1", [aid("owner")])).rows).toHaveLength(1);
    const indexes = (await db.query<{ indexname: string; indexdef: string }>(`select indexname,indexdef from pg_indexes where schemaname='public' order by indexname`)).rows;
    for (const name of ["events_user_at_idx", "attempts_user_finished_idx", "feedback_user_at_idx", "attempts_finished_id_idx", "feedback_at_id_idx", "feedback_attempt_id_idx"]) expect(indexes.some((i) => i.indexname === name), name).toBe(true);
    expect(indexes.find((i) => i.indexname === "feedback_attempt_id_idx")?.indexdef).toContain("WHERE (attempt_id IS NOT NULL)");
  });
});
